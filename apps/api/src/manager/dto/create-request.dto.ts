import { IsString, IsArray, IsDateString, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateRequestDto {
  @IsString()
  @IsNotEmpty()
  trainingCategoryId: string;

  @IsDateString()
  dueDate: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value.map((v: string) => v.trim()) : value))
  employeeIds: string[];
}
