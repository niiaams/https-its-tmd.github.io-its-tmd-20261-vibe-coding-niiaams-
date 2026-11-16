// Konfigurator layout 3D (three.js 0.160.0 dari CDN, versi terkunci di importmap index.html).
// Geometri produk = placeholder parametrik sesuai dimensi asli (nanti bisa diganti GLB).
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const MM = 0.001;
let el, hooks, renderer, scene, camera, controls, roomGroup, itemsGroup, helpers = [];
let selected = new Set();
let collisions = new Set();
const meshes = new Map(); // uid -> group
const texCache = {};
const loader = new THREE.TextureLoader();
const metal = new THREE.MeshStandardMaterial({ color: 0x1d1f22, metalness: 0.6, roughness: 0.45 });
const raycaster = new THREE.Raycaster();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
let drag = null;
let down = null;

function colorMat(colorId) {
  const c = CMAP[colorId] || COLORS[0];
  if (!texCache[c.id]) {
    const tex = loader.load(c.img, () => requestRender());
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    texCache[c.id] = tex;
  }
  return new THREE.MeshStandardMaterial({ map: texCache[c.id], roughness: 0.75, metalness: 0.02 });
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

function buildShape(it) {
  const p = PMAP[it.pid];
  const d = itemDims(it);
  const [L, W, H] = d.map((v) => v * MM);
  const rec = colorMat(it.color);
  const g = new THREE.Group();
  const leg = 0.012;
  switch (p.shape) {
    case 'chair': {
      const sh = H * 0.58;
      g.add(box(L * 0.95, 0.02, W * 0.85, rec, 0, sh, 0.02));
      g.add(box(L * 0.9, H * 0.36, 0.02, rec, 0, sh + H * 0.22, -W * 0.42));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(cyl(leg, leg, sh, metal, sx * L * 0.42, sh / 2, sz * W * 0.4, 8)));
      break;
    }
    case 'roundtable': {
      g.add(cyl(L / 2, L / 2, 0.025, rec, 0, H - 0.0125, 0, 48));
      g.add(cyl(0.03, 0.03, H - 0.03, metal, 0, (H - 0.03) / 2, 0, 12));
      g.add(cyl(L * 0.3, L * 0.3, 0.02, metal, 0, 0.01, 0, 32));
      break;
    }
    case 'stoolframe':
    case 'stoolback': {
      const sh = (p.seat || H) * MM * (H / (p.dims[2] * MM));
      g.add(cyl(L * 0.42, L * 0.42, 0.025, rec, 0, sh - 0.0125, 0, 40));
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(cyl(leg, leg, sh, metal, sx * L * 0.36, sh / 2, sz * W * 0.36, 8)));
      g.add(box(L * 0.7, 0.02, W * 0.35, p.shape === 'stoolback' ? rec : metal, 0, sh * 0.35, W * 0.25));
      if (p.shape === 'stoolback') {
        g.add(box(L * 0.75, (H - sh) * 0.55, 0.02, rec, 0, H - (H - sh) * 0.28, -W * 0.42));
        g.add(cyl(leg, leg, H - sh, metal, -L * 0.3, sh + (H - sh) / 2, -W * 0.4, 8));
        g.add(cyl(leg, leg, H - sh, metal, L * 0.3, sh + (H - sh) / 2, -W * 0.4, 8));
      }
      break;
    }
    case 'crossstool':
    case 'crosstable': {
      const t = 0.025;
      if (p.round) g.add(cyl(L / 2, L / 2, t, rec, 0, H - t / 2, 0, 40));
      else g.add(box(L, t, W, rec, 0, H - t / 2, 0));
      g.add(box(L * 0.75, H - t, 0.02, rec, 0, (H - t) / 2, 0));
      g.add(box(0.02, H - t, W * 0.75, rec, 0, (H - t) / 2, 0));
      break;
    }
    case 'bench': {
      const t = 0.04;
      g.add(box(L, t, W, rec, 0, H - t / 2, 0));
      g.add(box(t, H - t, W, rec, -L / 2 + t / 2 + 0.03, (H - t) / 2, 0));
      g.add(box(t, H - t, W, rec, L / 2 - t / 2 - 0.03, (H - t) / 2, 0));
      break;
    }
    case 'sheet':
      g.add(box(L, Math.max(H, 0.01), W, rec, 0, Math.max(H, 0.01) / 2, 0));
      break;
    case 'panel':
      g.add(box(L, H, Math.max(W, 0.01), rec, 0, 0.9 + H / 2, 0));
      break;
    case 'planter': {
      g.add(cyl(L / 2, L * 0.36, H, rec, 0, H / 2, 0, 40));
      const leaf = new THREE.MeshStandardMaterial({ color: 0x3f6b3a, roughness: 0.9 });
      const bush = new THREE.Mesh(new THREE.IcosahedronGeometry(L * 0.45, 1), leaf);
      bush.position.y = H + L * 0.3; bush.castShadow = true;
      g.add(bush);
      break;
    }
    case 'decor':
      if (p.round) g.add(cyl(L / 2, L / 2, Math.max(H, 0.01), rec, 0, H / 2, 0, 24));
      else g.add(box(L, Math.max(H, 0.01), W, rec, 0, H / 2, 0));
      break;
    default:
      g.add(box(L, H, W, rec, 0, H / 2, 0));
  }
  return g;
}

