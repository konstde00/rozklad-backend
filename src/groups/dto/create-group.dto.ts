import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsInt,
  IsArray,
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
  students_count?: number;

  @IsInt()
  speciality: number;

  @IsInt()
  course_number: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeachingAssignmentDto)
  teachingAssignments?: TeachingAssignmentDto[];
}
