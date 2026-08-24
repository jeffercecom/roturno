import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const advisors = await prisma.advisor.findMany({
      where: { approved: false },
      include: { photos: true, specialities: { include: { speciality: true } }, user: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ ok: true, data: advisors });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
