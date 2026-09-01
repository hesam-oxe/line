/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — صحنه‌های سه‌بعدی (Three.js)
   ۱) هیرو: خطوط نور شناور + ذرات پارالکس + بلوم + حرکت دوربین با اسکرول
   ۲) شبیه‌ساز: لاین نوری بزرگ با تغییر دمای رنگ و شدت نور
   ═══════════════════════════════════════════════════════════ */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

/* ── تنظیمات مشترک ── */
const IS_MOBILE = matchMedia('(max-width: 768px)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, IS_MOBILE ? 1.5 : 2);

/* ساخت بافت هاله (گرادیان شعاعی روی بوم) */
function makeGlowTexture(inner = 'rgba(255,255,255,1)', mid = 'rgba(255,255,255,.4)') {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, mid);
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  return t;
}

/* مدیریت رندر: بلوم + اندازه + توقف خارج از دید */
function makeComposer(renderer, scene, camera, strength, radius, threshold) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), strength, radius, threshold);
  composer.addPass(bloom);
  return { composer, bloom };
}

function watchResize(canvas, renderer, composer, camera) {
  const onResize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);
  onResize();
  return () => window.removeEventListener('resize', onResize);
}

/* ═══════════════════════════════════════════════════════════
   ۱) صحنه هیرو
   ═══════════════════════════════════════════════════════════ */
function initHero(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: !IS_MOBILE, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.05);

  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(0, 0, 9);

  /* ── خطوط نور شناور (لاین‌های نوری) ── */
  const palette = [0xffb800, 0x00d4ff, 0x8b5cf6, 0xffd766, 0x38e8ff];
  const linesGroup = new THREE.Group();
  scene.add(linesGroup);

  const lines = [];
  const LINE_COUNT = IS_MOBILE ? 10 : 16;
  for (let i = 0; i < LINE_COUNT; i++) {
    const len = 2.5 + Math.random() * 5;
    const geo = new THREE.BoxGeometry(len, 0.05, 0.05);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(palette[i % palette.length]).multiplyScalar(1.7)
    });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(
      (Math.random() - 0.5) * 15,
      (Math.random() - 0.5) * 8.5,
      -2 - Math.random() * 9
    );
    m.rotation.z = (Math.random() - 0.5) * 0.9;
    m.rotation.y = (Math.random() - 0.5) * 0.45;
    m.userData = {
      baseY: m.position.y,
      speed: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06
    };
    linesGroup.add(m);
    lines.push(m);
  }

  /* ── ذرات نورانی با واکنش پارالکس ── */
  const P_COUNT = IS_MOBILE ? 380 : 800;
  const pos = new Float32Array(P_COUNT * 3);
  const col = new Float32Array(P_COUNT * 3);
  const cGold = new THREE.Color(0xffb800);
  const cCyan = new THREE.Color(0x00d4ff);
  const cViolet = new THREE.Color(0x8b5cf6);
  const trio = [cGold, cCyan, cViolet];

  for (let i = 0; i < P_COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 24;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = -1 - Math.random() * 12;
    const c = trio[(Math.random() * 3) | 0];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const points = new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.09,
    map: makeGlowTexture(),
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  }));
  scene.add(points);

  /* ── بلوم ── */
  const { composer, bloom } = makeComposer(renderer, scene, camera, 1.15, 0.7, 0.12);
  const offResize = watchResize(canvas, renderer, composer, camera);

  /* ── موس (پارالکس نرم) ── */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  };
  window.addEventListener('pointermove', onMove, { passive: true });

  /* ── پیشرفت اسکرول (۰ تا ۱) — دوربین جلو می‌رود ── */
  let progress = 0;

  /* ── توقف رندر خارج از دید ── */
  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  const clock = new THREE.Clock();
  let t = 0, raf = 0;

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    /* شناوری نرم خطوط نور */
    for (const m of lines) {
      const u = m.userData;
      m.position.y = u.baseY + Math.sin(t * u.speed + u.phase) * 0.45;
      m.rotation.z += u.rotSpeed * dt;
    }

    /* چرخش آرام ابر ذرات */
    points.rotation.y = t * 0.02;

    /* پارالکس موس */
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    camera.position.x = mouse.x * 0.9;
    camera.position.y = -mouse.y * 0.55;

    /* حرکت دوربین با اسکرول */
    camera.position.z = 9 + progress * 7.5;
    linesGroup.rotation.z = progress * 0.1;
    camera.lookAt(0, 0, -4);

    composer.render();
  }
  loop();

  /* API عمومی صحنه هیرو */
  window.Linenory3D.hero = {
    setProgress(p) { progress = p; }
  };
}

/* ═══════════════════════════════════════════════════════════
   ۲) شبیه‌ساز رنگ نور
   ═══════════════════════════════════════════════════════════ */
