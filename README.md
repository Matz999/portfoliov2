# portfoliov2

Portfolio online de **Máximo Pulitano** — estudiante de Informática en UNO, freelance de diseño gráfico, marketing digital y desarrollo web.

Sitio estático de una página (`index.html`) con tres páginas de proyecto en formato slideshow. Sin build step, sin dependencias, sin backend.

## Stack

- **HTML/CSS/JS vanilla** — todo en archivos únicos, `<style>` y `<script>` inline.
- **Fonts:** Hanken Grotesk + Inter Tight + JetBrains Mono (Google Fonts) + General Sans (Fontshare).
- **Animaciones del hero:** 7 loops MP4 de 6s, generados con p5.js + dithering Bayer 4×4 (ver `hero-animations/README.md`).

## Estructura

```
.
├── index.html                    # Landing principal
├── projects/
│   ├── studio-vanta.html         # Slideshow del proyecto Studio Vanta
│   ├── mamiferos-argentinos.html # Slideshow del proyecto Mamíferos
│   └── varios.html               # Slideshow de piezas sueltas
├── project_images/               # Imágenes y videos usados por el sitio
│   ├── hero-*.mp4                # 7 loops del hero (react, python, figma, etc.)
│   ├── cherry.webp               # Preview de Varios en la work list
│   ├── vanta1.png                # Logo Studio Vanta (transparente)
│   ├── mamifero_logo.png         # Logo Mamíferos (transparente)
│   └── ...
├── hero-animations/              # Sketches p5.js source de los hero videos
│   ├── 01-react.js ... 07-ingenieria.js
│   └── README.md                 # Cómo regrabar y comprimir los videos
├── _experiments/                 # Bocetos viejos — no forman parte del sitio
├── cv.pdf                        # (TODO: pendiente subir)
├── .gitignore
└── README.md
```

## Desarrollo local

Como es 100% estático, cualquier servidor HTTP alcanza. Un one-liner con Python:

```bash
cd portfoliov2
python -m http.server 8000
```

Abrir `http://localhost:8000` en el browser. Cambios en HTML/CSS/JS se ven al recargar (F5).

Alternativas equivalentes:

```bash
# Node
npx serve .

# Live-reload
npx live-server .
```

## Deploy

Hosteado en **Cloudflare Pages** con deploy automático desde `main`.

- URL pública: `maximopulitano.pages.dev` *(a confirmar tras conectar el repo)*
- Cada `git push` a `main` dispara un build automático (~30s hasta live).

## Convenciones

- Un solo `<style>` inline en cada HTML — sin split de CSS.
- Un solo `<script>` inline en cada HTML — sin bundler.
- Assets referenciados por rutas relativas (`project_images/…`, `../project_images/…`).
- Sin dependencias de package manager. Fonts y librerías vienen de CDN (Fontshare, Google Fonts).

## Regrabar animaciones del hero

Ver [`hero-animations/README.md`](hero-animations/README.md) para el workflow completo (p5.js editor → grabar WebM → convertir a MP4 con ffmpeg).

## To-do

- [ ] Subir `cv.pdf` a la raíz
- [ ] Reemplazar placeholders de `picsum.photos` en `projects/mamiferos-argentinos.html` y `projects/varios.html` con contenido real
- [ ] Favicon
- [ ] Meta tags Open Graph (imagen de share)
- [ ] Verificar formulario de contacto (WhatsApp CTA)
