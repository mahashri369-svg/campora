export interface TimeSlot {
  period: number;
  time: string;
  subjectCode: string;
  subjectName: string;
  slot?: string;
  faculty?: string;
  room?: string;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface SectionDaySchedule {
  day: DayOfWeek;
  slots: TimeSlot[];
}

export interface SubjectInfo {
  code: string;
  name: string;
  slot?: string;
  credits?: string;
  faculty?: string;
  department?: string;
  weeklyClassesCount: number;
}

export interface Section {
  id: string;
  name: string;
  year: string;
  semester: string;
  department: string;
  venue?: string;
  workingDays: DayOfWeek[];
  subjects: SubjectInfo[];
  schedule: SectionDaySchedule[];
}

export interface AttendanceInput {
  sectionId: string;
  subjectCode: string;
  conductedClasses: number;
  attendedClasses: number;
  currentDateStr: string; // YYYY-MM-DD
  planningDateStr: string; // YYYY-MM-DD
}

export type DetentionStatus = 
  | 'IRREVERSIBLE_DETENTION' 
  | 'RECOVERABLE_WARNING' 
  | 'BORDERLINE_75' 
  | 'SAFE' 
  | 'GOAL_ACHIEVED' 
  | 'SEMESTER_ENDED';

export interface TargetRequirement {
  targetPercentage: number;
  requiredClasses: number;
  isPossible: boolean;
  message: string;
}

export interface ScheduledClassOccurrence {
  date: string; // YYYY-MM-DD
  dayName: DayOfWeek;
  period: number;
  time: string;
  room?: string;
}

export interface AttendancePlanStep {
  title: string;
  description: string;
  classesAttendedCumulative: number;
  totalConductedCumulative: number;
  projectedPercentage: number;
  badge?: string;
}

export interface CalculationResult {
  section: Section;
  subject: SubjectInfo;
  conducted: number;
  attended: number;
  currentPercentage: number;
  remainingClassesToPlanningDate: number;
  remainingClassesTotalSemester: number;
  safeTarget: TargetRequirement; // 75%
  goalTarget: TargetRequirement; // 90%
  maxPossiblePercentage: number;
  status: DetentionStatus;
  statusLabel: string;
  statusDescription: string;
  statusTone: 'danger' | 'warning' | 'success' | 'info';
  planSteps: AttendancePlanStep[];
  upcomingOccurrences: ScheduledClassOccurrence[];
  effectiveTodayStr: string;
  planningDateStr: string;
}

export interface MultiSubjectRow {
  subject: SubjectInfo;
  conducted: number;
  attended: number;
  currentPercentage: number;
  remainingClasses: number;
  neededFor75: number | 'Impossible';
  neededFor90: number | 'Impossible' | 'Achieved';
  maxPossible: number;
  status: DetentionStatus;
  statusTone: 'danger' | 'warning' | 'success' | 'info';
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  sectionId: string;
  rollNumber?: string;
  registerNumber?: string;
  phoneNumber?: string;
  subjectAttendance?: Record<string, { conducted: number; attended: number }>;
  simulatedOdCredits?: Record<string, number>;
  createdAt?: string;
  updatedAt?: string;
}

export interface OdSimulationSubjectResult {
  subject: SubjectInfo;
  currentConducted: number;
  currentAttended: number;
  currentPercentage: number;
  odCredits: number;
  simulatedAttended: number;
  simulatedPercentage: number;
  percentageGain: number;
  previousStatus: DetentionStatus;
  newStatus: DetentionStatus;
  savedFromDetention: boolean;
  reached90: boolean;
}

export interface AttendanceHealthSummary {
  overallPercentage: number;
  totalConducted: number;
  totalAttended: number;
  totalRemainingClasses: number;
  totalSubjects: number;
  above90Count: number;
  between75And90Count: number;
  below75Count: number;
  atRiskSubjects: string[];
}

export interface AdvisorMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: string;
}

// -------------------------------------------------------------
// ROUND 2: The Free Class Locator & Smart-Search Floor Manager
// -------------------------------------------------------------

export interface RoomClassScheduleEntry {
  day: DayOfWeek;
  period: number;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "09:50"
  subjectCode: string;
  subjectName: string;
  sectionName: string;
  faculty?: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  floor: number;
  floorName: string;
  isAc: boolean;
  capacity: number;
  type: 'Classroom' | 'Gallery Hall' | 'Laboratory' | 'Workshop' | 'Seminar Hall';
  facilities: string[];
  building: string;
  gridCoordinates?: { x: number; z: number; width: number; depth: number };
}

export type RoomStatusType = 'FREE' | 'OCCUPIED' | 'ENDING_SOON';

export interface RoomTimelineSlot {
  period: number;
  timeRange: string;
  startTime: string;
  endTime: string;
  isOccupied: boolean;
  subjectName?: string;
  subjectCode?: string;
  sectionName?: string;
  faculty?: string;
}

export interface RoomAvailabilityInfo {
  room: Room;
  status: RoomStatusType;
  isFree: boolean;
  currentClass?: RoomClassScheduleEntry;
  nextClass?: RoomClassScheduleEntry;
  availableUntil: string;
  availableUntilPeriod?: number;
  freeDurationMinutes: number;
  secondsUntilNextEvent: number;
  timeline: RoomTimelineSlot[];
}

export interface RoomFilterParams {
  floor: number | 'all';
  availability: 'all' | 'free' | 'occupied';
  durationMinutes: number; // 0 = any, 30, 60, 120, 180
  isAc: boolean | null; // null = all, true = AC, false = Non-AC
  minCapacity: number; // 0 = any
  searchQuery: string;
}

export interface AiSearchParsedQuery {
  floor?: number | null;
  ac_required?: boolean | null;
  min_capacity?: number | null;
  duration_minutes?: number | null;
  target_time?: string | null;
  room_type?: string | null;
  raw_query: string;
}

export interface ClaimedRoomRecord {
  roomId: string;
  roomNumber: string;
  floorName: string;
  claimedAt: string;
  availableUntil: string;
  studentEmail: string;
  studentName: string;
}

