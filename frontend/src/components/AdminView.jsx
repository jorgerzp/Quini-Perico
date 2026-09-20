import React, { useState, useRef } from "react";
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
      <div className="max-w-xl mx-auto py-24 px-6 text-center">
        <div className="bg-white/40 backdrop-blur-2xl rounded-3xl p-12 border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
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

    const cleaned = line
      .replace(/^[^a-zA-ZáéíóúÁÉÍÓÚñÑ]+/, "")
      .replace(/^[A-Za-z0-9\W]{1,3}\s+/, "")
      .replace(/\s+[012M\.\,\-\s]{1,6}$/i, "")
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
    const normOriginal = normalizeStr(line);

    let best = null;
    let bestScore = 0;

    for (const eq of EQUIPOS_CONOCIDOS) {
      const normEq = normalizeStr(eq);

      if (normCleaned === normEq || normOriginal === normEq) {
        return eq;
      }

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
        const dist = levenshtein(normCleaned, normEq);
        const maxPermitido = normEq.length > 7 ? 2 : 1;
        if (dist <= maxPermitido && normEq.length > bestScore) {
          best = eq;
          bestScore = normEq.length;
        }
      }
    }

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
          cropX = Math.round(w * 0.07);
          cropY = Math.round(h * 0.14);
          cropW = Math.round(w * 0.50);
          cropH = Math.round(h * 0.74);
        }

        const scale = Math.max(2.5, Math.min(4.5, 1200 / cropW));
        canvas.width = Math.round(cropW * scale);
        canvas.height = Math.round(cropH * scale);

        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

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
      setEstadoOcrTexto("Aislando y mejorando columna de equipos...");
      const prep = await preprocessImage(imagenPreview, "auto");

      const worker = await createWorker("spa");

      setEstadoOcrTexto("Escaneando nombres de equipos en la columna...");
      const ret = await worker.recognize(prep.dataUrl);
      let texto = ret.data.text || "";

      let partidosParseados = parsearTextoQuinigol(texto);
      let numRellenados = partidosParseados.filter((p) => p.home && p.away).length;

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
        texto: "Partidos eliminados correctamente.",
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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-6 sm:px-10 py-8">
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
      <div className="space-y-6 pb-10 bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-6 sm:px-10 py-8">
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

      {/* SECCIÓN 1: ESCÁNER OCR DE FOTO DE LA JORNADA */}
      <div className="space-y-8 pb-10 bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-6 sm:px-10 py-8">
        <div>
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
              Reconocimiento Automático
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-800">
              Escáner OCR · Jornada {jornadaInput}
            </h3>
            <p className="text-sm font-medium text-stone-500 tracking-tight mt-1">
            Sube la captura oficial del boleto y el OCR extraerá los 6 enfrentamientos automáticamente.
          </p>
        </div>

        {/* Zona de Subida y Previsualización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Uploader */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-white/60 hover:border-[#cbb29b] rounded-3xl p-10 text-center cursor-pointer transition-all bg-white/30 hover:bg-white/50 flex flex-col items-center justify-center min-h-[220px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={manejarSeleccionImagen}
            />

            <p className="text-base font-semibold text-stone-800 mb-1">
              Subir foto del boleto
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
                        className="w-full px-3 py-2.5 rounded-xl bg-white/30 border border-white/50 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-1 focus:ring-[#cbb29b]"
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
                        className="w-full px-3 py-2.5 rounded-xl bg-white/30 border border-white/50 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-1 focus:ring-[#cbb29b]"
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

            <div className="flex items-center gap-3 ml-auto">
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

      <div className="space-y-8 pb-10 bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-6 sm:px-10 py-8">
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
                className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-base font-mono font-bold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#cbb29b] transition-all"
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
                className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#cbb29b] transition-all"
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
