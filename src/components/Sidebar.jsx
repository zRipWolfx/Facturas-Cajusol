import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  FileText, Plus, Settings, Home, ChevronRight, Menu, X
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/' },
  { label: 'Nueva Cotización', icon: Plus, path: '/cotizacion/nueva' },
  { label: 'Cotizaciones', icon: FileText, path: '/cotizaciones' },
  { label: 'Configuración', icon: Settings, path: '/configuracion' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className="sidebar" style={{ width: collapsed ? '60px' : '240px', transition: 'width 0.25s ease' }}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">📄</div>
        {!collapsed && (
          <div className="sidebar-logo-text">
            CotizaApp
            <span>Sistema de Cotizaciones</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn btn-ghost btn-icon"
          style={{ marginLeft: 'auto', padding: '4px' }}
        >
          {collapsed ? <ChevronRight size={14} /> : <Menu size={14} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {!collapsed && <div className="nav-section-label">Menú</div>}
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path.replace('/nueva', '')))
          return (
            <button
              key={item.path}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
            >
              <Icon className="nav-icon" size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="sidebar-footer">
          v1.0.0 · Supabase + Vercel
        </div>
      )}
    </aside>
  )
}
