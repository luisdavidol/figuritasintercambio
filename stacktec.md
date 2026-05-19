# Stack Tecnologico - Album Mundial 2026

## Resumen

Aplicacion web progresiva (PWA-compatible) para gestionar un album digital de figuritas del Mundial FIFA 2026 con funcionalidad de intercambios en tiempo real entre multiples usuarios.

---

## Frontend

| Tecnologia | Version | Proposito |
|---|---|---|
| **React** | 19.2 | Libreria de UI para construir la interfaz de usuario con componentes reutilizables |
| **TypeScript** | 6.0 | Superset tipado de JavaScript para mayor seguridad y mantenibilidad del codigo |
| **Vite** | 8.0 | Bundler y servidor de desarrollo ultrarrápido con Hot Module Replacement (HMR) |
| **TailwindCSS** | 4.3 | Framework CSS utility-first para estilos responsivos sin escribir CSS manual |

### Bibliotecas adicionales del frontend

| Biblioteca | Proposito |
|---|---|
| `@vitejs/plugin-react` | Soporte de React en Vite |
| `@tailwindcss/vite` | Integracion de TailwindCSS con Vite |

---

## Backend (Serverless)

**No hay servidor tradicional.** La aplicacion usa el modelo **BaaS (Backend as a Service)** con Firebase.

| Servicio | Proposito |
|---|---|
| **Firebase Firestore** | Base de datos NoSQL en tiempo real. Almacena usuarios, stickers de cada usuario, y lecturas en vivo via `onSnapshot()` |
| **Firebase Hosting** | CDN global para servir los archivos estaticos (HTML, JS, CSS, imagenes) con SSL automatico |
| **Firebase Auth** | No se usa directamente. Se implemento un sistema de autenticacion propio basado en Firestore (nombre + PIN de 4 digitos) |

### Estructura de Firestore

```
/users/{userId}
  - name: string
  - pin: string (hash simple)
  - createdAt: timestamp

/userStickers/{userId}_{stickerCode}
  - userId: string
  - stickerCode: string (ej: "MEX14")
  - status: "owned" | "missing" | "duplicate"
  - duplicateCount: number
  - updatedAt: timestamp
```

### Por que Firebase?

- **Tiempo real**: Los cambios de un usuario se reflejan instantaneamente en otros dispositivos
- **Sin servidor**: No requiere configurar, mantener ni escalar servidores
- **Escalabilidad**: Firebase Hosting usa CDN de Google, Firestore escala automaticamente
- **Costo**: Plan gratuito (Spark) suficiente para miles de usuarios

---

## Base de Datos

| Tipo | Tecnologia |
|---|---|
| **Base de datos** | Firebase Firestore (NoSQL, documento, tiempo real) |
| **Datos estaticos** | Archivos JSON (`equipos.json` con los 48 equipos y 960 stickers) |
| **Imagenes** | Archivos JPEG servidos estaticamente desde Firebase Hosting |

---

## Hosting y Dominio

| Aspecto | Detalle |
|---|---|
| **Proveedor** | Firebase Hosting (Google Cloud) |
| **URL** | https://figuritas-mundial-42b71.web.app |
| **SSL** | Automatico (certificado gestionado por Google) |
| **CDN** | Google Cloud CDN (distribucion global) |
| **Deploy** | `firebase deploy --only hosting` |

---

## Lenguajes de Programacion

| Capa | Lenguaje | Justificacion |
|---|---|---|
| **Frontend** | TypeScript / React (JSX) | Tipado estricto, mejor mantenibilidad, ecosistema React |
| **Estilos** | TailwindCSS (clases utilitarias) | Desarrollo agil, responsive mobile-first, sin archivos CSS externos |
| **Backend** | No aplica (Firebase BaaS) | Firestore maneja la logica de datos; las reglas de negocio estan en el frontend |
| **Scripts** | JavaScript (Node.js) | Scripts de utilidad (copia de archivos) ejecutados con `node` |

---

## Herramientas de Desarrollo

| Herramienta | Proposito |
|---|---|
| **VS Code** | Editor de codigo |
| **Node.js** 24.14 | Runtime para scripts y dependencias npm |
| **npm** | Gestion de paquetes |
| **Firebase CLI** 15.18 | Despliegue y gestion del proyecto Firebase |
| **Git** | Control de versiones |
| **Vitest** 4.1 | Framework de pruebas unitarias |
| **ESLint** 10.3 | Linter para calidad de codigo |

