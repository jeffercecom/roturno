import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'OWNER') return NextResponse.json({ ok: false, error: 'only owner can create offices' }, { status: 403 });
  try {
    const { name, address, adminUserId } = await req.json();
    if (!name?.trim()) return NextResponse.json({ ok: false, error: 'name required' }, { status: 400 });
    const office = await prisma.office.create({ data: { name: name.trim(), address: address?.trim() || null, openToday: false } });
    if (adminUserId) {
      const admin = await prisma.user.findUnique({ where: { id: adminUserId } });
      if (!admin || admin.role !== 'OFFICE_ADMIN') return NextResponse.json({ ok: false, error: 'invalid office admin' }, { status: 400 });
      await prisma.officeAdmin.update({ where: { userId: adminUserId }, data: { officeId: office.id } });
    }
    return NextResponse.json({ ok: true, office });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
