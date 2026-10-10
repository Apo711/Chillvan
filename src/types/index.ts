export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  role: UserRole;
  email?: string;
  username?: string;
  fullName: string;
  classId?: string;
  className?: string;
  grade?: string;
  status: 'active' | 'locked';
  avatarUrl?: string;
}

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  schoolYear: string;
  description?: string;
  studentCount?: number;
  createdAt: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description: string;
  topic: string;
  classId: string;
  className?: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'image' | 'text' | 'link';
  fileName: string;
  fileSize?: string;
  fileContent?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType =
  | 'single_choice'
  | 'true_false'
  | 'fill_in_blank'
  | 'short_essay'
  | 'long_essay'
  | 'file_upload';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  points: number;
  options?: string[];
  correctAnswer?: string;
  acceptedVariants?: string[];
  explanation?: string;
  imageUrl?: string;
}

export interface StudentAnswer {
  questionId: string;
  answerText?: string;
  selectedOption?: string;
  fileUrl?: string;
  fileName?: string;
  autoScore?: number;
  teacherScore?: number;
  teacherComment?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  classId: string;
  answers: StudentAnswer[];
  status: 'draft' | 'submitted' | 'graded';
  submittedAt?: string;
  autoGradedScore: number;
  finalScore?: number;
  teacherFeedback?: string;
  isPublished: boolean;
  gradedAt?: string;
  history?: {
    action: string;
    score?: number;
    updatedAt: string;
    note?: string;
  }[];
}

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  classId: string;
  className?: string;
  dueDate: string;
  maxScore: number;
  questions: Question[];
  status: 'draft' | 'published' | 'closed';
  allowRetry: boolean;
  totalStudents?: number;
  submittedCount?: number;
  gradedCount?: number;
  pendingGradingCount?: number;
  studentStatus?: 'not_started' | 'draft' | 'submitted' | 'graded';
  mySubmission?: Partial<AssignmentSubmission> | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentListItem {
  id: string;
  fullName: string;
  username: string;
  classId: string;
  className: string;
  status: 'active' | 'locked';
  avatarUrl?: string;
  createdAt: string;
  totalPoints: number;
  profileExtra: {
    strengths: string;
    needsImprovement: string;
    monthlyGoals: string;
  };
}

export interface AchievementPointLog {
  id: string;
  studentId: string;
  studentName?: string;
  studentUsername?: string;
  classId: string;
  points: number;
  category: 'on_time' | 'active_speaking' | 'great_progress' | 'excellent_work' | 'creative' | 'other';
  reason: string;
  createdAt: string;
}

export type HonorCategory = 'cham_chi' | 'tien_bo' | 'sang_tao' | 'tich_cuc' | 'xuat_sac';

export interface MonthlyHonor {
  id: string;
  month: string;
  classId: string;
  className?: string;
  category: HonorCategory;
  studentId: string;
  studentName?: string;
  studentUsername?: string;
  teacherComment: string;
  awardedAt: string;
}

export interface MonthlyReward {
  id: string;
  title: string;
  description: string;
  conditionText: string;
  minPoints?: number;
  quantity?: number;
  availableMonth: string;
  imageUrl?: string;
  active: boolean;
  createdAt: string;
}

export interface StudentProfileData {
  id: string;
  fullName: string;
  username: string;
  className: string;
  grade?: string;
  avatarUrl?: string;
  totalPoints: number;
  completedAssignmentsCount: number;
  recentSubmissions: {
    id: string;
    assignmentTitle: string;
    finalScore?: number;
    maxScore: number;
    teacherFeedback?: string;
    gradedAt?: string;
  }[];
  profileExtra: {
    strengths: string;
    needsImprovement: string;
    monthlyGoals: string;
  };
  honors: MonthlyHonor[];
  achievementLogs: AchievementPointLog[];
}

export interface RaceTrackData {
  milestones: {
    level: number;
    name: string;
    points: number;
    icon: string;
  }[];
  rankings: {
    id: string;
    name: string;
    username: string;
    classId: string;
    totalPoints: number;
    progressPercent: number;
    currentMilestone: {
      level: number;
      name: string;
      points: number;
      icon: string;
    };
    nextMilestone: {
      level: number;
      name: string;
      points: number;
      icon: string;
    };
    isMe: boolean;
  }[];
}

export interface DashboardStats {
  stats: {
    totalClasses: number;
    totalStudents: number;
    activeAssignmentsCount: number;
    pendingGradingCount: number;
    gradedCount: number;
    totalMaterials: number;
    honorsCount: number;
  };
  assignmentsOverview: {
    id: string;
    title: string;
    className: string;
    dueDate: string;
    totalStudents: number;
    submittedCount: number;
    pendingGrading: number;
    submissionRate: number;
  }[];
  recentMaterials: LearningMaterial[];
}
