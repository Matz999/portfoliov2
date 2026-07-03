// 06 — design
// A modernist grid composition that continuously rebalances.
// Rectangles swap dominance in a mondrian-like recomposition.
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
  const margin = 40;
  const usableW = W - margin * 2;
  const usableH = H - margin * 2;

  // Vertical divider oscillates between 30% and 70% of usable width
  const vDiv = margin + usableW * (0.35 + 0.3 * (0.5 + 0.5 * sin(angle)));
  // Horizontal divider on the left half
  const hDivLeft = margin + usableH * (0.4 + 0.25 * (0.5 + 0.5 * sin(angle * 1.3 + PI / 3)));
  // Horizontal divider on the right half
  const hDivRight = margin + usableH * (0.55 + 0.25 * (0.5 + 0.5 * cos(angle * 0.8)));
  // Vertical sub-divider inside top-right area
  const vSub = vDiv + (W - margin - vDiv) * (0.35 + 0.25 * (0.5 + 0.5 * sin(angle * 1.7)));

  noStroke();

  // Regions with brightness driven by their area (bigger → brighter)
  // Left column, top
  fill(220);
  rect(margin, margin, vDiv - margin, hDivLeft - margin);
  // Left column, bottom
  fill(90);
  rect(margin, hDivLeft, vDiv - margin, H - margin - hDivLeft);
  // Right column, top-left area
  fill(160);
  rect(vDiv, margin, vSub - vDiv, hDivRight - margin);
  // Right column, top-right area
  fill(255);
  rect(vSub, margin, W - margin - vSub, hDivRight - margin);
  // Right column, bottom
  fill(130);
  rect(vDiv, hDivRight, W - margin - vDiv, H - margin - hDivRight);

  // Thick black divider lines
  fill(0);
  const t2 = 6;
  rect(vDiv - t2 / 2, margin, t2, H - margin * 2);
  rect(margin, hDivLeft - t2 / 2, vDiv - margin, t2);
  rect(vDiv, hDivRight - t2 / 2, W - margin - vDiv, t2);
  rect(vSub - t2 / 2, margin, t2, hDivRight - margin);

  // Outer frame
  noFill();
  stroke(0);
  strokeWeight(6);
  rect(margin, margin, usableW, usableH);
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
