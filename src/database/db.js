// src/database/db.js
const initSqlJs = require('sql.js')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, '../data/bot.db')

let db = null

async function getDb() {
  if (db) return db

  const SQL = await initSqlJs()

  // Si ya existe el archivo, cargarlo — si no, crear uno nuevo
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  // Crear tablas si no existen
  db.run(`
  CREATE TABLE IF NOT EXISTS jugadores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    jid       TEXT    NOT NULL,
    nombre    TEXT    NOT NULL,
    numero    TEXT    NOT NULL,
    tag       TEXT    NOT NULL,
    igg_id    TEXT    NOT NULL DEFAULT '',
    timezone  TEXT    NOT NULL DEFAULT 'America/Mexico_City',
    pais      TEXT    NOT NULL DEFAULT '🌍 Desconocido',
    creado_en INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
  )
`)

  db.run(`
    CREATE TABLE IF NOT EXISTS escudos_activos (
      jugador_id  INTEGER PRIMARY KEY REFERENCES jugadores(id) ON DELETE CASCADE,
      jid         TEXT    NOT NULL,
      nombre      TEXT    NOT NULL,
      numero      TEXT    NOT NULL,
      timezone    TEXT    NOT NULL,
      pais        TEXT    NOT NULL,
      tipo        TEXT    NOT NULL,
      puesto_en   INTEGER NOT NULL,
      vence_en    INTEGER NOT NULL,
      avisado     INTEGER NOT NULL DEFAULT 0
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS multicuentas (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      key_nombre       TEXT    NOT NULL UNIQUE,
      nombre_dado      TEXT    NOT NULL,
      owner_jid        TEXT    NOT NULL,
      ids_juego        TEXT    NOT NULL DEFAULT '',
      nombres_cuentas  TEXT    NOT NULL DEFAULT '',
      creado_en        INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
    )
  `)

  db.run(`CREATE INDEX IF NOT EXISTS idx_jugadores_jid    ON jugadores(jid)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_jugadores_nombre ON jugadores(nombre)`)
  db.run(`CREATE INDEX IF NOT EXISTS idx_multi_owner      ON multicuentas(owner_jid)`)

  // Guardar al disco
  saveDb()

  console.log('✅ Base de datos SQLite lista')
  return db
}

// sql.js vive en memoria — hay que guardar al disco manualmente después de cada escritura
function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(DB_PATH, buffer)
}

module.exports = { getDb, saveDb }