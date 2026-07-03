// 02 — javascript
// Concentric rotating arcs representing async event loops.
// Each ring rotates at a different speed and phase — microtasks vs macrotasks.
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

  // Five concentric rings — each with 2-3 arc segments, rotating differently
  const rings = [
    { r: 200, arcs: 2, speed: -1, brightness: 200 },
    { r: 160, arcs: 3, speed: 1.6, brightness: 220 },
    { r: 120, arcs: 4, speed: -2.4, brightness: 180 },
    { r: 80,  arcs: 3, speed: 3.2, brightness: 240 },
    { r: 40,  arcs: 2, speed: -4, brightness: 160 },
  ];

  noFill();
  strokeCap(SQUARE);

  rings.forEach((ring, idx) => {
    stroke(ring.brightness);
    strokeWeight(14);
    const segAngle = TWO_PI / ring.arcs;
    const gap = 0.35;
    for (let i = 0; i < ring.arcs; i++) {
      const start = angle * ring.speed + i * segAngle;
      const end = start + segAngle - gap;
      arc(0, 0, ring.r * 2, ring.r * 2, start, end);
    }
  });

  // Center dot — the currently executing task
  fill(255);
  noStroke();
  circle(0, 0, 16);

  pop();
}

// 2-colour output: brand red (bg) + white (shapes)
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
      const gray = pixels[i];
      const threshold = bayer[(y & 3) * 4 + (x & 3)] * 16 + 8;
      const on = gray > threshold;
      pixels[i]     = on ? 255 : BG_R;
      pixels[i + 1] = on ? 255 : BG_G;
      pixels[i + 2] = on ? 255 : BG_B;
    }
  }
  updatePixels();
}
