import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DivisionsModule } from './divisions/divisions.module';

@Module({
  imports: [PrismaModule, AuthModule, DivisionsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
