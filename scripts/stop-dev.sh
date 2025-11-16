#!/bin/bash

# Script para detener todos los servicios

echo "🛑 Deteniendo microservicios..."

docker-compose down

echo "✅ Todos los servicios han sido detenidos."

# Preguntar si quiere limpiar volúmenes
read -p "¿Deseas eliminar también los volúmenes de datos? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️ Eliminando volúmenes..."
    docker-compose down -v
    echo "✅ Volúmenes eliminados."
fi
