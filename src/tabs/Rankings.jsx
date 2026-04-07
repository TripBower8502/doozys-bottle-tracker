import { MEDALS, CAT_ICONS, CATEGORIES } from '../constants';

export default function Rankings({ employees, bottles, sales, goals, history }) {
  const ranked = employees
    .map((emp) => {
      const empSales = sales[emp] || {};
      let totalPts = 0;
      let totalBonus = 0;
      let totalBottles = 0;
      const catCounts = {};
      CATEGORIES.forEach((c) => (catCounts[c] = 0));

      bottles.forEach((b) => {
        const count = empSales[b.id] || 0;
        if (count > 0) {
          totalPts += count * b.points;
          totalBonus += count * b.bonus;
          totalBottles += count;
          catCounts[b.category] += count;
        }
      });

      const goal = goals[emp];
      return { name: emp, totalPts, totalBonus, totalBottles, catCounts, goal };
    })
    .sort((a, b) => b.totalPts - a.totalPts);

  const lastWeek = history.length > 0 ? history[history.length - 1] : null;
  const allZero = ranked.every((r) => r.totalPts === 0);

  return (
    <div className="tab-content rankings">
      <h2 className="tab-title">Rankings</h2>
      <div className="ornament-sm">── ✦ ──</div>

      {allZero && (
        <div className="new-week-banner">
          <span className="new-week-icon">🍾</span>
          <span className="new-week-text">New week — let's go!</span>
          <span className="new-week-sub">First sale takes the lead</span>
        </div>
      )}

      <div className="rank-list">
        {ranked.map((r, i) => (
          <div key={r.name} className={`rank-card${i === 0 ? ' rank-gold' : ''}`}>
            <div className="rank-pos">
              {i < 3 ? <span className="medal">{MEDALS[i]}</span> : <span className="rank-num">#{i + 1}</span>}
            </div>
            <div className="rank-info">
              <span className="rank-name">{r.name}</span>
              <div className="rank-cats">
                {CATEGORIES.map((c) => (
                  <span key={c} className="rank-cat-chip">
                    {CAT_ICONS[c]} {r.catCounts[c]}
                  </span>
                ))}
                <span className="rank-bottles">{r.totalBottles} bottles</span>
              </div>
              {r.goal && (
                <div className="goal-bar-wrap">
                  <div className="goal-bar">
                    <div
                      className="goal-fill"
                      style={{ width: `${Math.min(100, (r.totalPts / r.goal) * 100)}%` }}
                    />
                  </div>
                  <span className="goal-label">{r.totalPts}/{r.goal} pts</span>
                </div>
              )}
            </div>
            <div className="rank-scores">
              <span className="rank-pts">{r.totalPts} pts</span>
              <span className="rank-bonus">${r.totalBonus}</span>
            </div>
          </div>
        ))}
      </div>

      {lastWeek && (
        <>
          <div className="ornament-sm" style={{ marginTop: 24 }}>── Last Week ──</div>
          <div className="rank-list last-week">
            {lastWeek.totals.slice(0, 3).map((r, i) => (
              <div key={r.name} className="rank-card mini">
                <span className="medal">{MEDALS[i]}</span>
                <span className="rank-name">{r.name}</span>
                <span className="rank-pts">{r.totalPts} pts</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
