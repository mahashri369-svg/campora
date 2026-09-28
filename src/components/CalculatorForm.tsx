import React, { useState } from 'react';
import {
  Calendar,
  Layers,
  BookOpen,
  Hash,
  AlertCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { Section, SubjectInfo, StudentProfile } from '../types';
import { SEMESTER_CONFIG } from '../data/timetableData';
import { parseLocalDate, formatDisplayDate } from '../utils/attendance';

interface CalculatorFormProps {
  sections: Section[];
  selectedSection: Section;
  onSelectSection: (sectionId: string) => void;
  selectedSubject: SubjectInfo;
  onSelectSubject: (subjectCode: string) => void;
  conductedClasses: number;
  setConductedClasses: (val: number) => void;
  attendedClasses: number;
  setAttendedClasses: (val: number) => void;
  todayDateStr: string;
  setTodayDateStr: (val: string) => void;
  planningDateStr: string;
  setPlanningDateStr: (val: string) => void;
  onCalculate: () => void;
  onReset: () => void;
  systemDetectedDateStr: string;
  currentStudent: StudentProfile;
  hasSavedDataForSubject: boolean;
}

export const CalculatorForm: React.FC<CalculatorFormProps> = ({
  sections,
  selectedSection,
  onSelectSection,
  selectedSubject,
  onSelectSubject,
  conductedClasses,
  setConductedClasses,
  attendedClasses,
  setAttendedClasses,
  todayDateStr,
  setTodayDateStr,
  planningDateStr,
  setPlanningDateStr,
  onCalculate,
  onReset,
  systemDetectedDateStr,
  currentStudent,
  hasSavedDataForSubject,
}) => {
  const [inputMode, setInputMode] = useState<'counts' | 'percentage'>('counts');
  const [directPercentage, setDirectPercentage] = useState<string>('85');
  const [estimatedConductedForPct, setEstimatedConductedForPct] = useState<number>(30);
  const [showDateOverride, setShowDateOverride] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Live percentage preview
  const livePercentage = conductedClasses > 0
    ? ((attendedClasses / conductedClasses) * 100).toFixed(1)
    : '0.0';

  // Handle direct percentage mode changes
  const applyPercentageInput = (pctVal: number, conductedVal: number) => {
    const validPct = Math.min(100, Math.max(0, pctVal));
    const validConducted = Math.max(1, conductedVal);
    const calculatedAttended = Math.round((validPct / 100) * validConducted);
    setConductedClasses(validConducted);
    setAttendedClasses(calculatedAttended);
  };

  // Subject weekly occurrences in timetable
  const subjectWeeklySlots = selectedSection.schedule.flatMap((day) =>
    day.slots
      .filter((s) => s.subjectCode === selectedSubject.code)
      .map((s) => ({ day: day.day, period: s.period, time: s.time, room: s.room }))
  );

  // Quick scenario test simulations (user can test "what-if" values)
  const loadTestScenario = (type: 'safe' | 'borderline' | 'detention' | 'honor') => {
    setErrorMsg(null);
    if (type === 'safe') {
      setConductedClasses(40);
      setAttendedClasses(34); // 85%
    } else if (type === 'borderline') {
      setConductedClasses(40);
      setAttendedClasses(30); // 75.0%
    } else if (type === 'detention') {
      setConductedClasses(45);
      setAttendedClasses(18); // 40% irreversible
    } else if (type === 'honor') {
      setConductedClasses(40);
      setAttendedClasses(38); // 95%
    }
  };

  const handleValidateAndCalculate = () => {
    if (!selectedSection) {
      setErrorMsg('Please select a class section.');
      return;
    }
    if (!selectedSubject) {
      setErrorMsg('Please select a subject.');
      return;
    }
    if (conductedClasses <= 0) {
      setErrorMsg('Please enter the number of conducted classes held so far.');
      return;
    }
    if (conductedClasses < 0 || attendedClasses < 0) {
      setErrorMsg('Class numbers cannot be negative.');
      return;
    }
    if (attendedClasses > conductedClasses) {
      setErrorMsg('Attended classes cannot exceed conducted classes.');
      return;
    }

    const todayDate = parseLocalDate(todayDateStr);
    const planningDate = parseLocalDate(planningDateStr);
    const semesterEnd = parseLocalDate(SEMESTER_CONFIG.endDate);

    if (planningDate < todayDate) {
      setErrorMsg('Planning date cannot be earlier than today.');
      return;
    }
    if (planningDate > semesterEnd) {
      setErrorMsg(`Planning date cannot exceed semester end (${SEMESTER_CONFIG.endDate}).`);
      return;
    }

    setErrorMsg(null);
    onCalculate();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-slate-800 gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Attendance Predictor Calculator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Authenticated for: <strong className="text-white">{currentStudent.name}</strong> ({currentStudent.email})
          </p>
        </div>

        {/* What-If Scenario Simulators */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 font-mono hidden lg:inline">What-If Scenarios:</span>
          <button
            type="button"
            onClick={() => loadTestScenario('safe')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800/60 transition-colors"
          >
            Safe (85%)
          </button>
          <button
            type="button"
            onClick={() => loadTestScenario('borderline')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-950/60 text-amber-300 hover:bg-amber-900/60 border border-amber-800/60 transition-colors"
          >
            Borderline (75%)
          </button>
          <button
            type="button"
            onClick={() => loadTestScenario('detention')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-rose-950/60 text-rose-300 hover:bg-rose-900/60 border border-rose-800/60 transition-colors"
          >
            Detention (40%)
          </button>
          <button
            type="button"
            onClick={() => loadTestScenario('honor')}
            className="px-2.5 py-1 text-xs font-medium rounded-md bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/60 border border-indigo-800/60 transition-colors"
          >
            Honor (95%)
          </button>
        </div>
      </div>

      {/* Notice if no saved attendance exists yet for this subject */}
      {!hasSavedDataForSubject && (
        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-indigo-900/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Info className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>No attendance recorded yet for this subject. Enter your counts below to save them to your account.</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Account: {currentStudent.email}</span>
        </div>
      )}

      {hasSavedDataForSubject && (
        <div className="mt-4 p-2.5 rounded-xl bg-slate-950 border border-emerald-900/50 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Loaded your saved attendance record for {selectedSubject.code}.</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Saved Record</span>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              1. Class Section ({sections.length} Available)
            </span>
            <span className="text-slate-400 font-normal">{selectedSection.department}</span>
          </label>
          <select
            value={selectedSection.id}
            onChange={(e) => onSelectSection(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white transition-colors"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name} · {sec.year} ({sec.semester}) · Venue: {sec.venue || 'Campus'}
              </option>
            ))}
          </select>
          <div className="mt-1.5 text-xs text-slate-400 flex items-center justify-between">
            <span>Working days: Mon – Fri</span>
            <span>Room: {selectedSection.venue || 'General'}</span>
          </div>
        </div>

        {/* Subject Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              2. Subject ({selectedSection.subjects.length} in this section)
            </span>
            {selectedSubject.slot && (
              <span className="text-slate-400 font-mono">Slot: {selectedSubject.slot}</span>
            )}
          </label>
          <select
            value={selectedSubject.code}
            onChange={(e) => onSelectSubject(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white transition-colors"
          >
            {selectedSection.subjects.map((sub) => (
              <option key={sub.code} value={sub.code}>
                {sub.code} — {sub.name} ({sub.weeklyClassesCount} periods/wk)
              </option>
            ))}
          </select>
          <div className="mt-1.5 text-xs text-slate-400 flex items-center justify-between">
            <span>Faculty: {selectedSubject.faculty || 'Department'}</span>
            <span>Credits: {selectedSubject.credits || '3'}</span>
          </div>
        </div>
      </div>

      {/* Timetable occurrences for the chosen subject */}
      <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 font-medium flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Weekly Timetable Schedule:
        </span>
        {subjectWeeklySlots.length > 0 ? (
          subjectWeeklySlots.map((slot, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-slate-300 font-mono"
            >
              {slot.day} P{slot.period} ({slot.time.split(' - ')[0]})
            </span>
          ))
        ) : (
          <span className="text-amber-400">Integrated lab or workshop block</span>
        )}
      </div>

      {/* Attendance Input Modes */}
      <div className="mt-6 pt-5 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-indigo-400" />
            3. Enter Your Attendance
          </span>

          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setInputMode('counts')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                inputMode === 'counts'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Conducted + Attended (Recommended)
            </button>
            <button
              type="button"
              onClick={() => setInputMode('percentage')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                inputMode === 'percentage'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct %
            </button>
          </div>
        </div>

        {inputMode === 'counts' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Conducted Classes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Total Classes Conducted (T)
              </label>
              <input
                type="number"
                min="0"
                max="200"
                value={conductedClasses === 0 ? '' : conductedClasses}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setConductedClasses(val);
                }}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-base font-mono font-semibold text-white tabular-nums"
                placeholder="e.g. 35"
              />
            </div>

            {/* Attended Classes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Classes Attended (A)
              </label>
              <input
                type="number"
                min="0"
                max={conductedClasses || 200}
                value={attendedClasses === 0 ? '' : attendedClasses}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setAttendedClasses(val);
                }}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-base font-mono font-semibold text-white tabular-nums"
                placeholder="e.g. 29"
              />
            </div>

            {/* Current Attendance Output */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-xs text-slate-400 block mb-0.5">Calculated Current Attendance</span>
              {conductedClasses > 0 ? (
                <>
                  <span
                    className={`text-2xl font-bold font-mono tabular-nums ${
                      parseFloat(livePercentage) >= 90
                        ? 'text-emerald-400'
                        : parseFloat(livePercentage) >= 75
                        ? 'text-indigo-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {livePercentage}%
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {attendedClasses} of {conductedClasses} attended
                  </span>
                </>
              ) : (
                <span className="text-sm font-medium text-slate-400 block py-1.5">
                  Enter classes above
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Direct percentage input */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Current Attendance Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={directPercentage}
                onChange={(e) => {
                  setDirectPercentage(e.target.value);
                  const num = parseFloat(e.target.value) || 0;
                  applyPercentageInput(num, estimatedConductedForPct);
                }}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-base font-mono font-semibold text-white tabular-nums"
                placeholder="e.g. 85"
              />
            </div>

            {/* Estimated conducted classes */}
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Conducted Classes Estimate (T)
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={estimatedConductedForPct}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setEstimatedConductedForPct(val);
                  applyPercentageInput(parseFloat(directPercentage) || 0, val);
                }}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-base font-mono font-semibold text-white tabular-nums"
                placeholder="e.g. 35"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400">
              <span className="text-indigo-400 font-semibold block mb-1">Calculation Rigor:</span>
              Accurate mathematical projection requires total conducted classes (T) to calculate (A + x) / (T + R).
            </div>
          </div>
        )}
      </div>

      {/* Date Planning Section */}
      <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Today's Date Detection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              4. Today's Date (Auto-Detected)
            </label>

            <button
              type="button"
              onClick={() => setShowDateOverride(!showDateOverride)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
            >
              {showDateOverride ? 'Use System Date' : 'Test Other Semester Date'}
            </button>
          </div>

          {!showDateOverride ? (
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-mono text-white font-medium">
                  {formatDisplayDate(todayDateStr)}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">System Live</span>
            </div>
          ) : (
            <div>
              <input
                type="date"
                min={SEMESTER_CONFIG.startDate}
                max={SEMESTER_CONFIG.endDate}
                value={todayDateStr}
                onChange={(e) => setTodayDateStr(e.target.value)}
                className="w-full bg-slate-950 border border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Simulating semester date: {SEMESTER_CONFIG.startDate} to {SEMESTER_CONFIG.endDate}
              </span>
            </div>
          )}
        </div>

        {/* Future Planning Date */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              5. Plan Attendance Until
            </span>
            <span className="text-slate-400 font-normal">Semester End: 29 Nov 2026</span>
          </label>

          <input
            type="date"
            min={todayDateStr}
            max={SEMESTER_CONFIG.endDate}
            value={planningDateStr}
            onChange={(e) => setPlanningDateStr(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
          />

          <div className="mt-1.5 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setPlanningDateStr(SEMESTER_CONFIG.endDate)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
            >
              Set Full Semester End (29 Nov 2026)
            </button>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-[11px]">
              Calculates timetable slots to this date
            </span>
          </div>
        </div>
      </div>

      {/* Error Message banner */}
      {errorMsg && (
        <div className="mt-5 p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-7 pt-5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Inputs</span>
        </button>

        <button
          type="button"
          onClick={handleValidateAndCalculate}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <span>Calculate & Save My Attendance</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
