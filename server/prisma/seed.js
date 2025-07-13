const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const saltRounds = 10;
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Use upsert to avoid unique constraint errors if the seed runs multiple times
  const userData = {
    email: 'test@example.com',
    password: hashedPassword,
    firstname: 'Test',
    lastname: 'User',
    phone: '1234567890',
    adress: '123 Test Street',
    gender: 'male',
    role: 'admin',
  };
  const user = await prisma.users.upsert({
    where: { email: userData.email },
    update: {},
    create: userData,
  });

  console.log({ user });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
