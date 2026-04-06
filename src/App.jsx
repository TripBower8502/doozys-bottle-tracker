import { useState, useEffect, useCallback } from 'react';
import { DEFAULT_BOTTLES, DEFAULT_EMPLOYEES } from './constants';
import { db, ref, onValue, set, update } from './firebase';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import FlashBanner from './components/FlashBanner';
import Rankings from './tabs/Rankings';
import MySales from './tabs/MySales';
import Manager from './tabs/Manager';
import Guide from './tabs/Guide';

function getRole(employeeList) {
  const hash = window.location.hash.replace('#', '').replace(/^\//, '');
  if (hash === 'manager') return { isManager: true, lockedEmployee: null };
  const match = employeeList.find((e) => e.toLowerCase() === hash.toLowerCase());
  return { isManager: false, lockedEmployee: match || employeeList[0] || null };
}

function App() {
  const [bottles, setBottles] = useState(DEFAULT_BOTTLES);
  const [employees, setEmployees] = useState(DEFAULT_EMPLOYEES);
  const { isManager, lockedEmployee } = getRole(employees);
  const [tab, setTab] = useState('rankings');
  const [sales, setSales] = useState({});
  const [goals, setGoals] = useState({});
  const [history, setHistory] = useState([]);
  const [flash, setFlash] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Subscribe to Firebase on mount
  useEffect(() => {
    const unsubs = [];

    unsubs.push(onValue(ref(db, 'bottles'), (snap) => {
      const val = snap.val();
      if (val) setBottles(val);
    }));

    unsubs.push(onValue(ref(db, 'employees'), (snap) => {
      const val = snap.val();
      if (val) setEmployees(val);
    }));

    unsubs.push(onValue(ref(db, 'sales'), (snap) => {
      setSales(snap.val() || {});
    }));

    unsubs.push(onValue(ref(db, 'goals'), (snap) => {
      setGoals(snap.val() || {});
    }));

    unsubs.push(onValue(ref(db, 'history'), (snap) => {
      setHistory(snap.val() || []);
    }));

    // Mark loaded after first data arrives
    onValue(ref(db, 'bottles'), () => setLoaded(true), { onlyOnce: true });

    return () => unsubs.forEach((fn) => fn());
  }, []);

  // Seed defaults if database is empty (first run)
  useEffect(() => {
    if (!loaded) return;
    const seedRef = ref(db, 'bottles');
    onValue(seedRef, (snap) => {
      if (!snap.exists()) {
        set(ref(db, 'bottles'), DEFAULT_BOTTLES);
        set(ref(db, 'employees'), DEFAULT_EMPLOYEES);
        set(ref(db, 'sales'), {});
        set(ref(db, 'goals'), {});
        set(ref(db, 'history'), []);
      }
    }, { onlyOnce: true });
  }, [loaded]);

  const handleSell = useCallback((empName, bottleId) => {
    const currentCount = (sales[empName] && sales[empName][bottleId]) || 0;
    update(ref(db, `sales/${empName}`), { [bottleId]: currentCount + 1 });
    const bottle = bottles.find((b) => b.id === bottleId);
    setFlash(`${empName} sold ${bottle?.name || 'a bottle'}!`);
  }, [bottles, sales]);

  const handleUndoSell = useCallback((empName, bottleId) => {
    const currentCount = (sales[empName] && sales[empName][bottleId]) || 0;
    if (currentCount <= 0) return;
    update(ref(db, `sales/${empName}`), { [bottleId]: currentCount - 1 });
    const bottle = bottles.find((b) => b.id === bottleId);
    setFlash(`Removed 1 ${bottle?.name || 'bottle'} from ${empName}`);
  }, [bottles, sales]);

  const handleSetGoal = (empName, target) => {
    update(ref(db, 'goals'), { [empName]: target });
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
    set(ref(db, 'history'), nextHistory);
    set(ref(db, 'sales'), {});
  };

  if (!loaded) {
    return (
      <div className="app">
        <Header />
        <main className="main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--muted)', fontFamily: 'var(--font-display)', letterSpacing: 2 }}>Loading…</p>
        </main>
      </div>
    );
  }

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
            {isManager && (
              <div style={{ padding: '0 16px 24px', textAlign: 'center' }}>
                <button className="btn-ghost danger" onClick={handleResetWeek}>
                  Reset for New Week
                </button>
              </div>
            )}
          </div>
        )}
        {tab === 'mysales' && (
          <MySales
            employees={employees}
            bottles={bottles}
            sales={sales}
            goals={goals}
            onSell={handleSell}
            lockedEmployee={lockedEmployee}
          />
        )}
        {tab === 'manager' && isManager && (
          <Manager
            employees={employees}
            bottles={bottles}
            sales={sales}
            goals={goals}
            onSell={handleSell}
            onUndoSell={handleUndoSell}
            onSetGoal={handleSetGoal}
          />
        )}
        {tab === 'guide' && <Guide bottles={bottles} />}
      </main>

      <BottomNav active={tab} onNav={setTab} isManager={isManager} />
    </div>
  );
}

export default App;
