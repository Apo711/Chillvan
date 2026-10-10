import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  role: 'teacher' | 'student';
  username?: string; // For student
  email?: string;    // For teacher
  fullName: string;
  passwordHash: string;
  avatarUrl?: string;
  classId?: string;  // For student
  status: 'active' | 'locked';
  createdAt: string;
}

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  schoolYear: string;
  description?: string;
  teacherId: string;
  createdAt: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description: string;
  topic: string;
  classId: string; // 'all' or specific classId
  fileType: 'pdf' | 'docx' | 'pptx' | 'image' | 'text' | 'link';
  fileName: string;
  fileSize?: string;
  fileContent?: string; // base64 data url or rich text content
  url?: string;
  teacherId: string;
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
  options?: string[]; // for single_choice
  correctAnswer?: string; // for auto-grading (single_choice, true_false, fill_in_blank)
  acceptedVariants?: string[]; // for fill_in_blank alternate valid answers
  explanation?: string;
  imageUrl?: string;
}

export interface Assignment {
  id: string;
  title: string;
  instructions: string;
  classId: string; // class assigned to
  dueDate: string;
  maxScore: number;
  questions: Question[];
  status: 'draft' | 'published' | 'closed';
  allowRetry: boolean;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnswer {
  questionId: string;
  answerText?: string;
  selectedOption?: string; // A, B, C, D or 'true'/'false'
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
  isPublished: boolean; // whether student can see score & feedback
  gradedAt?: string;
  history?: {
    action: string;
    score?: number;
    updatedAt: string;
    note?: string;
  }[];
}

export interface AchievementPointLog {
  id: string;
  studentId: string;
  classId: string;
  points: number; // positive or negative
  category: 'on_time' | 'active_speaking' | 'great_progress' | 'excellent_work' | 'creative' | 'other';
  reason: string;
  teacherId: string;
  createdAt: string;
}

export interface MonthlyHonor {
  id: string;
  month: string; // e.g., '10/2026'
  classId: string;
  category: 'cham_chi' | 'tien_bo' | 'sang_tao' | 'tich_cuc' | 'xuat_sac';
  studentId: string;
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

export interface StudentProfileExtra {
  studentId: string;
  strengths: string;      // "Điểm mạnh của em"
  needsImprovement: string; // "Điều em cần cố gắng"
  monthlyGoals: string;    // "Mục tiêu tháng này"
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  classes: ClassItem[];
  materials: LearningMaterial[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  achievementLogs: AchievementPointLog[];
  monthlyHonors: MonthlyHonor[];
  rewards: MonthlyReward[];
  studentProfiles: StudentProfileExtra[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'chill_van_db.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    classes: [],
    materials: [],
    assignments: [],
    submissions: [],
    achievementLogs: [],
    monthlyHonors: [],
    rewards: [],
    studentProfiles: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        this.data.users = this.data.users || [];
        this.data.classes = this.data.classes || [];
        this.data.materials = this.data.materials || [];
        this.data.assignments = this.data.assignments || [];
        this.data.submissions = this.data.submissions || [];
        this.data.achievementLogs = this.data.achievementLogs || [];
        this.data.monthlyHonors = this.data.monthlyHonors || [];
        this.data.rewards = this.data.rewards || [];
        this.data.studentProfiles = this.data.studentProfiles || [];
      } catch (err) {
        console.error('Error reading database file, initializing clean database', err);
        this.save();
      }
    } else {
      this.seedInitialData();
      this.save();
    }
  }

