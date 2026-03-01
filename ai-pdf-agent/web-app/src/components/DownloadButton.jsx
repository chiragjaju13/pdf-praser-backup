import React, { useState } from 'react';

export default function DownloadButton({ blob, customFilename, isMultiple }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!blob) return;
        setLoading(true);
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = isMultiple ? 'zip' : 'pdf';
            a.download = customFilename ? `${customFilename}.${ext}` : `output.${ext}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 100);
        } catch (e) {
            alert('Download failed: ' + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            className="btn btn-primary w-full"
            onClick={handleDownload}
            disabled={!blob || loading}
            style={{ padding: '14px', fontSize: 15, justifyContent: 'center' }}
        >
            {loading
                ? '⏳ Downloading...'
                : isMultiple
                    ? '⬇️ Download All PDFs (.zip)'
                    : '⬇️ Download Output PDF'}
        </button>
    );
}
