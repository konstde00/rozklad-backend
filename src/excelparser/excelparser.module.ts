import { Module } from '@nestjs/common';
import { ExcelparserService } from './excelparser.service';
import { ExcelparserController } from './excelparser.controller';
import { TeachersModule } from '../teachers/teachers.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { TeachingAssignmentsModule } from '../teachingAssignments/teaching-assignments.module';

@Module({
  controllers: [
    ExcelparserController
  ],
  imports: [
    TeachersModule,
    SubjectsModule,
    TeachingAssignmentsModule
  ],
  providers: [
    ExcelparserService
  ],
 
})
export class ExcelparserModule {}

//npx ts-node scripts/clear-db.ts
//npm run start:dev