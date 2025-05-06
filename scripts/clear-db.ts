import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clearDatabase() {
  // У правильному порядку (якщо є зв'язки)
  await prisma.teachingAssignment.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.teacher.deleteMany();

  console.log('Базу даних очищено');
}

clearDatabase()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
