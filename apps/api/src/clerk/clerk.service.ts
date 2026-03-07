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
    const all = await this.prisma.trainingRequest.findMany({
      include: requestInclude(),
      orderBy: { createdAt: 'desc' },
    });

    const formatted = all.map(formatRequest);
    const requiredCount = formatted.filter((r) => r.status === 'PENDING').length;
    const inProgressCount = formatted.filter((r) => r.status === 'IN_PROGRESS').length;
    const completedCount = formatted.filter((r) => r.status === 'COMPLETED').length;
    const recentRequests = formatted.filter((r) => r.status === 'PENDING').slice(0, 5);

    return {
      stats: { requiredCount, inProgressCount, completedCount },
      recentRequests,
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

    return this.getRequestById(requestId);
  }
}
