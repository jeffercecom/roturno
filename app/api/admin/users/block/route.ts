import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { userId } = await req.json();
    const target = await prisma.user.findUnique({ where: { id: userId }, include: { advisor: true, officeAdmin: true } });
    if (!target || target.role === 'OWNER') return NextResponse.json({ ok: false, error: 'invalid target' }, { status: 400 });
    if (current.role === 'OFFICE_ADMIN') {
      if (target.role !== 'ADVISOR' || target.advisor?.officeId !== (await prisma.officeAdmin.findUnique({ where: { userId: current.id } }))?.officeId) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }
    const updated = await prisma.user.update({ where: { id: userId }, data: { blocked: true } });
    return NextResponse.json({ ok: true, user: { id: updated.id, blocked: updated.blocked } });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}