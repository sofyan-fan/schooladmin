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
  { name: 'Islamitische Studies - Compleet', description:"Een overzichtelijke introductie in de belangrijkste onderwerpen van de islam, zoals geloof, geschiedenis en dagelijkse praktijk.", price: 500 },
  { name: 'Intensief Quranprogramma', description:"Gerichte lessen waarin studenten leren de Quran beter en duidelijker te lezen, met begeleiding bij uitspraak en ritme.", price: 350 },
  { name: 'Arabisch voor Beginners', description:"Een start om het Arabische alfabet te leren, eenvoudige woorden te begrijpen en basiszinnen te kunnen lezen.", price: 250 },
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

// Generate first_name@domain and ensure global uniqueness by appending a number if needed
function makeFirstEmailUnique(first, usedEmails, domain = 'school.com') {
  const base = slugify(first).toLowerCase();
  let candidate = `${base}@${domain}`;
  let n = 1;
  while (usedEmails.has(candidate)) {
    candidate = `${base}${n}@${domain}`;
    n++;
  }
  usedEmails.add(candidate);
  return candidate;
}

async function cleanDatabase() {
  console.log('🧹 Database wordt opgeschoond...');
  // Delete records in an order that respects foreign key constraints.
  await prisma.financial_log.deleteMany();
  await prisma.financial_type.deleteMany();
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
  await prisma.school_year.deleteMany();
  console.log('✅ Database opgeschoond.');
}

