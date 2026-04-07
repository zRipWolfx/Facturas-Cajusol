import { useState, useEffect } from 'react'
import { Save, Building2, AlertCircle, CheckCircle } from 'lucide-react'
import LogoSelector from '../components/LogoSelector'
import GestorWhatsapp from '../components/GestorWhatsapp'
import { getConfiguracion, saveConfiguracion } from '../lib/api'

export default function Configuracion() {
  const [config, setConfig] = useState({
    nombre_empresa: '',
    ruc: '',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    web: '',
    descripcion_negocio: '',
    logo_tipo: 'archivo',
    logo_icono_url: '/logo-icon.png',
    logo_texto_url: '/logo-text.png',
    banco1_nombre: '',
    banco1_cci: '',
    banco2_nombre: '',
    banco2_cci: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    getConfiguracion()
      .then(data => {
        if (!data) return
        setConfig(cfg => ({
          ...cfg,
          ...data,
          logo_tipo: data.logo_tipo === 'supabase' ? 'servidor' : (data.logo_tipo || cfg.logo_tipo),
        }))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(field, value) {
    setConfig(prev => ({ ...prev, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMsg({ type: '', text: '' })
    try {
      await saveConfiguracion(config)
      setMsg({ type: 'success', text: 'Configuración guardada correctamente ✓' })
    } catch (err) {
      setMsg({ type: 'error', text: 'Error al guardar: ' + err.message })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="page-body" style={{ textAlign: 'center', paddingTop: 60 }}>
      <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
      <div style={{ color: 'var(--text-muted)' }}>Cargando configuración...</div>
    </div>
  )

  return (
    <div className="page-body">
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 860 }}>

        {msg.text && (
          <div className={`alert ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {msg.text}
          </div>
        )}

        {/* Datos empresa */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Building2 size={18} /> Datos de la Empresa</div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Nombre de la Empresa</label>
              <input className="form-input" value={config.nombre_empresa} onChange={e => set('nombre_empresa', e.target.value)} placeholder="MI EMPRESA S.A.C." required />
            </div>
            <div className="form-group">
              <label className="form-label">RUC <span className="optional">(opcional)</span></label>
              <input className="form-input" value={config.ruc || ''} onChange={e => set('ruc', e.target.value)} placeholder="20xxxxxxxxx" maxLength={11} />
            </div>
            <div className="form-group">
              <label className="form-label">Teléfono <span className="optional">(opcional)</span></label>
              <input className="form-input" value={config.telefono || ''} onChange={e => set('telefono', e.target.value)} placeholder="999 999 999" />
            </div>
            <div className="form-group">
              <label className="form-label">Dirección <span className="optional">(opcional)</span></label>
              <input className="form-input" value={config.direccion || ''} onChange={e => set('direccion', e.target.value)} placeholder="Jr. Ejemplo 123" />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad <span className="optional">(opcional)</span></label>
              <input className="form-input" value={config.ciudad || ''} onChange={e => set('ciudad', e.target.value)} placeholder="Lima - Lima" />
            </div>
            <div className="form-group">
              <label className="form-label">Email <span className="optional">(opcional)</span></label>
              <input type="email" className="form-input" value={config.email || ''} onChange={e => set('email', e.target.value)} placeholder="empresa@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Sitio Web <span className="optional">(opcional)</span></label>
              <input className="form-input" value={config.web || ''} onChange={e => set('web', e.target.value)} placeholder="www.miempresa.com" />
            </div>
            <div className="form-group" style={{ gridColumn: '1/-1' }}>
              <label className="form-label">Giro del Negocio / Descripción <span className="optional">(opcional)</span></label>
              <textarea
                className="form-textarea"
                value={config.descripcion_negocio || ''}
                onChange={e => set('descripcion_negocio', e.target.value)}
                placeholder="Descripción de los productos y servicios que ofrece la empresa..."
                style={{ minHeight: 70 }}
              />
            </div>
          </div>
        </div>

        {/* Logos */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🖼️ Logotipos</div>
            <span style={{ fontSize: 11, color: 'var(--text-dark)' }}>
              Selecciona cómo cargar el logo en las cotizaciones
            </span>
          </div>
          <LogoSelector
            tipoLogo={config.logo_tipo}
            onChangeTipo={v => set('logo_tipo', v)}
            logoIconoUrl={config.logo_icono_url}
            logoTextoUrl={config.logo_texto_url}
            onChangeLogoIcono={v => set('logo_icono_url', v)}
            onChangeLogoTexto={v => set('logo_texto_url', v)}
          />
        </div>

        {/* Datos bancarios */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏦 Información Bancaria <span style={{ fontSize: 11, color: 'var(--text-dark)', fontWeight: 400 }}>(opcional)</span></div>
          </div>
          <div className="form-grid form-grid-2">
            <div className="form-group">
              <label className="form-label">Banco 1 - Nombre</label>
              <input className="form-input" value={config.banco1_nombre || ''} onChange={e => set('banco1_nombre', e.target.value)} placeholder="Ej: BCP" />
            </div>
            <div className="form-group">
              <label className="form-label">Banco 1 - Número / CCI</label>
              <input className="form-input" value={config.banco1_cci || ''} onChange={e => set('banco1_cci', e.target.value)} placeholder="CCI: 00219..." />
            </div>
            <div className="form-group">
              <label className="form-label">Banco 2 - Nombre <span className="optional">(opcional)</span></label>
              <input className="form-input" value={config.banco2_nombre || ''} onChange={e => set('banco2_nombre', e.target.value)} placeholder="Ej: BBVA" />
            </div>
            <div className="form-group">
              <label className="form-label">Banco 2 - Número / CCI <span className="optional">(opcional)</span></label>
              <input className="form-input" value={config.banco2_cci || ''} onChange={e => set('banco2_cci', e.target.value)} placeholder="CCI: 00115..." />
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">📱 Números de WhatsApp</div>
            <span style={{ fontSize: 11, color: 'var(--text-dark)' }}>
              Selecciona cuál mostrar en cada cotización
            </span>
          </div>
          <GestorWhatsapp />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving ? 'Guardando...' : <><Save size={16} /> Guardar Configuración</>}
          </button>
        </div>
      </form>
    </div>
  )
}
