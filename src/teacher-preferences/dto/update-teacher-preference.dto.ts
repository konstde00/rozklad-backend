import { PartialType } from '@nestjs/mapped-types';
import { CreateTeacherPreferenceDto } from './create-teacher-preference.dto';

export class UpdateTeacherPreferenceDto extends PartialType(CreateTeacherPreferenceDto) {}
