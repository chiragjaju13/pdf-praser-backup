import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

// Set up pdf.js worker using Vite's URL import for reliability
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

function DraggableImage({ img, info, renderScale, activeImageId, setActiveImageId, onPositionChange, onScaleChange }) {
    const dragRef = useRef(null);
    const currentWidth = info.natWidth * img.scale * renderScale;
    const currentHeight = info.natHeight * img.scale * renderScale;
    const isActive = activeImageId === img.id;

    const handleDrag = (e, data) => {
        onPositionChange(img.id, {
            position: 'custom',
            custom_x: data.x / renderScale,
            custom_y: data.y / renderScale
        });
    };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <Draggable
                nodeRef={dragRef}
                bounds="parent"
                onStop={handleDrag}
                onStart={() => setActiveImageId(img.id)}
                position={{
                    x: (img.position.custom_x || 0) * renderScale,
                    y: (img.position.custom_y || 0) * renderScale
                }}
            >
                <div ref={dragRef} style={{
                    pointerEvents: 'auto',
                    cursor: 'move',
                    width: currentWidth,
                    height: currentHeight,
                    position: 'absolute',
                    zIndex: isActive ? 50 : 10
                }}>
                    <ResizableBox
                        width={currentWidth}
                        height={currentHeight}
                        minConstraints={[20, 20]}
                        onResize={(e, data) => {
                            onScaleChange(img.id, data.size.width / (info.natWidth * renderScale));
                        }}
                        handle={<span className="resize-handle" style={{ display: isActive ? 'block' : 'none' }} />}
                    >
                        <div style={{
                            width: '100%', height: '100%',
                            backgroundImage: `url(${info.url})`,
                            backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
                            opacity: img.opacity,
                            border: isActive ? '2px solid var(--accent)' : '1px solid transparent',
                            boxShadow: isActive ? '0 0 15px rgba(99,102,241,0.6)' : 'none',
                            transition: 'opacity 0.2s, border 0.2s, box-shadow 0.2s'
                        }} />
                    </ResizableBox>
                </div>
            </Draggable>
        </div>
    );
}

export default function VisualEditor({
    pdfFile,
    images = [],
    onPositionChange,
    onScaleChange,
    onOpacityChange,
    activeImageId,
    setActiveImageId
}) {
    const canvasRef = useRef(null);
    const [rendering, setRendering] = useState(false);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
    const [imageInfos, setImageInfos] = useState({});
    
    const [renderScale, setRenderScale] = useState(1.0);
    const loadingCacheRef = useRef(new Map());

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
                images.forEach(img => {
                    onPositionChange(img.id, { rotation });
                });

                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
            } catch (err) {
                console.error("PDF Render Error:", err);
            } finally {
                setRendering(false);
            }
        };

        renderPdf();
        // intentionally omitting images from deps so we only re-render PDF on pdfFile change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfFile]);

    // Load Images for Editor purely dependent on images changes
    useEffect(() => {
        images.forEach(img => {
            const cachedFile = loadingCacheRef.current.get(img.id);
            if (cachedFile !== img.file) {
                loadingCacheRef.current.set(img.id, img.file);
                const url = URL.createObjectURL(img.file);
                const imageObj = new Image();
                imageObj.onload = () => {
                    setImageInfos(prev => ({
                        ...prev,
                        [img.id]: { url, natWidth: imageObj.width, natHeight: imageObj.height }
                    }));
                };
                imageObj.src = url;
            }
        });
    }, [images]);

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

                {displaySize.width > 0 && images.map(img => {
                    const info = imageInfos[img.id];
                    if (!info) return null;

                    return (
                        <DraggableImage 
                            key={img.id}
                            img={img}
                            info={info}
                            renderScale={renderScale}
                            activeImageId={activeImageId}
                            setActiveImageId={setActiveImageId}
                            onPositionChange={onPositionChange}
                            onScaleChange={onScaleChange}
                        />
                    );
                })}
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