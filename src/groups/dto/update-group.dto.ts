
import {
  IsOptional,
  IsString,
  IsInt,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TeachingAssignmentDto } from './teaching-assignment.dto';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  study_year?: number;

  @IsOptional()
  @IsInt()
  course_number?: number;

  @IsOptional()
  @IsInt()
  students_count?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeachingAssignmentDto)
  teachingAssignments?: TeachingAssignmentDto[];
}
