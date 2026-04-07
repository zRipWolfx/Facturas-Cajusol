import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import {
  Plus, Trash2, Printer, Save, ArrowLeft,
  ChevronDown, ChevronUp, AlertCircle, MessageCircle
} from 'lucide-react'
import CotizacionPreview from '../components/CotizacionPreview'
import { saveCotizacion, getCotizacion, getSiguienteNumero, getConfiguracion, getWhatsappNumeros } from '../lib/api'
import { formatMoney } from '../lib/utils'

const ITEM_VACIO = { codigo: '', cantidad: '', unidad_medida: 'NIU', descripcion: '', precio_unitario: '' }

const UNIDADES = ['NIU', 'KGM', 'MTR', 'LTR', 'GLN', 'UND', 'PZA', 'JGO', 'CJA', 'PAR']

export default function FormularioCotizacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = id && id !== 'nueva'

  const printRef = useRef()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [config, setConfig] = useState(null)
  const [whatsappNumeros, setWhatsappNumeros] = useState([]) // números visibles disponibles

  // Encabezado cotización
  const [cot, setCot] = useState({
    numero: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    cliente_nombre: '',
    cliente_direccion: '',
    cliente_otro: '',
    cliente_atencion: '',
    cliente_telefono: '',
    moneda: 'SOLES',
    forma_pago: '',
    plazo_entrega: '',
    garantia: '',
    porcentaje_igv: 18,
    observaciones: '',
    estado: 'borrador',
    whatsapp_numero: '',  // número seleccionado para esta cotización
  })

  // Items / productos
  const [items, setItems] = useState([{ ...ITEM_VACIO }])

  // Cargar datos
  useEffect(() => {
    async function init() {
      setLoading(true)
      try {
        const cfg = await getConfiguracion()
        setConfig(cfg)

        // Cargar números WhatsApp visibles
        try {
          const waNums = await getWhatsappNumeros()
          setWhatsappNumeros(waNums.filter(n => n.visible))
        } catch { /* si la tabla no existe aún, ignorar */ }

        if (isEditing) {
          const data = await getCotizacion(id)
          const { items_cotizacion, ...cotData } = data
          setCot(cotData)
          setItems(items_cotizacion?.length ? items_cotizacion : [{ ...ITEM_VACIO }])
        } else {
          const num = await getSiguienteNumero()
          setCot(prev => ({ ...prev, numero: num }))
        }
      } catch (err) {
        setError('Error al cargar datos: ' + err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id, isEditing])

  // Cálculos automáticos
  const subtotal = items.reduce((s, i) => s + (parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0)), 0)
  const igv = subtotal * ((cot.porcentaje_igv || 18) / 100)
  const total = subtotal + igv

  // Handlers items
  function updateItem(idx, field, value) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { ...ITEM_VACIO }])
  }

  function removeItem(idx) {
    if (items.length === 1) { setItems([{ ...ITEM_VACIO }]); return }
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function moveItem(idx, dir) {
    setItems(prev => {
      const arr = [...prev]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return arr
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return arr
    })
  }

  // Guardar
  async function handleSave(e) {
    e?.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const validItems = items.filter(i => i.descripcion?.trim())
      await saveCotizacion({ ...cot, id: isEditing ? id : undefined }, validItems)
      setSuccess('Cotización guardada correctamente ✓')
      setTimeout(() => setSuccess(''), 3000)
      if (!isEditing) navigate('/cotizaciones')
    } catch (err) {
      setError('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  // Imprimir / PDF
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Cotizacion-${cot.numero}`,
    pageStyle: `
      @page { size: A4; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; } }
    `,
  })

  if (loading) return (
    <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--text-muted)' }}>Cargando...</div>
      </div>
    </div>
  )

  return (
    <div className="page-body">
      {/* Header actions */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/cotizaciones')}>
          <ArrowLeft size={14} /> Volver
        </button>
        <div style={{ flex: 1 }} />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Ocultar Vista Previa' : 'Ver Vista Previa'}
        </button>
        <button className="btn btn-success btn-sm" onClick={handlePrint}>
          <Printer size={14} /> Imprimir / PDF
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? <><div className="spinner" style={{ width: 14, height: 14 }} /> Guardando...</> : <><Save size={14} /> Guardar</>}
        </button>
      </div>

      {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr', gap: 20 }}>
        {/* ── FORMULARIO ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Sección: Datos básicos */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📋 Datos de la Cotización</div>
            </div>
            <div className="form-grid form-grid-3">
              <div className="form-group">
                <label className="form-label">Número</label>
                <input className="form-input" value={cot.numero} onChange={e => setCot(p => ({ ...p, numero: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Fecha Emisión</label>
                <input type="date" className="form-input" value={cot.fecha_emision} onChange={e => setCot(p => ({ ...p, fecha_emision: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Estado</label>
                <select className="form-select" value={cot.estado} onChange={e => setCot(p => ({ ...p, estado: e.target.value }))}>
                  <option value="borrador">Borrador</option>
                  <option value="enviada">Enviada</option>
                  <option value="aprobada">Aprobada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección: Cliente */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👤 Datos del Cliente</div>
              <span style={{ fontSize: 11, color: 'var(--text-dark)' }}>Todos opcionales</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Señor(es) <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Nombre del cliente" value={cot.cliente_nombre} onChange={e => setCot(p => ({ ...p, cliente_nombre: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Dirección <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Dirección del cliente" value={cot.cliente_direccion} onChange={e => setCot(p => ({ ...p, cliente_direccion: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Otro <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Otro dato" value={cot.cliente_otro} onChange={e => setCot(p => ({ ...p, cliente_otro: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Atención <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Persona de contacto" value={cot.cliente_atencion} onChange={e => setCot(p => ({ ...p, cliente_atencion: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Teléfono <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Teléfono cliente" value={cot.cliente_telefono} onChange={e => setCot(p => ({ ...p, cliente_telefono: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Sección: WhatsApp */}
          <div className="card">
            <div className="card-header">
              <div className="card-title"><MessageCircle size={16} color="#25d366" /> WhatsApp de contacto</div>
              <span style={{ fontSize: 11, color: 'var(--text-dark)' }}>Opcional · aparece en el PDF</span>
            </div>
            {whatsappNumeros.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-dark)' }}>
                No hay números registrados. Ve a{' '}
                <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', display: 'inline-flex' }}
                  onClick={() => window.open('/configuracion', '_blank')}>
                  Configuración → WhatsApp
                </button>{' '} para agregar uno.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Opción: ninguno */}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                  padding: '8px 12px', borderRadius: 8,
                  background: !cot.whatsapp_numero ? 'rgba(148,163,184,0.1)' : 'transparent',
                  border: `1px solid ${!cot.whatsapp_numero ? 'var(--border-light)' : 'var(--border)'}`,
                  transition: 'all 0.15s',
                }}>
                  <input type="radio" name="wa" value="" checked={!cot.whatsapp_numero}
                    onChange={() => setCot(p => ({ ...p, whatsapp_numero: '' }))} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No mostrar WhatsApp</span>
                </label>
                {/* Opciones por número */}
                {whatsappNumeros.map(n => (
                  <label key={n.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                    padding: '8px 12px', borderRadius: 8,
                    background: cot.whatsapp_numero === n.numero ? 'rgba(37,211,102,0.08)' : 'transparent',
                    border: `1px solid ${cot.whatsapp_numero === n.numero ? 'rgba(37,211,102,0.35)' : 'var(--border)'}`,
                    transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="wa" value={n.numero} checked={cot.whatsapp_numero === n.numero}
                      onChange={() => setCot(p => ({ ...p, whatsapp_numero: n.numero }))} />
                    <span style={{ fontSize: 18 }}>📱</span>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#25d366' }}>{n.numero}</div>
                      {n.descripcion && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{n.descripcion}</div>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Sección: Condiciones */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">📝 Condiciones</div>
              <span style={{ fontSize: 11, color: 'var(--text-dark)' }}>Todos opcionales</span>
            </div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select className="form-select" value={cot.moneda} onChange={e => setCot(p => ({ ...p, moneda: e.target.value }))}>
                  <option value="SOLES">SOLES</option>
                  <option value="DOLARES">DOLARES</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">IGV % <span className="optional">(opcional)</span></label>
                <input type="number" className="form-input" value={cot.porcentaje_igv} min="0" max="100" onChange={e => setCot(p => ({ ...p, porcentaje_igv: parseFloat(e.target.value) }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Forma de Pago <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Ej: Contado, 30 días..." value={cot.forma_pago} onChange={e => setCot(p => ({ ...p, forma_pago: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Plazo Entrega <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Ej: 7 días hábiles" value={cot.plazo_entrega} onChange={e => setCot(p => ({ ...p, plazo_entrega: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Garantía <span className="optional">(opcional)</span></label>
                <input className="form-input" placeholder="Ej: 6 meses" value={cot.garantia} onChange={e => setCot(p => ({ ...p, garantia: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* ── TABLA DE PRODUCTOS ── */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🛒 Productos / Servicios</div>
              <button className="btn btn-primary btn-sm" type="button" onClick={addItem}>
                <Plus size={14} /> Agregar Fila
              </button>
            </div>

            <div className="table-container">
              <table className="data-table" style={{ minWidth: 700 }}>
                <thead>
                  <tr>
                    <th style={{ width: 30 }}>#</th>
                    <th style={{ width: 80 }}>Código</th>
                    <th style={{ width: 70 }}>Cant.</th>
                    <th style={{ width: 80 }}>U/M</th>
                    <th>Descripción</th>
                    <th style={{ width: 100 }}>P. Unit.</th>
                    <th style={{ width: 100 }}>P. Total</th>
                    <th style={{ width: 70 }}>Acc.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const total_item = (parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0))
                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{idx + 1}</td>
                        <td>
                          <input
                            className="items-table-input"
                            value={item.codigo}
                            onChange={e => updateItem(idx, 'codigo', e.target.value)}
                            placeholder="—"
                          />
                        </td>
                        <td>
                          <input
                            className="items-table-input text-right"
                            type="number"
                            value={item.cantidad}
                            onChange={e => updateItem(idx, 'cantidad', e.target.value)}
                            placeholder="0"
                            min="0"
                          />
                        </td>
                        <td>
                          <select
                            className="items-table-input"
                            value={item.unidad_medida}
                            onChange={e => updateItem(idx, 'unidad_medida', e.target.value)}
                            style={{ background: 'transparent', border: 'none', color: 'inherit', width: '100%' }}
                          >
                            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            className="items-table-input"
                            value={item.descripcion}
                            onChange={e => updateItem(idx, 'descripcion', e.target.value)}
                            placeholder="Descripción del producto o servicio"
                          />
                        </td>
                        <td>
                          <input
                            className="items-table-input text-right"
                            type="number"
                            value={item.precio_unitario}
                            onChange={e => updateItem(idx, 'precio_unitario', e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#60a5fa', paddingRight: 8 }}>
                          {total_item > 0 ? formatMoney(total_item) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <button type="button" className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={() => moveItem(idx, -1)} disabled={idx === 0}>
                              <ChevronUp size={12} />
                            </button>
                            <button type="button" className="btn btn-ghost btn-icon" style={{ padding: 3 }} onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1}>
                              <ChevronDown size={12} />
                            </button>
                            <button type="button" className="btn btn-danger btn-icon" style={{ padding: 3 }} onClick={() => removeItem(idx)}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <table style={{ fontSize: 13, borderCollapse: 'collapse', minWidth: 240 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 12px', color: 'var(--text-muted)' }}>Subtotal (sin IGV)</td>
                    <td style={{ padding: '4px 12px', textAlign: 'right', fontWeight: 600 }}>S/. {formatMoney(subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 12px', color: 'var(--text-muted)' }}>IGV ({cot.porcentaje_igv}%)</td>
                    <td style={{ padding: '4px 12px', textAlign: 'right' }}>S/. {formatMoney(igv)}</td>
                  </tr>
                  <tr style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 12px', fontWeight: 700, color: 'var(--text)' }}>TOTAL</td>
                    <td style={{ padding: '6px 12px', textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#60a5fa' }}>
                      S/. {formatMoney(total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Observaciones */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">💬 Observaciones</div>
              <span style={{ fontSize: 11, color: 'var(--text-dark)' }}>Opcional</span>
            </div>
            <textarea
              className="form-textarea"
              placeholder="Observaciones adicionales para la cotización..."
              value={cot.observaciones || ''}
              onChange={e => setCot(p => ({ ...p, observaciones: e.target.value }))}
              style={{ minHeight: 80 }}
            />
          </div>

          {/* Botones finales */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-success" onClick={handlePrint}>
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : <><Save size={16} /> Guardar Cotización</>}
            </button>
          </div>
        </div>

        {/* ── PREVIEW (solo si showPreview) ── */}
        {showPreview && (
          <div style={{ position: 'sticky', top: 70, maxHeight: 'calc(100vh - 90px)', overflowY: 'auto' }}>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
                <span>Vista Previa PDF</span>
                <button className="btn btn-success btn-sm" onClick={handlePrint}>
                  <Printer size={12} /> PDF
                </button>
              </div>
              <div style={{ background: '#e8e8e8', padding: 12 }}>
                <CotizacionPreview ref={printRef} cotizacion={cot} items={items.filter(i => i.descripcion)} config={config} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Componente oculto para impresión cuando preview está cerrado */}
      {!showPreview && (
        <div style={{ display: 'none' }}>
          <CotizacionPreview ref={printRef} cotizacion={cot} items={items.filter(i => i.descripcion)} config={config} />
        </div>
      )}
    </div>
  )
}
