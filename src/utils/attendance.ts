import {
  Section,
  SubjectInfo,
  ScheduledClassOccurrence,
  DetentionStatus,
  CalculationResult,
  AttendancePlanStep,
  DayOfWeek,
} from '../types';
import { SEMESTER_CONFIG } from '../data/timetableData';

export const DAY_NAMES: DayOfWeek[] = ['Sunday' as any, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' as any];

/**
 * Returns DayOfWeek from YYYY-MM-DD date string
 */
export function getDayOfWeek(dateStr: string): DayOfWeek {
  const d = parseLocalDate(dateStr);
  return DAY_NAMES[d.getDay()];
}

/**
 * Parses YYYY-MM-DD string into a local Date object (ignoring timezone drift)
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // Midday to prevent DST/timezone shifting
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats date into readable string, e.g., "Mon, 28 Sep 2026"
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Calculates current attendance percentage
 */
export function calculateAttendance(attended: number, conducted: number): number {
  if (conducted <= 0) return 100;
  return Number(((attended / conducted) * 100).toFixed(2));
}

/**
 * Calculates the maximum possible final attendance if student attends 100% of remaining classes
 */
export function calculateMaximumAttendance(attended: number, conducted: number, remaining: number): number {
  const totalFuture = conducted + remaining;
  if (totalFuture <= 0) return 100;
  return Number((((attended + remaining) / totalFuture) * 100).toFixed(2));
}

/**
 * Finds all scheduled occurrences for a specific subject between two dates (inclusive)
 * using the section's weekly timetable.
 */
export function getDetailedScheduledClasses(
  section: Section,
  subjectCode: string,
  startDateStr: string,
  endDateStr: string
): ScheduledClassOccurrence[] {
  const occurrences: ScheduledClassOccurrence[] = [];
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);

  if (start > end) {
    return occurrences;
  }

  // Map each day of week in section schedule to slots matching subjectCode
  const daySlotMap = new Map<DayOfWeek, { period: number; time: string; room?: string }[]>();
  for (const daySchedule of section.schedule) {
    const slotsForSubject = daySchedule.slots
      .filter((s) => s.subjectCode === subjectCode)
      .map((s) => ({ period: s.period, time: s.time, room: s.room }));
    if (slotsForSubject.length > 0) {
      daySlotMap.set(daySchedule.day, slotsForSubject);
    }
  }

  // Iterate date by date
  const current = new Date(start.getTime());
  while (current <= end) {
    const dayOfWeekIndex = current.getDay();
    const dayName = DAY_NAMES[dayOfWeekIndex];

    if (dayName && daySlotMap.has(dayName)) {
      const slots = daySlotMap.get(dayName)!;
      const dateString = formatLocalDate(current);
      for (const slot of slots) {
        occurrences.push({
          date: dateString,
          dayName,
          period: slot.period,
          time: slot.time,
          room: slot.room,
        });
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return occurrences;
}

/**
 * Finds all scheduled classes in date range (alias)
 */
export const calculateRemainingClassesInRange = getDetailedScheduledClasses;

/**
 * Returns the count of scheduled classes between two dates
 */
export function getScheduledClassesCount(
  section: Section,
  subjectCode: string,
  startDateStr: string,
  endDateStr: string
): number {
  const occurrences = getDetailedScheduledClasses(section, subjectCode, startDateStr, endDateStr);
  return occurrences.length;
}

/**
 * Calculates minimum required classes to reach target P
 * Formula: (A + x) / (T + R) >= P / 100
 * => x >= (P / 100) * (T + R) - A
 * Round UP to the next integer.
 */
export function calculateRequiredClasses(
  attended: number,
  conducted: number,
  remaining: number,
  targetPercentage: number
): { required: number; isPossible: boolean; target: number; message: string } {
  const totalClasses = conducted + remaining;

  if (totalClasses <= 0) {
    return {
      required: 0,
      isPossible: true,
      target: targetPercentage,
      message: 'No classes in schedule.',
    };
  }

  const targetRatio = targetPercentage / 100;
  const exactRequired = targetRatio * totalClasses - attended;
  const requiredCount = Math.max(0, Math.ceil(exactRequired));

  if (requiredCount > remaining) {
    return {
      required: requiredCount,
      isPossible: false,
      target: targetPercentage,
      message: `${targetPercentage}% cannot be reached with the remaining ${remaining} classes.`,
    };
  }

  if (requiredCount === 0) {
    return {
      required: 0,
      isPossible: true,
      target: targetPercentage,
      message: `Already secure for ${targetPercentage}% even with 0 more classes attended.`,
    };
  }

  return {
    required: requiredCount,
    isPossible: true,
    target: targetPercentage,
    message: `Need to attend ${requiredCount} of the remaining ${remaining} classes to achieve ≥${targetPercentage}%.`,
  };
}

/**
 * Checks for irreversible detention (< 75% even if attending all remaining classes)
 */
export function checkIrreversibleDetention(
  attended: number,
  conducted: number,
  remaining: number
): boolean {
  const maxPossible = calculateMaximumAttendance(attended, conducted, remaining);
  return maxPossible < 75;
}

/**
 * Builds dynamic timeline steps for the Attendance Plan
 */
export function generateAttendancePlanSteps(
  attended: number,
  conducted: number,
  remainingClasses: number,
  required75: number,
  required90: number,
  isPossible75: boolean,
  isPossible90: boolean
): AttendancePlanStep[] {
  const steps: AttendancePlanStep[] = [];
  const currentPct = calculateAttendance(attended, conducted);

  // Step 1: Starting point
  steps.push({
    title: 'Current Attendance Status',
    description: `You have attended ${attended} out of ${conducted} conducted classes so far.`,
    classesAttendedCumulative: attended,
    totalConductedCumulative: conducted,
    projectedPercentage: currentPct,
    badge: 'Today',
  });

  if (remainingClasses === 0) {
    steps.push({
      title: 'Semester Concluded',
      description: `No remaining classes left in the schedule. Final attendance stands at ${currentPct}%.`,
      classesAttendedCumulative: attended,
      totalConductedCumulative: conducted,
      projectedPercentage: currentPct,
      badge: 'Final',
    });
    return steps;
  }

  if (!isPossible75) {
    // Irreversible detention steps
    const maxPct = calculateMaximumAttendance(attended, conducted, remainingClasses);
    steps.push({
      title: 'Detention Limit Unreachable',
      description: `Attending all remaining ${remainingClasses} classes only yields ${maxPct}%, which is below the mandatory 75% threshold.`,
      classesAttendedCumulative: attended + remainingClasses,
      totalConductedCumulative: conducted + remainingClasses,
      projectedPercentage: maxPct,
      badge: 'Irreversible',
    });
    return steps;
  }

  // Step 2: Milestone for 75%
  if (required75 > 0) {
    const after75Attended = attended + required75;
    const after75Conducted = conducted + required75;
    const pctAt75 = calculateAttendance(after75Attended, after75Conducted);

    steps.push({
      title: 'Detention Immunity Milestone',
      description: `Attend the next ${required75} scheduled classes to cross the 75% danger zone.`,
      classesAttendedCumulative: after75Attended,
      totalConductedCumulative: after75Conducted,
      projectedPercentage: pctAt75,
      badge: '75% Safe',
    });
  } else {
    steps.push({
      title: 'Detention Safe Baseline',
      description: `Your attendance is already safe above 75%. Maintain regular presence.`,
      classesAttendedCumulative: attended,
      totalConductedCumulative: conducted,
      projectedPercentage: currentPct,
      badge: 'Safe Zone',
    });
  }

  // Step 3: Milestone for 90% or Next goal
  if (isPossible90) {
    if (required90 > required75) {
      const additionalFor90 = required90 - required75;
      const after90Attended = attended + required90;
      const after90Conducted = conducted + required90;
      const pctAt90 = calculateAttendance(after90Attended, after90Conducted);

      steps.push({
        title: '90% Honor Attendance Goal',
        description: `Attend ${additionalFor90} additional classes (${required90} total) to reach or exceed 90%.`,
        classesAttendedCumulative: after90Attended,
        totalConductedCumulative: after90Conducted,
        projectedPercentage: pctAt90,
        badge: '90% Goal',
      });
    } else if (required90 === 0) {
      steps.push({
        title: '90% Goal Already Maintained',
        description: `Currently operating at elite attendance. You have a cushion to comfortably manage absences.`,
        classesAttendedCumulative: attended,
        totalConductedCumulative: conducted,
        projectedPercentage: currentPct,
        badge: '90%+',
      });
    }
  }

  // Step 4: Semester End projection
  const fullMaxPct = calculateMaximumAttendance(attended, conducted, remainingClasses);
  steps.push({
    title: 'Semester End Projection (29 Nov 2026)',
    description: `Maximum possible final attendance if you attend all remaining ${remainingClasses} classes is ${fullMaxPct}%.`,
    classesAttendedCumulative: attended + remainingClasses,
    totalConductedCumulative: conducted + remainingClasses,
    projectedPercentage: fullMaxPct,
    badge: 'Semester End',
  });

  return steps;
}

/**
 * Master calculation function combining section timetable, inputs, and date logic
 */
export function performAttendanceCalculation(
  section: Section,
  subject: SubjectInfo,
  conducted: number,
  attended: number,
  todayStr: string,
  planningDateStr: string
): CalculationResult {
  const currentPct = calculateAttendance(attended, conducted);

  // Determine effective range for remaining classes
  // The semester runs from 2026-08-29 to 2026-11-29
  const semesterStart = parseLocalDate(SEMESTER_CONFIG.startDate);
  const semesterEnd = parseLocalDate(SEMESTER_CONFIG.endDate);
  const userToday = parseLocalDate(todayStr);
  const userPlanning = parseLocalDate(planningDateStr);

  // Determine effective start date for future classes
  // If userToday < semesterStart, future classes start from semesterStart
  // If userToday >= semesterStart, future classes start from tomorrow (userToday + 1 day)
  let futureStartDate: Date;
  if (userToday < semesterStart) {
    futureStartDate = new Date(semesterStart.getTime());
  } else {
    futureStartDate = new Date(userToday.getTime());
    futureStartDate.setDate(futureStartDate.getDate() + 1);
  }

  // Bounded end dates
  const effectivePlanningEnd = userPlanning > semesterEnd ? semesterEnd : userPlanning;
  const effectiveSemesterEnd = semesterEnd;

  const futureStartStr = formatLocalDate(futureStartDate);
  const planningEndStr = formatLocalDate(effectivePlanningEnd);
  const semesterEndStr = formatLocalDate(effectiveSemesterEnd);

  // If futureStart is already past planning date, remaining to planning date is 0
  const remainingToPlanning = futureStartDate > effectivePlanningEnd
    ? 0
    : getScheduledClassesCount(section, subject.code, futureStartStr, planningEndStr);

  // Total remaining classes for the entire semester
  const remainingTotalSemester = futureStartDate > effectiveSemesterEnd
    ? 0
    : getScheduledClassesCount(section, subject.code, futureStartStr, semesterEndStr);

  // Upcoming occurrences between futureStart and planning date (or next 15 occurrences)
  const upcomingOccurrences = getDetailedScheduledClasses(
    section,
    subject.code,
    futureStartStr,
    effectiveSemesterEnd >= effectivePlanningEnd ? planningEndStr : semesterEndStr
  ).slice(0, 20);

  // Calculations are based on remaining classes for the semester
  const safeReq = calculateRequiredClasses(attended, conducted, remainingTotalSemester, 75);
  const goalReq = calculateRequiredClasses(attended, conducted, remainingTotalSemester, 90);
  const maxPossible = calculateMaximumAttendance(attended, conducted, remainingTotalSemester);

  // Determine status and messaging
  let status: DetentionStatus = 'SAFE';
  let statusLabel = 'SAFE';
  let statusDescription = `You can stay above the detention limit. You need to attend ${safeReq.required} of the remaining ${remainingTotalSemester} classes.`;
  let statusTone: 'danger' | 'warning' | 'success' | 'info' = 'success';

  if (userToday > semesterEnd) {
    status = 'SEMESTER_ENDED';
    statusLabel = 'SEMESTER ENDED';
    statusDescription = `The semester concluded on ${SEMESTER_CONFIG.endDate}. Final attendance is ${currentPct}%.`;
    statusTone = 'info';
  } else if (!safeReq.isPossible || maxPossible < 75) {
    status = 'IRREVERSIBLE_DETENTION';
    statusLabel = '🚨 IRREVERSIBLE DETENTION';
    statusDescription = 'Even if you attend every remaining class, your attendance cannot reach 75% before the semester ends.';
    statusTone = 'danger';
  } else if (currentPct < 75) {
    status = 'RECOVERABLE_WARNING';
    statusLabel = '⚠️ DETENTION RISK (RECOVERABLE)';
    statusDescription = `You are currently below 75%, but recovery is still possible. You must attend at least ${safeReq.required} of the remaining ${remainingTotalSemester} classes.`;
    statusTone = 'warning';
  } else if (currentPct === 75) {
    status = 'BORDERLINE_75';
    statusLabel = '⚠️ AT DETENTION LIMIT (75%)';
    statusDescription = `You are currently right at the 75% detention limit. Attend upcoming classes to stay safe.`;
    statusTone = 'warning';
  } else if (currentPct >= 90) {
    status = 'GOAL_ACHIEVED';
    statusLabel = '🌟 90% TARGET ACHIEVED';
    statusDescription = `90% target already achieved! You need ${safeReq.required} classes to maintain >75% and ${goalReq.required} to finish with ≥90%.`;
    statusTone = 'success';
  }

  const planSteps = generateAttendancePlanSteps(
    attended,
    conducted,
    remainingTotalSemester,
    safeReq.required,
    goalReq.required,
    safeReq.isPossible,
    goalReq.isPossible
  );

  return {
    section,
    subject,
    conducted,
    attended,
    currentPercentage: currentPct,
    remainingClassesToPlanningDate: remainingToPlanning,
    remainingClassesTotalSemester: remainingTotalSemester,
    safeTarget: {
      targetPercentage: 75,
      requiredClasses: safeReq.required,
      isPossible: safeReq.isPossible,
      message: safeReq.message,
    },
    goalTarget: {
      targetPercentage: 90,
      requiredClasses: goalReq.required,
      isPossible: goalReq.isPossible,
      message: goalReq.message,
    },
    maxPossiblePercentage: maxPossible,
    status,
    statusLabel,
    statusDescription,
    statusTone,
    planSteps,
    upcomingOccurrences,
    effectiveTodayStr: todayStr,
    planningDateStr,
  };
}
