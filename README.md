# MiApp — Finanzas Personales

Aplicación full-stack para gestionar transacciones, categorías, cuentas y presupuestos personales.

## Stack

- **Frontend:** React + Vite + TypeScript (`frontend/`)
- **Backend:** Node.js + Express + TypeScript (`backend/`)
- **Base de datos:** SQLite (vía Prisma ORM)

## Estructura

```
MiApp/
├── frontend/       # App React (Vite)
└── backend/        # API REST (Express + Prisma)
```

## Cómo correr el proyecto

### Backend

```bash
cd backend
npm install
npm run prisma:migrate   # solo la primera vez o al cambiar el schema
npm run dev               # http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Modelo de datos (Prisma)

- **Account**: cuentas (efectivo, banco, tarjeta)
- **Category**: categorías de ingreso o gasto
- **Transaction**: movimientos (ingresos/gastos) ligados a cuenta y categoría
- **Budget**: presupuesto mensual por categoría
