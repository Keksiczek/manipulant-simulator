import React, { useRef, useEffect, useState } from 'react';

const RouteEditor = ({ objects, corridors, setCorridors, routes, setRoutes, bgImage, bgScale }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [mousePos, setMousePos] = useState(null);

    const getSnapPoints = () => {
        const pts = [];
        objects.machines.forEach(m => {
            pts.push({ x: m.x, y: m.y + m.h / 2 }, { x: m.x + m.w, y: m.y + m.h / 2 }, { x: m.x + m.w / 2, y: m.y }, { x: m.x + m.w / 2, y: m.y + m.h });
        });
        objects.warehouses.forEach(w => {
            pts.push({ x: w.x, y: w.y + w.h / 2 }, { x: w.x + w.w, y: w.y + w.h / 2 }, { x: w.x + w.w / 2, y: w.y }, { x: w.x + w.w / 2, y: w.y + w.h });
        });
        corridors.forEach(c => { pts.push({ x: c.x1, y: c.y1 }, { x: c.x2, y: c.y2 }); });
        return pts;
    };

    const findSnap = (x, y) => {
        const pts = getSnapPoints();
        let best = null;
        let minD = 25;
        pts.forEach(p => {
            const d = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
            if (d < minD) { minD = d; best = p; }
        });
        return best;
    };

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

        // Grid
        ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
        for (let y = 0; y < canvas.height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

        // Objects
        [...objects.machines, ...objects.warehouses].forEach(o => {
            ctx.fillStyle = o.color; ctx.globalAlpha = 0.5;
            ctx.fillRect(o.x, o.y, o.w, o.h); ctx.globalAlpha = 1;
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(o.x, o.y, o.w, o.h);
        });

        // Corridors (Green paths)
        corridors.forEach(c => {
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 8; ctx.setLineDash([15, 10]);
            ctx.beginPath(); ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2); ctx.stroke(); ctx.setLineDash([]);
        });

        // Preview
        if (isDrawing && startPoint && mousePos) {
            const snap = findSnap(mousePos.x, mousePos.y);
            const tx = snap ? snap.x : mousePos.x;
            const ty = snap ? snap.y : mousePos.y;
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4; ctx.setLineDash([10, 5]);
            ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
            if (snap) {
                ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(snap.x, snap.y, 8, 0, Math.PI * 2); ctx.fill();
            }
        }

        // Routes (Gray generated paths)
        routes.forEach(r => {
            ctx.strokeStyle = r.green ? '#10b981' : '#64748b'; ctx.lineWidth = r.green ? 3 : 1;
            ctx.setLineDash(r.green ? [] : [5, 5]);
            ctx.beginPath(); ctx.moveTo(r.x1, r.y1); ctx.lineTo(r.x2, r.y2); ctx.stroke(); ctx.setLineDash([]);
        });
    };

    useEffect(() => { draw(); }, [objects, corridors, routes, isDrawing, startPoint, mousePos]);

    const handleMouseDown = (e) => {
        if (!isDrawing) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const snap = findSnap(x, y);
        const fx = snap ? snap.x : x;
        const fy = snap ? snap.y : y;

        if (!startPoint) {
            setStartPoint({ x: fx, y: fy });
        } else {
            setCorridors([...corridors, { x1: startPoint.x, y1: startPoint.y, x2: fx, y2: fy }]);
            setStartPoint(null);
            setIsDrawing(false);
        }
    };

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const autoRoutes = () => {
        const newRoutes = [];
        objects.machines.forEach(m => {
            objects.warehouses.forEach(w => {
                const mx = m.x + m.w / 2;
                const my = m.y + m.h / 2;
                const wx = w.x + w.w / 2;
                const wy = w.y + w.h / 2;

                let usesGreen = false;
                corridors.forEach(c => {
                    const d1 = Math.sqrt((mx - c.x1) ** 2 + (my - c.y1) ** 2);
                    const d2 = Math.sqrt((wx - c.x2) ** 2 + (wy - c.y2) ** 2);
                    const d1b = Math.sqrt((mx - c.x2) ** 2 + (my - c.y2) ** 2);
                    const d2b = Math.sqrt((wx - c.x1) ** 2 + (wy - c.y1) ** 2);
                    if ((d1 < 150 && d2 < 150) || (d1b < 150 && d2b < 150)) usesGreen = true;
                });

                newRoutes.push({ x1: mx, y1: my, x2: wx, y2: wy, fromId: m.id, toId: w.id, green: usesGreen });
            });
        });
        setRoutes(newRoutes);
    };

    return (
        <div>
            <div className="controls-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button className={`btn ${isDrawing ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIsDrawing(!isDrawing)}>
                    {isDrawing ? (startPoint ? '🎯 Vyberte cílový bod' : '🎯 Vyberte startovní bod') : '🟢 Kreslit zelenou chodbu'}
                </button>
                <button className="btn btn-secondary" onClick={autoRoutes}>🤖 Automatické trasy</button>
                <button className="btn btn-outline" onClick={() => { setCorridors([]); setRoutes([]); }}>🗑️ Vymazat vše</button>
            </div>
            <canvas ref={canvasRef} width={1200} height={600} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} />
        </div>
    );
};

export default RouteEditor;
