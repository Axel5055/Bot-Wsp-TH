// handlers/sony.handler.js

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const commandHandler = require("./command.handler");
const { prefix } = require("../config/settings");

// =======================
// ⚙️ CONFIG
// =======================
const EMOJI = "🦊";
const BOT_NAME = "SoNy";
const PREFIX = BOT_NAME.toLowerCase();
const PREFIX_RESPONSE = `🦊 *${BOT_NAME}* 🦊`;

const MAX_HISTORY = 10;
const MODEL = "llama-3.3-70b-versatile";

// =======================
// 🧠 MEMORIA
// =======================
const chatHistory = new Map();
const activeChats = new Set();

// =======================
// 📦 CARGAR COMANDOS DINÁMICAMENTE
// =======================
function loadAllCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname, "../commands");

  if (!fs.existsSync(commandsPath)) return commands;

  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);

    if (!fs.lstatSync(folderPath).isDirectory()) continue;

    const files = fs.readdirSync(folderPath);

    for (const file of files) {
      if (!file.endsWith(".js")) continue;

      const command = require(`../commands/${folder}/${file}`);
      commands.push(command);
    }
  }

  return commands;
}

const allCommands = loadAllCommands();

// =======================
// 🛡️ HISTORIAL
// =======================
function pushHistory(chatId, role, content) {
  const history = chatHistory.get(chatId) || [];

  history.push({ role, content });

  if (history.length > MAX_HISTORY)
    history.shift();

  chatHistory.set(chatId, history);
}

// =======================
// 🤖 GROQ CONFIG
// =======================
let openai = null;

if (process.env.GROQ_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  });
  console.log("✅ Groq conectado correctamente");
} else {
  console.log("⚠️ GROQ_API_KEY no detectada");
}

// =======================
// 🧠 IA
// =======================
async function getResponse(prompt, history) {
  if (!openai) return "No tengo cerebro conectado 🤕";

  try {
    const system = `
Eres ${BOT_NAME}, un bot para grupos de WhatsApp. 
Tienes personalidad divertida, directa y algo irreverente, pero siempre amable con los usuarios. 
No usas respuestas corporativas, hablas como una persona real en español.
Puedes bromear, ser ingenioso, y dar respuestas creativas.
No repitas frases innecesarias como "como IA no puedo...".
Si te piden opinión, respóndela como si fueras un amigo de confianza.
`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        ...history,
        { role: "user", content: prompt },
      ],
      temperature: 0.9,
      max_tokens: 300,
    });

    return (
      completion.choices?.[0]?.message?.content?.trim() ||
      "Me quedé en blanco 😅"
    );

  } catch (err) {
    console.error("❌ Error Groq:", err.message);
    return "Se me cruzaron los cables 🤯";
  }
}

// =======================
// 🔎 FUNCIÓN PARA DETECTAR COMANDOS CON PARÁMETROS
// =======================
function detectCommandWithParams(prompt, words, numbers, commandsList) {
  
  // Ordenar comandos por nombre más largo primero
  const sortedCommands = [...commandsList].sort(
    (a, b) => b.name.length - a.name.length
  );
  
  for (const command of sortedCommands) {
    const commandName = command.name.toLowerCase();
    const allKeywords = [commandName, ...(command.keywords || [])].map(k => k.toLowerCase());
    
    for (const keyword of allKeywords) {
      
      // ============================================
      // CASO 1: Keyword exacto seguido de número (ej: "reino 5")
      // ============================================
      if (words.includes(keyword)) {
        const keywordIndex = words.findIndex(w => w === keyword);
        
        // Verificar si la siguiente palabra es un número
        if (keywordIndex !== -1 && keywordIndex < words.length - 1) {
          const nextWord = words[keywordIndex + 1];
          if (/^\d+$/.test(nextWord)) {
            return { command: command.name, param: nextWord };
          }
        }
        
        // Si hay números en el prompt y el comando es kinfo, tomar el primer número
        if (command.name === 'kinfo' && numbers.length > 0) {
          return { command: command.name, param: numbers[0] };
        }
        
        // Keyword encontrado pero sin número
        return { command: command.name, param: null };
      }
      
      // ============================================
      // CASO 2: Frase clave con espacios (ej: "informacion del reino")
      // ============================================
      if (keyword.includes(" ") && prompt.includes(keyword)) {
        const phraseIndex = prompt.indexOf(keyword);
        const afterPhrase = prompt.substring(phraseIndex + keyword.length).trim();
        const numberMatch = afterPhrase.match(/^\s*(\d+)/);
        
        if (numberMatch) {
          return { command: command.name, param: numberMatch[1] };
        }
        
        // Si no hay número después pero hay números en el prompt
        if (numbers.length > 0) {
          return { command: command.name, param: numbers[0] };
        }
        
        return { command: command.name, param: null };
      }
      
      // ============================================
      // CASO 3: Keyword + número en cualquier posición cercana
      // ============================================
      if (words.includes(keyword) && numbers.length > 0) {
        const keywordIndex = words.indexOf(keyword);
        
        // Buscar el número más cercano al keyword
        let closestNumber = null;
        let minDistance = Infinity;
        
        for (const num of numbers) {
          const numIndex = words.findIndex(w => w === num);
          const distance = Math.abs(numIndex - keywordIndex);
          
          if (distance <= 3 && distance < minDistance) { // Máximo 3 palabras de distancia
            minDistance = distance;
            closestNumber = num;
          }
        }
        
        if (closestNumber) {
          return { command: command.name, param: closestNumber };
        }
        
        // Si no hay número cercano pero el comando necesita parámetro
        if (command.name === 'kinfo') {
          return { command: command.name, param: numbers[0] };
        }
      }
    }
  }
  
  // ============================================
  // CASO ESPECIAL: Detección por contexto para kinfo
  // ============================================
  if (numbers.length === 1 && 
      (prompt.includes('reino') || prompt.includes('kingdom') || prompt.includes('kinfo'))) {
    return { command: 'kinfo', param: numbers[0] };
  }
  
  return null; // No se detectó ningún comando
}

