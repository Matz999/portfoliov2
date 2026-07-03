// 07 — ingeniería
// Six interlocking gears meshed in chains, connected by two belts running across.
// Tooth counts + rotation ratios chosen so every gear returns to phase 0 at loop end.
// 640×480 · 6-second loop @ 30fps

const W = 640, H = 480;
const FPS = 30;
const LOOP_SECONDS = 6;
const LOOP_FRAMES = FPS * LOOP_SECONDS;

// Scale factor from teeth to pitch radius
const R_SCALE = 3;

// Six gears. teeth × K = 48 for every gear → meshed & belted pairs all sync.
// Meshed pairs alternate direction; belted pairs share direction.
const GEARS = [
  { x: -220, y:  -80, teeth: 24, K: 2, dir:  1 }, // 0 · A · top-left large     (belt→3)
  { x:  -90, y:  -80, teeth: 12, K: 4, dir: -1 }, // 1 · B · meshed with A
  { x:   -6, y:  -80, teeth:  8, K: 6, dir:  1 }, // 2 · C · meshed with B      (belt→5)
  { x: -220, y:  120, teeth: 16, K: 3, dir:  1 }, // 3 · D · belt from A
  { x:  -90, y:  120, teeth: 24, K: 2, dir: -1 }, // 4 · E · meshed with D
  { x:   30, y:  120, teeth: 12, K: 4, dir:  1 }, // 5 · F · meshed with E, belt from C
];

// Belts between gear indices [i, j]
const BELTS = [
  [0, 3], // A ↔ D — vertical belt on the left
  [2, 5], // C ↔ F — diagonal belt on the right
];

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
  // Camera drift for cinematic vibration (integer K → loops perfectly)
  const driftX = sin(angle) * 14;
  const driftY = cos(angle * 2) * 8;
  translate(W / 2 + driftX, H / 2 + driftY);

  // Slight tilt too — the whole rig wobbles like a heavy machine
  rotate(sin(angle * 3) * 0.02);

  // Belts first (behind gears)
  BELTS.forEach(([i, j]) => drawBelt(GEARS[i], GEARS[j]));

  // Gears on top
  GEARS.forEach((g) => {
    push();
    translate(g.x, g.y);
    rotate(angle * g.K * g.dir);
    drawGear(g.teeth);
    pop();
  });

  // Sparks at the meshing contact points — flash briefly, different rate per pair
  drawSparks(angle);

  pop();
}

// Sparks pop out of gear-meshing contact points
function drawSparks(angle) {
  const meshes = [
    [GEARS[0], GEARS[1]],  // A ↔ B
    [GEARS[1], GEARS[2]],  // B ↔ C
    [GEARS[3], GEARS[4]],  // D ↔ E
    [GEARS[4], GEARS[5]],  // E ↔ F
  ];
  noStroke();
  meshes.forEach(([g1, g2], i) => {
    const mx = (g1.x + g2.x) / 2;
    const my = (g1.y + g2.y) / 2;
    // Sharp strobe: pow(sin, 12) is near-zero except at narrow peaks
    const K = 5 + i;
    const flash = pow(max(0, sin(angle * K + i * 1.7)), 12);
    if (flash < 0.04) return;
    fill(255);
    circle(mx, my, 10 + 26 * flash);
    fill(200);
    circle(mx, my, 4 + 12 * flash);
    // Small satellite sparks flying off
    for (let s = 0; s < 3; s++){
      const sa = i * 1.3 + s * (TWO_PI / 3);
      const sr = 22 * flash;
      fill(240);
      circle(mx + cos(sa) * sr, my + sin(sa) * sr, 3 + 6 * flash);
    }
  });
}

function drawGear(teeth) {
  const rootR = teeth * R_SCALE;
  const tipR  = rootR + 10;

  noStroke();
  fill(255);
  beginShape();
  const steps = teeth * 4;
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * TWO_PI;
    const phase = (i / steps) * teeth;
    const inTooth = (phase % 1) < 0.5;
    const r = inTooth ? tipR : rootR;
    vertex(r * cos(a), r * sin(a));
  }
  endShape(CLOSE);

  // Central hub (visible hole)
  fill(0);
  circle(0, 0, rootR * 0.55);
  fill(200);
  circle(0, 0, rootR * 0.18);
}

// Draw an external belt looping around two gears.
// Belt = two parallel tangent lines + arcs wrapping around the outside of each gear.
function drawBelt(g1, g2) {
  const r1 = g1.teeth * R_SCALE;
  const r2 = g2.teeth * R_SCALE;
  const dx = g2.x - g1.x, dy = g2.y - g1.y;
  const theta = atan2(dy, dx);
  const nx = -sin(theta), ny = cos(theta); // perpendicular unit vector

  stroke(180);
  strokeWeight(4);
  noFill();
  strokeCap(SQUARE);

  // Two parallel tangent lines (approximation — exact only for equal radii)
  line(g1.x + nx * r1, g1.y + ny * r1, g2.x + nx * r2, g2.y + ny * r2);
  line(g1.x - nx * r1, g1.y - ny * r1, g2.x - nx * r2, g2.y - ny * r2);

  // Arc wrapping around the "far side" of each gear (opposite the other gear)
  arc(g1.x, g1.y, r1 * 2, r1 * 2, theta + HALF_PI, theta + HALF_PI * 3);
  arc(g2.x, g2.y, r2 * 2, r2 * 2, theta - HALF_PI, theta + HALF_PI);
}

// 2-colour output: brand red (bg) + white (shapes) + per-pixel grain noise
const BG_R = 139, BG_G = 16, BG_B = 16; // #8B1010 portfolio accent
const GRAIN_AMOUNT = 55;                 // ±half of this added to each pixel
function dither() {
  loadPixels();
  const bayer = [ 0,  8,  2, 10,
                 12,  4, 14,  6,
                  3, 11,  1,  9,
                 15,  7, 13,  5 ];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (x + y * W) * 4;
      // Grain: random perturbation added to grayscale before threshold
      const grain = (Math.random() - 0.5) * GRAIN_AMOUNT;
      const gray = pixels[i] + grain;
      const threshold = bayer[(y & 3) * 4 + (x & 3)] * 16 + 8;
      const on = gray > threshold;
      pixels[i]     = on ? 255 : BG_R;
      pixels[i + 1] = on ? 255 : BG_G;
      pixels[i + 2] = on ? 255 : BG_B;
    }
  }
  updatePixels();
}
