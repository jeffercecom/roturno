import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const ownAdmin = current.role === 'OFFICE_ADMIN' ? await prisma.officeAdmin.findUnique({ where: { userId: current.id } }) : null;
  const users = await prisma.user.findMany({
    where: current.role === 'OWNER' ? { role: { not: 'OWNER' } } : { role: 'ADVISOR', advisor: { officeId: ownAdmin?.officeId || '' } },
    include: { advisor: true, officeAdmin: { include: { office: true } } },
    orderBy: { username: 'asc' },
  });
  return NextResponse.json({ ok: true, data: users });
}

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { username, password, name, role = 'ADVISOR', officeId } = await req.json();
    if (!username || !password || !name) return NextResponse.json({ ok: false, error: 'username, password and name required' }, { status: 400 });
    if (!['ADVISOR', 'OFFICE_ADMIN'].includes(role)) return NextResponse.json({ ok: false, error: 'invalid role' }, { status: 400 });
    if (current.role === 'OFFICE_ADMIN' && !['ADVISOR', 'OFFICE_ADMIN'].includes(role)) return NextResponse.json({ ok: false, error: 'invalid role for office admin' }, { status: 403 });
    const ownAdmin = current.role === 'OFFICE_ADMIN' ? await prisma.officeAdmin.findUnique({ where: { userId: current.id } }) : null;
    const assignedOfficeId = current.role === 'OFFICE_ADMIN' ? ownAdmin?.officeId : officeId || null;
    if (current.role === 'OFFICE_ADMIN' && !assignedOfficeId) return NextResponse.json({ ok: false, error: 'office assignment not found' }, { status: 403 });
    if (role === 'OFFICE_ADMIN' && !assignedOfficeId) return NextResponse.json({ ok: false, error: 'officeId required for office admin' }, { status: 400 });
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return NextResponse.json({ ok: false, error: 'username already exists' }, { status: 409 });
    const user = await prisma.user.create({ data: { username, password, role } });
    if (role === 'ADVISOR') {
      const advisor = await prisma.advisor.create({ data: { userId: user.id, name, officeId: assignedOfficeId } });
      return NextResponse.json({ ok: true, user: { id: user.id, username: user.username }, advisor });
    }
    const officeAdmin = await prisma.officeAdmin.create({ data: { userId: user.id, officeId: assignedOfficeId, substitute: true } });
    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username }, officeAdmin });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}