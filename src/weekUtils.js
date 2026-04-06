const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekKey(date) {
  const mon = getMonday(date);
  const year = mon.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const days = Math.floor((mon - jan1) / 86400000);
  const week = Math.ceil((days + jan1.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function getWeekDates(date) {
  const mon = getMonday(date);
  return DAYS.map((day, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return { day, date: d };
  });
}

function formatWeekRange(date) {
  const mon = getMonday(date);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${mon.toLocaleDateString('en-US', opts)} – ${sun.toLocaleDateString('en-US', opts)}`;
}

function shiftWeek(date, offset) {
  const d = new Date(date);
  d.setDate(d.getDate() + offset * 7);
  return d;
}

function isToday(date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hr}${ampm}` : `${hr}:${String(m).padStart(2, '0')}${ampm}`;
}

const QUICK_SHIFTS = {
  Off: null,
  Open: { start: '09:00', end: '17:00', note: '' },
  Mid: { start: '12:00', end: '20:00', note: '' },
  Close: { start: '16:00', end: '00:00', note: '' },
};

export { DAYS, getMonday, getWeekKey, getWeekDates, formatWeekRange, shiftWeek, isToday, formatTime, QUICK_SHIFTS };
