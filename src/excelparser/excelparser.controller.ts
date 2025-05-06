import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { ExcelparserService } from './excelparser.service';
import { TeachersService } from '../teachers/teachers.service';
import { SubjectsService } from '../subjects/subjects.service';
import { TeachingAssignmentsService } from '../teachingAssignments/teaching-assignments.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { join } from 'path';

@ApiTags('Excel Parser')
@Controller('excelparser')
export class ExcelparserController {
  constructor(
    private readonly excelparserService: ExcelparserService,
    private readonly teachersService: TeachersService,
    private readonly subjectsService: SubjectsService,
    private readonly teachingAssignmentsService: TeachingAssignmentsService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload and parse an Excel file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload an Excel file for parsing',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadExcel(@UploadedFile() file: Express.Multer.File) {
    return await this.excelparserService.parseExcelFile(file);
  }

  @Get('upload')
  getUploadPage(@Res() res: Response) {
    const filePath = join(__dirname, '..', '..', 'public', 'upload.html');
    res.sendFile(filePath);
  }

  @Post('finalize')
  @ApiOperation({ summary: 'Finalize import after manual confirmation' })
  async finalizeImport(@Body() body: { parsedData: any[] }) {
    const teachersImportResults = await this.teachersService.importFromJson(body.parsedData);
    const subjectsImportResults = await this.subjectsService.importFromJson(body.parsedData);
    const teachingAssignmentsImportResults = await this.teachingAssignmentsService.importFromJson(body.parsedData);

    return {
      success: true,
      teachersImportResults,
      subjectsImportResults,
      teachingAssignmentsImportResults,
    };
  }
}
