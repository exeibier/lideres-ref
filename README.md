# MotoParts - Ecommerce de Repuestos y Accesorios para Motocicletas

Ecommerce desarrollado con Next.js, Supabase y UploadThing para la venta de repuestos y accesorios de motocicletas.

## Características

- ✅ Autenticación completa con Supabase (login, signup, password reset)
- ✅ Catálogo de productos con búsqueda y filtros avanzados
- ✅ Carrito de compras persistente
- ✅ Proceso de checkout sin pagos online
- ✅ Gestión de pedidos (usuario y admin)
- ✅ Perfil de usuario con direcciones de envío
- ✅ Panel de administración
- ✅ Carga masiva de productos desde Excel (con integración n8n)
- ✅ Integración con UploadThing para imágenes
- ✅ Row Level Security (RLS) en Supabase

## Tecnologías

- **Next.js 16** - Framework React
- **TypeScript** - Tipado estático
- **Supabase** - Backend, base de datos y autenticación
- **UploadThing** - Almacenamiento de imágenes
- **Tailwind CSS** - Estilos
- **n8n** - Automatización (webhooks para pedidos y carga masiva)

## Configuración

### 1. Variables de Entorno

Crea un archivo `.env.local` basado en `.env.local.example`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# UploadThing Configuration (SDK v7)
UPLOADTHING_TOKEN=your_uploadthing_token

# n8n Webhooks (opcional, para cuando se configure n8n)
N8N_WEBHOOK_ORDER_CREATION=your_n8n_order_webhook_url
N8N_WEBHOOK_BULK_UPLOAD=your_n8n_bulk_upload_webhook_url

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta las migraciones SQL en el orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
3. Configura la autenticación en Supabase Dashboard:
   - Ve a Authentication > Providers
   - Habilita Email provider
   - Configura las URLs de redirección

### 3. Configurar UploadThing

1. Crea una cuenta en [UploadThing](https://uploadthing.com)
2. Crea una nueva app
3. Obtén el token (`UPLOADTHING_TOKEN`) desde el dashboard
4. Configura los dominios permitidos en el dashboard

### 4. Instalar Dependencias

```bash
npm install
```

### 5. Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
src/
├── app/                    # Rutas de Next.js App Router
│   ├── auth/              # Páginas de autenticación
│   ├── products/          # Catálogo de productos
│   ├── cart/              # Carrito de compras
│   ├── checkout/          # Proceso de checkout
│   ├── orders/            # Gestión de pedidos
│   ├── profile/           # Perfil de usuario
│   ├── admin/             # Panel de administración
│   └── api/                # API routes
├── components/            # Componentes React
│   ├── auth/             # Componentes de autenticación
│   ├── cart/             # Componentes del carrito
│   ├── checkout/         # Componentes de checkout
│   ├── products/         # Componentes de productos
│   ├── profile/          # Componentes de perfil
│   ├── admin/            # Componentes de admin
│   └── layout/           # Layout components
├── lib/                   # Utilidades y configuraciones
│   ├── supabase/         # Clientes de Supabase
│   └── types/            # Tipos TypeScript
└── supabase/
    └── migrations/       # Migraciones SQL
```

## Funcionalidades Principales

### Autenticación
- Login y registro de usuarios
- Recuperación de contraseña
- Sesiones persistentes
- Rutas protegidas

### Productos
- Listado con paginación
- Búsqueda por nombre, SKU, número de parte
- Filtros por categoría, marca, precio, compatibilidad
- Página de detalle de producto
- Imágenes con UploadThing

### Carrito de Compras
- Agregar/eliminar productos
- Actualizar cantidades
- Persistencia en base de datos

### Checkout
- Formulario de dirección de envío
- Resumen del pedido
- Creación de pedido
- Trigger de webhook n8n (cuando esté configurado)

### Panel de Administración
- Dashboard con estadísticas
- Carga masiva de productos desde Excel
- Gestión de pedidos
- Actualización de estados de pedidos

### Carga Masiva de Productos
- Subida de archivos Excel
- Procesamiento mediante n8n (normalización de datos)
- Inserción masiva en base de datos
- Manejo de errores

## Integración con n8n

### Webhook de Creación de Pedidos

Cuando se crea un pedido, se envía un POST al webhook configurado en `N8N_WEBHOOK_ORDER_CREATION` con:

```json
{
  "orderId": "uuid",
  "orderNumber": "ORD-...",
  "userId": "uuid",
  "total": 1000.00,
  "status": "pending",
  "shippingAddress": {...},
  "orderItems": [...]
}
```

### Webhook de Carga Masiva

Cuando se sube un Excel, se envía un POST al webhook configurado en `N8N_WEBHOOK_BULK_UPLOAD` con:

```json
{
  "file": "base64_encoded_file",
  "filename": "products.xlsx",
  "fileType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "uploadedBy": "user_id"
}
```

n8n debe responder con:

```json
{
  "products": [
    {
      "name": "Product Name",
      "description": "...",
      "price": 100.00,
      "sku": "SKU123",
      ...
    }
  ],
  "errors": []
}
```

## Base de Datos

### Tablas Principales

- `user_profiles` - Perfiles de usuario
- `categories` - Categorías de productos
- `products` - Productos
- `cart` - Carrito de compras
- `shipping_addresses` - Direcciones de envío
- `orders` - Pedidos
- `order_items` - Items de pedidos
- `reviews` - Reseñas (opcional)
- `inventory` - Inventario (pendiente)

## Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Políticas de acceso basadas en roles (admin/customer)
- Validación de autenticación en rutas protegidas
- Sanitización de inputs

## Próximos Pasos

- [ ] Configurar n8n y webhooks
- [ ] Implementar gestión de inventario
- [ ] Agregar sistema de reseñas
- [ ] Optimizar imágenes
- [ ] Tests automatizados
- [ ] Deploy a producción

## Licencia

Este proyecto es privado y propietario.
