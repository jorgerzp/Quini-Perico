import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://quini-perico.vercel.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Semillado inicial de los 8 usuarios oficiales y el Bote a 0
async function seedDatabase() {
  try {
    const totalUsuarios = await prisma.usuario.count();
    if (totalUsuarios === 0) {
      const usuariosIniciales = [
        { nombre: "Jorge", rol: "superadmin", puntos: 0, aciertos: 0, avatarColor: "blue" },
        { nombre: "Rafa", rol: "user", puntos: 0, aciertos: 0, avatarColor: "emerald" },
        { nombre: "Miguel", rol: "user", puntos: 0, aciertos: 0, avatarColor: "amber" },
        { nombre: "Acuña", rol: "user", puntos: 0, aciertos: 0, avatarColor: "indigo" },
        { nombre: "Andrés", rol: "user", puntos: 0, aciertos: 0, avatarColor: "rose" },
        { nombre: "Mora", rol: "user", puntos: 0, aciertos: 0, avatarColor: "purple" },
        { nombre: "Vergara", rol: "user", puntos: 0, aciertos: 0, avatarColor: "cyan" },
        { nombre: "Ale", rol: "user", puntos: 0, aciertos: 0, avatarColor: "orange" },
      ];

      for (const u of usuariosIniciales) {
        await prisma.usuario.create({ data: u });
      }
      console.log("8 usuarios iniciales creados (todos con 0 puntos y 0 aciertos).");
    }

    const totalBote = await prisma.bote.count();
    if (totalBote === 0) {
      await prisma.bote.create({
        data: {
          acumulado: 0.0,
        },
      });
      console.log("Bote inicial establecido en 0.00€.");
    }

    const totalJornadas = await prisma.jornada.count();
    if (totalJornadas === 0) {
      await prisma.jornada.create({
        data: {
          numero: 7,
          activa: true,
          partidos: null,
          resultados: null,
        },
      });
      console.log("Jornada 7 activa inicializada.");
    }
  } catch (error) {
    console.error("Error al sembrar la base de datos:", error);
  }
}

seedDatabase();

// --- ENDPOINT AUTENTICACIÓN (LOGIN) ---
app.post("/api/login", async (req, res) => {
  try {
    const { nombre, password } = req.body;

    if (!nombre || !password) {
      return res.status(400).json({ error: "Introduce tu nombre y la contraseña." });
    }

    if (password.trim() !== "PuertoPerico") {
      return res.status(401).json({ error: "Contraseña incorrecta. Recuerda que es PuertoPerico." });
    }

    // Búsqueda flexible (insensible a mayúsculas y acentos) para los 8 miembros
    const usuarios = await prisma.usuario.findMany();
    const normalize = (str) =>
      str
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    const cleanInput = normalize(nombre);
    const usuario = usuarios.find((u) => normalize(u.nombre) === cleanInput);

    if (!usuario) {
      return res.status(404).json({
        error: `El usuario '${nombre.trim()}' no existe en la peña. Los miembros son: Jorge, Rafa, Miguel, Acuña, Andrés, Mora, Vergara, Ale.`,
      });
    }

    res.json({
      message: "Login correcto.",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        puntos: usuario.puntos,
        aciertos: usuario.aciertos,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error de autenticación en el servidor." });
  }
});

// --- ENDPOINTS USUARIOS ---
app.get("/api/usuarios", async (_req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: { puntos: "desc" },
    });

    // Obtener la jornada activa
    const jornadaActiva = await prisma.jornada.findFirst({
      where: { activa: true },
    });

    let jugadasJornada = [];
    if (jornadaActiva) {
      jugadasJornada = await prisma.jugada.findMany({
        where: { jornadaId: jornadaActiva.id },
      });
    }

    const usuariosConEstado = usuarios.map((u) => {
      const jugada = jugadasJornada.find((j) => j.usuarioId === u.id);
      return {
        ...u,
        haJugado: !!jugada,
        jugadaActual: jugada ? JSON.parse(jugada.pronosticos || "{}") : null,
        jornadaActualId: jornadaActiva?.id || null,
        jornadaActualNumero: jornadaActiva?.numero || null,
      };
    });

    res.json(usuariosConEstado);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "No se pudieron obtener los usuarios." });
  }
});

