import stringSimilarity from "string-similarity";

export const EQUIPOS_OFICIALES = [
  // Primera División
  "Athletic Club",
  "Atlético de Madrid",
  "CA Osasuna",
  "CD Leganés",
  "Deportivo Alavés",
  "FC Barcelona",
  "Getafe CF",
  "Girona FC",
  "Rayo Vallecano",
  "RC Celta",
  "RCD Espanyol",
  "RCD Mallorca",
  "Real Betis",
  "Real Madrid",
  "Real Sociedad",
  "Real Valladolid",
  "Sevilla FC",
  "UD Las Palmas",
  "Valencia CF",
  "Villarreal CF",

  // Segunda División
  "Albacete Balompié",
  "Burgos CF",
  "Cádiz CF",
  "CD Castellón",
  "CD Eldense",
  "CD Mirandés",
  "CD Tenerife",
  "Córdoba CF",
  "Deportivo de La Coruña",
  "Elche CF",
  "FC Cartagena",
  "Granada CF",
  "Levante UD",
  "Málaga CF",
  "Racing de Ferrol",
  "Racing de Santander",
  "Real Oviedo",
  "Sporting de Gijón",
  "Real Zaragoza",
  "SD Eibar",
  "SD Huesca",
  "UD Almería",

  // Internacionales habituales
  "Manchester City",
  "Arsenal",
  "Liverpool",
  "Bayern München",
  "Borussia Dortmund",
  "Bayer Leverkusen",
  "Paris Saint-Germain",
  "Inter de Milán",
  "AC Milan",
  "Juventus",
  "Napoli",
  "Benfica",
  "Porto",
  "Sporting CP"
];

// Mapeo exhaustivo de claves y alias hacia los nombres oficiales
export const ALIAS_TEAMS_MAP = {
  // Nombres oficiales mapeados a sí mismos
  ...EQUIPOS_OFICIALES.reduce((acc, team) => {
    acc[team] = team;
    return acc;
  }, {}),

  // Alias y abreviaturas frecuentes
  "Real Madrid": "Real Madrid",
  "R Madrid": "Real Madrid",
  "Madrid": "Real Madrid",

  "Barcelona": "FC Barcelona",
  "Barca": "FC Barcelona",
  "Barça": "FC Barcelona",
  "FCB": "FC Barcelona",

  "Atletico Madrid": "Atlético de Madrid",
  "Atleti": "Atlético de Madrid",
  "At Madrid": "Atlético de Madrid",
  "Atletico": "Atlético de Madrid",

  "Athletic Bilbao": "Athletic Club",
  "Athletic": "Athletic Club",
  "Bilbao": "Athletic Club",

  "Betis": "Real Betis",
  "R Betis": "Real Betis",

  "Sevilla": "Sevilla FC",
  "Valencia": "Valencia CF",
  "Villarreal": "Villarreal CF",

  "Real Sociedad": "Real Sociedad",
  "R Sociedad": "Real Sociedad",
  "La Real": "Real Sociedad",

  "Girona": "Girona FC",
  "Espanyol": "RCD Espanyol",
  "Celta": "RC Celta",
  "Celta de Vigo": "RC Celta",
  "Osasuna": "CA Osasuna",
  "Rayo": "Rayo Vallecano",
  "Mallorca": "RCD Mallorca",
  "Getafe": "Getafe CF",
  "Las Palmas": "UD Las Palmas",
  "Alaves": "Deportivo Alavés",
  "Alavés": "Deportivo Alavés",
  "Dep Alaves": "Deportivo Alavés",
  "Leganes": "CD Leganés",
  "Leganés": "CD Leganés",
  "Valladolid": "Real Valladolid",

  // Segunda División
  "Eibar": "SD Eibar",
  "Levante": "Levante UD",
  "Sporting": "Sporting de Gijón",
  "Sporting de Gijon": "Sporting de Gijón",
  "Racing de Santander": "Racing de Santander",
  "Racing Santander": "Racing de Santander",
  "Racing": "Racing de Santander",
  "Oviedo": "Real Oviedo",
  "Elche": "Elche CF",
  "Granada": "Granada CF",
  "Almeria": "UD Almería",
  "Almería": "UD Almería",
  "Cadiz": "Cádiz CF",
  "Cádiz": "Cádiz CF",
  "Tenerife": "CD Tenerife",
  "Zaragoza": "Real Zaragoza",
  "Burgos": "Burgos CF",
  "Albacete": "Albacete Balompié",
  "Huesca": "SD Huesca",
  "Castellon": "CD Castellón",
  "Castellón": "CD Castellón",
  "Malaga": "Málaga CF",
  "Málaga": "Málaga CF",
  "Deportivo de La Coruna": "Deportivo de La Coruña",
  "Deportivo Coruña": "Deportivo de La Coruña",
  "Deportivo": "Deportivo de La Coruña",
  "Depor": "Deportivo de La Coruña",
  "Racing Ferrol": "Racing de Ferrol",
  "Ferrol": "Racing de Ferrol",
  "Cartagena": "FC Cartagena",
  "Mirandes": "CD Mirandés",
  "Mirandés": "CD Mirandés",
  "Cordoba": "Córdoba CF",
  "Córdoba": "Córdoba CF",
  "Eldense": "CD Eldense",

  // Internacionales
  "Man City": "Manchester City",
  "Man United": "Manchester United",
  "PSG": "Paris Saint-Germain",
  "Inter": "Inter de Milán",
  "Milan": "AC Milan",
  "Dortmund": "Borussia Dortmund",
  "Leverkusen": "Bayer Leverkusen",
  "Bayern": "Bayern München"
};

