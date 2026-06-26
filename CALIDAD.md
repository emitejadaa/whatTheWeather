# CALIDAD.md — Estrategia de calidad: WhatTheWeather

Este documento describe cómo aseguramos la calidad de **WhatTheWeather** y, sobre
todo, **por qué** tomamos cada decisión. No es un archivo de configuración ni un
log generado automáticamente: es la explicación, con nuestras palabras, del
criterio detrás del pipeline, los tests y las herramientas que elegimos.

---

## 1. Estrategia general

Nuestro objetivo no fue "tener tests porque sí", sino construir una red de
seguridad que nos avise **antes que el usuario** cuando algo se rompe. Para eso
montamos un pipeline que valida cada cambio en tres capas y solo despliega si las
tres pasan.

**Por qué separamos tests unitarios de E2E.** Son dos preguntas distintas. Los
**tests unitarios** responden "¿esta función pura hace lo que esperamos con cada
entrada posible?" — son rápidos, deterministas y se concentran en la lógica de
negocio (normalización de ciudades, cálculo de duración de viajes, validación de
contraseña, escapado de HTML). Los **tests E2E** responden una pregunta que
ningún test unitario puede contestar: "¿la app efectivamente carga en un
navegador real, el usuario puede buscar una ciudad y ve el resultado?". Uno
prueba piezas en aislamiento; el otro prueba que esas piezas, el HTML, el
JavaScript del cliente y los endpoints están conectados de verdad. Si tuviéramos
solo unitarios, podríamos tener funciones perfectas y una página rota; si
tuviéramos solo E2E, cada bug de lógica sería lento de diagnosticar.

**Por qué el pipeline bloquea el deploy si algo falla.** La regla es simple: a
producción solo llega código verificado. Cada etapa declara una dependencia
(`needs:`) de la anterior, así que si el lint, los tests unitarios, los E2E o el
build fallan, el job de `deploy` **nunca se ejecuta**. Preferimos un deploy que no
sale a uno que sale roto.

**Qué problema resuelve correr lint antes de los tests.** El lint es la barrera
más barata y rápida: detecta errores de tipos, imports muertos o código
inconsistente en segundos, sin levantar un browser ni instalar dependencias
pesadas. Ponerlo primero significa que un error trivial corta el pipeline de
inmediato, sin gastar minutos de CI instalando Chromium para algo que iba a
fallar igual. Es el principio de "fallar rápido y barato".

---

## 2. Herramientas seleccionadas

Para cada herramienta evaluamos al menos una alternativa antes de decidir.

**Vitest (tests unitarios).** Lo elegimos sobre **Jest** porque el proyecto está
construido sobre Astro/Vite, y Vitest usa el mismo motor de transformación. Eso
significa que entiende ESM y TypeScript de forma nativa, sin la capa extra de
configuración (`babel`, `ts-jest`, `transform`) que Jest necesita en un proyecto
moderno. Como bonus, comparte la API de `describe/it/expect` que ya conocíamos de
Jest, así que la curva de aprendizaje fue nula, y su generador de cobertura
(`@vitest/coverage-v8`) viene integrado.

**Playwright (tests E2E).** Lo elegimos sobre **Cypress** principalmente por su
manejo de **interceptación de red**. Nuestro test del flujo de búsqueda necesita
mockear la respuesta de `/api/weather` para no depender de la API key real ni de
la disponibilidad de WeatherAPI en CI; `page.route()` de Playwright hace eso de
forma directa y confiable. Además Playwright levanta y administra el servidor de
desarrollo por nosotros (`webServer` en la config), corre headless en CI sin
configuración extra y tiene mejor soporte multi-navegador.

**typescript-eslint (linting).** Acá la alternativa descartada fue usar **ESLint
"pelado", sin el plugin de TypeScript**. La descartamos porque sin entender los
tipos, ESLint no puede detectar problemas como un `any` implícito o un import de
un símbolo que no existe. `typescript-eslint` le da a ESLint el contexto de tipos,
que es justamente donde están los errores más sutiles en un proyecto TS.

**GitHub Actions (CI/CD).** Evaluamos **CircleCI** y **GitLab CI** y elegimos
GitHub Actions porque el repositorio ya vive en GitHub: la integración es nativa
(los checks aparecen en el PR sin configurar webhooks ni servicios externos), no
tiene costo para nuestro uso, y los secrets se gestionan en el mismo lugar que el
código.

