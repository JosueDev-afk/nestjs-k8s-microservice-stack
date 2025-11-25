#!/bin/bash

set -euo pipefail

# Script para levantar el entorno completo en Kind + Helm
# Construye imágenes Docker locales, las carga al clúster Kind y despliega el chart Helm.

CLUSTER_NAME=${CLUSTER_NAME:-nestjs-ms}
K8S_NAMESPACE=${K8S_NAMESPACE:-nestjs-ms}
HELM_RELEASE=${HELM_RELEASE:-nestjs-dev}
HELM_VALUES=${HELM_VALUES:-helm/values.dev.yaml}
IMAGE_TAG=${IMAGE_TAG:-dev}

SERVICES=(
  api-gateway
  user-service
  product-service
  notification-service
)

ROOT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    error "El comando '$1' es requerido pero no está disponible en el PATH"
    exit 1
  fi
}

info "Validando dependencias..."
for cmd in docker kind kubectl helm; do
  require_cmd "$cmd"
done

if ! docker info >/dev/null 2>&1; then
  error "Docker no está corriendo. Inicia Docker Desktop o el daemon antes de continuar."
  exit 1
fi

info "Construyendo imágenes Docker locales (tag: ${IMAGE_TAG})..."
for service in "${SERVICES[@]}"; do
  SERVICE_PATH="${ROOT_DIR}/microservices/${service}"
  if [[ ! -d "$SERVICE_PATH" ]]; then
    error "Directorio no encontrado: $SERVICE_PATH"
    exit 1
  fi

  info "Construyendo ${service}:${IMAGE_TAG}"
  docker build -t "${service}:${IMAGE_TAG}" "$SERVICE_PATH"
  success "Imagen ${service}:${IMAGE_TAG} construida"
  echo
done

if ! kind get clusters 2>/dev/null | grep -Fxq "$CLUSTER_NAME"; then
  info "Creando clúster Kind '${CLUSTER_NAME}'..."
  kind create cluster --name "$CLUSTER_NAME"
else
  success "Clúster Kind '${CLUSTER_NAME}' ya existe"
fi

info "Cargando imágenes en Kind..."
for image in "${SERVICES[@]}"; do
  kind load docker-image "${image}:${IMAGE_TAG}" --name "$CLUSTER_NAME"
  success "Imagen ${image}:${IMAGE_TAG} disponible en Kind"
done

if ! kubectl get namespace "$K8S_NAMESPACE" >/dev/null 2>&1; then
  info "Creando namespace '${K8S_NAMESPACE}'..."
  kubectl create namespace "$K8S_NAMESPACE"
else
  success "Namespace '${K8S_NAMESPACE}' ya existe"
fi

info "Desplegando Helm release '${HELM_RELEASE}' con valores ${HELM_VALUES}..."
helm upgrade --install "$HELM_RELEASE" "${ROOT_DIR}/helm" \
  --namespace "$K8S_NAMESPACE" \
  -f "${ROOT_DIR}/${HELM_VALUES}"

success "Despliegue completado"

info "Estado de los pods en ${K8S_NAMESPACE}:"
kubectl get pods -n "$K8S_NAMESPACE"

cat <<EOF

${GREEN}Entorno listo${NC}
- Clúster Kind: ${CLUSTER_NAME}
- Namespace: ${K8S_NAMESPACE}
- Release Helm: ${HELM_RELEASE}

Siguiente paso sugerido:
  kubectl port-forward svc/${HELM_RELEASE}-nestjs-microservices-api-gateway 3000:3000 -n ${K8S_NAMESPACE}

EOF
