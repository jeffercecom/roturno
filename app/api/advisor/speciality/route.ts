import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { name } = await req.json();
    const advisor = await prisma.advisor.findUnique({ where: { userId: current.id } });
    if (!advisor || typeof name !== 'string' || !name.trim()) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
    const speciality = await prisma.speciality.upsert({ where: { name: name.trim() }, update: {}, create: { name: name.trim(), approved: false } });
    const relation = await prisma.advisorSpeciality.create({ data: { advisorId: advisor.id, specialityId: speciality.id, reviewStatus: 'PENDING' } });
    return NextResponse.json({ ok: true, relation });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}