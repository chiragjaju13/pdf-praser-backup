import React, { useRef, useCallback, useState, useEffect } from "react";

const ALLOWED = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/svg+xml",
    "image/webp",
];

export default function ImageUploader({ file, onFile }) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        if (!file) {
            setPreview(null);
            return;
        }

        const url = URL.createObjectURL(file);
        setPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [file]);

    const handleFile = useCallback(
        (incoming) => {
            if (!incoming || !ALLOWED.includes(incoming.type)) return;
            onFile(incoming);
        },
        [onFile]
    );

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            setDragging(false);

            if (e.dataTransfer.files?.length > 0) {
                handleFile(e.dataTransfer.files[0]);
            }
        },
        [handleFile]
    );

    return (
        <div
            className={`upload-zone${dragging ? " drag-over" : ""}${file ? " has-file" : ""
                }`}
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
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                    if (e.target.files?.length > 0) {
                        handleFile(e.target.files[0]);
                    }
                    e.target.value = null;
                }}
            />

            {preview ? (
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <img
                        src={preview}
                        alt="preview"
                        style={{
                            height: 56,
                            width: 56,
                            borderRadius: 8,
                            objectFit: "contain",
                        }}
                    />
                    <div style={{ minWidth: 0 }}>
                        <span style={{ color: "green", display: "block" }}>
                            Image Ready
                        </span>
                        <span
                            style={{
                                display: "block",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {file.name}
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    <span>🖼️</span>
                    <span>Drop your image here</span>
                    <span>PNG, JPG, SVG supported</span>
                </>
            )}
        </div>
    );
}