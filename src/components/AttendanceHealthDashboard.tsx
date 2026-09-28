import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  Activity,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Award,
  Layers,
  BookOpen,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Section, StudentProfile } from '../types';
import { calculateRemainingClassesInRange } from '../utils/attendance';
import { SEMESTER_CONFIG } from '../data/timetableData';

interface AttendanceHealthDashboardProps {
  section: Section;
  currentStudent: StudentProfile;
  todayDateStr: string;
  onSelectSubjectForDetail?: (subjectCode: string) => void;
  onOpenOdSimulator?: () => void;
  activeOdCredits?: Record<string, number>;
}

export const AttendanceHealthDashboard: React.FC<AttendanceHealthDashboardProps> = ({
  section,
  currentStudent,
  todayDateStr,
  onSelectSubjectForDetail,
  onOpenOdSimulator,
  activeOdCredits = {},
}) => {
  // Aggregate real subject attendance from current logged in student
  const subjectStats = section.subjects.map((sub) => {
    const record = currentStudent.subjectAttendance?.[sub.code];
    const conducted = record ? record.conducted : 0;
    const baseAttended = record ? record.attended : 0;
    const odBonus = activeOdCredits[sub.code] || 0;
    const attended = Math.min(conducted, baseAttended + odBonus);

    const percentage =
      conducted > 0 ? Number(((attended / conducted) * 100).toFixed(1)) : 0;

    const remainingClasses = calculateRemainingClassesInRange(
      section,
      sub.code,
      todayDateStr,
      SEMESTER_CONFIG.endDate
    ).length;

    let healthStatus: 'above90' | 'between75_90' | 'below75' | 'not_started' =
      'not_started';
    if (conducted > 0) {
      if (percentage >= 90) healthStatus = 'above90';
      else if (percentage >= 75) healthStatus = 'between75_90';
      else healthStatus = 'below75';
    }

    return {
      code: sub.code,
      name: sub.name,
      shortName: sub.name.length > 14 ? `${sub.name.slice(0, 12)}…` : sub.name,
      conducted,
      attended,
      odBonus,
      percentage,
      remainingClasses,
      healthStatus,
      isEntered: conducted > 0,
    };
  });

  const enteredSubjects = subjectStats.filter((s) => s.isEntered);
  const totalConducted = enteredSubjects.reduce((acc, s) => acc + s.conducted, 0);
  const totalAttended = enteredSubjects.reduce((acc, s) => acc + s.attended, 0);
  const totalRemaining = subjectStats.reduce((acc, s) => acc + s.remainingClasses, 0);

  const overallPercentage =
    totalConducted > 0
      ? Number(((totalAttended / totalConducted) * 100).toFixed(1))
      : 0;

  const above90Count = enteredSubjects.filter((s) => s.healthStatus === 'above90').length;
  const between75And90Count = enteredSubjects.filter(
    (s) => s.healthStatus === 'between75_90'
  ).length;
  const below75Count = enteredSubjects.filter((s) => s.healthStatus === 'below75').length;

  // Donut chart data
  const pieData = [
    {
      name: 'Above 90% (Honors)',
      value: above90Count,
      color: '#10b981', // Emerald
      label: '🟢 Above 90%',
    },
    {
      name: '75%–90% (Safe Zone)',
      value: between75And90Count,
      color: '#f59e0b', // Amber
      label: '🟡 75%–90%',
    },
    {
      name: 'Below 75% (Detention Risk)',
      value: below75Count,
      color: '#ef4444', // Red
      label: '🔴 Below 75%',
    },
  ].filter((d) => d.value > 0);

  // Bar chart data
  const barChartData = subjectStats.map((s) => ({
    name: s.shortName,
    fullName: s.name,
    code: s.code,
    percentage: s.isEntered ? s.percentage : 0,
    attended: s.attended,
    conducted: s.conducted,
    remaining: s.remainingClasses,
    isEntered: s.isEntered,
    color:
      !s.isEntered
        ? '#475569'
        : s.percentage >= 90
        ? '#10b981'
        : s.percentage >= 75
        ? '#f59e0b'
        : '#ef4444',
  }));

  // Overall status classification
  const isSafe = overallPercentage >= 75;
  const isHonors = overallPercentage >= 90;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header section with status overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Activity className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  Attendance Health Dashboard
                  {Object.keys(activeOdCredits).length > 0 && (
                    <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                      OD Simulation Active
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual performance analytics, safe thresholds, and distribution for{' '}
                  <strong className="text-slate-200">{currentStudent.name}</strong> ({section.name})
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onOpenOdSimulator && (
              <button
                onClick={onOpenOdSimulator}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-200" />
                <span>Simulate OD / Medical Leave</span>
              </button>
            )}
          </div>
        </div>

        {/* 8 Health Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mt-6">
          {/* Card 1: Overall Percentage */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-2">
            <span className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              Overall Attendance
              {isHonors ? (
                <Award className="w-3.5 h-3.5 text-emerald-400" />
              ) : isSafe ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              )}
            </span>
            <div className="my-1.5 flex items-baseline gap-2">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  totalConducted === 0
                    ? 'text-slate-500'
                    : isHonors
                    ? 'text-emerald-400'
                    : isSafe
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {totalConducted > 0 ? `${overallPercentage}%` : 'N/A'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {isHonors
                  ? '🌟 Honors'
                  : isSafe
                  ? '✓ Safe (≥75%)'
                  : '⚠️ Detention Risk'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">
              {totalAttended} / {totalConducted} classes attended
            </span>
          </div>

          {/* Card 2: Number of Subjects */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Subjects</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-white my-1">
              {section.subjects.length}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {enteredSubjects.length} with data
            </span>
          </div>

          {/* Card 3: Subjects Above 90% */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/40 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              &gt; 90%
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 my-1">
              {above90Count}
            </span>
            <span className="text-[10px] text-emerald-500/80 font-mono">Honor safe</span>
          </div>

          {/* Card 4: Subjects 75% - 90% */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-900/40 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              75%–90%
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 my-1">
              {between75And90Count}
            </span>
            <span className="text-[10px] text-amber-500/80 font-mono">Eligible</span>
          </div>

          {/* Card 5: Subjects Below 75% */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-900/40 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-rose-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              &lt; 75%
            </span>
            <span className="text-xl sm:text-2xl font-black font-mono text-rose-400 my-1">
              {below75Count}
            </span>
            <span className="text-[10px] text-rose-400/80 font-mono">
              {below75Count > 0 ? 'Detention Alert' : 'None at risk'}
            </span>
          </div>

          {/* Card 6: Total Conducted */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Conducted</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-slate-200 my-1">
              {totalConducted}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">To date</span>
          </div>

          {/* Card 7: Total Attended */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Attended</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-indigo-400 my-1">
              {totalAttended}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Classes</span>
          </div>

          {/* Card 8: Total Remaining Classes */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-slate-400">Remaining</span>
            <span className="text-xl sm:text-2xl font-black font-mono text-purple-400 my-1">
              {totalRemaining}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Scheduled</span>
          </div>
        </div>

        {/* Visual Progress Indicator (Section C) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Overall Semester Attendance Progress
            </span>
            <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                75% Detention Limit
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                90% Target Cushion
              </span>
            </div>
          </div>

          {/* Multi-tier Visual Progress Bar */}
          <div className="relative w-full h-5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden shadow-inner">
            {/* 75% Reference Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 shadow-[0_0_8px_#ef4444]"
              style={{ left: '75%' }}
            />
            {/* 90% Reference Marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 z-20 shadow-[0_0_8px_#10b981]"
              style={{ left: '90%' }}
            />

            {/* Filled Progress Bar */}
            <div
              className={`h-full transition-all duration-700 ease-out rounded-full ${
                overallPercentage >= 90
                  ? 'bg-gradient-to-r from-indigo-500 via-emerald-500 to-emerald-400 shadow-md shadow-emerald-500/30'
                  : overallPercentage >= 75
                  ? 'bg-gradient-to-r from-indigo-500 to-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-gradient-to-r from-rose-700 to-rose-500 shadow-md shadow-rose-500/30'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, overallPercentage))}%` }}
            />
          </div>

          {/* Milestone markers and current position labels */}
          <div className="relative w-full mt-2 text-[10px] font-mono text-slate-400 h-6">
            <span className="absolute left-0">0%</span>
            <span
              className="absolute -translate-x-1/2 text-rose-400 font-semibold"
              style={{ left: '75%' }}
            >
              ▲ 75% Safe Threshold
            </span>
            <span
              className="absolute -translate-x-1/2 text-emerald-400 font-semibold"
              style={{ left: '90%' }}
            >
              ▲ 90% Target
            </span>
            <span className="absolute right-0">100%</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Subject Bar Chart & Distribution Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart A: Subject-wise Attendance Bar Chart (2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Subject-wise Attendance Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact attendance percentage per course with 75% & 90% reference thresholds
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-rose-500" />
                75% Minimum
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-500" />
                90% Target
              </span>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div className="w-full h-80 min-h-[300px]">
            {enteredSubjects.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <BookOpen className="w-8 h-8 text-slate-600 mb-2" />
                <span>No attendance data entered yet.</span>
                <span className="text-[11px] text-slate-600 mt-1">
                  Enter your conducted & attended classes in the Predictor tab.
                </span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={barChartData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 40 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 100]}
                    unit="%"
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl text-xs space-y-1">
                            <p className="font-bold text-white">{data.fullName}</p>
                            <p className="text-slate-400 font-mono text-[11px]">
                              Code: {data.code}
                            </p>
                            {data.isEntered ? (
                              <>
                                <p className="text-indigo-300 font-bold font-mono">
                                  Attendance: {data.percentage}%
                                </p>
                                <p className="text-slate-400 text-[11px] font-mono">
                                  Classes: {data.attended} attended / {data.conducted} conducted
                                </p>
                                <p className="text-slate-500 text-[11px] font-mono">
                                  Remaining scheduled: {data.remaining} classes
                                </p>
                                <div className="pt-1 mt-1 border-t border-slate-800 text-[11px]">
                                  {data.percentage >= 90 ? (
                                    <span className="text-emerald-400 font-medium">
                                      🟢 Honors target secured
                                    </span>
                                  ) : data.percentage >= 75 ? (
                                    <span className="text-amber-400 font-medium">
                                      🟡 Safe from detention
                                    </span>
                                  ) : (
                                    <span className="text-rose-400 font-semibold">
                                      🔴 Detention danger zone (&lt;75%)
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <p className="text-slate-500 italic">No attendance data entered yet</p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* Reference line for 75% safe threshold */}
                  <ReferenceLine
                    y={75}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: '75% Cutoff',
                      fill: '#ef4444',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  {/* Reference line for 90% honor target */}
                  <ReferenceLine
                    y={90}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={2}
                    label={{
                      value: '90% Target',
                      fill: '#10b981',
                      fontSize: 10,
                      position: 'top',
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    radius={[6, 6, 0, 0]}
                    onClick={(data: any) => {
                      if (onSelectSubjectForDetail && data?.code) {
                        onSelectSubjectForDetail(data.code);
                      }
                    }}
                  >
                    {barChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        className="cursor-pointer transition-opacity hover:opacity-85"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart B: Attendance Health Distribution Donut (1 col) */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Attendance Health Distribution
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of courses across detention risk tiers
            </p>
          </div>

          <div className="w-full h-56 relative flex items-center justify-center my-4">
            {pieData.length === 0 ? (
              <div className="text-center text-slate-500 text-xs">
                No active attendance entered yet
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`donut-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                              <span className="font-semibold text-white">{data.name}:</span>{' '}
                              <span className="font-mono text-indigo-400 font-bold">
                                {data.value} subject(s)
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-black font-mono text-white">
                    {enteredSubjects.length}
                  </span>
                  <span className="text-[10px] text-slate-400">Total Courses</span>
                </div>
              </>
            )}
          </div>

          {/* Distribution legend chips */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-300">Above 90% (Distinction)</span>
              </div>
              <span className="font-mono font-bold text-emerald-400">{above90Count}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-slate-300">75%–90% (Safe Buffer)</span>
              </div>
              <span className="font-mono font-bold text-amber-400">{between75And90Count}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-slate-300">Below 75% (Detention Risk)</span>
              </div>
              <span className="font-mono font-bold text-rose-400">{below75Count}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
