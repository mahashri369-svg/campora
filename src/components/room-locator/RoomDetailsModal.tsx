import React, { useEffect, useState } from 'react';
import {
  X,
  Clock,
  Wind,
  Users,
  Building,
  Share2,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { RoomAvailabilityInfo } from '../../types';
import {
  formatCountdownTimer,
  formatDurationHuman,
  generateSquadWhatsAppUrl,
} from '../../utils/roomAvailability';

interface RoomDetailsModalProps {
  info: RoomAvailabilityInfo | null;
  onClose: () => void;
  onClaimRoom?: (info: RoomAvailabilityInfo) => void;
  isClaimedByCurrentUser?: boolean;
}

export const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({
  info,
  onClose,
  onClaimRoom,
  isClaimedByCurrentUser = false,
}) => {
  if (!info) return null;

  const { room, status, isFree, currentClass, nextClass, availableUntil, freeDurationMinutes, timeline } = info;

  // Live second countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState<number>(info.secondsUntilNextEvent);

  useEffect(() => {
    setSecondsRemaining(info.secondsUntilNextEvent);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [info.secondsUntilNextEvent, info.room.id]);

  const handleShareSquad = () => {
    const url = generateSquadWhatsAppUrl(
      room.roomNumber,
      room.floorName,
      availableUntil,
      freeDurationMinutes
    );
    window.open(url, '_blank');
  };

  const handleClaim = () => {
    if (onClaimRoom) {
      onClaimRoom(info);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative max-w-2xl w-full my-8 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight">
                {room.roomNumber}
              </h2>
              {/* Status Badge */}
              {isFree ? (
                status === 'ENDING_SOON' ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    ENDING SOON
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    🟢 AVAILABLE NOW
                  </span>
                )
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  🔴 OCCUPIED
                </span>
              )}

              {isClaimedByCurrentUser && (
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Marked for you
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {room.name} · {room.building}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Floor Level</span>
              <div className="text-sm font-bold text-white mt-1">{room.floorName}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Environment</span>
              <div
                className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
                  room.isAc ? 'text-cyan-300' : 'text-slate-300'
                }`}
              >
                <Wind className="w-4 h-4" />
                <span>{room.isAc ? 'Air Conditioned' : 'Non-AC'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Seating Capacity</span>
              <div className="text-sm font-bold text-white mt-1 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{room.capacity} Students</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] font-medium text-slate-400">Room Category</span>
              <div className="text-sm font-bold text-indigo-300 mt-1">{room.type}</div>
            </div>
          </div>

          {/* Real-time Status Card & Countdown */}
          <div
            className={`p-5 rounded-2xl border ${
              isFree
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : 'bg-rose-950/20 border-rose-500/40'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {isFree ? 'Current Availability Window' : 'Current Ongoing Lecture'}
                </span>
                <div className="text-xl font-bold text-white mt-1">
                  {isFree ? (
                    <>Available until <strong className="text-emerald-400">{availableUntil}</strong></>
                  ) : (
                    <>
                      <span className="text-rose-300">{currentClass?.subjectName}</span>{' '}
                      <span className="text-xs text-slate-400 font-mono">({currentClass?.sectionName})</span>
                    </>
                  )}
                </div>

                <div className="text-xs text-slate-400 mt-1 font-mono">
                  {isFree ? (
                    nextClass ? (
                      <span>Next scheduled class: <strong className="text-slate-200">{nextClass.subjectName}</strong> at {nextClass.startTime}</span>
                    ) : (
                      <span>No further classes scheduled for the remainder of today</span>
                    )
                  ) : (
                    <span>Period {currentClass?.period} ({currentClass?.startTime} – {currentClass?.endTime}) · Next Free: {availableUntil}</span>
                  )}
                </div>
              </div>

              {/* Second-by-Second Live Countdown Widget */}
              <div className="p-3 px-4 rounded-xl bg-slate-950/90 border border-slate-800 text-center shrink-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                  {isFree ? 'Time Remaining Free' : 'Class Finishes In'}
                </span>
                <div
                  className={`text-2xl font-black font-mono tracking-tight ${
                    isFree ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCountdownTimer(secondsRemaining)}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatDurationHuman(Math.floor(secondsRemaining / 60))}
                </span>
              </div>
            </div>
          </div>

          {/* Full Day Period Timeline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Today's 9-Period Timetable Schedule
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Official SRM Section Schedule
              </span>
            </div>

            <div className="space-y-1.5">
              {timeline.map((slot) => (
                <div
                  key={slot.period}
                  className={`p-2.5 px-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    slot.isOccupied
                      ? 'bg-rose-950/20 border-rose-900/40 text-slate-300'
                      : 'bg-slate-950/70 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 font-mono font-bold text-slate-500">
                      P{slot.period}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 w-28">
                      {slot.timeRange}
                    </span>
                    <div>
                      {slot.isOccupied ? (
                        <span className="font-semibold text-rose-300">
                          {slot.subjectName} ({slot.subjectCode})
                        </span>
                      ) : (
                        <span className="text-emerald-400/90 font-medium">
                          ✓ Free / No Class Scheduled
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="font-mono text-[11px]">
                    {slot.isOccupied ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                        {slot.sectionName}
                      </span>
                    ) : (
                      <span className="text-emerald-500/80">Available</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Room Facilities */}
          {room.facilities.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Room Amenities & Facilities
              </span>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((fac, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs font-medium"
                  >
                    ✓ {fac}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            {isFree ? 'Room is currently vacant' : 'Please do not disturb ongoing class'}
          </div>

          <div className="flex items-center gap-2">
            {isFree && onClaimRoom && (
              <button
                onClick={handleClaim}
                className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  isClaimedByCurrentUser
                    ? 'bg-slate-800 text-slate-300 border border-slate-700'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>{isClaimedByCurrentUser ? 'Release Claim' : 'Claim Room'}</span>
              </button>
            )}

            {isFree && (
              <button
                onClick={handleShareSquad}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Call the Squad (WhatsApp)</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
