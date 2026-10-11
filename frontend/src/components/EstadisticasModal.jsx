import React, { useEffect } from "react";

export default function EstadisticasModal({ datos, cargando, error, onClose, onReintentar }) {
  // Cerrar al pulsar la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white/90 backdrop-blur-2xl border border-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.3)] rounded-3xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto text-stone-800 my-auto"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200/60">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold font-mono tracking-widest text-stone-500 uppercase bg-stone-100 px-2.5 py-0.5 rounded-full border border-stone-200">
                API-Sports V3 · Datos 100% Reales
              </span>
              {datos?.cached && (
                <span className="text-[10px] font-mono text-stone-400">
                  (En caché)
                </span>
              )}
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 leading-tight">
              {datos ? `${datos.local.nombre} vs ${datos.visitante.nombre}` : "Estadísticas del Partido"}
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Historial de enfrentamientos directos y estado de forma reciente
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors flex items-center justify-center shrink-0 cursor-pointer font-bold text-sm"
            title="Cerrar ventana"
          >
            ✕
          </button>
        </div>

        {/* Estado de Carga */}
        {cargando && (
          <div className="py-16 text-center space-y-3">
            <div className="w-10 h-10 border-3 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-stone-600">
              Cargando estadísticas oficiales desde API-Sports...
            </p>
            <p className="text-xs text-stone-400">
              Consultando IDs, historial cara a cara y rachas de ambos equipos
            </p>
          </div>
        )}

        {/* Estado de Error */}
        {error && !cargando && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3 text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-lg font-bold">
              ⚠️
            </div>
            <div>
              <p className="text-sm font-bold">No se pudieron cargar las estadísticas</p>
              <p className="text-xs text-rose-600 mt-1">{error}</p>
            </div>
            {onReintentar && (
              <button
                type="button"
                onClick={onReintentar}
                className="px-4 py-2 rounded-full bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-800 transition-all cursor-pointer"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {/* Contenido de Estadísticas */}
        {datos && !cargando && !error && (
          <div className="space-y-6">
            
            {/* 1. SECCIÓN: CARA A CARA (H2H) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  <span>⚔️</span>
                  <span>Cara a Cara (Últimos Enfrentamientos Directos)</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-400">
                  {datos.h2h.length} {datos.h2h.length === 1 ? "partido" : "partidos"}
                </span>
              </div>

              {datos.h2h.length === 0 ? (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-500 text-center">
                  Sin enfrentamientos oficiales recientes registrados entre ambos clubes.
                </div>
              ) : (
                <div className="space-y-2">
                  {datos.h2h.map((partido) => {
                    const localGano = partido.ganador === partido.local;
                    const visitanteGano = partido.ganador === partido.visitante;
                    const empate = partido.ganador === "Empate";

                    return (
                      <div
                        key={partido.id}
                        className="p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all hover:bg-stone-100/80"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-[11px] font-mono text-stone-400 shrink-0 w-20">
                            {partido.fechaFormateada}
                          </span>
                          <span className="text-xs font-bold text-stone-800 truncate">
                            {partido.local} <span className="text-stone-400 font-normal">vs</span> {partido.visitante}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          {partido.competicion && (
                            <span className="text-[10px] font-semibold text-stone-500 bg-stone-200/60 px-2 py-0.5 rounded-md">
                              {partido.competicion}
                            </span>
                          )}

                          <span className="font-mono text-sm font-black px-2.5 py-0.5 bg-white rounded-lg border border-stone-200 text-stone-900 shadow-2xs">
                            {partido.golesLocal} - {partido.golesVisitante}
                          </span>

                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                              empate
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {empate ? "Empate" : `Ganó ${partido.ganador}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. SECCIÓN: RACHA LOCAL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  {datos.local.logo && (
                    <img
                      src={datos.local.logo}
                      alt={datos.local.nombre}
                      className="w-4 h-4 object-contain inline-block"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <span>Racha Local ({datos.local.nombre})</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-400">
                  Últimos 3 partidos
                </span>
              </div>

              {datos.rachaLocal.length === 0 ? (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-500 text-center">
                  Sin partidos oficiales recientes registrados para {datos.local.nombre}.
                </div>
              ) : (
                <div className="space-y-2">
                  {datos.rachaLocal.map((r) => {
                    const esVictoria = r.resultado === "victoria";
                    const esDerrota = r.resultado === "derrota";

                    return (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                          esVictoria
                            ? "bg-emerald-50/70 border-emerald-200/80 text-stone-800"
                            : esDerrota
                            ? "bg-rose-50/60 border-rose-200/80 text-stone-800"
                            : "bg-amber-50/60 border-amber-200/80 text-stone-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{r.icono}</span>
                          <span className="text-xs font-bold truncate">
                            {r.resultadoTexto}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono shrink-0">
                            ({r.esLocal ? "Casa" : "Fuera"})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {r.competicion && (
                            <span className="text-[10px] font-semibold text-stone-500 bg-white/70 px-2 py-0.5 rounded-md border border-stone-200/60">
                              {r.competicion}
                            </span>
                          )}
                          <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-stone-200 text-stone-900">
                            {r.marcador}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. SECCIÓN: RACHA VISITANTE */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                  {datos.visitante.logo && (
                    <img
                      src={datos.visitante.logo}
                      alt={datos.visitante.nombre}
                      className="w-4 h-4 object-contain inline-block"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <span>Racha Visitante ({datos.visitante.nombre})</span>
                </h4>
                <span className="text-[11px] font-mono text-stone-400">
                  Últimos 3 partidos
                </span>
              </div>

              {datos.rachaVisitante.length === 0 ? (
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs text-stone-500 text-center">
                  Sin partidos oficiales recientes registrados para {datos.visitante.nombre}.
                </div>
              ) : (
                <div className="space-y-2">
                  {datos.rachaVisitante.map((r) => {
                    const esVictoria = r.resultado === "victoria";
                    const esDerrota = r.resultado === "derrota";

                    return (
                      <div
                        key={r.id}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                          esVictoria
                            ? "bg-emerald-50/70 border-emerald-200/80 text-stone-800"
                            : esDerrota
                            ? "bg-rose-50/60 border-rose-200/80 text-stone-800"
                            : "bg-amber-50/60 border-amber-200/80 text-stone-800"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base shrink-0">{r.icono}</span>
                          <span className="text-xs font-bold truncate">
                            {r.resultadoTexto}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono shrink-0">
                            ({r.esLocal ? "Casa" : "Fuera"})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {r.competicion && (
                            <span className="text-[10px] font-semibold text-stone-500 bg-white/70 px-2 py-0.5 rounded-md border border-stone-200/60">
                              {r.competicion}
                            </span>
                          )}
                          <span className="text-[11px] font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-stone-200 text-stone-900">
                            {r.marcador}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Pie del Modal */}
        <div className="pt-4 border-t border-stone-200/60 flex items-center justify-between">
          <span className="text-[11px] text-stone-400 font-medium">
            Fuente oficial: API-Sports Football V3
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-stone-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-all cursor-pointer shadow-xs hover-negro-brillante"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
