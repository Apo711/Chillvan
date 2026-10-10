# CHILL VĂN – CÔ YẾN THANH: HƯỚNG DẪN KỸ THUẬT & TRIỂN KHAI

## 1. CẤU TRÚC THƯ MỤC DỰ ÁN

```
/
├── .env.example                     # Biến môi trường mẫu
├── index.html                       # HTML entry point với typography Nunito & Be Vietnam Pro
├── metadata.json                    # Metadata ứng dụng AI Studio
├── package.json                     # Quản lý dependencies & scripts
├── server.ts                        # Express entry point tích hợp Vite middleware trên cổng 3000
├── tsconfig.json                    # Cấu hình TypeScript
├── vite.config.ts                   # Cấu hình Vite & Tailwind v4
├── data/
│   └── chill_van_db.json            # Cơ sở dữ liệu JSON nguyên tử lưu trữ thực tế
├── server/
│   ├── auth.ts                      # JWT xác thực, middleware phân quyền giáo viên/học sinh
│   ├── db.ts                        # Database engine persistent lưu trữ quan hệ
│   └── routes/
│       ├── assignments.ts           # 6 dạng bài tập, giao bài, lưu nháp, hạn nộp
│       ├── auth.ts                  # Đăng nhập cô/trò, cấp tài khoản, đổi mật khẩu
│       ├── classes.ts               # Quản lý lớp học, năm học
│       ├── gamification.ts          # Điểm sao, đường đua Chill Văn, vinh danh, quà tặng
│       ├── materials.ts             # Thư viện ngữ liệu, bài giảng, tải xuống
│       ├── stats.ts                 # Thống kê tổng quan cho giáo viên
│       ├── students.ts              # Quản lý học sinh, cấp tài khoản, hồ sơ tiến bộ
│       └── submissions.ts           # Chấm bài, nhận xét, tự động chấm trắc nghiệm
└── src/
    ├── App.tsx                      # Root App kết nối AuthProvider & điều hướng
    ├── index.css                    # Cấu hình Tailwind v4 & Pastel theme
    ├── main.tsx                     # React 19 bootstrap
    ├── context/
    │   └── AuthContext.tsx          # Quản lý phiên đăng nhập thực tế
    ├── services/
    │   └── api.ts                   # Client API kết nối backend có Bearer token
    ├── types/
    │   └── index.ts                 # Toàn bộ TypeScript schemas
    └── components/
        ├── auth/
        │   └── AuthScreen.tsx       # Giao diện đăng nhập Cô trò & Khởi tạo quản trị
        ├── common/
        │   ├── Header.tsx           # Thanh điều hướng Top Bar
        │   ├── ConfirmationModal.tsx# Hộp thoại xác nhận thao tác nhạy cảm
        │   └── Toast.tsx            # Thông báo hệ thống
        ├── teacher/
        │   ├── TeacherDashboard.tsx # Bảng tổng quan giáo viên & thao tác nhanh
        │   ├── ClassManagement.tsx  # Quản lý lớp học, cấp tài khoản học sinh
        │   ├── MaterialLibrary.tsx  # Thư viện tài liệu học tập
        │   ├── AssignmentCreator.tsx# Biên soạn bài tập với 6 dạng câu hỏi
        │   ├── GradingCenter.tsx    # Chấm bài, nhận xét & công bố điểm
        │   ├── AchievementManager.tsx# Điểm sao, Bảng vinh danh & Quà tháng
        │   └── TeacherSettings.tsx  # Cài đặt tài khoản & mật khẩu giáo viên
        └── student/
            ├── StudentHome.tsx      # Trang chủ học sinh cá nhân hóa
            ├── StudentAssignments.tsx# Danh sách bài tập được giao
            ├── AssignmentTaking.tsx # Giao diện làm bài trực tuyến & xem điểm
            ├── StudentLibrary.tsx   # Thư viện tài liệu dành cho học sinh
            ├── StudentRaceTrack.tsx # Đường đua thi đua & Bảng vinh danh
            └── StudentProfile.tsx   # Hồ sơ cá nhân (Điểm mạnh, Mục tiêu)
```

---

## 2. DATABASE SCHEMA (POSTGRESQL / SUPABASE HOẶC EQUIVALENT)

Khi triển khai lên hệ quản trị cơ sở dữ liệu quan hệ PostgreSQL (hoặc Supabase):

