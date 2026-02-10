// handlers/sony.handler.js
const OpenAI = require("openai");

// =======================
// ⚙️ CONFIG
// =======================
const EMOJI = "🦊";
const BOT_NAME = "SoNy";
const PREFIX = BOT_NAME.toLowerCase();
const PREFIX_RESPONSE = `🦊 *${BOT_NAME}* 🦊`;

const MAX_HISTORY = 10;
const COOLDOWN_MS = 15_000;

const ADMIN_ONLY_DEFAULT = false;
const HUMOR_NEGRO_DEFAULT = true;

// =======================
// 🧠 MEMORIA
// =======================
const chatHistory = new Map();
const cooldowns = new Map();
const groupSettings = new Map();

// =======================
// 🛡️ UTILS
// =======================
function canTalk(userId) {
  const last = cooldowns.get(userId) || 0;
  const now = Date.now();
  if (now - last < COOLDOWN_MS) return false;
  cooldowns.set(userId, now);
  return true;
}

function pushHistory(chatId, role, content) {
  const history = chatHistory.get(chatId) || [];
  history.push({ role, content });
  if (history.length > MAX_HISTORY) history.shift();
  chatHistory.set(chatId, history);
}

function clearHistory(chatId) {
  chatHistory.delete(chatId);
}

function getGroupConfig(chatId) {
  if (!groupSettings.has(chatId)) {
    groupSettings.set(chatId, {
      adminOnly: ADMIN_ONLY_DEFAULT,
      humorNegro: HUMOR_NEGRO_DEFAULT,
    });
  }
  return groupSettings.get(chatId);
}

// =======================
// 🤖 OPENAI (SEGURO)
// =======================
let openai = null;

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log("✅ OpenAI conectado correctamente");
} else {
  console.warn("⚠️ OPENAI_API_KEY no definida. SoNy responderá sin IA.");
}

async function getResponse(prompt, history, humorNegro) {
  if (!openai) {
    return "Aún no tengo cerebro conectado 🤕 dile al admin que active mi API 😏";
  }

  const system = `
Eres ${BOT_NAME}, un bot para grupos de WhatsApp.
Personalidad divertida, directa y algo irreverente.
Hablas español natural, como humano.
${humorNegro ? "Puedes usar humor negro ocasional." : "Evita humor negro."}
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    messages: [
      { role: "system", content: system },
      ...history,
      { role: "user", content: prompt },
    ],
    temperature: 0.9,
    max_tokens: 400,
  });

  return completion.choices[0]?.message?.content?.trim() || "Me quedé en blanco 😅";
}

// =======================
// 🚀 HANDLER PRINCIPAL
// =======================
function initSony(sock) {
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages?.[0];
    if (!msg?.message || msg.key.fromMe) return;

    const chatId = msg.key.remoteJid;
    const userId = msg.key.participant || chatId;
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text) return;

    const lower = text.toLowerCase();
    const config = getGroupConfig(chatId);

    // Reacción si mencionan al bot
    if (lower.includes(PREFIX)) {
      sock.sendMessage(chatId, {
        react: { text: EMOJI, key: msg.key },
      }).catch(() => {});
    }

    // =====================
    // 🧾 COMANDOS CONTROL
    // =====================
    if (lower === "!resetsony") {
      clearHistory(chatId);
      return sock.sendMessage(chatId, {
        text: `${PREFIX_RESPONSE}\n🧠 Memoria borrada.`,
      });
    }

    if (lower.startsWith("!sony ")) {
      const [, type, value] = lower.split(" ");

      if (type === "humor") {
        config.humorNegro = value === "on";
        return sock.sendMessage(chatId, {
          text: `${PREFIX_RESPONSE}\nHumor negro ${config.humorNegro ? "activado 😈" : "desactivado 🙂"}`,
        });
      }

      if (type === "admin") {
        config.adminOnly = value === "on";
        return sock.sendMessage(chatId, {
          text: `${PREFIX_RESPONSE}\nModo admin ${config.adminOnly ? "activado 🔒" : "desactivado 🔓"}`,
        });
      }
    }

    // =====================
    // 🤖 ACTIVACIÓN POR PALABRA
    // =====================
    if (!lower.startsWith(PREFIX)) return;
    if (!canTalk(userId)) return;

    const prompt = text.slice(BOT_NAME.length).trim();

    if (!prompt) {
      return sock.sendMessage(chatId, {
        text: `${PREFIX_RESPONSE}\n¿Sí? dime qué se te ofrece 😏`,
      });
    }

    try {
      pushHistory(chatId, "user", prompt);

      const response = await getResponse(
        prompt,
        chatHistory.get(chatId),
        config.humorNegro
      );

      pushHistory(chatId, "assistant", response);

      await sock.sendMessage(chatId, {
        text: `${PREFIX_RESPONSE}\n${response}`,
      });
    } catch (err) {
      console.error("❌ Error SoNy:", err);
      await sock.sendMessage(chatId, {
        text: `${PREFIX_RESPONSE}\nSe me cruzaron los cables 🤖💥`,
      });
    }
  });

  console.log("🤖 SoNy handler activo");
}

module.exports = initSony;