// --- ENDPOINTS BOTE ---
app.get("/api/bote", async (_req, res) => {
  try {
    let bote = await prisma.bote.findFirst({
      include: {
        movimientos: {
          orderBy: { fecha: "desc" },
        },
      },
    });

    if (!bote) {
      bote = await prisma.bote.create({
        data: { acumulado: 0 },
        include: { movimientos: true },
      });
    }

    res.json(bote);
  } catch (error) {
    console.error("Error al obtener el bote:", error);
    res.status(500).json({ error: "No se pudo obtener el bote." });
  }
});

// Añadir suma al bote (Superadmin)
app.post("/api/bote/sumar", async (req, res) => {
  try {
    const { cantidad, concepto, autor } = req.body;
    const numCantidad = parseFloat(cantidad);

    if (isNaN(numCantidad) || numCantidad <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser un número mayor que 0." });
    }

    let bote = await prisma.bote.findFirst();
    if (!bote) {
      bote = await prisma.bote.create({ data: { acumulado: 0 } });
    }

    const nuevoAcumulado = parseFloat((bote.acumulado + numCantidad).toFixed(2));

    const boteActualizado = await prisma.bote.update({
      where: { id: bote.id },
      data: {
        acumulado: nuevoAcumulado,
        movimientos: {
          create: {
            cantidad: numCantidad,
            concepto: concepto || "Incremento manual de bote",
            autor: autor || "Jorge (Superadmin)",
          },
        },
      },
      include: {
        movimientos: {
          orderBy: { fecha: "desc" },
        },
      },
    });

    res.status(201).json({
      message: `¡Se han añadido +${numCantidad.toFixed(2)}€ al bote!`,
      bote: boteActualizado,
    });
  } catch (error) {
    console.error("Error al sumar al bote:", error);
    res.status(500).json({ error: "No se pudo actualizar el bote." });
  }
});

// Añadir ganancias de la jornada al bote (Superadmin)
app.post("/api/bote/ganancia", async (req, res) => {
  try {
    const { cantidad, jornada, aciertos, fecha, concepto } = req.body;
    const numCantidad = parseFloat(cantidad);

    if (isNaN(numCantidad) || numCantidad <= 0) {
      return res.status(400).json({ error: "La cantidad ganada debe ser un número mayor que 0." });
    }

    let bote = await prisma.bote.findFirst();
    if (!bote) {
      bote = await prisma.bote.create({ data: { acumulado: 0 } });
    }

    const nuevoAcumulado = parseFloat((bote.acumulado + numCantidad).toFixed(2));
    const fechaRegistro = fecha ? new Date(fecha) : new Date();

    const boteActualizado = await prisma.bote.update({
      where: { id: bote.id },
      data: {
        acumulado: nuevoAcumulado,
        movimientos: {
          create: {
            cantidad: numCantidad,
            jornada: jornada ? parseInt(jornada, 10) : 1,
            aciertos: aciertos ? String(aciertos) : "N/A",
            concepto: concepto || `Ganancias Jornada ${jornada || 1}`,
            autor: "Jorge (Superadmin)",
            fecha: fechaRegistro,
          },
        },
      },
      include: {
        movimientos: {
          orderBy: { fecha: "desc" },
        },
      },
    });

    res.status(201).json({
      message: `¡Se han sumado +${numCantidad.toFixed(2)}€ de ganancias al bote!`,
      bote: boteActualizado,
    });
  } catch (error) {
    console.error("Error al registrar ganancia en el bote:", error);
    res.status(500).json({ error: "No se pudo registrar la ganancia en el bote." });
  }
});

// Reiniciar bote a 0.00 € (Superadmin)
app.post("/api/bote/reset", async (_req, res) => {
  try {
    let bote = await prisma.bote.findFirst();
    if (!bote) {
      bote = await prisma.bote.create({ data: { acumulado: 0.0 } });
    } else {
      bote = await prisma.bote.update({
        where: { id: bote.id },
        data: { acumulado: 0.0 },
      });
    }

    await prisma.movimientoBote.deleteMany();

    res.json({
      message: "Bote reiniciado a 0.00 € e historial de ganancias vaciado.",
      bote: { ...bote, acumulado: 0.0, movimientos: [] },
    });
  } catch (error) {
    console.error("Error al reiniciar el bote:", error);
    res.status(500).json({ error: "No se pudo reiniciar el bote." });
  }
});


