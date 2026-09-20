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

  return (
    <div className="space-y-16 max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
      {/* Encabezado Titular Gigante */}
      <section className="hairline-b pb-12">
        <div className="flex flex-wrap items-baseline justify-between gap-6 mb-4">
          <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            RANKING OFICIAL DE ACIERTOS · JORNADA {numeroJornada}
          </span>

          <button
            type="button"
            onClick={onIrBoleto}
            className="bg-black text-white text-sm font-semibold tracking-tight rounded-full py-3.5 px-7 hover:opacity-80 transition-opacity cursor-pointer"
          >
            Pronosticar Mi Boleto
          </button>
        </div>

        <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-black">
          Clasificación
        </h2>
        <p className="text-base text-gray-500 font-normal mt-3">
          Ordenada de mayor a menor según la suma de aciertos totales acumulados en la peña.
        </p>
      </section>

      {/* Podio Top 3 Tipográfico Minimalista */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 2º Puesto */}
        {segundo && (
          <div className="border border-gray-200/80 rounded-3xl p-8 bg-white flex flex-col justify-between order-2 md:order-1">
            <div>
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest block mb-4">
                02 · SEGUNDO
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-black">
                {segundo.nombre}
              </h3>
              <p className="text-xs font-mono text-gray-400 mt-1">
                {segundo.puntos} puntos
              </p>
            </div>
            <div className="mt-8 font-mono">
              <span className="text-5xl font-extrabold tracking-tighter text-black">
                {segundo.aciertos}
              </span>
              <span className="text-xs font-mono font-semibold text-gray-400 uppercase ml-2">
                aciertos
              </span>
            </div>
          </div>
        )}

        {/* 1º Puesto (Líder) */}
        {primero && (
          <div className="border-2 border-black rounded-3xl p-8 sm:p-10 bg-white flex flex-col justify-between order-1 md:order-2 shadow-sm">
            <div>
              <span className="text-xs font-mono font-bold text-black uppercase tracking-widest block mb-4">
                01 · LÍDER DE LA PEÑA
              </span>
              <h3 className="text-3xl font-extrabold tracking-tight text-black">
                {primero.nombre}
              </h3>
              <p className="text-xs font-mono text-gray-500 mt-1">
                {primero.puntos} puntos
              </p>
            </div>
            <div className="mt-8 font-mono">
              <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-black">
                {primero.aciertos}
              </span>
              <span className="text-xs font-mono font-bold text-black uppercase ml-2">
                aciertos
              </span>
            </div>
          </div>
        )}

        {/* 3º Puesto */}
        {tercero && (
          <div className="border border-gray-200/80 rounded-3xl p-8 bg-white flex flex-col justify-between order-3">
            <div>
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest block mb-4">
                03 · TERCERO
              </span>
              <h3 className="text-2xl font-bold tracking-tight text-black">
                {tercero.nombre}
              </h3>
              <p className="text-xs font-mono text-gray-400 mt-1">
                {tercero.puntos} puntos
              </p>
            </div>
            <div className="mt-8 font-mono">
              <span className="text-5xl font-extrabold tracking-tighter text-black">
                {tercero.aciertos}
              </span>
              <span className="text-xs font-mono font-semibold text-gray-400 uppercase ml-2">
                aciertos
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Tabla Completa de los 8 Miembros */}
      <section className="space-y-6">
        <div className="flex items-baseline justify-between hairline-b pb-4">
          <h3 className="text-2xl font-bold tracking-tight text-black">
            Tabla Completa (Los 8)
          </h3>
          <span className="text-xs font-mono text-gray-400 uppercase">
            Aciertos Totales
          </span>
        </div>

        <div className="divide-y divide-gray-200/80">
          {clasificacion.map((user, idx) => {
            const esElActivo = usuarioActivo?.id === user.id;
            const esJorge = user.nombre === "Jorge";

            return (
              <div
                key={user.id}
                className="py-6 flex items-center justify-between gap-6 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <span className="font-mono text-base font-bold text-gray-400 w-8">
                    {String(idx + 1).padStart(2, "0")}
                  </span>

                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xl font-bold tracking-tight text-black">
                        {user.nombre}
                      </span>
                      {esJorge && (
                        <span className="text-[10px] font-mono font-semibold text-gray-400 uppercase">
                          ADMIN
                        </span>
                      )}
                      {esElActivo && (
                        <span className="text-[10px] font-mono font-extrabold text-black uppercase">
                          (TÚ)
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-400 mt-0.5">
                      {user.puntos} puntos · {user.haJugado ? "Boleto sellado" : "Pendiente de jugar"}
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-3xl font-extrabold tracking-tight text-black">
                    {user.aciertos}
                  </span>
                  <span className="text-xs text-gray-400 ml-1.5 uppercase font-medium">
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


