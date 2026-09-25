import { createWorker } from "tesseract.js";
import { parsearPartidosQuinigol, normalizarNombreEquipo, EQUIPOS_OFICIALES } from "./ocrPostProcess";

/**
 * ============================================================================
 * PIPELINE DE OCR PARA QUINIGOL - ARQUITECTURA EN 3 FASES
 * ============================================================================
 * 
 * FASE 1: PRE-PROCESAMIENTO DE IMAGEN (FILTRO ÓPTICO EN CANVAS)
 * - Escala la resolución (Upscaling 250%-300%) con interpolación bicúbica.
 * - Convierte a Escala de Grises (Luminancia ponderada ITU-R BT.601).
 * - Aplica Binarización (Thresholding Otsu / Extremo) para convertir píxeles
 *   oscuros en negro puro (#000000) y papel claro en blanco puro (#FFFFFF).
 */
export async function preprocesarImagenBoleto(imageSrc, scaleFactor = 2.5) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        // Upscaling: Escala de 250% a 300% para máxima definición de caracteres
        const targetWidth = Math.min(3200, Math.round(naturalW * scaleFactor));
        const targetHeight = Math.round(naturalH * (targetWidth / naturalW));

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        // Interpolación de alta calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const data = imgData.data;
        const totalPixels = targetWidth * targetHeight;

        // 1. Escala de grises y cálculo de histograma de luminosidad
        const histogram = new Array(256).fill(0);
        const grays = new Uint8Array(totalPixels);

        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          const gray = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
          grays[p] = gray;
          histogram[gray]++;
        }

        // 2. Binarización inteligente mediante algoritmo de Otsu
        let sumTotal = 0;
        for (let t = 0; t < 256; t++) sumTotal += t * histogram[t];

        let sumB = 0;
        let weightBackground = 0;
        let maxVariance = 0;
        let otsuThreshold = 155;

        for (let t = 0; t < 256; t++) {
          weightBackground += histogram[t];
          if (weightBackground === 0) continue;

          const weightForeground = totalPixels - weightBackground;
          if (weightForeground === 0) break;

          sumB += t * histogram[t];
          const meanBackground = sumB / weightBackground;
          const meanForeground = (sumTotal - sumB) / weightForeground;

          const varianceBetween = weightBackground * weightForeground * Math.pow(meanBackground - meanForeground, 2);
          if (varianceBetween > maxVariance) {
            maxVariance = varianceBetween;
            otsuThreshold = t;
          }
        }

        // Calibración para boletos de lotería (fondos claros, tinta negra/azul oscura)
        const finalThreshold = Math.max(125, Math.min(185, otsuThreshold));

        // 3. Forzar negro puro (0) y blanco puro (255)
        for (let i = 0, p = 0; i < data.length; i += 4, p++) {
          const binaryVal = grays[p] < finalThreshold ? 0 : 255;
          data[i] = binaryVal;
          data[i + 1] = binaryVal;
          data[i + 2] = binaryVal;
          data[i + 3] = 255;
        }

        ctx.putImageData(imgData, 0, 0);

        resolve({
          dataUrl: canvas.toDataURL("image/png"),
          width: targetWidth,
          height: targetHeight,
          threshold: finalThreshold
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => reject(new Error("No se pudo cargar la imagen para procesamiento visual: " + err));
    img.src = imageSrc;
  });
}

/**
 * FASE 2: CONFIGURACIÓN ESTRICTA DEL MOTOR (TESSERACT.JS)
 * - Idioma: Español ('spa')
 * - Whitelist restrictiva: Sólo letras, acentos/ñ, espacios y guiones.
 *   Prohibición total de números y caracteres especiales (evita confusiones como 'O' con '0').
 * - PSM: Modo 6 (PSM.SINGLE_BLOCK: Asume un bloque uniforme de texto de enfrentamientos).
 */
export async function ejecutarMotorTesseract(preprocessedDataUrl, onProgress) {
  // Crear worker configurado en español
  const worker = await createWorker("spa");

  // Configurar parámetros restrictivos
  await worker.setParameters({
    // Whitelist estricta: solo abecedario castellano, mayúsculas, minúsculas, espacios y guiones
    tessedit_char_whitelist: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑüÜ -",
    // PSM 6: Segmentación optimizada para leer bloques de texto estructurados
    tessedit_pageseg_mode: "6",
  });

  const ret = await worker.recognize(preprocessedDataUrl);
  const rawText = ret?.data?.text || "";

  await worker.terminate();
  return rawText;
}

/**
 * PIPELINE COMPLETO DE OCR DE QUINIGOL
 * Conecta Fase 1 -> Fase 2 -> Fase 3
 * 
 * @param {string} imagenOriginalSrc - DataURL o URL de la imagen del boleto
 * @param {Array} partidosActuales - Lista actual de 6 partidos para preservar o rellenar
 * @param {Function} onStatusUpdate - Callback para reportar el progreso al usuario
 */
export async function procesarBoletoQuinigolPipeline(
  imagenOriginalSrc,
  partidosActuales = [],
  onStatusUpdate = () => {}
) {
  // FASE 1: Filtro Óptico (Canvas, Upscaling, Grayscale, Binarización)
  onStatusUpdate("Fase 1/3: Aplicando filtro óptico (Upscaling 250%, Grayscale y Binarización Otsu)...");
  const preprocesado = await preprocesarImagenBoleto(imagenOriginalSrc, 2.5);

  // FASE 2: OCR Restrictivo con Tesseract.js (spa, whitelist alfabética sin números, PSM 6)
  onStatusUpdate("Fase 2/3: Ejecutando motor Tesseract.js (Parámetros estrictos: solo abecedario, sin números)...");
  const textoRaw = await ejecutarMotorTesseract(preprocesado.dataUrl);

  // FASE 3: Post-procesamiento Algorítmico (string-similarity sobre universo de clubes de Primera y Segunda)
  onStatusUpdate("Fase 3/3: Autocorrigiendo fallos con string-similarity y emparejando enfrentamientos...");
  const partidosResultado = parsearPartidosQuinigol(textoRaw, partidosActuales);

  return {
    textoRaw,
    partidos: partidosResultado,
    imagenProcesadaDataUrl: preprocesado.dataUrl
  };
}

export {
  parsearPartidosQuinigol,
  normalizarNombreEquipo,
  EQUIPOS_OFICIALES
};
