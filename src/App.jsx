import React, { useState } from 'react';
import './index.css';
import HallLayout from './HallLayout';
import OrderManagement from './OrderManagement';
import RouteEditor from './RouteEditor';
import Simulator from './Simulator';
import ResultsDashboard from './ResultsDashboard';

function App() {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    name: 'Magna Line A',
    manipulants: 2,
    speed: 4.0
  });

  const [orders, setOrders] = useState([
    { id: 'o1', sap: '136333150100', product: 'F40 VODICI PROFIL', quantity: 480, pieces: 16, weight: 10, cycle: 30 }
  ]);

  const [objects, setObjects] = useState({
    machines: [
      { id: 'm1', name: 'Stroj A', type: 'machine', subType: 'Injection', x: 200, y: 150, w: 100, h: 80, color: '#DA291C', handover: { x: 120, y: 40 } },
      { id: 'm2', name: 'Stroj B', type: 'machine', subType: 'Injection', x: 200, y: 300, w: 100, h: 80, color: '#DA291C', handover: { x: 120, y: 40 } },
      { id: 'm3', name: 'Stroj C', type: 'machine', subType: 'Assembly', x: 200, y: 450, w: 100, h: 80, color: '#DA291C', handover: { x: 120, y: 40 } }
    ],
    warehouses: [
      { id: 'w1', name: 'Sklad 1', cap: 100, x: 950, y: 200, w: 150, h: 100, color: '#4298B5', handover: { x: -20, y: 50 } },
      { id: 'w2', name: 'Sklad 2', cap: 80, x: 950, y: 400, w: 150, h: 100, color: '#4298B5', handover: { x: -20, y: 50 } }
    ]
  });

  const [bgImage, setBgImage] = useState(null);
  const [bgScale, setBgScale] = useState(100);
  const [corridors, setCorridors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [simResults, setSimResults] = useState(null);

  const savePreset = () => {
    const preset = { config, orders, objects, corridors, routes };
    localStorage.setItem('sim_preset_' + config.name, JSON.stringify(preset));
    alert('Konfigurace "' + config.name + '" uložena.');
  };

  const loadPreset = (name) => {
    const saved = localStorage.getItem('sim_preset_' + name);
    if (!saved) return;
    const { config: c, orders: o, objects: obj, corridors: corr, routes: r } = JSON.parse(saved);
    setConfig(c); setOrders(o); setObjects(obj); setCorridors(corr); setRoutes(r);
    alert('Konfigurace načtena.');
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSimFinish = (results) => {
    setSimResults(results);
    setStep(6);
  };

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">M</div>
          <div>
            <div className="brand-name">Magna OS</div>
            <div className="brand-sub">Simulátor V26</div>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className={`menu-item ${step === 1 ? 'active' : ''}`} onClick={() => setStep(1)}>
            <span className="icon">⚙️</span> Konfigurace
          </div>
          <div className={`menu-item ${step === 2 ? 'active' : ''}`} onClick={() => setStep(2)}>
            <span className="icon">📋</span> Zakázky
          </div>
          <div className={`menu-item ${step === 3 ? 'active' : ''}`} onClick={() => setStep(3)}>
            <span className="icon">🏭</span> Layout
          </div>
          <div className={`menu-item ${step === 4 ? 'active' : ''}`} onClick={() => setStep(4)}>
            <span className="icon">🗺️</span> Trasy
          </div>
          <div className={`menu-item ${step === 5 ? 'active' : ''}`} onClick={() => setStep(5)}>
            <span className="icon">▶️</span> Simulace
          </div>
          <div className={`menu-item ${step === 6 ? 'active' : ''}`} onClick={() => setStep(6)}>
            <span className="icon">📊</span> Výsledky
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="status-badge success">Online</div>
          <div className="project-name">{config.name}</div>
        </div>
      </nav>

      <main className="content-area">
        <header className="top-bar">
          <div className="step-tag">{getStepName(step)}</div>
          <div className="top-actions">
            <button className="btn btn-sm btn-outline" onClick={savePreset}>💾 Uložit</button>
            <button className="btn btn-sm btn-outline" onClick={() => {
              const name = prompt('Zadejte název konfigurace k načtení:', config.name);
              if (name) loadPreset(name);
            }}>📂 Načíst</button>
          </div>
        </header>

        <div className="scroll-content">
          <div className="animate-fade-in">
            {step === 1 && (
              <div className="card">
                <h2>⚙️ Konfigurace projektu</h2>
                <div className="form-group">
                  <label className="label">Název konfigurace</label>
                  <input
                    type="text"
                    className="input"
                    value={config.name}
                    onChange={e => setConfig({ ...config, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-2">
                  <div className="form-group">
                    <label className="label">Počet manipulantů: {config.manipulants}</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={config.manipulants}
                      onChange={e => setConfig({ ...config, manipulants: parseInt(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>1</span><span>10</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Rychlost chůze: {config.speed} m/s</label>
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.1"
                      value={config.speed}
                      onChange={e => setConfig({ ...config, speed: parseFloat(e.target.value) })}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>1.0</span><span>8.0</span>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '2rem' }}>
                  <button className="btn btn-primary" onClick={nextStep}>Pokračovat na zakázky →</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <OrderManagement orders={orders} setOrders={setOrders} objects={objects} />
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={prevStep}>← Zpět</button>
                  <button className="btn btn-primary" onClick={nextStep}>Pokračovat na layout →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>🏭 Layout - Stroje a sklady</h2>
                </div>
                <HallLayout
                  objects={objects}
                  setObjects={setObjects}
                  bgImage={bgImage}
                  setBgImage={setBgImage}
                  bgScale={bgScale}
                  setBgScale={setBgScale}
                />
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={prevStep}>← Zpět</button>
                  <button className="btn btn-primary" onClick={nextStep}>Pokračovat na trasy →</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>🗺️ Kreslení tras</h2>
                </div>
                <RouteEditor
                  objects={objects}
                  corridors={corridors}
                  setCorridors={setCorridors}
                  routes={routes}
                  setRoutes={setRoutes}
                  bgImage={bgImage}
                  bgScale={bgScale}
                />
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                  <button className="btn btn-outline" onClick={prevStep}>← Zpět</button>
                  <button className="btn btn-primary" onClick={nextStep}>Spustit simulaci ▶️</button>
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>🎮 Simulace v reálném čase</h2>
                </div>
                <Simulator
                  config={config}
                  objects={objects}
                  routes={routes}
                  orders={orders}
                  bgImage={bgImage}
                  bgScale={bgScale}
                  onFinish={handleSimFinish}
                />
              </div>
            )}

            {step === 6 && (
              <div>
                {simResults ? (
                  <ResultsDashboard results={simResults} onRestart={() => setStep(1)} />
                ) : <p>Čekání na výsledky...</p>}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function getStepName(step) {
  switch (step) {
    case 1: return 'Konfigurace';
    case 2: return 'Zakázky';
    case 3: return 'Layout';
    case 4: return 'Trasy';
    case 5: return 'Simulace';
    case 6: return 'Výsledky';
    default: return '';
  }
}

export default App;
