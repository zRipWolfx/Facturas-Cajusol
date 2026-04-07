import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

dotenv.config()

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const uploadsDir = path.join(rootDir, 'uploads')
const databaseUrl = process.env.DATABASE_URL
const databasePublicUrl = process.env.DATABASE_PUBLIC_URL
const port = Number(process.env.PORT || 3001)
const internalRailwayUrl = databaseUrl?.includes('.railway.internal')
const runningInsideRailway = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)

if (!databaseUrl) {
  throw new Error('Falta DATABASE_URL en el archivo .env')
}

const connectionString = internalRailwayUrl && !runningInsideRailway
  ? (databasePublicUrl || databaseUrl)
  : databaseUrl

if (internalRailwayUrl && !runningInsideRailway && !databasePublicUrl) {
  throw new Error('La DATABASE_URL actual usa un host interno de Railway y no funciona fuera de Railway. Usa la conexión pública de Postgres para correr este proyecto localmente.')
}

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSLMODE === 'disable' ? false : { rejectUnauthorized: false },
})

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith('image/')) {
      callback(new Error('Solo se permiten imágenes'))
      return
    }
    callback(null, true)
  },
})

const app = express()

app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use('/uploads', express.static(uploadsDir))

function toAbsoluteUploadPath(relativePath) {
  return path.join(rootDir, relativePath.replace(/^\/+/, ''))
}

function getFileExtension(file) {
  const originalExtension = path.extname(file.originalname || '').toLowerCase()
  if (originalExtension) return originalExtension
  const mimeMap = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  }
  return mimeMap[file.mimetype] || '.bin'
}

function formatApiError(error) {
  return error?.message || 'Ocurrió un error inesperado'
}

