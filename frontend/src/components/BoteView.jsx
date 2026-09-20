import React, { useState } from "react";
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
      setMensaje({ tipo: "error", texto: "Introduce una cantidad válida mayor que 0." });
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
        texto: `Se han añadido +${val.toFixed(2)}€ ganados en la Jornada ${jornada} (${aciertos}) al bote.`,
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
    <div className="space-y-8 max-w-5xl mx-auto pb-24 animate-in fade-in duration-300">
      <section className="bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-6 sm:px-10 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4 mb-4">
          <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
            FONDO OFICIAL ACUMULADO · SINDICATO
          </span>

          {esJorge && onIrAdmin && (
            <button
              type="button"
              onClick={onIrAdmin}
              className="text-xs font-semibold tracking-wider text-stone-400 hover:text-stone-800 uppercase transition-colors cursor-pointer"
            >
              Ir a Superadmin →
            </button>
          )}
        </div>

        <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-stone-800">
          Bote de la Peña
        </h2>

        <div className="mt-8">
          <p className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tighter text-stone-800 font-mono">
            {totalBote.toFixed(2)} €
          </p>
          <p className="text-base sm:text-lg text-stone-500 font-medium mt-3">
            Reparto individual: <strong className="text-stone-800 font-semibold">{porCabeza.toFixed(2)} €</strong> para cada uno de los 8 miembros
          </p>
        </div>
      </section>

      {/* SECCIÓN JORGE: REGISTRAR GANANCIA DE LA JORNADA */}
      {esJorge && (
        <section className="bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-6 sm:px-10 py-10 space-y-6">
          <div>
            <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase block mb-1">
              CONTROL SUPERADMIN
            </span>
            <h3 className="text-2xl font-bold tracking-tight text-stone-800">
              Registrar Ganancia de la Jornada
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Añade el importe ganado y con cuántos aciertos se logró
            </p>
          </div>

          {mensaje && (
            <div
              className={`p-4 rounded-full text-xs font-semibold tracking-wide uppercase transition-all ${
                mensaje.tipo === "success"
                  ? "bg-white/50 border border-white/70 text-stone-800"
                  : "bg-white/40 border border-white/50 text-stone-600"
              }`}
            >
              <span>{mensaje.texto}</span>
            </div>
          )}

          <form onSubmit={registrarGanancia} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider block mb-2">
                  Cantidad Ganada (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Ej: 85.50"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-4 py-3 bg-white/30 border border-white/50 text-stone-800 text-sm font-semibold rounded-2xl focus:border-[#cbb29b] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider block mb-2">
                  Jornada Quinigol
                </label>
                <input
                  type="number"
                  min="1"
                  value={jornada}
                  onChange={(e) => setJornada(e.target.value)}
                  className="w-full px-4 py-3 bg-white/30 border border-white/50 text-stone-800 text-sm font-semibold rounded-2xl focus:border-[#cbb29b] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider block mb-2">
                  Aciertos
                </label>
                <input
                  type="text"
                  placeholder="Ej: 11 aciertos"
                  value={aciertos}
                  onChange={(e) => setAciertos(e.target.value)}
                  className="w-full px-4 py-3 bg-white/30 border border-white/50 text-stone-800 text-sm font-semibold rounded-2xl focus:border-[#cbb29b] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider block mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-4 py-3 bg-white/30 border border-white/50 text-stone-800 text-sm font-semibold rounded-2xl focus:border-[#cbb29b] focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wider block mb-2">
                Nota o Detalle Adicional
              </label>
              <input
                type="text"
                placeholder="Ej: Boleto sellado en administración"
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full px-4 py-3 bg-white/30 border border-white/50 text-stone-800 text-sm font-semibold rounded-2xl focus:border-[#cbb29b] focus:outline-none transition-colors"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                id="btn-guardar-ganancia"
                disabled={guardando}
                className="bg-stone-800 text-white text-sm font-semibold tracking-tight rounded-full py-4 px-10 shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {guardando ? "Añadiendo al Bote..." : "Añadir Ganancia al Bote"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* SECCIÓN 3: HISTORIAL AUDITADO DE GANANCIAS */}
      <section className="bg-white/40 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl px-6 sm:px-10 py-10 space-y-6">
        <div className="flex items-baseline justify-between">
          <h3 className="text-2xl font-bold tracking-tight text-stone-800">
            Historial de Ganancias
          </h3>
          <span className="text-xs font-mono text-stone-400">
            {movimientos.length} registros auditados
          </span>
        </div>

        {movimientos.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-400 font-normal">
            Aún no hay ganancias registradas. Jorge las irá introduciendo tras cada jornada.
          </p>
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
                  className="py-6 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="text-lg font-semibold tracking-tight text-stone-800">
                      {mov.concepto}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-stone-400 font-mono">
                      <span>{fechaStr}</span>
                      <span>·</span>
                      {mov.jornada && <span>Jornada {mov.jornada}</span>}
                      {mov.aciertos && (
                        <>
                          <span>·</span>
                          <span className="text-stone-600 font-semibold">{mov.aciertos}</span>
                        </>
                      )}
                      <span>·</span>
                      <span>Por {mov.autor}</span>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-2xl font-extrabold tracking-tight text-stone-800">
                      +{mov.cantidad.toFixed(2)} €
                    </span>
                    <span className="text-xs text-stone-400 block mt-0.5">
                      (+{(mov.cantidad / 8).toFixed(2)} € / miembro)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

