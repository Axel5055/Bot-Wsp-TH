const fs = require('fs')
const path = require('path')

const configPath = path.join(__dirname, '../data/fdg_config.json')

function getConfig() {

  if (!fs.existsSync(configPath)) {

    const defaultConfig = {
      puntajeMinimo: 3200,
      premios: {
        1: "499 Diamantes",
        2: "Full Bank",
        3: "100K Gemas"
      }
    }

    fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))

    return defaultConfig
  }

  return JSON.parse(fs.readFileSync(configPath, 'utf8'))
}

function saveConfig(config) {
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
}

module.exports = { getConfig, saveConfig }