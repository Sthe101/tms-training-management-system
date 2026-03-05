import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CLERK = 'CLERK',
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(Role)
  @IsNotEmpty()
  role: Role;
}
