#!/bin/bash

# 🚀 Pruebas rápidas del sistema de microservicios
# Uso: ./scripts/quick-test.sh

echo "🚀 Pruebas rápidas del sistema..."
echo "================================"

# Verificar servicios
echo "📊 Verificando servicios..."
curl -s http://localhost:3000/api/v1/health > /dev/null && echo "✅ API Gateway" || echo "❌ API Gateway"
curl -s http://localhost:3001/health > /dev/null && echo "✅ User Service" || echo "❌ User Service"
curl -s http://localhost:3002/health > /dev/null && echo "✅ Product Service" || echo "❌ Product Service"
curl -s http://localhost:3003/health > /dev/null && echo "✅ Notification Service" || echo "❌ Notification Service"

echo ""

# Información de servicios
echo "📋 Información de servicios:"
echo "API Gateway:"
curl -s http://localhost:3000/api/v1 | jq -r '.name + " - " + .status'

echo "User Service:"
curl -s http://localhost:3001 | jq -r '.name + " - " + .status'

echo "Product Service:"
curl -s http://localhost:3002 | jq -r '.name + " - " + .status'

echo "Notification Service:"
curl -s http://localhost:3003 | jq -r '.name + " - " + .status'

echo ""

# Estado de contenedores
echo "🐳 Estado de contenedores:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""

# Verificar bases de datos
echo "🗄️ Verificando bases de datos..."

# PostgreSQL
if docker exec microservices-postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL - Conectado"
else
    echo "❌ PostgreSQL - Desconectado"
fi

# MongoDB
if docker exec microservices-mongo mongosh -u mongo -p mongo123 --quiet --eval "db.runCommand({ping: 1})" > /dev/null 2>&1; then
    echo "✅ MongoDB - Conectado"
else
    echo "❌ MongoDB - Desconectado"
fi

# Redis
if docker exec microservices-redis redis-cli -a redis123 ping > /dev/null 2>&1; then
    echo "✅ Redis - Conectado"
else
    echo "❌ Redis - Desconectado"
fi

echo ""
echo "🎉 Pruebas rápidas completadas!"
echo ""
echo "💡 Para pruebas completas ejecuta: ./scripts/test-all.sh"
echo "📖 Para ver todos los comandos: cat test-endpoints.md"
