import React, { useState } from "react";
import { Coins, TrendingUp, Users, ArrowUpRight, ShieldCheck, Plus, Calendar, Target, CheckCircle2, Award } from "lucide-react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";

export default function BoteView({
  bote,
  onIrAdmin,
  usuarioActivo,
  numeroJornada = 7,
  onBoteActualizado,
}) {
  const [cantidad, setCantidad] = useState("");
  const [jornada, setJornada] = useState(() => String(numeroJornada || 7));
  const [aciertos, setAciertos] = useState("11 aciertos");
  const [fecha, setFecha] = useState(() => new Date().toISOString().split("T")[0]);
  const [concepto, setConcepto] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";

  const movimientos = bote?.movimientos || [];
  const totalBote = bote?.acumulado || 0;
  const porCabeza = totalBote / 8;

  // Registrar ganancia de la jornada (Control exclusivo de Jorge)
  const registrarGanancia = async (e) => {
    e.preventDefault();
    const val = parseFloat(cantidad);

    if (isNaN(val) || val <= 0) {
      setMensaje({ tipo: "error", texto: "Introduce una cantidad ganada válida mayor que 0." });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const res = await fetch(`${API_URL}/api/bote/ganancia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad: val,
          jornada: parseInt(jornada, 10) || 1,
          aciertos: aciertos || "N/A",
          fecha,
          concepto: concepto || `Premio Quinigol Jornada ${jornada} (${aciertos})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMensaje({
        tipo: "success",
        texto: `¡Se han añadido +${val.toFixed(2)}€ ganados en la Jornada ${jornada} (${aciertos}) al bote!`,
      });

      setCantidad("");
      setConcepto("");

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      if (onBoteActualizado) {
        onBoteActualizado();
      }
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-300 text-slate-800">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-black tracking-wider uppercase mb-2 border border-amber-500/20">
            <Coins size={14} /> Fondo Acumulado
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
            Bote de la Peña Quini-Perico
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión transparente del premio acumulado e historial de ganancias
          </p>
        </div>

        {esJorge && onIrAdmin && (
          <button
            type="button"
            onClick={onIrAdmin}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-xs font-bold text-white transition-all duration-300 ease-out cursor-pointer flex items-center gap-2 shadow-md"
          >
            <ShieldCheck size={14} className="text-slate-300" />
            <span>Panel Superadmin</span>
          </button>
        )}
      </div>

      {/* Tarjeta Principal del Bote (Apple Frosted Glass) */}
      <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] relative overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Total Bote */}
          <div className="md:col-span-2 space-y-2">
            <span className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
              <Award size={16} /> Total Acumulado en Bote
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-slate-900 font-mono">
                {totalBote.toFixed(2)}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-600 font-mono">
                € EUR
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Fondo oficial compartido entre los 8 miembros del sindicato
            </p>
          </div>

          {/* Reparto individual */}
          <div className="apple-card-inner bg-white/30 backdrop-blur-lg rounded-2xl p-5 border border-white/60 shadow-xs text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-500 mb-1">
              <Users size={14} className="text-slate-700" />
              <span>Por cada uno de los 8</span>
            </div>
            <p className="text-3xl font-black text-emerald-700 font-mono tracking-tight">
              {porCabeza.toFixed(2)} €
            </p>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block mt-1">
              1/8 del fondo
            </span>
          </div>
        </div>
      </div>

      {/* SECCIÓN JORGE: REGISTRAR LO QUE VAMOS GANANDO CADA JORNADA */}
      {esJorge ? (
        <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-gray-800 flex items-center justify-center text-white shadow-xs border border-white/30">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Añadir Ganancia de la Jornada (Control Jorge)
              </h3>
              <p className="text-xs text-slate-500">
                Introduce el importe ganado en el boleto y con cuántos aciertos se consiguió
              </p>
            </div>
          </div>

          {mensaje && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 border animate-in fade-in duration-200 shadow-xs ${
                mensaje.tipo === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {mensaje.tipo === "success" ? <CheckCircle2 size={16} /> : <Coins size={16} />}
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={registrarGanancia} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cantidad */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Cantidad Ganada (€) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="Ej: 85.50"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    €
                  </span>
                </div>
              </div>

              {/* Jornada */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Jornada Quinigol *
                </label>
                <input
                  type="number"
                  min="1"
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
              </div>

              {/* Con cuántos aciertos */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Con cuántos aciertos *
                </label>
                <input
                  type="text"
                  placeholder="Ej: 11 aciertos, Pleno, etc."
                  value={aciertos}
                  onChange={(e) => setAciertos(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
                />
              </div>
            </div>

            {/* Concepto opcional */}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1.5">
                Nota o Detalle Adicional (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Premio de 1ª categoría boleto sellado en administración"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/60 border border-white/80 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 shadow-xs"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                id="btn-guardar-ganancia"
                disabled={guardando}
                className="px-6 py-3 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all duration-300 ease-out cursor-pointer flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Plus size={15} />
                <span>{guardando ? "Añadiendo al Bote..." : "Añadir Ganancia al Bote"}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="apple-card-opaque bg-white/30 backdrop-blur-xl rounded-2xl p-4 border border-white/60 text-center text-xs text-slate-500 shadow-xs">
          Solo Jorge (Superadmin) puede registrar nuevas ganancias del boleto.
        </div>
      )}

      {/* SECCIÓN 3: HISTORIAL DE GANANCIAS DEL BOTE */}
      <div className="apple-card-opaque bg-white/35 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/50">
          <div className="flex items-center gap-2.5">
            <TrendingUp size={18} className="text-emerald-700" />
            <h3 className="text-base font-black text-slate-900">
              Historial de Ganancias del Bote
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {movimientos.length} registros auditados
          </span>
        </div>

        {movimientos.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs font-medium">
            Aún no hay ganancias registradas. Jorge las irá introduciendo tras cada jornada.
          </div>
        ) : (
          <div className="divide-y divide-white/50">
            {movimientos.map((mov) => {
              const fechaStr = new Date(mov.fecha).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

              return (
                <div
                  key={mov.id}
                  className="py-4 flex flex-wrap items-center justify-between gap-4 hover:bg-white/40 rounded-2xl px-3 transition-all duration-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">
                        {mov.concepto}
                      </span>
                      {mov.jornada && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 font-bold border border-blue-500/20">
                          Jornada {mov.jornada}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {fechaStr}
                      </span>
                      {mov.aciertos && (
                        <span className="flex items-center gap-1 text-emerald-700 font-bold">
                          <Target size={12} />
                          {mov.aciertos}
                        </span>
                      )}
                      <span className="text-slate-400">Por {mov.autor}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-700 font-mono">
                      +{mov.cantidad.toFixed(2)} €
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      (+{(mov.cantidad / 8).toFixed(2)} € / miembro)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
