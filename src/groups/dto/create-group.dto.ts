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
import { SubjectDto } from './subject.dto';

export class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsInt()
  study_year: number;

  @IsOptional()
  @IsInt()
  students_count: number;

  @IsNotEmpty()
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SubjectDto)
  subjects: SubjectDto[];
}