---

## Pruebas

| Herramienta | Proposito |
|---|---|
| **Vitest** | Test runner y framework de assertions |
| **Tests unitarios** | Verifican la integridad de los datos del album (48 equipos, 20 stickers c/u, tipos correctos, codigos unicos) y la logica del ciclo de estados de figuritas |

Ejecutar tests:
```powershell
npm test
```

---

## Estructura del Proyecto

```
figuritasopencode/
├── src/
│   ├── App.tsx                  # Componente principal y enrutamiento por tabs
│   ├── main.tsx                 # Punto de entrada
│   ├── index.css                # Estilos globales + Tailwind
│   ├── components/
│   │   ├── admin/               # Panel de administracion
│   │   ├── auth/                # Componentes de autenticacion
│   │   ├── dashboard/           # Tabla de progreso de usuarios
│   │   ├── matches/             # Buscador y ejecutor de intercambios
│   │   └── stickers/
│   │       └── AlbumView.tsx    # Vista del album (JPEG + grid de figuritas)
│   ├── data/
│   │   ├── album.json           # Datos del album (48 equipos, 960 stickers con nombres)
│   │   └── album.test.ts        # Tests unitarios de datos
│   ├── hooks/
│   │   ├── useAlbumData.ts      # Hook para leer y filtrar datos del album
│   │   ├── useAuth.ts           # Hook de autenticacion (login/registro con Firestore)
│   │   ├── useCatalog.ts        # Hook de catalogo (compatibilidad con otros componentes)
│   │   └── useUserStickers.ts   # Hook de stickers del usuario (lectura/escritura en Firestore)
│   └── lib/
│       ├── firebase.ts          # Configuracion e inicializacion de Firebase
│       ├── matchEngine.ts       # Motor de matching para intercambios
│       └── matchEngine.test.ts  # Tests del motor de intercambios
├── public/
│   └── teams/                   # 48 imagenes JPEG (una por equipo)
├── equipos.json                 # Fuente de datos original del album
├── equipos2026/                 # Carpeta con los 48 JPEGs originales
├── firebase.json                # Configuracion de Firebase Hosting
├── vite.config.ts               # Configuracion de Vite
├── tsconfig.json                # Configuracion de TypeScript
├── package.json                 # Dependencias y scripts
└── MANUAL_DE_USUARIO.md         # Manual para el usuario final
```

---

## Decisiones Tecnicas Clave

1. **Firebase Firestore** sobre bases de datos SQL: La sincronizacion en tiempo real es esencial para los intercambios. No requiere backend.

2. **Autenticacion simple (nombre + PIN)**: Para que cualquier persona sin conocimientos tecnicos pueda usarlo. Se evita el uso de email/contraseña o terceros (Google, Facebook).

3. **Datos estaticos en JSON**: Los 48 equipos con sus 960 figuritas no cambian, por lo que se cargan desde un archivo JSON en lugar de Firestore. Esto reduce lecturas y costos.

4. **Imagenes JPEG locales**: Las paginas del album se sirven como archivos estaticos desde el CDN de Firebase Hosting. Cada imagen pesa ~300KB.

5. **Zero Backend**: Toda la logica de negocio (ciclo de stickers, matching de intercambios, estadisticas) se ejecuta en el navegador del usuario. Firestore actua como base de datos compartida.

6. **Responsive Mobile-First**: La UI se diseno priorizando dispositivos moviles con TailwindCSS, targets de toque grandes, scroll horizontal para equipos, y grid adaptable.

---

## Flujo de Datos

```
Usuario toca figurita
        │
        ▼
App.tsx → handleStickerCycle(code)
        │
        ▼
useUserStickers.setStickerStatus(code, newStatus)
        │
        ▼
Firestore: setDoc(userStickers/{userId}_{code}, {...})
        │
        ▼
onSnapshot() → Actualiza UI de TODOS los usuarios en tiempo real
        │
        ▼
matchEngine.findMatches() → Sugiere intercambios actualizados
```

---

## Comandos Principales

```powershell
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para produccion
npm run build

# Ejecutar tests
npm test

# Desplegar a Firebase
firebase deploy --only hosting
```
