import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import BoletoView from "./components/BoletoView";
import BoteView from "./components/BoteView";
import ResultadosView from "./components/ResultadosView";
import ClasificacionView from "./components/ClasificacionView";
import AdminView from "./components/AdminView";
import LoginView from "./components/LoginView";

const STORAGE_AUTH_KEY = "quini_perico_auth_user";

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
  const [cargando, setCargando] = useState(true);

  // Cargar usuarios
  const cargarUsuarios = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:3001/api/usuarios");
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
      const res = await fetch("http://localhost:3001/api/bote");
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
      const res = await fetch("http://localhost:3001/api/clasificacion");
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
      const res = await fetch("http://localhost:3001/api/jornada/partidos");
      if (res.ok) {
        const data = await res.json();
        if (data?.partidos) {
          setPartidos(data.partidos);
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
      const res = await fetch("http://localhost:3001/api/bote/sumar", {
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
    <div className="min-h-screen stadium-bg flex flex-col lg:flex-row antialiased text-white selection:bg-blue-600 selection:text-white">
      {/* Dashboard Opaco Lateral (Sidebar Estilo Apple Dark) */}
      <Sidebar
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
        usuarioActivo={usuarioActivo}
        boteTotal={bote?.acumulado || 0}
        onLogout={handleLogout}
      />

      {/* Área de Contenido Principal sobre el Estadio */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 lg:ml-0 overflow-y-auto max-w-6xl w-full">
        {seccionActiva === "boleto" && (
          <BoletoView
            usuarioActivo={usuarioActivo}
            partidos={partidos}
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
            onIrAdmin={() => setSeccionActiva("admin")}
            onSumarBoteRapido={sumarBoteRapido}
            onBoteActualizado={cargarBote}
          />
        )}

        {seccionActiva === "resultados" && (
          <ResultadosView
            usuarioActivo={usuarioActivo}
            partidos={partidos}
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
            onIrBoleto={() => setSeccionActiva("boleto")}
          />
        )}

        {seccionActiva === "admin" && (
          <AdminView
            bote={bote}
            usuarios={usuarios}
            usuarioActivo={usuarioActivo}
            partidosActuales={partidos}
            onPartidosActualizados={(nuevos) => setPartidos(nuevos)}
            onBoteActualizado={cargarBote}
            onIrResultados={() => setSeccionActiva("resultados")}
            onActualizarUsuarios={cargarUsuarios}
          />
        )}
      </main>
    </div>
  );
}
