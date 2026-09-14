import React, { useState } from "react";
import {
  Ticket,
  Coins,
  Trophy,
  Send,
  Settings,
  X,
  Menu,
  Crown,
  LogOut,
} from "lucide-react";

export default function Sidebar({
  seccionActiva,
  setSeccionActiva,
  usuarioActivo,
  boteTotal,
  onLogout,
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const esSuperAdmin =
    usuarioActivo?.rol === "superadmin" || usuarioActivo?.nombre === "Jorge";

  // Requisito estricto: El Superadmin solo aparece para Jorge, nunca para los demás
  const elementosMenu = [
    {
      id: "boleto",
      nombre: "Boleto Quinigol",
      icono: Ticket,
      badge: null,
    },
    {
      id: "bote",
      nombre: "Bote",
      icono: Coins,
      badge: `${boteTotal.toFixed(0)} €`,
      badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold",
    },
    {
      id: "resultados",
      nombre: "Resultados",
      icono: Send,
      badge: null,
    },
    {
      id: "clasificacion",
      nombre: "Clasificación",
      icono: Trophy,
      badge: null,
    },
    ...(esSuperAdmin
      ? [
          {
            id: "admin",
            nombre: "Superadmin",
            icono: Settings,
            badge: "Jorge",
            badgeColor: "bg-blue-500/25 text-blue-300 border border-blue-400/30 font-bold",
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
      {/* Botón hamburguesa móvil */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="p-2.5 rounded-2xl bg-slate-900/90 shadow-xl border border-white/15 text-white backdrop-blur-md cursor-pointer hover:bg-black"
        >
          {menuMovilAbierto ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop móvil */}
      {menuMovilAbierto && (
        <div
          onClick={() => setMenuMovilAbierto(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30 transition-opacity"
        />
      )}

      {/* Sidebar Lateral Opaco Apple Dark */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 apple-glass-dark flex flex-col justify-between transition-transform duration-300 shrink-0 ${
          menuMovilAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6">
          {/* macOS window dots */}
          <div className="flex items-center gap-2 mb-7">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block shadow-2xs"></span>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block shadow-2xs"></span>
            <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block shadow-2xs"></span>
            <span className="text-[10px] font-bold tracking-widest text-slate-400 ml-2 uppercase">
              QUINI-PERICO PRO
            </span>
          </div>

          {/* Logo y Nombre de la Peña */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white flex items-center justify-center font-black tracking-tight text-base shadow-lg shadow-blue-500/25 border border-white/20">
              QP
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white leading-tight">
                QUINI-PERICO
              </h1>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                Peña Quinigol Pro
              </span>
            </div>
          </div>

          {/* Tarjeta de Perfil Estática (Sin desplegable, estilo Apple opaco) */}
          <div className="mb-6 p-3 rounded-2xl bg-slate-900/80 border border-white/10 shadow-inner flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-md shrink-0 ${
                  esSuperAdmin
                    ? "bg-gradient-to-tr from-blue-600 to-indigo-500 ring-2 ring-blue-400/40"
                    : "bg-slate-700 ring-1 ring-white/10"
                }`}
              >
                {usuarioActivo?.nombre ? usuarioActivo.nombre.substring(0, 2).toUpperCase() : "U"}
              </div>
              <div className="truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white truncate">
                    {esSuperAdmin ? `ADMIN: ${nombreFormateado}` : nombreFormateado}
                  </span>
                  {esSuperAdmin && (
                    <Crown size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {usuarioActivo?.aciertos ?? 0} aciertos · {usuarioActivo?.puntos ?? 0} pts
                </p>
              </div>
            </div>
            {esSuperAdmin ? (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold border border-blue-400/30 uppercase tracking-wider">
                Jorge
              </span>
            ) : (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium border border-white/10">
                Miembro
              </span>
            )}
          </div>

          {/* Menú de Navegación con hover en Negro Profundo */}
          <nav className="space-y-1.5">
            {elementosMenu.map((elem) => {
              const Icono = elem.icono;
              const activo = seccionActiva === elem.id;

              return (
                <button
                  key={elem.id}
                  type="button"
                  id={`nav-${elem.id}`}
                  onClick={() => seleccionarYcerrar(elem.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer border ${
                    activo
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border-blue-400/40"
                      : "text-slate-300 bg-transparent border-transparent hover:bg-black hover:text-white hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icono
                      size={16}
                      className={activo ? "text-white" : "text-slate-400"}
                    />
                    <span>{elem.nombre}</span>
                  </div>

                  {elem.badge && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md ${
                        activo
                          ? "bg-white/20 text-white font-bold"
                          : elem.badgeColor || "bg-white/10 text-slate-300"
                      }`}
                    >
                      {elem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Widget Inferior de Bote y Cerrar Sesión */}
        <div className="p-4 m-4 space-y-2">
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 shadow-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Coins size={12} className="text-amber-400" /> Bote Quinigol
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase tracking-wide">
                En Vivo
              </span>
            </div>
            <p className="text-2xl font-black text-white tracking-tight font-mono">
              {boteTotal.toFixed(2)}{" "}
              <span className="text-xs font-semibold text-slate-400">EUR</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              8 miembros • {(boteTotal / 8).toFixed(2)} € por cabeza
            </p>
          </div>

          {/* Botón Cerrar Sesión (Presente para todos) */}
          <button
            type="button"
            id="btn-logout"
            onClick={onLogout}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-black border border-transparent hover:border-red-500/30 transition-all cursor-pointer shadow-sm hover-black-btn"
          >
            <div className="flex items-center gap-2">
              <LogOut size={15} />
              <span>Cerrar Sesión</span>
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Salir</span>
          </button>
        </div>
      </aside>
    </>
  );
}
