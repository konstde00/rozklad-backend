
import { IsOptional, IsInt, IsNumber, Min, Max } from 'class-validator';

export class GeneticAlgorithmConfigDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  populationSize?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  crossoverRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  mutationRate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  generations?: number;
}
