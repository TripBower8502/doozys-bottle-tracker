const MANAGER_TABS = [
  { id: 'manager', label: 'Dashboard', icon: '📋' },
  { id: 'rankings', label: 'Rankings', icon: '🏆' },
  { id: 'guide', label: 'Guide', icon: '📖' },
  { id: 'schedule', label: 'Schedule', icon: '🗓' },
];

const EMPLOYEE_TABS = [
  { id: 'rankings', label: 'Rankings', icon: '🏆' },
  { id: 'mysales', label: 'My Sales', icon: '📊' },
  { id: 'guide', label: 'Guide', icon: '📖' },
  { id: 'schedule', label: 'Schedule', icon: '🗓' },
];

export default function BottomNav({ active, onNav, isManager }) {
  const tabs = isManager ? MANAGER_TABS : EMPLOYEE_TABS;
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
