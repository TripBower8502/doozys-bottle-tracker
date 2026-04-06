import { CAT_ICONS, CAT_COLORS } from '../constants';

export default function CategorySection({ category, bottles, soldCounts, onSell, readOnly }) {
  return (
    <div className="cat-section">
      <h3 className="cat-header" style={{ color: CAT_COLORS[category] }}>
        {CAT_ICONS[category]} {category}
      </h3>
      <div className="bottle-list">
        {bottles.map((b) => {
          const count = soldCounts[b.id] || 0;
          return (
            <div key={b.id} className="bottle-card">
              <div className="bottle-info">
                <span className="bottle-name">{b.name}</span>
                <div className="bottle-meta">
                  <span className="bottle-pts">{b.points} pts</span>
                  <span className="bottle-bonus">${b.bonus}</span>
                  {count > 0 && <span className="bottle-sold">×{count}</span>}
                </div>
              </div>
              {!readOnly && <button className="sell-btn" onClick={() => onSell(b.id)}>+</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
