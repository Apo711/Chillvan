import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { BookOpen, UserCheck, GraduationCap, Lock, Mail, ArrowRight, Sparkles, KeyRound, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/api.js';

export const AuthScreen: React.FC = () => {
  const { loginTeacher, loginStudent, setupTeacher, systemStatus } = useAuth();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'setup'>('student');
  const [showPassword, setShowPassword] = useState(false);

  // Student Form
  const [studentUsername, setStudentUsername] = useState('ducminh');
  const [studentPassword, setStudentPassword] = useState('123456');

  // Teacher Form
  const [teacherEmail, setTeacherEmail] = useState('coyenthanh@chillvan.edu.vn');
  const [teacherPassword, setTeacherPassword] = useState('CoYenThanh2026@');

  // Setup Form
  const [setupFullName, setSetupFullName] = useState('Cô Yến Thanh (Ngữ Văn)');
  const [setupEmail, setSetupEmail] = useState('coyenthanh@chillvan.edu.vn');
  const [setupPassword, setSetupPassword] = useState('CoYenThanh2026@');
  const [setupKey, setSetupKey] = useState('');

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await loginStudent(studentUsername, studentPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await loginTeacher(teacherEmail, teacherPassword);
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      await setupTeacher(setupEmail, setupFullName, setupPassword, setupKey);
    } catch (err: any) {
      setErrorMsg(err.message || 'Thiết lập tài khoản thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.teacherForgotPassword(forgotEmail);
      setForgotMsg(res.message);
    } catch (err: any) {
      setForgotMsg(err.message || 'Không thể khôi phục');
    }
  };

  const fillQuickAccount = (type: 'teacher' | 'student1' | 'student2') => {
    setErrorMsg('');
    if (type === 'teacher') {
      setActiveTab('teacher');
      setTeacherEmail('coyenthanh@chillvan.edu.vn');
      setTeacherPassword('CoYenThanh2026@');
    } else if (type === 'student1') {
      setActiveTab('student');
      setStudentUsername('ducminh');
      setStudentPassword('123456');
    } else {
      setActiveTab('student');
      setStudentUsername('haianh');
      setStudentPassword('123456');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF5F9] via-[#FFFDFB] to-[#F0F9FF] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Banner Branding */}
      <div className="max-w-4xl mx-auto w-full pt-4 sm:pt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-100/70 text-pink-700 text-xs font-bold mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          Học Văn thật chill – Mỗi ngày một chút tiến bộ!
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-800">
          CHILL VĂN – <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-sky-500 bg-clip-text text-transparent">CÔ YẾN THANH</span>
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
          Không gian học tập Ngữ văn thân thiện, sinh động và đầy cảm hứng dành cho cô trò.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-md mx-auto w-full my-6 bg-white rounded-3xl border border-pink-100 shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Soft background pastel decorative blob */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-pink-100/60 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 rounded-full bg-sky-100/60 blur-xl pointer-events-none" />

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-6 relative z-10">
          <button
            type="button"
            onClick={() => { setActiveTab('student'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'student'
                ? 'bg-white text-pink-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Học sinh
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('teacher'); setErrorMsg(''); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-white text-sky-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Giáo viên
          </button>
          {(!systemStatus?.hasTeacher || activeTab === 'setup') && (
            <button
              type="button"
              onClick={() => { setActiveTab('setup'); setErrorMsg(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'setup'
                  ? 'bg-white text-amber-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Thiết lập
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* STUDENT LOGIN FORM */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tên đăng nhập (do cô cấp)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={studentUsername}
                  onChange={e => setStudentUsername(e.target.value)}
                  placeholder="Ví dụ: ducminh hoặc haianh"
                  className="w-full pl-3.5 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-sm font-medium text-slate-800 transition-all"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Tên viết liền không dấu, không khoảng cách.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={studentPassword}
                  onChange={e => setStudentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-pink-400 focus:ring-2 focus:ring-pink-100 text-sm font-medium text-slate-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Đang đăng nhập...' : 'Vào lớp học ngay'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* TEACHER LOGIN FORM */}
        {activeTab === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email giáo viên
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={teacherEmail}
                  onChange={e => setTeacherEmail(e.target.value)}
                  placeholder="coyenthanh@chillvan.edu.vn"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 focus:ring-2 focus:ring-sky-100 text-sm font-medium text-slate-800 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">Mật khẩu</label>
                <button
                  type="button"
                  onClick={() => { setIsForgotModalOpen(true); setForgotEmail(teacherEmail); setForgotMsg(''); }}
                  className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={teacherPassword}
                  onChange={e => setTeacherPassword(e.target.value)}
                  placeholder="Nhập mật khẩu giáo viên..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-sky-400 focus:ring-2 focus:ring-sky-100 text-sm font-medium text-slate-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-sky-400 via-sky-500 to-sky-600 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập Quản trị'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SETUP INITIAL TEACHER ACCOUNT */}
        {activeTab === 'setup' && (
          <form onSubmit={handleSetupSubmit} className="space-y-4 relative z-10">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ và tên giáo viên
              </label>
              <input
                type="text"
                required
                value={setupFullName}
                onChange={e => setSetupFullName(e.target.value)}
                placeholder="Cô Yến Thanh (Ngữ Văn)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-pink-400 text-sm font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={setupEmail}
                onChange={e => setSetupEmail(e.target.value)}
                placeholder="coyenthanh@chillvan.edu.vn"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-pink-400 text-sm font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mật khẩu khởi tạo
              </label>
              <input
                type="password"
                required
                value={setupPassword}
                onChange={e => setSetupPassword(e.target.value)}
                placeholder="Từ 6 ký tự trở lên..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-pink-400 text-sm font-medium text-slate-800"
              />
            </div>
            {systemStatus?.hasTeacher && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã an toàn quản trị (Security Key)
                </label>
                <input
                  type="password"
                  value={setupKey}
                  onChange={e => setSetupKey(e.target.value)}
                  placeholder="Nhập khóa bảo mật để tạo thêm giáo viên..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-pink-400 text-sm font-medium text-slate-800"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Khởi tạo tài khoản Giáo viên'}
            </button>
          </form>
        )}

        {/* Quick Credentials Helpers Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Tài khoản mẫu có sẵn để trải nghiệm ngay
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('teacher')}
              className="px-2 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-[11px] font-bold transition-colors text-center cursor-pointer"
            >
              Cô Yến Thanh
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('student1')}
              className="px-2 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold transition-colors text-center cursor-pointer"
            >
              HS Đức Minh
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount('student2')}
              className="px-2 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold transition-colors text-center cursor-pointer"
            >
              HS Hải Anh
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-sky-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-2">Quên mật khẩu giáo viên</h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập email đăng ký của bạn. Hệ thống sẽ cung cấp mã khôi phục đặt lại mật khẩu.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="coyenthanh@chillvan.edu.vn"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
              {forgotMsg && (
                <div className="p-2.5 rounded-xl bg-sky-50 text-sky-800 text-xs font-medium">
                  {forgotMsg}
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
                >
                  Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        © 2026 CHILL VĂN – CÔ YẾN THANH · Hệ thống quản lý học tập môn Ngữ văn
      </footer>
    </div>
  );
};