// --- ENDPOINTS CLASIFICACIÓN (Ordenado por Aciertos Totales) ---
app.get("/api/clasificacion", async (_req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: [{ aciertos: "desc" }, { puntos: "desc" }, { nombre: "asc" }],
    });

    const ranking = usuarios.map((u, index) => ({
      posicion: index + 1,
      ...u,
    }));

    res.json(ranking);
  } catch (error) {
    console.error("Error al obtener clasificación:", error);
    res.status(500).json({ error: "No se pudo obtener la clasificación." });
  }
});

// --- ENDPOINTS JUGADAS (QUINIGOL) ---
app.get("/api/jugadas", async (_req, res) => {
  try {
    const jugadas = await prisma.jugada.findMany({
      orderBy: { fecha_creacion: "desc" },
      include: {
        usuario: true,
        jornada: true,
      },
    });

    const jugadasFormateadas = jugadas.map((j) => {
      let datos;
      try {
        datos = JSON.parse(j.pronosticos || j.numeros || "{}");
      } catch {
        datos = j.pronosticos || j.numeros;
      }
      return {
        ...j,
        datos,
      };
    });

    res.json(jugadasFormateadas);
  } catch (error) {
    console.error("Error al obtener jugadas:", error);
    res.status(500).json({ error: "No se pudieron obtener las jugadas." });
  }
});

app.post("/api/jugadas", async (req, res) => {
  try {
    const { usuarioId, pronosticos } = req.body;
    const datosPronosticos = pronosticos || req.body;

    if (!datosPronosticos || Object.keys(datosPronosticos).length === 0) {
      return res.status(400).json({ error: "Debes enviar un pronóstico válido." });
    }

    // Buscar usuario o asignar Jorge por defecto si no viene id
    let usuario;
    if (usuarioId) {
      usuario = await prisma.usuario.findUnique({ where: { id: Number(usuarioId) } });
    }
    if (!usuario) {
      usuario = await prisma.usuario.findFirst({ where: { nombre: "Jorge" } });
    }

    // Buscar jornada activa
    let jornada = await prisma.jornada.findFirst({ where: { activa: true } });
    if (!jornada) {
      jornada = await prisma.jornada.create({ data: { numero: 1, activa: true } });
    }

    // Guardar o actualizar la jugada del usuario para esta jornada
    const serializado = JSON.stringify(datosPronosticos);

    // Validar que ningún otro participante haya sellado una apuesta idéntica en esta jornada
    const otrasJugadas = await prisma.jugada.findMany({
      where: {
        jornadaId: jornada.id,
        usuarioId: { not: usuario.id },
      },
      include: { usuario: true },
    });

    const sonPronosticosIdenticos = (p1, p2) => {
      if (!p1 || !p2) return false;
      const parse = (val) => {
        if (typeof val === "string") {
          try { return JSON.parse(val); } catch { return {}; }
        }
        return val || {};
      };
      const o1 = parse(p1);
      const o2 = parse(p2);

      for (let i = 1; i <= 6; i++) {
        const k = `partido${i}`;
        const m1 = o1[k] || {};
        const m2 = o2[k] || {};
        const l1 = String(m1.local ?? "").trim();
        const l2 = String(m2.local ?? "").trim();
        const v1 = String(m1.visitante ?? "").trim();
        const v2 = String(m2.visitante ?? "").trim();
        if (l1 !== l2 || v1 !== v2) {
          return false;
        }
      }
      return true;
    };

    const coincidente = otrasJugadas.find((oj) =>
      sonPronosticosIdenticos(datosPronosticos, oj.pronosticos || oj.numeros)
    );

    if (coincidente) {
      const otroNombre = coincidente.usuario?.nombre || "otro participante";
      return res.status(400).json({
        error: `Tu apuesta es 100% idéntica a la que ya selló ${otroNombre} para la Jornada ${jornada.numero}. En la peña no se permiten dos apuestas iguales en la misma jornada; debes modificar al menos un resultado para poder guardar.`,
      });
    }

    const jugadaExistente = await prisma.jugada.findFirst({
      where: {
        usuarioId: usuario.id,
        jornadaId: jornada.id,
      },
    });

    let jugada;
    if (jugadaExistente) {
      jugada = await prisma.jugada.update({
        where: { id: jugadaExistente.id },
        data: {
          pronosticos: serializado,
          numeros: serializado,
        },
        include: { usuario: true },
      });
    } else {
      jugada = await prisma.jugada.create({
        data: {
          usuarioId: usuario.id,
          jornadaId: jornada.id,
          pronosticos: serializado,
          numeros: serializado,
        },
        include: { usuario: true },
      });
    }

    // Crear notificación para Jorge (Superadmin)
    try {
      await prisma.notificacion.create({
        data: {
          tipo: "apuesta",
          usuarioId: usuario.id,
          usuarioNombre: usuario.nombre,
          jornadaNumero: jornada.numero,
          pronosticos: serializado,
          resumen: `Apuesta Jornada ${jornada.numero} registrada por ${usuario.nombre}`,
          leida: false,
        },
      });
    } catch (notifErr) {
      console.error("Error al registrar notificación para superadmin:", notifErr);
    }

    res.status(201).json({
      message: `¡Apuesta de ${usuario.nombre} guardada correctamente!`,
      jugada: {
        ...jugada,
        datos: datosPronosticos,
      },
    });
  } catch (error) {
    console.error("Error al guardar jugada:", error);
    res.status(500).json({ error: "No se pudo guardar la jugada." });
  }
});

