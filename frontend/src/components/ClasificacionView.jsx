import React from "react";
import { Trophy, CheckCircle2, Clock, Crown, Target, Sparkles, ArrowRight, Award } from "lucide-react";

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
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300 text-slate-800">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-black tracking-wider uppercase mb-2 border border-emerald-500/20">
            <Target size={14} /> Ranking Oficial de Aciertos · Jornada {numeroJornada}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Tabla Clasificatoria de los 8
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Clasificación del sindicato según la suma de aciertos totales de cada jornada
          </p>
        </div>

        <button
          type="button"
          onClick={onIrBoleto}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold tracking-wide shadow-md transition-all duration-300 ease-out cursor-pointer active:scale-95"
        >
          <span>Pronosticar Mi Boleto</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Banner de regla clasificatoria */}
      <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-2xl p-4 border border-white/60 shadow-xs flex items-start gap-3">
        <Sparkles size={18} className="text-slate-600 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          <strong>Criterio de clasificación:</strong> La tabla se ordena de mayor a menor según el número de <strong>aciertos totales acumulados</strong> que va sumando cada amigo en cada jornada del Quinigol.
        </p>
      </div>

      {/* Podio Top 3 de Aciertos (Apple Frosted Glass) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* 2º Puesto (Plata) */}
        {segundo && (
          <div className="apple-card-opaque bg-white/30 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex flex-col items-center text-center order-2 md:order-1 relative transition-all duration-300 hover:bg-white/40">
            <span className="w-8 h-8 rounded-full bg-slate-200/80 border border-slate-300/80 text-slate-700 font-black text-xs flex items-center justify-center mb-3 shadow-2xs">
              2º
            </span>
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-white text-slate-800 flex items-center justify-center font-black text-lg mb-2 shadow-xs">
              {segundo.nombre.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-black text-base text-slate-900">{segundo.nombre}</h3>
            <p className="text-xs text-slate-500 mb-3">{segundo.puntos} puntos</p>
            <div className="px-4 py-1.5 rounded-full bg-white/70 border border-white/90 text-slate-800 font-black text-lg font-mono flex items-center gap-1 shadow-xs">
              <span>{segundo.aciertos}</span>
              <span className="text-xs font-bold text-slate-400">aciertos</span>
            </div>
          </div>
        )}

        {/* 1º Puesto (Oro / Líder) */}
        {primero && (
          <div className="apple-card-opaque bg-white/45 backdrop-blur-xl rounded-3xl p-7 border-2 border-amber-300/80 shadow-[0_16px_40px_0_rgba(245,158,11,0.12)] flex flex-col items-center text-center order-1 md:order-2 relative md:-translate-y-2 transition-all duration-300 hover:bg-white/55">
            <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-sm">
              <Crown size={12} /> Líder de la Peña
            </div>
            <span className="w-9 h-9 rounded-full bg-amber-100 border border-amber-300/60 text-amber-800 font-black text-sm flex items-center justify-center mb-3 mt-1 shadow-2xs">
              1º
            </span>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xl mb-2 shadow-md ring-4 ring-amber-200/50">
              {primero.nombre.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-black text-lg text-slate-900 flex items-center gap-1.5">
              <span>{primero.nombre}</span>
              {primero.nombre === "Jorge" && (
                <Crown size={15} className="text-amber-500 fill-amber-500" />
              )}
            </h3>
            <p className="text-xs text-amber-700/90 font-medium mb-3">{primero.puntos} puntos</p>
            <div className="px-5 py-2 rounded-full bg-amber-50 border border-amber-300/70 text-amber-900 font-black text-2xl font-mono flex items-center gap-1.5 shadow-xs">
              <span>{primero.aciertos}</span>
              <span className="text-xs font-bold text-amber-700">aciertos</span>
            </div>
          </div>
        )}

        {/* 3º Puesto (Bronce) */}
        {tercero && (
          <div className="apple-card-opaque bg-white/30 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex flex-col items-center text-center order-3 relative transition-all duration-300 hover:bg-white/40">
            <span className="w-8 h-8 rounded-full bg-amber-100/70 border border-amber-300/50 text-amber-800 font-black text-xs flex items-center justify-center mb-3 shadow-2xs">
              3º
            </span>
            <div className="w-14 h-14 rounded-full bg-slate-100 border border-white text-slate-800 flex items-center justify-center font-black text-lg mb-2 shadow-xs">
              {tercero.nombre.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-black text-base text-slate-900">{tercero.nombre}</h3>
            <p className="text-xs text-slate-500 mb-3">{tercero.puntos} puntos</p>
            <div className="px-4 py-1.5 rounded-full bg-white/70 border border-white/90 text-slate-800 font-black text-lg font-mono flex items-center gap-1 shadow-xs">
              <span>{tercero.aciertos}</span>
              <span className="text-xs font-bold text-slate-400">aciertos</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabla Completa de los 8 Miembros */}
      <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] overflow-hidden">
        <div className="p-5 border-b border-white/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-500" />
            <h3 className="text-base font-black text-slate-900">
              Clasificación Completa (Los 8)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Ordenado por Aciertos Totales
          </span>
        </div>

        <div className="divide-y divide-white/50">
          {clasificacion.map((user, idx) => {
            const esElActivo = usuarioActivo?.id === user.id;
            const esJorge = user.nombre === "Jorge";

            return (
              <div
                key={user.id}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-all duration-200 hover:bg-white/45 ${
                  esElActivo ? "bg-blue-50/70 border-l-4 border-blue-600" : ""
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs">
                    {idx + 1}º
                  </span>

                  <div className="w-10 h-10 rounded-2xl bg-white/80 border border-white text-slate-800 flex items-center justify-center font-black text-xs shadow-xs">
                    {user.nombre.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-slate-900">
                        {user.nombre}
                      </span>
                      {esJorge && (
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 font-bold border border-blue-500/20">
                          Admin
                        </span>
                      )}
                      {esElActivo && (
                        <span className="text-[9px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 font-bold border border-emerald-500/25">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span>{user.puntos} puntos</span>
                      <span>•</span>
                      <span className="text-slate-400 font-mono">
                        {user.haJugado ? "Boleto sellado" : "Pendiente de jugar"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-baseline justify-end gap-1 font-mono">
                    <span className="text-2xl font-black text-emerald-700">
                      {user.aciertos}
                    </span>
                    <span className="text-xs font-bold text-slate-400">aciertos</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

