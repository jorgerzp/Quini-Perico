import React, { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";
import { procesarBoletoQuinigolPipeline } from "../utils/ocrPipeline";
import UserAvatar from "./UserAvatar";

export default function AdminView({
  bote,
  usuarios,
  usuarioActivo,
  onBoteActualizado,
  onIrResultados,
  onActualizarUsuarios,
  partidosActuales = [],
  onPartidosActualizados,
  numeroJornada = 7,
  onJornadaActualizada,
  notificaciones = [],
  notificacionesNoLeidas = 0,
  onMarcarNotificacionLeida,
  onMarcarTodasNotificacionesLeidas,
  onBorrarNotificacion,
  onBorrarTodasNotificaciones,
  onActualizarNotificaciones,
}) {
  const esJorge = usuarioActivo?.nombre === "Jorge" || usuarioActivo?.rol === "superadmin";
  const esDemo = usuarioActivo?.rol === "demo" || usuarioActivo?.isDemo || usuarioActivo?.nombre?.toLowerCase() === "demo";

  // Estado Jornada Activa
  const [jornadaInput, setJornadaInput] = useState(numeroJornada || 7);
  const [guardandoJornada, setGuardandoJornada] = useState(false);
  const [mensajeJornada, setMensajeJornada] = useState(null);

  // Sincronizar número de jornada si viene del padre
  React.useEffect(() => {
    if (numeroJornada) {
      setJornadaInput(numeroJornada);
    }
  }, [numeroJornada]);

  // Estado OCR
  const [imagenPreview, setImagenPreview] = useState(null);
  const [procesandoOcr, setProcesandoOcr] = useState(false);
  const [progresoOcr, setProgresoOcr] = useState(0);
  const [estadoOcrTexto, setEstadoOcrTexto] = useState("");
  const [textoExtraidoRaw, setTextoExtraidoRaw] = useState("");
  const [mostrarTextoRaw, setMostrarTextoRaw] = useState(false);

  // 6 Partidos de la Jornada
  const [partidosEditables, setPartidosEditables] = useState(() => {
    if (partidosActuales && partidosActuales.length === 6) {
      return partidosActuales;
    }
    return [
      { id: 1, key: "partido1", numStr: "01", home: "", away: "" },
      { id: 2, key: "partido2", numStr: "02", home: "", away: "" },
      { id: 3, key: "partido3", numStr: "03", home: "", away: "" },
      { id: 4, key: "partido4", numStr: "04", home: "", away: "" },
      { id: 5, key: "partido5", numStr: "05", home: "", away: "" },
      { id: 6, key: "partido6", numStr: "06", home: "", away: "" },
    ];
  });

  const [guardandoPartidos, setGuardandoPartidos] = useState(false);
  const [mensajePartidos, setMensajePartidos] = useState(null);

  // Estado Bote
  const [cantidad, setCantidad] = useState("");
  const [concepto, setConcepto] = useState("");
  const [guardandoBote, setGuardandoBote] = useState(false);
  const [mensajeBote, setMensajeBote] = useState(null);

  // Estado Notificaciones
  const [notifSeleccionadaId, setNotifSeleccionadaId] = useState(null);
  const [soloJornadaMarcada, setSoloJornadaMarcada] = useState(true);

  // Filtrar notificaciones según la jornada marcada si está activo (por defecto true)
  const notificacionesFiltradas = soloJornadaMarcada
    ? notificaciones.filter((n) => Number(n.jornadaNumero) === Number(numeroJornada))
    : notificaciones;
  const noLeidasFiltradas = notificacionesFiltradas.filter((n) => !n.leida).length;

  const fileInputRef = useRef(null);

  // Si no es Jorge ni Demo, pantalla de denegación
  if (!esJorge && !esDemo) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center">
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl p-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">
            Seguridad
          </p>
          <h2 className="text-3xl font-extrabold tracking-tighter text-stone-800 mb-3">
            Acceso Restringido
          </h2>
          <p className="text-sm font-medium text-stone-500">
            El panel Superadmin solo está habilitado para administradores.
          </p>
        </div>
      </div>
    );
  }

  // Guardar número de jornada activa (Superadmin)
  const guardarNumeroJornada = async (numNuevo) => {
    if (esDemo) {
      setMensajeJornada({ tipo: "error", texto: "Modo Demostración: Estás en modo solo lectura. No se pueden modificar las jornadas." });
      return;
    }
    const val = parseInt(numNuevo, 10);
    if (isNaN(val) || val < 1) {
      setMensajeJornada({ tipo: "error", texto: "Introduce un número de jornada válido (1 o superior)." });
      return;
    }

    setGuardandoJornada(true);
    setMensajeJornada(null);

    try {
      const res = await fetch(`${API_URL}/api/jornada/numero`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: val }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la jornada.");

      setJornadaInput(data.jornada || val);
      setMensajeJornada({
        tipo: "success",
        texto: `Jornada ${data.jornada || val} fijada como oficial para toda la peña.`,
      });

      if (onJornadaActualizada) onJornadaActualizada(data.jornada || val);
    } catch (err) {
      setMensajeJornada({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoJornada(false);
    }
  };

  // Manejo de subida de archivo
  const manejarSeleccionImagen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImagenPreview(event.target.result);
      setMensajePartidos(null);
    };
    reader.readAsDataURL(file);
  };

  // Ejecutar OCR en la foto seleccionada utilizando el pipeline robusto de 3 fases
  const ejecutarOcr = async () => {
    if (!imagenPreview) {
      setMensajePartidos({ tipo: "error", texto: "Primero selecciona o sube una foto de la quiniela." });
      return;
    }

    setProcesandoOcr(true);
    setProgresoOcr(10);
    setEstadoOcrTexto("Iniciando pipeline OCR en 3 fases...");
    setMensajePartidos(null);

    try {
      const resultado = await procesarBoletoQuinigolPipeline(
        imagenPreview,
        partidosEditables,
        (estadoMsg) => {
          setEstadoOcrTexto(estadoMsg);
          setProgresoOcr((prev) => Math.min(95, prev + 25));
        }
      );

      setTextoExtraidoRaw(resultado.textoRaw);
      setPartidosEditables(resultado.partidos);
      setProgresoOcr(100);
      setEstadoOcrTexto("¡Escaneado y autocorrección completados!");

      setMensajePartidos({
        tipo: "success",
        texto: "Equipos reconocidos y normalizados con éxito. Revisa y confirma antes de guardar la jornada.",
      });

      setTimeout(() => {
        const el = document.getElementById("seccion-partidos-editables");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 250);

      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.5 },
      });
    } catch (err) {
      console.error("Error en pipeline OCR:", err);
      setMensajePartidos({
        tipo: "error",
        texto: "Error al procesar la imagen con OCR: " + err.message,
      });
    } finally {
      setProcesandoOcr(false);
    }
  };

  // Modificar campo de equipo
  const actualizarEquipo = (idx, campo, valor) => {
    setPartidosEditables((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
  };

  // Guardar los 6 partidos en el servidor
  const guardarPartidosEnServidor = async () => {
    if (esDemo) {
      setMensajePartidos({ tipo: "error", texto: "Modo Demostración: Estás en modo solo lectura. No se pueden guardar partidos." });
      return;
    }
    setGuardandoPartidos(true);
    setMensajePartidos(null);

    try {
      const res = await fetch(`${API_URL}/api/jornada/partidos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partidos: partidosEditables,
          imagenBoleto: imagenPreview || null,
          numeroJornada: jornadaInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron guardar los partidos.");

      setMensajePartidos({
        tipo: "success",
        texto: `Partidos oficiales de la Jornada ${data.jornada || jornadaInput} guardados correctamente.`,
      });

      if (onPartidosActualizados) {
        onPartidosActualizados(data.partidos, data.jornada || jornadaInput);
      }

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      setMensajePartidos({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPartidos(false);
    }
  };

  // Sumar bote rápido
  const sumarBote = async (monto, conceptoTxt) => {
    if (esDemo) {
      setMensajeBote({ tipo: "error", texto: "Modo Demostración: Estás en modo solo lectura. No se pueden modificar los fondos." });
      return;
    }
    const val = parseFloat(monto);
    if (isNaN(val) || val <= 0) {
      setMensajeBote({ tipo: "error", texto: "Introduce una cantidad válida." });
      return;
    }

    setGuardandoBote(true);
    setMensajeBote(null);

    try {
      const res = await fetch(`${API_URL}/api/bote/sumar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cantidad: val,
          concepto: conceptoTxt || concepto || `Aporte de Jorge (+${val} €)`,
          autor: "Jorge (Superadmin)",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMensajeBote({ tipo: "success", texto: `+${val.toFixed(2)} € añadidos al bote.` });
      setCantidad("");
      setConcepto("");

      if (onBoteActualizado) onBoteActualizado();
    } catch (err) {
      setMensajeBote({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoBote(false);
    }
  };

  // Resetear partidos a estado inicial
  const reiniciarPartidos = async () => {
    if (esDemo) {
      setMensajePartidos({ tipo: "error", texto: "Modo Demostración: Estás en modo solo lectura. No se pueden vaciar partidos." });
      return;
    }
    if (
      !window.confirm(
        "¿Estás seguro de que deseas vaciar los partidos de esta jornada? La sección de apuesta volverá a mostrar a los miembros: 'Aún no hay ningún quinigol disponible'."
      )
    ) {
      return;
    }
    setGuardandoPartidos(true);
    setMensajePartidos(null);
    try {
      const res = await fetch(`${API_URL}/api/jornada/partidos`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const partidosVacios = [
        { id: 1, key: "partido1", numStr: "01", home: "", away: "" },
        { id: 2, key: "partido2", numStr: "02", home: "", away: "" },
        { id: 3, key: "partido3", numStr: "03", home: "", away: "" },
        { id: 4, key: "partido4", numStr: "04", home: "", away: "" },
        { id: 5, key: "partido5", numStr: "05", home: "", away: "" },
        { id: 6, key: "partido6", numStr: "06", home: "", away: "" },
      ];
      setPartidosEditables(partidosVacios);
      setImagenPreview(null);
      setTextoExtraidoRaw("");
      setMensajePartidos({
        tipo: "success",
        texto: "Partidos vaciados correctamente.",
      });
      if (onPartidosActualizados) onPartidosActualizados(null);
    } catch (err) {
      setMensajePartidos({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPartidos(false);
    }
  };

  // Limpiar por completo la jornada activa para dejarla en blanco (Superadmin)
  const limpiarJornadaCompleta = async () => {
    if (esDemo) {
      setMensajePartidos({ tipo: "error", texto: "Modo Demostración: Estás en modo solo lectura. No se puede limpiar la jornada." });
      return;
    }
    if (
      !window.confirm(
        "⚠️ ¿Estás completamente seguro de que deseas LIMPIAR la jornada activa para dejarla en blanco?\n\nEsta acción:\n- Borrará todas las apuestas de los miembros en esta jornada.\n- Borrará los partidos y la foto del boleto.\n- Permitirá a todos los miembros volver a rellenar cuando abras una nueva jornada."
      )
    ) {
      return;
    }

    setGuardandoPartidos(true);
    setMensajePartidos(null);

    try {
      const res = await fetch(`${API_URL}/api/jornada/limpiar`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo limpiar la jornada.");

      const partidosVacios = [
        { id: 1, key: "partido1", numStr: "01", home: "", away: "" },
        { id: 2, key: "partido2", numStr: "02", home: "", away: "" },
        { id: 3, key: "partido3", numStr: "03", home: "", away: "" },
        { id: 4, key: "partido4", numStr: "04", home: "", away: "" },
        { id: 5, key: "partido5", numStr: "05", home: "", away: "" },
        { id: 6, key: "partido6", numStr: "06", home: "", away: "" },
      ];
      setPartidosEditables(partidosVacios);
      setImagenPreview(null);
      setTextoExtraidoRaw("");
      setMensajePartidos({
        tipo: "success",
        texto: data.message || "Jornada limpiada con éxito. Ha quedado totalmente en blanco.",
      });

      if (onPartidosActualizados) onPartidosActualizados(null, data.jornada?.numero || jornadaInput);
      if (onActualizarUsuarios) onActualizarUsuarios();
      if (onActualizarNotificaciones) onActualizarNotificaciones();
    } catch (err) {
      setMensajePartidos({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoPartidos(false);
    }
  };

  // Resetear bote acumulado a 0.00 €
  const reiniciarBoteACero = async () => {
    if (esDemo) {
      setMensajeBote({ tipo: "error", texto: "Modo Demostración: Estás en modo solo lectura. No se puede reiniciar el bote." });
      return;
    }
    if (
      !window.confirm(
        "¿Seguro que deseas poner el bote a 0.00 € y borrar todo el historial de ganancias?"
      )
    ) {
      return;
    }
    setGuardandoBote(true);
    setMensajeBote(null);
    try {
      const res = await fetch(`${API_URL}/api/bote/reset`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMensajeBote({
        tipo: "success",
        texto: "Bote reiniciado a 0.00 € e historial vaciado.",
      });
      if (onBoteActualizado) onBoteActualizado();
    } catch (err) {
      setMensajeBote({ tipo: "error", texto: err.message });
    } finally {
      setGuardandoBote(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 text-[#4a4641]">
      {/* Banner de Modo Demostración */}
      {esDemo && (
        <div className="bg-amber-500/15 border border-amber-500/40 rounded-3xl p-6 backdrop-blur-xl flex items-start gap-4 shadow-sm animate-in fade-in">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-950 flex items-center justify-center shrink-0 text-xl font-bold">
            👁️
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-amber-950">
              Panel Superadmin en Modo Demostración (Solo Lectura)
            </h3>
            <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
              Estás explorando el panel de Superadmin como invitado. Puedes ver la configuración oficial, el estado de la jornada, el sistema de escaneo OCR para boletos de Quinigol, notificaciones y controles del bote. Todas las funciones de guardado y edición están desactivadas para salvaguardar los datos reales de la peña.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-8 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div>
          <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-3">
            Superadmin · Jorge
          </p>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-stone-800">
            Control Maestro
          </h2>
          <p className="text-sm font-medium text-stone-500 tracking-tight mt-2">
            Escaneo OCR de fotos oficiales, configuración de partidos y gestión de fondos.
          </p>
        </div>

        <button
          type="button"
          onClick={onIrResultados}
          className="self-start sm:self-auto px-8 py-3.5 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Resultados en Directo</span>
        </button>
      </div>

      {/* CONTROL OFICIAL DE NÚMERO DE JORNADA */}
      <div className="space-y-6 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
              Edición Oficial
            </p>
            <div className="flex items-baseline gap-4">
              <span className="text-6xl sm:text-7xl font-extrabold tracking-tighter text-stone-800 font-mono">
                J.{jornadaInput}
              </span>
              <span className="text-sm font-medium text-stone-500 tracking-tight">
                Jornada activa para toda la peña
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={guardandoJornada}
              onClick={() => guardarNumeroJornada(Number(jornadaInput) + 1)}
              className="px-6 py-3 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
            >
              +1 Avanzar a J.{Number(jornadaInput) + 1}
            </button>

            <div className="flex items-center gap-2 bg-white/30 px-3 py-1.5 rounded-full border border-white/50">
              <span className="text-xs text-stone-400 font-semibold uppercase pl-2">Nº</span>
              <input
                type="number"
                min="1"
                value={jornadaInput}
                onChange={(e) => setJornadaInput(e.target.value)}
                className="w-16 px-2 py-1 bg-transparent text-stone-800 text-sm font-mono font-bold text-center focus:outline-none"
              />
              <button
                type="button"
                disabled={guardandoJornada}
                onClick={() => guardarNumeroJornada(jornadaInput)}
                className="px-5 py-2 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {guardandoJornada ? "..." : "Fijar"}
              </button>
            </div>
          </div>
        </div>

        {mensajeJornada && (
          <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-stone-800 text-xs font-semibold tracking-tight">
            {mensajeJornada.texto}
          </div>
        )}
      </div>

      {/* SECCIÓN NOTIFICACIONES DE APUESTAS RECIBIDAS EN VIVO */}
      <div id="seccion-notificaciones-admin" className="space-y-6 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
                    Notificaciones en Vivo
                  </span>
                  {noLeidasFiltradas > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)] badge-notif-pulse">
                      {noLeidasFiltradas} nuevas
                    </span>
                  )}
                </div>
                <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-800">
                  Apuestas Recibidas
                </h3>
                <p className="text-sm font-medium text-stone-500 tracking-tight mt-1">
                  Mostrando apuestas recibidas de los miembros.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Selector de filtro por jornada */}
                <div className="flex items-center bg-white/40 p-1 rounded-2xl border border-white/60 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setSoloJornadaMarcada(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      soloJornadaMarcada
                        ? "bg-stone-900 text-white shadow-xs"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    Solo Jornada {numeroJornada} ({notificaciones.filter((n) => Number(n.jornadaNumero) === Number(numeroJornada)).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoloJornadaMarcada(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      !soloJornadaMarcada
                        ? "bg-stone-900 text-white shadow-xs"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    Todas ({notificaciones.length})
                  </button>
                </div>

                {/* Botón de borrado masivo de apuestas de la jornada */}
                {onBorrarTodasNotificaciones && notificacionesFiltradas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const msg = soloJornadaMarcada
                        ? `¿Eliminar todas las ${notificacionesFiltradas.length} apuestas recibidas de la Jornada ${numeroJornada}?`
                        : `¿Eliminar todas las ${notificaciones.length} apuestas recibidas de todas las jornadas?`;
                      if (window.confirm(msg)) {
                        onBorrarTodasNotificaciones(soloJornadaMarcada ? numeroJornada : null);
                      }
                    }}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-rose-700 bg-rose-500/10 border border-rose-300 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                    title={soloJornadaMarcada ? `Borrar apuestas de la Jornada ${numeroJornada}` : "Borrar todas las apuestas"}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>{soloJornadaMarcada ? `Limpiar J${numeroJornada}` : "Limpiar todas"}</span>
                  </button>
                )}

                {noLeidasFiltradas > 0 && onMarcarTodasNotificacionesLeidas && (
                  <button
                    type="button"
                    id="btn-marcar-todas-leidas-admin"
                    onClick={onMarcarTodasNotificacionesLeidas}
                    className="px-5 py-2 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider hover-negro-brillante shadow-[0_6px_20px_rgba(40,36,32,0.15)] transition-all cursor-pointer"
                  >
                    Marcar leídas
                  </button>
                )}

                {onActualizarNotificaciones && (
                  <button
                    type="button"
                    onClick={onActualizarNotificaciones}
                    className="px-4 py-2 rounded-full bg-white/30 border border-white/50 text-stone-700 text-xs font-semibold uppercase tracking-wider hover-negro-brillante transition-all cursor-pointer"
                  >
                    Refrescar
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Notificaciones con desglose de la apuesta que hizo cada uno */}
            <div className="space-y-4 pt-2">
              {notificacionesFiltradas.length === 0 ? (
                <div className="py-12 px-6 text-center bg-white/20 rounded-2xl border border-white/40">
                  <p className="text-sm font-semibold text-stone-600">
                    No hay apuestas registradas {soloJornadaMarcada ? `para la Jornada ${numeroJornada}` : "en la peña"}.
                  </p>
                  <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                    {soloJornadaMarcada
                      ? `En cuanto los miembros rellenen su apuesta de la Jornada ${numeroJornada}, aparecerán aquí. (Puedes pulsar "Todas" arriba para ver apuestas anteriores).`
                      : "En cuanto cualquiera de los miembros rellene su apuesta y guarde, su jugada aparecerá aquí al instante para Jorge."}
                  </p>
                </div>
              ) : (
                notificacionesFiltradas.map((notif) => {
                  const estaExpandida = notifSeleccionadaId === notif.id;
                  const pronosticosObj = notif.pronosticos || {};
                  const fechaStr = new Date(notif.fecha_creacion).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={notif.id}
                      className={`rounded-3xl border transition-all duration-300 p-6 ${
                        !notif.leida
                          ? "bg-white/85 border-red-300 shadow-[0_6px_25px_rgba(239,68,68,0.12)]"
                          : "bg-white/35 border-white/60 hover:bg-white/50"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative shrink-0">
                            <UserAvatar
                              nombre={notif.usuarioNombre}
                              className="w-11 h-11 rounded-2xl shadow-xs border border-white/80"
                              imgClassName="w-full h-full object-cover rounded-2xl"
                              fallbackClassName="text-sm font-black"
                            />
                            {!notif.leida && (
                              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 ring-2 ring-white badge-notif-pulse" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-extrabold text-stone-900 tracking-tight">
                                {notif.usuarioNombre}
                              </h4>
                              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/70 text-stone-600 font-bold border border-stone-200">
                                Jornada {notif.jornadaNumero}
                              </span>
                              {!notif.leida && (
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 uppercase tracking-wide">
                                  Nueva
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-stone-500 font-medium mt-0.5">
                              {notif.resumen || "Apuesta sellada"} · <span className="font-mono">{fechaStr}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {!notif.leida && onMarcarNotificacionLeida && (
                            <button
                              type="button"
                              onClick={() => onMarcarNotificacionLeida(notif.id)}
                              className="px-3 py-1.5 rounded-full text-xs font-semibold text-stone-600 hover:text-stone-900 bg-white/60 border border-white/70 hover:bg-white transition-all cursor-pointer hover-negro-brillante"
                            >
                              Marcar revisada
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setNotifSeleccionadaId(estaExpandida ? null : notif.id)}
                            className="px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-stone-800 bg-white/50 border border-white/60 hover-negro-brillante transition-all cursor-pointer"
                          >
                            {estaExpandida ? "Ocultar Apuesta" : "Ver Apuesta"}
                          </button>

                          {/* Cruz X para borrar individualmente esta apuesta */}
                          {onBorrarNotificacion && (
                            <button
                              type="button"
                              id={`btn-borrar-notif-${notif.id}`}
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `¿Eliminar la notificación de apuesta de ${notif.usuarioNombre} (Jornada ${notif.jornadaNumero})?`
                                  )
                                ) {
                                  onBorrarNotificacion(notif.id);
                                }
                              }}
                              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-rose-600 bg-white/60 hover:bg-rose-50 border border-stone-200/80 hover:border-rose-300 transition-all cursor-pointer shrink-0"
                              title="Eliminar esta apuesta (descartar)"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>


                  {/* Detalle visual de los 6 Partidos de la Apuesta */}
                  {estaExpandida && (
                    <div className="mt-6 pt-5 border-t border-stone-200/60 animate-in fade-in duration-200">
                      <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">
                        Apuesta completa realizada por {notif.usuarioNombre}
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          const key = `partido${num}`;
                          const pred = pronosticosObj[key] || { local: null, visitante: null };
                          const partidoOficial = partidosActuales?.[num - 1] || {};
                          const homeName = partidoOficial.home || `Local P${num}`;
                          const awayName = partidoOficial.away || `Visitante P${num}`;

                          return (
                            <div
                              key={key}
                              className="p-3.5 rounded-2xl bg-white/70 border border-white/80 shadow-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 pr-1 flex-1">
                                <span className="text-[10px] font-mono font-bold text-stone-400 block uppercase">
                                  Partido 0{num}
                                </span>
                                <p
                                  className="text-xs font-bold text-stone-800 break-words leading-tight mt-0.5"
                                  title={`${homeName} vs ${awayName}`}
                                >
                                  {homeName} <span className="text-stone-400 font-normal">vs</span> {awayName}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 font-mono font-extrabold text-sm">
                                <span className="w-7 h-7 rounded-xl bg-stone-800 text-white flex items-center justify-center shadow-xs">
                                  {pred.local ?? "-"}
                                </span>
                                <span className="text-stone-400 font-bold">:</span>
                                <span className="w-7 h-7 rounded-xl bg-stone-800 text-white flex items-center justify-center shadow-xs">
                                  {pred.visitante ?? "-"}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* SECCIÓN 1: ESCÁNER OCR DE FOTO DE LA JORNADA */}
      <div className="space-y-8 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div>
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
              Reconocimiento Automático
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-800">
              Escáner OCR · Jornada {jornadaInput}
            </h3>
            <p className="text-sm font-medium text-stone-500 tracking-tight mt-1">
            Sube la captura oficial de la quiniela y el OCR extraerá los 6 enfrentamientos automáticamente.
          </p>
        </div>

        {/* Zona de Subida y Previsualización */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Uploader */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-white/60 hover:border-stone-800 rounded-3xl p-10 text-center cursor-pointer transition-all bg-white/30 hover:bg-white/50 flex flex-col items-center justify-center min-h-[220px]"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={manejarSeleccionImagen}
            />

            <p className="text-base font-semibold text-stone-800 mb-1">
              Subir foto de la quiniela
            </p>
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">
              Arrastra aquí o haz clic (JPG, PNG)
            </p>
          </div>

          {/* Preview y Acción de Escaneo */}
          <div className="bg-white/30 rounded-3xl p-6 border border-white/50 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
            {imagenPreview ? (
              <div className="w-full space-y-4">
                <div className="relative rounded-2xl overflow-hidden max-h-48 border border-white/50">
                  <img
                    src={imagenPreview}
                    alt="Foto Jornada"
                    className="w-full h-full object-cover"
                  />
                  {procesandoOcr && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-stone-800 p-4">
                      <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-xs font-semibold text-center">{estadoOcrTexto}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={procesandoOcr}
                    onClick={ejecutarOcr}
                    className="flex-1 py-3.5 px-6 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
                  >
                    {procesandoOcr ? "Analizando..." : "Escanear con OCR"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setImagenPreview(null);
                      setTextoExtraidoRaw("");
                    }}
                    className="px-5 py-3.5 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm font-medium text-stone-400">
                Sin imagen seleccionada.
              </p>
            )}
          </div>
        </div>

        {/* Mensaje de estado OCR */}
        {mensajePartidos && (
          <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-stone-800 text-xs font-semibold tracking-tight">
            {mensajePartidos.texto}
          </div>
        )}

        {/* Partidos Extraídos / Editables (Confirmar antes de Guardar) */}
        <div id="seccion-partidos-editables" className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase">
                Verificación
              </p>
              <h4 className="text-xl font-extrabold tracking-tight text-stone-800">
                Confirmar los 6 Partidos
              </h4>
            </div>
            <span className="text-xs font-mono font-semibold text-stone-400 uppercase">
              6 Enfrentamientos
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {partidosEditables.map((partido, idx) => {
              const completado = Boolean(partido.home && partido.away);
              return (
                <div
                  key={partido.id || idx}
                  className="bg-white/30 rounded-2xl p-5 border border-white/50 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-widest text-stone-400 uppercase font-mono">
                      PARTIDO 0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      {completado ? "Listo" : "Incompleto"}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 items-center gap-2">
                    <div className="col-span-2">
                      <input
                        type="text"
                        value={partido.home}
                        onChange={(e) => actualizarEquipo(idx, "home", e.target.value)}
                        placeholder="Local"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/30 border border-white/50 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-xs font-extrabold text-stone-400 tracking-wider">VS</span>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="text"
                        value={partido.away}
                        onChange={(e) => actualizarEquipo(idx, "away", e.target.value)}
                        placeholder="Visitante"
                        className="w-full px-3 py-2.5 rounded-xl bg-white/30 border border-white/50 text-xs font-semibold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-1 focus:ring-stone-800"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-between gap-4">
            {textoExtraidoRaw ? (
              <button
                type="button"
                onClick={() => setMostrarTextoRaw(!mostrarTextoRaw)}
                className="text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-800 transition-colors cursor-pointer"
              >
                {mostrarTextoRaw ? "Ocultar texto OCR" : "Ver texto OCR en bruto"}
              </button>
            ) : (
              <span className="text-xs text-stone-400 font-medium">Revisa los nombres antes de guardar</span>
            )}

            <div className="flex flex-wrap items-center gap-3 ml-auto">
              <button
                type="button"
                id="btn-limpiar-jornada-completa"
                onClick={limpiarJornadaCompleta}
                disabled={guardandoPartidos}
                title="Borra apuestas, partidos y foto para dejar la jornada totalmente en blanco"
                className="px-6 py-4 rounded-full bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-700 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
              >
                🧹 Limpiar Jornada (Dejar en blanco)
              </button>

              <button
                type="button"
                onClick={reiniciarPartidos}
                disabled={guardandoPartidos}
                className="px-6 py-4 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
              >
                Vaciar Partidos
              </button>

              <button
                type="button"
                id="btn-guardar-partidos-ocr"
                disabled={guardandoPartidos}
                onClick={guardarPartidosEnServidor}
                className="px-8 py-4 rounded-full bg-stone-800 text-white text-xs font-semibold uppercase tracking-wider shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
              >
                {guardandoPartidos ? "Guardando..." : `Guardar Partidos (Jornada ${jornadaInput})`}
              </button>
            </div>
          </div>

          {mostrarTextoRaw && (
            <div className="p-4 rounded-2xl bg-white/30 border border-white/50 font-mono text-xs text-stone-600 whitespace-pre-wrap max-h-40 overflow-y-auto">
              {textoExtraidoRaw}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8 pb-10 bg-white/30 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)] rounded-3xl px-6 sm:px-10 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest text-stone-400 uppercase mb-2">
              Tesorería
            </p>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-800">
              Añadir Fondos al Bote
            </h3>
            <p className="text-sm font-medium text-stone-500 tracking-tight mt-1">
              Suma ganancias o aportes manuales directamente al bote acumulado.
            </p>
          </div>

          <button
            type="button"
            onClick={reiniciarBoteACero}
            disabled={guardandoBote}
            className="self-start sm:self-auto px-6 py-3 rounded-full bg-white/30 border border-white/50 hover:bg-white/50 text-stone-800 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer disabled:opacity-40"
          >
            Poner Bote a 0.00 €
          </button>
        </div>

        {mensajeBote && (
          <div className="p-4 rounded-2xl bg-white/40 border border-white/60 text-stone-800 text-xs font-semibold tracking-tight">
            {mensajeBote.texto}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sumarBote(cantidad, concepto);
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2 block">
                Importe (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-base font-mono font-bold text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-stone-800 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-2 block">
                Concepto
              </label>
              <input
                type="text"
                placeholder="Aporte, premio, etc."
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-white/30 border border-white/50 text-sm font-medium text-stone-800 placeholder:text-stone-400 focus:bg-white/50 focus:outline-none focus:ring-2 focus:ring-stone-800 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={guardandoBote || !cantidad}
              className="px-10 py-4 rounded-full bg-stone-800 text-white text-sm font-semibold tracking-tight shadow-[0_10px_30px_rgba(40,36,32,0.2)] hover:bg-stone-700 transition-all cursor-pointer disabled:opacity-40"
            >
              {guardandoBote ? "Añadiendo..." : "Añadir Fondos al Bote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
