import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

function startOfWeek(date: Date) {
  const value = new Date(date);
  const day = value.getDay() || 7;
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - day + 1);
  return value;
}

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const url = new URL(req.url);
  const mode = url.searchParams.get('mode') || 'daily';
  const advisorId = current.role === 'ADVISOR'
    ? (await prisma.advisor.findUnique({ where: { userId: current.id } }))?.id
    : url.searchParams.get('advisorId');
  if (!advisorId) return NextResponse.json({ ok: false, error: 'advisorId required' }, { status: 400 });
  const now = new Date();
  let from = new Date(now);
  if (mode === 'weekly') from = startOfWeek(now);
  if (mode === 'monthly') { from = new Date(now.getFullYear(), now.getMonth(), 1); }
  if (mode === 'daily') from.setHours(0, 0, 0, 0);
  const rows = await prisma.dailyPresence.findMany({ where: { advisorId, date: { gte: from } }, orderBy: { date: 'desc' } });
  const totalMinutes = rows.reduce((sum, row) => sum + (row.checkInAt && row.checkOutAt ? Math.max(0, row.checkOutAt.getTime() - row.checkInAt.getTime()) / 60000 : 0), 0);
  return NextResponse.json({ ok: true, mode, data: rows, totalMinutes });
}
