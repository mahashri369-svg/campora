import React from 'react';
import { ArrowRight, ShieldAlert, CalendarClock, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { SEMESTER_CONFIG } from '../data/timetableData';

interface LandingHeroProps {
  onStartClick: () => void;
  onHowItWorksClick: () => void;
  onSelectQuickSection: (sectionId: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onStartClick,
  onHowItWorksClick,
  onSelectQuickSection,
}) => {
  return (
    <div className="relative overflow-hidden py-10 sm:py-14 border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950">
      {/* Subtle radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-indigo-600/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-3xl mx-auto">
          {/* Unboxed metadata kicker */}
          <div className="inline-flex items-center gap-2 text-xs font-mono text-indigo-400 mb-4 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VibeCraft Round 1 · SRM Official Section Timetable Engine</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight text-balance">
            Campora <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-300">Attendance</span>
          </h1>

          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed text-balance">
            Know exactly how many classes you need to attend before it's too late.
          </p>

          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            Active Semester: <span className="text-slate-200 font-mono">29 Aug 2026 → 29 Nov 2026</span> · 75% Detention Limit & 90% Honor Target
          </p>

          {/* Action CTAs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onStartClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
            >
              <span>Check My Attendance</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onHowItWorksClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <span>How It Works</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 3 Step Workflow */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 text-xs font-bold mb-3">
              01
            </div>
            <h3 className="text-sm font-semibold text-white">Select Your Section</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Choose from 10+ official engineering sections. We automatically bind the exact weekly period timetable, faculty, and room slots.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 text-xs font-bold mb-3">
              02
            </div>
            <h3 className="text-sm font-semibold text-white">Enter Your Attendance</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Input conducted & attended classes (or percentage). Today's date is detected from your system to calculate remaining classes accurately.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-400 text-xs font-bold mb-3">
              03
            </div>
            <h3 className="text-sm font-semibold text-white">Get Your Attendance Plan</h3>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Instant math targets for 75% detention safety and 90% honor goal, with irreversible detention warnings before you cross the point of no return.
            </p>
          </div>
        </div>

        {/* Quick jump bar for sections */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span className="font-medium text-slate-400">Quick load section:</span>
          {['III ECE-A', 'III ECE-B', 'III ECE-DS', 'III BME', 'IV ECE-A', 'II ECE-DS B', 'I ECE-A'].map((name) => {
            const id = name.toLowerCase().replace(/[\s-]+/g, '-');
            const targetId = name === 'III ECE-A' ? 'section-3-ece-a'
              : name === 'III ECE-B' ? 'section-3-ece-b'
              : name === 'III ECE-DS' ? 'section-3-ece-ds'
              : name === 'III BME' ? 'section-3-bme'
              : name === 'IV ECE-A' ? 'section-4-ece-a'
              : name === 'II ECE-DS B' ? 'section-2-ece-ds-b'
              : 'section-1-ece-a';

            return (
              <button
                key={name}
                onClick={() => onSelectQuickSection(targetId)}
                className="px-2.5 py-1 rounded bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
