import { useState } from 'react';
import { CATEGORIES, CAT_ICONS, CAT_COLORS } from '../constants';

export default function Setup({ bottles, employees, onAddBottle, onRemoveBottle, onAddEmployee, onRemoveEmployee }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Wine');
  const [points, setPoints] = useState('');
  const [bonus, setBonus] = useState('');
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [t3, setT3] = useState('');
  const [pairing, setPairing] = useState('');
  const [cocktail, setCocktail] = useState('');
  const [empName, setEmpName] = useState('');

  const handleAddBottle = () => {
    if (!name || !points || !bonus) return;
    onAddBottle({
      id: 'b_' + Date.now(),
      name,
      category,
      points: parseInt(points),
      bonus: parseInt(bonus),
      talking: [t1, t2, t3].filter(Boolean),
      pairing: pairing || '',
      cocktail: cocktail || '',
    });
    setName(''); setPoints(''); setBonus('');
    setT1(''); setT2(''); setT3('');
    setPairing(''); setCocktail('');
  };

  const handleAddEmployee = () => {
    if (!empName.trim()) return;
    onAddEmployee(empName.trim());
    setEmpName('');
  };

  return (
    <div className="tab-content setup">
      <h2 className="tab-title">Setup</h2>
      <div className="ornament-sm">── ✦ ──</div>

      <div className="setup-section">
        <h3 className="section-label">Add Bottle</h3>
        <div className="setup-form">
          <input className="input" placeholder="Bottle name" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="cat-toggle">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`cat-toggle-btn${category === c ? ' active' : ''}`}
                style={category === c ? { background: CAT_COLORS[c] } : {}}
                onClick={() => setCategory(c)}
              >
                {CAT_ICONS[c]} {c}
              </button>
            ))}
          </div>
          <div className="row-2">
            <input className="input" type="number" placeholder="Points" value={points} onChange={(e) => setPoints(e.target.value)} />
            <input className="input" type="number" placeholder="Bonus $" value={bonus} onChange={(e) => setBonus(e.target.value)} />
          </div>
          <input className="input" placeholder="Talking point 1" value={t1} onChange={(e) => setT1(e.target.value)} />
          <input className="input" placeholder="Talking point 2" value={t2} onChange={(e) => setT2(e.target.value)} />
          <input className="input" placeholder="Talking point 3" value={t3} onChange={(e) => setT3(e.target.value)} />
          <input className="input" placeholder="Food pairing" value={pairing} onChange={(e) => setPairing(e.target.value)} />
          <input className="input" placeholder="Cocktail / Serve" value={cocktail} onChange={(e) => setCocktail(e.target.value)} />
          <button className="btn-gold" onClick={handleAddBottle}>Add Bottle</button>
        </div>
      </div>

      <div className="setup-section">
        <h3 className="section-label">Current Bottles</h3>
        {CATEGORIES.map((cat) => {
          const catBottles = bottles.filter((b) => b.category === cat);
          if (catBottles.length === 0) return null;
          return (
            <div key={cat} className="setup-cat">
              <h4 style={{ color: CAT_COLORS[cat] }}>{CAT_ICONS[cat]} {cat}</h4>
              {catBottles.map((b) => (
                <div key={b.id} className="setup-bottle-row">
                  <span>{b.name}</span>
                  <span className="bottle-pts">{b.points}pts / ${b.bonus}</span>
                  <button className="btn-remove" onClick={() => onRemoveBottle(b.id)}>Remove</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="setup-section">
        <h3 className="section-label">Employees</h3>
        <div className="emp-add-row">
          <input className="input" placeholder="Employee name" value={empName} onChange={(e) => setEmpName(e.target.value)} />
          <button className="btn-gold" onClick={handleAddEmployee}>Add</button>
        </div>
        <div className="emp-list">
          {employees.map((e) => (
            <div key={e} className="emp-row">
              <span>{e}</span>
              <button className="btn-remove" onClick={() => onRemoveEmployee(e)}>Remove</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
