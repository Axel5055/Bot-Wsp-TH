const fs = require('fs');
const {
  traducirManual,
  capitalizar
} = require('../utils/traducciones');

const {
  getImagenPathMobs
} = require('../utils/imagenes');

async function enviarMobsWhatsapp({ sock, groupIds, mobs, fecha }) {
  let mensaje = `🐉 MOBS del día de mañana ${fecha}\n\n`;

  mobs.forEach(mob => {
    mensaje += `*${capitalizar(traducirManual(mob)[0])}*\n`;
  });

  for (const groupId of groupIds) {
    await sock.sendMessage(groupId, { text: mensaje });

    for (const mob of mobs) {
      const clave = mob.toLowerCase().replace(/\s+/g, '_');
      const ruta = getImagenPathMobs(clave);

      if (ruta && fs.existsSync(ruta)) {
        await sock.sendMessage(groupId, {
          image: fs.readFileSync(ruta)
        });
      }
    }
  }
}

module.exports = { enviarMobsWhatsapp };
