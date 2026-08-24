import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { advisorId } = await req.json();
    if (!advisorId) return NextResponse.json({ ok: false, error: 'advisorId required' }, { status: 400 });

    const updated = await prisma.advisor.update({ where: { id: advisorId }, data: { approved: true } });
    return NextResponse.json({ ok: true, advisor: { id: updated.id, approved: updated.approved } });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
