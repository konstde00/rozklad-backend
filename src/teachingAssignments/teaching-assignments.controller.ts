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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { TeachingAssignmentsService } from './teaching-assignments.service';

@ApiTags('Teaching assignments')
@ApiBearerAuth()
@Controller('v1/assignments')
export class TeachingAssignmentsController {
  constructor(
    private readonly teachingAssignmentsService: TeachingAssignmentsService,
  ) {}

  /**
   * Create a new teaching assignment
   */
  @Post()
  @ApiOperation({ summary: 'Create a new teaching assignment' })
  @ApiResponse({
    status: 201,
    description: 'TeachingAssignment created successfully',
    schema: {
      $ref: '#/components/schemas/TeachingAssignment',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  async create(@Body() createTeachingAssignmentDto: any) {
    return this.teachingAssignmentsService.create(createTeachingAssignmentDto);
  }

  /**
   * Get all teaching assignments
   */
  @Get()
  @ApiOperation({ summary: 'Retrieve all teaching assignments' })
  @ApiResponse({
    status: 200,
    description: 'List of teaching assignments',
    schema: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/TeachingAssignment',
      },
    },
  })
  async findAll() {
    return this.teachingAssignmentsService.findAll();
  }

  /**
   * Get a teaching assignment by ID
   */
  @Get(':assignmentId')
  @ApiOperation({ summary: 'Retrieve a teaching assignment by ID' })
  @ApiParam({
    name: 'assignmentId',
    type: 'string',
    description: 'ID of the teaching assignment to retrieve',
  })
  @ApiResponse({
    status: 200,
    description: 'TeachingAssignment details',
    schema: {
      $ref: '#/components/schemas/TeachingAssignment',
    },
  })
  @ApiResponse({
    status: 404,
    description: 'TeachingAssignment not found',
  })
  async findOne(@Param('assignmentId', ParseIntPipe) assignmentId: string) {
    return this.teachingAssignmentsService.findOne(assignmentId);
  }

  /**
   * Update a teaching assignment by ID
   */
  @Patch(':assignmentId')
  @ApiOperation({ summary: 'Update a teaching assignment by ID' })
  @ApiParam({
    name: 'assignmentId',
    type: 'string',
    description: 'ID of the teaching assignment to update',
  })
  @ApiResponse({
    status: 200,
    description: 'TeachingAssignment updated successfully',
    schema: {
      $ref: '#/components/schemas/TeachingAssignment',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'TeachingAssignment not found',
  })
  async update(
    @Param('assignmentId') assignmentId: string,
    @Body() updateTeachingAssignmentDto: any,
  ) {
    return this.teachingAssignmentsService.update(
      assignmentId,
      updateTeachingAssignmentDto,
    );
  }

  /**
   * Delete a teaching assignment by ID
   */
  @Delete(':assignmentId')
  @ApiOperation({ summary: 'Delete a teaching assignment by ID' })
  @ApiParam({
    name: 'assignmentId',
    type: 'string',
    description: 'ID of the teaching assignment to delete',
  })
  @ApiResponse({
    status: 204,
    description: 'TeachingAssignment deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'TeachingAssignment not found',
  })
  async remove(@Param('assignmentId', ParseIntPipe) assignmentId: string) {
    await this.teachingAssignmentsService.remove(assignmentId);
    return {
      message: 'TeachingAssignment deleted successfully',
    };
  }
}
