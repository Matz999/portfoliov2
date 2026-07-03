// 04 — postgres
// Grid of data cells rippling in a diagonal wave — rows scanning through columns.
// Like watching an index scan or a SELECT query populate a result set.
// 640×480 · 6-second loop @ 30fps

const W = 640, H = 480;
const FPS = 30;
const LOOP_SECONDS = 6;
const LOOP_FRAMES = FPS * LOOP_SECONDS;

const COLS = 24;
const ROWS = 18;

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
  const cellW = W / COLS;
  const cellH = H / ROWS;

  noStroke();

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      // Diagonal wave crawling across the grid
      const wave = sin((x + y * 0.7) * 0.35 - angle * 2);
      // Secondary slower ripple from centre
      const cx = COLS / 2, cy = ROWS / 2;
      const dist = sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      const ripple = sin(dist * 0.5 + angle * 1.5);
      const combined = (wave + ripple * 0.6) * 0.5 + 0.5; // 0..1
      const brightness = combined * 255;

      fill(brightness);
      const pad = 1.5;
      rect(x * cellW + pad, y * cellH + pad, cellW - pad * 2, cellH - pad * 2);
    }
  }
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
