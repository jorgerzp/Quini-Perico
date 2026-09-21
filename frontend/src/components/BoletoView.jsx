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
  usuarios = [],
  onJugadaConfirmada,
  partidos = null,
  numeroJornada = 7,
  onIrAdmin,
}) {
  const [predictions, setPredictions] = useState(emptyPredictions);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [apuestaRecienGuardada, setApuestaRecienGuardada] = useState(false);

  const hayPartidos = Array.isArray(partidos) && partidos.length === 6 && partidos.every((p) => p.home && p.away);
  const isJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";
  const userName = usuarioActivo?.nombre ? usuarioActivo.nombre.toUpperCase() : "MIEMBRO";

  // Resetear estado al cambiar de usuario o jornada
  useEffect(() => {
    setApuestaRecienGuardada(false);
  }, [usuarioActivo?.id, numeroJornada]);

  // Si usuarioActivo tiene jugadaActual para esta misma jornada activa, o acaba de guardarla
  const coincideJornada =
    !usuarioActivo?.jornadaActualNumero ||
    Number(usuarioActivo.jornadaActualNumero) === Number(numeroJornada);

  const yaHaJugado = Boolean(
    apuestaRecienGuardada ||
    (usuarioActivo?.haJugado && coincideJornada)
  );

  useEffect(() => {
    if (usuarioActivo?.jugadaActual && coincideJornada) {
      try {
        const parsed =
          typeof usuarioActivo.jugadaActual === "string"
            ? JSON.parse(usuarioActivo.jugadaActual)
            : usuarioActivo.jugadaActual;
        setPredictions({
          partido1: { local: null, visitante: null, ...parsed.partido1 },
          partido2: { local: null, visitante: null, ...parsed.partido2 },
          partido3: { local: null, visitante: null, ...parsed.partido3 },
          partido4: { local: null, visitante: null, ...parsed.partido4 },
          partido5: { local: null, visitante: null, ...parsed.partido5 },
          partido6: { local: null, visitante: null, ...parsed.partido6 },
        });
      } catch {
        setPredictions(emptyPredictions);
      }
    } else {
      setPredictions(emptyPredictions);
    }
    setFeedback(null);
  }, [usuarioActivo?.id, numeroJornada, coincideJornada]);

  let totalSubmitted = 0;
  Object.values(predictions).forEach((p) => {
    if (p.local !== null) totalSubmitted++;
    if (p.visitante !== null) totalSubmitted++;
  });
  const isComplete = totalSubmitted === 12;

  // Comprobar en tiempo real si el boleto es 100% idéntico a uno ya registrado por otro miembro EXCLUSIVAMENTE EN ESTA MISMA JORNADA
  const usuarioCoincidente = React.useMemo(() => {
    if (!isComplete) return null;
    const otros = (usuarios || []).filter(
      (u) =>
        u.id !== usuarioActivo?.id &&
        u.haJugado &&
        u.jugadaActual &&
        (!u.jornadaActualNumero || Number(u.jornadaActualNumero) === Number(numeroJornada))
    );

    for (const otro of otros) {
      const pOtro = otro.jugadaActual;
      let identico = true;
      for (let i = 1; i <= 6; i++) {
        const k = `partido${i}`;
        const mAct = predictions[k] || {};
        const mOtro = pOtro[k] || {};
        const l1 = String(mAct.local ?? "").trim();
        const l2 = String(mOtro.local ?? "").trim();
        const v1 = String(mAct.visitante ?? "").trim();
        const v2 = String(mOtro.visitante ?? "").trim();
        if (l1 !== l2 || v1 !== v2) {
          identico = false;
          break;
        }
      }
      if (identico) {
        return otro;
      }
    }
    return null;
  }, [predictions, isComplete, usuarios, usuarioActivo, numeroJornada]);

  // Si Jorge aún no ha introducido los partidos de la jornada
  if (!hayPartidos) {
    if (!isJorge) {
      return (
        <div className="max-w-2xl py-12 sm:py-20 animate-in fade-in duration-300 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-8 sm:px-12">
          <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-3">
            JORNADA {numeroJornada} · ESTADO
          </span>
          <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-stone-800">
            Aún no hay quinigol disponible
          </h2>
          <p className="text-base text-stone-500 font-normal mt-4 leading-relaxed max-w-lg">
            Jorge aún no ha introducido los equipos de la Jornada {numeroJornada}. En cuanto los guarde en el panel de control, aparecerán aquí para realizar tus pronósticos.
          </p>
        </div>
      );
    }

    // Si es Jorge (Superadmin)
    return (
      <div className="max-w-2xl py-12 sm:py-20 animate-in fade-in duration-300 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-8 sm:px-12">
        <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-3">
          SUPERADMIN · JORNADA {numeroJornada}
        </span>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-stone-800">
          Configura los partidos de la Jornada {numeroJornada}
        </h2>
        <p className="text-base text-stone-500 font-normal mt-4 leading-relaxed max-w-lg">
          Introduce los nombres de los equipos que se enfrentan en los 6 partidos (subiendo foto con OCR o escribiéndolos). Al guardarlos, se actualizarán para todos los miembros.
        </p>

        {onIrAdmin && (
          <button
            type="button"
            onClick={onIrAdmin}
            className="mt-8 bg-stone-800 text-white text-base font-semibold tracking-tight rounded-full py-4 px-10 shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer inline-block"
          >
            Configurar en Superadmin
          </button>
        )}
      </div>
    );
  }

  // SI EL USUARIO YA HA JUGADO EN ESTA JORNADA: MOSTRAR EXCLUSIVAMENTE EL MENSAJE DE CORRECTAMENTE GUARDADA
  if (yaHaJugado) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto py-12 sm:py-20 animate-in fade-in duration-300">
        <section className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-8 sm:p-14 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-stone-900 text-white mx-auto flex items-center justify-center shadow-lg shadow-black/20">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <div>
            <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-2 font-mono">
              JORNADA {numeroJornada} · APUESTA OFICIAL
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tighter text-stone-800">
              Apuesta guardada correctamente
            </h2>
            <p className="text-sm sm:text-base text-stone-600 font-medium mt-4 leading-relaxed max-w-md mx-auto">
              Tu apuesta para la Jornada {numeroJornada} ha sido registrada y sellada con éxito. Ya no es posible volver a rellenarla hasta que el Superadmin cree una nueva jornada.
            </p>
          </div>

          <div className="pt-2">
            <p className="text-xs text-stone-500 font-medium bg-white/40 border border-white/60 rounded-2xl py-3 px-5 inline-block">
              En cuanto Jorge acepte todas las apuestas, podrás consultar los resultados de todos los participantes en la sección <strong>Resultados</strong>.
            </p>
          </div>
        </section>
      </div>
    );
  }

  // PARTIDOS DISPONIBLES: RENDERIZAR BOLETO
  const handleSelectGoal = (matchKey, side, value) => {
    setPredictions((prev) => {
      const matchObj = prev[matchKey] || { local: null, visitante: null };
      return {
        ...prev,
        [matchKey]: {
          ...matchObj,
          [side]: matchObj[side] === value ? null : value,
        },
      };
    });
    setFeedback(null);
  };

  const handleClear = () => {
    setPredictions({
      partido1: { local: null, visitante: null },
      partido2: { local: null, visitante: null },
      partido3: { local: null, visitante: null },
      partido4: { local: null, visitante: null },
      partido5: { local: null, visitante: null },
      partido6: { local: null, visitante: null },
    });
    setFeedback(null);
  };

  const handleAutoFill = () => {
    const randomPreds = {};
    for (let i = 1; i <= 6; i++) {
      randomPreds[`partido${i}`] = {
        local: GOAL_OPTIONS[Math.floor(Math.random() * GOAL_OPTIONS.length)],
        visitante: GOAL_OPTIONS[Math.floor(Math.random() * GOAL_OPTIONS.length)],
      };
    }
    setPredictions(randomPreds);
    setFeedback(null);
  };

  const handleConfirmTicket = async () => {
    if (submitting || yaHaJugado) return;

    if (!isComplete) {
      setFeedback({
        type: "error",
        text: "Completa los 12 pronósticos de los 6 partidos antes de sellar tu apuesta.",
      });
      return;
    }

    if (usuarioCoincidente) {
      setFeedback({
        type: "error",
        text: `Tu apuesta es 100% idéntica a la de ${usuarioCoincidente.nombre}. No se permiten dos apuestas iguales en la misma jornada; debes modificar al menos un resultado para poder guardar.`,
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
      if (!res.ok) throw new Error(data.error || "No se pudo sellar la apuesta.");

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Pasar de inmediato al estado guardado para quitar el formulario y evitar clics duplicados
      setApuestaRecienGuardada(true);

      if (onJugadaConfirmada) {
        onJugadaConfirmada();
      }
    } catch (err) {
      setFeedback({ type: "error", text: err.message });
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
    <div className="space-y-6 max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
      <section className="pb-8 mb-2 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-3">
          JORNADA {numeroJornada} · APUESTA OFICIAL
        </span>

        <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-stone-800">
          APUESTA DE {userName}
        </h2>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
          <span className="text-xs font-semibold tracking-widest uppercase text-stone-400">
            Pronostica los goles (0, 1, 2, M) de los 6 partidos
          </span>

          <div className="flex items-center gap-4">
            <button
              type="button"
              id="btn-auto-fill"
              onClick={handleAutoFill}
              className="bg-white/30 border border-white/50 hover-negro-brillante rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider text-stone-700 transition-all duration-300 cursor-pointer"
            >
              Rellenar al Azar
            </button>

            {totalSubmitted > 0 && (
              <button
                type="button"
                id="btn-clear-ticket"
                onClick={handleClear}
                className="text-xs font-semibold tracking-wider uppercase text-stone-400 hover:text-stone-800 transition-colors cursor-pointer px-2 py-3"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Filas Planas de los 6 Partidos separadas por líneas sutiles */}
      <section className="space-y-4">
        {partidos.map((match, idx) => {
          const key = match.key || `partido${idx + 1}`;
          const current = predictions[key] || { local: null, visitante: null };
          const summary = getMatchSummary(current.local, current.visitante);

          return (
            <div
              key={match.id || idx}
              className="py-7 px-6 sm:px-8 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono tracking-widest text-stone-400 uppercase">
                  PARTIDO {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono font-medium text-stone-500 uppercase">
                  {summary.text}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold tracking-tight text-stone-800 truncate">
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
                          className={`font-mono text-base cursor-pointer flex items-center justify-center w-12 h-12 ${
                            selected
                              ? "bg-gradient-to-b from-neutral-900 to-black text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 scale-105 transition-all duration-300"
                              : "bg-white/30 border border-white/50 text-stone-600 font-medium rounded-2xl hover:bg-white/50 hover-negro-brillante transition-all duration-300"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold tracking-tight text-stone-800 truncate">
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
                          className={`font-mono text-base cursor-pointer flex items-center justify-center w-12 h-12 ${
                            selected
                              ? "bg-gradient-to-b from-neutral-900 to-black text-white font-bold rounded-2xl shadow-[0_4px_15px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20 scale-105 transition-all duration-300"
                              : "bg-white/30 border border-white/50 text-stone-600 font-medium rounded-2xl hover:bg-white/50 hover-negro-brillante transition-all duration-300"
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

      {/* Botón de Acción Principal y Mensajes de Estado */}
      <section className="pt-10 max-w-xl mx-auto text-center space-y-4">
        {/* Banner prominente si la apuesta coincide al 100% con otro participante */}
        {usuarioCoincidente && (
          <div className="p-6 rounded-3xl text-center bg-red-950/90 border border-red-500/50 shadow-[0_12px_36px_rgba(239,68,68,0.25)] text-white backdrop-blur-xl animate-in fade-in space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-bold uppercase tracking-wider text-xs border border-red-500/30">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Apuesta Idéntica No Permitida</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              ¡Combinación idéntica a la de {usuarioCoincidente.nombre}!
            </h3>
            <p className="text-sm text-stone-200 leading-relaxed max-w-md mx-auto">
              En las normas de la peña no se permiten dos apuestas iguales en la misma jornada.
              <br />
              <strong className="text-amber-300 font-semibold">Estás obligado a modificar al menos un resultado</strong> para que no sea idéntico y poder sellar tu apuesta.
            </p>
          </div>
        )}

        {feedback && (
          <div
            className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold tracking-wide transition-all backdrop-blur-xl ${
              feedback.type === "success"
                ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-900"
                : "bg-red-500/20 border border-red-500/50 text-red-900"
            }`}
          >
            <span>{feedback.text}</span>
          </div>
        )}

        <button
          type="button"
          id="btn-confirmar-boleto"
          disabled={submitting || !isComplete || Boolean(usuarioCoincidente) || yaHaJugado}
          onClick={handleConfirmTicket}
          className={`w-full py-4 px-8 rounded-full text-base md:text-lg font-semibold tracking-tight transition-all ${
            usuarioCoincidente
              ? "bg-red-950/40 border border-red-500/30 text-red-300 cursor-not-allowed"
              : isComplete && !yaHaJugado && !submitting
              ? "bg-stone-800 text-white shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 hover-negro-brillante cursor-pointer"
              : "bg-white/30 border border-white/50 text-stone-400 cursor-not-allowed"
          }`}
        >
          {submitting
            ? "Sellando Apuesta..."
            : usuarioCoincidente
            ? `Apuesta idéntica a ${usuarioCoincidente.nombre} (Debes cambiar un resultado)`
            : "Confirmar y Sellar Apuesta Oficial"}
        </button>

        <p className="text-xs text-stone-400 uppercase tracking-widest">
          {usuarioCoincidente
            ? "Modifica cualquier pronóstico para poder sellar"
            : isComplete
            ? "12 pronósticos listos para el escrutinio"
            : "Completa todos los pronósticos para sellar"}
        </p>
      </section>
    </div>
  );
}

