import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSetCookieHeader, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, presentation, username, email, password, inPerson, virtual, atHome, age, eyeColor, skinColor, hairColor, hairType, heightCm, customAttributes, specialityIds, customSpecialities, photos } = body;
    if (!name || !username || !password || password.length < 6) return NextResponse.json({ ok: false, error: 'name, username and a password of at least 6 characters are required' }, { status: 400 });

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ username }, ...(email ? [{ email }] : [])] } });
    if (existingUser) return NextResponse.json({ ok: false, error: 'username already registered' }, { status: 409 });

    const user = await prisma.user.create({ data: { username, email: email || null, password, role: 'ADVISOR' } });

    const advisor = await prisma.advisor.create({ data: { userId: user.id, name, presentation: presentation?.trim() || null, presentationStatus: 'PENDING', inPerson: Boolean(inPerson), virtual: Boolean(virtual), atHome: Boolean(atHome), age: age ? Number(age) : null, eyeColor: eyeColor || null, skinColor: skinColor || null, hairColor: hairColor || null, hairType: hairType || null, heightCm: heightCm ? Number(heightCm) : null, approved: false, customAttributes: { create: (customAttributes || []).filter((item: any) => item?.name && item?.value).map((item: any) => ({ name: String(item.name), value: String(item.value) })) } } });

    const specialityNames = Array.isArray(customSpecialities) ? customSpecialities : [];
    const customIds: string[] = [];
    for (const rawName of specialityNames) {
      const specialityName = String(rawName).trim();
      if (!specialityName) continue;
      const speciality = await prisma.speciality.upsert({ where: { name: specialityName }, update: {}, create: { name: specialityName, approved: false } });
      customIds.push(speciality.id);
    }

    const allSpecialityIds = [...new Set([...(Array.isArray(specialityIds) ? specialityIds : []), ...customIds])];
    for (const specialityId of allSpecialityIds) {
      await prisma.advisorSpeciality.create({ data: { advisorId: advisor.id, specialityId, reviewStatus: customIds.includes(specialityId) ? 'PENDING' : 'APPROVED' } });
    }

    if (Array.isArray(photos)) {
      for (const p of photos) {
        await prisma.photo.create({ data: { advisorId: advisor.id, url: p.url || p, mediaType: p.mediaType || 'IMAGE', isFace: false, isMain: false, approved: false, reviewStatus: 'PENDING' } });
      }
    }

    const token = signToken({ userId: user.id });
    const response = NextResponse.json({ ok: true, advisor: { id: advisor.id, name: advisor.name, approved: advisor.approved } });
    response.headers.set('Set-Cookie', createSetCookieHeader(token));
    return response;
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