  private seedInitialData() {
    // Setup Cô Yến Thanh as default initial teacher if no user exists
    const teacherSalt = bcrypt.genSaltSync(10);
    const teacherPasswordHash = bcrypt.hashSync('CoYenThanh2026@', teacherSalt);

    const teacher: User = {
      id: 'teacher-yenthanh',
      role: 'teacher',
      email: 'coyenthanh@chillvan.edu.vn',
      fullName: 'Cô Yến Thanh (Ngữ Văn)',
      passwordHash: teacherPasswordHash,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const class6A: ClassItem = {
      id: 'class-6a',
      name: 'Lớp 6A - Khám Phá Văn Học',
      grade: '6',
      schoolYear: '2026 - 2027',
      description: 'Lớp học vui vẻ, rèn luyện kỹ năng đọc hiểu và viết văn miêu tả, tự sự',
      teacherId: teacher.id,
      createdAt: new Date().toISOString(),
    };

    const class8B: ClassItem = {
      id: 'class-8b',
      name: 'Lớp 8B - Chắp Cánh Ước Mơ',
      grade: '8',
      schoolYear: '2026 - 2027',
      description: 'Chuyên sâu thơ văn trữ tình, văn bản nhật dụng và nghị luận văn học',
      teacherId: teacher.id,
      createdAt: new Date().toISOString(),
    };

    // Pre-create 2 student accounts for seamless trial
    const studentSalt = bcrypt.genSaltSync(10);
    const student1Pass = bcrypt.hashSync('123456', studentSalt);
    const student2Pass = bcrypt.hashSync('123456', studentSalt);

    const student1: User = {
      id: 'student-ducminh',
      role: 'student',
      username: 'ducminh',
      fullName: 'Trần Đức Minh',
      passwordHash: student1Pass,
      classId: class6A.id,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const student2: User = {
      id: 'student-haianh',
      role: 'student',
      username: 'haianh',
      fullName: 'Nguyễn Hải Anh',
      passwordHash: student2Pass,
      classId: class6A.id,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    // Sample Literature Materials
    const material1: LearningMaterial = {
      id: 'mat-1',
      title: 'Tóm tắt & Sơ đồ tư duy bài thơ "Đồng chí" (Chính Hữu)',
      description: 'Sơ đồ hình ảnh hệ thống hoá hoàn cảnh ra đời, vẻ đẹp tình đồng chí và biểu tượng đầu súng trăng treo.',
      topic: 'Thơ Việt Nam hiện đại',
      classId: 'all',
      fileType: 'text',
      fileName: 'so-do-dong-chi.txt',
      fileContent: `1. Cơ sở hình thành tình đồng chí:
- Cùng chung cảnh ngộ xuất thân nghèo khó: "Quê hương anh nước mặn đồng chua / Làng tôi nghèo đất cày lên sỏi đá".
- Cùng chung lý tưởng cách mạng, mục tiêu chiến đấu: "Súng bên súng, đầu sát bên đầu".
- Chia sẻ gian lao, gắn bó keo sơn: "Đêm rét chung chăn thành đôi tri kỷ".

2. Biểu hiện cảm động của tình đồng chí:
- Thấu hiểu tâm tư, nỗi nhớ quê hương: "Ruộng nương anh gửi bạn thân cày / Gian nhà không mặc kệ gió lung lay".
- Cùng chia sẻ những cơn sốt rét rừng hiểm nghèo và thiếu thốn quân trang: "Áo anh rách vai / Quần tôi có vài mảnh vá / Miệng cười buốt giá / Chân không giày".
- Tình cảm ấm áp xua tan giá buốt: "Thương nhau tay nắm lấy bàn tay".

3. Bức tranh tuyệt đẹp về tình đồng chí:
- Đêm phục kích chờ giặc trong sương muối lạnh lẽo: "Rừng hoang sương muối / Đứng cạnh bên nhau chờ giặc tới".
- Biểu tượng thơ mộng và hiện thực: "Đầu súng trăng treo" - sự kết hợp giữa chiến sĩ và thi sĩ, hiện thực khốc liệt và lãng mạn cao cả.`,
      teacherId: teacher.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const material2: LearningMaterial = {
      id: 'mat-2',
      title: 'Cẩm nang 5 bước viết mở bài Nghị luận văn học siêu cuốn hút',
      description: 'Phương pháp mở bài trực tiếp và gián tiếp kèm ví dụ mẫu dễ áp dụng cho học sinh THCS.',
      topic: 'Kỹ năng làm văn',
      classId: class6A.id,
      fileType: 'text',
      fileName: 'mo-bai-nghi-luan.txt',
      fileContent: `Phương pháp 1: Đi từ tác giả, thời đại tới tác phẩm.
Ví dụ: "Mỗi thời đại đi qua đều để lại những dấu ấn khó phai trong dòng chảy văn học. Và với thi ca kháng chiến chống Pháp, Chính Hữu đã khắc sâu vào lòng độc giả một bức tượng đài tình bạn cao đẹp qua bài thơ 'Đồng chí'..."

Phương pháp 2: Đi từ một nhận định văn học hoặc danh ngôn.
Ví dụ: "Nhà văn Pau-tốp-xki từng nói: 'Niềm vui của nhà văn chân chính là niềm vui của người dẫn đường đến xứ sở cái đẹp'. Đọc bài thơ..., người đọc được bước vào xứ sở của những tình cảm chân thành, ấm áp nhất..."

Phương pháp 3: So sánh tương đồng hoặc đối lập.
Gợi ý: So sánh hình ảnh người lính thời xưa với người lính Cụ Hồ thời hiện đại để làm bật lên vẻ đẹp mộc mạc, bình dị.`,
      teacherId: teacher.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Sample assignment
    const sampleAssignment: Assignment = {
      id: 'assign-1',
      title: 'Phiếu học tập: Khám phá vẻ đẹp bài thơ "Đồng chí"',
      instructions: 'Các em đọc kỹ từng câu hỏi, suy nghĩ thấu đáo và trả lời bằng giọng văn truyền cảm nhé!',
      classId: class6A.id,
      dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(), // 7 days from now
      maxScore: 10,
      status: 'published',
      allowRetry: true,
      teacherId: teacher.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      questions: [
        {
          id: 'q-1',
          type: 'single_choice',
          prompt: 'Bài thơ "Đồng chí" của Chính Hữu được sáng tác vào năm nào?',
          points: 1.5,
          options: ['Năm 1948', 'Năm 1954', 'Năm 1975', 'Năm 1986'],
          correctAnswer: 'A',
          explanation: 'Bài thơ được sáng tác vào đầu năm 1948, sau chiến dịch Việt Bắc thu đông 1947.',
        },
        {
          id: 'q-2',
          type: 'true_false',
          prompt: 'Hình ảnh "Đầu súng trăng treo" ở cuối bài thơ chỉ mang tính hiện thực mà không có chất lãng mạn.',
          points: 1.5,
          options: ['Đúng', 'Sai'],
          correctAnswer: 'Sai',
          explanation: 'Hình ảnh này kết hợp hài hoà giữa hiện thực khốc liệt (súng) và chất thơ lãng mạn bay bổng (trăng).',
        },
        {
          id: 'q-3',
          type: 'fill_in_blank',
          prompt: 'Điền từ còn thiếu vào dấu ba chấm: "Thương nhau tay nắm lấy ..."',
          points: 2,
          correctAnswer: 'bàn tay',
          acceptedVariants: ['bàn tay', 'ban tay', 'bàn tay.'],
          explanation: 'Cử chỉ "tay nắm lấy bàn tay" thể hiện sự sẻ chia, truyền hơi ấm thầm lặng.',
        },
        {
          id: 'q-4',
          type: 'short_essay',
          prompt: 'Từ "tri kỷ" trong câu "Đêm rét chung chăn thành đôi tri kỷ" có ý nghĩa gì đối với tình bạn của hai người lính?',
          points: 2,
          explanation: '"Tri kỷ" là người bạn hiểu rõ bạn mình như hiểu chính mình, gắn bó tâm hồn sâu sắc.',
        },
        {
          id: 'q-5',
          type: 'long_essay',
          prompt: 'Viết một đoạn văn ngắn (khoảng 8 - 10 câu) nêu cảm nhận của em về chi tiết "Miệng cười buốt giá / Chân không giày / Thương nhau tay nắm lấy bàn tay".',
          points: 3,
          explanation: 'Học sinh nêu bật được gian khổ thiếu thốn, tinh thần lạc quan và hơi ấm tình người vượt qua giá lạnh.',
        },
      ],
    };

    // Sample Student Profile Extra
    const profile1: StudentProfileExtra = {
      studentId: student1.id,
      strengths: 'Có vốn từ phong phú, giọng văn giàu cảm xúc và hình ảnh, tiếp thu nhanh các bài thơ trữ tình.',
      needsImprovement: 'Cần chú ý cách ngắt câu và rèn luyện kỹ năng lập dàn ý trước khi viết đoạn văn dài.',
      monthlyGoals: 'Hoàn thành đủ các bài tập về nhà đúng hạn và đạt điểm 9 phần phân tích văn học.',
      updatedAt: new Date().toISOString(),
    };

    const profile2: StudentProfileExtra = {
      studentId: student2.id,
      strengths: 'Tư duy mạch lạc, lập luận logic, phát biểu xây dựng bài rất tích cực trong giờ học.',
      needsImprovement: 'Rèn thêm cách mở bài gián tiếp mềm mại và truyền cảm hơn.',
      monthlyGoals: 'Tích lũy 100 điểm sao Chill Văn và đạt danh hiệu Ngôi sao tích cực.',
      updatedAt: new Date().toISOString(),
    };

    // Sample Achievement Logs
    const log1: AchievementPointLog = {
      id: 'log-1',
      studentId: student1.id,
      classId: class6A.id,
      points: 20,
      category: 'on_time',
      reason: 'Nộp bài đọc hiểu trước thời hạn 2 ngày với chữ viết rất cẩn thận',
      teacherId: teacher.id,
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    };

    const log2: AchievementPointLog = {
      id: 'log-2',
      studentId: student1.id,
      classId: class6A.id,
      points: 30,
      category: 'creative',
      reason: 'Có góc nhìn sáng tạo khi phân tích hình ảnh biểu tượng "Đầu súng trăng treo"',
      teacherId: teacher.id,
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    };

    const log3: AchievementPointLog = {
      id: 'log-3',
      studentId: student2.id,
      classId: class6A.id,
      points: 40,
      category: 'active_speaking',
      reason: 'Hăng hái phát biểu và chia sẻ cảm nghĩ rất hay trong tiết học thơ ca',
      teacherId: teacher.id,
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    };

    // Sample Monthly Honors
    const honor1: MonthlyHonor = {
      id: 'honor-1',
      month: '10/2026',
      classId: class6A.id,
      category: 'sang_tao',
      studentId: student1.id,
      teacherComment: 'Đức Minh có những bài viết rất giàu tưởng tượng và cảm xúc chân thật, cô rất tự hào về em!',
      awardedAt: new Date().toISOString(),
    };

    const honor2: MonthlyHonor = {
      id: 'honor-2',
      month: '10/2026',
      classId: class6A.id,
      category: 'tich_cuc',
      studentId: student2.id,
      teacherComment: 'Hải Anh luôn lan tỏa nguồn năng lượng học tập tích cực tới cả lớp!',
      awardedAt: new Date().toISOString(),
    };

    // Sample Monthly Rewards
    const reward1: MonthlyReward = {
      id: 'rew-1',
      title: 'Sổ tay Chill Văn bìa hoa Pastel',
      description: 'Quyển sổ tay ghi chú bìa cứng dễ thương có in lời chúc ngọt ngào từ Cô Yến Thanh.',
      conditionText: 'Tích lũy từ 100 điểm sao Chill Văn trong tháng',
      minPoints: 100,
      quantity: 5,
      availableMonth: '10/2026',
      active: true,
      createdAt: new Date().toISOString(),
    };

    const reward2: MonthlyReward = {
      id: 'rew-2',
      title: 'Bút mực thần kỳ & Huy hiệu Ngôi sao Chill Văn',
      description: 'Bộ bút mực viết êm cùng huy hiệu cài áo phiên bản độc quyền môn Ngữ văn.',
      conditionText: 'Hoàn thành 100% bài tập đúng hạn trong tháng',
      minPoints: 60,
      quantity: 10,
      availableMonth: '10/2026',
      active: true,
      createdAt: new Date().toISOString(),
    };

    const reward3: MonthlyReward = {
      id: 'rew-3',
      title: 'Phiếu miễn trừ 1 lần kiểm tra bài cũ',
      description: 'Đặc quyền chọn một hoạt động làm việc nhóm sáng tạo thay cho trả bài miệng ngẫu nhiên.',
      conditionText: 'Đạt danh hiệu trong Bảng Vinh Danh tháng',
      minPoints: 80,
      quantity: 3,
      availableMonth: '10/2026',
      active: true,
      createdAt: new Date().toISOString(),
    };

    this.data.users = [teacher, student1, student2];
    this.data.classes = [class6A, class8B];
    this.data.materials = [material1, material2];
    this.data.assignments = [sampleAssignment];
    this.data.submissions = [];
    this.data.studentProfiles = [profile1, profile2];
    this.data.achievementLogs = [log1, log2, log3];
    this.data.monthlyHonors = [honor1, honor2];
    this.data.rewards = [reward1, reward2, reward3];
  }

  public save() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database atomically', err);
    }
  }

  // Getters
  public getUsers(): User[] { return this.data.users; }
  public getClasses(): ClassItem[] { return this.data.classes; }
  public getMaterials(): LearningMaterial[] { return this.data.materials; }
  public getAssignments(): Assignment[] { return this.data.assignments; }
  public getSubmissions(): AssignmentSubmission[] { return this.data.submissions; }
  public getAchievementLogs(): AchievementPointLog[] { return this.data.achievementLogs; }
  public getMonthlyHonors(): MonthlyHonor[] { return this.data.monthlyHonors; }
  public getRewards(): MonthlyReward[] { return this.data.rewards; }
  public getStudentProfiles(): StudentProfileExtra[] { return this.data.studentProfiles; }

  // Setters / Mutators
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
    }
  }

  public deleteUser(id: string) {
    this.data.users = this.data.users.filter(u => u.id !== id);
    this.save();
  }

  public addClass(c: ClassItem) {
    this.data.classes.push(c);
    this.save();
  }

  public updateClass(id: string, updates: Partial<ClassItem>) {
    const idx = this.data.classes.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.classes[idx] = { ...this.data.classes[idx], ...updates };
      this.save();
    }
  }

