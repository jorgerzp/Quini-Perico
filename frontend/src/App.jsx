import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "./components/Sidebar";
import BoletoView from "./components/BoletoView";
import BoteView from "./components/BoteView";
import ResultadosView from "./components/ResultadosView";
import ClasificacionView from "./components/ClasificacionView";
import AdminView from "./components/AdminView";
import LoginView from "./components/LoginView";
import PagosView from "./components/PagosView";

const STORAGE_AUTH_KEY = "quini_perico_auth_user";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function App() {
  const [usuarioLogueado, setUsuarioLogueado] = useState(() => {
    try {
      const storedLocal = localStorage.getItem(STORAGE_AUTH_KEY);
      if (storedLocal) return JSON.parse(storedLocal);
      const storedSession = sessionStorage.getItem(STORAGE_AUTH_KEY);
      if (storedSession) return JSON.parse(storedSession);
      return null;
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
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  // Cargar Notificaciones (Superadmin Jorge)
  const cargarNotificaciones = useCallback(async () => {
    const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";
    if (!esJorge) return;

    try {
      const res = await fetch(`${API_URL}/api/notificaciones`);
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data.notificaciones || []);
        setNotificacionesNoLeidas(data.totalNoLeidas || 0);
      }
    } catch (err) {
      console.error("Error al cargar notificaciones:", err);
    }
  }, [usuarioActivo]);

  const marcarNotificacionLeida = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/${id}/leida`, {
        method: "PUT",
      });
      if (res.ok) {
        cargarNotificaciones();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTodasNotificacionesLeidas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/marcar-todas-leidas`, {
        method: "POST",
      });
      if (res.ok) {
        cargarNotificaciones();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const borrarNotificacion = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/notificaciones/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        cargarNotificaciones();
      }
    } catch (err) {
      console.error("Error al borrar notificación:", err);
    }
  };

  const borrarTodasNotificaciones = async (jornadaNum) => {
    try {
      const url = jornadaNum
        ? `${API_URL}/api/notificaciones?jornada=${jornadaNum}`
        : `${API_URL}/api/notificaciones`;
      const res = await fetch(url, {
        method: "DELETE",
      });
      if (res.ok) {
        cargarNotificaciones();
      }
    } catch (err) {
      console.error("Error al borrar notificaciones:", err);
    }
  };


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
            if (actual.rol === "demo" || actual.isDemo) {
              return actual;
            }
            const refrescado = data.find((u) => u.id === actual.id || u.nombre === actual.nombre);
            if (refrescado) {
              try {
                if (localStorage.getItem(STORAGE_AUTH_KEY)) {
                  localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(refrescado));
                } else if (sessionStorage.getItem(STORAGE_AUTH_KEY)) {
                  sessionStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(refrescado));
                }
              } catch {}
              return refrescado;
            }
            return actual;
          }
          if (usuarioLogueado) {
            if (usuarioLogueado.rol === "demo" || usuarioLogueado.isDemo) {
              return usuarioLogueado;
            }
            const match = data.find((u) => u.id === usuarioLogueado.id || u.nombre === usuarioLogueado.nombre);
            if (match) {
              try {
                if (localStorage.getItem(STORAGE_AUTH_KEY)) {
                  localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(match));
                } else if (sessionStorage.getItem(STORAGE_AUTH_KEY)) {
                  sessionStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(match));
                }
              } catch {}
              return match;
            }
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
    await Promise.all([
      cargarUsuarios(),
      cargarBote(),
      cargarClasificacion(),
      cargarPartidos(),
      cargarNotificaciones(),
    ]);
    setCargando(false);
  }, [cargarUsuarios, cargarBote, cargarClasificacion, cargarPartidos, cargarNotificaciones]);

  useEffect(() => {
    recargarTodo();
  }, []); // Cargar sólo al montar la aplicación

  // Sincronización en vivo: al cambiar a boleto, resultados o clasificación, recargar datos de inmediato
  useEffect(() => {
    if (seccionActiva === "boleto" || seccionActiva === "resultados") {
      cargarPartidos();
      cargarUsuarios();
    }
    if (seccionActiva === "clasificacion") {
      cargarClasificacion();
    }
  }, [seccionActiva, cargarPartidos, cargarUsuarios, cargarClasificacion]);

  // Polling cada 6s para partidos, usuarios, notificaciones y clasificación en vivo
  useEffect(() => {
    const interval = setInterval(() => {
      cargarPartidos();
      cargarNotificaciones();
      cargarUsuarios();
      cargarClasificacion();
    }, 6000);
    return () => clearInterval(interval);
  }, [cargarPartidos, cargarNotificaciones, cargarUsuarios, cargarClasificacion]);

  // Manejo de Login y Logout
  const handleLoginSuccess = (usuario, recordarme = true) => {
    setUsuarioLogueado(usuario);
    setUsuarioActivo(usuario);
    try {
      if (recordarme) {
        localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(usuario));
        sessionStorage.removeItem(STORAGE_AUTH_KEY);
      } else {
        sessionStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(usuario));
        localStorage.removeItem(STORAGE_AUTH_KEY);
      }
    } catch (e) {
      console.error(e);
    }
    setSeccionActiva("boleto");
    cargarUsuarios();
    cargarPartidos();
  };

  const handleLogout = () => {
    setUsuarioLogueado(null);
    setUsuarioActivo(null);
    try {
      localStorage.removeItem(STORAGE_AUTH_KEY);
      sessionStorage.removeItem(STORAGE_AUTH_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Protección de acceso: si un miembro no-admin y no-demo intenta estar en "admin", redirigir
  useEffect(() => {
    const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";
    const esDemo = usuarioActivo?.rol === "demo" || usuarioActivo?.isDemo;
    if (seccionActiva === "admin" && !esJorge && !esDemo) {
      setSeccionActiva("boleto");
    }
  }, [seccionActiva, usuarioActivo]);

  // Sumar rápido al bote desde la vista de bote
  const sumarBoteRapido = async (cantidad, concepto) => {
    if (usuarioActivo?.rol === "demo" || usuarioActivo?.isDemo) {
      alert("Modo Demostración: Esta acción no está permitida en modo solo lectura.");
      return;
    }
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

  const esDemo = usuarioActivo?.rol === "demo" || usuarioActivo?.isDemo;

  return (
    <div className="relative min-h-screen text-[#4a4641] font-sans antialiased selection:bg-stone-800 selection:text-white">
      {/* Video Fijo de Fondo con Máxima Calidad */}
      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-stone-900">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center"
          src="/Hand_spins_soccer_ball_20260920183927.mp4"
        />
        {/* Velo translúcido tenue para preservar máxima nitidez y garantizar contraste óptimo */}
        <div className="absolute inset-0 bg-stone-900/20 pointer-events-none" />
      </div>

      {!usuarioLogueado ? (
        <LoginView
          usuarios={usuarios}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <div className="pt-32">
          {/* Banner identificador de Modo Demostración */}
          {esDemo && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-stone-900/90 text-white backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs font-medium shadow-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Modo Demostración (Solo Lectura) · Puedes explorar toda la app libremente</span>
            </div>
          )}

          <Sidebar
            seccionActiva={seccionActiva}
            setSeccionActiva={setSeccionActiva}
            usuarioActivo={usuarioActivo}
            usuarios={usuarios}
            boteTotal={bote?.acumulado || 0}
            numeroJornada={numeroJornada}
            notificacionesNoLeidas={notificacionesNoLeidas}
            notificaciones={notificaciones}
            onMarcarTodasLeidas={marcarTodasNotificacionesLeidas}
            onLogout={handleLogout}
          />

          <main className="relative z-10 px-4 sm:px-8 lg:px-10 pb-20 overflow-y-auto max-w-6xl w-full mx-auto">
            <div className="sr-only">
              <span>{usuarioActivo?.nombre || "Miembro"}</span>
              <button type="button" id="btn-top-logout" onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </div>

        {seccionActiva === "boleto" && (
          <BoletoView
            usuarioActivo={usuarioActivo}
            usuarios={usuarios}
            partidos={partidos}
            numeroJornada={numeroJornada}
            onIrAdmin={() => setSeccionActiva("admin")}
            onIrResultados={() => setSeccionActiva("resultados")}
            onJugadaConfirmada={() => {
              cargarUsuarios();
              cargarClasificacion();
              cargarNotificaciones();
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
            usuarios={usuarios}
            partidos={partidos}
            numeroJornada={numeroJornada}
            onRefrescarUsuarios={cargarUsuarios}
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

        {seccionActiva === "pagos" && (
          <PagosView
            usuarioActivo={usuarioActivo}
            onActualizarUsuarios={cargarUsuarios}
          />
        )}

        {seccionActiva === "admin" && (
          <AdminView
            bote={bote}
            usuarios={usuarios}
            usuarioActivo={usuarioActivo}
            partidosActuales={partidos}
            numeroJornada={numeroJornada}
            notificaciones={notificaciones}
            notificacionesNoLeidas={notificacionesNoLeidas}
            onMarcarNotificacionLeida={marcarNotificacionLeida}
            onMarcarTodasNotificacionesLeidas={marcarTodasNotificacionesLeidas}
            onBorrarNotificacion={borrarNotificacion}
            onBorrarTodasNotificaciones={borrarTodasNotificaciones}
            onActualizarNotificaciones={cargarNotificaciones}
            onJornadaActualizada={(n) => {
              setNumeroJornada(n);
              cargarUsuarios();
              cargarPartidos();
            }}
            onPartidosActualizados={(nuevos, num) => {
              setPartidos(nuevos);
              if (num) setNumeroJornada(num);
              cargarUsuarios();
            }}
            onBoteActualizado={cargarBote}
            onIrResultados={() => setSeccionActiva("resultados")}
            onActualizarUsuarios={cargarUsuarios}
          />
        )}
      </main>
        </div>
      )}
    </div>
  );
}
