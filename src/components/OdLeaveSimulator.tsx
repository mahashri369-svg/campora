import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  FileCheck,
  Stethoscope,
  Award,
  Info,
} from 'lucide-react';
import { Section, StudentProfile, SubjectInfo } from '../types';
import { calculateRemainingClassesInRange, getDayOfWeek } from '../utils/attendance';
import { SEMESTER_CONFIG } from '../data/timetableData';

interface OdLeaveSimulatorProps {
  section: Section;
  currentStudent: StudentProfile;
  todayDateStr: string;
  activeOdCredits: Record<string, number>;
  onUpdateOdCredits: (credits: Record<string, number>) => void;
  onApplyOdCreditsToStudent: (credits: Record<string, number>) => void;
  onClose?: () => void;
}

export const OdLeaveSimulator: React.FC<OdLeaveSimulatorProps> = ({
  section,
  currentStudent,
  todayDateStr,
  activeOdCredits,
  onUpdateOdCredits,
  onApplyOdCreditsToStudent,
  onClose,
}) => {
  // Leave type: OD vs Medical Leave
  const [leaveType, setLeaveType] = useState<'OD' | 'MEDICAL'>('OD');

  // Simulation mode: 'subject' | 'date'
  const [simulationMode, setSimulationMode] = useState<'subject' | 'date'>('subject');

  // Selected subject for subject-specific mode
  const [selectedSubjectCode, setSelectedSubjectCode] = useState<string>(
    section.subjects[0]?.code || ''
  );

  // Date selection for date-based mode
  const [eventDateStr, setEventDateStr] = useState<string>(todayDateStr);

  // Local working copy of OD credits
  const [workingOdCredits, setWorkingOdCredits] = useState<Record<string, number>>(
    () => ({ ...activeOdCredits })
  );

  const selectedSubject =
    section.subjects.find((s) => s.code === selectedSubjectCode) || section.subjects[0];

  // Helper to adjust credit for a subject
  const handleAdjustCredit = (subjectCode: string, delta: number) => {
    const current = workingOdCredits[subjectCode] || 0;
    const nextVal = Math.max(0, current + delta);
    const updated = {
      ...workingOdCredits,
      [subjectCode]: nextVal,
    };
    if (nextVal === 0) {
      delete updated[subjectCode];
    }
    setWorkingOdCredits(updated);
    onUpdateOdCredits(updated);
  };

  const handleSetExactCredit = (subjectCode: string, amount: number) => {
    const updated = {
      ...workingOdCredits,
      [subjectCode]: Math.max(0, amount),
    };
    if (amount <= 0) {
      delete updated[subjectCode];
    }
    setWorkingOdCredits(updated);
    onUpdateOdCredits(updated);
  };

  // Date-based detection of scheduled classes on the chosen event date
  const selectedDayName = getDayOfWeek(eventDateStr);
  const daySchedule = section.schedule.find((s) => s.day === selectedDayName);
  const scheduledPeriodsOnDate = daySchedule ? daySchedule.slots : [];

  // Count classes per subject on chosen date
  const subjectClassCountsOnDate: Record<string, number> = {};
  scheduledPeriodsOnDate.forEach((slot) => {
    if (slot.subjectCode) {
      subjectClassCountsOnDate[slot.subjectCode] =
        (subjectClassCountsOnDate[slot.subjectCode] || 0) + 1;
    }
  });

  const handleApplyFullDayOd = () => {
    const updated = { ...workingOdCredits };
    Object.entries(subjectClassCountsOnDate).forEach(([code, count]) => {
      updated[code] = (updated[code] || 0) + count;
    });
    setWorkingOdCredits(updated);
    onUpdateOdCredits(updated);
  };

  const handleResetCredits = () => {
    setWorkingOdCredits({});
    onUpdateOdCredits({});
  };

  // Compute metrics for the selected subject
  const currentRecord = currentStudent.subjectAttendance?.[selectedSubject.code];
  const conducted = currentRecord ? currentRecord.conducted : 0;
  const attended = currentRecord ? currentRecord.attended : 0;
  const basePercentage =
    conducted > 0 ? Number(((attended / conducted) * 100).toFixed(1)) : 0;

  const currentOd = workingOdCredits[selectedSubject.code] || 0;
  const simulatedAttended = Math.min(conducted, attended + currentOd);
  const simulatedPercentage =
    conducted > 0 ? Number(((simulatedAttended / conducted) * 100).toFixed(1)) : 0;
  const percentageGain = Number((simulatedPercentage - basePercentage).toFixed(1));

  // Remaining semester classes
  const remainingScheduled = calculateRemainingClassesInRange(
    section,
    selectedSubject.code,
    todayDateStr,
    SEMESTER_CONFIG.endDate
  ).length;

  // Formula for remaining classes needed for 75%:
  // (A + x) / (T + R) >= 0.75  =>  x >= 0.75*(T+R) - A
  const calcNeededFor75 = (att: number) => {
    const futureTotal = conducted + remainingScheduled;
    const required = Math.ceil(0.75 * futureTotal - att);
    return Math.max(0, required);
  };

  const neededBefore = calcNeededFor75(attended);
  const neededAfter = calcNeededFor75(simulatedAttended);

  // Multi-subject impact statistics
  let totalSavedFromDetention = 0;
  let totalReached90 = 0;

  const comparisonRows = section.subjects.map((sub) => {
    const rec = currentStudent.subjectAttendance?.[sub.code];
    const cond = rec ? rec.conducted : 0;
    const att = rec ? rec.attended : 0;
    const od = workingOdCredits[sub.code] || 0;

    const basePct = cond > 0 ? Number(((att / cond) * 100).toFixed(1)) : 0;
    const simAtt = Math.min(cond, att + od);
    const simPct = cond > 0 ? Number(((simAtt / cond) * 100).toFixed(1)) : 0;
    const gain = Number((simPct - basePct).toFixed(1));

    const wasDetained = cond > 0 && basePct < 75;
    const isNowSafe = cond > 0 && simPct >= 75;
    const saved = wasDetained && isNowSafe;

    const wasUnder90 = cond > 0 && basePct < 90;
    const isNow90 = cond > 0 && simPct >= 90;
    const hit90 = wasUnder90 && isNow90;

    if (saved) totalSavedFromDetention++;
    if (hit90) totalReached90++;

    return {
      sub,
      cond,
      att,
      od,
      basePct,
      simAtt,
      simPct,
      gain,
      saved,
      hit90,
      isEntered: cond > 0,
    };
  });

  const totalOdClaimed = Object.values(workingOdCredits).reduce(
    (acc, val) => acc + val,
    0
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-900/40 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Sparkles className="w-5 h-5 text-indigo-300" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  On-Duty (OD) & Medical Leave Simulator
                  {totalOdClaimed > 0 && (
                    <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      +{totalOdClaimed} Hours Claimed
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate official OD exemptions or Medical Condonation to test their impact on attendance and exam eligibility
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {totalOdClaimed > 0 && (
              <>
                <button
                  onClick={() => onApplyOdCreditsToStudent(workingOdCredits)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply OD to My Attendance</span>
                </button>
                <button
                  onClick={handleResetCredits}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Simulation</span>
                </button>
              </>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl bg-slate-800/80 border border-slate-700"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Leave Category Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <button
            onClick={() => setLeaveType('OD')}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
              leaveType === 'OD'
                ? 'bg-indigo-950/70 border-indigo-500/80 shadow-md shadow-indigo-500/10'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                <FileCheck className="w-4 h-4 text-indigo-400" />
                Official On-Duty (OD) Leave
              </span>
              {leaveType === 'OD' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Approved participation in hackathons, university sports, paper presentations, conferences, NSS, or cultural fests.
            </p>
          </button>

          <button
            onClick={() => setLeaveType('MEDICAL')}
            className={`p-4 rounded-xl text-left border transition-all cursor-pointer ${
              leaveType === 'MEDICAL'
                ? 'bg-emerald-950/70 border-emerald-500/80 shadow-md shadow-emerald-500/10'
                : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-sm font-bold text-white">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                Medical Leave / Condonation
              </span>
              {leaveType === 'MEDICAL' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              SRM Academic Condonation: Students between 65% and 74.9% may apply for medical condonation with valid hospitalization records.
            </p>
          </button>
        </div>

        {/* Regulatory Alert Banner */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">SRM IST Condonation & OD Rule: </span>
            {leaveType === 'OD'
              ? 'Approved OD hours count directly as attended classes, offsetting periods missed for authorized institutional events.'
              : 'Medical Condonation is permitted exclusively between 65% and 74.9% attendance. If raw attendance falls below 65%, detention is mathematically final under standard regulation.'}
          </div>
        </div>
      </div>

      {/* Simulator Modes Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setSimulationMode('subject')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            simulationMode === 'subject'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Subject-by-Subject Simulation</span>
        </button>

        <button
          onClick={() => setSimulationMode('date')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            simulationMode === 'date'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Event / Date-based Timetable OD</span>
        </button>
      </div>

      {/* Mode A: Subject Specific Simulation */}
      {simulationMode === 'subject' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls (5 cols) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                1. Select Subject to Simulate
              </label>
              <select
                value={selectedSubjectCode}
                onChange={(e) => setSelectedSubjectCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-indigo-500"
              >
                {section.subjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                2. Adjust Simulated {leaveType === 'OD' ? 'OD' : 'Medical'} Credits
              </label>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Claimed Credit Hours:</span>
                  <div className="text-2xl font-black font-mono text-indigo-400">
                    +{currentOd} Classes
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdjustCredit(selectedSubject.code, -1)}
                    disabled={currentOd <= 0}
                    className="w-9 h-9 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAdjustCredit(selectedSubject.code, 1)}
                    className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[1, 2, 3, 5, 8].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => handleSetExactCredit(selectedSubject.code, amt)}
                    className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-colors ${
                      currentOd === amt
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    +{amt} {amt === 1 ? 'Class' : 'Classes'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Conducted Classes:</span>
                <span className="text-white font-bold">{conducted}</span>
              </div>
              <div className="flex justify-between">
                <span>Actual Attended:</span>
                <span className="text-white font-bold">{attended}</span>
              </div>
              <div className="flex justify-between">
                <span>Simulated Attended:</span>
                <span className="text-indigo-400 font-bold">{simulatedAttended}</span>
              </div>
            </div>
          </div>

          {/* Real-time Before vs After Impact Card (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Simulation Impact Analysis
                </span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  {selectedSubject.code}
                </span>
              </div>

              <h3 className="text-lg font-bold text-white mb-1">{selectedSubject.name}</h3>

              {conducted === 0 ? (
                <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs my-4">
                  No attendance entered for this subject yet. Go to the Predictor tab to enter conducted & attended classes first.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 my-6">
                  {/* Before Box */}
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Current (Actual)
                    </span>
                    <div className="text-3xl font-black font-mono text-slate-200">
                      {basePercentage}%
                    </div>
                    <div className="text-xs font-mono text-slate-400">
                      {attended} / {conducted} classes
                    </div>
                    <div>
                      {basePercentage >= 90 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Honors Secured
                        </span>
                      ) : basePercentage >= 75 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400">
                          <ShieldCheck className="w-3 h-3" /> Safe (≥75%)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                          <ShieldAlert className="w-3 h-3" /> Detention Danger
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                      Needs <strong>{neededBefore}</strong> more classes for 75%
                    </div>
                  </div>

                  {/* After Box */}
                  <div
                    className={`p-4 rounded-xl border space-y-2 relative overflow-hidden ${
                      simulatedPercentage >= 90
                        ? 'bg-emerald-950/30 border-emerald-500/50'
                        : simulatedPercentage >= 75
                        ? 'bg-indigo-950/40 border-indigo-500/50'
                        : 'bg-rose-950/30 border-rose-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-indigo-300 uppercase tracking-wider">
                        With {currentOd} {leaveType} Credits
                      </span>
                      {percentageGain > 0 && (
                        <span className="text-xs font-black font-mono text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          +{percentageGain}%
                        </span>
                      )}
                    </div>
                    <div
                      className={`text-3xl font-black font-mono ${
                        simulatedPercentage >= 90
                          ? 'text-emerald-400'
                          : simulatedPercentage >= 75
                          ? 'text-indigo-300'
                          : 'text-rose-400'
                      }`}
                    >
                      {simulatedPercentage}%
                    </div>
                    <div className="text-xs font-mono text-slate-300">
                      {simulatedAttended} / {conducted} classes
                    </div>
                    <div>
                      {simulatedPercentage >= 90 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <Award className="w-3 h-3" /> Reached 90% Target!
                        </span>
                      ) : simulatedPercentage >= 75 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {basePercentage < 75 ? 'Saved from Detention!' : 'Safe (≥75%)'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                          <AlertTriangle className="w-3 h-3" /> Still Below 75%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 pt-2 border-t border-slate-800/80">
                      Needs <strong>{neededAfter}</strong> classes for 75%{' '}
                      {neededBefore > neededAfter && (
                        <span className="text-emerald-400 font-bold">
                          (-{neededBefore - neededAfter} fewer needed!)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Condonation Eligibility Note */}
            {leaveType === 'MEDICAL' && (
              <div className="p-3 rounded-xl bg-slate-950 border border-emerald-900/40 text-xs text-slate-300">
                <span className="font-bold text-emerald-400">Medical Condonation Check: </span>
                {basePercentage >= 65 && basePercentage < 75 ? (
                  <span className="text-emerald-300">
                    Your base attendance ({basePercentage}%) falls within the 65%–74.9% condonation bracket. You are eligible to submit medical documentation to the HoD.
                  </span>
                ) : basePercentage < 65 && conducted > 0 ? (
                  <span className="text-rose-400">
                    Your base attendance ({basePercentage}%) is strictly below 65%. Standard medical condonation cannot ordinarily be approved without exceptional Vice Chancellor exemption.
                  </span>
                ) : (
                  <span className="text-slate-400">
                    Your attendance is already safe (≥75%), so condonation is not required.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode B: Date-based Event OD Simulation */}
      {simulationMode === 'date' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Select Event Date to Calculate Scheduled Classes
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                The engine inspects {section.name} timetable for that day and automatically maps all scheduled periods
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={eventDateStr}
                min={SEMESTER_CONFIG.startDate}
                max={SEMESTER_CONFIG.endDate}
                onChange={(e) => setEventDateStr(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleApplyFullDayOd}
                disabled={scheduledPeriodsOnDate.length === 0}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Simulate Full Day OD (+{scheduledPeriodsOnDate.length} Periods)</span>
              </button>
            </div>
          </div>

          {/* Scheduled classes list on selected date */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Timetable for {selectedDayName} ({eventDateStr}): {scheduledPeriodsOnDate.length} Periods Scheduled
            </div>

            {scheduledPeriodsOnDate.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950 border border-slate-800 text-slate-500 text-xs">
                No classes scheduled on this day ({selectedDayName} is a non-working day or weekend).
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {scheduledPeriodsOnDate.map((slot, idx) => (
                  <div
                    key={`${slot.period}-${idx}`}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{slot.subjectName}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        Period {slot.period} · {slot.time}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      +1 OD
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multi-Subject Comparison Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Full Semester Simulated Attendance Matrix
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live impact of claimed OD & Medical hours across every subject in {section.name}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            {totalSavedFromDetention > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                🎉 {totalSavedFromDetention} Saved from Detention!
              </span>
            )}
            {totalReached90 > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40">
                ⭐ {totalReached90} Reached 90%!
              </span>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Actual Classes</th>
                <th className="py-3 px-3">Actual %</th>
                <th className="py-3 px-3 text-center">OD Hours</th>
                <th className="py-3 px-3">Simulated %</th>
                <th className="py-3 px-3">Net Gain</th>
                <th className="py-3 px-3">Simulated Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {comparisonRows.map((row) => (
                <tr
                  key={row.sub.code}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    row.saved ? 'bg-emerald-950/20' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-sans">
                    <div className="font-semibold text-white">{row.sub.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{row.sub.code}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    {row.isEntered ? `${row.att} / ${row.cond}` : '—'}
                  </td>
                  <td className="py-3 px-3">
                    {row.isEntered ? (
                      <span
                        className={`font-bold ${
                          row.basePct >= 90
                            ? 'text-emerald-400'
                            : row.basePct >= 75
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {row.basePct}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        row.od > 0
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : 'text-slate-500'
                      }`}
                    >
                      +{row.od}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    {row.isEntered ? (
                      <span
                        className={`font-black text-sm ${
                          row.simPct >= 90
                            ? 'text-emerald-400'
                            : row.simPct >= 75
                            ? 'text-indigo-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {row.simPct}%
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-3">
                    {row.gain > 0 ? (
                      <span className="text-emerald-400 font-bold">+{row.gain}%</span>
                    ) : (
                      <span className="text-slate-500">0.0%</span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-sans">
                    {row.isEntered ? (
                      row.saved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                          🎉 Saved from Detention
                        </span>
                      ) : row.hit90 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/30">
                          ⭐ Reached 90%
                        </span>
                      ) : row.simPct >= 90 ? (
                        <span className="text-emerald-400 font-medium text-[11px]">
                          🟢 Honors (≥90%)
                        </span>
                      ) : row.simPct >= 75 ? (
                        <span className="text-amber-400 font-medium text-[11px]">
                          🟡 Safe (≥75%)
                        </span>
                      ) : (
                        <span className="text-rose-400 font-bold text-[11px]">
                          🔴 Detained (&lt;75%)
                        </span>
                      )
                    ) : (
                      <span className="text-slate-500 text-[11px]">Not entered</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleAdjustCredit(row.sub.code, -1)}
                        disabled={row.od <= 0}
                        className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustCredit(row.sub.code, 1)}
                        className="w-6 h-6 rounded bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center text-white"
                      >
                        +
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
