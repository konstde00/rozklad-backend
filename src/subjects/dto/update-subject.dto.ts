
import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  hoursPerWeek?: number;
}
