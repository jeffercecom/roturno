import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { media } = await req.json();
    const advisor = await prisma.advisor.findUnique({ where: { userId: current.id } });
    if (!advisor || !Array.isArray(media) || media.length === 0) return NextResponse.json({ ok: false, error: 'media required' }, { status: 400 });
    const created = await prisma.photo.createMany({ data: media.filter((item: any) => item?.url).map((item: any) => ({ advisorId: advisor.id, url: item.url, mediaType: item.mediaType || 'IMAGE', reviewStatus: 'PENDING', approved: false })) });
    return NextResponse.json({ ok: true, count: created.count });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}