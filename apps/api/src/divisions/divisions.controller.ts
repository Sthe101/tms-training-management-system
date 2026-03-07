import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DivisionsService } from './divisions.service';
import { CreateDivisionDto } from './dto/create-division.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { AssignTrainingDto } from './dto/assign-training.dto';
import { AddManagerDto } from './dto/add-manager.dto';

@Controller('divisions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DivisionsController {
  constructor(private divisionsService: DivisionsService) {}

  @Get()
  async findAll() {
    const data = await this.divisionsService.findAll();
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const data = await this.divisionsService.findById(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateDivisionDto) {
    const data = await this.divisionsService.create(dto);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.divisionsService.remove(id);
    return { success: true };
  }

  @Post(':id/departments')
  async addDepartment(@Param('id') id: string, @Body() dto: CreateDepartmentDto) {
    const data = await this.divisionsService.addDepartment(id, dto);
    return { success: true, data };
  }

  @Patch(':id/departments/:deptId')
  async updateDepartment(
    @Param('id') id: string,
    @Param('deptId') deptId: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    const data = await this.divisionsService.updateDepartment(id, deptId, dto);
    return { success: true, data };
  }

  @Delete(':divisionId/departments/:deptId')
  @HttpCode(HttpStatus.OK)
  async removeDepartment(
    @Param('divisionId') divisionId: string,
    @Param('deptId') deptId: string,
  ) {
    await this.divisionsService.removeDepartment(divisionId, deptId);
    return { success: true };
  }

  @Post(':id/trainings')
  async assignTraining(@Param('id') id: string, @Body() dto: AssignTrainingDto) {
    const data = await this.divisionsService.assignTraining(id, dto);
    return { success: true, data };
  }

  @Delete(':id/trainings/:trainingCategoryId')
  @HttpCode(HttpStatus.OK)
  async unassignTraining(
    @Param('id') id: string,
    @Param('trainingCategoryId') trainingCategoryId: string,
  ) {
    await this.divisionsService.unassignTraining(id, trainingCategoryId);
    return { success: true };
  }

  @Post(':id/managers')
  async addManager(@Param('id') id: string, @Body() dto: AddManagerDto) {
    const data = await this.divisionsService.addManager(id, dto);
    return { success: true, data };
  }

  @Delete(':id/managers/:employeeId')
  @HttpCode(HttpStatus.OK)
  async removeManager(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
  ) {
    await this.divisionsService.removeManager(id, employeeId);
    return { success: true };
  }
}
