// src/commands/utils/traducciones.js

const traduccionesManual = {
  // TIPOS
  watcher: 'Observador',
  research: 'Investigación',
  building: 'Construcción',
  merging: 'Pactos',
  hunting: 'Cacería',
  labyrinth: 'Laberinto',
  tycoon: 'Magnate',
  artifact: 'Artefactos',

  // RECOMPENSAS
  bright_talent_orb: 'Orbe Rojo',
  brilliant_talent_orb: 'Orbe Amarillo',
  chaos_dragon: 'Dragón del Caos',
  ancient_core: 'Núcleo Antiguo',
  chaos_core: 'Núcleo del Caos',

  // REQUISITOS
  merge_pacts: 'Fusionar Pactos',
  train_soldiers: 'Entrenar Soldados',
  hunt_monsters: 'Cazar Mobs',
  kingdom_tycoon: 'Magnate',

  // MOBS
  queen_bee: 'Abeja Reina',
  mega_maggot: 'Megalarva',
  terrorthorn: 'Terrospín',
  bon_appeti: 'Buen Apetito',
  gawrilla: 'Gorila',
  gryphon: 'Grifo',
  blackwing: 'Alanegra',
  frostwing: 'Alaescarcha',
  serpent_gladiator: 'Gladiador Serpiente',
  cottageroar: 'Rugido Feroz',
  arctic_flipper: 'Ballena Ártica',
  hootclaw: 'Búho Corroéro',
  voodoo_shaman: 'Chaman Vudu',
  mecha_trojan: 'Caballo de Troya'
};

/**
 * Normaliza texto a una clave del diccionario
 * - separa CamelCase
 * - lowercase
 * - elimina paréntesis
 * - elimina símbolos raros
 * - espacios → _
 */
function normalizarClave(str = '') {
  return str
    .toString()
    .replace(/\([^)]*\)/g, '')           // elimina (575,000)
    .replace(/([a-z])([A-Z])/g, '$1 $2') // separa CamelCase
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')         // elimina símbolos
    .replace(/\s+/g, '_');               // espacios → _
}

/**
 * Traduce texto libre (líneas de Telegram incluidas)
 * Devuelve SIEMPRE un arreglo
 */
function traducirManual(texto = '') {
  if (!texto) return [];

  return texto
    .split(/\n|\|/) // soporta líneas y |
    .map(p => normalizarClave(p))
    .filter(Boolean)
    .map(key => traduccionesManual[key] || key.replace(/_/g, ' '));
}

/**
 * Capitaliza cada palabra
 */
function capitalizar(str = '') {
  return str
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

module.exports = {
  traduccionesManual,
  normalizarClave,
  traducirManual,
  capitalizar
};

