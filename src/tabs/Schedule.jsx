import { useState } from 'react';
import { DAYS, getWeekKey, getWeekDates, formatWeekRange, shiftWeek, isToday, formatTime } from '../weekUtils';

function formatClockTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hr}${ampm}` : `${hr}:${String(m).padStart(2, '0')}${ampm}`;
}

export default function Schedule({ employees, schedule, timeclock, lockedEmployee, onClockIn, onClockOut }) {
  const [selectedEmp, setSelectedEmp] = useState(employees[0] || '');
  const [weekDate, setWeekDate] = useState(new Date());

  const emp = lockedEmployee || selectedEmp;
  const weekKey = getWeekKey(weekDate);
  const weekDates = getWeekDates(weekDate);
  const weekSchedule = (schedule && schedule[weekKey]) || {};
  const empSched = weekSchedule[emp] || {};

  const hasSchedule = Object.values(empSched).some((v) => v !== null);

  // Today's clock status
  const today = new Date().toISOString().slice(0, 10);
  const todayClock = timeclock?.[emp]?.[today] || null;
  const isClockedIn = todayClock && todayClock.clockIn && !todayClock.clockOut;

  // Find next upcoming shift
  const now = new Date();
  let nextShift = null;
  for (const { day, date } of getWeekDates(new Date())) {
    const shift = ((schedule && schedule[getWeekKey(new Date())]) || {})[emp]?.[day];
    if (shift && date >= new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
      const dayLabel = isToday(date) ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'long' });
      nextShift = { dayLabel, shift };
      break;
    }
  }

  return (
    <div className="tab-content schedule-tab">
      <h2 className="tab-title">Schedule</h2>
      <div className="ornament-sm">── ✦ ──</div>

      {!lockedEmployee && (
        <div className="pill-row">
          {employees.map((e) => (
            <button
              key={e}
              className={`pill${emp === e ? ' active' : ''}`}
              onClick={() => setSelectedEmp(e)}
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Clock In/Out */}
      {lockedEmployee && (
        <div className={`clock-card${isClockedIn ? ' clocked-in' : ''}`}>
          {isClockedIn ? (
            <>
              <div className="clock-status">
                <span className="clock-dot green" />
                <span className="clock-label">Clocked in since {formatClockTime(todayClock.clockIn)}</span>
              </div>
              <button className="btn-clock-out" onClick={() => onClockOut(emp)}>Clock Out</button>
            </>
          ) : (
            <>
              {todayClock?.clockOut && (
                <p className="clock-done">Shift complete — clocked out at {formatClockTime(todayClock.clockOut)}</p>
              )}
              {!todayClock?.clockOut && (
                <button className="btn-gold btn-clock-in" onClick={() => onClockIn(emp)}>Clock In</button>
              )}
            </>
          )}
        </div>
      )}

      {nextShift && (
        <div className="next-shift">
          <span className="next-shift-label">Next shift:</span>
          <span className="next-shift-value">
            {nextShift.dayLabel} {formatTime(nextShift.shift.start)} – {formatTime(nextShift.shift.end)}
          </span>
        </div>
      )}

      <div className="week-nav">
        <button className="week-arrow" onClick={() => setWeekDate(shiftWeek(weekDate, -1))}>‹</button>
        <span className="week-label">{formatWeekRange(weekDate)}</span>
        <button className="week-arrow" onClick={() => setWeekDate(shiftWeek(weekDate, 1))}>›</button>
      </div>

      {!hasSchedule && Object.keys(empSched).length === 0 ? (
        <p className="no-schedule">Check back soon — schedule not posted yet.</p>
      ) : (
        <div className="day-cards">
          {weekDates.map(({ day, date }) => {
            const shift = empSched[day] || null;
            const isTodays = isToday(date);
            return (
              <div key={day} className={`day-card${isTodays ? ' today' : ''}`}>
                <div className="day-card-header">
                  <span className="day-card-name">{day}</span>
                  <span className="day-card-date">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {shift ? (
                  <div className="day-card-shift">
                    <span className="day-card-time">{formatTime(shift.start)} → {formatTime(shift.end)}</span>
                    {shift.note && <span className="day-card-note">{shift.note}</span>}
                  </div>
                ) : (
                  <span className="day-card-off">Off</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
