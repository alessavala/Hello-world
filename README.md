# Hello-world

Hello there, I want to get some feedback about my coding, I'm starting in this world and in a few years I want to be a developer at my own start up or in a great company.
I'm studying daily, in one year I'll be a developer.

## Cortador de Videos para Podcasts

Una plataforma web para subir un video, recortar el fragmento que quieres usar y exportarlo
como clip de video o como audio (ideal para episodios de podcast).

### Estructura del proyecto

- `client/` — Frontend en React + Vite. Permite subir un video, previsualizarlo, elegir el
  punto de inicio/fin del corte y exportarlo como video (`mp4`) o solo audio (`mp3`).
- `server/` — Backend en Node.js + Express. Recibe el video, lo procesa con `ffmpeg`
  (vía `fluent-ffmpeg` + `ffmpeg-static`, sin depender de un ffmpeg instalado en el sistema)
  y expone los clips generados para su descarga.

### Cómo correrlo en local

1. Backend:
   ```bash
   cd server
   npm install
   npm run dev   # http://localhost:4000
   ```
2. Frontend (en otra terminal):
   ```bash
   cd client
   npm install
   npm run dev   # http://localhost:5173
   ```
3. Abre `http://localhost:5173`, sube un video, elige el rango a cortar y el modo
   (video o solo audio), y presiona "Cortar y exportar". Los clips generados aparecen
   abajo con opción de reproducir, descargar o eliminar.

En desarrollo, Vite hace proxy de `/api` y `/outputs` hacia el backend (puerto 4000),
así que no hace falta configurar CORS manualmente al usar `npm run dev` en ambos.
