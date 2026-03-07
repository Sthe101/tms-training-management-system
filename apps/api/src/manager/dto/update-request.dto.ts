import { IsString, IsArray, IsDateString, IsOptional, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  trainingCategoryId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED'], {
    message: 'status must be PENDING, IN_PROGRESS, or COMPLETED',
  })
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v: string) => v.trim()) : value))
  employeeIds?: string[];
}
