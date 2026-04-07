import { useState, useEffect } from 'react'
import { Plus, Trash2, Eye, EyeOff, RefreshCw, MessageCircle, AlertCircle } from 'lucide-react'
import {
  getWhatsappNumeros,
  addWhatsappNumero,
  toggleWhatsappVisible,
  deleteWhatsappNumero,
} from '../lib/api'

/**
 * GestorWhatsapp: panel para agregar/ocultar/eliminar números de WhatsApp.
 * Se usa en la página de Configuración.
 */
export default function GestorWhatsapp() {
  const [numeros, setNumeros] = useState([])
  const [loading, setLoading] = useState(true)
  const [nuevoNumero, setNuevoNumero] = useState('')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try {
      const data = await getWhatsappNumeros()
      setNumeros(data)
    } catch (e) {
      setError('Error al cargar números: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!nuevoNumero.trim()) return
    setSaving(true)
    setError('')
    try {
      const nuevo = await addWhatsappNumero(nuevoNumero, nuevaDesc)
      setNumeros(prev => [...prev, nuevo])
      setNuevoNumero('')
      setNuevaDesc('')
      setShowForm(false)
    } catch (e) {
      setError('Error al guardar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(id, currentVisible) {
    try {
      await toggleWhatsappVisible(id, !currentVisible)
      setNumeros(prev => prev.map(n => n.id === id ? { ...n, visible: !currentVisible } : n))
    } catch {
      setError('Error al actualizar visibilidad.')
    }
  }

  async function handleDelete(id, numero) {
    if (!window.confirm(`¿Eliminar "${numero}"?`)) return
    try {
      await deleteWhatsappNumero(id)
      setNumeros(prev => prev.filter(n => n.id !== id))
    } catch {
      setError('Error al eliminar.')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {error && (
        <div className="alert alert-error">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 16 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* Lista de números */}
          {numeros.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-dark)', textAlign: 'center', padding: 12 }}>
              No hay números registrados.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {numeros.map(n => (
                <div
                  key={n.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: n.visible ? 'rgba(37,211,102,0.07)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${n.visible ? 'rgba(37,211,102,0.25)' : 'var(--border)'}`,
                    borderRadius: 8,
                    padding: '8px 12px',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Icono WhatsApp */}
                  <span style={{ fontSize: 20, flexShrink: 0 }}>
                    {n.visible ? '📱' : '🚫'}
                  </span>

                  {/* Datos */}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: n.visible ? '#25d366' : 'var(--text-muted)',
                    }}>
                      {n.numero}
                    </div>
                    {n.descripcion && (
                      <div style={{ fontSize: 11, color: 'var(--text-dark)' }}>{n.descripcion}</div>
                    )}
                  </div>

                  {/* Badge visible/oculto */}
                  <span className={`badge ${n.visible ? 'badge-green' : 'badge-gray'}`}>
                    {n.visible ? 'Visible' : 'Oculto'}
                  </span>

                  {/* Botón ocultar/mostrar */}
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleToggle(n.id, n.visible)}
                    title={n.visible ? 'Ocultar en cotizaciones' : 'Mostrar en cotizaciones'}
                  >
                    {n.visible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>

                  {/* Botón eliminar */}
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    onClick={() => handleDelete(n.id, n.numero)}
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulario agregar */}
          {showForm ? (
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}>
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Número WhatsApp</label>
                  <input
                    className="form-input"
                    placeholder="+51 999 999 999"
                    value={nuevoNumero}
                    onChange={e => setNuevoNumero(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Descripción <span className="optional">(opcional)</span></label>
                  <input
                    className="form-input"
                    placeholder="Ej: Ventas, Soporte..."
                    value={nuevaDesc}
                    onChange={e => setNuevaDesc(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleAdd}
                  disabled={saving || !nuevoNumero.trim()}
                >
                  {saving ? 'Guardando...' : <><Plus size={13} /> Guardar</>}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowForm(true)}
              style={{ alignSelf: 'flex-start' }}
            >
              <Plus size={14} /> Agregar número
            </button>
          )}
        </>
      )}
    </div>
  )
}
