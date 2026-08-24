const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const advisors = await prisma.advisor.findMany({
      include: { user: true },
    });
    console.log('Advisors:');
    for (const a of advisors) {
      console.log({ id: a.id, name: a.name, approved: a.approved, officeId: a.officeId, userEmail: a.user?.email });
    }
  } catch (err) {
    console.error('Error listing advisors:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
