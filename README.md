# nestjs-k8s-microservice-stack

[![Node.js](https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white&style=for-the-badge)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white&style=for-the-badge)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-326CE5?logo=kubernetes&logoColor=white&style=for-the-badge)](https://kubernetes.io/)
[![Helm](https://img.shields.io/badge/Helm-0F1689?logo=helm&logoColor=white&style=for-the-badge)](https://helm.sh/)
[![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub%20Actions-2088FF?logo=githubactions&logoColor=white&style=for-the-badge)](https://github.com/features/actions)

Stack de microservicios basado en NestJS, preparado para despliegues en Kubernetes con Helm, observabilidad con Prometheus/Grafana y pipeline CI/CD con GitHub Actions.

---

## Índice

- Introducción
- Arquitectura y servicios
- Estructura del proyecto
- Requisitos previos
- Configuración del entorno
- Desarrollo local (scripts y Docker Compose)
- Pruebas y calidad
- Compilación y builds
- Despliegue (Kubernetes/Helm)
- CI/CD
- Observabilidad y autoescalado
- Endpoints de prueba
- Scripts útiles
- Troubleshooting

---

## Introducción

- Framework principal: `NestJS` con `TypeScript`.
- Despliegue: `Kubernetes` gestionado por `Helm`.
- Observabilidad: `Prometheus` y `Grafana`.
- Pipeline: `GitHub Actions` para build, test, push de imágenes y `helm upgrade`.

---

## Arquitectura y servicios

- `api-gateway`: Puerta de entrada HTTP, enruta solicitudes a los servicios.
- `user-service`: Gestión de usuarios (p. ej., registro/login), DB relacional.
- `product-service`: Gestión de productos, DB documental.
- `notification-service`: Notificaciones, cola/cache.

Comunicación principal vía HTTP desde el gateway; los servicios pueden comunicarse entre sí según necesidad.

---

## Estructura del proyecto

```
├── microservices/
│   ├── api-gateway/
│   ├── user-service/
│   ├── product-service/
│   └── notification-service/
├── shared/
│   ├── common/
│   └── config/
├── scripts/
│   ├── start-dev.sh
│   ├── stop-dev.sh
│   ├── build-all.sh
│   ├── test-all.sh
│   └── quick-test.sh
├── docker-compose.yml
├── env.example
└── README.md
```

---

## Requisitos previos

- `Node.js` 18+ y `npm`.
- `Docker` y `Docker Compose`.
- Para despliegue: `kubectl` y `helm` 3+; acceso al clúster.

---

## Configuración del entorno

- Copia el archivo de ejemplo y ajusta variables:

```
cp env.example .env
```

- Revisa y completa credenciales de bases de datos, servicios y cualquier variable requerida por cada microservicio.

---

## Desarrollo local

- Usando scripts del proyecto:
  - `./scripts/start-dev.sh` levanta todos los microservicios en modo desarrollo.
  - `./scripts/stop-dev.sh` detiene todos los microservicios.
  - `./scripts/quick-test.sh` corre tests rápidos donde aplique.

- Usando Docker Compose:

```
docker compose up -d
docker compose logs -f
```

---

## Pruebas y calidad

- Pruebas end-to-end y unitarias donde estén definidas:
  - `./scripts/test-all.sh` para ejecutar pruebas en todos los servicios.

- Lint y formato (según configuración existente):
  - `npm run lint` (si está disponible en cada paquete).
  - `npm run format` (si aplica).

---

## Compilación y builds

- Construye todos los servicios:
  - `./scripts/build-all.sh`

- Si prefieres construir manualmente por servicio, usa los `Dockerfile` en cada microservicio:

```
docker build -t <tu-registro>/<servicio>:<tag> ./microservices/<servicio>
```

---

## Despliegue (Kubernetes/Helm)

- Prerrequisitos:
  - `kubectl` conectado a tu clúster.
  - `helm` instalado (v3+).
  - Acceso al registro de contenedores (GCR/AR/DockerHub según tu configuración).

- Despliegue típico con Helm:

```
helm upgrade --install <release> <chart-path> -n <namespace> \
  --set image.tag=<tag> --values values.yaml
```

- Estrategia recomendada: usar `umbrella chart` para gestionar gateway, servicios, ingress y stack de observabilidad en conjunto.

---

## CI/CD

- Pipeline en GitHub Actions (ejemplo típico):
  - Ejecuta tests.
  - Construye imágenes Docker y hace push al registro.
  - Autentica contra el clúster.
  - Ejecuta `helm upgrade` para desplegar cambios sin downtime.

---

## Observabilidad y autoescalado

- Observabilidad:
  - `Prometheus` recolecta métricas del clúster y de los servicios.
  - `Grafana` provee dashboards preconfigurados para rendimiento y salud.

- Autoescalado (HPA):
  - Define políticas basadas en CPU/memoria para escalar `api-gateway` y servicios críticos.

---

## Endpoints de prueba

- Consulta `test-endpoints.md` para ejemplos de rutas del gateway y de los servicios.

---

## Scripts útiles

- `./scripts/start-dev.sh` — iniciar entorno de desarrollo.
- `./scripts/stop-dev.sh` — detener entorno de desarrollo.
- `./scripts/build-all.sh` — construir todos los servicios.
- `./scripts/test-all.sh` — ejecutar pruebas.
- `./scripts/quick-test.sh` — pruebas rápidas.

---

## Troubleshooting

- Variables de entorno: verifica `.env` y las requeridas por cada servicio.
- Logs: usa `docker compose logs -f` o los logs del orquestador.
- Conectividad: confirma acceso a DBs/colas y permisos de red.