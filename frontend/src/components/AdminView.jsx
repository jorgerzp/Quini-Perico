import React, { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { createWorker } from "tesseract.js";
import { API_URL } from "../config";

// Equipos y variantes comunes del fútbol español y europeo para enriquecer y emparejar texto OCR
const CANONICAL_TEAMS = {
  "real madrid": "Real Madrid",
  "r madrid": "Real Madrid",
  "madrid": "Real Madrid",
  "fc barcelona": "FC Barcelona",
  "barcelona": "FC Barcelona",
  "barca": "FC Barcelona",
  "barça": "FC Barcelona",
  "atletico de madrid": "Atlético de Madrid",
  "atletico madrid": "Atlético de Madrid",
  "atletico": "Atlético de Madrid",
  "at madrid": "Atlético de Madrid",
  "athletic club": "Athletic Club",
  "athletic": "Athletic Club",
  "bilbao": "Athletic Club",
  "real betis": "Real Betis",
  "r betis": "Real Betis",
  "betis": "Real Betis",
  "sevilla fc": "Sevilla FC",
  "sevilla": "Sevilla FC",
  "valencia cf": "Valencia CF",
  "valencia": "Valencia CF",
  "villarreal cf": "Villarreal CF",
  "villarreal": "Villarreal CF",
  "real sociedad": "Real Sociedad",
  "r sociedad": "Real Sociedad",
  "la real": "Real Sociedad",
  "girona fc": "Girona FC",
  "girona": "Girona FC",
  "rcd espanyol": "RCD Espanyol",
  "espanyol": "RCD Espanyol",
  "rc celta de vigo": "RC Celta",
  "celta de vigo": "RC Celta",
  "celta": "RC Celta",
  "ca osasuna": "CA Osasuna",
  "osasuna": "CA Osasuna",
  "rayo vallecano": "Rayo Vallecano",
  "rayo": "Rayo Vallecano",
  "rcd mallorca": "RCD Mallorca",
  "mallorca": "RCD Mallorca",
  "getafe cf": "Getafe CF",
  "getafe": "Getafe CF",
  "ud las palmas": "UD Las Palmas",
  "las palmas": "UD Las Palmas",
  "deportivo alaves": "Deportivo Alavés",
  "alaves": "Deportivo Alavés",
  "cd leganes": "CD Leganés",
  "leganes": "CD Leganés",
  "real valladolid": "Real Valladolid",
  "r valladolid": "Real Valladolid",
  "valladolid": "Real Valladolid",
  // LaLiga Hypermotion
  "sd eibar": "SD Eibar",
  "eibar": "SD Eibar",
  "levante ud": "Levante UD",
  "levante": "Levante UD",
  "real sporting": "Sporting de Gijón",
  "sporting de gijon": "Sporting de Gijón",
  "sporting": "Sporting de Gijón",
  "racing de santander": "Racing de Santander",
  "racing santander": "Racing de Santander",
  "racing": "Racing de Santander",
  "real oviedo": "Real Oviedo",
  "oviedo": "Real Oviedo",
  "elche cf": "Elche CF",
  "elche": "Elche CF",
  "granada cf": "Granada CF",
  "granada": "Granada CF",
  "ud almeria": "UD Almería",
  "almeria": "UD Almería",
  "cadiz cf": "Cádiz CF",
  "cadiz": "Cádiz CF",
  "cd tenerife": "CD Tenerife",
  "tenerife": "CD Tenerife",
  "real zaragoza": "Real Zaragoza",
  "zaragoza": "Real Zaragoza",
  "burgos cf": "Burgos CF",
  "burgos": "Burgos CF",
  "albacete bp": "Albacete BP",
  "albacete": "Albacete BP",
  "sd huesca": "SD Huesca",
  "huesca": "SD Huesca",
  "cd castellon": "CD Castellón",
  "castellon": "CD Castellón",
  "malaga cf": "Málaga CF",
  "malaga": "Málaga CF",
  "deportivo de la coruna": "Deportivo de La Coruña",
  "deportivo": "Deportivo",
  "dep coruna": "Deportivo",
  "racing de ferrol": "Racing de Ferrol",
  "racing ferrol": "Racing de Ferrol",
  "ferrol": "Racing de Ferrol",
  "fc cartagena": "FC Cartagena",
  "cartagena": "FC Cartagena",
  "cd mirandes": "CD Mirandés",
  "mirandes": "CD Mirandés",
  "cordoba cf": "Córdoba CF",
  "cordoba": "Córdoba CF",
  "cd eldense": "CD Eldense",
  "eldense": "CD Eldense",
  // Internacionales / Champions
  "manchester city": "Manchester City",
  "man city": "Manchester City",
  "arsenal": "Arsenal",
  "liverpool": "Liverpool",
  "aston villa": "Aston Villa",
  "chelsea": "Chelsea",
  "manchester united": "Manchester United",
  "man united": "Manchester United",
  "bayern munchen": "Bayern München",
  "bayern": "Bayern München",
  "borussia dortmund": "Borussia Dortmund",
  "dortmund": "Borussia Dortmund",
  "bayer leverkusen": "Bayer Leverkusen",
  "leverkusen": "Bayer Leverkusen",
  "rb leipzig": "RB Leipzig",
  "leipzig": "RB Leipzig",
  "paris saint germain": "PSG",
  "psg": "PSG",
  "monaco": "Monaco",
  "marseille": "Marseille",
  "inter": "Inter de Milán",
  "inter de milan": "Inter de Milán",
  "juventus": "Juventus",
  "milan": "AC Milan",
  "ac milan": "AC Milan",
  "atalanta": "Atalanta",
  "roma": "AS Roma",
  "as roma": "AS Roma",
  "napoli": "Napoli",
  "lazio": "Lazio",
  "benfica": "Benfica",
  "porto": "Porto",
  "sporting cp": "Sporting CP",
};

const EQUIPOS_LISTA_ORDENADA = Object.keys(CANONICAL_TEAMS).sort((a, b) => b.length - a.length);

export default function AdminView({
  bote,
  usuarios,
  usuarioActivo,
  onBoteActualizado,
  onIrResultados,
  onActualizarUsuarios,
  partidosActuales = [],
  onPartidosActualizados,
  numeroJornada = 7,
  onJornadaActualizada,
  notificaciones = [],
  notificacionesNoLeidas = 0,
  onMarcarNotificacionLeida,
  onMarcarTodasNotificacionesLeidas,
  onActualizarNotificaciones,
}) {
  const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";

  // Estado Jornada Activa
  const [jornadaInput, setJornadaInput] = useState(numeroJornada || 7);
  const [guardandoJornada, setGuardandoJornada] = useState(false);
  const [mensajeJornada, setMensajeJornada] = useState(null);

  // Sincronizar número de jornada si viene del padre
  React.useEffect(() => {
    if (numeroJornada) {
      setJornadaInput(numeroJornada);
    }
  }, [numeroJornada]);

  // Estado OCR
  const [imagenPreview, setImagenPreview] = useState(null);
  const [procesandoOcr, setProcesandoOcr] = useState(false);
  const [progresoOcr, setProgresoOcr] = useState(0);
  const [estadoOcrTexto, setEstadoOcrTexto] = useState("");
  const [textoExtraidoRaw, setTextoExtraidoRaw] = useState("");
  const [mostrarTextoRaw, setMostrarTextoRaw] = useState(false);

  // 6 Partidos de la Jornada
  const [partidosEditables, setPartidosEditables] = useState(() => {
    if (partidosActuales && partidosActuales.length === 6) {
      return partidosActuales;
    }
    return [
      { id: 1, key: "partido1", numStr: "01", home: "", away: "" },
      { id: 2, key: "partido2", numStr: "02", home: "", away: "" },
      { id: 3, key: "partido3", numStr: "03", home: "", away: "" },
      { id: 4, key: "partido4", numStr: "04", home: "", away: "" },
      { id: 5, key: "partido5", numStr: "05", home: "", away: "" },
      { id: 6, key: "partido6", numStr: "06", home: "", away: "" },
    ];
  });

  const [guardandoPartidos, setGuardandoPartidos] = useState(false);
  const [mensajePartidos, setMensajePartidos] = useState(null);

  // Estado Bote
  const [cantidad, setCantidad] = useState("");
  const [concepto, setConcepto] = useState("");
  const [guardandoBote, setGuardandoBote] = useState(false);
  const [mensajeBote, setMensajeBote] = useState(null);

  // Estado Notificaciones
  const [notifSeleccionadaId, setNotifSeleccionadaId] = useState(null);

  const fileInputRef = useRef(null);

  // Si no es Jorge, pantalla de denegación
  if (!esJorge) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center">
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Seguridad
          </p>
          <h2 className="text-3xl font-extrabold tracking-tighter text-stone-800 mb-3">
            Acceso Restringido
          </h2>
          <p className="text-sm font-medium text-stone-500">
            El panel Superadmin solo está habilitado para Jorge.
          </p>
        </div>
      </div>
    );
  }

  // Guardar número de jornada activa (Superadmin)
  const guardarNumeroJornada = async (numNuevo) => {
    const val = parseInt(numNuevo, 10);
    if (isNaN(val) || val < 1) {
      setMensajeJornada({ tipo: "error", texto: "Introduce un número de jornada válido (1 o superior)." });
      return;
    }

    setGuardandoJornada(true);
    setMensajeJornada(null);

    try {
      const res = await fetch(`${API_URL}/api/jornada/numero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la jornada.");

      setJornadaInput(data.jornada || val);
      setMensajeJornada({
        tipo: "success",
        texto: `Jornada ${data.jornada || val} fijada como oficial para toda la peña.`,
      });

      if (onJornadaActualizada) onJornadaActualizada(data.jornada || val);
    } catch (err) {
      setMensajeJornada({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoJornada(false);
    }
  };

  // Manejo de subida de archivo
  const manejarSeleccionImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagenPreview(event.target.result);
      setMensajePartidos(null);
    };
    reader.readAsDataURL(file);
  };

  // Funciones auxiliares para normalización, distancia y matching inteligente de equipos
  function normalizeStr(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, () => new Array(n + 1));
    for (let i = 0; i <= m; i++) d[i][0] = i;
    for (let j = 0; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      }
    }
    return d[m][n];
  }

  function findBestTeamMatch(line) {
    if (!line || line.length < 2) return null;

    // Limpiar prefijos numéricos típicos de boletos: "1.", "01", "P1", "Partido 1"
    const cleaned = line
      .replace(/^(?:partido|p)?\s*\d+[\.\-\s\:\)]+/i, "")
      .replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+/, "")
      .replace(/[\s\.\,\-\:\/]+[012M\.\,\-\s]{1,6}$/i, "")
      .trim();

    const lowerCleaned = cleaned.toLowerCase();
    const PALABRAS_PROHIBIDAS = [
      "pronostica", "partidos", "quinigol", "loterias", "apuestas", "sencilla",
      "multiple", "aleatoria", "limpiar", "importe", "bote", "jornada", "fecha",
      "domingo", "sabado", "viernes", "lunes", "martes", "miercoles", "jueves"
    ];
    if (PALABRAS_PROHIBIDAS.some((p) => lowerCleaned.includes(p))) {
      return null;
    }

    const normCleaned = normalizeStr(cleaned);
    if (!normCleaned || normCleaned.length < 2) return null;

    // 1. Coincidencia directa o exacta en el diccionario canónico
    if (CANONICAL_TEAMS[normCleaned]) {
      return CANONICAL_TEAMS[normCleaned];
    }

    // 2. Búsqueda por subcadena ordenada por longitud decreciente
    for (const key of EQUIPOS_LISTA_ORDENADA) {
      if (normCleaned === key) {
        return CANONICAL_TEAMS[key];
      }
      if (normCleaned.includes(key)) {
        return CANONICAL_TEAMS[key];
      }
      if (key.length >= 4 && key.includes(normCleaned)) {
        return CANONICAL_TEAMS[key];
      }
    }

    // 3. Distancia Levenshtein tolerante a errores OCR comunes
    let bestMatch = null;
    let minDistance = 999;

    for (const key of EQUIPOS_LISTA_ORDENADA) {
      const dist = levenshtein(normCleaned, key);
      const maxAllowed = key.length > 8 ? 2 : key.length > 4 ? 1 : 0;
      if (dist <= maxAllowed && dist < minDistance) {
        minDistance = dist;
        bestMatch = CANONICAL_TEAMS[key];
      }
    }

    if (bestMatch) return bestMatch;

    // 4. Si tiene pinta de nombre propio sin números, capitalizar
    if (cleaned.length >= 3 && !/^\d+$/.test(cleaned)) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }

    return null;
  }

  // Preprocesamiento de imagen con Canvas optimizado: escala nítida y contraste sin recortes destructivos
  function preprocessImage(imageSrc) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;

        const canvas = document.createElement("canvas");
        // No recortamos el ancho agresivamente para evitar cortar al equipo visitante o nombres largos
        const targetWidth = Math.min(1800, Math.max(1200, w));
        const scale = targetWidth / w;
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Curva de contraste adaptativa para destacar texto impreso sobre el boleto
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          // Contraste optimizado para OCR: fondos claros se blanquean, texto oscuro se resalta
          const val = gray > 168 ? 255 : Math.max(0, Math.min(255, (gray - 25) * 1.55));
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
        ctx.putImageData(imgData, 0, 0);

        resolve({
          dataUrl: canvas.toDataURL("image/png"),
        });
      };
      img.onerror = reject;
      img.src = imageSrc;
    });
  }

  // Parser heurístico avanzado para extraer los 6 partidos del texto de la foto
  const parsearTextoQuinigol = (text) => {
    if (!text || typeof text !== "string") return partidosEditables;

    const lineas = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length >= 2);

    const separadores = [" - ", " – ", " — ", " vs ", " VS ", " vs. ", " / ", " -", "- "];
    const partidosSeparador = [];

    // Estrategia 1: Líneas que contienen separador de enfrentamiento
    for (const linea of lineas) {
      const lower = linea.toLowerCase();
      if (["pronostica", "partidos", "quinigol", "loterias", "apuestas"].some((p) => lower.includes(p))) {
        continue;
      }

      for (const sep of separadores) {
        if (linea.includes(sep)) {
          const split = linea.split(sep);
          if (split.length >= 2) {
            const rawH = split[0].replace(/^(?:partido|p)?\s*\d+[\.\-\s\:\)]+/i, "").trim();
            const rawA = split[1].replace(/[\.\-\s\:\)]+\d+$/, "").trim();
            const h = findBestTeamMatch(rawH) || rawH;
            const a = findBestTeamMatch(rawA) || rawA;
            if (h && a && h.length > 1 && a.length > 1) {
              partidosSeparador.push({ home: h, away: a });
              break;
            }
          }
        }
      }
    }

    if (partidosSeparador.length >= 4) {
      return partidosEditables.map((p, idx) => ({
        ...p,
        home: partidosSeparador[idx]?.home || p.home || `Local ${idx + 1}`,
        away: partidosSeparador[idx]?.away || p.away || `Visitante ${idx + 1}`,
      }));
    }

    // Estrategia 2: Extracción secuencial de equipos detectados línea por línea
    const equiposDetectados = [];
    for (const linea of lineas) {
      const team = findBestTeamMatch(linea);
      if (team) {
        const ultimo = equiposDetectados[equiposDetectados.length - 1];
        if (!ultimo || normalizeStr(ultimo) !== normalizeStr(team)) {
          equiposDetectados.push(team);
        }
      }
    }

    if (equiposDetectados.length >= 2) {
      const nuevos = [...partidosEditables];
      for (let i = 0; i < 6; i++) {
        const idxLocal = i * 2;
        const idxVisitante = i * 2 + 1;
        if (idxLocal < equiposDetectados.length) {
          nuevos[i] = {
            ...nuevos[i],
            home: equiposDetectados[idxLocal] || nuevos[i].home,
            away: idxVisitante < equiposDetectados.length ? equiposDetectados[idxVisitante] : nuevos[i].away,
          };
        }
      }
      return nuevos;
    }

    return partidosEditables;
  };

  // Ejecutar OCR en la foto seleccionada
  const ejecutarOcr = async () => {
    if (!imagenPreview) {
      setMensajePartidos({ tipo: "error", texto: "Primero selecciona o sube una foto de la quiniela." });
      return;
    }

    setProcesandoOcr(true);
    setProgresoOcr(0);
    setEstadoOcrTexto("Analizando y preprocesando imagen...");
    setMensajePartidos(null);

    try {
      setEstadoOcrTexto("Analizando y mejorando calidad del boleto...");
      const prep = await preprocessImage(imagenPreview);

      const worker = await createWorker("spa");

      setEstadoOcrTexto("Escaneando equipos y partidos oficiales...");
      const ret = await worker.recognize(prep.dataUrl);
      const texto = ret.data.text || "";

      const partidosParseados = parsearTextoQuinigol(texto);

      await worker.terminate();

      setTextoExtraidoRaw(texto);
      setPartidosEditables(partidosParseados);
      setProgresoOcr(100);

      setMensajePartidos({
        tipo: "success",
        texto: "Equipos reconocidos con éxito y aplicados en la tabla inferior. Revisa y confirma antes de guardar.",
      });

      setTimeout(() => {
        const el = document.getElementById("seccion-partidos-editables");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 250);

      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.5 },
      });
    } catch (err) {
      console.error(err);
      setMensajePartidos({
        tipo: "error",
        texto: "Error al procesar la imagen con OCR: " + err.message,
      });
    } finally {
      setProcesandoOcr(false);
    }
  };

  // Modificar campo de equipo
  const actualizarEquipo = (idx, campo, valor) => {
    setPartidosEditables((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
  };

  // Guardar los 6 partidos en el servidor
  const guardarPartidosEnServidor = async () => {
    setGuardandoPartidos(true);
    setMensajePartidos(null);

    try {
      const res = await fetch(`${API_URL}/api/jornada/partidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partidos: partidosEditables,
          imagenBoleto: imagenPreview || null,
          numeroJornada: jornadaInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron guardar los partidos.");

      setMensajePartidos({
        tipo: "success",
        texto: `Partidos oficiales de la Jornada ${data.jornada || jornadaInput} guardados correctamente.`,
      });

      if (onPartidosActualizados) {
        onPartidosActualizados(data.partidos, data.jornada || jornadaInput);
      }

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setMensajePartidos({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPartidos(false);
    }
  };

  // Sumar bote rápido
  const sumarBote = async (monto, conceptoTxt) => {
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) {
      setMensajeBote({ tipo: "error", texto: "Introduce una cantidad válida." });
      return;
    }

    setGuardandoBote(true);
    setMensajeBote(null);

    try {
      const res = await fetch(`${API_URL}/api/bote/sumar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad: val,
          concepto: conceptoTxt || concepto || `Aporte de Jorge (+${val} €)`,
          autor: "Jorge (Superadmin)",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMensajeBote({ tipo: "success", texto: `+${val.toFixed(2)} € añadidos al bote.` });
      setCantidad("");
      setConcepto("");

      if (onBoteActualizado) onBoteActualizado();
    } catch (err) {
      setMensajeBote({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoBote(false);
    }
  };

  // Resetear partidos a estado inicial
  const reiniciarPartidos = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas vaciar los partidos de esta jornada? La sección de apuesta volverá a mostrar a los miembros: 'Aún no hay ningún quinigol disponible'."
      )
    ) {
      return;
    }
    setGuardandoPartidos(true);
    setMensajePartidos(null);
    try {
      const res = await fetch(`${API_URL}/api/jornada/partidos`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const partidosVacios = [
        { id: 1, key: "partido1", numStr: "01", home: "", away: "" },
        { id: 2, key: "partido2", numStr: "02", home: "", away: "" },
        { id: 3, key: "partido3", numStr: "03", home: "", away: "" },
        { id: 4, key: "partido4", numStr: "04", home: "", away: "" },
        { id: 5, key: "partido5", numStr: "05", home: "", away: "" },
        { id: 6, key: "partido6", numStr: "06", home: "", away: "" },
      ];
      setPartidosEditables(partidosVacios);
      setImagenPreview(null);
      setTextoExtraidoRaw("");
      setMensajePartidos({
        tipo: "success",
        texto: "Partidos vaciados correctamente.",
      });
      if (onPartidosActualizados) onPartidosActualizados(null);
    } catch (err) {
      setMensajePartidos({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPartidos(false);
    }
  };

  // Limpiar por completo la jornada activa para dejarla en blanco (Superadmin)
  const limpiarJornadaCompleta = async () => {
    if (
      !window.confirm(
        "⚠️ ¿Estás completamente seguro de que deseas LIMPIAR la jornada activa para dejarla en blanco?\n\nEsta acción:\n- Borrará todas las apuestas de los miembros en esta jornada.\n- Borrará los partidos y la foto del boleto.\n- Permitirá a todos los miembros volver a rellenar cuando abras una nueva jornada."
      )
    ) {
      return;
    }

    setGuardandoPartidos(true);
    setMensajePartidos(null);

    try {
      const res = await fetch(`${API_URL}/api/jornada/limpiar`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo limpiar la jornada.");

      const partidosVacios = [
        { id: 1, key: "partido1", numStr: "01", home: "", away: "" },
        { id: 2, key: "partido2", numStr: "02", home: "", away: "" },
        { id: 3, key: "partido3", numStr: "03", home: "", away: "" },
        { id: 4, key: "partido4", numStr: "04", home: "", away: "" },
        { id: 5, key: "partido5", numStr: "05", home: "", away: "" },
        { id: 6, key: "partido6", numStr: "06", home: "", away: "" },
      ];
      setPartidosEditables(partidosVacios);
      setImagenPreview(null);
      setTextoExtraidoRaw("");
      setMensajePartidos({
        tipo: "success",
        texto: data.message || "Jornada limpiada con éxito. Ha quedado totalmente en blanco.",
      });

      if (onPartidosActualizados) onPartidosActualizados(null, data.jornada?.numero || jornadaInput);
      if (onActualizarUsuarios) onActualizarUsuarios();
      if (onActualizarNotificaciones) onActualizarNotificaciones();
    } catch (err) {
      setMensajePartidos({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPartidos(false);
    }
  };

  // Resetear bote acumulado a 0.00 €
  const reiniciarBoteACero = async () => {
    if (
      !window.confirm(
        "¿Seguro que deseas poner el bote a 0.00 € y borrar todo el historial de ganancias?"
      )
    ) {
      return;
    }
    setGuardandoBote(true);
    setMensajeBote(null);
    try {
      const res = await fetch(`${API_URL}/api/bote/reset`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMensajeBote({
        tipo: "success",
        texto: "Bote reiniciado a 0.00 € e historial vaciado.",
      });
      if (onBoteActualizado) onBoteActualizado();
    } catch (err) {
      setMensajeBote({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoBote(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 text-[#4a4641]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">
            Superadmin · Jorge
          </p>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-stone-800">
            Control Maestro
          </h2>
          <p className="text-sm font-medium text-stone-500 tracking-tight mt-2">
            Escaneo OCR de fotos oficiales, configuración de partidos y gestión de fondos.
          </p>
        </div>

        <button
          type="button"
          onClick={onIrResultados}
          className="self-start sm:self-auto px-10 py-3.5 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer"
        >
          Resultados Oficiales
        </button>
      </div>

      {/* CONTROL OFICIAL DE NÚMERO DE JORNADA */}
      <div className="space-y-6 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
              Edición Oficial
            </p>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-stone-800 font-mono">
                J.{jornadaInput}
              </span>
              <span className="text-sm font-medium text-stone-500 tracking-tight">
                Jornada activa para toda la peña
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={guardandoJornada}
              onClick={() => guardarNumeroJornada(Number(jornadaInput) + 1)}
              className="px-6 py-3 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
            >
              +1 Avanzar a J.{Number(jornadaInput) + 1}
            </button>

            <div className="flex items-center gap-2 bg-white/30 px-3 py-1.5 rounded-full border border-white/50">
              <span className="text-xs text-stone-400 font-semibold uppercase pl-2">Nº</span>
              <input
                type="number"
                min="1"
                value={jornadaInput}
                onChange={(e) => setJornadaInput(e.target.value)}
                className="w-16 px-2 py-1 bg-transparent text-stone-800 text-sm font-mono font-bold text-center focus:outline-none"
              />
              <button
                type="button"
                disabled={guardandoJornada}
                onClick={() => guardarNumeroJornada(jornadaInput)}
                className="px-5 py-2 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {guardandoJornada ? "..." : "Fijar"}
              </button>
            </div>
          </div>
        </div>

        {mensajeJornada && (
          <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-stone-800 text-xs font-semibold tracking-tight">
            {mensajeJornada.texto}
          </div>
        )}
      </div>

      {/* SECCIÓN NOTIFICACIONES DE APUESTAS RECIBIDAS EN VIVO */}
      <div id="seccion-notificaciones-admin" className="space-y-6 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
                Notificaciones en Vivo
              </span>
              {notificacionesNoLeidas > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)] badge-notif-pulse">
                  {notificacionesNoLeidas} nuevas
                </span>
              )}
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-800">
              Apuestas Recibidas
            </h3>
            <p className="text-sm font-medium text-stone-500 tracking-tight mt-1">
              Registro inmediato de las apuestas que hace cada miembro al sellar su apuesta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {notificacionesNoLeidas > 0 && onMarcarTodasNotificacionesLeidas && (
              <button
                type="button"
                id="btn-marcar-todas-leidas-admin"
                onClick={onMarcarTodasNotificacionesLeidas}
                className="px-6 py-3 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider hover-negro-brillante shadow-[0_6px_20px_rgba(40,36,32,0.15)] transition-all cursor-pointer"
              >
                Marcar todas como revisadas
              </button>
            )}

            {onActualizarNotificaciones && (
              <button
                type="button"
                onClick={onActualizarNotificaciones}
                className="px-5 py-3 rounded-full bg-white/30 border border-white/50 text-stone-700 text-xs font-semibold uppercase tracking-wider hover-negro-brillante transition-all cursor-pointer"
              >
                Refrescar
              </button>
            )}
          </div>
        </div>

        {/* Lista de Notificaciones con desglose de la apuesta que hizo cada uno */}
        <div className="space-y-4 pt-2">
          {notificaciones.length === 0 ? (
            <div className="py-12 px-6 text-center bg-white/20 rounded-2xl border border-white/40">
              <p className="text-sm font-medium text-stone-400">
                Aún no hay apuestas registradas por los miembros.
              </p>
              <p className="text-xs text-stone-400/80 mt-1">
                En cuanto cualquiera de los 8 rellene su apuesta y guarde, su jugada aparecerá aquí al instante para Jorge.
              </p>
            </div>
          ) : (
            notificaciones.map((notif) => {
              const estaExpandida = notifSeleccionadaId === notif.id;
              const pronosticosObj = notif.pronosticos || {};
              const fechaStr = new Date(notif.fecha_creacion).toLocaleString("es-ES", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={notif.id}
                  className={`rounded-3xl border transition-all duration-300 p-6 ${
                    !notif.leida
                      ? "bg-white/85 border-red-300 shadow-[0_6px_25px_rgba(239,68,68,0.12)]"
                      : "bg-white/35 border-white/60 hover:bg-white/50"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                          !notif.leida ? "bg-red-500 badge-notif-pulse" : "bg-stone-300"
                        }`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-extrabold text-stone-900 tracking-tight">
                            {notif.usuarioNombre}
                          </h4>
                          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/70 text-stone-600 font-bold border border-stone-200">
                            Jornada {notif.jornadaNumero}
                          </span>
                          {!notif.leida && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                              Nueva
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 font-medium mt-0.5">
                          {notif.resumen || "Apuesta sellada"} · <span className="font-mono">{fechaStr}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {!notif.leida && onMarcarNotificacionLeida && (
                        <button
                          type="button"
                          onClick={() => onMarcarNotificacionLeida(notif.id)}
                          className="px-4 py-2 rounded-full text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white/60 border border-white/70 hover:bg-white transition-all cursor-pointer hover-negro-brillante"
                        >
                          Marcar revisada
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setNotifSeleccionadaId(estaExpandida ? null : notif.id)}
                        className="px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider text-stone-800 bg-white/50 border border-white/60 hover-negro-brillante transition-all cursor-pointer"
                      >
                        {estaExpandida ? "Ocultar Apuesta" : "Ver Apuesta Detallada"}
                      </button>
                    </div>
                  </div>

                  {/* Detalle visual de los 6 Partidos de la Apuesta */}
                  {estaExpandida && (
                    <div className="mt-6 pt-5 border-t border-stone-200/60 animate-in fade-in duration-200">
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                        Apuesta completa realizada por {notif.usuarioNombre}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const key = `partido${num}`;
                          const pred = pronosticosObj[key] || { local: null, visitante: null };
                          const partidoOficial = partidosActuales?.[num - 1] || {};
                          const homeName = partidoOficial.home || `Local P${num}`;
                          const awayName = partidoOficial.away || `Visitante P${num}`;

                          return (
                            <div
                              key={key}
                              className="p-3.5 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 pr-1">
                                <span className="text-[10px] font-mono font-bold text-stone-400 block uppercase">
                                  Partido 0{num}
                                </span>
                                <p className="text-xs font-bold text-stone-800 truncate mt-0.5">
                                  {homeName} <span className="text-stone-400 font-normal">vs</span> {awayName}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 font-mono font-extrabold text-sm">
                                <span className="w-7 h-7 rounded-xl bg-stone-800 text-white flex items-center justify-center shadow-xs">
                                  {pred.local ?? "-"}
                                </span>
                                <span className="text-stone-400 font-bold">:</span>
                                <span className="w-7 h-7 rounded-xl bg-stone-800 text-white flex items-center justify-center shadow-xs">
                                  {pred.visitante ?? "-"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECCIÓN 1: ESCÁNER OCR DE FOTO DE LA JORNADA */}
      <div className="space-y-8 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div>
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
              Reconocimiento Automático
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-800">
              Escáner OCR · Jornada {jornadaInput}
            </h3>
            <p className="text-sm font-medium text-stone-500 tracking-tight mt-1">
            Sube la captura oficial de la quiniela y el OCR extraerá los 6 enfrentamientos automáticamente.
          </p>
        </div>

        {/* Zona de Subida y Previsualización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Uploader */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-white/60 hover:border-stone-800 rounded-3xl p-10 text-center cursor-pointer transition-all bg-white/30 hover:bg-white/50 flex flex-col items-center justify-center min-h-[220px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={manejarSeleccionImagen}
            />

            <p className="text-base font-semibold text-stone-800 mb-1">
              Subir foto de la quiniela
            </p>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
              Arrastra aquí o haz clic (JPG, PNG)
            </p>
          </div>

          {/* Preview y Acción de Escaneo */}
          <div className="bg-white/30 rounded-3xl p-6 border border-white/50 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            {imagenPreview ? (
              <div className="w-full space-y-4">
                <div className="relative rounded-2xl overflow-hidden max-h-48 border border-white/50">
                  <img
                    src={imagenPreview}
                    alt="Foto Jornada"
                    className="w-full h-full object-cover"
                  />
                  {procesandoOcr && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-stone-800 p-4">
                      <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-xs font-semibold text-center">{estadoOcrTexto}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={procesandoOcr}
                    onClick={ejecutarOcr}
                    className="flex-1 py-3.5 px-6 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {procesandoOcr ? "Analizando..." : "Escanear con OCR"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImagenPreview(null);
                      setTextoExtraidoRaw("");
                    }}
                    className="px-5 py-3.5 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-stone-400">
                Sin imagen seleccionada.
              </p>
            )}
          </div>
        </div>

        {/* Mensaje de estado OCR */}
        {mensajePartidos && (
          <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-stone-800 text-xs font-semibold tracking-tight">
            {mensajePartidos.texto}
          </div>
        )}

        {/* Partidos Extraídos / Editables (Confirmar antes de Guardar) */}
        <div id="seccion-partidos-editables" className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
                Verificación
              </p>
              <h4 className="text-xl font-extrabold tracking-tight text-stone-800">
                Confirmar los 6 Partidos
              </h4>
            </div>
            <span className="text-xs font-mono font-semibold text-stone-400 uppercase">
              6 Enfrentamientos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partidosEditables.map((partido, idx) => {
              const completado = Boolean(partido.home && partido.away);
              return (
                <div
                  key={partido.id || idx}
                  className="bg-white/30 rounded-2xl p-5 border border-white/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase font-mono">
                      PARTIDO 0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      {completado ? "Listo" : "Incompleto"}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 items-center gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={partido.home}
                        onChange={(e) => actualizarEquipo(idx, "home", e.target.value)}
                        placeholder="Local"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/30 border border-white/50 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-xs font-extrabold text-stone-400 tracking-wider">VS</span>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={partido.away}
                        onChange={(e) => actualizarEquipo(idx, "away", e.target.value)}
                        placeholder="Visitante"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/30 border border-white/50 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
            {textoExtraidoRaw ? (
              <button
                type="button"
                onClick={() => setMostrarTextoRaw(!mostrarTextoRaw)}
                className="text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
              >
                {mostrarTextoRaw ? "Ocultar texto OCR" : "Ver texto OCR en bruto"}
              </button>
            ) : (
              <span className="text-xs text-stone-400 font-medium">Revisa los nombres antes de guardar</span>
            )}

            <div className="flex flex-wrap items-center gap-3 ml-auto">
              <button
                type="button"
                id="btn-limpiar-jornada-completa"
                onClick={limpiarJornadaCompleta}
                disabled={guardandoPartidos}
                title="Borra apuestas, partidos y foto para dejar la jornada totalmente en blanco"
                className="px-6 py-4 rounded-full bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-700 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
              >
                🧹 Limpiar Jornada (Dejar en blanco)
              </button>

              <button
                type="button"
                onClick={reiniciarPartidos}
                disabled={guardandoPartidos}
                className="px-6 py-4 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
              >
                Vaciar Partidos
              </button>

              <button
                type="button"
                id="btn-guardar-partidos-ocr"
                disabled={guardandoPartidos}
                onClick={guardarPartidosEnServidor}
                className="px-8 py-4 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {guardandoPartidos ? "Guardando..." : `Guardar Partidos (Jornada ${jornadaInput})`}
              </button>
            </div>
          </div>

          {mostrarTextoRaw && (
            <div className="p-4 rounded-2xl bg-white/30 border border-white/50 font-mono text-xs text-stone-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {textoExtraidoRaw}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
              Tesorería
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-800">
              Añadir Fondos al Bote
            </h3>
            <p className="text-sm font-medium text-stone-500 tracking-tight mt-1">
              Suma ganancias o aportes manuales directamente al bote acumulado.
            </p>
          </div>

          <button
            type="button"
            onClick={reiniciarBoteACero}
            disabled={guardandoBote}
            className="self-start sm:self-auto px-6 py-3 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
          >
            Poner Bote a 0.00 €
          </button>
        </div>

        {mensajeBote && (
          <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-stone-800 text-xs font-semibold tracking-tight">
            {mensajeBote.texto}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sumarBote(cantidad, concepto);
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2 block">
                Importe (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-base font-mono font-bold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-stone-800 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2 block">
                Concepto
              </label>
              <input
                type="text"
                placeholder="Aporte, premio, etc."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-stone-800 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardandoBote || !cantidad}
              className="px-10 py-4 rounded-full bg-stone-800 text-white text-sm font-semibold tracking-tight shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
            >
              {guardandoBote ? "Añadiendo..." : "Añadir Fondos al Bote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
