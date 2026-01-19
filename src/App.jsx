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
      { id: 'm1', name: 'Stroj A', type: 'Injection Molding', x: 200, y: 150, w: 100, h: 80, color: '#DA291C' },
      { id: 'm2', name: 'Stroj B', type: 'Injection Molding', x: 200, y: 300, w: 100, h: 80, color: '#DA291C' },
      { id: 'm3', name: 'Stroj C', type: 'Assembly', x: 200, y: 450, w: 100, h: 80, color: '#DA291C' }
    ],
    warehouses: [
      { id: 'w1', name: 'Sklad 1', cap: 100, x: 950, y: 200, w: 150, h: 100, color: '#4298B5' },
      { id: 'w2', name: 'Sklad 2', cap: 80, x: 950, y: 400, w: 150, h: 100, color: '#4298B5' }
    ]
  });

  const [bgImage, setBgImage] = useState(null);
  const [bgScale, setBgScale] = useState(100);
  const [corridors, setCorridors] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [simResults, setSimResults] = useState(null);

  const nextStep = () => setStep(s => Math.min(s + 1, 6));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSimFinish = (results) => {
    setSimResults(results);
    setStep(6);
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>🏭 Magna Automotive <span>Simulátor V26</span></h1>
        <div className="step-indicator" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: i === step ? 'var(--primary)' : (i < step ? 'var(--success)' : 'var(--border)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'
            }}>
              {i < step ? '✓' : i}
            </div>
          ))}
          <span style={{ marginLeft: '0.5rem', color: 'var(--text-muted)' }}>{getStepName(step)}</span>
        </div>
      </header>

      <main className="main-content">
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
              <OrderManagement orders={orders} setOrders={setOrders} />
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
                bgImage={bgImage}
                bgScale={bgScale}
                onFinish={handleSimFinish}
              />
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button className="btn btn-outline" onClick={prevStep}>← Zpět</button>
              </div>
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
