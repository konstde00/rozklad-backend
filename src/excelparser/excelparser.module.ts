import { Module } from '@nestjs/common';
import { ExcelparserService } from './excelparser.service';
import { ExcelparserController } from './excelparser.controller';
import { TeachersModule } from '../teachers/teachers.module'; 

@Module({
  controllers: [ExcelparserController],
  imports: [TeachersModule], 
  providers: [ExcelparserService],
 
})
export class ExcelparserModule {}
