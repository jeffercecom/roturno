import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: Request) {
  const user = await getCurrentUser(req);
  if (!user) return NextResponse.json({ ok: false, user: null }, { status: 401 });
  const officeAdmin = user.officeAdmin ? await (await import('@/lib/prisma')).prisma.officeAdmin.findUnique({ where: { userId: user.id }, include: { office: true } }) : null;
  return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role, officeName: officeAdmin?.office.name || null } });
}
