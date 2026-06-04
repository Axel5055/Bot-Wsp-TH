module.exports = {
  name: 'helpmensajes',
  keywords: ['helpmensajes'],
  mensajero: false,
  admin: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid

    const texto = `📋 *GUÍA DE COMANDOS DE MENSAJES*

━━━━━━━━━━━━━━━━━━━━
📤 *#mensajes*
Envía todos los mensajes guardados al chat, uno por uno.

_Ejemplo:_
#mensajes
━━━━━━━━━━━━━━━━━━━━
📄 *#listmensajes*
Muestra la lista de mensajes guardados con su ID y título.

_Ejemplo:_
#listmensajes
━━━━━━━━━━━━━━━━━━━━
➕ *#addmensaje* _(solo mensajeros)_
Agrega un nuevo mensaje. Separa el título y el texto con una coma.

_Formato:_
#addmensaje Titulo, Texto del mensaje

_Ejemplo:_
#addmensaje Bienvenida, Hola a todos, bienvenidos al grupo!
━━━━━━━━━━━━━━━━━━━━
✏️ *#editmensaje* _(solo mensajeros)_
Edita el texto de un mensaje existente usando su ID.

_Formato:_
#editmensaje ID | Nuevo texto

_Ejemplo:_
#editmensaje 3 | Este es el nuevo texto del mensaje
━━━━━━━━━━━━━━━━━━━━
🗑️ *#delmensaje* _(solo mensajeros)_
Elimina un mensaje usando su ID.

_Formato:_
#delmensaje ID

_Ejemplo:_
#delmensaje 3
━━━━━━━━━━━━━━━━━━━━
💡 *Tip:* Usa #listmensajes para ver los IDs antes de editar o eliminar.`

    return await sock.sendMessage(chatId, { text: texto })
  }
}