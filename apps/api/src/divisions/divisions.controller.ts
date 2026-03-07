import {
  Controller,
  Get,
  Post,
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
  async addDepartment(
    @Param('id') id: string,
    @Body() dto: CreateDepartmentDto,
  ) {
    const data = await this.divisionsService.addDepartment(id, dto);
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
}
