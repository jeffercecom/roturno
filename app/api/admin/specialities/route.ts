import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const data = await prisma.speciality.findMany({ where: { approved: false }, orderBy: { name: 'asc' } });
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { specialityId } = await req.json();
    if (!specialityId) return NextResponse.json({ ok: false, error: 'specialityId required' }, { status: 400 });
    const speciality = await prisma.speciality.update({ where: { id: specialityId }, data: { approved: true } });
    return NextResponse.json({ ok: true, speciality });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
