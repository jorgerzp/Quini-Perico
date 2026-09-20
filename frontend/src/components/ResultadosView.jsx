import React, { useState, useEffect } from "react";
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
      <div className="py-20 text-center text-sm text-gray-400 font-medium">
        Cargando estado de la jornada...
      </div>
    );
  }

  // CASO 1: NO HAY PARTIDOS CONFIGURADOS EN LA JORNADA
  if (!hayPartidos) {
    return (
      <div className="max-w-2xl py-20 animate-in fade-in duration-300">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-3">
          JORNADA {numeroJornada} · ESTADO
        </span>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-black">
          Aún no hay quinigol para la Jornada {numeroJornada}
        </h2>
        <p className="text-base text-gray-500 font-normal mt-4 leading-relaxed max-w-lg">
          {esJorge
            ? `Primero debes introducir los partidos de la Jornada ${numeroJornada} en el Panel Superadmin.`
            : `Jorge aún no ha configurado los partidos de la Jornada ${numeroJornada}.`}
        </p>
      </div>
    );
  }

  // CASO 2: NO ES JORGE Y AÚN NO SE HAN PUBLICADO RESULTADOS
  if (!esJorge && !disponible) {
    return (
      <div className="max-w-2xl py-20 animate-in fade-in duration-300">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-3">
          JORNADA {numeroJornada} · ESCRUTINIO
        </span>
        <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tighter text-black">
          Resultados de la Jornada {numeroJornada} Pendientes
        </h2>
        <p className="text-base text-gray-500 font-normal mt-4 leading-relaxed max-w-lg">
          Jorge aún no ha publicado los resultados oficiales de los partidos de la Jornada {numeroJornada}. Vuelve a consultar en cuanto concluyan los partidos.
        </p>
      </div>
    );
  }

  // CASO 3: NO ES JORGE PERO SÍ HAY RESULTADOS DISPONIBLES (MODO LECTURA)
  if (!esJorge && disponible) {
    return (
      <div className="space-y-10 max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
        <div className="hairline-b pb-8">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-3">
            JORNADA {numeroJornada} · OFICIAL
          </span>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-black">
            Resultados Oficiales
          </h2>
          <p className="text-sm text-gray-500 mt-2 font-normal">
            Marcadores finales validados de la Jornada {numeroJornada}
          </p>
        </div>

        <div className="divide-y divide-gray-200/80">
          {partidos.map((partido, idx) => {
            const res = resultados[partido.key] || { local: "-", visitante: "-" };
            return (
              <div key={partido.id || idx} className="py-8 flex items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-bold font-mono tracking-widest text-gray-400 uppercase block mb-1">
                    PARTIDO {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900">
                    {partido.home} <span className="text-gray-400 font-normal">vs</span> {partido.away}
                  </p>
                </div>

                <div className="text-3xl sm:text-4xl font-extrabold text-black font-mono tracking-tight shrink-0">
                  <span>{res.local || "-"}</span>
                  <span className="text-gray-300 mx-2">·</span>
                  <span>{res.visitante || "-"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // CASO 4: ES JORGE (SUPERADMIN) - INTRODUCIR RESULTADOS
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
        setMensaje("Resultados oficiales retirados de la vista pública.");
        if (onResultadosGuardados) onResultadosGuardados();
      }
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
      setMensaje("Resultados oficiales publicados y aciertos sumados a los participantes.");
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
    <div className="space-y-0 max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
      {/* Encabezado Titular Gigante */}
      <section className="pb-10 hairline-b mb-6">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-3">
          SUPERADMIN · JORNADA {numeroJornada}
        </span>

        <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-black">
          Poner Resultados
        </h2>

        <div className="mt-8 flex flex-wrap items-baseline justify-between gap-6">
          <p className="text-base text-gray-500 font-normal max-w-md">
            Introduce los marcadores para computar los aciertos de todos los miembros.
          </p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={autocompletarResultados}
              className="border border-gray-300 hover:border-black rounded-full px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition-colors cursor-pointer"
            >
              Llenar Azar
            </button>

            {disponible && (
              <button
                type="button"
                onClick={reiniciarResultadosServidor}
                className="text-xs font-semibold tracking-wider uppercase text-gray-400 hover:text-black transition-colors cursor-pointer px-2 py-3"
              >
                Retirar Resultados
              </button>
            )}
          </div>
        </div>
      </section>

      {mensaje && (
        <div
          className={`p-4 rounded-full text-xs font-semibold tracking-wide uppercase transition-all mb-8 ${
            tipoMensaje === "success"
              ? "bg-white border border-black text-black"
              : "bg-white border border-gray-400 text-gray-700"
          }`}
        >
          <span>{mensaje}</span>
        </div>
      )}

      {/* Filas Planas de los 6 Partidos */}
      <section className="divide-y divide-gray-200/80">
        {partidos.map((partido, idx) => {
          const res = resultados[partido.key] || { local: null, visitante: null };

          return (
            <div
              key={partido.id || idx}
              className="py-8 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold font-mono tracking-widest text-gray-400 uppercase">
                  PARTIDO {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-xs font-mono font-medium text-gray-500 uppercase">
                  MARCADOR OFICIAL
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center">
                {/* LOCAL */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900 truncate">
                    {partido.home}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {GOAL_OPTIONS.map((gol) => {
                      const sel = res.local === gol;
                      return (
                        <button
                          key={gol}
                          type="button"
                          id={`res-match-${idx + 1}-home-${gol}`}
                          onClick={() => seleccionarGol(partido.key, "local", gol)}
                          className={`font-mono text-base transition-all cursor-pointer flex items-center justify-center ${
                            sel
                              ? "bg-black text-white font-bold rounded-full w-12 h-12 shadow-sm"
                              : "bg-gray-100/80 text-gray-400 font-medium rounded-full w-12 h-12 hover:bg-gray-200 hover:text-black transition-colors"
                          }`}
                        >
                          {gol}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VISITANTE */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-2xl font-semibold tracking-tight text-gray-900 truncate">
                    {partido.away}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {GOAL_OPTIONS.map((gol) => {
                      const sel = res.visitante === gol;
                      return (
                        <button
                          key={gol}
                          type="button"
                          id={`res-match-${idx + 1}-away-${gol}`}
                          onClick={() => seleccionarGol(partido.key, "visitante", gol)}
                          className={`font-mono text-base transition-all cursor-pointer flex items-center justify-center ${
                            sel
                              ? "bg-black text-white font-bold rounded-full w-12 h-12 shadow-sm"
                              : "bg-gray-100/80 text-gray-400 font-medium rounded-full w-12 h-12 hover:bg-gray-200 hover:text-black transition-colors"
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
      </section>

      {/* Botón de Publicación Píldora Negra */}
      <section className="pt-16 max-w-md mx-auto text-center space-y-4">
        <button
          type="button"
          id="btn-publicar-resultados"
          disabled={guardando || !estaCompleto}
          onClick={guardarYCalcular}
          className={`w-full py-4 px-8 rounded-full text-base md:text-lg font-semibold tracking-tight transition-opacity ${
            estaCompleto
              ? "bg-black text-white hover:opacity-80 cursor-pointer shadow-sm"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {guardando ? "Publicando Resultados..." : "Publicar Resultados de la Jornada"}
        </button>
        <p className="text-xs text-gray-400 uppercase tracking-widest">
          {estaCompleto
            ? "Al publicar se computarán los aciertos de toda la peña"
            : `Rellena los ${12 - totalRellenados} marcadores restantes para publicar`}
        </p>
      </section>
    </div>
  );
}