async function main() {
  const { faker } = await import('@faker-js/faker/locale/nl');
  // Compatibility helper for faker boolean across versions
  function booleanWithProb(prob) {
    try {
      // Newer faker versions accept an options object
      return faker.datatype.boolean({ probability: prob });
    } catch (e) {
      // Fallback for older versions
      return Math.random() < prob;
    }
  }
  await cleanDatabase();

  console.log(`🌱 Start met vullen ...`);

  const adminHash = await bcrypt.hash('admin123', 10);

  // 1. Vakken
  console.log('Vakken worden aangemaakt...');
  const subjects = await Promise.all(
    SUBJECTS.map((name) => prisma.subject.create({ data: { name } }))
  );
  console.log(`✅ ${subjects.length} vakken aangemaakt.`);

  // 1b. Schooljaren
  console.log('Schooljaren worden aangemaakt...');
  const now = new Date();
  const currentYearStart = new Date(now.getFullYear(), 8, 1); // 1 Sep
  const currentYearEnd = new Date(now.getFullYear() + 1, 6, 31); // 31 Jul
  const previousYearStart = new Date(now.getFullYear() - 1, 8, 1);
  const previousYearEnd = new Date(now.getFullYear(), 6, 31);
  const twoYearsAgoStart = new Date(now.getFullYear() - 2, 8, 1);
  const twoYearsAgoEnd = new Date(now.getFullYear() - 1, 6, 31);

  // Historisch dummyjaar (bijv. 2023-2024), altijd gearchiveerd
  const dummyYear = await prisma.school_year.create({
    data: {
      name: `${twoYearsAgoStart.getFullYear()}-${twoYearsAgoEnd.getFullYear()}`,
      start_date: twoYearsAgoStart,
      end_date: twoYearsAgoEnd,
      is_active: false,
      is_archived: true,
    },
  });

  const [prevYear, activeYear] = await Promise.all([
    prisma.school_year.create({
      data: {
        name: `${previousYearStart.getFullYear()}-${previousYearEnd.getFullYear()}`,
        start_date: previousYearStart,
        end_date: previousYearEnd,
        is_active: false,
        is_archived: true,
      },
    }),
    prisma.school_year.create({
      data: {
        name: `${currentYearStart.getFullYear()}-${currentYearEnd.getFullYear()}`,
        start_date: currentYearStart,
        end_date: currentYearEnd,
        is_active: true,
        is_archived: false,
      },
    }),
  ]);
  console.log('✅ Schooljaren aangemaakt.');

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
          description: courseData.description,
          price: courseData.price,
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

  // 5. Financiële types
  console.log('Financiële types worden aangemaakt...');
  const FINANCIAL_TYPES = [
    { name: 'Lesgeld', description: 'Maandelijks lesgeld' },
    { name: 'Donaties', description: 'Vrijwillige bijdragen' },
    { name: 'Kantoorartikelen', description: 'Verbruiksmaterialen' },
    { name: 'Boodschappen', description: 'Boodschappen en verbruik' },
    { name: 'Materiaal', description: 'Lesmaterialen' },
  ];
  const createdTypes = [];
  for (const t of FINANCIAL_TYPES) {
    createdTypes.push(await prisma.financial_type.create({ data: t }));
  }
  const typeByName = new Map(createdTypes.map((t) => [t.name, t]));
  console.log(`✅ ${createdTypes.length} financiële types aangemaakt.`);

  // 6. Gebruikers (Admin, Docenten, Leerlingen)
  console.log('Gebruikers worden aangemaakt...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.com',
      password: adminHash,
      role: 'admin',
    },
  });

  // Track used emails to respect user.email @unique constraint
  const usedEmails = new Set(['admin@school.com']);

  // Voor docenten: eerst namen genereren zodat e-mails NL/Marokkaans lijken
  const teacherNamePairs = Array.from({ length: TEACHER_COUNT }).map(() => {
    const isMale = Math.random() < 0.5;
    return generatePersonNameByGender(isMale);
  });

  const teacherUsers = await Promise.all(
    teacherNamePairs.map(async (nm) => {
      const passwordHash = await bcrypt.hash(`${nm.first.toLowerCase()}123`, 10);
      const email = makeFirstEmailUnique(nm.first, usedEmails);
      return prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'teacher',
        },
      });
    })
  );

  // Voor leerlingen: namen + e-mails genereren
  const studentNameTriples = Array.from({ length: STUDENT_COUNT }).map(() => {
    const isMale = Math.random() < 0.5;
    const genderLabel = isMale ? 'Man' : 'Vrouw';
    const nm = generatePersonNameByGender(isMale);
    return { ...nm, genderLabel };
  });

  // Pre-generate parent info (first/last/email) per student
  const studentParentInfo = Array.from({ length: STUDENT_COUNT }).map(() => {
    const isMaleParent = Math.random() < 0.5;
    const p = generatePersonNameByGender(isMaleParent);
    // Keep parent first/last for name field; email will be set to student's user email later
    return { first: p.first, last: p.last };
  });

  // Create student users using student's first-name email and password `${firstName.toLowerCase()}123`
  const studentUsers = await Promise.all(
    studentNameTriples.map(async (nm) => {
      const passwordHash = await bcrypt.hash(`${nm.first.toLowerCase()}123`, 10);
      const email = makeFirstEmailUnique(nm.first, usedEmails);
      return prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'student',
        },
      });
    })
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
          parent_name: `${studentParentInfo[idx].first} ${studentParentInfo[idx].last}`,
          // Align to session mapping: use the student's user email as parent_email
          parent_email: user.email,
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

  // 7. Financiële transacties (inkomsten & uitgaven)
  console.log('Financiële transacties worden aangemaakt...');
  const paymentMethods = ['iDEAL', 'SEPA incasso', 'Contant', 'Creditcard'];

  // Inkomsten: lesgeld voor willekeurige leerlingen en cursussen (actief schooljaar)
  const incomeCount = Math.min(20, students.length);
  for (let i = 0; i < incomeCount; i++) {
    const s = faker.helpers.arrayElement(students);
    const sWithClass = await prisma.student.findUnique({
      where: { id: s.id },
      include: { class_layout: true },
    });
    const courseId =
      sWithClass?.class_layout?.course_id ||
      faker.helpers.arrayElement(courses).id;

    await prisma.financial_log.create({
      data: {
        type_id: typeByName.get('Lesgeld').id,
        student_id: s.id,
        course_id: courseId,
        school_year_id: activeYear.id,
        amount: faker.number.float({ min: 50, max: 200, multipleOf: 0.5 }),
        method: faker.helpers.arrayElement(paymentMethods),
        notes: 'Automatisch gegenereerde lesgeldbetaling',
        transaction_type: 'income',
      },
    });
  }

  // Uitgaven: kantoorartikelen/boodschappen/materiaal (actief schooljaar)
  const expenseTypes = ['Kantoorartikelen', 'Boodschappen', 'Materiaal'];
  for (let i = 0; i < 10; i++) {
    const t = faker.helpers.arrayElement(expenseTypes);
    await prisma.financial_log.create({
      data: {
        type_id: typeByName.get(t).id,
        student_id: null,
        course_id:
          t === 'Materiaal' ? faker.helpers.arrayElement(courses).id : null,
        school_year_id: activeYear.id,
        amount: faker.number.float({ min: 20, max: 400, multipleOf: 0.5 }),
        method: faker.helpers.arrayElement(['Contant', 'Bankoverschrijving']),
        notes:
          t === 'Kantoorartikelen'
            ? 'Kantoorartikelen aankoop'
            : t === 'Boodschappen'
            ? 'Boodschappen voor keuken'
            : 'Aanschaf lesmateriaal',
        transaction_type: 'expense',
      },
    });
  }

  // Extra historische transacties voor het dummyjaar (archief)
  const pastIncomeCount = Math.min(10, students.length);
  for (let i = 0; i < pastIncomeCount; i++) {
    const s = faker.helpers.arrayElement(students);
    const courseId = faker.helpers.arrayElement(courses).id;
    await prisma.financial_log.create({
      data: {
        type_id: typeByName.get('Lesgeld').id,
        student_id: s.id,
        course_id: courseId,
        school_year_id: dummyYear.id,
        amount: faker.number.float({ min: 40, max: 150, multipleOf: 0.5 }),
        method: faker.helpers.arrayElement(paymentMethods),
        notes: 'Historische lesgeldbetaling (archiefjaar)',
        transaction_type: 'income',
      },
    });
  }

  for (let i = 0; i < 6; i++) {
    const t = faker.helpers.arrayElement(expenseTypes);
    await prisma.financial_log.create({
      data: {
        type_id: typeByName.get(t).id,
        student_id: null,
        course_id:
          t === 'Materiaal' ? faker.helpers.arrayElement(courses).id : null,
        school_year_id: dummyYear.id,
        amount: faker.number.float({ min: 15, max: 250, multipleOf: 0.5 }),
        method: faker.helpers.arrayElement(['Contant', 'Bankoverschrijving']),
        notes:
          t === 'Kantoorartikelen'
            ? 'Historische kantoorartikelen'
            : t === 'Boodschappen'
            ? 'Historische boodschappen'
            : 'Historische aanschaf lesmateriaal',
        transaction_type: 'expense',
      },
    });
  }
  console.log('✅ Financiële transacties aangemaakt.');

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
          school_year_id: activeYear.id,
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

  // 10b. Lespakketnaam per leerling invullen o.b.v. toegewezen klas (course.name)
  console.log('Lespakketnamen voor leerlingen instellen...');
  const courseIdToName = new Map(courses.map((c) => [c.id, c.name]));
  const studentsWithClass = await prisma.student.findMany({
    include: { class_layout: true },
  });
  await Promise.all(
    studentsWithClass.map(async (s) => {
      const classCourseId = s?.class_layout?.course_id || null;
      const courseName = classCourseId ? courseIdToName.get(classCourseId) : null;
      await prisma.student.update({
        where: { id: s.id },
        data: { lesson_package: courseName || s.lesson_package || '' },
      });
    })
  );
  console.log('✅ Lespakketnamen ingesteld op basis van klas/cursus.');

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
      if (booleanWithProb(0.7)) {
        // 70% chance of a class on any given day
        const timeSlot = faker.helpers.arrayElement(timeSlots);
        await prisma.roster.create({
          data: {
            class_id: classLayout.id,
            subject_id: faker.helpers.arrayElement(subjects).id,
            teacher_id: faker.helpers.arrayElement(teachers).id,
            classroom_id: faker.helpers.arrayElement(classrooms).id,
            school_year_id: activeYear.id,
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
          school_year_id: activeYear.id,
          leverage: faker.number.float({ min: 0.5, max: 2, multipleOf: 0.5 }),
          date: faker.date.soon({ days: 45 }),
          is_central: false,
          description: 'Korte toets',
        },
      });
      assessments.push(test);

      // maak soms ook een Exam voor dezelfde class/subject
      if (booleanWithProb(0.4)) {
        const exam = await prisma.assessment.create({
          data: {
            type: 'Exam',
            name: pickAssessmentName('Exam'),
            class_id: classLayout.id,
            subject_id: cms.id,
            school_year_id: activeYear.id,
            leverage: faker.number.float({ min: 1, max: 3, multipleOf: 0.5 }),
            date: faker.date.soon({ days: 90 }),
            is_central: booleanWithProb(0.3),
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
