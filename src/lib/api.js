const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

async function parseResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json')
  const body = isJson ? await response.json() : null

  if (!response.ok) {
    throw new Error(body?.error || 'No se pudo completar la operación')
  }

  return body
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
    ...options,
  })

  return parseResponse(response)
}

export function getConfiguracion() {
  return apiRequest('/configuracion')
}

export function saveConfiguracion(config) {
  return apiRequest('/configuracion', {
    method: 'PUT',
    body: JSON.stringify(config),
  })
}

export function getWhatsappNumeros() {
  return apiRequest('/whatsapp')
}

export function addWhatsappNumero(numero, descripcion = '') {
  return apiRequest('/whatsapp', {
    method: 'POST',
    body: JSON.stringify({
      numero: numero.trim(),
      descripcion: descripcion.trim(),
    }),
  })
}

export function toggleWhatsappVisible(id, visible) {
  return apiRequest(`/whatsapp/${id}/visible`, {
    method: 'PATCH',
    body: JSON.stringify({ visible }),
  })
}

export function deleteWhatsappNumero(id) {
  return apiRequest(`/whatsapp/${id}`, {
    method: 'DELETE',
  })
}

export function getLogosDisponibles() {
  return apiRequest('/logos')
}

export async function uploadLogo(file, tipo) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tipo', tipo)

  return apiRequest('/logos', {
    method: 'POST',
    body: formData,
  })
}

export function getCotizaciones() {
  return apiRequest('/cotizaciones')
}

export function getCotizacion(id) {
  return apiRequest(`/cotizaciones/${id}`)
}

export async function getSiguienteNumero() {
  const data = await apiRequest('/cotizaciones/siguiente-numero')
  return data.numero
}

export async function saveCotizacion(cotizacion, items) {
  const data = await apiRequest('/cotizaciones', {
    method: 'POST',
    body: JSON.stringify({
      cotizacion,
      items,
    }),
  })

  return data.id
}

export function deleteCotizacion(id) {
  return apiRequest(`/cotizaciones/${id}`, {
    method: 'DELETE',
  })
}
