const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const users = await prisma.user.findMany({ where: { username: null }, select: { id: true, email: true } });
    for (const user of users) {
      if (user.email) {
        await prisma.user.update({ where: { id: user.id }, data: { username: user.email.split('@')[0] } });
      }
    }
    console.log(`Backfilled ${users.length} usernames.`);
  } finally {
    await prisma.$disconnect();
  }
})();