function footprint(it) {
  const p = PMAP[it.pid];
  const d = itemDims(it);
  const hw = d[0] / 2, hd = (p.shape === 'panel' ? Math.max(d[1], 20) : d[1]) / 2;
  const a = (-(it.rot || 0) * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, z]) => [it.x + x * c + z * s, it.z - x * s + z * c]);
}
function aabb(poly) {
  const xs = poly.map((q) => q[0]), zs = poly.map((q) => q[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minZ: Math.min(...zs), maxZ: Math.max(...zs) };
}
function satOverlap(A, B) {
  for (const poly of [A, B]) {
    for (let i = 0; i < 4; i++) {
      const [x1, z1] = poly[i], [x2, z2] = poly[(i + 1) % 4];
      const nx = z2 - z1, nz = x1 - x2;
      const proj = (P) => P.map(([x, z]) => x * nx + z * nz);
      const pa = proj(A), pb = proj(B);
      if (Math.max(...pa) <= Math.min(...pb) + 1 || Math.max(...pb) <= Math.min(...pa) + 1) return false;
    }
  }
  return true;
}
function ignoresCollision(it) {
  const p = PMAP[it.pid];
  return p.cat === 'decor';
}

function analyse() {
  const prj = hooks.getProject();
  const items = prj.items;
  const [RL, RW] = prj.room;
  collisions = new Set();
  const polys = items.map(footprint);
  const warnings = [];
  items.forEach((a, i) => {
    if (ignoresCollision(a)) return;
    const bb = aabb(polys[i]);
    if (bb.minX < -1 || bb.minZ < -1 || bb.maxX > RL + 1 || bb.maxZ > RW + 1) {
      collisions.add(a.uid);
      warnings.push({ type: 'outside', a: a.uid });
    }
    for (let j = i + 1; j < items.length; j++) {
      const b = items[j];
      if (ignoresCollision(b)) continue;
      if (satOverlap(polys[i], polys[j])) {
        collisions.add(a.uid); collisions.add(b.uid);
        warnings.push({ type: 'overlap', a: a.uid, b: b.uid });
      }
    }
  });
  // jarak bebas item terpilih
  let clearance = null;
  if (selected.size === 1) {
    const uid = [...selected][0];
    const i = items.findIndex((x) => x.uid === uid);
    if (i >= 0) {
      const A = aabb(polys[i]);
      let best = { dist: Math.min(A.minX, A.minZ, RL - A.maxX, RW - A.maxZ), to: 'wall' };
      items.forEach((b, j) => {
        if (j === i || selected.has(b.uid) || ignoresCollision(b)) return;
        const B = aabb(polys[j]);
        const dx = Math.max(0, B.minX - A.maxX, A.minX - B.maxX);
        const dz = Math.max(0, B.minZ - A.maxZ, A.minZ - B.maxZ);
        const dd = Math.hypot(dx, dz);
        if (dd < best.dist) best = { dist: dd, to: b.uid };
      });
      clearance = { dist: Math.max(0, Math.round(best.dist)), to: best.to };
    }
  }
  return { warnings, clearance };
}

function updateHighlights() {
  helpers.forEach((h) => scene.remove(h));
  helpers = [];
  meshes.forEach((grp, uid) => {
    const sel = selected.has(uid), col = collisions.has(uid);
    if (!sel && !col) return;
    const h = new THREE.BoxHelper(grp, col ? 0xd1495b : 0x0f5e8c);
    scene.add(h);
    helpers.push(h);
  });
  requestRender();
}

function buildRoom() {
  const prj = hooks.getProject();
  const [L, W, H] = prj.room.map((v) => v * MM);
  if (roomGroup) scene.remove(roomGroup);
  roomGroup = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(L, W), new THREE.MeshStandardMaterial({ color: 0xe9e3da, roughness: 0.95 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(L / 2, 0, W / 2);
  floor.receiveShadow = true;
  floor.userData.floor = true;
  roomGroup.add(floor);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0xf6f4f0, roughness: 1, side: THREE.DoubleSide });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(L, H), wallMat);
  back.position.set(L / 2, H / 2, 0); back.receiveShadow = true;
  const left = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
  left.rotation.y = Math.PI / 2; left.position.set(0, H / 2, W / 2); left.receiveShadow = true;
  roomGroup.add(back, left);
  // grid 500 mm
  const pts = [];
  for (let x = 0; x <= L + 1e-6; x += 0.5) pts.push(x, 0.001, 0, x, 0.001, W);
  for (let z = 0; z <= W + 1e-6; z += 0.5) pts.push(0, 0.001, z, L, 0.001, z);
  const gg = new THREE.BufferGeometry();
  gg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  roomGroup.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: 0xcfc6ba })));
  // garis batas ruang
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(L, H, W)), new THREE.LineBasicMaterial({ color: 0x9aa5ad }));
  edge.position.set(L / 2, H / 2, W / 2);
  roomGroup.add(edge);
  scene.add(roomGroup);
}

