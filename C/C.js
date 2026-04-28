// ════════════════════════════════════════════
//  C  —  粒子实时模拟区 (Particle Simulation)
//
//  Three.js scene hosted inside #panelC.
//    · 2000-point cloud (uniform-in-sphere, radius = CLOUD_RADIUS)
//    · Dynamic THREE.LineSegments connecting points within threshold
//    · Color mapped from normalized xyz → rgb
//    · Simplex-noise driven displacement + slow group rotation
//    · UnrealBloom post-processing for neon glow
//
//  Spatial hashing keeps neighbor search ~O(n) instead of O(n²).
// ════════════════════════════════════════════
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass }      from 'three/addons/postprocessing/OutputPass.js';
import { createNoise3D }   from 'simplex-noise';

// Wait for DOM (modules defer, but layout may still be pending on some browsers)
if (document.readyState === 'loading') {
  await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
}

// Proof-of-life: module imports resolved & DOM ready
(() => {
  const c = document.getElementById('panelC');
  if (c) {
    const dot = document.createElement('div');
    dot.id = '__c_ok';
    dot.style.cssText = 'position:absolute;top:4px;right:8px;color:#4dffd2;font-size:7px;letter-spacing:2px;z-index:20;';
    dot.textContent = 'WEBGL INIT…';
    c.appendChild(dot);
  }
})();

const POINT_COUNT       = 2000;
const CLOUD_RADIUS      = 12;
const LINE_THRESHOLD    = 2.0;
const LINE_THRESHOLD_SQ = LINE_THRESHOLD * LINE_THRESHOLD;
const MAX_LINES         = 24000;

const NOISE_SCALE       = 0.08;  // spatial frequency of noise field
const NOISE_AMP         = 1.6;   // displacement amplitude
const NOISE_TIME_SPEED  = 0.14;  // time evolution

const container = document.getElementById('panelC');
let W = container.clientWidth;
let H = container.clientHeight;

// ── Scene / camera / renderer ──────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(55, W / H, 0.1, 1000);
camera.position.set(0, 0, 34);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
container.appendChild(renderer.domElement);

// ── Point cloud (uniform in sphere) ────────
const origPositions = new Float32Array(POINT_COUNT * 3);
const curPositions  = new Float32Array(POINT_COUNT * 3);
const pointColors   = new Float32Array(POINT_COUNT * 3);

for (let i = 0; i < POINT_COUNT; i++) {
  let x, y, z;
  do {
    x = (Math.random() - 0.5) * 2 * CLOUD_RADIUS;
    y = (Math.random() - 0.5) * 2 * CLOUD_RADIUS;
    z = (Math.random() - 0.5) * 2 * CLOUD_RADIUS;
  } while (x*x + y*y + z*z > CLOUD_RADIUS * CLOUD_RADIUS);
  const o = i * 3;
  origPositions[o]   = x; origPositions[o+1] = y; origPositions[o+2] = z;
  curPositions[o]    = x; curPositions[o+1]  = y; curPositions[o+2]  = z;
  // rgb = normalized xyz in [0, 1]
  pointColors[o]   = (x + CLOUD_RADIUS) / (2 * CLOUD_RADIUS);
  pointColors[o+1] = (y + CLOUD_RADIUS) / (2 * CLOUD_RADIUS);
  pointColors[o+2] = (z + CLOUD_RADIUS) / (2 * CLOUD_RADIUS);
}

