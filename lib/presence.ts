import { prisma } from './prisma';

export async function closeExpiredPresences() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expired = await prisma.dailyPresence.findMany({
    where: { status: 'ACTIVE', date: { lt: today } },
    include: { advisor: { include: { office: true } } },
  });
  const closable = expired.filter((presence) => !presence.advisor.office?.continuous24Hours);
  if (closable.length > 0) {
    await prisma.dailyPresence.updateMany({
      where: { id: { in: closable.map((presence) => presence.id) } },
      data: { status: 'INACTIVE', autoEnded: true, checkOutAt: new Date() },
    });
  }

  const offices = await prisma.office.findMany({ where: { continuous24Hours: false } });
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  for (const office of offices) {
    const [hour, minute] = office.closingTime.split(':').map(Number);
    if (currentMinutes >= hour * 60 + minute) {
      const advisors = await prisma.advisor.findMany({ where: { officeId: office.id }, select: { id: true } });
      await prisma.dailyPresence.updateMany({ where: { advisorId: { in: advisors.map((advisor) => advisor.id) }, date: today, status: 'ACTIVE' }, data: { status: 'INACTIVE', autoEnded: true, checkOutAt: now } });
    }
  }
}

export function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}