function rebuild() {
  if (!scene) return;
  buildRoom();
  meshes.forEach((m) => itemsGroup.remove(m));
  meshes.clear();
  const prj = hooks.getProject();
  prj.items.forEach((it) => {
    const g = buildShape(it);
    g.userData.uid = it.uid;
    g.traverse((o) => { o.userData.uid = it.uid; });
    placeMesh(g, it);
    itemsGroup.add(g);
    meshes.set(it.uid, g);
  });
  // buang pilihan yang sudah tidak ada
  selected = new Set([...selected].filter((u) => meshes.has(u)));
  const info = analyse();
  updateHighlights();
  hooks.onAnalyse && hooks.onAnalyse(info, [...selected]);
}
function placeMesh(g, it) {
  g.position.set(it.x * MM, 0, it.z * MM);
  g.rotation.y = ((it.rot || 0) * Math.PI) / 180;
}

function setCameraDefault() {
  const prj = hooks.getProject();
  const [L, W] = prj.room.map((v) => v * MM);
  const m = Math.max(L, W);
  camera.position.set(L * 1.05, m * 0.85, W * 1.55);
  controls.target.set(L / 2, 0, W / 2);
  controls.update();
}
function setView(v) {
  const prj = hooks.getProject();
  const [L, W] = prj.room.map((x) => x * MM);
  if (v === 'top') {
    camera.position.set(L / 2, Math.max(L, W) * 1.25, W / 2 + 0.01);
    controls.target.set(L / 2, 0, W / 2);
    controls.update();
  } else setCameraDefault();
  requestRender();
}

function floorPoint(clientX, clientY) {
  const r = renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(v, camera);
  const p = new THREE.Vector3();
  return raycaster.ray.intersectPlane(floorPlane, p) ? { x: p.x / MM, z: p.z / MM, ndc: v } : null;
}
function pickItem(clientX, clientY) {
  const r = renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(v, camera);
  const hit = raycaster.intersectObjects(itemsGroup.children, true)[0];
  return hit ? hit.object.userData.uid : null;
}

function groupMates(uid) {
  const items = hooks.getProject().items;
  const it = items.find((x) => x.uid === uid);
  if (!it || !it.group) return [uid];
  return items.filter((x) => x.group === it.group).map((x) => x.uid);
}

function setSelection(uids, silent) {
  selected = new Set(uids);
  const info = analyse();
  updateHighlights();
  if (!silent) hooks.onSelect([...selected], info);
}

function snapToWalls(it) {
  const prj = hooks.getProject();
  const [RL, RW] = prj.room;
  const p = PMAP[it.pid];
  if (p.shape === 'panel') {
    // panel dinding menempel ke dinding terdekat
    const dBack = it.z, dLeft = it.x, dFront = RW - it.z, dRight = RL - it.x;
    const m = Math.min(dBack, dLeft, dFront, dRight);
    const half = Math.max(p.dims[1], 10) / 2;
    if (m === dBack) { it.rot = 0; it.z = half; } else if (m === dLeft) { it.rot = -90; it.x = half; } else if (m === dFront) { it.rot = 180; it.z = RW - half; } else { it.rot = 90; it.x = RL - half; }
    return;
  }
  const bb = aabb(footprint(it));
  const S = 120;
  if (bb.minX < S && bb.minX > -S * 3) it.x -= bb.minX;
  else if (RL - bb.maxX < S && RL - bb.maxX > -S * 3) it.x += RL - bb.maxX;
  if (bb.minZ < S && bb.minZ > -S * 3) it.z -= bb.minZ;
  else if (RW - bb.maxZ < S && RW - bb.maxZ > -S * 3) it.z += RW - bb.maxZ;
}

