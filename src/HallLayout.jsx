import React, { useRef, useEffect, useState } from 'react';

const HallLayout = ({ objects, setObjects, bgImage, setBgImage, bgScale, setBgScale }) => {
    const canvasRef = useRef(null);
    const [dragState, setDragState] = useState(null);
    const [selectedId, setSelectedId] = useState(null);

    const snap = (val) => Math.round(val / 10) * 10;

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid (Subtle)
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
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

        const all = [...objects.machines, ...objects.warehouses];
        all.forEach(o => {
            const isSelected = selectedId === o.id;

            // Body
            ctx.fillStyle = o.color;
            ctx.globalAlpha = isSelected ? 0.8 : 1;
            ctx.fillRect(o.x, o.y, o.w, o.h);

            // Border
            ctx.strokeStyle = isSelected ? 'var(--primary)' : '#fff';
            ctx.lineWidth = isSelected ? 4 : 2;
            ctx.strokeRect(o.x, o.y, o.w, o.h);
            ctx.globalAlpha = 1;

            // Label
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(o.name, o.x + o.w / 2, o.y + o.h / 2);

            // Handover Point Indicator
            if (o.handover) {
                const hx = o.x + o.handover.x;
                const hy = o.y + o.handover.y;
                ctx.fillStyle = '#10b981';
                ctx.beginPath();
                ctx.arc(hx, hy, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    };

    useEffect(() => { draw(); }, [objects, bgImage, bgScale, selectedId]);

    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const all = [
            ...objects.machines.map(m => ({ ...m, category: 'machines' })),
            ...objects.warehouses.map(w => ({ ...w, category: 'warehouses' }))
        ];

        let found = false;
        for (let o of all) {
            if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
                setDragState({ id: o.id, category: o.category, offsetX: x - o.x, offsetY: y - o.y });
                setSelectedId(o.id);
                found = true;
                break;
            }
        }
        if (!found) setSelectedId(null);
    };

    const handleMouseMove = (e) => {
        if (!dragState) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newX = snap(Math.max(0, Math.min(x - dragState.offsetX, canvasRef.current.width - 50)));
        const newY = snap(Math.max(0, Math.min(y - dragState.offsetY, canvasRef.current.height - 50)));

        setObjects({
            ...objects,
            [dragState.category]: objects[dragState.category].map(o => o.id === dragState.id ? { ...o, x: newX, y: newY } : o)
        });
    };

    const handleMouseUp = () => setDragState(null);

    const deleteObject = (id, category) => {
        setObjects({
            ...objects,
            [category]: objects[category].filter(o => o.id !== id)
        });
        setSelectedId(null);
    };

    const selectedObj = [...objects.machines, ...objects.warehouses].find(o => o.id === selectedId);
    const selectedCategory = objects.machines.find(m => m.id === selectedId) ? 'machines' : 'warehouses';

    return (
        <div className="layout-step">
            <div className="controls-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => {
                    const id = 'm' + Date.now();
                    setObjects({
                        ...objects,
                        machines: [...objects.machines, { id, name: 'Stroj ' + (objects.machines.length + 1), type: 'machine', subType: 'Injection', x: 50, y: 50, w: 100, h: 80, color: '#DA291C', handover: { x: 120, y: 40 } }]
                    });
                }}>➕ Přidat stroj</button>
                <button className="btn btn-secondary" onClick={() => {
                    const id = 'w' + Date.now();
                    setObjects({
                        ...objects,
                        warehouses: [...objects.warehouses, { id, name: 'Sklad ' + (objects.warehouses.length + 1), type: 'warehouse', x: 400, y: 50, w: 150, h: 100, color: '#4298B5', handover: { x: -20, y: 50 } }]
                    });
                }}>📦 Přidat sklad</button>
                <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
                    📸 Nahrát pozadí
                    <input type="file" onChange={(e) => {
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
                    }} style={{ display: 'none' }} />
                </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ position: 'relative', flex: 1, height: '600px', background: '#0f172a', borderRadius: '8px', overflow: 'hidden' }}>
                    <canvas
                        ref={canvasRef}
                        width={1200}
                        height={600}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        style={{ cursor: dragState ? 'grabbing' : 'crosshair' }}
                    />
                </div>

                {selectedObj && (
                    <div className="card" style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3>🔧 Vlastnosti: {selectedObj.name}</h3>
                        <div className="form-group">
                            <label className="label">Název</label>
                            <input className="input" type="text" value={selectedObj.name} onChange={e => {
                                setObjects({
                                    ...objects,
                                    [selectedCategory]: objects[selectedCategory].map(o => o.id === selectedId ? { ...o, name: e.target.value } : o)
                                });
                            }} />
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Šířka</label>
                                <input className="input" type="number" step="10" value={selectedObj.w} onChange={e => {
                                    setObjects({
                                        ...objects,
                                        [selectedCategory]: objects[selectedCategory].map(o => o.id === selectedId ? { ...o, w: parseInt(e.target.value) } : o)
                                    });
                                }} />
                            </div>
                            <div className="form-group">
                                <label className="label">Výška</label>
                                <input className="input" type="number" step="10" value={selectedObj.h} onChange={e => {
                                    setObjects({
                                        ...objects,
                                        [selectedCategory]: objects[selectedCategory].map(o => o.id === selectedId ? { ...o, h: parseInt(e.target.value) } : o)
                                    });
                                }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Barva</label>
                            <input type="color" value={selectedObj.color} onChange={e => {
                                setObjects({
                                    ...objects,
                                    [selectedCategory]: objects[selectedCategory].map(o => o.id === selectedId ? { ...o, color: e.target.value } : o)
                                });
                            }} style={{ width: '100%', height: '40px', border: 'none', background: 'none' }} />
                        </div>
                        <div className="form-group">
                            <label className="label">Předávací bod (X, Y offset)</label>
                            <div className="grid grid-2">
                                <input className="input" type="number" value={selectedObj.handover.x} onChange={e => {
                                    setObjects({
                                        ...objects,
                                        [selectedCategory]: objects[selectedCategory].map(o => o.id === selectedId ? { ...o, handover: { ...o.handover, x: parseInt(e.target.value) } } : o)
                                    });
                                }} />
                                <input className="input" type="number" value={selectedObj.handover.y} onChange={e => {
                                    setObjects({
                                        ...objects,
                                        [selectedCategory]: objects[selectedCategory].map(o => o.id === selectedId ? { ...o, handover: { ...o.handover, y: parseInt(e.target.value) } } : o)
                                    });
                                }} />
                            </div>
                        </div>
                        <button className="btn btn-outline" style={{ color: 'var(--error)', borderColor: 'var(--error)', marginTop: 'auto' }} onClick={() => deleteObject(selectedId, selectedCategory)}>🗑️ Smazat objekt</button>
                    </div>
                )}
            </div>

            {bgImage && (
                <div className="card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                    <label className="label">Měřítko pozadí: {bgScale}%</label>
                    <input type="range" min="50" max="200" value={bgScale} onChange={e => setBgScale(parseInt(e.target.value))} />
                    <button className="btn btn-sm btn-outline" onClick={() => setBgImage(null)}>Odstranit pozadí</button>
                </div>
            )}
        </div>
    );
};

export default HallLayout;
