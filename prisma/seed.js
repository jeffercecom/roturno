const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async function main() {
  try {
    // Clean previous data (safe for development)
    await prisma.dailyPresence.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.advisorSpeciality.deleteMany();
    await prisma.speciality.deleteMany();
    await prisma.officeAdmin.deleteMany();
    await prisma.advisor.deleteMany();
    await prisma.office.deleteMany();
    await prisma.user.deleteMany();

    // Owner
    const owner = await prisma.user.create({ data: { username: 'owner', email: 'owner@example.com', password: 'ownerpass', role: 'OWNER' } });

    // Offices
    const office1 = await prisma.office.create({ data: { name: 'Oficina Centro', address: 'Calle Falsa 123' } });
    const office2 = await prisma.office.create({ data: { name: 'Oficina Norte', address: 'Av. Siempre Viva 456' } });

    // Office admin user and assignment
    const adminUser = await prisma.user.create({ data: { username: 'admin1', email: 'admin1@example.com', password: 'adminpass', role: 'OFFICE_ADMIN' } });
    await prisma.officeAdmin.create({ data: { userId: adminUser.id, officeId: office1.id } });

    // Specialities
    const spec1 = await prisma.speciality.create({ data: { name: 'Fiscal', approved: true } });
    const spec2 = await prisma.speciality.create({ data: { name: 'Contable', approved: true } });
    const spec3 = await prisma.speciality.create({ data: { name: 'Legal', approved: true } });

    // Advisor 1 (approved, active today)
    const advUser1 = await prisma.user.create({ data: { username: 'asesor1', email: 'asesor1@example.com', password: 'pass1', role: 'ADVISOR' } });
    const advisor1 = await prisma.advisor.create({ data: { userId: advUser1.id, name: 'Juan Pérez', approved: true, officeId: office1.id } });
    await prisma.advisorSpeciality.createMany({ data: [
      { advisorId: advisor1.id, specialityId: spec1.id },
      { advisorId: advisor1.id, specialityId: spec2.id },
    ] });
    await prisma.photo.create({ data: { advisorId: advisor1.id, url: 'https://placehold.co/500x625', isFace: true, isMain: true, approved: true } });

    // Advisor 2 (not approved)
    const advUser2 = await prisma.user.create({ data: { username: 'asesor2', email: 'asesor2@example.com', password: 'pass2', role: 'ADVISOR' } });
    const advisor2 = await prisma.advisor.create({ data: { userId: advUser2.id, name: 'María López', approved: false } });
    await prisma.advisorSpeciality.create({ data: { advisorId: advisor2.id, specialityId: spec3.id } });
    await prisma.photo.create({ data: { advisorId: advisor2.id, url: 'https://placehold.co/500x625', isFace: true, isMain: true, approved: false } });

    // Daily presences (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.dailyPresence.create({ data: { advisorId: advisor1.id, date: today, status: 'ACTIVE', checkInAt: new Date() } });
    await prisma.dailyPresence.create({ data: { advisorId: advisor2.id, date: today, status: 'INACTIVE' } });

    console.log('Seed data created successfully.');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
