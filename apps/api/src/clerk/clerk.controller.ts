import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('clerk')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CLERK')
export class ClerkController {
  constructor(private readonly clerkService: ClerkService) {}

  @Get('dashboard')
  async getDashboard() {
    const data = await this.clerkService.getDashboard();
    return { success: true, ...data };
  }

  @Get('requests')
  async getRequests(
    @Query('search') search?: string,
    @Query('divisionId') divisionId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.clerkService.getRequests({
      search,
      divisionId,
      departmentId,
      status,
    });
    return { success: true, ...data };
  }
}
