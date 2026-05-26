// utils/queueManager.js
// ✅ OPTIMIZADO: caché en memoria + escritura a disco solo cuando cambia

const fs = require('fs')
const path = require('path')

const FILE_PATH = path.join(__dirname, '../data/telegramQueue.json')

// ─────────────────────────────────────────────
// 🧠 Estado en memoria (fuente de verdad)
// ─────────────────────────────────────────────
let queueCache = null

function getCache() {
  if (queueCache) return queueCache

  try {
    const raw = fs.readFileSync(FILE_PATH, 'utf-8')
    queueCache = JSON.parse(raw)
  } catch {
    queueCache = { pending: [] }
  }

  return queueCache
}

function persistQueue() {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(queueCache, null, 2))
  } catch (err) {
    console.error('❌ Error guardando cola en disco:', err.message)
  }
}

// ─────────────────────────────────────────────
// API pública
// ─────────────────────────────────────────────

function readQueue() {
  return getCache()
}

function addToQueue(item) {
  const data = getCache()

  // Evitar duplicados por título
  const exists = data.pending.find(m => m.titulo === item.titulo)
  if (exists) {
    console.log('⚠️ Ya existe en cola, se ignora:', item.titulo)
    return false
  }

  data.pending.push({
    id: Date.now(),
    ...item,
  })

  persistQueue()
  console.log('💾 Agregado a cola:', item.titulo)
  return true
}

function removeFromQueue(id) {
  const data = getCache()
  const before = data.pending.length
  data.pending = data.pending.filter(m => m.id !== id)

  if (data.pending.length !== before) {
    persistQueue()
  }
}

module.exports = {
  readQueue,
  addToQueue,
  removeFromQueue,
}
