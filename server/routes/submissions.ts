import { Router, Response } from 'express';
import { db, AssignmentSubmission, StudentAnswer, Assignment } from '../db.js';
import { authMiddleware, requireTeacher, requireStudent, AuthRequest } from '../auth.js';

const router = Router();

// Helper to auto-grade objective questions
function evaluateAutoGradedQuestions(assignment: Assignment, answers: StudentAnswer[]) {
  let autoScore = 0;
  const gradedAnswers = answers.map(ans => {
    const q = assignment.questions.find(question => question.id === ans.questionId);
    if (!q) return ans;

    let awarded = 0;
    if (q.type === 'single_choice') {
      const correct = (q.correctAnswer || '').trim().toUpperCase();
      const selected = (ans.selectedOption || '').trim().toUpperCase();
      if (selected && selected === correct) {
        awarded = q.points;
      }
    } else if (q.type === 'true_false') {
      const correct = (q.correctAnswer || '').trim().toLowerCase();
      const selected = (ans.selectedOption || ans.answerText || '').trim().toLowerCase();
      if (selected && selected === correct) {
        awarded = q.points;
      }
    } else if (q.type === 'fill_in_blank') {
      const studentText = (ans.answerText || '').trim().toLowerCase();
      const correctText = (q.correctAnswer || '').trim().toLowerCase();
      const variants = (q.acceptedVariants || []).map(v => v.trim().toLowerCase());
      if (studentText === correctText || variants.includes(studentText)) {
        awarded = q.points;
      }
    }

    autoScore += awarded;
    return {
      ...ans,
      autoScore: awarded,
    };
  });

  return { autoScore, gradedAnswers };
}

// Student saves draft
router.post('/:assignmentId/draft', authMiddleware, requireStudent, (req: AuthRequest, res: Response) => {
  const { assignmentId } = req.params;
  const user = req.user!;
  const assignment = db.getAssignments().find(a => a.id === assignmentId);

  if (!assignment) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }

  const existingSub = db.getSubmissions().find(s => s.assignmentId === assignmentId && s.studentId === user.id);
  if (existingSub && existingSub.status === 'submitted' && !assignment.allowRetry) {
    return res.status(400).json({ error: 'Bài tập này đã được nộp và không cho phép chỉnh sửa.' });
  }

  const { answers } = req.body;
  const submission: AssignmentSubmission = {
    id: existingSub ? existingSub.id : `sub-${Date.now()}`,
    assignmentId,
    studentId: user.id,
    classId: user.classId || assignment.classId,
    answers: answers || [],
    status: 'draft',
    autoGradedScore: 0,
    isPublished: false,
    history: existingSub?.history || [],
  };

  db.saveSubmission(submission);
  res.json({ message: 'Đã lưu bản nháp bài làm an toàn!', submission });
});

// Student submits assignment
router.post('/:assignmentId/submit', authMiddleware, requireStudent, (req: AuthRequest, res: Response) => {
  const { assignmentId } = req.params;
  const user = req.user!;
  const assignment = db.getAssignments().find(a => a.id === assignmentId);

  if (!assignment) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }

  const existingSub = db.getSubmissions().find(s => s.assignmentId === assignmentId && s.studentId === user.id);
  if (existingSub && existingSub.status === 'submitted' && !assignment.allowRetry) {
    return res.status(400).json({ error: 'Em đã nộp bài tập này rồi. Chờ cô chấm bài nhé!' });
  }

  const { answers } = req.body;
  const rawAnswers: StudentAnswer[] = answers || [];

  // Evaluate auto-graded items
  const { autoScore, gradedAnswers } = evaluateAutoGradedQuestions(assignment, rawAnswers);

  // Check if all questions are auto-gradable
  const hasSubjective = assignment.questions.some(q =>
    q.type === 'short_essay' || q.type === 'long_essay' || q.type === 'file_upload'
  );

  const submission: AssignmentSubmission = {
    id: existingSub ? existingSub.id : `sub-${Date.now()}`,
    assignmentId,
    studentId: user.id,
    classId: user.classId || assignment.classId,
    answers: gradedAnswers,
    status: 'submitted',
    submittedAt: new Date().toISOString(),
    autoGradedScore: autoScore,
    finalScore: hasSubjective ? undefined : autoScore,
    isPublished: !hasSubjective, // If 100% quiz, can publish immediately
    history: [
      ...(existingSub?.history || []),
      {
        action: 'submit',
        score: hasSubjective ? undefined : autoScore,
        updatedAt: new Date().toISOString(),
        note: 'Học sinh nộp bài',
      },
    ],
  };

  db.saveSubmission(submission);

  res.json({
    message: 'Nộp bài thành công! Cô Yến Thanh đã nhận được bài làm của em.',
    submission,
  });
});

