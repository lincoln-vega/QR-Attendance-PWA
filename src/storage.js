// ============================================
// Storage Layer — localStorage CRUD
// ============================================

import { isWeekend } from './utils/dates';

const STORAGE_KEYS = {
  MEMBERS: 'app_asistencia_members',
  MEETINGS: 'app_asistencia_meetings',
  ATTENDANCE: 'app_asistencia_attendance',
  ADMIN: 'app_asistencia_admin',
  GROUPS: 'app_asistencia_groups',
  PROFILE_PHOTOS: 'app_asistencia_photos',
  PROFILE_PASSWORDS: 'app_asistencia_profile_passwords',
  MONTHLY_GOALS: 'app_asistencia_monthly_goals',
};

// ---------- Helpers ----------
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

function getStore(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function setStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ---------- Initialization ----------
const DEFAULT_MEMBERS = [
  { id: generateId(), name: 'Carlos Mendoza Ramos', clubId: 'A', ramaId: 'general', active: true },
  { id: generateId(), name: 'Lucía Fernández Ruiz', clubId: 'A', ramaId: 'general', active: true },
  { id: generateId(), name: 'Diego Salazar Castro', clubId: 'B', ramaId: 'general', active: true },
  { id: generateId(), name: 'Valeria Torres Silva', clubId: 'B', ramaId: 'general', active: true },
  { id: generateId(), name: 'Andrés Morales Peña', clubId: 'C', ramaId: 'general', active: true },
  { id: generateId(), name: 'Sofía Vargas Díaz', clubId: 'C', ramaId: 'general', active: true },
  { id: generateId(), name: 'Mateo Paredes Gómez', clubId: 'D', ramaId: 'general', active: true },
];

const DEFAULT_ADMIN = {
  user: 'admin',
  password: 'admin123',
};

const DEFAULT_CLUBS = [
  { id: 'A', name: 'Equipo Operaciones', color: '#B3E0F2', ramas: [{ id: 'general', name: 'Rama General' }] },
  { id: 'B', name: 'Equipo Desarrollo', color: '#FFF0B3', ramas: [{ id: 'general', name: 'Rama General' }] },
  { id: 'C', name: 'Equipo Diseño', color: '#D4C5F9', ramas: [{ id: 'general', name: 'Rama General' }] },
  { id: 'D', name: 'Equipo Comercial', color: '#B8F0D8', ramas: [{ id: 'general', name: 'Rama General' }] },
];

export function initializeStorage() {
  // Migration logic
  let existingGroups = getStore(STORAGE_KEYS.GROUPS);
  let existingMembers = getStore(STORAGE_KEYS.MEMBERS);
  
  if (existingGroups && existingGroups.length > 0 && !existingGroups[0].ramas) {
    const newClubs = existingGroups.map(g => ({
      id: g.id,
      name: g.name,
      color: g.color,
      ramas: [{ id: 'general', name: 'Rama General' }]
    }));
    setStore(STORAGE_KEYS.GROUPS, newClubs);
    
    if (existingMembers) {
      const migratedMembers = existingMembers.map(m => {
        if (m.group) {
          const clubId = m.group;
          const { group, ...rest } = m;
          return { ...rest, clubId, ramaId: 'general' };
        }
        return m;
      });
      setStore(STORAGE_KEYS.MEMBERS, migratedMembers);
    }
  }

  if (!getStore(STORAGE_KEYS.MEMBERS)) {
    setStore(STORAGE_KEYS.MEMBERS, DEFAULT_MEMBERS);
  }
  if (!getStore(STORAGE_KEYS.MEETINGS)) {
    setStore(STORAGE_KEYS.MEETINGS, []);
  }
  if (!getStore(STORAGE_KEYS.ATTENDANCE)) {
    setStore(STORAGE_KEYS.ATTENDANCE, []);
  }
  if (!getStore(STORAGE_KEYS.ADMIN)) {
    setStore(STORAGE_KEYS.ADMIN, DEFAULT_ADMIN);
  }
  if (!getStore(STORAGE_KEYS.GROUPS)) {
    setStore(STORAGE_KEYS.GROUPS, DEFAULT_CLUBS);
  }
  if (!getStore(STORAGE_KEYS.PROFILE_PHOTOS)) {
    setStore(STORAGE_KEYS.PROFILE_PHOTOS, {});
  }
  if (!getStore(STORAGE_KEYS.PROFILE_PASSWORDS)) {
    setStore(STORAGE_KEYS.PROFILE_PASSWORDS, {});
  }
}

// ---------- Members ----------
export function getMembers(includeInactive = false) {
  const members = getStore(STORAGE_KEYS.MEMBERS) || [];
  return includeInactive ? members : members.filter(m => m.active);
}

export function getAllMembers() {
  return getStore(STORAGE_KEYS.MEMBERS) || [];
}

export function getMemberById(id) {
  const members = getStore(STORAGE_KEYS.MEMBERS) || [];
  return members.find(m => m.id === id) || null;
}

export function addMember(name, clubId, ramaId) {
  const members = getStore(STORAGE_KEYS.MEMBERS) || [];
  const member = { id: generateId(), name: name.trim(), clubId, ramaId, active: true };
  members.push(member);
  setStore(STORAGE_KEYS.MEMBERS, members);
  return member;
}

export function updateMember(id, data) {
  const members = getStore(STORAGE_KEYS.MEMBERS) || [];
  const index = members.findIndex(m => m.id === id);
  if (index === -1) return null;
  members[index] = { ...members[index], ...data };
  setStore(STORAGE_KEYS.MEMBERS, members);
  return members[index];
}

export function updateMembers(ids, data) {
  const members = getStore(STORAGE_KEYS.MEMBERS) || [];
  let updated = false;
  const newMembers = members.map(m => {
    if (ids.includes(m.id)) {
      updated = true;
      return { ...m, ...data };
    }
    return m;
  });
  if (updated) setStore(STORAGE_KEYS.MEMBERS, newMembers);
}

export function toggleMemberActive(id) {
  const members = getStore(STORAGE_KEYS.MEMBERS) || [];
  const member = members.find(m => m.id === id);
  if (!member) return null;
  member.active = !member.active;
  setStore(STORAGE_KEYS.MEMBERS, members);
  return member;
}

export function deleteMember(id) {
  let members = getStore(STORAGE_KEYS.MEMBERS) || [];
  members = members.filter(m => m.id !== id);
  setStore(STORAGE_KEYS.MEMBERS, members);
  // Also remove attendance records
  let attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  attendance = attendance.filter(a => a.memberId !== id);
  setStore(STORAGE_KEYS.ATTENDANCE, attendance);
}

// ---------- Meetings ----------
export function getMeetings() {
  return getStore(STORAGE_KEYS.MEETINGS) || [];
}

export function getOrCreateMeeting(date) {
  const meetings = getStore(STORAGE_KEYS.MEETINGS) || [];
  const existing = meetings.find(m => m.date === date);
  if (existing) return existing;
  const meeting = { date };
  meetings.push(meeting);
  meetings.sort((a, b) => b.date.localeCompare(a.date));
  setStore(STORAGE_KEYS.MEETINGS, meetings);
  return meeting;
}

// ---------- Attendance ----------
export function getAttendance(date) {
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  return attendance.filter(a => a.date === date);
}

export function getAllAttendance() {
  return getStore(STORAGE_KEYS.ATTENDANCE) || [];
}

export function markAttendance(memberId, date, method = 'manual') {
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  // Check if already marked
  const existing = attendance.find(a => a.memberId === memberId && a.date === date);
  if (existing) return existing;
  // Auto-create meeting
  getOrCreateMeeting(date);
  const record = { memberId, date, method };
  attendance.push(record);
  setStore(STORAGE_KEYS.ATTENDANCE, attendance);
  return record;
}

export function removeAttendance(memberId, date) {
  let attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  attendance = attendance.filter(a => !(a.memberId === memberId && a.date === date));
  setStore(STORAGE_KEYS.ATTENDANCE, attendance);
}

export function getAttendanceByMember(memberId) {
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  return attendance.filter(a => a.memberId === memberId).sort((a, b) => b.date.localeCompare(a.date));
}

export function isAttendanceMarked(memberId, date) {
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  return attendance.some(a => a.memberId === memberId && a.date === date);
}

export function getAttendanceRecord(memberId, date) {
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  return attendance.find(a => a.memberId === memberId && a.date === date) || null;
}

// ---------- Streak ----------
export function getStreak(memberId) {
  // Filter out weekends from valid meeting dates
  const meetings = getMeetings()
    .filter(m => !isWeekend(m.date))
    .sort((a, b) => b.date.localeCompare(a.date));
  const memberAttendance = getAttendanceByMember(memberId);
  const attendedDates = new Set(memberAttendance.map(a => a.date));

  let streak = 0;
  for (const meeting of meetings) {
    if (attendedDates.has(meeting.date)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getMaxStreak(memberId) {
  const meetings = getMeetings()
    .filter(m => !isWeekend(m.date))
    .sort((a, b) => a.date.localeCompare(b.date)); // Chronological order
  const memberAttendance = getAttendanceByMember(memberId);
  const attendedDates = new Set(memberAttendance.map(a => a.date));

  let maxStreak = 0;
  let currentStreak = 0;

  for (const meeting of meetings) {
    if (attendedDates.has(meeting.date)) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else {
      currentStreak = 0;
    }
  }
  return maxStreak;
}

// ---------- Reports ----------
export function getWeeklyReport(weekStart, weekEnd) {
  const members = getMembers();
  // Exclude weekends from meetings
  const meetings = getMeetings().filter(m => m.date >= weekStart && m.date <= weekEnd && !isWeekend(m.date));
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];

  return members.map(member => {
    const memberAttendance = attendance.filter(
      a => a.memberId === member.id && a.date >= weekStart && a.date <= weekEnd
    );
    const attendedDates = new Set(memberAttendance.map(a => a.date));

    return {
      member,
      meetings: meetings.map(m => ({
        date: m.date,
        attended: attendedDates.has(m.date),
      })),
      totalAttended: memberAttendance.length,
      missed: meetings.length > 0 && memberAttendance.length === 0,
    };
  });
}

export function getMonthlyReport(year, month) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const members = getMembers();
  const attendance = getStore(STORAGE_KEYS.ATTENDANCE) || [];
  // Exclude weekends from meetings
  const meetings = getMeetings().filter(m => m.date >= startDate && m.date <= endDate && !isWeekend(m.date));

  // Previous month for trend
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
  const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevEndDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevLastDay).padStart(2, '0')}`;

  return members.map(member => {
    const currentAttendance = attendance.filter(
      a => a.memberId === member.id && a.date >= startDate && a.date <= endDate
    );
    const prevAttendance = attendance.filter(
      a => a.memberId === member.id && a.date >= prevStartDate && a.date <= prevEndDate
    );

    const total = currentAttendance.length;
    const prevTotal = prevAttendance.length;

    let alertLevel = 'green';
    if (total < 4) alertLevel = 'red';
    else if (total < 8) alertLevel = 'yellow';

    let trend = 'stable';
    if (prevTotal > 0) {
      if (total < prevTotal) trend = 'down';
      else if (total > prevTotal) trend = 'up';
    }

    return {
      member,
      total,
      prevTotal,
      alertLevel,
      trend,
      meetingsCount: meetings.length,
    };
  });
}

export function getMonthlyAlerts(year, month) {
  const report = getMonthlyReport(year, month);
  return report.filter(r => r.alertLevel !== 'green' || r.trend !== 'stable');
}

// ---------- Groups (Clubs) ----------
export function getGroups() {
  return getStore(STORAGE_KEYS.GROUPS) || DEFAULT_CLUBS;
}

export function addGroup(id, name, color) {
  const groups = getGroups();
  if (groups.find(g => g.id === id)) return null;
  const group = { id, name, color, ramas: [] };
  groups.push(group);
  setStore(STORAGE_KEYS.GROUPS, groups);
  return group;
}

export function updateGroup(id, data) {
  const groups = getGroups();
  const index = groups.findIndex(g => g.id === id);
  if (index === -1) return null;
  groups[index] = { ...groups[index], ...data };
  setStore(STORAGE_KEYS.GROUPS, groups);
  return groups[index];
}

export function deleteGroup(id) {
  let groups = getGroups();
  groups = groups.filter(g => g.id !== id);
  setStore(STORAGE_KEYS.GROUPS, groups);
}

export function getGroupById(id) {
  const groups = getGroups();
  return groups.find(g => g.id === id) || null;
}

export function addRama(clubId, ramaId, ramaName) {
  const groups = getGroups();
  const clubIndex = groups.findIndex(g => g.id === clubId);
  if (clubIndex === -1) return null;
  const club = groups[clubIndex];
  if (!club.ramas) club.ramas = [];
  if (club.ramas.find(r => r.id === ramaId)) return null; // already exists
  const newRama = { id: ramaId, name: ramaName };
  club.ramas.push(newRama);
  setStore(STORAGE_KEYS.GROUPS, groups);
  return newRama;
}

export function updateRama(clubId, ramaId, newName) {
  const groups = getGroups();
  const clubIndex = groups.findIndex(g => g.id === clubId);
  if (clubIndex === -1) return null;
  const club = groups[clubIndex];
  if (!club.ramas) return null;
  const ramaIndex = club.ramas.findIndex(r => r.id === ramaId);
  if (ramaIndex === -1) return null;
  club.ramas[ramaIndex].name = newName;
  setStore(STORAGE_KEYS.GROUPS, groups);
  return club.ramas[ramaIndex];
}

export function deleteRama(clubId, ramaId) {
  const groups = getGroups();
  const clubIndex = groups.findIndex(g => g.id === clubId);
  if (clubIndex === -1) return false;
  const club = groups[clubIndex];
  if (!club.ramas) return false;
  club.ramas = club.ramas.filter(r => r.id !== ramaId);
  setStore(STORAGE_KEYS.GROUPS, groups);
  return true;
}

// ---------- Profile Photos ----------
export function getProfilePhoto(memberId) {
  const photos = getStore(STORAGE_KEYS.PROFILE_PHOTOS) || {};
  return photos[memberId] || null;
}

export function setProfilePhoto(memberId, base64Data) {
  const photos = getStore(STORAGE_KEYS.PROFILE_PHOTOS) || {};
  photos[memberId] = base64Data;
  setStore(STORAGE_KEYS.PROFILE_PHOTOS, photos);
}

export function removeProfilePhoto(memberId) {
  const photos = getStore(STORAGE_KEYS.PROFILE_PHOTOS) || {};
  delete photos[memberId];
  setStore(STORAGE_KEYS.PROFILE_PHOTOS, photos);
}

// ---------- Profile Passwords ----------
export function hasProfilePassword(memberId) {
  const passwords = getStore(STORAGE_KEYS.PROFILE_PASSWORDS) || {};
  return !!passwords[memberId];
}

export function setProfilePassword(memberId, password) {
  const passwords = getStore(STORAGE_KEYS.PROFILE_PASSWORDS) || {};
  passwords[memberId] = password;
  setStore(STORAGE_KEYS.PROFILE_PASSWORDS, passwords);
}

export function verifyProfilePassword(memberId, password) {
  const passwords = getStore(STORAGE_KEYS.PROFILE_PASSWORDS) || {};
  return passwords[memberId] === password;
}

// ---------- Admin ----------
export function verifyAdmin(user, password) {
  const admin = getStore(STORAGE_KEYS.ADMIN);
  if (!admin) return false;
  return admin.user === user && admin.password === password;
}

// ---------- Reports (1-4-8 Goals) ----------
export function getMonthlyGoals(year, month) {
  const allGoals = getStore(STORAGE_KEYS.MONTHLY_GOALS) || {};
  const key = `${year}-${month}`;
  if (allGoals[key]) {
    return allGoals[key];
  }
  // Default values
  return { g1: 10, g4: 6, g8: 4 };
}

export function setMonthlyGoals(year, month, goals) {
  const allGoals = getStore(STORAGE_KEYS.MONTHLY_GOALS) || {};
  const key = `${year}-${month}`;
  allGoals[key] = goals;
  setStore(STORAGE_KEYS.MONTHLY_GOALS, allGoals);
}

// ---------- Export/Import ----------
export function exportData() {
  return {
    members: getStore(STORAGE_KEYS.MEMBERS),
    meetings: getStore(STORAGE_KEYS.MEETINGS),
    attendance: getStore(STORAGE_KEYS.ATTENDANCE),
    groups: getStore(STORAGE_KEYS.GROUPS),
    exportedAt: new Date().toISOString(),
  };
}

export function importData(data) {
  if (data.members) setStore(STORAGE_KEYS.MEMBERS, data.members);
  if (data.meetings) setStore(STORAGE_KEYS.MEETINGS, data.meetings);
  if (data.attendance) setStore(STORAGE_KEYS.ATTENDANCE, data.attendance);
  if (data.groups) setStore(STORAGE_KEYS.GROUPS, data.groups);
}
