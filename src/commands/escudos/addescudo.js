const {
  cargarRegistros, guardarRegistros, buscarPorJid,
  validarTelefono, siguienteId, ultimosCuatroDigitos
} = require('../../utils/escudos.utils')
const isAdmin = require('../../utils/isAdmin')

module.exports = {
  name: 'addescudo',
  keywords: ['addescudo'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const senderJid = msg.key.participant || msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const mencionados = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []

    const esAdminRegistrando = mencionados.length > 0 && isAdmin(senderJid)

    if (mencionados.length > 0 && !isAdmin(senderJid)) {
      return await sock.sendMessage(chatId, {
        text: '⛔ Solo los administradores pueden registrar a otros usuarios.'
      })
    }

    const jidObjetivo = esAdminRegistrando ? mencionados[0] : senderJid

    if (buscarPorJid(jidObjetivo)) {
      return await sock.sendMessage(chatId, {
        text: esAdminRegistrando
          ? '⚠️ Ese usuario ya tiene un registro. Usa *#editescudo* para modificarlo.'
          : '⚠️ Ya tienes un registro. Usa *#editarme* para modificarlo o *#delescudo* para borrarlo.'
      })
    }

    const contenido = texto.replace(/^#\S+\s*/i, '').trim()
    const textoLimpio = contenido.replace(/@\d+/g, '').trim()
    const separador = textoLimpio.indexOf(',')

    if (separador === -1) {
      return await sock.sendMessage(chatId, {
        text: esAdminRegistrando
          ? '📋 Formato para admin:\n*#addescudo NombreIngame, Numero, @usuario*'
          : '📋 Formato:\n*#addescudo NombreIngame, NumeroConLada*\n\nEjemplo:\n#addescudo SoNy, 5215512345678'
      })
    }

    const nombre = textoLimpio.substring(0, separador).trim()
    const numero = textoLimpio.substring(separador + 1).trim().split(',')[0].trim()

    if (!nombre) {
      return await sock.sendMessage(chatId, { text: '⚠️ El nombre no puede estar vacío.' })
    }

    if (!validarTelefono(numero)) {
      return await sock.sendMessage(chatId, {
        text: '⚠️ Número inválido. Ingresa el número *sin el +* pero con tu lada de país.\n\nEjemplo México: 5215512345678'
      })
    }

    const registros = cargarRegistros()
    const nuevoRegistro = {
      id: siguienteId(registros),
      jid: jidObjetivo,
      nombre,
      numero,
      tag: ultimosCuatroDigitos(numero)
    }

    registros.push(nuevoRegistro)
    guardarRegistros(registros)

    return await sock.sendMessage(chatId, {
      text: esAdminRegistrando
        ? `✅ Usuario registrado por admin.\n\n🪪 *ID:* ${nuevoRegistro.id}\n👤 *Nombre:* ${nombre}\n📱 *Número:* ${numero}\n🔖 *Tag:* ****${nuevoRegistro.tag}\n\n🅣🅗 - 🅑🅞🅣`
        : `✅ Registro exitoso!\n\n🪪 *ID:* ${nuevoRegistro.id}\n👤 *Nombre:* ${nombre}\n📱 *Número:* ${numero}\n🔖 *Tag:* ****${nuevoRegistro.tag}\n\nEstarás disponible para recibir alertas de escudo caído.\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}