const CANONICAL_KEYS = Object.keys(ALIAS_TEAMS_MAP);

const PALABRAS_IGNORAR = [
  "quinigol", "loterias", "apuestas", "pronostico", "pronostica",
  "jornada", "bloque", "sencilla", "multiple", "importe", "total",
  "recaudacion", "fecha", "precio", "euros", "partidos", "domingo",
  "sabado", "viernes", "lunes", "martes", "miercoles", "jueves"
];

/**
 * FASE 3: Función normalizadora mediante string-similarity.
 * Compara el texto 'sucio' contra el universo de equipos y devuelve el nombre oficial con mayor rating.
 */
export function normalizarNombreEquipo(rawTexto, minRating = 0.38) {
  if (!rawTexto || typeof rawTexto !== "string") return null;

  // 1. Limpieza inicial de ruido típico de tickets
  let cleaned = rawTexto
    .replace(/^(?:partido|p)?\s*\d+[\.\-\s\:\)]+/i, "") // "1.", "P01", "Partido 1"
    .replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/, "")          // Caracteres extraños iniciales
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+$/, "")          // Caracteres extraños finales
    .replace(/[\s\.\,\-\:\/]+[012M\.\,\-\s]{1,6}$/i, "") // Marcadores 0, 1, 2, M al final
    .trim();

  if (cleaned.length < 2) return null;

  const lower = cleaned.toLowerCase();
  if (PALABRAS_IGNORAR.some((palabra) => lower.includes(palabra))) {
    return null;
  }

  // 2. Coincidencia exacta directa (Case-insensitive)
  for (const key of CANONICAL_KEYS) {
    if (key.toLowerCase() === lower) {
      return ALIAS_TEAMS_MAP[key];
    }
  }

  // 3. Algoritmo de similitud de cadenas (Dice coefficient)
  const matches = stringSimilarity.findBestMatch(cleaned, CANONICAL_KEYS);
  if (matches && matches.bestMatch && matches.bestMatch.rating >= minRating) {
    const bestKey = matches.bestMatch.target;
    return ALIAS_TEAMS_MAP[bestKey];
  }

  return null;
}

/**
 * Parsea el texto devuelto por el OCR para estructurar los 6 partidos del Quinigol
 */
export function parsearPartidosQuinigol(ocrText, partidosExistentes = []) {
  if (!ocrText || typeof ocrText !== "string") return partidosExistentes;

  const lineas = ocrText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length >= 2);

  const separadores = [" - ", " – ", " — ", " vs ", " VS ", " vs. ", " / ", " -", "- "];
  const partidosDetectados = [];

  // Estrategia 1: Líneas que contienen separadores de enfrentamiento
  for (const linea of lineas) {
    const lower = linea.toLowerCase();
    if (PALABRAS_IGNORAR.some((p) => lower.includes(p))) continue;

    for (const sep of separadores) {
      if (linea.includes(sep)) {
        const partes = linea.split(sep);
        if (partes.length >= 2) {
          const rawLocal = partes[0];
          const rawVisitante = partes[1];

          const home = normalizarNombreEquipo(rawLocal);
          const away = normalizarNombreEquipo(rawVisitante);

          if (home && away && home !== away) {
            partidosDetectados.push({ home, away });
            break;
          }
        }
      }
    }
  }

  // Si detectó suficientes partidos con separador
  if (partidosDetectados.length >= 3) {
    return (partidosExistentes.length === 6 ? partidosExistentes : Array(6).fill(null)).map((p, idx) => ({
      id: idx + 1,
      key: `partido${idx + 1}`,
      numStr: `0${idx + 1}`,
      home: partidosDetectados[idx]?.home || p?.home || `Local ${idx + 1}`,
      away: partidosDetectados[idx]?.away || p?.away || `Visitante ${idx + 1}`,
    }));
  }

  // Estrategia 2: Extracción secuencial de equipos detectados línea a línea
  const equiposDetectados = [];
  for (const linea of lineas) {
    const equipo = normalizarNombreEquipo(linea);
    if (equipo) {
      const ultimo = equiposDetectados[equiposDetectados.length - 1];
      if (!ultimo || ultimo !== equipo) {
        equiposDetectados.push(equipo);
      }
    }
  }

  if (equiposDetectados.length >= 2) {
    const resultado = (partidosExistentes.length === 6 ? [...partidosExistentes] : Array(6).fill(null)).map((p, i) => ({
      id: i + 1,
      key: `partido${i + 1}`,
      numStr: `0${i + 1}`,
      home: p?.home || `Local ${i + 1}`,
      away: p?.away || `Visitante ${i + 1}`,
    }));

    for (let i = 0; i < 6; i++) {
      const idxLocal = i * 2;
      const idxVisitante = i * 2 + 1;
      if (idxLocal < equiposDetectados.length) {
        resultado[i].home = equiposDetectados[idxLocal];
      }
      if (idxVisitante < equiposDetectados.length) {
        resultado[i].away = equiposDetectados[idxVisitante];
      }
    }
    return resultado;
  }

  return partidosExistentes;
}
