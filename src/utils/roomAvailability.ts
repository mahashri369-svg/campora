import {
  Room,
  RoomAvailabilityInfo,
  RoomClassScheduleEntry,
  RoomFilterParams,
  RoomTimelineSlot,
  RoomStatusType,
  DayOfWeek,
} from '../types';
import {
  ROOMS_METADATA,
  PERIOD_SLOTS,
  MASTER_ROOM_OCCUPANCY_SCHEDULE,
} from '../data/roomsData';

/**
 * Returns the day of the week as DayOfWeek for a Date object.
 */
export function getDayName(date: Date): DayOfWeek {
  const days: DayOfWeek[] = ['Sunday' as any, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' as any];
  return days[date.getDay()];
}

/**
 * Converts "HH:MM" (24-hour) string to minutes from midnight.
 */
export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

/**
 * Converts minutes from midnight to 12-hour formatted string like "02:30 PM".
 */
export function minutesToTimeString12(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, totalMinutes));
  let hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  const mPad = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mPad} ${ampm}`;
}

/**
 * Formats duration in minutes to human readable string like "1h 42m" or "45m".
 */
export function formatDurationHuman(minutes: number): string {
  if (minutes <= 0) return '0m';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

/**
 * Formats seconds into HH:MM:SS timer format.
 */
export function formatCountdownTimer(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const hStr = h < 10 ? `0${h}` : `${h}`;
  const mStr = m < 10 ? `0${m}` : `${m}`;
  const sStr = s < 10 ? `0${s}` : `${s}`;
  return `${hStr}:${mStr}:${sStr}`;
}

/**
 * Evaluates real-time availability for a single room at a target time & day.
 */
export function getRoomAvailability(
  room: Room,
  targetDate: Date,
  timeStr: string // "HH:MM" 24h
): RoomAvailabilityInfo {
  const dayName = getDayName(targetDate);
  const currentMinutes = timeStringToMinutes(timeStr);

  const allScheduledEntries = MASTER_ROOM_OCCUPANCY_SCHEDULE.get(room.id) || [];
  const todayEntries = allScheduledEntries.filter((e) => e.day === dayName);

  // Build 9-period timeline for the room today
  const timeline: RoomTimelineSlot[] = PERIOD_SLOTS.map((slot) => {
    const entry = todayEntries.find((e) => e.period === slot.period);
    return {
      period: slot.period,
      timeRange: slot.label,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isOccupied: Boolean(entry),
      subjectName: entry?.subjectName,
      subjectCode: entry?.subjectCode,
      sectionName: entry?.sectionName,
      faculty: entry?.faculty,
    };
  });

  // College operating hours: 09:00 (540m) to 17:05 (1025m)
  const collegeStartMin = timeStringToMinutes('09:00');
  const collegeEndMin = timeStringToMinutes('17:05');

  // Weekend check: if Saturday or Sunday, no classes scheduled
  if (dayName === ('Saturday' as any) || dayName === ('Sunday' as any)) {
    return {
      room,
      status: 'FREE',
      isFree: true,
      availableUntil: 'Weekend Free',
      freeDurationMinutes: 8 * 60,
      secondsUntilNextEvent: 8 * 3600,
      timeline,
    };
  }

  // Find if currently inside any occupied period
  let currentOccupiedEntry: RoomClassScheduleEntry | undefined = undefined;
  for (const entry of todayEntries) {
    const startMin = timeStringToMinutes(entry.startTime);
    const endMin = timeStringToMinutes(entry.endTime);
    if (currentMinutes >= startMin && currentMinutes < endMin) {
      currentOccupiedEntry = entry;
      break;
    }
  }

  if (currentOccupiedEntry) {
    // Room is currently OCCUPIED
    const classEndMin = timeStringToMinutes(currentOccupiedEntry.endTime);
    const remainingInClassMin = Math.max(0, classEndMin - currentMinutes);
    const secondsLeft = remainingInClassMin * 60;

    const isEndingSoon = remainingInClassMin <= 15;
    const status: RoomStatusType = isEndingSoon ? 'ENDING_SOON' : 'OCCUPIED';

    return {
      room,
      status,
      isFree: false,
      currentClass: currentOccupiedEntry,
      availableUntil: minutesToTimeString12(classEndMin),
      freeDurationMinutes: 0,
      secondsUntilNextEvent: secondsLeft,
      timeline,
    };
  }

  // Room is currently FREE!
  // Find next class scheduled today strictly after currentMinutes
  const futureEntriesToday = todayEntries
    .filter((e) => timeStringToMinutes(e.startTime) > currentMinutes)
    .sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));

  const nextClass = futureEntriesToday[0];

  let freeUntilMin = collegeEndMin;
  let availableUntilStr = 'End of Day (05:05 PM)';

  if (nextClass) {
    freeUntilMin = timeStringToMinutes(nextClass.startTime);
    availableUntilStr = minutesToTimeString12(freeUntilMin);
  } else if (currentMinutes >= collegeEndMin) {
    availableUntilStr = 'Closed for the Night';
    freeUntilMin = currentMinutes;
  }

  const freeDurationMinutes = Math.max(0, freeUntilMin - Math.max(collegeStartMin, currentMinutes));
  const secondsLeft = freeDurationMinutes * 60;

  // If next class starts in 15 minutes or less, mark ENDING_SOON
  const isEndingSoon = nextClass && freeDurationMinutes <= 15;
  const status: RoomStatusType = isEndingSoon ? 'ENDING_SOON' : 'FREE';

  return {
    room,
    status,
    isFree: true,
    nextClass,
    availableUntil: availableUntilStr,
    freeDurationMinutes,
    secondsUntilNextEvent: secondsLeft,
    timeline,
  };
}

/**
 * Duration-aware filter: Checks if a room remains free for the ENTIRE duration.
 */
export function isRoomFreeForDuration(
  availability: RoomAvailabilityInfo,
  requestedDurationMinutes: number
): boolean {
  if (!availability.isFree) return false;
  if (requestedDurationMinutes <= 0) return true;
  return availability.freeDurationMinutes >= requestedDurationMinutes;
}

/**
 * Filter and search rooms based on traditional filters and query.
 */
export function filterRooms(
  roomsList: Room[],
  filterParams: RoomFilterParams,
  targetDate: Date,
  timeStr: string
): RoomAvailabilityInfo[] {
  const { floor, availability, durationMinutes, isAc, minCapacity, searchQuery } = filterParams;
  const query = searchQuery.trim().toLowerCase();

  return roomsList
    .map((room) => getRoomAvailability(room, targetDate, timeStr))
    .filter((avail) => {
      const room = avail.room;

      // Floor filter
      if (floor !== 'all' && room.floor !== floor) {
        return false;
      }

      // Availability filter
      if (availability === 'free' && !avail.isFree) {
        return false;
      }
      if (availability === 'occupied' && avail.isFree) {
        return false;
      }

      // Duration-aware filter
      if (durationMinutes > 0 && !isRoomFreeForDuration(avail, durationMinutes)) {
        return false;
      }

      // AC filter
      if (isAc !== null && room.isAc !== isAc) {
        return false;
      }

      // Capacity filter
      if (minCapacity > 0 && room.capacity < minCapacity) {
        return false;
      }

      // Search keyword filter
      if (query) {
        const matchRoomNumber = room.roomNumber.toLowerCase().includes(query);
        const matchName = room.name.toLowerCase().includes(query);
        const matchFloor = room.floorName.toLowerCase().includes(query);
        const matchType = room.type.toLowerCase().includes(query);
        const matchFacility = room.facilities.some((f) => f.toLowerCase().includes(query));
        if (!matchRoomNumber && !matchName && !matchFloor && !matchType && !matchFacility) {
          return false;
        }
      }

      return true;
    });
}

/**
 * Pre-filled WhatsApp Share URL generator for "Call the Squad" feature.
 */
export function generateSquadWhatsAppUrl(
  roomNumber: string,
  floorName: string,
  availableUntil: string,
  freeDurationMinutes: number
): string {
  const durationText = formatDurationHuman(freeDurationMinutes);
  const message = `📍 Heading to ${roomNumber} (${floorName}). It's free until ${availableUntil} (available for ${durationText}). Come fast!`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

