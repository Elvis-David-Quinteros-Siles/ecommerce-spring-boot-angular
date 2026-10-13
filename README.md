# Ecommerce Spring Boot + Angular

Tienda en línea con backend en Spring Boot 3.1 (Java 17) y frontend en Angular 16. Se despliega con Docker.

## Funcionalidades

**Tienda (clientes)**
- Catálogo con buscador, ordenamiento por precio o nombre y vista de detalle del producto.
- Carrito persistente (sobrevive a recargas) con control de cantidades y contador en el encabezado.
- Registro e inicio de sesión con JWT. Tras ingresar, vuelves a la página donde estabas.
- Pago con PayPal (sandbox): el backend calcula el monto desde la orden (precios del catálogo) y solo la confirma tras verificar con PayPal que el pago se aprobó por ese monto y para esa orden.
- Cada cliente solo ve sus propios datos y órdenes; listar todas las órdenes o cambiar su estado es exclusivo del administrador.
- Diseño responsive (escritorio y móvil), estados de carga, estados vacíos y notificaciones.

**Administración (rol `ADMIN`)**
- CRUD de productos con imagen (vista previa, validación de tipo y tamaño hasta 10 MB).
- CRUD de categorías.
- Rutas protegidas por rol. Si la sesión expira (15 min), se avisa y redirige al login.

## Tecnologías

| Capa | Tecnología | Versión | Uso |
|---|---|---|---|
| Backend | Java (Eclipse Temurin) | 17 | Lenguaje y runtime |
| | Spring Boot | 3.1.2 | Web (REST), Data JPA, Security |
| | Hibernate / Spring Data JPA | 6.2 | ORM. El esquema se genera con `ddl-auto=update` |
| | JJWT | 0.11.5 | Generación y validación de tokens JWT |
| | MapStruct + Lombok | 1.5.2 / 1.18.24 | Mapeo entidad ↔ dominio y reducción de código repetitivo |
| | MinIO Java SDK | 8.5.7 | Subida, lectura y borrado de imágenes |
| | PayPal REST SDK | 1.14.0 | Creación y ejecución de pagos |
| | Maven | 3.9 | Build |
| Frontend | Angular | 16.2 | SPA (módulos, router, formularios por plantilla, guards, interceptores) |
| | TypeScript / RxJS | 5.1 / 7.8 | Lenguaje y programación reactiva |
| | Bootstrap + Bootstrap Icons | 5.3 / 1.11 | Estilos, grilla responsive e iconos |
| | ngx-toastr | 17 | Notificaciones |
| | SweetAlert2 | 11 | Diálogos de confirmación |
| Datos | PostgreSQL | 18 | Base de datos relacional |
| | MinIO | RELEASE.2026-08-04 | Almacenamiento de objetos (S3) para imágenes |
| Infraestructura | Docker + Docker Compose | v2 | Contenedores y orquestación |
| | nginx | 1.27 (alpine) | Sirve el frontend y hace de proxy inverso hacia el backend |
| | Node.js | 20 (alpine) | Compilación del frontend (solo en la etapa de build) |

## Estructura del proyecto

```
.
├── backend/                 Spring Boot (arquitectura hexagonal)
│   ├── src/main/java/.../
│   │   ├── domain/          Modelos y puertos (interfaces de repositorio)
│   │   ├── application/     Casos de uso (servicios) y almacenamiento de imágenes
│   │   └── infrastructure/  REST, JPA, seguridad JWT, PayPal y configuración de MinIO
│   ├── src/main/resources/static/images/   Imágenes iniciales que se suben a MinIO al arrancar
│   └── Dockerfile
├── frontend/                Angular
│   ├── src/app/components/  Páginas de la tienda y del panel de administración
│   ├── src/app/services/    Clientes HTTP, carrito, sesión e interceptor
│   ├── nginx.conf           Proxy de /api e /images hacia el backend
│   └── Dockerfile
├── minio/run-minio.ps1      Crea/arranca el contenedor MinIO (fuera del compose)
├── docker-compose.yml
└── .env.example             Plantilla de variables de entorno
```

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

## Producción: https://tienda.edqs.online

En el VPS (`ubuntu@158.69.216.13`) la app se integra con la infraestructura que ya comparten los demás proyectos:

| Pieza | Cómo está montada |
|---|---|
| Código | `~/ecommerce-spring-boot-angular` (clon de este repositorio) con su propio `.env` (permisos 600). |
| Compose | `.env` define `COMPOSE_FILE=docker-compose.yml:docker-compose.prod.yml`, así que basta con `docker compose ...`. |
| HTTPS | El nginx principal (`~/web`, contenedor `nginx`) tiene un bloque `tienda.edqs.online` en `nginx/conf.d/edqs.conf` que hace proxy a `ecommerce-frontend:80` por la red `proxy`. El certificado es el de `edqs.online` (Let's Encrypt, renovación automática con el contenedor `certbot`). |
| PostgreSQL | Instalado en el host (no en Docker). BD `ecommerce_db`, usuario `ecommerce_user`. `pg_hba.conf` y `ufw` solo permiten el puerto 5432 desde la subred fija del backend (`192.168.80.0/20`). |
| MinIO | El MinIO compartido (`~/minio`, contenedor `minio`, red `minio-net`). Bucket `ecommerce-images` con un usuario propio (`ecommerce`) limitado a ese bucket. |
| Puerto local | El frontend también queda en `127.0.0.1:10030`, solo accesible desde el servidor (útil para pruebas). |

### Actualizar a la última versión

```bash
ssh ubuntu@158.69.216.13
cd ~/ecommerce-spring-boot-angular
git pull
docker compose up -d --build
```

### Crear un administrador en producción

El registro público solo crea clientes. Para dar rol de administrador a una cuenta ya registrada:

```bash
sudo -u postgres psql -d ecommerce_db -c "UPDATE users SET user_type='ADMIN' WHERE email='correo@ejemplo.com';"
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

El registro (formulario o API) siempre crea clientes (`USER`) y no acepta `userType` ni `id`. Para crear un administrador, registra la cuenta desde "Crear cuenta" y luego cámbiale el rol en la base:

```powershell
docker exec postgres psql -U postgres -d ecommerce_db -c "UPDATE users SET user_type='ADMIN' WHERE email='correo@ejemplo.com';"
```

Se ingresa con el **email** y la contraseña. Los tokens JWT se firman con `JWT_SECRET` (definido en `.env`, mínimo 64 caracteres).

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
