# Deploy en un VPS de Hostinger

Esta guía asume un VPS nuevo con Ubuntu, y los dos dominios (o subdominios)
que vas a usar para el frontend y la API ya apuntando a la IP del servidor.

## 0. Qué VPS contratar

- **Plan**: el más chico de Hostinger (KVM 1 / KVM 2, ~1-2 vCPU, 4-8 GB RAM)
  alcanza de sobra para este stack (Postgres + API NestJS + Next.js + Caddy)
  con tráfico bajo/medio. Si más adelante crece mucho el uso, se escala el
  plan sin cambiar nada de esta configuración.
- **Sistema operativo**: Ubuntu 24.04 LTS.
- **Dominios**: necesitás poder crear registros DNS tipo A para:
  - `tudominio.com` (o el subdominio que uses para el frontend)
  - `api.tudominio.com` (para el backend)

  Ambos deben apuntar a la IP pública del VPS *antes* de levantar el stack,
  porque Caddy pide los certificados HTTPS (Let's Encrypt) automáticamente
  al arrancar y necesita que el DNS ya resuelva.

## 1. Preparar el servidor

Conectate por SSH (Hostinger te da el usuario/IP al contratar el VPS):

```bash
ssh root@TU_IP
```

Instalá Docker y Docker Compose:

```bash
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin git
```

Verificá:

```bash
docker --version
docker compose version
```

## 2. Clonar el repositorio

```bash
cd /opt
git clone https://github.com/alessavala/Hello-world.git creator-commerce
cd creator-commerce
```

Si el repo es privado, usá un token de acceso personal en la URL o
configurá una clave SSH de deploy en GitHub.

## 3. Configurar variables de entorno

```bash
cp .env.production.example .env
nano .env
```

Completá:

- `POSTGRES_PASSWORD`: una contraseña fuerte (no la dejes con el valor de ejemplo).
- `JWT_SECRET`: generalo con `openssl rand -hex 32` y pegalo.
- `FRONTEND_DOMAIN` / `API_DOMAIN`: tus dominios reales.
- `FRONTEND_URL` / `API_URL`: iguales a los de arriba pero con `https://`.

El archivo `.env` nunca se sube al repo (está en `.gitignore`).

## 4. Levantar el stack

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Esto va a:

1. Levantar Postgres (con un volumen persistente, no expuesto a internet).
2. Buildear e iniciar el backend NestJS, que corre las migraciones de
   Prisma automáticamente al arrancar (`prisma migrate deploy`).
3. Buildear e iniciar el frontend Next.js (con las URLs de API/WS ya
   compiladas dentro del bundle).
4. Levantar Caddy, que expone los puertos 80/443, pide los certificados
   HTTPS automáticamente y hace de reverse proxy hacia frontend y backend.

La primera vez el build puede tardar varios minutos (instala dependencias,
compila TypeScript de ambos proyectos, etc).

## 5. Verificar

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f caddy
```

Una vez que todo esté `healthy`/`running`:

- `https://tudominio.com` → frontend
- `https://api.tudominio.com/api/docs` → Swagger de la API

Si Caddy no puede emitir el certificado, la causa casi siempre es que el
DNS todavía no propagó. Esperá unos minutos y mirá `docker compose logs caddy`.

## 6. Actualizar cuando haya cambios nuevos

```bash
cd /opt/creator-commerce
git pull origin claude/creator-commerce-backend-audit-km5zeh
docker compose -f docker-compose.prod.yml up -d --build
```

Los datos de Postgres quedan intactos entre actualizaciones porque viven en
un volumen Docker aparte (`creator_postgres`).

## 7. Backups

Postgres corre en un volumen Docker persistente, pero **no hay backups
automáticos configurados**. Recomendado como mínimo un dump diario:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U $POSTGRES_USER $POSTGRES_DB > backup-$(date +%F).sql
```

Podés agregar esto a un cronjob del servidor y copiar los `.sql` fuera del
VPS (a otro storage) periódicamente.
