import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can approve photos' }, { status: 403 });
  try {
    const { photoId, approved } = await req.json();
    if (!photoId || typeof approved !== 'boolean') return NextResponse.json({ ok: false, error: 'photoId and approved required' }, { status: 400 });
    const photo = await prisma.photo.update({ where: { id: photoId }, data: { approved, reviewStatus: approved ? 'APPROVED' : 'REJECTED' } });
    return NextResponse.json({ ok: true, photo });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}