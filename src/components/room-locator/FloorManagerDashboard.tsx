import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Building2,
  CheckCircle2,
  XCircle,
  Filter,
  Sparkles,
  Layers,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Compass,
  Wind,
  Users,
  BookmarkCheck,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  Room,
  RoomAvailabilityInfo,
  RoomFilterParams,
  StudentProfile,
} from '../../types';
import {
  ROOMS_METADATA,
  BUILDING_FLOORS,
  PERIOD_SLOTS,
} from '../../data/roomsData';
import {
  getRoomAvailability,
  filterRooms,
  minutesToTimeString12,
  timeStringToMinutes,
  getDayName,
} from '../../utils/roomAvailability';
import { FloorGrid } from './FloorGrid';
import { BuildingMap3D } from './BuildingMap3D';
import { AiRoomFinder } from './AiRoomFinder';
import { RoomDetailsModal } from './RoomDetailsModal';
import { MyClaimedRoomCard } from './MyClaimedRoomCard';

interface FloorManagerDashboardProps {
  currentStudent: StudentProfile;
}

const STORAGE_KEY_CLAIMED_ROOM = 'free_class_locator_claimed_room_v1';

export const FloorManagerDashboard: React.FC<FloorManagerDashboardProps> = ({
  currentStudent,
}) => {
  // Active view: 'grid' | '3d' | 'ai'
  const [activeView, setActiveView] = useState<'grid' | '3d' | 'ai'>('grid');

  // Real-time clock state
  const [now, setNow] = useState<Date>(new Date());
  const [isSimulatorMode, setIsSimulatorMode] = useState<boolean>(false);
  const [simulatedTimeStr, setSimulatedTimeStr] = useState<string>('10:45'); // Default daytime college period
  const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState<string>(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  // Live second-by-second clock updater
  useEffect(() => {
    if (isSimulatorMode) return;
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isSimulatorMode]);

  // Derive target time "HH:MM"
  const effectiveTimeStr = useMemo(() => {
    if (isSimulatorMode) return simulatedTimeStr;
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }, [isSimulatorMode, simulatedTimeStr, now]);

  const effectiveDate = useMemo(() => {
    return isSimulatorMode ? new Date('2026-09-28T12:00:00') : now;
  }, [isSimulatorMode, now]);

  // Selected room for detailed modal
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<RoomAvailabilityInfo | null>(null);

  // Claimed room tracking (stored per user email in localStorage)
  const [claimedRoomId, setClaimedRoomId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_CLAIMED_ROOM}_${currentStudent.email}`);
      return saved || null;
    } catch (e) {
      return null;
    }
  });

  // Traditional Filters State
  const [filters, setFilters] = useState<RoomFilterParams>({
    floor: 'all',
    availability: 'all',
    durationMinutes: 0,
    isAc: null,
    minCapacity: 0,
    searchQuery: '',
  });

  // Calculate live availability for all rooms
  const allRoomsAvailability = useMemo(() => {
    return ROOMS_METADATA.map((room) =>
      getRoomAvailability(room, effectiveDate, effectiveTimeStr)
    );
  }, [effectiveDate, effectiveTimeStr]);

  // Filtered rooms based on user criteria
  const filteredRoomsAvailability = useMemo(() => {
    return filterRooms(ROOMS_METADATA, filters, effectiveDate, effectiveTimeStr);
  }, [filters, effectiveDate, effectiveTimeStr]);

  // Dashboard Summary Metrics
  const totalRoomsCount = ROOMS_METADATA.length;
  const availableRoomsCount = allRoomsAvailability.filter((r) => r.isFree).length;
  const occupiedRoomsCount = allRoomsAvailability.filter((r) => !r.isFree).length;
  const totalFloorsCount = BUILDING_FLOORS.length;

  // Claimed room info
  const claimedRoomInfo = useMemo(() => {
    if (!claimedRoomId) return null;
    return allRoomsAvailability.find((r) => r.room.id === claimedRoomId) || null;
  }, [claimedRoomId, allRoomsAvailability]);

  const handleClaimRoom = (info: RoomAvailabilityInfo) => {
    if (claimedRoomId === info.room.id) {
      // Release
      setClaimedRoomId(null);
      localStorage.removeItem(`${STORAGE_KEY_CLAIMED_ROOM}_${currentStudent.email}`);
    } else {
      // Claim
      setClaimedRoomId(info.room.id);
      localStorage.setItem(`${STORAGE_KEY_CLAIMED_ROOM}_${currentStudent.email}`, info.room.id);
    }
  };

  const handleCheckAvailabilityNow = () => {
    setIsSimulatorMode(false);
    setNow(new Date());
    setLastCheckedTimestamp(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. Master Live Status & Clock Bar */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-semibold text-emerald-400">
                LIVE TIMETABLE RADAR ACTIVE
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-mono text-slate-400">
                SRM IST Academic Block
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Campora <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-300">Class Locator</span>
              <span className="text-xs font-mono font-medium px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                VibeCraft Round 2
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Find empty classrooms in real-time, inspect availability durations, navigate the 3D campus floor plan, and call the squad.
            </p>
          </div>

          {/* Current Date, Time & Availability Ticker */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800 shrink-0">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase text-slate-500">
                {isSimulatorMode ? 'Simulated Period Time' : 'Current Time (Live)'}
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>
                  {minutesToTimeString12(timeStringToMinutes(effectiveTimeStr))}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {getDayName(effectiveDate)} · Checked at {lastCheckedTimestamp}
              </span>
            </div>

            <div className="flex flex-col gap-1 border-l border-slate-800 pl-3">
              <button
                onClick={handleCheckAvailabilityNow}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Check Now</span>
              </button>

              <button
                onClick={() => setIsSimulatorMode(!isSimulatorMode)}
                className={`px-3 py-1 text-[11px] font-mono rounded-lg transition-colors cursor-pointer text-center ${
                  isSimulatorMode
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                }`}
              >
                {isSimulatorMode ? 'Exit Sim Mode' : 'Test Other Times'}
              </button>
            </div>
          </div>
        </div>

        {/* Time Simulator Dropdown (visible when testing custom period) */}
        {isSimulatorMode && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs animate-fade-in">
            <span className="text-amber-400 font-bold font-mono">Simulate Period:</span>
            {PERIOD_SLOTS.map((slot) => (
              <button
                key={slot.period}
                onClick={() => setSimulatedTimeStr(slot.startTime)}
                className={`px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
                  simulatedTimeStr === slot.startTime
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-300 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                P{slot.period} ({slot.startTime})
              </button>
            ))}
          </div>
        )}

        {/* 4 Dashboard Quick Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Total Rooms</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white mt-0.5 block">
                {totalRoomsCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900 text-slate-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-emerald-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-emerald-400 block">Available Now</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
                {availableRoomsCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-rose-900/40 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-rose-400 block">Occupied Now</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-400 mt-0.5 block">
                {occupiedRoomsCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Campus Floors</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-indigo-300 mt-0.5 block">
                {totalFloorsCount} Floors
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. My Claimed Room Banner (if any) */}
      <MyClaimedRoomCard
        claimedRoomInfo={claimedRoomInfo}
        onReleaseClaim={() => handleClaimRoom(claimedRoomInfo!)}
        onViewDetails={(info) => setSelectedRoomDetails(info)}
        onFindRoomClick={() => {
          setActiveView('grid');
          setFilters((prev) => ({ ...prev, availability: 'free' }));
        }}
      />

      {/* 3. Primary Mode Navigation Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveView('grid')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'grid'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Floor Grid View</span>
          </button>

          <button
            onClick={() => setActiveView('3d')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeView === '3d'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4 text-cyan-300" />
            <span>3D Campus Map</span>
            <span className="text-[10px] font-mono bg-indigo-500/30 text-indigo-200 px-1.5 py-0.5 rounded">
              Phase 2
            </span>
          </button>

          <button
            onClick={() => setActiveView('ai')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
              activeView === 'ai'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>AI Room Finder</span>
          </button>
        </div>

        {/* Quick Search filter input in header */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
            placeholder="Search room number, lab, floor..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* 4. Traditional Filters Bar (available on Grid & 3D views) */}
      {activeView !== 'ai' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              Traditional Search Filters
            </span>

            <button
              onClick={() =>
                setFilters({
                  floor: 'all',
                  availability: 'all',
                  durationMinutes: 0,
                  isAc: null,
                  minCapacity: 0,
                  searchQuery: '',
                })
              }
              className="text-slate-400 hover:text-white text-xs underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Filter 1: Floor Filter */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Floor Level
              </label>
              <select
                value={filters.floor}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    floor: e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Floors (Ground – 7th)</option>
                {BUILDING_FLOORS.map((f) => (
                  <option key={f.floor} value={f.floor}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Availability */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Current Status
              </label>
              <select
                value={filters.availability}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    availability: e.target.value as 'all' | 'free' | 'occupied',
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All Rooms (Free & Busy)</option>
                <option value="free">🟢 Free Now Only</option>
                <option value="occupied">🔴 Occupied Now Only</option>
              </select>
            </div>

            {/* Filter 3: Duration-Aware Filter */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Continuous Free Duration
              </label>
              <select
                value={filters.durationMinutes}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    durationMinutes: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={0}>Any Duration</option>
                <option value={30}>≥ 30 Minutes Free</option>
                <option value={60}>≥ 1 Hour Free</option>
                <option value={120}>≥ 2 Hours Free</option>
                <option value={180}>≥ 3 Hours Free</option>
              </select>
            </div>

            {/* Filter 4: AC Requirement */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Room Climate
              </label>
              <select
                value={filters.isAc === null ? 'all' : filters.isAc ? 'ac' : 'non-ac'}
                onChange={(e) => {
                  const val = e.target.value;
                  setFilters({
                    ...filters,
                    isAc: val === 'all' ? null : val === 'ac',
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="all">All (AC & Non-AC)</option>
                <option value="ac">❄️ Air Conditioned Only</option>
                <option value="non-ac">Non-AC Only</option>
              </select>
            </div>

            {/* Filter 5: Seating Capacity */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Minimum Capacity
              </label>
              <select
                value={filters.minCapacity}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    minCapacity: parseInt(e.target.value, 10),
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value={0}>Any Group Size</option>
                <option value={15}>≥ 15 People</option>
                <option value={30}>≥ 30 People</option>
                <option value={50}>≥ 50 People</option>
                <option value={70}>≥ 70 People (Gallery)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 5. View Renderer */}
      {activeView === 'grid' && (
        <FloorGrid
          roomsAvailability={filteredRoomsAvailability}
          onViewDetails={(info) => setSelectedRoomDetails(info)}
          onClaimRoom={handleClaimRoom}
          claimedRoomId={claimedRoomId}
          activeFloorFilter={filters.floor}
        />
      )}

      {activeView === '3d' && (
        <BuildingMap3D
          roomsAvailability={filteredRoomsAvailability}
          onSelectRoom={(info) => setSelectedRoomDetails(info)}
          selectedRoomId={selectedRoomDetails?.room.id}
        />
      )}

      {activeView === 'ai' && (
        <AiRoomFinder
          roomsAvailability={allRoomsAvailability}
          onViewDetails={(info) => setSelectedRoomDetails(info)}
          onClaimRoom={handleClaimRoom}
          claimedRoomId={claimedRoomId}
          currentTimeStr={effectiveTimeStr}
        />
      )}

      {/* 6. Detailed Room Modal */}
      <RoomDetailsModal
        info={selectedRoomDetails}
        onClose={() => setSelectedRoomDetails(null)}
        onClaimRoom={handleClaimRoom}
        isClaimedByCurrentUser={
          Boolean(selectedRoomDetails && claimedRoomId === selectedRoomDetails.room.id)
        }
      />
    </div>
  );
};
