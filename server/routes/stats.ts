import { Router, Response } from 'express';
import { db } from '../db.js';
import { authMiddleware, requireTeacher, AuthRequest } from '../auth.js';

const router = Router();

router.get('/dashboard', authMiddleware, requireTeacher, (req: AuthRequest, res: Response) => {
  const classes = db.getClasses();
  const students = db.getUsers().filter(u => u.role === 'student');
  const assignments = db.getAssignments();
  const submissions = db.getSubmissions();
  const materials = db.getMaterials();
  const honors = db.getMonthlyHonors();

  const activeAssignments = assignments.filter(a => a.status === 'published');
  const pendingSubmissions = submissions.filter(s => s.status === 'submitted');
  const gradedSubmissions = submissions.filter(s => s.status === 'graded');

  // Recent materials
  const recentMaterials = materials.slice(0, 4);

  // Recent assignments needing attention
  const assignmentsOverview = activeAssignments.map(a => {
    const classItem = classes.find(c => c.id === a.classId);
    const subsForA = submissions.filter(s => s.assignmentId === a.id);
    const submittedCount = subsForA.filter(s => s.status === 'submitted' || s.status === 'graded').length;
    const pendingGrading = subsForA.filter(s => s.status === 'submitted').length;
    const classStudentCount = students.filter(s => s.classId === a.classId).length;

    return {
      id: a.id,
      title: a.title,
      className: classItem?.name || 'Lớp học',
      dueDate: a.dueDate,
      totalStudents: classStudentCount,
      submittedCount,
      pendingGrading,
      submissionRate: classStudentCount > 0 ? Math.round((submittedCount / classStudentCount) * 100) : 0,
    };
  });

  res.json({
    stats: {
      totalClasses: classes.length,
      totalStudents: students.length,
      activeAssignmentsCount: activeAssignments.length,
      pendingGradingCount: pendingSubmissions.length,
      gradedCount: gradedSubmissions.length,
      totalMaterials: materials.length,
      honorsCount: honors.length,
    },
    assignmentsOverview,
    recentMaterials,
  });
});

export default router;
