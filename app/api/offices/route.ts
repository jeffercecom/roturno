import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const offices = await prisma.office.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ ok: true, data: offices });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