const pointsGeo = new THREE.BufferGeometry();
pointsGeo.setAttribute('position', new THREE.BufferAttribute(curPositions, 3));
pointsGeo.setAttribute('color',    new THREE.BufferAttribute(pointColors, 3));
pointsGeo.getAttribute('position').setUsage(THREE.DynamicDrawUsage);
const pointsMat = new THREE.PointsMaterial({
  size: 0.1,
  vertexColors: true,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.95,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const points = new THREE.Points(pointsGeo, pointsMat);
scene.add(points);

// ── Dynamic line segments ──────────────────
const linePositions = new Float32Array(MAX_LINES * 6);
const lineColors    = new Float32Array(MAX_LINES * 6);
const lineGeo = new THREE.BufferGeometry();
const linePosAttr = new THREE.BufferAttribute(linePositions, 3);
const lineColAttr = new THREE.BufferAttribute(lineColors,    3);
linePosAttr.setUsage(THREE.DynamicDrawUsage);
lineColAttr.setUsage(THREE.DynamicDrawUsage);
lineGeo.setAttribute('position', linePosAttr);
lineGeo.setAttribute('color',    lineColAttr);
const lineMat = new THREE.LineBasicMaterial({
  vertexColors: true,
  transparent: true,
  opacity: 0.55,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});
const lines = new THREE.LineSegments(lineGeo, lineMat);
scene.add(lines);

// ── Bloom post-processing ──────────────────
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H),
  /* strength */  1.6,
  /* radius   */  0.55,
  /* threshold*/  0.0
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── Simplex noise ──────────────────────────
const noise3D = createNoise3D();

// ── Spatial hash (cell size = threshold) ──
const hashCells = new Map();
function hashKey(cx, cy, cz) {
  // pack small integers into one number; offset so ranges are non-negative
  return ((cx + 512) * 1024 + (cy + 512)) * 1024 + (cz + 512);
}

// ── Animation loop ─────────────────────────
const clock = new THREE.Clock();

function frame() {
  const t = clock.getElapsedTime();
  const tN = t * NOISE_TIME_SPEED;

  // 1. Displace each point via simplex noise.
  for (let i = 0; i < POINT_COUNT; i++) {
    const o = i * 3;
    const ox = origPositions[o];
    const oy = origPositions[o+1];
    const oz = origPositions[o+2];
    const dx = noise3D(ox * NOISE_SCALE,        oy * NOISE_SCALE,        tN)        * NOISE_AMP;
    const dy = noise3D(oy * NOISE_SCALE + 37,   oz * NOISE_SCALE + 37,   tN + 100)  * NOISE_AMP;
    const dz = noise3D(oz * NOISE_SCALE + 73,   ox * NOISE_SCALE + 73,   tN + 200)  * NOISE_AMP;
    curPositions[o]   = ox + dx;
    curPositions[o+1] = oy + dy;
    curPositions[o+2] = oz + dz;
  }
  pointsGeo.attributes.position.needsUpdate = true;

  // 2. Rebuild spatial hash.
  hashCells.clear();
  const cell = LINE_THRESHOLD;
  for (let i = 0; i < POINT_COUNT; i++) {
    const o = i * 3;
    const cx = Math.floor(curPositions[o]   / cell);
    const cy = Math.floor(curPositions[o+1] / cell);
    const cz = Math.floor(curPositions[o+2] / cell);
    const k  = hashKey(cx, cy, cz);
    let bucket = hashCells.get(k);
    if (!bucket) { bucket = []; hashCells.set(k, bucket); }
    bucket.push(i);
  }

  // 3. Neighbor pairs → write line segments.
  let lineIdx = 0;
  for (let i = 0; i < POINT_COUNT && lineIdx < MAX_LINES; i++) {
    const o = i * 3;
    const xi = curPositions[o], yi = curPositions[o+1], zi = curPositions[o+2];
    const cx = Math.floor(xi / cell);
    const cy = Math.floor(yi / cell);
    const cz = Math.floor(zi / cell);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = hashCells.get(hashKey(cx+dx, cy+dy, cz+dz));
          if (!bucket) continue;
          for (let m = 0, len = bucket.length; m < len; m++) {
            const j = bucket[m];
            if (j <= i) continue;
            const jo = j * 3;
            const ddx = curPositions[jo]   - xi;
            const ddy = curPositions[jo+1] - yi;
            const ddz = curPositions[jo+2] - zi;
            const dsq = ddx*ddx + ddy*ddy + ddz*ddz;
            if (dsq < LINE_THRESHOLD_SQ && lineIdx < MAX_LINES) {
              const lo = lineIdx * 6;
              linePositions[lo]   = xi;
              linePositions[lo+1] = yi;
              linePositions[lo+2] = zi;
              linePositions[lo+3] = curPositions[jo];
              linePositions[lo+4] = curPositions[jo+1];
              linePositions[lo+5] = curPositions[jo+2];
              lineColors[lo]   = pointColors[o];
              lineColors[lo+1] = pointColors[o+1];
              lineColors[lo+2] = pointColors[o+2];
              lineColors[lo+3] = pointColors[jo];
              lineColors[lo+4] = pointColors[jo+1];
              lineColors[lo+5] = pointColors[jo+2];
              lineIdx++;
            }
          }
        }
      }
    }
  }
  linePosAttr.needsUpdate = true;
  lineColAttr.needsUpdate = true;
  lineGeo.setDrawRange(0, lineIdx * 2);

  // 4. Slow group rotation + breathing.
  const rotY = t * 0.06;
  const rotX = Math.sin(t * 0.04) * 0.25;
  points.rotation.y = lines.rotation.y = rotY;
  points.rotation.x = lines.rotation.x = rotX;

  composer.render();
  requestAnimationFrame(frame);
}

// ── Resize handling ────────────────────────
window.addEventListener('resize', () => {
  W = container.clientWidth;
  H = container.clientHeight;
  camera.aspect = W / H;
  camera.updateProjectionMatrix();
  renderer.setSize(W, H);
  composer.setSize(W, H);
});

// Switch proof-of-life to "running"
const okDot = document.getElementById('__c_ok');
if (okDot) { okDot.textContent = 'WEBGL ✓'; okDot.style.color = '#4dffd2'; }

frame();
