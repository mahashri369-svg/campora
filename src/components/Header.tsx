import React from 'react';
import {
  Calendar,
  LayoutDashboard,
  Calculator,
  Table,
  HelpCircle,
  GraduationCap,
  User,
  ArrowRightLeft,
  Activity,
  Sparkles,
  Bot,
} from 'lucide-react';
import { StudentProfile } from '../types';

export type AppSuite = 'locator' | 'attendance';

export type NavigationTab =
  | 'locator_dashboard'
  | 'locator_grid'
  | 'locator_3d'
  | 'locator_ai'
  | 'calculator'
  | 'health'
  | 'od_simulator'
  | 'matrix'
  | 'timetable'
  | 'advisor'
  | 'guide';

interface HeaderProps {
  activeAppSuite: AppSuite;
  setActiveAppSuite: (suite: AppSuite) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  onOpenHowItWorks: () => void;
  selectedSectionName: string;
  currentStudent: StudentProfile | null;
  onOpenProfile: () => void;
  onSwitchStudent: () => void;
  onToggleChatBot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeAppSuite,
  setActiveAppSuite,
  activeTab,
  setActiveTab,
  onOpenHowItWorks,
  selectedSectionName,
  currentStudent,
  onOpenProfile,
  onSwitchStudent,
  onToggleChatBot,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Wordmark & Round Indicator */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 font-black text-sm tracking-wider">
              C
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white leading-none">
                  Campora
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 leading-none">
                  {activeAppSuite === 'locator' ? 'Class Locator' : 'Attendance'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono mt-1">
                Smart Campus Suite · VibeCraft
              </span>
            </div>
          </div>

          {/* Zone 2: Round 1 vs Round 2 Suite Switcher Toggle */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveAppSuite('locator');
                setActiveTab('locator_dashboard');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeAppSuite === 'locator'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🏢 Free Class Locator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200">
                R2
              </span>
            </button>

            <button
              onClick={() => {
                setActiveAppSuite('attendance');
                setActiveTab('calculator');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeAppSuite === 'attendance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>📊 Attendance Predictor</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                R1
              </span>
            </button>
          </div>

          {/* Zone 3: Student Profile & Primary Actions */}
          <div className="flex items-center gap-2.5">
            {currentStudent ? (
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-lg p-1 pr-2">
                <button
                  onClick={onOpenProfile}
                  title="View and edit your profile"
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity text-left cursor-pointer"
                >
                  <div className="w-7 h-7 rounded bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-[11px] font-bold font-mono text-indigo-300">
                    {currentStudent.name ? currentStudent.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-semibold text-white leading-tight">
                      {currentStudent.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono leading-tight">
                      {currentStudent.email}
                    </span>
                  </div>
                </button>
                <button
                  onClick={onOpenProfile}
                  title="Edit Profile"
                  className="ml-1 px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white text-[11px] border border-slate-800 transition-colors"
                >
                  Profile
                </button>
                <button
                  onClick={onSwitchStudent}
                  title="Switch student profile / log out"
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline text-[11px]">Switch</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onSwitchStudent}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5" />
                <span>Student Login</span>
              </button>
            )}

            <button
              onClick={onOpenHowItWorks}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Help</span>
            </button>
          </div>
        </div>

        {/* Mobile Suite Switcher */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60 text-xs">
          <button
            onClick={() => {
              setActiveAppSuite('locator');
              setActiveTab('locator_dashboard');
            }}
            className={`px-3 py-1 rounded font-bold ${
              activeAppSuite === 'locator' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            🏢 Free Class Locator (R2)
          </button>
          <button
            onClick={() => {
              setActiveAppSuite('attendance');
              setActiveTab('calculator');
            }}
            className={`px-3 py-1 rounded font-bold ${
              activeAppSuite === 'attendance' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            📊 Attendance Predictor (R1)
          </button>
        </div>
      </div>
    </header>
  );
};
