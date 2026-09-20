import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import BoletoView from "./components/BoletoView";
import BoteView from "./components/BoteView";
import ResultadosView from "./components/ResultadosView";
import ClasificacionView from "./components/ClasificacionView";
import AdminView from "./components/AdminView";
import LoginView from "./components/LoginView";
import { LogOut } from "lucide-react";

const STORAGE_AUTH_KEY = "quini_perico_auth_user";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [seccionActiva, setSeccionActiva] = useState("boleto");
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [bote, setBote] = useState({ acumulado: 0, movimientos: [] });
  const [clasificacion, setClasificacion] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [numeroJornada, setNumeroJornada] = useState(7);
  const [cargando, setCargando] = useState(true);

  // Cargar usuarios
  const cargarUsuarios = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/usuarios`);
      if (res.ok) {
        const data = await res.json();
        setUsuarios(data);

        // Sincronizar usuario activo
        setUsuarioActivo((actual) => {
          if (actual) {
            const refrescado = data.find((u) => u.id === actual.id || u.nombre === actual.nombre);
            return refrescado || actual;
          }
          if (usuarioLogueado) {
            const match = data.find((u) => u.id === usuarioLogueado.id || u.nombre === usuarioLogueado.nombre);
            if (match) return match;
          }
          const jorge = data.find((u) => u.nombre === "Jorge");
          return jorge || data[0] || null;
        });
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  }, [usuarioLogueado]);

  // Cargar Bote
  const cargarBote = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/bote`);
      if (res.ok) {
        const data = await res.json();
        setBote(data);
      }
    } catch (err) {
      console.error("Error al cargar bote:", err);
    }
  }, []);

  // Cargar Clasificación por aciertos
  const cargarClasificacion = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/clasificacion`);
      if (res.ok) {
        const data = await res.json();
        setClasificacion(data);
      }
    } catch (err) {
      console.error("Error al cargar clasificación:", err);
    }
  }, []);

  // Cargar Partidos oficiales de la jornada (extraídos con OCR o por defecto)
  const cargarPartidos = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/jornada/partidos`);
      if (res.ok) {
        const data = await res.json();
        if (data?.partidos !== undefined) {
          setPartidos(data.partidos);
        }
        if (data?.jornada) {
          setNumeroJornada(data.jornada);
        }
      }
    } catch (err) {
      console.error("Error al cargar partidos de la jornada:", err);
    }
  }, []);

  const recargarTodo = useCallback(async () => {
    await Promise.all([cargarUsuarios(), cargarBote(), cargarClasificacion(), cargarPartidos()]);
    setCargando(false);
  }, [cargarUsuarios, cargarBote, cargarClasificacion, cargarPartidos]);

  useEffect(() => {
    recargarTodo();
  }, [recargarTodo]);

  // Sincronización en vivo: al cambiar a boleto o resultados, cargar partidos de inmediato
  useEffect(() => {
    if (seccionActiva === "boleto" || seccionActiva === "resultados") {
      cargarPartidos();
    }
  }, [seccionActiva, cargarPartidos]);

  // Polling cada 10s para que a los demás usuarios les salgan en vivo los partidos que fija Jorge
  useEffect(() => {
    const interval = setInterval(() => {
      cargarPartidos();
    }, 10000);
    return () => clearInterval(interval);
  }, [cargarPartidos]);

  // Manejo de Login y Logout
  const handleLoginSuccess = (usuario) => {
    setUsuarioLogueado(usuario);
    setUsuarioActivo(usuario);
    try {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(usuario));
    } catch (e) {
      console.error(e);
    }
    setSeccionActiva("boleto");
  };

  const handleLogout = () => {
    setUsuarioLogueado(null);
    setUsuarioActivo(null);
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Protección de acceso: si un miembro no-admin intenta estar en "admin", redirigir
  useEffect(() => {
    const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";
    if (seccionActiva === "admin" && !esJorge) {
      setSeccionActiva("boleto");
    }
  }, [seccionActiva, usuarioActivo]);

  // Sumar rápido al bote desde la vista de bote
  const sumarBoteRapido = async (cantidad, concepto) => {
    try {
      const res = await fetch(`${API_URL}/api/bote/sumar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad,
          concepto,
          autor: `${usuarioActivo?.nombre || "Jorge"} (Superadmin)`,
        }),
      });
      if (res.ok) {
        await cargarBote();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Si no está autenticado, mostrar LoginView
  if (!usuarioLogueado) {
    return (
      <LoginView
        usuarios={usuarios}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen frosted-bg bg-gradient-to-br from-stone-100 via-gray-50 to-stone-200 flex flex-col lg:flex-row antialiased text-slate-800 selection:bg-slate-900 selection:text-white relative overflow-x-hidden font-sans">
      {/* Luces ambientales translúcidas de fondo estilo VisionOS */}
      <div className="fixed top-[-100px] left-[-100px] w-[550px] h-[550px] rounded-full bg-blue-100/50 blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[550px] h-[550px] rounded-full bg-amber-100/45 blur-[140px] pointer-events-none -z-10" />

      {/* Dashboard Lateral Traslúcido Apple Frosted Glass */}
      <Sidebar
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
        usuarioActivo={usuarioActivo}
        boteTotal={bote?.acumulado || 0}
        numeroJornada={numeroJornada}
        onLogout={handleLogout}
      />

      {/* Área de Contenido Principal sobre el Cristal Esmerilado */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 lg:ml-0 overflow-y-auto max-w-6xl w-full">
        {/* Cabecera Superior Frosted Glass: JORNADA X */}
        <div className="mb-6 p-4 sm:px-6 sm:py-3.5 rounded-3xl apple-card-opaque border border-white/60 shadow-[0_8px_32px_0_rgba(31,38,135,0.06)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-gray-800 text-white flex flex-col items-center justify-center font-mono shadow-sm shrink-0 border border-white/30">
              <span className="text-[9px] font-bold text-slate-300 leading-none uppercase">JORNADA</span>
              <span className="text-xl font-black leading-none mt-0.5">{numeroJornada}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  QUINIGOL OFICIAL
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/25 text-[10px] font-bold">
                  Jornada {numeroJornada} Activa
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Peña Quini-Perico
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 hidden md:inline">
                {partidos && partidos.length === 6 ? "Partidos fijados para la jornada" : "En espera de Jorge"}
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  partidos && partidos.length === 6 ? "bg-emerald-500 shadow-sm" : "bg-amber-400"
                }`}
              ></span>
            </div>

            <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 px-3 py-1 rounded-xl bg-white/70 border border-white/80 shadow-xs">
                {usuarioActivo?.nombre || "Miembro"}
              </span>
              <button
                type="button"
                id="btn-top-logout"
                onClick={handleLogout}
                title="Cerrar Sesión"
                className="px-3 py-1.5 rounded-xl bg-white/40 hover:bg-white/80 border border-white/70 text-slate-600 hover:text-red-600 text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>

        {seccionActiva === "boleto" && (
          <BoletoView
            usuarioActivo={usuarioActivo}
            partidos={partidos}
            numeroJornada={numeroJornada}
            onIrAdmin={() => setSeccionActiva("admin")}
            onJugadaConfirmada={() => {
              cargarUsuarios();
              cargarClasificacion();
            }}
          />
        )}

        {seccionActiva === "bote" && (
          <BoteView
            bote={bote}
            usuarioActivo={usuarioActivo}
            numeroJornada={numeroJornada}
            onIrAdmin={() => setSeccionActiva("admin")}
            onSumarBoteRapido={sumarBoteRapido}
            onBoteActualizado={cargarBote}
          />
        )}

        {seccionActiva === "resultados" && (
          <ResultadosView
            usuarioActivo={usuarioActivo}
            partidos={partidos}
            numeroJornada={numeroJornada}
            onResultadosGuardados={() => {
              cargarClasificacion();
              cargarUsuarios();
            }}
          />
        )}

        {seccionActiva === "clasificacion" && (
          <ClasificacionView
            clasificacion={clasificacion}
            usuarioActivo={usuarioActivo}
            numeroJornada={numeroJornada}
            onIrBoleto={() => setSeccionActiva("boleto")}
          />
        )}

        {seccionActiva === "admin" && (
          <AdminView
            bote={bote}
            usuarios={usuarios}
            usuarioActivo={usuarioActivo}
            partidosActuales={partidos}
            numeroJornada={numeroJornada}
            onJornadaActualizada={(n) => setNumeroJornada(n)}
            onPartidosActualizados={(nuevos, num) => {
              setPartidos(nuevos);
              if (num) setNumeroJornada(num);
            }}
            onBoteActualizado={cargarBote}
            onIrResultados={() => setSeccionActiva("resultados")}
            onActualizarUsuarios={cargarUsuarios}
          />
        )}
      </main>
    </div>
  );
}
