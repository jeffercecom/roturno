import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { todayStart } from '@/lib/presence';

export async function GET(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  const advisor = await prisma.advisor.findUnique({ where: { userId: current.id } });
  if (!advisor) return NextResponse.json({ ok: false, error: 'advisor profile not found' }, { status: 404 });
  const requests = await prisma.officeChangeRequest.findMany({
    where: { advisorId: advisor.id },
    include: { fromOffice: true, toOffice: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ ok: true, data: requests });
}

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { officeId } = await req.json();
    if (!officeId) return NextResponse.json({ ok: false, error: 'officeId required' }, { status: 400 });
    const advisor = await prisma.advisor.findUnique({
      where: { userId: current.id },
      include: { presences: { where: { date: { equals: todayStart() }, status: 'ACTIVE' } } },
    });
    if (!advisor) return NextResponse.json({ ok: false, error: 'advisor profile not found' }, { status: 404 });
    if (advisor.presences.length > 0) return NextResponse.json({ ok: false, error: 'No puedes solicitar cambio de sede durante un turno ACTIVO.' }, { status: 400 });
    if (advisor.officeId === officeId) return NextResponse.json({ ok: false, error: 'Esa ya es tu sede actual.' }, { status: 400 });
    const office = await prisma.office.findUnique({ where: { id: officeId } });
    if (!office) return NextResponse.json({ ok: false, error: 'sede not found' }, { status: 404 });
    const pending = await prisma.officeChangeRequest.findFirst({ where: { advisorId: advisor.id, status: 'PENDING' } });
    if (pending) return NextResponse.json({ ok: false, error: 'Ya tienes una solicitud pendiente.' }, { status: 409 });

    const request = await prisma.officeChangeRequest.create({ data: { advisorId: advisor.id, fromOfficeId: advisor.officeId, toOfficeId: officeId } });
    return NextResponse.json({ ok: true, request });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
