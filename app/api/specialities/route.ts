import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const list = await prisma.speciality.findMany({ where: { approved: true }, orderBy: { name: 'asc' } });
    return NextResponse.json({ ok: true, data: list });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