function parseNumber(value, fallback = 0) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseBoolean(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

async function initDatabase() {
  await mkdir(uploadsDir, { recursive: true })

  const schemaSql = await readFile(path.join(rootDir, 'supabase', 'schema.sql'), 'utf8')
  const whatsappSql = await readFile(path.join(rootDir, 'supabase', 'migration_whatsapp.sql'), 'utf8')

  await pool.query(schemaSql)
  await pool.query(whatsappSql)
}

app.get('/api/health', async (_req, res) => {
  const result = await pool.query('select now() as now')
  res.json({
    ok: true,
    now: result.rows[0].now,
    mode: internalRailwayUrl ? 'railway-internal' : 'standard',
  })
})

app.get('/api/configuracion', async (_req, res) => {
  const { rows } = await pool.query(`
    select *
    from configuracion_empresa
    where activo = true
    order by updated_at desc, created_at desc
    limit 1
  `)

  res.json(rows[0] || null)
})

app.put('/api/configuracion', async (req, res) => {
  const config = req.body || {}
  const client = await pool.connect()

  try {
    await client.query('begin')

    const existing = await client.query(`
      select id
      from configuracion_empresa
      where activo = true
      order by updated_at desc, created_at desc
      limit 1
    `)

    const values = [
      config.nombre_empresa || '',
      config.ruc || '',
      config.direccion || '',
      config.ciudad || '',
      config.telefono || '',
      config.email || '',
      config.web || '',
      config.descripcion_negocio || '',
      ['archivo', 'url', 'servidor'].includes(config.logo_tipo) ? config.logo_tipo : 'archivo',
      config.logo_icono_url || '',
      config.logo_texto_url || '',
      config.banco1_nombre || '',
      config.banco1_cci || '',
      config.banco2_nombre || '',
      config.banco2_cci || '',
    ]

    let result

    if (existing.rows[0]?.id) {
      result = await client.query(`
        update configuracion_empresa
        set nombre_empresa = $1,
            ruc = $2,
            direccion = $3,
            ciudad = $4,
            telefono = $5,
            email = $6,
            web = $7,
            descripcion_negocio = $8,
            logo_tipo = $9,
            logo_icono_url = $10,
            logo_texto_url = $11,
            banco1_nombre = $12,
            banco1_cci = $13,
            banco2_nombre = $14,
            banco2_cci = $15
        where id = $16
        returning *
      `, [...values, existing.rows[0].id])
    } else {
      result = await client.query(`
        insert into configuracion_empresa (
          nombre_empresa, ruc, direccion, ciudad, telefono, email, web,
          descripcion_negocio, logo_tipo, logo_icono_url, logo_texto_url,
          banco1_nombre, banco1_cci, banco2_nombre, banco2_cci, activo
        ) values (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15, true
        )
        returning *
      `, values)
    }

    await client.query('commit')
    res.json(result.rows[0])
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
})

app.get('/api/whatsapp', async (_req, res) => {
  const { rows } = await pool.query(`
    select *
    from numeros_whatsapp
    order by created_at asc
  `)

  res.json(rows)
})

app.post('/api/whatsapp', async (req, res) => {
  const numero = String(req.body?.numero || '').trim()
  const descripcion = String(req.body?.descripcion || '').trim()

  if (!numero) {
    res.status(400).json({ error: 'El número es obligatorio' })
    return
  }

  const { rows } = await pool.query(`
    insert into numeros_whatsapp (numero, descripcion, visible)
    values ($1, $2, true)
    returning *
  `, [numero, descripcion])

  res.status(201).json(rows[0])
})

app.patch('/api/whatsapp/:id/visible', async (req, res) => {
  await pool.query(`
    update numeros_whatsapp
    set visible = $1
    where id = $2
  `, [parseBoolean(req.body?.visible), req.params.id])

  res.status(204).send()
})

app.delete('/api/whatsapp/:id', async (req, res) => {
  await pool.query(`
    delete from numeros_whatsapp
    where id = $1
  `, [req.params.id])

  res.status(204).send()
})

app.get('/api/logos', async (_req, res) => {
  const { rows } = await pool.query(`
    select *
    from logos_almacenados
    where activo = true
    order by created_at desc
  `)

  res.json(rows)
})

app.post('/api/logos', upload.single('file'), async (req, res) => {
  const tipo = ['icono', 'texto', 'combinado'].includes(req.body?.tipo) ? req.body.tipo : 'combinado'

  if (!req.file) {
    res.status(400).json({ error: 'Debes subir un archivo' })
    return
  }

  const extension = getFileExtension(req.file)
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
  const relativePath = path.posix.join('/uploads', 'logos', tipo, fileName)
  const absolutePath = toAbsoluteUploadPath(relativePath)

  await mkdir(path.dirname(absolutePath), { recursive: true })
  await writeFile(absolutePath, req.file.buffer)

  const { rows } = await pool.query(`
    insert into logos_almacenados (nombre, tipo, storage_path, url_publica, activo)
    values ($1, $2, $3, $4, true)
    returning *
  `, [req.file.originalname, tipo, relativePath, relativePath])

  res.status(201).json(rows[0])
})

app.get('/api/cotizaciones/siguiente-numero', async (_req, res) => {
  const { rows } = await pool.query(`
    select numero
    from cotizaciones
    where numero like 'P001-%'
    order by created_at desc
    limit 1
  `)

  if (!rows[0]?.numero) {
    res.json({ numero: 'P001-0001' })
    return
  }

  const correlativoActual = Number(String(rows[0].numero).split('-')[1] || 0)
  const siguiente = `P001-${String(correlativoActual + 1).padStart(4, '0')}`
  res.json({ numero: siguiente })
})

app.get('/api/cotizaciones', async (_req, res) => {
  const { rows } = await pool.query(`
    select *
    from cotizaciones
    order by created_at desc
  `)

  res.json(rows)
})

app.get('/api/cotizaciones/:id', async (req, res) => {
  const cotizacionResult = await pool.query(`
    select *
    from cotizaciones
    where id = $1
    limit 1
  `, [req.params.id])

  if (!cotizacionResult.rows[0]) {
    res.status(404).json({ error: 'Cotización no encontrada' })
    return
  }

  const itemsResult = await pool.query(`
    select *
    from items_cotizacion
    where cotizacion_id = $1
    order by item_numero asc, created_at asc
  `, [req.params.id])

  res.json({
    ...cotizacionResult.rows[0],
    items_cotizacion: itemsResult.rows,
  })
})

app.post('/api/cotizaciones', async (req, res) => {
  const cotizacion = req.body?.cotizacion || {}
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  const subtotal = items.reduce((sum, item) => sum + (parseNumber(item.cantidad) * parseNumber(item.precio_unitario)), 0)
  const porcentajeIgv = parseNumber(cotizacion.porcentaje_igv, 18)
  const igv = subtotal * (porcentajeIgv / 100)
  const total = subtotal + igv
  const client = await pool.connect()

  try {
    await client.query('begin')

    const values = [
      cotizacion.numero || '',
      cotizacion.fecha_emision || new Date().toISOString().slice(0, 10),
      cotizacion.cliente_nombre || '',
      cotizacion.cliente_direccion || '',
      cotizacion.cliente_otro || '',
      cotizacion.cliente_atencion || '',
      cotizacion.cliente_telefono || '',
      ['SOLES', 'DOLARES'].includes(cotizacion.moneda) ? cotizacion.moneda : 'SOLES',
      cotizacion.forma_pago || '',
      cotizacion.plazo_entrega || '',
      cotizacion.garantia || '',
      Number(subtotal.toFixed(2)),
      Number(igv.toFixed(2)),
      Number(total.toFixed(2)),
      porcentajeIgv,
      cotizacion.observaciones || '',
      cotizacion.monto_en_letras || '',
      ['borrador', 'enviada', 'aprobada', 'rechazada'].includes(cotizacion.estado) ? cotizacion.estado : 'borrador',
      cotizacion.whatsapp_numero || '',
    ]

    let cotizacionId = cotizacion.id

    if (cotizacionId) {
      await client.query(`
        update cotizaciones
        set numero = $1,
            fecha_emision = $2,
            cliente_nombre = $3,
            cliente_direccion = $4,
            cliente_otro = $5,
            cliente_atencion = $6,
            cliente_telefono = $7,
            moneda = $8,
            forma_pago = $9,
            plazo_entrega = $10,
            garantia = $11,
            subtotal = $12,
            igv = $13,
            total = $14,
            porcentaje_igv = $15,
            observaciones = $16,
            monto_en_letras = $17,
            estado = $18,
            whatsapp_numero = $19
        where id = $20
      `, [...values, cotizacionId])

      await client.query(`
        delete from items_cotizacion
        where cotizacion_id = $1
      `, [cotizacionId])
    } else {
      const insertResult = await client.query(`
        insert into cotizaciones (
          numero, fecha_emision, cliente_nombre, cliente_direccion, cliente_otro,
          cliente_atencion, cliente_telefono, moneda, forma_pago, plazo_entrega,
          garantia, subtotal, igv, total, porcentaje_igv, observaciones,
          monto_en_letras, estado, whatsapp_numero
        ) values (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16,
          $17, $18, $19
        )
        returning id
      `, values)

      cotizacionId = insertResult.rows[0].id
    }

    for (const [index, item] of items.entries()) {
      await client.query(`
        insert into items_cotizacion (
          cotizacion_id, item_numero, codigo, cantidad,
          unidad_medida, descripcion, precio_unitario
        ) values (
          $1, $2, $3, $4,
          $5, $6, $7
        )
      `, [
        cotizacionId,
        index + 1,
        item.codigo || null,
        parseNumber(item.cantidad, 1),
        item.unidad_medida || 'NIU',
        item.descripcion || '',
        parseNumber(item.precio_unitario, 0),
      ])
    }

    await client.query('commit')
    res.json({ id: cotizacionId })
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
})

app.delete('/api/cotizaciones/:id', async (req, res) => {
  await pool.query(`
    delete from cotizaciones
    where id = $1
  `, [req.params.id])

  res.status(204).send()
})

if (existsSync(distDir)) {
  app.use(express.static(distDir))

  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      next()
      return
    }

    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.use((error, _req, res, _next) => {
  res.status(500).json({ error: formatApiError(error) })
})

await initDatabase()

app.listen(port, () => {
  const mode = (internalRailwayUrl && !runningInsideRailway && databasePublicUrl)
    ? 'Railway público (local)'
    : (internalRailwayUrl ? 'Railway interno' : 'Railway/Postgres')
  console.log(`API lista en http://localhost:${port}`)
  console.log(`Base de datos configurada: ${mode}`)
})
