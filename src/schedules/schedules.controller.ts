import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { ScheduleDto } from './dto/schedule.dto';

@Controller('v1/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get('semester/:semesterId')
  async getSchedulesBySemester(
    @Param('semesterId') semesterId: string,
  ): Promise<ScheduleDto[]> {
    return this.schedulesService.findBySemesterId(semesterId);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  async generateSchedule(
    @Body() generateScheduleDto: GenerateScheduleDto,
  ): Promise<ScheduleDto> {
    return this.schedulesService.generateSchedule(generateScheduleDto);
  }
}
