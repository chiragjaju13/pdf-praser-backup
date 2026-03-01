import React from 'react';

export default function FilenameInput({ value, onChange, isMultiple }) {
    return (
        <div className="form-group">
            <label className="form-label">📝 Output Filename</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <input
                    className="form-input"
                    type="text"
                    placeholder={isMultiple ? 'my-batch-output' : 'my-output-file'}
                    value={value}
                    onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9_\-. ]/g, ''))}
                    style={{ borderRadius: '8px 0 0 8px', borderRight: 'none' }}
                />
                <div style={{
                    padding: '10px 14px',
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    borderLeft: 'none',
                    borderRadius: '0 8px 8px 0',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    fontWeight: 600,
                }}>
                    {isMultiple ? '.zip' : '.pdf'}
                </div>
            </div>
            <div className="text-xs text-muted">Leave blank to use auto-generated name</div>
        </div>
    );
}
