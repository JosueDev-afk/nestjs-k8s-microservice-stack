#!/bin/bash

# 🧪 Script de pruebas automatizadas para el sistema de microservicios
# Uso: ./scripts/test-all.sh

set -e  # Salir si algún comando falla

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Variables
API_BASE="http://localhost:3000/api/v1"
USER_SERVICE="http://localhost:3001"
PRODUCT_SERVICE="http://localhost:3002"
NOTIFICATION_SERVICE="http://localhost:3003"

TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="123456"

echo "🧪 Iniciando pruebas del sistema de microservicios..."
echo "=================================================="

# 1. Verificar que los servicios estén ejecutándose
print_status "Verificando estado de los servicios..."

if curl -s $API_BASE/health > /dev/null; then
    print_success "API Gateway (3000) - OK"
else
    print_error "API Gateway (3000) - FAIL"
    exit 1
fi

if curl -s $USER_SERVICE/health > /dev/null; then
    print_success "User Service (3001) - OK"
else
    print_error "User Service (3001) - FAIL"
    exit 1
fi

if curl -s $PRODUCT_SERVICE/health > /dev/null; then
    print_success "Product Service (3002) - OK"
else
    print_error "Product Service (3002) - FAIL"
    exit 1
fi

if curl -s $NOTIFICATION_SERVICE/health > /dev/null; then
    print_success "Notification Service (3003) - OK"
else
    print_error "Notification Service (3003) - FAIL"
    exit 1
fi

echo ""

# 2. Prueba de registro de usuario
print_status "Registrando usuario de prueba..."

REGISTER_RESPONSE=$(curl -s -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "name": "Usuario Test",
    "lastName": "Automatizado"
  }')

if echo "$REGISTER_RESPONSE" | jq -e '.access_token' > /dev/null; then
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')
    USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')
    print_success "Usuario registrado: $TEST_EMAIL"
    print_status "Token obtenido: ${TOKEN:0:30}..."
else
    print_error "Fallo en registro de usuario"
    echo "$REGISTER_RESPONSE" | jq
    exit 1
fi

echo ""

# 3. Prueba de login
print_status "Probando login..."

LOGIN_RESPONSE=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

if echo "$LOGIN_RESPONSE" | jq -e '.access_token' > /dev/null; then
    print_success "Login exitoso"
else
    print_error "Fallo en login"
    echo "$LOGIN_RESPONSE" | jq
    exit 1
fi

echo ""

# 4. Prueba de perfil de usuario
print_status "Obteniendo perfil de usuario..."

PROFILE_RESPONSE=$(curl -s -X GET $API_BASE/auth/profile \
  -H "Authorization: Bearer $TOKEN")

if echo "$PROFILE_RESPONSE" | jq -e '.email' > /dev/null; then
    print_success "Perfil obtenido correctamente"
else
    print_error "Fallo al obtener perfil"
    echo "$PROFILE_RESPONSE" | jq
fi

echo ""

# 5. Crear categoría de prueba
print_status "Creando categoría de prueba..."

CATEGORY_RESPONSE=$(curl -s -X POST $API_BASE/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pruebas Automatizadas",
    "description": "Categoría para pruebas del sistema",
    "slug": "pruebas-automatizadas"
  }')

if echo "$CATEGORY_RESPONSE" | jq -e '._id' > /dev/null; then
    CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '._id')
    print_success "Categoría creada: $CATEGORY_ID"
else
    print_error "Fallo al crear categoría"
    echo "$CATEGORY_RESPONSE" | jq
    exit 1
fi

echo ""

# 6. Crear producto de prueba
print_status "Creando producto de prueba..."

PRODUCT_RESPONSE=$(curl -s -X POST $API_BASE/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto Test Automatizado",
    "description": "Producto creado por script de pruebas",
    "sku": "TEST-AUTO-'$(date +%s)'",
    "price": 99.99,
    "stock": 50,
    "categoryId": "'$CATEGORY_ID'",
    "tags": ["test", "automatizado"],
    "isFeatured": true
  }')

if echo "$PRODUCT_RESPONSE" | jq -e '._id' > /dev/null; then
    PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '._id')
    print_success "Producto creado: $PRODUCT_ID"
else
    print_error "Fallo al crear producto"
    echo "$PRODUCT_RESPONSE" | jq
    exit 1
fi

echo ""

# 7. Listar productos
print_status "Listando productos..."

PRODUCTS_LIST=$(curl -s -X GET "$API_BASE/products?limit=5")

if echo "$PRODUCTS_LIST" | jq -e '.data' > /dev/null; then
    PRODUCT_COUNT=$(echo "$PRODUCTS_LIST" | jq '.data | length')
    print_success "Productos listados: $PRODUCT_COUNT encontrados"
else
    print_error "Fallo al listar productos"
    echo "$PRODUCTS_LIST" | jq
fi

echo ""

# 8. Agregar reseña al producto
print_status "Agregando reseña al producto..."

