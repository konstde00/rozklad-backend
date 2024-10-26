
import { IsNotEmpty, IsString, IsOptional, IsInt } from 'class-validator';

export class SubjectDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  hoursPerWeek?: number;
}
