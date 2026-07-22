# Creator Commerce Frontend

Frontend web (Next.js 16, App Router, TypeScript, Tailwind v4) para el marketplace P2P de [`creator-commerce-backend`](../creator-commerce-backend). Consume la API REST directamente desde el navegador (no hay capa BFF/Server Actions propia) usando el JWT emitido por el backend.

## Estado actual

- Auth: registro/login con selector de rol (Creador/Marca), sesión persistida en `localStorage`.
- Discovery de creadores: búsqueda por nombre, chips de filtro (verificados, marketplace), panel de filtro por categoría, grilla de tarjetas, paginación.
- Perfil de creador: passport (score, campañas completadas, on-time, rating, rehire, first-approval, disputas), marketplaces con estado de verificación, redes sociales, portafolio de videos.

Estilo visual inspirado en las referencias que compartiste (fondo cálido, badge tipo píldora para el logo, acentos ámbar, chips redondeados) — el wordmark usa un placeholder (`creator.hub`), reemplazalo por tu marca real en `src/components/logo.tsx`.

## Requisitos

- Node.js 22+
- El backend (`creator-commerce-backend`) corriendo en `http://localhost:4000` (o la URL que configures).

## Instalación

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). Necesitás el backend corriendo (`npm run start:dev` en `../creator-commerce-backend`) para que cualquier pantalla funcione, ya que no hay datos mockeados.

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL de la API REST del backend (incluye `/api/v1`) |
| `NEXT_PUBLIC_WS_URL` | Base URL del backend para el WebSocket de chat (sin path, se usa `/chat` como namespace) |

## Estructura

```
src/
  app/
    login/, register/     pantallas de auth
    creators/              discovery + [id] detalle de creador
    layout.tsx             fonts, AuthProvider, estilos globales
  components/               Logo, Button, Chip, Input, AppShell, CreatorCard
  lib/
    api.ts                  wrapper fetch tipado + manejo de errores del backend
    auth-context.tsx        estado de sesión (React Context + localStorage)
    types.ts                tipos espejo de los DTOs/respuestas del backend
```

## Notas técnicas

- **Client-rendered, no Server Components para datos de la API**: dado que el backend es un servicio externo separado (no una base de datos co-ubicada), las pantallas que consumen la API son Client Components que hacen `fetch` directo desde el navegador con el JWT en el header `Authorization`. Esto evita duplicar lógica de auth en una capa BFF que no aporta nada en este caso.
- **`react-hooks/set-state-in-effect`**: este proyecto usa la config de lint más reciente de Next (basada en las reglas de React Compiler), que marca como error el patrón común "fetch en un efecto y actualizar loading state". Es un patrón válido para fetch-on-mount/fetch-on-param-change sin Suspense; donde aparece, está silenciado línea por línea con un comentario explicando por qué.
- Este es un scaffold inicial (auth + discovery). Quedan por construir: perfil propio (creator/brand), campañas, aplicaciones/invitaciones, colaboraciones, entregables, reviews, chat (ya hay backend y WebSocket listos), y el panel admin.
