const path = require('path');
const fs = require('fs');

const IMAGENES_ALERTAS = {
  bright_talent_orb: 'red_orbe.jpg',
  brilliant_talent_orb: 'yellow_orb.jpg',
  watcher: 'watcher.jpg',
  ancient_core: 'ancient_core.jpg',
  chaos_core: 'chaos_core.jpg',
  chaos_dragon: 'chaos_dragon.jpg',

  // MOBS
  queen_bee: 'abeja.jpg',
  mega_maggot: 'megalarva.jpg',
  noceros: 'noceros.jpg',
  bon_appeti: 'apetito.jpg',
  gawrilla: 'gorilla.jpg',
  necrosis: 'necrosis.jpg',
  gryphon: 'grifo.jpg',
  saberfang: 'saberfang.jpg',
  blackwing: 'alanegra.jpg',
  frostwing: 'alaescarcha.jpg',
  serpent_gladiator: 'serpiente.jpg',
  cottageroar: 'rugido.jpg',
  arctic_flipper: 'ballena.jpg',
  hootclaw: 'buho.jpg',
  voodoo_shaman: 'chaman.jpg',
  mecha_trojan: 'caballo.jpg'
};

/**
 * Normaliza claves para evitar errores:
 * "Bright Talent Orb" → "bright_talent_orb"
 */
function normalizeKey(key = '') {
  return key
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Imagen para alertas
 */
function getImagenPath(key) {
  const k = normalizeKey(key);
  const file = IMAGENES_ALERTAS[k];
  if (!file) return null;

  const fullPath = path.join(
    __dirname,
    '../../media/images/alertas',
    file
  );

  return fs.existsSync(fullPath) ? fullPath : null;
}

/**
 * Imagen para MOBS
 */
function getImagenPathMobs(key) {
  const k = normalizeKey(key);
  const file = IMAGENES_ALERTAS[k];
  if (!file) return null;

  const fullPath = path.join(
    __dirname,
    '../../media/images/mobs',
    file
  );

  return fs.existsSync(fullPath) ? fullPath : null;
}

module.exports = {
  IMAGENES_ALERTAS,
  getImagenPath,
  getImagenPathMobs
};
