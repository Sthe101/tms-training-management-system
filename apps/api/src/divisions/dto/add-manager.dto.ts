import { IsNotEmpty, IsString } from 'class-validator';

export class AddManagerDto {
  @IsString()
  @IsNotEmpty({ message: 'Employee is required' })
  employeeId: string;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  departmentId: string;
}
