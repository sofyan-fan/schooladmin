const { PrismaClient } = require('@prisma/client');
// faker v10 is ESM-only; use dynamic import inside main()
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const USER_COUNT = 50;
const TEACHER_COUNT = 10;
const STUDENT_COUNT = USER_COUNT - TEACHER_COUNT;
const ADMIN_COUNT = 1;

// Vakken (geen Engels). Mix van Arabisch (voorkeur) en Nederlands waar passend
const SUBJECTS = [
  'Quran Recitatie',
  'Tajweed',
  'Arabisch (taal)',
  'Islamitische Geschiedenis',
  'Fiqh',
  'Aqeedah',
  'Hadith',
  'Seerah',
];

// Lespakketten (Nederlands)
// Modules worden verderop aan courses gekoppeld
const COURSES = [
  { name: 'Islamitische Studies - Compleet', price: 500 },
  { name: 'Intensief Quranprogramma', price: 350 },
  { name: 'Arabisch voor Beginners', price: 250 },
];

const CLASSROOM_COUNT = 5;
const CLASS_LAYOUT_COUNT = 5;

// Veelgebruikte naamverzamelingen (Nederlands-Marokkaanse context)
const MOROCCAN_MALE_FIRST_NAMES = [
  'Mohammed',
  'Youssef',
  'Yassine',
  'Achraf',
  'Anouar',
  'Zakaria',
  'Omar',
  'Hamza',
  'Ismail',
  'Khalid',
  'Abdelhakim',
  'Abderrahman',
  'Nordin',
  'Rachid',
  'Karim',
  'Soufiane',
  'Redouan',
  'Tarik',
  'Ayoub',
  'Bilal',
  'Imad',
  'Hicham',
  'Said',
  'Hakim',
  'Mostafa',
  'Anass',
];
const MOROCCAN_FEMALE_FIRST_NAMES = [
  'Fatima',
  'Aicha',
  'Khadija',
  'Naima',
  'Zineb',
  'Imane',
  'Sara',
  'Souad',
  'Nadia',
  'Malika',
  'Samira',
  'Ilham',
  'Meryem',
  'Laila',
  'Yasmina',
  'Asmae',
  'Ikram',
  'Salma',
  'Hajar',
  'Rania',
  'Noura',
  'Amal',
  'Safae',
  'Dounia',
  'Chaimae',
];
const MOROCCAN_SURNAMES = [
  'El Amrani',
  'El Idrissi',
  'El Yousfi',
  'El Bakkali',
  'Benali',
  'Bennani',
  'Ait El Kadi',
  'Ait Moussa',
  'Bouhaddou',
  'Bouziane',
  'Chahboun',
  'Aarab',
  'Harchaoui',
  'Nouri',
  'Ouarghi',
  'Ouahbi',
  'El Ghazali',
  'El Barkaoui',
  'Tannane',
  'El Arbaoui',
  'El Ouazzani',
  'El Mountassir',
  'Tahiri',
  'Amghar',
  'Zaoui',
  'El Yazidi',
  'Azarkan',
  'El Morabit',
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function generatePersonNameByGender(isMale) {
  const first = pickRandom(
    isMale ? MOROCCAN_MALE_FIRST_NAMES : MOROCCAN_FEMALE_FIRST_NAMES
  );
  const last = pickRandom(MOROCCAN_SURNAMES);
  return { first, last };
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '');
}

