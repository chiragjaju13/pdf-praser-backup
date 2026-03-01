import React, { useRef, useCallback, useState } from "react";

export default function PDFUploader({ files, onFiles }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleFiles = useCallback(
        (incoming) => {
            const incomingArray = Array.from(incoming);
            const valid = incomingArray.filter(f =>
                f.type === 'application/pdf' ||
                f.name.toLowerCase().endsWith('.pdf')
            );

            if (valid.length === 0) return;
            // Merge with existing files for batch processing
            onFiles([...files, ...valid]);
        },
        [files, onFiles]
    );

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragging(false);

            if (e.dataTransfer.files?.length > 0) {
                handleFiles(e.dataTransfer.files);
            }
        },
        [handleFiles]
    );

    const removeFile = (idx) => {
        const next = files.filter((_, i) => i !== idx);
        onFiles(next);
    };

    return (
        <div style={{ position: "relative" }}>
            <div
                className={`upload-zone${dragging ? " drag-over" : ""}${files.length > 0 ? " has-file" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={(e) => {
                    if (e.target !== inputRef.current) {
                        inputRef.current.click();
                    }
                }}
                style={{ cursor: "pointer" }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    style={{ display: "none" }}
                    onChange={(e) => {
                        if (e.target.files?.length > 0) {
                            handleFiles(e.target.files);
                        }
                        e.target.value = null;
                    }}
                />

                {files.length === 0 ? (
                    <>
                        <span className="upload-icon">📄</span>
                        <span className="upload-label">Drop PDFs here</span>
                        <span className="upload-sublabel">Batch processing supported</span>
                    </>
                ) : (
                    <>
                        <span className="upload-icon" style={{ color: "var(--success)" }}>✅</span>
                        <span className="upload-label" style={{ color: "var(--success)" }}>{files.length} PDF{files.length > 1 ? 's' : ''} Ready</span>
                        <span className="upload-sublabel">Click to add more</span>
                    </>
                )}
            </div>

            {files.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {files.map((f, i) => (
                        <div key={`${f.name}-${i}`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)',
                            borderRadius: 8, padding: '8px 12px', fontSize: 13,
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                                <span>📄</span>
                                <span style={{ color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: 16 }}
                            >✕</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}