import React from 'react';

export default function JobPanel({ status, error }) {
    if (!status) return null;

    const STATUS_LABELS = {
        processing: 'Processing',
        done: 'Done',
        failed: 'Failed',
    };

    return (
        <div className="card" style={{ background: 'rgba(99,102,241,0.04)', borderColor: 'rgba(99,102,241,0.2)' }}>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <div className="text-xs text-muted font-semibold" style={{ marginBottom: 4 }}>LOCAL PROCESSING</div>
                    <div className="font-semibold" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Automated PDF Engine</div>
                </div>
                <div className={`status-badge ${status}`}>
                    <span className={`status-dot${status === 'processing' ? ' pulse' : ''}`}></span>
                    {STATUS_LABELS[status] || status}
                </div>
            </div>

            {status === 'processing' && (
                <div style={{ marginTop: 16 }}>
                    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--accent-gradient)', borderRadius: 2, animation: 'indeterminate 1.4s infinite ease-in-out', width: '40%' }} />
                    </div>
                    <style>{`@keyframes indeterminate { 0%{transform:translateX(-100%)} 100%{transform:translateX(350%)} }`}</style>
                </div>
            )}

            {error && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid var(--border-error)', borderRadius: 8, fontSize: 13, color: 'var(--error)' }}>
                    ⚠️ {error}
                </div>
            )}
        </div>
    );
}
