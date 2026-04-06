const ALL_TABS = [
  { id: 'rankings', label: 'Rankings', icon: '🏆' },
  { id: 'mysales', label: 'My Sales', icon: '📊' },
  { id: 'manager', label: 'Manager', icon: '📋', managerOnly: true },
  { id: 'guide', label: 'Guide', icon: '📖' },
  { id: 'schedule', label: 'Schedule', icon: '🗓' },
];

export default function BottomNav({ active, onNav, isManager }) {
  const tabs = isManager ? ALL_TABS : ALL_TABS.filter((t) => !t.managerOnly);
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
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
