const ResultsDashboard = ({ results, onRestart }) => {
    const exportToCSV = () => {
        const headers = ["ID Manipulanta", "Cesty", "Vzdalenost (m)", "Hmotnost (kg)"];
        const rows = results.manipulants.map(m => [
            m.id,
            m.trips,
            Math.round(m.dist),
            m.weight
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `simulace_vysledky_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const chartDataTrips = {
        labels: results.manipulants.map(m => `M #${m.id}`),
        datasets: [{
            label: 'Cesty',
            data: results.manipulants.map(m => m.trips),
            backgroundColor: '#DA291C',
            borderRadius: 4,
        }],
    };

    const options = {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
            x: { grid: { display: false } }
        }
    };

    return (
        <div className="results-dashboard animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>📊 Analýza simulace</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Souhrn výkonu logistické trasy</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-outline" onClick={exportToCSV}>📥 Exportovat CSV</button>
                    <button className="btn btn-primary" onClick={onRestart}>🔄 Nový projekt</button>
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                    <div className="label">Celkem cest</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{results.stats.trips}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent)' }}>
                    <div className="label">Vzdálenost (km)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{(results.stats.distance / 1000).toFixed(2)}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                    <div className="label">Palet celkem</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{results.stats.trips}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
                    <div className="label">Hmotnost (t)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{(results.stats.weight / 1000).toFixed(2)}</div>
                </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                <div className="card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Výkon manipulantů</h3>
                    <Bar data={chartDataTrips} options={options} />
                </div>
                <div className="card">
                    <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Srovnávací tabulka</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                                    <th style={{ padding: '0.75rem 0' }}>ID</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Cesty</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Km</th>
                                    <th style={{ padding: '0.75rem 0', textAlign: 'right' }}>Využití</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.manipulants.map(m => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                        <td style={{ padding: '0.75rem 0' }}><strong>M#{m.id}</strong></td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{m.trips}</td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{(m.dist / 1000).toFixed(2)}</td>
                                        <td style={{ padding: '0.75rem 0', textAlign: 'right' }}>{((m.trips / results.stats.trips) * 100).toFixed(0)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResultsDashboard;
