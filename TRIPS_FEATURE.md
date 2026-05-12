# Funcionalidad "Mis viajes" - Documentación

## Resumen de cambios

Se ha agregado una nueva funcionalidad completa de "Mis viajes" (o "Vacaciones") a la aplicación whatTheWeather. Los usuarios autenticados ahora pueden crear, ver y eliminar viajes guardando su destino y fechas de viaje.

## Archivos creados y modificados

### Nuevos archivos:

1. **`database/trips.sql`**
   - Crea la tabla `trips` en Supabase
   - Define Row Level Security (RLS) para proteger datos de usuarios
   - Incluye índices para optimizar consultas

2. **`src/pages/api/trips.ts`**
   - Endpoint para gestionar viajes (GET, POST, DELETE)
   - Valida campos, fechas y duración máxima (30 días)
   - Protege datos usando autenticación de Supabase

3. **`src/pages/api/trips/weather.ts`**
   - Endpoint para obtener el pronóstico del clima de un viaje
   - Integración con WeatherAPI
   - Maneja fechas fuera del rango de forecast disponible

4. **`src/components/TripsPanel.astro`**
   - Componente UI para crear, listar y eliminar viajes
   - Muestra el pronóstico del clima para cada viaje
   - Interfaz completamente interactiva sin recargar la página

### Archivos modificados:

1. **`src/components/Hero.astro`**
   - Agregada importación del componente `TripsPanel`
   - Reemplazada sección de favoritos con un dashboard con tabs
   - Agregada función `setupDashboardTabs()` para gestionar navegación entre favoritos y viajes
   - Actualizada función `renderFavorites()` para mostrar/ocultar tabs según autenticación

2. **`src/styles/global.css`**
   - Agregados estilos para dashboard, tabs y secciones
   - Estilos para elementos del panel de viajes
   - Responsive design para dispositivos móviles

## Instrucciones de configuración en Supabase

### Paso 1: Crear la tabla y políticas RLS

Ejecuta el SQL del archivo `database/trips.sql` en el SQL Editor de Supabase:

1. Ve a tu proyecto en Supabase Dashboard
2. Abre **SQL Editor**
3. Crea una nueva consulta
4. Copia y pega todo el contenido de `database/trips.sql`
5. Ejecuta (botón "RUN" o Ctrl+Enter)

El SQL hará:
- Crear la tabla `trips` con estructura validada
- Habilitar Row Level Security
- Crear 4 políticas de seguridad (SELECT, INSERT, UPDATE, DELETE)
- Crear índices para optimizar consultas

### Paso 2: Verificar configuración de autenticación

Asegúrate de que en tu proyecto Supabase:
- **Auth** → **Providers** → **Email** tiene habilitada la opción de registro
- Si deseas deshabilitar la verificación de email (recomendado), desactiva "Confirm email"

## API Endpoints

### `GET /api/trips`
Obtiene todos los viajes del usuario autenticado.

**Respuesta:**
```json
{
  "trips": [
    {
      "id": "uuid",
      "trip_name": "Vacaciones en Bariloche",
      "destination_name": "Bariloche, Argentina",
      "destination_query": "bariloche, argentina",
      "start_date": "2026-07-10",
      "end_date": "2026-07-15",
      "created_at": "2026-05-12T14:15:43.000Z"
    }
  ]
}
```

### `POST /api/trips`
Crea un nuevo viaje.

**Body:**
```json
{
  "tripName": "Vacaciones en Bariloche",
  "destination": "Bariloche, Argentina",
  "startDate": "2026-07-10",
  "endDate": "2026-07-15"
}
```

**Validaciones:**
- Todos los campos son obligatorios
- `startDate` no puede ser posterior a `endDate`
- Duración máxima: 30 días
- Requiere usuario autenticado

**Respuesta:**
```json
{
  "trip": { ... },
  "message": "Viaje guardado correctamente"
}
```

### `DELETE /api/trips`
Elimina un viaje existente.

**Query param:** `id=<trip_id>`