function initSimulator(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070d, 0.06);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 1.1, 7.2);
  camera.lookAt(0, -0.1, 0);

  /* ── لاین نوری اصلی (کپسول افقی) ── */
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfff2d9 });
  const line = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 5.6, 8, 24), lineMat);
  line.rotation.z = Math.PI / 2;
  line.position.y = 0.15;
  scene.add(line);

  /* ── هاله‌های نور اطراف لاین ── */
  const glowTex = makeGlowTexture();
  const glowMat = new THREE.SpriteMaterial({
    map: glowTex, color: 0xfff2d9, transparent: true, opacity: 0.4,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(8.2, 2.9, 1);
  glow.position.copy(line.position);
  scene.add(glow);

  const coreMat = new THREE.SpriteMaterial({
    map: glowTex, color: 0xfff2d9, transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const coreGlow = new THREE.Sprite(coreMat);
  coreGlow.scale.set(4.2, 1.15, 1);
  coreGlow.position.copy(line.position);
  scene.add(coreGlow);

  /* ── کف تیره + بازتاب نور ── */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 20),
    new THREE.MeshBasicMaterial({ color: 0x0b0b14 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.35;
  scene.add(floor);

  const floorGlowMat = new THREE.MeshBasicMaterial({
    map: glowTex, color: 0xfff2d9, transparent: true, opacity: 0.22,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const floorGlow = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), floorGlowMat);
  floorGlow.rotation.x = -Math.PI / 2;
  floorGlow.position.set(0, -1.33, 0.6);
  scene.add(floorGlow);

  /* ── غبار نورانی ملایم ── */
  const DUST = 130;
  const dPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3]     = (Math.random() - 0.5) * 14;
    dPos[i * 3 + 1] = (Math.random() - 0.3) * 4;
    dPos[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
    size: 0.05, map: glowTex, color: 0xffe9c4, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false
  }));
  scene.add(dust);

  /* ── بلوم ── */
  const { composer, bloom } = makeComposer(renderer, scene, camera, 1.4, 0.75, 0.1);
  const offResize = watchResize(canvas, renderer, composer, camera);

  /* ── وضعیت نور ── */
  const KELVIN = {
    '6500': new THREE.Color(0xdcecff),  // مهتابی سرد
    '4500': new THREE.Color(0xfff2d9),  // طبیعی
    '3000': new THREE.Color(0xffbf66)   // گرم
  };
  const state = {
    target: KELVIN['4500'].clone(),
    current: new THREE.Color(0xfff2d9),
    brightness: 0.75,
    rgb: false,
    hue: 0.55                     // شروع از آبی تا تغییر حالت RGB فوراً دیده شود
  };
  const tint = new THREE.Color();   // نسخه اشباع‌تر رنگ برای هاله‌ها

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  const clock = new THREE.Clock();
  let t = 0, raf = 0;

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    /* حالت RGB: چرخش رنگین‌کمانی */
    if (state.rgb) {
      state.hue = (state.hue + dt * 0.12) % 1;
      state.target.setHSL(state.hue, 1, 0.55);
    }

    /* ترنزیشن نرم رنگ */
    state.current.lerp(state.target, 0.07);

    /* هاله‌ها با اشباع بالاتر تا رنگ واقعی نور دیده شود */
    tint.copy(state.current).offsetHSL(0, 0.3, -0.05);

    /* شدت نور → روشنایی لاین، هاله، بلوم */
    const k = 0.3 + state.brightness * 1.5;
    lineMat.color.copy(state.current).multiplyScalar(k);
    glowMat.color.copy(tint);
    coreMat.color.copy(tint);
    floorGlowMat.color.copy(tint);
    glowMat.opacity = 0.14 + state.brightness * 0.42;
    coreMat.opacity = 0.2 + state.brightness * 0.55;
    floorGlowMat.opacity = 0.07 + state.brightness * 0.3;
    bloom.strength = 0.45 + state.brightness * 1.5;

    /* شناوری ظریف لاین */
    line.position.y = 0.15 + Math.sin(t * 1.1) * 0.05;
    glow.position.y = line.position.y;
    coreGlow.position.y = line.position.y;
    dust.rotation.y = t * 0.015;

    composer.render();
  }
  loop();

  /* API عمومی شبیه‌ساز */
  window.Linenory3D.sim = {
    setColor(mode) {
      if (mode === 'rgb') {
        state.rgb = true;
      } else if (KELVIN[mode]) {
        state.rgb = false;
        state.target.copy(KELVIN[mode]);
      }
    },
    setBrightness(v) {           // ورودی: ۰ تا ۱
      state.brightness = THREE.MathUtils.clamp(v, 0, 1);
    }
  };
}

/* ═══════════ راه‌اندازی ═══════════ */
window.Linenory3D = window.Linenory3D || {};

const heroCanvas = document.getElementById('heroCanvas');
const simCanvas = document.getElementById('simCanvas');

try {
  if (heroCanvas) initHero(heroCanvas);
  if (simCanvas) initSimulator(simCanvas);
  document.dispatchEvent(new CustomEvent('linenory:3d-ready'));
} catch (err) {
  /* اگر WebGL در دسترس نبود، سایت بدون صحنه سه‌بعدی کار می‌کند */
  console.warn('WebGL init failed:', err);
  [heroCanvas, simCanvas].forEach(c => c && (c.style.display = 'none'));
  document.dispatchEvent(new CustomEvent('linenory:3d-ready'));
}
