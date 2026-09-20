import React, { useState } from "react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";

export default function LoginView({ onLoginSuccess }) {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) {
      setError("Por favor, introduce tu nombre de usuario.");
      return;
    }

    if (!password) {
      setError("Por favor, introduce la contraseña.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombreLimpio,
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error de autenticación. Verifica tus credenciales.");
      }

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      onLoginSuccess(data.usuario);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-100 via-[#f8f5f2] to-[#e8e4de] flex items-center justify-center p-6 sm:p-12 antialiased text-[#4a4641] font-sans">
      <div className="w-full max-w-lg bg-white/40 backdrop-blur-2xl rounded-3xl p-8 sm:p-12 border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">
            Peña Oficial
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-stone-800 mb-3">
            QUINI-PERICO
          </h1>
          <p className="text-sm font-medium text-stone-500 tracking-tight">
            Acceso a la peña. Introduce tu nombre y la contraseña unificada.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="input-nombre" className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2 block">
              Nombre de Usuario
            </label>
            <input
              id="input-nombre"
              type="text"
              autoComplete="username"
              placeholder="Ej: Jorge, Rafa, Miguel, Acuña..."
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-base font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#cbb29b] transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="input-password" className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Contraseña
              </label>
              <span className="text-xs text-stone-400 font-mono tracking-tight">
                PuertoPerico
              </span>
            </div>

            <div className="relative">
              <input
                id="input-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Introduce tu contraseña"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 pr-20 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-base font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#cbb29b] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {error && (
            <div
              id="login-error-alert"
              role="alert"
              className="p-4 rounded-2xl bg-white/40 border border-white/60 text-stone-800 text-xs font-semibold tracking-tight"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            id="btn-login-submit"
            disabled={loading}
            className="w-full py-4 px-10 rounded-full bg-stone-800 text-white text-base font-semibold tracking-tight shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40"
          >
            {loading ? "Autenticando..." : "Entrar al Dashboard"}
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-white/60 text-center space-y-2">
          <p className="text-xs text-stone-500 font-medium">
            Miembros de la peña:{" "}
            <span className="text-stone-800 font-semibold">
              Jorge, Rafa, Miguel, Acuña, Andrés, Mora, Vergara, Ale
            </span>
          </p>
          <p className="text-xs text-stone-400 font-mono">
            Contraseña unificada: <span className="text-stone-600 font-semibold">PuertoPerico</span>
          </p>
        </div>
      </div>
    </div>
  );
}

