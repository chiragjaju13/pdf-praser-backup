import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

/**
 * Handles PDF processing directly in the browser.
 */
export async function processPDFs(pdfFiles, imageFile, config) {
    const { operations } = config;
    const processedFiles = [];

    // Load the image bytes once
    const imageBytes = await imageFile.arrayBuffer();

    for (const pdfFile of pdfFiles) {
        const pdfBytes = await pdfFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);

        // Embed the image into the PDF
        let embeddedImage;
        if (imageFile.type === 'image/png') {
            embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
            embeddedImage = await pdfDoc.embedJpg(imageBytes);
        } else {
            throw new Error('Unsupported image format. Please use PNG or JPEG.');
        }

        const pages = pdfDoc.getPages();
        const targetPageIndices = getTargetPageIndices(pages.length, operations[0].pages);

        for (const index of targetPageIndices) {
            const page = pages[index];
            const { width, height } = page.getSize();

            for (const op of operations) {
                if (op.type === 'add_image') {
                    const { x, y, w, h } = calculateRect(width, height, embeddedImage.width, embeddedImage.height, op);

                    page.drawImage(embeddedImage, {
                        x,
                        y,
                        width: w,
                        height: h,
                        opacity: op.opacity || 1.0,
                    });
                }
            }
        }

        const processedPdfBytes = await pdfDoc.save();
        processedFiles.push({
            name: pdfFile.name,
            bytes: processedPdfBytes,
        });
    }

    if (processedFiles.length === 1) {
        return new Blob([processedFiles[0].bytes], { type: 'application/pdf' });
    } else {
        const zip = new JSZip();
        processedFiles.forEach((file) => {
            zip.file(file.name, file.bytes);
        });
        return await zip.generateAsync({ type: 'blob' });
    }
}

function getTargetPageIndices(numPages, spec) {
    if (spec === 'all') return Array.from({ length: numPages }, (_, i) => i);
    if (spec === 'first') return [0];
    if (spec === 'last') return [numPages - 1];

    try {
        if (spec.includes(',')) {
            return spec.split(',')
                .map(p => parseInt(p.trim()) - 1)
                .filter(p => !isNaN(p) && p >= 0 && p < numPages);
        }
        if (spec.includes('-')) {
            const [start, end] = spec.split('-').map(p => parseInt(p.trim()));
            const indices = [];
            for (let i = start - 1; i < Math.min(end, numPages); i++) {
                if (i >= 0) indices.push(i);
            }
            return indices;
        }
        const p = parseInt(spec);
        if (!isNaN(p) && p > 0 && p <= numPages) return [p - 1];
    } catch (e) {
        console.error('Error parsing page spec:', e);
    }
    return Array.from({ length: numPages }, (_, i) => i);
}

function calculateRect(pw, ph, imgW, imgH, op) {
    const scale = op.scale || 1.0;
    const w = imgW * scale;
    const h = imgH * scale;

    let x = 0;
    let y = 0;

    if (op.position === 'custom') {
        x = op.custom_x;
        // pdf-lib uses bottom-left origin. 
        // Frontend editor uses top-left origin.
        y = ph - op.custom_y - h;
    } else {
        const mapping = {
            'top-left': [0, ph - h],
            'top-center': [pw / 2 - w / 2, ph - h],
            'top-right': [pw - w, ph - h],
            'center-left': [0, ph / 2 - h / 2],
            'center': [pw / 2 - w / 2, ph / 2 - h / 2],
            'center-right': [pw - w, ph / 2 - h / 2],
            'bottom-left': [0, 0],
            'bottom-center': [pw / 2 - w / 2, 0],
            'bottom-right': [pw - w, 0],
        };
        [x, y] = mapping[op.position] || [0, 0];
    }

    return { x, y, w, h };
}
