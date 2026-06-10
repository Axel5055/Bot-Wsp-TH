// src/commands/multicuentas/add.js
'use strict'

const isAdmin = require('../../utils/isAdmin')
const {
  normalizeKey,
  parseIds,
  sortStrings,
  sortIds,
  joinIds,
  todosLosUsuarios,
  usuarioPorKey,
  usuarioPorJid,
  agregarUsuario,
  actualizarUsuario,
} = require('../../database/multicuentas.db')
const {
  jugadoresPorJid,
  agregarJugador,
} = require('../../database/escudos.db')
const {
  leerCaza,
  buscarEnNumerosPorTelefono,
  buscarEnNumerosPorId,
} = require('../../database/excel')

function getText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption || ''
  )
}

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

// Registra escudos para cada cuenta del Excel que no esté ya registrada
async function registrarEscudos(cuentasExcel, jidObjetivo) {
  const escudosExistentes = await jugadoresPorJid(jidObjetivo)
  const registrados = []
  const omitidos    = []

  for (const entrada of cuentasExcel) {
    const duplicado = escudosExistentes.find(
      e => e.igg_id === entrada.igg_id || e.nombre.toLowerCase() === entrada.nombre.toLowerCase()
    )
    if (duplicado) {
      omitidos.push(entrada.nombre)
      continue
    }
    const nuevo = await agregarJugador({
      jid:    jidObjetivo,
      nombre: entrada.nombre,   // nombre del juego (Opción B)
      numero: entrada.numero,
      igg_id: entrada.igg_id,
    })
    registrados.push(nuevo)
  }

  return { registrados, omitidos }
}

