import axios from "axios";

const API_SPORTS_BASE_URL = "https://v3.football.api-sports.io";

// Cache en memoria para IDs de equipos (nunca cambian) y para estadísticas (TTL de 30 minutos)
const teamIdCache = new Map();
const statsCache = new Map();
const STATS_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutos

// Normalizaciones canónicas para búsqueda precisa en API-Sports
const CANONICAL_ALIASES = {
  "deportivo": "Deportivo La Coruna",
  "depor": "Deportivo La Coruna",
  "deportivo de la coruna": "Deportivo La Coruna",
  "deportivo de la coruña": "Deportivo La Coruna",
  "la coruna": "Deportivo La Coruna",
  "atleti": "Atletico Madrid",
  "atletico": "Atletico Madrid",
  "atletico de madrid": "Atletico Madrid",
  "atlético": "Atletico Madrid",
  "atlético de madrid": "Atletico Madrid",
  "madrid": "Real Madrid",
  "real madrid": "Real Madrid",
  "barca": "Barcelona",
  "barça": "Barcelona",
  "barcelona": "Barcelona",
  "fc barcelona": "Barcelona",
  "espanyol": "Espanyol",
  "rcd espanyol": "Espanyol",
  "athletic": "Athletic Club",
  "athletic club": "Athletic Club",
  "athletic de bilbao": "Athletic Club",
  "bilbao": "Athletic Club",
  "la real": "Real Sociedad",
  "real sociedad": "Real Sociedad",
  "betis": "Real Betis",
  "real betis": "Real Betis",
  "sevilla": "Sevilla",
  "sevilla fc": "Sevilla",
  "valencia": "Valencia",
  "valencia cf": "Valencia",
  "villarreal": "Villarreal",
  "villarreal cf": "Villarreal",
  "celta": "Celta Vigo",
  "celta de vigo": "Celta Vigo",
  "rc celta": "Celta Vigo",
  "osasuna": "Osasuna",
  "ca osasuna": "Osasuna",
  "alaves": "Alaves",
  "alavés": "Alaves",
  "deportivo alaves": "Alaves",
  "deportivo alavés": "Alaves",
  "rayo": "Rayo Vallecano",
  "rayo vallecano": "Rayo Vallecano",
  "getafe": "Getafe",
  "getafe cf": "Getafe",
  "mallorca": "Mallorca",
  "rcd mallorca": "Mallorca",
  "las palmas": "Las Palmas",
  "ud las palmas": "Las Palmas",
  "valladolid": "Real Valladolid",
  "real valladolid": "Real Valladolid",
  "leganes": "Leganes",
  "cd leganes": "Leganes",
};

/**
 * Limpia y normaliza el nombre de un equipo para maximizar coincidencia
 */
function limpiarNombreEquipo(nombre) {
  if (!nombre) return "";
  const raw = String(nombre).trim();
  const lower = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

  if (CANONICAL_ALIASES[lower]) {
    return CANONICAL_ALIASES[lower];
  }

  // Quitar prefijos comunes del fútbol español (CF, CD, FC, SD, UD, CA, RCD, etc.)
  const sinPrefijo = lower
    .replace(/^(fc|cf|cd|ud|rc|sd|rcd|ca)\s+/i, "")
    .replace(/\s+(cf|cd|fc|ud|sad|b)$/i, "")
    .trim();

  if (CANONICAL_ALIASES[sinPrefijo]) {
    return CANONICAL_ALIASES[sinPrefijo];
  }

  return sinPrefijo.length > 2 ? sinPrefijo : raw;
}

/**
 * Busca el ID numérico y datos de un equipo en API-Sports V3
 */
