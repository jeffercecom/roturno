import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken, createSetCookieHeader } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, email, password } = body;
    const login = String(username || email || '').trim();
    if (!login || !password) return NextResponse.json({ ok: false, error: 'username and password required' }, { status: 400 });

    const user = await prisma.user.findFirst({ where: { OR: [{ username: login }, { email: login }] }, include: { officeAdmin: true } });
    if (!user || user.blocked || user.officeAdmin?.blocked || user.password !== password) return NextResponse.json({ ok: false, error: 'invalid credentials or blocked user' }, { status: 401 });

    const token = signToken({ userId: user.id });
    const res = NextResponse.json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    res.headers.set('Set-Cookie', createSetCookieHeader(token));
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