```sql
-- 1. Bảng người dùng (Users)
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
    email VARCHAR(255) UNIQUE,
    username VARCHAR(100) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    class_id VARCHAR(64),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng lớp học (Classes)
CREATE TABLE classes (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    grade VARCHAR(10) NOT NULL,
    school_year VARCHAR(50) NOT NULL,
    description TEXT,
    teacher_id VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Khóa ngoại lớp học cho học sinh
ALTER TABLE users ADD CONSTRAINT fk_user_class FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;

-- 3. Bảng tài liệu học tập (Learning Materials)
CREATE TABLE learning_materials (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    topic VARCHAR(100) NOT NULL,
    class_id VARCHAR(64) NOT NULL, -- 'all' hoặc ID lớp
    file_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size VARCHAR(50),
    file_content TEXT,
    url TEXT,
    teacher_id VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng bài tập (Assignments)
CREATE TABLE assignments (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    class_id VARCHAR(64) REFERENCES classes(id),
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_score NUMERIC(5,2) DEFAULT 10,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'closed')),
    allow_retry BOOLEAN DEFAULT FALSE,
    teacher_id VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng bài nộp của học sinh (Assignment Submissions)
CREATE TABLE assignment_submissions (
    id VARCHAR(64) PRIMARY KEY,
    assignment_id VARCHAR(64) REFERENCES assignments(id) ON DELETE CASCADE,
    student_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(64) REFERENCES classes(id),
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'graded')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    auto_graded_score NUMERIC(5,2) DEFAULT 0,
    final_score NUMERIC(5,2),
    teacher_feedback TEXT,
    is_published BOOLEAN DEFAULT FALSE,
    graded_at TIMESTAMP WITH TIME ZONE,
    history JSONB DEFAULT '[]'::jsonb,
    CONSTRAINT unique_student_assignment UNIQUE (assignment_id, student_id)
);

-- 6. Bảng lịch sử điểm thành tích (Achievement Point Logs)
CREATE TABLE achievement_point_logs (
    id VARCHAR(64) PRIMARY KEY,
    student_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    class_id VARCHAR(64) REFERENCES classes(id),
    points INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    teacher_id VARCHAR(64) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng vinh danh hàng tháng (Monthly Honors)
CREATE TABLE monthly_honors (
    id VARCHAR(64) PRIMARY KEY,
    month VARCHAR(20) NOT NULL, -- '10/2026'
    class_id VARCHAR(64) REFERENCES classes(id),
    category VARCHAR(50) NOT NULL,
    student_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    teacher_comment TEXT,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Bảng quà thưởng hàng tháng (Monthly Rewards)
CREATE TABLE monthly_rewards (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    condition_text TEXT NOT NULL,
    min_points INTEGER,
    quantity INTEGER,
    available_month VARCHAR(20) NOT NULL,
    image_url TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Bảng hồ sơ học sinh sư phạm (Student Profile Extra)
CREATE TABLE student_profile_extras (
    student_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    strengths TEXT, -- "Điểm mạnh của em"
    needs_improvement TEXT, -- "Điều em cần cố gắng"
    monthly_goals TEXT, -- "Mục tiêu tháng này"
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 3. CẤU HÌNH BẢO MẬT VÀ PHÂN QUYỀN

1. **Không lưu mật khẩu dạng thô**:
   - Sử dụng `bcrypt` với 10 vòng salt (`bcrypt.hashSync`).
   - Mật khẩu học sinh được mã hóa ngay khi giáo viên tạo tài khoản.
2. **Xác thực phiên làm việc an toàn**:
   - Token JWT ký bằng khóa bí mật (`JWT_SECRET`), gửi qua tiêu đề chuẩn `Authorization: Bearer <token>`.
   - Ngăn chặn triệt để cookie bên thứ ba bị chặn trong môi trường iFrame.
3. **Phân quyền nghiêm ngặt theo vai trò**:
   - `requireTeacher`: Chỉ tài khoản mang vai trò `teacher` mới có thể tạo/sửa/xóa bài tập, lớp học, tài liệu, chấm bài, và tặng điểm sao.
   - `requireStudent`: Học sinh chỉ nộp bài tập được giao cho lớp của mình và chỉnh sửa bài làm của chính mình.
   - Học sinh tuyệt đối không thể truy cập vào bài làm, nhận xét riêng tư hoặc điểm số của học sinh khác.
   - Đáp án trắc nghiệm chuẩn được ẩn hoàn toàn khỏi phản hồi API của học sinh cho đến khi giáo viên chấm và công bố kết quả.

---

## 4. QUY TRÌNH THIẾT LẬP TÀI KHOẢN GIÁO VIÊN ĐẦU TIÊN

1. Mở trang web ứng dụng.
2. Nếu hệ thống mới khởi tạo chưa có giáo viên, tab **Thiết lập** sẽ xuất hiện trên màn hình đăng nhập.
3. Giáo viên nhập:
   - Họ và tên: `Cô Yến Thanh (Ngữ Văn)`
   - Email: `coyenthanh@chillvan.edu.vn`
   - Mật khẩu: (tối thiểu 6 ký tự)
4. Nhấn **Khởi tạo tài khoản Giáo viên**.
5. Hệ thống ngay lập tức tạo tài khoản, sinh token đăng nhập và chuyển hướng vào Dashboard quản trị.

---

## 5. BIẾN MÔI TRƯỜNG CẦN CẤU HÌNH (.env)

```env
# Cổng ứng dụng
PORT=3000

