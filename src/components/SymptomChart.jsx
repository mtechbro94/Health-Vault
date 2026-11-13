import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

// Live chart: cases by symptom (from diagnosis data), polling every 15 seconds.
const SymptomChart = () => {
    const [data, setData] = useState([]);
    const [updated, setUpdated] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/analytics/symptoms`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const json = await res.json();
                if (!alive) return;
                setData(json.symptoms || []);
                setUpdated(json.updated || new Date().toISOString());
                setError('');
            } catch (e) {
                if (alive) setError(e.message);
            }
        };
        load();
        const t = setInterval(load, 15000);
        return () => { alive = false; clearInterval(t); };
    }, []);

    const max = Math.max(1, ...data.map(d => d.cases));

    return (
        <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge badge-success">LIVE</span> Cases by Symptom
                </h3>
                {updated && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>
                        Updated {new Date(updated).toLocaleTimeString()} · auto-refresh 15s
                    </span>
                )}
            </div>
            {error && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>Failed to load: {error}</p>}
            {!error && data.length === 0 && <p style={{ color: 'var(--gray-400)' }}>No symptom data yet.</p>}
            {data.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {data.map(d => (
                        <div key={d.symptom} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 40px', gap: '0.75rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={d.symptom}>
                                {d.symptom}
                            </span>
                            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 14, overflow: 'hidden' }}>
                                <div style={{
                                    width: `${Math.round((d.cases / max) * 100)}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                                    transition: 'width 0.8s ease',
                                    borderRadius: 6
                                }} />
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, textAlign: 'right' }}>{d.cases}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SymptomChart;
