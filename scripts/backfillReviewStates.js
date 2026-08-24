const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.advisorSpeciality.updateMany({ data: { reviewStatus: 'APPROVED' } });
    await prisma.photo.updateMany({ where: { approved: true }, data: { reviewStatus: 'APPROVED' } });
    console.log('Existing approved relations backfilled.');
  } finally {
    await prisma.$disconnect();
  }
})();
