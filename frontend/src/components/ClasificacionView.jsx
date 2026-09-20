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
    <div className="space-y-8 max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black tracking-wider uppercase mb-2 border border-emerald-500/30">
            <Target size={14} /> Ranking Oficial de Aciertos · Jornada {numeroJornada}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Tabla Clasificatoria de los 8
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Clasificación del sindicato según la suma de aciertos totales de cada jornada
          </p>
        </div>

        <button
          type="button"
          onClick={onIrBoleto}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 border border-blue-400/30 text-white text-xs font-black tracking-wide shadow-lg hover:bg-black transition-all cursor-pointer hover-black-btn"
        >
          <span>Pronosticar Mi Boleto</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Banner de regla clasificatoria */}
      <div className="apple-card-opaque rounded-2xl p-4 border border-white/10 flex items-start gap-3">
        <Sparkles size={18} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-300 leading-relaxed">
          <strong>Criterio de clasificación:</strong> La tabla se ordena de mayor a menor según el número de <strong>aciertos totales acumulados</strong> que va sumando cada amigo en cada jornada del Quinigol.
        </p>
      </div>

      {/* Podio Top 3 de Aciertos (Apple Dark Opaque) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* 2º Puesto (Plata) */}
        {segundo && (
          <div className="apple-card-opaque rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col items-center text-center order-2 md:order-1 relative hover-black-card">
            <span className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500/40 text-slate-200 font-black text-xs flex items-center justify-center mb-3 shadow-md">
              2º
            </span>
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-white/15 text-white flex items-center justify-center font-black text-lg mb-2 shadow-inner">
              {segundo.nombre.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-black text-base text-white">{segundo.nombre}</h3>
            <p className="text-xs text-slate-400 mb-3">{segundo.puntos} puntos</p>
            <div className="px-4 py-1.5 rounded-full bg-black/60 border border-white/15 text-slate-200 font-black text-lg font-mono flex items-center gap-1 shadow-inner">
              <span>{segundo.aciertos}</span>
              <span className="text-xs font-bold text-slate-400">aciertos</span>
            </div>
          </div>
        )}

        {/* 1º Puesto (Oro / Líder) */}
        {primero && (
          <div className="apple-card-opaque rounded-3xl p-7 border-2 border-amber-500/50 shadow-2xl shadow-amber-500/10 flex flex-col items-center text-center order-1 md:order-2 relative md:-translate-y-2 hover-black-card">
            <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-md">
              <Crown size={12} /> Líder de la Peña
            </div>
            <span className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-sm flex items-center justify-center mb-3 mt-1 shadow-md">
              1º
            </span>
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xl mb-2 shadow-lg ring-4 ring-amber-400/30">
              {primero.nombre.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-black text-lg text-white flex items-center gap-1.5">
              <span>{primero.nombre}</span>
              {primero.nombre === "Jorge" && (
                <Crown size={14} className="text-amber-400 fill-amber-400" />
              )}
            </h3>
            <p className="text-xs text-amber-300/80 mb-3">{primero.puntos} puntos</p>
            <div className="px-5 py-2 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 font-black text-2xl font-mono flex items-center gap-1.5 shadow-md">
              <span>{primero.aciertos}</span>
              <span className="text-xs font-bold text-amber-300/80">aciertos</span>
            </div>
          </div>
        )}

        {/* 3º Puesto (Bronce) */}
        {tercero && (
          <div className="apple-card-opaque rounded-3xl p-6 border border-white/10 shadow-xl flex flex-col items-center text-center order-3 relative hover-black-card">
            <span className="w-8 h-8 rounded-full bg-amber-900/40 border border-amber-700/40 text-amber-300 font-black text-xs flex items-center justify-center mb-3 shadow-md">
              3º
            </span>
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-white/15 text-white flex items-center justify-center font-black text-lg mb-2 shadow-inner">
              {tercero.nombre.substring(0, 2).toUpperCase()}
            </div>
            <h3 className="font-black text-base text-white">{tercero.nombre}</h3>
            <p className="text-xs text-slate-400 mb-3">{tercero.puntos} puntos</p>
            <div className="px-4 py-1.5 rounded-full bg-black/60 border border-white/15 text-slate-200 font-black text-lg font-mono flex items-center gap-1 shadow-inner">
              <span>{tercero.aciertos}</span>
              <span className="text-xs font-bold text-slate-400">aciertos</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabla Completa de los 8 Miembros */}
      <div className="apple-card-opaque rounded-3xl border border-white/12 shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy size={18} className="text-amber-400" />
            <h3 className="text-base font-black text-white">
              Clasificación Completa (Los 8)
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Ordenado por Aciertos Totales
          </span>
        </div>

        <div className="divide-y divide-white/10">
          {clasificacion.map((user, idx) => {
            const esElActivo = usuarioActivo?.id === user.id;
            const esJorge = user.nombre === "Jorge";

            return (
              <div
                key={user.id}
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition-all hover-black-card ${
                  esElActivo ? "bg-blue-950/40 border-l-4 border-blue-500" : ""
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="w-7 h-7 rounded-xl bg-black border border-white/10 text-white font-mono font-black text-xs flex items-center justify-center shadow-inner">
                    {idx + 1}º
                  </span>

                  <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-white/15 text-white flex items-center justify-center font-black text-xs shadow-md">
                    {user.nombre.substring(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-black text-white">
                        {user.nombre}
                      </span>
                      {esJorge && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30">
                          Admin
                        </span>
                      )}
                      {esElActivo && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                          Tú
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
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
                    <span className="text-2xl font-black text-emerald-400">
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
