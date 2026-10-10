import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { RaceTrackData, MonthlyHonor, MonthlyReward } from '../../types/index.js';
import {
  Trophy,
  Sparkles,
  Award,
  Gift,
  Star,
  CheckCircle2,
  TrendingUp,
  Heart,
} from 'lucide-react';

export const StudentRaceTrack: React.FC = () => {
  const [raceData, setRaceData] = useState<RaceTrackData | null>(null);
  const [honors, setHonors] = useState<MonthlyHonor[]>([]);
  const [rewards, setRewards] = useState<MonthlyReward[]>([]);
  const [activeTab, setActiveTab] = useState<'track' | 'honors' | 'rewards'>('track');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rData, hList, rList] = await Promise.all([
        api.getRaceTrack(),
        api.getHonors(),
        api.getRewards(),
      ]);
      setRaceData(rData);
      setHonors(hList);
      setRewards(rList);
    } catch (err) {
      console.error('Failed to load race track data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !raceData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-3 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  const myRanking = raceData.rankings.find(r => r.isMe);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
            Đường Đua Chill Văn & Bảng Vinh Danh
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Hành trình tích lũy điểm sao, chinh phục các mốc tiến bộ và nhận quà tháng
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex p-1 bg-slate-100 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('track')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'track' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            🚀 Đường đua tiến bộ
          </button>
          <button
            onClick={() => setActiveTab('honors')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'honors' ? 'bg-white text-pink-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            👑 Bảng Vinh Danh
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'rewards' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600'
            }`}
          >
            🎁 Quà thưởng tháng
          </button>
        </div>
      </div>

      {/* TAB 1: VISUAL RACE TRACK */}
      {activeTab === 'track' && (
        <div className="space-y-6">
          {/* My Current Milestone Card */}
          {myRanking && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-200/90 via-amber-100 to-pink-100 p-6 sm:p-8 border border-amber-200/80 shadow-xs">
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-3xl bg-white text-amber-500 flex items-center justify-center text-3xl shadow-sm border border-amber-200 shrink-0">
                    {myRanking.currentMilestone.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase text-amber-800 tracking-wider">Vị trí hiện tại của em</span>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800">
                      Mốc: {myRanking.currentMilestone.name}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      Đang có <strong className="text-amber-600 font-black tabular-nums">{myRanking.totalPoints} điểm sao</strong> · Tiến tới {myRanking.nextMilestone.name} ({myRanking.nextMilestone.points}đ)
                    </p>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-amber-200 sm:pl-6">
                  <div className="text-[11px] font-bold text-amber-800 uppercase">Tiến độ chặng đua</div>
                  <div className="text-3xl font-black text-amber-600 tabular-nums">
                    {myRanking.progressPercent}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Milestones Road Map */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xs">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-6">
              Các Mốc Chinh Phục Của Chặng Đua
            </h3>

            {/* Milestones horizontal strip */}
            <div className="relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-1/2 left-8 right-8 h-2 bg-gradient-to-r from-pink-200 via-amber-200 to-sky-200 -translate-y-1/2 rounded-full" />

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 relative z-10">
                {raceData.milestones.map((m, idx) => {
                  const isReached = (myRanking?.totalPoints || 0) >= m.points;
                  const isCurrent = myRanking?.currentMilestone.level === m.level;

                  return (
                    <div
                      key={m.level}
                      className={`p-4 rounded-2xl border text-center transition-all ${
                        isCurrent
                          ? 'bg-amber-50 border-amber-400 shadow-md ring-2 ring-amber-200 scale-105'
                          : isReached
                          ? 'bg-emerald-50/60 border-emerald-200'
                          : 'bg-slate-50 border-slate-100 opacity-70'
                      }`}
                    >
                      <div className="text-3xl mb-2">{m.icon}</div>
                      <div className="text-xs font-bold text-slate-800 truncate">{m.name}</div>
                      <div className="text-[11px] font-extrabold text-amber-600 mt-1 tabular-nums">
                        {m.points} điểm
                      </div>
                      {isCurrent && (
                        <div className="mt-2 inline-block px-2 py-0.5 rounded-full bg-amber-400 text-white font-extrabold text-[10px]">
                          Vị trí của em
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student Rankings in Class */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Các bạn cùng lớp trên đường đua (Ghi nhận tiến bộ chung)
              </h4>

              <div className="space-y-3">
                {raceData.rankings.map((r, idx) => (
                  <div
                    key={r.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
                      r.isMe
                        ? 'bg-amber-50/70 border-amber-300 font-bold'
                        : 'bg-slate-50/50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-white'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-700'
                            : idx === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div>
                        <div className="text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                          {r.name} {r.isMe && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 font-bold">Em</span>}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {r.currentMilestone.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Mini progress bar */}
                      <div className="hidden sm:block w-32 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${r.progressPercent}%` }}
                        />
                      </div>

                      <div className="text-right">
                        <span className="text-xs sm:text-sm font-extrabold text-amber-600 tabular-nums">
                          ⭐ {r.totalPoints}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY HONORS */}
      {activeTab === 'honors' && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-2">
            <span className="text-2xl">🏆</span>
            <h3 className="text-lg font-black text-slate-800 mt-1">BẢNG VINH DANH CHILL VĂN</h3>
            <p className="text-xs text-slate-500">
              Vinh danh những nỗ lực, sáng tạo và sự chăm chỉ của các bạn học sinh trong tháng!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {honors.map(h => (
              <div
                key={h.id}
                className="bg-white rounded-3xl p-6 border border-pink-100 hover:border-pink-200 shadow-xs transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-bold text-pink-600">Tháng {h.month}</span>
                  <span>{h.className}</span>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-bold mb-3">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  {h.category === 'cham_chi' ? 'Ngôi sao chăm chỉ' :
                   h.category === 'tien_bo' ? 'Ngôi sao tiến bộ' :
                   h.category === 'sang_tao' ? 'Ngôi sao sáng tạo' :
                   h.category === 'tich_cuc' ? 'Ngôi sao tích cực' : 'Ngôi sao xuất sắc'}
                </div>

                <h3 className="text-lg font-black text-slate-800">
                  {h.studentName}
                </h3>

                <p className="mt-3 text-xs text-slate-600 italic bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                  "{h.teacherComment}"
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400">
                  🌸 Lời tuyên dương từ Cô Yến Thanh
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MONTHLY REWARDS */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="text-center max-w-md mx-auto mb-2">
            <span className="text-2xl">🎁</span>
            <h3 className="text-lg font-black text-slate-800 mt-1">GÓC QUÀ THƯỞNG MỖI THÁNG</h3>
            <p className="text-xs text-slate-500">
              Những phần quà xinh xắn cô chuẩn bị để trao thưởng thực tế cho các bạn đạt mục tiêu!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {rewards.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 border border-sky-100 hover:border-sky-200 shadow-xs transition-all flex flex-col justify-between"
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
                    <div className="font-bold text-sky-900 mb-0.5">Điều kiện nhận quà:</div>
                    <div className="text-sky-700">{r.conditionText}</div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Tháng áp dụng: {r.availableMonth}</span>
                  {r.quantity && <span>Số lượng: {r.quantity} phần</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
