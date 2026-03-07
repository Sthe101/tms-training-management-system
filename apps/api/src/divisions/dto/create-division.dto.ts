import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDivisionDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