/**
 * Local keyword-based parser fallback for natural language requests.
 */
export function parseNaturalLanguageQueryLocal(query: string) {
  const q = query.toLowerCase();

  // Floor extraction
  let floor: number | null = null;
  if (q.includes('ground') || q.includes('gf') || q.includes('floor 0')) floor = 0;
  else if (q.includes('first') || q.includes('1st') || q.includes('floor 1')) floor = 1;
  else if (q.includes('second') || q.includes('2nd') || q.includes('floor 2')) floor = 2;
  else if (q.includes('third') || q.includes('3rd') || q.includes('floor 3')) floor = 3;
  else if (q.includes('fourth') || q.includes('4th') || q.includes('floor 4')) floor = 4;
  else if (q.includes('fifth') || q.includes('5th') || q.includes('floor 5')) floor = 5;
  else if (q.includes('sixth') || q.includes('6th') || q.includes('floor 6')) floor = 6;
  else if (q.includes('seventh') || q.includes('7th') || q.includes('floor 7')) floor = 7;

  // AC requirement
  let ac_required: boolean | null = null;
  if (q.includes('ac') || q.includes('air condition') || q.includes('air-condition')) {
    if (q.includes('non-ac') || q.includes('non ac') || q.includes('without ac')) {
      ac_required = false;
    } else {
      ac_required = true;
    }
  }

  // Duration in minutes
  let duration_minutes: number | null = null;
  if (q.includes('30 min') || q.includes('half an hour') || q.includes('half hour')) {
    duration_minutes = 30;
  } else if (q.includes('1 hour') || q.includes('one hour') || q.includes('60 min')) {
    duration_minutes = 60;
  } else if (q.includes('90 min') || q.includes('1.5 hour') || q.includes('1 and half hour')) {
    duration_minutes = 90;
  } else if (q.includes('2 hour') || q.includes('two hour') || q.includes('120 min')) {
    duration_minutes = 120;
  } else if (q.includes('3 hour') || q.includes('three hour') || q.includes('180 min')) {
    duration_minutes = 180;
  }

  // Capacity extraction
  let min_capacity: number | null = null;
  const peopleMatch = q.match(/(\d+)\s*(people|students|members|squad|team|guys)/);
  if (peopleMatch && peopleMatch[1]) {
    min_capacity = parseInt(peopleMatch[1], 10);
  } else if (q.includes('team') || q.includes('squad')) {
    min_capacity = 6;
  }

  return {
    floor,
    ac_required,
    duration_minutes,
    min_capacity,
    raw_query: query,
  };
}
