const fs = require("fs");
const path = require("path");
const xlsx = require("xlsx");
const { getSheet } = require("../../cache/excelCache");
const { admins } = require("../../config/settings");

// Archivos
const FILE_MULTICUENTAS = path.join(__dirname, "../../data/multicuentas.json");

// ======================
// UTILIDADES
// ======================
function getText(message) {
  return (
    message.message?.conversation ||
    message.message?.extendedTextMessage?.text ||
    message.message?.imageMessage?.caption ||
    message.message?.videoMessage?.caption ||
    ""
  );
}

function normalizeKey(name) {
  return String(name || "").trim().toLowerCase();
}

function parseIds(idsRaw) {
  return String(idsRaw || "")
    .split(",")
    .map(i => i.trim())
    .filter(Boolean);
}

function sortStrings(arr) {
  return arr.slice().sort((a, b) => a.localeCompare(b));
}

function cargarMulticuentas() {
  if (!fs.existsSync(FILE_MULTICUENTAS)) return {};
  try {
    return JSON.parse(fs.readFileSync(FILE_MULTICUENTAS, "utf8"));
  } catch (err) {
    console.error("❌ Error al leer multicuentas.json:", err);
    return {};
  }
}

function guardarMulticuentas(base) {
  try {
    fs.writeFileSync(FILE_MULTICUENTAS, JSON.stringify(base, null, 2), "utf8");
  } catch (err) {
    console.error("❌ Error al guardar multicuentas.json:", err);
  }
}

function cargarCazaDesdeCache() {
  const sheet = getSheet("Caza");
  if (!sheet) return [];
  return xlsx.utils.sheet_to_json(sheet, { defval: "" });
}

function obtenerNombrePorId(id, hojaCaza) {
  if (id.startsWith("@")) return null; // ignorar menciones
  const reg = hojaCaza.find(r => String(r["IGG ID"]).trim() === id);
  return reg ? String(reg["Nombre"] || "Desconocido").trim() : null;
}

// ======================
// COMANDO
// ======================
module.exports = {
  name: "refreshcuentas",
  description: "Actualiza los nombres de las cuentas desde la hoja Caza",
  category: "multicuentas",
  adminOnly: false,

  async execute(sock, message) {
    const chatId = message.key.remoteJid;
    const senderId = message.key.participant || message.key.remoteJid;
    const prefix = "#";
    const esAdmin = admins.includes(senderId);

    const body = getText(message).trim();
    if (!body.toLowerCase().startsWith(prefix + "refreshcuentas")) return;

    try {
      await sock.sendMessage(chatId, { react: { text: "🔄", key: message.key } });

      const args = body.substring((prefix + "refreshcuentas").length).trim().split(" ").filter(Boolean);
      const hojaCaza = cargarCazaDesdeCache();
      if (!hojaCaza.length) return sock.sendMessage(chatId, { text: "⚠️ No se pudo cargar la hoja Caza." });

      const base = cargarMulticuentas();
      if (!Object.keys(base).length) return sock.sendMessage(chatId, { text: "⚠️ No hay registros para actualizar." });

      let keysAActualizar = [];

      // Determinar qué usuarios actualizar
      if (esAdmin) {
        if (args.length) {
          const key = normalizeKey(args[0]);
          if (base[key]) keysAActualizar.push(key);
          else keysAActualizar = Object.keys(base); // si no existe el nombre, actualizar todos
        } else {
          keysAActualizar = Object.keys(base); // todos
        }
      } else {
        if (!args.length) return sock.sendMessage(chatId, { text: "❌ Debes indicar tu usuario para refrescar." });
        const key = normalizeKey(args[0]);
        const entry = base[key];
        if (!entry) return sock.sendMessage(chatId, { text: `⚠️ *${args[0]}* no existe.` });
        if (entry.ownerId !== senderId) return sock.sendMessage(chatId, { text: "❌ Solo puedes actualizar tus propias cuentas." });
        keysAActualizar.push(key);
      }

      let nombresActualizados = [];
      let idsNoEncontradosGlobal = [];

      keysAActualizar.forEach(key => {
        const entry = base[key];
        const ids = parseIds(entry.ids);
        const nombresNuevos = [];

        ids.forEach(id => {
          const nombre = obtenerNombrePorId(id, hojaCaza);
          if (nombre) nombresNuevos.push(nombre);
          else idsNoEncontradosGlobal.push(id);
        });

        const nombresOrdenados = sortStrings(nombresNuevos);
        const nombresUnidos = nombresOrdenados.join(", ");

        if (nombresUnidos !== entry.nombresDeCuentas) {
          entry.nombresDeCuentas = nombresUnidos;
          nombresActualizados.push(`• *${entry.nombreDado}*: ${nombresUnidos}`);
        }
      });

      guardarMulticuentas(base);

      let mensajeFinal = `🔄 *Actualización completada*\n✅ ${nombresActualizados.length} usuario(s) actualizado(s)`;
      if (nombresActualizados.length) mensajeFinal += `\n\n📋 *Cambios detectados:*\n${nombresActualizados.join("\n")}`;
      if (idsNoEncontradosGlobal.length) mensajeFinal += `\n⚠️ No encontrados en Excel: ${idsNoEncontradosGlobal.join(", ")}`;

      await sock.sendMessage(chatId, { text: mensajeFinal });

    } catch (err) {
      console.error("❌ Error en /refreshcuentas:", err);
      await sock.sendMessage(chatId, { text: "❌ Ocurrió un error al ejecutar el comando." });
    }
  }
};