**Vercel (deploy).** Ya era nuestra plataforma de hosting desde el TP2 por el
adapter oficial `@astrojs/vercel`, así que la decisión fue mantener coherencia:
el deploy del pipeline empuja a la misma infraestructura serverless donde corre el
endpoint `/api/weather`.

---

## 3. Tests desarrollados

### Tests unitarios — `src/lib/__tests__/utils.test.ts` (36 tests)

Extrajimos las funciones puras de la lógica de la app a `src/lib/utils.ts` para
poder testearlas de forma aislada. Cada bloque valida un comportamiento concreto:

| Función | Tests | Qué valida |
|---|---|---|
| `normalizeCity` | 4 | Recorta espacios al inicio/fin, colapsa espacios múltiples en uno, maneja string vacío y deja intacta una ciudad de una sola palabra. |
| `buildCityQuery` | 3 | Que el nombre normalizado se pase a minúsculas para usarlo como clave de búsqueda/comparación de favoritos. |
| `normalizeDestination` | 3 | Mismo criterio de normalización aplicado a destinos de viaje. |
| `buildDestinationQuery` | 2 | Que el destino quede normalizado y en minúsculas, incluso si ya venía limpio. |
| `getSslErrorCode` | 5 | Que extraiga el código de un error SSL anidado en `error.cause.code` y devuelva string vacío de forma segura ante `null`, strings o errores sin `cause`. |
| `getWeatherSymbol` | 7 | Que mapee la condición meteorológica (en inglés y español) al emoji correcto: tormenta, lluvia, nieve, niebla, nublado, parcialmente nublado y despejado. |
| `calculateTripDurationDays` | 4 | Que calcule correctamente la cantidad de días entre dos fechas (3 días, viaje de un solo día = 0, 30 días, una semana). |
| `isValidPassword` | 4 | Que acepte contraseñas de 6+ caracteres y rechace las más cortas y el string vacío. |
| `escapeHtml` | 4 | Que escape `<`, `>`, `&`, comillas simples y dobles para prevenir inyección de HTML/XSS al renderizar datos del usuario. |

El caso más importante en seguridad es `escapeHtml`: incluye un test específico
que toma `<script>alert("xss")</script>` y verifica que quede neutralizado como
texto escapado, porque renderizamos nombres de ciudades y viajes que vienen del
usuario.

### Tests E2E — `tests/e2e/main-flow.spec.ts` (3 tests)

Cubren el flujo principal real de la aplicación contra un navegador Chromium:

- **Test 1 — La página principal carga con el formulario visible.** Valida que el
  título de la página sea correcto y que `#city-input` y `#search-button` estén
  visibles. Es el "smoke test": si esto falla, la app no levanta.
- **Test 2 — El usuario busca una ciudad y ve el clima.** Mockea `/api/weather`
  con `page.route()` para devolver datos de Buenos Aires, escribe la ciudad,
  hace clic en buscar y verifica que el resultado (nombre de la ciudad y
  temperatura) aparezca en pantalla. Valida el flujo completo de búsqueda sin
  depender de la API key real.
- **Test 3 — El botón "Acceder" abre el modal de autenticación.** Hace clic en
  `#auth-open-button-hero` y verifica que `#auth-modal` pierda la clase `hidden`
  y que el campo de email sea visible. Valida la puerta de entrada al sistema de
  cuentas.

---

## 4. Casos de uso críticos

Priorizamos proteger los flujos cuya falla tendría mayor impacto en el usuario o
en la integridad de los datos:

1. **Búsqueda de clima.** Es el flujo principal y la razón de ser de la app. Si
   se rompe, no hay producto. Lo cubrimos de punta a punta con el test E2E #2.
2. **Apertura del login/registro.** Sin autenticación no funcionan ni los
   favoritos ni los viajes. El test E2E #3 garantiza que el modal de acceso al
   menos se abre correctamente.
3. **Normalización de ciudades.** Si `normalizeCity`/`buildCityQuery` fallaran,
   "Buenos Aires", "buenos  aires" y " Buenos Aires " se tratarían como ciudades
   distintas, y los favoritos dejarían de matchear. Por eso tiene cobertura
   unitaria exhaustiva.
4. **Cálculo de fechas de viajes.** `calculateTripDurationDays` alimenta la
   lógica de viajes; un cálculo erróneo metería duraciones inválidas (negativas o
   absurdas) a la base de datos. Lo testeamos con varios rangos, incluido el caso
   borde de un viaje de un solo día.

---

## 5. Pipeline de CI/CD

El workflow (`.github/workflows/ci.yml`) se dispara en **cada push y en cada PR a
`main`**, y ejecuta cinco jobs encadenados con `needs:`:

