import React, { useState } from 'react';
import {
  Table,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  PlusCircle,
  HelpCircle,
  Clock,
  Info,
} from 'lucide-react';
import { Section, SubjectInfo, StudentProfile } from '../types';
import { SEMESTER_CONFIG } from '../data/timetableData';
import {
  calculateAttendance,
  calculateMaximumAttendance,
  calculateRequiredClasses,
  getScheduledClassesCount,
  formatLocalDate,
  parseLocalDate,
} from '../utils/attendance';

interface SubjectMatrixViewProps {
  section: Section;
  todayDateStr: string;
  currentStudent: StudentProfile;
  onUpdateSubjectAttendance: (subjectCode: string, conducted: number, attended: number) => void;
  onSelectSubjectForDetail: (subjectCode: string, conducted: number, attended: number) => void;
}

export const SubjectMatrixView: React.FC<SubjectMatrixViewProps> = ({
  section,
  todayDateStr,
  currentStudent,
  onUpdateSubjectAttendance,
  onSelectSubjectForDetail,
}) => {
  // Read attendance strictly from the currently authenticated user's profile
  const userAttendance = currentStudent.subjectAttendance || {};

  // Track subjects being edited inline
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editConducted, setEditConducted] = useState<string>('');
  const [editAttended, setEditAttended] = useState<string>('');

  const today = parseLocalDate(todayDateStr);
  const tomorrow = new Date(today.getTime());
  tomorrow.setDate(tomorrow.getDate() + 1);
  const startStr = formatLocalDate(tomorrow);
  const endStr = SEMESTER_CONFIG.endDate;

  const handleStartEdit = (subjectCode: string) => {
    const existing = userAttendance[subjectCode];
    setEditingCode(subjectCode);
    setEditConducted(existing ? String(existing.conducted) : '');
    setEditAttended(existing ? String(existing.attended) : '');
  };

  const handleSaveEdit = (subjectCode: string) => {
    const c = parseInt(editConducted);
    const a = parseInt(editAttended);

    if (isNaN(c) || c <= 0) {
      alert('Please enter a valid number of conducted classes (greater than 0).');
      return;
    }
    if (isNaN(a) || a < 0) {
      alert('Please enter a valid number of attended classes (0 or greater).');
      return;
    }
    if (a > c) {
      alert('Attended classes cannot exceed conducted classes.');
      return;
    }

    onUpdateSubjectAttendance(subjectCode, c, a);
    setEditingCode(null);
  };

  const enteredSubjectCount = Object.keys(userAttendance).length;

  return (
    <div className="space-y-6">
      {/* Header and User Isolation Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Subject-wise Attendance Dashboard
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
                {section.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Private records for student <strong className="text-white">{currentStudent.name}</strong> ({currentStudent.email}).
            </p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            <span>Data Status: </span>
            <strong className="text-white">
              {enteredSubjectCount} of {section.subjects.length} subjects recorded
            </strong>
          </div>
        </div>

        {/* Empty State Banner if no subjects entered yet */}
        {enteredSubjectCount === 0 && (
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-indigo-900/60 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white block">
                No attendance data added yet.
              </span>
              <span className="text-slate-400 mt-0.5 block">
                Click <strong>"Enter Attendance"</strong> on any subject row below to record your conducted and attended classes. All values will be stored strictly to your private account.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Dynamic Multi-Subject Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
              <th className="py-3 px-4 font-semibold">Subject & Code</th>
              <th className="py-3 px-3 font-semibold text-center">Conducted (T)</th>
              <th className="py-3 px-3 font-semibold text-center">Attended (A)</th>
              <th className="py-3 px-3 font-semibold text-right">Current %</th>
              <th className="py-3 px-3 font-semibold text-right">Remaining (R)</th>
              <th className="py-3 px-3 font-semibold text-right">Need for 75%</th>
              <th className="py-3 px-3 font-semibold text-right">Need for 90%</th>
              <th className="py-3 px-3 font-semibold text-center">Status</th>
              <th className="py-3 px-4 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {section.subjects.map((sub) => {
              const record = userAttendance[sub.code];
              const hasData = Boolean(record && record.conducted > 0);

              const conducted = hasData ? record.conducted : 0;
              const attended = hasData ? record.attended : 0;
              const currentPct = hasData ? calculateAttendance(attended, conducted) : null;

              // Remaining classes from official timetable
              const remaining = getScheduledClassesCount(section, sub.code, startStr, endStr);

              // Calculate requirements only if data was actually entered
              const req75 = hasData ? calculateRequiredClasses(attended, conducted, remaining, 75) : null;
              const req90 = hasData ? calculateRequiredClasses(attended, conducted, remaining, 90) : null;
              const maxPossible = hasData ? calculateMaximumAttendance(attended, conducted, remaining) : null;

              let statusLabel = 'No Data';
              let statusTone = 'text-slate-400 bg-slate-950 border-slate-800';

              if (hasData && req75 && maxPossible !== null) {
                if (maxPossible < 75 || !req75.isPossible) {
                  statusLabel = 'Detention';
                  statusTone = 'text-rose-300 bg-rose-950 border-rose-800';
                } else if (currentPct !== null && currentPct < 75) {
                  statusLabel = 'Warning';
                  statusTone = 'text-amber-300 bg-amber-950 border-amber-800';
                } else if (currentPct !== null && currentPct >= 90) {
                  statusLabel = 'Elite (90%+)';
                  statusTone = 'text-emerald-300 bg-emerald-950 border-emerald-800';
                } else {
                  statusLabel = 'Safe';
                  statusTone = 'text-indigo-300 bg-indigo-950 border-indigo-800';
                }
              }

              const isEditingThis = editingCode === sub.code;

              return (
                <tr
                  key={sub.code}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    statusLabel === 'Detention' ? 'bg-rose-950/20' : ''
                  }`}
                >
                  {/* Subject Name */}
                  <td className="py-3 px-4 font-sans">
                    <div className="font-semibold text-white">
                      {sub.name}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{sub.code}</span>
                      <span>·</span>
                      <span>Slot: {sub.slot || '–'}</span>
                      <span>·</span>
                      <span>{sub.weeklyClassesCount} classes/wk</span>
                    </div>
                  </td>

                  {/* Conducted Classes */}
                  <td className="py-3 px-3 text-center">
                    {isEditingThis ? (
                      <input
                        type="number"
                        min="1"
                        placeholder="T"
                        value={editConducted}
                        onChange={(e) => setEditConducted(e.target.value)}
                        className="w-16 bg-slate-950 border border-indigo-500 rounded px-1.5 py-1 text-center text-white font-mono"
                      />
                    ) : hasData ? (
                      <span className="text-white font-semibold">{conducted}</span>
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">Not entered</span>
                    )}
                  </td>

                  {/* Attended Classes */}
                  <td className="py-3 px-3 text-center">
                    {isEditingThis ? (
                      <input
                        type="number"
                        min="0"
                        placeholder="A"
                        value={editAttended}
                        onChange={(e) => setEditAttended(e.target.value)}
                        className="w-16 bg-slate-950 border border-indigo-500 rounded px-1.5 py-1 text-center text-white font-mono"
                      />
                    ) : hasData ? (
                      <span className="text-white font-semibold">{attended}</span>
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">Not entered</span>
                    )}
                  </td>

                  {/* Current Percentage */}
                  <td className="py-3 px-3 text-right tabular-nums">
                    {currentPct !== null ? (
                      <span
                        className={`text-sm font-bold ${
                          currentPct >= 90
                            ? 'text-emerald-400'
                            : currentPct >= 75
                            ? 'text-indigo-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {currentPct}%
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">—</span>
                    )}
                  </td>

                  {/* Remaining Scheduled Classes */}
                  <td className="py-3 px-3 text-right text-slate-300 font-semibold tabular-nums">
                    {remaining}
                  </td>

                  {/* Needed for 75% */}
                  <td className="py-3 px-3 text-right tabular-nums">
                    {req75 ? (
                      req75.isPossible ? (
                        req75.required === 0 ? (
                          <span className="text-emerald-400 font-semibold">0 (Safe)</span>
                        ) : (
                          <span className="text-indigo-300 font-bold">
                            {req75.required} <span className="text-slate-500">/ {remaining}</span>
                          </span>
                        )
                      ) : (
                        <span className="text-rose-400 font-bold uppercase text-[11px]">
                          Impossible
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">—</span>
                    )}
                  </td>

                  {/* Needed for 90% */}
                  <td className="py-3 px-3 text-right tabular-nums">
                    {req90 ? (
                      req90.isPossible ? (
                        req90.required === 0 ? (
                          <span className="text-emerald-400 font-semibold">0 (Achieved)</span>
                        ) : (
                          <span className="text-emerald-300 font-medium">
                            {req90.required} <span className="text-slate-500">/ {remaining}</span>
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unreachable</span>
                      )
                    ) : (
                      <span className="text-slate-400 font-sans text-[11px]">—</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-semibold ${statusTone}`}>
                      {statusLabel}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    {isEditingThis ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSaveEdit(sub.code)}
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCode(null)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleStartEdit(sub.code)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs border border-slate-700 transition-colors"
                        >
                          {hasData ? 'Edit' : 'Enter'}
                        </button>
                        {hasData && (
                          <button
                            onClick={() => onSelectSubjectForDetail(sub.code, conducted, attended)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-medium text-xs border border-indigo-500/30 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Plan</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>
          Locked to user: <strong className="text-white">{currentStudent.name}</strong>. Data persists across refresh, logout, and login.
        </span>
        <span className="font-mono text-slate-500">
          Semester End: 29 Nov 2026
        </span>
      </div>
    </div>
  );
};
