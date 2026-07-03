// 01 — react
// Three elliptical orbits with electrons circling a nucleus.
// The dithered pattern reveals the orbits as dot fields; electrons flash bright.
// 640×480 · 6-second loop @ 30fps

const W = 640, H = 480;
const FPS = 30;
const LOOP_SECONDS = 6;
const LOOP_FRAMES = FPS * LOOP_SECONDS;

// ─── Recording (press R to record one full loop as WebM) ─────────────────
// Uses the browser's native MediaRecorder API — no external library needed.
let recorder = null;
let recording = false;
let recordStartFrame = 0;

function setup() {
  createCanvas(W, H);
  frameRate(FPS);
  pixelDensity(1);
  noSmooth();
}

function draw() {
  const t = (frameCount % LOOP_FRAMES) / LOOP_FRAMES;
  drawScene(t);
  dither();

  // Auto-stop after one full loop worth of frames
  if (recording && frameCount - recordStartFrame >= LOOP_FRAMES) {
    recorder.stop();
    recording = false;
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    if (recording) return;
    startRecording();
  }
}

function startRecording() {
  const canvas = document.getElementsByTagName('canvas')[0];
  const stream = canvas.captureStream(FPS);
  const chunks = [];
  recorder = new MediaRecorder(stream, {
    mimeType: 'video/webm;codecs=vp9',
    videoBitsPerSecond: 8_000_000,
  });
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capture-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    console.log('✓ capture done — check downloads');
  };
  frameCount = 0;
  recordStartFrame = 0;
  recorder.start();
  recording = true;
  console.log('● recording…');
}

function drawScene(t) {
  background(0);
  const angle = t * TWO_PI;

  push();
  translate(W / 2, H / 2);
  // Whole atom rotates once per loop
  rotate(angle);

  // Three orbits, each rotated 60° apart
  const orbitRx = 240;
  const orbitRy = 90;

  for (let i = 0; i < 3; i++) {
    push();
    rotate((i * PI) / 3);

    // Orbit ring — thick stroke at 60% brightness → renders as dot field
    stroke(140);
    strokeWeight(4);
    noFill();
    ellipse(0, 0, orbitRx * 2, orbitRy * 2);

    // Electron on the orbit
    const dir = i % 2 === 0 ? 1 : -1;
    const a = angle * dir + (i * TWO_PI) / 3;
    const ex = orbitRx * cos(a);
    const ey = orbitRy * sin(a);
    fill(255);
    noStroke();
    circle(ex, ey, 22);
    // Soft trail behind electron
    fill(120);
    circle(orbitRx * cos(a - 0.4 * dir), orbitRy * sin(a - 0.4 * dir), 14);
    fill(70);
    circle(orbitRx * cos(a - 0.8 * dir), orbitRy * sin(a - 0.8 * dir), 8);

    pop();
  }

  // Central nucleus with pulse
  const pulse = 30 + 6 * sin(angle * 3);
  fill(255);
  noStroke();
  circle(0, 0, pulse);
  fill(180);
  circle(0, 0, pulse * 0.5);

  pop();
}

// Bayer 4×4 ordered dithering — 2-colour output: brand red (bg) + white (shapes)
const BG_R = 139, BG_G = 16, BG_B = 16; // #8B1010 portfolio accent
function dither() {
  loadPixels();
  const bayer = [ 0,  8,  2, 10,
                 12,  4, 14,  6,
                  3, 11,  1,  9,
                 15,  7, 13,  5 ];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (x + y * W) * 4;
      const gray = pixels[i]; // R=G=B for grayscale
      const threshold = bayer[(y & 3) * 4 + (x & 3)] * 16 + 8; // 0..255
      const on = gray > threshold;
      pixels[i]     = on ? 255 : BG_R;
      pixels[i + 1] = on ? 255 : BG_G;
      pixels[i + 2] = on ? 255 : BG_B;
    }
  }
  updatePixels();
}
