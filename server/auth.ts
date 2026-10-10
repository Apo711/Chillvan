import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'chill-van-co-yen-thanh-secret-key-2026';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      classId: user.classId,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = db.getUsers().find(u => u.id === payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Người dùng không tồn tại' });
    }
    if (user.status === 'locked') {
      return res.status(403).json({ error: 'Tài khoản của bạn đang bị tạm khóa. Vui lòng liên hệ giáo viên!' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
  }
}

export function requireTeacher(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Chỉ giáo viên mới có quyền thực hiện chức năng này' });
  }
  next();
}

export function requireStudent(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'Chỉ học sinh mới có quyền thực hiện chức năng này' });
  }
  next();
}
