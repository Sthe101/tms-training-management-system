import { IsEmail, IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CLERK = 'CLERK',
}

export class LoginDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254)
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MaxLength(72, { message: 'Password is too long' })
  password: string;

  @IsEnum(Role, { message: 'Invalid role selected' })
  role: Role;
}