**Respuesta:**
```json
{
  "message": "Viaje eliminado correctamente"
}
```

### `POST /api/trips/weather`
Obtiene el pronóstico del clima para un viaje.

**Body:**
```json
{
  "destination": "Bariloche, Argentina",
  "startDate": "2026-07-10",
  "endDate": "2026-07-15"
}
```

**Respuesta:**
```json
{
  "destination": "Bariloche, Argentina",
  "startDate": "2026-07-10",
  "endDate": "2026-07-15",
  "availableForecast": true,
  "forecastDays": [
    {
      "date": "2026-07-10",
      "maxTempC": 28,
      "minTempC": 18,
      "avgTempC": 23,
      "condition": "Sunny",
      "conditionIcon": "https://...",
      "chanceOfRain": 10,
      "humidity": 65
    }
  ]
}
```

Si el viaje es demasiado lejano:
```json
{
  "availableForecast": false,
  "reason": "El viaje está demasiado lejos. El pronóstico estará disponible cuando falten menos días.",
  "forecastDays": []
}
```

## Flujo de usuario

1. **Sin autenticar:**
   - Ve un mensaje invitándolo a iniciar sesión para guardar viajes

2. **Después de autenticarse:**
   - Se muestra el dashboard con dos pestañas: "Favoritos" y "Mis viajes"
   - Puede crear un viaje rellenando el formulario con:
     - Nombre del viaje
     - Destino
     - Fecha de inicio
     - Fecha de fin
   - Se valida en frontend (campos requeridos, fechas válidas, máx 30 días)

3. **Viaje guardado:**
   - Se muestra en la lista de viajes
   - Se carga automáticamente el pronóstico del clima
   - Puede eliminar el viaje con el botón "Eliminar"

## Limitaciones conocidas

1. **Pronóstico de clima:**
   - Plan gratuito de WeatherAPI: hasta 3 días de forecast
   - Plan premium: hasta 10 días de forecast
   - Para viajes más lejanos, se muestra un mensaje informativo

2. **Duración máxima:**
   - Los viajes están limitados a 30 días para evitar consumo excesivo de API
   - Esto puede ajustarse en `src/pages/api/trips.ts` si es necesario

3. **Variables de entorno:**
   - Requiere `WEATHER_API_KEY` (ya existente)
   - Requiere variables de Supabase: `SUPABASE_URL` y `SUPABASE_ANON_KEY`

## Verificación de funcionalidad

Después de ejecutar el SQL en Supabase, prueba:

1. **Login/Register:** Debe seguir funcionando normalmente
2. **Buscar clima:** El endpoint `/api/weather` debe seguir funcionando
3. **Favoritos:** La pestaña "Favoritos" debe mostrar las ciudades guardadas
4. **Crear viaje:**
   - Rellena el formulario en la pestaña "Mis viajes"
   - Haz clic en "Guardar viaje"
   - Debe aparecer en la lista con el pronóstico del clima
5. **Eliminar viaje:**
   - Haz clic en "Eliminar" en un viaje
   - Debe desaparecer de la lista

## Seguridad

- **Row Level Security (RLS):** Cada usuario solo puede ver/modificar sus propios viajes
- **Validación en servidor:** Todos los campos se validan en el backend
- **User ID protegido:** El `user_id` se obtiene de la sesión autenticada, no del cliente
- **Tokens de sesión:** Se usan cookies seguras (httpOnly) para mantener la autenticación

## Mantenimiento

Si necesitas:

- **Cambiar duración máxima de viajes:** Edita `DURATION_DAYS_LIMIT` en `src/pages/api/trips.ts`
- **Cambiar rango de forecast:** Edita `maxForecastDays` en `src/pages/api/trips/weather.ts`
- **Agregar campos a viajes:** Actualiza el SQL, el tipo de datos y los endpoints

## Próximas mejoras (opcionales)

- Editar viajes existentes (endpoint PUT)
- Fotos o galería de viajes
- Compartir viajes con otros usuarios
- Notificaciones cuando falten días para el viaje
- Historial de viajes pasados
