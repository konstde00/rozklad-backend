
import { IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSemesterDto {
  @ApiPropertyOptional({
    description: 'Title of the semester',
    example: 'Spring 2025',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Start date of the semester in ISO format',
    example: '2025-01-15',
  })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of the semester in ISO format',
    example: '2025-05-15',
  })
  @IsDateString()
  @IsOptional()
  end_date?: string;
}
