// =====================================================================
// scripts/hydroprint-lab.js
// SIGNATURE 02 · THE HYDROPRINT LAB
// A live WebGL preview of how a pattern will look hydroprinted onto a
// real Studios ceramic object. Visitors pick an object type (mug, plate,
// vase, coasters, decorative panel), drop in an image or pick a curated
// pattern, adjust finish and base colour, and see the result
// photographically-lit in 3D. Same tool the studio uses with clients.
// =====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('lab3d');
if (container) boot(container);

function boot(container) {
  // ---- scene ----
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0.5, 0.45, 2.8);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // ---- lighting (3-point studio) ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));

  const key = new THREE.DirectionalLight(0xfff1d8, 1.6);
  key.position.set(3, 5, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -2.5;
  key.shadow.camera.right = 2.5;
  key.shadow.camera.top = 2.5;
  key.shadow.camera.bottom = -2.5;
  key.shadow.bias = -0.0005;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xaacfe8, 0.55);
  fill.position.set(-3, 2, -1);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xe83c1e, 0.4);
  rim.position.set(0, 1.2, -3);
  scene.add(rim);

  // ---- ground shadow catcher ----
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(3.4, 64),
    new THREE.ShadowMaterial({ opacity: 0.32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.62;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- orbit ----
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 1.9;
  controls.maxDistance = 4.4;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.maxPolarAngle = Math.PI * 0.62;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.45;
  controls.target.set(0, 0, 0);

  // Keyboard a11y: arrow keys rotate, +/- zoom (OrbitControls' own keys only
  // pan, which we disable). Canvas is focusable with a visible focus ring.
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Vista previa 3D · flechas para rotar, más/menos para acercar');

  const KEY_ROT = 0.09;
  const KEY_ZOOM = 0.92;

  function orbitAzimuth(delta) {
    const offset = camera.position.clone().sub(controls.target);
    const s = Math.sin(delta), c = Math.cos(delta);
    const x = offset.x * c - offset.z * s;
    const z = offset.x * s + offset.z * c;
    camera.position.set(x, offset.y, z).add(controls.target);
    camera.lookAt(controls.target);
  }
  function orbitPolar(delta) {
    const offset = camera.position.clone().sub(controls.target);
    const r = offset.length();
    let polar = Math.acos(Math.max(-1, Math.min(1, offset.y / r)));
    polar = Math.max(controls.minPolarAngle + 0.001,
                     Math.min(controls.maxPolarAngle - 0.001, polar + delta));
    const azimuth = Math.atan2(offset.x, offset.z);
    camera.position.set(
      r * Math.sin(polar) * Math.sin(azimuth),
      r * Math.cos(polar),
      r * Math.sin(polar) * Math.cos(azimuth),
    ).add(controls.target);
    camera.lookAt(controls.target);
  }
  function zoom(factor) {
    const offset = camera.position.clone().sub(controls.target);
    const r = Math.max(controls.minDistance,
                       Math.min(controls.maxDistance, offset.length() * factor));
    offset.setLength(r);
    camera.position.copy(controls.target).add(offset);
  }

  canvas.addEventListener('keydown', (e) => {
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':  orbitAzimuth(-KEY_ROT); break;
      case 'ArrowRight': orbitAzimuth(+KEY_ROT); break;
      case 'ArrowUp':    orbitPolar(-KEY_ROT); break;
      case 'ArrowDown':  orbitPolar(+KEY_ROT); break;
      case '+': case '=': zoom(KEY_ZOOM); break;
      case '-': case '_': zoom(1 / KEY_ZOOM); break;
      default: handled = false;
    }
    if (handled) { controls.autoRotate = false; e.preventDefault(); }
  });

  let userInteracting = false;
  controls.addEventListener('start', () => { userInteracting = true; controls.autoRotate = false; });
  controls.addEventListener('end', () => { userInteracting = false; setTimeout(() => { if (!userInteracting) controls.autoRotate = true; }, 4000); });
  canvas.addEventListener('keyup', () => {
    setTimeout(() => { if (!document.activeElement || document.activeElement !== canvas) controls.autoRotate = true; }, 4000);
  });

  // ---- materials / finish ----
  const FINISHES = {
    gloss: { roughness: 0.12, clearcoat: 0.85, ccr: 0.18 },
    satin: { roughness: 0.32, clearcoat: 0.40, ccr: 0.32 },
    matte: { roughness: 0.55, clearcoat: 0.15, ccr: 0.50 },
  };
  const ceramic = () => new THREE.MeshPhysicalMaterial({
    color: 0xf6f2e8, roughness: 0.32, metalness: 0,
    clearcoat: 0.4, clearcoatRoughness: 0.32, side: THREE.DoubleSide,
  });

  // ---- per-type camera framing ----
  const FRAMES = {
    mug:     { pos: [0.5, 0.45, 2.8],  target: [0, 0, 0],     min: 1.9, max: 4.4, polar: [0.18, 0.62] },
    plate:   { pos: [0.45, 1.75, 2.1], target: [0, -0.18, 0], min: 2.0, max: 4.8, polar: [0.05, 0.58] },
    vase:    { pos: [0.55, 0.5, 3.15], target: [0, 0, 0],     min: 2.2, max: 5.0, polar: [0.18, 0.62] },
    coaster: { pos: [0.4, 1.55, 2.1],  target: [0, -0.32, 0], min: 1.8, max: 4.4, polar: [0.06, 0.55] },
    panel:   { pos: [0.18, 0.12, 2.7], target: [0, 0, 0],     min: 2.0, max: 4.6, polar: [0.34, 0.60] },
  };
  function frame(type) {
    const f = FRAMES[type] || FRAMES.mug;
    controls.minDistance = f.min;
    controls.maxDistance = f.max;
    controls.minPolarAngle = Math.PI * f.polar[0];
    controls.maxPolarAngle = Math.PI * f.polar[1];
    controls.target.set(...f.target);
    camera.position.set(...f.pos);
    camera.lookAt(controls.target);
    controls.update();
  }

  // ---- object factories -----------------------------------------------------
  // Each returns { group, surfaceMat (gets the hydroprint pattern), mats
  // (all ceramic materials — receive base colour + finish) }.
  function objMug() {
    const group = new THREE.Group();
    const mat = ceramic();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.46, 1.12, 96, 4, false), mat);
    body.castShadow = true; body.receiveShadow = true; group.add(body);
    const inner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.49, 0.43, 1.09, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x1a1714, roughness: 0.95, side: THREE.BackSide })
    );
    inner.position.y = 0.01; group.add(inner);
    const topRim = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.015, 12, 96), mat);
    topRim.rotation.x = Math.PI / 2; topRim.position.y = 0.56; group.add(topRim);
    const bot = new THREE.Mesh(new THREE.CircleGeometry(0.46, 64), mat);
    bot.rotation.x = -Math.PI / 2; bot.position.y = -0.56; bot.receiveShadow = true; group.add(bot);
    const handleMat = ceramic();
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.062, 16, 72, Math.PI * 0.95), handleMat);
    handle.rotation.z = -Math.PI / 2; handle.rotation.y = Math.PI / 2;
    handle.position.set(0.56, 0.02, 0); handle.castShadow = true; group.add(handle);
    group.rotation.y = 0.35;
    return { group, surfaceMat: mat, mats: [mat, handleMat] };
  }

  function objPlate() {
    const group = new THREE.Group();
    const mat = ceramic();
    const pts = [
      new THREE.Vector2(0.00, -0.02),
      new THREE.Vector2(0.42, 0.00),
      new THREE.Vector2(0.74, 0.04),
      new THREE.Vector2(0.92, 0.14),
      new THREE.Vector2(1.02, 0.18),
      new THREE.Vector2(1.04, 0.15),
    ];
    const plate = new THREE.Mesh(new THREE.LatheGeometry(pts, 128), mat);
    plate.castShadow = true; plate.receiveShadow = true;
    plate.position.y = -0.5;
    group.add(plate);
    return { group, surfaceMat: mat, mats: [mat] };
  }

  function objVase() {
    const group = new THREE.Group();
    const mat = ceramic();
    const pts = [
      new THREE.Vector2(0.00, -0.66),
      new THREE.Vector2(0.30, -0.66),
      new THREE.Vector2(0.35, -0.50),
      new THREE.Vector2(0.47, -0.15),
      new THREE.Vector2(0.45, 0.18),
      new THREE.Vector2(0.27, 0.46),
      new THREE.Vector2(0.30, 0.64),
      new THREE.Vector2(0.27, 0.66),
    ];
    const vase = new THREE.Mesh(new THREE.LatheGeometry(pts, 128), mat);
    vase.castShadow = true; vase.receiveShadow = true;
    group.add(vase);
    group.rotation.y = 0.3;
    return { group, surfaceMat: mat, mats: [mat] };
  }

  function objCoasters() {
    const group = new THREE.Group();
    const mat = ceramic();
    const r = 0.5, h = 0.07;
    const jitter = [[-0.02, 0.015], [0.018, -0.01], [-0.012, -0.02], [0.01, 0.018]];
    for (let i = 0; i < 4; i++) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 80), mat);
      c.position.set(jitter[i][0], -0.5 + i * (h + 0.02), jitter[i][1]);
      c.rotation.y = i * 0.14;
      c.castShadow = true; c.receiveShadow = true;
      group.add(c);
    }
    return { group, surfaceMat: mat, mats: [mat] };
  }

  function objPanel() {
    const group = new THREE.Group();
    const mat = ceramic();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.2, 0.06), mat);
    panel.castShadow = true; panel.receiveShadow = true;
    group.add(panel);
    return { group, surfaceMat: mat, mats: [mat] };
  }

  const OBJECTS = { mug: objMug, plate: objPlate, vase: objVase, coaster: objCoasters, panel: objPanel };

  // ---- swappable object state ----
  let patternTex = null;
  const labState = { type: 'mug', color: 0xf6f2e8, finish: 'satin' };
  let current = null;

  function applyColor(hex) {
    labState.color = hex;
    if (current) current.mats.forEach((m) => m.color.setHex(hex));
  }
  function applyFinish(finish) {
    labState.finish = finish;
    const p = FINISHES[finish] || FINISHES.satin;
    if (current) current.mats.forEach((m) => {
      m.roughness = p.roughness; m.clearcoat = p.clearcoat; m.clearcoatRoughness = p.ccr; m.needsUpdate = true;
    });
  }
  function applyPattern() {
    if (!current) return;
    current.surfaceMat.map = patternTex || null;
    current.surfaceMat.needsUpdate = true;
  }
  function setObject(type) {
    if (current) {
      scene.remove(current.group);
      current.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    }
    current = (OBJECTS[type] || OBJECTS.mug)();
    labState.type = type;
    scene.add(current.group);
    applyColor(labState.color);
    applyFinish(labState.finish);
    applyPattern();
    frame(type);
  }

  setObject('mug');

  // ---- animate ----
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // ---- resize ----
  const ro = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w > 0 && h > 0) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  });
  ro.observe(container);

  // ---- public API ---------------------------------------------------------
  window.__hydroprintLab = {
    setObjectType(type) { setObject(type); },
    setPattern(url) {
      if (!url) return this.clearPattern();
      new THREE.TextureLoader().load(url, (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        if (patternTex) patternTex.dispose();
        patternTex = tex;
        applyPattern();
      });
    },
    clearPattern() {
      if (patternTex) { patternTex.dispose(); patternTex = null; }
      applyPattern();
    },
    setBaseColor(hex) {
      applyColor(typeof hex === 'string' ? parseInt(hex.replace('#', ''), 16) : hex);
    },
    setFinish(finish) { applyFinish(finish); },
    snapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
  };

  // Emit "ready" so the UI controls wiring can enable itself.
  container.dispatchEvent(new CustomEvent('lab:ready'));
}
