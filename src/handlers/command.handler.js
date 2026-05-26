// command.handler.js
// ✅ OPTIMIZADO: comandos cargados en un Map al inicio, no en cada mensaje

const fs = require('fs')
const path = require('path')
const { prefix } = require('../config/settings')
const isAdmin = require('../utils/isAdmin')

// ─────────────────────────────────────────────
// 📦 Cargar todos los comandos UNA SOLA VEZ al iniciar
// ─────────────────────────────────────────────
const commandMap = new Map()

function loadCommands() {
  const commandsPath = path.join(__dirname, '../commands')

  if (!fs.existsSync(commandsPath)) {
    console.warn('⚠️ Carpeta de comandos no encontrada:', commandsPath)
    return
  }

  const folders = fs.readdirSync(commandsPath)

  for (const folder of folders) {
    const folderPath = path.join(commandsPath, folder)
    if (!fs.lstatSync(folderPath).isDirectory()) continue

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))

    for (const file of files) {
      const command = require(path.join(folderPath, file))

      if (!command.name) {
        console.warn(`⚠️ Comando sin nombre en ${folder}/${file}`)
        continue
      }

      commandMap.set(command.name.toLowerCase(), command)
      console.log(`✅ Comando cargado: #${command.name}`)
    }
  }

  console.log(`📦 Total comandos cargados: ${commandMap.size}`)
}

// Ejecutar carga al importar el módulo
loadCommands()

// ─────────────────────────────────────────────
// 🔄 Recargar comandos en caliente (para #reloadexcel, etc.)
// ─────────────────────────────────────────────
function reloadCommands() {
  // Limpiar caché de require para que vuelva a leer los archivos
  for (const key of Object.keys(require.cache)) {
    if (key.includes('/commands/')) {
      delete require.cache[key]
    }
  }
  commandMap.clear()
  loadCommands()
}

// ─────────────────────────────────────────────
// ⚙️ Handler principal
// ─────────────────────────────────────────────
module.exports = async (sock, msg, text) => {
  if (!text || !text.startsWith(prefix)) return

  const args = text.slice(prefix.length).trim().split(/ +/)
  const commandName = args.shift().toLowerCase()

  const command = commandMap.get(commandName)

  if (!command) return // Comando no encontrado, ignorar silenciosamente

  // 🔒 Verificar permisos de admin
  if (command.admin) {
    const senderJid = msg.key.participant || msg.key.remoteJid
    if (!isAdmin(senderJid)) {
      return sock.sendMessage(msg.key.remoteJid, {
        text: '⛔ Este comando es solo para administradores.'
      })
    }
  }

  // 🚀 Ejecutar comando
  try {
    await command.execute(sock, msg, args)
  } catch (err) {
    console.error(`❌ Error ejecutando #${commandName}:`, err.message)
    await sock.sendMessage(msg.key.remoteJid, {
      text: `❌ Ocurrió un error ejecutando *#${commandName}*. Intenta más tarde.`
    })
  }
}

module.exports.reloadCommands = reloadCommands
module.exports.commandMap = commandMap
