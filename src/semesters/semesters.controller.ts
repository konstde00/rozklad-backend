
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { SemestersService } from './semesters.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('Semesters')
@ApiBearerAuth()
@Controller('v1/semesters')
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  /**
   * Create a new semester
   */
  @Post()
  @ApiOperation({ summary: 'Create a new semester' })
  @ApiResponse({
    status: 201,
    description: 'Semester created successfully',
    schema: {
      $ref: '#/components/schemas/Semester',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semestersService.create(createSemesterDto);
  }

  /**
   * Get all semesters
   */
  @Get()
  @ApiOperation({ summary: 'Retrieve all semesters' })
  @ApiResponse({
    status: 200,
    description: 'List of semesters',
    schema: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/Semester',
      },
    },
  })
  async findAll() {
    return this.semestersService.findAll();
  }

  /**
   * Get a semester by ID
   */
  @Get(':semesterId')
  @ApiOperation({ summary: 'Retrieve a semester by ID' })
  @ApiParam({
    name: 'semesterId',
    type: 'string',
    description: 'ID of the semester to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'Semester details',
    schema: {
      $ref: '#/components/schemas/Semester',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Semester not found',
  })
  async findOne(@Param('semesterId', ParseIntPipe) semesterId: string) {
    return this.semestersService.findOne(BigInt(semesterId));
  }

  /**
   * Update a semester by ID
   */
  @Patch(':semesterId')
  @ApiOperation({ summary: 'Update a semester by ID' })
  @ApiParam({
    name: 'semesterId',
    type: 'string',
    description: 'ID of the semester to update',
  })
  @ApiResponse({
    status: 200,
    description: 'Semester updated successfully',
    schema: {
      $ref: '#/components/schemas/Semester',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Semester not found',
  })
  async update(
    @Param('semesterId', ParseIntPipe) semesterId: string,
    @Body() updateSemesterDto: UpdateSemesterDto,
  ) {
    return this.semestersService.update(BigInt(semesterId), updateSemesterDto);
  }

  /**
   * Delete a semester by ID
   */
  @Delete(':semesterId')
  @ApiOperation({ summary: 'Delete a semester by ID' })
  @ApiParam({
    name: 'semesterId',
    type: 'string',
    description: 'ID of the semester to delete',
  })
  @ApiResponse({
    status: 204,
    description: 'Semester deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Semester not found',
  })
  async remove(@Param('semesterId', ParseIntPipe) semesterId: string) {
    await this.semestersService.remove(BigInt(semesterId));
    return {
      message: 'Semester deleted successfully',
    };
  }
}
