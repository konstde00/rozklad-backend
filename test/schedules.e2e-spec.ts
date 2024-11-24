import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Schedules (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('should create a new semester (POST /semesters)', async () => {
    const createSemesterDto = {
      title: 'Fall 2024',
      start_date: '2024-09-01',
      end_date: '2024-12-31',
    };

    const response = await request(app.getHttpServer())
      .post('/v1/semesters')
      .send(createSemesterDto);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual(
      expect.objectContaining({
        title: 'Fall 2024',
      }),
    );
  });

  it('should generate an empty schedule (POST /schedules/generate)', async () => {
    const semester = await prisma.semester.create({
      data: {
        title: 'Spring 2025',
        start_date: new Date('2025-02-01'),
        end_date: new Date('2025-05-31'),
      },
    });

    const generateScheduleDto = {
      semesterId: semester.id.toString(),
    };

    const response = await request(app.getHttpServer())
      .post('/v1/schedules/generate')
      .send(generateScheduleDto);

    expect(response.status).toBe(HttpStatus.CREATED);
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        semesterId: semester.id.toString(),
        semesterTitle: 'Spring 2025',
        events: [],
      }),
    );
  });

  it('should return 404 for invalid semesterId (POST /schedules/generate)', async () => {
    const generateScheduleDto = {
      semesterId: '999999',
    };

    const response = await request(app.getHttpServer())
      .post('/v1/schedules/generate')
      .send(generateScheduleDto);

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Semester not found',
      error: 'Not Found',
    });
  });
});
