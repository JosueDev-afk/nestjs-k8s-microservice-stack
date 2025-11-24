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

### Perfiles de valores disponibles

- `helm/values.dev.yaml`
  - Pensado para clusters locales (kind/minikube).
  - Cada pod de microservicio incluye su base de datos como contenedor sidecar (`localDb.enabled=true`).
  - No despliega los StatefulSets de Postgres/Mongo/Redis dedicados.
  - Las imágenes usan tags `*:dev`; deben existir en el runtime local o cargarse con `kind load docker-image ...` / `minikube image load ...`.

- `helm/values.prod.yaml`
  - Orientado a EKS (AWS) u otro entorno gestionado.
  - Supone imágenes hospedadas en un registro como ECR (`<aws_account_id>.dkr.ecr.<region>.amazonaws.com/...`).
  - Desactiva los sidecars locales y espera endpoints externos para Postgres/Mongo/Redis.
  - Activa Ingress (clase `nginx`) y soporta TLS.

### Flujo recomendado (local con minikube/kind)

#### Opción rápida (Kind + Helm en un comando)

```bash
chmod +x scripts/setup-kind.sh
./scripts/setup-kind.sh
```

Variables opcionales (puedes exportarlas antes de ejecutar el script):

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `CLUSTER_NAME` | Nombre del clúster Kind | `nestjs-ms` |
| `K8S_NAMESPACE` | Namespace destino | `nestjs-ms` |
| `HELM_RELEASE` | Nombre del release Helm | `nestjs-dev` |
| `HELM_VALUES` | Archivo de valores | `helm/values.dev.yaml` |
| `IMAGE_TAG` | Tag de las imágenes locales | `dev` |

El script construye todas las imágenes Docker, crea el clúster Kind (si no existe), carga las imágenes y ejecuta `helm upgrade --install` con los valores dev.

#### Opción manual

1. **Crear/usar cluster local**
   - kind: `kind create cluster --name nestjs`
   - minikube: `minikube start`

2. **Construir imágenes**
   ```bash
   docker build -t api-gateway:dev ./microservices/api-gateway
   docker build -t user-service:dev ./microservices/user-service
   docker build -t product-service:dev ./microservices/product-service
   docker build -t notification-service:dev ./microservices/notification-service
   ```

3. **Cargar imágenes al cluster local**
   - kind: `kind load docker-image <imagen:tag>`
   - minikube: `minikube image load <imagen:tag>`

4. **Desplegar con Helm (perfil dev)**
   ```bash
   kubectl create namespace nestjs-ms
   helm upgrade --install nestjs-dev ./helm \
     -f helm/values.dev.yaml \
     -n nestjs-ms
   kubectl get pods -n nestjs-ms
   ```

5. **Probar**
   ```bash
   kubectl port-forward svc/nestjs-dev-nestjs-microservices-api-gateway 3000:3000 -n nestjs-ms
   curl http://localhost:3000/health
   ```

### Flujo recomendado (AWS EKS + kubectl/Helm)

1. **Publicar imágenes en Amazon ECR**
   ```bash
   aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
   docker tag api-gateway:prod <aws_account_id>.dkr.ecr.<region>.amazonaws.com/api-gateway:latest
   docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/api-gateway:latest
   # Repetir para user/product/notification
   ```

2. **Crear secret de pull en el cluster EKS**
   ```bash
   kubectl create secret docker-registry ecr-pull-secret \
     --docker-server=<aws_account_id>.dkr.ecr.<region>.amazonaws.com \
     --docker-username=AWS \
     --docker-password=$(aws ecr get-login-password --region <region>) \
     -n prod
   ```

3. **Configurar endpoints externos de DB/Redis**
   - Actualiza `helm/values.prod.yaml` con hosts, puertos y secretos provistos por tus servicios gestionados (Amazon RDS/Aurora, DocumentDB o Atlas, Amazon ElastiCache, etc.).

4. **Desplegar con perfil prod**
   ```bash
   kubectl create namespace prod
   helm upgrade --install nestjs-prod ./helm \
     -f helm/values.prod.yaml \
     -n prod
   kubectl get pods -n prod
   ```

5. **Exposición**
   - El Ingress definido en `values.prod.yaml` expone la API Gateway en `https://api.example.com` (ajusta host y secret TLS).
   - Si usas AWS Load Balancer Controller o API Gateway/CloudFront, adapta la sección `ingress` en consecuencia.

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
  - `Prometheus` y `Grafana` pueden desplegarse con el mismo chart (`monitoring.enabled=true`).
  - En `helm/values.dev.yaml` viene activado por defecto; en `values.prod.yaml` está desactivado para evitar costos innecesarios.
  - Para habilitarlo en otro entorno:
    ```bash
    helm upgrade --install <release> ./helm \
      --set monitoring.enabled=true \
      --set monitoring.prometheus.enabled=true \
      --set monitoring.grafana.enabled=true
    ```
  - Acceso local (Kind/minikube):
    ```bash
    kubectl port-forward svc/<release>-nestjs-microservices-prometheus 9090:9090 -n <namespace>
    kubectl port-forward svc/<release>-nestjs-microservices-grafana 8080:3000 -n <namespace>
    ```
  - Credenciales iniciales de Grafana: `admin / admin123` (configurable vía `monitoring.grafana.adminUser|adminPassword`).

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