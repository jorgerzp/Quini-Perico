import React, { useState, useRef } from "react";
import confetti from "canvas-confetti";
import { API_URL } from "../config";
import UserAvatar from "./UserAvatar";

/**
 * Redimensiona y comprime una imagen seleccionada a max 600x600 JPEG
 * para que sea ultraligera y siempre de alta calidad.
 */
function procesarImagenCanvas(file, maxDimension = 600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a base64 JPEG con 90% de calidad
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function CambiarAvatarModal({
  abierto,
  onCerrar,
  usuarioActivo,
  todosLosUsuarios = [],
}) {
  if (!abierto) return null;

  const esSuperAdmin =
    usuarioActivo?.rol === "superadmin" || usuarioActivo?.nombre === "Jorge";

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(
    usuarioActivo?.nombre || "Jorge"
  );
  const [imagenPreview, setImagenPreview] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  const fileInputRef = useRef(null);

  const manejarArchivo = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMensaje({ tipo: "error", texto: "Por favor, selecciona un archivo de imagen (JPG, PNG, WEBP)." });
      return;
    }

    try {
      const dataUrl = await procesarImagenCanvas(file, 600);
      setImagenPreview(dataUrl);
      setMensaje(null);
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: "error", texto: "No se pudo procesar la imagen." });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    manejarArchivo(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setArrastrando(false);
    const file = e.dataTransfer.files?.[0];
    manejarArchivo(file);
  };

  const handleGuardar = async () => {
    if (!imagenPreview) {
      setMensaje({ tipo: "error", texto: "Selecciona primero una foto para guardar." });
      return;
    }

    setGuardando(true);
    setMensaje(null);

    try {
      const res = await fetch(`${API_URL}/api/usuario/avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: usuarioSeleccionado,
          imagenBase64: imagenPreview,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo actualizar la imagen.");

      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Disparar evento global para refrescar todas las fotos instantáneamente
      window.dispatchEvent(
        new CustomEvent("avatar-actualizado", {
          detail: {
            nombre: usuarioSeleccionado,
            timestamp: data.timestamp || Date.now(),
          },
        })
      );

      setMensaje({
        tipo: "success",
        texto: `¡Foto de ${usuarioSeleccionado} actualizada y sobreescrita con éxito!`,
      });

      setTimeout(() => {
        onCerrar();
        setImagenPreview(null);
        setMensaje(null);
      }, 1300);
    } catch (err) {
      setMensaje({ tipo: "error", texto: err.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white/90 backdrop-blur-2xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.18)] rounded-3xl p-6 sm:p-8 space-y-6"
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4 border-b border-stone-200/60 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Personalización de Perfil
            </span>
            <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight">
              Cambiar Foto / Logo
            </h3>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              Sube una nueva foto. Esta imagen sobreescribirá la actual para no acumular archivos.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>

        {/* Si es Superadmin, permitir elegir a qué miembro cambiar la foto */}
        {esSuperAdmin && todosLosUsuarios.length > 0 && (
          <div>
            <label className="text-xs font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
              Miembro a actualizar:
            </label>
            <select
              value={usuarioSeleccionado}
              onChange={(e) => {
                setUsuarioSeleccionado(e.target.value);
                setImagenPreview(null);
                setMensaje(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-stone-800"
            >
              {todosLosUsuarios.map((u) => (
                <option key={u.id || u.nombre} value={u.nombre}>
                  {u.nombre} {u.nombre === usuarioActivo?.nombre ? "(Tú)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Comparativa: Foto Actual vs Nueva */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50/80 border border-stone-200/60 text-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Actual
            </span>
            <UserAvatar
              nombre={usuarioSeleccionado}
              className="w-20 h-20 rounded-2xl shadow-sm border-2 border-white"
              imgClassName="w-full h-full object-cover rounded-2xl"
              fallbackClassName="text-xl font-black"
            />
          </div>

          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
              Nueva (Previa)
            </span>
            {imagenPreview ? (
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-sm border-2 border-emerald-500 ring-2 ring-emerald-200">
                <img
                  src={imagenPreview}
                  alt="Previa"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 text-xs font-medium">
                Sin foto
              </div>
            )}
          </div>
        </div>

        {/* Zona de subida Drag & Drop */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setArrastrando(true);
          }}
          onDragLeave={() => setArrastrando(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
            arrastrando
              ? "border-stone-900 bg-stone-100/80"
              : "border-stone-200 hover:border-stone-400 bg-white/60 hover:bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="text-3xl mb-2">📸</div>
          <p className="text-sm font-bold text-stone-800">
            Haz clic o arrastra tu foto aquí
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Formatos JPG, PNG o WEBP. Se redimensiona automáticamente.
          </p>
        </div>

        {/* Nota informativa de sobre-escritura */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-300/40 text-stone-700">
          <span className="text-base shrink-0">🔄</span>
          <p className="text-[11px] font-medium leading-tight text-amber-950">
            <span className="font-bold">Sobreescritura directa:</span> La foto sustituirá a la actual de tu usuario en la carpeta, asegurando que no se acumulen fotos innecesarias.
          </p>
        </div>

        {/* Mensaje de estado */}
        {mensaje && (
          <div
            className={`p-3.5 rounded-2xl text-xs font-bold text-center border ${
              mensaje.tipo === "success"
                ? "bg-emerald-100/80 border-emerald-300 text-emerald-900"
                : "bg-red-100/80 border-red-300 text-red-900"
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={!imagenPreview || guardando}
            className="px-7 py-2.5 rounded-full bg-stone-900 text-white text-xs font-bold tracking-tight shadow-md hover:bg-stone-800 active:scale-95 transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2"
          >
            {guardando ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <span>Guardar y Sobreescribir</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
