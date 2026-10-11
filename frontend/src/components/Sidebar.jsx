import React, { useState } from "react";
import UserAvatar from "./UserAvatar";

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

  const esSuperAdmin =
    usuarioActivo?.rol === "superadmin" || usuarioActivo?.nombre === "Jorge";
  const esDemo =
    usuarioActivo?.rol === "demo" || usuarioActivo?.isDemo || usuarioActivo?.nombre?.toLowerCase() === "demo";

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
    {
      id: "pagos",
      nombre: "Pagos",
    },
    ...(esSuperAdmin || esDemo
      ? [
          {
            id: "admin",
            nombre: esDemo ? "Superadmin (Demo)" : "Superadmin",
            esNotif: !esDemo && notificacionesNoLeidas > 0,
          },
        ]
      : []),
  ];

  const seleccionarYcerrar = (id) => {
    setSeccionActiva(id);
    setMenuMovilAbierto(false);
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
          <div className="hidden md:flex items-center gap-3">
            <UserAvatar
              nombre={usuarioActivo?.nombre}
              className="w-9 h-9 rounded-full ring-2 ring-white/60 shadow-xs"
              imgClassName="w-full h-full object-cover rounded-full"
              fallbackClassName="text-xs font-black"
            />
            <div className="text-right">
              <span className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase block">
                {esDemo ? "MODO DEMO" : esSuperAdmin ? "ADMINISTRADOR" : "PARTICIPANTE"}
              </span>
              <p className="text-sm font-bold tracking-tight text-stone-800 leading-tight">
                {esDemo ? "Usuario Demo" : nombreFormateado}
              </p>
            </div>
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
        <div className="mb-6 pb-4 border-b border-white/60 flex items-center gap-3.5">
          <UserAvatar
            nombre={usuarioActivo?.nombre}
            className="w-12 h-12 rounded-2xl ring-2 ring-white/60 shadow-xs"
            imgClassName="w-full h-full object-cover rounded-2xl"
            fallbackClassName="text-base font-black"
          />
          <div>
            <span className="text-[10px] font-semibold tracking-widest text-stone-400 uppercase block">
              {esDemo ? "MODO DEMO" : esSuperAdmin ? "ADMINISTRADOR" : "PARTICIPANTE"}
            </span>
            <p className="text-lg font-extrabold tracking-tight text-stone-800 mt-0.5">
              {esDemo ? "Usuario Demo" : nombreFormateado}
            </p>
            <p className="text-xs text-stone-400 font-medium mt-0.5">
              {esDemo ? "Acceso de invitado (solo lectura)" : `${usuarioActivo?.aciertos ?? 0} aciertos acumulados`}
            </p>
          </div>
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
