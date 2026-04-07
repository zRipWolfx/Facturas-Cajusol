import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Plus, Settings, TrendingUp } from 'lucide-react'
import { getCotizaciones } from '../lib/api'
import { formatDate, formatMoney } from '../lib/utils'

export default function Dashboard() {
  const navigate = useNavigate()
  const [cotizaciones, setCotizaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [dbOk, setDbOk] = useState(null)

  useEffect(() => {
    getCotizaciones()
      .then(data => { setCotizaciones(data); setDbOk(true) })
      .catch(() => setDbOk(false))
      .finally(() => setLoading(false))
  }, [])

  const recientes = cotizaciones.slice(0, 5)
  const totalMes = cotizaciones
    .filter(c => new Date(c.created_at).getMonth() === new Date().getMonth())
    .reduce((s, c) => s + (c.total || 0), 0)

  return (
    <div className="page-body">
      {dbOk === false && (
        <div className="alert alert-warning">
          ⚠️ <strong>Base de datos no disponible.</strong> Revisa la <code>DATABASE_URL</code> de Railway en tu archivo <code>.env</code> y vuelve a iniciar el servidor.
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 12 }} onClick={() => navigate('/configuracion')}>
            Ir a Configuración
          </button>
        </div>
      )}

      {/* Bienvenida */}
      <div style={{
        background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 60%, #3949ab 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -20, top: -20,
          width: 200, height: 200,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '50%',
        }} />
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            Sistema de Cotizaciones
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 20 }}>
            Crea, gestiona e imprime cotizaciones profesionales en PDF
          </p>
          <button className="btn btn-accent btn-lg" onClick={() => navigate('/cotizacion/nueva')}>
            <Plus size={18} /> Nueva Cotización
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#60a5fa' }}>{cotizaciones.length}</div>
          <div className="stat-label">Total Cotizaciones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#34d399' }}>
            {cotizaciones.filter(c => c.estado === 'aprobada').length}
          </div>
          <div className="stat-label">Aprobadas</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {cotizaciones.filter(c => c.estado === 'borrador').length}
          </div>
          <div className="stat-label">Borradores</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#a78bfa', fontSize: 20 }}>
            S/. {formatMoney(totalMes)}
          </div>
          <div className="stat-label">Facturado este mes</div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { icon: Plus, label: 'Nueva Cotización', sub: 'Crear nueva', path: '/cotizacion/nueva', color: 'var(--primary-light)' },
          { icon: FileText, label: 'Ver Cotizaciones', sub: `${cotizaciones.length} registros`, path: '/cotizaciones', color: '#10b981' },
          { icon: Settings, label: 'Configuración', sub: 'Empresa y logo', path: '/configuracion', color: '#f59e0b' },
        ].map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.path}
              className="card"
              onClick={() => navigate(item.path)}
              style={{
                cursor: 'pointer', textAlign: 'left', border: '1px solid var(--border)',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = item.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: `${item.color}22`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={22} color={item.color} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.sub}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Cotizaciones recientes */}
      <div className="card">
        <div className="card-header">
          <div className="card-title"><TrendingUp size={18} /> Cotizaciones Recientes</div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/cotizaciones')}>Ver todas</button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><div className="spinner" /></div>
        ) : recientes.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3>Sin cotizaciones aún</h3>
            <p>Crea tu primera cotización</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {recientes.map(cot => (
                  <tr key={cot.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/cotizacion/${cot.id}`)}>
                    <td style={{ fontWeight: 600, color: '#60a5fa' }}>{cot.numero}</td>
                    <td>{formatDate(cot.fecha_emision)}</td>
                    <td>{cot.cliente_nombre || '—'}</td>
                    <td style={{ fontWeight: 600 }}>S/. {formatMoney(cot.total)}</td>
                    <td>
                      <span className={`badge ${
                        cot.estado === 'aprobada' ? 'badge-green' :
                        cot.estado === 'enviada' ? 'badge-blue' :
                        cot.estado === 'rechazada' ? 'badge-red' : 'badge-gray'
                      }`}>{cot.estado}</span>
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
