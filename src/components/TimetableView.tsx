import React, { useState } from 'react';
import { Calendar, Clock, MapPin, Filter, Layers, BookOpen } from 'lucide-react';
import { Section, DayOfWeek } from '../types';
import { PERIOD_TIMINGS } from '../data/timetableData';

interface TimetableViewProps {
  section: Section;
  highlightSubjectCode?: string;
  onSelectSubject?: (code: string) => void;
}

const DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const PERIOD_LIST = [1, 2, 3, 4, 6, 7, 8, 9];

export const TimetableView: React.FC<TimetableViewProps> = ({
  section,
  highlightSubjectCode,
  onSelectSubject,
}) => {
  const [filterCode, setFilterCode] = useState<string>(highlightSubjectCode || 'all');

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {section.name} Official Timetable
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300 font-mono">
                {section.year} ({section.semester})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>{section.department}</span>
              <span>·</span>
              <span className="flex items-center gap-1 font-mono text-slate-300">
                <MapPin className="w-3 h-3 text-indigo-400" />
                Venue: {section.venue || 'Campus FET Block'}
              </span>
            </p>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
              <Filter className="w-3 h-3 text-indigo-400" />
              Highlight:
            </span>
            <select
              value={filterCode}
              onChange={(e) => {
                setFilterCode(e.target.value);
                if (e.target.value !== 'all' && onSelectSubject) {
                  onSelectSubject(e.target.value);
                }
              }}
              className="bg-slate-950 border border-slate-700 hover:border-slate-600 rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 font-mono"
            >
              <option value="all">All Subjects View</option>
              {section.subjects.map((sub) => (
                <option key={sub.code} value={sub.code}>
                  {sub.code} — {sub.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Period Timings strip */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="text-indigo-400 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Class Timings:
          </span>
          {PERIOD_LIST.map((p) => (
            <span
              key={p}
              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
            >
              P{p}: {PERIOD_TIMINGS[p]?.split(' - ')[0] || ''}
            </span>
          ))}
          <span className="text-slate-500">Lunch Break: 12:35 – 01:30</span>
        </div>
      </div>

      {/* Weekly Schedule Grid (Desktop & Tablet) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <th className="py-3 px-4 w-28 font-semibold uppercase">Day</th>
              {PERIOD_LIST.map((p) => (
                <th key={p} className="py-3 px-2 text-center font-semibold border-l border-slate-800/80">
                  <div>P{p}</div>
                  <div className="text-[10px] text-slate-400 font-normal">
                    {PERIOD_TIMINGS[p]?.split(' - ')[0]}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-xs">
            {DAYS.map((day) => {
              const daySchedule = section.schedule.find((s) => s.day === day);
              const slots = daySchedule ? daySchedule.slots : [];

              return (
                <tr key={day} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold font-sans text-white bg-slate-950/40">
                    {day}
                  </td>

                  {PERIOD_LIST.map((p) => {
                    const slot = slots.find((s) => s.period === p);
                    const isFiltered = filterCode !== 'all';
                    const isHighlighted = isFiltered && slot?.subjectCode === filterCode;
                    const isDimmed = isFiltered && slot && slot.subjectCode !== filterCode;

                    return (
                      <td
                        key={p}
                        className={`p-2 border-l border-slate-800/60 text-center align-top transition-all ${
                          isHighlighted
                            ? 'bg-indigo-950/70 border-indigo-500/80 ring-1 ring-indigo-500/50'
                            : isDimmed
                            ? 'opacity-30'
                            : ''
                        }`}
                      >
                        {slot ? (
                          <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition-colors">
                            <span className="font-mono font-bold text-white text-[11px] block truncate">
                              {slot.subjectCode}
                            </span>
                            <span className="text-[10px] text-slate-300 block truncate mt-0.5" title={slot.subjectName}>
                              {slot.subjectName}
                            </span>
                            <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                              <span>Slot: {slot.slot || '–'}</span>
                              <span className="text-slate-400">{slot.room || 'IST'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-slate-600 font-mono text-[10px] py-3">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Day View */}
      <div className="block md:hidden space-y-4">
        {DAYS.map((day) => {
          const daySchedule = section.schedule.find((s) => s.day === day);
          const slots = daySchedule ? daySchedule.slots : [];

          return (
            <div key={day} className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h4 className="font-bold text-white text-sm mb-3 pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>{day}</span>
                <span className="text-xs font-mono text-slate-400">{slots.length} periods</span>
              </h4>

              {slots.length > 0 ? (
                <div className="space-y-2">
                  {slots.map((slot, sIdx) => {
                    const isHighlighted = filterCode !== 'all' && slot.subjectCode === filterCode;

                    return (
                      <div
                        key={sIdx}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${
                          isHighlighted
                            ? 'bg-indigo-950/80 border-indigo-500'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div>
                          <div className="font-mono font-semibold text-white">
                            P{slot.period} ({slot.time}) · {slot.subjectCode}
                          </div>
                          <div className="text-slate-300 text-[11px] mt-0.5">
                            {slot.subjectName}
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                          {slot.room || 'IST'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <span className="text-xs text-slate-400">No scheduled periods.</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Faculty and Course Roster */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white tracking-tight mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Faculty Course Assignment & Credit Distribution ({section.name})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {section.subjects.map((sub) => (
            <div
              key={sub.code}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-300">
                    {sub.code}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                    Slot {sub.slot || '–'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-white mt-1">
                  {sub.name}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{sub.faculty || 'Department Faculty'}</span>
                <span className="font-mono text-slate-400">{sub.weeklyClassesCount} hrs/wk</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
