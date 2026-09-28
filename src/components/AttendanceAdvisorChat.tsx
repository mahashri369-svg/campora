import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Bot,
  Send,
  X,
  Maximize2,
  Minimize2,
  Sparkles,
  RotateCcw,
  User,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Section, StudentProfile } from '../types';
import { calculateRemainingClassesInRange } from '../utils/attendance';
import { SEMESTER_CONFIG } from '../data/timetableData';

interface AttendanceAdvisorChatProps {
  section: Section;
  currentStudent: StudentProfile;
  todayDateStr: string;
  activeOdCredits?: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  isEmbedded?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

export const AttendanceAdvisorChat: React.FC<AttendanceAdvisorChatProps> = ({
  section,
  currentStudent,
  todayDateStr,
  activeOdCredits = {},
  isOpen,
  onClose,
  isEmbedded = false,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello **${currentStudent.name}**! 👋 I am your **Attendance Advisor AI** for **${section.name}**.\n\nI have loaded your real attendance numbers and section timetable. Ask me anything:\n• *"Can I take leave tomorrow?"*\n• *"Which subjects are below 75%?"*\n• *"How can I reach 90% attendance?"*\n• *"What is the medical condonation policy?"*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'gemini-3.8-flash',
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Aggregate student subject statistics to send as context to Gemini
  const prepareContextPayload = () => {
    let totalConducted = 0;
    let totalAttended = 0;
    let totalRemaining = 0;
    let above90Count = 0;
    let between75And90Count = 0;
    let below75Count = 0;

    const subjectsPayload = section.subjects.map((sub) => {
      const rec = currentStudent.subjectAttendance?.[sub.code];
      const cond = rec ? rec.conducted : 0;
      const baseAtt = rec ? rec.attended : 0;
      const od = activeOdCredits[sub.code] || 0;
      const att = Math.min(cond, baseAtt + od);

      const pct = cond > 0 ? Number(((att / cond) * 100).toFixed(1)) : 0;

      const remaining = calculateRemainingClassesInRange(
        section,
        sub.code,
        todayDateStr,
        SEMESTER_CONFIG.endDate
      ).length;

      const futureTotal = cond + remaining;
      const needed75 = Math.max(0, Math.ceil(0.75 * futureTotal - att));
      const needed90 = Math.max(0, Math.ceil(0.9 * futureTotal - att));

      if (cond > 0) {
        totalConducted += cond;
        totalAttended += att;
        if (pct >= 90) above90Count++;
        else if (pct >= 75) between75And90Count++;
        else below75Count++;
      }
      totalRemaining += remaining;

      let status = 'Not Started';
      if (cond > 0) {
        if (pct >= 90) status = 'Honors (≥90%)';
        else if (pct >= 75) status = 'Safe (≥75%)';
        else status = 'Detention Danger (<75%)';
      }

      return {
        name: sub.name,
        code: sub.code,
        conducted: cond,
        attended: att,
        percentage: pct,
        remainingClasses: remaining,
        neededFor75: needed75 > remaining ? 'Impossible' : needed75,
        neededFor90: needed90 > remaining ? 'Impossible' : needed90,
        status,
      };
    });

    const overallPct =
      totalConducted > 0
        ? Number(((totalAttended / totalConducted) * 100).toFixed(1))
        : 0;

    return {
      student: {
        name: currentStudent.name,
        email: currentStudent.email,
        sectionName: section.name,
        rollNumber: currentStudent.rollNumber || '',
      },
      subjects: subjectsPayload,
      overall: {
        totalConducted,
        totalAttended,
        overallPercentage: overallPct,
        totalRemaining,
        above90Count,
        between75And90Count,
        below75Count,
      },
    };
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const context = prepareContextPayload();

      // Format previous chat turns for Gemini
      const history = messages.slice(-6).map((m) => ({
        role: (m.sender === 'user' ? 'user' : 'model') as 'user' | 'model',
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/gemini/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          student: context.student,
          subjects: context.subjects,
          overall: context.overall,
          history,
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        'I have analyzed your attendance. Please keep attending your scheduled classes to stay safe above 75%.';

      const botMsg: ChatMessage = {
        id: `bot_${Date.now()}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source || 'gemini-3.8-flash',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Failed to get advisor reply', err);
      const fallbackMsg: ChatMessage = {
        id: `bot_err_${Date.now()}`,
        sender: 'assistant',
        text: `⚠️ **Attendance Advisory Notice**\n\nBased on your section's current records:\n• Always maintain at least **75% attendance** in each course to avoid detention.\n• Check upcoming classes from today through **29 November 2026**.\n• If you need medical leave, ensure your attendance is between **65% and 75%** to qualify for condonation.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'local_intelligence_engine',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        sender: 'assistant',
        text: `Conversation reset. How can I help you plan your attendance today, **${currentStudent.name}**?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'gemini-3.8-flash',
      },
    ]);
  };

  const suggestedPrompts = [
    'Can I skip class tomorrow?',
    'Which subjects are below 75%?',
    'How to reach 90% attendance?',
    'What is SRM condonation policy?',
    'Simulate 4 OD hours for hackathon',
  ];

  // Helper to render markdown text neatly
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      // Bold rendering
      let processed: React.ReactNode = line;
      if (line.includes('**')) {
        const parts = line.split('**');
        processed = parts.map((part, i) =>
          i % 2 === 1 ? (
            <strong key={i} className="text-white font-semibold">
              {part}
            </strong>
          ) : (
            part
          )
        );
      }

      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-bold text-indigo-300 mt-2 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-2 my-0.5 text-xs text-slate-300">
            <span className="text-indigo-400 font-bold">•</span>
            <span>{processed}</span>
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-1.5" />;
      }
      return (
        <p key={idx} className="text-xs text-slate-300 leading-relaxed my-0.5">
          {processed}
        </p>
      );
    });
  };

  if (!isOpen && !isEmbedded) return null;

  return (
    <div
      className={
        isEmbedded
          ? 'w-full h-full min-h-[550px] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden'
          : `fixed z-50 transition-all duration-300 flex flex-col bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden ${
              isExpanded
                ? 'inset-4 sm:inset-10'
                : 'bottom-5 right-5 w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]'
            }`
      }
    >
      {/* Chat Header */}
      <div className="p-3.5 px-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Attendance Advisor AI</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              {currentStudent.name} · {section.name}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleResetChat}
            title="Reset Conversation"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {!isEmbedded && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Minimize' : 'Maximize'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                onClick={onClose}
                title="Close Advisor"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Suggested Query Chips */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-slate-800/80 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
        {suggestedPrompts.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={isLoading}
            className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-indigo-600/30 rounded-lg border border-slate-800 hover:border-indigo-500/40 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-900/60">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2.5 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-md ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-xs'
              }`}
            >
              {renderFormattedText(msg.text)}

              <div
                className={`flex items-center justify-between gap-3 text-[10px] mt-1.5 pt-1 border-t ${
                  msg.sender === 'user'
                    ? 'border-indigo-500/60 text-indigo-200'
                    : 'border-slate-800 text-slate-500 font-mono'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.source && (
                  <span className="text-[9px] opacity-75">{msg.source}</span>
                )}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 text-[11px] font-bold font-mono">
                {currentStudent.name ? currentStudent.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5 justify-start">
            <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400 shrink-0">
              <Bot className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>Analyzing {section.name} timetable & attendance math...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ask advisor about attendance, leave, or 75% limit...`}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="submit"
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
