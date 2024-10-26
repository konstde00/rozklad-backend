
import { IsString, IsInt, MaxLength, Min } from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(1)
  capacity: number;
}