import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

const OrderManagement = ({ orders, setOrders, objects }) => {
    const [showModal, setShowModal] = useState(false);
    const [newOrder, setNewOrder] = useState({
        sap: '',
        product: '',
        quantity: 480,
        pieces: 16,
        weight: 10,
        priority: 'Normal',
        fromId: '',
        toId: ''
    });

    const addOrder = () => {
        if (!newOrder.sap || !newOrder.fromId || !newOrder.toId) return;
        setOrders([...orders, { ...newOrder, id: 'o' + Date.now(), amount: Math.ceil(newOrder.quantity / newOrder.pieces) }]);
        setShowModal(false);
        setNewOrder({ sap: '', product: '', quantity: 480, pieces: 16, weight: 10, priority: 'Normal', fromId: '', toId: '' });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(ws);

            const importedOrders = data.map((row, index) => {
                // Heuristic for matching machine/warehouse names from excel
                const fromObj = objects.machines.find(m => m.name.toLowerCase() === (row.Zdroj || '').toLowerCase()) || objects.machines[0];
                const toObj = objects.warehouses.find(w => w.name.toLowerCase() === (row.Cil || row.Sklad || '').toLowerCase()) || objects.warehouses[0];

                return {
                    id: 'o-imp-' + Date.now() + '-' + index,
                    sap: row.SAP || row['SAP číslo'] || row.Material || 'Unknown',
                    product: row.Produkt || row.Výrobek || row.Product || 'SAP Item',
                    amount: parseInt(row.Palet || row['Počet palet'] || 1),
                    fromId: fromObj?.id || '',
                    toId: toObj?.id || '',
                    priority: row.Priorita || 'Normal'
                };
            }).filter(o => o.sap);

            setOrders([...orders, ...importedOrders]);
        };
        reader.readAsBinaryString(file);
    };

    const fileInputRef = useRef(null);

    return (
        <div className="order-management animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ marginBottom: '0.25rem' }}>📋 Plán výroby</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Správa zakázek pro dnešní směnu</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".xlsx, .xls" />
                    <button className="btn btn-outline" onClick={() => fileInputRef.current.click()}>📤 Import z Excelu</button>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Nová zakázka</button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Priorita</th>
                            <th style={{ padding: '1rem' }}>SAP</th>
                            <th style={{ padding: '1rem' }}>Produkt</th>
                            <th style={{ padding: '1rem' }}>Odkud → Kam</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Palet</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Žádné aktivní zakázky</td></tr>
                        ) : orders.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold',
                                        background: o.priority === 'High' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                        color: o.priority === 'High' ? 'var(--error)' : 'var(--text-muted)'
                                    }}>{o.priority}</span>
                                </td>
                                <td style={{ padding: '1rem' }}><strong>{o.sap}</strong></td>
                                <td style={{ padding: '1rem' }}>{o.product}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{ opacity: 0.7 }}>{objects.machines.find(m => m.id === o.fromId)?.name || '?'}</span>
                                    <span style={{ margin: '0 0.5rem', color: 'var(--primary)' }}>→</span>
                                    <span style={{ opacity: 0.7 }}>{objects.warehouses.find(w => w.id === o.toId)?.name || '?'}</span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{o.amount}</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button className="btn btn-sm btn-outline" style={{ color: 'var(--error)' }} onClick={() => setOrders(orders.filter(x => x.id !== o.id))}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                    <div className="card" style={{ maxWidth: '600px', width: '95%' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Detail nové zakázky</h3>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">SAP číslo</label>
                                <input className="input" type="text" placeholder="např. 123456" value={newOrder.sap} onChange={e => setNewOrder({ ...newOrder, sap: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Materiál / Produkt</label>
                                <input className="input" type="text" placeholder="Název" value={newOrder.product} onChange={e => setNewOrder({ ...newOrder, product: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Zdroj (Stroj)</label>
                                <select className="input" value={newOrder.fromId} onChange={e => setNewOrder({ ...newOrder, fromId: e.target.value })}>
                                    <option value="">Vyberte stroj</option>
                                    {objects.machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="label">Cíl (Sklad)</label>
                                <select className="input" value={newOrder.toId} onChange={e => setNewOrder({ ...newOrder, toId: e.target.value })}>
                                    <option value="">Vyberte sklad</option>
                                    {objects.warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Množství (Ks)</label>
                                <input className="input" type="number" value={newOrder.quantity} onChange={e => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Priorita</label>
                                <select className="input" value={newOrder.priority} onChange={e => setNewOrder({ ...newOrder, priority: e.target.value })}>
                                    <option value="Low">Nízká</option>
                                    <option value="Normal">Normální</option>
                                    <option value="High">VYSOKÁ</option>
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Zavřít</button>
                            <button className="btn btn-primary" onClick={addOrder}>Uložit zakázku</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default OrderManagement;
