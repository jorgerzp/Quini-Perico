import React from "react";

export default function ClasificacionView({
  clasificacion = [],
  usuarioActivo,
  numeroJornada = 7,
  onIrBoleto,
}) {
  // Ordenado por aciertos totales acumulados
  const primero = clasificacion[0];
  const segundo = clasificacion[1];
  const tercero = clasificacion[2];

  const hayJornadaEnDirecto = clasificacion.some((u) => u.jornadaEnDirecto);
  const partidosFinalizadosAct = clasificacion[0]?.partidosFinalizadosJornada || 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
      <section className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-6 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
              RANKING OFICIAL DE ACIERTOS · JORNADA {numeroJornada}
            </span>
            {hayJornadaEnDirecto && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-800 border border-emerald-400/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                En directo ({partidosFinalizadosAct}/6)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onIrBoleto}
            className="bg-stone-800 text-white text-sm font-semibold tracking-tight rounded-full py-3.5 px-10 shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer"
          >
            Pronosticar Mi Apuesta
          </button>
        </div>

        <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-stone-800">
          Clasificación
        </h2>
        <p className="text-base text-stone-500 font-normal mt-3">
          Ordenada de mayor a menor según la suma de aciertos totales acumulados en la peña.
        </p>

        {hayJornadaEnDirecto && (
          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-between gap-3 text-stone-800">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-emerald-950">
                <span className="font-bold">Jornada {numeroJornada} en curso:</span> Se han completado {partidosFinalizadosAct} de 6 partidos. Las posiciones y los aciertos se actualizan en vivo según finalizan los encuentros.
              </p>
            </div>
            <span className="hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-2xs shrink-0">
              Directo
            </span>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {segundo && (
          <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-8 flex flex-col justify-between order-2 md:order-1">
            <div>
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest block mb-4">
                02 · SEGUNDO
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-stone-800">
                {segundo.nombre}
              </h3>
              <p className="text-xs font-mono text-stone-400 mt-1">
                {segundo.puntos} puntos
              </p>
            </div>
            <div className="mt-8 font-mono">
              <span className="text-5xl font-extrabold tracking-tighter text-stone-800">
                {segundo.aciertos}
              </span>
              <span className="text-xs font-mono font-semibold text-stone-400 uppercase ml-2">
                aciertos
              </span>
            </div>
          </div>
        )}

        {primero && (
          <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-8 sm:p-10 flex flex-col justify-between order-1 md:order-2">
            <div>
              <span className="text-xs font-mono font-bold text-stone-600 uppercase tracking-widest block mb-4">
                01 · LÍDER DE LA PEÑA
              </span>
              <h3 className="text-3xl font-extrabold tracking-tight text-stone-800">
                {primero.nombre}
              </h3>
              <p className="text-xs font-mono text-stone-500 mt-1">
                {primero.puntos} puntos
              </p>
            </div>
            <div className="mt-8 font-mono">
              <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-stone-800">
                {primero.aciertos}
              </span>
              <span className="text-xs font-mono font-bold text-stone-700 uppercase ml-2">
                aciertos
              </span>
            </div>
          </div>
        )}

        {tercero && (
          <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-8 flex flex-col justify-between order-3">
            <div>
              <span className="text-xs font-mono font-bold text-stone-400 uppercase tracking-widest block mb-4">
                03 · TERCERO
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-stone-800">
                {tercero.nombre}
              </h3>
              <p className="text-xs font-mono text-stone-400 mt-1">
                {tercero.puntos} puntos
              </p>
            </div>
            <div className="mt-8 font-mono">
              <span className="text-5xl font-extrabold tracking-tighter text-stone-800">
                {tercero.aciertos}
              </span>
              <span className="text-xs font-mono font-semibold text-stone-400 uppercase ml-2">
                aciertos
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-10 space-y-6">
        <div className="flex items-baseline justify-between border-b border-white/50 pb-4">
          <h3 className="text-2xl font-bold tracking-tight text-stone-800">
            Tabla Completa (Los 8)
          </h3>
          <span className="text-xs font-mono text-stone-400 uppercase">
            Aciertos Totales
          </span>
        </div>

        <div className="divide-y divide-white/50">
          {clasificacion.map((user, idx) => {
            const esElActivo = usuarioActivo?.id === user.id;
            const esJorge = user.nombre === "Jorge";

            return (
              <div
                key={user.id}
                className="py-6 flex items-center justify-between gap-6 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-base font-bold text-stone-400 w-8">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl font-bold tracking-tight text-stone-800">
                        {user.nombre}
                      </span>
                      {esJorge && (
                        <span className="text-[10px] font-mono font-semibold text-stone-400 uppercase">
                          ADMIN
                        </span>
                      )}
                      {esElActivo && (
                        <span className="text-[10px] font-mono font-extrabold text-stone-900 uppercase">
                          (TÚ)
                        </span>
                      )}
                      {user.aciertosJornadaActiva > 0 && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          +{user.aciertosJornadaActiva} en vivo J{numeroJornada}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-stone-400 mt-0.5">
                      {user.puntos} puntos · {user.haJugado ? "Apuesta sellada" : "Pendiente de jugar"}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-3xl font-extrabold tracking-tight text-stone-800">
                    {user.aciertos}
                  </span>
                  <span className="text-xs text-stone-400 ml-1.5 uppercase font-medium">
                    pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}


