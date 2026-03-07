import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DivisionsModule } from './divisions/divisions.module';
import { TrainingsModule } from './trainings/trainings.module';
import { EmployeesModule } from './employees/employees.module';
import { ManagerModule } from './manager/manager.module';

@Module({
  imports: [PrismaModule, AuthModule, DivisionsModule, TrainingsModule, EmployeesModule, ManagerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
