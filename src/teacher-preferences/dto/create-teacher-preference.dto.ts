import { IsInt, IsNotEmpty, IsEnum, Min, Max } from 'class-validator';
import { DayOfWeek, PreferenceType } from '@prisma/client';

export class CreateTeacherPreferenceDto {
  @IsInt()
  @IsNotEmpty()
  teacher_id: number;

  @IsEnum(DayOfWeek)
  day_of_week: DayOfWeek;

  /**
   * time_slot_index is the index into your TIME_SLOTS array
   * For example, 0..7 for the 8 slots you described
   */
  @IsInt()
  @Min(0)
  @Max(7)
  time_slot_index: number;

  @IsEnum(PreferenceType)
  preference: PreferenceType;
}
