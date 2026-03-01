import React from 'react';

export default function ScaleControl({ value, onChange }) {
    const pct = ((value - 0.05) / (3 - 0.05)) * 100;

    return (
        <div className="form-group">
            <div className="flex justify-between items-center">
                <label className="form-label">Scale</label>
                <span className="text-sm font-semibold text-accent">{value.toFixed(2)}×</span>
            </div>
            <input
                type="range"
                className="range-slider"
                min={0.05} max={3} step={0.05}
                value={value}
                style={{ '--pct': `${pct}%` }}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-xs text-muted mt-2">
                <span>0.05×</span>
                <span style={{ color: 'var(--text-secondary)' }}>1.0× = ~25% of page width</span>
                <span>3×</span>
            </div>
        </div>
    );
}
