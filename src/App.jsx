import { useState, useCallback } from 'react';
import { STORAGE_KEYS, DEFAULT_BOTTLES, DEFAULT_EMPLOYEES, CATEGORIES } from './constants';
import { load, save } from './storage';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FlashBanner from './components/FlashBanner';
import Rankings from './tabs/Rankings';
import MySales from './tabs/MySales';
import Manager from './tabs/Manager';
import Guide from './tabs/Guide';

function App() {
  const [tab, setTab] = useState('rankings');
  const [bottles, setBottles] = useState(() => load(STORAGE_KEYS.BOTTLES, DEFAULT_BOTTLES));
  const [employees, setEmployees] = useState(() => load(STORAGE_KEYS.EMPLOYEES, DEFAULT_EMPLOYEES));
  const [sales, setSales] = useState(() => load(STORAGE_KEYS.SALES, {}));
  const [goals, setGoals] = useState(() => load(STORAGE_KEYS.GOALS, {}));
  const [history, setHistory] = useState(() => load(STORAGE_KEYS.HISTORY, []));
  const [flash, setFlash] = useState(null);

  const persist = (key, val, setter) => {
    setter(val);
    save(key, val);
  };

  const handleSell = useCallback((empName, bottleId) => {
    setSales((prev) => {
      const next = { ...prev };
      if (!next[empName]) next[empName] = {};
      next[empName] = { ...next[empName], [bottleId]: (next[empName][bottleId] || 0) + 1 };
      save(STORAGE_KEYS.SALES, next);
      return next;
    });
    const bottle = bottles.find((b) => b.id === bottleId);
    setFlash(`${empName} sold ${bottle?.name || 'a bottle'}!`);
  }, [bottles]);

  const handleSetGoal = (empName, target) => {
    const next = { ...goals, [empName]: target };
    persist(STORAGE_KEYS.GOALS, next, setGoals);
  };

  const handleResetWeek = () => {
    if (!confirm('Save snapshot and reset all sales for the new week?')) return;
    const totals = employees
      .map((emp) => {
        const es = sales[emp] || {};
        let totalPts = 0, totalBonus = 0;
        bottles.forEach((b) => {
          const c = es[b.id] || 0;
          totalPts += c * b.points;
          totalBonus += c * b.bonus;
        });
        return { name: emp, totalPts, totalBonus };
      })
      .sort((a, b) => b.totalPts - a.totalPts);

    const snap = { week: new Date().toISOString().slice(0, 10), totals };
    const nextHistory = [...history, snap];
    persist(STORAGE_KEYS.HISTORY, nextHistory, setHistory);
    persist(STORAGE_KEYS.SALES, {}, setSales);
  };


  return (
    <div className="app">
      <FlashBanner message={flash} onDone={() => setFlash(null)} />
      <Header />

      <main className="main">
        {tab === 'rankings' && (
          <div>
            <Rankings
              employees={employees}
              bottles={bottles}
              sales={sales}
              goals={goals}
              history={history}
            />
            <div style={{ padding: '0 16px 24px', textAlign: 'center' }}>
              <button className="btn-ghost danger" onClick={handleResetWeek}>
                Reset for New Week
              </button>
            </div>
          </div>
        )}
        {tab === 'mysales' && (
          <MySales
            employees={employees}
            bottles={bottles}
            sales={sales}
            goals={goals}
            onSell={handleSell}
          />
        )}
        {tab === 'manager' && (
          <Manager
            employees={employees}
            bottles={bottles}
            sales={sales}
            goals={goals}
            onSell={handleSell}
            onSetGoal={handleSetGoal}
          />
        )}
        {tab === 'guide' && <Guide bottles={bottles} />}
      </main>

      <BottomNav active={tab} onNav={setTab} />
    </div>
  );
}

export default App;
