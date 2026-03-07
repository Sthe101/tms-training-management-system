import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AssignTrainingDto } from './dto/assign-training.dto';
import { AddManagerDto } from './dto/add-manager.dto';

@Injectable()
export class DivisionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.division.findMany({
      include: { departments: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    const division = await this.prisma.division.findUnique({
      where: { id },
      include: {
        departments: { orderBy: { createdAt: 'asc' } },
        trainings: {
          include: { trainingCategory: true },
          orderBy: { assignedAt: 'asc' },
        },
        managers: {
          include: {
            employee: { include: { department: true } },
            department: true,
          },
          orderBy: { assignedAt: 'asc' },
        },
      },
    });
    if (!division) throw new NotFoundException('Division not found');

    const employees = await this.prisma.employee.findMany({
      where: { department: { divisionId: id }, role: 'EMPLOYEE' },
      include: { department: true },
      orderBy: { name: 'asc' },
    });

    return { ...division, employees };
  }

  async create(dto: CreateDivisionDto) {
    const existing = await this.prisma.division.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Division with this name already exists');
    return this.prisma.division.create({
      data: { name: dto.name },
      include: { departments: true },
    });
  }

  async remove(id: string) {
    const division = await this.prisma.division.findUnique({ where: { id } });
    if (!division) throw new NotFoundException('Division not found');
    await this.prisma.division.delete({ where: { id } });
  }

  async addDepartment(divisionId: string, dto: CreateDepartmentDto) {
    const division = await this.prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new NotFoundException('Division not found');
    return this.prisma.department.create({ data: { name: dto.name, divisionId } });
  }

  async updateDepartment(divisionId: string, departmentId: string, dto: CreateDepartmentDto) {
    const dept = await this.prisma.department.findFirst({ where: { id: departmentId, divisionId } });
    if (!dept) throw new NotFoundException('Department not found');
    return this.prisma.department.update({ where: { id: departmentId }, data: { name: dto.name } });
  }

  async removeDepartment(divisionId: string, departmentId: string) {
    const dept = await this.prisma.department.findFirst({ where: { id: departmentId, divisionId } });
    if (!dept) throw new NotFoundException('Department not found');
    await this.prisma.department.delete({ where: { id: departmentId } });
  }

  async assignTraining(divisionId: string, dto: AssignTrainingDto) {
    const division = await this.prisma.division.findUnique({ where: { id: divisionId } });
    if (!division) throw new NotFoundException('Division not found');

    const training = await this.prisma.trainingCategory.findUnique({ where: { id: dto.trainingCategoryId } });
    if (!training) throw new NotFoundException('Training category not found');

    const existing = await this.prisma.divisionTraining.findUnique({
      where: { divisionId_trainingCategoryId: { divisionId, trainingCategoryId: dto.trainingCategoryId } },
    });
    if (existing) throw new ConflictException('Training already assigned to this division');

    return this.prisma.divisionTraining.create({
      data: { divisionId, trainingCategoryId: dto.trainingCategoryId },
      include: { trainingCategory: true },
    });
  }

  async unassignTraining(divisionId: string, trainingCategoryId: string) {
    const existing = await this.prisma.divisionTraining.findUnique({
      where: { divisionId_trainingCategoryId: { divisionId, trainingCategoryId } },
    });
    if (!existing) throw new NotFoundException('Training assignment not found');
    await this.prisma.divisionTraining.delete({
      where: { divisionId_trainingCategoryId: { divisionId, trainingCategoryId } },
    });
  }

  async addManager(divisionId: string, dto: AddManagerDto) {
    // Verify employee exists and belongs to this division
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, department: { divisionId } },
    });
    if (!employee) throw new NotFoundException('Employee not found in this division');
    if (employee.role === 'MANAGER') throw new ConflictException('Employee is already a manager');

    // Verify department belongs to this division
    const dept = await this.prisma.department.findFirst({
      where: { id: dto.departmentId, divisionId },
    });
    if (!dept) throw new NotFoundException('Department not found in this division');

    // Check department doesn't already have a manager
    const deptManager = await this.prisma.divisionManager.findUnique({
      where: { departmentId: dto.departmentId },
    });
    if (deptManager) throw new ConflictException('This department already has a manager');

    // Promote employee and create manager assignment in a transaction
    const [, managerRecord] = await this.prisma.$transaction([
      this.prisma.employee.update({
        where: { id: dto.employeeId },
        data: { role: 'MANAGER' },
      }),
      this.prisma.divisionManager.create({
        data: { divisionId, departmentId: dto.departmentId, employeeId: dto.employeeId },
        include: { employee: { include: { department: true } }, department: true },
      }),
    ]);

    return managerRecord;
  }

  async removeManager(divisionId: string, employeeId: string) {
    const assignment = await this.prisma.divisionManager.findFirst({
      where: { divisionId, employeeId },
    });
    if (!assignment) throw new NotFoundException('Manager assignment not found');

    // Demote employee and remove assignment in a transaction
    await this.prisma.$transaction([
      this.prisma.employee.update({ where: { id: employeeId }, data: { role: 'EMPLOYEE' } }),
      this.prisma.divisionManager.delete({ where: { id: assignment.id } }),
    ]);
  }
}
