import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import { TeachersService } from '../teachers/teachers.service'; // Імпортуємо TeachersService

@Injectable()
export class ExcelparserService {
  constructor(private readonly teachersService: TeachersService) {} // Інжектуємо TeachersService

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
      }[] = [];

      let rowIndex = 19;

      while (true) {
        const subject = worksheet.getRow(rowIndex).getCell(1).text.trim();
        let course = worksheet.getRow(rowIndex).getCell(2).text.trim();
        const workType = worksheet.getRow(rowIndex).getCell(7).text.trim();
        const hours = worksheet.getRow(rowIndex).getCell(13).text.trim();

        if (subject.includes('Всього')) {
          break;
        }

        if (
          subject.toLowerCase().includes('факультет') ||
          subject.toLowerCase().includes('навчально-науковий інститут')
        ) {
          rowIndex++;
          continue;
        }

        if (subject) {
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
            (s) => s.subject === subject && s.course === course,
          );

          if (!existingSubject) {
            existingSubject = {
              subject,
              course,
              lek: 0,
              lab: 0,
              sem: 0,
              prakt: 0,
            };
            subjects.push(existingSubject);
          }

          if (validWorkTypes.includes(workType)) {
            existingSubject[workTypeMap[workType]] +=
              parseInt(hours, 10) || 0;
          }
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
            'teacher-name': fullName,
            subject: subjectData.subject,
            course: subjectData.course,
            group: '0',
            lec: subjectData.lek,
            lab: subjectData.lab,
            sem: subjectData.sem,
            pract: subjectData.prakt,
          });
        }
      }
    });

    const outputFilePath = 'teacher_data.json';
    fs.writeFileSync(outputFilePath, JSON.stringify(parsedData, null, 2), 'utf-8');

    console.log(`Дані збережено у файл ${outputFilePath}`);

    // Викликаємо імпорт викладачів
    const importResults = await this.teachersService.importFromJson(parsedData);
    console.log('Імпорт завершено:', importResults);

    return parsedData;
  }
}
