# 🌦️ WhatTheWeather — Dashboard de clima

## 🔗 Deploy

La aplicación está desplegada en:

👉 https://what-the-weather.vercel.app/

---

## 📌 Datos del proyecto

* **Autor:** Emiliano Tejada
* **Curso:** 5A
* **Temática:** Dashboard de clima

---

## 🧠 Descripción del proyecto

WhatTheWeather es una aplicación web desarrollada con Astro que permite consultar el clima actual y un pronóstico corto de cualquier ciudad.

El flujo actual de la app es el siguiente:

1. El usuario escribe una ciudad en el buscador principal.
2. El frontend hace una solicitud `POST` al endpoint interno `/api/weather`.
3. Ese endpoint consulta WeatherAPI desde el servidor.
4. La respuesta vuelve al cliente con los datos ya procesados.
5. La interfaz actualiza el hero, las métricas, el resumen y el pronóstico.

---

## ⚙️ Herramientas y tecnologías utilizadas

* **Astro** → framework principal
* **JavaScript (vanilla)** → lógica del frontend e interacción con la API interna
* **HTML semántico**
* **CSS moderno** → layout responsive, dashboard visual y tema claro/oscuro
* **WeatherAPI** → fuente de datos meteorológicos
* **Vercel** → despliegue serverless

---

## Funcionalidades implementadas

### Búsqueda de clima en tiempo real

* Campo de búsqueda con botón y soporte para tecla `Enter`
* Consulta de ciudad a través de `fetch`
* Manejo de errores y mensajes de estado en pantalla

---

### Dashboard con múltiples secciones

* **Inicio** con buscador y preview rápida
* **Clima actual** con métricas principales
* **Detalles** con indicadores complementarios
* **Pronóstico corto** con vista de próximos días

---

### Componentes reutilizables

* Ubicación: `src/components/`
* Componentes principales:
  * `Header`
  * `Hero`
  * `MetricCard`
  * `DetailMeter`
  * `SectionTitle`

---

### Tema claro y oscuro

* Toggle en el header
* Persistencia mediante `localStorage`
* Aplicación del tema desde el layout para evitar saltos visuales al cargar

---

### Endpoint backend en Astro

* Archivo: `src/pages/api/weather.ts`
* Oculta la API key del proveedor externo
* Valida el body recibido
* Reenvía errores de WeatherAPI con mensajes más claros

---

## Estructura del proyecto

```text
src/
  components/
  layouts/
  pages/
    api/
      weather.ts
    index.astro
  styles/
public/
  skycast-icon.svg
.env
.env.local
astro.config.mjs
package.json
```

---

## 🚀 Cómo ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/emitejadaa/whatTheWeather.git
```

### 2. Entrar en la carpeta

```bash
cd whatTheWeather
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Configurar variables de entorno

Crear `.env.local` en la raíz con:

```env
WEATHER_API_KEY=tu_api_key
```

La key se obtiene desde https://www.weatherapi.com/.

---

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

---

### 6. Abrir en el navegador

```text
http://localhost:4321
```

---

## ☁️ Deploy en Vercel

El proyecto usa el adapter oficial `@astrojs/vercel` con salida `server`, por lo que el endpoint `/api/weather` se despliega como función serverless.

Para que el deploy funcione correctamente:

* configurar `WEATHER_API_KEY` en las Environment Variables de Vercel
* mantener compatibles `astro` y `@astrojs/vercel`
* usar una versión de Node soportada por Vercel

En el estado actual del proyecto se fija `Node 24.x` en `package.json` para evitar resoluciones ambiguas durante el build.
