import { Test, TestingModule } from '@nestjs/testing';
import { GroupsService } from './groups.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('GroupsService', () => {
  let service: GroupsService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: PrismaService,
          useValue: {
            studentGroup: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should retrieve all groups', async () => {
    const mockGroups = [
      {
        id: 1,
        name: 'Group 1',
        students_count: 20,
        course_number: 1,
        speciality: 42,
        created_at: new Date(),
        updated_at: new Date(),
        teachingAssignments: [],
      },
    ];
    jest
      .spyOn(prismaService.studentGroup, 'findMany')
      .mockResolvedValue(mockGroups);

    const result = await service.findAll();
    expect(prismaService.studentGroup.findMany).toHaveBeenCalled();
    expect(result).toEqual(
      mockGroups.map((group) => ({
        id: group.id.toString(),
        name: group.name,
        students_count: group.students_count,
        course_number: group.course_number,
        teachingAssignments: [],
      })),
    );
  });

  it('should throw NotFoundException if group is not found by ID', async () => {
    jest
      .spyOn(prismaService.studentGroup, 'findUnique')
      .mockResolvedValue(null);

    await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    expect(prismaService.studentGroup.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: {
        teachingAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });
  });

  it('should create a new group', async () => {
    const createGroupDto = {
      name: 'New Group',
      students_count: 25,
      course_number: 2,
      speciality: 42,
      created_at: new Date(),
      updated_at: new Date(),
      teachingAssignments: [],
    };
    const mockGroup = {
      id: 2,
      ...createGroupDto,
      teachingAssignments: [],
    };
    jest
      .spyOn(prismaService.studentGroup, 'create')
      .mockResolvedValue(mockGroup);

    const result = await service.create(createGroupDto);
    expect(prismaService.studentGroup.create).toHaveBeenCalledWith({
      data: {
        name: createGroupDto.name,
        speciality: 42,
        students_count: createGroupDto.students_count,
        course_number: createGroupDto.course_number,
      },
      include: {
        teachingAssignments: {
          include: {
            subject: true,
          },
        },
      },
    });
    expect(result).toEqual({
      id: mockGroup.id.toString(),
      name: mockGroup.name,
      students_count: mockGroup.students_count,
      course_number: mockGroup.course_number,
      study_year: undefined,
      teachingAssignments: [],
    });

  });
});
