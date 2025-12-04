import { IsEmail, IsString, IsEnum, IsInt, Min, Max, Length, Matches, IsOptional, IsBoolean } from 'class-validator';
import { Gender } from '../entities/user.entity';

export class CreateUserDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsEnum(Gender)
  sex: Gender;

  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/`~]).{8,}$/, {
    message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character',
  })
  password: string;

  @IsString()
  @Length(10, 20)
  contact_number: string;

  @IsOptional()
  @IsBoolean()
  can_manage_queueing?: boolean;
}
