module.exports = {
  name: 'helpfdg',
  keywords: ['tutorial de fdg'],
  admin: false,

  async execute(sock, msg) {

    const chatId = msg.key.remoteJid

    try {

      let txt = `🦊 *GUÍA DE COMANDOS FDG* 🦊\n\n`

      txt += `📜 *Comandos disponibles para todos*\n\n`

      txt += `🎉 *#fdg*\n`
      txt += `Muestra las reglas de FDG.\n`
      txt += `Ejemplo: \`#fdg\`\n\n`

      txt += `📊 *#fgeneral*\n`
      txt += `Muestra las estadisticas generales de FDG.\n`
      txt += `Incluye puntaje mínimo, total de jugadores, cumplimiento y puntaje total.\n`
      txt += `Ejemplo: \`#fgeneral\`\n\n`

      txt += `🏆 *#fdgtop*\n`
      txt += `Muestra el TOP 3 del evento.\n`
      txt += `Incluye puntos, misiones y premios.\n`
      txt += `Ejemplo: \`#fdgtop\`\n\n`

      txt += `📊 *#fdgstats [Nombre]*\n`
      txt += `Muestra las estadísticas de un jugador.\n`
      txt += `Incluye puntos, misiones y progreso.\n`
      txt += `Ejemplo: \`#fdgstats Slayer TH\`\n\n`

      txt += `🔥 Usa *#helpfdg* cuando necesites ver esta guía`

      await sock.sendMessage(chatId, { text: txt })

    } catch (error) {

      console.error('Error en helpfdg:', error)

      await sock.sendMessage(chatId, {
        text: '⚠️ Error mostrando ayuda FDG.'
      })

    }

  },
}