import React, { useState } from "react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";

export default function LoginView({ onLoginSuccess }) {
  const [nombre, setNombre] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarLogin = async (user, pass) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: user.trim(),
          password: pass.trim(),
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

    await ejecutarLogin(nombreLimpio, password);
  };

  const handleAccesoDemo = async () => {
    setNombre("demo");
    setPassword("demo");
    await ejecutarLogin("demo", "demo");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 sm:p-12 antialiased text-[#4a4641] font-sans">
      <div className="w-full max-w-lg bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-8 sm:p-12">
        <div className="mb-8">
          <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">
            Peña Oficial
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tighter text-stone-800 mb-3">
            QUINI-PERICO
          </h1>
          <p className="text-sm font-medium text-stone-500 tracking-tight">
            Acceso a la peña. Introduce tus credenciales o utiliza el acceso de demostración.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="input-nombre" className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2 block">
              Nombre de Usuario
            </label>
            <input
              id="input-nombre"
              type="text"
              autoComplete="username"
              placeholder="Introduce tu usuario..."
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-base font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-stone-800 transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="input-password" className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                Contraseña
              </label>
            </div>

            <div className="relative">
              <input
                id="input-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Introduce tu contraseña..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 pr-20 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-base font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-stone-800 transition-all"
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

        {/* Acceso Modo Demo (Demostración Pública) */}
        <div className="mt-8 pt-6 border-t border-white/60">
          <div className="bg-white/40 border border-white/60 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
                  Acceso Modo Demostración
                </span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-200/80 text-stone-600 px-2 py-0.5 rounded-full">
                Solo Lectura
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed font-medium">
              Explora libremente todas las secciones de la aplicación sin alterar datos utilizando estas credenciales:
            </p>

            <div className="grid grid-cols-2 gap-3 bg-white/60 p-3 rounded-xl border border-white/70">
              <div>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Usuario
                </span>
                <span className="font-mono font-bold text-stone-800 text-sm">demo</span>
              </div>
              <div>
                <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider block">
                  Contraseña
                </span>
                <span className="font-mono font-bold text-stone-800 text-sm">demo</span>
              </div>
            </div>

            <button
              type="button"
              id="btn-login-demo"
              onClick={handleAccesoDemo}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold tracking-tight transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <span>Acceder directamente como Demo</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
