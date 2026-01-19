import React, { useRef, useEffect, useState } from 'react';

const Simulator = ({ config, objects, routes, orders, bgImage, bgScale, onFinish }) => {
    const canvasRef = useRef(null);
    const [sim, setSim] = useState({ run: false, pause: false, speed: 1, time: 0 });
    const [manipulants, setManipulants] = useState([]);
    const [stats, setStats] = useState({ trips: 0, distance: 0, weight: 0 });
    const [orderQueue, setOrderQueue] = useState([]);
    const [heatmap, setHeatmap] = useState({}); // { "gx,gy": count }
    const [ticker, setTicker] = useState("Simulace připravena");

    const GRID_SIZE = 20;

    useEffect(() => {
        setOrderQueue([...orders]);
        const initial = [];
        for (let i = 0; i < config.manipulants; i++) {
            initial.push({
                id: i + 1,
                x: 50, y: 50,
                state: 'idle',
                currentPath: null,
                pointIndex: 0,
                targetOrder: null,
                carry: false, trips: 0, dist: 0, weight: 0, loadingTime: 0
            });
        }
        setManipulants(initial);
    }, [orders, config.manipulants]);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (bgImage) {
            const scale = bgScale / 100;
            ctx.globalAlpha = 0.4;
            ctx.drawImage(bgImage, (canvas.width - bgImage.width * scale) / 2, (canvas.height - bgImage.height * scale) / 2, bgImage.width * scale, bgImage.height * scale);
            ctx.globalAlpha = 1;
        }

        // Heatmap
        ctx.globalAlpha = 0.3;
        Object.entries(heatmap).forEach(([key, count]) => {
            const [gx, gy] = key.split(',').map(Number);
            const intensity = Math.min(count * 2, 255);
            ctx.fillStyle = `rgb(${intensity}, ${255 - intensity}, 50)`;
            ctx.fillRect(gx * GRID_SIZE, gy * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        });
        ctx.globalAlpha = 1;

        // Objects
        [...objects.machines, ...objects.warehouses].forEach(o => {
            ctx.fillStyle = o.color;
            ctx.fillRect(o.x, o.y, o.w, o.h);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.strokeRect(o.x, o.y, o.w, o.h);
            ctx.fillStyle = '#fff';
            ctx.font = '10px Inter';
            ctx.fillText(o.name, o.x, o.y - 5);
        });

        // Manipulants
        manipulants.forEach(m => {
            ctx.fillStyle = m.carry ? '#DA291C' : '#10b981';
            ctx.beginPath();
            ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Inter';
            ctx.fillText(`M${m.id}`, m.x - 8, m.y - 12);
        });
    };

    useEffect(() => {
        let requestRef;
        const animate = () => {
            if (!sim.run || sim.pause) return;

            setSim(prev => {
                const nextTime = prev.time + 0.1 * prev.speed;
                if (nextTime > 3600 || (stats.trips >= orders.length && orders.length > 0)) {
                    onFinish({ manipulants, stats, heatmap, time: nextTime });
                    return { ...prev, run: false };
                }
                return { ...prev, time: nextTime };
            });

            setManipulants(prevM => prevM.map(m => {
                // Update Heatmap
                const gx = Math.floor(m.x / GRID_SIZE);
                const gy = Math.floor(m.y / GRID_SIZE);
                const key = `${gx},${gy}`;
                setHeatmap(prevH => ({ ...prevH, [key]: (prevH[key] || 0) + 1 }));

                if (m.state === 'idle') {
                    if (orderQueue.length > 0) {
                        const order = orderQueue.shift();
                        setOrderQueue([...orderQueue]);
                        const route = routes.find(r => r.fromId === order.fromId && r.toId === order.toId);
                        if (route) {
                            setTicker(`M${m.id} -> ${order.product || 'vlečka'}`);
                            return { ...m, state: 'moving', currentPath: route.points, pointIndex: 0, targetOrder: order };
                        }
                    }
                    return m;
                }

                if (m.state === 'moving' && m.currentPath) {
                    const target = m.currentPath[m.pointIndex];
                    const dx = target.x - m.x;
                    const dy = target.y - m.y;
                    const d = Math.sqrt(dx * dx + dy * dy);

                    if (d < 5) {
                        if (m.pointIndex < m.currentPath.length - 1) return { ...m, pointIndex: m.pointIndex + 1 };
                        else return { ...m, state: m.carry ? 'unloading' : 'loading', loadingTime: 1 };
                    } else {
                        const moveSpeed = config.speed * 2 * sim.speed;
                        return { ...m, x: m.x + (dx / d) * moveSpeed, y: m.y + (dy / d) * moveSpeed, dist: m.dist + moveSpeed / 10 };
                    }
                }

                if (m.state === 'loading') {
                    if (m.loadingTime < 30) return { ...m, loadingTime: m.loadingTime + 1 };
                    return { ...m, state: 'moving', carry: true, loadingTime: 0, pointIndex: 0 };
                }

                if (m.state === 'unloading') {
                    if (m.loadingTime < 30) return { ...m, loadingTime: m.loadingTime + 1 };
                    setStats(s => ({ ...s, trips: s.trips + 1, weight: s.weight + (m.targetOrder.amount * 0.5) }));
                    const rev = [...m.currentPath].reverse();
                    return { ...m, state: 'returning', carry: false, loadingTime: 0, pointIndex: 0, currentPath: rev, trips: m.trips + 1, weight: m.weight + (m.targetOrder.amount * 0.5) };
                }

                if (m.state === 'returning' && m.currentPath) {
                    const target = m.currentPath[m.pointIndex];
                    const dx = target.x - m.x;
                    const dy = target.y - m.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < 5) {
                        if (m.pointIndex < m.currentPath.length - 1) return { ...m, pointIndex: m.pointIndex + 1 };
                        else return { ...m, state: 'idle', currentPath: null, targetOrder: null };
                    } else {
                        const moveSpeed = config.speed * 2 * sim.speed;
                        return { ...m, x: m.x + (dx / d) * moveSpeed, y: m.y + (dy / d) * moveSpeed, dist: m.dist + moveSpeed / 10 };
                    }
                }

                return m;
            }));

            draw();
            requestRef = requestAnimationFrame(animate);
        };

        if (sim.run && !sim.pause) requestRef = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef);
    }, [sim, config, routes, orderQueue, stats.trips]);

    const formatTime = (t) => {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="simulator-view">
            <div className="card" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div>
                        <div className="label">Čas simulace</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{formatTime(sim.time)}</div>
                    </div>
                    <div>
                        <div className="label">Dokončeno zakázek</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>{stats.trips} / {orders.length}</div>
                    </div>
                </div>

                <div className="ticker-capsule" style={{ background: 'rgba(0,0,0,0.3)', padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid var(--border)', minWidth: '200px' }}>
                    <span style={{ color: 'var(--primary)', marginRight: '0.5rem' }}>●</span> {ticker}
                </div>

                <div className="controls" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className={`btn ${sim.run ? 'btn-outline' : 'btn-primary'}`} onClick={() => setSim({ ...sim, run: !sim.run })}>
                        {sim.run ? '⏹ Zastavit' : '▶ Spustit'}
                    </button>
                    {sim.run && (
                        <button className="btn btn-outline" onClick={() => setSim({ ...sim, pause: !sim.pause })}>
                            {sim.pause ? '▶' : '⏸'}
                        </button>
                    )}
                </div>
            </div>

            <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                <canvas ref={canvasRef} width={1200} height={600} />
            </div>
        </div>
    );
};

export default Simulator;
