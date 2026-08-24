import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayStart } from '@/lib/presence';

async function canReview(userId: string, role: string, toOfficeId: string) {
  if (role === 'OWNER') return true;
  if (role !== 'OFFICE_ADMIN') return false;
  return Boolean(await prisma.officeAdmin.findFirst({ where: { userId, officeId: toOfficeId } }));
}

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const requests = await prisma.officeChangeRequest.findMany({
    where: { status: 'PENDING' },
    include: { advisor: { include: { photos: true, specialities: { include: { speciality: true } } } }, fromOffice: true, toOffice: true },
    orderBy: { createdAt: 'asc' },
  });
  const visible = current.role === 'OWNER' ? requests : requests.filter((request) => request.toOfficeId);
  const allowed = current.role === 'OWNER'
    ? visible
    : (await Promise.all(visible.map(async (request) => (await canReview(current.id, current.role, request.toOfficeId)) ? request : null))).filter(Boolean);
  return NextResponse.json({ ok: true, data: allowed });
}

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || !['OWNER', 'OFFICE_ADMIN'].includes(current.role)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { requestId, action } = await req.json();
    if (!requestId || !['APPROVE', 'REJECT'].includes(action)) return NextResponse.json({ ok: false, error: 'requestId and valid action required' }, { status: 400 });
    const request = await prisma.officeChangeRequest.findUnique({ where: { id: requestId } });
    if (!request || request.status !== 'PENDING') return NextResponse.json({ ok: false, error: 'request not pending' }, { status: 404 });
    if (!(await canReview(current.id, current.role, request.toOfficeId))) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });

    if (action === 'APPROVE') {
      const active = await prisma.dailyPresence.findFirst({ where: { advisorId: request.advisorId, date: { equals: todayStart() }, status: 'ACTIVE' } });
      if (active) return NextResponse.json({ ok: false, error: 'No se puede aprobar mientras el asesor está ACTIVO.' }, { status: 400 });
      await prisma.advisor.update({ where: { id: request.advisorId }, data: { officeId: request.toOfficeId } });
    }
    const updated = await prisma.officeChangeRequest.update({ where: { id: request.id }, data: { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', reviewedById: current.id } });
    return NextResponse.json({ ok: true, request: updated });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
