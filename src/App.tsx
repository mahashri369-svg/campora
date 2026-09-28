/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Header, NavigationTab, AppSuite } from './components/Header';
import { LandingHero } from './components/LandingHero';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultDashboard } from './components/ResultDashboard';
import { SubjectMatrixView } from './components/SubjectMatrixView';
import { TimetableView } from './components/TimetableView';
import { HowItWorksModal } from './components/HowItWorksModal';
import { StudentLoginScreen } from './components/StudentLoginScreen';
import { UserProfileModal } from './components/UserProfileModal';
import { AttendanceHealthDashboard } from './components/AttendanceHealthDashboard';
import { OdLeaveSimulator } from './components/OdLeaveSimulator';
import { AttendanceAdvisorChat } from './components/AttendanceAdvisorChat';
import { FloorManagerDashboard } from './components/room-locator/FloorManagerDashboard';
import { SECTIONS_DATA, SEMESTER_CONFIG } from './data/timetableData';
import { Section, SubjectInfo, CalculationResult, StudentProfile } from './types';
import {
  formatLocalDate,
  parseLocalDate,
  performAttendanceCalculation,
} from './utils/attendance';
import {
  getActiveUser,
  logoutUser,
  updateUserProfile,
  saveUserSubjectAttendance,
  saveUserOdCredits,
  applyOdCreditsToAttendance,
} from './utils/studentStorage';
import { Activity, Sparkles, Bot, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';

export default function App() {
  // Master app suite state: 'locator' (Round 2 default) vs 'attendance' (Round 1)
  const [activeAppSuite, setActiveAppSuite] = useState<AppSuite>('locator');

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<NavigationTab>('locator_dashboard');
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAdvisorChatOpen, setIsAdvisorChatOpen] = useState<boolean>(false);

  // Active authenticated student state (retrieved by email/session)
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(() => getActiveUser());

  // Active OD simulation credits for real-time preview across all views
  const [activeOdCredits, setActiveOdCredits] = useState<Record<string, number>>(() => {
    const active = getActiveUser();
    return active?.simulatedOdCredits || {};
  });

  // System auto-detected today's date
  const systemDetectedDateStr = formatLocalDate(new Date());

  // Effective today date bounded by semester
  const [todayDateStr, setTodayDateStr] = useState<string>(() => {
    const today = parseLocalDate(systemDetectedDateStr);
    const semStart = parseLocalDate(SEMESTER_CONFIG.startDate);
    const semEnd = parseLocalDate(SEMESTER_CONFIG.endDate);

    if (today < semStart) return SEMESTER_CONFIG.startDate;
    if (today > semEnd) return SEMESTER_CONFIG.endDate;
    return systemDetectedDateStr;
  });

  // Planning date (default: semester end 29 Nov 2026)
  const [planningDateStr, setPlanningDateStr] = useState<string>(SEMESTER_CONFIG.endDate);

  // Selected Section & Subject state (bound to user's assigned section)
  const [selectedSection, setSelectedSection] = useState<Section>(() => {
    const active = getActiveUser();
    if (active?.sectionId) {
      return SECTIONS_DATA.find((s) => s.id === active.sectionId) || SECTIONS_DATA[0];
    }
    return SECTIONS_DATA[0];
  });

  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo>(() => {
    return selectedSection.subjects[0];
  });

  // Attendance inputs for the current subject: strictly loaded from user or 0 if not entered
  const [conductedClasses, setConductedClasses] = useState<number>(() => {
    const active = getActiveUser();
    const saved = active?.subjectAttendance?.[selectedSection.subjects[0]?.code];
    return saved ? saved.conducted : 0;
  });

  const [attendedClasses, setAttendedClasses] = useState<number>(() => {
    const active = getActiveUser();
    const saved = active?.subjectAttendance?.[selectedSection.subjects[0]?.code];
    return saved ? saved.attended : 0;
  });

  // Result state
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Load subject attendance when selected subject or current student changes
  useEffect(() => {
    if (!currentStudent) return;

    const saved = currentStudent.subjectAttendance?.[selectedSubject.code];
    if (saved && saved.conducted > 0) {
      setConductedClasses(saved.conducted);
      setAttendedClasses(saved.attended);
      runCalculation(selectedSection, selectedSubject, saved.conducted, saved.attended, todayDateStr, planningDateStr);
    } else {
      setConductedClasses(0);
      setAttendedClasses(0);
      setCalculationResult(null); // Do NOT show random calculation result when no data is entered!
    }
  }, [selectedSubject.code, currentStudent?.id]);

  // When a user logs in or registers
  const handleLoginSuccess = (user: StudentProfile) => {
    setCurrentStudent(user);
    setIsAuthModalOpen(false);

    // Apply user's selected section from registration
    const matchedSection = SECTIONS_DATA.find((s) => s.id === user.sectionId) || SECTIONS_DATA[0];
    setSelectedSection(matchedSection);

    const firstSub = matchedSection.subjects[0];
    setSelectedSubject(firstSub);

    const saved = user.subjectAttendance?.[firstSub.code];
    if (saved && saved.conducted > 0) {
      setConductedClasses(saved.conducted);
      setAttendedClasses(saved.attended);
      runCalculation(matchedSection, firstSub, saved.conducted, saved.attended, todayDateStr, planningDateStr);
    } else {
      setConductedClasses(0);
      setAttendedClasses(0);
      setCalculationResult(null);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentStudent(null);
    setCalculationResult(null);
    setActiveOdCredits({});
    setIsProfileModalOpen(false);
    setIsAuthModalOpen(true);
  };

  const handleSaveProfileUpdates = (updates: {
    name: string;
    sectionId: string;
    rollNumber: string;
    phoneNumber: string;
  }) => {
    if (!currentStudent) return;

    const result = updateUserProfile(currentStudent.id, updates);
    if (result.success && result.user) {
      setCurrentStudent(result.user);

      // If user changed their section, update section and reload first subject
      if (updates.sectionId !== selectedSection.id) {
        const newSec = SECTIONS_DATA.find((s) => s.id === updates.sectionId) || SECTIONS_DATA[0];
        setSelectedSection(newSec);
        setSelectedSubject(newSec.subjects[0]);
      }
    }
  };

  const handleSelectSection = (sectionId: string) => {
    const found = SECTIONS_DATA.find((s) => s.id === sectionId) || SECTIONS_DATA[0];
    setSelectedSection(found);
    const firstSub = found.subjects[0];
    setSelectedSubject(firstSub);

    const saved = currentStudent?.subjectAttendance?.[firstSub.code];
    if (saved && saved.conducted > 0) {
      setConductedClasses(saved.conducted);
      setAttendedClasses(saved.attended);
      runCalculation(found, firstSub, saved.conducted, saved.attended, todayDateStr, planningDateStr);
    } else {
      setConductedClasses(0);
      setAttendedClasses(0);
      setCalculationResult(null);
    }
  };

  const handleSelectSubject = (subjectCode: string) => {
    const found = selectedSection.subjects.find((s) => s.code === subjectCode) || selectedSection.subjects[0];
    setSelectedSubject(found);

    const saved = currentStudent?.subjectAttendance?.[found.code];
    if (saved && saved.conducted > 0) {
      setConductedClasses(saved.conducted);
      setAttendedClasses(saved.attended);
      runCalculation(selectedSection, found, saved.conducted, saved.attended, todayDateStr, planningDateStr);
    } else {
      setConductedClasses(0);
      setAttendedClasses(0);
      setCalculationResult(null);
    }
  };

  const runCalculation = (
    sec: Section,
    sub: SubjectInfo,
    conducted: number,
    attended: number,
    today: string,
    planning: string
  ) => {
    if (conducted <= 0) {
      setCalculationResult(null);
      return;
    }

    const res = performAttendanceCalculation(sec, sub, conducted, attended, today, planning);
    setCalculationResult(res);

    // Persist this attendance to the user's specific account
    if (currentStudent) {
      saveUserSubjectAttendance(currentStudent.id, sub.code, conducted, attended);
      // Update local state copy of current student
      const updatedAttendance = {
        ...(currentStudent.subjectAttendance || {}),
        [sub.code]: { conducted, attended },
      };
      setCurrentStudent({
        ...currentStudent,
        subjectAttendance: updatedAttendance,
      });
    }

    // Trigger subtle confetti on goal achievement
    if (res.status === 'GOAL_ACHIEVED' || (res.status === 'SAFE' && res.safeTarget.requiredClasses === 0)) {
      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.65 },
          colors: ['#6366f1', '#10b981', '#38bdf8'],
          disableForReducedMotion: true,
        });
      } catch (e) {
        // ignore
      }
    }
  };

  const handleCalculateClick = () => {
    runCalculation(
      selectedSection,
      selectedSubject,
      conductedClasses,
      attendedClasses,
      todayDateStr,
      planningDateStr
    );

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleResetInputs = () => {
    setConductedClasses(0);
    setAttendedClasses(0);
    setCalculationResult(null);
  };

  const handleUpdateSubjectFromMatrix = (subjectCode: string, conducted: number, attended: number) => {
    if (!currentStudent) return;

    saveUserSubjectAttendance(currentStudent.id, subjectCode, conducted, attended);

    const updatedAttendance = {
      ...(currentStudent.subjectAttendance || {}),
      [subjectCode]: { conducted, attended },
    };

    const updatedStudent = {
      ...currentStudent,
      subjectAttendance: updatedAttendance,
    };
    setCurrentStudent(updatedStudent);

    // If currently selected subject in predictor, sync inputs
    if (selectedSubject.code === subjectCode) {
      setConductedClasses(conducted);
      setAttendedClasses(attended);
      runCalculation(selectedSection, selectedSubject, conducted, attended, todayDateStr, planningDateStr);
    }
  };

  const handleSelectSubjectFromMatrix = (subjectCode: string, conducted: number, attended: number) => {
    const found = selectedSection.subjects.find((s) => s.code === subjectCode) || selectedSection.subjects[0];
    setSelectedSubject(found);
    setConductedClasses(conducted);
    setAttendedClasses(attended);

    runCalculation(selectedSection, found, conducted, attended, todayDateStr, planningDateStr);
    setActiveTab('calculator');

    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  // Phase 2 OD simulator handlers
  const handleUpdateOdCredits = (credits: Record<string, number>) => {
    setActiveOdCredits(credits);
    if (currentStudent) {
      saveUserOdCredits(currentStudent.id, credits);
    }
  };

  const handleApplyOdCreditsToStudent = (credits: Record<string, number>) => {
    if (!currentStudent) return;

    const res = applyOdCreditsToAttendance(currentStudent.id, credits);
    if (res.success && res.user) {
      setCurrentStudent(res.user);
      setActiveOdCredits({});

      // If current subject had OD applied, reload its values
      const updatedForSub = res.user.subjectAttendance?.[selectedSubject.code];
      if (updatedForSub) {
        setConductedClasses(updatedForSub.conducted);
        setAttendedClasses(updatedForSub.attended);
        runCalculation(
          selectedSection,
          selectedSubject,
          updatedForSub.conducted,
          updatedForSub.attended,
          todayDateStr,
          planningDateStr
        );
      }

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#6366f1'],
        });
      } catch (e) {
        // ignore
      }
    }
  };

  // If no user is authenticated, display the login/registration gate
  if (!currentStudent) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
        <Header
          activeAppSuite={activeAppSuite}
          setActiveAppSuite={setActiveAppSuite}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
          selectedSectionName={selectedSection.name}
          currentStudent={null}
          onOpenProfile={() => setIsAuthModalOpen(true)}
          onSwitchStudent={() => setIsAuthModalOpen(true)}
        />

        <main className="flex-1 flex items-center justify-center">
          <StudentLoginScreen
            sections={SECTIONS_DATA}
            onLoginSuccess={handleLoginSuccess}
          />
        </main>

        <HowItWorksModal
          isOpen={isHowItWorksOpen}
          onClose={() => setIsHowItWorksOpen(false)}
        />
      </div>
    );
  }

  const hasSavedDataForCurrentSubject = Boolean(
    currentStudent.subjectAttendance?.[selectedSubject.code] &&
    currentStudent.subjectAttendance[selectedSubject.code].conducted > 0
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* 1. Header (Suite switcher between Free Class Locator R2 and Attendance Predictor R1) */}
      <Header
        activeAppSuite={activeAppSuite}
        setActiveAppSuite={setActiveAppSuite}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        selectedSectionName={selectedSection.name}
        currentStudent={currentStudent}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSwitchStudent={() => setIsAuthModalOpen(true)}
        onToggleChatBot={() => setIsAdvisorChatOpen(!isAdvisorChatOpen)}
      />

      {/* Main Workspace Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* ======================================================== */}
        {/* SUITE 1: ROUND 2 — FREE CLASS LOCATOR (Default)          */}
        {/* ======================================================== */}
        {activeAppSuite === 'locator' && (
          <FloorManagerDashboard currentStudent={currentStudent} />
        )}

        {/* ======================================================== */}
        {/* SUITE 2: ROUND 1 — ATTENDANCE PREDICTOR                  */}
        {/* ======================================================== */}
        {activeAppSuite === 'attendance' && (
          <div className="space-y-8 animate-fade-in">
            {/* Landing Hero */}
            <LandingHero
              onStartClick={() => {
                setActiveTab('calculator');
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              onHowItWorksClick={() => setIsHowItWorksOpen(true)}
              onSelectQuickSection={handleSelectSection}
            />

            {/* User Identity Session Banner */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-300 font-medium">
                  Logged in: <strong className="text-white font-semibold">{currentStudent.name}</strong> ({currentStudent.email})
                </span>
                <span className="text-slate-500">·</span>
                <span className="font-mono text-indigo-300 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60">
                  {selectedSection.name}
                </span>
                {currentStudent.rollNumber ? (
                  <span className="text-slate-400 font-mono text-[11px]">
                    Roll: {currentStudent.rollNumber}
                  </span>
                ) : (
                  <span className="text-amber-400/90 text-[11px]">
                    (Profile incomplete · Roll no. not added)
                  </span>
                )}
                {Object.keys(activeOdCredits).length > 0 && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    OD Simulation Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-slate-400">
                <button
                  onClick={() => setIsProfileModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium underline"
                >
                  Edit My Profile
                </button>
                <span>·</span>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="hover:text-white transition-colors"
                >
                  Switch Account
                </button>
                <span>·</span>
                <button
                  onClick={handleLogout}
                  className="hover:text-rose-400 transition-colors"
                >
                  Log Out
                </button>
              </div>
            </div>

            {/* Attendance Predictor Quick Nav Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setActiveTab('health')}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  activeTab === 'health'
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Activity className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">Attendance Health & Charts</div>
                    <div className="text-[11px] text-slate-400">Visual progress & distribution</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => setActiveTab('od_simulator')}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  activeTab === 'od_simulator'
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">OD & Medical Simulator</div>
                    <div className="text-[11px] text-slate-400">Simulate exemptions & condonation</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('advisor');
                  setIsAdvisorChatOpen(false);
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                  activeTab === 'advisor'
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                    <Bot className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="text-xs font-bold text-white">Attendance Advisor AI</div>
                    <div className="text-[11px] text-slate-400">Personalized timetable Q&A</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* TAB 1: Main Calculator & Predictor */}
            {activeTab === 'calculator' && (
              <div className="space-y-10">
                {/* Input Form */}
                <CalculatorForm
                  sections={SECTIONS_DATA}
                  selectedSection={selectedSection}
                  onSelectSection={handleSelectSection}
                  selectedSubject={selectedSubject}
                  onSelectSubject={handleSelectSubject}
                  conductedClasses={conductedClasses}
                  setConductedClasses={setConductedClasses}
                  attendedClasses={attendedClasses}
                  setAttendedClasses={setAttendedClasses}
                  todayDateStr={todayDateStr}
                  setTodayDateStr={setTodayDateStr}
                  planningDateStr={planningDateStr}
                  setPlanningDateStr={setPlanningDateStr}
                  onCalculate={handleCalculateClick}
                  onReset={handleResetInputs}
                  systemDetectedDateStr={systemDetectedDateStr}
                  currentStudent={currentStudent}
                  hasSavedDataForSubject={hasSavedDataForCurrentSubject}
                />

                {/* Results Section */}
                <div ref={resultRef} className="pt-2">
                  {calculationResult ? (
                    <ResultDashboard
                      result={calculationResult}
                      onJumpToTimetable={() => setActiveTab('timetable')}
                      onJumpToMatrix={() => setActiveTab('matrix')}
                    />
                  ) : (
                    <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                      <p className="text-sm text-slate-300 font-medium">
                        {hasSavedDataForCurrentSubject
                          ? 'Click "Calculate & Save My Attendance" to view complete projection.'
                          : 'No attendance data entered yet for this subject.'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Enter your conducted and attended classes above to run the timetable calculation engine.
                      </p>
                    </div>
                  )}
                </div>

                {/* Embedded Visuals Sneak Peek */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Activity className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-white">Visual Attendance Health Dashboard</h4>
                      <p className="text-xs text-slate-400">
                        Explore subject-wise Recharts bar comparisons, 75% reference lines, and detention risk distribution.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('health')}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap cursor-pointer"
                  >
                    Open Health Dashboard
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Attendance Health & Recharts Visuals */}
            {activeTab === 'health' && (
              <AttendanceHealthDashboard
                section={selectedSection}
                currentStudent={currentStudent}
                todayDateStr={todayDateStr}
                activeOdCredits={activeOdCredits}
                onSelectSubjectForDetail={(code) => {
                  handleSelectSubject(code);
                  setActiveTab('calculator');
                }}
                onOpenOdSimulator={() => setActiveTab('od_simulator')}
              />
            )}

            {/* TAB 3: OD / Medical Leave Simulator */}
            {activeTab === 'od_simulator' && (
              <OdLeaveSimulator
                section={selectedSection}
                currentStudent={currentStudent}
                todayDateStr={todayDateStr}
                activeOdCredits={activeOdCredits}
                onUpdateOdCredits={handleUpdateOdCredits}
                onApplyOdCreditsToStudent={handleApplyOdCreditsToStudent}
              />
            )}

            {/* TAB 4: AI Advisor Dedicated View */}
            {activeTab === 'advisor' && (
              <div className="max-w-4xl mx-auto">
                <AttendanceAdvisorChat
                  section={selectedSection}
                  currentStudent={currentStudent}
                  todayDateStr={todayDateStr}
                  activeOdCredits={activeOdCredits}
                  isOpen={true}
                  onClose={() => {}}
                  isEmbedded={true}
                />
              </div>
            )}

            {/* TAB 5: Subject Matrix View */}
            {activeTab === 'matrix' && (
              <SubjectMatrixView
                section={selectedSection}
                todayDateStr={todayDateStr}
                currentStudent={currentStudent}
                onUpdateSubjectAttendance={handleUpdateSubjectFromMatrix}
                onSelectSubjectForDetail={handleSelectSubjectFromMatrix}
              />
            )}

            {/* TAB 6: Section Timetable */}
            {activeTab === 'timetable' && (
              <TimetableView
                section={selectedSection}
                highlightSubjectCode={selectedSubject.code}
                onSelectSubject={(code) => handleSelectSubject(code)}
              />
            )}

            {/* TAB 7: Regulations & Rules Guide */}
            {activeTab === 'guide' && (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
                  <h2 className="text-xl font-bold text-white tracking-tight mb-2">
                    SRM IST Academic Regulations & Detention Rules
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Rules governing minimum attendance thresholds, condonation limits, and evaluation eligibility for the 2026-2027 Odd Semester.
                  </p>

                  <div className="mt-6 space-y-4 text-xs text-slate-300">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="font-semibold text-white text-sm mb-1 text-emerald-400">
                        Rule 1: 75% Minimum Attendance Threshold
                      </h3>
                      <p>
                        Every student must maintain at least <strong>75% attendance</strong> in each course to be eligible to appear for the end-semester examinations. A student whose attendance falls below 75% is placed on the <strong>Detained List</strong> and is barred from taking the semester exam in that subject.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="font-semibold text-white text-sm mb-1 text-rose-400">
                        Rule 2: Mathematical Irreversibility
                      </h3>
                      <p>
                        If the maximum possible final attendance <code className="text-indigo-300 font-mono">(A + R) / (T + R) × 100</code> is strictly less than 75%, detention is mathematically guaranteed and irreversible through standard class attendance alone.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="font-semibold text-white text-sm mb-1 text-indigo-400">
                        Rule 3: 90% Honor Target & Safety Cushion
                      </h3>
                      <p>
                        Maintaining ≥90% attendance awards internal academic distinction points and provides an ample safety cushion against unforeseen illnesses or event duties.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="font-semibold text-white text-sm mb-1 text-purple-400">
                        Rule 4: Medical Condonation (65% – 74.9%)
                      </h3>
                      <p>
                        Students with genuine medical grounds (hospitalization, certified medical emergency) whose attendance falls between <strong>65% and 74.9%</strong> may apply for condonation subject to verification and approval by the HoD and Dean. Attendance strictly below 65% is non-condonable.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <h3 className="font-semibold text-white text-sm mb-1 text-teal-400">
                        Rule 5: Official On-Duty (OD) Leave
                      </h3>
                      <p>
                        Attendance credit is granted for students representing the university in approved curricular or co-curricular events (hackathons, symposia, sports tournaments). Approved OD hours count directly towards attended class tally.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Profile Edit Modal */}
      {isProfileModalOpen && currentStudent && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentStudent}
          sections={SECTIONS_DATA}
          onSaveProfile={handleSaveProfileUpdates}
          onLogout={handleLogout}
        />
      )}

      {/* Switch Student / Login Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative max-w-md w-full my-8">
            <button
              onClick={() => setIsAuthModalOpen(false)}
              className="absolute top-4 right-4 z-10 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800/80 rounded-lg border border-slate-700 transition-colors"
            >
              Close
            </button>
            <StudentLoginScreen
              sections={SECTIONS_DATA}
              onLoginSuccess={handleLoginSuccess}
            />
          </div>
        </div>
      )}

      {/* Explanatory Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />

      {/* Floating Attendance Advisor AI Widget & Launcher Button */}
      {activeTab !== 'advisor' && (
        <>
          <button
            onClick={() => setIsAdvisorChatOpen(!isAdvisorChatOpen)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-full shadow-2xl shadow-indigo-600/40 border border-indigo-400/30 transition-all transform hover:scale-105 cursor-pointer"
            title="Ask Attendance Advisor AI"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-bold tracking-wide">AI Advisor</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          <AttendanceAdvisorChat
            section={selectedSection}
            currentStudent={currentStudent}
            todayDateStr={todayDateStr}
            activeOdCredits={activeOdCredits}
            isOpen={isAdvisorChatOpen}
            onClose={() => setIsAdvisorChatOpen(false)}
          />
        </>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Attendance Predictor</span>
            <span>·</span>
            <span>VibeCraft Round 1 (The Overworld) Phase 2</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Official SRM Tiruchirappalli Timetables</span>
            <span>·</span>
            <span>Semester: 29 Aug 2026 – 29 Nov 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
