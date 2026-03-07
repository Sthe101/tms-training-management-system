import { IsString, IsArray, IsDateString, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  trainingCategoryId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v: string) => v.trim()) : value))
  employeeIds?: string[];
}
