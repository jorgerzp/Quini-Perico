import React, { useState, useEffect } from "react";
import {
  CheckSquare,
  Sparkles,
  Trophy,
  AlertCircle,
  Clock,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Send,
} from "lucide-react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";

const GOAL_OPTIONS = ["0", "1", "2", "M"];

export default function ResultadosView({
  usuarioActivo,
  onResultadosGuardados,
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

  const cargarResultados = async () => {
    try {
      const res = await fetch(`${API_URL}/api/resultados`);
      const data = await res.json();
      setDisponible(Boolean(data?.disponible));
      if (data?.resultados) {
        setResultados(data.resultados);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResultados();
  }, []);

  if (cargando) {
    return (
      <div className="py-20 text-center text-sm text-slate-400">
        Cargando estado de la jornada...
      </div>
    );
  }

  // CASO 1: NO HAY PARTIDOS CONFIGURADOS EN LA JORNADA
  if (!hayPartidos) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
        <div className="apple-card-opaque rounded-3xl p-10 sm:p-12 shadow-2xl border border-white/12 flex flex-col items-center text-white">
          <div className="w-16 h-16 rounded-3xl bg-black/60 border border-white/10 text-slate-400 flex items-center justify-center mb-5 shadow-inner">
            <Clock size={32} />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Aún no hay quinigol para la Jornada {numeroJornada}
          </h2>

          <p className="text-sm text-slate-300 mt-2.5 max-w-sm leading-relaxed">
            {esJorge
              ? `Primero debes introducir los partidos de la Jornada ${numeroJornada} en el Panel Superadmin.`
              : `Jorge aún no ha configurado los partidos de la Jornada ${numeroJornada}.`}
          </p>

          <div className="mt-8 px-4 py-2 rounded-full bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold">
            Jornada {numeroJornada} sin partidos
          </div>
        </div>
      </div>
    );
  }

  // CASO 2: NO ES JORGE Y AÚN NO SE HAN PUBLICADO RESULTADOS
  if (!esJorge && !disponible) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
        <div className="apple-card-opaque rounded-3xl p-10 sm:p-12 shadow-2xl border border-white/12 flex flex-col items-center text-white">
          <div className="w-16 h-16 rounded-3xl bg-black/60 border border-white/10 text-slate-400 flex items-center justify-center mb-5 shadow-inner">
            <Clock size={32} />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-white">
            Resultados de la Jornada {numeroJornada} Pendientes
          </h2>

          <p className="text-sm text-slate-300 mt-2.5 max-w-sm leading-relaxed">
            Jorge aún no ha introducido los resultados oficiales de los partidos de la Jornada {numeroJornada}. Vuelve a consultar una vez finalicen los encuentros.
          </p>

          <div className="mt-8 px-4 py-2 rounded-full bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold">
            Jornada {numeroJornada} en espera de escrutinio
          </div>
        </div>
      </div>
    );
  }

  // CASO 3: NO ES JORGE PERO SÍ HAY RESULTADOS DISPONIBLES (MODO LECTURA)
  if (!esJorge && disponible) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-1.5 border border-emerald-500/30">
              <CheckCircle2 size={14} className="text-emerald-400" /> Resultados Oficiales · Jornada {numeroJornada}
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white">
              Resultados de la Jornada {numeroJornada}
            </h2>
            <p className="text-sm text-slate-400">
              Marcadores oficiales de la Jornada {numeroJornada} publicados por Jorge (Superadmin)
            </p>
          </div>
        </div>

        <div className="apple-card-opaque rounded-3xl shadow-xl border border-white/12 overflow-hidden divide-y divide-white/10">
          {partidos.map((partido, idx) => {
            const res = resultados[partido.key] || { local: "-", visitante: "-" };
            return (
              <div key={partido.id || idx} className="p-5 flex items-center justify-between gap-4 hover-black-card">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-black text-blue-400 font-mono font-black text-xs border border-white/10">
                    PARTIDO {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <span className="text-sm font-black text-white">
                      {partido.home} vs {partido.away}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-4 py-2 rounded-xl bg-black/60 border border-white/15 font-mono font-black text-base text-white shadow-inner">
                    <span className="text-blue-400">{res.local || "-"}</span>
                    <span className="text-slate-500">-</span>
                    <span className="text-indigo-400">{res.visitante || "-"}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // CASO 4: ES JORGE (SUPERADMIN) - INTRODUCIR RESULTADOS DE LOS PARTIDOS QUE ÉL CONFIGURÓ
  const seleccionarGol = (partidoKey, equipo, gol) => {
    setResultados((prev) => ({
      ...prev,
      [partidoKey]: {
        ...prev[partidoKey],
        [equipo]: gol,
      },
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

  let totalRellenados = 0;
  Object.values(resultados).forEach((p) => {
    if (p.local !== null) totalRellenados++;
    if (p.visitante !== null) totalRellenados++;
  });
  const estaCompleto = totalRellenados === 12;

  const limpiar = () => {
    const vacio = {};
    partidos.forEach((p) => {
      vacio[p.key] = { local: null, visitante: null };
    });
    setResultados(vacio);
    setMensaje(null);
    setDesglose(null);
  };

  const reiniciarResultadosServidor = async () => {
    if (!confirm("¿Deseas reiniciar los resultados de la jornada? El quinigol volverá a figurar como no disponible para los demás.")) {
      return;
    }
    try {
      await fetch(`${API_URL}/api/resultados`, { method: "DELETE" });
      setDisponible(false);
      limpiar();
      setTipoMensaje("info");
      setMensaje("Resultados reiniciados. Ahora el quinigol vuelve a figurar como no disponible.");
      if (onResultadosGuardados) onResultadosGuardados();
    } catch (err) {
      console.error(err);
    }
  };

  const guardarYCalcular = async () => {
    if (!estaCompleto) {
      setTipoMensaje("error");
      setMensaje("Debes rellenar los 12 resultados oficiales de los 6 partidos.");
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
      setMensaje("¡Resultados oficiales publicados y aciertos sumados a los participantes!");
      setDesglose(data.desglose || []);

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onResultadosGuardados) {
        onResultadosGuardados();
      }
    } catch (err) {
      setTipoMensaje("error");
      setMensaje(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-400/30">
            <ShieldCheck size={14} /> Control Exclusivo de Jorge (Superadmin) · Jornada {numeroJornada}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Poner Resultados · Jornada {numeroJornada}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Introduce los marcadores (0, 1, 2, M) para publicar y calcular los aciertos de la Jornada {numeroJornada}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={autocompletarResultados}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-white/15 text-slate-300 hover:text-white text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-sm hover-black-btn"
          >
            <Sparkles size={14} className="inline mr-1 text-blue-400" />
            Llenar Azar
          </button>

          {disponible && (
            <button
              type="button"
              onClick={reiniciarResultadosServidor}
              className="px-3.5 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-bold transition-all cursor-pointer hover-black-btn"
              title="Reiniciar y volver a no disponible"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 border animate-in fade-in duration-200 ${
            tipoMensaje === "success"
              ? "bg-emerald-950/80 border-emerald-500/40 text-emerald-300"
              : tipoMensaje === "error"
              ? "bg-red-950/80 border-red-500/40 text-red-300"
              : "bg-blue-950/80 border-blue-500/40 text-blue-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {tipoMensaje === "success" && <CheckCircle2 size={18} className="shrink-0" />}
            {tipoMensaje === "error" && <AlertCircle size={18} className="shrink-0" />}
            {tipoMensaje === "info" && <Clock size={18} className="shrink-0" />}
            <span>{mensaje}</span>
          </div>
        </div>
      )}

      {/* Grid de los 6 Partidos para entrada de resultados */}
      <div className="space-y-4">
        {partidos.map((partido, idx) => {
          const res = resultados[partido.key] || { local: null, visitante: null };

          return (
            <div
              key={partido.id || idx}
              className="apple-card-opaque rounded-3xl p-5 sm:p-6 border border-white/10 hover-black-card transition-all"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <span className="px-2.5 py-1 rounded-lg bg-black text-blue-400 font-mono font-black text-xs border border-white/10">
                  PARTIDO {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-bold text-slate-400">Marcador Oficial</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* LOCAL */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl apple-card-inner border border-white/10">
                  <span className="text-sm font-black text-white truncate max-w-[170px]">
                    {partido.home}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {GOAL_OPTIONS.map((gol) => {
                      const sel = res.local === gol;
                      return (
                        <button
                          key={gol}
                          type="button"
                          id={`res-match-${idx + 1}-home-${gol}`}
                          onClick={() => seleccionarGol(partido.key, "local", gol)}
                          className={`w-9 h-9 rounded-xl font-mono font-black text-xs transition-all cursor-pointer border flex items-center justify-center ${
                            sel
                              ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/50 scale-105"
                              : "bg-black/60 border-white/15 text-slate-200 hover:bg-black hover:border-white/40 hover:scale-105 active:scale-95"
                          }`}
                        >
                          {gol}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VISITANTE */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl apple-card-inner border border-white/10">
                  <span className="text-sm font-black text-white truncate max-w-[170px]">
                    {partido.away}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {GOAL_OPTIONS.map((gol) => {
                      const sel = res.visitante === gol;
                      return (
                        <button
                          key={gol}
                          type="button"
                          id={`res-match-${idx + 1}-away-${gol}`}
                          onClick={() => seleccionarGol(partido.key, "visitante", gol)}
                          className={`w-9 h-9 rounded-xl font-mono font-black text-xs transition-all cursor-pointer border flex items-center justify-center ${
                            sel
                              ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/50 scale-105"
                              : "bg-black/60 border-white/15 text-slate-200 hover:bg-black hover:border-white/40 hover:scale-105 active:scale-95"
                          }`}
                        >
                          {gol}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botón de Publicación por Jorge */}
      <div className="apple-card-opaque rounded-3xl p-6 sm:p-8 border border-white/12 shadow-2xl text-center">
        <div className="max-w-md mx-auto space-y-3">
          <button
            type="button"
            id="btn-publicar-resultados"
            disabled={guardando || !estaCompleto}
            onClick={guardarYCalcular}
            className={`w-full py-4 px-8 rounded-2xl font-black text-sm tracking-wider uppercase transition-all shadow-xl flex items-center justify-center gap-2 border cursor-pointer hover-black-btn ${
              estaCompleto
                ? "bg-blue-600 border-blue-400/40 text-white shadow-blue-600/30"
                : "bg-slate-800 border-white/10 text-slate-400 hover:bg-black hover:text-white"
            }`}
          >
            <Send size={16} />
            <span>{guardando ? "Publicando Resultados..." : "Publicar Resultados de la Jornada"}</span>
          </button>
          <p className="text-[11px] text-slate-400">
            {estaCompleto
              ? "Al publicar, los resultados quedarán visibles para todos los miembros y se computarán sus aciertos."
              : `Rellena los ${12 - totalRellenados} marcadores restantes para poder publicar.`}
          </p>
        </div>
      </div>
    </div>
  );
}
