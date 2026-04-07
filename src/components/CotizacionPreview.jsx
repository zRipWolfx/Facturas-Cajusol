import { forwardRef } from 'react'
import { formatDate, formatMoney, numeroALetras } from '../lib/utils'

/**
 * CotizacionPreview: renderiza la cotización tal como se verá impresa.
 * Se usa con react-to-print para generar el PDF.
 */
const CotizacionPreview = forwardRef(({ cotizacion, items, config }, ref) => {
  const {
    numero, fecha_emision, cliente_nombre, cliente_direccion, cliente_otro,
    cliente_atencion, cliente_telefono, moneda, forma_pago, plazo_entrega,
    garantia, observaciones, porcentaje_igv = 18, whatsapp_numero
  } = cotizacion || {}

  const subtotal = items.reduce((s, i) => s + (parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0)), 0)
  const igv = subtotal * (porcentaje_igv / 100)
  const total = subtotal + igv

  // Determinar URLs de logos
  const tipo = config?.logo_tipo || 'archivo'
  const iconoUrl = tipo === 'archivo' ? '/logo-icon.png' : (config?.logo_icono_url || '/logo-icon.png')
  const textoUrl = tipo === 'archivo' ? '/logo-text.png' : (config?.logo_texto_url || '/logo-text.png')

  return (
    <div ref={ref} style={{
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
      color: '#000',
      background: '#fff',
      padding: '16px 20px',
      maxWidth: '794px',
      margin: '0 auto',
      lineHeight: 1.4,
    }}>
      {/* ── CABECERA ── */}
      <table style={{ width: '100%', marginBottom: 8, borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            {/* Logo */}
            <td style={{ width: '120px', verticalAlign: 'middle', paddingRight: 10 }}>
              <img src={iconoUrl} alt="Logo" style={{ height: 80, objectFit: 'contain' }} />
            </td>
            {/* Nombre empresa + datos */}
            <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
              <img src={textoUrl} alt="Nombre empresa" style={{ height: 65, maxWidth: '100%', objectFit: 'contain', marginBottom: 6 }} />
              <div style={{ fontWeight: 700, fontSize: 11 }}>{config?.nombre_empresa}</div>
              {config?.direccion && <div style={{ fontSize: 10 }}>Ofic. Adm.: {config.direccion}</div>}
              {config?.ciudad && <div style={{ fontSize: 10 }}>{config.ciudad}</div>}
              {(config?.telefono || config?.email) && (
                <div style={{ fontSize: 10 }}>
                  {config?.telefono && `📞 ${config.telefono}`}
                  {config?.telefono && config?.email && ' / '}
                  {config?.email}
                </div>
              )}
              {config?.descripcion_negocio && (
                <div style={{ fontSize: 9, marginTop: 4, fontWeight: 700, textAlign: 'center' }}>
                  {config.descripcion_negocio}
                </div>
              )}
              {config?.web && <div style={{ fontSize: 9, color: '#1a237e' }}>{config.web}</div>}
              {/* WhatsApp de contacto */}
              {whatsapp_numero && (
                <div style={{
                  fontSize: 10,
                  marginTop: 5,
                  fontWeight: 700,
                  color: '#075e54',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}>
                  <span style={{
                    display: 'inline-block',
                    background: '#25d366',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 14, height: 14,
                    fontSize: 9,
                    lineHeight: '14px',
                    textAlign: 'center',
                    fontWeight: 900,
                  }}>W</span>
                  {whatsapp_numero}
                </div>
              )}
            </td>
            {/* Caja RUC + Cotización */}
            <td style={{ width: '150px', verticalAlign: 'top' }}>
              {config?.ruc && (
                <div style={{
                  border: '1px solid #000', padding: '4px 8px', textAlign: 'center',
                  fontSize: 11, fontWeight: 700, marginBottom: 4
                }}>
                  R.U.C. {config.ruc}
                </div>
              )}
              <div style={{
                background: '#1a237e', color: '#fff', textAlign: 'center',
                padding: '5px 8px', fontWeight: 700, fontSize: 13, marginBottom: 4
              }}>
                COTIZACIÓN
              </div>
              <div style={{
                border: '1px solid #000', padding: '4px 8px', textAlign: 'center',
                fontSize: 12, fontWeight: 700
              }}>
                Nº {numero || 'P001-0001'}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── DATOS CLIENTE ── */}
      <table style={{ width: '100%', marginBottom: 6, borderCollapse: 'collapse', fontSize: 11 }}>
        <tbody>
          <tr>
            <td style={{ width: '60%', paddingRight: 16 }}>
              <div><span style={{ fontWeight: 600 }}>Señor(es) : </span>{cliente_nombre}</div>
              <div><span style={{ fontWeight: 600 }}>Dirección : </span>{cliente_direccion}</div>
              <div><span style={{ fontWeight: 600 }}>Otro : </span>{cliente_otro}</div>
            </td>
            <td>
              <div><span style={{ fontWeight: 600 }}>Atención : </span>{cliente_atencion}</div>
              <div><span style={{ fontWeight: 600 }}>Teléfono : </span>{cliente_telefono}</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── TABLA CONDICIONES ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6, fontSize: 11 }}>
        <thead>
          <tr>
            {['Fecha Emisión', 'Moneda', 'Forma de Pago', 'Plazo Entrega', 'Garantía'].map(h => (
              <th key={h} style={{
                border: '1px solid #aaa', background: '#dce4f7', padding: '4px 8px',
                fontWeight: 600, textAlign: 'center', whiteSpace: 'nowrap'
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'center' }}>{formatDate(fecha_emision)}</td>
            <td style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'center' }}>{moneda}</td>
            <td style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'center' }}>{forma_pago}</td>
            <td style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'center' }}>{plazo_entrega}</td>
            <td style={{ border: '1px solid #aaa', padding: '4px 8px', textAlign: 'center' }}>{garantia}</td>
          </tr>
        </tbody>
      </table>

      {/* ── TABLA ITEMS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6, fontSize: 11 }}>
        <thead>
          <tr style={{ background: '#1a237e', color: '#fff' }}>
            {['Item', 'Cod.', 'Cant.', 'U/M', 'Descripción', 'P. Unit.', 'P. Total'].map((h, i) => (
              <th key={h} style={{
                border: '1px solid #1a237e', padding: '5px 6px',
                textAlign: i >= 5 ? 'right' : i === 4 ? 'center' : 'center',
                whiteSpace: 'nowrap', fontWeight: 600
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ background: idx % 2 === 0 ? '#fff' : '#f8f9ff' }}>
              <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'center' }}>{idx + 1}</td>
              <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'center' }}>{item.codigo}</td>
              <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'center' }}>{item.cantidad}</td>
              <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'center' }}>{item.unidad_medida}</td>
              <td style={{ border: '1px solid #ddd', padding: '4px 6px' }}>{item.descripcion}</td>
              <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right' }}>{formatMoney(item.precio_unitario)}</td>
              <td style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right' }}>
                {formatMoney((parseFloat(item.cantidad || 0) * parseFloat(item.precio_unitario || 0)))}
              </td>
            </tr>
          ))}
          {/* Filas vacías para llenar hasta 15 */}
          {Array.from({ length: Math.max(0, 10 - items.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              {Array.from({ length: 7 }).map((_, j) => (
                <td key={j} style={{ border: '1px solid #ddd', padding: '4px 6px', height: 20 }}>&nbsp;</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── TOTALES + PAGOS ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
        <tbody>
          <tr>
            {/* Monto en letras + Pagos */}
            <td style={{ width: '55%', verticalAlign: 'top', paddingRight: 8 }}>
              <div style={{ border: '1px solid #aaa', padding: '4px 8px', fontWeight: 700, marginBottom: 6, fontSize: 10 }}>
                {numeroALetras(total)} {moneda}
              </div>
              {(config?.banco1_nombre || config?.banco2_nombre) && (
                <div style={{ border: '1px solid #aaa', padding: '6px 8px' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 10 }}>INFORMACIÓN DE PAGOS</div>
                  {config?.banco1_nombre && (
                    <div style={{ fontSize: 10 }}>
                      <strong>{config.banco1_nombre}</strong>{config.banco1_cci && ` CCI: ${config.banco1_cci}`}
                    </div>
                  )}
                  {config?.banco2_nombre && (
                    <div style={{ fontSize: 10 }}>
                      <strong>{config.banco2_nombre}</strong>{config.banco2_cci && ` CCI: ${config.banco2_cci}`}
                    </div>
                  )}
                </div>
              )}
            </td>
            {/* Totales */}
            <td style={{ verticalAlign: 'top' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #aaa' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', fontWeight: 600 }}>Venta Gravada</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>S/. {formatMoney(subtotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', fontWeight: 600 }}>Total I.G.V. ({porcentaje_igv}%)</td>
                    <td style={{ padding: '4px 8px', borderBottom: '1px solid #ddd', textAlign: 'right' }}>S/. {formatMoney(igv)}</td>
                  </tr>
                  <tr style={{ background: '#1a237e', color: '#fff' }}>
                    <td style={{ padding: '5px 8px', fontWeight: 700 }}>Total Precio de Venta</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>S/. {formatMoney(total)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── OBSERVACIONES ── */}
      {observaciones && (
        <div style={{ marginTop: 8, border: '1px solid #aaa', padding: '4px 8px', fontSize: 10 }}>
          <strong>Observaciones:</strong> {observaciones}
        </div>
      )}

      {/* ── PIE ── */}
      <div style={{ marginTop: 8, textAlign: 'center', fontWeight: 700, fontSize: 11, borderTop: '1px solid #aaa', paddingTop: 6 }}>
        "GRACIAS POR SU PREFERENCIA"
      </div>
    </div>
  )
})

CotizacionPreview.displayName = 'CotizacionPreview'
export default CotizacionPreview
