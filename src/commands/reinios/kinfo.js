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
      // 🔍 Mensaje de búsqueda
      await sock.sendMessage(msg.key.remoteJid, {
        text: `🔎 Buscando información para el reino *K${kingdomId}*...`
      });

      const url = `https://lordsmobilecartograph.ru/Kingdom?K=${kingdomId}`;
      const { data: html } = await axios.get(url);
      const $ = cheerio.load(html);

      // Verificar si se encontraron datos (puedes ajustar esta condición según la estructura real)
      const summaryTable = $('table').first();
      if (summaryTable.length === 0 || !summaryTable.find('td').length) {
        await sock.sendMessage(msg.key.remoteJid, {
          text: `❌ No se encontraron datos para el reino *${kingdomId}*`
        });
        return;
      }

      // ✅ Mensaje de datos encontrados
      await sock.sendMessage(msg.key.remoteJid, {
        text: `✅ ¡Datos encontrados! Preparando visualización para *K${kingdomId}*...`
      });

      // 📌 TABLA RESUMEN
      const summaryCells = summaryTable.find('td');

      let population = $(summaryCells[0]).text().trim();
      let abandoned = $(summaryCells[1]).text().trim();
      let creation = $(summaryCells[2]).text().trim();
      let status = $(summaryCells[3]).text().trim();
      let duration = $(summaryCells[4]).text().trim();
      let ruler = $(summaryCells[5]).text().trim();

      // 📌 LAST UPDATE
      let lastUpdateRaw = $('body').text().match(/Last update:\s*[\d:]+/);
      let lastUpdate = lastUpdateRaw ? lastUpdateRaw[0] : "Last update: N/D";

      // 🔥 Diccionario de traducción manual
      const manualTranslations = {
        "Open": "Abierto",
        "Protection": "Protección",
        "Restriction": "Restricción",
        "Forever": "Para Siempre",
        "Last update:": "Última actualización:"
      };

      // 🔥 Función para traducir usando diccionario
      function translateManual(text) {
        let result = text;
        for (const [en, es] of Object.entries(manualTranslations)) {
          result = result.replace(new RegExp(en, 'g'), es);
        }
        return result.trim();
      }

      // 🔥 Aplicamos traducción manual y limpiamos iconos tipo brillo_1
      status = translateManual(status).replace(/[\w-]*_\d+/g, '').trim();
      duration = translateManual(duration);
      lastUpdate = translateManual(lastUpdate);

      // 📌 FUERTES (nombres fijos)
      const fortsTable = $('table').eq(1);
      const fortsRows = fortsTable.find('tr').slice(1); // ignoramos header
      const forts = [];

      const fortNames = [
        "Base",
        "Fuerte Tempestad",
        "Fuerte Brillante",
        "Fuerte Congelado",
        "Fuerte Cielo",
        "Fuerte Lunar",
        "Fuerte Cometa"
      ];

      fortsRows.each((i, row) => {
        const tds = $(row).find('td');
        const owner = $(tds[2]).text().trim();
        const fortName = fortNames[i] || `Fuerte ${i+1}`;
        forts.push(`*${fortName}:* ${owner}`);
      });

      // 📊 EXTRAER DATOS DE LA GRÁFICA DE IDIOMAS
      const htmlText = html;
      const rowsMatch = htmlText.match(/var rows = '(.+?)'.replace/);
      let languageData = [];

      // Función para formatear números grandes (millones/miles de millones)
      function formatMight(value) {
        if (value >= 1e9) {
          return (value / 1e9).toFixed(1) + 'B';
        } else if (value >= 1e6) {
          return (value / 1e6).toFixed(1) + 'M';
        } else if (value >= 1e3) {
          return (value / 1e3).toFixed(1) + 'K';
        }
        return value.toString();
      }

      if (rowsMatch && rowsMatch[1]) {
        try {
          // Procesar los datos de la gráfica
          let rowsData = rowsMatch[1].replace(/&quot;/g, '"');
          const jsonData = JSON.parse(rowsData);
          
          // Filtrar para eliminar "Any" y ordenar por valor de mayor a menor
          languageData = jsonData
            .map(item => ({
              language: item[0],
              value: item[1]
            }))
            .filter(item => item.language !== "Any") // ❌ ELIMINAR "ANY"
            .sort((a, b) => b.value - a.value);

        } catch (chartError) {
          console.error('Error procesando datos de idiomas:', chartError);
        }
      }

      // ============================================
      // PRIMER MENSAJE: GRÁFICA + INFO GENERAL + FUERTES + TABLA DE IDIOMAS
      // ============================================
      
      // 📝 CONSTRUIR TEXTO COMPLETO (INFO GENERAL + FUERTES + TABLA DE IDIOMAS)
      let fullText = `👑 *Resumen del Reino ${kingdomId}*\n\n`;
      fullText += `👥 *Población:* ${population}\n`;
      fullText += `👻 *Abandonados:* ${abandoned}\n`;
      fullText += `📅 *Creación:* ${creation}\n`;
      fullText += `📊 *Estado Actual:* ${status}\n`;
      fullText += `⏳ *Duración del Estado:* ${duration}\n`;
      fullText += `👑 *Gobernante:* ${ruler}\n\n`;
      fullText += `🕒 \`${lastUpdate}\`\n\n`;
      fullText += `🏰 *Control de Fuertes*\n`;
      forts.forEach(f => fullText += ` • ${f}\n`);

      // 📊 AGREGAR TABLA DE IDIOMAS AL TEXTO
      if (languageData.length > 0) {
        fullText += `\n📊 *Distribucion de poder por idioma*\n\n ​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​​`;
        fullText += "```\n";
        fullText += "Idioma".padEnd(25) + "Poder\n";
        fullText += "─".repeat(40) + "\n";
        
        languageData.forEach(item => {
          const language = item.language.length > 22 ? item.language.substring(0, 19) + "..." : item.language;
          fullText += language.padEnd(25) + formatMight(item.value) + "\n";
        });
        
        fullText += "```";
      }

      // 📊 GENERAR GRÁFICA
      let chartBuffer = null;
      if (languageData.length > 0) {
        try {
          const chart = new QuickChart();
          const chartHeight = Math.max(500, languageData.length * 30);
          chart.setWidth(900);
          chart.setHeight(chartHeight);
          chart.setBackgroundColor('white');

          chart.setConfig({
            type: 'bar',
            data: {
              labels: languageData.map(d => d.language),
              datasets: [{
                label: `Distribución de poder en el reino K${kingdomId}`,
                data: languageData.map(d => d.value),
                backgroundColor: 'rgba(54, 162, 235, 0.8)',
                borderColor: 'rgba(54, 162, 235, 1)',
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
                  text: `📊 Distribución de Poder por Idioma - Reino ${kingdomId}`,
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
                  bodyFont: { size: 13 },
                  callbacks: {
                    label: (context) => `Poder: ${formatMight(context.raw)}`
                  }
                },
                datalabels: { display: false }
              },
              scales: {
                x: {
                  title: {
                    display: true,
                    text: `Distribución de poder en ${kingdomId}`,
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

          const chartUrl = chart.getUrl();
          const chartResponse = await axios.get(chartUrl, { responseType: 'arraybuffer' });
          chartBuffer = Buffer.from(chartResponse.data, 'binary');

        } catch (chartError) {
          console.error('Error generando gráfica:', chartError);
        }
      }

      // 📤 ENVIAR PRIMER MENSAJE (GRÁFICA + TODO EL TEXTO)
      if (chartBuffer) {
        // Si hay gráfica, enviar imagen con todo el texto como caption
        await sock.sendMessage(msg.key.remoteJid, {
          image: chartBuffer,
          caption: fullText
        });
      } else {
        // Si no hay gráfica, enviar solo texto
        await sock.sendMessage(msg.key.remoteJid, { text: fullText });
      }

      // ============================================
      // SEGUNDO MENSAJE: MAPA DEL REINO
      // ============================================
      const mapImg = $('#gosImg').attr('src');
      if (mapImg) {
        const mapUrl = mapImg.startsWith('http') ? mapImg : `https://lordsmobilecartograph.ru${mapImg}`;
        await sock.sendMessage(msg.key.remoteJid, {
          image: { url: mapUrl },
          caption: `🗺️ *Mapa del Reino ${kingdomId}*\n\n🟢 *Verde:* Castillos Activos\n🔴 *Rojo:* Castillos Abandonados`
        });
      }

    } catch (error) {
      console.error('❌ Error en comando /kinfo:', error.message);
      
      // Verificar si es un error de conexión o datos no encontrados
      if (error.response && error.response.status === 404) {
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