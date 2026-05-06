// =====================================================================
// scripts/hydroprint-lab.js
// SIGNATURE 02 · THE HYDROPRINT LAB
// A live WebGL preview of how a pattern will look hydroprinted onto a
// real Studios ceramic mug. Visitors can drop in any image or pick from
// curated Studios patterns, adjust finish and base colour, and see the
// result photographically-lit in 3D. Same tool the studio uses internally
// to preview jobs with clients.
// =====================================================================

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const container = document.getElementById('lab3d');
if (container) boot(container);

function boot(container) {
  // ---- scene ----
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0.4, 0.35, 2.7);

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // ---- lighting (3-point studio) ----
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));

  const key = new THREE.DirectionalLight(0xfff1d8, 1.6);
  key.position.set(3, 5, 3);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 20;
  key.shadow.camera.left = -2;
  key.shadow.camera.right = 2;
  key.shadow.camera.top = 2;
  key.shadow.camera.bottom = -2;
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
    new THREE.CircleGeometry(3.2, 64),
    new THREE.ShadowMaterial({ opacity: 0.32 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.62;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---- the mug ----
  const mug = makeMug();
  scene.add(mug.group);

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

  // OrbitControls' built-in keyboard support only pans (which we disable
  // above) and requires the canvas to hold focus via a tabindex. Mouse and
  // touch are fully wired, but a sighted keyboard-only visitor cannot
  // rotate or zoom. Wire arrow keys + plus/minus directly onto the canvas
  // so the viewer is operable without a pointer. We also make the canvas
  // focusable with a visible focus outline (CSS-side).
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'application');
  canvas.setAttribute(
    'aria-label',
    'Vista previa 3D · flechas para rotar, más/menos para acercar'
  );

  const KEY_ROT = 0.09;   // radians per keystroke
  const KEY_ZOOM = 0.92;  // multiplicative factor per keystroke (<1 = closer)

  function orbitAzimuth(delta) {
    // Rotate camera around target on the Y axis.
    const offset = camera.position.clone().sub(controls.target);
    const s = Math.sin(delta), c = Math.cos(delta);
    const x = offset.x * c - offset.z * s;
    const z = offset.x * s + offset.z * c;
    camera.position.set(x, offset.y, z).add(controls.target);
    camera.lookAt(controls.target);
  }
  function orbitPolar(delta) {
    // Tilt up/down within configured polar limits.
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
    if (handled) {
      controls.autoRotate = false;
      e.preventDefault();
      // Let the animation loop render the change.
    }
  });

  let userInteracting = false;
  controls.addEventListener('start', () => { userInteracting = true; controls.autoRotate = false; });
  controls.addEventListener('end', () => { userInteracting = false; setTimeout(() => { if (!userInteracting) controls.autoRotate = true; }, 4000); });
  // Re-enable autoRotate a few seconds after the last keystroke too.
  canvas.addEventListener('keyup', () => {
    setTimeout(() => { if (!document.activeElement || document.activeElement !== canvas) controls.autoRotate = true; }, 4000);
  });

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
    setPattern(url) {
      if (!url) return this.clearPattern();
      new THREE.TextureLoader().load(url, (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
        mug.body.material.map = tex;
        mug.body.material.needsUpdate = true;
      });
    },
    clearPattern() {
      if (mug.body.material.map) {
        mug.body.material.map.dispose();
        mug.body.material.map = null;
        mug.body.material.needsUpdate = true;
      }
    },
    setBaseColor(hex) {
      mug.body.material.color.setHex(hex);
      mug.handle.material.color.setHex(hex);
    },
    setFinish(finish) {
      const mat = mug.body.material;
      if (finish === 'gloss') {
        mat.roughness = 0.12;
        mat.clearcoat = 0.85;
        mat.clearcoatRoughness = 0.18;
      } else if (finish === 'satin') {
        mat.roughness = 0.32;
        mat.clearcoat = 0.4;
        mat.clearcoatRoughness = 0.32;
      } else {
        mat.roughness = 0.55;
        mat.clearcoat = 0.15;
        mat.clearcoatRoughness = 0.5;
      }
      mug.handle.material.roughness = mat.roughness;
      mug.handle.material.clearcoat = mat.clearcoat;
      mat.needsUpdate = true;
    },
    snapshot() {
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    },
    /**
     * Capture a higher-resolution snapshot for sharing/printing on a quote.
     * Renders at 2x device pixels to a fresh canvas without disturbing the
     * live view. Returns a PNG dataURL.
     */
    snapshotHiRes(width = 1024, height = 1024) {
      const prevSize = renderer.getSize(new THREE.Vector2());
      const prevPR = renderer.getPixelRatio();
      const prevAspect = camera.aspect;
      renderer.setPixelRatio(1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/png');
      // Restore live viewer state.
      renderer.setSize(prevSize.x, prevSize.y, false);
      renderer.setPixelRatio(prevPR);
      camera.aspect = prevAspect;
      camera.updateProjectionMatrix();
      return url;
    },
  };

  // Emit "ready" so the UI controls wiring can enable itself.
  container.dispatchEvent(new CustomEvent('lab:ready'));

  // ---- geometry helpers ---------------------------------------------------
  function makeMug() {
    const group = new THREE.Group();

    const baseMat = new THREE.MeshPhysicalMaterial({
      color: 0xf6f2e8,
      roughness: 0.5,
      metalness: 0,
      clearcoat: 0.2,
      clearcoatRoughness: 0.4,
    });

    // Outer body (slight taper)
    const bodyGeo = new THREE.CylinderGeometry(0.52, 0.46, 1.12, 96, 4, false);
    const body = new THREE.Mesh(bodyGeo, baseMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Inner cavity — darker, matte
    const innerGeo = new THREE.CylinderGeometry(0.49, 0.43, 1.09, 96, 1, true);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x1a1714,
      roughness: 0.95,
      side: THREE.BackSide,
    });
    const inner = new THREE.Mesh(innerGeo, innerMat);
    inner.position.y = 0.01;
    group.add(inner);

    // Top rim (subtle torus highlight)
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(0.5, 0.015, 12, 96),
      baseMat
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.56;
    group.add(rim);

    // Bottom disc
    const bot = new THREE.Mesh(
      new THREE.CircleGeometry(0.46, 64),
      baseMat
    );
    bot.rotation.x = -Math.PI / 2;
    bot.position.y = -0.56;
    bot.receiveShadow = true;
    group.add(bot);

    // Handle — torus segment
    const handleMat = baseMat.clone();
    const handle = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.062, 16, 72, Math.PI * 0.95),
      handleMat
    );
    handle.rotation.z = -Math.PI / 2;
    handle.rotation.y = Math.PI / 2;
    handle.position.set(0.56, 0.02, 0);
    handle.castShadow = true;
    group.add(handle);

    group.rotation.y = 0.35;

    return { group, body, handle };
  }
}
