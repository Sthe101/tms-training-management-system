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
import { TrainingsService } from './trainings.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@Controller('trainings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TrainingsController {
  constructor(private trainingsService: TrainingsService) {}

  @Get()
  async findAll() {
    const data = await this.trainingsService.findAll();
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateTrainingDto) {
    const data = await this.trainingsService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTrainingDto) {
    const data = await this.trainingsService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string) {
    await this.trainingsService.remove(id);
    return { success: true };
  }
}
