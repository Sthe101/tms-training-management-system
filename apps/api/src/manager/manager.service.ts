import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class ManagerService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const profile = await this.prisma.managerProfile.findUnique({
      where: { userId },
      include: { department: { include: { division: true } } },
    });

    const requests = await this.prisma.trainingRequest.findMany({
      where: { managerId: userId },
      include: {
        trainingCategory: true,
        employees: { include: { employee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalEmployees = profile
      ? await this.prisma.employee.count({ where: { departmentId: profile.departmentId } })
      : 0;

    const activeRequests = requests.filter(
      (r) => r.status === 'PENDING' || r.status === 'IN_PROGRESS',
    ).length;
    const completedRequests = requests.filter((r) => r.status === 'COMPLETED').length;
    const completionRate =
      requests.length > 0 ? Math.round((completedRequests / requests.length) * 100) : 0;

    let team: any[] = [];
    if (profile) {
      team = await this.prisma.employee.findMany({
        where: { departmentId: profile.departmentId },
        include: {
          requestEmployees: {
            include: {
              request: {
                include: { trainingCategory: true },
              },
            },
            where: {
              request: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
            },
            orderBy: { request: { createdAt: 'desc' } },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    const completedCountByEmployee = profile
      ? await this.prisma.requestEmployee.groupBy({
          by: ['employeeId'],
          where: {
            request: { managerId: userId, status: 'COMPLETED' },
            employee: { departmentId: profile.departmentId },
          },
          _count: { requestId: true },
        })
      : [];

    const completedMap: Record<string, number> = {};
    for (const row of completedCountByEmployee) {
      completedMap[row.employeeId] = row._count.requestId;
    }

    const teamWithStats = team.map((emp) => ({
      id: emp.id,
      name: emp.name,
      employeeNumber: emp.employeeNumber,
      status: emp.status,
      completedCount: completedMap[emp.id] ?? 0,
      currentTraining: emp.requestEmployees[0]?.request ?? null,
    }));

    return {
      profile,
      stats: { totalEmployees, activeRequests, completedRequests, completionRate },
      requests,
      team: teamWithStats,
    };
  }

  async getRequests(userId: string) {
    return this.prisma.trainingRequest.findMany({
      where: { managerId: userId },
      include: {
        trainingCategory: true,
        employees: { include: { employee: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(userId: string, dto: CreateRequestDto) {
    const category = await this.prisma.trainingCategory.findUnique({
      where: { id: dto.trainingCategoryId },
    });
    if (!category) throw new NotFoundException('Training category not found');

    return this.prisma.trainingRequest.create({
      data: {
        trainingCategoryId: dto.trainingCategoryId,
        managerId: userId,
        dueDate: new Date(dto.dueDate),
        employees: {
          create: dto.employeeIds.map((employeeId) => ({ employeeId })),
        },
      },
      include: {
        trainingCategory: true,
        employees: { include: { employee: true } },
      },
    });
  }

  async updateRequest(userId: string, id: string, dto: UpdateRequestDto) {
    const request = await this.prisma.trainingRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Training request not found');
    if (request.managerId !== userId) throw new ForbiddenException();

    const { employeeIds, dueDate, ...rest } = dto;
    const data: any = { ...rest };
    if (dueDate) data.dueDate = new Date(dueDate);

    if (employeeIds !== undefined) {
      await this.prisma.requestEmployee.deleteMany({ where: { requestId: id } });
      data.employees = { create: employeeIds.map((employeeId) => ({ employeeId })) };
    }

    return this.prisma.trainingRequest.update({
      where: { id },
      data,
      include: {
        trainingCategory: true,
        employees: { include: { employee: true } },
      },
    });
  }

  async deleteRequest(userId: string, id: string) {
    const request = await this.prisma.trainingRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundException('Training request not found');
    if (request.managerId !== userId) throw new ForbiddenException();
    await this.prisma.trainingRequest.delete({ where: { id } });
  }

  async getTeam(userId: string) {
    const profile = await this.prisma.managerProfile.findUnique({ where: { userId } });
    if (!profile) return [];

    return this.prisma.employee.findMany({
      where: { departmentId: profile.departmentId },
      include: {
        requestEmployees: {
          include: { request: { include: { trainingCategory: true } } },
          where: { request: { status: { in: ['PENDING', 'IN_PROGRESS'] } } },
          orderBy: { request: { createdAt: 'desc' } },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async addEmployee(userId: string, dto: AddEmployeeDto) {
    const profile = await this.prisma.managerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No manager profile configured');

    const emailConflict = await this.prisma.employee.findFirst({ where: { email: dto.email } });
    if (emailConflict) throw new ConflictException('An employee with this email already exists');

    if (dto.employeeNumber) {
      const numConflict = await this.prisma.employee.findUnique({ where: { employeeNumber: dto.employeeNumber } });
      if (numConflict) throw new ConflictException('Employee number already exists');
    }

    const employeeNumber = dto.employeeNumber || await this.generateEmployeeNumber();

    return this.prisma.employee.create({
      data: { ...dto, employeeNumber, departmentId: profile.departmentId },
      include: { department: { include: { division: true } } },
    });
  }

  private async generateEmployeeNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-`;
    const count = await this.prisma.employee.count({
      where: { employeeNumber: { startsWith: prefix } },
    });
    let candidate = `${prefix}${String(count + 1).padStart(3, '0')}`;
    const exists = await this.prisma.employee.findUnique({ where: { employeeNumber: candidate } });
    if (exists) candidate = `${prefix}${String(count + 2).padStart(3, '0')}`;
    return candidate;
  }

  async removeEmployee(userId: string, employeeId: string) {
    const profile = await this.prisma.managerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No manager profile configured');

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.departmentId !== profile.departmentId) throw new ForbiddenException();

    await this.prisma.employee.delete({ where: { id: employeeId } });
  }

  async updateEmployee(userId: string, employeeId: string, dto: UpdateEmployeeDto) {
    const profile = await this.prisma.managerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No manager profile configured');

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.departmentId !== profile.departmentId) throw new ForbiddenException();

    if (dto.employeeNumber && dto.employeeNumber !== employee.employeeNumber) {
      const conflict = await this.prisma.employee.findUnique({
        where: { employeeNumber: dto.employeeNumber },
      });
      if (conflict) throw new ConflictException('Employee number already exists');
    }

    return this.prisma.employee.update({
      where: { id: employeeId },
      data: dto,
    });
  }

  async getCompletedTrainings(userId: string, employeeId: string) {
    const profile = await this.prisma.managerProfile.findUnique({ where: { userId } });
    if (!profile) throw new ForbiddenException('No manager profile configured');

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');
    if (employee.departmentId !== profile.departmentId) throw new ForbiddenException();

    const rows = await this.prisma.requestEmployee.findMany({
      where: {
        employeeId,
        request: { managerId: userId, status: 'COMPLETED' },
      },
      include: {
        request: { include: { trainingCategory: true } },
      },
      orderBy: { request: { dueDate: 'desc' } },
    });

    return rows.map((row) => ({
      id: row.request.id,
      trainingName: row.request.trainingCategory.name,
      completedDate: row.request.dueDate,
    }));
  }

  async getTrainingCategories() {
    return this.prisma.trainingCategory.findMany({ orderBy: { name: 'asc' } });
  }
}
