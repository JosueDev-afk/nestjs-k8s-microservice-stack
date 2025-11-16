# 🧪 Guía de Pruebas con cURL - Sistema de Microservicios
#
> ⭐ Si te resulta útil este proyecto, ¡ponle una estrellita al repositorio en GitHub!
## 📋 Índice
- [Verificación de Servicios](#verificación-de-servicios)
- [Autenticación](#autenticación)
- [Gestión de Usuarios](#gestión-de-usuarios)
- [Gestión de Productos](#gestión-de-productos)
- [Categorías](#categorías)
- [Notificaciones](#notificaciones)
- [Pruebas de Estado y Salud](#pruebas-de-estado-y-salud)
- [Pruebas de Base de Datos](#pruebas-de-base-de-datos)


## 🔍 Verificación de Servicios


### Verificar que todos los servicios estén ejecutándose
```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs --tail 20

# Ver logs de un servicio específico
docker-compose logs -f api-gateway
docker-compose logs -f user-service
docker-compose logs -f product-service
docker-compose logs -f notification-service
```

### Probar conectividad básica
```bash
# API Gateway - Información general
curl -s http://localhost:3000/api/v1 | jq

# User Service - Información del servicio
curl -s http://localhost:3001 | jq

# Product Service - Información del servicio
curl -s http://localhost:3002 | jq

# Notification Service - Información del servicio
curl -s http://localhost:3003 | jq
```

### Endpoints de salud
```bash
# API Gateway - Health check  -----
curl -s http://localhost:3000/api/v1/health | jq

# User Service - Health check
curl -s http://localhost:3001/health | jq

# Product Service - Health check
curl -s http://localhost:3002/health | jq

# Notification Service - Health check
curl -s http://localhost:3003/health | jq
```

---

## 🔐 Autenticación

### 1. Registrar un nuevo usuario
```bash
# Registro básico
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "123456",
    "name": "Administrador",
    "lastName": "Sistema",
    "roles": ["admin"]
  }' | jq

# Registro de usuario normal
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "123456",
    "name": "Usuario",
    "lastName": "Test"
  }' | jq
```

### 2. Iniciar sesión
```bash
# Login y obtener token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "123456"
  }' | jq

# Guardar token en variable (reemplazar TOKEN con el token real)
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 3. Obtener perfil del usuario autenticado
```bash
curl -X GET http://localhost:3000/api/v1/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 4. Renovar token
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 👤 Gestión de Usuarios

### 1. Listar usuarios
```bash
# Listar todos los usuarios
curl -X GET http://localhost:3000/api/v1/users | jq

# Listar con paginación
curl -X GET "http://localhost:3000/api/v1/users?page=1&limit=5" | jq

# Buscar usuarios
curl -X GET "http://localhost:3000/api/v1/users?search=admin" | jq
```

### 2. Obtener usuario específico
```bash
# Reemplazar USER_ID con un ID real
curl -X GET http://localhost:3000/api/v1/users/USER_ID | jq
```

### 3. Actualizar usuario (requiere autenticación)
```bash
curl -X PUT http://localhost:3000/api/v1/users/1ea861e6-3288-4a9a-927e-0e5bb54ec51e \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Nombre Actualizado",
    "phone": "+1234567890"
  }' | jq
```

### 4. Eliminar usuario (requiere autenticación)
```bash
curl -X DELETE http://localhost:3000/api/v1/users/USER_ID \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 5. Buscar usuario por email
```bash
curl -X GET http://localhost:3000/api/v1/users/email/admin@example.com | jq
```

---

## 📦 Gestión de Productos

### 1. Crear categoría primero
```bash
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electrónicos",
    "description": "Productos electrónicos y gadgets",
    "slug": "electronicos"
  }' | jq

# Guardar CATEGORY_ID para usar en productos
export CATEGORY_ID="CATEGORY_ID_AQUI"
```

### 2. Crear productos
```bash
# Producto básico
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "iPhone 15 Pro",
    "description": "El último iPhone con tecnología avanzada",
    "sku": "IPHONE15PRO",
    "price": 999.99,
    "stock": 50,
    "categoryId": "'$CATEGORY_ID'",
    "tags": ["smartphone", "apple", "premium"],
    "isFeatured": true
  }' | jq

# Producto con más detalles
curl -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Air M2",
    "description": "Laptop ultradelgada con chip M2",
    "sku": "MACBOOK-AIR-M2",
    "price": 1299.99,
    "comparePrice": 1399.99,
    "stock": 25,
    "categoryId": "'$CATEGORY_ID'",
    "tags": ["laptop", "apple", "m2"],
    "specifications": {
      "processor": "Apple M2",
      "ram": "8GB",
      "storage": "256GB SSD",
      "screen": "13.6 pulgadas"
    },
    "isFeatured": true
  }' | jq
```

### 3. Listar productos
```bash
# Todos los productos
curl -X GET http://localhost:3000/api/v1/products | jq

# Con filtros y paginación
curl -X GET "http://localhost:3000/api/v1/products?page=1&limit=10&featured=true" | jq

# Buscar productos
curl -X GET "http://localhost:3000/api/v1/products?search=iPhone" | jq

# Filtrar por precio
curl -X GET "http://localhost:3000/api/v1/products?minPrice=500&maxPrice=1500" | jq

# Ordenar productos
curl -X GET "http://localhost:3000/api/v1/products?sortBy=price&sortOrder=desc" | jq
```

### 4. Obtener producto específico
```bash
# Por ID
curl -X GET http://localhost:3000/api/v1/products/PRODUCT_ID | jq

# Por SKU
curl -X GET http://localhost:3000/api/v1/products/sku/IPHONE15PRO | jq
```

### 5. Productos destacados y populares
```bash
# Productos destacados
curl -X GET "http://localhost:3000/api/v1/products/featured/list?limit=5" | jq

# Productos populares
curl -X GET "http://localhost:3000/api/v1/products/popular/list?limit=5" | jq
```

### 6. Actualizar producto
```bash
curl -X PUT http://localhost:3000/api/v1/products/PRODUCT_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 899.99,
    "stock": 75
  }' | jq
```

### 7. Agregar reseña a producto
```bash
curl -X POST http://localhost:3000/api/v1/products/PRODUCT_ID/reviews \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "userName": "Usuario Test",
    "rating": 5,
    "comment": "Excelente producto, muy recomendado!"
  }' | jq
```

### 8. Actualizar stock
```bash
curl -X PATCH http://localhost:3000/api/v1/products/PRODUCT_ID/stock \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity": 100}' | jq
```

### 9. Incrementar vistas
```bash
curl -X PATCH http://localhost:3000/api/v1/products/PRODUCT_ID/view \
  -H "Content-Type: application/json" | jq
```

---

## 📂 Categorías

### 1. Listar categorías
```bash
# Todas las categorías
curl -X GET http://localhost:3000/api/v1/categories | jq

# Con filtros
curl -X GET "http://localhost:3000/api/v1/categories?active=true&search=electr" | jq
```

### 2. Obtener categoría específica
```bash
# Por ID
curl -X GET http://localhost:3000/api/v1/categories/CATEGORY_ID | jq

# Por slug
curl -X GET http://localhost:3000/api/v1/categories/slug/electronicos | jq
```

### 3. Crear más categorías
```bash
# Categoría de ropa
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ropa y Moda",
    "description": "Ropa, zapatos y accesorios de moda",
    "slug": "ropa-moda",
    "metadata": {
      "seasonalCategory": true,
      "targetAudience": "all"
    }
  }' | jq

# Categoría de hogar
curl -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hogar y Jardín",
    "description": "Productos para el hogar y jardín",
    "slug": "hogar-jardin"
  }' | jq
```

### 4. Productos por categoría
```bash
curl -X GET "http://localhost:3000/api/v1/products/category/CATEGORY_ID?page=1&limit=5" | jq
```

---

## 🔔 Notificaciones

### 1. Enviar notificación a usuario específico
```bash
curl -X POST http://localhost:3000/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "title": "Bienvenido al sistema",
    "message": "Tu cuenta ha sido creada exitosamente",
    "type": "success",
    "data": {
      "action": "welcome",
      "timestamp": "'$(date -Iseconds)'"
    }
  }' | jq
