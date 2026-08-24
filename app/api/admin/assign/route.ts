import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const { advisorId, officeId } = await req.json();
    if (!advisorId || !officeId) return NextResponse.json({ ok: false, error: 'advisorId and officeId required' }, { status: 400 });

    // check permission: owner or office admin of the target office
    if (current.role !== 'OWNER') {
      const isAdmin = await prisma.officeAdmin.findFirst({ where: { userId: current.id, officeId } });
      if (!isAdmin) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const advisor = await prisma.advisor.findUnique({
      where: { id: advisorId },
      include: {
        presences: {
          where: {
            date: { equals: today },
            status: 'ACTIVE',
          },
        },
      },
    });

    if (advisor && advisor.presences.length > 0) {
      return NextResponse.json({ ok: false, error: 'El asesor está en turno ACTIVO y no puede cambiar de sede.' }, { status: 400 });
    }

    const updated = await prisma.advisor.update({ where: { id: advisorId }, data: { officeId } });
    return NextResponse.json({ ok: true, advisor: { id: updated.id, officeId: updated.officeId } });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
