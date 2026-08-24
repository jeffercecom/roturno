import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can manage categories' }, { status: 403 });
  return NextResponse.json({ ok: true, data: await prisma.serviceCategory.findMany({ include: { durations: true }, orderBy: { name: 'asc' } }) });
}

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can manage categories' }, { status: 403 });
  try {
    const { name, durations } = await req.json();
    if (!name?.trim()) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
    const category = await prisma.serviceCategory.create({ data: { name: name.trim(), durations: { create: (durations || []).filter((item: any) => Number(item.minutes) > 0).map((item: any) => ({ minutes: Number(item.minutes), price: Number(item.price) })) } }, include: { durations: true } });
    return NextResponse.json({ ok: true, category });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can assign categories' }, { status: 403 });
  const { advisorId, categoryId } = await req.json();
  const assignment = await prisma.advisorServiceCategory.upsert({ where: { advisorId_categoryId: { advisorId, categoryId } }, update: {}, create: { advisorId, categoryId } });
  return NextResponse.json({ ok: true, assignment });
}
