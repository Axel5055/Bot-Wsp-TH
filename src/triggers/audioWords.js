const path = require('path')
const fs = require('fs')

const exactWords = ['alv', 'hdp', 'jijiji', 'putos', 'r4', 'boo', 'amor']
const includesWords = ['queman', 'cariñosas', 'dejen dormir', 'mucho mensaje', 'borojojo', 'no te vayas', 'siuu', 'sapo', 'bañate', 'ricco', 'pal bot', 'veneca', 'habla bien', 'pelea', 'lptm', 'como lo supo', 'el lider no hace nada', 'el líder no hace nada', 'denge',  'sida', 'me duele', 'quiereme', 'me quieres']

module.exports = async (sock, msg, text) => {
  const cleanText = text.toLowerCase().trim()

  let matchedWord = null

  // 🔍 Palabras exactas
  for (const word of exactWords) {
    const regex = new RegExp(`^${word}$`, 'i')
    const match = regex.test(cleanText)

    if (match) {
      matchedWord = word
      break
    }
  }

  // 🔍 Palabras incluidas
  if (!matchedWord) {
    for (const word of includesWords) {
      const match = cleanText.includes(word)

      if (match) {
        matchedWord = word
        break
      }
    }
  }

  if (!matchedWord) {
    //console.log('❌ Ninguna palabra coincidió')
    return
  }

  // 📂 Buscar audio (.ogg o .mp3)
  const audioDir = path.join(__dirname, '../../media/audios')

  const oggPath = path.join(audioDir, `${matchedWord}.ogg`)
  const mp3Path = path.join(audioDir, `${matchedWord}.mp3`)

  let audioPath = null
  let mimetype = null
  let ptt = false

  if (fs.existsSync(oggPath)) {
    audioPath = oggPath
    mimetype = 'audio/ogg; codecs=opus'
    ptt = true
  } else if (fs.existsSync(mp3Path)) {
    audioPath = mp3Path
    mimetype = 'audio/mpeg'
    ptt = false
  } else {
    console.log(`❌ No existe audio para "${matchedWord}"`)
    return
  }

  console.log('🎵 Enviando audio:', audioPath)
  //console.log('🎚 mimetype:', mimetype)

  try {
    await sock.sendMessage(msg.key.remoteJid, {
      audio: { url: audioPath },
      mimetype,
      ptt
    })
    console.log(`✅ AUDIO ENVIADO: ${matchedWord}`)
  } catch (err) {
    console.error('❌ ERROR enviando audio:', err)
  }
}
