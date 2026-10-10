import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { ClassItem, StudentListItem } from '../../types/index.js';
import {
  Users,
  Plus,
  Search,
  KeyRound,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  UserPlus,
  Sparkles,
  Check,
  Copy,
  FolderPlus,
  BookOpen,
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal.js';

interface ClassManagementProps {
  initialOpenAddStudent?: boolean;
}

export const ClassManagement: React.FC<ClassManagementProps> = ({ initialOpenAddStudent = false }) => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddClassModal, setIsAddClassModal] = useState(false);
  const [isAddStudentModal, setIsAddStudentModal] = useState(initialOpenAddStudent);
  const [isResetPasswordModal, setIsResetPasswordModal] = useState(false);
  const [isProfileModal, setIsProfileModal] = useState(false);
  const [isDeleteClassModal, setIsDeleteClassModal] = useState(false);

  // Class Form
  const [newClassName, setNewClassName] = useState('');
  const [newClassGrade, setNewClassGrade] = useState('6');
  const [newClassYear, setNewClassYear] = useState('2026 - 2027');
  const [newClassDesc, setNewClassDesc] = useState('');

  // Student Form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentUser, setNewStudentUser] = useState('');
  const [newStudentPass, setNewStudentPass] = useState('123456');
  const [newStudentClassId, setNewStudentClassId] = useState('');

  // Credentials Generated Success Notice
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; initialPassword: string; fullName: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Reset Password State
  const [selectedStudentForReset, setSelectedStudentForReset] = useState<StudentListItem | null>(null);
  const [resetPassInput, setResetPassInput] = useState('123456');

  // Edit Profile Extra State
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<StudentListItem | null>(null);
  const [strengths, setStrengths] = useState('');
  const [needsImprovement, setNeedsImprovement] = useState('');
  const [monthlyGoals, setMonthlyGoals] = useState('');

  // Delete Class State
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [classList, studentList] = await Promise.all([
        api.getClasses(),
        api.getStudents({ classId: selectedClassId }),
      ]);
      setClasses(classList);
      setStudents(studentList);
      if (classList.length > 0 && !newStudentClassId) {
        setNewStudentClassId(classList[0].id);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải dữ liệu' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createClass({
        name: newClassName,
        grade: newClassGrade,
        schoolYear: newClassYear,
        description: newClassDesc,
      });
      setNotification({ type: 'success', message: 'Tạo lớp học mới thành công!' });
      setIsAddClassModal(false);
      setNewClassName('');
      setNewClassDesc('');
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createStudent({
        fullName: newStudentName,
        username: newStudentUser || undefined,
        password: newStudentPass,
        classId: newStudentClassId,
      });

      setCreatedCredentials({
        fullName: newStudentName,
        username: res.credentialsGiven.username,
        initialPassword: res.credentialsGiven.initialPassword,
      });

      setNotification({ type: 'success', message: 'Tạo tài khoản học sinh thành công!' });
      setNewStudentName('');
      setNewStudentUser('');
      setNewStudentPass('123456');
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForReset) return;
    try {
      await api.resetStudentPassword(selectedStudentForReset.id, resetPassInput);
      setNotification({
        type: 'success',
        message: `Đã đặt lại mật khẩu cho học sinh ${selectedStudentForReset.fullName} thành: ${resetPassInput}`,
      });
      setIsResetPasswordModal(false);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleToggleLockStudent = async (student: StudentListItem) => {
    const newStatus = student.status === 'active' ? 'locked' : 'active';
    try {
      await api.updateStudent(student.id, { status: newStatus });
      setNotification({
        type: 'success',
        message: newStatus === 'locked' ? 'Đã khóa tài khoản học sinh' : 'Đã kích hoạt lại tài khoản',
      });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleSaveProfileExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForProfile) return;
    try {
      await api.updateStudentProfileExtra(selectedStudentForProfile.id, {
        strengths,
        needsImprovement,
        monthlyGoals,
      });
      setNotification({ type: 'success', message: 'Đã lưu nhận xét và mục tiêu của học sinh!' });
      setIsProfileModal(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteClassConfirm = async () => {
    if (!classToDelete) return;
    try {
      await api.deleteClass(classToDelete.id);
      setNotification({ type: 'success', message: 'Đã xóa lớp học thành công' });
      setIsDeleteClassModal(false);
      setClassToDelete(null);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
      setIsDeleteClassModal(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
      )}

      {/* Header bar with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Quản Lý Lớp Học & Học Sinh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tạo lớp, cấp tài khoản học sinh và theo dõi thông tin học tập
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddClassModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-pink-200 text-slate-700 hover:bg-pink-50 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <FolderPlus className="w-4 h-4 text-pink-500" />
            + Tạo lớp học
          </button>
          <button
            onClick={() => { setIsAddStudentModal(true); setCreatedCredentials(null); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            + Cấp tài khoản học sinh
          </button>
        </div>
      </div>

      {/* Class filter strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedClassId('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
            selectedClassId === 'all'
              ? 'bg-pink-500 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-pink-200'
          }`}
        >
          Tất cả lớp ({classes.reduce((sum, c) => sum + (c.studentCount || 0), 0)} HS)
        </button>
        {classes.map(c => (
          <div key={c.id} className="relative group shrink-0">
            <button
              onClick={() => setSelectedClassId(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedClassId === c.id
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-200'
              }`}
            >
              {c.name} ({c.studentCount || 0} HS)
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setClassToDelete(c); setIsDeleteClassModal(true); }}
              className="hidden group-hover:inline-flex absolute -top-1 -right-1 p-0.5 rounded-full bg-rose-500 text-white hover:bg-rose-600"
              title="Xóa lớp học"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Student List Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        {/* Search & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="text-sm font-bold text-slate-700">
            Danh sách học sinh ({filteredStudents.length} học sinh)
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc tài khoản..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-pink-400"
            />
          </div>
        </div>

        {/* Student Table / Cards */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Chưa có học sinh nào phù hợp. Hãy bấm <span className="text-pink-500 font-bold">+ Cấp tài khoản học sinh</span> nhé!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Học sinh</th>
                  <th className="pb-3">Tài khoản</th>
                  <th className="pb-3">Lớp</th>
                  <th className="pb-3">Điểm sao</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3 pr-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-pink-50/20 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {student.fullName.charAt(0)}
                      </div>
                      <div>
                        <div>{student.fullName}</div>
                        {student.profileExtra?.strengths && (
                          <div className="text-[11px] font-normal text-slate-500 truncate max-w-xs">
                            ⭐ {student.profileExtra.strengths}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 font-mono text-xs font-semibold">
                      {student.username}
                    </td>
                    <td className="py-3.5 font-medium text-slate-700">
                      {student.className}
                    </td>
                    <td className="py-3.5 font-bold text-amber-500 tabular-nums">
                      ⭐ {student.totalPoints}
                    </td>
                    <td className="py-3.5">
                      {student.status === 'active' ? (
                        <span className="text-emerald-700 text-xs font-bold">Hoạt động</span>
                      ) : (
                        <span className="text-rose-700 text-xs font-bold">Đã khóa</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Profile Extra Editor */}
                        <button
                          onClick={() => {
                            setSelectedStudentForProfile(student);
                            setStrengths(student.profileExtra?.strengths || '');
                            setNeedsImprovement(student.profileExtra?.needsImprovement || '');
                            setMonthlyGoals(student.profileExtra?.monthlyGoals || '');
                            setIsProfileModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Cập nhật nhận xét & mục tiêu của học sinh"
                        >
                          <Sparkles className="w-4 h-4" />
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => {
                            setSelectedStudentForReset(student);
                            setResetPassInput('123456');
                            setIsResetPasswordModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                          title="Đặt lại mật khẩu cho học sinh"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>

                        {/* Lock / Unlock */}
                        <button
                          onClick={() => handleToggleLockStudent(student)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            student.status === 'active'
                              ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-rose-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={student.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {student.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: CREATE CLASS */}
      {isAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-pink-500" />
              Thêm Lớp Học Mới
            </h3>
            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên lớp học</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Lớp 7C - Yêu Văn Học"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-pink-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Khối lớp</label>
                  <select
                    value={newClassGrade}
                    onChange={e => setNewClassGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="6">Khối 6</option>
                    <option value="7">Khối 7</option>
                    <option value="8">Khối 8</option>
                    <option value="9">Khối 9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Năm học</label>
                  <input
                    type="text"
                    value={newClassYear}
                    onChange={e => setNewClassYear(e.target.value)}
                    placeholder="2026 - 2027"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả / Mục tiêu lớp</label>
                <textarea
                  rows={2}
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  placeholder="Ví dụ: Rèn luyện kỹ năng đọc hiểu và viết văn nghị luận..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold"
                >
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STUDENT ACCOUNT */}
      {isAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-pink-500" />
              Cấp Tài Khoản Học Sinh Mới
            </h3>

            {createdCredentials ? (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 mb-4">
                <div className="font-bold text-sm flex items-center gap-1.5 text-emerald-800">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Đã tạo tài khoản cho {createdCredentials.fullName}!
                </div>
                <div className="mt-2 p-2.5 bg-white rounded-xl border border-emerald-100 text-xs font-mono space-y-1">
                  <div>Tên đăng nhập: <strong className="text-slate-900">{createdCredentials.username}</strong></div>
                  <div>Mật khẩu ban đầu: <strong className="text-slate-900">{createdCredentials.initialPassword}</strong></div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Tài khoản Chill Văn: ${createdCredentials.username} / Mật khẩu: ${createdCredentials.initialPassword}`);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="mt-3 w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã sao chép!' : 'Sao chép thông tin gửi học sinh'}
                </button>
                <div className="mt-3 text-center">
                  <button
                    type="button"
                    onClick={() => setCreatedCredentials(null)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                  >
                    + Tạo thêm học sinh khác
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên học sinh *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lê Bảo Châu"
                    value={newStudentName}
                    onChange={e => setNewStudentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chọn lớp học *</label>
                  <select
                    required
                    value={newStudentClassId}
                    onChange={e => setNewStudentClassId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên đăng nhập (tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Tự tạo tự động nếu để trống (ví dụ: baochau)"
                    value={newStudentUser}
                    onChange={e => setNewStudentUser(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono text-xs"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Không dấu, dễ nhớ để các em dễ đăng nhập.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu ban đầu *</label>
                  <input
                    type="text"
                    required
                    value={newStudentPass}
                    onChange={e => setNewStudentPass(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddStudentModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Đóng
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold"
                  >
                    Tạo tài khoản
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {isResetPasswordModal && selectedStudentForReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-sky-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-sky-500" />
              Đặt lại mật khẩu
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Đặt lại mật khẩu cho học sinh <strong>{selectedStudentForReset.fullName}</strong> (Tài khoản: {selectedStudentForReset.username})
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới</label>
                <input
                  type="text"
                  required
                  value={resetPassInput}
                  onChange={e => setResetPassInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
                >
                  Lưu mật khẩu mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT STUDENT EXTRA PROFILE */}
      {isProfileModal && selectedStudentForProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-amber-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Ghi nhận Tiến bộ & Mục tiêu của {selectedStudentForProfile.fullName}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nội dung này sẽ hiển thị riêng trong Hồ sơ cá nhân của học sinh để khích lệ các em.
            </p>
            <form onSubmit={handleSaveProfileExtra} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ⭐ Điểm mạnh của em
                </label>
                <textarea
                  rows={2}
                  value={strengths}
                  onChange={e => setStrengths(e.target.value)}
                  placeholder="Ví dụ: Giọng văn truyền cảm, vốn từ giàu hình ảnh, tiếp thu nhanh..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🌱 Điều em cần cố gắng
                </label>
                <textarea
                  rows={2}
                  value={needsImprovement}
                  onChange={e => setNeedsImprovement(e.target.value)}
                  placeholder="Ví dụ: Chú ý lỗi chính tả và ngắt câu, rèn luyện thêm cách viết mở bài gián tiếp..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  🎯 Mục tiêu tháng này
                </label>
                <textarea
                  rows={2}
                  value={monthlyGoals}
                  onChange={e => setMonthlyGoals(e.target.value)}
                  placeholder="Ví dụ: Đạt điểm 8+ bài viết số 2 và tích lũy thêm 50 điểm sao Chill Văn..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                >
                  Lưu hồ sơ học sinh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION: DELETE CLASS */}
      <ConfirmationModal
        isOpen={isDeleteClassModal}
        title="Xóa Lớp Học"
        message={`Cô có chắc chắn muốn xóa lớp "${classToDelete?.name}"? Chỉ có thể xóa khi lớp không còn học sinh.`}
        confirmLabel="Xóa lớp"
        isDestructive
        onConfirm={handleDeleteClassConfirm}
        onCancel={() => setIsDeleteClassModal(false)}
      />
    </div>
  );
};
