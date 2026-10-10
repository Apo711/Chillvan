import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../db.js';
import { generateToken, authMiddleware, AuthRequest } from '../auth.js';

const router = Router();

// Check system status
router.get('/status', (req: Request, res: Response) => {
  const teachers = db.getUsers().filter(u => u.role === 'teacher');
  res.json({
    hasTeacher: teachers.length > 0,
    teacherCount: teachers.length,
    studentCount: db.getUsers().filter(u => u.role === 'student').length,
  });
});

// Setup initial teacher if none exists, or with security key
router.post('/setup-teacher', (req: Request, res: Response) => {
  const { email, fullName, password, securityKey } = req.body;
  const teachers = db.getUsers().filter(u => u.role === 'teacher');

  if (teachers.length > 0 && securityKey !== 'CHILL_VAN_ADMIN_SETUP_2026') {
    return res.status(403).json({ error: 'Hệ thống đã có tài khoản Giáo viên. Để tạo thêm, vui lòng liên hệ quản trị viên.' });
  }

  if (!email || !fullName || !password) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ email, họ tên và mật khẩu' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải từ 6 ký tự trở lên' });
  }

  const existing = db.getUsers().find(u => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email này đã được sử dụng' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newTeacher: User = {
    id: `teacher-${Date.now()}`,
    role: 'teacher',
    email: email.trim().toLowerCase(),
    fullName: fullName.trim(),
    passwordHash,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.addUser(newTeacher);

  const token = generateToken(newTeacher);
  res.json({
    message: 'Thiết lập tài khoản Giáo viên thành công!',
    token,
    user: {
      id: newTeacher.id,
      role: newTeacher.role,
      email: newTeacher.email,
      fullName: newTeacher.fullName,
      status: newTeacher.status,
    },
  });
});

// Teacher Login
router.post('/teacher/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập email và mật khẩu' });
  }

  const teacher = db.getUsers().find(u => u.role === 'teacher' && u.email?.toLowerCase() === email.trim().toLowerCase());
  if (!teacher) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
  }

  const isMatch = bcrypt.compareSync(password, teacher.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác' });
  }

  if (teacher.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản của bạn đang bị khóa' });
  }

  const token = generateToken(teacher);
  res.json({
    token,
    user: {
      id: teacher.id,
      role: teacher.role,
      email: teacher.email,
      fullName: teacher.fullName,
      status: teacher.status,
      avatarUrl: teacher.avatarUrl,
    },
  });
});

// Student Login (Username & Password)
router.post('/student/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const cleanUsername = username.trim().toLowerCase();
  const student = db.getUsers().find(u => u.role === 'student' && u.username?.toLowerCase() === cleanUsername);

  if (!student) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại thông tin cô đã cấp!' });
  }

  const isMatch = bcrypt.compareSync(password, student.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng. Vui lòng kiểm tra lại thông tin cô đã cấp!' });
  }

  if (student.status === 'locked') {
    return res.status(403).json({ error: 'Tài khoản của em đang bị khóa. Hãy liên hệ Cô Yến Thanh để được hỗ trợ nhé!' });
  }

  const studentClass = db.getClasses().find(c => c.id === student.classId);

  const token = generateToken(student);
  res.json({
    token,
    user: {
      id: student.id,
      role: student.role,
      username: student.username,
      fullName: student.fullName,
      classId: student.classId,
      className: studentClass ? studentClass.name : 'Chưa xếp lớp',
      status: student.status,
      avatarUrl: student.avatarUrl,
    },
  });
});

// Current User Profile
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const studentClass = user.classId ? db.getClasses().find(c => c.id === user.classId) : undefined;
  res.json({
    id: user.id,
    role: user.role,
    email: user.email,
    username: user.username,
    fullName: user.fullName,
    classId: user.classId,
    className: studentClass?.name,
    grade: studentClass?.grade,
    status: user.status,
    avatarUrl: user.avatarUrl,
  });
});

// Student change password
router.post('/student/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'student') {
    return res.status(403).json({ error: 'Chức năng chỉ dành cho học sinh' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
  }

  const isMatch = bcrypt.compareSync(currentPassword, req.user!.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(req.user!.id, { passwordHash: newHash });

  res.json({ message: 'Đổi mật khẩu thành công!' });
});

// Teacher change password
router.post('/teacher/change-password', authMiddleware, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'teacher') {
    return res.status(403).json({ error: 'Chức năng chỉ dành cho giáo viên' });
  }
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
  }

  const isMatch = bcrypt.compareSync(currentPassword, req.user!.passwordHash);
  if (!isMatch) {
    return res.status(400).json({ error: 'Mật khẩu hiện tại không chính xác' });
  }

  const salt = bcrypt.genSaltSync(10);
  const newHash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(req.user!.id, { passwordHash: newHash });

  res.json({ message: 'Đổi mật khẩu thành công!' });
});

// Teacher Forgot / Reset password request simulation
router.post('/teacher/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Vui lòng cung cấp email của bạn' });
  }
  const teacher = db.getUsers().find(u => u.role === 'teacher' && u.email?.toLowerCase() === email.trim().toLowerCase());
  if (!teacher) {
    return res.status(404).json({ error: 'Không tìm thấy tài khoản giáo viên với email này' });
  }

  // Generate a safe temporary recovery reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  // In a live system, this would be sent to email; for smooth testing we return confirmation and allow immediate reset
  res.json({
    message: `Mã xác thực khôi phục mật khẩu đã được tạo cho email ${email}. (Mã demo: ${resetCode})`,
    resetCode,
  });
});

export default router;
