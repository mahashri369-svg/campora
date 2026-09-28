import React, { useState, useEffect } from 'react';
import {
  BookmarkCheck,
  Share2,
  Clock,
  Wind,
  Users,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { RoomAvailabilityInfo } from '../../types';
import {
  formatCountdownTimer,
  formatDurationHuman,
  generateSquadWhatsAppUrl,
} from '../../utils/roomAvailability';

interface MyClaimedRoomCardProps {
  claimedRoomInfo: RoomAvailabilityInfo | null;
  onReleaseClaim: () => void;
  onViewDetails: (info: RoomAvailabilityInfo) => void;
  onFindRoomClick?: () => void;
}

export const MyClaimedRoomCard: React.FC<MyClaimedRoomCardProps> = ({
  claimedRoomInfo,
  onReleaseClaim,
  onViewDetails,
  onFindRoomClick,
}) => {
  if (!claimedRoomInfo) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BookmarkCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">No Room Claimed Right Now</h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Found a free classroom? Click "Claim Room" on any free room to track it here and alert your squad.
            </p>
          </div>
        </div>

        {onFindRoomClick && (
          <button
            onClick={onFindRoomClick}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 whitespace-nowrap cursor-pointer"
          >
            Find a Free Room Now
          </button>
        )}
      </div>
    );
  }

  const { room, availableUntil, freeDurationMinutes, secondsUntilNextEvent } = claimedRoomInfo;

  // Live countdown
  const [secondsRemaining, setSecondsRemaining] = useState<number>(secondsUntilNextEvent);

  useEffect(() => {
    setSecondsRemaining(secondsUntilNextEvent);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsUntilNextEvent, room.id]);

  const handleShareSquad = () => {
    const url = generateSquadWhatsAppUrl(
      room.roomNumber,
      room.floorName,
      availableUntil,
      freeDurationMinutes
    );
    window.open(url, '_blank');
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-500/50 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              CURRENTLY MARKED FOR YOU
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-3">
            {room.roomNumber}
            <span className="text-xs font-mono font-normal text-slate-400">
              ({room.floorName} · {room.name})
            </span>
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono mt-2 text-slate-300">
            <span>
              Available until: <strong className="text-emerald-400">{availableUntil}</strong>
            </span>
            <span>·</span>
            <span>
              Type: <strong>{room.isAc ? '❄️ AC' : 'Non-AC'}</strong> ({room.capacity} seats)
            </span>
          </div>
        </div>

        {/* Countdown & Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-wider">
              Time Remaining
            </span>
            <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
              {formatCountdownTimer(secondsRemaining)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareSquad}
              className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Call the Squad</span>
            </button>

            <button
              onClick={() => onViewDetails(claimedRoomInfo)}
              className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Details
            </button>

            <button
              onClick={onReleaseClaim}
              title="Release room claim"
              className="p-3 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 border border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
