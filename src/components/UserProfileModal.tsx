import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Layers,
  Hash,
  Phone,
  Save,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { StudentProfile, Section } from '../types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: StudentProfile;
  sections: Section[];
  onSaveProfile: (updates: {
    name: string;
    sectionId: string;
    rollNumber: string;
    phoneNumber: string;
  }) => void;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  sections,
  onSaveProfile,
  onLogout,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState<string>(user.name || '');
  const [sectionId, setSectionId] = useState<string>(user.sectionId || sections[0].id);
  const [rollNumber, setRollNumber] = useState<string>(user.rollNumber || user.registerNumber || '');
  const [phoneNumber, setPhoneNumber] = useState<string>(user.phoneNumber || '');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isProfileComplete = Boolean(
    name.trim() &&
    sectionId &&
    rollNumber.trim() &&
    phoneNumber.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }
    if (!sectionId) {
      setErrorMsg('Please select a valid section.');
      return;
    }

    setErrorMsg(null);
    onSaveProfile({
      name: name.trim(),
      sectionId,
      rollNumber: rollNumber.trim(),
      phoneNumber: phoneNumber.trim(),
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const currentSection = sections.find((s) => s.id === sectionId) || sections[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-base">
            {name ? name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              My Student Profile
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Account: {user.email}
            </p>
          </div>
        </div>

        {/* Profile Completion Indicator */}
        <div className="mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Profile Status:</span>
          {isProfileComplete ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Profile Complete
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <AlertCircle className="w-3.5 h-3.5" />
              Profile Incomplete (Add Roll No. / Phone)
            </span>
          )}
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          {/* Name */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-white transition-colors"
            />
          </div>

          {/* Email (Read-Only) */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              Registered Email (Used for login)
            </label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-mono cursor-not-allowed"
            />
          </div>

          {/* Section Selection */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                Class Section
              </span>
              <span className="text-slate-400 font-mono text-[11px]">
                {currentSection.department}
              </span>
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3 py-2 text-white transition-colors"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} · {sec.year} ({sec.semester}) · Venue: {sec.venue || 'Campus'}
                </option>
              ))}
            </select>
          </div>

          {/* Roll Number / Register Number */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                Roll Number / Register Number
              </span>
              {!rollNumber && (
                <span className="text-slate-400 text-[11px]">Not added yet</span>
              )}
            </label>
            <input
              type="text"
              placeholder="e.g. RA2411003010142"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-mono uppercase transition-colors"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-indigo-400" />
                Phone Number
              </span>
              {!phoneNumber && (
                <span className="text-slate-400 text-[11px]">Not added yet</span>
              )}
            </label>
            <input
              type="tel"
              placeholder="e.g. +91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3 py-2 text-white font-mono transition-colors"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Success Message */}
          {saveSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Changes saved successfully. Your profile is updated.</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-900/60 bg-rose-950/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 text-xs font-medium transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
