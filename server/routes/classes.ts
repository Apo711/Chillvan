import { Router, Response } from 'express';
import { db, ClassItem } from '../db.js';
import { authMiddleware, requireTeacher, AuthRequest } from '../auth.js';

const router = Router();

// Get classes
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const allUsers = db.getUsers();

  if (user.role === 'teacher') {
    const classes = db.getClasses().map(c => {
      const studentCount = allUsers.filter(u => u.role === 'student' && u.classId === c.id).length;
      return {
        ...c,
        studentCount,
      };
    });
    return res.json(classes);
  } else {
    // Student only sees their class
    const myClass = db.getClasses().find(c => c.id === user.classId);
    if (!myClass) {
      return res.json([]);
    }
    const studentCount = allUsers.filter(u => u.role === 'student' && u.classId === myClass.id).length;
    return res.json([{ ...myClass, studentCount }]);
  }
});

// Create class (Teacher)
router.post('/', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { name, grade, schoolYear, description } = req.body;
  if (!name || !grade) {
    return res.status(400).json({ error: 'Vui lòng nhập tên lớp và khối lớp' });
  }

  const newClass: ClassItem = {
    id: `class-${Date.now()}`,
    name: name.trim(),
    grade: String(grade).trim(),
    schoolYear: (schoolYear || '2026 - 2027').trim(),
    description: (description || '').trim(),
    teacherId: req.user!.id,
    createdAt: new Date().toISOString(),
  };

  db.addClass(newClass);
  res.status(201).json(newClass);
});

// Update class (Teacher)
router.put('/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getClasses().find(c => c.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy lớp học' });
  }

  const { name, grade, schoolYear, description } = req.body;
  const updates: Partial<ClassItem> = {};
  if (name) updates.name = name.trim();
  if (grade) updates.grade = String(grade).trim();
  if (schoolYear) updates.schoolYear = schoolYear.trim();
  if (description !== undefined) updates.description = description.trim();

  db.updateClass(id, updates);
  res.json({ message: 'Cập nhật thông tin lớp học thành công', class: { ...existing, ...updates } });
});

// Delete class (Teacher)
router.delete('/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const studentsInClass = db.getUsers().filter(u => u.role === 'student' && u.classId === id);
  if (studentsInClass.length > 0) {
    return res.status(400).json({ error: `Không thể xóa lớp vì đang có ${studentsInClass.length} học sinh trong lớp này. Hãy chuyển học sinh trước!` });
  }

  db.deleteClass(id);
  res.json({ message: 'Đã xóa lớp học thành công' });
});

export default router;
