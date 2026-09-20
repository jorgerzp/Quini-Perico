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
        <div className="apple-card-opaque rounded-3xl p-10 border border-red-500/30">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} />
          </div>
          <h2 className="text-xl font-black text-white">Acceso Restringido</h2>
          <p className="text-sm text-slate-400 mt-2">
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

  // Parser heurístico avanzado para extraer los 6 partidos del texto de la foto
  const parsearTextoQuinigol = (text) => {
    if (!text || typeof text !== "string") return partidosEditables;

    const lineas = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => {
        const lower = l.toLowerCase();
        if (l.length < 2) return false;
        if (lower.includes("quinigol") || lower.includes("loterias") || lower.includes("apuestas")) return false;
        if (lower.includes("pronostico") || lower.includes("fecha") || lower.includes("domingo") || lower.includes("sabado")) return false;
        return true;
      });

    const partidosEncontrados = [];

    // Estrategia 1: Líneas que empiezan con número 1 al 6
    // Ej: "1. Real Madrid - Barcelona", "1 Barcelona vs Girona", "1 REAL MADRID    BARCELONA"
    const regexNumerado = /^[pP]?([1-6])[\.\-\s\:\)]+\s*([A-Za-zÁÉÍÓÚáéíóúÑñ\.\s]+?)(?:\s*[-–—vsVS/]+\s*|\s{2,}|\t)(.+)$/;

    for (const linea of lineas) {
      const match = linea.match(regexNumerado);
      if (match) {
        const pNum = parseInt(match[1], 10);
        let home = match[2].trim().replace(/\d+$/, "").trim();
        let away = match[3].trim().replace(/\d+$/, "").trim();
        if (home.length > 1 && away.length > 1) {
          partidosEncontrados[pNum - 1] = { home, away };
        }
      }
    }

    // Estrategia 2: Líneas con separadores claros (" - ", " – ", " — ", " vs ", " VS ")
    const separadores = [" - ", " – ", " — ", " vs ", " VS ", " vs. ", " / "];
    for (const linea of lineas) {
      if (partidosEncontrados.filter(Boolean).length >= 6) break;

      for (const sep of separadores) {
        if (linea.includes(sep)) {
          const split = linea.split(sep);
          if (split.length >= 2) {
            let h = split[0].replace(/^[pP]?\d+[\.\-\s\:\)]+/, "").trim();
            let a = split[1].replace(/[\.\-\s\:\)]+\d+$/, "").replace(/\d+$/, "").trim();
            if (h.length > 1 && a.length > 1) {
              for (let i = 0; i < 6; i++) {
                if (!partidosEncontrados[i]) {
                  partidosEncontrados[i] = { home: h, away: a };
                  break;
                }
              }
            }
            break;
          }
        }
      }
    }

    // Estrategia 3: Búsqueda de equipos conocidos en el texto en orden de aparición
    const textoLimpio = text.replace(/[\r\n]+/g, " ");
    const equiposDetectados = [];
    for (const eq of EQUIPOS_CONOCIDOS) {
      const regex = new RegExp(`\\b${eq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
      const idx = textoLimpio.search(regex);
      if (idx !== -1) {
        equiposDetectados.push({ nombre: eq, pos: idx });
      }
    }
    equiposDetectados.sort((a, b) => a.pos - b.pos);

    // Evitar duplicados consecutivos
    const equiposUnicos = [];
    for (const eq of equiposDetectados) {
      if (!equiposUnicos.some(e => Math.abs(e.pos - eq.pos) < 3 || e.nombre.toLowerCase() === eq.nombre.toLowerCase())) {
        equiposUnicos.push(eq);
      }
    }

    // Emparejar de 2 en 2 para los huecos restantes
    let eqIdx = 0;
    for (let i = 0; i < 6; i++) {
      if (!partidosEncontrados[i] && eqIdx + 1 < equiposUnicos.length) {
        partidosEncontrados[i] = {
          home: equiposUnicos[eqIdx].nombre,
          away: equiposUnicos[eqIdx + 1].nombre,
        };
        eqIdx += 2;
      }
    }

    // Si aún faltan huecos y no se reconoció nada, conservar lo previo
    const nuevosPartidos = partidosEditables.map((p, idx) => {
      if (partidosEncontrados[idx]) {
        return {
          ...p,
          home: partidosEncontrados[idx].home || p.home,
          away: partidosEncontrados[idx].away || p.away,
        };
      }
      return p;
    });

    return nuevosPartidos;
  };

  // Ejecutar OCR en la foto seleccionada
  const ejecutarOcr = async () => {
    if (!imagenPreview) {
      setMensajePartidos({ tipo: "error", texto: "Primero selecciona o sube una foto del boleto." });
      return;
    }

    setProcesandoOcr(true);
    setProgresoOcr(0);
    setEstadoOcrTexto("Iniciando motor OCR de reconocimiento...");
    setMensajePartidos(null);

    try {
      const worker = await createWorker("spa");

      setEstadoOcrTexto("Escaneando nombres de equipos en la foto...");
      const ret = await worker.recognize(imagenPreview);
      await worker.terminate();

      const texto = ret.data.text || "";
      setTextoExtraidoRaw(texto);

      setEstadoOcrTexto("Emparejando equipos y rellenando los 6 partidos...");
      const partidosParseados = parsearTextoQuinigol(texto);

      // Rellenar los inputs editables inmediatamente
      setPartidosEditables(partidosParseados);
      setProgresoOcr(100);

      setMensajePartidos({
        tipo: "success",
        texto: "¡OCR completado! Se han leído los enfrentamientos y cargado en los 6 partidos de abajo. Revísalos o corrígelos antes de pulsar 'Guardar y Aplicar Partidos'.",
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header Superadmin */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-black tracking-wider uppercase mb-2">
            <ShieldCheck size={14} /> Panel Superadmin Jorge
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Control Maestro de la Jornada
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Escaneo OCR de fotos oficiales de boletos, partidos y gestión del bote
          </p>
        </div>

        <button
          type="button"
          onClick={onIrResultados}
          className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/20 text-xs font-black text-white hover:bg-black transition-all cursor-pointer flex items-center gap-2 shadow-md hover-black-btn"
        >
          <span>Poner Resultados Oficiales</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* CONTROL OFICIAL DE NÚMERO DE JORNADA */}
      <div className="apple-card-opaque rounded-3xl p-6 sm:p-7 border border-white/12 shadow-2xl flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex flex-col items-center justify-center font-mono shadow-lg shadow-blue-500/25 border border-white/20">
            <span className="text-[10px] font-bold text-blue-200 uppercase leading-none">JORNADA</span>
            <span className="text-2xl font-black leading-none mt-0.5">{jornadaInput}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                Jornada Oficial en Curso
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold">
                Jornada {jornadaInput}
              </span>
            </div>
            <h3 className="text-xl font-black text-white">
              Edición y Número de la Jornada
            </h3>
            <p className="text-xs text-slate-400">
              Actualmente se muestra la <strong>Jornada {jornadaInput}</strong> a toda la peña. Puedes cambiarla o avanzar a la siguiente cuando toque.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={guardandoJornada}
            onClick={() => guardarNumeroJornada(Number(jornadaInput) + 1)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/20 text-xs font-bold text-white hover:bg-black transition-all cursor-pointer flex items-center gap-2 hover-black-btn disabled:opacity-50"
          >
            <span>+1 Avanzar a Jornada {Number(jornadaInput) + 1}</span>
          </button>

          <div className="flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-xl border border-white/15">
            <span className="text-xs text-slate-400 font-bold">Nº:</span>
            <input
              type="number"
              min="1"
              value={jornadaInput}
              onChange={(e) => setJornadaInput(e.target.value)}
              className="w-16 px-2 py-1 rounded-lg bg-black text-white text-xs font-mono font-bold text-center border border-white/15 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              disabled={guardandoJornada}
              onClick={() => guardarNumeroJornada(jornadaInput)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-black transition-all cursor-pointer hover-black-btn disabled:opacity-50"
            >
              {guardandoJornada ? "Guardando..." : "Fijar"}
            </button>
          </div>
        </div>

        {mensajeJornada && (
          <div
            className={`w-full p-3 rounded-xl text-xs font-bold flex items-center gap-2 border animate-in fade-in duration-200 ${
              mensajeJornada.tipo === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/80 border-red-500/40 text-red-300"
            }`}
          >
            <CheckCircle2 size={15} />
            <span>{mensajeJornada.texto}</span>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: ESCÁNER OCR DE FOTO DE LA JORNADA */}
      <div className="apple-card-opaque rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/12">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 border border-white/20">
              <Scan size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Escáner OCR: Foto de la Jornada {jornadaInput}
              </h3>
              <p className="text-xs text-slate-400">
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
            className="border-2 border-dashed border-white/20 hover:border-blue-400/60 rounded-3xl p-8 text-center cursor-pointer transition-all bg-black/40 hover:bg-black/60 group flex flex-col items-center justify-center min-h-[220px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={manejarSeleccionImagen}
            />

            <div className="w-14 h-14 rounded-2xl bg-white/10 group-hover:bg-blue-600/30 flex items-center justify-center text-slate-300 group-hover:text-blue-300 transition-colors mb-3 border border-white/10">
              <Upload size={24} />
            </div>

            <p className="text-sm font-bold text-white group-hover:text-blue-200">
              Arrastra o haz clic para subir foto del boleto
            </p>
            <p className="text-xs text-slate-400 mt-1">
              JPG, PNG o foto tomada con la cámara
            </p>
          </div>

          {/* Preview y Acción de Escaneo */}
          <div className="apple-card-inner rounded-3xl p-5 border border-white/10 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            {imagenPreview ? (
              <div className="w-full space-y-4">
                <div className="relative rounded-2xl overflow-hidden max-h-48 border border-white/20 shadow-md">
                  <img
                    src={imagenPreview}
                    alt="Foto Jornada"
                    className="w-full h-full object-cover"
                  />
                  {procesandoOcr && (
                    <div className="absolute inset-0 bg-blue-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
                      <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-xs font-bold text-center">{estadoOcrTexto}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={procesandoOcr}
                    onClick={ejecutarOcr}
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-600 border border-blue-400/30 text-white text-xs font-black tracking-wide shadow-lg hover:bg-black transition-all cursor-pointer flex items-center justify-center gap-2 hover-black-btn disabled:opacity-50"
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
                    className="p-3 rounded-xl bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-black transition cursor-pointer"
                    title="Quitar foto"
                  >
                    <RotateCcw size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-slate-500">
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
            className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 mb-6 border animate-in fade-in duration-200 ${
              mensajePartidos.tipo === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/80 border-red-500/40 text-red-300"
            }`}
          >
            {mensajePartidos.tipo === "success" ? (
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 text-red-400" />
            )}
            <span>{mensajePartidos.texto}</span>
          </div>
        )}

        {/* Partidos Extraídos / Editables (Confirmar antes de Guardar) */}
        <div id="seccion-partidos-editables" className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <h4 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText size={18} className="text-blue-400" />
                Revisar y Confirmar los 6 Partidos de la Jornada {jornadaInput}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Los equipos leídos con el OCR se rellenan aquí. Puedes corregir cualquier nombre antes de aplicar.
              </p>
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono font-bold">
              6 Enfrentamientos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {partidosEditables.map((partido, idx) => {
              const completado = Boolean(partido.home && partido.away);
              return (
                <div
                  key={partido.id || idx}
                  className={`apple-card-inner rounded-2xl p-4 border transition-all ${
                    completado ? "border-emerald-500/40 bg-emerald-950/20" : "border-white/10"
                  } hover-black-card`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-black text-blue-400 font-mono font-black text-[11px] border border-white/10">
                      PARTIDO 0{idx + 1}
                    </span>
                    {completado ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                        <Check size={12} /> Confirmado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Por rellenar</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Local */}
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Local</label>
                      <input
                        type="text"
                        value={partido.home}
                        onChange={(e) => actualizarEquipo(idx, "home", e.target.value)}
                        placeholder={`Equipo Local 0${idx + 1}`}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
                      />
                    </div>

                    <span className="text-[10px] font-black text-blue-400 px-1.5 py-1 rounded bg-blue-950/60 border border-blue-500/30 mt-4">
                      VS
                    </span>

                    {/* Visitante */}
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Visitante</label>
                      <input
                        type="text"
                        value={partido.away}
                        onChange={(e) => actualizarEquipo(idx, "away", e.target.value)}
                        placeholder={`Equipo Visitante 0${idx + 1}`}
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-inner"
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
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                {mostrarTextoRaw ? "Ocultar texto OCR en bruto" : "Ver texto OCR reconocido"}
              </button>
            ) : (
              <span className="text-xs text-slate-500">Revisa los nombres antes de guardar</span>
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={reiniciarPartidos}
                disabled={guardandoPartidos}
                className="px-4 py-3.5 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 hover:bg-black hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer hover-black-btn disabled:opacity-50"
              >
                <RotateCcw size={14} />
                <span>Vaciar Partidos</span>
              </button>

              <button
                type="button"
                id="btn-guardar-partidos-ocr"
                disabled={guardandoPartidos}
                onClick={guardarPartidosEnServidor}
                className="px-6 py-3.5 rounded-xl bg-emerald-600 border border-emerald-400/40 text-white font-black text-xs tracking-wider uppercase shadow-xl hover:bg-black transition-all cursor-pointer flex items-center gap-2 hover-black-btn disabled:opacity-50"
              >
                <Save size={16} />
                <span>{guardandoPartidos ? "Guardando..." : `Guardar y Aplicar Partidos (Jornada ${jornadaInput})`}</span>
              </button>
            </div>
          </div>

          {/* Desglose texto crudo OCR si se solicita */}
          {mostrarTextoRaw && (
            <div className="mt-4 p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {textoExtraidoRaw}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 2: GESTIÓN DEL BOTE POR JORGE (SIN DATOS DE EJEMPLO) */}
      <div className="apple-card-opaque rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/12">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 border border-white/20">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Gestión del Bote por Jorge
              </h3>
              <p className="text-xs text-slate-400">
                Añade fondos o ganancias directamente al bote acumulado de la peña
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={reiniciarBoteACero}
            disabled={guardandoBote}
            className="px-4 py-2.5 rounded-xl bg-red-950/70 border border-red-500/30 text-red-300 hover:bg-black hover:text-white transition-all text-xs font-bold flex items-center gap-2 cursor-pointer hover-black-btn disabled:opacity-50"
          >
            <RotateCcw size={14} />
            <span>Poner Bote a 0.00 €</span>
          </button>
        </div>

        {mensajeBote && (
          <div
            className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 border ${
              mensajeBote.tipo === "success"
                ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
                : "bg-red-950/80 border-red-500/40 text-red-300"
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
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
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
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-sm font-mono font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                  €
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Concepto / Motivo
              </label>
              <input
                type="text"
                placeholder="Aportación, bote acumulado, etc."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/15 text-xs font-bold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-inner"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardandoBote || !cantidad}
              className="px-6 py-3 rounded-xl bg-amber-600 border border-amber-400/40 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-600/30 hover:bg-black transition-all cursor-pointer flex items-center gap-2 hover-black-btn disabled:opacity-50"
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
