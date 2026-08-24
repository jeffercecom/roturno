import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { closeExpiredPresences, todayStart } from '@/lib/presence';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });

  try {
    await closeExpiredPresences();
    const advisor = await prisma.advisor.findUnique({ where: { userId: current.id } });
    if (!advisor) return NextResponse.json({ ok: false, error: 'advisor profile not found' }, { status: 404 });
    if (!advisor.officeId) return NextResponse.json({ ok: false, error: 'Necesitas una sede asignada para abrir turno.' }, { status: 400 });
    const office = await prisma.office.findUnique({ where: { id: advisor.officeId } });
    if (!office || !office.openToday) return NextResponse.json({ ok: false, error: 'La sede está cerrada hoy.' }, { status: 400 });
    if (!office.continuous24Hours) {
      const currentMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const [openHour, openMinute] = office.openingTime.split(':').map(Number);
      const [closeHour, closeMinute] = office.closingTime.split(':').map(Number);
      if (currentMinutes < openHour * 60 + openMinute || currentMinutes >= closeHour * 60 + closeMinute) return NextResponse.json({ ok: false, error: 'Fuera del horario de atención de la sede.' }, { status: 400 });
    }

    const existing = await prisma.dailyPresence.findUnique({ where: { advisorId_date: { advisorId: advisor.id, date: todayStart() } } });
    if (existing?.status === 'ACTIVE') {
      const updated = await prisma.dailyPresence.update({ where: { id: existing.id }, data: { status: 'INACTIVE', checkOutAt: new Date() } });
      return NextResponse.json({ ok: true, action: 'checkout', presence: updated });
    }

    const presence = existing
      ? await prisma.dailyPresence.update({ where: { id: existing.id }, data: { status: 'ACTIVE', checkInAt: new Date(), checkOutAt: null, autoEnded: false } })
      : await prisma.dailyPresence.create({ data: { advisorId: advisor.id, date: todayStart(), status: 'ACTIVE', checkInAt: new Date() } });
    return NextResponse.json({ ok: true, action: 'checkin', presence });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
