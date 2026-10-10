import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { StudentProfileData } from '../../types/index.js';
import {
  User,
  Star,
  Trophy,
  Sparkles,
  Lock,
  CheckCircle2,
  BookOpen,
  Calendar,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.getStudentProfile(user.id);
      setProfile(data);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải hồ sơ' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setNotification({ type: 'error', message: 'Mật khẩu xác nhận không trùng khớp' });
      return;
    }
    if (newPassword.length < 6) {
      setNotification({ type: 'error', message: 'Mật khẩu mới phải từ 6 ký tự trở lên' });
      return;
    }

    try {
      setIsChangingPass(true);
      await api.studentChangePassword(currentPassword, newPassword);
      setNotification({ type: 'success', message: 'Đổi mật khẩu thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsChangingPass(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-3 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
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

      {/* Header Profile Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
        {/* Soft background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-pink-100/50 rounded-bl-full pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-pink-300 to-sky-300 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-sm border-2 border-white">
            {profile.fullName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span className="font-bold text-sky-600">{profile.className}</span>
              <span>·</span>
              <span className="font-mono">Tài khoản: {profile.username}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800">
              {profile.fullName}
            </h2>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-100">
                ⭐ {profile.totalPoints} điểm sao
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold border border-pink-100">
                ✓ {profile.completedAssignmentsCount} bài hoàn thành
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Pedagogical Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Điểm mạnh của em */}
        <div className="bg-white rounded-3xl p-6 border border-pink-100/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-pink-600 uppercase tracking-wider mb-2">
            <span>⭐ Điểm mạnh của em</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {profile.profileExtra?.strengths || 'Cô Yến Thanh đang theo dõi và sẽ sớm ghi nhận những điểm nổi bật của em tại đây!'}
          </p>
        </div>

        {/* Điều em cần cố gắng */}
        <div className="bg-white rounded-3xl p-6 border border-sky-100/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-sky-600 uppercase tracking-wider mb-2">
            <span>🌱 Điều em cần cố gắng</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {profile.profileExtra?.needsImprovement || 'Em hãy luôn tự tin, đọc thêm tác phẩm và rèn luyện câu chữ đều đặn nhé!'}
          </p>
        </div>

        {/* Mục tiêu tháng này */}
        <div className="bg-white rounded-3xl p-6 border border-amber-100/80 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-wider mb-2">
            <span>🎯 Mục tiêu tháng này</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            {profile.profileExtra?.monthlyGoals || 'Tích cực phát biểu và nộp đầy đủ bài tập đúng hạn để nhận sao Chill Văn!'}
          </p>
        </div>
      </div>

      {/* Recent submissions history and feedback */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-pink-500" />
          Kết Quả & Nhận Xét Các Bài Đã Hoàn Thành
        </h3>

        {profile.recentSubmissions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs sm:text-sm">
            Chưa có bài tập nào được chấm và công bố điểm. Em hãy tích cực hoàn thành bài tập nhé!
          </div>
        ) : (
          <div className="space-y-3.5">
            {profile.recentSubmissions.map(sub => (
              <div key={sub.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                  <h4 className="text-sm font-bold text-slate-800">{sub.assignmentTitle}</h4>
                  <div className="text-sm font-black text-pink-600 tabular-nums">
                    {sub.finalScore} / {sub.maxScore} điểm
                  </div>
                </div>

                {sub.teacherFeedback && (
                  <div className="p-3 rounded-xl bg-pink-50/60 text-xs text-slate-700 italic border border-pink-100/80 leading-relaxed">
                    <span className="font-bold text-pink-700 not-italic">Cô nhận xét:</span> "{sub.teacherFeedback}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-sky-500" />
          Đổi Mật Khẩu Đăng Nhập
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu mới (từ 6 ký tự)</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPass}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 hover:opacity-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isChangingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
};
