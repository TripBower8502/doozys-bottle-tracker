import { useState, useEffect, useRef } from 'react';
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

function isoToTimeInput(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function timeInputToIso(dateStr, timeVal) {
  const [h, m] = timeVal.split(':').map(Number);
  const d = new Date(dateStr + 'T00:00:00');
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

const EMP_COLORS = ['#b8921e', '#9b3a5a', '#4a7da8', '#3d8b32', '#c46a3f', '#7b5ea7', '#c44a72', '#2a8a8a'];

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function isoToMinutes(iso) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

const TIMELINE_START = 6 * 60;  // 6am
const TIMELINE_END = 25 * 60;   // 1am next day (25h)
const TIMELINE_SPAN = TIMELINE_END - TIMELINE_START;

function minutesToPct(mins) {
  let m = mins;
  if (m < TIMELINE_START) m += 24 * 60; // wrap past midnight
  return Math.max(0, Math.min(100, ((m - TIMELINE_START) / TIMELINE_SPAN) * 100));
}

function pxToMinutes(px, trackWidth) {
  const mins = TIMELINE_START + (px / trackWidth) * TIMELINE_SPAN;
  // Snap to 15 min
  return Math.round(mins / 15) * 15;
}

function minutesToTimeStr(mins) {
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

const TIMELINE_HOURS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 0];

export default function ManagerSchedule({ employees, schedule, timeclock }) {
  const [weekDate, setWeekDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('day');
  const [selectedDay, setSelectedDay] = useState(() => {
    const now = new Date();
    const dayIdx = (now.getDay() + 6) % 7;
    return DAYS[dayIdx];
  });
  const [editing, setEditing] = useState(null);
  const [customStart, setCustomStart] = useState('09:00');
  const [customEnd, setCustomEnd] = useState('17:00');
  const [customNote, setCustomNote] = useState('');
  const [editingPunch, setEditingPunch] = useState(null); // { emp, dateStr, idx }
  const [punchIn, setPunchIn] = useState('');
  const [punchOut, setPunchOut] = useState('');
  const [dragState, setDragState] = useState(null); // { emp, day, mode, originalShift, trackWidth, startX, startMins, endMins }

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

  const openPunchEditor = (emp, dateStr, idx, punch) => {
    setEditingPunch({ emp, dateStr, idx });
    setPunchIn(isoToTimeInput(punch.clockIn));
    setPunchOut(punch.clockOut ? isoToTimeInput(punch.clockOut) : '');
  };

  const savePunch = () => {
    if (!editingPunch) return;
    const { emp, dateStr, idx } = editingPunch;
    const raw = timeclock?.[emp]?.[dateStr] || [];
    const punches = Array.isArray(raw) ? [...raw] : [raw];
    punches[idx] = {
      clockIn: timeInputToIso(dateStr, punchIn),
      clockOut: punchOut ? timeInputToIso(dateStr, punchOut) : null,
    };
    set(ref(db, `timeclock/${emp}/${dateStr}`), punches);
    setEditingPunch(null);
  };

  const deletePunch = () => {
    if (!editingPunch) return;
    const { emp, dateStr, idx } = editingPunch;
    const raw = timeclock?.[emp]?.[dateStr] || [];
    const punches = Array.isArray(raw) ? [...raw] : [raw];
    punches.splice(idx, 1);
    set(ref(db, `timeclock/${emp}/${dateStr}`), punches.length > 0 ? punches : null);
    setEditingPunch(null);
  };

  // ── Drag-to-edit timeline shifts ──
  const startDrag = (e, mode, emp, day, shift, trackEl) => {
    e.stopPropagation();
    e.preventDefault();
    const rect = trackEl.getBoundingClientRect();
    setDragState({
      emp, day, mode,
      trackWidth: rect.width,
      trackLeft: rect.left,
      startX: e.clientX,
      startMins: timeToMinutes(shift.start),
      endMins: timeToMinutes(shift.end),
      currentStart: timeToMinutes(shift.start),
      currentEnd: timeToMinutes(shift.end),
      moved: false,
    });
  };

  useEffect(() => {
    if (!dragState) return;
    const handleMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0]?.clientX);
      if (clientX === undefined) return;
      const dx = clientX - dragState.startX;
      const deltaMins = Math.round((dx / dragState.trackWidth) * TIMELINE_SPAN / 15) * 15;
      let nextStart = dragState.startMins;
      let nextEnd = dragState.endMins;
      if (dragState.mode === 'move') {
        nextStart += deltaMins;
        nextEnd += deltaMins;
      } else if (dragState.mode === 'left') {
        nextStart += deltaMins;
        if (nextStart >= nextEnd - 15) nextStart = nextEnd - 15;
      } else if (dragState.mode === 'right') {
        nextEnd += deltaMins;
        if (nextEnd <= nextStart + 15) nextEnd = nextStart + 15;
      }
      if (Math.abs(deltaMins) >= 15) {
        setDragState((prev) => ({ ...prev, currentStart: nextStart, currentEnd: nextEnd, moved: true }));
      }
    };
    const handleUp = () => {
      if (dragState.moved) {
        const existingShift = weekSchedule[dragState.emp]?.[dragState.day] || {};
        setShift(dragState.emp, dragState.day, {
          start: minutesToTimeStr(dragState.currentStart),
          end: minutesToTimeStr(dragState.currentEnd),
          note: existingShift.note || '',
        });
      }
      setDragState(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragState, weekSchedule]);

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

      {/* ── DAY TIMELINE VIEW ── */}
      {viewMode === 'day' && (() => {
        const dayDate = weekDates.find((d) => d.day === selectedDay);
        const dateStr = dayDate ? dateToDayKey(dayDate.date) : '';

        return (
          <>
            <div className="pill-row">
              {weekDates.map(({ day, date }) => (
                <button
                  key={day}
                  className={`pill${selectedDay === day ? ' active' : ''}${isToday(date) ? ' today-pill' : ''}`}
                  onClick={() => { setSelectedDay(day); setEditing(null); setEditingPunch(null); }}
                >
                  {day} {date.getDate()}
                </button>
              ))}
            </div>

            {/* Time axis */}
            <div className="timeline-axis">
              {TIMELINE_HOURS.map((h) => (
                <span key={h} className="timeline-hour" style={{ left: `${minutesToPct(h * 60)}%` }}>
                  {h === 0 ? '12a' : h <= 12 ? `${h}${h === 12 ? 'p' : 'a'}` : `${h - 12}p`}
                </span>
              ))}
            </div>

            {/* Employee rows */}
            <div className="timeline-rows">
              {employees.map((emp, empIdx) => {
                const shift = weekSchedule[emp]?.[selectedDay] || null;
                const punches = getPunches(emp, dateStr);
                const color = EMP_COLORS[empIdx % EMP_COLORS.length];
                const isEd = editing && editing.emp === emp && editing.day === selectedDay;

                return (
                  <div key={emp} className="timeline-row">
                    <div className="timeline-name">{emp}</div>
                    <div className="timeline-track">
                      {/* Scheduled shift bar */}
                      {shift && (() => {
                        const isDraggingThis = dragState && dragState.emp === emp && dragState.day === selectedDay;
                        const startMins = isDraggingThis ? dragState.currentStart : timeToMinutes(shift.start);
                        const endMins = isDraggingThis ? dragState.currentEnd : timeToMinutes(shift.end);
                        return (
                          <div
                            className={`timeline-bar scheduled${isDraggingThis ? ' dragging' : ''}`}
                            style={{
                              left: `${minutesToPct(startMins)}%`,
                              width: `${minutesToPct(endMins) - minutesToPct(startMins)}%`,
                              background: color,
                            }}
                            onMouseDown={(e) => startDrag(e, 'move', emp, selectedDay, shift, e.currentTarget.parentElement)}
                            onTouchStart={(e) => {
                              const t = e.touches[0];
                              startDrag({ clientX: t.clientX, stopPropagation: () => e.stopPropagation(), preventDefault: () => e.preventDefault() }, 'move', emp, selectedDay, shift, e.currentTarget.parentElement);
                            }}
                            onClick={(e) => {
                              if (dragState?.moved) return;
                              openEditor(emp, selectedDay, shift);
                            }}
                            title={`${formatTime(shift.start)}–${formatTime(shift.end)}${shift.note ? ' · ' + shift.note : ''}`}
                          >
                            <span
                              className="timeline-handle left"
                              onMouseDown={(e) => startDrag(e, 'left', emp, selectedDay, shift, e.currentTarget.parentElement.parentElement)}
                              onTouchStart={(e) => {
                                const t = e.touches[0];
                                startDrag({ clientX: t.clientX, stopPropagation: () => e.stopPropagation(), preventDefault: () => e.preventDefault() }, 'left', emp, selectedDay, shift, e.currentTarget.parentElement.parentElement);
                              }}
                            />
                            <span
                              className="timeline-handle right"
                              onMouseDown={(e) => startDrag(e, 'right', emp, selectedDay, shift, e.currentTarget.parentElement.parentElement)}
                              onTouchStart={(e) => {
                                const t = e.touches[0];
                                startDrag({ clientX: t.clientX, stopPropagation: () => e.stopPropagation(), preventDefault: () => e.preventDefault() }, 'right', emp, selectedDay, shift, e.currentTarget.parentElement.parentElement);
                              }}
                            />
                            {isDraggingThis && (
                              <span className="timeline-drag-label">{formatTime(minutesToTimeStr(startMins))}–{formatTime(minutesToTimeStr(endMins))}</span>
                            )}
                          </div>
                        );
                      })()}
                      {/* Actual punch bars */}
                      {punches.map((p, i) => {
                        const startM = isoToMinutes(p.clockIn);
                        const endM = p.clockOut ? isoToMinutes(p.clockOut) : (new Date().getHours() * 60 + new Date().getMinutes());
                        return (
                          <div
                            key={i}
                            className="timeline-bar actual"
                            style={{
                              left: `${minutesToPct(startM)}%`,
                              width: `${Math.max(1, minutesToPct(endM) - minutesToPct(startM))}%`,
                              background: color,
                            }}
                            onClick={() => openPunchEditor(emp, dateStr, i, p)}
                            title={`Actual: ${formatClockTime(p.clockIn)}${p.clockOut ? '–' + formatClockTime(p.clockOut) : ' (on clock)'}`}
                          />
                        );
                      })}
                      {/* Tap empty area to add shift */}
                      {!shift && punches.length === 0 && (
                        <div className="timeline-empty" onClick={() => openEditor(emp, selectedDay, null)}>
                          <span>+ Add</span>
                        </div>
                      )}
                    </div>
                    {isEd && shiftEditor}
                    {punches.map((p, i) => {
                      const isPunchEd = editingPunch && editingPunch.emp === emp && editingPunch.dateStr === dateStr && editingPunch.idx === i;
                      return isPunchEd ? (
                        <div key={`pe-${i}`} className="punch-editor">
                          <div className="shift-editor-title">Edit punch — {emp}</div>
                          <div className="custom-shift">
                            <input type="time" className="input time-input" value={punchIn} onChange={(e) => setPunchIn(e.target.value)} />
                            <span className="time-sep">→</span>
                            <input type="time" className="input time-input" value={punchOut} onChange={(e) => setPunchOut(e.target.value)} />
                          </div>
                          <div className="shift-actions">
                            <button className="btn-gold" onClick={savePunch}>Save</button>
                            <button className="btn-ghost danger" onClick={deletePunch}>Delete</button>
                            <button className="btn-ghost" onClick={() => setEditingPunch(null)}>Cancel</button>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                );
              })}
            </div>
          </>
        );
      })()}

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
