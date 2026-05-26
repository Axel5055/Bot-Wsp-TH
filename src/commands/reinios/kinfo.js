// commands/kinfo.js
const axios = require('axios');
const cheerio = require('cheerio');
const QuickChart = require('quickchart-js');

module.exports = {
  name: 'kinfo',
  keywords: ['kingdominfo', 'reino'],
  admin: false,
  execute: async (sock, msg, args) => {
    const kingdomId = args[0];

    if (!kingdomId) {
      await sock.sendMessage(msg.key.remoteJid, {
        text: '⚠️ Debes indicar el ID del reino. Ejemplo: #kinfo 64'
      });
      return;
    }

    try {
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🔎 Buscando información para el reino *K${kingdomId}*...`
      });

      const url = `https://lordsmobilecartograph.ru/Kingdom?K=${kingdomId}`;
      const { data: html } = await axios.get(url);
      const $ = cheerio.load(html);

      const summaryTable = $('table').first();
      if (summaryTable.length === 0 || !summaryTable.find('td').length) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ No se encontraron datos para el reino *${kingdomId}*`
        });
        return;
      }

      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ ¡Datos encontrados! Preparando visualización para *K${kingdomId}*...`
      });

      // ── TABLA RESUMEN ──────────────────────────────────────────
      const summaryCells = summaryTable.find('td');
      let population = $(summaryCells[0]).text().trim();
      let abandoned  = $(summaryCells[1]).text().trim();
      let creation   = $(summaryCells[2]).text().trim();
      let status     = $(summaryCells[3]).text().trim();
      let duration   = $(summaryCells[4]).text().trim();
      let ruler      = $(summaryCells[5]).text().trim();

      // ── LAST UPDATE ────────────────────────────────────────────
      let bodyText      = $('body').text().replace(/\s+/g, ' ');
      let lastUpdateRaw = bodyText.match(/Last update:\s*(\d{2})\.(\d{2})\.(\d{2})/);

      // ── TRADUCCIONES ───────────────────────────────────────────
      const manualTranslations = {
        "Open":        "Abierto",
        "Protection":  "Protección",
        "Restriction": "Restricción",
        "Forever":     "Para Siempre",
        "Last update:":"Última actualización:"
      };

      function translateManual(text) {
        let result = text;
        for (const [en, es] of Object.entries(manualTranslations)) {
          result = result.replace(new RegExp(en, 'g'), es);
        }
        return result.trim();
      }

      function formatDatePretty(match) {
        if (!match) return "Última actualización: N/D";
        const day   = parseInt(match[1], 10);
        const month = parseInt(match[2], 10);
        const year  = parseInt(match[3], 10) + 2000;
        const months = [
          "enero","febrero","marzo","abril","mayo","junio",
          "julio","agosto","septiembre","octubre","noviembre","diciembre"
        ];
        return `Última actualización: ${day} de ${months[month - 1]} de ${year}`;
      }

      status     = translateManual(status).replace(/[\w-]*_\d+/g, '').trim();
      duration   = translateManual(duration);
      let lastUpdate = translateManual(formatDatePretty(lastUpdateRaw));

      // ── FUERTES ────────────────────────────────────────────────
      const fortsTable = $('table').eq(1);
      const fortsRows  = fortsTable.find('tr').slice(1);
      const forts      = [];
      const fortNames  = [
        "Base",
        "Fuerte Tempestad",
        "Fuerte Brillante",
        "Fuerte Congelado",
        "Fuerte Cielo",
        "Fuerte Lunar",
        "Fuerte Cometa"
      ];

      fortsRows.each((i, row) => {
        const tds   = $(row).find('td');
        const owner = $(tds[2]).text().trim();
        forts.push(`*${fortNames[i] || `Fuerte ${i+1}`}:* ${owner}`);
      });

      // ── FORMATEO DE NÚMEROS ────────────────────────────────────
      function formatMight(value) {
        if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return value.toString();
      }

      // ── ABREVIACIONES DE IDIOMAS ───────────────────────────────
      // Añade aquí cualquier nombre largo que quieras acortar
      const languageAbbreviations = {
        "Latin American Spanish": "Spanish LATAM",
        "Brazilian Portuguese":   "Portuguese BR",
        "Traditional Chinese":    "Chinese (Trad)",
        "Simplified Chinese":     "Chinese (Simp)",
      };

      function abbreviateLanguage(name) {
        return languageAbbreviations[name] ?? name;
      }

      // ── DATOS DE IDIOMAS ───────────────────────────────────────
      const rowsMatch = html.match(/var rows = '(.+?)'.replace/);
      let languageData = [];

      if (rowsMatch && rowsMatch[1]) {
        try {
          const rowsData = rowsMatch[1].replace(/&quot;/g, '"');
          const jsonData = JSON.parse(rowsData);
          languageData = jsonData
            .map(item => ({ language: item[0], value: item[1] }))
            .filter(item => item.language !== "Any")
            .sort((a, b) => b.value - a.value);
        } catch (chartError) {
          console.error('Error procesando datos de idiomas:', chartError);
        }
      }

      // ── CONSTRUIR TABLA DE IDIOMAS ─────────────────────────────
      // WhatsApp no tiene fuente monoespaciada real en la mayoría de
      // dispositivos, así que separamos con un guión largo (—) para
      // que sea visualmente limpia sin depender de padding.
      function buildLanguageTable(data) {
        const lines = data.map((item, idx) => {
          const rank = String(idx + 1).padStart(2, ' ');
          const lang = abbreviateLanguage(item.language);
          const might = formatMight(item.value);
          // Formato: N. Idioma — Poder
          return `${rank}. ${lang} — ${might}`;
        });
        return lines.join('\n');
      }

      // ── MENSAJE PRINCIPAL ──────────────────────────────────────
      let fullText = `👑 *Resumen del Reino K${kingdomId}*\n\n`;
      fullText += `👥 *Población:* ${population}\n`;
      fullText += `👻 *Abandonados:* ${abandoned}\n`;
      fullText += `📅 *Creación:* ${creation}\n`;
      fullText += `📊 *Estado Actual:* ${status}\n`;
      fullText += `⏳ *Duración del Estado:* ${duration}\n`;
      fullText += `👑 *Gobernante:* ${ruler}\n\n`;
      fullText += `🕒 _${lastUpdate}_\n\n`;

      fullText += `🏰 *Control de Fuertes*\n`;
      forts.forEach(f => { fullText += ` • ${f}\n`; });

      if (languageData.length > 0) {
        fullText += `\n📊 *Distribución de Poder por Idioma*\n`;
        fullText += `_(${languageData.length} idiomas — excluyendo "Any")_\n`;
        fullText += `\`\`\`\n`;
        fullText += buildLanguageTable(languageData);
        fullText += `\n\`\`\``;
      }

      // ── GENERAR GRÁFICA ────────────────────────────────────────
      let chartBuffer = null;
      if (languageData.length > 0) {
        try {
          const chart = new QuickChart();
          chart.setWidth(900);
          chart.setHeight(Math.max(500, languageData.length * 30));
          chart.setBackgroundColor('white');

          chart.setConfig({
            type: 'bar',
            data: {
              // Abreviamos también en la gráfica para que no se corten
              labels: languageData.map(d => abbreviateLanguage(d.language)),
              datasets: [{
                label: `Distribución de poder en el reino K${kingdomId}`,
                data: languageData.map(d => d.value),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor:     'rgba(54, 162, 235, 1)',
                borderWidth: 2,
                borderRadius: 8,
                barPercentage: 0.7,
                categoryPercentage: 0.8
              }]
            },
            options: {
              indexAxis: 'x',
              responsive: true,
              maintainAspectRatio: true,
              plugins: {
                title: {
                  display: true,
                  text: `📊 Distribución de Poder por Idioma — Reino ${kingdomId}`,
                  font: { size: 20, weight: 'bold', family: 'Arial' },
                  padding: { top: 10, bottom: 20 }
                },
                subtitle: {
                  display: true,
                  text: `Total: ${languageData.length} idiomas (excluyendo "Any")`,
                  font: { size: 14, family: 'Arial' },
                  padding: { bottom: 10 }
                },
                legend: { display: false },
                tooltip: {
                  backgroundColor: 'rgba(0,0,0,0.8)',
                  titleFont: { size: 14, weight: 'bold' },
                  bodyFont:  { size: 13 },
                  callbacks: {
                    label: (ctx) => `Poder: ${formatMight(ctx.raw)}`
                  }
                },
                datalabels: { display: false }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: `Poder total`,
                    font: { size: 14, weight: 'bold', family: 'Arial' }
                  },
                  grid: { color: 'rgba(0,0,0,0.1)' },
                  ticks: {
                    callback: (value) => formatMight(value),
                    font: { size: 11, family: 'Arial' }
                  }
                },
                y: {
                  title: {
                    display: true,
                    text: 'Idioma',
                    font: { size: 14, weight: 'bold', family: 'Arial' }
                  },
                  grid: { display: false },
                  ticks: {
                    font: { size: 11, family: 'Arial' },
                    autoSkip: false,
                    maxRotation: 0,
                    minRotation: 0
                  }
                }
              },
              layout: {
                padding: { left: 10, right: 20, top: 20, bottom: 20 }
              }
            }
          });

          const chartUrl      = chart.getUrl();
          const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer' });
          chartBuffer         = Buffer.from(chartResponse.data, 'binary');

        } catch (chartError) {
          console.error('Error generando gráfica:', chartError);
        }
      }

      // ── ENVIAR PRIMER MENSAJE ──────────────────────────────────
      if (chartBuffer) {
        await sock.sendMessage(msg.key.remoteJid, {
          image:   chartBuffer,
          caption: fullText
        });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: fullText });
      }

      // ── SEGUNDO MENSAJE: MAPA ──────────────────────────────────
      const mapImg = $('#gosImg').attr('src');
      if (mapImg) {
        const mapUrl = mapImg.startsWith('http')
          ? mapImg
          : `https://lordsmobilecartograph.ru${mapImg}`;
        await sock.sendMessage(msg.key.remoteJid, {
          image:   { url: mapUrl },
          caption: `🗺️ *Mapa del Reino K${kingdomId}*\n\n🟢 *Verde:* Castillos Activos\n🔴 *Rojo:* Castillos Abandonados`
        });
      }

    } catch (error) {
      console.error('❌ Error en comando /kinfo:', error.message);
      if (error.response?.status === 404) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ No se encontraron datos para el reino *${kingdomId}*`
        });
      } else {
        await sock.sendMessage(msg.key.remoteJid, {
          text: '🚨 No se pudo obtener la información del reino.'
        });
      }
    }
  }
};