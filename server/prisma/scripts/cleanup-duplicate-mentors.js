/*
  One-off cleanup script to ensure each teacher mentors at most one class.
  It finds teachers referenced by multiple class_layout.mentor_id rows and
  nulls mentor_id on all but the lowest-id class for that teacher.

  Usage (from server/):
    node prisma/scripts/cleanup-duplicate-mentors.js
*/

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Group classes by mentor_id (non-null)
  const duplicates = await prisma.class_layout.groupBy({
    by: ['mentor_id'],
    where: { mentor_id: { not: null } },
    _count: { mentor_id: true },
    having: { mentor_id: { _count: { gt: 1 } } },
  });

  if (duplicates.length === 0) {
    console.log('No duplicate mentor assignments found.');
    return;
  }

  for (const row of duplicates) {
    const mentorId = row.mentor_id;
    const classes = await prisma.class_layout.findMany({
      where: { mentor_id: mentorId },
      select: { id: true },
      orderBy: { id: 'asc' },
    });

    if (classes.length <= 1) continue;

    // Keep the first (lowest id), clear the rest
    const keepId = classes[0].id;
    const toClear = classes.slice(1).map((c) => c.id);

    const result = await prisma.class_layout.updateMany({
      where: { id: { in: toClear } },
      data: { mentor_id: null },
    });

    console.log(
      `Mentor ${mentorId}: kept class ${keepId}, cleared mentor on ${result.count} other class(es).`
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
