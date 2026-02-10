// 🔑 Cargar variables de entorno (DEBE SER LO PRIMERO)
require('dotenv').config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require('@whiskeysockets/baileys')

const Pino = require('pino')
const qrcode = require('qrcode-terminal')

const startMessageHandler = require('./handlers/message.handler')
const { loadWorkbook } = require('./cache/excelCache')

// 👋 Auto welcome
const setupAutoWelcome = require('./handlers/welcome.handler')

// 🦊 SoNy handler
const initSony = require('./handlers/sony.handler')

const { initTelegramClient } = require('./telegram/telegram.client')
const { registerTelegramEvents } = require('./telegram/telegram.events')

let telegramStarted = false // ⛔ evita iniciar Telegram 2 veces

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('src/sessions')

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: 'silent' })
  })

  sock.ev.on('creds.update', saveCreds)

  // ✅ Registrar bienvenida automática (UNA SOLA VEZ)
  setupAutoWelcome(sock)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      console.log('\n📲 Escanea este QR con WhatsApp\n')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado correctamente')

      try {
        loadWorkbook()
        console.log('📊 Excel precargado correctamente')
      } catch (err) {
        console.error('❌ Error cargando Excel:', err)
      }

      try {
        initSony(sock)
        console.log('🦊 SoNy iniciado correctamente')
      } catch (err) {
        console.error('❌ Error al iniciar SoNy:', err)
      }

      if (!telegramStarted) {
        telegramStarted = true
        console.log('🚀 Iniciando conexión con Telegram...')
      
        const tgClient = await initTelegramClient()
        registerTelegramEvents(tgClient, sock)
      
        console.log('✅ Telegram integrado correctamente')
      }
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode

      if (reason !== DisconnectReason.loggedOut) {
        startBot()
      }
    }
  })

  startMessageHandler(sock)
}

module.exports = startBot
