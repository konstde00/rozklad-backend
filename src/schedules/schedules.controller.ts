
// schedules.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus, BadRequestException, Query,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { ScheduleDto } from './dto/schedule.dto';
import { EventDto } from './dto/event.dto';

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

  /**
   * Fetches events filtered by start and end dates (inclusive).
   * @param startDate - The start date in 'YYYY-MM-DD' format.
   * @param endDate - The end date in 'YYYY-MM-DD' format.
   * @returns An array of EventDto.
   */
  @Get('events')
  async getEventsByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<EventDto[]> {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate query parameters are required');
    }

    // Validate date format (basic validation)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      throw new BadRequestException('startDate and endDate must be in YYYY-MM-DD format');
    }

    // Ensure startDate is not after endDate
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('startDate cannot be after endDate');
    }

    return this.schedulesService.getEventsByDateRange(startDate, endDate);
  }
}
