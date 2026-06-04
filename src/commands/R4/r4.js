module.exports = {
  name: 'r4',
  keywords: ['r4', 'responsabilidades r4', 'asignacion r4', 'asignación r4'],
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `📋 **ASIGNACIÓN DE RESPONSABILIDADES R4**

⚔️ **Reclutamiento**
✅ Todos los R4 están autorizados para reclutar siguiendo las nuevas especificaciones de reclutamiento.

🎯 **Cacería**
• SoNy (Axel)

🏰 **FDG**
• Toxic (Daniel)

🔥 **KVK y CAOS**
• Todos los R4 y R5 deberán aportar activamente.

🛡️ **AD**
• Juanjo
• Tatu

🏯 **Evento de Fortalezas**
✅ Todos los R4 están autorizados para realizar invocaciones.

⚔️ **Batalla de Gremios**
• Viviana
• iPegago

📦 **Acaparador**
• inng3nm
• Lucas

📢 **Avisos Periódicos**
• Pabellón
• Insane (José)
• Maxi

🗺️ **Expedición de Gremios**
• SoNy (Axel)
• Toxic (Daniel)

🚨 **Aviso de Escudos Caídos**
• Dhalan

🤝 Agradecemos el compromiso de todos para mantener el gremio organizado y activo.

🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, {
        text: texto
      })
    } catch (error) {
      console.error('❌ Error en comando #caza:', error)

      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error al mostrar las reglas de cacería. Intenta más tarde.'
      })
    }
  }
}