// --- ENDPOINTS NOTIFICACIONES (SUPERADMIN JORGE) ---
app.get("/api/notificaciones", async (_req, res) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      orderBy: { fecha_creacion: "desc" },
      take: 50,
      include: {
        usuario: true,
      },
    });

    const totalNoLeidas = notificaciones.filter((n) => !n.leida).length;

    const notificacionesFormateadas = notificaciones.map((n) => {
      let pronosticosParsed = {};
      try {
        pronosticosParsed = JSON.parse(n.pronosticos || "{}");
      } catch {
        pronosticosParsed = {};
      }
      return {
        ...n,
        pronosticos: pronosticosParsed,
      };
    });

    res.json({
      notificaciones: notificacionesFormateadas,
      totalNoLeidas,
    });
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    res.status(500).json({ error: "No se pudieron obtener las notificaciones." });
  }
});

app.put("/api/notificaciones/:id/leida", async (req, res) => {
  try {
    const { id } = req.params;
    const notificacion = await prisma.notificacion.update({
      where: { id: Number(id) },
      data: { leida: true },
    });
    res.json(notificacion);
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    res.status(500).json({ error: "No se pudo actualizar la notificación." });
  }
});

app.post("/api/notificaciones/marcar-todas-leidas", async (_req, res) => {
  try {
    await prisma.notificacion.updateMany({
      where: { leida: false },
      data: { leida: true },
    });
    res.json({ message: "Todas las notificaciones marcadas como leídas." });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error);
    res.status(500).json({ error: "No se pudieron marcar como leídas." });
  }
});

// --- ENDPOINTS PARTIDOS DE LA JORNADA (OCR Y CONFIGURACIÓN) ---
app.get("/api/jornada/partidos", async (_req, res) => {
  try {
    let jornada = await prisma.jornada.findFirst({ where: { activa: true } });
    if (!jornada) {
      jornada = await prisma.jornada.create({
        data: {
          numero: 1,
          activa: true,
          partidos: null,
          resultados: null,
        },
      });
    }

    let partidos = null;
    let configurado = false;

    if (jornada.partidos) {
      try {
        const parsed = JSON.parse(jornada.partidos);
        if (
          Array.isArray(parsed) &&
          parsed.length === 6 &&
          parsed.every((p) => p.home && p.home.trim() && p.away && p.away.trim())
        ) {
          partidos = parsed;
          configurado = true;
        }
      } catch {
        partidos = null;
        configurado = false;
      }
    }

    res.json({
      jornada: jornada.numero,
      activa: jornada.activa,
      configurado,
      partidos,
      imagenBoleto: jornada.imagenBoleto,
      apuestasAceptadas: Boolean(jornada.apuestasAceptadas),
    });
  } catch (error) {
    console.error("Error al obtener partidos:", error);
    res.status(500).json({ error: "No se pudieron obtener los partidos de la jornada." });
  }
});

