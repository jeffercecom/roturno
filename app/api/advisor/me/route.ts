import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { closeExpiredPresences, todayStart } from '@/lib/presence';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });

  try {
    await closeExpiredPresences();
    const advisor = await prisma.advisor.findUnique({
      where: { userId: current.id },
      include: {
        photos: true,
        office: true,
        specialities: { include: { speciality: true } },
        presences: { where: { date: todayStart() } },
        officeChangeRequests: {
          include: { fromOffice: true, toOffice: true },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        customAttributes: true,
        serviceCategories: { include: { category: { include: { durations: true } } } },
      },
    });
    if (!advisor) return NextResponse.json({ ok: false, error: 'advisor profile not found' }, { status: 404 });
    return NextResponse.json({ ok: true, user: { id: current.id, username: current.username, email: current.email }, advisor });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
