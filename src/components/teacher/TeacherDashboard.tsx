import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.js';
import { DashboardStats } from '../../types/index.js';
import {
  Users,
  BookOpen,
  FileText,
  Clock,
  Sparkles,
  Library,
  PlusCircle,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface TeacherDashboardProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-3 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const { stats, assignmentsOverview, recentMaterials } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-200/90 via-pink-100 to-sky-200/80 p-6 sm:p-8 border border-pink-200/60 shadow-xs">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 text-pink-700 text-xs font-bold mb-2.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            Chào mừng Cô Yến Thanh trở lại giảng dạy!
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Góc Quản Trị Lớp Học Chill Văn
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-slate-600 font-medium">
            Hôm nay cô có <span className="font-bold text-rose-600">{stats.pendingGradingCount} bài nộp</span> đang chờ chấm điểm và nhận xét.
          </p>

          {/* Quick Action Buttons */}
          <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => onNavigate('classes', { openAddStudent: true })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-pink-50 text-slate-800 text-xs sm:text-sm font-bold shadow-xs border border-pink-200 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-pink-500" />
              + Thêm học sinh
            </button>
            <button
              onClick={() => onNavigate('library', { openUpload: true })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-sky-50 text-slate-800 text-xs sm:text-sm font-bold shadow-xs border border-sky-200 transition-all cursor-pointer"
            >
              <Library className="w-4 h-4 text-sky-500" />
              + Đăng tài liệu
            </button>
            <button
              onClick={() => onNavigate('assignments', { openCreate: true })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-pink-50 text-slate-800 text-xs sm:text-sm font-bold shadow-xs border border-pink-200 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-pink-500" />
              + Giao bài tập
            </button>
            <button
              onClick={() => onNavigate('grading')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Chấm bài ({stats.pendingGradingCount})
            </button>
            <button
              onClick={() => onNavigate('achievements')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Cập nhật thành tích
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng số lớp</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-slate-800 tabular-nums">{stats.totalClasses}</div>
          <div className="mt-1 text-xs text-slate-500">{stats.totalStudents} học sinh đang học</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Bài tập đang giao</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-500 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-slate-800 tabular-nums">{stats.activeAssignmentsCount}</div>
          <div className="mt-1 text-xs text-slate-500">Đang mở cho học sinh làm</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Chờ chấm điểm</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-rose-600 tabular-nums">{stats.pendingGradingCount}</div>
          <div className="mt-1 text-xs text-slate-500">{stats.gradedCount} bài đã chấm xong</div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tài liệu thư viện</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Library className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-3xl font-black text-slate-800 tabular-nums">{stats.totalMaterials}</div>
          <div className="mt-1 text-xs text-slate-500">Bài giảng & tài liệu ôn tập</div>
        </div>
      </div>

      {/* Two-column layout: Active assignments needing attention & Library snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignments progress (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Tiến độ bài tập các lớp</h3>
              <p className="text-xs text-slate-500">Tỷ lệ nộp bài và tình trạng chấm điểm</p>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {assignmentsOverview.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Chưa có bài tập nào đang giao. Cô hãy bấm <span className="text-pink-500 font-semibold">+ Giao bài tập</span> nhé!
            </div>
          ) : (
            <div className="space-y-4">
              {assignmentsOverview.map(a => (
                <div key={a.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-pink-200 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 hover:text-pink-600 cursor-pointer" onClick={() => onNavigate('grading', { assignmentId: a.id })}>
                        {a.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-sky-600">{a.className}</span>
                        <span>·</span>
                        <span>Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {a.pendingGrading > 0 ? (
                        <button
                          onClick={() => onNavigate('grading', { assignmentId: a.id })}
                          className="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold hover:bg-rose-600 transition-colors cursor-pointer"
                        >
                          Chấm {a.pendingGrading} bài
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm đủ
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Đã nộp: {a.submittedCount} / {a.totalStudents} học sinh</span>
                      <span className="font-bold text-slate-700 tabular-nums">{a.submissionRate}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pink-400 to-sky-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, a.submissionRate)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent materials snapshot (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Tài liệu gần đây</h3>
                <p className="text-xs text-slate-500">Tài liệu đã chia sẻ</p>
              </div>
              <button
                onClick={() => onNavigate('library')}
                className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
              >
                Thư viện <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentMaterials.map(m => (
                <div key={m.id} className="p-3 rounded-2xl bg-pink-50/40 border border-pink-100/60 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-pink-500 flex items-center justify-center shrink-0 border border-pink-100">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 truncate">{m.title}</h5>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">{m.topic}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-center">
            <span className="text-xl">🏆</span>
            <div className="text-xs font-bold text-amber-900 mt-1">Đường đua Chill Văn</div>
            <p className="text-[11px] text-amber-700 mt-0.5">
              Động viên các em bằng điểm thưởng sao và danh hiệu tháng!
            </p>
            <button
              onClick={() => onNavigate('achievements')}
              className="mt-2.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              Quản lý vinh danh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
