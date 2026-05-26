// bot.js
// ✅ OPTIMIZADO: variables de entorno, manejo de errores robusto, sin hardcodeo

require('dotenv').config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const Pino = require('pino')
const qrcode = require('qrcode-terminal')
const path = require('path')

const startMessageHandler  = require('./handlers/message.handler')
const { loadWorkbook }     = require('./cache/excelCache')
const setupAutoWelcome     = require('./handlers/welcome.handler')
const initSony             = require('./handlers/sony.handler')
const initTranslateReaction = require('./handlers/translate.reaction')
const startTelegramBridge  = require('./services/telegram.bridge')
const startQueueWorker     = require('./utils/queueWorker')

// ─────────────────────────────────────────────
// ⚙️ Configuración desde .env
// ─────────────────────────────────────────────
const WHATSAPP_GROUP_ID = process.env.WHATSAPP_GROUP_ID

if (!WHATSAPP_GROUP_ID) {
  console.error('❌ WHATSAPP_GROUP_ID no está definido en el .env')
  process.exit(1)
}

// 🖼️ Rutas de imágenes de alertas
const IMAGES = {
  watcher:      path.join(__dirname, '../media/images/alertas/watcher.jpg'),
  chaos_dragon: path.join(__dirname, '../media/images/alertas/chaos_dragon.jpg'),
  orb_brillante: path.join(__dirname, '../media/images/alertas/red_orbe.jpg'),
  orb_radiante:  path.join(__dirname, '../media/images/alertas/yellow_orb.jpg'),
  orb_combo:     path.join(__dirname, '../media/images/alertas/orbs.jpg'),
  ancient_core:  path.join(__dirname, '../media/images/alertas/ancient_core.jpg'),
}

// ─────────────────────────────────────────────
// 🤖 Inicio del bot
// ─────────────────────────────────────────────
let telegramStarted = false

async function startBot() {
  console.log('🚀 Iniciando bot...')

  const { state, saveCreds } = await useMultiFileAuthState('src/sessions')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: Pino({ level: 'silent' }),
    browser: ['SoNy Bot', 'Chrome', '1.0.0'],
  })

  sock.ev.on('creds.update', saveCreds)

  // Registrar handlers que no dependen de conexión
  setupAutoWelcome(sock)
  initTranslateReaction(sock)
  startMessageHandler(sock)

  // ─── Eventos de conexión ───
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📲 Escanea este QR con WhatsApp\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado')

      // Cargar Excel
      try {
        loadWorkbook()
        console.log('📊 Excel precargado')
      } catch (err) {
        console.error('❌ Error cargando Excel:', err.message)
      }

      // SoNy IA
      try {
        initSony(sock)
        console.log('🦊 SoNy iniciado')
      } catch (err) {
        console.error('❌ Error iniciando SoNy:', err.message)
      }

      // Telegram bridge (solo una vez)
      if (!telegramStarted) {
        try {
          startTelegramBridge(sock)
          telegramStarted = true
          console.log('📡 Telegram bridge iniciado')
        } catch (err) {
          console.error('❌ Error iniciando Telegram:', err.message)
        }
      }

      // Queue worker para alertas
      try {
        startQueueWorker(sock, WHATSAPP_GROUP_ID, IMAGES)
        console.log('🔄 Queue worker iniciado')
      } catch (err) {
        console.error('❌ Error iniciando worker:', err.message)
      }
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.statusCode

      console.log('❌ Conexión cerrada. Código:', statusCode)

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('⚠️ Sesión cerrada (loggedOut). Borra src/sessions y reinicia.')
        console.log('🛑 Cerrando proceso para evitar quedarse zombie...')
        process.exit(1)  // ← sale limpiamente con código de error
      } else {
        console.log('🔄 Reconectando en 5 segundos...')
        setTimeout(startBot, 5000)
      }
    }
  })
}

module.exports = startBot
