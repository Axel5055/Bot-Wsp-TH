const fs = require('fs');
const { getImagenPath } = require('../utils/imagenes');

async function enviarAlertaWhatsApp({
  sock,
  groupIds,
  tipoTraducido,
  requisitoTraducido,
  recompensaTexto,
  tipoImagen,
  incluirMedalla
}) {

  const recompensaFinal = incluirMedalla
    ? `Medalla de ${tipoTraducido}`
    : recompensaTexto;

  const mensaje = `🌐 ${tipoTraducido} 🌐
📌 *Requisito*: ${requisitoTraducido}
🎖️ *Recompensa*: ${recompensaFinal}
⏳ *Status*: Próximo en *4 minutos*.

🅣🅗 ​ - ​ 🅑🅞🅣`;

  const ruta = tipoImagen
    ? getImagenPath(tipoImagen.toLowerCase())
    : null;

  for (const groupId of groupIds) {
    if (ruta && fs.existsSync(ruta)) {
      await sock.sendMessage(groupId, {
        image: fs.readFileSync(ruta),
        caption: mensaje
      });
    } else {
      await sock.sendMessage(groupId, { text: mensaje });
    }
  }
}

module.exports = { enviarAlertaWhatsApp };
