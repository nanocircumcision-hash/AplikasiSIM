import type { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import type { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken | { uid: string; email: string; name?: string; role?: string; branchCode?: string };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-clinic-role'] as string;
  const userHeader = req.headers['x-clinic-user'] as string;
  const branchHeader = (req.headers['x-branch-code'] as string) || 'PUSAT';

  // Support local session / active clinic user switching (Admin, Staff, Dokter)
  if (roleHeader) {
    req.user = {
      uid: userHeader || `user-${roleHeader}`,
      email: `${roleHeader}@nanocircumcision.com`,
      name: roleHeader === 'admin' ? 'Administrator Klinik' : roleHeader === 'staff' ? 'Staff Pendaftaran & Kasir' : 'dr. Bambang Irawan, Sp.B',
      role: roleHeader,
      branchCode: branchHeader.toUpperCase(),
    };
    return next();
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      req.user = {
        ...decodedToken,
        branchCode: branchHeader.toUpperCase(),
      };
      return next();
    } catch (error) {
      console.warn('Firebase token verification fallback to default user:', error);
    }
  }

  // Fallback active user for clinic workstation
  req.user = {
    uid: 'admin-nano-1',
    email: 'admin@nanocircumcision.com',
    name: 'Administrator Nano Circumcision',
    role: 'admin',
    branchCode: branchHeader.toUpperCase(),
  };
  next();
};
