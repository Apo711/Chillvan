import { Router, Response } from 'express';
import { db, Assignment, Question } from '../db.js';
import { authMiddleware, requireTeacher, AuthRequest } from '../auth.js';

const router = Router();

// List assignments
router.get('/', authMiddleware, (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const allAssignments = db.getAssignments();
  const allSubmissions = db.getSubmissions();
  const classes = db.getClasses();
  const users = db.getUsers();

  if (user.role === 'teacher') {
    const { classId } = req.query;
    let list = allAssignments;
    if (classId && typeof classId === 'string' && classId !== 'all') {
      list = list.filter(a => a.classId === classId);
    }

    const result = list.map(a => {
      const classItem = classes.find(c => c.id === a.classId);
      const totalStudents = users.filter(u => u.role === 'student' && u.classId === a.classId).length;
      const submissionsForA = allSubmissions.filter(s => s.assignmentId === a.id);
      const submittedCount = submissionsForA.filter(s => s.status === 'submitted' || s.status === 'graded').length;
      const gradedCount = submissionsForA.filter(s => s.status === 'graded').length;
      const pendingGradingCount = submissionsForA.filter(s => s.status === 'submitted').length;

      return {
        ...a,
        className: classItem?.name || 'Lớp học',
        totalStudents,
        submittedCount,
        gradedCount,
        pendingGradingCount,
      };
    });
    return res.json(result);
  } else {
    // Student: only assignments for their class
    const studentClassId = user.classId;
    const assignmentsForClass = allAssignments.filter(a => a.classId === studentClassId && a.status !== 'draft');

    const result = assignmentsForClass.map(a => {
      const mySubmission = allSubmissions.find(s => s.assignmentId === a.id && s.studentId === user.id);
      let studentStatus: 'not_started' | 'draft' | 'submitted' | 'graded' = 'not_started';
      if (mySubmission) {
        studentStatus = mySubmission.status;
      }

      // Hide questions correct answers from student payload
      const sanitizedQuestions = a.questions.map(q => {
        const { correctAnswer, acceptedVariants, ...rest } = q;
        // If graded and published, student can view teacher explanation
        if (mySubmission?.status === 'graded' && mySubmission.isPublished) {
          return { ...rest, correctAnswer, acceptedVariants };
        }
        return rest;
      });

      return {
        ...a,
        questions: sanitizedQuestions,
        studentStatus,
        mySubmission: mySubmission ? {
          id: mySubmission.id,
          status: mySubmission.status,
          submittedAt: mySubmission.submittedAt,
          isPublished: mySubmission.isPublished,
          finalScore: mySubmission.isPublished ? mySubmission.finalScore : undefined,
          teacherFeedback: mySubmission.isPublished ? mySubmission.teacherFeedback : undefined,
          answers: mySubmission.answers,
        } : null,
      };
    });

    return res.json(result);
  }
});

// Get single assignment
router.get('/:id', authMiddleware, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const assignment = db.getAssignments().find(a => a.id === id);

  if (!assignment) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }

  if (user.role === 'student' && assignment.classId !== user.classId) {
    return res.status(403).json({ error: 'Bài tập này không thuộc lớp của bạn' });
  }

  const allSubmissions = db.getSubmissions();
  const mySubmission = user.role === 'student'
    ? allSubmissions.find(s => s.assignmentId === id && s.studentId === user.id)
    : null;

  if (user.role === 'student') {
    const isGradedAndPublished = mySubmission?.status === 'graded' && mySubmission.isPublished;
    const sanitizedQuestions = assignment.questions.map(q => {
      if (isGradedAndPublished) {
        return q;
      }
      const { correctAnswer, acceptedVariants, ...rest } = q;
      return rest;
    });

    return res.json({
      ...assignment,
      questions: sanitizedQuestions,
      mySubmission: mySubmission || null,
    });
  }

  // Teacher sees full assignment
  const submissionsForA = allSubmissions.filter(s => s.assignmentId === id);
  res.json({
    ...assignment,
    submissionsCount: submissionsForA.length,
    hasSubmissions: submissionsForA.length > 0,
  });
});

// Create assignment (Teacher only)
router.post('/', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { title, instructions, classId, dueDate, maxScore, questions, status, allowRetry } = req.body;

  if (!title || !classId || !dueDate) {
    return res.status(400).json({ error: 'Vui lòng nhập tên bài tập, chọn lớp và hạn nộp' });
  }

  if (!questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ error: 'Bài tập cần có ít nhất 1 câu hỏi hoặc yêu cầu làm bài' });
  }

  const newAssignment: Assignment = {
    id: `assign-${Date.now()}`,
    title: title.trim(),
    instructions: (instructions || '').trim(),
    classId,
    dueDate,
    maxScore: Number(maxScore) || 10,
    questions: questions.map((q: Partial<Question>, idx: number) => ({
      id: q.id || `q-${idx + 1}-${Date.now()}`,
      type: q.type || 'short_essay',
      prompt: (q.prompt || '').trim(),
      points: Number(q.points) || 1,
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      acceptedVariants: q.acceptedVariants || [],
      explanation: q.explanation || '',
      imageUrl: q.imageUrl || '',
    })),
    status: status === 'draft' ? 'draft' : 'published',
    allowRetry: Boolean(allowRetry),
    teacherId: req.user!.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.addAssignment(newAssignment);
  res.status(201).json(newAssignment);
});

// Update assignment (Teacher only)
router.put('/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getAssignments().find(a => a.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }

  const existingSubmissions = db.getSubmissions().filter(s => s.assignmentId === id);
  const { title, instructions, classId, dueDate, maxScore, questions, status, allowRetry } = req.body;

  const updates: Partial<Assignment> = {};
  if (title) updates.title = title.trim();
  if (instructions !== undefined) updates.instructions = instructions.trim();
  if (classId) updates.classId = classId;
  if (dueDate) updates.dueDate = dueDate;
  if (maxScore !== undefined) updates.maxScore = Number(maxScore);
  if (status) updates.status = status;
  if (allowRetry !== undefined) updates.allowRetry = Boolean(allowRetry);

  if (questions && Array.isArray(questions)) {
    updates.questions = questions.map((q: Partial<Question>, idx: number) => ({
      id: q.id || `q-${idx + 1}-${Date.now()}`,
      type: q.type || 'short_essay',
      prompt: (q.prompt || '').trim(),
      points: Number(q.points) || 1,
      options: q.options || [],
      correctAnswer: q.correctAnswer || '',
      acceptedVariants: q.acceptedVariants || [],
      explanation: q.explanation || '',
      imageUrl: q.imageUrl || '',
    }));
  }

  db.updateAssignment(id, updates);

  res.json({
    message: 'Cập nhật bài tập thành công!',
    assignment: { ...existing, ...updates },
    warningNote: existingSubmissions.length > 0
      ? `Lưu ý: Bài tập đã có ${existingSubmissions.length} học sinh nộp bài. Dữ liệu nộp bài của học sinh đã được bảo toàn an toàn.`
      : undefined,
  });
});

// Delete assignment (Teacher only)
router.delete('/:id', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const existing = db.getAssignments().find(a => a.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }

  db.deleteAssignment(id);
  res.json({ message: 'Đã xóa bài tập thành công' });
});

export default router;
