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
  
  // Images
  const [letterheadFile, setLetterheadFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  
  // Active Configuration Tab
  const [activeImage, setActiveImage] = useState('letterhead'); // 'letterhead' or 'signature'

  // Letterhead config
  const [letterheadPosition, setLetterheadPosition] = useState({ position: 'top-center', custom_x: 0, custom_y: 0 });
  const [letterheadScale, setLetterheadScale] = useState(1.0);
  const [letterheadOpacity, setLetterheadOpacity] = useState(1.0);
  const [letterheadPages, setLetterheadPages] = useState('all');
  
  // Signature config
  const [signaturePosition, setSignaturePosition] = useState({ position: 'bottom-right', custom_x: 0, custom_y: 0 });
  const [signatureScale, setSignatureScale] = useState(1.0);
  const [signatureOpacity, setSignatureOpacity] = useState(1.0);
  const [signaturePages, setSignaturePages] = useState('all');

  const [customFilename, setCustomFilename] = useState('');

  const [jobStatus, setJobStatus] = useState(null); // 'processing', 'done', 'failed'
  const [jobResult, setJobResult] = useState(null); // { blob, defaultName }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasAnyImage = !!letterheadFile || !!signatureFile;
  const canSubmit = pdfFiles.length > 0 && hasAnyImage && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setJobStatus('processing');
    setJobResult(null);
    setLoading(true);

    const operations = [];

    if (letterheadFile) {
      operations.push({
        id: 'letterhead',
        type: 'add_image',
        pages: letterheadPages,
        ...letterheadPosition,
        scale: letterheadScale,
        opacity: letterheadOpacity,
        file: letterheadFile
      });
    }

    if (signatureFile) {
      operations.push({
        id: 'signature',
        type: 'add_image',
        pages: signaturePages,
        ...signaturePosition,
        scale: signatureScale,
        opacity: signatureOpacity,
        file: signatureFile
      });
    }

    const config = { operations };

    try {
      const result = await processPDFs(pdfFiles, config);
      setJobResult(result);
      setJobStatus('done');
    } catch (e) {
      setError(e.message);
      setJobStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const imagesForEditor = [
    letterheadFile && { id: 'letterhead', file: letterheadFile, position: letterheadPosition, scale: letterheadScale, opacity: letterheadOpacity },
    signatureFile && { id: 'signature', file: signatureFile, position: signaturePosition, scale: signatureScale, opacity: signatureOpacity },
  ].filter(Boolean);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '18px 40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        background: 'rgba(0,0,0,0.3)',
        backdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>NCS PDF Signer</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 12 }}>
              <div style={{ padding: 16, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px dashed var(--border)' }}>
                <div className="text-xs text-muted font-semibold" style={{ marginBottom: 8 }}>1. PDF DOCUMENTS ({pdfFiles.length})</div>
                <PDFUploader files={pdfFiles} onFiles={setPdfFiles} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={activeImage === 'letterhead' ? {boxShadow: '0 0 0 2px var(--accent)', borderRadius: 12, padding: 8, cursor: 'pointer'} : {padding: 8, cursor: 'pointer'}}
                     onClick={() => setActiveImage('letterhead')}>
                  <div className="text-xs text-muted font-semibold" style={{ marginBottom: 8 }}>2A. LETTERHEAD</div>
                  <ImageUploader file={letterheadFile} onFile={(file) => { setLetterheadFile(file); setActiveImage('letterhead'); }} />
                </div>
                <div style={activeImage === 'signature' ? {boxShadow: '0 0 0 2px var(--accent)', borderRadius: 12, padding: 8, cursor: 'pointer'} : {padding: 8, cursor: 'pointer'}}
                     onClick={() => setActiveImage('signature')}>
                  <div className="text-xs text-muted font-semibold" style={{ marginBottom: 8 }}>2B. SIGNATURE</div>
                  <ImageUploader file={signatureFile} onFile={(file) => { setSignatureFile(file); setActiveImage('signature'); }} />
                </div>
              </div>
            </div>
          </div>

          <Divider />

          {/* Section – Visual Editor */}
          {pdfFiles.length > 0 && hasAnyImage && (
            <div className="card">
              <SectionTitle icon="🎨" label="Visual Editor" />
              <div style={{ marginTop: 16 }}>
                <VisualEditor
                  pdfFile={pdfFiles[0]}
                  images={imagesForEditor}
                  onPositionChange={(id, pos) => {
                    if (id === 'letterhead') setLetterheadPosition(prev => ({...prev, ...pos}));
                    else setSignaturePosition(prev => ({...prev, ...pos}));
                  }}
                  onScaleChange={(id, s) => {
                    if (id === 'letterhead') setLetterheadScale(s);
                    else setSignatureScale(s);
                  }}
                  onOpacityChange={(id, o) => {
                    if (id === 'letterhead') setLetterheadOpacity(o);
                    else setSignatureOpacity(o);
                  }}
                  activeImageId={activeImage}
                  setActiveImageId={setActiveImage}
                />
              </div>
            </div>
          )}

          {/* Section – Page Selection */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionTitle icon="📄" label="Page Range" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className={`btn ${activeImage === 'letterhead' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  onClick={() => setActiveImage('letterhead')}
                >
                  Letterhead
                </button>
                <button 
                  className={`btn ${activeImage === 'signature' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  onClick={() => setActiveImage('signature')}
                >
                  Signature
                </button>
              </div>
            </div>
            
            <div style={{ marginTop: 24 }}>
              {activeImage === 'letterhead' ? (
                <>
                  <div className="text-sm font-semibold text-accent" style={{marginBottom: 12}}>Applying Letterhead To:</div>
                  <PageSelector value={letterheadPages} onChange={setLetterheadPages} />
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-accent" style={{marginBottom: 12}}>Applying Signature To:</div>
                  <PageSelector value={signaturePages} onChange={setSignaturePages} />
                </>
              )}
            </div>
          </div>

          {/* Section – Appearance */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <SectionTitle icon="🎚️" label="Image Appearance" />
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  className={`btn ${activeImage === 'letterhead' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  onClick={() => setActiveImage('letterhead')}
                >
                  Letterhead
                </button>
                <button 
                  className={`btn ${activeImage === 'signature' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ padding: '6px 12px', fontSize: 13 }}
                  onClick={() => setActiveImage('signature')}
                >
                  Signature
                </button>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
              {activeImage === 'letterhead' ? (
                <>
                  <div className="text-sm font-semibold text-accent" style={{marginBottom: -10}}>Adjusting Letterhead Settings</div>
                  <ScaleControl value={letterheadScale} onChange={setLetterheadScale} />
                  <OpacityControl value={letterheadOpacity} onChange={setLetterheadOpacity} />
                </>
              ) : (
                <>
                  <div className="text-sm font-semibold text-accent" style={{marginBottom: -10}}>Adjusting Signature Settings</div>
                  <ScaleControl value={signatureScale} onChange={setSignatureScale} />
                  <OpacityControl value={signatureOpacity} onChange={setSignatureOpacity} />
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Execution Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 90 }}>
          <div className="card" style={{ background: 'rgba(99,102,241,0.03)' }}>
            <SectionTitle icon="⚙️" label="Execution" />

            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ConfigRow label="PDFs" value={`${pdfFiles.length} file(s)`} missing={pdfFiles.length === 0} />
              <ConfigRow label="Letterhead" value={letterheadFile?.name || '—'} />
              {letterheadFile && <ConfigRow label="↳ Pages" value={letterheadPages} />}
              <ConfigRow label="Signature" value={signatureFile?.name || '—'} />
              {signatureFile && <ConfigRow label="↳ Pages" value={signaturePages} />}
              {(!hasAnyImage) && <ConfigRow label="Missing Any Image" value="Yes" missing={true} />}
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
              jobResult={jobResult}
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