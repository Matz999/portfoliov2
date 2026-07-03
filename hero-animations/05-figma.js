// 05 — figma
// Four shapes at grid points that morph between square, circle and star.
// Superellipse blending — the mathematical bridge between primitives.
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

  const positions = [
    [W * 0.28, H * 0.32],
    [W * 0.72, H * 0.32],
    [W * 0.28, H * 0.68],
    [W * 0.72, H * 0.68],
  ];

  positions.forEach(([cx, cy], i) => {
    push();
    translate(cx, cy);
    // Each cube spins on its own combined XY axes at different rates
    const ax = angle * (i + 1);            // 1,2,3,4 X-rotations per loop
    const ay = angle * (4 - i);            // 4,3,2,1 Y-rotations per loop
    drawCube(80, ax, ay);
    pop();
  });

  // Connective grid lines
  stroke(80);
  strokeWeight(1);
  line(W * 0.5, 0, W * 0.5, H);
  line(0, H * 0.5, W, H * 0.5);
}

// Draw a solid cube with a square hole punched through each face.
// Faces sorted back-to-front so front face's hole reveals back face's hole → tunnel.
function drawCube(size, ax, ay) {
  const half = size / 2;
  // 8 vertices of a cube
  const V = [
    [-half, -half, -half], [ half, -half, -half], [ half,  half, -half], [-half,  half, -half],
    [-half, -half,  half], [ half, -half,  half], [ half,  half,  half], [-half,  half,  half],
  ];
  const cosX = cos(ax), sinX = sin(ax);
  const cosY = cos(ay), sinY = sin(ay);
  // Rotate every vertex around X then Y
  const rotated = V.map(([x, y, z]) => {
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    const x2 =  x * cosY + z1 * sinY;
    const z2 = -x * sinY + z1 * cosY;
    return [x2, y1, z2];
  });
  // Perspective projection
  const focal = 320;
  const P = rotated.map(([x, y, z]) => {
    const s = focal / (focal + z);
    return { x: x * s, y: y * s, z };
  });

  // 6 cube faces (vertex indices in CCW order when viewed from outside)
  const faces = [
    [0, 3, 2, 1], // back  (-z)
    [4, 5, 6, 7], // front (+z)
    [0, 1, 5, 4], // bottom
    [3, 7, 6, 2], // top
    [0, 4, 7, 3], // left
    [1, 2, 6, 5], // right
  ].map((indices) => ({
    indices,
    avgZ: indices.reduce((s, i) => s + rotated[i][2], 0) / 4,
  }));

  // Painter's algorithm: draw farthest first
  faces.sort((a, b) => b.avgZ - a.avgZ);

  const HOLE_SHRINK = 0.5; // hole is 50% the size of the face (toward centre)

  faces.forEach((f) => {
    // Face normal in 3D → brightness (faces looking straight at camera are brightest)
    const [ia, ib, ic] = f.indices;
    const a = rotated[ia], b = rotated[ib], c = rotated[ic];
    const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const nx = e1[1] * e2[2] - e1[2] * e2[1];
    const ny = e1[2] * e2[0] - e1[0] * e2[2];
    const nz = e1[0] * e2[1] - e1[1] * e2[0];
    const nLen = sqrt(nx * nx + ny * ny + nz * nz) || 1;
    const facing = abs(nz / nLen); // 0 = edge on, 1 = square on
    fill(120 + 135 * facing);
    noStroke();

    // Face centre in 2D
    const cx = f.indices.reduce((s, i) => s + P[i].x, 0) / 4;
    const cy = f.indices.reduce((s, i) => s + P[i].y, 0) / 4;

    // Outer quad (CCW) + inner hole (reversed → CW, cancels out via non-zero winding rule)
    beginShape();
    f.indices.forEach((i) => vertex(P[i].x, P[i].y));
    beginContour();
    f.indices.slice().reverse().forEach((i) => {
      vertex(lerp(cx, P[i].x, HOLE_SHRINK), lerp(cy, P[i].y, HOLE_SHRINK));
    });
    endContour();
    endShape(CLOSE);
  });
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
