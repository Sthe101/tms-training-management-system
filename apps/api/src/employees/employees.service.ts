import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    divisionId?: string;
    departmentId?: string;
    status?: string;
  }) {
    const { search, divisionId, departmentId, status } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'ACTIVE' || status === 'INACTIVE') {
      where.status = status;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    } else if (divisionId) {
      where.department = { divisionId };
    }

    const [employees, total, active, inactive] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        include: {
          department: { include: { division: true } },
        },
        orderBy: { employeeNumber: 'asc' },
      }),
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'INACTIVE' } }),
    ]);

    return { employees, stats: { total, active, inactive } };
  }

  async create(dto: CreateEmployeeDto) {
    const existing = await this.prisma.employee.findUnique({
      where: { employeeNumber: dto.employeeNumber },
    });
    if (existing) {
      throw new ConflictException('Employee number already exists');
    }

    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!dept) {
      throw new NotFoundException('Department not found');
    }

    return this.prisma.employee.create({
      data: dto,
      include: { department: { include: { division: true } } },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (dto.employeeNumber && dto.employeeNumber !== employee.employeeNumber) {
      const existing = await this.prisma.employee.findUnique({
        where: { employeeNumber: dto.employeeNumber },
      });
      if (existing) {
        throw new ConflictException('Employee number already in use');
      }
    }

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) throw new NotFoundException('Department not found');
    }

    return this.prisma.employee.update({
      where: { id },
      data: dto,
      include: { department: { include: { division: true } } },
    });
  }

  async remove(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    await this.prisma.employee.delete({ where: { id } });
  }
}
