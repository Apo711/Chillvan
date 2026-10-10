import { Router, Response } from 'express';
import { db, AchievementPointLog, MonthlyHonor, MonthlyReward } from '../db.js';
import { authMiddleware, requireTeacher, AuthRequest } from '../auth.js';

const router = Router();

// ================= ACHIEVEMENT POINTS =================

// Get achievement logs (Student gets own logs, Teacher gets by student or class)
router.get('/points', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { studentId, classId } = req.query;
  let logs = db.getAchievementLogs();

  if (user.role === 'student') {
    logs = logs.filter(l => l.studentId === user.id);
  } else {
    if (studentId && typeof studentId === 'string') {
      logs = logs.filter(l => l.studentId === studentId);
    }
    if (classId && typeof classId === 'string' && classId !== 'all') {
      logs = logs.filter(l => l.classId === classId);
    }
  }

  const students = db.getUsers();
  const result = logs.map(l => {
    const s = students.find(u => u.id === l.studentId);
    return {
      ...l,
      studentName: s?.fullName || 'Học sinh',
      studentUsername: s?.username,
    };
  });

  res.json(result);
});

// Award points to a student (Teacher only)
router.post('/points/award', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { studentId, points, category, reason } = req.body;

  if (!studentId || points === undefined || !reason) {
    return res.status(400).json({ error: 'Vui lòng chọn học sinh, số điểm và lý do cộng điểm' });
  }

  const student = db.getUsers().find(u => u.id === studentId && u.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const numPoints = Number(points);
  if (isNaN(numPoints)) {
    return res.status(400).json({ error: 'Số điểm không hợp lệ' });
  }

  const log: AchievementPointLog = {
    id: `log-${Date.now()}`,
    studentId,
    classId: student.classId || '',
    points: numPoints,
    category: category || 'other',
    reason: reason.trim(),
    teacherId: req.user!.id,
    createdAt: new Date().toISOString(),
  };

  db.addAchievementLog(log);

  // Calculate new total
  const total = db.getAchievementLogs()
    .filter(l => l.studentId === studentId)
    .reduce((sum, item) => sum + item.points, 0);

  res.json({
    message: `Đã cộng ${numPoints > 0 ? '+' : ''}${numPoints} điểm thành tích cho em ${student.fullName}!`,
    log,
    totalPoints: total,
  });
});

// ================= RACE TRACK (ĐƯỜNG ĐUA CHILL VĂN) =================

