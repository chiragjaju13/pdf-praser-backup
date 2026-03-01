import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

// Set up pdf.js worker using Vite's URL import for reliability
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function VisualEditor({
    pdfFile,
    imageFile,
    position,
    onPositionChange,
    scale,
    onScaleChange,
    opacity,
    onOpacityChange
}) {
    const canvasRef = useRef(null);
    const [rendering, setRendering] = useState(false);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
    const [imgPreview, setImgPreview] = useState(null);
    const [imgNaturalSize, setImgNaturalSize] = useState({ width: 0, height: 0 });
    const imageDragRef = useRef(null);

    const [renderScale, setRenderScale] = useState(1.0);

    // Render PDF Preview
    useEffect(() => {
        if (!pdfFile) return;

        const renderPdf = async () => {
            setRendering(true);
            try {
                const arrayBuffer = await pdfFile.arrayBuffer();
                const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
                const pdf = await loadingTask.promise;
                const page = await pdf.getPage(1);

                // Allow natural rotation so the user sees it "upright" as expected
                const viewport = page.getViewport({ scale: 1.0 });
                const rotation = page.rotate; // 0, 90, 180, 270

                const containerWidth = 800;
                const currentScale = containerWidth / viewport.width;
                setRenderScale(currentScale);

                const scaledViewport = page.getViewport({ scale: currentScale });
                const canvas = canvasRef.current;
                if (!canvas) return;

                const context = canvas.getContext('2d');
                canvas.height = scaledViewport.height;
                canvas.width = scaledViewport.width;

                setDisplaySize({ width: scaledViewport.width, height: scaledViewport.height });

                // Store rotation in the position state so backend knows how to map coordinates
                onPositionChange(prev => ({ ...prev, rotation }));

                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
            } catch (err) {
                console.error("PDF Render Error:", err);
            } finally {
                setRendering(false);
            }
        };

        renderPdf();
    }, [pdfFile]);

    // Load Image for Editor
    useEffect(() => {
        if (!imageFile) {
            setImgPreview(null);
            return;
        }
        const url = URL.createObjectURL(imageFile);
        const img = new Image();
        img.onload = () => {
            setImgNaturalSize({ width: img.width, height: img.height });
            setImgPreview(url);
        };
        img.src = url;
        return () => URL.revokeObjectURL(url);
    }, [imageFile]);

    const handleDrag = (e, data) => {
        // Map back to relative PDF coordinates if needed, 
        // but for now we'll just store the raw offset from top-left.
        // The backend ImageEngine will need to know the scale factor.
        // We'll pass the 'renderScale' or just raw points.
        // Assuming 1 unit = 1 PDF point at scale 1.0.
        onPositionChange({
            position: 'custom',
            custom_x: data.x / renderScale,
            custom_y: data.y / renderScale
        });
    };

    const currentWidth = imgNaturalSize.width * scale * renderScale;
    const currentHeight = imgNaturalSize.height * scale * renderScale;

    return (
        <div className="visual-editor-container" style={{
            position: 'relative',
            background: '#1a1a1a',
            borderRadius: 12,
            border: '2px solid var(--border)',
            overflow: 'hidden',
            minHeight: 400,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start'
        }}>
            {rendering && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)' }}>
                    <div className="loading-spinner">Rendering PDF Preview...</div>
                </div>
            )}

            {/* Shared relative container to ensure overlay matches canvas exactly */}
            <div style={{ position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', width: displaySize.width, height: displaySize.height }}>
                <canvas ref={canvasRef} style={{ display: 'block', width: displaySize.width, height: displaySize.height, background: '#fff' }} />

                {imgPreview && displaySize.width > 0 && (
                    <div style={{ position: 'absolute', top: 0, left: 0, width: displaySize.width, height: displaySize.height, pointerEvents: 'none' }}>
                        <Draggable
                            nodeRef={imageDragRef}
                            bounds="parent"
                            onStop={handleDrag}
                            position={{
                                x: (position.custom_x || 0) * renderScale,
                                y: (position.custom_y || 0) * renderScale
                            }}
                        >
                            <div ref={imageDragRef} style={{
                                pointerEvents: 'auto',
                                cursor: 'move',
                                width: currentWidth,
                                height: currentHeight,
                                position: 'absolute',
                                zIndex: 10
                            }}>
                                <ResizableBox
                                    width={currentWidth}
                                    height={currentHeight}
                                    minConstraints={[20, 20]}
                                    onResize={(e, data) => {
                                        onScaleChange(data.size.width / (imgNaturalSize.width * renderScale));
                                    }}
                                    handle={<span className="resize-handle" />}
                                >
                                    <div style={{
                                        width: '100%', height: '100%',
                                        backgroundImage: `url(${imgPreview})`,
                                        backgroundSize: 'contain', backgroundRepeat: 'no-repeat',
                                        opacity: opacity,
                                        border: '2px solid var(--accent)',
                                        boxShadow: '0 0 15px rgba(99,102,241,0.6)',
                                        transition: 'opacity 0.2s'
                                    }} />
                                </ResizableBox>
                            </div>
                        </Draggable>
                    </div>
                )}
            </div>

            <style>{`
                .resize-handle {
                    position: absolute; width: 14px; height: 14px; background: var(--accent);
                    border: 2px solid #fff; border-radius: 50%; bottom: -7px; right: -7px;
                    cursor: nwse-resize; z-index: 20;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                .loading-spinner {
                    color: #fff;
                    font-size: 14px;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                }
            `}</style>
        </div>
    );
}