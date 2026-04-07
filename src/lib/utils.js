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
