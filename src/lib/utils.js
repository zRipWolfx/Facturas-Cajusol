// Convierte un número a palabras en español para el monto en letras
export function numeroALetras(numero) {
  if (!numero || isNaN(numero)) return ''

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  function convertirGrupo(n) {
    if (n === 0) return ''
    if (n === 100) return 'CIEN'
    let result = ''
    if (n >= 100) {
      result += centenas[Math.floor(n / 100)] + ' '
      n = n % 100
    }
    if (n >= 10 && n <= 19) {
      result += especiales[n - 10]
    } else {
      if (n >= 20) {
        result += decenas[Math.floor(n / 10)]
        if (n % 10 !== 0) result += ' Y ' + unidades[n % 10]
      } else {
        result += unidades[n]
      }
    }
    return result.trim()
  }

  const partes = numero.toString().split('.')
  const entero = parseInt(partes[0])
  const centavosStr = partes[1] ? partes[1].padEnd(2, '0').slice(0, 2) : '00'

  let letras = ''
  const millones = Math.floor(entero / 1000000)
  const miles = Math.floor((entero % 1000000) / 1000)
  const resto = entero % 1000

  if (millones > 0) {
    letras += (millones === 1 ? 'UN MILLÓN ' : convertirGrupo(millones) + ' MILLONES ')
  }
  if (miles > 0) {
    letras += (miles === 1 ? 'MIL ' : convertirGrupo(miles) + ' MIL ')
  }
  if (resto > 0) {
    letras += convertirGrupo(resto)
  }
  if (entero === 0) letras = 'CERO'

  return `SON: ${letras.trim()} CON ${centavosStr}/100`
}

// Formatea fecha
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date + 'T00:00:00')
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Formatea moneda
export function formatMoney(value, decimals = 2) {
  if (!value && value !== 0) return ''
  return parseFloat(value).toFixed(decimals)
}

export function normalizeE164Phone(input, defaultCountryCode = '51') {
  const raw = String(input || '').trim()
  if (!raw) return ''

  const hasPlus = raw.startsWith('+')
  let digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''

  if (digits.startsWith('00')) digits = digits.slice(2)

  if (!hasPlus) {
    if (digits.length === 9 && digits.startsWith('9') && defaultCountryCode) {
      digits = `${defaultCountryCode}${digits}`
    }
  }

  if (digits.length < 8 || digits.length > 15) return ''
  return `+${digits}`
}

export function formatInternationalPhone(input, defaultCountryCode = '51') {
  const e164 = normalizeE164Phone(input, defaultCountryCode)
  if (!e164) return String(input || '').trim()

  const digits = e164.slice(1)
  if (digits.startsWith('51') && digits.length === 11) {
    const rest = digits.slice(2)
    return `+51 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
  }

  if (digits.length <= 4) return e164

  const cc = digits.slice(0, Math.min(3, digits.length - 4))
  const rest = digits.slice(cc.length)
  const grouped = rest.replace(/(\d{3})(?=\d)/g, '$1 ').trim()
  return `+${cc} ${grouped}`
}

export function buildWhatsAppChatLink(phone, text = '') {
  const e164 = normalizeE164Phone(phone)
  if (!e164) return ''
  const digits = e164.replace(/[^\d]/g, '')
  const query = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${digits}${query}`
}

function normalizeBackendBaseUrl() {
  const raw = String(import.meta.env.VITE_API_URL || '/api').trim()
  if (!raw) return ''
  if (raw.startsWith('/')) return ''
  const withProtocol = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`
  const url = new URL(withProtocol)
  const pathname = url.pathname.replace(/\/$/, '')
  if (pathname && pathname !== '/' && pathname.endsWith('/api')) {
    url.pathname = pathname.slice(0, -4) || '/'
  } else if (!pathname || pathname === '/') {
    url.pathname = '/'
  }
  url.search = ''
  url.hash = ''
  const normalizedPath = url.pathname === '/' ? '' : url.pathname.replace(/\/$/, '')
  return `${url.origin}${normalizedPath}`
}

export function resolveUploadsUrl(value) {
  const url = String(value || '').trim()
  if (!url) return value
  if (!url.startsWith('/uploads/')) return value
  const base = normalizeBackendBaseUrl()
  return base ? `${base}${url}` : url
}
