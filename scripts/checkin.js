const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const advisorId = process.argv[2];
  if (!advisorId) {
    console.error('Usage: node scripts/checkin.js <advisorId>');
    process.exit(1);
  }

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  try {
    // check if presence exists for today
    const existing = await prisma.dailyPresence.findFirst({ where: { advisorId, date: start } });
    if (existing) {
      const updated = await prisma.dailyPresence.update({ where: { id: existing.id }, data: { status: 'ACTIVE', checkInAt: new Date(), autoEnded: false } });
      console.log('Updated presence:', updated);
    } else {
      const created = await prisma.dailyPresence.create({ data: { advisorId, date: start, status: 'ACTIVE', checkInAt: new Date() } });
      console.log('Created presence:', created);
    }
  } catch (err) {
    console.error('Checkin failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
