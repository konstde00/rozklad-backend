
import { IsNotEmpty, IsString, IsOptional, ValidateNested, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { GeneticAlgorithmConfigDto } from './genetic-algorithm-config.dto';

export class GenerateScheduleDto {
  @IsNotEmpty()
  @IsString()
  semesterId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => GeneticAlgorithmConfigDto)
  config?: GeneticAlgorithmConfigDto;
}