export async function buscarEquipo(nombreEquipo, apiKey) {
  const claveCache = nombreEquipo.toLowerCase().trim();
  if (teamIdCache.has(claveCache)) {
    return teamIdCache.get(claveCache);
  }

  const nombreBusqueda = limpiarNombreEquipo(nombreEquipo);

  const res = await axios.get(`${API_SPORTS_BASE_URL}/teams`, {
    params: { search: nombreBusqueda },
    headers: { "x-apisports-key": apiKey },
    timeout: 10000,
  });

  const equipos = res.data?.response || [];
  if (equipos.length === 0) {
    // Si no encontró con el término limpio, intentar con el nombre original sin acentos
    const intento2 = nombreEquipo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    if (intento2.toLowerCase() !== nombreBusqueda.toLowerCase()) {
      const res2 = await axios.get(`${API_SPORTS_BASE_URL}/teams`, {
        params: { search: intento2 },
        headers: { "x-apisports-key": apiKey },
        timeout: 10000,
      });
      const eq2 = res2.data?.response || [];
      if (eq2.length > 0) {
        equipos.push(...eq2);
      }
    }
  }

  if (equipos.length === 0) {
    return null;
  }

  // Descartar equipos filiales, juveniles y femeninos (salvo que sea lo buscado)
  const filtroSenior = equipos.filter((item) => {
    const n = item.team.name.toLowerCase();
    return !/(u19|u20|u21| u-|youth|femenin| w$| ii$| b$| c$|juvenil)/i.test(n);
  });

  const candidatos = filtroSenior.length > 0 ? filtroSenior : equipos;

  // Priorizar equipos de España
  const enEspana = candidatos.filter((item) => item.team.country === "Spain");
  const universo = enEspana.length > 0 ? enEspana : candidatos;

  // Lógica de mejor coincidencia:
  // 1. Coincidencia exacta de nombre
  const exacta = universo.find(
    (item) => item.team.name.toLowerCase() === nombreBusqueda.toLowerCase()
  );
  if (exacta) {
    const data = {
      id: exacta.team.id,
      name: exacta.team.name,
      logo: exacta.team.logo,
      country: exacta.team.country,
    };
    teamIdCache.set(claveCache, data);
    return data;
  }

  // 2. Coincidencia parcial que empiece por el nombre buscado
  const empiezaPor = universo.find((item) =>
    item.team.name.toLowerCase().startsWith(nombreBusqueda.toLowerCase())
  );
  if (empiezaPor) {
    const data = {
      id: empiezaPor.team.id,
      name: empiezaPor.team.name,
      logo: empiezaPor.team.logo,
      country: empiezaPor.team.country,
    };
    teamIdCache.set(claveCache, data);
    return data;
  }

  // 3. Coincidencia que contenga el nombre
  const contiene = universo.find((item) =>
    item.team.name.toLowerCase().includes(nombreBusqueda.toLowerCase())
  );
  const mejor = contiene || universo[0];

  const resultado = {
    id: mejor.team.id,
    name: mejor.team.name,
    logo: mejor.team.logo,
    country: mejor.team.country,
  };

  teamIdCache.set(claveCache, resultado);
  return resultado;
}

/**
 * Obtiene los últimos 3 enfrentamientos directos (H2H) finalizados
 */
export async function obtenerH2H(idLocal, idVisitante, apiKey) {
  try {
    const res = await axios.get(`${API_SPORTS_BASE_URL}/fixtures/headtohead`, {
      params: { h2h: `${idLocal}-${idVisitante}` },
      headers: { "x-apisports-key": apiKey },
      timeout: 10000,
    });

    const fixtures = res.data?.response || [];

    // Filtrar exclusivamente partidos que ya se hayan jugado y finalizado con marcador válido
    const terminados = fixtures
      .filter(
        (f) =>
          ["FT", "AET", "PEN"].includes(f.fixture?.status?.short) &&
          f.goals?.home !== null &&
          f.goals?.away !== null
      )
      .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date))
      .slice(0, 3);

    return terminados.map((f) => {
      let ganador = "Empate";
      if (f.teams.home.winner) ganador = f.teams.home.name;
      else if (f.teams.away.winner) ganador = f.teams.away.name;

      const fechaObj = new Date(f.fixture.date);
      const fechaFormateada = !isNaN(fechaObj.getTime())
        ? fechaObj.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
        : "Fecha N/D";

      return {
        id: f.fixture.id,
        fecha: f.fixture.date,
        fechaFormateada,
        local: f.teams.home.name,
        localLogo: f.teams.home.logo,
        visitante: f.teams.away.name,
        visitanteLogo: f.teams.away.logo,
        golesLocal: f.goals.home,
        golesVisitante: f.goals.away,
        ganador,
        competicion: f.league?.name || "Oficial",
        competicionLogo: f.league?.logo || null,
        resumen: `${f.teams.home.name} ${f.goals.home} - ${f.goals.away} ${f.teams.away.name}`,
      };
    });
  } catch (err) {
    console.error(`Error en obtenerH2H (${idLocal} vs ${idVisitante}):`, err.message);
    return [];
  }
}

/**
 * Obtiene la racha de los últimos 3 partidos disputados por un equipo
 */
export async function obtenerRachaEquipo(teamId, apiKey) {
  // Primero intentamos la petición estándar /fixtures?team={id}&last=3
  try {
    const resLast = await axios.get(`${API_SPORTS_BASE_URL}/fixtures`, {
      params: { team: teamId, last: 3 },
      headers: { "x-apisports-key": apiKey },
      timeout: 10000,
    });

    const fixturesLast = resLast.data?.response || [];
    const validos = fixturesLast.filter(
      (f) =>
        ["FT", "AET", "PEN"].includes(f.fixture?.status?.short) &&
        f.goals?.home !== null &&
        f.goals?.away !== null
    );

    if (validos.length > 0) {
      return formatearPartidosRacha(validos.slice(0, 3), teamId);
    }
  } catch (e) {
    // Si la API en plan gratuito rechaza el parámetro "last", continuamos al fallback por temporada
  }

  // Fallback para Plan Free: consultar por temporadas recientes (2024, 2025, 2023)
  const anioActual = new Date().getFullYear();
  const temporadas = [2024, anioActual, 2023];

  for (const temporada of temporadas) {
    try {
      const res = await axios.get(`${API_SPORTS_BASE_URL}/fixtures`, {
        params: { team: teamId, season: temporada },
        headers: { "x-apisports-key": apiKey },
        timeout: 10000,
      });

      const fixtures = res.data?.response || [];
      const terminados = fixtures
        .filter(
          (f) =>
            ["FT", "AET", "PEN"].includes(f.fixture?.status?.short) &&
            f.goals?.home !== null &&
            f.goals?.away !== null
        )
        .sort((a, b) => new Date(b.fixture.date) - new Date(a.fixture.date));

      if (terminados.length > 0) {
        return formatearPartidosRacha(terminados.slice(0, 3), teamId);
      }
    } catch (err) {
      // Continuar con la siguiente temporada si falla
    }
  }

  return [];
}

