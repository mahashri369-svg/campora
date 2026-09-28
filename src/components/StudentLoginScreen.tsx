import React, { useState } from 'react';
import {
  GraduationCap,
  User,
  Mail,
  Lock,
  Layers,
  Hash,
  Phone,
  ArrowRight,
  ShieldCheck,
  LogIn,
  UserPlus,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Section, StudentProfile } from '../types';
import { registerUser, loginUser, getRegisteredUsersList } from '../utils/studentStorage';

interface StudentLoginScreenProps {
  sections: Section[];
  onLoginSuccess: (user: StudentProfile) => void;
}

export const StudentLoginScreen: React.FC<StudentLoginScreenProps> = ({
  sections,
  onLoginSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  // Register form state
  const [regName, setRegName] = useState<string>('');
  const [regEmail, setRegEmail] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regSectionId, setRegSectionId] = useState<string>(sections[0].id);
  const [regRollNumber, setRegRollNumber] = useState<string>('');
  const [regPhoneNumber, setRegPhoneNumber] = useState<string>('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get list of actual registered users on this machine (no fake mock users!)
  const registeredAccounts = getRegisteredUsersList();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = loginUser(loginEmail, loginPassword);
    if (!result.success || !result.user) {
      setErrorMessage(result.error || 'Login failed. Please check your credentials.');
      return;
    }

    onLoginSuccess(result.user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const result = registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      sectionId: regSectionId,
      rollNumber: regRollNumber,
      phoneNumber: regPhoneNumber,
    });

    if (!result.success || !result.user) {
      setErrorMessage(result.error || 'Registration failed.');
      return;
    }

    onLoginSuccess(result.user);
  };

  const handleQuickAccountSelect = (email: string) => {
    setLoginEmail(email);
    setAuthMode('login');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800 text-xs font-mono text-indigo-300 mb-3">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Campora · Student Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {authMode === 'login' ? 'Student Account Sign In' : 'Create Student Account'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            {authMode === 'login'
              ? 'Log in with your registered email and password to view your private attendance records.'
              : 'Register your student profile. Each account maintains its own independent data.'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              authMode === 'login'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              authMode === 'register'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Account</span>
          </button>
        </div>

        {/* SIGN IN FORM */}
        {authMode === 'login' ? (
          <form
            onSubmit={handleLoginSubmit}
            className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-xs"
          >
            {/* Email */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="e.g. mithra@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3.5 py-2.5 text-sm text-white transition-colors"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-2"
            >
              <span>Sign In to Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 text-slate-400">
              <span>Don't have an account yet? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setErrorMessage(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Register here
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form
            onSubmit={handleRegisterSubmit}
            className="p-6 sm:p-7 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4 text-xs"
          >
            {/* Full Name */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-indigo-400" />
                Full Name
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Mithra"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white transition-colors"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="e.g. mithra@gmail.com"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Password (minimum 4 characters)
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white transition-colors"
              />
            </div>

            {/* Class Section */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Assigned Section
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {sections.length} Official Sections
                </span>
              </label>
              <select
                value={regSectionId}
                onChange={(e) => setRegSectionId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white transition-colors"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} · {sec.year} ({sec.semester}) · {sec.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Optional: Roll Number */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-400" />
                  Roll Number / Register Number
                </span>
                <span className="text-[11px] text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={regRollNumber}
                onChange={(e) => setRegRollNumber(e.target.value)}
                placeholder="e.g. RA2411003010045"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase transition-colors"
              />
            </div>

            {/* Optional: Phone Number */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  Phone Number
                </span>
                <span className="text-[11px] text-slate-400">(Optional)</span>
              </label>
              <input
                type="tel"
                value={regPhoneNumber}
                onChange={(e) => setRegPhoneNumber(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-slate-950 border border-slate-700 hover:border-slate-600 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white font-mono transition-colors"
              />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-600/30 transition-all cursor-pointer mt-2"
            >
              <span>Register & Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2 text-slate-400">
              <span>Already registered? </span>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                }}
                className="text-indigo-400 hover:text-indigo-300 underline font-medium"
              >
                Sign in here
              </button>
            </div>
          </form>
        )}

        {/* Registered Accounts on this browser (Helps user test multiple user accounts seamlessly!) */}
        {registeredAccounts.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-semibold mb-2.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>Registered Accounts on This Device ({registeredAccounts.length})</span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {registeredAccounts.map((acc) => {
                const sec = sections.find((s) => s.id === acc.sectionId);
                return (
                  <div
                    key={acc.id}
                    onClick={() => handleQuickAccountSelect(acc.email)}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer group"
                  >
                    <div>
                      <span className="font-semibold text-white block">{acc.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">{acc.email}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-300 border border-slate-800">
                      {sec ? sec.name : acc.sectionId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Data Security Guarantee */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>User-isolated data · Zero random data generation</span>
          </div>
          <span className="font-mono text-slate-500">Private DB</span>
        </div>
      </div>
    </div>
  );
};
