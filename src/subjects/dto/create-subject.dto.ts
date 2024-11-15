import { IsNotEmpty, IsString, IsInt } from 'class-validator';

export class CreateSubjectDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsInt()
  lectureHoursPerSemester: number;

  @IsNotEmpty()
  @IsInt()
  practiceHoursPerSemester: number;
}
