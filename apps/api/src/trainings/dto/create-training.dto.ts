import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

const stripHtml = (v: unknown) =>
  typeof v === 'string' ? v.trim().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, '') : v;

export class CreateTrainingDto {
  @Transform(({ value }) => stripHtml(value))
  @IsString()
  @IsNotEmpty({ message: 'Training name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z0-9\s\-&'.()]+$/, { message: 'Name contains invalid characters' })
  name: string;
}
