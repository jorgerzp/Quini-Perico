import React, { useState } from "react";

export default function Sidebar({
  seccionActiva,
  setSeccionActiva,
  usuarioActivo,
  boteTotal,
  numeroJornada = 7,
  onLogout,
}) {
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const esSuperAdmin =
    usuarioActivo?.rol === "superadmin" || usuarioActivo?.nombre === "Jorge";

  const elementosMenu = [
    {
      id: "boleto",
      nombre: "Boleto Quinigol",
      badge: `J${numeroJornada}`,
    },
    {
      id: "bote",
      nombre: "Bote Acumulado",
      badge: `${boteTotal.toFixed(0)} €`,
    },
    {
      id: "resultados",
      nombre: "Resultados",
      badge: null,
    },
    {
      id: "clasificacion",
      nombre: "Clasificación",
      badge: null,
    },
    ...(esSuperAdmin
      ? [
          {
            id: "admin",
            nombre: "Superadmin",
            badge: "Jorge",
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
      {/* Botón menú móvil minimalista */}
      <div className="lg:hidden fixed top-4 left-4 z-40">
        <button
          type="button"
          onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
          className="px-3 py-1.5 bg-white border border-gray-200 text-black text-xs font-bold uppercase tracking-wider rounded-full shadow-xs cursor-pointer"
        >
          {menuMovilAbierto ? "Cerrar" : "Menú"}
        </button>
      </div>

      {/* Backdrop móvil */}
      {menuMovilAbierto && (
        <div
          onClick={() => setMenuMovilAbierto(false)}
          className="lg:hidden fixed inset-0 bg-black/10 z-30 transition-opacity"
        />
      )}

      {/* Sidebar Lateral Apple Minimalismo Extremo */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen z-40 w-72 bg-[#f5f5f7] hairline-r flex flex-col justify-between p-8 sm:p-10 overflow-y-auto transition-transform duration-300 shrink-0 ${
          menuMovilAbierto ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Nombre de la Peña */}
          <div className="mb-10">
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase block mb-1">
              PEÑA QUINIGOL
            </span>
            <h2 className="text-xl font-extrabold tracking-tighter text-black">
              QUINI-PERICO
            </h2>
          </div>

          {/* Información del Usuario */}
          <div className="mb-10 hairline-b pb-6">
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase block">
              {esSuperAdmin ? "ADMINISTRADOR" : "PARTICIPANTE"}
            </span>
            <p className="text-lg font-extrabold tracking-tight text-black mt-1">
              {nombreFormateado}
            </p>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {usuarioActivo?.aciertos ?? 0} aciertos acumulados
            </p>
          </div>

          {/* Menú de Navegación Tipográfico */}
          <nav className="space-y-3">
            {elementosMenu.map((elem) => {
              const activo = seccionActiva === elem.id;

              return (
                <button
                  key={elem.id}
                  type="button"
                  id={`nav-${elem.id}`}
                  onClick={() => seleccionarYcerrar(elem.id)}
                  className={`w-full text-left py-2 transition-colors cursor-pointer flex items-baseline justify-between ${
                    activo
                      ? "text-black font-extrabold text-base tracking-tight"
                      : "text-gray-400 hover:text-black font-medium text-base tracking-tight"
                  }`}
                >
                  <span>{elem.nombre}</span>

                  {elem.badge && (
                    <span className="text-xs font-mono font-medium text-gray-400">
                      {elem.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Resumen de Bote y Cerrar Sesión */}
        <div className="hairline-t pt-8 mt-10 space-y-5">
          <div>
            <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase block">
              BOTE TOTAL
            </span>
            <p className="text-3xl font-extrabold tracking-tighter text-black mt-1 font-mono">
              {boteTotal.toFixed(2)} €
            </p>
            <span className="text-[11px] text-gray-400 block mt-1">
              {(boteTotal / 8).toFixed(2)} € por cada uno de los 8
            </span>
          </div>

          <button
            type="button"
            id="btn-logout"
            onClick={onLogout}
            className="text-xs font-semibold tracking-wider text-gray-400 hover:text-black uppercase transition-colors cursor-pointer block pt-2"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

