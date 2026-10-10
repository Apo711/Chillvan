import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Header } from './components/common/Header.js';
import { AuthScreen } from './components/auth/AuthScreen.js';

// Teacher Views
import { TeacherDashboard } from './components/teacher/TeacherDashboard.js';
import { ClassManagement } from './components/teacher/ClassManagement.js';
import { MaterialLibrary } from './components/teacher/MaterialLibrary.js';
import { AssignmentCreator } from './components/teacher/AssignmentCreator.js';
import { GradingCenter } from './components/teacher/GradingCenter.js';
import { AchievementManager } from './components/teacher/AchievementManager.js';
import { TeacherSettings } from './components/teacher/TeacherSettings.js';

// Student Views
import { StudentHome } from './components/student/StudentHome.js';
import { StudentAssignments } from './components/student/StudentAssignments.js';
import { StudentLibrary } from './components/student/StudentLibrary.js';
import { StudentRaceTrack } from './components/student/StudentRaceTrack.js';
import { StudentProfile } from './components/student/StudentProfile.js';

const MainApp: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  // Navigation state
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [tabMeta, setTabMeta] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FFFDFB] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-300 to-sky-300 flex items-center justify-center text-2xl animate-bounce">
          🌸
        </div>
        <p className="mt-4 text-xs font-bold text-slate-500 tracking-wider uppercase">
          Đang chuẩn bị không gian Chill Văn...
        </p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const navigateTo = (tab: string, meta?: any) => {
    setCurrentTab(tab);
    setTabMeta(meta || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Adjust default tab based on role if initial state mismatch
  const activeTab = role === 'student' && currentTab === 'dashboard' ? 'home' : currentTab;

  return (
    <div className="min-h-screen bg-[#FFFDFB] flex flex-col justify-between text-[#334155]">
      <div>
        <Header
          currentTab={activeTab}
          onSelectTab={tab => navigateTo(tab)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {role === 'teacher' ? (
            <>
              {activeTab === 'dashboard' && <TeacherDashboard onNavigate={navigateTo} />}
              {activeTab === 'classes' && <ClassManagement initialOpenAddStudent={Boolean(tabMeta?.openAddStudent)} />}
              {activeTab === 'library' && <MaterialLibrary initialOpenUpload={Boolean(tabMeta?.openUpload)} />}
              {activeTab === 'assignments' && (
                <AssignmentCreator
                  initialOpenCreate={Boolean(tabMeta?.openCreate)}
                  onNavigateToGrading={aId => navigateTo('grading', { assignmentId: aId })}
                />
              )}
              {activeTab === 'grading' && <GradingCenter initialAssignmentId={tabMeta?.assignmentId} />}
              {activeTab === 'achievements' && <AchievementManager />}
              {activeTab === 'settings' && <TeacherSettings />}
            </>
          ) : (
            <>
              {activeTab === 'home' && <StudentHome onNavigate={navigateTo} />}
              {activeTab === 'assignments' && (
                <StudentAssignments initialTakeAssignmentId={tabMeta?.takeAssignmentId} />
              )}
              {activeTab === 'library' && <StudentLibrary />}
              {activeTab === 'race-track' && <StudentRaceTrack />}
              {activeTab === 'profile' && <StudentProfile />}
            </>
          )}
        </main>
      </div>

      <footer className="mt-12 border-t border-pink-100 bg-white/60 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="font-semibold text-slate-700">
            CHILL VĂN – CÔ YẾN THANH · <span className="font-normal text-slate-500">Học Văn thật chill – Mỗi ngày một chút tiến bộ!</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Phiên bản thực tế LMS môn Ngữ văn · Cơ sở dữ liệu đồng bộ
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
