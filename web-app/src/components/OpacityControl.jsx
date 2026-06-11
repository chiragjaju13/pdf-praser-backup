import React from 'react';

export default function OpacityControl({ value, onChange }) {
    const pct = value * 100;

    return (
        <div className="form-group">
            <div className="flex justify-between items-center">
                <label className="form-label">Opacity</label>
                <span className="text-sm font-semibold text-accent">{Math.round(pct)}%</span>
            </div>
            <input
                type="range"
                className="range-slider"
                min={0} max={1} step={0.01}
                value={value}
                style={{ '--pct': `${pct}%` }}
                onChange={(e) => onChange(parseFloat(e.target.value))}
            />
            <div className="flex justify-between text-xs text-muted mt-2">
                <span>0% (invisible)</span>
                <span>100% (solid)</span>
            </div>
        </div>
    );
}
