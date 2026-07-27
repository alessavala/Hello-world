import { useEffect, useRef, useState } from 'react';
import './App.css';
import { uploadVideo, trimClip, listClips, deleteClip, resolveUrl } from './api';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

export default function App() {
  const [file, setFile] = useState(null);
  const [videoSrc, setVideoSrc] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [duration, setDuration] = useState(0);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [mode, setMode] = useState('video');
  const [clipName, setClipName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [error, setError] = useState(null);
  const [clips, setClips] = useState([]);
  const videoRef = useRef(null);

  useEffect(() => {
    refreshClips();
  }, []);

  async function refreshClips() {
    try {
      setClips(await listClips());
    } catch (err) {
      console.error(err);
    }
  }

  async function handleFileChange(e) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);
    setFile(selected);
    setVideoSrc(URL.createObjectURL(selected));
    setFileId(null);
    setIsUploading(true);
    try {
      const result = await uploadVideo(selected);
      setFileId(result.fileId);
      setDuration(result.duration);
      setStart(0);
      setEnd(result.duration);
      setClipName(selected.name.replace(/\.[^/.]+$/, ''));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  function useCurrentTimeAs(setter) {
    if (videoRef.current) {
      setter(Number(videoRef.current.currentTime.toFixed(2)));
    }
  }

  async function handleTrim() {
    if (!fileId) return;
    if (end <= start) {
      setError('El final debe ser mayor que el inicio.');
      return;
    }
    setError(null);
    setIsTrimming(true);
    try {
      await trimClip({ fileId, start, end, mode, name: clipName });
      await refreshClips();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTrimming(false);
    }
  }

  async function handleDelete(id) {
    await deleteClip(id);
    await refreshClips();
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎬 Cortador de Videos para Podcasts</h1>
        <p>Sube un video, selecciona el fragmento y expórtalo como clip de video o audio para tu podcast.</p>
      </header>

      <section className="panel">
        <label className="file-drop">
          <input type="file" accept="video/*" onChange={handleFileChange} hidden />
          {file ? file.name : 'Selecciona o arrastra un video'}
        </label>

        {isUploading && <p className="status">Subiendo video…</p>}

        {videoSrc && (
          <div className="editor">
            <video
              ref={videoRef}
              src={videoSrc}
              controls
              className="preview"
              onLoadedMetadata={(e) => {
                if (!fileId) setDuration(e.target.duration);
              }}
            />

            <div className="trim-controls">
              <div className="time-row">
                <label>
                  Inicio ({formatTime(start)})
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={start}
                    onChange={(e) => setStart(Number(e.target.value))}
                  />
                </label>
                <button type="button" onClick={() => useCurrentTimeAs(setStart)}>
                  Usar tiempo actual
                </button>
              </div>

              <div className="time-row">
                <label>
                  Fin ({formatTime(end)})
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={end}
                    onChange={(e) => setEnd(Number(e.target.value))}
                  />
                </label>
                <button type="button" onClick={() => useCurrentTimeAs(setEnd)}>
                  Usar tiempo actual
                </button>
              </div>

              <div className="options-row">
                <label>
                  Nombre del clip
                  <input
                    type="text"
                    value={clipName}
                    onChange={(e) => setClipName(e.target.value)}
                  />
                </label>

                <div className="mode-toggle">
                  <label>
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === 'video'}
                      onChange={() => setMode('video')}
                    />
                    Video
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="mode"
                      checked={mode === 'audio'}
                      onChange={() => setMode('audio')}
                    />
                    Solo audio (podcast)
                  </label>
                </div>
              </div>

              <button
                type="button"
                className="primary"
                disabled={!fileId || isTrimming}
                onClick={handleTrim}
              >
                {isTrimming ? 'Cortando…' : 'Cortar y exportar'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <h2>Clips generados</h2>
        {clips.length === 0 && <p className="status">Aún no has generado ningún clip.</p>}
        <ul className="clip-list">
          {clips.map((clip) => (
            <li key={clip.id} className="clip-item">
              {clip.mode === 'audio' ? (
                <audio controls src={resolveUrl(clip.url)} />
              ) : (
                <video controls src={resolveUrl(clip.url)} className="clip-preview" />
              )}
              <div className="clip-meta">
                <a href={resolveUrl(clip.url)} download>
                  Descargar {clip.mode === 'audio' ? 'audio' : 'video'}
                </a>
                <button type="button" onClick={() => handleDelete(clip.id)}>
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
