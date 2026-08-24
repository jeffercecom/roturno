import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const advisor = await prisma.advisor.findUnique({ where: { userId: current.id } });
  if (!advisor) return NextResponse.json({ ok: false, error: 'advisor not found' }, { status: 404 });
  if (advisor.presentationStatus === 'APPROVED') return NextResponse.json({ ok: false, error: 'La presentación ya fue aprobada y solo puede modificarla el owner.' }, { status: 403 });
  const { presentation } = await req.json();
  if (typeof presentation !== 'string' || !presentation.trim()) return NextResponse.json({ ok: false, error: 'presentation required' }, { status: 400 });
  const updated = await prisma.advisor.update({ where: { id: advisor.id }, data: { presentation: presentation.trim(), presentationStatus: 'PENDING' } });
  return NextResponse.json({ ok: true, advisor: updated });
}