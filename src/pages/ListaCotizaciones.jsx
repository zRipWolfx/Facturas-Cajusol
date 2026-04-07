import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Eye, Trash2, RefreshCw } from 'lucide-react'
import { getCotizaciones, deleteCotizacion } from '../lib/api'
import { formatDate, formatMoney } from '../lib/utils'

const estadoBadge = {
  borrador: 'badge-gray',
  enviada: 'badge-blue',
  aprobada: 'badge-green',
  rechazada: 'badge-red',
}

export default function ListaCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    setError('')
    try {
      const data = await getCotizaciones()
      setCotizaciones(data)
    } catch {
      setError('Error al cargar cotizaciones. Verifica la conexión del servidor con Railway.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id, numero) {
    if (!window.confirm(`¿Eliminar cotización ${numero}?`)) return
    try {
      await deleteCotizacion(id)
      setCotizaciones(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Error al eliminar.')
    }
  }

  return (
    <div className="page-body">
      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{cotizaciones.length}</div>
          <div className="stat-label">Total Cotizaciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cotizaciones.filter(c => c.estado === 'aprobada').length}</div>
          <div className="stat-label">Aprobadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{cotizaciones.filter(c => c.estado === 'borrador').length}</div>
          <div className="stat-label">Borradores</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            S/. {formatMoney(cotizaciones.reduce((s, c) => s + (c.total || 0), 0))}
          </div>
          <div className="stat-label">Total Facturado</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} />
            Todas las Cotizaciones
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={cargar}>
              <RefreshCw size={14} /> Actualizar
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/cotizacion/nueva')}>
              <Plus size={14} /> Nueva
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div className="spinner" />
            <div style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: 14 }}>Cargando...</div>
          </div>
        ) : cotizaciones.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>Sin cotizaciones</h3>
            <p>Crea tu primera cotización para comenzar</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/cotizacion/nueva')}>
              <Plus size={16} /> Nueva Cotización
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Moneda</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map(cot => (
                  <tr key={cot.id}>
                    <td style={{ fontWeight: 600, color: '#60a5fa' }}>{cot.numero}</td>
                    <td>{formatDate(cot.fecha_emision)}</td>
                    <td>{cot.cliente_nombre || <span style={{ color: 'var(--text-dark)' }}>—</span>}</td>
                    <td>{cot.moneda}</td>
                    <td style={{ fontWeight: 600 }}>S/. {formatMoney(cot.total)}</td>
                    <td>
                      <span className={`badge ${estadoBadge[cot.estado] || 'badge-gray'}`}>
                        {cot.estado}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => navigate(`/cotizacion/${cot.id}`)}
                          title="Ver / Editar"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-sm btn-icon"
                          onClick={() => handleDelete(cot.id, cot.numero)}
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
