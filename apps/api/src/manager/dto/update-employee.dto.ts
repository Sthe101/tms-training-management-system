import { IsString, IsOptional, MinLength, MaxLength, Matches, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateEmployeeDto {
  @IsOptional()
  @Transform(({ value }) => value?.trim().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, ''))
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-zA-Z\s\-'.]+$/, { message: 'Name may only contain letters, spaces, hyphens, apostrophes, and periods' })
  name?: string;

  @IsOptional()
  @Transform(({ value }) => value?.trim().toUpperCase().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, ''))
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9][A-Z0-9\-]*$/, { message: 'Employee number must start with a letter or digit and may contain letters, digits, and hyphens' })
  employeeNumber?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: 'ACTIVE' | 'INACTIVE';
}
