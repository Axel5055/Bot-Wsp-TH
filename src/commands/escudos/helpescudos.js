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
_Registra tu nombre y número para recibir alertas._

Ejemplo:
\`#addescudo SoNy, 5215512345678\`

⚠️ El número debe incluir la lada de tu país *sin el +*
🇲🇽 México → 521XXXXXXXXXX
🇦🇷 Argentina → 549XXXXXXXXXX
🇨🇴 Colombia → 57XXXXXXXXXX

─────────────────────
👁️ *Ver mi registro*
\`#miperfil\`
_Muestra tu nombre y número registrado._

─────────────────────
✏️ *Editar mi registro*
\`#editescudo NombreNuevo, NumeroNuevo\`
_Actualiza tu propio nombre o número._

Ejemplo:
\`#editescudo SoNy, 5215598765432\`

─────────────────────
🗑️ *Eliminar mi registro*
\`#delescudo\`
_Borra tu registro. Ya no recibirás alertas._

─────────────────────
🛡️ *Registrar escudo activo*
\`#ponescudo TipoDeEscudo\`
_Registra el escudo que pusiste. El bot te avisará 10 min antes de que venza._

Escudos disponibles:
- *4h* • *8h* • *12h* • *24h* • *3d* • *7d* • *14d*

Ejemplo:
\`#ponescudo 4h\`
\`#ponescudo 24h\`

─────────────────────
🚨 *Alertar escudo caído*
\`#escudo NombreIngame\`
\`#escudo ID\`
\`#escudo 4digitos\`
_Envía 5 alertas al número privado del jugador._

Ejemplos:
\`#escudo SoNy\`
\`#escudo 3\`
\`#escudo 5678\`

🔒 *Límite:* 3 usos por jugador → bloqueo de *5 minutos*

─────────────────────
📋 *Ver jugadores registrados*
\`#listescudos\`
_Muestra todos los jugadores con alerta activa, su ID y tag._

━━━━━━━━━━━━━━━━━━━━
🔑 *COMANDOS EXCLUSIVOS PARA ADMINS*
━━━━━━━━━━━━━━━━━━━━

➕ *Registrar a otro usuario*
\`#addescudo NombreIngame, Numero, @usuario\`

Ejemplo:
\`#addescudo SoNy, 5215512345678, @usuario\`

─────────────────────
✏️ *Editar registro de otro usuario*
\`#editescudo NombreActual, NombreNuevo, NumeroNuevo\`

Ejemplo:
\`#editescudo SoNy, SoNy_RoK, 5215598765432\`

─────────────────────
🗑️ *Eliminar registro de otro usuario*
\`#delescudo NombreIngame\`

Ejemplo:
\`#delescudo SoNy\`

━━━━━━━━━━━━━━━━━━━━
❓ *¿Dudas?*
Consulta con un R4/R5 del gremio.
━━━━━━━━━━━━━━━━━━━━

🅣🅗 - 🅑🅞🅣`.trim()

    return await sock.sendMessage(chatId, { text: tutorial })
  }
}