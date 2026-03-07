import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ManagerService } from './manager.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { AddEmployeeDto } from './dto/add-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('MANAGER')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Get('dashboard')
  async getDashboard(@CurrentUser() user: { id: string }) {
    const data = await this.managerService.getDashboard(user.id);
    return { success: true, ...data };
  }

  @Get('requests')
  async getRequests(@CurrentUser() user: { id: string }) {
    const requests = await this.managerService.getRequests(user.id);
    return { success: true, requests };
  }

  @Post('requests')
  async createRequest(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateRequestDto,
  ) {
    const request = await this.managerService.createRequest(user.id, dto);
    return { success: true, request };
  }

  @Patch('requests/:id')
  async updateRequest(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRequestDto,
  ) {
    const request = await this.managerService.updateRequest(user.id, id, dto);
    return { success: true, request };
  }

  @Delete('requests/:id')
  async deleteRequest(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.managerService.deleteRequest(user.id, id);
    return { success: true };
  }

  @Get('team')
  async getTeam(@CurrentUser() user: { id: string }) {
    const team = await this.managerService.getTeam(user.id);
    return { success: true, team };
  }

  @Post('employees')
  async addEmployee(
    @CurrentUser() user: { id: string },
    @Body() dto: AddEmployeeDto,
  ) {
    const employee = await this.managerService.addEmployee(user.id, dto);
    return { success: true, employee };
  }

  @Patch('employees/:id')
  async updateEmployee(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    const employee = await this.managerService.updateEmployee(user.id, id, dto);
    return { success: true, employee };
  }

  @Delete('employees/:id')
  async removeEmployee(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    await this.managerService.removeEmployee(user.id, id);
    return { success: true };
  }

  @Get('employees/:id/completed-trainings')
  async getCompletedTrainings(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
  ) {
    const trainings = await this.managerService.getCompletedTrainings(user.id, id);
    return { success: true, trainings };
  }

  @Get('training-categories')
  async getTrainingCategories() {
    const categories = await this.managerService.getTrainingCategories();
    return { success: true, categories };
  }
}
