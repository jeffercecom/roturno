import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const officeAdmin = current.role === 'OFFICE_ADMIN'
      ? await prisma.officeAdmin.findFirst({ where: { userId: current.id } })
      : null;
    if (current.role === 'OFFICE_ADMIN' && !officeAdmin) return NextResponse.json({ ok: false, error: 'office assignment not found' }, { status: 403 });
    const advisors = await prisma.advisor.findMany({
      where: officeAdmin ? { OR: [{ officeId: officeAdmin.officeId }, { officeId: null, approved: true }] } : undefined,
      include: { 
        photos: true, 
        specialities: { include: { speciality: true } }, 
        user: true,
        office: true,
        presences: { where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, data: advisors });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
