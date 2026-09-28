import { StudentProfile } from '../types';

const STORAGE_KEYS = {
  USERS_DB: 'attendance_predictor_registered_users_v2',
  ACTIVE_USER_EMAIL: 'attendance_predictor_active_user_email_v2',
};

/**
 * Retrieves the database of registered users from localStorage.
 * Keyed by normalized lowercase email.
 */
export function getRegisteredUsersMap(): Record<string, StudentProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS_DB);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.error('Error reading registered users from storage', e);
    return {};
  }
}

/**
 * Saves the database of registered users to localStorage.
 */
function saveRegisteredUsersMap(usersMap: Record<string, StudentProfile>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(usersMap));
  } catch (e) {
    console.error('Error saving registered users to storage', e);
  }
}

/**
 * Normalizes email address for consistent lookup.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Registers a new user.
 * Saves ONLY the details entered by the user.
 * Leaves attendance completely empty.
 */
export function registerUser(details: {
  name: string;
  email: string;
  password: string;
  sectionId: string;
  rollNumber?: string;
  phoneNumber?: string;
}): { success: boolean; error?: string; user?: StudentProfile } {
  const normEmail = normalizeEmail(details.email);
  if (!normEmail) {
    return { success: false, error: 'Email address is required.' };
  }
  if (!details.password || details.password.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }
  if (!details.name.trim()) {
    return { success: false, error: 'Full name is required.' };
  }
  if (!details.sectionId) {
    return { success: false, error: 'Section selection is required.' };
  }

  const users = getRegisteredUsersMap();
  if (users[normEmail]) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please log in.',
    };
  }

  const now = new Date().toISOString();
  const userId = `usr_${normEmail.replace(/[^a-z0-9]/g, '_')}`;

  const newUser: StudentProfile = {
    id: userId,
    name: details.name.trim(),
    email: normEmail,
    password: details.password,
    sectionId: details.sectionId,
    rollNumber: details.rollNumber ? details.rollNumber.trim() : '',
    registerNumber: details.rollNumber ? details.rollNumber.trim() : '',
    phoneNumber: details.phoneNumber ? details.phoneNumber.trim() : '',
    subjectAttendance: {}, // ZERO default/random attendance! Empty by design!
    createdAt: now,
    updatedAt: now,
  };

  users[normEmail] = newUser;
  saveRegisteredUsersMap(users);

  // Automatically log in newly registered user
  setActiveUserEmail(normEmail);

  return { success: true, user: newUser };
}

/**
 * Authenticates user credentials and sets active session.
 */
export function loginUser(
  email: string,
  password: string
): { success: boolean; error?: string; user?: StudentProfile } {
  const normEmail = normalizeEmail(email);
  if (!normEmail) {
    return { success: false, error: 'Please enter your email.' };
  }
  if (!password) {
    return { success: false, error: 'Please enter your password.' };
  }

  const users = getRegisteredUsersMap();
  const user = users[normEmail];

  if (!user) {
    return {
      success: false,
      error: 'No account registered with this email. Please register first.',
    };
  }

  if (user.password !== password) {
    return { success: false, error: 'Invalid password. Please try again.' };
  }

  setActiveUserEmail(normEmail);
  return { success: true, user };
}

/**
 * Clears the active session.
 */
export function logoutUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
  } catch (e) {
    console.error('Error during logout', e);
  }
}

/**
 * Sets the active session email in localStorage.
 */
export function setActiveUserEmail(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, normalizeEmail(email));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
    }
  } catch (e) {
    console.error('Error setting active user email', e);
  }
}

/**
 * Retrieves the currently authenticated user.
 * Returns null if not logged in or account does not exist.
 */
export function getActiveUser(): StudentProfile | null {
  try {
    const activeEmail = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
    if (!activeEmail) return null;
    const users = getRegisteredUsersMap();
    return users[normalizeEmail(activeEmail)] || null;
  } catch (e) {
    return null;
  }
}

/**
 * Updates the profile of the active user.
 * Persists changes to localStorage under that user's specific account.
 */
