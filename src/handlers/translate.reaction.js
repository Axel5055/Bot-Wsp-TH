// handlers/translate.reaction.js
const OpenAI = require("openai");

const MODEL = "llama-3.3-70b-versatile";

// Cache interno de mensajes
const messageCache = new Map();

let openai = null;
if (process.env.GROQ_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

// Banderas → idiomas
const flagLanguages = {
  "🇺🇸": "English",
  "🇲🇽": "Spanish",
  "🇪🇸": "Spanish",
  "🇫🇷": "French",
  "🇩🇪": "German",
  "🇮🇹": "Italian",
  "🇧🇷": "Portuguese",
  "🇯🇵": "Japanese",
  "🇰🇷": "Korean",
  "🇨🇳": "Chinese",
  "🇷🇺": "Russian"
};

// Función para traducir con Groq
async function translateText(text, targetLanguage) {
  if (!openai) return "No tengo cerebro conectado 🤕";

  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: `Eres un traductor profesional experto en adaptar textos de manera natural y fluida al idioma destino.
Traduce el texto al ${targetLanguage} manteniendo significado, tono y estilo.
Evita traducciones literales o forzadas.
No incluyas explicaciones ni texto adicional.
Devuelve únicamente la traducción final.`
        },
        { role: "user", content: text }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return completion.choices?.[0]?.message?.content?.trim() || "No pude traducirlo 😅";
  } catch (err) {
    console.error("❌ Error traducción:", err.message);
    return "Error al traducir 🤯";
  }
}

// Extraer texto de cualquier tipo de mensaje
function getTextMessage(message) {
  return message?.conversation ||
         message?.extendedTextMessage?.text ||
         message?.imageMessage?.caption ||
         message?.videoMessage?.caption ||
         null;
}

// Inicializa traducción por reacción
function initTranslateReaction(sock) {

  // Guardar todos los mensajes entrantes en cache
  sock.ev.on("messages.upsert", ({ messages }) => {
    for (const msg of messages) {

      // Ignorar mensajes sin contenido
      if (!msg?.key?.id || !msg.message) continue;

      // Extraer texto
      const text = getTextMessage(msg.message);
      if (!text) continue;

      // Guardar todo el mensaje para reply
      messageCache.set(msg.key.id, msg);

      // Limitar cache a 500 mensajes
      if (messageCache.size > 500) {
        const firstKey = messageCache.keys().next().value;
        messageCache.delete(firstKey);
      }
    }
  });

  // Escuchar reacciones
  sock.ev.on("messages.reaction", async (reactions) => {
    for (const reaction of reactions) {

      // Ignorar reacciones del propio bot
      if (reaction.key.fromMe) continue;

      const emoji = reaction.reaction?.text;
      const messageId = reaction.key?.id;
      if (!emoji || !flagLanguages[emoji]) continue;
      if (!messageId) continue;

      const targetLanguage = flagLanguages[emoji];

      // Obtener mensaje original del cache
      const originalMessage = messageCache.get(messageId);
      if (!originalMessage) continue;

      const text = getTextMessage(originalMessage.message);
      if (!text) continue;

      try {
        const translated = await translateText(text, targetLanguage);

        // Enviar como reply
        await sock.sendMessage(
          reaction.key.remoteJid,
          { text: translated },
          { quoted: originalMessage }
        );

      } catch (err) {
        console.error("❌ Error en reacción:", err.message);
      }
    }
  });

  console.log("🌍 Traducción por bandera activa");
}

module.exports = initTranslateReaction;