// Resetear partidos de la jornada (Superadmin)
app.delete("/api/jornada/partidos", async (_req, res) => {
  try {
    const jornada = await prisma.jornada.findFirst({ where: { activa: true } });
    if (jornada) {
      await prisma.jornada.update({
        where: { id: jornada.id },
        data: {
          partidos: null,
          imagenBoleto: null,
          resultados: null,
        },
      });
    }
    res.json({ message: "Partidos de la jornada reseteados a estado inicial (sin configurar)." });
  } catch (error) {
    console.error("Error al reiniciar partidos:", error);
    res.status(500).json({ error: "No se pudieron reiniciar los partidos." });
  }
});

// Aceptar todas las apuestas de la jornada (Superadmin)
app.post("/api/jornada/aceptar-apuestas", async (_req, res) => {
  try {
    const jornada = await prisma.jornada.findFirst({ where: { activa: true } });
    if (!jornada) return res.status(404).json({ error: "No hay jornada activa." });

    await prisma.jornada.update({
      where: { id: jornada.id },
      data: { apuestasAceptadas: true },
    });

    // Marcar notificaciones de la jornada como revisadas
    await prisma.notificacion.updateMany({
      where: { jornadaNumero: jornada.numero },
      data: { leida: true },
    });

    res.json({
      message: "Todas las apuestas han sido aceptadas. Los resultados y pronósticos ya son visibles para toda la peña.",
      apuestasAceptadas: true,
    });
  } catch (error) {
    console.error("Error al aceptar apuestas:", error);
    res.status(500).json({ error: "No se pudieron aceptar las apuestas." });
  }
});

// Reabrir apuestas de la jornada (Superadmin)
app.post("/api/jornada/reabrir-apuestas", async (_req, res) => {
  try {
    const jornada = await prisma.jornada.findFirst({ where: { activa: true } });
    if (!jornada) return res.status(404).json({ error: "No hay jornada activa." });

    await prisma.jornada.update({
      where: { id: jornada.id },
      data: { apuestasAceptadas: false },
    });

    res.json({
      message: "Las apuestas vuelven a estar pendientes de validación.",
      apuestasAceptadas: false,
    });
  } catch (error) {
    console.error("Error al reabrir apuestas:", error);
    res.status(500).json({ error: "No se pudieron reabrir las apuestas." });
  }
});

// Actualizar número de jornada activa (Superadmin)
app.post("/api/jornada/numero", async (req, res) => {
  try {
    const { numero } = req.body;
    const num = parseInt(numero, 10);
    if (isNaN(num) || num < 1) {
      return res.status(400).json({ error: "El número de jornada debe ser un entero positivo." });
    }

    // Buscar si ya existe una jornada con ese número
    let jornadaDestino = await prisma.jornada.findFirst({ where: { numero: num } });

    // Desactivar cualquier otra jornada activa previa
    await prisma.jornada.updateMany({
      where: { activa: true, numero: { not: num } },
      data: { activa: false },
    });

    if (jornadaDestino) {
      jornadaDestino = await prisma.jornada.update({
        where: { id: jornadaDestino.id },
        data: { activa: true },
      });
    } else {
      jornadaDestino = await prisma.jornada.create({
        data: {
          numero: num,
          activa: true,
          partidos: null,
          resultados: null,
        },
      });
    }

    res.json({
      message: `Jornada activa actualizada a la Jornada ${num}.`,
      jornada: jornadaDestino.numero,
    });
  } catch (error) {
    console.error("Error al actualizar número de jornada:", error);
    res.status(500).json({ error: "No se pudo actualizar el número de jornada." });
  }
});