function makeEmail(first, last, domain = 'school.com') {
  const base = `${slugify(first)}.${slugify(last)}`;
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffix}@${domain}`;
}

async function cleanDatabase() {
  console.log('🧹 Database wordt opgeschoond...');
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
  console.log('✅ Database opgeschoond.');
}

async function main() {
  const { faker } = await import('@faker-js/faker/locale/nl');
  await cleanDatabase();

  console.log(`🌱 Start met vullen ...`);

  const hashedPassword = await bcrypt.hash('password', 10);

  // 1. Vakken
  console.log('Vakken worden aangemaakt...');
  const subjects = await Promise.all(
    SUBJECTS.map((name) => prisma.subject.create({ data: { name } }))
  );
  console.log(`✅ ${subjects.length} vakken aangemaakt.`);

  // 2. Niveaus (NL) en materialen (AR) per vak (1-3 elk)
  console.log('Niveaus en materialen worden aangemaakt...');
  const LEVEL_POOL = ['Beginner', 'Gemiddeld', 'Gevorderd', 'Expert'];
  const MATERIAL_POOL = [
    'Juz Amma',
    'Surah al-Fatiha',
    'Surah al-Ikhlas',
    'Bidayat at-Tajweed',
  ];

  const subjectIdToLevels = new Map();
  const subjectIdToMaterials = new Map();
  const subjectIdToName = new Map();
  const moduleSubjects = [];

  for (const s of subjects) {
    subjectIdToName.set(s.id, s.name);
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
  console.log('✅ Niveaus en materialen aangemaakt.');

  // 3. Modules (1 per vak; naam = vak + niveau) en koppeling module-vak
  console.log('Modules en koppelingen worden aangemaakt...');
  const modules = [];
  for (const s of subjects) {
    const levels = subjectIdToLevels.get(s.id) || [{ level: 'Beginner' }];
    const materials = subjectIdToMaterials.get(s.id) || [
      { material: 'Juz Amma' },
    ];
    const chosenLevel = faker.helpers.arrayElement(levels).level;
    const chosenMaterial = faker.helpers.arrayElement(materials).material;
    const moduleName = `${s.name} - ${chosenLevel}`;

    const mod = await prisma.course_module.create({
      data: { name: moduleName },
    });
    modules.push(mod);
    const cms = await prisma.course_module_subject.create({
      data: {
        course_module_id: mod.id,
        subject_id: s.id,
        level: chosenLevel,
        material: chosenMaterial,
      },
    });
    moduleSubjects.push(cms);
  }
  console.log(
    `✅ ${modules.length} modules aangemaakt en gekoppeld met niveau/materiaal.`
  );

  // 4. Lespakketten en koppeling aan modules
  console.log('Lespakketten worden aangemaakt...');
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
  console.log(`✅ ${courses.length} lespakketten aangemaakt.`);

  // 5. Gebruikers (Admin, Docenten, Leerlingen)
  console.log('Gebruikers worden aangemaakt...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: hashedPassword,
      role: 'admin',
    },
  });

  // Voor docenten: eerst namen genereren zodat e-mails NL/Marokkaans lijken
  const teacherNamePairs = Array.from({ length: TEACHER_COUNT }).map(() => {
    const isMale = Math.random() < 0.5;
    return generatePersonNameByGender(isMale);
  });

  const teacherUsers = await Promise.all(
    teacherNamePairs.map((nm) =>
      prisma.user.create({
        data: {
          email: makeEmail(nm.first, nm.last).toLowerCase(),
          password: hashedPassword,
          role: 'teacher',
        },
      })
    )
  );

  // Voor leerlingen: namen + e-mails genereren
  const studentNameTriples = Array.from({ length: STUDENT_COUNT }).map(() => {
    const isMale = Math.random() < 0.5;
    const genderLabel = isMale ? 'Man' : 'Vrouw';
    const nm = generatePersonNameByGender(isMale);
    return { ...nm, genderLabel };
  });

  const studentUsers = await Promise.all(
    studentNameTriples.map((nm) =>
      prisma.user.create({
        data: {
          email: makeEmail(nm.first, nm.last).toLowerCase(),
          password: hashedPassword,
          role: 'student',
        },
      })
    )
  );
  console.log(
    `✅ ${1 + teacherUsers.length + studentUsers.length} gebruikers aangemaakt.`
  );

  // 6. Docenten
  console.log('Docenten worden aangemaakt...');
  const teachers = await Promise.all(
    teacherUsers.map((user, idx) =>
      prisma.teacher.create({
        data: {
          first_name: teacherNamePairs[idx].first,
          last_name: teacherNamePairs[idx].last,
          email: user.email,
          phone: `06${faker.string.numeric(8)}`,
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
  console.log(`✅ ${teachers.length} docenten aangemaakt.`);

  // 7. Leerlingen
  console.log('Leerlingen worden aangemaakt...');
  const students = await Promise.all(
    studentUsers.map((user, idx) =>
      prisma.student.create({
        data: {
          first_name: studentNameTriples[idx].first,
          last_name: studentNameTriples[idx].last,
          birth_date: faker.date.birthdate({ min: 6, max: 18, mode: 'age' }),
          gender: studentNameTriples[idx].genderLabel,
          address: faker.location.streetAddress(),
          postal_code: faker.location.zipCode(),
          city: faker.location.city(),
          phone: `06${faker.string.numeric(8)}`,
          parent_name: (() => {
            const isMale = Math.random() < 0.5;
            const p = generatePersonNameByGender(isMale);
            return `${p.first} ${p.last}`;
          })(),
          parent_email: (() => {
            const isMale = Math.random() < 0.5;
            const p = generatePersonNameByGender(isMale);
            return makeEmail(p.first, p.last).toLowerCase();
          })(),
          lesson_package: faker.helpers.arrayElement(['Standaard', 'Premium']),
          payment_method: faker.helpers.arrayElement([
            'Bankoverschrijving',
            'Creditcard',
            'iDEAL',
          ]),
          sosnumber: faker.string.numeric(9),
          enrollment_status: true,
        },
      })
    )
  );
  console.log(`✅ ${students.length} leerlingen aangemaakt.`);

  // 8. Lokalen
  console.log('Lokalen worden aangemaakt...');
  const classrooms = await Promise.all(
    Array.from({ length: CLASSROOM_COUNT }).map((_, i) =>
      prisma.classroom.create({
        data: {
          name: `Lokaal ${i + 1}`,
          capacity: faker.number.int({ min: 15, max: 30 }),
          description: faker.lorem.sentence(),
        },
      })
    )
  );
  console.log(`✅ ${classrooms.length} lokalen aangemaakt.`);

  // 9. Klassen (unieke mentor per klas i.v.m. @unique)
  console.log('Klassen worden aangemaakt...');
  const shuffledTeachers = faker.helpers.shuffle([...teachers]);
  const uniqueMentorSlice = shuffledTeachers.slice(0, CLASS_LAYOUT_COUNT);
  const classLayouts = await Promise.all(
    Array.from({ length: CLASS_LAYOUT_COUNT }).map((_, i) => {
      const mentor = uniqueMentorSlice[i];
      return prisma.class_layout.create({
        data: {
          name: `Klas ${101 + i}`,
          // If there are fewer teachers than classes, fall back to null mentor
          mentor_id: mentor ? mentor.id : null,
          course_id: faker.helpers.arrayElement(courses).id,
        },
      });
    })
  );
  console.log(`✅ ${classLayouts.length} klassen aangemaakt.`);

  // 10. Leerlingen aan klassen toewijzen
  console.log('Leerlingen aan klassen toewijzen...');
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
  console.log(`✅ Leerlingen toegewezen aan klassen.`);

  // 11. Roosters (Let op: day_of_week in Engels houden voor compatibiliteit)
  console.log('Roosters worden aangemaakt...');
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
  console.log(`✅ ${rostersCreated} roosterregels aangemaakt.`);

  // 12. Beoordelingen (Assessments)
  console.log('Beoordelingen (toetsen/examens) worden aangemaakt...');
  const assessmentNames = {
    Test: ['Toets 1', 'Kleine Toets', 'Theorie Toets', 'Praktijk Toets'],
    Exam: ['Examen 1', 'Eindtoets', 'Tussentoets'],
  };
  const pickAssessmentName = (type) =>
    faker.helpers.arrayElement(assessmentNames[type] || ['Beoordeling']);

  const assessments = [];
  for (const classLayout of classLayouts) {
    // kies 2-3 willekeurige module-subject koppelingen om afwisseling te krijgen
    const chosenCms = faker.helpers.arrayElements(
      moduleSubjects,
      faker.number.int({ min: 2, max: 3 })
    );
    for (const cms of chosenCms) {
      // maak een Test
      const test = await prisma.assessment.create({
        data: {
          type: 'Test',
          name: pickAssessmentName('Test'),
          class_id: classLayout.id,
          subject_id: cms.id, // verwijst naar course_module_subject
          leverage: faker.number.float({ min: 0.5, max: 2, multipleOf: 0.5 }),
          date: faker.date.soon({ days: 45 }),
          is_central: false,
          description: 'Korte toets',
        },
      });
      assessments.push(test);

      // maak soms ook een Exam voor dezelfde class/subject
      if (faker.datatype.boolean(0.4)) {
        const exam = await prisma.assessment.create({
          data: {
            type: 'Exam',
            name: pickAssessmentName('Exam'),
            class_id: classLayout.id,
            subject_id: cms.id,
            leverage: faker.number.float({ min: 1, max: 3, multipleOf: 0.5 }),
            date: faker.date.soon({ days: 90 }),
            is_central: faker.datatype.boolean(0.3),
            description: 'Eindtoets/Examen',
          },
        });
        assessments.push(exam);
      }
    }
  }
  console.log(`✅ ${assessments.length} beoordelingen aangemaakt.`);

  // 13. Evenementen
  console.log('Evenementen worden aangemaakt...');
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
          name: `Evenement ${i + 1}`,
          description: faker.lorem.sentence(),
          date,
          start_time,
          end_time,
          location: faker.location.city(),
        },
      });
    })
  );
  console.log(`✅ ${events.length} evenementen aangemaakt.`);

  console.log(`🎉 Vullen voltooid.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