- **lint** — corre `eslint src` sobre todos los `.ts`. Si hay **errores**, el
  pipeline se detiene; los **warnings** (como el `no-explicit-any` puntual de un
  endpoint heredado) no bloquean, para no frenar todo por código preexistente.
- **test** — necesita que `lint` haya pasado. Corre los 36 tests unitarios y
  genera el reporte de cobertura.
- **e2e** — necesita `test`. Instala Chromium y corre los 3 tests de Playwright
  contra un servidor Astro local. Usa mocks y variables de entorno con fallback,
  así que no necesita secrets reales para correr.
- **build** — necesita `e2e`. Compila la app con `astro build` usando las
  variables de entorno reales cargadas desde GitHub Secrets.
- **deploy** — necesita `build`. Despliega a Vercel con `vercel deploy --prod`.

### Decisiones de diseño

- **Por qué el deploy NO corre en PRs.** El job tiene la condición
  `if: github.ref == 'refs/heads/main' && github.event_name == 'push'`. En un PR
  queremos validar (lint, test, e2e, build) pero **no** publicar: un PR es una
  propuesta, no algo aprobado. El deploy a producción solo ocurre cuando el código
  ya se mergeó a `main`.
- **Efecto cascada si falla el lint.** Como cada job declara `needs:` del
  anterior, un fallo de lint deja a `test`, `e2e`, `build` y `deploy` en estado
  *skipped*. Un solo error trivial es suficiente para que nada llegue a
  producción — que es exactamente lo que queremos.
- **Por qué separamos `build` y `deploy` en jobs distintos.** Para tener un punto
  de control explícito: si el `build` compila pero el `deploy` falla (por un token
  vencido, por ejemplo), sabemos con precisión que el problema es de despliegue y
  no de código. Además, `deploy` queda condicionado a `main` mientras que `build`
  corre siempre como verificación.

---

## 6. Limitaciones y deuda técnica

Somos conscientes de lo que quedó afuera y lo asumimos como riesgo controlado:

- **Los E2E no cubren un login real.** Probamos que el modal se abre, pero no un
  ciclo completo de login porque necesitaríamos un usuario de prueba en Supabase y
  manejo de sesiones reales en CI. Es la primera deuda que saldaríamos con más
  tiempo.
- **No hay tests para los endpoints de la API** (`/api/weather`, `/api/trips`,
  `/api/favorites`). Requerirían mockear el cliente de Supabase y la WeatherAPI;
  por ahora la cobertura de esa capa es indirecta (vía el mock del E2E).
- **La cobertura mide solo `src/lib/utils.ts`.** Es deliberado: ahí concentramos
  la lógica de negocio pura y testeable. Los componentes `.astro` y el JavaScript
  del cliente quedan cubiertos por los E2E, no por cobertura de líneas.
- **El job de E2E instala Chromium en cada corrida.** No configuramos caché de
  browsers de Playwright, así que ese paso suma tiempo. Es una optimización
  pendiente, no un bug.

---

## Uso de IA

Usamos un agente de IA como asistente durante el desarrollo del pipeline. Nos
ayudó a:

- Generar los archivos de configuración base (`eslint.config.js`,
  `vitest.config.ts`, `playwright.config.ts`).
- Redactar la primera versión de los 36 tests unitarios y los 3 tests E2E a
  partir de la lógica que ya existía en la app.
- Estructurar el workflow de GitHub Actions con el orden de jobs y las
  dependencias.

Lo que **revisamos y ajustamos nosotros**: verificamos que cada test apuntara a
selectores y comportamientos que existen de verdad en el código (por ejemplo, que
`#auth-open-button-hero` efectivamente quita la clase `hidden` de `#auth-modal`),
ajustamos los umbrales de cobertura a un valor razonable para el alcance del TP, y
validamos a mano que el mock de `/api/weather` devolviera la forma exacta que
`renderWeather` espera. Cada decisión documentada acá la podemos explicar y
defender porque entendimos qué hace cada línea antes de incorporarla.

---

## Cobertura

Salida de `npm run test:coverage`:

```
 ✓ src/lib/__tests__/utils.test.ts (36 tests)

 Test Files  1 passed (1)
      Tests  36 passed (36)

 % Coverage report from v8
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |
 utils.ts |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|-------------------
```

Alcanzamos **100% de cobertura** sobre la lógica de negocio (`src/lib/utils.ts`),
por encima del umbral del 60% que fijamos como mínimo en `vitest.config.ts`.
