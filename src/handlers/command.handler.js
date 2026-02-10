const fs = require('fs')
const path = require('path')
const { prefix } = require('../config/settings')
const isAdmin = require('../utils/isAdmin')

module.exports = async (sock, msg, text) => {
  if (!text.startsWith(prefix)) return

  const args = text.slice(prefix.length).trim().split(/ +/)
  const commandName = args.shift().toLowerCase()

  const commandFolders = fs.readdirSync(path.join(__dirname, '../commands'))

  for (const folder of commandFolders) {
    const commandFiles = fs.readdirSync(
      path.join(__dirname, '../commands', folder)
    )

    for (const file of commandFiles) {
      const command = require(`../commands/${folder}/${file}`)

      if (command.name === commandName) {
        if (command.admin && !isAdmin(msg.key.participant || msg.key.remoteJid)) {
          return sock.sendMessage(msg.key.remoteJid, {
            text: '⛔ Este comando es solo para administradores'
          })
        }

        return command.execute(sock, msg, args)
      }
    }
  }
}
