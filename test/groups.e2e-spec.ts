import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Groups (e2e)', () => {
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
    await app.close();
  });

  it('should retrieve all groups (GET /groups)', async () => {
    // Мокові дані у базі
    await prisma.studentGroup.create({
      data: { name: 'Test Group', students_count: 10, course_number: 1 },
    });

    const response = await request(app.getHttpServer()).get('/v1/groups');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Test Group',
          students_count: 10,
          course_number: 1,
        }),
      ]),
    );
  });

  it('should create a new group (POST /groups)', async () => {
    const createGroupDto = {
      name: 'New Group',
      students_count: 20,
      course_number: 2,
    };

    const response = await request(app.getHttpServer())
      .post('/v1/groups')
      .send(createGroupDto);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(
      expect.objectContaining({
        name: 'New Group',
        students_count: 20,
        course_number: 2,
      }),
    );
  });

  it('should return 404 for non-existent group (GET /groups/:id)', async () => {
    const response = await request(app.getHttpServer()).get('/v1/groups/999999');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      statusCode: 404,
      message: 'Group not found',
      error: 'Not Found',
    });
  });
});
