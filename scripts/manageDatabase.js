const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const resources = {
  users: prisma.user,
  advisors: prisma.advisor,
  offices: prisma.office,
  officeAdmins: prisma.officeAdmin,
  specialities: prisma.speciality,
  advisorSpecialities: prisma.advisorSpeciality,
  photos: prisma.photo,
  presences: prisma.dailyPresence,
  officeChangeRequests: prisma.officeChangeRequest,
};

async function list() {
  const [users, advisors, offices, officeAdmins, specialities, photos, presences, requests] = await Promise.all([
    prisma.user.findMany({ select: { id: true, username: true, email: true, role: true, blocked: true } }),
    prisma.advisor.findMany({ select: { id: true, name: true, approved: true, officeId: true, userId: true } }),
    prisma.office.findMany({ select: { id: true, name: true } }),
    prisma.officeAdmin.findMany({ select: { id: true, userId: true, officeId: true, blocked: true, substitute: true } }),
    prisma.speciality.findMany({ select: { id: true, name: true, approved: true } }),
    prisma.photo.findMany({ select: { id: true, advisorId: true, url: true, mediaType: true, approved: true, reviewStatus: true } }),
    prisma.dailyPresence.findMany({ select: { id: true, advisorId: true, date: true, status: true, checkInAt: true, checkOutAt: true }, orderBy: { date: 'desc' } }),
    prisma.officeChangeRequest.findMany({ select: { id: true, advisorId: true, fromOfficeId: true, toOfficeId: true, status: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  console.dir({ users, advisors, offices, officeAdmins, specialities, photos, presences, officeChangeRequests: requests }, { depth: null });
}

async function remove(resource, id) {
  if (!resources[resource]) throw new Error(`Recurso inválido: ${resource}`);
  if (!id) throw new Error('Falta el id.');
  await resources[resource].delete({ where: { id } });
  console.log(`Eliminado ${resource}/${id}`);
}

async function removeUser(id) {
  const user = await prisma.user.findUnique({ where: { id }, include: { advisor: true, officeAdmin: true } });
  if (!user) throw new Error('Usuario no encontrado.');
  if (user.advisor) {
    await prisma.$transaction([
      prisma.officeChangeRequest.deleteMany({ where: { advisorId: user.advisor.id } }),
      prisma.dailyPresence.deleteMany({ where: { advisorId: user.advisor.id } }),
      prisma.photo.deleteMany({ where: { advisorId: user.advisor.id } }),
      prisma.advisorSpeciality.deleteMany({ where: { advisorId: user.advisor.id } }),
      prisma.advisor.delete({ where: { id: user.advisor.id } }),
      prisma.user.delete({ where: { id } }),
    ]);
  } else if (user.officeAdmin) {
    await prisma.$transaction([
      prisma.officeAdmin.delete({ where: { id: user.officeAdmin.id } }),
      prisma.user.delete({ where: { id } }),
    ]);
  } else {
    await prisma.user.delete({ where: { id } });
  }
  console.log(`Eliminado usuario y sus relaciones: ${id}`);
}

(async () => {
  try {
    const [, , command, resource, id] = process.argv;
    if (command === 'list') await list();
    else if (command === 'delete' && resource === 'users') await removeUser(id);
    else if (command === 'delete') await remove(resource, id);
    else {
      console.log('Uso:');
      console.log('  node scripts/manageDatabase.js list');
      console.log('  node scripts/manageDatabase.js delete users <userId>');
      console.log('  node scripts/manageDatabase.js delete <resource> <id>');
      console.log('Recursos:', Object.keys(resources).join(', '));
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Error:', error.message || error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
