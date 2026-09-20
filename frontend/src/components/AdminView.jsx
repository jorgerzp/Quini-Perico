import React, { useState, useRef } from "react";
import {
  ShieldCheck,
  Coins,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  Camera,
  Scan,
  Sparkles,
  FileText,
  AlertCircle,
  Save,
  RotateCcw,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { createWorker } from "tesseract.js";
import { API_URL } from "../config";

// Equipos comunes del fútbol español y competiciones oficiales para enriquecer y emparejar texto OCR
const EQUIPOS_CONOCIDOS = [
  // LaLiga EA Sports
  "Real Madrid", "FC Barcelona", "Barcelona", "Barça", "Atlético de Madrid", "At. Madrid", "Atlético",
  "Athletic Club", "Athletic", "Real Betis", "Betis", "Sevilla FC", "Sevilla", "Valencia CF", "Valencia",
  "Villarreal CF", "Villarreal", "Real Sociedad", "R. Sociedad", "Girona FC", "Girona", "RCD Espanyol", "Espanyol",
  "RC Celta de Vigo", "Celta de Vigo", "Celta", "CA Osasuna", "Osasuna", "Rayo Vallecano", "Rayo",
  "RCD Mallorca", "Mallorca", "Getafe CF", "Getafe", "UD Las Palmas", "Las Palmas", "Deportivo Alavés", "Alavés",
  "CD Leganés", "Leganés", "Real Valladolid", "Valladolid",
  // LaLiga Hypermotion
  "SD Eibar", "Eibar", "Levante UD", "Levante", "Real Sporting", "Sporting de Gijón", "Sporting",
  "Racing de Santander", "Racing", "Real Oviedo", "Oviedo", "Elche CF", "Elche", "Granada CF", "Granada",
  "UD Almería", "Almería", "Cádiz CF", "Cádiz", "CD Tenerife", "Tenerife", "Real Zaragoza", "Zaragoza",
  "Burgos CF", "Burgos", "Albacete BP", "Albacete", "SD Huesca", "Huesca", "CD Castellón", "Castellón",
  "Málaga CF", "Málaga", "Deportivo de La Coruña", "Deportivo", "Dep. Coruña", "Racing de Ferrol", "Ferrol",
  "FC Cartagena", "Cartagena", "CD Mirandés", "Mirandés", "Córdoba CF", "Córdoba", "CD Eldense", "Eldense",
  // Internacionales / Champions habituales en Quinigol
  "Manchester City", "Man. City", "Arsenal", "Liverpool", "Aston Villa", "Chelsea", "Manchester United",
  "Bayern München", "Bayern", "Borussia Dortmund", "Dortmund", "Bayer Leverkusen", "Leverkusen", "RB Leipzig",
  "Paris Saint-Germain", "PSG", "Monaco", "Marseille", "Lille",
  "Inter", "Inter de Milán", "Juventus", "Milan", "AC Milan", "Atalanta", "Roma", "Napoli", "Lazio",
  "Benfica", "Sporting CP", "Porto", "PSV", "Feyenoord", "Ajax"
];

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

  const fileInputRef = useRef(null);

  // Si no es Jorge, pantalla de denegación
  if (!esJorge) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl p-10 border border-red-200 text-slate-800 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-black text-slate-900">Acceso Restringido</h2>
          <p className="text-sm text-slate-500 mt-2">
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
        texto: `¡Jornada ${data.jornada || val} fijada como oficial para toda la peña!`,
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

  // Limpiar caracteres de ruido inicial generados por los escudos (1-3 letras o símbolos raros)
  // Ej: "Y Athletic Club" -> "Athletic Club", "UB Barcelona" -> "Barcelona", "KT At. Madrid" -> "At. Madrid"
  const cleaned = line
    .replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+/, "")
    .replace(/^[A-Za-z0-9\W]{1,3}\s+/, "")
    .replace(/\s+[012M\.\,\-\s]{1,6}$/i, "")
    .trim();

  // Filtrar palabras de cabecera o botones que no son equipos
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
  const normOriginal = normalizeStr(line);

  let best = null;
  let bestScore = 0;

  for (const eq of EQUIPOS_CONOCIDOS) {
    const normEq = normalizeStr(eq);

    // Coincidencia exacta
    if (normCleaned === normEq || normOriginal === normEq) {
      return eq;
    }

    // Coincidencia de subcadena
    if (normCleaned.includes(normEq) || normOriginal.includes(normEq)) {
      if (normEq.length > bestScore) {
        best = eq;
        bestScore = normEq.length;
      }
    } else if (normCleaned.length >= 4 && normEq.includes(normCleaned)) {
      if (normCleaned.length > bestScore) {
        best = eq;
        bestScore = normCleaned.length;
      }
    } else {
      // Fuzzy matching con distancia Levenshtein
      const dist = levenshtein(normCleaned, normEq);
      const maxPermitido = normEq.length > 7 ? 2 : 1;
      if (dist <= maxPermitido && normEq.length > bestScore) {
        best = eq;
        bestScore = normEq.length;
      }
    }
  }

  // Si no coincide con la lista pero tiene forma de nombre de equipo válido (> 3 letras)
  if (!best && cleaned.length >= 3 && !/^\d+$/.test(cleaned)) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return best;
}

