// Seeds a demo student and a sample exam so a fresh install can be tried immediately.
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  await prisma.student.upsert({
    where: { username: 'student1' },
    update: {},
    create: {
      username: 'student1',
      password: await hash('password123', 10),
      fullName: 'Demo Student',
    },
  });

  const exists = await prisma.exam.findUnique({ where: { title: 'Sample Health Quiz' } });
  if (!exists) {
    await prisma.exam.create({
      data: {
        title: 'Sample Health Quiz',
        duration: 10,
        questions: {
          create: [
            { text: 'Which vitamin is produced when skin is exposed to sunlight?', options: ['Vitamin A', 'Vitamin C', 'Vitamin D', 'Vitamin K'], correct: 2 },
            { text: 'What is the normal adult resting heart rate (beats per minute)?', options: ['20-40', '60-100', '120-140', '150-180'], correct: 1 },
            { text: 'Which of these diseases is spread by the Anopheles mosquito?', options: ['Cholera', 'Typhoid', 'Malaria', 'Tuberculosis'], correct: 2 },
            { text: 'Washing hands with soap mainly helps to prevent:', options: ['Spread of infections', 'Hair loss', 'Bone fractures', 'High blood pressure'], correct: 0 },
          ],
        },
      },
    });
  }
  console.log('Seed complete: demo student "student1" / "password123" and a sample exam.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
