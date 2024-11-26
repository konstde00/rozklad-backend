import {
  Controller,
  Get,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ExcelparserService } from './excelparser.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Express, Response } from 'express';
import * as fs from 'fs';

@ApiTags('Excel Parser')
@Controller('excelparser')
export class ExcelparserController {
  constructor(private readonly excelparserService: ExcelparserService) {}

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

  @Get('teacher-data')
  getTeacherData(@Res() res: Response) {
    const outputFilePath = 'teacher_data.json';

    if (fs.existsSync(outputFilePath)) {
      const fileContent = fs.readFileSync(outputFilePath, 'utf-8');
      return res.json(JSON.parse(fileContent));
    } else {
      return res.status(404).json({ message: 'Файл не знайдено' });
    }
  }
}