function onPointerDown(e) {
  if (hooks.readOnly && hooks.readOnly()) return;
  down = { x: e.clientX, y: e.clientY, uid: pickItem(e.clientX, e.clientY) };
  if (!down.uid) return;
  const multi = e.shiftKey || e.ctrlKey || e.metaKey || hooks.isMulti();
  const mates = groupMates(down.uid);
  let sel = new Set(selected);
  if (multi) {
    const has = sel.has(down.uid);
    mates.forEach((u) => (has ? sel.delete(u) : sel.add(u)));
  } else if (!sel.has(down.uid)) sel = new Set(mates);
  setSelection([...sel]);
  if (!sel.has(down.uid)) return;
  const fp = floorPoint(e.clientX, e.clientY);
  if (!fp) return;
  const items = hooks.getProject().items;
  drag = { start: fp, moved: false, orig: items.filter((x) => sel.has(x.uid)).map((x) => ({ it: x, x: x.x, z: x.z })), primary: items.find((x) => x.uid === down.uid) };
  controls.enabled = false;
  renderer.domElement.setPointerCapture(e.pointerId);
}
function onPointerMove(e) {
  if (!drag) return;
  const fp = floorPoint(e.clientX, e.clientY);
  if (!fp) return;
  let dx = fp.x - drag.start.x, dz = fp.z - drag.start.z;
  if (Math.abs(dx) + Math.abs(dz) > 5) drag.moved = true;
  if (hooks.gridOn()) {
    const step = 50;
    const po = drag.orig.find((o) => o.it === drag.primary);
    dx = Math.round((po.x + dx) / step) * step - po.x;
    dz = Math.round((po.z + dz) / step) * step - po.z;
  }
  drag.orig.forEach((o) => {
    o.it.x = o.x + dx; o.it.z = o.z + dz;
    placeMesh(meshes.get(o.it.uid), o.it);
  });
  const info = analyse();
  updateHighlights();
  hooks.onLive && hooks.onLive(info);
}
function onPointerUp(e) {
  controls.enabled = true;
  if (drag) {
    if (drag.moved) {
      if (drag.orig.length === 1) snapToWalls(drag.orig[0].it);
      drag.orig.forEach((o) => { o.it.x = Math.round(o.it.x); o.it.z = Math.round(o.it.z); placeMesh(meshes.get(o.it.uid), o.it); });
      const info = analyse();
      updateHighlights();
      hooks.onChange('move', drag.orig.map((o) => o.it.pid).join('+'), info);
    }
    drag = null;
  } else if (down && !down.uid && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 4 && !hooks.isMulti()) {
    setSelection([]);
  }
  down = null;
}

let needsRender = true;
function requestRender() { needsRender = true; }
function loop() {
  requestAnimationFrame(loop);
  if (!el || !el.isConnected) return;
  if (needsRender) {
    helpers.forEach((h) => h.update());
    renderer.render(scene, camera);
    needsRender = false;
  }
}

function resize() {
  if (!el || !renderer) return;
  const w = el.clientWidth, h = el.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  requestRender();
}

function mount(container, h) {
  hooks = h;
  el = container;
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f6f7);
    camera = new THREE.PerspectiveCamera(45, 1, 0.05, 200);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d0c4, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    const sc = sun.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12; sc.far = 40;
    scene.add(sun);
    sun.target.position.set(4, 0, 3); scene.add(sun.target);
    itemsGroup = new THREE.Group();
    scene.add(itemsGroup);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.addEventListener('change', requestRender);
    const cv = renderer.domElement;
    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onPointerMove);
    cv.addEventListener('pointerup', onPointerUp);
    cv.addEventListener('dragover', (e) => e.preventDefault());
    cv.addEventListener('drop', (e) => {
      e.preventDefault();
      const pid = e.dataTransfer.getData('text/plain');
      const fp = floorPoint(e.clientX, e.clientY);
      if (pid && fp && !(hooks.readOnly && hooks.readOnly())) hooks.onDropProduct(pid, Math.round(fp.x), Math.round(fp.z));
    });
    new ResizeObserver(resize).observe(container);
    loop();
  }
  container.appendChild(renderer.domElement);
  resize();
  rebuild();
  setCameraDefault();
}

window.R3D = {
  mount, rebuild, setView, setSelection,
  getSelection: () => [...selected],
  analyse: () => analyse(),
  snapToWalls,
  screenshot: () => { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/png'); },
  resetCamera: () => { setCameraDefault(); requestRender(); },
  // posisi layar item (untuk uji otomatis)
  screenPos: (u) => {
    const g = meshes.get(u); if (!g) return null;
    const v = new THREE.Vector3(); new THREE.Box3().setFromObject(g).getCenter(v); v.project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
  },
  ready: true,
};
window.dispatchEvent(new Event('r3d-ready'));
