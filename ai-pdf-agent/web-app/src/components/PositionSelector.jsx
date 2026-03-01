import React, { useState } from 'react';

const PRESETS = [
    { id: 'top-left', label: 'TL', row: 0, col: 0 },
    { id: 'top-center', label: '↑', row: 0, col: 1 },
    { id: 'top-right', label: 'TR', row: 0, col: 2 },
    { id: 'middle-left', label: '←', row: 1, col: 0 },
    { id: 'center', label: '●', row: 1, col: 1 },
    { id: 'middle-right', label: '→', row: 1, col: 2 },
    { id: 'bottom-left', label: 'BL', row: 2, col: 0 },
    { id: 'bottom-center', label: '↓', row: 2, col: 1 },
    { id: 'bottom-right', label: 'BR', row: 2, col: 2 },
];

export default function PositionSelector({ value, onChange }) {
    const [selected, setSelected] = useState('bottom-right');
    const [showCustom, setShowCustom] = useState(false);
    const [customX, setCustomX] = useState(0);
    const [customY, setCustomY] = useState(0);

    const handlePreset = (id) => {
        setSelected(id);
        setShowCustom(false);
        onChange({ position: id });
    };

    const handleCustom = () => {
        setSelected('custom');
        setShowCustom(true);
        onChange({ position: 'custom', custom_x: customX, custom_y: customY });
    };

    const updateCustom = (axis, val) => {
        const n = parseFloat(val) || 0;
        if (axis === 'x') { setCustomX(n); onChange({ position: 'custom', custom_x: n, custom_y: customY }); }
        else { setCustomY(n); onChange({ position: 'custom', custom_x: customX, custom_y: n }); }
    };

    return (
        <div className="form-group">
            <label className="form-label">Position</label>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div className="position-grid">
                    {PRESETS.map(p => (
                        <div key={p.id} className={`position-cell${selected === p.id ? ' active' : ''}`} onClick={() => handlePreset(p.id)} title={p.id}>
                            {p.label}
                        </div>
                    ))}
                </div>
                <div>
                    <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={handleCustom} type="button">
                        Custom X,Y
                    </button>
                    {showCustom && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">X (px)</label>
                                <input className="form-input" type="number" value={customX} onChange={(e) => updateCustom('x', e.target.value)} style={{ width: 80 }} />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label className="form-label">Y (px)</label>
                                <input className="form-input" type="number" value={customY} onChange={(e) => updateCustom('y', e.target.value)} style={{ width: 80 }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="text-xs text-muted mt-2">Selected: <strong style={{ color: 'var(--accent)' }}>{selected}</strong></div>
        </div>
    );
}
