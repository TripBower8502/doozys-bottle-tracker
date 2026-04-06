import { useState } from 'react';
import { CAT_ICONS, CAT_COLORS } from '../constants';

export default function GuideSection({ category, bottles }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div className="guide-section">
      <h3 className="cat-header" style={{ color: CAT_COLORS[category] }}>
        {CAT_ICONS[category]} {category}
      </h3>
      <div className="guide-list">
        {bottles.map((b) => {
          const open = expanded === b.id;
          return (
            <div key={b.id} className={`guide-card${open ? ' open' : ''}`}>
              <button
                className="guide-card-header"
                onClick={() => setExpanded(open ? null : b.id)}
              >
                <span className="guide-bottle-name">{b.name}</span>
                <span className="guide-pts">
                  {b.points} pts / ${b.bonus}
                </span>
                <span className="guide-chevron">{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <div className="guide-panel">
                  <div className="guide-block">
                    <h4>🗣 What to Say</h4>
                    <ul>
                      {b.talking.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="guide-block">
                    <h4>🍽 Food Pairing</h4>
                    <p>{b.pairing}</p>
                  </div>
                  <div className="guide-block">
                    <h4>🍹 Cocktail / Serve</h4>
                    <p>{b.cocktail}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
