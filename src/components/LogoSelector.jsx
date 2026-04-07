import { useState, useEffect } from 'react'
import { Upload, Database, Image, RefreshCw, Link } from 'lucide-react'
import { getLogosDisponibles, uploadLogo } from '../lib/api'

export default function LogoSelector({ tipoLogo, onChangeTipo, logoIconoUrl, logoTextoUrl, onChangeLogoIcono, onChangeLogoTexto }) {
  const [logosDB, setLogosDB] = useState([])
  const [loadingLogos, setLoadingLogos] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState('')

  useEffect(() => {
    if (tipoLogo === 'servidor') cargarLogosDB()
  }, [tipoLogo])

  async function cargarLogosDB() {
    setLoadingLogos(true)
    try {
      const data = await getLogosDisponibles()
      setLogosDB(data)
    } catch {
      setLogosDB([])
    } finally {
      setLoadingLogos(false)
    }
  }

  async function handleUpload(e, tipo) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('')
    try {
      const logo = await uploadLogo(file, tipo)
      setUploadMsg(`✓ Logo "${file.name}" subido correctamente`)
      if (tipo === 'icono') onChangeLogoIcono(logo.url_publica)
      else onChangeLogoTexto(logo.url_publica)
      await cargarLogosDB()
      e.target.value = ''
    } catch (err) {
      setUploadMsg(`Error: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="logo-options">
        <button
          type="button"
          className={`logo-option ${tipoLogo === 'archivo' ? 'selected' : ''}`}
          onClick={() => onChangeTipo('archivo')}
        >
          <div className="logo-option-icon">📁</div>
          Archivos locales
        </button>
        <button
          type="button"
          className={`logo-option ${tipoLogo === 'url' ? 'selected' : ''}`}
          onClick={() => onChangeTipo('url')}
        >
          <div className="logo-option-icon">🔗</div>
          URL pública
        </button>
        <button
          type="button"
          className={`logo-option ${tipoLogo === 'servidor' ? 'selected' : ''}`}
          onClick={() => onChangeTipo('servidor')}
        >
          <div className="logo-option-icon">☁️</div>
          Subir al servidor
        </button>
      </div>

      {tipoLogo === 'archivo' && (
        <div className="alert alert-warning" style={{ marginBottom: 0 }}>
          <Image size={16} />
          <div>
            Los logos se leen de <code>/public/logo-icon.png</code> y <code>/public/logo-text.png</code>.
            Reemplaza esos archivos con tus logos y recarga la página.
          </div>
        </div>
      )}

      {tipoLogo === 'url' && (
        <div className="form-grid form-grid-2" style={{ gap: 12 }}>
          <div className="form-group">
            <label className="form-label">URL Logo Icono</label>
            <input
              className="form-input"
              placeholder="https://..."
              value={logoIconoUrl || ''}
              onChange={e => onChangeLogoIcono(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">URL Logo Texto</label>
            <input
              className="form-input"
              placeholder="https://..."
              value={logoTextoUrl || ''}
              onChange={e => onChangeLogoTexto(e.target.value)}
            />
          </div>
        </div>
      )}

      {tipoLogo === 'servidor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Subir Logo Icono</label>
              <label className="upload-zone" style={{ display: 'block' }}>
                <Upload size={18} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: 12 }}>{uploading ? 'Subiendo...' : 'Click para subir PNG/JPG'}</div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'icono')} disabled={uploading} />
              </label>
            </div>
            <div>
              <label className="form-label" style={{ marginBottom: 6, display: 'block' }}>Subir Logo Texto</label>
              <label className="upload-zone" style={{ display: 'block' }}>
                <Upload size={18} style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: 12 }}>{uploading ? 'Subiendo...' : 'Click para subir PNG/JPG'}</div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e, 'texto')} disabled={uploading} />
              </label>
            </div>
          </div>

          {uploadMsg && (
            <div className={`alert ${uploadMsg.startsWith('Error') ? 'alert-error' : 'alert-success'}`}>
              {uploadMsg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Database size={14} /> Logos guardados en la base de datos
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={cargarLogosDB}>
              <RefreshCw size={12} /> Actualizar
            </button>
          </div>

          {loadingLogos ? (
            <div style={{ textAlign: 'center', padding: 12 }}><div className="spinner" /></div>
          ) : logosDB.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-dark)', textAlign: 'center', padding: 12 }}>
              No hay logos guardados. Sube uno arriba.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
              {logosDB.map(logo => (
                <div key={logo.id} style={{ position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (logo.tipo === 'icono') onChangeLogoIcono(logo.url_publica)
                      else onChangeLogoTexto(logo.url_publica)
                    }}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `2px solid ${(logoIconoUrl === logo.url_publica || logoTextoUrl === logo.url_publica) ? 'var(--primary-light)' : 'var(--border)'}`,
                      borderRadius: 8,
                      padding: 6,
                      cursor: 'pointer',
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <img src={logo.url_publica} alt={logo.nombre} style={{ width: '100%', height: 40, objectFit: 'contain' }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', wordBreak: 'break-all' }}>{logo.tipo}</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Link size={14} /> URL Icono seleccionado
              </label>
              <input className="form-input" value={logoIconoUrl || ''} onChange={e => onChangeLogoIcono(e.target.value)} placeholder="URL del icono" />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Link size={14} /> URL Texto seleccionado
              </label>
              <input className="form-input" value={logoTextoUrl || ''} onChange={e => onChangeLogoTexto(e.target.value)} placeholder="URL del texto" />
            </div>
          </div>
        </div>
      )}

      {(logoIconoUrl || logoTextoUrl) && (
        <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.9)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoIconoUrl && <img src={logoIconoUrl} alt="Logo icono" style={{ height: 48, objectFit: 'contain' }} />}
          {logoTextoUrl && <img src={logoTextoUrl} alt="Logo texto" style={{ height: 40, objectFit: 'contain' }} />}
        </div>
      )}
    </div>
  )
}
