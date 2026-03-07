import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function requestInclude() {
  return {
    trainingCategory: true,
    employees: { select: { status: true } },
    manager: {
      select: {
        id: true,
        name: true,
        managerProfile: {
          include: {
            department: { include: { division: true } },
          },
        },
      },
    },
  } as const;
}

function deriveStatus(employeeStatuses: { status: string }[]): string {
  if (employeeStatuses.length === 0) return 'PENDING';
  if (employeeStatuses.some((e) => e.status === 'PENDING')) return 'PENDING';
  if (employeeStatuses.every((e) => e.status === 'COMPLETED')) return 'COMPLETED';
  return 'IN_PROGRESS';
}

function formatRequest(req: any) {
  const profile = req.manager?.managerProfile;
  const employees: { status: string }[] = req.employees ?? [];
  return {
    id: req.id,
    trainingCategory: req.trainingCategory,
    managerName: req.manager?.name ?? 'Unknown',
    department: profile?.department ?? null,
    division: profile?.department?.division ?? null,
    employeeCount: employees.length,
    dueDate: req.dueDate,
    status: deriveStatus(employees),
    createdAt: req.createdAt,
  };
}

@Injectable()
export class ClerkService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    // TrainingRequest.status is kept in sync by updateEmployeeStatus, so counts are fast
    const [requiredCount, inProgressCount, completedCount, recentRaw] = await Promise.all([
      this.prisma.trainingRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.trainingRequest.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.trainingRequest.count({ where: { status: 'COMPLETED' } }),
      this.prisma.trainingRequest.findMany({
        where: { status: 'PENDING' },
        include: requestInclude(),
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      stats: { requiredCount, inProgressCount, completedCount },
      recentRequests: recentRaw.map(formatRequest),
    };
  }

  async getRequests(filters: {
    search?: string;
    divisionId?: string;
    departmentId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.search) {
      where.OR = [
        { trainingCategory: { name: { contains: filters.search, mode: 'insensitive' } } },
        { manager: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.departmentId) {
      where.manager = {
        managerProfile: { departmentId: filters.departmentId },
      };
    } else if (filters.divisionId) {
      where.manager = {
        managerProfile: {
          department: { divisionId: filters.divisionId },
        },
      };
    }

    const [rawRequests, divisions] = await Promise.all([
      this.prisma.trainingRequest.findMany({
        where,
        include: requestInclude(),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.division.findMany({
        include: { departments: { select: { id: true, name: true } } },
        orderBy: { name: 'asc' },
      }),
    ]);

    let requests = rawRequests.map(formatRequest);

    if (filters.status) {
      requests = requests.filter((r) => r.status === filters.status);
    }

    return { requests, divisions };
  }

  async getRequestById(id: string) {
    const req = await this.prisma.trainingRequest.findUnique({
      where: { id },
      include: {
        trainingCategory: true,
        manager: {
          select: {
            id: true,
            name: true,
            managerProfile: {
              include: { department: { include: { division: true } } },
            },
          },
        },
        employees: {
          include: { employee: true },
          orderBy: { employee: { name: 'asc' } },
        },
      },
    });

    if (!req) throw new NotFoundException('Training request not found');

    const profile = req.manager?.managerProfile;
    return {
      id: req.id,
      trainingCategory: req.trainingCategory,
      managerName: req.manager?.name ?? 'Unknown',
      department: profile?.department ?? null,
      division: profile?.department?.division ?? null,
      dueDate: req.dueDate,
      status: req.status,
      createdAt: req.createdAt,
      employees: req.employees.map((re) => ({
        employeeId: re.employeeId,
        name: re.employee.name,
        employeeNumber: re.employee.employeeNumber,
        status: re.status,
        dueDate: re.dueDate,
      })),
    };
  }

  async updateEmployeeStatus(
    requestId: string,
    employeeId: string,
    dto: { status?: string; dueDate?: string | null },
  ) {
    const re = await this.prisma.requestEmployee.findUnique({
      where: { requestId_employeeId: { requestId, employeeId } },
    });
    if (!re) throw new NotFoundException('Employee not found on this request');

    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.dueDate !== undefined) {
      data.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }

    await this.prisma.requestEmployee.update({
      where: { requestId_employeeId: { requestId, employeeId } },
      data,
    });

    // Sync TrainingRequest.status from all employee statuses so manager sees updated state
    const allEmployees = await this.prisma.requestEmployee.findMany({
      where: { requestId },
      select: { status: true },
    });
    const derivedStatus = deriveStatus(allEmployees) as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    await this.prisma.trainingRequest.update({
      where: { id: requestId },
      data: { status: derivedStatus },
    });

    return this.getRequestById(requestId);
  }
}
