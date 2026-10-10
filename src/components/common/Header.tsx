import React from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { LogOut, User as UserIcon, BookOpen, Sparkles, LayoutDashboard, FileText, Award, Library, Users, Settings } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onSelectTab }) => {
  const { user, role, logout } = useAuth();

  if (!user) return null;

  const teacherNav = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'classes', label: 'Lớp học', icon: Users },
    { id: 'library', label: 'Thư viện', icon: Library },
    { id: 'assignments', label: 'Bài tập', icon: FileText },
    { id: 'grading', label: 'Chấm bài', icon: Award },
    { id: 'achievements', label: 'Thành tích', icon: Sparkles },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  const studentNav = [
    { id: 'home', label: 'Trang chủ', icon: LayoutDashboard },
    { id: 'assignments', label: 'Bài tập', icon: FileText },
    { id: 'library', label: 'Thư viện', icon: Library },
    { id: 'race-track', label: 'Đường đua & Vinh danh', icon: Sparkles },
    { id: 'profile', label: 'Hồ sơ', icon: UserIcon },
  ];

  const navItems = role === 'teacher' ? teacherNav : studentNav;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab(role === 'teacher' ? 'dashboard' : 'home')}
          className="text-left flex items-center gap-2.5 focus:outline-hidden whitespace-nowrap shrink-0 group cursor-pointer"
        >
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-pink-300 via-pink-400 to-sky-300 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-pink-500 via-rose-500 to-sky-600 bg-clip-text text-transparent">
              CHILL VĂN
            </span>
            <span className="text-xs font-semibold text-slate-400 block -mt-0.5">
              Cô Yến Thanh
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-3 overflow-x-auto">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-pink-50 text-pink-600 shadow-xs'
                    : 'text-slate-600 hover:text-pink-500 hover:bg-pink-50/50'
                }`}
              >
                <item.icon className={`w-4 h-4 ${isActive ? 'text-pink-500' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary Action / User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[130px]">
              {user.fullName}
            </span>
            <span className="text-[11px] font-medium text-pink-500">
              {role === 'teacher' ? 'Giáo viên' : user.className || 'Học sinh'}
            </span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Navigation Strip */}
      <div className="md:hidden flex items-center gap-1 px-3 py-2 border-t border-pink-50 overflow-x-auto scrollbar-none bg-[#FFFDFB]">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-pink-100/70 text-pink-600 font-bold'
                  : 'text-slate-600 hover:bg-pink-50'
              }`}
            >
              <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-pink-500' : 'text-slate-400'}`} />
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
