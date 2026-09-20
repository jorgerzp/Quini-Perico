import React, { useState, useEffect } from "react";
import { Ticket, Sparkles, CheckCircle2, RotateCcw, Send, Crown, Check, AlertCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";

const GOAL_OPTIONS = ["0", "1", "2", "M"];

const emptyPredictions = {
  partido1: { local: null, visitante: null },
  partido2: { local: null, visitante: null },
  partido3: { local: null, visitante: null },
  partido4: { local: null, visitante: null },
  partido5: { local: null, visitante: null },
  partido6: { local: null, visitante: null },
};

export default function BoletoView({
  usuarioActivo,
  onJugadaConfirmada,
  partidos = null,
  numeroJornada = 7,
  onIrAdmin,
}) {
  const [predictions, setPredictions] = useState(emptyPredictions);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const hayPartidos = Array.isArray(partidos) && partidos.length === 6 && partidos.every((p) => p.home && p.away);
  const isJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";
  const userName = usuarioActivo?.nombre ? usuarioActivo.nombre.toUpperCase() : "MIEMBRO";

  // Cargar jugada previa del usuario si ya existe
  useEffect(() => {
    if (usuarioActivo?.jugadaActual) {
      setPredictions((prev) => ({
        ...prev,
        ...usuarioActivo.jugadaActual,
      }));
    }
  }, [usuarioActivo]);

  // Si Jorge aún no ha introducido los partidos de la jornada
  if (!hayPartidos) {
    if (!isJorge) {
      return (
        <div className="max-w-xl mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
          <div className="apple-card-opaque bg-white/30 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-10 sm:p-12 flex flex-col items-center text-slate-800">
            <div className="w-16 h-16 rounded-3xl bg-white/50 border border-white/80 text-slate-700 flex items-center justify-center mb-5 shadow-xs">
              <Ticket size={32} />
            </div>

            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Aún no hay quinigol para la Jornada {numeroJornada}
            </h2>

            <p className="text-sm text-slate-600 mt-2.5 max-w-sm leading-relaxed">
              Jorge aún no ha introducido los equipos de los partidos de la Jornada {numeroJornada}. En cuanto los guarde en el Superadmin, aparecerán aquí automáticamente para hacer tus pronósticos.
            </p>

            <div className="mt-8 px-4 py-2 rounded-full bg-white/50 text-slate-600 border border-white/70 text-xs font-semibold shadow-2xs">
              Jornada {numeroJornada} en espera de los equipos
            </div>
          </div>
        </div>
      );
    }

    // Si es Jorge (Superadmin)
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center animate-in fade-in duration-300">
        <div className="apple-card-opaque bg-white/30 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] rounded-3xl p-10 sm:p-12 flex flex-col items-center text-slate-800">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-700 flex items-center justify-center mb-5 shadow-xs">
            <Ticket size={32} />
          </div>

          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            Introduce los Partidos de la Jornada {numeroJornada}
          </h2>

          <p className="text-sm text-slate-600 mt-2.5 max-w-md leading-relaxed">
            Como Superadmin, debes introducir los nombres de los equipos que se enfrentan en los 6 partidos de la Jornada {numeroJornada} (subiendo la foto del boleto con el OCR o escribiéndolos). En cuanto los guardes, aparecerán en el boleto de toda la peña.
          </p>

          {onIrAdmin && (
            <button
              type="button"
              onClick={onIrAdmin}
              className="mt-8 px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-300 ease-out cursor-pointer flex items-center gap-2"
            >
              <Sparkles size={16} />
              <span>Configurar Jornada {numeroJornada} en Superadmin</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // PARTIDOS DISPONIBLES: RENDERIZAR BOLETO
  const handleSelectGoal = (matchKey, side, value) => {
    setPredictions((prev) => ({
      ...prev,
      [matchKey]: {
        ...prev[matchKey],
        [side]: prev[matchKey][side] === value ? null : value,
      },
    }));
    setFeedback(null);
  };

  const handleClear = () => {
    setPredictions(emptyPredictions);
    setFeedback(null);
  };

  const handleAutoFill = () => {
    const randomPreds = {};
    partidos.forEach((m) => {
      randomPreds[m.key] = {
        local: GOAL_OPTIONS[Math.floor(Math.random() * GOAL_OPTIONS.length)],
        visitante: GOAL_OPTIONS[Math.floor(Math.random() * GOAL_OPTIONS.length)],
      };
    });
    setPredictions(randomPreds);
    setFeedback(null);
  };

  let totalSubmitted = 0;
  Object.values(predictions).forEach((p) => {
    if (p.local !== null) totalSubmitted++;
    if (p.visitante !== null) totalSubmitted++;
  });
  const isComplete = totalSubmitted === 12;

  const handleConfirmTicket = async () => {
    if (!isComplete) {
      setFeedback({
        type: "error",
        text: "Por favor, completa los 12 pronósticos de los 6 partidos antes de sellar el boleto.",
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch(`${API_URL}/api/jugadas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuarioActivo?.id,
          pronosticos: predictions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo sellar el boleto.");

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      setFeedback({
        type: "success",
        text: `¡Boleto de ${usuarioActivo?.nombre || "la peña"} sellado y confirmado para la Jornada ${numeroJornada}!`,
      });

      if (onJugadaConfirmada) {
        onJugadaConfirmada();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const getMatchSummary = (homeGoal, awayGoal) => {
    if (homeGoal === null || awayGoal === null) {
      return { text: "PENDIENTE", badgeClass: "bg-white/40 text-slate-500 border border-white/60 font-medium" };
    }
    const val = (g) => (g === "M" ? 3 : parseInt(g, 10));
    const homeNum = val(homeGoal);
    const awayNum = val(awayGoal);

    if (homeNum > awayNum) {
      return {
        text: `${homeGoal} - ${awayGoal} · VICTORIA LOCAL`,
        badgeClass: "bg-blue-500/10 text-blue-700 border border-blue-500/25 font-bold",
      };
    } else if (awayNum > homeNum) {
      return {
        text: `${homeGoal} - ${awayGoal} · VICTORIA VISITANTE`,
        badgeClass: "bg-indigo-500/10 text-indigo-700 border border-indigo-500/25 font-bold",
      };
    } else {
      return {
        text: `${homeGoal} - ${awayGoal} · EMPATE`,
        badgeClass: "bg-amber-500/10 text-amber-700 border border-amber-500/25 font-bold",
      };
    }
  };

  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (totalSubmitted / 12) * circumference;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Encabezado */}
      <section className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-700 text-xs font-black tracking-wider uppercase mb-3 border border-blue-500/20">
          <Ticket size={14} /> Boleto Oficial · Jornada {numeroJornada}
        </div>

        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 flex items-center justify-center gap-2">
          <span>BOLETO DE {userName}</span>
          {isJorge && (
            <Crown size={24} className="text-amber-500 fill-amber-500 inline-block -mt-1" />
          )}
        </h2>

        <p className="mt-2 text-sm text-slate-500 font-normal max-w-lg mx-auto">
          Marca los goles de cada equipo: <strong>0, 1, 2</strong> o <strong>M</strong> (3 o más goles).
        </p>

        {/* Indicador Circular y Acciones Rápidas */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-3 apple-card-opaque bg-white/35 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/70 shadow-[0_4px_20px_0_rgba(31,38,135,0.05)]">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 54 54">
                <circle
                  cx="27"
                  cy="27"
                  r={radius}
                  className="stroke-slate-200"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="27"
                  cy="27"
                  r={radius}
                  className="stroke-slate-900 transition-all duration-300 ease-out"
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-xs font-black font-mono text-slate-900">
                {totalSubmitted}/12
              </span>
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Progreso
              </p>
              <p className="text-xs font-bold text-slate-800">
                {isComplete ? "Boleto Completo" : `Faltan ${12 - totalSubmitted} casillas`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              id="btn-auto-fill"
              onClick={handleAutoFill}
              className="px-5 py-3 rounded-2xl bg-black/85 hover:bg-black text-white font-bold text-xs tracking-wider uppercase backdrop-blur-md border border-white/20 shadow-md hover:shadow-lg transition-all duration-300 ease-out cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sparkles size={14} />
              <span>RELLENAR AL AZAR</span>
            </button>

            {totalSubmitted > 0 && (
              <button
                type="button"
                id="btn-clear-ticket"
                onClick={handleClear}
                className="px-4 py-3 rounded-2xl bg-white/40 hover:bg-white/80 border border-white/60 text-slate-600 hover:text-slate-900 font-bold text-xs shadow-xs transition-all duration-300 ease-out cursor-pointer active:scale-95"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Lista de los 6 Partidos configurados por Jorge */}
      <section className="space-y-4">
        {partidos.map((match, idx) => {
          const key = match.key || `partido${idx + 1}`;
          const current = predictions[key] || { local: null, visitante: null };
          const summary = getMatchSummary(current.local, current.visitante);
          const isRowFilled = current.local !== null && current.visitante !== null;

          return (
            <div
              key={match.id || idx}
              className={`bg-white/30 backdrop-blur-xl border rounded-3xl p-5 sm:p-6 transition-all duration-300 ease-out ${
                isRowFilled
                  ? "border-white/80 shadow-[0_12px_36px_0_rgba(31,38,135,0.09)] bg-white/40"
                  : "border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] hover:bg-white/35 hover:shadow-[0_12px_32px_0_rgba(31,38,135,0.08)]"
              }`}
            >
              {/* Encabezado del Partido */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-white/40">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-xs">
                    PARTIDO {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    {match.fixture || "Quinigol Oficial"}
                  </span>
                </div>

                <div className={`text-[11px] px-3 py-1 rounded-full font-mono tracking-tight ${summary.badgeClass}`}>
                  {summary.text}
                </div>
              </div>

              {/* Equipos y Botones de Goles (0, 1, 2, M) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* EQUIPO LOCAL */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/25 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-12 shrink-0">
                      LOCAL
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[170px]">
                      {match.home}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {GOAL_OPTIONS.map((g) => {
                      const selected = current.local === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          id={`btn-match-${idx + 1}-home-${g}`}
                          onClick={() => handleSelectGoal(key, "local", g)}
                          className={`w-10 h-10 font-mono text-sm transition-all duration-300 ease-out cursor-pointer flex items-center justify-center ${
                            selected
                              ? "bg-white/90 text-gray-900 shadow-[inset_0_1px_3px_rgba(255,255,255,1),_0_4px_10px_rgba(0,0,0,0.1)] border border-white rounded-xl scale-105 font-black"
                              : "bg-white/20 hover:bg-white/45 border border-white/40 text-gray-600 shadow-xs rounded-xl font-bold active:scale-95"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* EQUIPO VISITANTE */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/25 backdrop-blur-lg rounded-2xl p-4 border border-white/50 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-12 shrink-0">
                      VISITA
                    </span>
                    <span className="text-sm sm:text-base font-bold text-slate-800 truncate max-w-[170px]">
                      {match.away}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    {GOAL_OPTIONS.map((g) => {
                      const selected = current.visitante === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          id={`btn-match-${idx + 1}-away-${g}`}
                          onClick={() => handleSelectGoal(key, "visitante", g)}
                          className={`w-10 h-10 font-mono text-sm transition-all duration-300 ease-out cursor-pointer flex items-center justify-center ${
                            selected
                              ? "bg-white/90 text-gray-900 shadow-[inset_0_1px_3px_rgba(255,255,255,1),_0_4px_10px_rgba(0,0,0,0.1)] border border-white rounded-xl scale-105 font-black"
                              : "bg-white/20 hover:bg-white/45 border border-white/40 text-gray-600 shadow-xs rounded-xl font-bold active:scale-95"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Tarjeta de Confirmación y Sellado */}
      <section className="apple-card-opaque bg-white/30 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] text-center">
        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 mb-6 border animate-in fade-in duration-200 shadow-xs ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={18} /> : <RotateCcw size={18} />}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="max-w-md mx-auto space-y-4">
          <button
            type="button"
            id="btn-confirmar-boleto"
            disabled={submitting}
            onClick={handleConfirmTicket}
            className={`w-full py-4 px-8 rounded-2xl font-black text-sm tracking-wider uppercase transition-all duration-300 ease-out shadow-lg flex items-center justify-center gap-2 border cursor-pointer ${
              isComplete
                ? "bg-slate-900 hover:bg-black border-slate-800 text-white shadow-[0_8px_24px_0_rgba(15,23,42,0.2)]"
                : "bg-white/40 border-white/60 text-slate-400 cursor-not-allowed"
            }`}
          >
            <Send size={16} />
            <span>{submitting ? "Sellando Boleto..." : "Confirmar y Sellar Boleto Oficial"}</span>
          </button>

          <p className="text-[11px] text-slate-500">
            {isComplete
              ? "¡Tus 12 pronósticos están listos para entrar al escrutinio de la peña!"
              : `Completa los ${12 - totalSubmitted} goles restantes para poder sellar tu jugada.`}
          </p>
        </div>
      </section>
    </div>
  );
}
