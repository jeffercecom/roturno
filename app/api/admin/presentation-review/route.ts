import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can review presentations' }, { status: 403 });
  try {
    const { advisorId, presentation, action } = await req.json();
    if (!advisorId || !['APPROVED', 'REJECTED'].includes(action)) return NextResponse.json({ ok: false, error: 'invalid presentation review' }, { status: 400 });
    const advisor = await prisma.advisor.update({ where: { id: advisorId }, data: { ...(typeof presentation === 'string' ? { presentation: presentation.trim() } : {}), presentationStatus: action } });
    return NextResponse.json({ ok: true, advisor });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}