import { IsNotEmpty, IsString } from 'class-validator';

export class AssignTrainingDto {
  @IsString()
  @IsNotEmpty({ message: 'Training category is required' })
  trainingCategoryId: string;
}
