import { useState } from 'react';
import { DAYS, getWeekKey, getWeekDates, formatWeekRange, shiftWeek, isToday, formatTime } from '../weekUtils';

export default function Schedule({ employees, schedule, lockedEmployee }) {
  const [selectedEmp, setSelectedEmp] = useState(employees[0] || '');
  const [weekDate, setWeekDate] = useState(new Date());

  const emp = lockedEmployee || selectedEmp;
  const weekKey = getWeekKey(weekDate);
  const weekDates = getWeekDates(weekDate);
  const weekSchedule = (schedule && schedule[weekKey]) || {};
  const empSched = weekSchedule[emp] || {};

  const hasSchedule = Object.values(empSched).some((v) => v !== null);

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
            const today = isToday(date);
            return (
              <div key={day} className={`day-card${today ? ' today' : ''}`}>
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
