import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

const stripHtml = (v: unknown) =>
  typeof v === 'string' ? v.trim().replace(/<[^>]*>/g, '').replace(/[<>{}]/g, '') : v;

export class RegisterDto {
  @Transform(({ value }) => stripHtml(value))
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\s\-'.]+$/, { message: 'Name may only contain letters, spaces, hyphens, and apostrophes' })
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(72, { message: 'Password is too long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Division is required' })
  divisionId: string;

  @IsString()
  @IsNotEmpty({ message: 'Department is required' })
  departmentId: string;
}
