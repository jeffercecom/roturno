import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { advisorSpecialityId, active } = await req.json();
    const advisor = await prisma.advisor.findUnique({ where: { userId: current.id } });
    if (!advisor) return NextResponse.json({ ok: false, error: 'advisor not found' }, { status: 404 });
    const relation = await prisma.advisorSpeciality.updateMany({ where: { id: advisorSpecialityId, advisorId: advisor.id }, data: { activeByAdvisor: Boolean(active) } });
    return NextResponse.json({ ok: relation.count === 1 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
