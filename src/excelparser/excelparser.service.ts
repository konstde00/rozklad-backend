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
  const missingLoadSubjects: any[] = [];

  workbook.eachSheet((worksheet, sheetId) => {
    const row = worksheet.getRow(6);
    const fullName = row.getCell(4).text.trim();

    const subjects: any[] = [];
    let rowIndex = 18;
    let specialityCode = '';

    while (true) {
  const subjectCell = worksheet.getRow(rowIndex).getCell(1);
  const subject = subjectCell.text.trim();
  let course = worksheet.getRow(rowIndex).getCell(2).text.trim();
  const workType = worksheet.getRow(rowIndex).getCell(7).text.trim();
  const hours = worksheet.getRow(rowIndex).getCell(13).text.trim();

  if (subject.includes('Всього')) break;

  if (
    subject.toLowerCase().includes('факультет') ||
    subject.toLowerCase().includes('навчально-науковий інститут') ||
    subject.toLowerCase().includes('спеціальність')
  ) {
    const specialityMatch = subject.match(/спеціальність\s*(\d+)/i);
    if (specialityMatch) specialityCode = specialityMatch[1];
    rowIndex++;
    continue;
  }

  if (!subject) {
    rowIndex++;
    continue;
  }

  if (
  subject.toLowerCase().startsWith('підготовка') ||
  subject.toLowerCase().startsWith('науково-дослідницька практика')
)
 {
    rowIndex++;
    continue;
  }

  const courseMatch = course.match(/^(\d+)/);
  if (courseMatch) course = courseMatch[1];

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

  if (workTypeMap[workType]) {
    existingSubject[workTypeMap[workType]] += parseInt(hours, 10) || 0;
  }

  rowIndex++;
}


    for (const subjectData of subjects) {
  const isZeroLoad =
    subjectData.lek === 0 &&
    subjectData.lab === 0 &&
    subjectData.sem === 0 &&
    subjectData.prakt === 0;

  const subjectEntry = {
    teacherName: fullName,
    subject: subjectData.subject,
    courseNumber: subjectData.course,
    lec: subjectData.lek,
    lab: subjectData.lab,
    sem: subjectData.sem,
    pract: subjectData.prakt,
    specialityCode: subjectData.specialityCode,
    facultyName: subjectData.facultyName,
  };

  if (isZeroLoad) {
    missingLoadSubjects.push(subjectEntry);
  } else {
    parsedData.push(subjectEntry);
  }
}

  });

  const teachersImportResults = await this.teachersService.importFromJson(parsedData);
  const subjectsImportResults = await this.subjectsService.importFromJson(parsedData);
  const teachingAssignmentsImportResults = await this.teachingAssignmentsService.importFromJson(parsedData);

    function findSimilarStrings(values: string[], threshold = 2) {
  const suggestions = [];
  const seen = new Set();

  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const dist = this.getLevenshteinDistance(values[i], values[j]);
      if (dist > 0 && dist <= threshold && !seen.has(`${values[j]}-${values[i]}`)) {
        suggestions.push({ str1: values[i], str2: values[j] });
        seen.add(`${values[i]}-${values[j]}`);
      }
    }
  }

  return suggestions;
}

const allSubjects = parsedData.map(entry => entry.subject);
const allTeachers = parsedData.map(entry => entry.teacherName);

const similarSubjects = findSimilarStrings.call(this, [...new Set(allSubjects)]);
const similarTeachers = findSimilarStrings.call(this, [...new Set(allTeachers)]);

    
  return {
  parsedData,
    missingLoadSubjects, // щоб фронт міг обробити їх
  similarSubjects,    
  similarTeachers     
};

  }
  
  private getLevenshteinDistance(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // delete
        dp[i][j - 1] + 1,      // insert
        dp[i - 1][j - 1] + cost // substitute
      );
    }
    }
    


  return dp[a.length][b.length];
}


}