// Preprocesamiento de imagen con Canvas: recorte de columna de equipos y mejora de contraste
function preprocessImage(imageSrc, mode = "auto") {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const isPortrait = h / w > 1.25;

      const canvas = document.createElement("canvas");
      let cropX = 0;
      let cropY = 0;
      let cropW = w;
      let cropH = h;

      if (mode === "teams_column" || (mode === "auto" && isPortrait)) {
        // En capturas de app móvil (Loterías / Quinigol):
        // La columna izquierda contiene los nombres de los equipos de los 6 partidos (dos filas por partido)
        // Se excluye la botonera [0][1][2][M] de la derecha para evitar caracteres parásitos.
        cropX = Math.round(w * 0.07);
        cropY = Math.round(h * 0.14);
        cropW = Math.round(w * 0.50);
        cropH = Math.round(h * 0.74);
      }

      // Escalar 3x para que las letras tengan altura óptima de reconocimiento
      const scale = Math.max(2.5, Math.min(4.5, 1200 / cropW));
      canvas.width = Math.round(cropW * scale);
      canvas.height = Math.round(cropH * scale);

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

      // Filtro de contraste y binarización a escala de grises
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const val = gray > 180 ? 255 : Math.max(0, (gray - 35) * 1.6);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
      ctx.putImageData(imgData, 0, 0);

      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        isPortrait,
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

    // ESTRATEGIA 1: Líneas con separadores claros (" - ", " vs ", " – ", " — ")
    const separadores = [" - ", " – ", " — ", " vs ", " VS ", " vs. ", " / "];
    const partidosSeparador = [];

    for (const linea of lineas) {
      const lower = linea.toLowerCase();
      if (["pronostica", "partidos", "quinigol", "loterias", "apuestas"].some((p) => lower.includes(p))) {
        continue;
      }

      for (const sep of separadores) {
        if (linea.includes(sep)) {
          const split = linea.split(sep);
          if (split.length >= 2) {
            const rawH = split[0].replace(/^[pP]?\d+[\.\-\s\:\)]+/, "").trim();
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

    // ESTRATEGIA 2: Lista secuencial de equipos (Captura de app: columna izquierda con los equipos seguidos de arriba a abajo)
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
      setMensajePartidos({ tipo: "error", texto: "Primero selecciona o sube una foto del boleto." });
      return;
    }

    setProcesandoOcr(true);
    setProgresoOcr(0);
    setEstadoOcrTexto("Analizando y preprocesando imagen...");
    setMensajePartidos(null);

    try {
      // 1. Preprocesar y enfocar la columna de nombres de equipos (evita botones [0][1][2][M])
      setEstadoOcrTexto("Aislando y mejorando la columna de equipos...");
      const prep = await preprocessImage(imagenPreview, "auto");

      const worker = await createWorker("spa");

      setEstadoOcrTexto("Escaneando nombres de equipos en la columna...");
      const ret = await worker.recognize(prep.dataUrl);
      let texto = ret.data.text || "";

      let partidosParseados = parsearTextoQuinigol(texto);
      let numRellenados = partidosParseados.filter((p) => p.home && p.away).length;

      // Si por formato de la foto no detectó suficientes equipos con el recorte de columna, probar la imagen completa optimizada
      if (numRellenados < 4 && prep.isPortrait) {
        setEstadoOcrTexto("Probando reconocimiento amplio de la imagen...");
        const fullPrep = await preprocessImage(imagenPreview, "full_enhanced");
        const retFull = await worker.recognize(fullPrep.dataUrl);
        const partidosFull = parsearTextoQuinigol(retFull.data.text || "");
        if (partidosFull.filter((p) => p.home && p.away).length > numRellenados) {
          partidosParseados = partidosFull;
          texto = retFull.data.text || "";
        }
      }

      await worker.terminate();

      setTextoExtraidoRaw(texto);

      // Rellenar los inputs editables inmediatamente
      setPartidosEditables(partidosParseados);
      setProgresoOcr(100);

      setMensajePartidos({
        tipo: "success",
        texto: "¡Equipos reconocidos con éxito! Se han colocado en los 6 partidos de abajo. Revísalos y confirma antes de guardar.",
      });

      // Scroll suave hacia la sección de confirmación de partidos
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
        texto: `¡Partidos oficiales de la Jornada ${data.jornada || jornadaInput} guardados y aplicados para toda la peña!`,
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

      setMensajeBote({ tipo: "success", texto: `+${val.toFixed(2)} € añadidos al bote con éxito.` });
      setCantidad("");
      setConcepto("");

      if (onBoteActualizado) onBoteActualizado();
    } catch (err) {
      setMensajeBote({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoBote(false);
    }
  };

  // Resetear partidos a estado inicial (sin configurar)
  const reiniciarPartidos = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar los partidos de esta jornada? El boleto volverá a mostrar a los miembros: 'Aún no hay ningún quinigol disponible'."
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
        texto: "Partidos eliminados. El boleto vuelve al estado 'sin quinigol disponible'.",
      });
      if (onPartidosActualizados) onPartidosActualizados(null);
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
        texto: "Bote reiniciado a 0.00 € e historial de ganancias vaciado.",
      });
      if (onBoteActualizado) onBoteActualizado();
    } catch (err) {
      setMensajeBote({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoBote(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300 text-slate-800">
      {/* Header Superadmin */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/20 text-xs font-black tracking-wider uppercase mb-2">
            <ShieldCheck size={14} /> Panel Superadmin Jorge
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Control Maestro de la Jornada
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Escaneo OCR de fotos oficiales de boletos, partidos y gestión del bote
          </p>
        </div>

        <button
          type="button"
          onClick={onIrResultados}
          className="px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-xs font-bold text-white transition-all duration-300 ease-out cursor-pointer flex items-center gap-2 shadow-md"
        >
          <span>Poner Resultados Oficiales</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* CONTROL OFICIAL DE NÚMERO DE JORNADA */}
      <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl p-6 sm:p-7 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-900 to-gray-800 text-white flex flex-col items-center justify-center font-mono shadow-md border border-white/30">
            <span className="text-[10px] font-bold text-slate-300 uppercase leading-none">JORNADA</span>
            <span className="text-2xl font-black leading-none mt-0.5">{jornadaInput}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600">
                Jornada Oficial en Curso
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/25 text-[10px] font-bold">
                Jornada {jornadaInput}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900">
              Edición y Número de la Jornada
            </h3>
            <p className="text-xs text-slate-500">
              Actualmente se muestra la <strong>Jornada {jornadaInput}</strong> a toda la peña. Puedes cambiarla o avanzar a la siguiente cuando toque.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={guardandoJornada}
            onClick={() => guardarNumeroJornada(Number(jornadaInput) + 1)}
            className="px-4 py-2.5 rounded-2xl bg-white/60 hover:bg-white border border-white/80 text-xs font-bold text-slate-800 transition-all duration-200 cursor-pointer flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <span>+1 Avanzar a Jornada {Number(jornadaInput) + 1}</span>
          </button>

          <div className="flex items-center gap-2 bg-white/60 px-3 py-1.5 rounded-2xl border border-white/80 shadow-xs">
            <span className="text-xs text-slate-500 font-bold">Nº:</span>
            <input
              type="number"
              min="1"
              value={jornadaInput}
              onChange={(e) => setJornadaInput(e.target.value)}
              className="w-16 px-2 py-1 rounded-xl bg-white text-slate-900 text-xs font-mono font-bold text-center border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
            <button
              type="button"
              disabled={guardandoJornada}
              onClick={() => guardarNumeroJornada(jornadaInput)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all cursor-pointer disabled:opacity-50"
            >
              {guardandoJornada ? "Guardando..." : "Fijar"}
            </button>
          </div>
        </div>

        {mensajeJornada && (
          <div
            className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in duration-200 shadow-xs ${
              mensajeJornada.tipo === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{mensajeJornada.texto}</span>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: ESCÁNER OCR DE FOTO DE LA JORNADA */}
      <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/60">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-gray-800 flex items-center justify-center text-white shadow-xs border border-white/30">
              <Scan size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Escáner OCR: Foto de la Jornada {jornadaInput}
              </h3>
              <p className="text-xs text-slate-500">
                Sube la foto del boleto o calendario y el OCR extraerá los 6 partidos y los rellenará abajo para que puedas confirmarlos antes de guardar
              </p>
            </div>
          </div>
        </div>

        {/* Zona de Subida y Previsualización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-6">
          {/* Uploader */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-3xl p-8 text-center cursor-pointer transition-all bg-white/20 hover:bg-white/40 group flex flex-col items-center justify-center min-h-[220px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={manejarSeleccionImagen}
            />

            <div className="w-14 h-14 rounded-2xl bg-white/80 group-hover:bg-white flex items-center justify-center text-slate-600 group-hover:text-slate-900 transition-colors mb-3 border border-white/60 shadow-xs">
              <Upload size={24} />
            </div>

            <p className="text-sm font-bold text-slate-800 group-hover:text-slate-950">
              Arrastra o haz clic para subir foto del boleto
            </p>
            <p className="text-xs text-slate-500 mt-1">
              JPG, PNG o foto tomada con la cámara
            </p>
          </div>

          {/* Preview y Acción de Escaneo */}
          <div className="apple-card-inner bg-white/25 backdrop-blur-md rounded-3xl p-5 border border-white/60 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            {imagenPreview ? (
              <div className="w-full space-y-4">
                <div className="relative rounded-2xl overflow-hidden max-h-48 border border-white/60 shadow-xs">
                  <img
                    src={imagenPreview}
                    alt="Foto Jornada"
                    className="w-full h-full object-cover"
                  />
                  {procesandoOcr && (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center text-slate-800 p-4">
                      <div className="w-8 h-8 border-3 border-slate-800 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-xs font-bold text-center">{estadoOcrTexto}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={procesandoOcr}
                    onClick={ejecutarOcr}
                    className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold tracking-wide shadow-md transition-all duration-300 ease-out cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles size={15} />
                    <span>{procesandoOcr ? "Analizando OCR..." : "Escanear Foto con OCR"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImagenPreview(null);
                      setTextoExtraidoRaw("");
                    }}
                    className="p-3 rounded-2xl bg-white/60 hover:bg-white border border-white/80 text-slate-500 hover:text-slate-800 transition cursor-pointer shadow-xs"
                    title="Quitar foto"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Camera size={36} className="mx-auto mb-2 opacity-50 text-slate-400" />
                <p className="text-xs font-medium text-slate-400">
                  Aún no has seleccionado ninguna imagen.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Mensaje de estado OCR */}
        {mensajePartidos && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 mb-6 border animate-in fade-in duration-200 shadow-xs ${
              mensajePartidos.tipo === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {mensajePartidos.tipo === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-600" />
            )}
            <span>{mensajePartidos.texto}</span>
          </div>
        )}

        {/* Partidos Extraídos / Editables (Confirmar antes de Guardar) */}
        <div id="seccion-partidos-editables" className="space-y-4 pt-4 border-t border-white/50">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText size={18} className="text-slate-600" />
                Revisar y Confirmar los 6 Partidos de la Jornada {jornadaInput}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Los equipos leídos con el OCR se rellenan aquí. Puedes corregir cualquier nombre antes de aplicar.
              </p>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 border border-blue-500/25 font-mono font-bold">
              6 Enfrentamientos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {partidosEditables.map((partido, idx) => {
              const completado = Boolean(partido.home && partido.away);
              return (
                <div
                  key={partido.id || idx}
                  className={`apple-card-inner bg-white/30 backdrop-blur-md rounded-2xl p-4 border transition-all duration-200 ${
                    completado ? "border-emerald-300/80 bg-emerald-50/40" : "border-white/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 text-white font-mono font-bold text-[11px] shadow-xs">
                      PARTIDO 0{idx + 1}
                    </span>
                    {completado ? (
                      <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                        <Check size={12} /> Confirmado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Por rellenar</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Local */}
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Local</label>
                      <input
                        type="text"
                        value={partido.home}
                        onChange={(e) => actualizarEquipo(idx, "home", e.target.value)}
                        placeholder={`Equipo Local 0${idx + 1}`}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/90 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs"
                      />
                    </div>

                    <span className="text-[10px] font-black text-slate-500 px-2 py-1 rounded bg-white/60 border border-white/80 mt-4 shadow-2xs">
                      VS
                    </span>

                    {/* Visitante */}
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Visitante</label>
                      <input
                        type="text"
                        value={partido.away}
                        onChange={(e) => actualizarEquipo(idx, "away", e.target.value)}
                        placeholder={`Equipo Visitante 0${idx + 1}`}
                        className="w-full px-3 py-2 rounded-xl bg-white/70 border border-white/90 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Botón Guardar Partidos de la Jornada */}
          <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
            {textoExtraidoRaw ? (
              <button
                type="button"
                onClick={() => setMostrarTextoRaw(!mostrarTextoRaw)}
                className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
              >
                {mostrarTextoRaw ? "Ocultar texto OCR en bruto" : "Ver texto OCR reconocido"}
              </button>
            ) : (
              <span className="text-xs text-slate-400">Revisa los nombres antes de guardar</span>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={reiniciarPartidos}
                disabled={guardandoPartidos}
                className="px-4 py-3 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-xs disabled:opacity-50"
              >
                <RotateCcw size={14} />
                <span>Vaciar Partidos</span>
              </button>

              <button
                type="button"
                id="btn-guardar-partidos-ocr"
                disabled={guardandoPartidos}
                onClick={guardarPartidosEnServidor}
                className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs tracking-wider uppercase shadow-lg shadow-slate-900/20 transition-all duration-300 ease-out cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                <span>{guardandoPartidos ? "Guardando..." : `Guardar y Aplicar Partidos (Jornada ${jornadaInput})`}</span>
              </button>
            </div>
          </div>

          {/* Desglose texto crudo OCR si se solicita */}
          {mostrarTextoRaw && (
            <div className="mt-4 p-4 rounded-2xl bg-white/80 border border-white font-mono text-[11px] text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto shadow-inner">
              {textoExtraidoRaw}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: GESTIÓN DEL BOTE POR JORGE (SIN DATOS DE EJEMPLO) */}
      <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] border border-white/60">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-xs border border-white/30">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Gestión del Bote por Jorge
              </h3>
              <p className="text-xs text-slate-500">
                Añade fondos o ganancias directamente al bote acumulado de la peña
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={reiniciarBoteACero}
            disabled={guardandoBote}
            className="px-4 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-200 shadow-xs disabled:opacity-50"
          >
            <RotateCcw size={14} />
            <span>Poner Bote a 0.00 €</span>
          </button>
        </div>

        {mensajeBote && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 mb-4 border animate-in fade-in duration-200 shadow-xs ${
              mensajeBote.tipo === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{mensajeBote.texto}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sumarBote(cantidad, concepto);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">
                Importe a Añadir (€) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Introduce cantidad"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm font-mono font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                  €
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">
                Concepto / Motivo
              </label>
              <input
                type="text"
                placeholder="Aportación, bote acumulado, etc."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardandoBote || !cantidad}
              className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-slate-900/20 transition-all duration-300 ease-out cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <Plus size={15} />
              <span>{guardandoBote ? "Añadiendo..." : "Añadir Fondos al Bote"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
