import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTrainingDto } from './dto/create-training.dto';
import { UpdateTrainingDto } from './dto/update-training.dto';

@Injectable()
export class TrainingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.trainingCategory.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(dto: CreateTrainingDto) {
    const existing = await this.prisma.trainingCategory.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('Training category with this name already exists');
    }
    return this.prisma.trainingCategory.create({ data: dto });
  }

  async update(id: string, dto: UpdateTrainingDto) {
    const training = await this.prisma.trainingCategory.findUnique({
      where: { id },
    });
    if (!training) {
      throw new NotFoundException('Training category not found');
    }
    if (dto.name !== training.name) {
      const existing = await this.prisma.trainingCategory.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException('Training category with this name already exists');
      }
    }
    return this.prisma.trainingCategory.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async remove(id: string) {
    const training = await this.prisma.trainingCategory.findUnique({
      where: { id },
    });
    if (!training) {
      throw new NotFoundException('Training category not found');
    }
    await this.prisma.trainingCategory.delete({ where: { id } });
  }
}
