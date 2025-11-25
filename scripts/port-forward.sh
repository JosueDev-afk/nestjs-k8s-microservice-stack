#!/bin/bash

set -euo pipefail

CLUSTER_NAME=${CLUSTER_NAME:-nestjs-ms}
K8S_NAMESPACE=${K8S_NAMESPACE:-nestjs-ms}
HELM_RELEASE=${HELM_RELEASE:-nestjs-dev}

PORT_FORWARDS=(
  "${HELM_RELEASE}-nestjs-microservices-api-gateway 3000:3000"
  "${HELM_RELEASE}-nestjs-microservices-prometheus 9090:9090"
  "${HELM_RELEASE}-nestjs-microservices-grafana 8080:3000"
)

info() { echo -e "[port-forward] $1"; }

die() { echo "Error: $1" >&2; exit 1; }

command -v kubectl >/dev/null 2>&1 || die "kubectl no está instalado"

if ! kubectl get namespace "$K8S_NAMESPACE" >/dev/null 2>&1; then
  die "El namespace $K8S_NAMESPACE no existe"
fi

pids=()

cleanup() {
  info "Deteniendo port-forwards..."
  for pid in "${pids[@]:-}"; do
    if kill -0 "$pid" >/dev/null 2>&1; then
      kill "$pid" >/dev/null 2>&1 || true
    fi
  done
}

trap cleanup EXIT

for entry in "${PORT_FORWARDS[@]}"; do
  set -- $entry
  svc=$1
  mapping=$2
  info "Iniciando port-forward de svc/$svc ($mapping)"
  kubectl port-forward "svc/$svc" "$mapping" -n "$K8S_NAMESPACE" >/dev/null 2>&1 &
  pid=$!
  pids+=("$pid")
  sleep 1
  if ! kill -0 "$pid" >/dev/null 2>&1; then
    die "No se pudo iniciar port-forward para $svc"
  fi
  info "Port-forward activo en $mapping (PID $pid)"
done

info "Todos los port-forwards están activos. Presiona Ctrl+C para detenerlos."
wait