router.get('/race-track', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { classId } = req.query;

  const targetClassId = user.role === 'student' ? user.classId : (typeof classId === 'string' && classId !== 'all' ? classId : undefined);

  let students = db.getUsers().filter(u => u.role === 'student');
  if (targetClassId) {
    students = students.filter(s => s.classId === targetClassId);
  }

  const logs = db.getAchievementLogs();

  const milestones = [
    { level: 1, name: 'Vạch xuất phát', points: 0, icon: '🌱' },
    { level: 2, name: 'Khởi động', points: 25, icon: '📖' },
    { level: 3, name: 'Bứt phá', points: 60, icon: '⭐' },
    { level: 4, name: 'Tăng tốc', points: 120, icon: '🚀' },
    { level: 5, name: 'Về đích xuất sắc', points: 200, icon: '👑' },
    { level: 6, name: 'Cao thủ Chill Văn', points: 300, icon: '🏆' },
  ];

  const rankings = students.map(s => {
    const sLogs = logs.filter(l => l.studentId === s.id);
    const totalPoints = sLogs.reduce((sum, l) => sum + l.points, 0);

    // Determine current milestone reached
    let currentMilestone = milestones[0];
    let nextMilestone = milestones[1];
    for (let i = 0; i < milestones.length; i++) {
      if (totalPoints >= milestones[i].points) {
        currentMilestone = milestones[i];
        nextMilestone = milestones[i + 1] || milestones[i];
      }
    }

    // Calculate percentage along the track (max 300 points)
    const progressPercent = Math.min(100, Math.round((totalPoints / 300) * 100));

    return {
      id: s.id,
      name: s.fullName,
      username: s.username,
      classId: s.classId,
      totalPoints,
      progressPercent,
      currentMilestone,
      nextMilestone,
      isMe: s.id === user.id,
    };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  res.json({
    milestones,
    rankings,
  });
});

// ================= MONTHLY HONORS (BẢNG VINH DANH) =================

router.get('/honors', authMiddleware, (req: AuthRequest, res: Response) => {
  const { month, classId } = req.query;
  let honors = db.getMonthlyHonors();

  if (month && typeof month === 'string') {
    honors = honors.filter(h => h.month === month);
  }

  if (req.user!.role === 'student') {
    // Show honors for student's class
    honors = honors.filter(h => h.classId === req.user!.classId);
  } else if (classId && typeof classId === 'string' && classId !== 'all') {
    honors = honors.filter(h => h.classId === classId);
  }

  const students = db.getUsers();
  const classes = db.getClasses();

  const formatted = honors.map(h => {
    const s = students.find(u => u.id === h.studentId);
    const c = classes.find(cl => cl.id === h.classId);
    return {
      ...h,
      studentName: s?.fullName || 'Học sinh',
      studentUsername: s?.username,
      className: c?.name || 'Lớp học',
    };
  });

  res.json(formatted);
});

// Add monthly honor (Teacher only)
router.post('/honors', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { month, classId, category, studentId, teacherComment } = req.body;

  if (!month || !classId || !category || !studentId) {
    return res.status(400).json({ error: 'Vui lòng chọn tháng, lớp, danh hiệu và học sinh vinh danh' });
  }

  const student = db.getUsers().find(u => u.id === studentId && u.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Không tìm thấy học sinh' });
  }

  const newHonor: MonthlyHonor = {
    id: `honor-${Date.now()}`,
    month: month.trim(),
    classId,
    category,
    studentId,
    teacherComment: (teacherComment || '').trim(),
    awardedAt: new Date().toISOString(),
  };

  db.addMonthlyHonor(newHonor);
  res.status(201).json({ message: 'Đã thêm vinh danh thành công!', honor: newHonor });
});

// Delete monthly honor (Teacher only)
router.delete('/honors/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.deleteMonthlyHonor(id);
  res.json({ message: 'Đã xóa vinh danh thành công' });
});

// ================= MONTHLY REWARDS =================

router.get('/rewards', authMiddleware, (req: AuthRequest, res: Response) => {
  const rewards = db.getRewards();
  res.json(rewards);
});

// Create reward (Teacher only)
router.post('/rewards', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { title, description, conditionText, minPoints, quantity, availableMonth, imageUrl } = req.body;

  if (!title || !description || !conditionText) {
    return res.status(400).json({ error: 'Vui lòng nhập tên phần thưởng, mô tả và điều kiện nhận quà' });
  }

  const newReward: MonthlyReward = {
    id: `rew-${Date.now()}`,
    title: title.trim(),
    description: description.trim(),
    conditionText: conditionText.trim(),
    minPoints: minPoints ? Number(minPoints) : undefined,
    quantity: quantity ? Number(quantity) : undefined,
    availableMonth: availableMonth || `${new Date().getMonth() + 1}/${new Date().getFullYear()}`,
    imageUrl: imageUrl || '',
    active: true,
    createdAt: new Date().toISOString(),
  };

  db.addReward(newReward);
  res.status(201).json(newReward);
});

// Update reward (Teacher only)
router.put('/rewards/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getRewards().find(r => r.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy phần thưởng' });
  }

  const { title, description, conditionText, minPoints, quantity, availableMonth, active } = req.body;
  const updates: Partial<MonthlyReward> = {};
  if (title) updates.title = title.trim();
  if (description) updates.description = description.trim();
  if (conditionText) updates.conditionText = conditionText.trim();
  if (minPoints !== undefined) updates.minPoints = Number(minPoints);
  if (quantity !== undefined) updates.quantity = Number(quantity);
  if (availableMonth) updates.availableMonth = availableMonth;
  if (active !== undefined) updates.active = Boolean(active);

  db.updateReward(id, updates);
  res.json({ message: 'Cập nhật phần thưởng thành công', reward: { ...existing, ...updates } });
});

// Delete reward (Teacher only)
router.delete('/rewards/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  db.deleteReward(id);
  res.json({ message: 'Đã xóa phần thưởng thành công' });
});

export default router;
