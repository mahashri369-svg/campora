import React, { useState } from 'react';
import {
  Layers,
  ChevronDown,
  ChevronUp,
  Building,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { RoomAvailabilityInfo } from '../../types';
import { BUILDING_FLOORS } from '../../data/roomsData';
import { RoomCard } from './RoomCard';

interface FloorGridProps {
  roomsAvailability: RoomAvailabilityInfo[];
  onViewDetails: (info: RoomAvailabilityInfo) => void;
  onClaimRoom?: (info: RoomAvailabilityInfo) => void;
  claimedRoomId?: string | null;
  activeFloorFilter?: number | 'all';
}

export const FloorGrid: React.FC<FloorGridProps> = ({
  roomsAvailability,
  onViewDetails,
  onClaimRoom,
  claimedRoomId,
  activeFloorFilter = 'all',
}) => {
  // Track collapsed state per floor (all expanded by default)
  const [collapsedFloors, setCollapsedFloors] = useState<Record<number, boolean>>({});

  const toggleFloor = (floorNum: number) => {
    setCollapsedFloors((prev) => ({
      ...prev,
      [floorNum]: !prev[floorNum],
    }));
  };

  // Group rooms by floor
  const floorsToDisplay = BUILDING_FLOORS.filter(
    (f) => activeFloorFilter === 'all' || f.floor === activeFloorFilter
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {floorsToDisplay.map((floor) => {
        const roomsOnThisFloor = roomsAvailability.filter(
          (r) => r.room.floor === floor.floor
        );
        const freeCount = roomsOnThisFloor.filter((r) => r.isFree).length;
        const busyCount = roomsOnThisFloor.filter((r) => !r.isFree).length;
        const isCollapsed = Boolean(collapsedFloors[floor.floor]);

        if (roomsOnThisFloor.length === 0) {
          return null;
        }

        return (
          <div
            key={floor.floor}
            className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-lg shadow-black/20"
          >
            {/* Floor Header Bar */}
            <div
              onClick={() => toggleFloor(floor.floor)}
              className="p-4 sm:p-5 bg-slate-950/80 hover:bg-slate-900 border-b border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold font-mono text-sm">
                  {floor.shortName}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    {floor.name}
                    <span className="text-xs font-mono font-medium text-slate-500">
                      ({roomsOnThisFloor.length} {roomsOnThisFloor.length === 1 ? 'room' : 'rooms'})
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono mt-0.5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      {freeCount} Free
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {busyCount} Occupied
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Room Cards Grid */}
            {!isCollapsed && (
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {roomsOnThisFloor.map((info) => (
                    <RoomCard
                      key={info.room.id}
                      info={info}
                      onViewDetails={onViewDetails}
                      onClaimRoom={onClaimRoom}
                      isClaimedByCurrentUser={claimedRoomId === info.room.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
