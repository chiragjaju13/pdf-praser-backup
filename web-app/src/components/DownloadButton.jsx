import React, { useState } from 'react';

export default function DownloadButton({ jobResult, customFilename, isMultiple }) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!jobResult || !jobResult.blob) return;
        setLoading(true);
        try {
            const url = URL.createObjectURL(jobResult.blob);
            const a = document.createElement('a');
            a.href = url;
            
            if (customFilename) {
                const ext = isMultiple ? 'zip' : 'pdf';
                a.download = `${customFilename}.${ext}`;
            } else {
                a.download = jobResult.defaultName;
            }
            
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
            disabled={!jobResult || !jobResult.blob || loading}
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
