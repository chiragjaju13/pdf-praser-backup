import React, { useState } from 'react';

const OPTIONS = [
    { id: 'all', label: 'All Pages' },
    { id: 'first', label: 'First' },
    { id: 'last', label: 'Last' },
    { id: 'odd', label: 'Odd' },
    { id: 'even', label: 'Even' },
    { id: 'range', label: 'Range (e.g. 1–5)' },
    { id: 'custom', label: 'Custom (e.g. 1,3,7)' },
];

export default function PageSelector({ value, onChange }) {
    const [mode, setMode] = useState('all');
    const [text, setText] = useState('');

    const handleMode = (id) => {
        setMode(id);
        if (id === 'all' || id === 'first' || id === 'last' || id === 'odd' || id === 'even') {
            onChange(id);
        } else {
            onChange(text);
        }
    };

    const handleText = (e) => {
        setText(e.target.value);
        onChange(e.target.value);
    };

    return (
        <div className="form-group">
            <label className="form-label">Pages to Apply</label>
            <div className="page-selector-options">
                {OPTIONS.map(opt => (
                    <button key={opt.id} className={`page-option${mode === opt.id ? ' active' : ''}`} onClick={() => handleMode(opt.id)} type="button">
                        {opt.label}
                    </button>
                ))}
            </div>
            {(mode === 'range' || mode === 'custom') && (
                <input
                    className="form-input mt-2"
                    placeholder={mode === 'range' ? 'e.g. 1-5' : 'e.g. 1,3,7'}
                    value={text}
                    onChange={handleText}
                    style={{ marginTop: 8 }}
                />
            )}
        </div>
    );
}