module.exports = {
  name: 'addcuentas',
  admin: false,

  async execute(sock, msg) {
    const chatId   = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid
    let   body     = getText(msg).trim()
    if (!body) return

    try {
      await sock.sendMessage(chatId, { react: { text: '📝', key: msg.key } })

      const mentions  = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ?? []
      const esAdmin   = isAdmin(senderId)

      if (mentions.length > 0 && !esAdmin) {
        return sock.sendMessage(chatId, {
          text: '❌ Solo los admins pueden registrar cuentas para otros usando menciones.'
        })
      }

      const ownerId   = mentions.length > 0 ? mentions[0] : senderId
      const numeroJid = mentions.length > 0
        ? numeroDesdeJid(ownerId)
        : numeroDesdeMsg(msg, senderId)

      const args = body
        .replace(/^[!/#.]\w+\s*/i, '')
        .replace(/@\d+/g, '')
        .trim()

      // ─────────────────────────────────────────────
      // SIN PARÁMETROS — pedir nombre
      // ─────────────────────────────────────────────
      if (!args) {
        return sock.sendMessage(chatId, {
          text:
            '👋 Para registrarte necesito tu nombre de jugador.\n\n' +
            '*Uso:*\n' +
            '`#addcuentas TuNombre` — registro automático desde Excel\n' +
            '`#addcuentas TuNombre ID1,ID2` — registro manual\n\n' +
            '*Ejemplo:*\n' +
            '#addcuentas Axel'
        })
      }

      const primerEspacio = args.indexOf(' ')
      const nombreDado    = primerEspacio === -1 ? args : args.slice(0, primerEspacio).trim()
      const idsRaw        = primerEspacio === -1 ? '' : args.slice(primerEspacio + 1).trim()
      const idsManual     = idsRaw
        ? parseIds(idsRaw.split(',').filter(i => !i.trim().startsWith('@')).join(','))
        : []

      // ─────────────────────────────────────────────
      // MODO AUTOMÁTICO — solo nombre, sin IDs
      // ─────────────────────────────────────────────
      if (!idsManual.length) {
        const cuentasExcel = buscarEnNumerosPorTelefono(numeroJid)

        if (!cuentasExcel.length) {
          return sock.sendMessage(chatId, {
            text:
              `⚠️ Tu número no está en la hoja *Numeros* del Excel.\n\n` +
              `Puedes registrarte manualmente indicando tus IGG IDs:\n` +
              `*#addcuentas ${nombreDado} ID1,ID2*\n\n` +
              `Ejemplo:\n#addcuentas ${nombreDado} 416845218,346561690`
          })
        }

        const todos = await todosLosUsuarios()

        // ── Multicuentas ──
        const yaExisteMulti = await usuarioPorJid(ownerId)
        let   resultadoMulti = null

        if (yaExisteMulti) {
          // Agregar solo IDs nuevos
          const idsActuales   = parseIds(yaExisteMulti.ids_juego)
          const idsNuevos     = []
          const nombresNuevos = []
          const omitidos      = []

          for (const entrada of cuentasExcel) {
            if (idsActuales.includes(entrada.igg_id)) { omitidos.push(entrada.nombre); continue }
            const yaDeOtro = todos.find(u =>
              parseIds(u.ids_juego).includes(entrada.igg_id) && u.owner_jid !== ownerId
            )
            if (yaDeOtro) { omitidos.push(`${entrada.nombre} (de ${yaDeOtro.nombre_dado})`); continue }
            idsNuevos.push(entrada.igg_id)
            nombresNuevos.push(entrada.nombre)
          }

          if (idsNuevos.length) {
            const idsCombinados    = sortIds([...idsActuales, ...idsNuevos])
            const nombresCombinados = idsCombinados.map(id => {
              const entrada = cuentasExcel.find(e => e.igg_id === id)
              return entrada?.nombre || id
            })
            await actualizarUsuario(yaExisteMulti.key_nombre, {
              ids_juego:       idsCombinados,
              nombres_cuentas: nombresCombinados,
            })
          }

          resultadoMulti = { tipo: 'actualizado', nombre: yaExisteMulti.nombre_dado, nuevos: idsNuevos.length, omitidos }

        } else {
          // Crear registro nuevo
          const idsValidos     = []
          const nombresValidos = []
          const omitidos       = []

          for (const entrada of cuentasExcel) {
            const yaDeOtro = todos.find(u => parseIds(u.ids_juego).includes(entrada.igg_id))
            if (yaDeOtro) { omitidos.push(`${entrada.nombre} (de ${yaDeOtro.nombre_dado})`); continue }
            idsValidos.push(entrada.igg_id)
            nombresValidos.push(entrada.nombre)
          }

          if (!idsValidos.length) {
            return sock.sendMessage(chatId, {
              text: '⚠️ Todas tus cuentas del Excel ya están registradas por otros usuarios.'
            })
          }

          // Si el nombre ya está en uso, agregar sufijo
          let keyFinal = nombreDado
          let intento  = 1
          while (await usuarioPorKey(keyFinal)) keyFinal = `${nombreDado}${intento++}`

          await agregarUsuario({
            key_nombre:      keyFinal,
            nombre_dado:     keyFinal,
            owner_jid:       ownerId,
            ids_juego:       idsValidos,
            nombres_cuentas: nombresValidos,
          })

          resultadoMulti = { tipo: 'creado', nombre: keyFinal, nuevos: idsValidos.length, omitidos }
        }

        // ── Escudos ──
        const { registrados: escudosReg, omitidos: escudosOmit } =
          await registrarEscudos(cuentasExcel, ownerId)

        // ── Respuesta ──
        let respuesta = `🎉 *Registro completado — ${nombreDado}*\n\n`

        respuesta += `📋 *Multicuentas:*\n`
        if (resultadoMulti.tipo === 'creado')
          respuesta += `  ✅ Perfil creado con ${resultadoMulti.nuevos} cuenta(s)\n`
        else
          respuesta += `  ✅ ${resultadoMulti.nuevos} cuenta(s) nueva(s) agregadas\n`
        if (resultadoMulti.omitidos.length)
          respuesta += `  ℹ️ Omitidas: ${resultadoMulti.omitidos.join(', ')}\n`

        respuesta += `\n🛡️ *Escudos:*\n`
        if (escudosReg.length) {
          for (const e of escudosReg)
            respuesta += `  ✅ ${e.nombre} [ID: ${e.id}] — IGG: ${e.igg_id}\n`
        } else {
          respuesta += `  ℹ️ Sin escudos nuevos que registrar\n`
        }
        if (escudosOmit.length)
          respuesta += `  ℹ️ Ya existían: ${escudosOmit.join(', ')}\n`

        respuesta += `\nUsa *#ponescudo ID 8h* para activar un escudo.\n\n🅣🅗 - 🅑🅞🅣`

        return sock.sendMessage(chatId, { text: respuesta })
      }

      // ─────────────────────────────────────────────
      // MODO MANUAL — nombre + IDs explícitos
      // ─────────────────────────────────────────────
      const caza = leerCaza()
      if (!caza.length) {
        return sock.sendMessage(chatId, {
          text: '⚠️ No se pudo cargar el Excel. Intenta más tarde.'
        })
      }

      const todos          = await todosLosUsuarios()
      const idsValidos     = []
      const cuentasValidas = []   // { igg_id, nombre, numero }
      const noEncontrados  = []

      for (const id of idsManual) {
        const entradaCaza = caza.find(f => f.igg_id === id)
        if (!entradaCaza) { noEncontrados.push(id); continue }

        const yaDeOtro = todos.find(u =>
          parseIds(u.ids_juego).includes(id) && u.owner_jid !== ownerId
        )
        if (yaDeOtro) { noEncontrados.push(`${id} (de ${yaDeOtro.nombre_dado})`); continue }

        // Buscar número en hoja Numeros por IGG ID
        const entradaNum = buscarEnNumerosPorId(id)
        const numero     = entradaNum?.numero || numeroJid

        idsValidos.push(id)
        cuentasValidas.push({ igg_id: id, nombre: entradaCaza.nombre, numero })
      }

      if (!idsValidos.length) {
        return sock.sendMessage(chatId, {
          text: '⚠️ Ningún ID fue encontrado en el Excel o ya están registrados.'
        })
      }

      // ── Multicuentas ──
      const yaExisteMulti = await usuarioPorJid(ownerId)

      if (yaExisteMulti) {
        return sock.sendMessage(chatId, {
          text:
            `⚠️ Ya tienes cuentas registradas como *${yaExisteMulti.nombre_dado}*.\n\n` +
            `Usa *#editcuentas ${yaExisteMulti.nombre_dado} +${idsValidos.join(',')}* para agregar más.`
        })
      }

      const yaExistePorKey = await usuarioPorKey(nombreDado)
      if (yaExistePorKey) {
        return sock.sendMessage(chatId, {
          text: `⚠️ El nombre *${nombreDado}* ya está en uso. Elige otro.`
        })
      }

      await agregarUsuario({
        key_nombre:      nombreDado,
        nombre_dado:     nombreDado,
        owner_jid:       ownerId,
        ids_juego:       idsValidos,
        nombres_cuentas: cuentasValidas.map(c => c.nombre),
      })

      // ── Escudos ──
      const { registrados: escudosReg, omitidos: escudosOmit } =
        await registrarEscudos(cuentasValidas, ownerId)

      // ── Respuesta ──
      let respuesta = `🎉 *Registro completado — ${nombreDado}*\n\n`

      respuesta += `📋 *Multicuentas:*\n`
      respuesta += `  ✅ Perfil creado — IDs: ${joinIds(sortIds(idsValidos))}\n`
      if (noEncontrados.length)
        respuesta += `  ❌ No encontrados: ${noEncontrados.join(', ')}\n`

      respuesta += `\n🛡️ *Escudos:*\n`
      if (escudosReg.length) {
        for (const e of escudosReg)
          respuesta += `  ✅ ${e.nombre} [ID: ${e.id}] — IGG: ${e.igg_id}\n`
      } else {
        respuesta += `  ℹ️ Sin escudos nuevos que registrar\n`
      }
      if (escudosOmit.length)
        respuesta += `  ℹ️ Ya existían: ${escudosOmit.join(', ')}\n`

      respuesta += `\nUsa *#ponescudo ID 8h* para activar un escudo.\n\n🅣🅗 - 🅑🅞🅣`

      return sock.sendMessage(chatId, { text: respuesta })

    } catch (err) {
      console.error('❌ [addcuentas]:', err)
      return sock.sendMessage(chatId, { text: '❌ Ocurrió un error. Inténtalo de nuevo.' })
    }
  }
}