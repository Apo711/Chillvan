import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Assignment, AssignmentSubmission, Question } from '../../types/index.js';
import {
  CheckCircle2,
  Clock,
  User,
  AlertCircle,
  Eye,
  Send,
  Save,
  RotateCcw,
  Sparkles,
  Award,
  FileCheck,
  ChevronRight,
} from 'lucide-react';

interface GradingCenterProps {
  initialAssignmentId?: string;
}

export const GradingCenter: React.FC<GradingCenterProps> = ({ initialAssignmentId }) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(initialAssignmentId || '');
  const [submissionsData, setSubmissionsData] = useState<{ assignment: Assignment; rows: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Active student submission being graded
  const [activeSubmissionRow, setActiveSubmissionRow] = useState<any | null>(null);

  // Grading form state
  const [questionScores, setQuestionScores] = useState<Record<string, { teacherScore: number; teacherComment?: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isPublishing, setIsPublishing] = useState(true);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAssignments();
  }, []);

  useEffect(() => {
    if (selectedAssignmentId) {
      loadSubmissions(selectedAssignmentId);
    }
  }, [selectedAssignmentId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const list = await api.getAssignments();
      setAssignments(list);
      if (list.length > 0) {
        const targetId = initialAssignmentId && list.some(a => a.id === initialAssignmentId)
          ? initialAssignmentId
          : list[0].id;
        setSelectedAssignmentId(targetId);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải danh sách bài tập' });
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (aId: string) => {
    try {
      setLoading(true);
      const res = await api.getAssignmentSubmissions(aId);
      setSubmissionsData(res);
      setActiveSubmissionRow(null);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const openGradingModal = (row: any) => {
    setActiveSubmissionRow(row);
    const sub: AssignmentSubmission | null = row.submission;

    // Prefill scores
    const scoresMap: Record<string, { teacherScore: number; teacherComment?: string }> = {};
    if (sub && sub.answers) {
      sub.answers.forEach(ans => {
        scoresMap[ans.questionId] = {
          teacherScore: ans.teacherScore !== undefined ? ans.teacherScore : (ans.autoScore || 0),
          teacherComment: ans.teacherComment || '',
        };
      });
    }
    setQuestionScores(scoresMap);
    setOverallFeedback(sub?.teacherFeedback || '');
    setIsPublishing(true);
  };

  const handleSaveGrade = async (publish: boolean) => {
    if (!activeSubmissionRow || !activeSubmissionRow.submissionId) return;
    try {
      await api.gradeSubmission(activeSubmissionRow.submissionId, {
        questionScores,
        teacherFeedback: overallFeedback,
        isPublished: publish,
      });

      setNotification({
        type: 'success',
        message: publish
          ? `Đã chấm và công bố kết quả cho học sinh ${activeSubmissionRow.studentName}!`
          : `Đã lưu bản nháp chấm điểm cho ${activeSubmissionRow.studentName}!`,
      });

      setActiveSubmissionRow(null);
      if (selectedAssignmentId) {
        loadSubmissions(selectedAssignmentId);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleAllowRetry = async (submissionId: string, studentName: string) => {
    try {
      await api.allowRetrySubmission(submissionId);
      setNotification({
        type: 'success',
        message: `Đã mở quyền làm lại bài cho học sinh ${studentName}!`,
      });
      if (selectedAssignmentId) {
        loadSubmissions(selectedAssignmentId);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const selectedAssignment = assignments.find(a => a.id === selectedAssignmentId);

  return (
    <div className="space-y-6">
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

      {/* Header Bar */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
          Trung Tâm Chấm Bài & Nhận Xét
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Chấm điểm chi tiết từng câu, viết nhận xét khích lệ và công bố kết quả cho học sinh
        </p>
      </div>

      {/* Assignment Selector Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {assignments.map(a => (
          <button
            key={a.id}
            onClick={() => setSelectedAssignmentId(a.id)}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              selectedAssignmentId === a.id
                ? 'bg-pink-500 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-pink-200'
            }`}
          >
            {a.title}
          </button>
        ))}
      </div>

      {/* Submissions Roster */}
      {submissionsData && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {submissionsData.assignment.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>Hạn nộp: {new Date(submissionsData.assignment.dueDate).toLocaleString('vi-VN')}</span>
                <span>·</span>
                <span>Thang điểm: {submissionsData.assignment.maxScore}đ</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="text-slate-500">
                Đã nộp: <strong className="text-slate-800">{submissionsData.rows.filter(r => r.status !== 'not_started').length}</strong> / {submissionsData.rows.length} HS
              </span>
              <span className="text-rose-600">
                Chờ chấm: <strong>{submissionsData.rows.filter(r => r.status === 'submitted').length}</strong> bài
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 pl-2">Học sinh</th>
                  <th className="pb-3">Trạng thái</th>
                  <th className="pb-3">Thời gian nộp</th>
                  <th className="pb-3">Điểm số</th>
                  <th className="pb-3">Nhận xét của cô</th>
                  <th className="pb-3 pr-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {submissionsData.rows.map(row => (
                  <tr key={row.studentId} className="hover:bg-pink-50/20 transition-colors">
                    <td className="py-3.5 pl-2 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs shrink-0">
                        {row.studentName.charAt(0)}
                      </div>
                      <div>
                        <div>{row.studentName}</div>
                        <div className="text-[11px] font-normal text-slate-400 font-mono">{row.studentUsername}</div>
                      </div>
                    </td>

                    <td className="py-3.5">
                      {row.status === 'not_started' && (
                        <span className="text-slate-400 font-medium">Chưa nộp bài</span>
                      )}
                      {row.status === 'draft' && (
                        <span className="text-amber-600 font-medium">Đang làm nháp</span>
                      )}
                      {row.status === 'submitted' && (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Chờ chấm
                        </span>
                      )}
                      {row.status === 'graded' && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã chấm {row.isPublished ? '' : '(Nháp)'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 text-slate-500 text-xs">
                      {row.submittedAt ? new Date(row.submittedAt).toLocaleString('vi-VN') : '—'}
                    </td>

                    <td className="py-3.5 font-bold text-slate-800 tabular-nums">
                      {row.finalScore !== undefined ? (
                        <span className="text-pink-600 text-sm font-extrabold">{row.finalScore} / {submissionsData.assignment.maxScore}đ</span>
                      ) : (
                        row.status === 'submitted' ? (
                          <span className="text-slate-400 text-xs">(TN: {row.autoGradedScore}đ)</span>
                        ) : '—'
                      )}
                    </td>

                    <td className="py-3.5 text-slate-600 text-xs max-w-xs truncate">
                      {row.teacherFeedback || '—'}
                    </td>

                    <td className="py-3.5 pr-2 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.status !== 'not_started' && (
                          <button
                            onClick={() => openGradingModal(row)}
                            className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold transition-colors cursor-pointer"
                          >
                            {row.status === 'graded' ? 'Sửa điểm' : 'Chấm bài'}
                          </button>
                        )}
                        {row.submissionId && (
                          <button
                            onClick={() => handleAllowRetry(row.submissionId, row.studentName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            title="Cho phép học sinh làm lại bài"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: SUBMISSION GRADING WORKBENCH */}
      {activeSubmissionRow && selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-pink-100 shadow-2xl max-h-[92vh] flex flex-col justify-between">
            <div className="overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-pink-500">Chấm bài làm của học sinh</span>
                  <h3 className="text-lg font-bold text-slate-800">
                    {activeSubmissionRow.studentName} ({activeSubmissionRow.studentUsername})
                  </h3>
                </div>
                <button
                  onClick={() => setActiveSubmissionRow(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* Submission metadata */}
              <div className="mt-3 p-3 rounded-2xl bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                <div>Bài tập: <strong>{selectedAssignment.title}</strong></div>
                <div>Thời gian nộp: <strong>{activeSubmissionRow.submittedAt ? new Date(activeSubmissionRow.submittedAt).toLocaleString('vi-VN') : 'Bản nháp'}</strong></div>
              </div>

              {/* Questions & Student Answers breakdown */}
              <div className="mt-5 space-y-5">
                {selectedAssignment.questions.map((q, idx) => {
                  const studentAns = activeSubmissionRow.submission?.answers?.find((a: any) => a.questionId === q.id);
                  const currentScoreObj = questionScores[q.id] || { teacherScore: studentAns?.autoScore || 0, teacherComment: '' };

                  return (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-700 uppercase">
                          Câu {idx + 1} ({q.points} điểm) · {q.type}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="text-xs font-bold text-pink-600">Điểm cho:</label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max={q.points}
                            value={currentScoreObj.teacherScore}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setQuestionScores({
                                ...questionScores,
                                [q.id]: {
                                  ...currentScoreObj,
                                  teacherScore: val,
                                },
                              });
                            }}
                            className="w-16 px-2 py-1 rounded-lg border border-pink-200 bg-white text-xs text-center font-bold text-pink-600"
                          />
                          <span className="text-xs text-slate-400">/ {q.points}đ</span>
                        </div>
                      </div>

                      {/* Question prompt */}
                      <div className="text-xs font-semibold text-slate-700 bg-white p-2.5 rounded-xl border border-slate-100">
                        {q.prompt}
                      </div>

                      {/* Student's answer */}
                      <div className="p-3 rounded-xl bg-sky-50/50 border border-sky-100">
                        <div className="text-[11px] font-bold text-sky-800 uppercase mb-1">
                          Bài làm của học sinh:
                        </div>
                        <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                          {studentAns?.answerText || studentAns?.selectedOption || (
                            <span className="text-slate-400 italic">Chưa có câu trả lời</span>
                          )}
                        </div>
                      </div>

                      {/* Reference answer & explanation */}
                      {(q.correctAnswer || q.explanation) && (
                        <div className="text-[11px] text-slate-500 bg-slate-100 p-2 rounded-lg">
                          {q.correctAnswer && <div><strong>Đáp án chuẩn:</strong> {q.correctAnswer}</div>}
                          {q.explanation && <div><strong>Gợi ý:</strong> {q.explanation}</div>}
                        </div>
                      )}

                      {/* Teacher's comment on this question */}
                      <div>
                        <input
                          type="text"
                          value={currentScoreObj.teacherComment || ''}
                          onChange={e => {
                            setQuestionScores({
                              ...questionScores,
                              [q.id]: {
                                ...currentScoreObj,
                                teacherComment: e.target.value,
                              },
                            });
                          }}
                          placeholder="Ghi chú / Nhận xét cho câu này (ví dụ: Diễn đạt rất truyền cảm, cần lưu ý dấu câu)..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Overall Feedback */}
              <div className="mt-6 p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pink-500" />
                  Lời nhận xét tổng thể của Cô Yến Thanh dành cho học sinh:
                </label>
                <textarea
                  rows={3}
                  value={overallFeedback}
                  onChange={e => setOverallFeedback(e.target.value)}
                  placeholder="Ví dụ: Bài viết của em rất sáng tạo, cảm xúc dồi dào. Cô đặc biệt thích cách em liên hệ thực tế ở phần kết bài. Cố gắng phát huy nhé!..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 bg-white text-xs sm:text-sm font-sans"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveSubmissionRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveGrade(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Lưu bản nháp
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveGrade(true)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" /> Chấm & Công bố điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
