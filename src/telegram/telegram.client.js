const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const input = require('input');
const config = require('../config/telegram');

let client;
let watchdogInterval;
let keepAliveInterval;

/**
 * Verifica si Telegram realmente responde (RPC ping)
 */
async function isTelegramAlive() {
  try {
    await client.getMe();
    return true;
  } catch {
    return false;
  }
}

/**
 * Reconexión forzada y segura
 */
async function reconnectTelegram() {
  try {
    console.log('🔄 Reconectando Telegram...');

    try {
      await client.disconnect();
    } catch {}

    await client.connect();
    await client.getMe(); // fuerza handshake MTProto

    console.log('✅ Telegram reconectado correctamente');
  } catch (err) {
    console.error('❌ Error al reconectar Telegram:', err.message);
  }
}

/**
 * Inicializa cliente Telegram
 */
async function initTelegramClient() {
  const session = new StringSession(config.session);

  client = new TelegramClient(
    session,
    config.apiId,
    config.apiHash,
    {
      connectionRetries: Infinity,
      autoReconnect: false // NO confiar en esto
    }
  );

  await client.start({
    phoneNumber: async () => await input.text('📱 Teléfono:'),
    password: async () => await input.text('🔑 2FA:'),
    phoneCode: async () => await input.text('📩 Código Telegram:'),
    onError: (err) => {
      console.error('❌ Error Telegram:', err.message);
    }
  });

  console.log('✅ Telegram conectado');

  console.log('🧾 SESSION STRING (guárdala en tu .env):');
  console.log(client.session.save());

  /**
   * 🔒 Handler vacío (EVITA CIERRES POR IDLE)
   */
  client.addEventHandler(() => {
    // mantiene viva la sesión
  });

  /**
   * ❤️ KEEP ALIVE — CRÍTICO para envíos cada 1 hora
   */
  keepAliveInterval = setInterval(async () => {
    try {
      await client.getMe();
      // console.log('🫀 Telegram keep-alive');
    } catch (err) {
      console.error('⚠️ Keep-alive falló:', err.message);
    }
  }, 20000); // 20s = estable para canales

  /**
   * 🛡️ WATCHDOG — por si algo MUY raro pasa
   */
  watchdogInterval = setInterval(async () => {
    const alive = await isTelegramAlive();

    if (!alive) {
      console.log('⚠️ Telegram sin respuesta');
      await reconnectTelegram();
    }
  }, 15000);

  return client;
}

/**
 * Cierre limpio (opcional)
 */
async function stopTelegramClient() {
  clearInterval(watchdogInterval);
  clearInterval(keepAliveInterval);

  if (client) {
    await client.disconnect();
    console.log('🛑 Telegram desconectado');
  }
}

module.exports = {
  initTelegramClient,
  stopTelegramClient
};
