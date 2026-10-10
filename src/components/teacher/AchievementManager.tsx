import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import {
  ClassItem,
  StudentListItem,
  AchievementPointLog,
  MonthlyHonor,
  MonthlyReward,
  HonorCategory,
} from '../../types/index.js';
import {
  Sparkles,
  Award,
  Gift,
  Plus,
  Trash2,
  Calendar,
  Check,
  Star,
  Trophy,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { ConfirmationModal } from '../common/ConfirmationModal.js';

export const AchievementManager: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [logs, setLogs] = useState<AchievementPointLog[]>([]);
  const [honors, setHonors] = useState<MonthlyHonor[]>([]);
  const [rewards, setRewards] = useState<MonthlyReward[]>([]);

  const [activeTab, setActiveTab] = useState<'points' | 'honors' | 'rewards'>('points');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Award Points Form Modal
  const [isAwardModal, setIsAwardModal] = useState(false);
  const [awardStudentId, setAwardStudentId] = useState('');
  const [awardPoints, setAwardPoints] = useState(10);
  const [awardCategory, setAwardCategory] = useState<string>('active_speaking');
  const [awardReason, setAwardReason] = useState('');

  // Add Monthly Honor Modal
  const [isHonorModal, setIsHonorModal] = useState(false);
  const [honorMonth, setHonorMonth] = useState('10/2026');
  const [honorClassId, setHonorClassId] = useState('');
  const [honorCategory, setHonorCategory] = useState<HonorCategory>('cham_chi');
  const [honorStudentId, setHonorStudentId] = useState('');
  const [honorComment, setHonorComment] = useState('');

  // Add Reward Modal
  const [isRewardModal, setIsRewardModal] = useState(false);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDesc, setRewardDesc] = useState('');
  const [rewardCondition, setRewardCondition] = useState('');
  const [rewardPoints, setRewardPoints] = useState(100);
  const [rewardQuantity, setRewardQuantity] = useState(5);
  const [rewardMonth, setRewardMonth] = useState('10/2026');

  // Delete Honor modal
  const [honorToDelete, setHonorToDelete] = useState<MonthlyHonor | null>(null);

  // Notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadAll();
  }, [selectedClassId]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [classList, studentList, logsList, honorList, rewardList] = await Promise.all([
        api.getClasses(),
        api.getStudents({ classId: selectedClassId }),
        api.getPointsLogs({ classId: selectedClassId }),
        api.getHonors({ classId: selectedClassId }),
        api.getRewards(),
      ]);
      setClasses(classList);
      setStudents(studentList);
      setLogs(logsList);
      setHonors(honorList);
      setRewards(rewardList);

      if (studentList.length > 0 && !awardStudentId) {
        setAwardStudentId(studentList[0].id);
      }
      if (classList.length > 0 && !honorClassId) {
        setHonorClassId(classList[0].id);
      }
      if (studentList.length > 0 && !honorStudentId) {
        setHonorStudentId(studentList[0].id);
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Lỗi tải thành tích' });
    } finally {
      setLoading(false);
    }
  };

  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.awardPoints({
        studentId: awardStudentId,
        points: awardPoints,
        category: awardCategory,
        reason: awardReason,
      });
      setNotification({ type: 'success', message: res.message });
      setIsAwardModal(false);
      setAwardReason('');
      loadAll();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateHonor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createHonor({
        month: honorMonth,
        classId: honorClassId,
        category: honorCategory,
        studentId: honorStudentId,
        teacherComment: honorComment,
      });
      setNotification({ type: 'success', message: res.message });
      setIsHonorModal(false);
      setHonorComment('');
      loadAll();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createReward({
        title: rewardTitle,
        description: rewardDesc,
        conditionText: rewardCondition,
        minPoints: rewardPoints,
        quantity: rewardQuantity,
        availableMonth: rewardMonth,
      });
      setNotification({ type: 'success', message: 'Tạo phần thưởng mới thành công!' });
      setIsRewardModal(false);
      setRewardTitle('');
      setRewardDesc('');
      setRewardCondition('');
      loadAll();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleDeleteHonorConfirm = async () => {
    if (!honorToDelete) return;
    try {
      await api.deleteHonor(honorToDelete.id);
      setNotification({ type: 'success', message: 'Đã xóa vinh danh' });
      setHonorToDelete(null);
      loadAll();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const getHonorTitle = (cat: HonorCategory) => {
    switch (cat) {
      case 'cham_chi': return 'Ngôi sao chăm chỉ';
      case 'tien_bo': return 'Ngôi sao tiến bộ';
      case 'sang_tao': return 'Ngôi sao sáng tạo';
      case 'tich_cuc': return 'Ngôi sao tích cực';
      case 'xuat_sac': return 'Ngôi sao xuất sắc';
      default: return 'Ngôi sao sáng';
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
            Hệ Thống Thành Tích & Đường Đua Chill Văn
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Tặng điểm sao, công bố Bảng vinh danh và chuẩn bị quà tặng hàng tháng
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 bg-slate-100 rounded-2xl">
          <button
            onClick={() => setActiveTab('points')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'points' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            ⭐ Điểm sao
          </button>
          <button
            onClick={() => setActiveTab('honors')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'honors' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            👑 Bảng Vinh Danh
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rewards' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            🎁 Quà thưởng tháng
          </button>
        </div>
      </div>

      {/* TAB 1: POINTS MANAGEMENT */}
      {activeTab === 'points' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-800">
              Nhật ký cộng điểm sao thi đua
            </div>
            <button
              onClick={() => setIsAwardModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              + Tặng điểm sao cho học sinh
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Chưa có lịch sử cộng điểm. Hãy bấm <span className="text-amber-500 font-bold">+ Tặng điểm sao</span> để khích lệ học sinh nhé!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pl-2">Học sinh</th>
                      <th className="pb-3">Điểm cộng</th>
                      <th className="pb-3">Hạng mục</th>
                      <th className="pb-3">Lý do cô ghi nhận</th>
                      <th className="pb-3 pr-2 text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {logs.map(l => (
                      <tr key={l.id} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-3.5 pl-2 font-bold text-slate-800">
                          {l.studentName}
                        </td>
                        <td className="py-3.5 font-extrabold text-amber-500 tabular-nums text-sm">
                          {l.points > 0 ? `+${l.points}` : l.points} ⭐
                        </td>
                        <td className="py-3.5 text-xs text-slate-600 font-medium">
                          {l.category === 'on_time' ? 'Nộp bài đúng hạn' :
                           l.category === 'active_speaking' ? 'Tích cực phát biểu' :
                           l.category === 'great_progress' ? 'Tiến bộ vượt bậc' :
                           l.category === 'creative' ? 'Sáng tạo văn học' :
                           l.category === 'excellent_work' ? 'Nhiệm vụ xuất sắc' : 'Hoạt động khác'}
                        </td>
                        <td className="py-3.5 text-slate-700 text-xs">
                          {l.reason}
                        </td>
                        <td className="py-3.5 pr-2 text-right text-xs text-slate-400">
                          {new Date(l.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY HONORS */}
      {activeTab === 'honors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-800">
                BẢNG VINH DANH CHILL VĂN
              </div>
              <p className="text-xs text-slate-500">
                Tuyên dương các cá nhân tiêu biểu theo 5 hạng mục xuất sắc
              </p>
            </div>
            <button
              onClick={() => setIsHonorModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-400 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              + Thêm vinh danh tháng
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {honors.map(h => (
              <div
                key={h.id}
                className="bg-white rounded-3xl p-6 border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Background decorative shine */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-100/50 rounded-bl-full pointer-events-none" />

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-bold text-pink-600">Tháng {h.month}</span>
                    <span>{h.className}</span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold mb-3">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    {getHonorTitle(h.category)}
                  </div>

                  <h3 className="text-lg font-black text-slate-800">
                    {h.studentName}
                  </h3>

                  <p className="mt-3 text-xs text-slate-600 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                    "{h.teacherComment}"
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Cô Yến Thanh vinh danh</span>
                  <button
                    onClick={() => setHonorToDelete(h)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY REWARDS */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-slate-800">
                Danh Mục Quà Thưởng Mỗi Tháng
              </div>
              <p className="text-xs text-slate-500">
                Các phần quà thực tế cô chuẩn bị để học sinh đổi điểm sao hoặc vinh danh
              </p>
            </div>
            <button
              onClick={() => setIsRewardModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Gift className="w-4 h-4" />
              + Thêm phần thưởng mới
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 border border-sky-100 hover:border-sky-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-2xl mb-4 border border-amber-100">
                    🎁
                  </div>
                  <h3 className="text-base font-bold text-slate-800 leading-snug">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs">
                    <div className="font-bold text-sky-900 mb-0.5">Điều kiện nhận:</div>
                    <div className="text-sky-700">{r.conditionText}</div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Áp dụng: {r.availableMonth}</span>
                  {r.quantity && <span>Số lượng: {r.quantity} phần</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: AWARD POINTS */}
      {isAwardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-amber-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Tặng Điểm Sao Cho Học Sinh
            </h3>
            <form onSubmit={handleAwardPoints} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn học sinh *</label>
                <select
                  value={awardStudentId}
                  onChange={e => setAwardStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điểm sao *</label>
                  <input
                    type="number"
                    required
                    value={awardPoints}
                    onChange={e => setAwardPoints(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Hạng mục</label>
                  <select
                    value={awardCategory}
                    onChange={e => setAwardCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    <option value="active_speaking">Phát biểu sôi nổi</option>
                    <option value="on_time">Nộp bài đúng hạn</option>
                    <option value="great_progress">Tiến bộ vượt bậc</option>
                    <option value="creative">Sáng tạo văn học</option>
                    <option value="excellent_work">Nhiệm vụ xuất sắc</option>
                    <option value="other">Hoạt động khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lý do ghi nhận *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ví dụ: Em có cách liên hệ rất độc đáo trong tiết phân tích thơ..."
                  value={awardReason}
                  onChange={e => setAwardReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAwardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold"
                >
                  Cộng điểm sao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MONTHLY HONOR */}
      {isHonorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-pink-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-pink-500" />
              Thêm Học Sinh Vào Bảng Vinh Danh
            </h3>
            <form onSubmit={handleCreateHonor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tháng vinh danh *</label>
                  <input
                    type="text"
                    required
                    value={honorMonth}
                    onChange={e => setHonorMonth(e.target.value)}
                    placeholder="10/2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp *</label>
                  <select
                    value={honorClassId}
                    onChange={e => setHonorClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Danh hiệu *</label>
                <select
                  value={honorCategory}
                  onChange={e => setHonorCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  <option value="cham_chi">Ngôi sao chăm chỉ</option>
                  <option value="tien_bo">Ngôi sao tiến bộ</option>
                  <option value="sang_tao">Ngôi sao sáng tạo</option>
                  <option value="tich_cuc">Ngôi sao tích cực</option>
                  <option value="xuat_sac">Ngôi sao xuất sắc</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Học sinh vinh danh *</label>
                <select
                  value={honorStudentId}
                  onChange={e => setHonorStudentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName} ({s.className})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Lời khen tặng của cô</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Em luôn chủ động tìm tòi đọc thêm tác phẩm và chia sẻ cùng các bạn..."
                  value={honorComment}
                  onChange={e => setHonorComment(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsHonorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white text-xs font-bold"
                >
                  Vinh danh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD REWARD */}
      {isRewardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-sky-100 shadow-xl">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-sky-500" />
              Tạo Phần Thưởng Tháng Mới
            </h3>
            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên phần thưởng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Sổ tay bìa da Chill Văn xinh xắn"
                  value={rewardTitle}
                  onChange={e => setRewardTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả phần thưởng *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Mô tả món quà thực tế để các em phấn đấu..."
                  value={rewardDesc}
                  onChange={e => setRewardDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Điều kiện nhận quà *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tích lũy đủ 100 điểm sao trong tháng"
                  value={rewardCondition}
                  onChange={e => setRewardCondition(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng quà</label>
                  <input
                    type="number"
                    value={rewardQuantity}
                    onChange={e => setRewardQuantity(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tháng áp dụng</label>
                  <input
                    type="text"
                    value={rewardMonth}
                    onChange={e => setRewardMonth(e.target.value)}
                    placeholder="10/2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRewardModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold"
                >
                  Tạo phần thưởng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION: DELETE HONOR */}
      <ConfirmationModal
        isOpen={Boolean(honorToDelete)}
        title="Xóa Vinh Danh"
        message={`Cô có chắc chắn muốn xóa vinh danh của em ${honorToDelete?.studentName}?`}
        confirmLabel="Xóa vinh danh"
        isDestructive
        onConfirm={handleDeleteHonorConfirm}
        onCancel={() => setHonorToDelete(null)}
      />
    </div>
  );
};
