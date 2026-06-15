// src/commands/multicuentas/reporte.js
'use strict'

const fs      = require('fs')
const path    = require('path')
const isAdmin = require('../../utils/isAdmin')
const {
  parseIds,
  todosLosUsuarios,
} = require('../../database/multicuentas.db')
const { leerCaza } = require('../../database/excel')

module.exports = {
  name: 'reportecuentas',
  admin: true,

  async execute(sock, msg) {
    const chatId   = msg.key.remoteJid
    const senderId = msg.key.participant || msg.key.remoteJid

    if (!isAdmin(senderId)) {
      return sock.sendMessage(chatId, { text: '⛔ Solo los administradores pueden usar este comando.' })
    }

    try {
      await sock.sendMessage(chatId, { react: { text: '⏳', key: msg.key } })

      const todos = (await todosLosUsuarios()).sort((a, b) =>
        a.nombre_dado.localeCompare(b.nombre_dado, 'es', { sensitivity: 'base' })
      )

      if (!todos.length) {
        return sock.sendMessage(chatId, { text: '⚠️ No hay usuarios registrados.' })
      }

      const caza = leerCaza()
      const mapaNombres = {}
      for (const f of caza) mapaNombres[f.igg_id] = f.nombre

      const ahora      = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
      const lineas     = []
      let totalCuentas = 0

      lineas.push(`REPORTE DE MULTICUENTAS`)
      lineas.push(`Generado: ${ahora}`)
      lineas.push(`Total de jugadores: ${todos.length}`)
      lineas.push(`${'─'.repeat(50)}`)
      lineas.push('')

      for (let i = 0; i < todos.length; i++) {
        const u   = todos[i]
        const ids = parseIds(u.ids_juego)
        totalCuentas += ids.length

        lineas.push(`${i + 1}. ${u.nombre_dado}`)
        lineas.push(`   Cuentas registradas: ${ids.length}`)

        if (ids.length) {
          const cuentasOrdenadas = ids
            .map(id => ({ id, nombre: mapaNombres[id] || '(no encontrado en Excel)' }))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))

          for (const cuenta of cuentasOrdenadas) {
            lineas.push(`   • ${cuenta.nombre.padEnd(25)} IGG ID: ${cuenta.id}`)
          }
        } else {
          lineas.push(`   • Sin cuentas registradas`)
        }
        lineas.push('')
      }

      lineas.push(`${'─'.repeat(50)}`)
      lineas.push(`Total de cuentas en el sistema: ${totalCuentas}`)

      const contenido = lineas.join('\n')

      // Si son pocos jugadores (≤10) mandar como mensaje de texto
      if (todos.length <= 10) {
        return sock.sendMessage(chatId, {
          text:
            `📊 *Reporte de Multicuentas*\n` +
            `_${ahora}_\n` +
            `━━━━━━━━━━━━━━━━━━━━\n\n` +
            todos.map((u, i) => {
              const ids = parseIds(u.ids_juego)
              const cuentasOrdenadas = ids
                .map(id => ({ id, nombre: mapaNombres[id] || '(sin nombre)' }))
                .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
              const lineasCuentas = cuentasOrdenadas
                .map(c => `   • *${c.nombre}* — IGG: ${c.id}`)
                .join('\n')
              return (
                `*${i + 1}. ${u.nombre_dado}* (${ids.length} cuenta${ids.length !== 1 ? 's' : ''})\n` +
                (lineasCuentas || '   Sin cuentas')
              )
            }).join('\n\n') +
            `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
            `📊 Total: *${todos.length}* jugadores — *${totalCuentas}* cuentas`
        })
      }

      // Si son más de 10 jugadores mandar como archivo .txt
      const tmpPath = path.join(process.cwd(), 'src/data/reporte_multicuentas.txt')
      fs.writeFileSync(tmpPath, contenido, 'utf8')

      await sock.sendMessage(chatId, {
        document: fs.readFileSync(tmpPath),
        mimetype: 'text/plain',
        fileName: `reporte_multicuentas_${Date.now()}.txt`,
        caption:
          `📊 *Reporte de Multicuentas*\n` +
          `👥 *${todos.length}* jugadores — *${totalCuentas}* cuentas totales\n` +
          `_${ahora}_`
      })

      fs.unlinkSync(tmpPath)

    } catch (err) {
      console.error('❌ [reportecuentas]:', err)
      return sock.sendMessage(chatId, { text: '❌ Ocurrió un error generando el reporte.' })
    }
  }
}