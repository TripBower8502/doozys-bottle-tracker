import { useState } from 'react';
import { db, ref, set } from '../firebase';
import { DAYS, getWeekKey, getWeekDates, formatWeekRange, shiftWeek, isToday, formatTime, QUICK_SHIFTS } from '../weekUtils';

export default function ManagerSchedule({ employees, schedule }) {
  const [weekDate, setWeekDate] = useState(new Date());
  const [editing, setEditing] = useState(null); // { emp, day }
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
    const { emp, day } = editing;
    setShift(emp, day, QUICK_SHIFTS[label]);
    setEditing(null);
  };

  const handleCustom = () => {
    if (!editing) return;
    const { emp, day } = editing;
    setShift(emp, day, { start: customStart, end: customEnd, note: customNote });
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

  return (
    <div className="mgr-section">
      <h3 className="section-label">Schedule</h3>

      <div className="week-nav">
        <button className="week-arrow" onClick={() => setWeekDate(shiftWeek(weekDate, -1))}>‹</button>
        <span className="week-label">{formatWeekRange(weekDate)}</span>
        <button className="week-arrow" onClick={() => setWeekDate(shiftWeek(weekDate, 1))}>›</button>
      </div>

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
                    {isEd && (
                      <div className="shift-editor">
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <button className="btn-ghost danger" onClick={handleClearWeek}>Clear Week</button>
      </div>
    </div>
  );
}
