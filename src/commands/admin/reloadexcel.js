const { clearCache, loadWorkbook } = require('../../cache/excelCache')

module.exports = {
  name: 'reloadexcel',
  admin: true, // 👈 isadmin se encarga

  async execute(sock, msg) {
    const chatId = msg.key.remoteJid

    try {
      // ♻️ Limpiar cache
      clearCache()

      // 📊 Volver a cargar Excel en memoria
      loadWorkbook()

      await sock.sendMessage(chatId, {
        text: '♻️ *Excel recargado correctamente en memoria.*',
      })
    } catch (error) {
      console.error('❌ Error en /reloadexcel:', error)

      await sock.sendMessage(chatId, {
        text: '⚠️ Ocurrió un error al recargar el Excel.',
      })
    }
  },
}
