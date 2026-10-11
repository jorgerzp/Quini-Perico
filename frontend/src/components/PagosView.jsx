import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";
import UserAvatar from "./UserAvatar";

export default function PagosView({ usuarioActivo, onActualizarUsuarios }) {
  const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";

  const [meses, setMeses] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Formulario nuevo mes (Superadmin Jorge)
  const [mostrarCrearMes, setMostrarCrearMes] = useState(false);
  const [nombreNuevoMes, setNombreNuevoMes] = useState("");
  const [cuotaNuevoMes, setCuotaNuevoMes] = useState("10");
  const [creandoMes, setCreandoMes] = useState(false);

  // Edición rápida de cuota
  const [editandoCuotaMesId, setEditandoCuotaMesId] = useState(null);
  const [valorNuevaCuota, setValorNuevaCuota] = useState("");

  const cargarPagos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/pagos`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar los pagos.");
      const mesesOrdenados = (data.meses || []).sort((a, b) => a.id - b.id);
      setMeses(mesesOrdenados);
      setError(null);
    } catch (err) {
      console.error("Error al cargar pagos:", err);
      setError("No se pudieron conectar los datos de pagos mensuales.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPagos();
  }, []);

  // Marcar / Desmarcar pago de un usuario (Solo Superadmin Jorge)
  const handleTogglePago = async (pagoUsuario) => {
    if (!esJorge) return;

    const nuevoEstado = !pagoUsuario.pagado;
    setTogglingId(pagoUsuario.id);

    try {
      const res = await fetch(`${API_URL}/api/pagos/check`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagoUsuarioId: pagoUsuario.id,
          pagado: nuevoEstado,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al actualizar estado.");

      // Actualizar estado local inmediatamente
      setMeses((prevMeses) =>
        prevMeses.map((m) => {
          if (m.id !== pagoUsuario.pagoMesId) return m;
          const nuevosPagos = m.pagosUsuarios.map((pu) =>
            pu.id === pagoUsuario.id ? { ...pu, pagado: nuevoEstado, fechaPago: nuevoEstado ? new Date().toISOString() : null } : pu
          );
          return { ...m, pagosUsuarios: nuevosPagos };
        })
      );

      if (nuevoEstado) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      if (onActualizarUsuarios) {
        onActualizarUsuarios();
      }
    } catch (err) {
      alert("Error al actualizar el pago: " + err.message);
    } finally {
      setTogglingId(null);
    }
  };

  // Crear un nuevo mes
  const handleCrearMes = async (e) => {
    e.preventDefault();
    if (!nombreNuevoMes.trim()) return;

    setCreandoMes(true);
    try {
      const res = await fetch(`${API_URL}/api/pagos/mes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mes: nombreNuevoMes.trim(),
          cuota: parseFloat(cuotaNuevoMes) || 10,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear el mes.");

      setMeses((prev) => [...prev, data.mes]);
      setNombreNuevoMes("");
      setCuotaNuevoMes("10");
      setMostrarCrearMes(false);

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 },
      });
      if (onActualizarUsuarios) {
        onActualizarUsuarios();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCreandoMes(false);
    }
  };

  // Guardar nueva cuota
  const handleGuardarCuota = async (mesId) => {
    const val = parseFloat(valorNuevaCuota);
    if (isNaN(val) || val < 0) {
      alert("Introduce una cuota válida.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/pagos/cuota`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagoMesId: mesId,
          cuota: val,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMeses((prev) =>
        prev.map((m) => (m.id === mesId ? { ...m, cuota: val } : m))
      );
      setEditandoCuotaMesId(null);
      setValorNuevaCuota("");
    } catch (err) {
      alert(err.message);
    }
  };

  const getAvatarColorClass = (color) => {
    switch (color) {
      case "blue": return "bg-blue-600 text-white";
      case "emerald": return "bg-emerald-600 text-white";
      case "amber": return "bg-amber-500 text-white";
      case "indigo": return "bg-indigo-600 text-white";
      case "rose": return "bg-rose-500 text-white";
      case "purple": return "bg-purple-600 text-white";
      case "cyan": return "bg-cyan-600 text-white";
      case "orange": return "bg-orange-500 text-white";
      default: return "bg-stone-700 text-white";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Encabezado Principal */}
      <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500 bg-white/40 px-3 py-1 rounded-full border border-white/60">
                Peña Quini-Perico · Bizum
              </span>
              {esJorge && (
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  Modo Admin Jorge
                </span>
              )}
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-900">
              Control de Pagos
            </h2>
            <p className="text-sm font-medium text-stone-600 tracking-tight mt-1 max-w-xl">
              Seguimiento de la cuota mensual para los boletos de Quinigol. Jorge valida los pagos recibidos por Bizum de cada miembro.
            </p>
          </div>

          {esJorge && (
            <button
              type="button"
              onClick={() => setMostrarCrearMes(!mostrarCrearMes)}
              className="shrink-0 px-6 py-3.5 rounded-full bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_10px_30px_rgba(40,36,32,0.25)] hover:bg-stone-800 transition-all duration-300 cursor-pointer flex items-center gap-2"
            >
              <span>{mostrarCrearMes ? "✕ Cancelar" : "+ Añadir Mes de Pago"}</span>
            </button>
          )}
        </div>

        {/* Modal / Formulario creación nuevo mes */}
        {mostrarCrearMes && esJorge && (
          <form
            onSubmit={handleCrearMes}
            className="mt-6 pt-6 border-t border-white/60 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end animate-in fade-in duration-200"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Nombre de la Caja / Mes
              </label>
              <input
                type="text"
                required
                value={nombreNuevoMes}
                onChange={(e) => setNombreNuevoMes(e.target.value)}
                placeholder="Ej: Pago Noviembre 2026"
                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/70 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Cuota Mensual (€)
              </label>
              <input
                type="number"
                step="0.5"
                required
                value={cuotaNuevoMes}
                onChange={(e) => setCuotaNuevoMes(e.target.value)}
                placeholder="10"
                className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/70 text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:bg-white/80 focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={creandoMes}
                className="w-full py-3.5 px-6 rounded-2xl bg-stone-900 text-white text-xs font-semibold uppercase tracking-wider shadow-sm hover:bg-stone-800 transition-all cursor-pointer disabled:opacity-50"
              >
                {creandoMes ? "Creando..." : "Guardar Nuevo Mes"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Estado de Carga / Error */}
      {cargando && (
        <div className="p-12 text-center bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl">
          <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
            Cargando estado de cuotas...
          </p>
        </div>
      )}

      {error && (
        <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-700 text-sm font-semibold text-center">
          {error}
        </div>
      )}

      {/* Cajas de Meses */}
      {!cargando && meses.length === 0 && (
        <div className="p-12 text-center bg-white/30 backdrop-blur-xl border border-white/50 rounded-3xl text-stone-500 font-medium text-sm">
          No hay meses de pago registrados actualmente.
        </div>
      )}

      {!cargando &&
        meses.map((mes) => {
          const totalMiembros = mes.pagosUsuarios?.length || 0;
          const pagados = mes.pagosUsuarios?.filter((pu) => pu.pagado) || [];
          const numPagados = pagados.length;
          const porcentaje = totalMiembros > 0 ? Math.round((numPagados / totalMiembros) * 100) : 0;
          const recaudado = numPagados * mes.cuota;
          const totalObjetivo = totalMiembros * mes.cuota;
          const completadoTotal = numPagados === totalMiembros && totalMiembros > 0;

          return (
            <div
              key={mes.id}
              className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 sm:p-8 space-y-6"
            >
              {/* Cabecera de la Caja del Mes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/60">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h3 className="text-2xl font-black tracking-tight text-stone-900">
                      {mes.mes}
                    </h3>
                  </div>

                  <p className="text-xs font-medium text-stone-500 mt-1 flex items-center gap-2">
                    <span>
                      Cuota fijada: <strong className="text-stone-800">{mes.cuota.toFixed(2)} €</strong> por miembro
                    </span>
                    {esJorge && editandoCuotaMesId !== mes.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoCuotaMesId(mes.id);
                          setValorNuevaCuota(String(mes.cuota));
                        }}
                        className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-stone-900 underline cursor-pointer"
                      >
                        Cambiar
                      </button>
                    )}
                  </p>

                  {esJorge && editandoCuotaMesId === mes.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="number"
                        step="0.5"
                        value={valorNuevaCuota}
                        onChange={(e) => setValorNuevaCuota(e.target.value)}
                        className="w-24 px-2.5 py-1 text-xs rounded-xl bg-white/70 border border-stone-300 font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleGuardarCuota(mes.id)}
                        className="px-3 py-1 bg-stone-900 text-white text-[11px] font-bold rounded-xl"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditandoCuotaMesId(null)}
                        className="text-[11px] text-stone-400 font-medium"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Resumen financiero & Barra de Progreso */}
                <div className="sm:text-right min-w-[200px]">
                  <div className="flex items-center sm:justify-end gap-2 mb-1.5">
                    <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                      Recaudación:
                    </span>
                    <span className="text-base font-extrabold text-stone-900">
                      {recaudado.toFixed(2)} €
                    </span>
                    <span className="text-xs font-semibold text-stone-400">
                      / {totalObjetivo.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-full bg-stone-200/60 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${porcentaje}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold font-mono text-stone-600 shrink-0">
                      {porcentaje}%
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-stone-500 mt-1">
                    {numPagados} de {totalMiembros} miembros han pagado
                  </p>
                </div>
              </div>

              {/* Mensaje de 100% completado */}
              {completadoTotal && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <span>🎉</span>
                  <span>¡Todas las cuotas de este mes han sido abonadas con éxito!</span>
                </div>
              )}

              {/* Checklist de los 8 Miembros */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-stone-400">
                  <span>Listado de Miembros Oficiales</span>
                  <span>{esJorge ? "Pulsa para cambiar estado" : "Estado Bizum (Solo lectura)"}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  {mes.pagosUsuarios?.map((pagoUsuario) => {
                    const u = pagoUsuario.usuario;
                    if (!u) return null;
                    const pagado = pagoUsuario.pagado;
                    const esElMismo = usuarioActivo?.nombre === u.nombre;

                    return (
                      <div
                        key={pagoUsuario.id}
                        onClick={() => esJorge && handleTogglePago(pagoUsuario)}
                        className={`p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                          esJorge ? "cursor-pointer hover:shadow-md select-none" : "cursor-default"
                        } ${
                          pagado
                            ? "bg-emerald-50/60 border-emerald-200/80 shadow-xs"
                            : "bg-white/40 border-white/60 hover:bg-white/60"
                        } ${esElMismo ? "ring-2 ring-stone-800/20" : ""}`}
                      >
                        {/* Avatar y Nombre */}
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            nombre={u.nombre}
                            avatarColor={u.avatarColor}
                            className="w-10 h-10 rounded-xl shadow-xs"
                            imgClassName="w-full h-full object-cover rounded-xl"
                            fallbackClassName="text-sm font-black"
                          />

                          <div className="min-w-0">
                            <p className="text-sm font-bold text-stone-900 truncate">
                              {u.nombre}
                              {esElMismo && (
                                <span className="text-[10px] font-normal text-stone-500 ml-1">
                                  (Tú)
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] font-medium text-stone-500">
                              {pagado ? (
                                <span className="text-emerald-700 font-bold">
                                  {mes.cuota.toFixed(2)} € pagados
                                </span>
                              ) : (
                                <span className="text-amber-600 font-semibold">
                                  Falta por pagar
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Switch / Badge interactivo para Superadmin o Badge informativo para Usuario */}
                        <div className="shrink-0">
                          {esJorge ? (
                            <button
                              type="button"
                              disabled={togglingId === pagoUsuario.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePago(pagoUsuario);
                              }}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-all duration-200 cursor-pointer shadow-xs ${
                                pagado
                                  ? "bg-emerald-600 text-white ring-2 ring-emerald-300"
                                  : "bg-white border border-stone-300 text-stone-300 hover:text-stone-500"
                              }`}
                              title={pagado ? "Marcar como pendiente" : "Marcar como pagado"}
                            >
                              {togglingId === pagoUsuario.id ? (
                                <span className="w-3.5 h-3.5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin"></span>
                              ) : pagado ? (
                                "✓"
                              ) : (
                                ""
                              )}
                            </button>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold uppercase tracking-wider shrink-0 ${
                                pagado
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : "bg-amber-100/80 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {pagado ? "PAGADO" : "PENDIENTE"}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

      {/* Tarjeta de Información Bizum */}
      <div className="bg-white/20 backdrop-blur-xl border border-white/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="w-12 h-12 rounded-2xl bg-stone-900 text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
          📱
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-stone-900">
            ¿Cómo realizar el pago de la cuota mensual?
          </h4>
          <p className="text-xs font-medium text-stone-600 leading-relaxed">
            Envía el Bizum con el importe de la cuota a <strong>Jorge</strong> al inicio del mes, indicando tu <strong>nombre</strong> y el <strong>mes</strong> en el concepto (ej: <em>"Acuña Octubre"</em>). Una vez recibido, Jorge actualizará tu casilla en esta lista.
          </p>
        </div>
      </div>
    </div>
  );
}