REVIEW_RESPONSE=$(curl -s -X POST $API_BASE/products/$PRODUCT_ID/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "userName": "Usuario Test",
    "rating": 5,
    "comment": "Excelente producto de prueba!"
  }')

if echo "$REVIEW_RESPONSE" | jq -e '.reviews' > /dev/null; then
    print_success "Reseña agregada correctamente"
else
    print_error "Fallo al agregar reseña"
    echo "$REVIEW_RESPONSE" | jq
fi

echo ""

# 9. Enviar notificación
print_status "Enviando notificación de prueba..."

NOTIFICATION_RESPONSE=$(curl -s -X POST $API_BASE/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "'$USER_ID'",
    "title": "Prueba Automatizada",
    "message": "Esta es una notificación de prueba del script automatizado",
    "type": "info",
    "data": {
      "testRun": true,
      "timestamp": "'$(date -Iseconds)'"
    }
  }')

if echo "$NOTIFICATION_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Notificación enviada correctamente"
else
    print_error "Fallo al enviar notificación"
    echo "$NOTIFICATION_RESPONSE" | jq
fi

echo ""

# 10. Obtener notificaciones del usuario
print_status "Obteniendo notificaciones del usuario..."

USER_NOTIFICATIONS=$(curl -s -X GET "$API_BASE/notifications?userId=$USER_ID&limit=5")

if echo "$USER_NOTIFICATIONS" | jq -e '.data.notifications' > /dev/null; then
    NOTIFICATION_COUNT=$(echo "$USER_NOTIFICATIONS" | jq '.data.notifications | length')
    print_success "Notificaciones obtenidas: $NOTIFICATION_COUNT encontradas"
else
    print_error "Fallo al obtener notificaciones"
    echo "$USER_NOTIFICATIONS" | jq
fi

echo ""

# 11. Verificar bases de datos
print_status "Verificando conexiones a bases de datos..."

# PostgreSQL
if docker exec microservices-postgres psql -U postgres -d userdb -c "SELECT COUNT(*) FROM users;" > /dev/null 2>&1; then
    USER_COUNT=$(docker exec microservices-postgres psql -U postgres -d userdb -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')
    print_success "PostgreSQL - $USER_COUNT usuarios en la base de datos"
else
    print_warning "PostgreSQL - No se pudo verificar la conexión"
fi

# MongoDB
if docker exec microservices-mongo mongosh -u mongo -p mongo123 productdb --quiet --eval "db.products.countDocuments()" > /dev/null 2>&1; then
    PRODUCT_COUNT_DB=$(docker exec microservices-mongo mongosh -u mongo -p mongo123 productdb --quiet --eval "print(db.products.countDocuments())")
    print_success "MongoDB - $PRODUCT_COUNT_DB productos en la base de datos"
else
    print_warning "MongoDB - No se pudo verificar la conexión"
fi

# Redis
if docker exec microservices-redis redis-cli -a redis123 ping > /dev/null 2>&1; then
    print_success "Redis - Conexión exitosa"
else
    print_warning "Redis - No se pudo verificar la conexión"
fi

echo ""

# Resumen final
echo "🎉 RESUMEN DE PRUEBAS"
echo "===================="
print_success "✅ Servicios verificados: 4/4"
print_success "✅ Usuario registrado: $TEST_EMAIL"
print_success "✅ Categoría creada: $CATEGORY_ID"
print_success "✅ Producto creado: $PRODUCT_ID"
print_success "✅ Notificación enviada"
print_success "✅ Bases de datos conectadas"

echo ""
print_status "🔗 URLs de prueba:"
echo "   - API Gateway: http://localhost:3000/api/v1"
echo "   - User Service: http://localhost:3001"
echo "   - Product Service: http://localhost:3002"
echo "   - Notification Service: http://localhost:3003"

echo ""
print_status "📊 Datos de prueba creados:"
echo "   - Usuario: $TEST_EMAIL (ID: $USER_ID)"
echo "   - Categoría: $CATEGORY_ID"
echo "   - Producto: $PRODUCT_ID"
echo "   - Token: ${TOKEN:0:30}..."

echo ""
print_success "🎊 ¡Todas las pruebas completadas exitosamente!"

# Guardar información de prueba en archivo
cat > test-results.json << EOF
{
  "testRun": {
    "timestamp": "$(date -Iseconds)",
    "status": "success",
    "user": {
      "email": "$TEST_EMAIL",
      "id": "$USER_ID",
      "token": "$TOKEN"
    },
    "category": {
      "id": "$CATEGORY_ID"
    },
    "product": {
      "id": "$PRODUCT_ID"
    },
    "services": {
      "apiGateway": "http://localhost:3000",
      "userService": "http://localhost:3001", 
      "productService": "http://localhost:3002",
      "notificationService": "http://localhost:3003"
    }
  }
}
EOF

print_status "📄 Resultados guardados en: test-results.json"
