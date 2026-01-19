import React, { useState } from 'react';

const OrderManagement = ({ orders, setOrders }) => {
    const [showModal, setShowModal] = useState(false);
    const [newOrder, setNewOrder] = useState({
        sap: '',
        product: '',
        quantity: 480,
        pieces: 16,
        weight: 10,
        cycle: 30
    });

    const addOrder = () => {
        if (!newOrder.sap || !newOrder.product) return;
        setOrders([...orders, { ...newOrder, id: 'o' + Date.now() }]);
        setShowModal(false);
        setNewOrder({ sap: '', product: '', quantity: 480, pieces: 16, weight: 10, cycle: 30 });
    };

    const removeOrder = (id) => setOrders(orders.filter(o => o.id !== id));

    return (
        <div className="order-management">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>📋 Správa zakázek</h2>
                <button className="btn btn-secondary" onClick={() => setShowModal(true)}>➕ Přidat zakázku</button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>SAP</th>
                            <th style={{ padding: '1rem', textAlign: 'left' }}>Výrobek</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ks</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Ks/Pal</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Váha</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Akce</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(o => (
                            <tr key={o.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '1rem' }}><strong>{o.sap}</strong></td>
                                <td style={{ padding: '1rem' }}>{o.product}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{o.quantity}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{o.pieces}</td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>{o.weight} kg</td>
                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                    <button className="btn btn-sm btn-outline" color="red" onClick={() => removeOrder(o.id)}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
                        <h3>Nová zakázka</h3>
                        <div className="form-group">
                            <label className="label">SAP číslo</label>
                            <input className="input" type="text" value={newOrder.sap} onChange={e => setNewOrder({ ...newOrder, sap: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="label">Název výrobku</label>
                            <input className="input" type="text" value={newOrder.product} onChange={e => setNewOrder({ ...newOrder, product: e.target.value })} />
                        </div>
                        <div className="grid grid-2">
                            <div className="form-group">
                                <label className="label">Množství</label>
                                <input className="input" type="number" value={newOrder.quantity} onChange={e => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value) })} />
                            </div>
                            <div className="form-group">
                                <label className="label">Ks/Paleta</label>
                                <input className="input" type="number" value={newOrder.pieces} onChange={e => setNewOrder({ ...newOrder, pieces: parseInt(e.target.value) })} />
                            </div>
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem' }}>
                            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Zrušit</button>
                            <button className="btn btn-primary" onClick={addOrder}>Přidat</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderManagement;
