import { useState } from 'react';
import { CATEGORIES, CAT_ICONS } from '../constants';
import ManagerSchedule from '../components/ManagerSchedule';

function formatClockTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const hr = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${hr}${ampm}` : `${hr}:${String(m).padStart(2, '0')}${ampm}`;
}

function clockDuration(clockInIso) {
  const mins = Math.floor((Date.now() - new Date(clockInIso).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Manager({ employees, bottles, sales, goals, schedule, timeclock, onSell, onUndoSell, onSetGoal, onClockIn, onClockOut }) {
  const [emp, setEmp] = useState(employees[0] || '');
  const [catFilter, setCatFilter] = useState('All');
  const [bottleId, setBottleId] = useState('');
  const [qty, setQty] = useState(1);
  const [goalInputs, setGoalInputs] = useState({});

  const filteredBottles =
    catFilter === 'All' ? bottles : bottles.filter((b) => b.category === catFilter);

  const handleRecord = () => {
    if (!emp || !bottleId || qty < 1) return;
    for (let i = 0; i < qty; i++) onSell(emp, bottleId);
    setQty(1);
  };

  const summaryData = employees.map((e) => {
    const es = sales[e] || {};
    let pts = 0, bonus = 0, wine = 0, liquor = 0;
    bottles.forEach((b) => {
      const c = es[b.id] || 0;
      if (c > 0) {
        pts += c * b.points;
        bonus += c * b.bonus;
        if (b.category === 'Wine') wine += c;
        else liquor += c;
      }
    });
    return { name: e, pts, bonus, wine, liquor };
  });

  return (
    <div className="tab-content manager">
      <h2 className="tab-title">Manager</h2>
      <div className="ornament-sm">── ✦ ──</div>

      <div className="mgr-section">
        <h3 className="section-label">Who's On Clock</h3>
        <div className="onclock-list">
          {employees.map((e) => {
            const today = new Date().toISOString().slice(0, 10);
            const raw = timeclock?.[e]?.[today] || null;
            const punches = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
            const last = punches.length > 0 ? punches[punches.length - 1] : null;
            const isIn = last && last.clockIn && !last.clockOut;
            const allOut = punches.length > 0 && punches.every((p) => p.clockOut);
            return (
              <div key={e} className={`onclock-row${isIn ? ' active' : ''}`}>
                <span className={`clock-dot${isIn ? ' green' : ''}`} />
                <span className="onclock-name">{e}</span>
                {isIn ? (
                  <>
                    <span className="onclock-time">{formatClockTime(last.clockIn)} · {clockDuration(last.clockIn)}</span>
                    <button className="btn-remove" onClick={() => onClockOut(e)}>Out</button>
                  </>
                ) : allOut ? (
                  <>
                    <span className="onclock-done">{punches.length} punch{punches.length > 1 ? 'es' : ''}</span>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => onClockIn(e)}>In</button>
                  </>
                ) : (
                  <>
                    <span className="onclock-off">Not clocked in</span>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 10 }} onClick={() => onClockIn(e)}>In</button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mgr-section">
        <h3 className="section-label">Record Sale</h3>
        <div className="mgr-form">
          <select className="mgr-select" value={emp} onChange={(e) => setEmp(e.target.value)}>
            {employees.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>

          <div className="filter-tabs compact">
            {['All', ...CATEGORIES].map((c) => (
              <button
                key={c}
                className={`filter-tab${catFilter === c ? ' active' : ''}`}
                onClick={() => { setCatFilter(c); setBottleId(''); }}
              >
                {c === 'All' ? 'All' : `${CAT_ICONS[c]} ${c}`}
              </button>
            ))}
          </div>

          <select
            className="mgr-select"
            value={bottleId}
            onChange={(e) => setBottleId(e.target.value)}
          >
            <option value="">Select bottle…</option>
            {filteredBottles.map((b) => (
              <option key={b.id} value={b.id}>
                {CAT_ICONS[b.category]} {b.name} ({b.points}pts)
              </option>
            ))}
          </select>

          <div className="qty-stepper">
            <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <span className="qty-val">{qty}</span>
            <button className="qty-btn" onClick={() => setQty(qty + 1)}>+</button>
          </div>

          <button className="btn-gold" onClick={handleRecord} disabled={!bottleId}>
            Record Sale
          </button>
        </div>
      </div>

      <div className="mgr-section">
        <h3 className="section-label">Undo Sale</h3>
        <select className="mgr-select" value={emp} onChange={(e) => setEmp(e.target.value)}>
          {employees.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <div className="undo-list">
          {bottles
            .filter((b) => (sales[emp] && sales[emp][b.id]) > 0)
            .map((b) => (
              <div key={b.id} className="undo-row">
                <span className="undo-name">{b.name}</span>
                <span className="undo-count">×{sales[emp][b.id]}</span>
                <button className="btn-remove" onClick={() => onUndoSell(emp, b.id)}>−1</button>
              </div>
            ))}
          {!bottles.some((b) => sales[emp] && sales[emp][b.id] > 0) && (
            <p style={{ color: 'var(--muted)', fontSize: 14, fontStyle: 'italic' }}>No sales to undo.</p>
          )}
        </div>
      </div>

      <div className="mgr-section">
        <h3 className="section-label">Set Goals</h3>
        <div className="goal-rows">
          {employees.map((e) => (
            <div key={e} className="goal-row">
              <span className="goal-emp">{e}</span>
              <input
                type="number"
                className="goal-input"
                placeholder={goals[e] || '—'}
                value={goalInputs[e] || ''}
                onChange={(ev) => setGoalInputs({ ...goalInputs, [e]: ev.target.value })}
              />
              <button
                className="btn-ghost"
                onClick={() => {
                  const v = parseInt(goalInputs[e]);
                  if (v > 0) onSetGoal(e, v);
                }}
              >
                Set
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mgr-section">
        <h3 className="section-label">Summary</h3>
        <div className="summary-table-wrap">
          <table className="summary-table">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Pts</th>
                <th>Bonus</th>
                <th>🍷</th>
                <th>🥃</th>
              </tr>
            </thead>
            <tbody>
              {summaryData.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td className="gold">{s.pts}</td>
                  <td className="green">${s.bonus}</td>
                  <td>{s.wine}</td>
                  <td>{s.liquor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ornament-sm" style={{ margin: '20px 0' }}>── ✦ ──</div>

      <ManagerSchedule employees={employees} schedule={schedule} timeclock={timeclock} />
    </div>
  );
}
