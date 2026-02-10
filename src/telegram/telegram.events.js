const { NewMessage } = require('telegram/events');
const config = require('../config/telegram');
const { procesarMensajeTelegram } = require('./telegram.processor');

function registerTelegramEvents(client, waSock) {
  client.addEventHandler(async (event) => {
    try {
      const msg = event.message;
      if (!msg) return;

      // ❌ Ignora mensajes editados o raros
      if (msg.editDate) return;

      const chatId = String(msg.chatId?.toString());
      if (
        chatId !== config.telegram.channelId &&
        chatId !== config.telegram.groupId
      ) return;

      await procesarMensajeTelegram({
        msg,
        waSock
      });

    } catch (err) {
      console.error('❌ Error Telegram event:', err.message);
    }
  }, new NewMessage({}));
}

module.exports = { registerTelegramEvents };
