import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Settings, Lock, ShieldCheck, Download, Database, Check } from 'lucide-react';

export const TeacherSettings: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isChangingPass, setIsChangingPass] = useState(false);

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
      await api.teacherChangePassword(currentPassword, newPassword);
      setNotification({ type: 'success', message: 'Đổi mật khẩu giáo viên thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Cài Đặt Tài Khoản & Hệ Thống
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Thông tin giáo viên, bảo mật mật khẩu và lưu trữ dữ liệu
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-sky-500" />
          Hồ Sơ Giáo Viên
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div>
            <label className="text-slate-400 font-bold block mb-1">Họ và tên</label>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-800 font-semibold">{user?.fullName}</div>
          </div>
          <div>
            <label className="text-slate-400 font-bold block mb-1">Email đăng nhập</label>
            <div className="p-3 bg-slate-50 rounded-xl text-slate-800 font-semibold">{user?.email}</div>
          </div>
          <div>
            <label className="text-slate-400 font-bold block mb-1">Vai trò</label>
            <div className="p-3 bg-pink-50 rounded-xl text-pink-700 font-bold">Giáo viên Ngữ văn</div>
          </div>
          <div>
            <label className="text-slate-400 font-bold block mb-1">Trạng thái hệ thống</label>
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-700 font-bold">Đang hoạt động bình thường</div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-pink-500" />
          Đổi Mật Khẩu Giáo Viên
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
            className="px-5 py-2.5 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {isChangingPass ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
          </button>
        </form>
      </div>

      {/* Database & Backup Info */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Cơ Sở Dữ Liệu Thực Tế</h4>
            <p className="text-xs text-slate-500">
              Lưu trữ vĩnh viễn trên máy chủ, sẵn sàng sao lưu và đồng bộ
            </p>
          </div>
        </div>
        <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
          ✓ An toàn & Đồng bộ
        </div>
      </div>
    </div>
  );
};
