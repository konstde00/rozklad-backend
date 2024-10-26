
import { IsString, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSemesterDto {
  @ApiProperty({
    description: 'Title of the semester',
    example: 'Fall 2024',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Start date of the semester in ISO format',
    example: '2024-09-01',
  })
  @IsDateString()
  start_date: string;

  @ApiProperty({
    description: 'End date of the semester in ISO format',
    example: '2024-12-31',
  })
  @IsDateString()
  end_date: string;
}
