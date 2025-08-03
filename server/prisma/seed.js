const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const mockData = {
  jaarplanning: [
    {
      id: 1,
      title: 'Islamitische Feestdag',
      date: '2024-08-19T00:00:00.000Z',
      description: 'Vrije dag voor alle studenten en personeel.',
    },
    {
      id: 2,
      title: 'Ouderavond',
      date: '2024-09-05T18:00:00.000Z',
      description: 'Gesprekken met ouders over de voortgang.',
    },
    {
      id: 3,
      title: 'Herfstvakantie',
      date: '2024-10-21T00:00:00.000Z',
      description: 'Een week vrij voor de herfst.',
    },
  ],
  studenten: [
    {
      id: 1,
      first_name: 'Ahmad',
      last_name: 'Hassan',
      birth_date: '2010-05-12T00:00:00.000Z',
      gender: 'Man',
      address: 'Voorbeeldstraat 1',
      postal_code: '1000AB',
      city: 'Amsterdam',
      phone: '0612345678',
      parent_name: 'Hassan',
      parent_email: 'hassan@email.com',
      lesson_package: 'Standaard',
    },
    {
      id: 2,
      first_name: 'Fatima',
      last_name: 'El Amrani',
      birth_date: '2011-02-20T00:00:00.000Z',
      gender: 'Vrouw',
      address: 'Voorbeeldstraat 2',
      postal_code: '1000AC',
      city: 'Amsterdam',
      phone: '0687654321',
      parent_name: 'El Amrani',
      parent_email: 'elamrani@email.com',
      lesson_package: 'Uitgebreid',
    },
  ],
  leraren: [
    {
      id: 1,
      first_name: 'Abdullah',
      last_name: 'Khan',
      email: 'abdullah.khan@school.com',
      phone: '0611223344',
      address: 'Leraarstraat 1',
    },
    {
      id: 2,
      first_name: 'Aisha',
      last_name: 'Bakker',
      email: 'aisha.bakker@school.com',
      phone: '0655667788',
      address: 'Leraarstraat 2',
    },
  ],
  personeel: [
    {
      id: 1,
      first_name: 'Ali',
      last_name: 'Demir',
      email: 'ali.demir@school.com',
      phone: '0699887766',
      address: 'Administratiestraat 1',
    },
  ],
  lessons: [
    { id: 1, name: 'Koran recitatie', level: 'Beginner' },
    { id: 2, name: 'Arabische taal', level: 'Gevorderd' },
    { id: 3, name: 'Islamitische geschiedenis', level: 'Alle niveaus' },
  ],
};

async function main() {
  console.log(`Deleting old data ...`);
  // Delete records in an order that respects foreign key constraints.
  await prisma.progress.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.result.deleteMany();
  await prisma.roster.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.test.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.tuition_payment.deleteMany();

  await prisma.courses.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.class_layout.deleteMany();

  await prisma.events.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  console.log(`Old data deleted.`);

  console.log(`Start seeding ...`);

  for (const event of mockData.jaarplanning) {
    await prisma.events.create({
      data: {
        name: event.title,
        description: event.description,
        date: new Date(event.date),
        start_time: new Date(event.date).toLocaleTimeString(),
        end_time: new Date(event.date).toLocaleTimeString(),
        location: 'School',
      },
    });
  }

  for (const student of mockData.studenten) {
    await prisma.student.create({
      data: {
        first_name: student.first_name,
        last_name: student.last_name,
        birth_date: new Date(student.birth_date),
        gender: student.gender,
        address: student.address,
        postal_code: student.postal_code,
        city: student.city,
        phone: student.phone,
        parent_name: student.parent_name,
        parent_email: student.parent_email,
        lesson_package: student.lesson_package,
      },
    });
  }

  for (const teacher of mockData.leraren) {
    await prisma.teacher.create({
      data: {
        first_name: teacher.first_name,
        last_name: teacher.last_name,
        email: teacher.email,
        phone: teacher.phone,
        address: teacher.address,
      },
    });
  }

  for (const admin of mockData.personeel) {
    await prisma.admin.create({
      data: {
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        phone: admin.phone,
        address: admin.address,
      },
    });
  }

  for (const lesson of mockData.lessons) {
    await prisma.subject.create({
      data: {
        name: lesson.name,
        level: lesson.level,
      },
    });
  }

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
