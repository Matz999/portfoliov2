// 03 — python
// Layered sine waves creating a moiré-like signal pattern.
// The serpentine curves undulate; the dither creates crawling stipple.
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
  // Rotate the helix twice per loop → perfect return
  const angle = t * TWO_PI * 2;

  const centerY = H / 2;
  const amp = 110;
  const freq = 0.014;

  // Rungs connecting the two strands (draw first, behind strands)
  for (let x = 0; x <= W; x += 14) {
    const phase = x * freq + angle;
    const y1 = centerY + amp * sin(phase);
    const y2 = centerY + amp * sin(phase + PI);
    // Rung brightness averages the two strand depths
    const z1 = (cos(phase) + 1) / 2;         // 0=back, 1=front
    const z2 = (cos(phase + PI) + 1) / 2;
    stroke(60 + 120 * (z1 + z2) * 0.5);
    strokeWeight(2);
    line(x, y1, x, y2);
  }

  // Two intertwining strands with depth-based brightness (per-segment for gradient)
  strokeWeight(6);
  noFill();
  strokeCap(ROUND);
  const step = 3;
  for (let strand = 0; strand < 2; strand++) {
    const strandPhase = strand * PI;
    for (let x = -step; x <= W; x += step) {
      const p1 = x * freq + angle + strandPhase;
      const p2 = (x + step) * freq + angle + strandPhase;
      const y1 = centerY + amp * sin(p1);
      const y2 = centerY + amp * sin(p2);
      const z = (cos((p1 + p2) / 2) + 1) / 2; // 0..1 average depth
      stroke(60 + 195 * z);                    // back=dim, front=bright
      // Segment thickness swells at the "front"
      strokeWeight(3 + 5 * z);
      line(x, y1, x + step, y2);
    }
  }

  // Traveling particle at the peak of the front strand
  const headPhase = angle + PI / 2;
  const headX = ((headPhase / (freq * TWO_PI)) * TWO_PI) % W;
  const headY = centerY + amp * sin(headX * freq + angle);
  noStroke();
  fill(255);
  circle(headX, headY, 20);
  fill(160);
  circle(headX, headY, 34);
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
