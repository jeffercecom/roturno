import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { advisorId } = await req.json();
    const advisor = await prisma.advisor.findUnique({ where: { id: advisorId }, include: { office: true } });
    if (!advisor) return NextResponse.json({ ok: false, error: 'advisor not found' }, { status: 404 });
    if (current.role === 'OFFICE_ADMIN') {
      const admin = await prisma.officeAdmin.findFirst({ where: { userId: current.id, officeId: advisor.officeId || '' } });
      if (!admin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const presence = await prisma.dailyPresence.findFirst({ where: { advisorId, date: start, status: 'ACTIVE' } });
    if (!presence) return NextResponse.json({ ok: false, error: 'no active shift' }, { status: 400 });
    const updated = await prisma.dailyPresence.update({ where: { id: presence.id }, data: { status: 'INACTIVE', checkOutAt: new Date() } });
    return NextResponse.json({ ok: true, presence: updated });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}