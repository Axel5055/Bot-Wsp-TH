module.exports = {
  name: 'helpescudos',
  keywords: ['helpescudos'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const tutorial = `
🛡️ *SISTEMA DE ALERTAS DE ESCUDO* 🛡️
━━━━━━━━━━━━━━━━━━━━

📌 *¿Para qué sirve?*
Recibe alertas por mensaje privado cuando tu escudo cae, y registra tu escudo activo para que el bot te avise 10 minutos antes de que venza.

━━━━━━━━━━━━━━━━━━━━
👤 *COMANDOS PARA MIEMBROS*
━━━━━━━━━━━━━━━━━━━━

📝 *Registrarse*
\`#addescudo NombreIngame, NumeroConLada\`
_Puedes tener múltiples cuentas registradas. Cada cuenta tiene su propio ID._

Ejemplo:
\`#addescudo SoNy, 5215512345678\`

⚠️ El número debe incluir la lada de tu país *sin el +*
🇲🇽 México → 521XXXXXXXXXX
🇦🇷 Argentina → 549XXXXXXXXXX
🇨🇴 Colombia → 57XXXXXXXXXX

─────────────────────
👁️ *Ver mi perfil*
\`#miescudo\`
_Muestra tus cuentas registradas y si tienen escudo activo._

\`#miescudo ID / Nombre / 4dígitos\`
_Consulta el perfil de otro jugador._

Ejemplos:
\`#miescudo\`
\`#miescudo SoNy\`
\`#miescudo 3\`
\`#miescudo 5678\`

─────────────────────
✏️ *Editar mi registro*
\`#editescudo ID/Nombre/4dígitos, NombreNuevo, NumeroNuevo\`
_Solo puedes editar tus propias cuentas._

Ejemplos:
\`#editescudo SoNy, SoNy2, 5215598765432\`
\`#editescudo 3, SoNy2, 5215598765432\`

─────────────────────
🗑️ *Eliminar mi registro*
\`#delescudo\`
_Si tienes una sola cuenta la borra directo._
_Si tienes varias, te mostrará la lista para que elijas._

\`#delescudo ID\`
_Borra una cuenta específica tuya._

─────────────────────
🛡️ *Registrar escudo activo*
\`#ponescudo TipoDeEscudo\`
_Si tienes una sola cuenta._

\`#ponescudo ID TipoDeEscudo\`
_Si tienes varias cuentas, especifica a cuál._

Escudos disponibles:
• *4h* • *8h* • *12h* • *24h* • *3d* • *7d* • *14d*

Ejemplos:
\`#ponescudo 8h\`
\`#ponescudo 3 24h\`

─────────────────────
🚨 *Alertar escudo caído*
\`#escudo NombreIngame\`
\`#escudo ID\`
\`#escudo 4dígitos\`
_Envía 5 alertas al número privado del jugador._

Ejemplos:
\`#escudo SoNy\`
\`#escudo 3\`
\`#escudo 5678\`

🔒 *Límite:* 3 usos por jugador → bloqueo de *5 minutos*

─────────────────────
📋 *Ver jugadores registrados*
\`#listescudos\`
_Muestra todos los registros con su ID y tag._

━━━━━━━━━━━━━━━━━━━━
🔑 *COMANDOS EXCLUSIVOS PARA ADMINS*
━━━━━━━━━━━━━━━━━━━━

➕ *Registrar a otro usuario*
\`#addescudo NombreIngame, Numero, @usuario\`

Ejemplo:
\`#addescudo SoNy, 5215512345678, @usuario\`

─────────────────────
✏️ *Editar registro de cualquier usuario*
\`#editescudo ID/Nombre/4dígitos, NombreNuevo, NumeroNuevo\`

Ejemplos:
\`#editescudo SoNy, SoNy_RoK, 5215598765432\`
\`#editescudo 3, SoNy_RoK, 5215598765432\`

─────────────────────
🗑️ *Eliminar registro de cualquier usuario*
\`#delescudo ID/Nombre/4dígitos\`

Ejemplos:
\`#delescudo SoNy\`
\`#delescudo 3\`
\`#delescudo 5678\`

━━━━━━━━━━━━━━━━━━━━
❓ *¿Dudas?*
Consulta con un R4/R5 del gremio.
━━━━━━━━━━━━━━━━━━━━

🅣🅗 - 🅑🅞🅣`.trim()

    return await sock.sendMessage(chatId, { text: tutorial })
  }
}