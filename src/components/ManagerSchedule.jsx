import { useState } from 'react';
import { db, ref, set } from '../firebase';
import { DAYS, getWeekKey, getWeekDates, formatWeekRange, shiftWeek, isToday, formatTime, QUICK_SHIFTS } from '../weekUtils';

function formatClockTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hr}${ampm}` : `${hr}:${String(m).padStart(2, '0')}${ampm}`;
}

function dateToDayKey(date) {
  return date.toISOString().slice(0, 10);
}

export default function ManagerSchedule({ employees, schedule, timeclock }) {
  const [weekDate, setWeekDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day'); // 'day' or 'employee'
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date();
    const dayIdx = (now.getDay() + 6) % 7; // Mon=0
    return DAYS[dayIdx];
  });
  const [editing, setEditing] = useState(null);
  const [customStart, setCustomStart] = useState('09:00');
  const [customEnd, setCustomEnd] = useState('17:00');
  const [customNote, setCustomNote] = useState('');

  const weekKey = getWeekKey(weekDate);
  const weekDates = getWeekDates(weekDate);
  const weekSchedule = (schedule && schedule[weekKey]) || {};

  const setShift = (emp, day, shift) => {
    set(ref(db, `schedule/${weekKey}/${emp}/${day}`), shift);
  };

  const handleQuick = (label) => {
    if (!editing) return;
    setShift(editing.emp, editing.day, QUICK_SHIFTS[label]);
    setEditing(null);
  };

  const handleCustom = () => {
    if (!editing) return;
    setShift(editing.emp, editing.day, { start: customStart, end: customEnd, note: customNote });
    setEditing(null);
    setCustomNote('');
  };

  const handleClearWeek = () => {
    if (!confirm(`Clear all shifts for ${formatWeekRange(weekDate)}?`)) return;
    set(ref(db, `schedule/${weekKey}`), null);
  };

  const openEditor = (emp, day, currentShift) => {
    setEditing({ emp, day });
    if (currentShift) {
      setCustomStart(currentShift.start || '09:00');
      setCustomEnd(currentShift.end || '17:00');
      setCustomNote(currentShift.note || '');
    } else {
      setCustomStart('09:00');
      setCustomEnd('17:00');
      setCustomNote('');
    }
  };

  const shiftEditor = editing && (
    <div className="shift-editor">
      <div className="shift-editor-title">{editing.emp} — {editing.day}</div>
      <div className="quick-btns">
        {Object.keys(QUICK_SHIFTS).map((label) => (
          <button key={label} className="btn-ghost" onClick={() => handleQuick(label)}>{label}</button>
        ))}
      </div>
      <div className="custom-shift">
        <input type="time" className="input time-input" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
        <span className="time-sep">→</span>
        <input type="time" className="input time-input" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
      </div>
      <input className="input" placeholder="Note (e.g. Register 1)" value={customNote} onChange={(e) => setCustomNote(e.target.value)} />
      <div className="shift-actions">
        <button className="btn-gold" onClick={handleCustom}>Set</button>
        <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </div>
  );

  // Get punches for an employee on a specific date
  const getPunches = (emp, dateStr) => {
    const raw = timeclock?.[emp]?.[dateStr] || null;
    if (!raw) return [];
    return Array.isArray(raw) ? raw : [raw];
  };

  return (
    <div className="mgr-section">
      <h3 className="section-label">Schedule</h3>

      <div className="filter-tabs compact" style={{ marginBottom: 12 }}>
        <button className={`filter-tab${viewMode === 'day' ? ' active' : ''}`} onClick={() => setViewMode('day')}>Day View</button>
        <button className={`filter-tab${viewMode === 'employee' ? ' active' : ''}`} onClick={() => setViewMode('employee')}>By Employee</button>
      </div>

      <div className="week-nav">
        <button className="week-arrow" onClick={() => setWeekDate(shiftWeek(weekDate, -1))}>‹</button>
        <span className="week-label">{formatWeekRange(weekDate)}</span>
        <button className="week-arrow" onClick={() => setWeekDate(shiftWeek(weekDate, 1))}>›</button>
      </div>

      {/* ── DAY VIEW ── */}
      {viewMode === 'day' && (
        <>
          <div className="pill-row">
            {weekDates.map(({ day, date }) => (
              <button
                key={day}
                className={`pill${selectedDay === day ? ' active' : ''}${isToday(date) ? ' today-pill' : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                {day} {date.getDate()}
              </button>
            ))}
          </div>

          <div className="day-view-list">
            {employees.map((emp) => {
              const shift = weekSchedule[emp]?.[selectedDay] || null;
              const dayDate = weekDates.find((d) => d.day === selectedDay);
              const dateStr = dayDate ? dateToDayKey(dayDate.date) : '';
              const punches = getPunches(emp, dateStr);
              const isEd = editing && editing.emp === emp && editing.day === selectedDay;

              return (
                <div key={emp} className="day-view-card">
                  <div className="day-view-header" onClick={() => openEditor(emp, selectedDay, shift)}>
                    <span className="day-view-name">{emp}</span>
                    <div className="day-view-shift-info">
                      {shift ? (
                        <span className="day-view-scheduled">{formatTime(shift.start)}–{formatTime(shift.end)}{shift.note ? ` · ${shift.note}` : ''}</span>
                      ) : (
                        <span className="day-view-off">Off</span>
                      )}
                    </div>
                  </div>
                  {punches.length > 0 && (
                    <div className="day-view-punches">
                      {punches.map((p, i) => (
                        <span key={i} className="day-view-punch">
                          {formatClockTime(p.clockIn)}{p.clockOut ? `–${formatClockTime(p.clockOut)}` : ' (on clock)'}
                        </span>
                      ))}
                    </div>
                  )}
                  {isEd && shiftEditor}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── EMPLOYEE VIEW ── */}
      {viewMode === 'employee' && (
        <>
          {employees.map((emp) => {
            const empSched = weekSchedule[emp] || {};
            return (
              <div key={emp} className="sched-emp-card">
                <h4 className="sched-emp-name">{emp}</h4>
                <div className="sched-day-list">
                  {weekDates.map(({ day, date }) => {
                    const shift = empSched[day] || null;
                    const today = isToday(date);
                    const isEd = editing && editing.emp === emp && editing.day === day;
                    return (
                      <div key={day}>
                        <button
                          className={`sched-day-btn${today ? ' today' : ''}${isEd ? ' editing' : ''}`}
                          onClick={() => openEditor(emp, day, shift)}
                        >
                          <span className="sched-day-label">{day} {date.getDate()}</span>
                          {shift ? (
                            <span className="sched-day-time">{formatTime(shift.start)}–{formatTime(shift.end)}{shift.note ? ` · ${shift.note}` : ''}</span>
                          ) : (
                            <span className="sched-day-off">Off</span>
                          )}
                        </button>
                        {isEd && shiftEditor}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn-ghost danger" onClick={handleClearWeek}>Clear Week</button>
      </div>
    </div>
  );
}
