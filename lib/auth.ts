import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { parse as parseCookie, serialize as serializeCookie } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'asesores_token';

export function signToken(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}

export function getTokenFromReq(req: Request) {
  const cookie = req.headers.get('cookie') || '';
  const parsed = parseCookie(cookie || '');
  return parsed[COOKIE_NAME] || null;
}

export function createSetCookieHeader(token: string) {
  return serializeCookie(COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });
}

export async function getCurrentUser(req: Request) {
  const token = getTokenFromReq(req);
  if (!token) return null;
  const data = verifyToken(token);
  if (!data || !data.userId) return null;
  const user = await prisma.user.findUnique({ where: { id: data.userId }, include: { officeAdmin: true } });
  if (!user || user.blocked || user.officeAdmin?.blocked) return null;
  return user;
}
