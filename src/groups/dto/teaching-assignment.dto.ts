
import { IsInt, IsOptional, IsNotEmpty } from 'class-validator';

export class TeachingAssignmentDto {
  @IsInt()
  @IsNotEmpty()
  teacher_id: number;

  @IsInt()
  @IsNotEmpty()
  subject_id: number;

  @IsOptional()
  @IsInt()
  lecture_hours_per_semester?: number;

  @IsOptional()
  @IsInt()
  practice_hours_per_semester?: number;

  @IsOptional()
  @IsInt()
  lab_hours_per_semester?: number;

  @IsOptional()
  @IsInt()
  seminar_hours_per_semester?: number;
}
