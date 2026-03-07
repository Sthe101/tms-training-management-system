import { IsNotEmpty, IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

const stripHtml = (v: unknown) =>
  typeof v === 'string' ? v.trim().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, '') : v;

export class CreateEmployeeDto {
  @Transform(({ value }) => stripHtml(value))
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s\-'.]+$/, { message: 'Name may only contain letters, spaces, hyphens, and apostrophes' })
  name: string;

  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(254)
  email: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase().replace(/[^A-Z0-9\-]/g, '') : value))
  @IsString()
  @MinLength(2, { message: 'Employee number must be at least 2 characters' })
  @MaxLength(20, { message: 'Employee number must not exceed 20 characters' })
  @Matches(/^[A-Z0-9][A-Z0-9\-]*$/, { message: 'Employee number must start with a letter or digit and contain only uppercase letters, numbers, and hyphens' })
  employeeNumber?: string;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  departmentId: string;
}
