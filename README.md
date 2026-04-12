# 🌦️ SkyCast — Dashboard de Clima

## 🔗 Deploy

La aplicación se encuentra desplegada en:

👉 https://what-the-weather.vercel.app/

---

## 📌 Datos del trabajo

* **Autor:** Emiliano Tejada
* **Curso:** 5A
* **Temática:** Dashboard de clima

---

## 🧠 Descripción del proyecto

SkyCast es una aplicación web desarrollada con Astro que permite consultar el clima actual y el pronóstico de una ciudad ingresada por el usuario.

El flujo de funcionamiento es el siguiente:

1. El usuario ingresa una ciudad.
2. La app envía una solicitud a un endpoint interno (`/api/weather`) ubicado en "/src/pages/api/weather.ts".
3. Este endpoint consulta una API externa de clima: https://www.weatherapi.com/.
4. Se procesan los datos y se devuelven al frontend.
5. La interfaz se actualiza dinámicamente.


---

## ⚙️ Herramientas y tecnologías utilizadas

* **Astro** → framework principal
* **JavaScript (vanilla)** → lógica y fetch a API
* **HTML semántico**
* **CSS moderno** → diseño, responsive y dark mode
* **WeatherAPI** → fuente de datos del clima
* **Vercel** → deploy de la aplicación

---

## Consignas cumplidas

### Estructura de página con múltiples secciones

* Secciones implementadas:

  * Inicio (hero con búsqueda)
  * Clima actual
  * Detalles
  * Pronóstico

---

### Uso de JavaScript

* Implementado en:

  * `Hero.astro`
* Funcionalidades:

  * búsqueda dinámica
  * consumo de API
  * actualización del DOM
  * manejo de errores

---

### Consumo de API (fetch)

* Endpoint interno:

  * `src/pages/api/weather.ts`
* La app utiliza fetch para consultar datos meteorológicos en tiempo real.

---

### Componentes reutilizables

* Ubicación: `src/components/`
* Componentes principales:

  * `MetricCard`
  * `DetailMeter`
  * `Header`
  * `Hero`
  * `SectionTitle`

---

### Diseño responsive

* Adaptación a dispositivos móviles mediante media queries.
* Layout flexible con grids y flexbox.

---

### Tema claro y oscuro (extra)

* Implementado con variables CSS.
* Persistencia usando `localStorage`.

📍 **Ubicación en la página:**

* Botón en la **parte superior derecha (header)**.
* Permite alternar entre modo claro y oscuro.

---

### Visualización tipo dashboard (extra)

* Elementos visuales incluidos:

  * barras de humedad y sensación térmica
  * tarjetas de métricas
  * resumen automático del clima
  * pronóstico con datos adicionales

---

### Endpoint backend en Astro (extra)

* Archivo: `src/pages/api/weather.ts`
* Permite ocultar la API key y manejar errores del lado del servidor.

---

## Estructura del proyecto

```text
src/
  components/
  layouts/
  pages/
    api/
  styles/
public/
.env.local
astro.config.mjs
```

---

## 🚀 Cómo ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/emitejadaa/whatTheWeather.git
```

### 2. Entrar en la carpeta

```bash
cd nombre-del-proyecto
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Crear archivo de variables de entorno

Crear un archivo `.env.local` en la raíz del proyecto:

```env
WEATHER_API_KEY=tu_api_key
```

> La API key se obtiene desde WeatherAPI.

---

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

---

### 6. Abrir en el navegador

```
http://localhost:4321
```

---
