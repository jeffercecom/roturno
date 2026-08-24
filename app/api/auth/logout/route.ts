import { NextResponse } from 'next/server';
import { serialize as serializeCookie } from 'cookie';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', serializeCookie('asesores_token', '', { path: '/', maxAge: 0 }));
  return res;
}