// =======================
// 🚀 HANDLER PRINCIPAL
// =======================
function initSony(sock) {

  sock.ev.on("messages.upsert", async ({ messages }) => {

    const msg = messages?.[0];
    if (!msg?.message) return;
    if (msg.key.fromMe) return;

    const chatId = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    if (!text) return;

    const lower = text.toLowerCase();

    // 🔹 Reacción emoji cuando mencionan "sony"
    if (lower.includes(PREFIX)) {
      sock.sendMessage(chatId, {
        react: { text: EMOJI, key: msg.key }
      }).catch(() => {});
    }

    // 🔹 Solo continuar si empieza con SoNy
    if (!lower.startsWith(PREFIX)) return;

    const prompt = text.slice(BOT_NAME.length).trim().toLowerCase();

    if (!prompt) return;

    // 🚦 Anti-spam
    if (activeChats.has(chatId)) return;

    // ==========================
    // 🔍 PROCESAMIENTO DEL TEXTO
    // ==========================
    
    // Separar en palabras limpias
    const words = prompt
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

    // Extraer números
    const numbers = prompt.match(/\d+/g) || [];

    console.log(`📝 Prompt: "${prompt}"`);
    console.log(`🔢 Palabras: [${words.join(', ')}]`);
    console.log(`🔢 Números detectados: [${numbers.join(', ')}]`);

    // ==========================
    // 🎯 DETECTAR COMANDOS CON PARÁMETROS
    // ==========================
    
    const detected = detectCommandWithParams(prompt, words, numbers, allCommands);

    if (detected) {
      // Activar anti-spam
      activeChats.add(chatId);
      
      try {
        // Construir el comando con o sin parámetro
        const commandString = detected.param 
          ? `${prefix}${detected.command} ${detected.param}`
          : `${prefix}${detected.command}`;
        
        console.log(`✅ Comando detectado: ${commandString}`);
        
        // Ejecutar el comando
        await commandHandler(sock, msg, commandString);
        
      } catch (error) {
        console.error(`❌ Error ejecutando comando ${detected.command}:`, error);
        await sock.sendMessage(chatId, {
          text: `${PREFIX_RESPONSE}\n❌ Error al ejecutar el comando.`
        });
      } finally {
        activeChats.delete(chatId);
      }
      
      return; // Salir después de ejecutar el comando
    }

    // ==========================
    // 🤖 SI NO ES COMANDO → IA
    // ==========================

    try {

      activeChats.add(chatId);

      pushHistory(chatId, "user", prompt);

      const response = await getResponse(
        prompt,
        chatHistory.get(chatId) || []
      );

      pushHistory(chatId, "assistant", response);

      await sock.sendMessage(chatId, {
        text: `${PREFIX_RESPONSE}\n${response}`
      });

    } catch (error) {
      console.error('❌ Error en IA:', error);
      await sock.sendMessage(chatId, {
        text: `${PREFIX_RESPONSE}\n😵 Error procesando tu mensaje.`
      });
    } finally {
      activeChats.delete(chatId);
    }

  });

  console.log("🤖 SoNy inteligente activo con detección mejorada de comandos");
}

module.exports = initSony;