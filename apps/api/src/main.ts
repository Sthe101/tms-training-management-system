import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Raw request logger — runs before everything (guards, strategies, cookie parsing)
  app.use((req: any, _res: any, next: any) => {
    console.log(`[REQ] ${req.method} ${req.url}`);
    console.log('[REQ] origin:', req.headers['origin']);
    console.log('[REQ] cookie header:', req.headers['cookie'] || 'none');
    next();
  });

  // Security
  app.use(helmet());
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
  console.log('[DEBUG] NODE_ENV:', process.env.NODE_ENV);
  console.log('[DEBUG] COOKIE_SECURE:', process.env.COOKIE_SECURE);
  console.log('[DEBUG] JWT_SECRET set:', !!process.env.JWT_SECRET);
  console.log('[DEBUG] FRONTEND_URL:', process.env.FRONTEND_URL);
}
bootstrap();
