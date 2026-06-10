// src/commands/escudos/addescudo.js
const isAdmin = require('../../utils/isAdmin')
const {
  agregarJugador,
  jugadoresPorJid,
  validarTelefono,
} = require('../../database/escudos.db')
const {
  buscarEnNumerosPorId,
} = require('../../database/excel')

function numeroDesdeJid(jid) {
  return jid.replace(/@.+/, '').replace(/:\d+$/, '').replace(/\D/g, '')
}

function numeroDesdeMsg(msg, jid) {
  const participantAlt = msg.key?.participantAlt
  if (participantAlt && participantAlt.includes('@s.whatsapp.net')) {
    return participantAlt.replace(/@.+/, '').replace(/\D/g, '')
  }
  return numeroDesdeJid(jid)
}

module.exports = {
  name: 'addescudo',
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId          = msg.key.remoteJid
    const senderJid       = msg.key.participant || msg.key.remoteJid
    const texto           = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const mencionados     = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
    const adminEjecutando = isAdmin(senderJid)
    const esAdminRegistrando = mencionados.length > 0 && adminEjecutando

    if (mencionados.length > 0 && !adminEjecutando) {
      return sock.sendMessage(chatId, {
        text: '⛔ Solo los administradores pueden registrar a otros usuarios.'
      })
    }

    const jidObjetivo = esAdminRegistrando ? mencionados[0] : senderJid
    const numeroJid   = esAdminRegistrando
      ? numeroDesdeJid(jidObjetivo)
      : numeroDesdeMsg(msg, senderJid)

    const contenido   = texto.replace(/^#\S+\s*/i, '').trim()
    const textoLimpio = contenido.replace(/@\d+/g, '').trim()

    // Sin parámetros — mostrar ayuda
    if (!textoLimpio) {
      return sock.sendMessage(chatId, {
        text:
          '📋 *Registro manual de escudo*\n\n' +
          'Si tu IGG ID está en el Excel:\n' +
          '*#addescudo NombreIngame, IGG_ID*\n\n' +
          'Si además tu número no está en el Excel:\n' +
          '*#addescudo NombreIngame, IGG_ID, NumeroConLada*\n\n' +
          'Para admin (registrar a otro):\n' +
          '*#addescudo NombreIngame, IGG_ID, @usuario*\n\n' +
          'Ejemplos:\n' +
          '#addescudo SoNy, 416845218\n' +
          '#addescudo SoNy, 416845218, 5215512345678\n\n' +
          '💡 Si estás en el Excel usa *#addcuentas TuNombre* para registro automático.'
      })
    }

    const partes = textoLimpio.split(',').map(p => p.trim())
    const nombre = partes[0] || ''
    const iggId  = partes[1] || ''

    if (!nombre || !iggId) {
      return sock.sendMessage(chatId, {
        text:
          '⚠️ Formato incorrecto.\n\n' +
          'Uso: *#addescudo NombreIngame, IGG_ID*\n\n' +
          'Ejemplo:\n#addescudo SoNy, 416845218'
      })
    }

    // Determinar número — primero buscar en Excel por IGG ID
    let numero = ''
    const entradaExcel = buscarEnNumerosPorId(iggId)

    if (entradaExcel) {
      // Número encontrado en Excel
      numero = entradaExcel.numero
    } else if (partes[2] && !partes[2].startsWith('@')) {
      // Número dado manualmente como tercer parámetro
      numero = partes[2].replace(/\D/g, '')
      if (!validarTelefono(numero)) {
        return sock.sendMessage(chatId, {
          text:
            '⚠️ Número inválido. Ingresa el número sin el + pero con tu lada de país.\n\n' +
            'Ejemplo México: 5215512345678'
        })
      }
    } else if (esAdminRegistrando) {
      // Admin registrando a alguien — usar número del JID mencionado
      numero = numeroDesdeJid(jidObjetivo)
    } else {
      // Último recurso — usar número del JID del que manda
      numero = numeroJid
    }

    if (!numero) {
      return sock.sendMessage(chatId, {
        text:
          '⚠️ No se encontró tu número en el Excel.\n\n' +
          'Agrégalo manualmente como tercer parámetro:\n' +
          `*#addescudo ${nombre}, ${iggId}, TuNumeroConLada*`
      })
    }

    // Validar duplicados
    const cuentasDelJid = await jugadoresPorJid(jidObjetivo)
    const duplicadoNombre = cuentasDelJid.find(
      r => r.nombre.toLowerCase() === nombre.toLowerCase()
    )
    const duplicadoId = cuentasDelJid.find(r => r.igg_id === iggId)

    if (duplicadoNombre) {
      return sock.sendMessage(chatId, {
        text: `⚠️ Ya existe una cuenta con el nombre *${nombre}* (ID escudo: ${duplicadoNombre.id}).`
      })
    }
    if (duplicadoId) {
      return sock.sendMessage(chatId, {
        text: `⚠️ El IGG ID *${iggId}* ya está registrado como *${duplicadoId.nombre}* (ID escudo: ${duplicadoId.id}).`
      })
    }

    const nuevo = await agregarJugador({
      jid:    jidObjetivo,
      nombre,
      numero,
      igg_id: iggId,
    })

    return sock.sendMessage(chatId, {
      text:
        `✅ *Escudo registrado manualmente*\n\n` +
        `🪪 *ID escudo:* ${nuevo.id}\n` +
        `👤 *Nombre:* ${nombre}\n` +
        `🎮 *IGG ID:* ${iggId}\n` +
        `📱 *Número:* ${nuevo.numero}\n` +
        `🔖 *Tag:* ****${nuevo.tag}\n` +
        `🌍 *País:* ${nuevo.pais}\n\n` +
        `Usa *#ponescudo ${nuevo.id} 8h* para activar un escudo.\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}