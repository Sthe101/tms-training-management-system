import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DivisionsModule } from './divisions/divisions.module';
import { TrainingsModule } from './trainings/trainings.module';

@Module({
  imports: [PrismaModule, AuthModule, DivisionsModule, TrainingsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
