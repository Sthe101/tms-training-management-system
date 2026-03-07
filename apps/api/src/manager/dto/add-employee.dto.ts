import { IsString, IsEmail, IsOptional, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class AddEmployeeDto {
  @Transform(({ value }) => value?.trim().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, ''))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s\-'.]+$/, { message: 'Name may only contain letters, spaces, hyphens, apostrophes, and periods' })
  name: string;

  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsEmail({}, { message: 'Invalid email address' })
  @MaxLength(254)
  email: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim().toUpperCase().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, ''))
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9][A-Z0-9\-]*$/, { message: 'Employee number must start with a letter or digit and may contain letters, digits, and hyphens' })
  employeeNumber?: string;
}
