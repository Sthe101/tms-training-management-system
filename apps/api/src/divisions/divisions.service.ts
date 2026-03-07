import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';

@Injectable()
export class DivisionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.division.findMany({
      include: { departments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateDivisionDto) {
    const existing = await this.prisma.division.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Division with this name already exists');
    }
    return this.prisma.division.create({
      data: { name: dto.name },
      include: { departments: true },
    });
  }

  async remove(id: string) {
    const division = await this.prisma.division.findUnique({ where: { id } });
    if (!division) {
      throw new NotFoundException('Division not found');
    }
    await this.prisma.division.delete({ where: { id } });
  }

  async addDepartment(divisionId: string, dto: CreateDepartmentDto) {
    const division = await this.prisma.division.findUnique({
      where: { id: divisionId },
    });
    if (!division) {
      throw new NotFoundException('Division not found');
    }
    return this.prisma.department.create({
      data: { name: dto.name, divisionId },
    });
  }

  async removeDepartment(divisionId: string, departmentId: string) {
    const dept = await this.prisma.department.findFirst({
      where: { id: departmentId, divisionId },
    });
    if (!dept) {
      throw new NotFoundException('Department not found');
    }
    await this.prisma.department.delete({ where: { id: departmentId } });
  }
}
