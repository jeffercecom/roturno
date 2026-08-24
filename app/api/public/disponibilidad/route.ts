import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { closeExpiredPresences } from '@/lib/presence';

export async function GET() {
  try {
    await closeExpiredPresences();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const advisors = await prisma.advisor.findMany({
      where: {
        approved: true,
        officeId: { not: null },
        presences: {
          some: {
            date: { gte: todayStart, lt: tomorrowStart },
            status: 'ACTIVE',
          },
        },
        photos: { some: { approved: true, reviewStatus: 'APPROVED' } },
      },
      include: {
        photos: { where: { approved: true, reviewStatus: 'APPROVED' } },
        office: true,
        specialities: { where: { reviewStatus: 'APPROVED', activeByAdvisor: true, hiddenByOwner: false, speciality: { approved: true } }, include: { speciality: true } },
        serviceCategories: { include: { category: { include: { durations: true } } } },
      },
    });

    const grouped = new Map<string, { id: string; name: string; advisors: any[] }>();
    for (const advisor of advisors) {
      const office = advisor.office!;
      if (!grouped.has(office.id)) grouped.set(office.id, { id: office.id, name: office.name, advisors: [] });
      grouped.get(office.id)!.advisors.push({ id: advisor.id, name: advisor.name, photo: advisor.photos.find((p) => p.isMain)?.url ?? advisor.photos[0]?.url ?? null, photos: advisor.photos.map((p) => ({ id: p.id, url: p.url, mediaType: p.mediaType, isMain: p.isMain })), specialities: advisor.specialities.map((s) => s.speciality.name), presentation: advisor.presentationStatus === 'APPROVED' ? advisor.presentation : null, serviceCategories: advisor.serviceCategories, attention: { inPerson: advisor.inPerson, virtual: advisor.virtual, atHome: advisor.atHome } });
    }
    const payload = Array.from(grouped.values());

    return NextResponse.json({ ok: true, message: payload.length ? undefined : 'En el momento la sede no está en servicio', data: payload });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
