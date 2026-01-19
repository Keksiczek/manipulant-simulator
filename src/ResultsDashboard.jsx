import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const ResultsDashboard = ({ results, onRestart }) => {
    const chartDataTrips = {
        labels: results.manipulants.map(m => `Manipulant #${m.id}`),
        datasets: [{
            label: 'Počet cest',
            data: results.manipulants.map(m => m.trips),
            backgroundColor: '#32808d',
        }],
    };

    const chartDataDist = {
        labels: results.manipulants.map(m => `Manipulant #${m.id}`),
        datasets: [{
            label: 'Vzdálenost (m)',
            data: results.manipulants.map(m => Math.round(m.dist)),
            backgroundColor: '#4298B5',
        }],
    };

    const options = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } }, x: { grid: { display: false } } }
    };

    return (
        <div className="results-dashboard animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2>📊 Výsledky simulace</h2>
                <button className="btn btn-primary" onClick={onRestart}>🔄 Nová simulace</button>
            </div>

            <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{results.stats.trips}</div>
                    <div className="label">Cest celkem</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 'bold' }}>{Math.round(results.stats.distance)} m</div>
                    <div className="label">Vzdálenost</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--success)', fontWeight: 'bold' }}>{results.stats.trips}</div>
                    <div className="label">Palet</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--warning)', fontWeight: 'bold' }}>{results.stats.weight} kg</div>
                    <div className="label">Hmotnost</div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Výkon manipulantů (Cesty)</h3>
                    <Bar data={chartDataTrips} options={options} />
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Vzdálenost (Metry)</h3>
                    <Bar data={chartDataDist} options={options} />
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Manipulant</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Cesty</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Vzdálenost</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Hmotnost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.manipulants.map(m => (
                            <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}><strong>Manipulant #{m.id}</strong></td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{m.trips}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{Math.round(m.dist)} m</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{m.weight} kg</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ResultsDashboard;
