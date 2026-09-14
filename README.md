# QUINI-PERICO

Aplicación full-stack para seleccionar y guardar jugadas de quiniela (números del 1 al 49).

## Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Node.js + Express
- **Base de datos:** SQLite + Prisma

## Instalación y ejecución

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

El servidor arranca en `http://localhost:3001`.

### 2. Frontend (otra terminal)

```bash
cd frontend
npm install
npm run dev
```

La app arranca en `http://localhost:5173`.

## API

| Método | Ruta            | Descripción              |
|--------|-----------------|--------------------------|
| GET    | `/api/jugadas`  | Lista todas las jugadas  |
| POST   | `/api/jugadas`  | Guarda una nueva jugada  |

### Ejemplo POST

```json
{
  "numeros": [3, 12, 25, 38, 49]
}
```
