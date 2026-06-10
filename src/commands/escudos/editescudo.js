const { cargarRegistros, guardarRegistros, validarTelefono } = require('../../utils/escudos.utils')
const isAdmin = require('../../utils/isAdmin')

function buscarEnLista(parametro, lista) {
  if (/^\d+$/.test(parametro) && parametro.length !== 4) {
    return { resultado: lista.find(r => r.id === parseInt(parametro)) || null, tipo: 'id' }
  }
  if (/^\d{4}$/.test(parametro)) {
    const coincidencias = lista.filter(r => r.tag === parametro)
    if (coincidencias.length > 1) return { resultado: null, tipo: 'tag_duplicado', coincidencias }
    return { resultado: coincidencias[0] || null, tipo: 'tag' }
  }
  return {
    resultado: lista.find(r => r.nombre.toLowerCase() === parametro.toLowerCase()) || null,
    tipo: 'nombre'
  }
}

function mensajeNoEncontrado(tipo, parametro) {
  return {
    id:     `❌ No existe ningún registro con ID *${parametro}*.`,
    tag:    `❌ No existe ningún registro con los últimos 4 dígitos *${parametro}*.`,
    nombre: `❌ No existe ningún registro con el nombre *${parametro}*.`
  }[tipo]
}

function aplicarEdicion(registros, id, nombreNuevo, numeroNuevo) {
  const index = registros.findIndex(r => r.id === id)
  registros[index].nombre = nombreNuevo
  registros[index].numero = numeroNuevo
  registros[index].tag = numeroNuevo.slice(-4)
  guardarRegistros(registros)
}

module.exports = {
  name: 'editescudo',
  keywords: ['editarme', 'editescudo'],
  admin: false,
  mensajero: false,

  execute: async (sock, msg) => {
    const chatId = msg.key.remoteJid
    const senderJid = msg.key.participant || msg.key.remoteJid
    const texto = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const adminEjecutando = isAdmin(senderJid)

    const contenido = texto.replace(/^#\S+\s*/i, '').trim()
    const partes = contenido.split(',').map(p => p.trim())

    const registros = cargarRegistros()

    // Formato esperado siempre: #editescudo Buscador, NombreNuevo, NumeroNuevo
    if (partes.length !== 3 || partes.some(p => !p)) {
      const cuentas = registros.filter(r => r.jid === senderJid)
      const ejemplo = cuentas.length > 0 ? cuentas[0] : { id: 'ID', nombre: 'NombreActual' }
      return await sock.sendMessage(chatId, {
        text: `📋 *Uso del comando:*\n\n*#editescudo ID/Nombre/Tag, NombreNuevo, NumeroNuevo*\n\nEjemplo:\n#editescudo ${ejemplo.id}, SoNy2, 5215512345678\n#editescudo ${ejemplo.nombre}, SoNy2, 5215512345678`
      })
    }

    const [buscador, nombreNuevo, numeroNuevo] = partes

    if (!validarTelefono(numeroNuevo)) {
      return await sock.sendMessage(chatId, {
        text: '⚠️ Número inválido. Recuerda incluir la lada de país sin el +.\n\nEjemplo México: 5215512345678'
      })
    }

    if (adminEjecutando) {
      // Admin busca en TODOS los registros
      const { resultado, tipo, coincidencias } = buscarEnLista(buscador, registros)

      if (tipo === 'tag_duplicado') {
        const lista = coincidencias.map(r => `▫️ [ID: *${r.id}*] *${r.nombre}*`).join('\n')
        return await sock.sendMessage(chatId, {
          text: `⚠️ Hay *${coincidencias.length}* registros con el tag *${buscador}*:\n\n${lista}\n\nUsa el *ID* o el *nombre* para ser más específico.`
        })
      }

      if (!resultado) {
        return await sock.sendMessage(chatId, { text: mensajeNoEncontrado(tipo, buscador) })
      }

      const nombreAnterior = resultado.nombre
      aplicarEdicion(registros, resultado.id, nombreNuevo, numeroNuevo)

      return await sock.sendMessage(chatId, {
        text: `✅ Registro actualizado por admin.\n\n🪪 *ID:* ${resultado.id}\n👤 *Nombre anterior:* ${nombreAnterior}\n👤 *Nombre nuevo:* ${nombreNuevo}\n📱 *Número nuevo:* ${numeroNuevo}\n\n🅣🅗 - 🅑🅞🅣`
      })
    }

    // Usuario normal: busca solo entre SUS cuentas
    const cuentas = registros.filter(r => r.jid === senderJid)

    if (cuentas.length === 0) {
      return await sock.sendMessage(chatId, {
        text: '❌ No tienes ningún registro. Usa *#addescudo* primero.'
      })
    }

    const { resultado, tipo, coincidencias } = buscarEnLista(buscador, cuentas)

    if (tipo === 'tag_duplicado') {
      const lista = coincidencias.map(r => `▫️ [ID: *${r.id}*] *${r.nombre}*`).join('\n')
      return await sock.sendMessage(chatId, {
        text: `⚠️ Tienes *${coincidencias.length}* cuentas con el tag *${buscador}*:\n\n${lista}\n\nUsa el *ID* o el *nombre* para ser más específico.`
      })
    }

    if (!resultado) {
      // Verificar si existe en el sistema pero no le pertenece
      const { resultado: globalResultado, tipo: globalTipo, coincidencias: globalCoinc } = buscarEnLista(buscador, registros)
      const existeGlobal = globalTipo === 'tag_duplicado' ? globalCoinc?.length > 0 : !!globalResultado

      return await sock.sendMessage(chatId, {
        text: existeGlobal
          ? `⛔ Ese registro no te pertenece. Solo puedes editar tus propias cuentas.`
          : mensajeNoEncontrado(tipo, buscador)
      })
    }

    const nombreAnterior = resultado.nombre
    aplicarEdicion(registros, resultado.id, nombreNuevo, numeroNuevo)

    return await sock.sendMessage(chatId, {
      text: `✅ Registro actualizado.\n\n🪪 *ID:* ${resultado.id}\n👤 *Nombre anterior:* ${nombreAnterior}\n👤 *Nombre nuevo:* ${nombreNuevo}\n📱 *Número nuevo:* ${numeroNuevo}\n\n🅣🅗 - 🅑🅞🅣`
    })
  }
}