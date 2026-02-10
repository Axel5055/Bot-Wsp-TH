require('dotenv').config();

module.exports = {
  apiId: parseInt(process.env.TELEGRAM_API_ID, 10),
  apiHash: process.env.TELEGRAM_API_HASH,
  session: (process.env.TELEGRAM_SESSION || '').trim(),

  telegram: {
    channelId: process.env.TELEGRAM_CHANNEL_ID,
    groupId: process.env.TELEGRAM_GROUP_ID
  },

  whatsapp: {
    groupIds: process.env.WHATSAPP_GROUP_IDS
      ? process.env.WHATSAPP_GROUP_IDS.split(',').map(g => g.trim())
      : []
  }
};
