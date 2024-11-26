import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TeachingAssignmentDto } from './teaching-assignment.dto';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  study_year?: number;

  @IsOptional()
  @IsInt()
  students_count?: number;

  @IsInt()
  course_number: number;

  @IsInt()
  speciality: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeachingAssignmentDto)
  teachingAssignments?: TeachingAssignmentDto[];
}
