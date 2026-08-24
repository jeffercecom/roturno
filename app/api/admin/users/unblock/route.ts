import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can unblock users' }, { status: 403 });
  const { userId } = await req.json();
  const user = await prisma.user.update({ where: { id: userId }, data: { blocked: false } });
  return NextResponse.json({ ok: true, user: { id: user.id, blocked: user.blocked } });
}