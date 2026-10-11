import React, { useState } from "react";

const AVATAR_BG = {
  blue: "bg-blue-600 text-white",
  emerald: "bg-emerald-600 text-white",
  amber: "bg-amber-500 text-white",
  indigo: "bg-indigo-600 text-white",
  rose: "bg-rose-500 text-white",
  purple: "bg-purple-600 text-white",
  cyan: "bg-cyan-600 text-white",
  orange: "bg-orange-500 text-white",
  default: "bg-stone-700 text-white",
};

/**
 * Obtiene la ruta del logo / imagen de perfil correspondiente al usuario.
 */
export function getAvatarPath(nombre) {
  if (!nombre) return null;
  const clean = String(nombre).trim();
  const lower = clean
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const mapaLogos = {
    acuna: "/imagenes/logo-Acuna.jpg",
    ale: "/imagenes/logo-Ale.jpg",
    andres: "/imagenes/logo-Andres.jpg",
    miguel: "/imagenes/logo-Miguel.jpg",
    mora: "/imagenes/logo-Mora.jpg",
    rafa: "/imagenes/logo-Rafa.jpg",
    vergara: "/imagenes/logo-Vergara.jpg",
    jorge: "/imagenes/logo-Jorge.jpg",
  };

  if (mapaLogos[lower]) return mapaLogos[lower];

  for (const [clave, ruta] of Object.entries(mapaLogos)) {
    if (lower.startsWith(clave) || lower.includes(clave)) {
      return ruta;
    }
  }

  return `/imagenes/logo-${clean}.jpg`;
}

/**
 * Componente UserAvatar que muestra la foto oficial del miembro
 * guardada en la carpeta imagenes. Si no existe imagen o falla,
 * muestra un fallback limpio y elegante con la inicial.
 */
export default function UserAvatar({
  nombre = "",
  avatarColor = "default",
  className = "w-8 h-8 rounded-full",
  imgClassName = "w-full h-full object-cover",
  fallbackClassName = "text-xs font-black",
  title = null,
}) {
  const [errorCarga, setErrorCarga] = useState(false);
  const src = getAvatarPath(nombre);
  const bgClass = AVATAR_BG[avatarColor] || AVATAR_BG.default;
  const inicial = (nombre || "?").charAt(0).toUpperCase();

  const tooltip = title || nombre;

  return (
    <div
      title={tooltip}
      className={`relative overflow-hidden shrink-0 flex items-center justify-center select-none shadow-xs ${className} ${
        errorCarga || !src ? bgClass : "bg-stone-200"
      }`}
    >
      {src && !errorCarga ? (
        <img
          src={src}
          alt={nombre}
          className={`${imgClassName} transition-transform duration-200`}
          loading="lazy"
          onError={() => setErrorCarga(true)}
        />
      ) : (
        <span className={fallbackClassName}>{inicial}</span>
      )}
    </div>
  );
}
