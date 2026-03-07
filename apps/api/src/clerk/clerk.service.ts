import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function requestInclude() {
  return {
    trainingCategory: true,
    _count: { select: { employees: true } },
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

function formatRequest(req: any) {
  const profile = req.manager?.managerProfile;
  return {
    id: req.id,
    trainingCategory: req.trainingCategory,
    managerName: req.manager?.name ?? 'Unknown',
    department: profile?.department ?? null,
    division: profile?.department?.division ?? null,
    employeeCount: req._count?.employees ?? 0,
    dueDate: req.dueDate,
    status: req.status,
    createdAt: req.createdAt,
  };
}

// Derives overall request status from per-employee statuses:
// - Any PENDING employee → PENDING (Required)
// - All COMPLETED → COMPLETED
// - Otherwise → IN_PROGRESS
function deriveStatus(statuses: string[]): 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' {
  if (statuses.length === 0 || statuses.some((s) => s === 'PENDING')) return 'PENDING';
  if (statuses.every((s) => s === 'COMPLETED')) return 'COMPLETED';
  return 'IN_PROGRESS';
}

@Injectable()
export class ClerkService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
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

    if (filters.status) where.status = filters.status;

    if (filters.search) {
      where.OR = [
        { trainingCategory: { name: { contains: filters.search, mode: 'insensitive' } } },
        { manager: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    if (filters.departmentId) {
      where.manager = { managerProfile: { departmentId: filters.departmentId } };
    } else if (filters.divisionId) {
      where.manager = { managerProfile: { department: { divisionId: filters.divisionId } } };
    }

    const [requests, divisions] = await Promise.all([
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

    return { requests: requests.map(formatRequest), divisions };
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
      })),
    };
  }

  async updateEmployeeStatus(
    requestId: string,
    employeeId: string,
    status: string,
  ) {
    const re = await this.prisma.requestEmployee.findUnique({
      where: { requestId_employeeId: { requestId, employeeId } },
    });
    if (!re) throw new NotFoundException('Employee not found on this request');

    await this.prisma.requestEmployee.update({
      where: { requestId_employeeId: { requestId, employeeId } },
      data: { status: status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' },
    });

    // Re-derive and sync TrainingRequest.status from ALL employees
    const allEmployees = await this.prisma.requestEmployee.findMany({
      where: { requestId },
      select: { status: true },
    });
    const derived = deriveStatus(allEmployees.map((e) => e.status));
    await this.prisma.trainingRequest.update({
      where: { id: requestId },
      data: { status: derived },
    });

    return this.getRequestById(requestId);
  }
}
