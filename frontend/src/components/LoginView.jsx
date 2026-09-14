import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, User, AlertCircle, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

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
      const res = await fetch("http://localhost:3001/api/login", {
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
    <div className="min-h-screen stadium-bg flex items-center justify-center p-4 antialiased selection:bg-blue-600 selection:text-white">
      {/* Tarjeta Opaca Apple Dark sobre fondo de fútbol */}
      <div className="w-full max-w-md apple-card-opaque rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden text-white animate-in fade-in zoom-in-95 duration-300">
        {/* macOS traffic light window dots */}
        <div className="flex items-center gap-1.5 mb-8 opacity-75">
          <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] inline-block shadow-2xs"></span>
          <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] inline-block shadow-2xs"></span>
          <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] inline-block shadow-2xs"></span>
          <span className="text-[10px] font-bold tracking-widest text-slate-400 ml-2 uppercase font-mono">
            QUINI-PERICO PRO
          </span>
        </div>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white flex items-center justify-center font-black tracking-tight text-2xl shadow-xl shadow-blue-500/30 mx-auto mb-4 border border-white/25">
            QP
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            QUINI-PERICO
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Acceso a la peña · Escribe tu nombre y la contraseña
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Name Input */}
          <div>
            <label htmlFor="input-nombre" className="text-xs font-bold text-slate-300 block mb-1.5">
              Nombre de Usuario
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <User size={16} />
              </div>
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
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/60 border border-white/15 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-white/30 shadow-inner transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-password" className="text-xs font-bold text-slate-300">
                Contraseña
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                PuertoPerico
              </span>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock size={16} />
              </div>
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
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-black/60 border border-white/15 text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-white/30 shadow-inner transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-white transition cursor-pointer"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              id="login-error-alert"
              role="alert"
              className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-150"
            >
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button con hover en Negro Profundo */}
          <button
            type="submit"
            id="btn-login-submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl bg-blue-600 border border-blue-400/30 text-white font-black text-sm tracking-wide shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 hover-black-btn"
          >
            {loading ? (
              <span>Autenticando...</span>
            ) : (
              <>
                <span>Entrar al Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer info: Members list and password */}
        <div className="mt-8 pt-4 border-t border-white/10 text-center space-y-1.5">
          <p className="text-[11px] text-slate-400 font-medium">
            Miembros de la peña:{" "}
            <span className="text-slate-200 font-bold">
              Jorge, Rafa, Miguel, Acuña, Andrés, Mora, Vergara, Ale
            </span>
          </p>
          <p className="text-[10px] text-slate-500 font-mono">
            Contraseña unificada: <strong className="text-slate-300">PuertoPerico</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
