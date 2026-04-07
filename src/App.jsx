import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import FormularioCotizacion from './pages/FormularioCotizacion'
import ListaCotizaciones from './pages/ListaCotizaciones'
import Configuracion from './pages/Configuracion'

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <header className="page-header">
            <div className="page-title">
              CotizaApp
              <span>Sistema de Cotizaciones Profesional</span>
            </div>
          </header>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cotizaciones" element={
              <>
                <header className="page-header" style={{ marginTop: -1 }}>
                  <div className="page-title">
                    Cotizaciones
                    <span>Gestión de todas tus cotizaciones</span>
                  </div>
                </header>
                <ListaCotizaciones />
              </>
            } />
            <Route path="/cotizacion/nueva" element={
              <>
                <header className="page-header" style={{ marginTop: -1 }}>
                  <div className="page-title">
                    Nueva Cotización
                    <span>Completa los datos y agrega productos</span>
                  </div>
                </header>
                <FormularioCotizacion />
              </>
            } />
            <Route path="/cotizacion/:id" element={
              <>
                <header className="page-header" style={{ marginTop: -1 }}>
                  <div className="page-title">
                    Editar Cotización
                    <span>Modifica los datos de la cotización</span>
                  </div>
                </header>
                <FormularioCotizacion />
              </>
            } />
            <Route path="/configuracion" element={
              <>
                <header className="page-header" style={{ marginTop: -1 }}>
                  <div className="page-title">
                    Configuración
                    <span>Datos de empresa y logotipos</span>
                  </div>
                </header>
                <Configuracion />
              </>
            } />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  )
}
