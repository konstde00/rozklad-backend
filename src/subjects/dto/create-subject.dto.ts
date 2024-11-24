import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  lectureHoursPerSemester?: number;

  @IsOptional()
  @IsNotEmpty()
  @IsInt()
  practiceHoursPerSemester?: number;
}