// Teacher gets submissions list for assignment
router.get('/assignment/:assignmentId', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { assignmentId } = req.params;
  const assignment = db.getAssignments().find(a => a.id === assignmentId);

  if (!assignment) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập' });
  }

  const studentsInClass = db.getUsers().filter(u => u.role === 'student' && u.classId === assignment.classId);
  const submissions = db.getSubmissions().filter(s => s.assignmentId === assignmentId);

  const studentSubmissionRows = studentsInClass.map(student => {
    const sub = submissions.find(s => s.studentId === student.id);
    return {
      studentId: student.id,
      studentName: student.fullName,
      studentUsername: student.username,
      submissionId: sub?.id,
      status: sub ? sub.status : 'not_started',
      submittedAt: sub?.submittedAt,
      autoGradedScore: sub?.autoGradedScore || 0,
      finalScore: sub?.finalScore,
      teacherFeedback: sub?.teacherFeedback,
      isPublished: sub ? sub.isPublished : false,
      answersCount: sub?.answers?.length || 0,
      submission: sub || null,
    };
  });

  res.json({
    assignment,
    rows: studentSubmissionRows,
  });
});

// Teacher grades a submission
router.post('/:id/grade', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const submission = db.getSubmissions().find(s => s.id === id);

  if (!submission) {
    return res.status(404).json({ error: 'Không tìm thấy bài nộp' });
  }

  const assignment = db.getAssignments().find(a => a.id === submission.assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Không tìm thấy bài tập gốc' });
  }

  const { questionScores, teacherFeedback, isPublished } = req.body;
  // questionScores is map: { [questionId: string]: { teacherScore: number, teacherComment?: string } }

  let totalScore = 0;
  const updatedAnswers = submission.answers.map(ans => {
    const override = questionScores ? questionScores[ans.questionId] : undefined;
    const q = assignment.questions.find(question => question.id === ans.questionId);

    let score = ans.autoScore || 0;
    let comment = ans.teacherComment || '';

    if (override) {
      if (override.teacherScore !== undefined) {
        score = Number(override.teacherScore);
      }
      if (override.teacherComment !== undefined) {
        comment = override.teacherComment;
      }
    }

    totalScore += score;
    return {
      ...ans,
      teacherScore: score,
      teacherComment: comment,
    };
  });

  const now = new Date().toISOString();
  const updated: AssignmentSubmission = {
    ...submission,
    answers: updatedAnswers,
    status: 'graded',
    finalScore: Math.min(assignment.maxScore, Math.max(0, totalScore)),
    teacherFeedback: teacherFeedback !== undefined ? teacherFeedback.trim() : submission.teacherFeedback,
    isPublished: isPublished !== undefined ? Boolean(isPublished) : submission.isPublished,
    gradedAt: now,
    history: [
      ...(submission.history || []),
      {
        action: 'grade',
        score: totalScore,
        updatedAt: now,
        note: isPublished ? 'Giáo viên chấm và công bố kết quả' : 'Giáo viên lưu bản nháp chấm điểm',
      },
    ],
  };

  db.saveSubmission(updated);

  res.json({
    message: isPublished ? 'Đã chấm điểm và công bố kết quả thành công!' : 'Đã lưu bản nháp chấm điểm thành công!',
    submission: updated,
  });
});

// Teacher toggles publish status for a submission
router.post('/:id/publish', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const submission = db.getSubmissions().find(s => s.id === id);

  if (!submission) {
    return res.status(404).json({ error: 'Không tìm thấy bài nộp' });
  }

  const { publish } = req.body;
  const isPublished = publish !== undefined ? Boolean(publish) : !submission.isPublished;

  submission.isPublished = isPublished;
  db.saveSubmission(submission);

  res.json({
    message: isPublished ? 'Đã công bố điểm cho học sinh!' : 'Đã chuyển kết quả về trạng thái ẩn.',
    isPublished,
  });
});

// Teacher allows retry for a student
router.post('/:id/allow-retry', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const submission = db.getSubmissions().find(s => s.id === id);

  if (!submission) {
    return res.status(404).json({ error: 'Không tìm thấy bài nộp' });
  }

  submission.status = 'draft';
  submission.history = [
    ...(submission.history || []),
    {
      action: 'allow_retry',
      updatedAt: new Date().toISOString(),
      note: 'Cô mở quyền cho học sinh làm lại bài',
    },
  ];

  db.saveSubmission(submission);
  res.json({ message: 'Đã mở quyền cho học sinh nộp lại bài thành công!' });
});

export default router;