app.post("/api/jornada/partidos", async (req, res) => {
  try {
    const { partidos, imagenBoleto, numeroJornada } = req.body;

    if (!Array.isArray(partidos) || partidos.length !== 6) {
      return res.status(400).json({ error: "Se deben definir exactamente 6 partidos para el Quinigol." });
    }

    const partidosFormateados = partidos.map((p, idx) => ({
      id: idx + 1,
      key: `partido${idx + 1}`,
      numStr: String(idx + 1).padStart(2, "0"),
      home: (p.home || `Local ${idx + 1}`).trim(),
      away: (p.away || `Visitante ${idx + 1}`).trim(),
      homeCode: (p.homeCode || (p.home ? p.home.substring(0, 3).toUpperCase() : `L0${idx + 1}`)).trim(),
      awayCode: (p.awayCode || (p.away ? p.away.substring(0, 3).toUpperCase() : `V0${idx + 1}`)).trim(),
    }));

    let num = null;
    if (numeroJornada) {
      const parsed = parseInt(numeroJornada, 10);
      if (!isNaN(parsed) && parsed >= 1) {
        num = parsed;
      }
    }

    if (!num) {
      const jornadaActual = await prisma.jornada.findFirst({ where: { activa: true } });
      num = jornadaActual ? jornadaActual.numero : 1;
    }

    // Buscar si ya existe la jornada con este número
    let jornadaDestino = await prisma.jornada.findFirst({ where: { numero: num } });

    // Desactivar cualquier otra jornada activa previa
    await prisma.jornada.updateMany({
      where: { activa: true, numero: { not: num } },
      data: { activa: false },
    });

    const dataToSave = {
      activa: true,
      partidos: JSON.stringify(partidosFormateados),
      ...(imagenBoleto !== undefined ? { imagenBoleto } : {}),
    };

    if (jornadaDestino) {
      jornadaDestino = await prisma.jornada.update({
        where: { id: jornadaDestino.id },
        data: dataToSave,
      });
    } else {
      jornadaDestino = await prisma.jornada.create({
        data: {
          numero: num,
          resultados: null,
          ...dataToSave,
        },
      });
    }

    res.json({
      message: "¡Partidos de la jornada actualizados y aplicados con éxito!",
      jornada: jornadaDestino.numero,
      partidos: partidosFormateados,
      imagenBoleto: jornadaDestino.imagenBoleto,
    });
  } catch (error) {
    console.error("Error al actualizar partidos:", error);
    res.status(500).json({ error: "No se pudieron actualizar los partidos de la jornada." });
  }
});

// --- ENDPOINTS RESULTADOS OFICIALES Y CÁLCULO DE PUNTUACIONES ---
app.get("/api/resultados", async (_req, res) => {
  try {
    const jornada = await prisma.jornada.findFirst({
      where: { activa: true },
    });

    let resultados = null;
    let disponible = false;

    if (jornada?.resultados) {
      try {
        resultados = JSON.parse(jornada.resultados);
        // Comprobar si hay al menos un pronóstico no nulo introducido por Jorge
        if (
          resultados &&
          Object.values(resultados).some((p) => p.local !== null || p.visitante !== null)
        ) {
          disponible = true;
        }
      } catch {
        resultados = null;
        disponible = false;
      }
    }

    let jugadasDeTodos = [];
    if (jornada && jornada.apuestasAceptadas) {
      const jugadas = await prisma.jugada.findMany({
        where: { jornadaId: jornada.id },
        include: { usuario: true },
        orderBy: { fecha_creacion: "asc" },
      });
      jugadasDeTodos = jugadas.map((j) => {
        let datos = {};
        try {
          datos = JSON.parse(j.pronosticos || j.numeros || "{}");
        } catch {
          datos = {};
        }
        return {
          id: j.id,
          usuarioId: j.usuarioId,
          usuarioNombre: j.usuario?.nombre || "Miembro",
          pronosticos: datos,
          puntosObtenidos: j.puntosObtenidos,
        };
      });
    }

    res.json({
      jornada: jornada ? jornada.numero : 1,
      activa: jornada ? jornada.activa : true,
      disponible,
      apuestasAceptadas: Boolean(jornada && jornada.apuestasAceptadas),
      resultados,
      jugadasDeTodos,
    });
  } catch (error) {
    console.error("Error al obtener resultados:", error);
    res.status(500).json({ error: "No se pudieron obtener los resultados." });
  }
});