```

### 2. Enviar notificación a múltiples usuarios
```bash
curl -X POST http://localhost:3000/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["USER_ID_1", "USER_ID_2"],
    "title": "Oferta especial",
    "message": "50% de descuento en productos seleccionados",
    "type": "info",
    "data": {
      "discount": 50,
      "validUntil": "2024-12-31"
    }
  }' | jq
```

### 3. Enviar notificación broadcast (a todos)
```bash
curl -X POST http://localhost:3000/api/v1/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "broadcast": true,
    "title": "Mantenimiento programado",
    "message": "El sistema estará en mantenimiento el domingo de 2-4 AM",
    "type": "warning",
    "data": {
      "maintenanceDate": "2024-12-29",
      "duration": "2 hours"
    }
  }' | jq
```

### 4. Obtener notificaciones de un usuario
```bash
curl -X GET "http://localhost:3000/api/v1/notifications?userId=USER_ID&offset=0&limit=10" | jq
```

### 5. Marcar notificación como leída
```bash
curl -X POST http://localhost:3000/api/v1/notifications/NOTIFICATION_ID/read \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID"}' | jq
```

### 6. Obtener contador de notificaciones no leídas
```bash
curl -X GET "http://localhost:3000/api/v1/notifications/unread-count?userId=USER_ID" | jq
```

### 7. Estadísticas del servicio de notificaciones
```bash
curl -X GET http://localhost:3000/api/v1/notifications/stats | jq
```

### 8. Usuarios conectados vía WebSocket
```bash
curl -X GET http://localhost:3000/api/v1/notifications/connected-users | jq
```

---

## 🏥 Pruebas de Estado y Salud

### Verificar conectividad de servicios
```bash
# Ping a todos los servicios
echo "=== API Gateway ===" && curl -s http://localhost:3000/api/v1/health | jq .status
echo "=== User Service ===" && curl -s http://localhost:3001/health | jq .status  
echo "=== Product Service ===" && curl -s http://localhost:3002/health | jq .status
echo "=== Notification Service ===" && curl -s http://localhost:3003/health | jq .status
```

### Verificar bases de datos
```bash
# PostgreSQL - Conexión directa
docker exec -it microservices-postgres psql -U postgres -d userdb -c "SELECT version();"

