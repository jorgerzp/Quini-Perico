import React, { useState, useEffect, useCallback, useMemo } from "react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";
import { TeamName } from "../utils/teamUtils";
import UserAvatar from "./UserAvatar";

const GOAL_OPTIONS = ["0", "1", "2", "M"];

const AVATAR_BG = {
  blue: "bg-blue-600 text-white",
  emerald: "bg-emerald-600 text-white",
  amber: "bg-amber-500 text-white",
  indigo: "bg-indigo-600 text-white",
  rose: "bg-rose-500 text-white",
  purple: "bg-purple-600 text-white",
  cyan: "bg-cyan-600 text-white",
  orange: "bg-orange-500 text-white",
  default: "bg-stone-700 text-white",
};

export default function ResultadosView({
  usuarioActivo,
  usuarios = [],
  onResultadosGuardados,
  onRefrescarUsuarios,
  partidos = null,
  numeroJornada = 7,
}) {
  const hayPartidos = Array.isArray(partidos) && partidos.length === 6 && partidos.every((p) => p.home && p.away);
  const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";

  const [resultados, setResultados] = useState({
    partido1: { local: null, visitante: null },
    partido2: { local: null, visitante: null },
    partido3: { local: null, visitante: null },
    partido4: { local: null, visitante: null },
    partido5: { local: null, visitante: null },
    partido6: { local: null, visitante: null },
  });

  const [disponible, setDisponible] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [tipoMensaje, setTipoMensaje] = useState("info");
  const [desglose, setDesglose] = useState(null);
  const [jugadasBackend, setJugadasBackend] = useState([]);
  const [modoVista, setModoVista] = useState("comparativa"); // 'comparativa' | 'por_usuario'
  const [usuarioSeleccionadoId, setUsuarioSeleccionadoId] = useState(null);
  const [mostrarEditorJorge, setMostrarEditorJorge] = useState(esJorge && !disponible);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
  const [refrescandoManual, setRefrescandoManual] = useState(false);

  // Cargar resultados y jugadas de la jornada
  const cargarResultados = useCallback(async (silencioso = false) => {
    if (!silencioso) setRefrescandoManual(true);
    try {
      const res = await fetch(`${API_URL}/api/resultados`);
      if (res.ok) {
        const data = await res.json();
        setDisponible(Boolean(data?.disponible));
        if (data?.resultados) {
          setResultados(data.resultados);
        }
        if (Array.isArray(data?.jugadasDeTodos)) {
          setJugadasBackend(data.jugadasDeTodos);
        }
        setUltimaActualizacion(new Date());
      }
    } catch (err) {
      console.error("Error al cargar resultados:", err);
    } finally {
      setCargando(false);
      if (!silencioso) {
        setTimeout(() => setRefrescandoManual(false), 400);
      }
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    cargarResultados(true);
  }, [cargarResultados]);

  // Polling automático cada 5 segundos para actualizar en vivo las apuestas que vayan llegando
  useEffect(() => {
    const timer = setInterval(() => {
      cargarResultados(true);
      if (onRefrescarUsuarios) {
        onRefrescarUsuarios();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [cargarResultados, onRefrescarUsuarios]);

  // Si cambia el usuario o el rol de Jorge
  useEffect(() => {
    if (esJorge && !disponible) {
      setMostrarEditorJorge(true);
    }
  }, [esJorge, disponible]);

  // Consolidar la lista de todos los participantes y su estado de apuesta para esta jornada
  const listaParticipantes = useMemo(() => {
    const ordenOficial = ["Jorge", "Rafa", "Miguel", "Acuña", "Andrés", "Mora", "Vergara", "Ale"];
    
    // Obtener lista base de usuarios
    const base = (usuarios && usuarios.length > 0)
      ? [...usuarios]
      : ordenOficial.map((nom, idx) => ({ id: idx + 1, nombre: nom, avatarColor: "blue" }));

    // Ordenar según el orden oficial
    base.sort((a, b) => {
      const idxA = ordenOficial.indexOf(a.nombre);
      const idxB = ordenOficial.indexOf(b.nombre);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.nombre.localeCompare(b.nombre);
    });

    return base.map((u) => {
      // Buscar jugada en las del backend o en el usuario
      const jugadaBack = jugadasBackend.find((j) => j.usuarioId === u.id || j.usuarioNombre?.toLowerCase() === u.nombre?.toLowerCase());
      const tieneJugada = Boolean(
        jugadaBack?.pronosticos ||
        (u.haJugado && u.jugadaActual && (!u.jornadaActualNumero || Number(u.jornadaActualNumero) === Number(numeroJornada)))
      );

      let pronosticos = null;
      if (jugadaBack?.pronosticos) {
        pronosticos = typeof jugadaBack.pronosticos === "string" ? JSON.parse(jugadaBack.pronosticos) : jugadaBack.pronosticos;
      } else if (u.jugadaActual) {
        pronosticos = typeof u.jugadaActual === "string" ? JSON.parse(u.jugadaActual) : u.jugadaActual;
      }

      // Calcular aciertos en tiempo real si hay resultados oficiales
      let aciertosEnJornada = 0;
      if (disponible && resultados && pronosticos) {
        for (let i = 1; i <= 6; i++) {
          const k = `partido${i}`;
          const of = resultados[k];
          const pr = pronosticos[k];
          if (of && pr && of.local !== null && of.visitante !== null && pr.local !== null && pr.visitante !== null) {
            if (String(of.local).trim() === String(pr.local).trim() && String(of.visitante).trim() === String(pr.visitante).trim()) {
              aciertosEnJornada++;
            }
          }
        }
      }

      return {
        id: u.id,
        nombre: u.nombre,
        avatarColor: u.avatarColor || "blue",
        haEnviado: tieneJugada,
        pronosticos,
        aciertosEnJornada,
        fechaCreacion: jugadaBack?.fecha_creacion || null,
      };
    });
  }, [usuarios, jugadasBackend, numeroJornada, disponible, resultados]);

  // Lista de solo aquellos que ya han enviado su apuesta
  const participantesConApuesta = useMemo(() => {
    return listaParticipantes.filter((p) => p.haEnviado && p.pronosticos);
  }, [listaParticipantes]);

  // Seleccionar por defecto el primer usuario con apuesta o el usuario activo si tiene
  useEffect(() => {
    if (!usuarioSeleccionadoId && participantesConApuesta.length > 0) {
      const matchActivo = participantesConApuesta.find((p) => p.id === usuarioActivo?.id);
      if (matchActivo) {
        setUsuarioSeleccionadoId(matchActivo.id);
      } else {
        setUsuarioSeleccionadoId(participantesConApuesta[0].id);
      }
    }
  }, [usuarioSeleccionadoId, participantesConApuesta, usuarioActivo]);

  // Manejo de marcadores oficiales (Jorge Superadmin)
  const seleccionarGol = (partidoKey, equipo, gol) => {
    setResultados((prev) => {
      const valorActual = prev[partidoKey]?.[equipo];
      return {
        ...prev,
        [partidoKey]: {
          ...prev[partidoKey],
          [equipo]: valorActual === gol ? null : gol, // Permite desmarcar si pulsa el mismo
        },
      };
    });
    setMensaje(null);
  };

  const limpiarPartido = (partidoKey) => {
    setResultados((prev) => ({
      ...prev,
      [partidoKey]: { local: null, visitante: null },
    }));
    setMensaje(null);
  };

  const autocompletarResultados = () => {
    const auto = {};
    partidos.forEach((p) => {
      auto[p.key] = {
        local: GOAL_OPTIONS[Math.floor(Math.random() * GOAL_OPTIONS.length)],
        visitante: GOAL_OPTIONS[Math.floor(Math.random() * GOAL_OPTIONS.length)],
      };
    });
    setResultados(auto);
    setMensaje(null);
  };

  // Función para determinar el estado de un partido específico
  const getEstadoPartido = useCallback(
    (partidoKey) => {
      const p = resultados[partidoKey];
      const tieneLocal = p?.local !== null && p?.local !== undefined && String(p?.local).trim() !== "" && String(p?.local).trim() !== "-";
      const tieneVis = p?.visitante !== null && p?.visitante !== undefined && String(p?.visitante).trim() !== "" && String(p?.visitante).trim() !== "-";
      if (tieneLocal && tieneVis) return "finalizado";
      if (tieneLocal || tieneVis) return "incompleto";
      return "pendiente";
    },
    [resultados]
  );

  const partidosFinalizadosCount = useMemo(() => {
    let count = 0;
    for (let i = 1; i <= 6; i++) {
      if (getEstadoPartido(`partido${i}`) === "finalizado") count++;
    }
    return count;
  }, [resultados, getEstadoPartido]);

  const hayPartidosIncompletos = useMemo(() => {
    for (let i = 1; i <= 6; i++) {
      if (getEstadoPartido(`partido${i}`) === "incompleto") return true;
    }
    return false;
  }, [resultados, getEstadoPartido]);

  const estaCompleto = partidosFinalizadosCount === 6;

  const reiniciarResultadosServidor = async () => {
    try {
      const res = await fetch(`${API_URL}/api/resultados/reset`, { method: "POST" });
      if (res.ok) {
        setResultados({
          partido1: { local: null, visitante: null },
          partido2: { local: null, visitante: null },
          partido3: { local: null, visitante: null },
          partido4: { local: null, visitante: null },
          partido5: { local: null, visitante: null },
          partido6: { local: null, visitante: null },
        });
        setDisponible(false);
        setTipoMensaje("info");
        setMensaje("Resultados oficiales retirados y clasificación reajustada.");
        if (onResultadosGuardados) onResultadosGuardados();
        cargarResultados(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const guardarYCalcular = async () => {
    if (hayPartidosIncompletos) {
      setTipoMensaje("error");
      setMensaje("Hay algún partido con marcador incompleto (falta el local o el visitante). Rellena ambos goles o deselecciónalo.");
      return;
    }

    if (partidosFinalizadosCount === 0) {
      setTipoMensaje("error");
      setMensaje("Debes rellenar los goles de al menos 1 partido finalizado para guardar.");
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const res = await fetch(`${API_URL}/api/resultados`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resultados }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar resultados.");

      setDisponible(true);
      setTipoMensaje("success");
      setMensaje(data.message || `Marcadores guardados en directo (${partidosFinalizadosCount} de 6 finalizados). ¡Clasificación actualizada!`);
      setDesglose(data.desglose || []);

      confetti({
        particleCount: partidosFinalizadosCount === 6 ? 90 : 50,
        spread: 65,
        origin: { y: 0.6 },
      });

      if (onResultadosGuardados) {
        onResultadosGuardados();
      }
      cargarResultados(true);
    } catch (err) {
      setTipoMensaje("error");
      setMensaje(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="py-24 text-center text-sm text-stone-400 font-medium">
        Cargando estado de la jornada...
      </div>
    );
  }

  // CASO: NO HAY PARTIDOS CONFIGURADOS EN LA JORNADA
  if (!hayPartidos) {
    return (
      <div className="max-w-2xl py-12 sm:py-20 animate-in fade-in duration-300 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-8 sm:px-12">
        <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-3">
          JORNADA {numeroJornada} · ESTADO
        </span>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-stone-800">
          Aún no hay quinigol para la Jornada {numeroJornada}
        </h2>
        <p className="text-base text-stone-500 font-normal mt-4 leading-relaxed max-w-lg">
          {esJorge
            ? `Primero debes introducir los partidos de la Jornada ${numeroJornada} en el Panel Superadmin.`
            : `Jorge aún no ha configurado los partidos de la Jornada ${numeroJornada}.`}
        </p>
      </div>
    );
  }

  const usuarioSeleccionadoObj = participantesConApuesta.find(
    (p) => p.id === usuarioSeleccionadoId
  ) || participantesConApuesta[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-28 animate-in fade-in duration-300">
      
      {/* CABECERA PRINCIPAL: RESULTADOS Y SEGUIMIENTO EN VIVO */}
      <section className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
                JORNADA {numeroJornada} · SEGUIMIENTO EN VIVO
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En directo
              </span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tighter text-stone-800 leading-tight">
              Resultados y Apuestas
            </h2>

            <p className="text-sm sm:text-base text-stone-500 font-normal mt-2 max-w-xl">
              Marcadores oficiales y quinigols enviados por todos los miembros de la peña en tiempo real.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
            {/* Estado de Marcadores Oficiales */}
            <div className="flex items-center gap-2">
              {estaCompleto ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Jornada Finalizada (6/6 oficiales)
                </span>
              ) : partidosFinalizadosCount > 0 ? (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 border border-emerald-400/50 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  En directo ({partidosFinalizadosCount} de 6 finalizados)
                </span>
              ) : (
                <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-800 border border-amber-300/40 shadow-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  Marcadores Pendientes (0/6)
                </span>
              )}
            </div>

            {/* Contador de Apuestas y Botón de Refresco */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-medium text-stone-500">
                Actualizado {ultimaActualizacion.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>

              <button
                type="button"
                onClick={() => {
                  cargarResultados();
                  if (onRefrescarUsuarios) onRefrescarUsuarios();
                }}
                disabled={refrescandoManual}
                className="px-4 py-2 rounded-full bg-white/40 hover:bg-white/70 border border-white/60 text-stone-700 text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 hover-negro-brillante shadow-2xs"
                title="Actualizar apuestas en vivo ahora"
              >
                <svg
                  className={`w-3.5 h-3.5 text-stone-600 ${refrescandoManual ? "animate-spin" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{refrescandoManual ? "Refrescando..." : "Actualizar"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Fila Resumen de Estado de la Peña (8 miembros) */}
        <div className="mt-8 pt-6 border-t border-white/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
              Apuestas selladas:
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold font-mono bg-stone-900 text-white shadow-xs">
              {participantesConApuesta.length} de {listaParticipantes.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {listaParticipantes.map((p) => {
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    p.haEnviado
                      ? "bg-white/60 border border-white/80 text-stone-800 shadow-2xs"
                      : "bg-white/20 border border-white/30 text-stone-400 opacity-60"
                  }`}
                  title={p.haEnviado ? `${p.nombre} ya ha sellado su apuesta` : `${p.nombre} aún no ha enviado su apuesta`}
                >
                  <UserAvatar
                    nombre={p.nombre}
                    avatarColor={p.avatarColor}
                    className="w-5 h-5 rounded-full"
                    fallbackClassName="text-[9px] font-black"
                  />
                  <span>{p.nombre}</span>
                  {p.haEnviado ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-stone-400 text-[10px]">···</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECCIÓN JORGE SUPERADMIN: EDITAR Y PUBLICAR RESULTADOS OFICIALES */}
      {esJorge && (
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/40">
            <div>
              <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-1">
                SUPERADMIN · CONTROL
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-800">
                Marcadores Oficiales de la Jornada {numeroJornada}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarEditorJorge(!mostrarEditorJorge)}
                className="bg-white/40 border border-white/60 hover:bg-white/70 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 transition-all cursor-pointer hover-negro-brillante"
              >
                {mostrarEditorJorge ? "Ocultar Editor" : "Abrir Editor de Resultados"}
              </button>

              {disponible && (
                <button
                  type="button"
                  onClick={reiniciarResultadosServidor}
                  className="text-xs font-semibold tracking-wider uppercase text-rose-600 hover:text-rose-800 transition-colors cursor-pointer px-2 py-2"
                >
                  Retirar Resultados
                </button>
              )}
            </div>
          </div>

          {mostrarEditorJorge && (
            <div className="space-y-6 pt-2 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-sm text-stone-500 font-medium">
                  Introduce los goles finales de cada equipo. Al pulsar publicar, se calcularán y sumarán los aciertos de toda la peña.
                </p>

                <button
                  type="button"
                  onClick={autocompletarResultados}
                  className="bg-white/40 border border-white/60 hover:bg-white/70 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider text-stone-700 transition-all cursor-pointer"
                >
                  Llenar Azar
                </button>
              </div>

              {mensaje && (
                <div
                  className={`p-4 rounded-2xl text-xs font-semibold tracking-wide uppercase transition-all backdrop-blur-xl ${
                    tipoMensaje === "success"
                      ? "bg-white/60 border border-emerald-300 text-stone-800"
                      : "bg-white/40 border border-rose-300 text-rose-700"
                  }`}
                >
                  <span>{mensaje}</span>
                </div>
              )}

              {/* Selector de goles para cada uno de los 6 partidos */}
              <div className="space-y-4">
                {partidos.map((partido, idx) => {
                  const res = resultados[partido.key] || { local: null, visitante: null };
                  const estadoPart = getEstadoPartido(partido.key);
                  const tieneMarcador = res.local !== null || res.visitante !== null;

                  return (
                    <div
                      key={partido.id || idx}
                      className={`py-5 px-6 sm:px-8 backdrop-blur-md rounded-2xl border transition-all ${
                        estadoPart === "finalizado"
                          ? "bg-white/60 border-emerald-400/60 shadow-[0_4px_16px_rgba(16,185,129,0.08)]"
                          : estadoPart === "incompleto"
                          ? "bg-amber-500/10 border-amber-300/70"
                          : "bg-white/40 border-white/60"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold font-mono tracking-widest text-stone-400 uppercase">
                            PARTIDO {String(idx + 1).padStart(2, "0")}
                          </span>
                          {estadoPart === "finalizado" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span>✓</span> Finalizado ({res.local} - {res.visitante})
                            </span>
                          )}
                          {estadoPart === "incompleto" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                              Marcador incompleto
                            </span>
                          )}
                          {estadoPart === "pendiente" && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white/40 text-stone-500 border border-stone-200">
                              En juego / Pendiente
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {tieneMarcador && (
                            <button
                              type="button"
                              onClick={() => limpiarPartido(partido.key)}
                              className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 hover:text-rose-600 transition-colors cursor-pointer px-2 py-0.5 rounded-md hover:bg-rose-50"
                              title="Limpiar marcador de este partido"
                            >
                              Limpiar
                            </button>
                          )}
                          <span className="text-xs font-mono font-medium text-stone-400 uppercase">
                            OFICIAL
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center">
                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <TeamName name={partido.home} />
                          <div className="flex items-center gap-1.5 shrink-0">
                            {GOAL_OPTIONS.map((gol) => {
                              const sel = res.local === gol;
                              return (
                                <button
                                  key={gol}
                                  type="button"
                                  id={`admin-res-${idx + 1}-h-${gol}`}
                                  onClick={() => seleccionarGol(partido.key, "local", gol)}
                                  className={`font-mono text-sm cursor-pointer flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 ${
                                    sel
                                      ? "bg-gradient-to-b from-neutral-900 to-black text-white font-bold rounded-xl shadow-md border border-white/20 scale-105"
                                      : "bg-white/50 border border-white/60 text-stone-600 font-medium rounded-xl hover:bg-white/80"
                                  } transition-all duration-200`}
                                >
                                  {gol}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-3 min-w-0">
                          <TeamName name={partido.away} />
                          <div className="flex items-center gap-1.5 shrink-0">
                            {GOAL_OPTIONS.map((gol) => {
                              const sel = res.visitante === gol;
                              return (
                                <button
                                  key={gol}
                                  type="button"
                                  id={`admin-res-${idx + 1}-a-${gol}`}
                                  onClick={() => seleccionarGol(partido.key, "visitante", gol)}
                                  className={`font-mono text-sm cursor-pointer flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 ${
                                    sel
                                      ? "bg-gradient-to-b from-neutral-900 to-black text-white font-bold rounded-xl shadow-md border border-white/20 scale-105"
                                      : "bg-white/50 border border-white/60 text-stone-600 font-medium rounded-xl hover:bg-white/80"
                                  } transition-all duration-200`}
                                >
                                  {gol}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Resumen Anónimo de Apuestas de la Peña en este partido */}
                      {(() => {
                        const conteo = {};
                        (participantesConApuesta || []).forEach((part) => {
                          const p = part.pronosticos?.[partido.key];
                          if (p && p.local !== null && p.visitante !== null && p.local !== undefined && p.visitante !== undefined) {
                            const l = String(p.local).trim();
                            const v = String(p.visitante).trim();
                            if (l !== "" && v !== "" && l !== "-" && v !== "-") {
                              const comb = `${l} - ${v}`;
                              conteo[comb] = (conteo[comb] || 0) + 1;
                            }
                          }
                        });
                        const lista = Object.entries(conteo).map(([res, cant]) => ({ res, cant })).sort((a, b) => b.cant - a.cant);
                        const total = lista.reduce((a, c) => a + c.cant, 0);

                        return lista.length > 0 ? (
                          <div className="mt-3.5 pt-2.5 border-t border-white/40 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              Ya apostados por la peña (anónimo · {total}):
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {lista.map(({ res, cant }, rIdx) => (
                                <span
                                  key={rIdx}
                                  className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-white/60 border border-white/80 text-stone-700 shadow-2xs"
                                >
                                  {res} {cant > 1 ? `(×${cant})` : ""}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 text-center">
                <button
                  type="button"
                  id="btn-publicar-resultados-admin"
                  disabled={guardando || partidosFinalizadosCount === 0 || hayPartidosIncompletos}
                  onClick={guardarYCalcular}
                  className={`w-full max-w-lg mx-auto py-4 px-10 rounded-full text-base font-semibold tracking-tight transition-all ${
                    partidosFinalizadosCount > 0 && !hayPartidosIncompletos
                      ? "bg-stone-800 text-white shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 cursor-pointer"
                      : "bg-white/30 border border-white/50 text-stone-400 cursor-not-allowed"
                  }`}
                >
                  {guardando
                    ? "Guardando resultados..."
                    : estaCompleto
                    ? "Guardar y Publicar Jornada Completa (6/6)"
                    : `Guardar Resultados en Directo (${partidosFinalizadosCount} de 6 finalizados)`}
                </button>
                <p className="text-xs text-stone-500 font-medium tracking-tight mt-2.5">
                  {partidosFinalizadosCount === 0
                    ? "Selecciona los resultados de los partidos que ya hayan finalizado para actualizar la clasificación en vivo."
                    : hayPartidosIncompletos
                    ? "Hay algún partido con marcador incompleto. Completa ambos goles o pulsa 'Limpiar' en ese partido para guardar."
                    : estaCompleto
                    ? "Los 6 partidos tienen marcador oficial. Se actualizará la clasificación general con la jornada cerrada."
                    : `Puedes guardar ahora con ${partidosFinalizadosCount} partido(s) finalizados. Se computarán los aciertos y la clasificación se actualizará al instante para toda la peña.`}
                </p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* SECCIÓN RESUMEN DE MARCADORES OFICIALES (MODO LECTURA SI ESTÁN PUBLICADOS) */}
      {disponible && (
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:px-10 sm:py-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div>
              <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-1">
                OFICIAL
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-800">
                Marcadores Oficiales de la Jornada
              </h3>
            </div>
            {estaCompleto ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Jornada Completada (6/6)
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-900 border border-emerald-400/50 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                En Directo ({partidosFinalizadosCount} de 6 finalizados)
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {partidos.map((partido, idx) => {
              const res = resultados[partido.key] || { local: "-", visitante: "-" };
              const finalizado = getEstadoPartido(partido.key) === "finalizado";

              return (
                <div
                  key={partido.id || idx}
                  className={`p-4 backdrop-blur-md border rounded-2xl flex items-center justify-between gap-3 transition-all ${
                    finalizado
                      ? "bg-white/70 border-emerald-300/80 shadow-xs"
                      : "bg-white/30 border-white/50 opacity-70"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">
                        P{idx + 1}
                      </span>
                      {finalizado ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Finalizado
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-stone-100 text-stone-500 border border-stone-200">
                          En juego
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-stone-800 truncate mt-1" title={`${partido.home} vs ${partido.away}`}>
                      {partido.home} <span className="text-stone-400 font-normal">v</span> {partido.away}
                    </p>
                  </div>

                  <div className={`font-mono text-lg font-black shrink-0 px-2.5 py-1 rounded-xl border ${
                    finalizado
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-white/50 text-stone-400 border-white/60"
                  }`}>
                    <span>{finalizado ? res.local : "-"}</span>
                    <span className={finalizado ? "text-stone-400 mx-1" : "text-stone-300 mx-1"}>·</span>
                    <span>{finalizado ? res.visitante : "-"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* SECCIÓN PRINCIPAL: APUESTAS ENVIADAS POR LA PEÑA */}
      <section className="space-y-6">
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:px-10 sm:py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-1">
                TODOS LOS PRONÓSTICOS
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-800">
                Apuestas de la Peña
              </h3>
              <p className="text-sm text-stone-500 font-medium mt-1">
                Consulta los resultados que ha apostado cada miembro de la peña para esta jornada.
              </p>
            </div>

            {/* Selector de Modo de Vista */}
            <div className="flex items-center bg-white/40 p-1.5 rounded-2xl border border-white/60 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setModoVista("comparativa")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  modoVista === "comparativa"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900 hover:bg-white/30"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Comparativa por Partido</span>
              </button>

              <button
                type="button"
                onClick={() => setModoVista("por_usuario")}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                  modoVista === "por_usuario"
                    ? "bg-stone-900 text-white shadow-xs"
                    : "text-stone-500 hover:text-stone-900 hover:bg-white/30"
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Boleto por Miembro</span>
              </button>
            </div>
          </div>

          {/* Selector de Chips de Miembros */}
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-400 mr-1">
              Participantes:
            </span>

            {listaParticipantes.map((p) => {
              const estaSeleccionado = modoVista === "por_usuario" && usuarioSeleccionadoId === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (p.haEnviado) {
                      setUsuarioSeleccionadoId(p.id);
                      setModoVista("por_usuario");
                    }
                  }}
                  disabled={!p.haEnviado}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
                    !p.haEnviado
                      ? "bg-white/10 text-stone-400 border border-white/20 opacity-50 cursor-not-allowed"
                      : estaSeleccionado
                      ? "bg-stone-900 text-white shadow-md border border-white/30 scale-105"
                      : "bg-white/40 hover:bg-white/70 text-stone-700 border border-white/60 hover-negro-brillante cursor-pointer"
                  }`}
                >
                  <UserAvatar
                    nombre={p.nombre}
                    avatarColor={p.avatarColor}
                    className="w-5 h-5 rounded-full"
                    fallbackClassName="text-[10px] font-black"
                  />
                  <span>{p.nombre}</span>

                  {p.haEnviado ? (
                    disponible ? (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                        estaSeleccionado ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 font-bold"
                      }`}>
                        {p.aciertosEnJornada} ac.
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-500 font-bold">✓</span>
                    )
                  ) : (
                    <span className="text-[10px] text-stone-400">Pendiente</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CASO: AÚN NADIE HA ENVIADO SU APUESTA */}
        {participantesConApuesta.length === 0 ? (
          <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-900/10 text-stone-700 mx-auto flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold tracking-tight text-stone-800">
              Aún no hay apuestas enviadas para la Jornada {numeroJornada}
            </h4>
            <p className="text-sm text-stone-500 max-w-md mx-auto leading-relaxed">
              En cuanto Ale, Rafa, Miguel o cualquier miembro de la peña selle su quinigol, aparecerá aquí de inmediato para que todos podáis ver qué ha apostado cada uno.
            </p>
          </div>
        ) : modoVista === "comparativa" ? (
          
          /* ============================================================== */
          /* MODO VISTA 1: COMPARATIVA PARTIDO A PARTIDO (MATRIZ GLOBAL)   */
          /* ============================================================== */
          <div className="space-y-4">
            {partidos.map((partido, idx) => {
              const resOficial = resultados[partido.key] || { local: null, visitante: null };
              const hayOficialValido = disponible && getEstadoPartido(partido.key) === "finalizado";

              return (
                <div
                  key={partido.id || idx}
                  className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:p-8 space-y-5 transition-all"
                >
                  {/* Encabezado del Partido */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/40">
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="text-xs font-mono font-bold tracking-widest text-stone-400 uppercase shrink-0">
                        PARTIDO {String(idx + 1).padStart(2, "0")}
                      </span>
                      <h4 className="text-lg sm:text-xl font-bold tracking-tight text-stone-800 break-words leading-snug">
                        {partido.home} <span className="text-stone-400 font-normal mx-1">vs</span> {partido.away}
                      </h4>
                    </div>

                    {/* Marcador Oficial del Partido si existe */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-stone-400">
                        Oficial:
                      </span>
                      {hayOficialValido ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
                            Finalizado
                          </span>
                          <div className="font-mono text-base font-extrabold text-stone-900 bg-white/70 border border-white/90 px-3 py-1 rounded-xl shadow-xs">
                            <span>{resOficial.local}</span>
                            <span className="text-stone-300 mx-1">·</span>
                            <span>{resOficial.visitante}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-stone-500 bg-white/40 px-2.5 py-1 rounded-xl border border-white/50">
                          En juego / Pendiente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resultados apostados por cada miembro que ya envió su quinigol */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 block mb-3">
                      Pronósticos de los Miembros ({participantesConApuesta.length}):
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {participantesConApuesta.map((participante) => {
                        const pred = participante.pronosticos?.[partido.key] || { local: "-", visitante: "-" };
                        const acierta = hayOficialValido &&
                          String(pred.local).trim() === String(resOficial.local).trim() &&
                          String(pred.visitante).trim() === String(resOficial.visitante).trim();

                        return (
                          <div
                            key={participante.id}
                            className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                              acierta
                                ? "bg-emerald-500/15 border-emerald-400/80 shadow-[0_4px_16px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/50"
                                : "bg-white/40 border-white/60 shadow-2xs hover:bg-white/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <UserAvatar
                                nombre={participante.nombre}
                                avatarColor={participante.avatarColor}
                                className="w-7 h-7 rounded-full shadow-2xs"
                                fallbackClassName="text-xs font-black"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-stone-800 truncate leading-tight">
                                  {participante.nombre}
                                </p>
                                {acierta ? (
                                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight flex items-center gap-0.5">
                                    <span>✓</span> Acertado
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-stone-400 font-mono">
                                    Pronóstico
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className={`font-mono text-base font-extrabold px-2.5 py-1 rounded-xl shrink-0 ${
                              acierta
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white/70 text-stone-800 border border-white/80"
                            }`}>
                              <span>{pred.local ?? "-"}</span>
                              <span className={acierta ? "text-emerald-300 mx-1" : "text-stone-300 mx-1"}>·</span>
                              <span>{pred.visitante ?? "-"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        ) : (

          /* ============================================================== */
          /* MODO VISTA 2: BOLETO DETALLADO POR MIEMBRO                     */
          /* ============================================================== */
          usuarioSeleccionadoObj && (
            <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:p-10 space-y-6">
              
              {/* Tarjeta de Encabezado del Miembro */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/40">
                <div className="flex items-center gap-4">
                  <UserAvatar
                    nombre={usuarioSeleccionadoObj.nombre}
                    avatarColor={usuarioSeleccionadoObj.avatarColor}
                    className="w-14 h-14 rounded-2xl shadow-md"
                    imgClassName="w-full h-full object-cover rounded-2xl"
                    fallbackClassName="text-2xl font-black"
                  />

                  <div>
                    <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-0.5 font-mono">
                      BOLETO SELLADO · JORNADA {numeroJornada}
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-800">
                      Apuesta de {usuarioSeleccionadoObj.nombre}
                    </h3>
                    <p className="text-xs text-stone-500 font-medium mt-0.5">
                      {usuarioSeleccionadoObj.fechaCreacion
                        ? `Registrada el ${new Date(usuarioSeleccionadoObj.fechaCreacion).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Apuesta oficial guardada en el sistema"}
                    </p>
                  </div>
                </div>

                {disponible && (
                  <div className="bg-white/50 border border-white/70 px-5 py-3 rounded-2xl flex items-center gap-3 shrink-0 shadow-xs">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      {estaCompleto ? "Aciertos Oficiales:" : "Aciertos en Directo:"}
                    </span>
                    <span className="font-mono text-xl sm:text-2xl font-black text-stone-900 bg-stone-900 text-white px-3 py-0.5 rounded-xl">
                      {usuarioSeleccionadoObj.aciertosEnJornada} {estaCompleto ? "/ 6" : `(${partidosFinalizadosCount} finalizados)`}
                    </span>
                  </div>
                )}
              </div>

              {/* Los 6 Partidos del Boleto del Miembro */}
              <div className="space-y-3.5">
                {partidos.map((partido, idx) => {
                  const pred = usuarioSeleccionadoObj.pronosticos?.[partido.key] || { local: "-", visitante: "-" };
                  const resOficial = resultados[partido.key] || { local: null, visitante: null };
                  const hayOficialValido = disponible && getEstadoPartido(partido.key) === "finalizado";
                  const acierta = hayOficialValido &&
                    String(pred.local).trim() === String(resOficial.local).trim() &&
                    String(pred.visitante).trim() === String(resOficial.visitante).trim();

                  return (
                    <div
                      key={partido.id || idx}
                      className={`p-5 sm:px-7 rounded-2xl flex items-center justify-between gap-4 border transition-all ${
                        acierta
                          ? "bg-emerald-500/15 border-emerald-400/80 shadow-[0_4px_16px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/50"
                          : "bg-white/40 border-white/60 shadow-2xs hover:bg-white/60"
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold font-mono tracking-widest text-stone-400 uppercase block mb-1">
                          PARTIDO {String(idx + 1).padStart(2, "0")}
                        </span>
                        <p className="text-base sm:text-lg font-semibold tracking-tight text-stone-800 break-words leading-snug">
                          {partido.home} <span className="text-stone-400 font-normal mx-1">vs</span> {partido.away}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 pl-2">
                        {hayOficialValido && (
                          <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] font-mono text-stone-400 uppercase">Oficial</span>
                            <span className="font-mono text-xs font-bold text-stone-600">
                              {resOficial.local} · {resOficial.visitante}
                            </span>
                          </div>
                        )}

                        <div className={`font-mono text-xl sm:text-2xl font-black px-4 py-2 rounded-2xl ${
                          acierta
                            ? "bg-emerald-600 text-white shadow-md flex items-center gap-2"
                            : "bg-white/80 text-stone-800 border border-white/90"
                        }`}>
                          <span>{pred.local ?? "-"}</span>
                          <span className={acierta ? "text-emerald-300 mx-1" : "text-stone-300 mx-1"}>·</span>
                          <span>{pred.visitante ?? "-"}</span>
                          {acierta && (
                            <span className="text-xs font-sans font-bold bg-white/20 px-1.5 py-0.5 rounded-md ml-1">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )
        )}
      </section>

    </div>
  );
}
