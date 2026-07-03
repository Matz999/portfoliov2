# Hero Node Animations

Siete sketches de p5.js para los popups del hero — uno por cada interés del grafo.
Cada uno rinde a **640×480**, **6 segundos loop @ 30fps**, con **Bayer 4×4 ordered dithering** para el look pixelado 2-color (rojo brand `#8B1010` + blanco).

## Los sketches

| Archivo | Interés | Concepto |
|---|---|---|
| `01-react.js` | react | Átomo entero rotando: 3 órbitas elípticas con electrones y núcleo pulsante |
| `02-javascript.js` | javascript | Anillos concéntricos rotando a distintas velocidades — event loop async |
| `03-python.js` | python | Doble hélice con profundidad Z simulada — twist mathematical DNA-esque |
| `04-postgres.js` | postgres | Grilla de celdas con ondulación diagonal — index scan |
| `05-figma.js` | figma | Cuatro cubos sólidos con hueco a través — tunnel 3D wireframe |
| `06-design.js` | design | Composición modernista tipo Mondrian que se rebalancea |
| `07-ingenieria.js` | ingeniería | 6 engranajes en malla + 2 correas + sparks + grain noise + camera drift |

## Workflow rápido

**Cada `.js` graba directo desde el browser con MediaRecorder** — sin librerías externas, sin editar el `index.html`. Presionás **R** en el sketch corriendo y se descarga un WebM del loop completo. Después ffmpeg lo pasa a MP4.

### 1. Crear un proyecto en editor.p5js.org por sketch

Ir a [editor.p5js.org](https://editor.p5js.org) → nuevo proyecto por cada uno de los 7 sketches.

### 2. Pegar el sketch

Copiar el contenido del `.js` de esta carpeta en `sketch.js` del proyecto (borrar lo que había). **No hace falta tocar el `index.html`.**

### 3. Grabar

1. Presionar **Play** ▶
2. Click sobre el canvas (para que el foco de teclado esté ahí)
3. Presionar **R**
4. El sketch resetea `frameCount = 0`, empieza a grabar, y al completar los 180 frames (6s @ 30fps) para automáticamente y descarga un WebM
5. En la consola vas a ver `● recording…` al empezar y `✓ capture done — check downloads` al terminar

### 4. Convertir el WebM a MP4 con ffmpeg

```bash
ffmpeg -i input.webm \
  -c:v libx264 -crf 24 -preset slow \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -an \
  output.mp4
```

Peso esperado: **~100-300 KB** para 6s @ 640×480. Los 7 juntos: **~1.5 MB**.

## Integración en el sitio

Guardá los MP4 finales en `project_images/`:

```
project_images/
  hero-react.mp4
  hero-javascript.mp4
  hero-python.mp4
  hero-postgres.mp4
  hero-figma.mp4
  hero-design.mp4
  hero-ingenieria.mp4
```

En `index.html` (el del sitio, no el de p5.js editor), en el array `nodes` del hero, cambiá `img` por `video`:

```js
const nodes = [
  { interest:'react',      desc:'Componentes con estado.',       video:'project_images/hero-react.mp4'      },
  { interest:'javascript', desc:'Vanilla, sin dependencias.',    video:'project_images/hero-javascript.mp4' },
  // …
];
```

Y en la función `showImage()` del JS del hero, reemplazá el `<img>`:

```js
popupEl.innerHTML =
  `<div class="img-wrap">` +
    `<video src="${n.video}" autoplay loop muted playsinline preload="metadata"></video>` +
  `</div>` +
  `<div class="title"><span class="num">${n.label}</span>${n.interest}</div>` +
  `<div class="desc">${n.desc}</div>`;
```

El CSS actual del `.img-wrap` funciona igual para `<video>` — `object-fit: cover` se hereda. Si querés forzarlo explícito:

```css
.node-image .img-wrap video{
  width:100%;
  height:100%;
  object-fit:cover;
  display:block;
}
```

## Estructura común de cada sketch

Todos siguen el mismo esqueleto:

```js
const W = 640, H = 480;
const FPS = 30;
const LOOP_SECONDS = 6;
const LOOP_FRAMES = FPS * LOOP_SECONDS;

// CCapture state
let capturer, capturing = false, captureStartFrame = 0;

function setup() {
  createCanvas(W, H);
  frameRate(FPS);
  pixelDensity(1);
  noSmooth();
  capturer = new CCapture({ format: 'webm', framerate: FPS, quality: 100 });
}

function draw() {
  const t = (frameCount % LOOP_FRAMES) / LOOP_FRAMES;
  drawScene(t);
  dither();
  // capture logic…
}

function keyPressed() {
  if (key === 'r' || key === 'R') { /* start capture */ }
}

function drawScene(t) { /* animación específica en grises */ }
function dither() { /* Bayer 4×4 → 2 colores (rojo brand + blanco) */ }
```

`drawScene()` es lo único que cambia entre sketches — todo lo demás (setup, draw, keyPressed, dither) es idéntico.

## Tips de ajuste

- **Loop perfecto:** todos los factores de tiempo son enteros × `angle` (por ejemplo `sin(angle * 2)`, `pow(sin(angle * 5), 12)`). Cualquier valor no-entero rompe el loop en la transición.
- **Dither más grueso:** cambiar la matriz Bayer 4×4 por 2×2 (bloques grandes, look 8-bit crudo) o 8×8 (más fino).
- **Cambiar color del bg:** las constantes `BG_R, BG_G, BG_B` al final de cada archivo. Para probar otro accent (por ejemplo `#DC0016` bright red o `#4A0808` deep wine), tocás los tres valores.
- **Grain más fuerte** (solo en 07): variable `GRAIN_AMOUNT` — 30 sutil, 60 fuerte, 100 grunge total.
- **Framerate baja:** `FPS = 15` da un feel de GIF antiguo. Los K de rotación también son enteros, así que el loop sigue cerrando.

## Gotchas

- **El preview se ve lento mientras graba** → normal. CCapture pausa el reloj de p5.js entre frames para capturar cada uno exacto, aunque tarde. Confiá en el timing interno.
- **No se descarga nada** → verificar que el browser no bloquee downloads del sitio. En Chrome, un icono de download bloqueado en la URL bar → permitirlo y volver a intentar con **R**.
- **WebM negro descargado** → algo salió mal con `capturer.capture()`. Verificar que CCapture esté cargado (chequear consola: `capturer` debe estar definido).
- **Frames raros al inicio** → el sketch reseteaba correctamente `frameCount = 0` cuando apretás **R**, pero si el keyPressed no llega al canvas (por foco en otra parte del editor), no dispara. Click primero en el preview antes de apretar R.

## Perf note

El dither loop hace ~307K iteraciones por frame (640×480). En p5.js con `pixelDensity(1)` y `Uint8ClampedArray`, corre a ~30-60fps en cualquier laptop reciente. Si se pone lento en mobile o hardware viejo, bajar a **480×360** y escalar con CSS `image-rendering: pixelated` para preservar el look pixelado.
