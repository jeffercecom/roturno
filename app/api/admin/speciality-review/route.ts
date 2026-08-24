import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can review specialties' }, { status: 403 });
  try {
    const { advisorSpecialityId, action } = await req.json();
    if (!advisorSpecialityId || !['APPROVED', 'REJECTED', 'HIDDEN'].includes(action)) return NextResponse.json({ ok: false, error: 'invalid review' }, { status: 400 });
    const relation = await prisma.advisorSpeciality.update({ where: { id: advisorSpecialityId }, data: { reviewStatus: action === 'HIDDEN' ? 'APPROVED' : action, hiddenByOwner: action === 'HIDDEN' } });
    return NextResponse.json({ ok: true, relation });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
