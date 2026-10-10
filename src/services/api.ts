import {
  User,
  ClassItem,
  LearningMaterial,
  Assignment,
  AssignmentSubmission,
  StudentListItem,
  AchievementPointLog,
  MonthlyHonor,
  MonthlyReward,
  StudentProfileData,
  RaceTrackData,
  DashboardStats,
} from '../types/index.js';

const TOKEN_KEY = 'chill_van_auth_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || `Lỗi yêu cầu: ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  getStatus: () => request<{ hasTeacher: boolean; teacherCount: number; studentCount: number }>('/api/auth/status'),
  setupTeacher: (body: { email: string; fullName: string; password: string; securityKey?: string }) =>
    request<{ token: string; user: User; message: string }>('/api/auth/setup-teacher', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  teacherLogin: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/teacher/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  studentLogin: (username: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/student/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  getMe: () => request<User>('/api/auth/me'),
  studentChangePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/student/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  teacherChangePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/teacher/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  teacherForgotPassword: (email: string) =>
    request<{ message: string; resetCode: string }>('/api/auth/teacher/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Classes
  getClasses: () => request<ClassItem[]>('/api/classes'),
  createClass: (body: { name: string; grade: string; schoolYear?: string; description?: string }) =>
    request<ClassItem>('/api/classes', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateClass: (id: string, body: Partial<ClassItem>) =>
    request<{ message: string; class: ClassItem }>(`/api/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteClass: (id: string) =>
    request<{ message: string }>(`/api/classes/${id}`, { method: 'DELETE' }),

  // Students
  getStudents: (params?: { classId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.classId) q.set('classId', params.classId);
    if (params?.search) q.set('search', params.search);
    return request<StudentListItem[]>(`/api/students?${q.toString()}`);
  },
  createStudent: (body: { fullName: string; username?: string; password: string; classId: string }) =>
    request<{ message: string; student: User; credentialsGiven: { username: string; initialPassword: string } }>('/api/students', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateStudent: (id: string, body: { fullName?: string; classId?: string; status?: 'active' | 'locked' }) =>
    request<{ message: string; student: User }>(`/api/students/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  resetStudentPassword: (id: string, newPassword: string) =>
    request<{ message: string; username: string }>(`/api/students/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),
  updateStudentProfileExtra: (id: string, body: { strengths: string; needsImprovement: string; monthlyGoals: string }) =>
    request<{ message: string }>(`/api/students/${id}/profile-extra`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  getStudentProfile: (id: string) =>
    request<StudentProfileData>(`/api/students/${id}/profile`),

  // Materials
  getMaterials: (params?: { topic?: string; classId?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.topic) q.set('topic', params.topic);
    if (params?.classId) q.set('classId', params.classId);
    if (params?.search) q.set('search', params.search);
    return request<LearningMaterial[]>(`/api/materials?${q.toString()}`);
  },
  getMaterial: (id: string) => request<LearningMaterial>(`/api/materials/${id}`),
  createMaterial: (body: Partial<LearningMaterial>) =>
    request<LearningMaterial>('/api/materials', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateMaterial: (id: string, body: Partial<LearningMaterial>) =>
    request<{ message: string; material: LearningMaterial }>(`/api/materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteMaterial: (id: string) =>
    request<{ message: string }>(`/api/materials/${id}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: (params?: { classId?: string }) => {
    const q = new URLSearchParams();
    if (params?.classId) q.set('classId', params.classId);
    return request<Assignment[]>(`/api/assignments?${q.toString()}`);
  },
  getAssignment: (id: string) => request<Assignment>(`/api/assignments/${id}`),
  createAssignment: (body: Partial<Assignment>) =>
    request<Assignment>('/api/assignments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateAssignment: (id: string, body: Partial<Assignment>) =>
    request<{ message: string; assignment: Assignment; warningNote?: string }>(`/api/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteAssignment: (id: string) =>
    request<{ message: string }>(`/api/assignments/${id}`, { method: 'DELETE' }),

  // Submissions & Grading
  saveDraft: (assignmentId: string, answers: any[]) =>
    request<{ message: string; submission: AssignmentSubmission }>(`/api/submissions/${assignmentId}/draft`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  submitAssignment: (assignmentId: string, answers: any[]) =>
    request<{ message: string; submission: AssignmentSubmission }>(`/api/submissions/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  getAssignmentSubmissions: (assignmentId: string) =>
    request<{ assignment: Assignment; rows: any[] }>(`/api/submissions/assignment/${assignmentId}`),
  gradeSubmission: (
    submissionId: string,
    body: {
      questionScores: Record<string, { teacherScore: number; teacherComment?: string }>;
      teacherFeedback?: string;
      isPublished?: boolean;
    }
  ) =>
    request<{ message: string; submission: AssignmentSubmission }>(`/api/submissions/${submissionId}/grade`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  publishSubmissionGrade: (submissionId: string, publish?: boolean) =>
    request<{ message: string; isPublished: boolean }>(`/api/submissions/${submissionId}/publish`, {
      method: 'POST',
      body: JSON.stringify({ publish }),
    }),
  allowRetrySubmission: (submissionId: string) =>
    request<{ message: string }>(`/api/submissions/${submissionId}/allow-retry`, { method: 'POST' }),

  // Gamification
  getPointsLogs: (params?: { studentId?: string; classId?: string }) => {
    const q = new URLSearchParams();
    if (params?.studentId) q.set('studentId', params.studentId);
    if (params?.classId) q.set('classId', params.classId);
    return request<AchievementPointLog[]>(`/api/gamification/points?${q.toString()}`);
  },
  awardPoints: (body: { studentId: string; points: number; category: string; reason: string }) =>
    request<{ message: string; log: AchievementPointLog; totalPoints: number }>('/api/gamification/points/award', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getRaceTrack: (params?: { classId?: string }) => {
    const q = new URLSearchParams();
    if (params?.classId) q.set('classId', params.classId);
    return request<RaceTrackData>(`/api/gamification/race-track?${q.toString()}`);
  },
  getHonors: (params?: { month?: string; classId?: string }) => {
    const q = new URLSearchParams();
    if (params?.month) q.set('month', params.month);
    if (params?.classId) q.set('classId', params.classId);
    return request<MonthlyHonor[]>(`/api/gamification/honors?${q.toString()}`);
  },
  createHonor: (body: { month: string; classId: string; category: string; studentId: string; teacherComment?: string }) =>
    request<{ message: string; honor: MonthlyHonor }>('/api/gamification/honors', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  deleteHonor: (id: string) =>
    request<{ message: string }>(`/api/gamification/honors/${id}`, { method: 'DELETE' }),
  getRewards: () => request<MonthlyReward[]>('/api/gamification/rewards'),
  createReward: (body: Partial<MonthlyReward>) =>
    request<MonthlyReward>('/api/gamification/rewards', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateReward: (id: string, body: Partial<MonthlyReward>) =>
    request<{ message: string; reward: MonthlyReward }>(`/api/gamification/rewards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
  deleteReward: (id: string) =>
    request<{ message: string }>(`/api/gamification/rewards/${id}`, { method: 'DELETE' }),

  // Stats
  getDashboardStats: () => request<DashboardStats>('/api/stats/dashboard'),
};
