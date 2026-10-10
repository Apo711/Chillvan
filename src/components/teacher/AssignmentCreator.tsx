import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Assignment, ClassItem, Question, QuestionType } from '../../types/index.js';
import {
  FileText,
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Edit2,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal.js';

interface AssignmentCreatorProps {
  initialOpenCreate?: boolean;
  onNavigateToGrading: (assignmentId: string) => void;
}

export const AssignmentCreator: React.FC<AssignmentCreatorProps> = ({
  initialOpenCreate = false,
  onNavigateToGrading,
}) => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Creator Modal / View
  const [isEditorOpen, setIsEditorOpen] = useState(initialOpenCreate);
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxScore, setMaxScore] = useState(10);
  const [allowRetry, setAllowRetry] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);

  // Preview Modal
  const [previewItem, setPreviewItem] = useState<Assignment | null>(null);

  // Delete Modal
  const [itemToDelete, setItemToDelete] = useState<Assignment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [selectedClassId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [assignList, classList] = await Promise.all([
        api.getAssignments({ classId: selectedClassId }),
        api.getClasses(),
      ]);
      setAssignments(assignList);
      setClasses(classList);
      if (classList.length > 0 && !classId) {
        setClassId(classList[0].id);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải bài tập' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNew = () => {
    setEditingAssignmentId(null);
    setTitle('');
    setInstructions('Các em đọc kỹ từng câu hỏi, chú ý dùng từ chuẩn xác và diễn đạt mạch lạc nhé!');
    setClassId(classes[0]?.id || '');
    // Default 7 days from now
    const nextWeek = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    setDueDate(nextWeek.toISOString().slice(0, 16));
    setMaxScore(10);
    setAllowRetry(true);
    setQuestions([
      {
        id: `q-1-${Date.now()}`,
        type: 'single_choice',
        prompt: 'Bài thơ được sáng tác trong giai đoạn nào?',
        points: 2,
        options: ['Giai đoạn kháng chiến chống Pháp', 'Giai đoạn kháng chiến chống Mỹ', 'Thời kỳ đổi mới', 'Thời trung đại'],
        correctAnswer: 'A',
        explanation: 'Kháng chiến chống thực dân Pháp (1946 - 1954).',
      },
    ]);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (a: Assignment) => {
    setEditingAssignmentId(a.id);
    setTitle(a.title);
    setInstructions(a.instructions);
    setClassId(a.classId);
    setDueDate(new Date(a.dueDate).toISOString().slice(0, 16));
    setMaxScore(a.maxScore);
    setAllowRetry(a.allowRetry);
    setQuestions(a.questions || []);
    setIsEditorOpen(true);
  };

  const addQuestion = (type: QuestionType) => {
    const newQ: Question = {
      id: `q-${questions.length + 1}-${Date.now()}`,
      type,
      prompt: '',
      points: type === 'long_essay' ? 3 : 2,
      options: type === 'single_choice' ? ['Phương án A', 'Phương án B', 'Phương án C', 'Phương án D'] : undefined,
      correctAnswer: type === 'single_choice' ? 'A' : type === 'true_false' ? 'Đúng' : '',
      acceptedVariants: type === 'fill_in_blank' ? [] : undefined,
      explanation: '',
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const copy = [...questions];
    copy[index] = { ...copy[index], ...updates };
    setQuestions(copy);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async (status: 'draft' | 'published') => {
    if (!title.trim() || !classId || !dueDate) {
      setNotification({ type: 'error', message: 'Vui lòng nhập tên bài tập, chọn lớp và hạn nộp!' });
      return;
    }

    if (questions.length === 0) {
      setNotification({ type: 'error', message: 'Vui lòng thêm ít nhất 1 câu hỏi vào bài tập!' });
      return;
    }

    // Check empty question prompts
    const hasEmpty = questions.some(q => !q.prompt.trim());
    if (hasEmpty) {
      setNotification({ type: 'error', message: 'Có câu hỏi chưa nhập nội dung yêu cầu!' });
      return;
    }

    try {
      if (editingAssignmentId) {
        const res = await api.updateAssignment(editingAssignmentId, {
          title,
          instructions,
          classId,
          dueDate: new Date(dueDate).toISOString(),
          maxScore,
          questions,
          status,
          allowRetry,
        });
        setNotification({
          type: 'success',
          message: res.warningNote || 'Cập nhật bài tập thành công!',
        });
      } else {
        await api.createAssignment({
          title,
          instructions,
          classId,
          dueDate: new Date(dueDate).toISOString(),
          maxScore,
          questions,
          status,
          allowRetry,
        });
        setNotification({
          type: 'success',
          message: status === 'published' ? 'Đã giao bài tập thành công đến lớp!' : 'Đã lưu bản nháp bài tập!',
        });
      }

      setIsEditorOpen(false);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await api.deleteAssignment(itemToDelete.id);
      setNotification({ type: 'success', message: 'Đã xóa bài tập thành công' });
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
      setIsDeleteModalOpen(false);
    }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Quản Lý & Giao Bài Tập
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hỗ trợ 6 dạng bài tập: Trắc nghiệm, Đúng/Sai, Điền khuyết, Đoạn văn & Nghị luận
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Tạo bài tập mới
        </button>
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
          Tất cả lớp ({assignments.length} bài)
        </button>
        {classes.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedClassId(c.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
              selectedClassId === c.id
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-200'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm">
          Chưa có bài tập nào. Cô hãy bấm <span className="text-pink-500 font-bold">+ Tạo bài tập mới</span> nhé!
        </div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => (
            <div
              key={a.id}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 hover:border-pink-200 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold text-sky-600">{a.className}</span>
                  <span aria-hidden="true">·</span>
                  <span>{a.questions.length} câu hỏi</span>
                  <span aria-hidden="true">·</span>
                  <span>Thang điểm: {a.maxScore}đ</span>
                  <span aria-hidden="true">·</span>
                  <span className={a.status === 'published' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {a.status === 'published' ? 'Đã giao' : 'Bản nháp'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-800 hover:text-pink-600 cursor-pointer transition-colors" onClick={() => onNavigateToGrading(a.id)}>
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{a.instructions}</p>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    Hạn: {new Date(a.dueDate).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                  <div>
                    Đã nộp: <strong className="text-slate-800">{a.submittedCount || 0}</strong> / {a.totalStudents || 0} HS
                  </div>
                  {(a.pendingGradingCount || 0) > 0 && (
                    <div className="text-rose-600 font-bold">
                      Cần chấm: {a.pendingGradingCount} bài
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onNavigateToGrading(a.id)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Chấm bài ({a.submittedCount || 0})
                </button>
                <button
                  onClick={() => setPreviewItem(a)}
                  className="p-2 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                  title="Xem trước bài tập"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(a)}
                  className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                  title="Chỉnh sửa bài tập"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setItemToDelete(a); setIsDeleteModalOpen(true); }}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Xóa bài tập"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ASSIGNMENT EDITOR (CREATION & EDIT) */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-3xl w-full border border-pink-100 shadow-2xl max-h-[92vh] flex flex-col justify-between">
            <div className="overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-pink-500" />
                  {editingAssignmentId ? 'Chỉnh Sửa Bài Tập' : 'Biên Soạn & Giao Bài Mới'}
                </h3>
                <button
                  onClick={() => setIsEditorOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
                >
                  ×
                </button>
              </div>

              {/* General info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên bài tập *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Phiếu ôn tập: Đọc hiểu văn bản & viết đoạn văn nghị luận"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giao cho lớp *</label>
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hạn nộp bài *</label>
                  <input
                    type="datetime-local"
                    required
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Điểm tối đa</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxScore}
                    onChange={e => setMaxScore(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={allowRetry}
                      onChange={e => setAllowRetry(e.target.checked)}
                      className="rounded text-pink-500 focus:ring-pink-300 w-4 h-4"
                    />
                    Cho phép nộp lại bài
                  </label>
                </div>
              </div>

              <div className="mt-3.5">
                <label className="block text-xs font-bold text-slate-700 mb-1">Lời dặn của cô</label>
                <textarea
                  rows={2}
                  value={instructions}
                  onChange={e => setInstructions(e.target.value)}
                  placeholder="Lời nhắn nhủ, hướng dẫn làm bài cho các em..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              {/* Questions Section */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-500" />
                    Các câu hỏi / Yêu cầu ({questions.length} câu)
                  </h4>

                  {/* Add question format buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => addQuestion('single_choice')}
                      className="px-2.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold cursor-pointer"
                    >
                      + Trắc nghiệm
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('true_false')}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold cursor-pointer"
                    >
                      + Đúng/Sai
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('fill_in_blank')}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold cursor-pointer"
                    >
                      + Điền khuyết
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('short_essay')}
                      className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold cursor-pointer"
                    >
                      + Tự luận ngắn
                    </button>
                    <button
                      type="button"
                      onClick={() => addQuestion('long_essay')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold cursor-pointer"
                    >
                      + Tự luận dài (Đoạn/Bài văn)
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-pink-600 uppercase">
                          Câu {idx + 1}: {
                            q.type === 'single_choice' ? 'Trắc nghiệm 4 đáp án' :
                            q.type === 'true_false' ? 'Đúng / Sai' :
                            q.type === 'fill_in_blank' ? 'Điền khuyết' :
                            q.type === 'short_essay' ? 'Tự luận ngắn' : 'Tự luận dài (Viết đoạn/bài)'
                          }
                        </span>

                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-slate-500">Điểm:</label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={q.points}
                            onChange={e => updateQuestion(idx, { points: Number(e.target.value) })}
                            className="w-16 px-2 py-1 rounded-lg border border-slate-200 text-xs text-center font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Question prompt */}
                      <div>
                        <textarea
                          rows={2}
                          required
                          value={q.prompt}
                          onChange={e => updateQuestion(idx, { prompt: e.target.value })}
                          placeholder="Nhập nội dung câu hỏi hoặc yêu cầu viết..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white"
                        />
                      </div>

                      {/* Question Specific options */}
                      {q.type === 'single_choice' && (
                        <div className="space-y-2 pt-1">
                          <div className="text-xs font-semibold text-slate-500">Các đáp án lựa chọn:</div>
                          {['A', 'B', 'C', 'D'].map((letter, optIdx) => (
                            <div key={letter} className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-600 w-5">{letter}.</span>
                              <input
                                type="text"
                                value={q.options ? q.options[optIdx] || '' : ''}
                                onChange={e => {
                                  const newOpts = [...(q.options || ['', '', '', ''])];
                                  newOpts[optIdx] = e.target.value;
                                  updateQuestion(idx, { options: newOpts });
                                }}
                                placeholder={`Đáp án ${letter}...`}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                              <label className="flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`correct-${q.id}`}
                                  checked={q.correctAnswer === letter}
                                  onChange={() => updateQuestion(idx, { correctAnswer: letter })}
                                  className="text-pink-500 focus:ring-pink-300"
                                />
                                <span className={q.correctAnswer === letter ? 'text-pink-600 font-bold' : ''}>Đúng</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      )}

                      {q.type === 'true_false' && (
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-700">
                          <span>Đáp án đúng:</span>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`tf-${q.id}`}
                              checked={q.correctAnswer === 'Đúng'}
                              onChange={() => updateQuestion(idx, { correctAnswer: 'Đúng' })}
                              className="text-sky-500"
                            />
                            Đúng
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name={`tf-${q.id}`}
                              checked={q.correctAnswer === 'Sai'}
                              onChange={() => updateQuestion(idx, { correctAnswer: 'Sai' })}
                              className="text-sky-500"
                            />
                            Sai
                          </label>
                        </div>
                      )}

                      {q.type === 'fill_in_blank' && (
                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700">
                            Đáp án chính xác (chấm tự động):
                          </label>
                          <input
                            type="text"
                            value={q.correctAnswer || ''}
                            onChange={e => updateQuestion(idx, { correctAnswer: e.target.value })}
                            placeholder="Nhập từ hoặc cụm từ chính xác cần điền..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                          />
                        </div>
                      )}

                      {/* Explanation for student after grading */}
                      <div>
                        <input
                          type="text"
                          value={q.explanation || ''}
                          onChange={e => updateQuestion(idx, { explanation: e.target.value })}
                          placeholder="Gợi ý đáp án / Hướng dẫn giải chi tiết (hiển thị khi công bố điểm)..."
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave('draft')}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Lưu bản nháp
                </button>
                <button
                  type="button"
                  onClick={() => handleSave('published')}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Giao bài ngay
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW ASSIGNMENT MODAL */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-sky-100 shadow-xl max-h-[85vh] flex flex-col justify-between">
            <div className="overflow-y-auto pr-1">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-sky-500">{previewItem.className}</span>
                  <h3 className="text-lg font-bold text-slate-800">{previewItem.title}</h3>
                </div>
                <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
              </div>

              <div className="mt-3 p-3.5 rounded-2xl bg-pink-50/50 text-xs text-slate-700 leading-relaxed font-medium">
                {previewItem.instructions}
              </div>

              <div className="mt-4 space-y-4">
                {previewItem.questions.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-1.5">
                      <span>Câu {idx + 1} ({q.points} điểm)</span>
                      <span className="text-slate-400 uppercase text-[10px]">{q.type}</span>
                    </div>
                    <div className="text-sm font-semibold text-slate-800 mb-2">{q.prompt}</div>

                    {q.type === 'single_choice' && (
                      <div className="space-y-1.5 text-xs text-slate-700">
                        {q.options?.map((opt, oIdx) => (
                          <div key={oIdx} className="p-2 rounded-lg bg-white border border-slate-200">
                            {['A', 'B', 'C', 'D'][oIdx]}. {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION: DELETE ASSIGNMENT */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Xóa Bài Tập"
        message={`Cô có chắc chắn muốn xóa bài tập "${itemToDelete?.title}"?`}
        confirmLabel="Xóa bài tập"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
