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
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6 sm:p-12 antialiased text-black font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl p-8 sm:p-12 border border-gray-200/80 shadow-xs">
        {/* Header Branding */}
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
            Peña Oficial
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-black mb-3">
            QUINI-PERICO
          </h1>
          <p className="text-sm font-medium text-gray-500 tracking-tight">
            Acceso a la peña. Introduce tu nombre y la contraseña unificada.
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Name Input */}
          <div>
            <label htmlFor="input-nombre" className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2 block">
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
              className="w-full px-4 py-3.5 rounded-2xl bg-[#f5f5f7] border border-gray-200/80 text-base font-semibold text-black placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
            />
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="input-password" className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Contraseña
              </label>
              <span className="text-xs text-gray-400 font-mono tracking-tight">
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
                className="w-full px-4 pr-20 py-3.5 rounded-2xl bg-[#f5f5f7] border border-gray-200/80 text-base font-semibold text-black placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-black transition-colors cursor-pointer"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              id="login-error-alert"
              role="alert"
              className="p-4 rounded-2xl bg-gray-100 border border-gray-300 text-black text-xs font-semibold tracking-tight"
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            id="btn-login-submit"
            disabled={loading}
            className="w-full py-4 px-8 rounded-full bg-black text-white text-base font-semibold tracking-tight hover:opacity-85 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-40"
          >
            {loading ? "Autenticando..." : "Entrar al Dashboard"}
          </button>
        </form>

        {/* Footer info: Members list and password */}
        <div className="mt-10 pt-6 border-t border-gray-200/80 text-center space-y-2">
          <p className="text-xs text-gray-500 font-medium">
            Miembros de la peña:{" "}
            <span className="text-black font-semibold">
              Jorge, Rafa, Miguel, Acuña, Andrés, Mora, Vergara, Ale
            </span>
          </p>
          <p className="text-xs text-gray-400 font-mono">
            Contraseña unificada: <span className="text-gray-700 font-semibold">PuertoPerico</span>
          </p>
        </div>
      </div>
    </div>
  );
}

