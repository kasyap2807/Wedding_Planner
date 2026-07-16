import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wedding_planner_secret_key_12345_super_secure_98765';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'webadmin' | 'admin' | 'family' | 'volunteer';
    name: string;
    email: string;
    weddingId?: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      role: 'webadmin' | 'admin' | 'family' | 'volunteer';
      name: string;
      email: string;
      weddingId?: string;
    };
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: Array<'webadmin' | 'admin' | 'family' | 'volunteer'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // webadmin can bypass standard roles to act on behalf of workspace roles
    if (req.user.role === 'webadmin' || roles.includes(req.user.role)) {
      next();
    } else {
      return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
    }
  };
};

export const getWeddingId = (req: AuthRequest): string | undefined => {
  if (req.user?.role === 'webadmin') {
    return (req.headers['x-wedding-id'] as string) || (req.query.weddingId as string) || undefined;
  }
  return req.user?.weddingId;
};
