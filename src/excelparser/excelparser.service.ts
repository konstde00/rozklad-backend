import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { TeachersService } from '../teachers/teachers.service';
import { SubjectsService } from '../subjects/subjects.service';
import { TeachingAssignmentsService } from '../teachingAssignments/teaching-assignments.service';

@Injectable()
export class ExcelparserService {
  constructor(
    private readonly teachersService: TeachersService,
    private readonly subjectsService: SubjectsService,
    private readonly teachingAssignmentsService: TeachingAssignmentsService,
  ) {}

  async parseExcelFile(file: Express.Multer.File): Promise<any> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer);

    const parsedData: any[] = [];

    workbook.eachSheet((worksheet, sheetId) => {
      const row = worksheet.getRow(6);
      const fullName = row.getCell(4).text.trim();

      const subjects: {
        subject: string;
        course: string;
        lek: number;
        lab: number;
        sem: number;
        prakt: number;
        specialityCode?: string;
        facultyName?: string;
      }[] = [];

      let rowIndex = 18;
      let specialityCode = '';

      while (true) {
        const subjectCell = worksheet.getRow(rowIndex).getCell(1);
        const subject = subjectCell.text.trim();
        let course = worksheet.getRow(rowIndex).getCell(2).text.trim();
        const workType = worksheet.getRow(rowIndex).getCell(7).text.trim();
        const hours = worksheet.getRow(rowIndex).getCell(13).text.trim();

        if (subject.includes('Всього')) {
          break;
        }

        // Check for 'факультет', 'навчально-науковий інститут', or 'спеціальність'
        if (
          subject.toLowerCase().includes('факультет') ||
          subject.toLowerCase().includes('навчально-науковий інститут') ||
          subject.toLowerCase().includes('спеціальність')
        ) {

          // Extract speciality code if present
          const specialityMatch = subject.match(/спеціальність\s*(\d+)/i);
          if (specialityMatch) {
            specialityCode = specialityMatch[1];
            console.log(`extracted specialityCode: ${specialityCode} from input ${subject}`);
          } else {
            console.log('specialityMatch not found in: ', subject);
          }
          rowIndex++;
          continue;
        }

        // Skip empty subject rows
        if (!subject) {
          rowIndex++;
          continue;
        }

        // Process the subject
        const courseMatch = course.match(/^(\d+)/);
        if (courseMatch) {
          course = courseMatch[1];
        }

        const validWorkTypes = ['лек.', 'лаб.', 'сем.', 'практ.'];
        const workTypeMap: { [key: string]: string } = {
          'лек.': 'lek',
          'лаб.': 'lab',
          'сем.': 'sem',
          'практ.': 'prakt',
        };

        let existingSubject = subjects.find(
          (s) =>
            s.subject === subject &&
            s.course === course &&
            s.specialityCode === specialityCode,
        );

        if (!existingSubject) {
          existingSubject = {
            subject,
            course,
            lek: 0,
            lab: 0,
            sem: 0,
            prakt: 0,
            specialityCode,
          };
          subjects.push(existingSubject);
        }

        if (validWorkTypes.includes(workType)) {
          existingSubject[workTypeMap[workType]] += parseInt(hours, 10) || 0;
        }

        rowIndex++;
      }

      for (const subjectData of subjects) {
        const totalHours =
          subjectData.lek +
          subjectData.lab +
          subjectData.sem +
          subjectData.prakt;

        if (totalHours > 0) {
          parsedData.push({
            teacherName: fullName,
            subject: subjectData.subject,
            courseNumber: subjectData.course,
            lec: subjectData.lek,
            lab: subjectData.lab,
            sem: subjectData.sem,
            pract: subjectData.prakt,
            specialityCode: subjectData.specialityCode,
            facultyName: subjectData.facultyName,
          });
        }
      }
    });

    // Викликаємо імпорт викладачів
    const teachersImportResults = await this.teachersService.importFromJson(
      parsedData,
    );
    console.log('Імпорт викладачів завершено:', teachersImportResults);

    // імпорт предметів
    const subjectsImportResults = await this.subjectsService.importFromJson(
      parsedData,
    );
    console.log('Імпорт предметів завершено:', subjectsImportResults);

    // імпорт teaching assignments
    const teachingAssignmentsImportResults =
      await this.teachingAssignmentsService.importFromJson(parsedData);
    console.log(
      'Імпорт teaching assignments завершено:',
      teachingAssignmentsImportResults,
    );

    return parsedData;
  }
}
