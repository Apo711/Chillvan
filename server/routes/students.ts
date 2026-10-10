import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../db.js';
import { authMiddleware, requireTeacher, AuthRequest } from '../auth.js';

const router = Router();

// Helper to sanitize username
function sanitizeUsername(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

// Get students list (Teacher gets list, with profile extras and achievement total points)
router.get('/', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { classId, search } = req.query;
  let students = db.getUsers().filter(u => u.role === 'student');

  if (classId && typeof classId === 'string' && classId !== 'all') {
    students = students.filter(s => s.classId === classId);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    students = students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      (s.username && s.username.toLowerCase().includes(q))
    );
  }

  const classes = db.getClasses();
  const profiles = db.getStudentProfiles();
  const logs = db.getAchievementLogs();

  const formatted = students.map(s => {
    const sClass = classes.find(c => c.id === s.classId);
    const profile = profiles.find(p => p.studentId === s.id);
    const totalPoints = logs
      .filter(l => l.studentId === s.id)
      .reduce((sum, item) => sum + item.points, 0);

    return {
      id: s.id,
      fullName: s.fullName,
      username: s.username,
      classId: s.classId,
      className: sClass?.name || 'Chưa xếp lớp',
      status: s.status,
      avatarUrl: s.avatarUrl,
      createdAt: s.createdAt,
      totalPoints,
      profileExtra: profile || {
        strengths: '',
        needsImprovement: '',
        monthlyGoals: '',
      },
    };
  });

  res.json(formatted);
});

// Create student account (Teacher only)
router.post('/', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { fullName, username, password, classId } = req.body;

  if (!fullName || !password || !classId) {
    return res.status(400).json({ error: 'Vui lòng nhập họ tên, mật khẩu và chọn lớp học' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải từ 6 ký tự trở lên' });
  }

  // Validate class
  const classExists = db.getClasses().find(c => c.id === classId);
  if (!classExists) {
    return res.status(400).json({ error: 'Lớp học được chọn không hợp lệ' });
  }

  // If username provided, sanitize it; else generate from name
  let cleanUser = username ? sanitizeUsername(username) : sanitizeUsername(fullName);
  if (!cleanUser || cleanUser.length < 3) {
    cleanUser = `hs${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Ensure unique username
  const existingUsers = db.getUsers();
  let finalUsername = cleanUser;
  let counter = 1;
  while (existingUsers.some(u => u.username?.toLowerCase() === finalUsername.toLowerCase())) {
    finalUsername = `${cleanUser}${counter++}`;
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newStudent: User = {
    id: `student-${Date.now()}`,
    role: 'student',
    username: finalUsername,
    fullName: fullName.trim(),
    passwordHash,
    classId,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  db.addUser(newStudent);

  // Initialize empty extra profile
  db.setStudentProfileExtra({
    studentId: newStudent.id,
    strengths: 'Chăm chỉ, tích cực tham gia các bài học.',
    needsImprovement: 'Rèn luyện thêm kỹ năng diễn đạt văn chương mượt mà.',
    monthlyGoals: 'Hoàn thành tốt các bài tập được giao.',
    updatedAt: new Date().toISOString(),
  });

  res.status(201).json({
    message: 'Tạo tài khoản học sinh thành công!',
    student: {
      id: newStudent.id,
      fullName: newStudent.fullName,
      username: newStudent.username,
      classId: newStudent.classId,
      className: classExists.name,
      status: newStudent.status,
    },
    credentialsGiven: {
      username: finalUsername,
      initialPassword: password,
    },
  });
});

// Update student info (Teacher only)
router.put('/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getUsers().find(u => u.id === id && u.role === 'student');
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const { fullName, classId, status } = req.body;
  const updates: Partial<User> = {};

  if (fullName) updates.fullName = fullName.trim();
  if (classId) {
    const cExists = db.getClasses().find(c => c.id === classId);
    if (cExists) updates.classId = classId;
  }
  if (status && (status === 'active' || status === 'locked')) {
    updates.status = status;
  }

  db.updateUser(id, updates);
  res.json({ message: 'Cập nhật thông tin học sinh thành công', student: { ...existing, ...updates } });
});

// Reset student password (Teacher resets)
router.post('/:id/reset-password', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const student = db.getUsers().find(u => u.id === id && u.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(newPassword, salt);
  db.updateUser(id, { passwordHash });

  res.json({
    message: `Đã đặt lại mật khẩu cho học sinh ${student.fullName} thành công!`,
    username: student.username,
  });
});

// Update Student Profile Extra (Strengths, Needs Improvement, Monthly Goals) (Teacher only)
router.put('/:id/profile-extra', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const student = db.getUsers().find(u => u.id === id && u.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const { strengths, needsImprovement, monthlyGoals } = req.body;
  db.setStudentProfileExtra({
    studentId: id,
    strengths: (strengths || '').trim(),
    needsImprovement: (needsImprovement || '').trim(),
    monthlyGoals: (monthlyGoals || '').trim(),
    updatedAt: new Date().toISOString(),
  });

  res.json({ message: 'Đã lưu nhận xét và mục tiêu của học sinh thành công!' });
});

// Get Student Personal Profile (Student sees their own, or Teacher inspects student)
router.get('/:id/profile', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const currentUser = req.user!;

  if (currentUser.role === 'student' && currentUser.id !== id) {
    return res.status(403).json({ error: 'Bạn không có quyền xem hồ sơ cá nhân của học sinh khác' });
  }

  const student = db.getUsers().find(u => u.id === id && u.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const sClass = db.getClasses().find(c => c.id === student.classId);
  const profileExtra = db.getStudentProfiles().find(p => p.studentId === student.id) || {
    studentId: student.id,
    strengths: '',
    needsImprovement: '',
    monthlyGoals: '',
    updatedAt: new Date().toISOString(),
  };

  const allLogs = db.getAchievementLogs().filter(l => l.studentId === student.id);
  const totalPoints = allLogs.reduce((sum, l) => sum + l.points, 0);

  const completedSubmissions = db.getSubmissions().filter(s => s.studentId === student.id && s.status === 'graded' && s.isPublished);

  const honors = db.getMonthlyHonors().filter(h => h.studentId === student.id);

  res.json({
    id: student.id,
    fullName: student.fullName,
    username: student.username,
    className: sClass?.name || 'Chưa xếp lớp',
    grade: sClass?.grade,
    avatarUrl: student.avatarUrl,
    totalPoints,
    completedAssignmentsCount: completedSubmissions.length,
    recentSubmissions: completedSubmissions.slice(-5).map(s => {
      const a = db.getAssignments().find(item => item.id === s.assignmentId);
      return {
        id: s.id,
        assignmentTitle: a?.title || 'Bài tập',
        finalScore: s.finalScore,
        maxScore: a?.maxScore || 10,
        teacherFeedback: s.teacherFeedback,
        gradedAt: s.gradedAt,
      };
    }),
    profileExtra,
    honors,
    achievementLogs: allLogs.slice(0, 10),
  });
});

export default router;
