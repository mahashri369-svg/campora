import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Info,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import { CalculationResult } from '../types';
import { formatDisplayDate } from '../utils/attendance';

interface ResultDashboardProps {
  result: CalculationResult;
  onJumpToTimetable: () => void;
  onJumpToMatrix: () => void;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  result,
  onJumpToTimetable,
  onJumpToMatrix,
}) => {
  const {
    section,
    subject,
    conducted,
    attended,
    currentPercentage,
    remainingClassesToPlanningDate,
    remainingClassesTotalSemester,
    safeTarget,
    goalTarget,
    maxPossiblePercentage,
    status,
    statusLabel,
    statusDescription,
    statusTone,
    planSteps,
    upcomingOccurrences,
    effectiveTodayStr,
    planningDateStr,
  } = result;

  const isDetained = status === 'IRREVERSIBLE_DETENTION';
  const isRecoverableWarning = status === 'RECOVERABLE_WARNING' || status === 'BORDERLINE_75';

  return (
    <div className="space-y-6">
      {/* 1. HIGH-PRIORITY IRREVERSIBLE DETENTION ALERT */}
      {isDetained && (
        <div className="p-6 sm:p-8 rounded-2xl bg-rose-950/80 border-2 border-rose-500 shadow-2xl shadow-rose-950/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-700/50">
              <ShieldAlert className="w-8 h-8 animate-bounce" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black text-rose-200 tracking-tight">
                  🚨 IRREVERSIBLE DETENTION
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded bg-rose-900 border border-rose-600 text-rose-200 font-mono">
                  Critical Deficit
                </span>
              </div>

              <p className="mt-2 text-sm sm:text-base font-medium text-rose-100 leading-relaxed">
                “Even if you attend every remaining class, your attendance cannot reach 75% before the semester ends.”
              </p>

              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-rose-800/80 text-xs font-mono">
                <div>
                  <span className="text-rose-300/80 block">Current Attendance:</span>
                  <span className="text-base font-bold text-rose-200 tabular-nums">{currentPercentage}%</span>
                </div>
                <div>
                  <span className="text-rose-300/80 block">Remaining Classes (R):</span>
                  <span className="text-base font-bold text-rose-200 tabular-nums">{remainingClassesTotalSemester}</span>
                </div>
                <div>
                  <span className="text-rose-300/80 block">Max Possible Final:</span>
                  <span className="text-base font-bold text-rose-200 tabular-nums">{maxPossiblePercentage}%</span>
                </div>
                <div>
                  <span className="text-rose-300/80 block">Required Target:</span>
                  <span className="text-base font-bold text-white tabular-nums">75.0%</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg bg-rose-900/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-rose-300" />
                <span>
                  Immediate action required: Consult your department head (<span className="font-semibold">{subject.faculty || 'Course Faculty'}</span>) or Academic Advisor regarding medical leave condonation, make-up classes, or formal faculty dispensation.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SAFE / WARNING HERO BANNER */}
      {!isDetained && (
        <div
          className={`p-6 rounded-2xl border ${
            statusTone === 'success'
              ? 'bg-emerald-950/50 border-emerald-500/50 shadow-emerald-950/40'
              : 'bg-amber-950/50 border-amber-500/50 shadow-amber-950/40'
          } shadow-lg`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  statusTone === 'success'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-amber-600 text-white shadow-amber-600/30'
                } shadow-md`}
              >
                {statusTone === 'success' ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-white tracking-tight">
                    {statusLabel}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700 text-slate-300 font-mono">
                    {section.name} · {subject.code}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-200 leading-normal">
                  {statusDescription}
                </p>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6 shrink-0">
              <span className="text-xs text-slate-400 block font-mono">Safety Buffer</span>
              <span className="text-xl font-bold font-mono text-white tabular-nums">
                {safeTarget.requiredClasses === 0
                  ? 'Immune (0 Needed)'
                  : `${safeTarget.requiredClasses} of ${remainingClassesTotalSemester} Left`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE KPI STAT CARDS (5 Prominent Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Card 1: Current Attendance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 font-medium block">Current Attendance</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                currentPercentage >= 90
                  ? 'text-emerald-400'
                  : currentPercentage >= 75
                  ? 'text-indigo-400'
                  : 'text-rose-400'
              }`}
            >
              {currentPercentage}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono">
            {attended} attended / {conducted} held
          </span>
        </div>

        {/* Card 2: Remaining Scheduled Classes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md">
          <span className="text-xs text-slate-400 font-medium block">Remaining Classes</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tabular-nums">
              {remainingClassesTotalSemester}
            </span>
            <span className="text-xs text-slate-400 font-mono">classes</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono">
            {remainingClassesToPlanningDate} until selected plan date
          </span>
        </div>

        {/* Card 3: Classes Needed for 75% */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-md ${
            !safeTarget.isPossible
              ? 'bg-rose-950/40 border-rose-800/80'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Needed for 75%</span>
            <span className="text-[10px] text-slate-400 font-mono">Stay Safe</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            {safeTarget.isPossible ? (
              <>
                <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-400 tabular-nums">
                  {safeTarget.requiredClasses}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {remainingClassesTotalSemester}
                </span>
              </>
            ) : (
              <span className="text-lg sm:text-xl font-bold font-mono text-rose-400">
                Impossible
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            Minimum to avoid detention
          </span>
        </div>

        {/* Card 4: Classes Needed for 90% */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-md ${
            !goalTarget.isPossible
              ? 'bg-slate-900/50 border-slate-800 text-slate-400'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300 font-medium">Needed for 90%</span>
            <span className="text-[10px] text-slate-400 font-mono">Honor Goal</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            {goalTarget.isPossible ? (
              <>
                <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tabular-nums">
                  {goalTarget.requiredClasses}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  / {remainingClassesTotalSemester}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-amber-400">
                Unreachable
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">
            {goalTarget.isPossible
              ? goalTarget.requiredClasses === 0
                ? 'Target already reached'
                : 'Classes for distinction'
              : 'Max possible is below 90%'}
          </span>
        </div>

        {/* Card 5: Maximum Possible Attendance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-md col-span-2 md:col-span-1">
          <span className="text-xs text-slate-400 font-medium block">Max Possible Final</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tabular-nums ${
                maxPossiblePercentage >= 75 ? 'text-white' : 'text-rose-400'
              }`}
            >
              {maxPossiblePercentage}%
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1 font-mono">
            If attending all {remainingClassesTotalSemester} classes
          </span>
        </div>
      </div>

      {/* 4. VISUAL ATTENDANCE PROGRESS BAR WITH CRITICAL THRESHOLDS */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Attendance Progress & Danger Thresholds</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live position relative to the 75% detention boundary and 90% honor mark.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
              <span className="text-slate-400">75% Danger</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
              <span className="text-slate-400">90% Goal</span>
            </div>
          </div>
        </div>

        {/* The Graphic Bar */}
        <div className="mt-6 relative">
          {/* Background track */}
          <div className="h-6 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 relative flex">
            {/* Danger Zone (0 to 75%) */}
            <div
              className="h-full bg-rose-950/40 border-r border-dashed border-rose-500/80 relative"
              style={{ width: '75%' }}
            />
            {/* Safe Buffer Zone (75% to 90%) */}
            <div
              className="h-full bg-indigo-950/40 border-r border-dashed border-emerald-500/80 relative"
              style={{ width: '15%' }}
            />
            {/* Elite Zone (90% to 100%) */}
            <div className="h-full bg-emerald-950/40 flex-1 relative" />

            {/* Current Fill Bar */}
            <div
              className={`absolute top-0 bottom-0 left-0 transition-all duration-700 rounded-lg ${
                currentPercentage >= 90
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-500'
                  : currentPercentage >= 75
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500'
                  : 'bg-gradient-to-r from-rose-600 to-rose-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, currentPercentage))}%` }}
            />

            {/* Max Possible Range Ghost Overlay */}
            {maxPossiblePercentage > currentPercentage && (
              <div
                className="absolute top-0 bottom-0 border-r-2 border-indigo-400 bg-indigo-400/15 pointer-events-none transition-all duration-700"
                style={{
                  left: `${Math.min(100, currentPercentage)}%`,
                  width: `${Math.min(100 - currentPercentage, maxPossiblePercentage - currentPercentage)}%`,
                }}
              />
            )}
          </div>

          {/* Marker Labels Below Bar */}
          <div className="relative mt-2 h-6 text-[11px] font-mono">
            {/* 0% marker */}
            <span className="absolute left-0 text-slate-500">0%</span>

            {/* 75% Safe Limit Marker */}
            <div
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: '75%' }}
            >
              <div className="w-0.5 h-1.5 bg-rose-500" />
              <span className="text-rose-400 font-bold">75% Limit</span>
            </div>

            {/* 90% Goal Marker */}
            <div
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left: '90%' }}
            >
              <div className="w-0.5 h-1.5 bg-emerald-500" />
              <span className="text-emerald-400 font-bold">90% Goal</span>
            </div>

            {/* 100% marker */}
            <span className="absolute right-0 text-slate-500">100%</span>
          </div>

          {/* Numeric readout summary */}
          <div className="mt-2 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
            <div>
              <span>Current Status: </span>
              <strong className="font-mono text-white">{currentPercentage}%</strong>
              <span className="text-slate-500 ml-1">
                ({currentPercentage >= 75 ? `+${(currentPercentage - 75).toFixed(1)}% safe margin` : `${(75 - currentPercentage).toFixed(1)}% below limit`})
              </span>
            </div>

            <div>
              <span>Maximum Attainable: </span>
              <strong className="font-mono text-indigo-300">{maxPossiblePercentage}%</strong>
              <span className="text-slate-500 ml-1">
                (Ceiling with 100% future attendance)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. ATTENDANCE PLAN TIMELINE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>Personalized Attendance Plan</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Sequential milestones calculated from the official {section.name} timetable schedule.
            </p>
          </div>

          <span className="text-xs text-slate-400 font-mono">
            Planning Horizon: {formatDisplayDate(effectiveTodayStr)} → {formatDisplayDate(planningDateStr)}
          </span>
        </div>

        {/* Milestone Steps */}
        <div className="mt-5 space-y-4">
          {planSteps.map((step, idx) => (
            <div
              key={idx}
              className="flex items-start gap-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center text-xs font-bold font-mono text-indigo-400 shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white">
                    {step.title}
                  </h4>
                  {step.badge && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                      {step.badge}
                    </span>
                  )}
                </div>

                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {step.description}
                </p>

                <div className="mt-2.5 flex items-center gap-3 text-xs font-mono text-slate-400">
                  <span>
                    Cumulative: <strong className="text-slate-200">{step.classesAttendedCumulative}</strong> / {step.totalConductedCumulative} classes
                  </span>
                  <span>·</span>
                  <span>
                    Attendance:{' '}
                    <strong
                      className={`tabular-nums ${
                        step.projectedPercentage >= 90
                          ? 'text-emerald-400'
                          : step.projectedPercentage >= 75
                          ? 'text-indigo-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {step.projectedPercentage}%
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. UPCOMING SCHEDULED OCCURRENCES FROM TIMETABLE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-indigo-400" />
              <span>Upcoming Scheduled Classes ({subject.code})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Actual calendar schedule computed using {section.name} timetable.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onJumpToTimetable}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 underline"
            >
              View Full Week Timetable →
            </button>
          </div>
        </div>

        {upcomingOccurrences.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {upcomingOccurrences.slice(0, 9).map((occ, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white block">
                    {formatDisplayDate(occ.date)}
                  </span>
                  <span className="text-slate-400 font-mono mt-0.5 block">
                    {occ.dayName} · Period {occ.period} ({occ.time})
                  </span>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                  {occ.room || 'IST'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 p-4 text-center rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400">
            No further classes scheduled within the chosen window.
          </div>
        )}

        {upcomingOccurrences.length > 9 && (
          <div className="mt-3 text-center text-xs text-slate-400 font-mono">
            + {upcomingOccurrences.length - 9} more classes scheduled through the planning horizon
          </div>
        )}
      </div>

      {/* Quick Jump Action Bar */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <span>Need to inspect all other subjects in {section.name}?</span>
        <button
          onClick={onJumpToMatrix}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition-colors"
        >
          <span>Open Multi-Subject Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
