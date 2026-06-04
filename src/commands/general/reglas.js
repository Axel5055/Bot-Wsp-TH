module.exports = {
  name: 'reglas',
  keywords: ['reglas'],
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `📜 ⚔️ REGLAS DEL GREMIO ⚔️

📥 *Ingreso:*
- Mensaje a R4 o R5 — Solicitud a ciegas será rechazada.

💪 *Poder mínimo:*
- +500 Millones | T4 y/o T5 o cerca de tenerlas.

🏹 *Cacería:*
- Estricta y controlada semanalmente.
- Mínimo *5 lvl2* = *35 puntos semanales*.

📜 *Papiro:*
- Contar con papiro *siempre*.

🟢 *Actividad:*
- 3 días de inactividad sin avisar = *Expulsión*.

🎯 *Eventos obligatorios:*
- *FDG* — Puntaje mínimo según la liga.
    └ ⚠️ No cumplir el puntaje = *Expulsión por 3 días*.
- *Arena* — Último horario o penúltimo horario.
    └ ⚠️ Confirmar y no asistir = *Sanción de RSS*.
    └ 🔁 Reincidencia (confirmar y no cumplir) = *Expulsión contemplada*.
- *KvK* — Solitario.
    └ ⚠️ No cumplir el puntaje de solitario = *Multa de RSS*.
    └ 🔁 Reincidencia (seguir sin cumplir) = *Expulsión contemplada*.

📩 *Dudas:* MP al R4 o R5

🎮 ¡Buen juego, cazadores! 🏹🔥

🅣🅗 — 🅑🅞🅣`

    try {
      await sock.sendMessage(chatId, {
        text: texto
      })
    } catch (error) {
      console.error('❌ Error en comando #reglas:', error)

      await sock.sendMessage(chatId, {
        text: '🚨 Ocurrió un error al mostrar las reglas. Intenta más tarde.'
      })
    }
  }
}