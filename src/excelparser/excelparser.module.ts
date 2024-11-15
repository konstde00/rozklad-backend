import { Module } from '@nestjs/common';
import { ExcelparserService } from './excelparser.service';
import { ExcelparserController } from './excelparser.controller';

@Module({
  controllers: [ExcelparserController],
  providers: [ExcelparserService],
})
export class ExcelparserModule {}
