import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const admin = current.role === 'OFFICE_ADMIN' ? await prisma.officeAdmin.findUnique({ where: { userId: current.id } }) : null;
  const offices = await prisma.office.findMany({ where: admin ? { id: admin.officeId } : undefined, orderBy: { name: 'asc' } });
  return NextResponse.json({ ok: true, data: offices });
}

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { officeId, autoCloseAtEndOfDay, openingTime, closingTime } = await req.json();
    if (!officeId || typeof officeId !== 'string') return NextResponse.json({ ok: false, error: 'officeId required' }, { status: 400 });
    if (current.role === 'OFFICE_ADMIN') {
      const admin = await prisma.officeAdmin.findUnique({ where: { userId: current.id } });
      if (!admin || admin.officeId !== officeId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const office = await prisma.office.update({
      where: { id: officeId },
      data: {
        continuous24Hours: !Boolean(autoCloseAtEndOfDay),
        dailyOpening: true,
        openToday: true,
        ...(typeof openingTime === 'string' ? { openingTime } : {}),
        ...(typeof closingTime === 'string' ? { closingTime } : {}),
      },
    });
    return NextResponse.json({ ok: true, office });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}