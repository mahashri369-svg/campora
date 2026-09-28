import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, BookOpen, Calculator, Calendar } from 'lucide-react';
import { SEMESTER_CONFIG } from '../data/timetableData';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Attendance Calculation Engine & Logic
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              VibeCraft Round 1 · Rigorous Mathematical Model
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5 text-xs text-slate-300 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          {/* Section 1: Core Attendance Formula */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-1.5">
              <span>1. Current Attendance Calculation</span>
            </h4>
            <p className="text-slate-400 mb-2">
              If a student enters total conducted classes <code className="text-indigo-300 font-mono">T</code> and attended classes <code className="text-indigo-300 font-mono">A</code>:
            </p>
            <div className="p-2.5 rounded bg-slate-900 text-center font-mono text-sm text-indigo-300 border border-slate-800">
              Current Attendance (%) = (A / T) × 100
            </div>
          </div>

          {/* Section 2: Future Target & Ceiling Math */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-1.5">
              <span>2. Future Attendance & Target Requirements</span>
            </h4>
            <p className="text-slate-400 mb-2">
              For a future planning date or semester end, let <code className="text-indigo-300 font-mono">R</code> be the number of remaining classes determined by the section's actual timetable. If the student attends <code className="text-indigo-300 font-mono">x</code> future classes:
            </p>
            <div className="p-2.5 rounded bg-slate-900 text-center font-mono text-sm text-indigo-300 border border-slate-800 mb-2">
              Future Attendance (%) = [(A + x) / (T + R)] × 100
            </div>
            <p className="text-slate-400 mb-1">
              To achieve target percentage <code className="text-indigo-300 font-mono">P</code> (e.g. 75% or 90%):
            </p>
            <div className="p-2.5 rounded bg-slate-900 text-center font-mono text-sm text-indigo-300 border border-slate-800">
              x ≥ (P / 100) × (T + R) − A
            </div>
            <p className="text-slate-400 mt-2">
              <strong className="text-white">Strict Integer Rounding Up:</strong> We evaluate <code className="text-indigo-300 font-mono">Math.ceil(x)</code>. Class counts can never be fractional; rounding down would fall below 75.00%, resulting in detention.
            </p>
          </div>

          {/* Section 3: Irreversible Detention Check */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/80">
            <h4 className="font-semibold text-rose-300 text-sm mb-1.5 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>3. Irreversible Detention Detection</span>
            </h4>
            <p className="text-rose-200/90 mb-2">
              Suppose the student attends 100% of all remaining classes (<code className="font-mono">x = R</code>):
            </p>
            <div className="p-2.5 rounded bg-slate-950 text-center font-mono text-sm text-rose-300 border border-rose-900/60 mb-2">
              Max Possible Final Attendance = [(A + R) / (T + R)] × 100
            </div>
            <p className="text-rose-200/90">
              If this value is strictly <strong className="text-white">&lt; 75.0%</strong>, the system triggers the prominent <strong className="text-rose-400">IRREVERSIBLE DETENTION</strong> warning. No future attendance strategy can bridge the mathematical gap.
            </p>
          </div>

          {/* Section 4: Timetable Scheduling Engine */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <h4 className="font-semibold text-white text-sm mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>4. Real Timetable Schedule Engine</span>
            </h4>
            <p className="text-slate-400">
              Unlike simple calculators that assume 1 class per day, this application counts only the actual periods scheduled on specific weekdays for your section (e.g. 2 periods on Monday, 1 on Wednesday, lab blocks on Friday) between today's detected date and {SEMESTER_CONFIG.endDate}.
            </p>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors"
          >
            Got it, Let's Plan
          </button>
        </div>
      </div>
    </div>
  );
};
