import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;
}
