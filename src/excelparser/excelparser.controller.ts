import { Controller, Post, Get, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { ExcelparserService } from './excelparser.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Express, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Excel Parser')
@Controller('excelparser')
export class ExcelparserController {
  constructor(private readonly excelparserService: ExcelparserService) {}

  @Get('upload')
  getUploadPage(@Res() res: Response) {
    return res.sendFile(path.join(__dirname, '..', '..', 'public', 'upload.html'));
  }

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
    const parsedData = await this.excelparserService.parseExcelFile(file);
    
    // After parsing, send back the file content as a response
    return parsedData;
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