# MongoDB - Conexión directa  
docker exec -it microservices-mongo mongosh -u mongo -p mongo123 --eval "db.runCommand({ping: 1})"

# Redis - Conexión directa
docker exec -it microservices-redis redis-cli -a redis123 ping
```

---

## 🗄️ Pruebas de Base de Datos

### PostgreSQL (User Service)
```bash
# Ver usuarios en la base de datos
docker exec -it microservices-postgres psql -U postgres -d userdb -c "SELECT id, email, name, \"isActive\", \"createdAt\" FROM users;"

# Ver estructura de tabla users
docker exec -it microservices-postgres psql -U postgres -d userdb -c "\\d users"

# Contar usuarios
docker exec -it microservices-postgres psql -U postgres -d userdb -c "SELECT COUNT(*) FROM users;"
```

### MongoDB (Product Service)
```bash
# Ver productos
docker exec -it microservices-mongo mongosh -u mongo -p mongo123 productdb --eval "db.products.find().pretty()"

# Ver categorías
docker exec -it microservices-mongo mongosh -u mongo -p mongo123 productdb --eval "db.categories.find().pretty()"

# Contar documentos
docker exec -it microservices-mongo mongosh -u mongo -p mongo123 productdb --eval "db.products.countDocuments()"
docker exec -it microservices-mongo mongosh -u mongo -p mongo123 productdb --eval "db.categories.countDocuments()"
```

### Redis (Notification Service)
```bash
# Ver todas las keys
docker exec -it microservices-redis redis-cli -a redis123 KEYS "*"

# Ver notificaciones de un usuario (reemplazar USER_ID)
docker exec -it microservices-redis redis-cli -a redis123 LRANGE "notifications:USER_ID" 0 -1

# Ver usuarios conectados
docker exec -it microservices-redis redis-cli -a redis123 HGETALL "connected_users"

# Estadísticas de Redis
docker exec -it microservices-redis redis-cli -a redis123 INFO stats
```

---

## 🚀 Scripts de Prueba Automatizados

### Script completo de pruebas
```bash
#!/bin/bash
# test-all.sh - Ejecutar todas las pruebas básicas

echo "🧪 Iniciando pruebas del sistema de microservicios..."

# 1. Verificar servicios
echo "📊 Verificando servicios..."
curl -s http://localhost:3000/api/v1/health > /dev/null && echo "✅ API Gateway OK" || echo "❌ API Gateway FAIL"
curl -s http://localhost:3001/health > /dev/null && echo "✅ User Service OK" || echo "❌ User Service FAIL"
curl -s http://localhost:3002/health > /dev/null && echo "✅ Product Service OK" || echo "❌ Product Service FAIL"
curl -s http://localhost:3003/health > /dev/null && echo "✅ Notification Service OK" || echo "❌ Notification Service FAIL"

# 2. Registrar usuario de prueba
echo "👤 Registrando usuario de prueba..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "name": "Usuario Test"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.access_token')
echo "🔑 Token obtenido: ${TOKEN:0:20}..."

# 3. Crear categoría
echo "📂 Creando categoría..."
CATEGORY_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pruebas",
    "description": "Categoría de prueba",
    "slug": "pruebas"
  }')

CATEGORY_ID=$(echo $CATEGORY_RESPONSE | jq -r '._id')
echo "📂 Categoría creada: $CATEGORY_ID"

# 4. Crear producto
echo "📦 Creando producto..."
PRODUCT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Producto Test",
    "description": "Producto de prueba",
    "sku": "TEST-001",
    "price": 99.99,
    "stock": 10,
    "categoryId": "'$CATEGORY_ID'"
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '._id')
echo "📦 Producto creado: $PRODUCT_ID"

echo "🎉 Pruebas completadas exitosamente!"
```

---

## 📝 Notas Importantes

### Variables de entorno útiles
```bash
# Configurar variables para pruebas
export API_BASE="http://localhost:3000/api/v1"
export USER_SERVICE="http://localhost:3001"
export PRODUCT_SERVICE="http://localhost:3002"
export NOTIFICATION_SERVICE="http://localhost:3003"
```

### Puertos de servicios
- **API Gateway**: 3000
- **User Service**: 3001  
- **Product Service**: 3002
- **Notification Service**: 3003
- **PostgreSQL**: 5432
- **MongoDB**: 28017 (externo, 27017 interno)
- **Redis**: 6379

### Credenciales por defecto
- **PostgreSQL**: `postgres:postgres123`
- **MongoDB**: `mongo:mongo123`
- **Redis**: password `redis123`

### Herramientas recomendadas
- **jq**: Para formatear respuestas JSON
- **Postman**: Para pruebas más avanzadas
- **curl**: Para pruebas rápidas desde terminal