# Khóa bí mật ký mã hóa JWT
JWT_SECRET=chill_van_yen_thanh_super_secret_jwt_key_2026

# Môi trường chạy
NODE_ENV=development
```

---

## 6. HƯỚNG DẪN TRIỂN KHAI LÊN NỀN TẢNG (BUILD & START)

- **Cài đặt dependencies**: `npm install`
- **Khởi chạy Development**: `npm run dev` (sử dụng `tsx server.ts`, tự động mount Vite dev server trên cổng 3000)
- **Đóng gói Production**: `npm run build`
- **Khởi chạy Production**: `npm start` (chạy `tsx server.ts` phục vụ API và static frontend từ thư mục `dist`)

---

## 7. KỊCH BẢN KIỂM THỬ THỰC TẾ (END-TO-END FLOW)

1. **Giáo viên đăng nhập**:
   - Email: `coyenthanh@chillvan.edu.vn` / Mật khẩu: `CoYenThanh2026@`.
2. **Tạo lớp và cấp tài khoản học sinh**:
   - Vào mục **Lớp học** → Nhấn **+ Cấp tài khoản học sinh**.
   - Nhập họ tên: `Lê Bảo Châu`, chọn lớp `Lớp 6A`.
   - Hệ thống tự sinh tài khoản duy nhất `baochau` và mật khẩu `123456`.
3. **Giáo viên giao bài tập**:
   - Vào mục **Bài tập** → Nhấn **+ Tạo bài tập mới**.
   - Tạo câu hỏi trắc nghiệm, đúng/sai, điền khuyết và câu hỏi viết văn nghị luận.
   - Nhấn **Giao bài ngay**.
4. **Học sinh đăng nhập và làm bài**:
   - Đăng xuất tài khoản giáo viên, chuyển sang tab **Học sinh**.
   - Đăng nhập: `ducminh` / `123456`.
   - Trang chủ hiển thị: *"Chào mừng Trần Đức Minh đến với Chill Văn!"*.
   - Mở bài tập, trả lời các câu hỏi, nhấn **Nộp bài cho cô**. Pháo hoa chúc mừng xuất hiện!
5. **Giáo viên chấm điểm & nhận xét**:
   - Đăng nhập lại Cô Yến Thanh.
   - Vào mục **Chấm bài** → Mở bài nộp của Đức Minh.
   - Chấm điểm từng câu, nhập nhận xét khích lệ, nhấn **Chấm & Công bố điểm**.
6. **Cộng điểm sao và cập nhật đường đua**:
   - Vào mục **Thành tích** → Tặng `+20` điểm sao cho Đức Minh vì làm bài chăm chỉ.
   - Thêm Đức Minh vào **Bảng Vinh Danh** danh hiệu *Ngôi sao sáng tạo*.
7. **Học sinh xem kết quả**:
   - Đăng nhập học sinh kiểm tra Hồ sơ cá nhân: Điểm số đã công bố, lời nhận xét của cô, điểm sao tăng lên và biểu tượng mascot tiến xa trên Đường đua thi đua!
