import { IsString, IsEmail, IsNotEmpty, IsEnum } from 'class-validator';

export enum UserRole {
  TEACHER = 'teacher',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password_hash: string;

  @IsEnum(UserRole)
  role: UserRole;
}
