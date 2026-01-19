import React, { useRef, useEffect, useState } from 'react';

const HallLayout = ({ objects, setObjects, bgImage, setBgImage, bgScale, setBgScale }) => {
    const canvasRef = useRef(null);
    const [dragState, setDragState] = useState(null);

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        for (let x = 0; x < canvas.width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }

        if (bgImage) {
            const scale = bgScale / 100;
            const w = bgImage.width * scale;
            const h = bgImage.height * scale;
            const x = (canvas.width - w) / 2;
            const y = (canvas.height - h) / 2;
            ctx.globalAlpha = 0.4;
            ctx.drawImage(bgImage, x, y, w, h);
            ctx.globalAlpha = 1;
        }

        // Machines
        objects.machines.forEach(m => {
            ctx.fillStyle = m.color;
            ctx.fillRect(m.x, m.y, m.w, m.h);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(m.x, m.y, m.w, m.h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(m.name, m.x + m.w / 2, m.y + m.h / 2);
        });

        // Warehouses
        objects.warehouses.forEach(w => {
            ctx.fillStyle = w.color;
            ctx.fillRect(w.x, w.y, w.w, w.h);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.strokeRect(w.x, w.y, w.w, w.h);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(w.name, w.x + w.w / 2, w.y + w.h / 2);
        });
    };

    useEffect(() => {
        draw();
    }, [objects, bgImage, bgScale]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const all = [
            ...objects.machines.map(m => ({ ...m, type: 'machine' })),
            ...objects.warehouses.map(w => ({ ...w, type: 'warehouse' }))
        ];

        for (let o of all) {
            if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
                setDragState({ id: o.id, type: o.type, offsetX: x - o.x, offsetY: y - o.y });
                break;
            }
        }
    };

    const handleMouseMove = (e) => {
        if (!dragState) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newX = Math.max(0, Math.min(x - dragState.offsetX, canvasRef.current.width - 50));
        const newY = Math.max(0, Math.min(y - dragState.offsetY, canvasRef.current.height - 50));

        const key = dragState.type === 'machine' ? 'machines' : 'warehouses';
        setObjects({
            ...objects,
            [key]: objects[key].map(o => o.id === dragState.id ? { ...o, x: newX, y: newY } : o)
        });
    };

    const handleMouseUp = () => setDragState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => setBgImage(img);
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="layout-step">
            <div className="controls-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => {
                    const id = 'm' + Date.now();
                    setObjects({
                        ...objects,
                        machines: [...objects.machines, { id, name: 'Stroj ' + (objects.machines.length + 1), x: 50, y: 50, w: 100, h: 80, color: '#DA291C' }]
                    });
                }}>➕ Přidat stroj</button>
                <button className="btn btn-secondary" onClick={() => {
                    const id = 'w' + Date.now();
                    setObjects({
                        ...objects,
                        warehouses: [...objects.warehouses, { id, name: 'Sklad ' + (objects.warehouses.length + 1), x: 400, y: 50, w: 150, h: 100, color: '#4298B5' }]
                    });
                }}>📦 Přidat sklad</button>
                <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    📸 Nahrát pozadí
                    <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
            </div>

            {bgImage && (
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label className="label">Měřítko pozadí: {bgScale}%</label>
                    <input type="range" min="50" max="200" value={bgScale} onChange={e => setBgScale(parseInt(e.target.value))} />
                    <button className="btn btn-sm btn-outline" onClick={() => setBgImage(null)}>🗑️</button>
                </div>
            )}

            <div style={{ position: 'relative', width: '100%', height: '600px' }}>
                <canvas
                    ref={canvasRef}
                    width={1200}
                    height={600}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />
            </div>
        </div>
    );
};

export default HallLayout;
