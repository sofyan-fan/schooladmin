const { PrismaClient } = require('@prisma/client');
// faker v10 is ESM-only; use dynamic import inside main()
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const USER_COUNT = 50;
const TEACHER_COUNT = 10;
const STUDENT_COUNT = USER_COUNT - TEACHER_COUNT;
const ADMIN_COUNT = 1;
const SUBJECTS = [
  'Quran Recitation',
  'Tajweed',
  'Arabic Language',
  'Islamic History',
  'Fiqh',
  'Aqeedah',
  'Hadith Studies',
  'Seerah of the Prophet',
];
// Modules are derived from subjects (module name == subject name)
const COURSES = [
  { name: 'Comprehensive Islamic Studies', price: 500 },
  { name: 'Intensive Quran Program', price: 350 },
  { name: 'Arabic for Beginners', price: 250 },
];
const CLASSROOM_COUNT = 5;
const CLASS_LAYOUT_COUNT = 5;

async function cleanDatabase() {
  console.log('🧹 Cleaning database...');
  // Delete records in an order that respects foreign key constraints.
  await prisma.result.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.course_module_subject.deleteMany();
  await prisma.student_log.deleteMany();
  await prisma.time_registration.deleteMany();
  await prisma.absence.deleteMany();
  await prisma.roster.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.tuition_payment.deleteMany();
  await prisma.progress.deleteMany();
  await prisma.student.deleteMany();
  await prisma.class_layout.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();
  await prisma.classroom.deleteMany();
  await prisma.course_module_relation.deleteMany();
  await prisma.courses.deleteMany();
  await prisma.course_module.deleteMany();
  await prisma.subject_level.deleteMany();
  await prisma.subject_material.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.events.deleteMany();
  await prisma.book_inventory.deleteMany();
  console.log('✅ Database cleaned.');
}

