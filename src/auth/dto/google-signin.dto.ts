import {
  IsEmail,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class GoogleSignInDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsEmail()
  email: string;

  @IsString()
  uid: string;
}
