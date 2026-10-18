import React, { useState, useEffect } from "react";
import { API_URL } from "../config";

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
export function getAvatarPath(nombre, timestamp = null) {
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

  let basePath = mapaLogos[lower];

  if (!basePath) {
    for (const [clave, ruta] of Object.entries(mapaLogos)) {
      if (lower.startsWith(clave) || lower.includes(clave)) {
        basePath = ruta;
        break;
      }
    }
  }

  if (!basePath) {
    basePath = `/imagenes/logo-${clean}.jpg`;
  }

  return timestamp ? `${basePath}?t=${timestamp}` : basePath;
}

/**
 * Componente UserAvatar con soporte para fotos desde Base de Datos (API),
 * fallback a estáticos de Vercel/disco, y badge con inicial de respaldo.
 */
export default function UserAvatar({
  nombre = "",
  avatar = null,
  avatarColor = "default",
  className = "w-8 h-8 rounded-full",
  imgClassName = "w-full h-full object-cover",
  fallbackClassName = "text-xs font-black",
  title = null,
  timestamp = null,
}) {
  const [version, setVersion] = useState(() => timestamp || null);
  const [customAvatar, setCustomAvatar] = useState(() => avatar || null);
  const [falloApi, setFalloApi] = useState(false);
  const [falloEstatico, setFalloEstatico] = useState(false);

  useEffect(() => {
    if (avatar) {
      setCustomAvatar(avatar);
      setFalloApi(false);
      setFalloEstatico(false);
    }
  }, [avatar]);

  useEffect(() => {
    const handleAvatarActualizado = (e) => {
      const updatedNombre = e.detail?.nombre;
      const cleanNombre = String(nombre).trim().toLowerCase();
      const updatedClean = String(updatedNombre || "").trim().toLowerCase();

      if (!updatedNombre || cleanNombre.includes(updatedClean) || updatedClean.includes(cleanNombre)) {
        if (e.detail?.avatar) {
          setCustomAvatar(e.detail.avatar);
        }
        setFalloApi(false);
        setFalloEstatico(false);
        setVersion(e.detail?.timestamp || Date.now());
      }
    };

    window.addEventListener("avatar-actualizado", handleAvatarActualizado);
    return () => window.removeEventListener("avatar-actualizado", handleAvatarActualizado);
  }, [nombre]);

  useEffect(() => {
    setFalloApi(false);
    setFalloEstatico(false);
    if (timestamp) setVersion(timestamp);
  }, [nombre, timestamp]);

  const clean = String(nombre || "").trim();
  const bgClass = AVATAR_BG[avatarColor] || AVATAR_BG.default;
  const inicial = (nombre || "?").charAt(0).toUpperCase();
  const tooltip = title || nombre;

  // 1. Si viene avatar directo en base64/URL, usarlo directamente
  if (customAvatar && !falloApi) {
    return (
      <div
        title={tooltip}
        className={`relative overflow-hidden shrink-0 flex items-center justify-center select-none shadow-xs ${className} bg-stone-200`}
      >
        <img
          src={customAvatar}
          alt={nombre}
          className={`${imgClassName} transition-transform duration-200`}
          loading="lazy"
          onError={() => setFalloApi(true)}
        />
      </div>
    );
  }

  // 2. Ruta API para servir avatar dinámico desde PostgreSQL/Express
  const apiSrc = clean ? `${API_URL}/api/usuario/avatar/${encodeURIComponent(clean)}${version ? `?t=${version}` : ""}` : null;
  // 3. Ruta estática local/Vercel
  const staticSrc = getAvatarPath(clean, version);

  const imgSrc = !falloApi && apiSrc ? apiSrc : !falloEstatico && staticSrc ? staticSrc : null;

  const handleImageError = () => {
    if (!falloApi && apiSrc) {
      setFalloApi(true); // Intenta fallback a staticSrc
    } else {
      setFalloEstatico(true); // Fallback a inicial
    }
  };

  return (
    <div
      title={tooltip}
      className={`relative overflow-hidden shrink-0 flex items-center justify-center select-none shadow-xs ${className} ${
        !imgSrc || (falloApi && falloEstatico) ? bgClass : "bg-stone-200"
      }`}
    >
      {imgSrc && (!falloApi || !falloEstatico) ? (
        <img
          key={imgSrc}
          src={imgSrc}
          alt={nombre}
          className={`${imgClassName} transition-transform duration-200`}
          loading="lazy"
          onError={handleImageError}
        />
      ) : (
        <span className={fallbackClassName}>{inicial}</span>
      )}
    </div>
  );
}
