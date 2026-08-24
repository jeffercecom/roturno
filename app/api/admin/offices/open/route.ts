import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayStart } from '@/lib/presence';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const { officeId, open } = await req.json();
  const admin = current.role === 'OFFICE_ADMIN' ? await prisma.officeAdmin.findUnique({ where: { userId: current.id } }) : null;
  if (current.role === 'OFFICE_ADMIN' && (!admin || admin.officeId !== officeId)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  const office = await prisma.office.update({ where: { id: officeId }, data: { openToday: Boolean(open) } });
  if (!open) {
    const advisors = await prisma.advisor.findMany({ where: { officeId }, select: { id: true } });
    await prisma.dailyPresence.updateMany({ where: { advisorId: { in: advisors.map((advisor) => advisor.id) }, date: todayStart(), status: 'ACTIVE' }, data: { status: 'INACTIVE', checkOutAt: new Date() } });
  }
  return NextResponse.json({ ok: true, office });
}