  public deleteClass(id: string) {
    this.data.classes = this.data.classes.filter(c => c.id !== id);
    this.save();
  }

  public addMaterial(m: LearningMaterial) {
    this.data.materials.unshift(m);
    this.save();
  }

  public updateMaterial(id: string, updates: Partial<LearningMaterial>) {
    const idx = this.data.materials.findIndex(m => m.id === id);
    if (idx !== -1) {
      this.data.materials[idx] = { ...this.data.materials[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
    }
  }

  public deleteMaterial(id: string) {
    this.data.materials = this.data.materials.filter(m => m.id !== id);
    this.save();
  }

  public addAssignment(a: Assignment) {
    this.data.assignments.unshift(a);
    this.save();
  }

  public updateAssignment(id: string, updates: Partial<Assignment>) {
    const idx = this.data.assignments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
    }
  }

  public deleteAssignment(id: string) {
    this.data.assignments = this.data.assignments.filter(a => a.id !== id);
    this.save();
  }

  public saveSubmission(sub: AssignmentSubmission) {
    const idx = this.data.submissions.findIndex(s => s.id === sub.id || (s.assignmentId === sub.assignmentId && s.studentId === sub.studentId));
    if (idx !== -1) {
      this.data.submissions[idx] = sub;
    } else {
      this.data.submissions.push(sub);
    }
    this.save();
  }

  public addAchievementLog(log: AchievementPointLog) {
    this.data.achievementLogs.unshift(log);
    this.save();
  }

  public addMonthlyHonor(honor: MonthlyHonor) {
    this.data.monthlyHonors.unshift(honor);
    this.save();
  }

  public deleteMonthlyHonor(id: string) {
    this.data.monthlyHonors = this.data.monthlyHonors.filter(h => h.id !== id);
    this.save();
  }

  public addReward(r: MonthlyReward) {
    this.data.rewards.unshift(r);
    this.save();
  }

  public updateReward(id: string, updates: Partial<MonthlyReward>) {
    const idx = this.data.rewards.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.rewards[idx] = { ...this.data.rewards[idx], ...updates };
      this.save();
    }
  }

  public deleteReward(id: string) {
    this.data.rewards = this.data.rewards.filter(r => r.id !== id);
    this.save();
  }

  public setStudentProfileExtra(profile: StudentProfileExtra) {
    const idx = this.data.studentProfiles.findIndex(p => p.studentId === profile.studentId);
    if (idx !== -1) {
      this.data.studentProfiles[idx] = profile;
    } else {
      this.data.studentProfiles.push(profile);
    }
    this.save();
  }
}

export const db = new Database();
