import { useState } from 'react';
import { CATEGORIES, CAT_ICONS, CAT_COLORS } from '../constants';
import CategorySection from '../components/CategorySection';

export default function MySales({ employees, bottles, sales, goals, onSell }) {
  const [emp, setEmp] = useState(employees[0] || '');
  const [catFilter, setCatFilter] = useState('All');

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
  const filteredCategories = catFilter === 'All' ? CATEGORIES : [catFilter];

  return (
    <div className="tab-content mysales">
      <h2 className="tab-title">My Sales</h2>
      <div className="ornament-sm">── ✦ ──</div>

      <div className="pill-row">
        {employees.map((e) => (
          <button
            key={e}
            className={`pill${emp === e ? ' active' : ''}`}
            onClick={() => setEmp(e)}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value gold">{totalPts}</span>
          <span className="stat-label">Points</span>
        </div>
        <div className="stat-card">
          <span className="stat-value green">${totalBonus}</span>
          <span className="stat-label">Bonus</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{totalBottles}</span>
          <span className="stat-label">Bottles</span>
        </div>
      </div>

      <div className="cat-mini-row">
        {CATEGORIES.map((c) => (
          <div key={c} className="cat-mini" style={{ borderColor: CAT_COLORS[c] }}>
            <span className="cat-mini-icon">{CAT_ICONS[c]}</span>
            <span className="cat-mini-count">{catCounts[c]}</span>
            <span className="cat-mini-label">{c}</span>
          </div>
        ))}
      </div>

      {goal && (
        <div className="goal-bar-wrap" style={{ margin: '12px 0' }}>
          <div className="goal-bar">
            <div
              className="goal-fill"
              style={{ width: `${Math.min(100, (totalPts / goal) * 100)}%` }}
            />
          </div>
          <span className="goal-label">Goal: {totalPts}/{goal} pts</span>
        </div>
      )}

      <div className="filter-tabs">
        {['All', ...CATEGORIES].map((c) => (
          <button
            key={c}
            className={`filter-tab${catFilter === c ? ' active' : ''}`}
            onClick={() => setCatFilter(c)}
          >
            {c === 'All' ? 'All' : `${CAT_ICONS[c]} ${c}`}
          </button>
        ))}
      </div>

      {filteredCategories.map((cat) => {
        const catBottles = bottles.filter((b) => b.category === cat);
        return (
          <CategorySection
            key={cat}
            category={cat}
            bottles={catBottles}
            soldCounts={empSales}
            onSell={(bottleId) => onSell(emp, bottleId)}
          />
        );
      })}
    </div>
  );
}
