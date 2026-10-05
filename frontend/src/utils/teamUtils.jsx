import React from "react";

/**
 * Calcula las clases CSS óptimas de Tailwind para el tamaño y comportamiento del nombre del equipo.
 * Ajusta de forma fluida el tamaño de fuente según la longitud del texto:
 * - Nombres cortos (≤ 11 chars): tamaño completo text-xl sm:text-2xl
 * - Nombres medios (12-15 chars): text-lg sm:text-xl md:text-2xl
 * - Nombres largos (16-20 chars, ej. Atlético de Madrid): text-base sm:text-lg md:text-xl
 * - Nombres muy largos (≥ 21 chars, ej. Deportivo de La Coruña): text-sm sm:text-base md:text-lg
 */
export function getTeamNameClass(name) {
  const len = (name || "").trim().length;

  if (len >= 21) {
    return "text-sm sm:text-base md:text-lg font-semibold tracking-tight text-stone-800 leading-snug";
  }
  if (len >= 16) {
    return "text-base sm:text-lg md:text-xl font-semibold tracking-tight text-stone-800 leading-snug";
  }
  if (len >= 12) {
    return "text-lg sm:text-xl md:text-2xl font-semibold tracking-tight text-stone-800 leading-snug";
  }
  return "text-xl sm:text-2xl md:text-2xl font-semibold tracking-tight text-stone-800 leading-tight";
}

/**
 * Componente reutilizable para renderizar el nombre completo del equipo.
 * Garantiza que siempre quepa íntegro en cualquier resolución reduciendo el tamaño si es necesario,
 * sin truncar con puntos suspensivos ("...") ni desbordar los botones.
 */
export function TeamName({ name, className = "" }) {
  const sizeClass = getTeamNameClass(name);

  return (
    <span
      className={`${sizeClass} flex-1 min-w-0 pr-2 break-words ${className}`}
      title={name || ""}
    >
      {name || "Equipo"}
    </span>
  );
}
