import React, { useState, useEffect } from "react";
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
        <div className="max-w-2xl py-20 animate-in fade-in duration-300">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-3">
            JORNADA {numeroJornada} · ESTADO
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-black">
            Aún no hay quinigol disponible
          </h2>
          <p className="text-base text-gray-500 font-normal mt-4 leading-relaxed max-w-lg">
            Jorge aún no ha introducido los equipos de la Jornada {numeroJornada}. En cuanto los guarde en el panel de control, aparecerán aquí para realizar tus pronósticos.
          </p>
        </div>
      );
    }

    // Si es Jorge (Superadmin)
    return (
      <div className="max-w-2xl py-20 animate-in fade-in duration-300">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-3">
          SUPERADMIN · JORNADA {numeroJornada}
        </span>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-black">
          Configura los partidos de la Jornada {numeroJornada}
        </h2>
        <p className="text-base text-gray-500 font-normal mt-4 leading-relaxed max-w-lg">
          Introduce los nombres de los equipos que se enfrentan en los 6 partidos (subiendo foto con OCR o escribiéndolos). Al guardarlos, se actualizarán para todos los miembros.
        </p>

        {onIrAdmin && (
          <button
            type="button"
            onClick={onIrAdmin}
            className="mt-8 bg-black text-white text-base font-semibold tracking-tight rounded-full py-4 px-8 hover:opacity-80 transition-opacity cursor-pointer inline-block"
          >
            Configurar en Superadmin
          </button>
        )}
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
        text: "Completa los 12 pronósticos de los 6 partidos antes de sellar el boleto.",
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
        text: `Boleto sellado y confirmado para la Jornada ${numeroJornada}.`,
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
      return { text: "PENDIENTE", badgeClass: "" };
    }
    const val = (g) => (g === "M" ? 3 : parseInt(g, 10));
    const homeNum = val(homeGoal);
    const awayNum = val(awayGoal);

    if (homeNum > awayNum) {
      return { text: `${homeGoal} - ${awayGoal} · VICTORIA LOCAL` };
    } else if (awayNum > homeNum) {
      return { text: `${homeGoal} - ${awayGoal} · VICTORIA VISITANTE` };
    } else {
      return { text: `${homeGoal} - ${awayGoal} · EMPATE` };
    }
  };

  return (
    <div className="space-y-0 max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
      {/* Encabezado Titular Gigante */}
      <section className="pb-10 hairline-b mb-6">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-3">
          JORNADA {numeroJornada} · BOLETO OFICIAL
        </span>

        <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-black">
          BOLETO DE {userName}
        </h2>

        {/* Barra de Progreso y Acciones Minimalistas */}
        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-6">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl md:text-5xl font-extrabold tracking-tighter text-black font-mono">
              {totalSubmitted}/12
            </span>
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
              {isComplete ? "PRONÓSTICOS COMPLETADOS" : `FALTAN ${12 - totalSubmitted} POR PRONOSTICAR`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              id="btn-auto-fill"
              onClick={handleAutoFill}
              className="border border-gray-300 hover:border-black rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors cursor-pointer"
            >
              Rellenar al Azar
            </button>

            {totalSubmitted > 0 && (
              <button
                type="button"
                id="btn-clear-ticket"
                onClick={handleClear}
                className="text-xs font-semibold tracking-wider uppercase text-gray-400 hover:text-black transition-colors cursor-pointer px-2 py-3"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filas Planas de los 6 Partidos separadas por líneas sutiles */}
      <section className="divide-y divide-gray-200/80">
        {partidos.map((match, idx) => {
          const key = match.key || `partido${idx + 1}`;
          const current = predictions[key] || { local: null, visitante: null };
          const summary = getMatchSummary(current.local, current.visitante);

          return (
            <div
              key={match.id || idx}
              className="py-8 transition-colors"
            >
              {/* Encabezado minimalista del partido */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono tracking-widest text-gray-400 uppercase">
                  PARTIDO {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono font-medium text-gray-500 uppercase">
                  {summary.text}
                </span>
              </div>

              {/* Grid Horizontal de los 2 Equipos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
                {/* EQUIPO LOCAL */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900 truncate">
                    {match.home}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {GOAL_OPTIONS.map((g) => {
                      const selected = current.local === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          id={`btn-match-${idx + 1}-home-${g}`}
                          onClick={() => handleSelectGoal(key, "local", g)}
                          className={`font-mono text-base transition-all cursor-pointer flex items-center justify-center ${
                            selected
                              ? "bg-black text-white font-bold rounded-full w-12 h-12 shadow-sm"
                              : "bg-gray-100/80 text-gray-400 font-medium rounded-full w-12 h-12 hover:bg-gray-200 hover:text-black transition-colors"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* EQUIPO VISITANTE */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900 truncate">
                    {match.away}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {GOAL_OPTIONS.map((g) => {
                      const selected = current.visitante === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          id={`btn-match-${idx + 1}-away-${g}`}
                          onClick={() => handleSelectGoal(key, "visitante", g)}
                          className={`font-mono text-base transition-all cursor-pointer flex items-center justify-center ${
                            selected
                              ? "bg-black text-white font-bold rounded-full w-12 h-12 shadow-sm"
                              : "bg-gray-100/80 text-gray-400 font-medium rounded-full w-12 h-12 hover:bg-gray-200 hover:text-black transition-colors"
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

      {/* Botón de Acción Principal Sólido Negro tipo Píldora */}
      <section className="pt-16 max-w-md mx-auto text-center space-y-4">
        {feedback && (
          <div
            className={`p-4 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${
              feedback.type === "success"
                ? "bg-white border border-black text-black"
                : "bg-white border border-gray-400 text-gray-700"
            }`}
          >
            <span>{feedback.text}</span>
          </div>
        )}

        <button
          type="button"
          id="btn-confirmar-boleto"
          disabled={submitting}
          onClick={handleConfirmTicket}
          className={`w-full py-4 px-8 rounded-full text-base md:text-lg font-semibold tracking-tight transition-opacity ${
            isComplete
              ? "bg-black text-white hover:opacity-80 cursor-pointer shadow-sm"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {submitting ? "Sellando Boleto..." : "Confirmar y Sellar Boleto Oficial"}
        </button>

        <p className="text-xs text-gray-400 uppercase tracking-widest">
          {isComplete
            ? "12 de 12 pronósticos listos para el escrutinio"
            : `Completa los ${12 - totalSubmitted} goles restantes para sellar`}
        </p>
      </section>
    </div>
  );
}

