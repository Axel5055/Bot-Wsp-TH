// commands/admin/reloadexcel.js
// ✅ OPTIMIZADO: usa reloadCommands del command handler

const { clearCache, loadWorkbook } = require('../../cache/excelCache')

module.exports = {
  name: 'reloadexcel',
  admin: true,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    try {
      clearCache()
      loadWorkbook()

      await sock.sendMessage(chatId, {
        text: '✅ Excel recargado correctamente.'
      })
    } catch (err) {
      console.error('❌ Error recargando Excel:', err)
      await sock.sendMessage(chatId, {
        text: `❌ Error al recargar el Excel: ${err.message}`
      })
    }
  }
}
