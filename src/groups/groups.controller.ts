import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { GroupDto } from './dto/group.dto';

@Controller('v1/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async findAll(): Promise<GroupDto[]> {
    return this.groupsService.findAll();
  }

  @Post()
  async create(@Body() createGroupDto: CreateGroupDto): Promise<GroupDto> {
    return this.groupsService.create(createGroupDto);
  }

  @Get(':groupId')
  async findOne(@Param('groupId') id: string): Promise<GroupDto> {
    return this.groupsService.findOne(id);
  }

  @Put(':groupId')
  async update(
    @Param('groupId') id: string,
    @Body() updateGroupDto: CreateGroupDto,
  ): Promise<GroupDto> {
    return this.groupsService.update(id, updateGroupDto);
  }

  @Delete(':groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('groupId') id: string): Promise<void> {
    return this.groupsService.remove(id);
  }
}
