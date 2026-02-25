// 🔑 Cargar variables de entorno (DEBE SER LO PRIMERO)
require('dotenv').config()

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys')

const Pino = require('pino')
const qrcode = require('qrcode-terminal')

const startMessageHandler = require('./handlers/message.handler')
const { loadWorkbook } = require('./cache/excelCache')

// 👋 Auto welcome
const setupAutoWelcome = require('./handlers/welcome.handler')

// 🦊 SoNy handler
const initSony = require('./handlers/sony.handler')

// 🌍 Traducción por reacción
const initTranslateReaction = require('./handlers/translate.reaction')

async function startBot() {
  console.log('🚀 Iniciando bot...')

  const { state, saveCreds } = await useMultiFileAuthState('src/sessions')
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    logger: Pino({ level: 'silent' }),
    browser: ['SoNy Bot', 'Chrome', '1.0.0']
  })

  sock.ev.on('creds.update', saveCreds)

  // ✅ Registrar bienvenida automática
  setupAutoWelcome(sock)

  // 🌍 Activar traducción por bandera
  initTranslateReaction(sock)

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    // 🔥 Mostrar QR correctamente
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
    }

    if (connection === 'close') {
      const statusCode =
        lastDisconnect?.error?.output?.statusCode ||
        lastDisconnect?.error?.statusCode

      console.log('❌ Conexión cerrada. Código:', statusCode)

      // 🔥 SI ES LOGOUT (405) NO RECONECTAR
      if (statusCode === DisconnectReason.loggedOut) {
        console.log('⚠️ Sesión cerrada. Borra src/sessions y reinicia el bot.')
      } else {
        console.log('🔄 Reconectando en 3 segundos...')
        setTimeout(() => startBot(), 3000)
      }
    }
  })

  // 📩 Handler principal de mensajes
  startMessageHandler(sock)
}

module.exports = startBot