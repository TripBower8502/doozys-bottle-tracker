const TABS = [
  { id: 'rankings', label: 'Rankings', icon: '🏆' },
  { id: 'mysales', label: 'My Sales', icon: '📊' },
  { id: 'manager', label: 'Manager', icon: '📋' },
  { id: 'guide', label: 'Guide', icon: '📖' },
];

export default function BottomNav({ active, onNav }) {
  return (
    <nav className="bottom-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          className={`nav-btn${active === t.id ? ' active' : ''}`}
          onClick={() => onNav(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span className="nav-label">{t.label}</span>
        </button>
      ))}
    </nav>
  );
}
