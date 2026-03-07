import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ClerkService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const [requiredCount, inProgressCount, completedCount, recentRequests] =
      await Promise.all([
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
      recentRequests: recentRequests.map(formatRequest),
    };
  }

  async getRequests(filters: {
    search?: string;
    divisionId?: string;
    departmentId?: string;
    status?: string;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

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

    return {
      requests: requests.map(formatRequest),
      divisions,
    };
  }
}
