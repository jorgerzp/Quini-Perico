import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import BoletoView from "./components/BoletoView";
import BoteView from "./components/BoteView";
import ResultadosView from "./components/ResultadosView";
import ClasificacionView from "./components/ClasificacionView";
import AdminView from "./components/AdminView";
import LoginView from "./components/LoginView";

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
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col lg:flex-row antialiased text-black selection:bg-black selection:text-white font-sans">
      {/* Dashboard Lateral Apple Minimalista */}
      <Sidebar
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
        usuarioActivo={usuarioActivo}
        boteTotal={bote?.acumulado || 0}
        numeroJornada={numeroJornada}
        onLogout={handleLogout}
      />

      {/* Área de Contenido Principal con espaciado generoso */}
      <main className="flex-1 p-6 sm:p-12 lg:p-16 overflow-y-auto max-w-5xl w-full mx-auto">
        {/* Cabecera Superior Minimalista Extrema */}
        <div className="hairline-b pb-8 mb-12 flex flex-wrap items-baseline justify-between gap-6">
          <div>
            <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase block mb-1">
              JORNADA {numeroJornada} · QUINIGOL OFICIAL
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-black">
              QUINI-PERICO
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-xs font-semibold tracking-wide uppercase text-gray-400">
              {usuarioActivo?.nombre || "Miembro"}
            </span>

            <button
              type="button"
              id="btn-top-logout"
              onClick={handleLogout}
              className="text-xs font-semibold tracking-wider uppercase text-gray-400 hover:text-black transition-colors cursor-pointer"
            >
              Cerrar Sesión
            </button>
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
