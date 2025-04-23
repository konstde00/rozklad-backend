import { IsInt, IsNotEmpty, IsEnum, Min, Max } from 'class-validator';
import { DayOfWeek, PreferenceType } from '@prisma/client';

export class CreateTeacherPreferenceDto {
  @IsInt()
  @IsNotEmpty()
  teacher_id: number;

  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek;

  @IsInt()
  @Min(0)
  @Max(3)
  time_slot_index: number;

  @IsEnum(PreferenceType)
  preference: PreferenceType;
}
