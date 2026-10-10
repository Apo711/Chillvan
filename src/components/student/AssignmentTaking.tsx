import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Assignment, Question, StudentAnswer, AssignmentSubmission } from '../../types/index.js';
import {
  FileText,
  Clock,
  Save,
  Send,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  HelpCircle,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ConfirmationModal } from '../common/ConfirmationModal.js';

interface AssignmentTakingProps {
  assignmentId: string;
  onBack: () => void;
}

export const AssignmentTaking: React.FC<AssignmentTakingProps> = ({ assignmentId, onBack }) => {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [answers, setAnswers] = useState<Record<string, StudentAnswer>>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftSaving, setIsDraftSaving] = useState(false);

  // Modals
  const [isConfirmSubmitModal, setIsConfirmSubmitModal] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAssignment();
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const res = await api.getAssignment(assignmentId);
      setAssignment(res);

      // Restore existing draft or submission answers
      const restored: Record<string, StudentAnswer> = {};
      if (res.mySubmission && res.mySubmission.answers) {
        res.mySubmission.answers.forEach((ans: StudentAnswer) => {
          restored[ans.questionId] = ans;
        });
      }
      setAnswers(restored);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải bài tập' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnswer = (questionId: string, partial: Partial<StudentAnswer>) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...(prev[questionId] || { questionId }),
        ...partial,
      },
    }));
  };

  const handleSaveDraft = async () => {
    try {
      setIsDraftSaving(true);
      const answerList = Object.values(answers);
      await api.saveDraft(assignmentId, answerList);
      setNotification({ type: 'success', message: 'Đã lưu bản nháp an toàn!' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setIsDraftSaving(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const answerList = Object.values(answers);
      const res = await api.submitAssignment(assignmentId, answerList);

      // Trigger celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setNotification({ type: 'success', message: res.message });
      setIsConfirmSubmitModal(false);
      loadAssignment();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
      setIsConfirmSubmitModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !assignment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-3 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isSubmitted = assignment.mySubmission?.status === 'submitted';
  const isGraded = assignment.mySubmission?.status === 'graded';
  const isPublished = Boolean(assignment.mySubmission?.isPublished);
  const isReadOnly = (isSubmitted || isGraded) && !assignment.allowRetry;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
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

      {/* Top back & title bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài tập
        </button>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={isDraftSaving}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isDraftSaving ? 'Đang lưu...' : 'Lưu bản nháp'}
            </button>
            <button
              onClick={() => setIsConfirmSubmitModal(true)}
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> Nộp bài cho cô
            </button>
          </div>
        )}
      </div>

      {/* Assignment Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-semibold text-pink-600">{assignment.className || 'Lớp học'}</span>
              <span>·</span>
              <span>Thang điểm: {assignment.maxScore}đ</span>
              <span>·</span>
              <span className="text-rose-500 font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" /> Hạn: {new Date(assignment.dueDate).toLocaleString('vi-VN')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              {assignment.title}
            </h2>
          </div>

          {/* Submission Status Badge */}
          <div className="shrink-0">
            {isGraded && isPublished ? (
              <div className="p-3 rounded-2xl bg-pink-50 border border-pink-200 text-center">
                <div className="text-[11px] font-bold text-pink-600 uppercase">Điểm của em</div>
                <div className="text-2xl font-black text-pink-700 tabular-nums">
                  {assignment.mySubmission?.finalScore} / {assignment.maxScore}đ
                </div>
              </div>
            ) : isSubmitted ? (
              <div className="px-3.5 py-2 rounded-2xl bg-sky-50 border border-sky-200 text-sky-800 text-xs font-bold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-sky-500" /> Đã nộp – Chờ cô chấm
              </div>
            ) : (
              <div className="px-3.5 py-2 rounded-2xl bg-pink-50 border border-pink-100 text-pink-700 text-xs font-bold">
                {assignment.mySubmission?.status === 'draft' ? 'Đang làm bài (Bản nháp)' : 'Chưa nộp bài'}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        {assignment.instructions && (
          <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
            <span className="font-bold text-slate-900 block mb-1">🌸 Lời dặn của Cô Yến Thanh:</span>
            {assignment.instructions}
          </div>
        )}

        {/* Teacher Feedback Card if Graded */}
        {isGraded && isPublished && assignment.mySubmission?.teacherFeedback && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-pink-50 to-sky-50 border border-pink-200 text-xs sm:text-sm text-slate-800">
            <div className="font-bold text-pink-700 flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-pink-500" />
              Lời nhận xét của Cô Yến Thanh:
            </div>
            <div className="italic leading-relaxed">
              "{assignment.mySubmission.teacherFeedback}"
            </div>
          </div>
        )}
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {assignment.questions.map((q, idx) => {
          const currentAns = answers[q.id] || { questionId: q.id };

          return (
            <div
              key={q.id}
              className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-100 shadow-xs space-y-4"
            >
              {/* Question header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-extrabold text-pink-600 uppercase tracking-wider">
                  Câu {idx + 1} ({q.points} điểm)
                </span>
                {isGraded && isPublished && currentAns.teacherScore !== undefined && (
                  <span className="text-xs font-bold text-emerald-600">
                    Đạt: {currentAns.teacherScore} / {q.points}đ
                  </span>
                )}
              </div>

              {/* Prompt */}
              <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                {q.prompt}
              </div>

              {/* FORMAT 1: SINGLE CHOICE (TRẮC NGHIỆM) */}
              {q.type === 'single_choice' && (
                <div className="space-y-2 pt-1">
                  {['A', 'B', 'C', 'D'].map((letter, optIdx) => {
                    const optionText = q.options ? q.options[optIdx] : '';
                    if (!optionText) return null;
                    const isSelected = currentAns.selectedOption === letter;

                    return (
                      <button
                        key={letter}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => handleUpdateAnswer(q.id, { selectedOption: letter })}
                        className={`w-full p-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium flex items-center gap-3 transition-all cursor-pointer disabled:cursor-default ${
                          isSelected
                            ? 'bg-pink-50/70 border-pink-400 text-pink-900 font-bold shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-pink-200 hover:bg-pink-50/20'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-pink-500 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {letter}
                        </div>
                        <span className="flex-1">{optionText}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FORMAT 2: TRUE / FALSE */}
              {q.type === 'true_false' && (
                <div className="flex gap-3 pt-1">
                  {['Đúng', 'Sai'].map(val => {
                    const isSelected = currentAns.selectedOption === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => handleUpdateAnswer(q.id, { selectedOption: val })}
                        className={`flex-1 py-3 rounded-2xl border text-xs sm:text-sm font-bold transition-all cursor-pointer disabled:cursor-default ${
                          isSelected
                            ? 'bg-sky-500 border-sky-500 text-white shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-sky-300'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* FORMAT 3: FILL IN BLANK */}
              {q.type === 'fill_in_blank' && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Nhập câu trả lời của em:
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={currentAns.answerText || ''}
                    onChange={e => handleUpdateAnswer(q.id, { answerText: e.target.value })}
                    placeholder="Nhập từ hoặc cụm từ điền vào đây..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-pink-400 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* FORMAT 4: SHORT ESSAY */}
              {q.type === 'short_essay' && (
                <div className="pt-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Câu trả lời của em:
                  </label>
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    value={currentAns.answerText || ''}
                    onChange={e => handleUpdateAnswer(q.id, { answerText: e.target.value })}
                    placeholder="Viết câu trả lời ngắn gọn, đủ ý..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-sans focus:outline-hidden focus:border-pink-400 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* FORMAT 5: LONG ESSAY (ĐOẠN VĂN / BÀI VĂN NGHỊ LUẬN) */}
              {(q.type === 'long_essay' || q.type === 'file_upload') && (
                <div className="pt-1 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                    <span>Không gian viết bài (hỗ trợ xuống dòng và giãn cách):</span>
                    <span className="tabular-nums font-mono">
                      {(currentAns.answerText || '').trim().split(/\s+/).filter(Boolean).length} từ
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    disabled={isReadOnly}
                    value={currentAns.answerText || ''}
                    onChange={e => handleUpdateAnswer(q.id, { answerText: e.target.value })}
                    placeholder="Viết đoạn văn, phân tích hình tượng hoặc bài nghị luận tại đây. Các em hãy chú ý liên kết đoạn và cảm xúc nhé..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-sans leading-relaxed focus:outline-hidden focus:border-pink-400 disabled:bg-slate-50"
                  />
                </div>
              )}

              {/* Teacher Explanation & Commentary after grading */}
              {isGraded && isPublished && (
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  {currentAns.teacherComment && (
                    <div className="p-3 rounded-xl bg-pink-50/50 text-xs text-pink-900">
                      <strong>Nhận xét của cô cho câu này:</strong> {currentAns.teacherComment}
                    </div>
                  )}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-600">
                      <strong>Gợi ý đáp án:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom submit button */}
      {!isReadOnly && (
        <div className="flex items-center justify-between p-4 rounded-3xl bg-white border border-pink-100 shadow-sm sticky bottom-4">
          <span className="text-xs text-slate-500 font-medium">
            Đã làm: {Object.values(answers).filter(a => a.answerText || a.selectedOption).length} / {assignment.questions.length} câu
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={isDraftSaving}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
            >
              Lưu bản nháp
            </button>
            <button
              onClick={() => setIsConfirmSubmitModal(true)}
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Nộp bài cho cô
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMATION SUBMIT MODAL */}
      <ConfirmationModal
        isOpen={isConfirmSubmitModal}
        title="Xác Nhận Nộp Bài"
        message="Em đã kiểm tra kỹ toàn bộ các câu trả lời chưa? Sau khi nộp bài, bài làm sẽ được gửi trực tiếp đến Cô Yến Thanh để chấm điểm nhé!"
        confirmLabel="Nộp bài ngay"
        onConfirm={handleSubmit}
        onCancel={() => setIsConfirmSubmitModal(false)}
      />
    </div>
  );
};
