// utils/queueWorker.js
// ✅ OPTIMIZADO: imágenes pre-cargadas en memoria al iniciar

const fs = require('fs')
const { readQueue, removeFromQueue } = require('./queueManager')

const INTERVAL_MS = 10_000 // 10 segundos

// ─────────────────────────────────────────────
// 📝 Captions por tipo de evento
// ─────────────────────────────────────────────
const CAPTION_BUILDERS = {
  watcher: (titulo) =>
`🌐 OBSERVADOR 🌐
📌 *Requisito:* ${titulo}
🎖️ *Recompensa:* Medalla de Observador
⏳ *Status:* Próximo en *4 minutos*.

🅣🅗 ​ - ​ 🅑🅞🅣`,

  chaos_dragon: (titulo) =>
`🐉 DRAGON DEL CAOS 🐉
📌 *Requisito:* ${titulo}
🎖️ *Recompensa:* Medalla de Dragón del Caos
⏳ *Status:* Próximo en *4 minutos*.

🅣🅗 ​ - ​ 🅑🅞🅣`,

  orb_brillante: (titulo) =>
`✨ ORBE BRILLANTE ✨
📌 *Requisito:* ${titulo}
🎁 *Recompensa:* Orbes brillantes
⏳ *Status:* Próximo en *4 minutos*.

🅣🅗 ​ - ​ 🅑🅞🅣`,

  orb_radiante: (titulo) =>
`💎 ORBE RADIANTE 💎
📌 *Requisito:* ${titulo}
🎁 *Recompensa:* Orbes radiantes
⏳ *Status:* Próximo en *4 minutos*.

🅣🅗 ​ - ​ 🅑🅞🅣`,

  orb_combo: (titulo) =>
`🔥 ORBES BRILLANTES | RADIANTES 🔥
📌 *Requisito:* ${titulo}
🎁 *Recompensa:* Orbes radiantes y brillantes
⏳ *Status:* Próximo en *4 minutos*.

🅣🅗 ​ - ​ 🅑🅞🅣`,

  ancient_core: (titulo) =>
`🧩 NÚCLEO ANTIGUO 🧩
📌 *Requisito:* ${titulo}
🎁 *Recompensa:* Núcleo Antiguo
⏳ *Status:* Próximo en *4 minutos*.

🅣🅗 ​ - ​ 🅑🅞🅣`,
}

// ─────────────────────────────────────────────
// 🖼️ Pre-cargar imágenes en memoria al iniciar
// ─────────────────────────────────────────────
function preloadImages(imagePaths) {
  const imageBuffers = {}

  for (const [tipo, filePath] of Object.entries(imagePaths)) {
    if (!filePath) {
      console.warn(`⚠️ Sin ruta de imagen para tipo: ${tipo}`)
      continue
    }

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Imagen no encontrada: ${filePath}`)
      continue
    }

    imageBuffers[tipo] = fs.readFileSync(filePath)
    console.log(`🖼️ Imagen precargada: ${tipo}`)
  }

  return imageBuffers
}

// ─────────────────────────────────────────────
// 🚀 Worker principal
// ─────────────────────────────────────────────
function startQueueWorker(sock, groupId, imagePaths) {
  // Pre-cargar imágenes UNA SOLA VEZ
  const imageBuffers = preloadImages(imagePaths)

  setInterval(async () => {
    if (!sock?.user) return // WhatsApp no conectado

    const data = readQueue()
    if (!data.pending.length) return

    console.log(`📤 Cola: ${data.pending.length} pendiente(s)`)

    for (const item of data.pending) {
      const { id, tipo, titulo } = item

      const imageBuffer = imageBuffers[tipo]
      if (!imageBuffer) {
        console.warn(`⚠️ Tipo sin imagen en buffer: ${tipo}`)
        removeFromQueue(id) // Evitar que quede atascado
        continue
      }

      const buildCaption = CAPTION_BUILDERS[tipo]
      if (!buildCaption) {
        console.warn(`⚠️ Sin template de caption para tipo: ${tipo}`)
        removeFromQueue(id)
        continue
      }

      const caption = buildCaption(titulo)

      try {
        await sock.sendMessage(groupId, { image: imageBuffer, caption })
        console.log(`✅ Enviado [${tipo}]:`, titulo)
        removeFromQueue(id)
      } catch (err) {
        console.error(`❌ Error enviando [${tipo}], se reintentará:`, err.message)
        // No se elimina de la cola → se reintenta en el próximo ciclo
      }
    }
  }, INTERVAL_MS)

  console.log('🔄 Queue worker iniciado')
}

module.exports = startQueueWorker
