import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTrainingDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
