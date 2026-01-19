import React, { useRef, useEffect, useState } from 'react';

const Simulator = ({ config, objects, routes, bgImage, bgScale, onFinish }) => {
    const canvasRef = useRef(null);
    const [sim, setSim] = useState({ run: true, pause: false, time: 0, speed: 1 });
    const [manipulants, setManipulants] = useState([]);
    const [stats, setStats] = useState({ trips: 0, distance: 0, weight: 0 });
    const [log, setLog] = useState([]);

    useEffect(() => {
        // Initialize manipulants
        const initial = [];
        for (let i = 0; i < config.manipulants; i++) {
            const route = routes[i % routes.length];
            if (!route) continue;
            initial.push({
                id: i + 1,
                x: route.x1, y: route.y1,
                targetX: route.x2, targetY: route.y2,
                returnX: route.x1, returnY: route.y1,
                state: 'moving', carry: false, trips: 0, dist: 0, weight: 0, loadingTime: 0
            });
        }
        setManipulants(initial);
    }, []);

    useEffect(() => {
        let requestRef;
        const animate = () => {
            if (!sim.run || sim.pause) return;

            setSim(prev => {
                const nextTime = prev.time + 0.1 * prev.speed;
                if (nextTime > 300) { // Auto-stop after 300s of sim time
                    onFinish({ manipulants, stats, log, time: nextTime });
                    return { ...prev, run: false };
                }
                return { ...prev, time: nextTime };
            });

            setManipulants(prevM => prevM.map(m => {
                const dx = m.targetX - m.x;
                const dy = m.targetY - m.y;
                const d = Math.sqrt(dx * dx + dy * dy);

                if (d < 3) {
                    if (!m.carry) {
                        if (m.loadingTime === 0) return { ...m, state: 'loading', loadingTime: 1 };
                        if (m.loadingTime < 30) return { ...m, loadingTime: m.loadingTime + 1 };
                        return { ...m, carry: true, state: 'moving', loadingTime: 0 };
                    } else {
                        if (m.loadingTime === 0) return { ...m, state: 'unloading', loadingTime: 1 };
                        if (m.loadingTime < 30) return { ...m, loadingTime: m.loadingTime + 1 };

                        // Stats update
                        setStats(s => ({ ...s, trips: s.trips + 1, weight: s.weight + 10 }));

                        return {
                            ...m, carry: false, trips: m.trips + 1, weight: m.weight + 10,
                            state: 'moving', loadingTime: 0,
                            targetX: m.returnX, targetY: m.returnY,
                            returnX: m.targetX, returnY: m.targetY
                        };
                    }
                } else {
                    const moveSpeed = config.speed * 2 * sim.speed;
                    const nx = m.x + (dx / d) * moveSpeed;
                    const ny = m.y + (dy / d) * moveSpeed;
                    setStats(s => ({ ...s, distance: s.distance + moveSpeed / 10 }));
                    return { ...m, x: nx, y: ny, dist: m.dist + moveSpeed / 10 };
                }
            }));

            requestRef = requestAnimationFrame(animate);
        };

        requestRef = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef);
    }, [sim.run, sim.pause, sim.speed]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (bgImage) {
            const scale = bgScale / 100;
            ctx.globalAlpha = 0.3;
            ctx.drawImage(bgImage, (canvas.width - bgImage.width * scale) / 2, (canvas.height - bgImage.height * scale) / 2, bgImage.width * scale, bgImage.height * scale);
            ctx.globalAlpha = 1;
        }

        // Grid
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

        // Objects
        [...objects.machines, ...objects.warehouses].forEach(o => {
            ctx.fillStyle = o.color; ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(o.x, o.y, o.w, o.h);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(o.name, o.x + o.w / 2, o.y + o.h / 2);
        });

        // Manipulants
        manipulants.forEach(m => {
            ctx.fillStyle = m.carry ? 'var(--warning)' : '#FFD700';
            ctx.beginPath(); ctx.arc(m.x, m.y, 14, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
            ctx.fillStyle = '#000'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(m.id, m.x, m.y + 4);

            // Indicator
            let stateColor = '#64748b';
            if (m.state === 'moving') stateColor = '#10b981';
            else if (m.state === 'loading') stateColor = '#f59e0b';
            else if (m.state === 'unloading') stateColor = '#3b82f6';
            ctx.fillStyle = stateColor; ctx.beginPath(); ctx.arc(m.x, m.y - 20, 5, 0, Math.PI * 2); ctx.fill();
        });
    };

    useEffect(() => { draw(); }, [manipulants]);

    const formatTime = (sec) => {
        const min = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    return (
        <div className="simulator">
            <div className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => setSim({ ...sim, pause: !sim.pause })}>
                    {sim.pause ? '▶️ Pokračovat' : '⏸️ Pauza'}
                </button>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[1, 2, 5, 10].map(s => (
                        <button key={s} className={`btn btn-sm ${sim.speed === s ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSim({ ...sim, speed: s })}>{s}x</button>
                    ))}
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '1.25rem', fontWeight: 'bold' }}>
                    ⏱️ {formatTime(sim.time)}
                </div>
            </div>

            <div className="grid grid-4" style={{ marginBottom: '1.5rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 'bold' }}>{stats.trips}</div>
                    <div className="label">Cest celkem</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--accent)', fontWeight: 'bold' }}>{Math.round(stats.distance)} m</div>
                    <div className="label">Vzdálenost</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--success)', fontWeight: 'bold' }}>{stats.trips}</div>
                    <div className="label">Palet</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', color: 'var(--warning)', fontWeight: 'bold' }}>{stats.weight} kg</div>
                    <div className="label">Hmotnost</div>
                </div>
            </div>

            <canvas ref={canvasRef} width={1200} height={600} />
        </div>
    );
};

export default Simulator;
