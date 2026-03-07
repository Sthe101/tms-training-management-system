import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

// Fields returned for the current user — password is never included
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Fetch with password only for bcrypt comparison — never returned to client
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return {
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    };
  }

  async register(registerDto: RegisterDto) {
    const { name, email, password, divisionId, departmentId } = registerDto;

    // Check email uniqueness
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email already registered');

    // Validate department belongs to the provided division
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, divisionId },
    });
    if (!department) throw new BadRequestException('Department not found in the selected division');

    const hashedPassword = await bcrypt.hash(password, 10);

    // If an employee record was pre-created by admin with this email, link to it
    // instead of creating a duplicate. Keep the admin's department assignment.
    const existingEmployee = await this.prisma.employee.findFirst({ where: { email } });

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name, email, password: hashedPassword, role: 'EMPLOYEE' },
        select: USER_SELECT,
      });

      if (existingEmployee) {
        // Link: update name from signup, keep admin-assigned department
        await tx.employee.update({
          where: { id: existingEmployee.id },
          data: { name },
        });
      } else {
        // New employee — auto-generate employee number and use selected department
        const employeeNumber = await this.generateEmployeeNumber();
        await tx.employee.create({
          data: { name, email, employeeNumber, departmentId },
        });
      }

      return created;
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email, role: user.role });

    return { user, token };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });
    if (!user) throw new UnauthorizedException('User not found');

    const employee = await this.prisma.employee.findFirst({
      where: { email: user.email },
      include: { department: { include: { division: true } } },
    });

    return { user, employee };
  }

  async updateProfile(
    userId: string,
    dto: { name?: string; departmentId?: string; currentPassword?: string; newPassword?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    const userUpdates: any = {};

    if (dto.name) {
      userUpdates.name = dto.name;
    }

    if (dto.currentPassword && dto.newPassword) {
      const valid = await bcrypt.compare(dto.currentPassword, user.password);
      if (!valid) throw new BadRequestException('Current password is incorrect');
      userUpdates.password = await bcrypt.hash(dto.newPassword, 10);
    }

    // Apply employee updates (name + department)
    const empUpdates: any = {};
    if (dto.name) empUpdates.name = dto.name;
    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({ where: { id: dto.departmentId } });
      if (!dept) throw new BadRequestException('Department not found');
      empUpdates.departmentId = dto.departmentId;
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: userUpdates, select: USER_SELECT }),
      ...(Object.keys(empUpdates).length > 0
        ? [this.prisma.employee.updateMany({ where: { email: user.email }, data: empUpdates })]
        : []),
    ]);

    return updated;
  }

  async getPublicDivisions() {
    return this.prisma.division.findMany({
      select: {
        id: true,
        name: true,
        departments: {
          select: { id: true, name: true },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  private async generateEmployeeNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `EMP-${year}-`;
    const count = await this.prisma.employee.count({
      where: { employeeNumber: { startsWith: prefix } },
    });
    let candidate = `${prefix}${String(count + 1).padStart(3, '0')}`;
    // Guard against race condition — increment until unique
    const exists = await this.prisma.employee.findUnique({ where: { employeeNumber: candidate } });
    if (exists) {
      candidate = `${prefix}${String(count + 2).padStart(3, '0')}`;
    }
    return candidate;
  }
}
