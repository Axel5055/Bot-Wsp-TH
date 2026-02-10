const fs = require('fs')
const path = require('path')

const triggers = []

const triggerFiles = fs
  .readdirSync(__dirname)
  .filter(file => file.endsWith('.js') && file !== 'index.js')

for (const file of triggerFiles) {
  const trigger = require(path.join(__dirname, file))
  triggers.push(trigger)
}

module.exports = triggers
