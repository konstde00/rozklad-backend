import {
  IsString,
  IsInt,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreateTeacherDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsInt()
  @Min(0)
  max_hours_per_week: number;
}
