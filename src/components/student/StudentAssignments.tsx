import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Assignment } from '../../types/index.js';
import { AssignmentTaking } from './AssignmentTaking.js';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface StudentAssignmentsProps {
  initialTakeAssignmentId?: string;
}

export const StudentAssignments: React.FC<StudentAssignmentsProps> = ({ initialTakeAssignmentId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [takingAssignmentId, setTakingAssignmentId] = useState<string | null>(initialTakeAssignmentId || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const list = await api.getAssignments();
      setAssignments(list);
    } catch (err) {
      console.error('Failed to load student assignments', err);
    } finally {
      setLoading(false);
    }
  };

  if (takingAssignmentId) {
    return (
      <AssignmentTaking
        assignmentId={takingAssignmentId}
        onBack={() => {
          setTakingAssignmentId(null);
          loadAssignments();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-3 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const filtered = assignments.filter(a => {
    if (activeFilter === 'pending') {
      return a.studentStatus === 'not_started' || a.studentStatus === 'draft';
    }
    if (activeFilter === 'completed') {
      return a.studentStatus === 'submitted' || a.studentStatus === 'graded';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Bài Tập Của Em
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Danh sách bài tập cô đã giao, làm bài trực tuyến và nhận nhận xét chi tiết
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-600'
            }`}
          >
            Tất cả ({assignments.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'pending' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Cần hoàn thành ({assignments.filter(a => a.studentStatus === 'not_started' || a.studentStatus === 'draft').length})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'completed' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            Đã nộp bài ({assignments.filter(a => a.studentStatus === 'submitted' || a.studentStatus === 'graded').length})
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm">
          Không có bài tập nào trong mục này.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(a => {
            const isDone = a.studentStatus === 'submitted' || a.studentStatus === 'graded';
            const isGraded = a.studentStatus === 'graded' && a.mySubmission?.isPublished;

            return (
              <div
                key={a.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-pink-200 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                    <span className="font-semibold text-pink-600">{a.className}</span>
                    <span>·</span>
                    <span>{a.questions.length} câu hỏi</span>
                    <span>·</span>
                    <span>Thang điểm: {a.maxScore}đ</span>
                    <span>·</span>
                    <span className="text-rose-500 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Hạn: {new Date(a.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-800">
                    {a.title}
                  </h3>

                  {a.instructions && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {a.instructions}
                    </p>
                  )}

                  {/* Feedback preview if published */}
                  {isGraded && a.mySubmission?.teacherFeedback && (
                    <div className="mt-3 p-2.5 rounded-xl bg-pink-50/60 border border-pink-100 text-xs text-slate-700 italic">
                      <span className="font-bold text-pink-700 not-italic">Cô Yến Thanh nhận xét:</span> "{a.mySubmission.teacherFeedback}"
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Status indicator */}
                  <div>
                    {isGraded ? (
                      <div className="text-right">
                        <div className="text-[11px] font-bold text-slate-400 uppercase">Điểm số</div>
                        <div className="text-xl font-black text-pink-600 tabular-nums">
                          {a.mySubmission?.finalScore} / {a.maxScore}đ
                        </div>
                      </div>
                    ) : a.studentStatus === 'submitted' ? (
                      <span className="text-xs font-bold text-sky-600 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Đã nộp – Chờ cô chấm
                      </span>
                    ) : a.studentStatus === 'draft' ? (
                      <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Đang có bản nháp
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-rose-500">
                        Chưa nộp
                      </span>
                    )}
                  </div>

                  {/* Action button */}
                  <button
                    onClick={() => setTakingAssignmentId(a.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDone
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white'
                    }`}
                  >
                    {isDone ? 'Xem bài làm' : a.studentStatus === 'draft' ? 'Làm tiếp' : 'Làm bài ngay'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
