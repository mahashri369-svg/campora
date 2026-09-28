import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Clock,
  Wind,
  Users,
  Layers,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Lightbulb,
  History,
} from 'lucide-react';
import { RoomAvailabilityInfo, AiSearchParsedQuery } from '../../types';
import { RoomCard } from './RoomCard';
import { parseNaturalLanguageQueryLocal, isRoomFreeForDuration } from '../../utils/roomAvailability';

interface AiRoomFinderProps {
  roomsAvailability: RoomAvailabilityInfo[];
  onViewDetails: (info: RoomAvailabilityInfo) => void;
  onClaimRoom?: (info: RoomAvailabilityInfo) => void;
  claimedRoomId?: string | null;
  currentTimeStr: string;
}

const STORAGE_KEY_RECENT_SEARCHES = 'free_class_locator_recent_searches_v1';

export const AiRoomFinder: React.FC<AiRoomFinderProps> = ({
  roomsAvailability,
  onViewDetails,
  onClaimRoom,
  claimedRoomId,
  currentTimeStr,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeParsedQuery, setActiveParsedQuery] = useState<AiSearchParsedQuery | null>(null);
  const [matchingResults, setMatchingResults] = useState<RoomAvailabilityInfo[] | null>(null);

  // Recent Searches
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECENT_SEARCHES);
      return saved ? JSON.parse(saved) : [
        'I need an AC room on the ground floor for 2 hours',
        'Find me a free room for 1 hour',
        'I need a room on the second floor for 15 people',
      ];
    } catch (e) {
      return [];
    }
  });

  const saveRecentSearch = (query: string) => {
    try {
      const updated = [query, ...recentSearches.filter((q) => q !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(STORAGE_KEY_RECENT_SEARCHES, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }
  };

  const handleExecuteSearch = async (queryToRun?: string) => {
    const q = (queryToRun !== undefined ? queryToRun : searchQuery).trim();
    if (!q) return;

    setIsSearching(true);
    saveRecentSearch(q);

    let parsed: AiSearchParsedQuery;

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, currentTimeStr }),
      });
      const data = await res.json();
      parsed = data.parsed || parseNaturalLanguageQueryLocal(q);
    } catch (err) {
      console.warn('AI search backend error, using local parser fallback', err);
      parsed = parseNaturalLanguageQueryLocal(q);
    }

    setActiveParsedQuery(parsed);

    // Apply strict deterministic filter against actual timetable room availability
    const matches = roomsAvailability.filter((avail) => {
      const room = avail.room;

      // Must be free now
      if (!avail.isFree) return false;

      // Floor check
      if (parsed.floor !== null && parsed.floor !== undefined && room.floor !== parsed.floor) {
        return false;
      }

      // AC check
      if (parsed.ac_required !== null && parsed.ac_required !== undefined) {
        if (room.isAc !== parsed.ac_required) return false;
      }

      // Capacity check
      if (parsed.min_capacity && room.capacity < parsed.min_capacity) {
        return false;
      }

      // Duration-aware check (e.g. 2 hours)
      if (parsed.duration_minutes && parsed.duration_minutes > 0) {
        if (!isRoomFreeForDuration(avail, parsed.duration_minutes)) {
          return false;
        }
      }

      return true;
    });

    // Sort matching rooms by longest free duration
    matches.sort((a, b) => b.freeDurationMinutes - a.freeDurationMinutes);

    setMatchingResults(matches);
    setIsSearching(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveParsedQuery(null);
    setMatchingResults(null);
  };

  const samplePromptChips = [
    'I need an AC room on the ground floor for 2 hours',
    'Find me a free room for 1 hour',
    'I need a room on the second floor for 15 people',
    'Show me rooms free until 4 PM',
    'Quiet room on 5th floor for 90 minutes',
    'Room for 20 students with AC',
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Search Input Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-900 border border-indigo-900/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Natural-Language Room Finder</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Find the Exact Classroom You Need
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Type natural requests like floor, AC, team size, or duration. The AI extracts requirements and queries the timetable deterministically.
          </p>

          {/* Main Search Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleExecuteSearch();
            }}
            className="pt-2"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tell me what kind of room you need... e.g. I need an AC room on the ground floor for 2 hours"
                disabled={isSearching}
                className="w-full px-5 py-4 pl-12 pr-28 rounded-2xl bg-slate-950 border border-slate-700/80 hover:border-indigo-500/60 focus:border-indigo-500 text-white text-xs sm:text-sm placeholder:text-slate-500 shadow-inner focus:outline-none transition-all"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />

              <div className="absolute right-2 flex items-center gap-1.5">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!searchQuery.trim() || isSearching}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  {isSearching ? (
                    <span>Searching...</span>
                  ) : (
                    <>
                      <span>Find Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Query Chips */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-[11px] text-slate-500 font-mono">Try asking:</span>
            {samplePromptChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSearchQuery(chip);
                  handleExecuteSearch(chip);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-indigo-600/20 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-300 text-[11px] transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
              <History className="w-3.5 h-3.5 text-slate-400" />
              <span>Recent:</span>
              <div className="flex flex-wrap items-center gap-2">
                {recentSearches.map((rec, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setSearchQuery(rec);
                      handleExecuteSearch(rec);
                    }}
                    className="hover:text-indigo-400 underline decoration-slate-700 transition-colors"
                  >
                    "{rec.length > 25 ? `${rec.slice(0, 25)}…` : rec}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Structured Parameters Pill Bar */}
      {activeParsedQuery && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 font-medium">Extracted Criteria:</span>
            {activeParsedQuery.floor !== null && activeParsedQuery.floor !== undefined ? (
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/40">
                Floor: {activeParsedQuery.floor === 0 ? 'Ground' : `${activeParsedQuery.floor}th Floor`}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                Floor: Any
              </span>
            )}

            {activeParsedQuery.ac_required !== null && activeParsedQuery.ac_required !== undefined ? (
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40">
                Type: {activeParsedQuery.ac_required ? 'AC Required' : 'Non-AC'}
              </span>
            ) : null}

            {activeParsedQuery.duration_minutes ? (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono border border-emerald-500/40">
                Duration: ≥{activeParsedQuery.duration_minutes} Minutes
              </span>
            ) : null}

            {activeParsedQuery.min_capacity ? (
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono border border-purple-500/40">
                Capacity: ≥{activeParsedQuery.min_capacity} Seats
              </span>
            ) : null}
          </div>

          <div className="font-mono text-slate-400">
            {matchingResults ? (
              <span className="font-bold text-white">
                {matchingResults.length} {matchingResults.length === 1 ? 'room matches' : 'rooms match'}
              </span>
            ) : null}
          </div>
        </div>
      )}

      {/* Results Display */}
      {matchingResults !== null && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Matching Free Rooms</span>
              <span className="text-xs font-mono font-medium text-slate-400">
                ({matchingResults.length} Available)
              </span>
            </h3>

            <button
              onClick={handleClearSearch}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset Search Results
            </button>
          </div>

          {matchingResults.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  No rooms match your requirements for this duration
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                  All classrooms matching these filters are currently occupied or scheduled for a class before your requested duration ends.
                </p>
              </div>

              {/* Suggestions Box */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-300">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Suggested Alternatives:</span>
                </div>
                <ul className="space-y-1 text-slate-400 ml-4 list-disc text-[11px]">
                  <li>Try selecting another floor (e.g., 5th or 6th floors have high availability).</li>
                  <li>Reduce the requested duration (e.g., from 2 hours to 1 hour).</li>
                  <li>Remove the AC requirement to unlock standard classrooms.</li>
                  <li>Reduce the minimum capacity requirement.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {matchingResults.map((info) => (
                <RoomCard
                  key={info.room.id}
                  info={info}
                  onViewDetails={onViewDetails}
                  onClaimRoom={onClaimRoom}
                  isClaimedByCurrentUser={claimedRoomId === info.room.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
