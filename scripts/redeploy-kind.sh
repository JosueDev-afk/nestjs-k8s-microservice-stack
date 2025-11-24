#!/bin/bash

set -euo pipefail

# Script para reconstruir imágenes locales, cargarlas en Kind y redeplegar el chart Helm

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

ROOT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}" )/.." && pwd)

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

info "Verificando dependencias..."
for cmd in docker kind kubectl helm; do
  require_cmd "$cmd"
done

if ! docker info >/dev/null 2>&1; then
  error "Docker no está corriendo. Inicia Docker antes de continuar."
  exit 1
fi

if ! kind get clusters 2>/dev/null | grep -Fxq "$CLUSTER_NAME"; then
  error "El clúster Kind '$CLUSTER_NAME' no existe. Ejecuta primero scripts/setup-kind.sh"
  exit 1
fi

info "Construyendo imágenes Docker (tag: ${IMAGE_TAG})..."
for service in "${SERVICES[@]}"; do
  SERVICE_PATH="${ROOT_DIR}/microservices/${service}"
  if [[ ! -d "$SERVICE_PATH" ]]; then
    error "No se encontró el directorio ${SERVICE_PATH}"
    exit 1
  fi

  info "Construyendo ${service}:${IMAGE_TAG}"
  (cd "$SERVICE_PATH" && npm install >/dev/null 2>&1 || true)
  docker build -t "${service}:${IMAGE_TAG}" "$SERVICE_PATH"
  success "Imagen ${service}:${IMAGE_TAG} lista"
  echo
done

info "Cargando imágenes al clúster Kind '${CLUSTER_NAME}'..."
for image in "${SERVICES[@]}"; do
  kind load docker-image "${image}:${IMAGE_TAG}" --name "$CLUSTER_NAME"
  success "Imagen ${image}:${IMAGE_TAG} cargada en Kind"
  echo
done

info "Limpiando ConfigMaps de Prometheus/Grafana para evitar conflictos..."
PROMETHEUS_CONFIGMAP="${HELM_RELEASE}-nestjs-microservices-prometheus-config"
if kubectl delete configmap "$PROMETHEUS_CONFIGMAP" -n "$K8S_NAMESPACE" >/dev/null 2>&1; then
  info "ConfigMap $PROMETHEUS_CONFIGMAP eliminado"
else
  warn "ConfigMap $PROMETHEUS_CONFIGMAP no existía (continuando)"
fi

GRAFANA_CONFIGMAPS=(
  "${HELM_RELEASE}-nestjs-microservices-grafana-datasources"
  "${HELM_RELEASE}-nestjs-microservices-grafana-dashboards"
  "${HELM_RELEASE}-nestjs-microservices-grafana-dashboard-providers"
)
for cm in "${GRAFANA_CONFIGMAPS[@]}"; do
  if kubectl delete configmap "$cm" -n "$K8S_NAMESPACE" >/dev/null 2>&1; then
    info "ConfigMap $cm eliminado"
  else
    warn "ConfigMap $cm no existía (continuando)"
  fi
done

info "Aplicando Helm upgrade..."
helm upgrade --install "$HELM_RELEASE" "${ROOT_DIR}/helm" \
  --namespace "$K8S_NAMESPACE" \
  -f "${ROOT_DIR}/${HELM_VALUES}"

success "Redeploy completado"

info "Pods actuales en ${K8S_NAMESPACE}:"
kubectl get pods -n "$K8S_NAMESPACE"

cat <<EOF

${GREEN}Listo.${NC} Las nuevas imágenes (${IMAGE_TAG}) están desplegadas.
Si ya tenías port-forward activos no es necesario reiniciarlos a menos que hayan fallado.

EOF
