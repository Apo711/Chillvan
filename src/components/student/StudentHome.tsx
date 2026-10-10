import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Assignment, LearningMaterial, StudentProfileData } from '../../types/index.js';
import {
  Sparkles,
  BookOpen,
  FileText,
  Clock,
  ArrowRight,
  Trophy,
  CheckCircle2,
  Star,
  Gift,
} from 'lucide-react';

interface StudentHomeProps {
  onNavigate: (tab: string, meta?: any) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [profile, setProfile] = useState<StudentProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignList, matList, prof] = await Promise.all([
        api.getAssignments(),
        api.getMaterials(),
        user ? api.getStudentProfile(user.id) : null,
      ]);
      setAssignments(assignList);
      setMaterials(matList);
      setProfile(prof);
    } catch (err) {
      console.error('Failed to load student home data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-3 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Pending assignments
  const pendingAssignments = assignments.filter(a => a.studentStatus === 'not_started' || a.studentStatus === 'draft');
  const completedAssignments = assignments.filter(a => a.studentStatus === 'submitted' || a.studentStatus === 'graded');

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-200/90 via-pink-100 to-sky-200/80 p-6 sm:p-8 border border-pink-200/60 shadow-xs">
        {/* Soft mascot / flower decoration */}
        <div className="absolute top-4 right-4 sm:right-8 text-4xl sm:text-6xl opacity-80 pointer-events-none select-none">
          🌸
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-pink-700 text-xs font-bold mb-2.5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-pink-500" />
            Hôm nay mình học Văn thật chill nhé!
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">
            Chào mừng {user?.fullName} đến với Chill Văn!
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 font-medium">
            Lớp {user?.className} · Em đang có <span className="font-extrabold text-amber-500">⭐ {profile?.totalPoints || 0} điểm sao</span> trên Đường đua thi đua.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('assignments')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-400 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Làm bài tập ({pendingAssignments.length})
            </button>
            <button
              onClick={() => onNavigate('race-track')}
              className="px-4 py-2 rounded-xl bg-white hover:bg-amber-50 text-amber-700 text-xs sm:text-sm font-bold shadow-xs border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              Đường đua & Vinh danh
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Priority Assignments & Personal Progress Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Assignments List (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Bài tập cần hoàn thành</h3>
              <p className="text-xs text-slate-500">Nộp bài đúng hạn để được cộng thêm điểm sao nhé!</p>
            </div>
            <button
              onClick={() => onNavigate('assignments')}
              className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {pendingAssignments.length === 0 ? (
            <div className="text-center py-10 rounded-2xl bg-emerald-50/50 border border-emerald-100">
              <span className="text-3xl">🎉</span>
              <h4 className="text-sm font-bold text-emerald-800 mt-2">Tuyệt vời lắm!</h4>
              <p className="text-xs text-emerald-600 mt-0.5">
                Em đã hoàn thành hết tất cả bài tập hiện có. Hãy ghé Thư viện đọc thêm bài giảng nhé!
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {pendingAssignments.map(a => (
                <div
                  key={a.id}
                  className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-pink-200 hover:bg-pink-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                      <span>{a.questions.length} câu hỏi</span>
                      <span>·</span>
                      <span className="text-rose-500 font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                      </span>
                      {a.studentStatus === 'draft' && (
                        <span className="text-amber-600 font-bold">· Đang có bản nháp</span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 hover:text-pink-600 cursor-pointer" onClick={() => onNavigate('assignments', { takeAssignmentId: a.id })}>
                      {a.title}
                    </h4>
                  </div>

                  <button
                    onClick={() => onNavigate('assignments', { takeAssignmentId: a.id })}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs font-bold shadow-xs whitespace-nowrap cursor-pointer"
                  >
                    {a.studentStatus === 'draft' ? 'Làm tiếp' : 'Bắt đầu làm bài'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Recently Graded / Completed Section */}
          {completedAssignments.length > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Bài tập đã nộp gần đây
              </h4>
              <div className="space-y-2">
                {completedAssignments.slice(0, 3).map(a => (
                  <div key={a.id} className="p-3 rounded-xl bg-slate-50 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-xs">{a.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.studentStatus === 'graded' && a.mySubmission?.isPublished ? (
                        <span className="text-pink-600 font-extrabold">{a.mySubmission.finalScore} / {a.maxScore}đ</span>
                      ) : (
                        <span className="text-slate-500 font-medium">Chờ cô chấm</span>
                      )}
                      <button
                        onClick={() => onNavigate('assignments', { takeAssignmentId: a.id })}
                        className="text-sky-600 font-bold hover:underline"
                      >
                        Xem kết quả
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Card & Race Track Snapshot (1 col) */}
        <div className="space-y-5">
          {/* Star & Race Track mini card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Đường đua của em</span>
                <button
                  onClick={() => onNavigate('race-track')}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Xem bảng đua
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl border border-amber-100 shrink-0">
                  ⭐
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-800 tabular-nums">
                    {profile?.totalPoints || 0} <span className="text-sm font-semibold text-slate-400">điểm sao</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Đã hoàn thành {profile?.completedAssignmentsCount || 0} bài tập
                  </div>
                </div>
              </div>

              {/* Progress bar towards next milestone */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                  <span>Mốc thi đua tháng</span>
                  <span className="font-bold text-amber-600">{Math.min(100, Math.round(((profile?.totalPoints || 0) / 100) * 100))}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full"
                    style={{ width: `${Math.min(100, Math.round(((profile?.totalPoints || 0) / 100) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {profile?.profileExtra?.monthlyGoals && (
              <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-xs">
                <div className="font-bold text-amber-900 mb-0.5">🎯 Mục tiêu tháng này:</div>
                <div className="text-amber-800 leading-snug">{profile.profileExtra.monthlyGoals}</div>
              </div>
            )}
          </div>

          {/* Quick Library Snapshot */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Tài liệu học tập</span>
              <button
                onClick={() => onNavigate('library')}
                className="text-xs font-bold text-sky-600 hover:underline"
              >
                Vào thư viện
              </button>
            </div>

            <div className="space-y-2.5">
              {materials.slice(0, 3).map(m => (
                <div
                  key={m.id}
                  onClick={() => onNavigate('library')}
                  className="p-2.5 rounded-xl bg-pink-50/40 hover:bg-pink-50 border border-pink-100/60 cursor-pointer transition-colors flex items-center gap-2.5"
                >
                  <BookOpen className="w-4 h-4 text-pink-500 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate">{m.title}</div>
                    <div className="text-[10px] text-slate-400 truncate">{m.topic}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
