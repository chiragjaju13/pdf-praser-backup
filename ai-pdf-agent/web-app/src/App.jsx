import React, { useState, useMemo } from 'react';
import PDFUploader from './components/PDFUploader';
import ImageUploader from './components/ImageUploader';
import PageSelector from './components/PageSelector';
import PositionSelector from './components/PositionSelector';
import VisualEditor from './components/VisualEditor';
import ScaleControl from './components/ScaleControl';
import OpacityControl from './components/OpacityControl';
import JobPanel from './components/JobPanel';
import DownloadButton from './components/DownloadButton';
import FilenameInput from './components/FilenameInput';
import { processPDFs } from './utils/pdfEngine';

export default function App() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [imgFile, setImgFile] = useState(null);
  const [pages, setPages] = useState('all');
  const [position, setPosition] = useState({ position: 'bottom-right', custom_x: 0, custom_y: 0 });
  const [scale, setScale] = useState(1.0);
  const [opacity, setOpacity] = useState(1.0);
  const [customFilename, setCustomFilename] = useState('');

  const [jobStatus, setJobStatus] = useState(null); // 'processing', 'done', 'failed'
  const [jobResult, setJobResult] = useState(null); // Blob
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = pdfFiles.length > 0 && imgFile && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setJobStatus('processing');
    setJobResult(null);
    setLoading(true);

    const config = {
      operations: [
        {
          type: 'add_image',
          pages,
          ...position,
          scale,
          opacity,
        }
      ]
    };

    try {
      const resultBlob = await processPDFs(pdfFiles, imgFile, config);
      setJobResult(resultBlob);
      setJobStatus('done');
    } catch (e) {
      setError(e.message);
      setJobStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '18px 40px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, boxShadow: 'var(--accent-glow)',
        }}>⚡</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>AI PDF Agent</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Visual Automation Platform · v1.3</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'rgba(52,211,153,0.12)', padding: '3px 10px', borderRadius: 20, border: '1px solid rgba(52,211,153,0.3)' }}>
            ● System Active
          </span>
        </div>
      </header>

      {/* Main layout */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '40px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 380px',
        gap: 32,
        alignItems: 'start',
      }}>

        {/* LEFT: Task Builder */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Section – Inputs */}
          <div>
            <SectionTitle icon="📂" label="Source Files" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div>
                <div className="text-xs text-muted font-semibold" style={{ marginBottom: 8 }}>PDF DOCUMENTS ({pdfFiles.length})</div>
                <PDFUploader files={pdfFiles} onFiles={setPdfFiles} />
              </div>
              <div>
                <div className="text-xs text-muted font-semibold" style={{ marginBottom: 8 }}>IMAGE (Logo / Stamp)</div>
                <ImageUploader file={imgFile} onFile={setImgFile} />
              </div>
            </div>
          </div>

          <Divider />

          {/* Section – Visual Editor */}
          {pdfFiles.length > 0 && (
            <div className="card">
              <SectionTitle icon="🎨" label="Visual Editor" />
              <div style={{ marginTop: 16 }}>
                <VisualEditor
                  pdfFile={pdfFiles[0]}
                  imageFile={imgFile}
                  position={position}
                  onPositionChange={setPosition}
                  scale={scale}
                  onScaleChange={setScale}
                  opacity={opacity}
                  onOpacityChange={setOpacity}
                />
              </div>
            </div>
          )}

          {/* Section – Page Selection */}
          <div className="card">
            <SectionTitle icon="📄" label="Page Range" />
            <div style={{ marginTop: 16 }}>
              <PageSelector value={pages} onChange={setPages} />
            </div>
          </div>

          {/* Section – Appearance */}
          <div className="card">
            <SectionTitle icon="🎚️" label="Image Appearance" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
              <ScaleControl value={scale} onChange={setScale} />
              <OpacityControl value={opacity} onChange={setOpacity} />
            </div>
          </div>
        </div>

        {/* RIGHT: Execution Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 90 }}>
          <div className="card" style={{ background: 'rgba(99,102,241,0.03)' }}>
            <SectionTitle icon="⚙️" label="Execution" />

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ConfigRow label="PDFs" value={`${pdfFiles.length} file(s)`} missing={pdfFiles.length === 0} />
              <ConfigRow label="Image" value={imgFile?.name || '—'} missing={!imgFile} />
              <ConfigRow label="Pages" value={pages} />
              <ConfigRow label="Scale" value={`${scale.toFixed(2)}×`} />
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '20px 0' }} />

            <FilenameInput
              value={customFilename}
              onChange={setCustomFilename}
              isMultiple={pdfFiles.length > 1}
            />

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(248,113,113,0.1)', border: '1px solid var(--border-error)', borderRadius: 8, fontSize: 13, color: 'var(--error)' }}>
                ⚠️ {error}
              </div>
            )}

            <button
              className="btn btn-primary w-full"
              style={{ marginTop: 20, padding: '14px', justifyContent: 'center' }}
              onClick={handleSubmit}
              disabled={!canSubmit}
            >
              {loading ? '⏳ Processing...' : '▶ Run Pipeline'}
            </button>
          </div>

          {jobStatus && (
            <JobPanel
              status={jobStatus}
              error={error}
            />
          )}

          {jobResult && (
            <DownloadButton
              blob={jobResult}
              customFilename={customFilename}
              isMultiple={pdfFiles.length > 1}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 14 }}>{label}</span>
    </div>
  );
}

function Divider() { return <div style={{ height: 1, background: 'var(--border)' }} />; }

function ConfigRow({ label, value, missing }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 600, color: missing ? 'var(--error)' : 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
