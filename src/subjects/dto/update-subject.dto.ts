
import { IsOptional, IsString, IsInt, IsNotEmpty } from 'class-validator';

export class UpdateSubjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsInt()
  lectureHoursPerSemester: number;

  @IsNotEmpty()
  @IsInt()
  practiceHoursPerSemester: number;
}