async function main() {
  const { faker } = await import('@faker-js/faker');
  await cleanDatabase();

  console.log(`🌱 Start seeding ...`);

  const hashedPassword = await bcrypt.hash('password', 10);

  // 1. Seed Subjects
  console.log('Seeding subjects...');
  const subjects = await Promise.all(
    SUBJECTS.map((name) => prisma.subject.create({ data: { name } }))
  );
  console.log(`✅ Seeded ${subjects.length} subjects.`);

  // 2. Seed subject levels and materials (1-3 each per subject)
  console.log('Seeding subject levels/materials...');
  const LEVEL_POOL = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const MATERIAL_POOL = ['Book A', 'Book B', 'Workbook', 'Handouts'];

  const subjectIdToLevels = new Map();
  const subjectIdToMaterials = new Map();

  for (const s of subjects) {
    const levelCount = faker.number.int({ min: 1, max: 3 });
    const chosenLevels = faker.helpers.arrayElements(LEVEL_POOL, levelCount);
    const createdLevels = [];
    for (const lvl of chosenLevels) {
      const created = await prisma.subject_level.create({
        data: { level: lvl, subject_id: s.id },
      });
      createdLevels.push(created);
    }
    subjectIdToLevels.set(s.id, createdLevels);

    const materialCount = faker.number.int({ min: 1, max: 3 });
    const chosenMaterials = faker.helpers.arrayElements(
      MATERIAL_POOL,
      materialCount
    );
    const createdMaterials = [];
    for (const mat of chosenMaterials) {
      const created = await prisma.subject_material.create({
        data: { material: mat, subject_id: s.id },
      });
      createdMaterials.push(created);
    }
    subjectIdToMaterials.set(s.id, createdMaterials);
  }
  console.log('✅ Seeded levels and materials for subjects.');

  // 3. Seed Course Modules (one per subject; module name = subject + level)
  console.log('Seeding course modules and module-subject mapping...');
  const modules = [];
  for (const s of subjects) {
    const levels = subjectIdToLevels.get(s.id) || [{ level: 'Beginner' }];
    const materials = subjectIdToMaterials.get(s.id) || [
      { material: 'Book A' },
    ];
    const chosenLevel = faker.helpers.arrayElement(levels).level;
    const chosenMaterial = faker.helpers.arrayElement(materials).material;
    const moduleName = `${s.name} - ${chosenLevel}`;

    const mod = await prisma.course_module.create({
      data: { name: moduleName },
    });
    modules.push(mod);
    await prisma.course_module_subject.create({
      data: {
        course_module_id: mod.id,
        subject_id: s.id,
        level: chosenLevel,
        material: chosenMaterial,
      },
    });
  }
  console.log(
    `✅ Seeded ${modules.length} modules and linked each to a subject with level/material.`
  );

  // 4. Seed Courses and link to Modules
  console.log('Seeding courses...');
  const courses = await Promise.all(
    COURSES.map(async (courseData) => {
      const createdCourse = await prisma.courses.create({
        data: {
          ...courseData,
          // courses.description is required in schema
          description: faker.lorem.sentence(),
        },
      });
      // Link each course to 2-3 random modules
      const modulesToLink = faker.helpers.arrayElements(
        modules,
        faker.number.int({ min: 2, max: 3 })
      );
      await Promise.all(
        modulesToLink.map((module) =>
          prisma.course_module_relation.create({
            data: {
              course_id: createdCourse.id,
              module_id: module.id,
            },
          })
        )
      );
      return createdCourse;
    })
  );
  console.log(`✅ Seeded ${courses.length} courses.`);

  // 5. Seed Users (Admin, Teachers, Students)
  console.log('Seeding users...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  const teacherUsers = await Promise.all(
    Array.from({ length: TEACHER_COUNT }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          password: hashedPassword,
          role: 'teacher',
        },
      })
    )
  );

  const studentUsers = await Promise.all(
    Array.from({ length: STUDENT_COUNT }).map(() =>
      prisma.user.create({
        data: {
          email: faker.internet.email().toLowerCase(),
          password: hashedPassword,
          role: 'student',
        },
      })
    )
  );
  console.log(
    `✅ Seeded ${1 + teacherUsers.length + studentUsers.length} users.`
  );

  // 6. Seed Teachers
  console.log('Seeding teachers...');
  const teachers = await Promise.all(
    teacherUsers.map((user) =>
      prisma.teacher.create({
        data: {
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          email: user.email,
          phone: faker.phone.number(),
          address: faker.location.streetAddress(),
          is_active: true,
          // generate numeric float to satisfy Prisma Float type (use multipleOf to avoid deprecation)
          compensation: faker.number.float({
            min: 20,
            max: 50,
            multipleOf: 0.01,
          }),
        },
      })
    )
  );
  console.log(`✅ Seeded ${teachers.length} teachers.`);

  // 7. Seed Students
  console.log('Seeding students...');
  const students = await Promise.all(
    studentUsers.map((user) =>
      prisma.student.create({
        data: {
          first_name: faker.person.firstName(),
          last_name: faker.person.lastName(),
          birth_date: faker.date.birthdate({ min: 6, max: 18, mode: 'age' }),
          gender: faker.person.sex(),
          address: faker.location.streetAddress(),
          postal_code: faker.location.zipCode(),
          city: faker.location.city(),
          phone: faker.phone.number(),
          parent_name: faker.person.fullName(),
          parent_email: faker.internet.email(),
          lesson_package: faker.helpers.arrayElement(['Standard', 'Premium']),
          payment_method: faker.helpers.arrayElement([
            'Bank Transfer',
            'Credit Card',
          ]),
          sosnumber: faker.phone.number(),
          enrollment_status: true,
        },
      })
    )
  );
  console.log(`✅ Seeded ${students.length} students.`);

  // 8. Seed Classrooms
  console.log('Seeding classrooms...');
  const classrooms = await Promise.all(
    Array.from({ length: CLASSROOM_COUNT }).map((_, i) =>
      prisma.classroom.create({
        data: {
          name: `Classroom ${i + 1}`,
          capacity: faker.number.int({ min: 15, max: 30 }),
          description: faker.lorem.sentence(),
        },
      })
    )
  );
  console.log(`✅ Seeded ${classrooms.length} classrooms.`);

  // 9. Seed Class Layouts (ensure unique mentors to satisfy @unique constraint)
  console.log('Seeding class layouts...');
  const shuffledTeachers = faker.helpers.shuffle([...teachers]);
  const uniqueMentorSlice = shuffledTeachers.slice(0, CLASS_LAYOUT_COUNT);
  const classLayouts = await Promise.all(
    Array.from({ length: CLASS_LAYOUT_COUNT }).map((_, i) => {
      const mentor = uniqueMentorSlice[i];
      return prisma.class_layout.create({
        data: {
          name: `Class ${101 + i}`,
          // If there are fewer teachers than classes, fall back to null mentor
          mentor_id: mentor ? mentor.id : null,
          course_id: faker.helpers.arrayElement(courses).id,
        },
      });
    })
  );
  console.log(`✅ Seeded ${classLayouts.length} class layouts.`);

  // 10. Assign Students to Classes
  console.log('Assigning students to classes...');
  await Promise.all(
    students.map((student) =>
      prisma.student.update({
        where: { id: student.id },
        data: {
          class_id: faker.helpers.arrayElement(classLayouts).id,
        },
      })
    )
  );
  console.log(`✅ Assigned students to classes.`);

  // 11. Seed Rosters (Schedule)
  console.log('Seeding rosters...');
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { start_time: '09:00', end_time: '10:30' },
    { start_time: '11:00', end_time: '12:30' },
    { start_time: '14:00', end_time: '15:30' },
  ];

  let rostersCreated = 0;
  for (const classLayout of classLayouts) {
    for (const day_of_week of daysOfWeek) {
      if (faker.datatype.boolean(0.7)) {
        // 70% chance of a class on any given day
        const timeSlot = faker.helpers.arrayElement(timeSlots);
        await prisma.roster.create({
          data: {
            class_id: classLayout.id,
            subject_id: faker.helpers.arrayElement(subjects).id,
            teacher_id: faker.helpers.arrayElement(teachers).id,
            classroom_id: faker.helpers.arrayElement(classrooms).id,
            day_of_week: day_of_week,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
          },
        });
        rostersCreated++;
      }
    }
  }
  console.log(`✅ Seeded ${rostersCreated} roster entries.`);

  // 12. Seed Events
  console.log('Seeding events...');
  const events = await Promise.all(
    Array.from({ length: 6 }).map((_, i) => {
      const date = faker.date.soon({ days: 90 });
      const startHour = faker.number.int({ min: 9, max: 16 });
      const minute = faker.helpers.arrayElement(['00', '30']);
      const endHour = Math.min(
        startHour + faker.number.int({ min: 1, max: 3 }),
        20
      );

      const start_time = `${String(startHour).padStart(2, '0')}:${minute}`;
      const end_time = `${String(endHour).padStart(2, '0')}:${minute}`;

      return prisma.events.create({
        data: {
          name: `Event ${i + 1}`,
          description: faker.lorem.sentence(),
          date,
          start_time,
          end_time,
          location: faker.location.city(),
        },
      });
    })
  );
  console.log(`✅ Seeded ${events.length} events.`);

  console.log(`🎉 Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