/**
 * Formatea los partidos para la racha desde la perspectiva del equipo consultado
 */
function formatearPartidosRacha(fixtures, teamId) {
  return fixtures.map((f) => {
    const isHome = f.teams.home.id === teamId;
    const miEquipo = isHome ? f.teams.home.name : f.teams.away.name;
    const rival = isHome ? f.teams.away.name : f.teams.home.name;
    const rivalLogo = isHome ? f.teams.away.logo : f.teams.home.logo;
    const misGoles = isHome ? f.goals.home : f.goals.away;
    const golesRival = isHome ? f.goals.away : f.goals.home;

    let resultado = "empate";
    let icono = "🤝";
    let resultadoTexto = `Empató ${misGoles}-${golesRival} vs ${rival}`;

    if (misGoles > golesRival) {
      resultado = "victoria";
      icono = "✅";
      resultadoTexto = `Ganó ${misGoles}-${golesRival} vs ${rival}`;
    } else if (misGoles < golesRival) {
      resultado = "derrota";
      icono = "❌";
      resultadoTexto = `Perdió ${misGoles}-${golesRival} vs ${rival}`;
    }

    const fechaObj = new Date(f.fixture.date);
    const fechaFormateada = !isNaN(fechaObj.getTime())
      ? fechaObj.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
      : "Fecha N/D";

    return {
      id: f.fixture.id,
      fecha: f.fixture.date,
      fechaFormateada,
      rival,
      rivalLogo,
      marcador: `${f.goals.home} - ${f.goals.away}`,
      misGoles,
      golesRival,
      esLocal: isHome,
      resultado,     // "victoria" | "empate" | "derrota"
      icono,         // "✅" | "🤝" | "❌"
      resultadoTexto,
      competicion: f.league?.name || "Liga",
      competicionLogo: f.league?.logo || null,
    };
  });
}

/**
 * Orquestador principal: obtiene estadísticas completas (H2H + Racha Local + Racha Visitante)
 */
export async function obtenerEstadisticasPartido(equipoLocal, equipoVisitante, apiKey) {
  if (!apiKey) {
    throw new Error("No se ha configurado la clave API_SPORTS_KEY en el servidor.");
  }

  const cacheKey = `${equipoLocal.toLowerCase().trim()}___${equipoVisitante.toLowerCase().trim()}`;
  const enCache = statsCache.get(cacheKey);

  if (enCache && Date.now() - enCache.timestamp < STATS_CACHE_TTL_MS) {
    return { ...enCache.data, cached: true };
  }

  // 1. Búsqueda de IDs numéricos para ambos equipos
  const [teamLocal, teamVisitante] = await Promise.all([
    buscarEquipo(equipoLocal, apiKey),
    buscarEquipo(equipoVisitante, apiKey),
  ]);

  if (!teamLocal) {
    throw new Error(`No se pudo encontrar el equipo local '${equipoLocal}' en API-Sports.`);
  }

  if (!teamVisitante) {
    throw new Error(`No se pudo encontrar el equipo visitante '${equipoVisitante}' en API-Sports.`);
  }

  // 2. Historial H2H y Rachas en paralelo para máxima velocidad
  const [h2h, rachaLocal, rachaVisitante] = await Promise.all([
    obtenerH2H(teamLocal.id, teamVisitante.id, apiKey),
    obtenerRachaEquipo(teamLocal.id, apiKey),
    obtenerRachaEquipo(teamVisitante.id, apiKey),
  ]);

  const respuesta = {
    local: {
      id: teamLocal.id,
      nombre: teamLocal.name,
      logo: teamLocal.logo,
      pais: teamLocal.country,
    },
    visitante: {
      id: teamVisitante.id,
      nombre: teamVisitante.name,
      logo: teamVisitante.logo,
      pais: teamVisitante.country,
    },
    h2h,
    rachaLocal,
    rachaVisitante,
    cached: false,
  };

  // Guardar en caché
  statsCache.set(cacheKey, {
    timestamp: Date.now(),
    data: respuesta,
  });

  return respuesta;
}