export function updateUserProfile(
  studentId: string,
  updates: {
    name?: string;
    sectionId?: string;
    rollNumber?: string;
    phoneNumber?: string;
  }
): { success: boolean; user?: StudentProfile; error?: string } {
  const users = getRegisteredUsersMap();
  
  // Find user by studentId
  let targetEmail: string | null = null;
  for (const [email, user] of Object.entries(users)) {
    if (user.id === studentId) {
      targetEmail = email;
      break;
    }
  }

  if (!targetEmail || !users[targetEmail]) {
    return { success: false, error: 'User account not found.' };
  }

  const existing = users[targetEmail];
  const updatedUser: StudentProfile = {
    ...existing,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    sectionId: updates.sectionId !== undefined ? updates.sectionId : existing.sectionId,
    rollNumber: updates.rollNumber !== undefined ? updates.rollNumber.trim() : existing.rollNumber,
    registerNumber: updates.rollNumber !== undefined ? updates.rollNumber.trim() : existing.registerNumber,
    phoneNumber: updates.phoneNumber !== undefined ? updates.phoneNumber.trim() : existing.phoneNumber,
    updatedAt: new Date().toISOString(),
  };

  users[targetEmail] = updatedUser;
  saveRegisteredUsersMap(users);

  return { success: true, user: updatedUser };
}

/**
 * Saves attendance data ONLY for the specified user and subject.
 */
export function saveUserSubjectAttendance(
  studentId: string,
  subjectCode: string,
  conducted: number,
  attended: number
): void {
  const users = getRegisteredUsersMap();
  
  for (const [email, user] of Object.entries(users)) {
    if (user.id === studentId) {
      const currentAttendance = user.subjectAttendance || {};
      user.subjectAttendance = {
        ...currentAttendance,
        [subjectCode]: {
          conducted: Math.max(0, conducted),
          attended: Math.min(Math.max(0, conducted), Math.max(0, attended)),
        },
      };
      user.updatedAt = new Date().toISOString();
      users[email] = user;
      saveRegisteredUsersMap(users);
      break;
    }
  }
}

/**
 * Retrieves the saved attendance for a specific subject belonging to the user.
 * Returns null if not entered yet.
 */
export function getUserSubjectAttendance(
  studentId: string,
  subjectCode: string
): { conducted: number; attended: number } | null {
  const users = getRegisteredUsersMap();
  for (const user of Object.values(users)) {
    if (user.id === studentId) {
      const record = user.subjectAttendance?.[subjectCode];
      return record ? { conducted: record.conducted, attended: record.attended } : null;
    }
  }
  return null;
}

/**
 * Saves or clears simulated OD credits for the active user.
 */
export function saveUserOdCredits(
  studentId: string,
  odCredits: Record<string, number>
): void {
  const users = getRegisteredUsersMap();
  for (const [email, user] of Object.entries(users)) {
    if (user.id === studentId) {
      user.simulatedOdCredits = { ...odCredits };
      user.updatedAt = new Date().toISOString();
      users[email] = user;
      saveRegisteredUsersMap(users);
      break;
    }
  }
}

/**
 * Applies OD credits permanently to the user's attended classes.
 */
export function applyOdCreditsToAttendance(
  studentId: string,
  odCredits: Record<string, number>
): { success: boolean; user?: StudentProfile } {
  const users = getRegisteredUsersMap();
  let updatedUser: StudentProfile | undefined;

  for (const [email, user] of Object.entries(users)) {
    if (user.id === studentId) {
      const attendance = { ...(user.subjectAttendance || {}) };
      Object.entries(odCredits).forEach(([code, bonus]) => {
        if (attendance[code] && bonus > 0) {
          attendance[code] = {
            conducted: attendance[code].conducted,
            attended: Math.min(
              attendance[code].conducted,
              attendance[code].attended + bonus
            ),
          };
        }
      });
      user.subjectAttendance = attendance;
      user.simulatedOdCredits = {};
      user.updatedAt = new Date().toISOString();
      users[email] = user;
      saveRegisteredUsersMap(users);
      updatedUser = user;
      break;
    }
  }

  return { success: !!updatedUser, user: updatedUser };
}

/**
 * Helper to list all registered accounts (email + name + section)
 * purely for account switching during testing without hardcoded mock data.
 */
export function getRegisteredUsersList(): {
  id: string;
  name: string;
  email: string;
  sectionId: string;
}[] {
  const users = getRegisteredUsersMap();
  return Object.values(users).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    sectionId: u.sectionId,
  }));
}
