const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const pres = await prisma.dailyPresence.findMany({
      where: { date: { gte: start, lt: end } },
      include: { advisor: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`Daily presences for ${start.toISOString().slice(0,10)}:`);
    if (pres.length === 0) console.log('  (none)');
    for (const p of pres) {
      console.log({ id: p.id, advisorId: p.advisorId, advisorName: p.advisor?.name, advisorEmail: p.advisor?.user?.email, status: p.status, checkInAt: p.checkInAt, checkOutAt: p.checkOutAt });
    }
  } catch (err) {
    console.error('Error listing presences:', err.message || err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
