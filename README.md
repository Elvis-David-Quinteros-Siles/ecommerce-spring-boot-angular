# Ecommerce Spring Boot + Angular

Tienda en línea con backend en Spring Boot 3.1 (Java 17) y frontend en Angular 16. Se despliega con Docker.

## Arquitectura

```
                 http://localhost:10020
                          │
                ┌─────────▼──────────┐
                │ ecommerce-frontend │  nginx + Angular (compose)
                │  /       → SPA     │
                │  /api    → backend │
                │  /images → backend │
                └─────────┬──────────┘
                          │ ecommerce-frontend-backend-net
                ┌─────────▼──────────┐
                │ ecommerce-backend  │  Spring Boot :8085 (compose, sin puerto publicado)
                └──────┬───────┬─────┘
   host.docker.internal│       │ ecommerce-minio-net (red externa)
                ┌──────▼──┐ ┌──▼──────────────┐
                │ postgres│ │ ecommerce-minio │
                └─────────┘ └─────────────────┘
          (contenedores FUERA del docker compose)
```

| Componente | Gestionado por | Detalle |
|---|---|---|
| `ecommerce-frontend` | `docker-compose.yml` | Angular compilado servido por nginx. Único puerto publicado (`FRONTEND_PORT`). |
| `ecommerce-backend` | `docker-compose.yml` | API REST, JWT y PayPal. Solo se accede a través de nginx. |
| `postgres` | Contenedor existente | Base de datos `ecommerce_db` con usuario `ecommerce_user`. |
| `ecommerce-minio` | `minio/run-minio.ps1` | Imágenes de productos (bucket `ecommerce-images`). Volumen `ecommerce-minio-data`. |

Las imágenes **no** se exponen directamente desde MinIO: el backend las sirve en `GET /images/{nombre}`, así que el bucket queda privado.

## Requisitos

- Docker Desktop con Docker Compose v2.
- Un contenedor PostgreSQL llamado `postgres` en marcha, con el puerto `5432` publicado en el host.
- La imagen `pgsty/minio:RELEASE.2026-08-04T00-00-00Z`. Si no está en local, se descarga sola.

## Despliegue

Ejecuta todos los comandos desde la raíz del proyecto (PowerShell).

### 1. Variables de entorno

```powershell
Copy-Item .env.example .env
```

Edita `.env` y completa como mínimo:

| Variable | Descripción |
|---|---|
| `FRONTEND_PORT` | Puerto del host donde queda publicada la aplicación (por defecto `10020`). |
| `PUBLIC_URL` | URL pública de la app, p. ej. `http://localhost:10020` o `https://tienda.midominio.com`. PayPal la usa para volver tras el pago. |
| `DB_PASSWORD` | Contraseña de `ecommerce_user`. |
| `MINIO_ROOT_PASSWORD` | Contraseña de MinIO (mínimo 8 caracteres). |
| `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | Credenciales de PayPal (sandbox o live, según `PAYPAL_MODE`). |

> `.env` contiene secretos y está en `.gitignore`. No lo subas al repositorio.

### 2. Base de datos (solo la primera vez)

Crea el usuario y la base en el contenedor `postgres` existente. Usa la misma contraseña que pusiste en `DB_PASSWORD`:

```powershell
$pass = ((Get-Content .env | Where-Object { $_ -like 'DB_PASSWORD=*' }) -replace '^DB_PASSWORD=','')
docker exec postgres psql -U postgres -c "CREATE ROLE ecommerce_user LOGIN PASSWORD '$pass';" -c "CREATE DATABASE ecommerce_db OWNER ecommerce_user;"
```

Las tablas las crea Hibernate al arrancar (`ddl-auto=update`).

### 3. MinIO (fuera del compose)

```powershell
powershell -ExecutionPolicy Bypass -File .\minio\run-minio.ps1
```

El script:
- crea la red `ecommerce-minio-net` si no existe;
- crea el contenedor `ecommerce-minio` (`restart: unless-stopped`) o lo arranca si ya existía;
- publica la consola web solo en `http://127.0.0.1:10021` (`MINIO_CONSOLE_PORT`).

El bucket y las imágenes iniciales (`default.jpg`, etc.) los crea el backend al arrancar.

### 4. Aplicación

```powershell
docker compose up -d --build
```

