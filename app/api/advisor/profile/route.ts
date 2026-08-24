import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const current = await getCurrentUser(req);
  if (!current || current.role !== 'ADVISOR') return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 403 });
  try {
    const body = await req.json();
    const advisor = await prisma.advisor.findUnique({ where: { userId: current.id } });
    if (!advisor) return NextResponse.json({ ok: false, error: 'advisor not found' }, { status: 404 });
    const updated = await prisma.advisor.update({
      where: { id: advisor.id },
      data: {
        inPerson: Boolean(body.inPerson), virtual: Boolean(body.virtual), atHome: Boolean(body.atHome),
        age: body.age === '' || body.age == null ? null : Number(body.age), eyeColor: body.eyeColor || null,
        skinColor: body.skinColor || null, hairColor: body.hairColor || null, hairType: body.hairType || null,
        heightCm: body.heightCm === '' || body.heightCm == null ? null : Number(body.heightCm),
      },
    });
    if (Array.isArray(body.customAttributes)) {
      await prisma.advisorAttribute.deleteMany({ where: { advisorId: advisor.id } });
      await prisma.advisorAttribute.createMany({ data: body.customAttributes.filter((item: any) => item?.name && item?.value).map((item: any) => ({ advisorId: advisor.id, name: String(item.name), value: String(item.value) })) });
    }
    return NextResponse.json({ ok: true, advisor: updated });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
