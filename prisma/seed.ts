import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('password123', 10); // Hash the password
  await prisma.student.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      password,
      fullName: 'John Doe',
    },
  });
  console.log('Student created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });