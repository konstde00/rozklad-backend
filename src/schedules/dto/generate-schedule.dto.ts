import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateScheduleDto {
  @IsNotEmpty()
  @IsString()
  semesterId: string;
}