La primera compilación tarda varios minutos (dependencias de Maven y npm). El frontend espera a que el backend esté *healthy*.

Abre **http://localhost:10020** (o el valor de `PUBLIC_URL`).

### 5. Verificación

```powershell
docker ps --filter name=ecommerce --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
curl.exe -s http://localhost:10020/api/v1/home                                # -> [] o lista de productos
curl.exe -s -o NUL -w "%{http_code}" http://localhost:10020/images/default.jpg   # -> 200
```

## Operación

| Tarea | Comando |
|---|---|
| Ver logs | `docker compose logs -f backend` / `docker compose logs -f frontend` |
| Redesplegar tras cambios de código | `docker compose up -d --build` |
| Detener la aplicación | `docker compose down` (no afecta a Postgres ni a MinIO) |
| Detener / iniciar MinIO | `docker stop ecommerce-minio` / `docker start ecommerce-minio` |
| Backup de la base | `docker exec postgres pg_dump -U postgres ecommerce_db > ecommerce_db.sql` |
| Backup de imágenes | `docker run --rm -v ecommerce-minio-data:/data -v ${PWD}:/backup alpine tar czf /backup/minio-data.tgz -C /data .` |

### Crear un usuario administrador

El registro público crea usuarios con el `userType` que envía el frontend. Para crear un administrador por API:

```powershell
curl.exe -s -H "Content-Type: application/json" `
  -d '{\"username\":\"admin\",\"firstName\":\"Admin\",\"lastName\":\"Admin\",\"email\":\"admin@tienda.com\",\"address\":\"-\",\"cellphone\":\"-\",\"password\":\"CAMBIAR\",\"userType\":\"ADMIN\"}' `
  http://localhost:10020/api/v1/security/register
```

## Desarrollo local (sin Docker para la app)

Con Postgres y MinIO en marcha:

```powershell
# Backend (http://localhost:8085). Los valores por defecto están en application-dev.properties
cd backend
$env:DB_URL="jdbc:postgresql://localhost:5432/ecommerce_db"; $env:DB_USERNAME="ecommerce_user"; $env:DB_PASSWORD="..."
$env:MINIO_URL="http://localhost:9000"; $env:MINIO_ACCESS_KEY="..."; $env:MINIO_SECRET_KEY="..."
mvn spring-boot:run

# Frontend (http://localhost:4200, con proxy de /api e /images a :8085)
cd frontend
npm install
npm start
```

> Por seguridad, el contenedor MinIO no publica el puerto `9000` de la API. Para el desarrollo local tienes dos opciones: añadir `-p 127.0.0.1:9000:9000` al `docker run` del script, o usar otra instancia de MinIO.

## Variables de entorno del backend

| Variable | Default (desarrollo) | Uso |
|---|---|---|
| `SERVER_PORT` | `8085` | Puerto HTTP |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | `localhost:5432/ecommerce` | Conexión a PostgreSQL |
| `MINIO_URL` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET` | `http://localhost:9000`, `ecommerce-images` | Almacenamiento de imágenes |
| `APP_IMAGES_URL` | `http://localhost:8085/images/` | Prefijo que se guarda en `urlImage` (en Docker: `/images/`) |
| `APP_BACKEND_URL` | `http://localhost:8085` | Base de las URLs de retorno de PayPal |
| `APP_FRONTEND_URL` | `http://localhost:4200` | Redirección al frontend tras el pago |
| `PAYPAL_MODE` / `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` | sandbox | Integración con PayPal |

## Solución de problemas

- **`network ecommerce-minio-net declared as external, but could not be found`**: ejecuta primero `minio/run-minio.ps1`.
- **El backend no arranca y en los logs sale `Connection refused` a Postgres**: comprueba que el contenedor `postgres` está en marcha y publica `5432` en el host.
- **El backend no arranca por `password authentication failed`**: la contraseña de `ecommerce_user` no coincide con `DB_PASSWORD`. Cámbiala con `ALTER ROLE ecommerce_user PASSWORD '...'`.
- **Las imágenes devuelven 404 o 500**: revisa `docker logs ecommerce-backend` (busca `MinIO`) y que `ecommerce-minio` esté *healthy*.
- **PayPal redirige a `localhost` en producción**: ajusta `PUBLIC_URL` en `.env` y ejecuta `docker compose up -d`.
