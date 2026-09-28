import React from 'react';
import {
  Clock,
  Users,
  Wind,
  Share2,
  BookmarkCheck,
  ChevronRight,
  Sparkles,
  Layers,
  AlertCircle,
  Building2,
} from 'lucide-react';
import { RoomAvailabilityInfo } from '../../types';
import {
  formatDurationHuman,
  formatCountdownTimer,
  generateSquadWhatsAppUrl,
} from '../../utils/roomAvailability';

interface RoomCardProps {
  info: RoomAvailabilityInfo;
  onViewDetails: (info: RoomAvailabilityInfo) => void;
  onClaimRoom?: (info: RoomAvailabilityInfo) => void;
  isClaimedByCurrentUser?: boolean;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  info,
  onViewDetails,
  onClaimRoom,
  isClaimedByCurrentUser = false,
}) => {
  const { room, status, isFree, currentClass, nextClass, availableUntil, freeDurationMinutes, secondsUntilNextEvent } = info;

  const handleSquadWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = generateSquadWhatsAppUrl(
      room.roomNumber,
      room.floorName,
      availableUntil,
      freeDurationMinutes
    );
    window.open(url, '_blank');
  };

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClaimRoom) {
      onClaimRoom(info);
    }
  };

  return (
    <div
      onClick={() => onViewDetails(info)}
      className={`group rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col justify-between p-4 sm:p-5 relative ${
        isClaimedByCurrentUser
          ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40'
          : isFree
          ? status === 'ENDING_SOON'
            ? 'bg-slate-900/90 hover:bg-slate-800/90 border-amber-500/40 hover:border-amber-500/70 shadow-md shadow-amber-500/5'
            : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-emerald-500/50 shadow-md shadow-emerald-500/5'
          : 'bg-slate-900/70 hover:bg-slate-800/70 border-slate-800/80 hover:border-rose-500/40 opacity-90'
      }`}
    >
      {/* Top row: Room Number & Status Badge */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                {room.roomNumber}
              </h3>
              {isClaimedByCurrentUser && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Marked for you
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[200px]">
              {room.name}
            </p>
          </div>

          {/* Status Badge */}
          <div>
            {isFree ? (
              status === 'ENDING_SOON' ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  ENDING SOON
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  FREE
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                OCCUPIED
              </span>
            )}
          </div>
        </div>

        {/* Feature Badges: Floor, AC, Capacity */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono my-3 text-slate-400">
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800">
            {room.floorName}
          </span>
          <span
            className={`px-2 py-0.5 rounded-md border flex items-center gap-1 ${
              room.isAc
                ? 'bg-cyan-950/30 text-cyan-300 border-cyan-800/40'
                : 'bg-slate-950/80 text-slate-400 border-slate-800'
            }`}
          >
            <Wind className="w-3 h-3" />
            {room.isAc ? 'AC' : 'Non-AC'}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            {room.capacity}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-[10px]">
            {room.type}
          </span>
        </div>

        {/* Center Availability / Class Information */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs my-2 space-y-1.5">
          {isFree ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Available until:
                </span>
                <span className="font-bold font-mono text-white">{availableUntil}</span>
              </div>

              {nextClass ? (
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="truncate max-w-[130px]" title={nextClass.subjectName}>
                    Next: <strong className="text-slate-300">{nextClass.subjectName}</strong>
                  </span>
                  <span className="font-mono text-amber-300">{nextClass.startTime}</span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-400/90 pt-1 border-t border-slate-800/60 font-mono">
                  ✓ Free for all remaining periods today
                </div>
              )}

              {/* Free Duration Countdown indicator */}
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-300">
                <span className="text-slate-500">Live countdown:</span>
                <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/50">
                  {formatCountdownTimer(secondsUntilNextEvent)}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="text-[11px] text-slate-300">
                <span className="text-slate-500">Current class: </span>
                <strong className="text-rose-300">{currentClass?.subjectName || 'Class in progress'}</strong>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60 font-mono">
                <span>Ends at: <strong className="text-white">{availableUntil}</strong></span>
                <span className="text-slate-500">{currentClass?.sectionName}</span>
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px] font-mono text-slate-400">
                <span className="text-slate-500">Next free:</span>
                <span className="text-rose-400 font-semibold">{availableUntil}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action buttons footer */}
      <div className="pt-3 mt-1 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onViewDetails(info)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 group-hover:underline"
        >
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-1.5">
          {isFree && onClaimRoom && (
            <button
              onClick={handleClaim}
              title="Mark this room for your team"
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                isClaimedByCurrentUser
                  ? 'bg-indigo-600 text-white border-indigo-500'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">{isClaimedByCurrentUser ? 'Claimed' : 'Claim'}</span>
            </button>
          )}

          {isFree && (
            <button
              onClick={handleSquadWhatsApp}
              title="Share room on WhatsApp: 'Call the Squad'"
              className="p-1.5 px-2 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-sm shadow-emerald-600/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Squad</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
