import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { LearningMaterial } from '../../types/index.js';
import {
  Library,
  Search,
  BookOpen,
  Eye,
  Download,
  Folder,
} from 'lucide-react';

export const StudentLibrary: React.FC = () => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewMaterial, setPreviewMaterial] = useState<LearningMaterial | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMaterials();
  }, [selectedTopic]);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      const list = await api.getMaterials({ topic: selectedTopic });
      setMaterials(list);
    } catch (err) {
      console.error('Failed to load student materials', err);
    } finally {
      setLoading(false);
    }
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

  const topics = Array.from(new Set(materials.map(m => m.topic)));

  const filtered = materials.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Thư Viện Bài Giảng & Ngữ Liệu
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tài liệu tham khảo, bài phân tích mẫu và sơ đồ tư duy do Cô Yến Thanh biên soạn
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm tài liệu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-sky-400"
          />
        </div>
      </div>

      {/* Topics selector */}
      {topics.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedTopic('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedTopic === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-200'
            }`}
          >
            Tất cả chủ đề
          </button>
          {topics.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedTopic === t
                  ? 'bg-sky-500 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Grid of materials */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-100 text-slate-400 text-sm">
          Chưa có tài liệu nào thuộc chủ đề này.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(m => (
            <div
              key={m.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 hover:border-pink-200 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="text-xs font-bold text-pink-600 mb-1.5">
                  {m.topic}
                </div>
                <h3
                  onClick={() => setPreviewMaterial(m)}
                  className="text-base font-bold text-slate-800 group-hover:text-pink-600 cursor-pointer transition-colors leading-snug"
                >
                  {m.title}
                </h3>
                <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {m.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase">
                  {m.fileType}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewMaterial(m)}
                    className="px-3 py-1.5 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Đọc bài
                  </button>
                  <button
                    onClick={() => handleDownload(m)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-sky-600 hover:bg-sky-50 cursor-pointer"
                    title="Tải về máy"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PREVIEW MATERIAL MODAL */}
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
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1 cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="mt-4 p-4 rounded-2xl bg-white border border-slate-100 overflow-y-auto max-h-[45vh] text-sm text-slate-700 whitespace-pre-line leading-relaxed font-sans">
                {previewMaterial.fileContent || previewMaterial.description}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Tệp: {previewMaterial.fileName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownload(previewMaterial)}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Tải về máy
                </button>
                <button
                  onClick={() => setPreviewMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
