import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string; name?: string; role?: string; branchCode?: string };
}

const SESSION_SECRET = process.env.SESSION_SECRET || process.env.PGPASSWORD || 'nano-clinic-medical-secure-key-2026';

export interface SessionPayload {
  uid: string;
  role: string;
  email: string;
  name?: string;
  branchCode: string;
  exp: number;
}

/**
 * Creates a cryptographically signed HMAC SHA-256 session token.
 */
export function createSessionToken(user: { uid?: string; id?: string | number; role?: string; email?: string; name?: string; fullName?: string; branchCode?: string }): string {
  const payload: SessionPayload = {
    uid: String(user.uid || user.id || 'admin'),
    role: String(user.role || 'staff'),
    email: String(user.email || ''),
    name: String(user.fullName || user.name || 'Pengguna Klinik'),
    branchCode: String(user.branchCode || 'PUSAT').toUpperCase(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
}

/**
 * Verifies the HMAC SHA-256 signature and expiration of a session token.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== 'string' || !token.includes('.')) return null;
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
    if (signature !== expectedSig) return null;

    const decodedStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(decodedStr);

    if (!payload.exp || payload.exp < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Strict authentication middleware for medical data privacy.
 * Rejects unauthenticated requests with HTTP 401 Unauthorized.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const sessionTokenHeader = req.headers['x-session-token'] as string;
  const branchHeader = (req.headers['x-branch-code'] as string) || 'PUSAT';

  // 1. Check Bearer Token or x-session-token
  const rawToken = (authHeader && authHeader.startsWith('Bearer ')) 
    ? authHeader.split('Bearer ')[1].trim()
    : (sessionTokenHeader || '').trim();

  if (rawToken) {
    // Try custom HMAC signed session token
    const verifiedSession = verifySessionToken(rawToken);
    if (verifiedSession) {
      req.user = {
        uid: verifiedSession.uid,
        email: verifiedSession.email,
        name: verifiedSession.name,
        role: verifiedSession.role,
        branchCode: verifiedSession.branchCode || branchHeader.toUpperCase(),
      };
      return next();
    }

    // Try Firebase ID token if configured
    try {
      const decodedFirebase = await adminAuth.verifyIdToken(rawToken);
      req.user = {
        ...decodedFirebase,
        branchCode: branchHeader.toUpperCase(),
      };
      return next();
    } catch {
      // Token invalid or failed verification
    }
  }

  // 2. Reject all unauthenticated requests to prevent medical data leaks
  return res.status(401).json({
    success: false,
    error: 'Akses Ditolak: Anda belum login atau sesi telah kedaluwarsa. Data medis pasien dilindungi.',
    code: 'UNAUTHORIZED'
  });
};
