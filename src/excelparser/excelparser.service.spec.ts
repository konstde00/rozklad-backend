import { Test, TestingModule } from '@nestjs/testing';
import { ExcelparserService } from './excelparser.service';
import { TeachersService } from '../teachers/teachers.service';
import { SubjectsService } from '../subjects/subjects.service';
import { TeachingAssignmentsService } from '../teachingAssignments/teaching-assignments.service';
import * as ExcelJS from 'exceljs';

// Мокуємо ExcelJS без spyOn
jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => {
      return {
        xlsx: {
          load: jest.fn((buffer: Buffer) => {
            if (buffer.length === 0) {
              throw new Error('End of data reached (data length = 0)');
            }
            return Promise.resolve(true); // Реальний кейс для правильного файлу
          }),
        },
        eachSheet: jest.fn(),
      };
    }),
  };
});

// Мокування сервісів
const mockTeachersService = {
  importFromJson: jest.fn().mockResolvedValue({ success: true }),
};

const mockSubjectsService = {
  importFromJson: jest.fn().mockResolvedValue({ success: true }),
};

const mockTeachingAssignmentsService = {
  importFromJson: jest.fn().mockResolvedValue({ success: true }),
};

describe('ExcelparserService', () => {
  let service: ExcelparserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExcelparserService,
        { provide: TeachersService, useValue: mockTeachersService },
        { provide: SubjectsService, useValue: mockSubjectsService },
        { provide: TeachingAssignmentsService, useValue: mockTeachingAssignmentsService },
      ],
    }).compile();

    service = module.get<ExcelparserService>(ExcelparserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('parseExcelFile', () => {
    it('should parse Excel file correctly', async () => {
      const workbookMock = {
        eachSheet: jest.fn((callback) => {
          callback(
            {
              getRow: jest.fn().mockReturnValueOnce({ getCell: jest.fn(() => ({ text: 'Test Teacher' })) }),
            },
            1,
          );
        }),
        xlsx: {
          load: jest.fn().mockResolvedValue(true),
        },
      };

      const fileMock = { buffer: Buffer.from('fake-buffer') };

      const result = await service.parseExcelFile(fileMock as any);

      expect(result).toBeDefined();
      expect(mockTeachersService.importFromJson).toHaveBeenCalled();
      expect(mockSubjectsService.importFromJson).toHaveBeenCalled();
      expect(mockTeachingAssignmentsService.importFromJson).toHaveBeenCalled();
    });

    it('should handle empty Excel file', async () => {
      const fileMock = { buffer: Buffer.from('') };

      try {
        await service.parseExcelFile(fileMock as any);
      } catch (error) {
        expect(error.message).toBe('End of data reached (data length = 0)');
      }
    });

    it('should handle missing subject data', async () => {
      const workbookMock = {
        eachSheet: jest.fn((callback) => {
          callback(
            {
              getRow: jest.fn().mockReturnValueOnce({ getCell: jest.fn(() => ({ text: 'Test Teacher' })) }),
            },
            1,
          );
        }),
        xlsx: {
          load: jest.fn().mockResolvedValue(true),
        },
      };

      const fileMock = { buffer: Buffer.from('fake-buffer') };

      const result = await service.parseExcelFile(fileMock as any);

      expect(result).toBeDefined();
      expect(result.missingLoadSubjects).toEqual([]);
    });
  });

  describe('getLevenshteinDistance', () => {
    it('should calculate correct Levenshtein distance', () => {
      const distance = service.getLevenshteinDistance('kitten', 'sitting');
      expect(distance).toBe(3);
    });

    it('should return 0 for identical strings', () => {
      const distance = service.getLevenshteinDistance('hello', 'hello');
      expect(distance).toBe(0);
    });
      
      it('should throw an error if file format is incorrect', async () => {
  const invalidFileMock = { buffer: Buffer.from('not-an-excel-file') };

  try {
    await service.parseExcelFile(invalidFileMock as any);
  } catch (error) {
    expect(error.message).toBe('Invalid file format');
  }
      });
      
      it('should handle empty rows in Excel file', async () => {
  const workbookMock = {
    eachSheet: jest.fn((callback) => {
      callback(
        {
          getRow: jest.fn().mockReturnValueOnce({ getCell: jest.fn(() => ({ text: '' })) }), // Порожні клітинки
        },
        1,
      );
    }),
    xlsx: {
      load: jest.fn().mockResolvedValue(true),
    },
  };

  const fileMock = { buffer: Buffer.from('fake-buffer') };

  const result = await service.parseExcelFile(fileMock as any);

  expect(result).toBeDefined();
  expect(result.missingLoadSubjects).toEqual([]);
      });
      
      it('should handle incorrect data types (e.g., non-numeric hours)', async () => {
  const workbookMock = {
    eachSheet: jest.fn((callback) => {
      callback(
        {
          getRow: jest.fn().mockReturnValueOnce({
            getCell: jest.fn((col) => {
              if (col === 1) {
                return { text: 'Test Teacher' };
              } else if (col === 2) {
                return { text: 'Not a number' }; // Невірне значення для годин
              }
            }),
          }),
        },
        1,
      );
    }),
    xlsx: {
      load: jest.fn().mockResolvedValue(true),
    },
  };

  const fileMock = { buffer: Buffer.from('fake-buffer') };

  try {
    await service.parseExcelFile(fileMock as any);
  } catch (error) {
    expect(error.message).toBe('Invalid data format: expected number for hours');
  }
});

    it('should handle error while processing a sheet', async () => {
  const workbookMock = {
    eachSheet: jest.fn((callback) => {
      callback(
        {
          getRow: jest.fn().mockReturnValueOnce({ getCell: jest.fn(() => ({ text: 'Test Teacher' })) }),
        },
        1,
      );
      callback(
        {
          getRow: jest.fn().mockReturnValueOnce({ getCell: jest.fn(() => { throw new Error('Error processing row') }) }),
        },
        2,
      );
    }),
    xlsx: {
      load: jest.fn().mockResolvedValue(true),
    },
  };

  const fileMock = { buffer: Buffer.from('fake-buffer') };

  try {
    await service.parseExcelFile(fileMock as any);
  } catch (error) {
    expect(error.message).toBe('Error processing row');
  }
});
 
      it('should call external services during file parsing', async () => {
  const workbookMock = {
    eachSheet: jest.fn((callback) => {
      callback(
        {
          getRow: jest.fn().mockReturnValueOnce({ getCell: jest.fn(() => ({ text: 'Test Teacher' })) }),
        },
        1,
      );
    }),
    xlsx: {
      load: jest.fn().mockResolvedValue(true),
    },
  };

  const fileMock = { buffer: Buffer.from('fake-buffer') };

  await service.parseExcelFile(fileMock as any);

  expect(mockTeachersService.importFromJson).toHaveBeenCalled();
  expect(mockSubjectsService.importFromJson).toHaveBeenCalled();
  expect(mockTeachingAssignmentsService.importFromJson).toHaveBeenCalled();
});

      it('should handle missing or invalid data in cells gracefully', async () => {
  const workbookMock = {
    eachSheet: jest.fn((callback) => {
      callback(
        {
          getRow: jest.fn().mockReturnValueOnce({ getCell: jest.fn(() => ({ text: '' })) }), // Порожня клітинка
        },
        1,
      );
    }),
    xlsx: {
      load: jest.fn().mockResolvedValue(true),
    },
  };

  const fileMock = { buffer: Buffer.from('fake-buffer') };

  const result = await service.parseExcelFile(fileMock as any);

  expect(result.missingLoadSubjects).toEqual([/* expected missing subjects */]);
      });
      
      it('should return correct distance when comparing with an empty string', () => {
  const result = service.getLevenshteinDistance('test', '');
  expect(result).toBe(4);
});

      it('should upload and parse file successfully through API', async () => {
  const file = { buffer: Buffer.from('...') } as Express.Multer.File;
  const result = await service.parseExcelFile(file);
  expect(result).toBeDefined();
});

  });
});
