import React, { useRef, useEffect, useState } from 'react';
import { findPath } from './utils/Pathfinding';

const RouteEditor = ({ objects, corridors, setCorridors, routes, setRoutes, bgImage, bgScale }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const [mousePos, setMousePos] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const getSnapPoints = () => {
        const pts = [];
        [...objects.machines, ...objects.warehouses].forEach(o => {
            // Corner points
            pts.push({ x: o.x, y: o.y }, { x: o.x + o.w, y: o.y }, { x: o.x, y: o.y + o.h }, { x: o.x + o.w, y: o.y + o.h });
            // Handover point
            if (o.handover) pts.push({ x: o.x + o.handover.x, y: o.y + o.handover.y });
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
            ctx.fillStyle = o.color; ctx.globalAlpha = 0.3;
            ctx.fillRect(o.x, o.y, o.w, o.h); ctx.globalAlpha = 1;
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(o.x, o.y, o.w, o.h);

            if (o.handover) {
                ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(o.x + o.handover.x, o.y + o.handover.y, 5, 0, Math.PI * 2); ctx.fill();
            }
        });

        // Corridors (Green paths)
        corridors.forEach(c => {
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 12; ctx.globalAlpha = 0.4;
            ctx.beginPath(); ctx.moveTo(c.x1, c.y1); ctx.lineTo(c.x2, c.y2); ctx.stroke(); ctx.globalAlpha = 1;
        });

        // Preview
        if (isDrawing && startPoint && mousePos) {
            const snap = findSnap(mousePos.x, mousePos.y);
            const tx = snap ? snap.x : mousePos.x;
            const ty = snap ? snap.y : mousePos.y;
            ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4; ctx.setLineDash([10, 5]);
            ctx.beginPath(); ctx.moveTo(startPoint.x, startPoint.y); ctx.lineTo(tx, ty); ctx.stroke(); ctx.setLineDash([]);
        }

        // Routes
        routes.forEach(route => {
            if (!route.points || route.points.length < 2) return;
            ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(route.points[0].x, route.points[0].y);
            for (let i = 1; i < route.points.length; i++) {
                ctx.lineTo(route.points[i].x, route.points[i].y);
            }
            ctx.stroke();
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
        setIsGenerating(true);
        setTimeout(() => { // Async feel
            const newRoutes = [];
            const obstacles = [...objects.machines, ...objects.warehouses].map(o => ({ x: o.x, y: o.y, w: o.w, h: o.h }));

            objects.machines.forEach(m => {
                objects.warehouses.forEach(w => {
                    const start = { x: m.x + m.handover.x, y: m.y + m.handover.y };
                    const target = { x: w.x + w.handover.x, y: w.y + w.handover.y };

                    const path = findPath(start, target, 1200, 600, corridors, obstacles);
                    if (path) {
                        newRoutes.push({ fromId: m.id, toId: w.id, points: path });
                    }
                });
            });
            setRoutes(newRoutes);
            setIsGenerating(false);
        }, 10);
    };

    return (
        <div>
            <div className="controls-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button className={`btn ${isDrawing ? 'btn-primary' : 'btn-outline'}`} onClick={() => setIsDrawing(!isDrawing)}>
                    {isDrawing ? (startPoint ? '🎯 Vyberte cílový bod' : '🎯 Vyberte startovní bod') : '🟢 Kreslit zelenou chodbu'}
                </button>
                <button className="btn btn-secondary" onClick={autoRoutes} disabled={isGenerating}>
                    {isGenerating ? '⌛ Generování...' : '🤖 Automatické trasy (A*)'}
                </button>
                <button className="btn btn-outline" onClick={() => { setCorridors([]); setRoutes([]); }}>🗑️ Vymazat vše</button>
            </div>
            <div style={{ background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                <canvas ref={canvasRef} width={1200} height={600} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} style={{ cursor: isDrawing ? 'crosshair' : 'default' }} />
            </div>
        </div>
    );
};

export default RouteEditor;