// Reiniciar / Limpiar resultados de la jornada (Superadmin)
app.delete("/api/resultados", async (_req, res) => {
  try {
    const jornada = await prisma.jornada.findFirst({ where: { activa: true } });
    if (jornada) {
      await prisma.jornada.update({
        where: { id: jornada.id },
        data: { resultados: null },
      });
    }
    res.json({ message: "Resultados oficiales reiniciados. Estado: aún no disponible." });
  } catch (error) {
    console.error("Error al reiniciar resultados:", error);
    res.status(500).json({ error: "Error al reiniciar resultados oficiales." });
  }
});

// Guardar resultados oficiales y calcular puntos para todos los participantes
app.post("/api/resultados", async (req, res) => {
  try {
    const { resultados } = req.body;

    if (!resultados || typeof resultados !== "object") {
      return res.status(400).json({ error: "Debes enviar los resultados de los partidos." });
    }

    let jornada = await prisma.jornada.findFirst({ where: { activa: true } });
    if (!jornada) {
      jornada = await prisma.jornada.create({ data: { numero: 1, activa: true } });
    }

    // Guardar resultados oficiales
    await prisma.jornada.update({
      where: { id: jornada.id },
      data: {
        resultados: JSON.stringify(resultados),
      },
    });

    // Calcular puntos de cada jugada de la jornada
    const jugadas = await prisma.jugada.findMany({
      where: { jornadaId: jornada.id },
      include: { usuario: true },
    });

    const desglose = [];

    for (const jugada of jugadas) {
      let pronosticosObj = {};
      try {
        pronosticosObj = JSON.parse(jugada.pronosticos || "{}");
      } catch {
        pronosticosObj = {};
      }

      let puntosJornada = 0;
      let aciertosJornada = 0;

      for (let i = 1; i <= 6; i++) {
        const key = `partido${i}`;
        const oficial = resultados[key];
        const pronostico = pronosticosObj[key];

        if (oficial && pronostico) {
          // 1 punto por acierto: se otorga 1 punto al acertar el resultado exacto del partido
          if (
            oficial.local &&
            oficial.local === pronostico.local &&
            oficial.visitante &&
            oficial.visitante === pronostico.visitante
          ) {
            puntosJornada += 1;
            aciertosJornada += 1;
          }
        }
      }

      // Actualizar puntos de la jugada
      await prisma.jugada.update({
        where: { id: jugada.id },
        data: { puntosObtenidos: puntosJornada },
      });

      // Sumar al usuario
      await prisma.usuario.update({
        where: { id: jugada.usuarioId },
        data: {
          puntos: { increment: puntosJornada },
          aciertos: { increment: aciertosJornada },
        },
      });

      desglose.push({
        usuario: jugada.usuario.nombre,
        puntosJornada,
        aciertosJornada,
      });
    }

    res.json({
      message: "¡Resultados oficiales registrados y puntuaciones calculadas con éxito!",
      desglose,
    });
  } catch (error) {
    console.error("Error al calcular resultados:", error);
    res.status(500).json({ error: "No se pudieron calcular las puntuaciones." });
  }
});

// Modificar puntos manualmente (Superadmin)
app.post("/api/usuarios/puntos", async (req, res) => {
  try {
    const { usuarioId, puntosDelta, motivo } = req.body;
    const delta = parseInt(puntosDelta, 10);

    if (isNaN(delta)) {
      return res.status(400).json({ error: "Los puntos deben ser un número válido." });
    }

    const usuario = await prisma.usuario.update({
      where: { id: Number(usuarioId) },
      data: {
        puntos: { increment: delta },
      },
    });

    res.json({
      message: `Puntos de ${usuario.nombre} actualizados (${delta > 0 ? "+" : ""}${delta} pts por ${motivo || "ajuste de admin"}).`,
      usuario,
    });
  } catch (error) {
    console.error("Error al modificar puntos:", error);
    res.status(500).json({ error: "No se pudieron modificar los puntos." });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Backend funcionando en el puerto ${PORT}`);
});
