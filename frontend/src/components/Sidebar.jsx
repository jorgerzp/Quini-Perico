import React, { useState } from "react";

export default function Sidebar({
  seccionActiva,
  setSeccionActiva,
  usuarioActivo,
  boteTotal,
  numeroJornada = 7,
  notificacionesNoLeidas = 0,
  notificaciones = [],
  onMarcarTodasLeidas,
  onLogout,
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [panelNotifAbierto, setPanelNotifAbierto] = useState(false);

  const esSuperAdmin =
    usuarioActivo?.rol === "superadmin" || usuarioActivo?.nombre === "Jorge";

  const elementosMenu = [
    {
      id: "boleto",
      nombre: "Apuesta",
    },
    {
      id: "bote",
      nombre: "Bote Acumulado",
    },
    {
      id: "resultados",
      nombre: "Resultados",
    },
    {
      id: "clasificacion",
      nombre: "Clasificación",
    },
    ...(esSuperAdmin
      ? [
          {
            id: "admin",
            nombre: "Superadmin",
            esNotif: notificacionesNoLeidas > 0,
          },
        ]
      : []),
  ];

  const seleccionarYcerrar = (id) => {
    setSeccionActiva(id);
    setMenuMovilAbierto(false);
    setPanelNotifAbierto(false);
  };

  const nombreFormateado =
    usuarioActivo?.nombre === "Jorge" ? "Jorge R." : usuarioActivo?.nombre || "Miembro";

  return (
    <>
      <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl flex justify-between items-center px-4 sm:px-8 py-3 sm:py-4 z-50">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <h2 className="text-lg font-extrabold tracking-tighter text-stone-800 leading-tight">
              QUINI-PERICO
            </h2>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-1">
          {elementosMenu.map((elem) => {
            const activo = seccionActiva === elem.id;

            return (
              <button
                key={elem.id}
                type="button"
                id={`nav-${elem.id}`}
                onClick={() => seleccionarYcerrar(elem.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all duration-300 cursor-pointer hover-negro-brillante relative ${
                  activo
                    ? "bg-gradient-to-b from-neutral-900 to-black text-white shadow-[0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.3)] border border-white/20"
                    : "text-stone-500 hover:bg-white/50"
                }`}
              >
                <span>{elem.nombre}</span>

                {elem.esNotif && (
                  <span
                    id="badge-notif-superadmin"
                    className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.8)] badge-notif-pulse inline-flex items-center justify-center min-w-[18px]"
                  >
                    {notificacionesNoLeidas}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4 shrink-0 relative">
          {/* Botón de Notificaciones con punto rojo para Jorge */}
          {esSuperAdmin && (
            <div className="relative">
              <button
                type="button"
                id="btn-notificaciones-jorge"
                onClick={() => setPanelNotifAbierto(!panelNotifAbierto)}
                className="p-2 rounded-full bg-white/30 border border-white/50 text-stone-700 hover-negro-brillante cursor-pointer relative transition-all duration-300 flex items-center justify-center"
                title="Notificaciones de apuestas"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>

                {notificacionesNoLeidas > 0 && (
                  <span
                    id="header-notif-dot"
                    className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full text-[10px] font-mono font-black bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.9)] badge-notif-pulse flex items-center justify-center"
                  >
                    {notificacionesNoLeidas}
                  </span>
                )}
              </button>

              {/* Menú desplegable rápido de notificaciones */}
              {panelNotifAbierto && (
                <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                        Apuestas Recibidas
                      </span>
                      {notificacionesNoLeidas > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600 text-white">
                          {notificacionesNoLeidas} nuevas
                        </span>
                      )}
                    </div>
                    {notificacionesNoLeidas > 0 && onMarcarTodasLeidas && (
                      <button
                        type="button"
                        onClick={onMarcarTodasLeidas}
                        className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                      >
                        Marcar todas leídas
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {notificaciones.length === 0 ? (
                      <p className="text-xs text-stone-400 py-4 text-center">
                        No hay notificaciones de apuestas todavía.
                      </p>
                    ) : (
                      notificaciones.slice(0, 5).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => seleccionarYcerrar("admin")}
                          className={`p-3 rounded-2xl transition-all cursor-pointer border ${
                            !n.leida
                              ? "bg-white/80 border-red-200/80 shadow-xs"
                              : "bg-white/30 border-white/50"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-800">
                              {n.usuarioNombre}
                            </span>
                            <span className="text-[10px] font-mono text-stone-400">
                              J.{n.jornadaNumero}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-0.5 font-medium">
                            {n.resumen || "Ha sellado su apuesta oficial."}
                          </p>
                          <span className="text-[10px] text-stone-400 block mt-1">
                            {new Date(n.fecha_creacion).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-3 mt-3 border-t border-stone-200/60 text-center">
                    <button
                      type="button"
                      onClick={() => seleccionarYcerrar("admin")}
                      className="text-xs font-bold text-stone-800 hover:text-stone-600 cursor-pointer"
                    >
                      Ver todas en Superadmin →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="hidden md:block text-right">
            <span className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase block">
              {esSuperAdmin ? "ADMINISTRADOR" : "PARTICIPANTE"}
            </span>
            <p className="text-sm font-bold tracking-tight text-stone-800 leading-tight">
              {nombreFormateado}
            </p>
          </div>

          <button
            type="button"
            id="btn-logout"
            onClick={onLogout}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold tracking-tight text-stone-500 hover:bg-white/50 hover-negro-brillante transition-all duration-300 cursor-pointer"
          >
            Cerrar Sesión
          </button>

          <button
            type="button"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="lg:hidden px-3 py-1.5 bg-white/30 border border-white/50 text-stone-700 text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer hover-negro-brillante transition-all duration-300"
          >
            {menuMovilAbierto ? "Cerrar" : "Menú"}
          </button>
        </div>
      </header>

      {menuMovilAbierto && (
        <div
          onClick={() => setMenuMovilAbierto(false)}
          className="lg:hidden fixed inset-0 bg-stone-800/10 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      <div
        className={`lg:hidden fixed top-24 left-1/2 -translate-x-1/2 w-[95%] max-w-6xl z-40 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-6 transition-all duration-300 ${
          menuMovilAbierto ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="mb-6 pb-4 border-b border-white/60">
          <span className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase block">
            {esSuperAdmin ? "ADMINISTRADOR" : "PARTICIPANTE"}
          </span>
          <p className="text-lg font-extrabold tracking-tight text-stone-800 mt-1">
            {nombreFormateado}
          </p>
          <p className="text-xs text-stone-400 font-medium mt-0.5">
            {usuarioActivo?.aciertos ?? 0} aciertos acumulados
          </p>
        </div>

        <nav className="space-y-1">
          {elementosMenu.map((elem) => {
            const activo = seccionActiva === elem.id;

            return (
              <button
                key={`mobile-${elem.id}`}
                type="button"
                onClick={() => seleccionarYcerrar(elem.id)}
                className={`w-full text-left py-2.5 px-3 rounded-2xl transition-all duration-300 cursor-pointer flex items-baseline justify-between hover-negro-brillante ${
                  activo
                    ? "bg-gradient-to-b from-neutral-900 to-black text-white font-extrabold text-base tracking-tight shadow-sm border border-white/20"
                    : "text-stone-500 hover:bg-white/50 font-medium text-base tracking-tight"
                }`}
              >
                <span>{elem.nombre}</span>
                {elem.esNotif && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold bg-red-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.8)] badge-notif-pulse">
                    {notificacionesNoLeidas} nuevas
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-6 pt-5 border-t border-white/60 space-y-3">
          <div>
            <span className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase block">
              BOTE TOTAL
            </span>
            <p className="text-2xl font-extrabold tracking-tighter text-stone-800 mt-1 font-mono">
              {boteTotal.toFixed(2)} €
            </p>
            <span className="text-[11px] text-stone-400 block mt-1">
              {(boteTotal / 8).toFixed(2)} € por cada uno de los 8
            </span>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="w-full text-center py-2.5 px-4 rounded-2xl text-xs font-semibold tracking-wider uppercase text-stone-500 hover:bg-white/50 hover-negro-brillante transition-all duration-300 cursor-pointer block"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
}
