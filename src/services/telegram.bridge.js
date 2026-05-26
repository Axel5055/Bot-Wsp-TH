// services/telegram.bridge.js
// ✅ OPTIMIZADO: mapa de detección de eventos, código más limpio y extensible

require('dotenv').config()

const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')
const { NewMessage }     = require('telegram/events')
const input              = require('input')

const { addToQueue } = require('../utils/queueManager')

// ─────────────────────────────────────────────
// 🔑 Configuración desde .env
// ─────────────────────────────────────────────
const apiId        = parseInt(process.env.TELEGRAM_API_ID)
const apiHash      = process.env.TELEGRAM_API_HASH
const stringSession = new StringSession(process.env.TELEGRAM_SESSION || '')
const TARGET       = process.env.TELEGRAM_TARGET

// ─────────────────────────────────────────────
// 🌐 Traducciones de requisitos
// ─────────────────────────────────────────────
const TRADUCCIONES = {
  'hunt monsters':   'Cazar Monstruos',
  'merge pacts':     'Fusionar Pactos',
  'kingdom tycoon':  'Magnate del Reino',
  'research':        'Investigación',
  'building':        'Construcción',
  'labyrinth':       'Laberinto',
  'artifacts':       'Artefactos',
}

// ─────────────────────────────────────────────
// 🗺️ Mapa de detección de eventos
// Cada entrada: { detectar: fn(texto) → bool, tipo: string }
// El orden importa: orbes van primero (más específicos)
// ─────────────────────────────────────────────
const EVENT_DETECTORS = [
  {
    tipo: 'orb_combo',
    detect: (t) => t.includes('bright talent orb') && t.includes('brilliant talent orb'),
  },
  {
    tipo: 'orb_brillante',
    detect: (t) => t.includes('bright talent orb'),
  },
  {
    tipo: 'orb_radiante',
    detect: (t) => t.includes('brilliant talent orb'),
  },
  {
    tipo: 'ancient_core',
    detect: (t) => t.includes('ancient core'),
  },
  {
    tipo: 'chaos_dragon',
    detect: (t) => t.includes('chaos dragon'),
  },
  {
    tipo: 'watcher',
    detect: (t) => t.includes('watcher'),
  },
]

// ─────────────────────────────────────────────
// 🧠 Helpers
// ─────────────────────────────────────────────

function obtenerTitulo(texto, fallback = 'Evento') {
  const lines = texto.split('\n').map(l => l.trim()).filter(Boolean)
  let titulo = lines[0] || fallback

  // Quitar paréntesis con números: (123,456)
  titulo = titulo.replace(/\s*\(.*?\)/g, '').trim()

  return titulo.split('|').map(p => p.trim())
}

function traducirTitulos(partes) {
  return partes.map(parte => {
    const lower = parte.toLowerCase()
    for (const [key, value] of Object.entries(TRADUCCIONES)) {
      if (lower.includes(key)) return value
    }
    return parte
  })
}

function procesarEvento({ tipo, texto, fallback }) {
  let partes = obtenerTitulo(texto, fallback)
  partes = traducirTitulos(partes)
  const tituloFinal = partes.join(' | ')

  console.log(`✅ Evento detectado [${tipo}]:`, tituloFinal)

  addToQueue({
    tipo,
    titulo: tituloFinal,
    raw: texto,
    fecha: new Date().toISOString(),
  })
}

// ─────────────────────────────────────────────
// 🚀 Inicializar bridge
// ─────────────────────────────────────────────
async function startTelegramBridge(sock) {
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  })

  console.log('📡 Conectando a Telegram...')

  await client.start({
    phoneNumber: async () => await input.text('📱 Número Telegram: '),
    password:    async () => await input.text('🔐 Password (si tienes): '),
    phoneCode:   async () => await input.text('📨 Código: '),
    onError:     console.error,
  })

  console.log('✅ Telegram conectado')

  client.addEventHandler(async (event) => {
    const message = event.message
    if (!message) return

    try {
      const chat = await message.getChat()
      if (!chat?.title || chat.title !== TARGET) return

      const text = message.message || ''
      if (!text) return

      const sender = await message.getSender()
      const username = sender?.username || sender?.first_name || 'Usuario'

      console.log(`📩 Telegram [${username}]: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`)

      const lowerText = text.toLowerCase()

      // Detectar tipo de evento usando el mapa
      const detector = EVENT_DETECTORS.find(d => d.detect(lowerText))

      if (detector) {
        procesarEvento({
          tipo: detector.tipo,
          texto: text,
          fallback: detector.tipo.replace(/_/g, ' '),
        })
      }

    } catch (err) {
      console.error('❌ Error procesando mensaje Telegram:', err.message)
    }
  }, new NewMessage({}))
}

module.exports = startTelegramBridge
