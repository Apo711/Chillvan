import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { LearningMaterial, ClassItem } from '../../types/index.js';
import {
  Library,
  Upload,
  Search,
  BookOpen,
  FileText,
  FileCode,
  Image as ImageIcon,
  Download,
  Trash2,
  Edit2,
  Eye,
  Plus,
  Folder,
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal.js';

interface MaterialLibraryProps {
  initialOpenUpload?: boolean;
}

export const MaterialLibrary: React.FC<MaterialLibraryProps> = ({ initialOpenUpload = false }) => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isUploadModal, setIsUploadModal] = useState(initialOpenUpload);
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<LearningMaterial | null>(null);
  const [isDeleteModal, setIsDeleteModal] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('Thơ hiện đại');
  const [classId, setClassId] = useState('all');
  const [fileType, setFileType] = useState<'text' | 'pdf' | 'docx' | 'image'>('text');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadMaterials();
  }, [selectedTopic, selectedClassId]);

  const loadMaterials = async () => {
    try {
      setIsLoading(true);
      const [matList, classList] = await Promise.all([
        api.getMaterials({ topic: selectedTopic, classId: selectedClassId }),
        api.getClasses(),
      ]);
      setMaterials(matList);
      setClasses(classList);
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải tài liệu' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateMaterial(editingId, {
          title,
          description,
          topic,
          classId,
          fileType,
          fileName: fileName || `${title.replace(/\s+/g, '_')}.txt`,
          fileContent,
        });
        setNotification({ type: 'success', message: 'Cập nhật tài liệu thành công!' });
      } else {
        await api.createMaterial({
          title,
          description,
          topic,
          classId,
          fileType,
          fileName: fileName || `${title.replace(/\s+/g, '_')}.txt`,
          fileContent,
        });
        setNotification({ type: 'success', message: 'Đăng tải tài liệu thành công!' });
      }

      setIsUploadModal(false);
      resetForm();
      loadMaterials();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleEdit = (m: LearningMaterial) => {
    setEditingId(m.id);
    setTitle(m.title);
    setDescription(m.description);
    setTopic(m.topic);
    setClassId(m.classId);
    setFileType(m.fileType as any);
    setFileName(m.fileName);
    setFileContent(m.fileContent || '');
    setIsUploadModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!materialToDelete) return;
    try {
      await api.deleteMaterial(materialToDelete.id);
      setNotification({ type: 'success', message: 'Đã xóa tài liệu thành công' });
      setIsDeleteModal(false);
      setMaterialToDelete(null);
      loadMaterials();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
      setIsDeleteModal(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setTopic('Thơ hiện đại');
    setClassId('all');
    setFileType('text');
    setFileName('');
    setFileContent('');
  };

  const handleDownload = (m: LearningMaterial) => {
    const element = document.createElement('a');
    const file = new Blob([m.fileContent || m.description], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = m.fileName || `${m.title}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Get unique topics
  const topics = Array.from(new Set(materials.map(m => m.topic)));

  const filteredMaterials = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            Thư Viện Bài Giảng & Tài Liệu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kho ngữ liệu, sơ đồ tư duy và hướng dẫn làm văn cho học sinh
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setIsUploadModal(true); }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Đăng tải tài liệu mới
        </button>
      </div>

      {/* Filters and Search Strip */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Class Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0">Lớp:</span>
            <button
              onClick={() => setSelectedClassId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedClassId === 'all'
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả
            </button>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedClassId === c.id
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-sky-400"
            />
          </div>
        </div>

        {/* Topics Filter */}
        {topics.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-slate-100 scrollbar-none">
            <span className="text-xs font-bold text-slate-400 shrink-0">Chủ đề:</span>
            <button
              onClick={() => setSelectedTopic('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                selectedTopic === 'all' ? 'bg-pink-100 text-pink-700' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              Tất cả chủ đề
            </button>
            {topics.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  selectedTopic === t ? 'bg-pink-100 text-pink-700 font-bold' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Materials Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm">
          Chưa có tài liệu nào phù hợp. Cô hãy bấm <span className="text-sky-500 font-bold">+ Đăng tải tài liệu mới</span> nhé!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMaterials.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 hover:border-pink-200 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Topic and Class Unboxed Metadata */}
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-pink-600">{m.topic}</span>
                  <span aria-hidden="true">·</span>
                  <span>{m.className}</span>
                </div>

                {/* Title */}
                <h3
                  onClick={() => setPreviewMaterial(m)}
                  className="text-base font-bold text-slate-800 group-hover:text-pink-600 cursor-pointer transition-colors leading-snug"
                >
                  {m.title}
                </h3>

                {/* Description */}
                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {m.description}
                </p>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  {m.fileType.toUpperCase()}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPreviewMaterial(m)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    title="Xem trước nội dung"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(m)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Tải về máy"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(m)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    title="Chỉnh sửa tài liệu"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setMaterialToDelete(m); setIsDeleteModal(true); }}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Xóa tài liệu"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: UPLOAD / EDIT MATERIAL */}
      {isUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-sky-100 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-500" />
              {editingId ? 'Chỉnh Sửa Tài Liệu' : 'Đăng Tải Tài Liệu Học Tập'}
            </h3>
            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên tài liệu *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sơ đồ tư duy bài thơ Đoàn thuyền đánh cá"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-sky-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chủ đề / Chuyên đề *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thơ Việt Nam, Văn xuôi, Tiếng Việt..."
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp được xem *</label>
                  <select
                    value={classId}
                    onChange={e => setClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="all">Tất cả các lớp</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  placeholder="Mô tả tóm tắt nội dung bài học hoặc hướng dẫn các em..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Định dạng tài liệu</label>
                <div className="flex gap-2">
                  {(['text', 'pdf', 'docx', 'image'] as const).map(fmt => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setFileType(fmt)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                        fileType === fmt
                          ? 'bg-sky-500 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nội dung chi tiết / Bản ghi chú bài giảng
                </label>
                <textarea
                  rows={6}
                  placeholder="Nhập nội dung tài liệu, phân tích văn học, bài thơ, dàn ý tại đây..."
                  value={fileContent}
                  onChange={e => setFileContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-xs"
                >
                  {editingId ? 'Lưu thay đổi' : 'Đăng tài liệu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVIEW MATERIAL */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full border border-pink-100 shadow-xl max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-pink-500">{previewMaterial.topic}</span>
                  <h3 className="text-lg font-bold text-slate-800">{previewMaterial.title}</h3>
                </div>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 font-medium">
                {previewMaterial.description}
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-100 overflow-y-auto max-h-[40vh] text-sm text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                {previewMaterial.fileContent || 'Chưa có nội dung xem trước dạng văn bản.'}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tệp: {previewMaterial.fileName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewMaterial)}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về máy
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION: DELETE MATERIAL */}
      <ConfirmationModal
        isOpen={isDeleteModal}
        title="Xóa Tài Liệu"
        message={`Cô có chắc chắn muốn xóa tài liệu "${materialToDelete?.title}" khỏi thư viện?`}
        confirmLabel="Xóa tài liệu"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModal(false)}
      />
    </div>
  );
};
