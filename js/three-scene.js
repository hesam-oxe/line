/* ═══════════════════════════════════════════════════════════
   لاین نوری استار — صحنه‌های سه‌بعدی EXTREME (Three.js)
   ۱) هیرو سینمایی: ستاره مرکزی برند + دنباله‌های نور + ذرات شیدر
   ۲) شبیه‌ساز: اتاق واقعی با سقف کاذب، کابینت و چرخش با درگ
   ۳) استودیو: سه فضای تعاملی (نشیمن / کافه / هتل)
   همه کتابخانه‌ها محلی — بدون CDN خارجی
   ═══════════════════════════════════════════════════════════ */

import * as THREE from './vendor/three.module.js';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';

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
  return new THREE.CanvasTexture(c);
}

/* مدیریت رندر: بلوم + اندازه */
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

/* نوار نور شیشه‌ای (خط کپسولی درخشان) */
function makeLightLine(len, radius, color, horizontal = true) {
  const mat = new THREE.MeshBasicMaterial({ color, fog: false });
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 4, 12), mat);
  if (horizontal) m.rotation.z = Math.PI / 2;
  return m;
}

/* هاله کشیده زیر/اطراف خط نور (پلین افقی یا عمودی با بافت گلوله) */
function makeGlowStrip(w, h, color, tex, opacity = 0.3) {
  const mat = new THREE.MeshBasicMaterial({
    map: tex, color, transparent: true, opacity,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

/* درگ برای چرخش دوربین (پارالکس لمسی) — اسکرول عمودی موبایل حفظ می‌شود */
function makeOrbit(canvas, orb, maxYaw = 0.55, maxPitch = 0.3) {
  let dragging = false, px = 0, py = 0;
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true; px = e.clientX; py = e.clientY;
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
  });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    orb.tyaw   = THREE.MathUtils.clamp(orb.tyaw + (e.clientX - px) * 0.004, -maxYaw, maxYaw);
    orb.tpitch = THREE.MathUtils.clamp(orb.tpitch + (e.clientY - py) * 0.0025, -maxPitch * 0.7, maxPitch);
    px = e.clientX; py = e.clientY;
  }, { passive: true });
  window.addEventListener('pointerup', () => { dragging = false; }, { passive: true });
  window.addEventListener('pointercancel', () => { dragging = false; }, { passive: true });
}

/* بروزرسانی نرم زاویه‌های اوربیت */
function easeOrbit(orb, dt) {
  orb.yaw   += (orb.tyaw - orb.yaw) * Math.min(dt * 5, 1);
  orb.pitch += (orb.tpitch - orb.pitch) * Math.min(dt * 5, 1);
}

/* ═══════════════════════════════════════════════════════════
   ۱) هیرو سینمایی EXTREME
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

  const palette = [0xffb800, 0x00d4ff, 0x8b5cf6, 0xffd766, 0x38e8ff];
  const glowTex = makeGlowTexture();

  /* ── ★ ستاره مرکزی برند ── */
  const star = new THREE.Group();
  star.position.set(0, 0.25, -3.5);

  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffcf5e, fog: false });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), coreMat);
  star.add(core);

  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff, wireframe: true, transparent: true, opacity: 0.4, fog: false
  });
  const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 1), wireMat);
  star.add(wire);

  const starGlowMat = new THREE.SpriteMaterial({
    map: glowTex, color: 0xffb800, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false
  });
  const starGlow = new THREE.Sprite(starGlowMat);
  starGlow.scale.set(4.6, 4.6, 1);
  star.add(starGlow);

  const ringGeo = new THREE.TorusGeometry(1.95, 0.02, 8, 100);
  const ring1Mat = new THREE.MeshBasicMaterial({
    color: 0xffb800, transparent: true, opacity: 0.8,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  const ring1 = new THREE.Mesh(ringGeo, ring1Mat);
  ring1.rotation.x = Math.PI / 2.35;
  star.add(ring1);

  const ring2Mat = new THREE.MeshBasicMaterial({
    color: 0x00d4ff, transparent: true, opacity: 0.65,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  });
  const ring2 = new THREE.Mesh(ringGeo, ring2Mat);
  ring2.rotation.x = -Math.PI / 3.1;
  ring2.rotation.y = Math.PI / 5;
  star.add(ring2);

  /* نقطه‌های مداری روی حلقه‌ها */
  const orbiters = [];
  const orbGeo = new THREE.SphereGeometry(0.055, 10, 10);
  for (let i = 0; i < (IS_MOBILE ? 3 : 5); i++) {
    const mat = new THREE.MeshBasicMaterial({ color: palette[i % palette.length], fog: false });
    const dot = new THREE.Mesh(orbGeo, mat);
    dot.userData = { ring: i % 2 === 0 ? ring1 : ring2, phase: (i / 5) * Math.PI * 2, speed: 0.55 + i * 0.1 };
    star.add(dot);
    orbiters.push(dot);
  }
  scene.add(star);

  /* ── خطوط نور شناور ── */
  const linesGroup = new THREE.Group();
  scene.add(linesGroup);

  const lines = [];
  const LINE_COUNT = IS_MOBILE ? 11 : 17;
  for (let i = 0; i < LINE_COUNT; i++) {
    const vertical = i % 5 === 4;
    const len = 2.5 + Math.random() * 5;
    const geo = new THREE.BoxGeometry(vertical ? 0.05 : len, vertical ? len : 0.05, 0.05);
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
      baseY: m.position.y, baseX: m.position.x,
      speed: 0.3 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.06
    };
    linesGroup.add(m);
    lines.push(m);
  }

  /* ── ذرات شیدر اختصاصی با سوسوی نرم ── */
  const P_COUNT = IS_MOBILE ? 340 : 780;
  const pos = new Float32Array(P_COUNT * 3);
  const col = new Float32Array(P_COUNT * 3);
  const pha = new Float32Array(P_COUNT);
  const spd = new Float32Array(P_COUNT);
  const siz = new Float32Array(P_COUNT);
  const cGold = new THREE.Color(0xffb800), cCyan = new THREE.Color(0x00d4ff), cViolet = new THREE.Color(0x8b5cf6);
  const trio = [cGold, cCyan, cViolet];

  for (let i = 0; i < P_COUNT; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * 24;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 14;
    pos[i * 3 + 2] = -1 - Math.random() * 12;
    const c = trio[(Math.random() * 3) | 0];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    pha[i] = Math.random() * Math.PI * 2;
    spd[i] = 0.6 + Math.random() * 2.2;
    siz[i] = 0.5 + Math.random() * 1.4;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pGeo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  pGeo.setAttribute('aPhase', new THREE.BufferAttribute(pha, 1));
  pGeo.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
  pGeo.setAttribute('aSize', new THREE.BufferAttribute(siz, 1));

  const pMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uPixelRatio: { value: DPR } },
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uPixelRatio;
      attribute vec3 aColor;
      attribute float aPhase;
      attribute float aSpeed;
      attribute float aSize;
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vColor = aColor;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        float tw = sin(uTime * aSpeed + aPhase) * 0.5 + 0.5;
        vAlpha = 0.25 + 0.75 * tw;
        gl_PointSize = aSize * uPixelRatio * (14.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - 0.5;
        float d = length(uv);
        float a = smoothstep(0.5, 0.0, d);
        a = pow(a, 1.9);
        gl_FragColor = vec4(vColor, a * vAlpha);
      }`
  });
  const points = new THREE.Points(pGeo, pMat);
  scene.add(points);

  /* ── دنباله‌های نور (کومت‌های سینمایی) ── */
  const trails = [];
  const TRAIL_COUNT = IS_MOBILE ? 3 : 6;
  for (let i = 0; i < TRAIL_COUNT; i++) {
    const pts = [];
    for (let j = 0; j < 6; j++) {
      pts.push(new THREE.Vector3(
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 8,
        -2 - Math.random() * 8
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    const color = palette[i % palette.length];

    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 70, 0.013, 6, false),
      new THREE.MeshBasicMaterial({
        color, transparent: true, opacity: 0.12,
        blending: THREE.AdditiveBlending, depthWrite: false, fog: false
      })
    );
    scene.add(tube);

    const cometMat = new THREE.SpriteMaterial({
      map: glowTex, color, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const comet = new THREE.Sprite(cometMat);
    comet.scale.set(0.55, 0.55, 1);
    scene.add(comet);

    trails.push({ curve, comet, cometMat, speed: 0.05 + Math.random() * 0.05, offset: Math.random() });
  }

  /* ── بلوم ── */
  const { composer, bloom } = makeComposer(renderer, scene, camera, 1.2, 0.75, 0.1);
  watchResize(canvas, renderer, composer, camera);

  /* ── موس (پارالکس نرم) ── */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  let progress = 0;
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  const clock = new THREE.Clock();
  let t = 0;

  function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    /* ستاره: چرخش برند + تپش قلب */
    star.rotation.y += dt * 0.28;
    wire.rotation.x -= dt * 0.18;
    wire.rotation.z += dt * 0.12;
    const pulse = 1 + Math.sin(t * 1.9) * 0.06;
    core.scale.setScalar(pulse);
    starGlowMat.opacity = 0.42 + Math.sin(t * 1.9) * 0.1 + progress * 0.08;

    /* نقاط مداری */
    for (const d of orbiters) {
      const a = t * d.userData.speed + d.userData.phase;
      const rr = 1.95;
      if (d.userData.ring === ring1) {
        d.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr);
      } else {
        d.position.set(Math.cos(a) * rr, Math.sin(a) * rr * 0.42, Math.sin(a) * rr * 0.3);
      }
    }

    /* شناوری خطوط نور */
    for (const m of lines) {
      const u = m.userData;
      m.position.y = u.baseY + Math.sin(t * u.speed + u.phase) * 0.45;
      m.position.x = u.baseX + Math.cos(t * u.speed * 0.7 + u.phase) * 0.2;
      m.rotation.z += u.rotSpeed * dt;
    }

    /* سوسوی ذرات شیدر */
    pMat.uniforms.uTime.value = t;
    points.rotation.y = t * 0.02;

    /* کومت‌ها روی مسیر */
    for (const tr of trails) {
      const p = (tr.offset + t * tr.speed) % 1;
      tr.curve.getPointAt(p, tr.comet.position);
      tr.cometMat.opacity = 0.55 + Math.sin(p * Math.PI) * 0.4;
    }

    /* پارالکس موس */
    mouse.x += (mouse.tx - mouse.x) * 0.04;
    mouse.y += (mouse.ty - mouse.y) * 0.04;
    camera.position.x = mouse.x * 0.9;
    camera.position.y = -mouse.y * 0.55;

    /* حرکت دوربین با اسکرول + رول سینمایی */
    camera.position.z = 9 + progress * 7.5;
    star.position.y = 0.25 + progress * 2.2;
    linesGroup.rotation.z = progress * 0.1;
    points.rotation.x = progress * 0.05;
    bloom.strength = 1.2 + progress * 0.55;

    camera.lookAt(0, 0, -4);
    camera.rotation.z += progress * 0.07;

    composer.render();
  }
  loop();

  window.Linenory3D.hero = {
    setProgress(p) { progress = p; }
  };
}

/* ═══════════════════════════════════════════════════════════
   ۲) شبیه‌ساز — اتاق واقعی با سقف کاذب + درگ
   ═══════════════════════════════════════════════════════════ */
function initSimulator(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070d, 0.045);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const CAM_R = 7.4;
  const orb = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };
  makeOrbit(canvas, orb, 0.5, 0.22);

  const glowTex = makeGlowTexture();
  const WARM = 0xfff2d9;

  /* ── پوسته اتاق ── */
  const shellMat = new THREE.MeshBasicMaterial({ color: 0x10101c });
  const shellMat2 = new THREE.MeshBasicMaterial({ color: 0x0d0d17 });

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(15, 8), shellMat);
  backWall.position.set(0, 0.6, -3.6);
  scene.add(backWall);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 10), new THREE.MeshBasicMaterial({ color: 0x0b0b14 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.1;
  scene.add(floor);

  const wallL = new THREE.Mesh(new THREE.PlaneGeometry(10, 8), shellMat2);
  wallL.rotation.y = Math.PI / 2;
  wallL.position.set(-5, 0.6, 0);
  scene.add(wallL);

  const wallR = wallL.clone();
  wallR.rotation.y = -Math.PI / 2;
  wallR.position.x = 5;
  scene.add(wallR);

  /* سقف بیرونی (با حفره) — دو نوار بالا و پایین حفره */
  const ceilMat = new THREE.MeshBasicMaterial({ color: 0x0d0d17 });
  const ceilY = 2.5;
  const ceilA = new THREE.Mesh(new THREE.PlaneGeometry(15, 1.6), ceilMat);
  ceilA.rotation.x = Math.PI / 2;
  ceilA.position.set(0, ceilY, -2.8);
  scene.add(ceilA);
  const ceilB = ceilA.clone();
  ceilB.position.set(0, ceilY, 1.8);
  scene.add(ceilB);
  const ceilC = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 4.6), ceilMat);
  ceilC.rotation.x = Math.PI / 2;
  ceilC.position.set(-4.2, ceilY, -0.5);
  scene.add(ceilC);
  const ceilD = ceilC.clone();
  ceilD.position.x = 4.2;
  scene.add(ceilD);

  /* ── فرورفتگی سقف کاذب (کوو) + لاین نوری دور آن ── */
  const COVE_W = 6.8, COVE_D = 3.6, COVE_Y = 2.28;

  const inset = new THREE.Mesh(new THREE.PlaneGeometry(COVE_W, COVE_D), new THREE.MeshBasicMaterial({ color: 0x08080f }));
  inset.rotation.x = Math.PI / 2;
  inset.position.set(0, COVE_Y + 0.18, -0.5);
  scene.add(inset);

  const coveGroup = new THREE.Group();
  const coveMat = new THREE.MeshBasicMaterial({ color: WARM, fog: false });
  const longGeo  = new THREE.CapsuleGeometry(0.045, COVE_W - 0.3, 4, 10);
  const shortGeo = new THREE.CapsuleGeometry(0.045, COVE_D - 0.3, 4, 10);

  const c1 = new THREE.Mesh(longGeo, coveMat);  c1.rotation.z = Math.PI / 2; c1.position.set(0, COVE_Y, -0.5 - COVE_D / 2 + 0.15);
  const c2 = c1.clone();                        c2.position.z = -0.5 + COVE_D / 2 - 0.15;
  const c3 = new THREE.Mesh(shortGeo, coveMat); c3.rotation.x = Math.PI / 2; c3.position.set(-COVE_W / 2 + 0.15, COVE_Y, -0.5);
  const c4 = c3.clone();                        c4.position.x = COVE_W / 2 - 0.15;
  coveGroup.add(c1, c2, c3, c4);

  /* هاله کشیده زیر خطوط کوو */
  const coveGlow = makeGlowStrip(COVE_W - 0.6, COVE_D - 0.6, WARM, glowTex, 0.16);
  coveGlow.rotation.x = Math.PI / 2;
  coveGlow.position.set(0, COVE_Y - 0.1, -0.5);
  coveGroup.add(coveGlow);

  const coveGlowFloor = makeGlowStrip(COVE_W, COVE_D + 1.6, WARM, glowTex, 0.12);
  coveGlowFloor.rotation.x = Math.PI / 2;
  coveGlowFloor.position.set(0, floor.position.y + 0.02, 0.1);
  coveGroup.add(coveGlowFloor);
  scene.add(coveGroup);

  /* ── لاین عمودی واشر دیوار + قفسه/کابینت با نور زیرین ── */
  const washer = makeLightLine(3.4, 0.04, WARM, false);
  washer.position.set(-3.4, 0.4, -3.5);
  scene.add(washer);

  const washerGlow = makeGlowStrip(1.6, 4.6, WARM, glowTex, 0.18);
  washerGlow.position.set(-3.4, 0.4, -3.45);
  scene.add(washerGlow);

  const cabinet = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.1, 0.7), new THREE.MeshBasicMaterial({ color: 0x14141f }));
  cabinet.position.set(1.9, -1.5, -3.15);
  scene.add(cabinet);

  const underGlow = makeGlowStrip(4.4, 1.5, WARM, glowTex, 0.3);
  underGlow.rotation.x = Math.PI / 2;
  underGlow.position.set(1.9, -2.06, -2.9);
  scene.add(underGlow);

  /* ── غبار نورانی ── */
  const DUST = IS_MOBILE ? 70 : 130;
  const dPos = new Float32Array(DUST * 3);
  for (let i = 0; i < DUST; i++) {
    dPos[i * 3]     = (Math.random() - 0.5) * 12;
    dPos[i * 3 + 1] = (Math.random() - 0.3) * 4.5;
    dPos[i * 3 + 2] = (Math.random() - 0.5) * 7;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({
    size: 0.045, map: glowTex, color: 0xffe9c4, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false
  }));
  scene.add(dust);

  /* ── بلوم ── */
  const { composer, bloom } = makeComposer(renderer, scene, camera, 1.35, 0.75, 0.1);
  watchResize(canvas, renderer, composer, camera);

  /* ── وضعیت نور ── */
  const KELVIN = {
    '6500': new THREE.Color(0xdcecff),
    '4500': new THREE.Color(0xfff2d9),
    '3000': new THREE.Color(0xffbf66)
  };
  const state = {
    target: KELVIN['4500'].clone(),
    current: new THREE.Color(0xfff2d9),
    brightness: 0.75,
    rgb: false,
    hue: 0.55
  };
  const tint = new THREE.Color();
  const lit = [coveMat, washer.material];

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  const clock = new THREE.Clock();
  let t = 0;

  function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    if (state.rgb) {
      state.hue = (state.hue + dt * 0.12) % 1;
      state.target.setHSL(state.hue, 1, 0.55);
    }
    state.current.lerp(state.target, 0.07);
    tint.copy(state.current).offsetHSL(0, 0.3, -0.05);

    const k = 0.3 + state.brightness * 1.5;
    for (const m of lit) m.color.copy(state.current).multiplyScalar(k * 1.4);
    coveGlow.material.color.copy(tint);
    coveGlowFloor.material.color.copy(tint);
    washerGlow.material.color.copy(tint);
    underGlow.material.color.copy(tint);

    coveGlow.material.opacity     = 0.06 + state.brightness * 0.2;
    coveGlowFloor.material.opacity = 0.05 + state.brightness * 0.16;
    washerGlow.material.opacity   = 0.08 + state.brightness * 0.24;
    underGlow.material.opacity    = 0.12 + state.brightness * 0.34;
    bloom.strength = 0.5 + state.brightness * 1.5;
    dust.material.color.copy(state.current);

    /* دوربین اوربیت نرم + تابش ملایم خودکار وقتی کاربر درگ نمی‌کند */
    easeOrbit(orb, dt);
    const sway = orb.tyaw === 0 && orb.tpitch === 0 ? Math.sin(t * 0.3) * 0.06 : 0;
    const yaw = orb.yaw + sway;
    camera.position.set(
      Math.sin(yaw) * CAM_R,
      1.0 + orb.pitch * 4.2,
      Math.cos(yaw) * CAM_R
    );
    camera.lookAt(0, 0.35, 0);

    composer.render();
  }
  loop();

  window.Linenory3D.sim = {
    setColor(mode) {
      if (mode === 'rgb') state.rgb = true;
      else if (KELVIN[mode]) { state.rgb = false; state.target.copy(KELVIN[mode]); }
    },
    setBrightness(v) { state.brightness = THREE.MathUtils.clamp(v, 0, 1); }
  };
}

/* ═══════════════════════════════════════════════════════════
   ۳) استودیو — سه فضای تعاملی (نشیمن / کافه / هتل)
   ═══════════════════════════════════════════════════════════ */
function initStudio(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07070d, 0.04);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  const orb = { yaw: 0, pitch: 0, tyaw: 0, tpitch: 0 };
  makeOrbit(canvas, orb, 0.5, 0.22);
  let camR = 9.5, camRT = 9.5;   /* دوربین هنگام تعویض فضا عقب و جلو می‌رود */

  const glowTex = makeGlowTexture();

  /* ── پوسته مشترک ── */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 9), new THREE.MeshBasicMaterial({ color: 0x0b0b14 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.9;
  scene.add(floor);

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.5), new THREE.MeshBasicMaterial({ color: 0x10101c }));
  backWall.position.set(0, 0.8, -3.4);
  scene.add(backWall);

  /* ابزار ساخت لاین با هاله‌اش */
  function lineWithGlow(len, radius, color, pos, glowW, glowH, glowO = 0.2, horizontal = true) {
    const line = makeLightLine(len, radius, color, horizontal);
    line.position.copy(pos);
    const glow = makeGlowStrip(glowW, glowH, color, glowTex, glowO);
    glow.position.copy(pos);
    if (!horizontal) {
      glow.rotation.z = Math.PI / 2;
      glow.position.z += 0.06;
    }
    return { line, glow };
  }

  /* ═══ فضا ۱: نشیمن مدرن (روشن گرم + روسری) ═══ */
  const living = new THREE.Group();
  {
    const GOLD = 0xffd28a;
    const COVE_W = 6.4, COVE_D = 3.2, Y = 2.3;

    const inset = new THREE.Mesh(new THREE.PlaneGeometry(COVE_W, COVE_D), new THREE.MeshBasicMaterial({ color: 0x08080f }));
    inset.rotation.x = Math.PI / 2;
    inset.position.set(0, Y + 0.16, -0.7);
    living.add(inset);

    const a = lineWithGlow(COVE_W - 0.3, 0.045, GOLD, new THREE.Vector3(0, Y, -0.7 - COVE_D / 2 + 0.15), COVE_W - 0.5, 1.1, 0.16);
    const b = lineWithGlow(COVE_W - 0.3, 0.045, GOLD, new THREE.Vector3(0, Y, -0.7 + COVE_D / 2 - 0.15), COVE_W - 0.5, 1.1, 0.16);
    const c = lineWithGlow(COVE_D - 0.3, 0.045, GOLD, new THREE.Vector3(-COVE_W / 2 + 0.15, Y, -0.7), 1.1, COVE_D - 0.5, 0.16, false);
    const d = lineWithGlow(COVE_D - 0.3, 0.045, GOLD, new THREE.Vector3(COVE_W / 2 - 0.15, Y, -0.7), 1.1, COVE_D - 0.5, 0.16, false);
    [a, b, c, d].forEach(x => { living.add(x.line); living.add(x.glow); });

    /* روسری — حلقه نوری سقف */
    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(1.15, 0.04, 8, 80),
      new THREE.MeshBasicMaterial({ color: 0xffe2b0, fog: false })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(0, Y - 0.75, 0.2);
    living.add(halo);

    const haloGlow = makeGlowStrip(3.4, 3.4, GOLD, glowTex, 0.16);
    haloGlow.rotation.x = Math.PI / 2;
    haloGlow.position.copy(halo.position);
    haloGlow.position.y -= 0.08;
    living.add(haloGlow);

    /* دیوار TV: سه خط عمودی */
    for (let i = -1; i <= 1; i++) {
      const v = lineWithGlow(2.6, 0.035, 0xffb800, new THREE.Vector3(i * 1.7, 0.15, -3.3), 0.9, 3.4, 0.14, false);
      living.add(v.line); living.add(v.glow);
    }

    /* مبل انتزاعی */
    const sofa = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.85, 1.3), new THREE.MeshBasicMaterial({ color: 0x15151f }));
    sofa.position.set(0, -1.45, 0.6);
    living.add(sofa);
    const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.8, 0.28), new THREE.MeshBasicMaterial({ color: 0x181824 }));
    sofaBack.position.set(0, -1.05, 1.15);
    living.add(sofaBack);
  }
  scene.add(living);

  /* ═══ فضا ۲: کافه نئون (بنفش/صورتی + سایان) ═══ */
  const cafe = new THREE.Group();
  {
    const VIOLET = 0xb44cff, PINK = 0xff4c9a, CYAN = 0x00d4ff;

    /* حلقه‌های نئون دیوار */
    const ringGeo = new THREE.TorusGeometry(0.95, 0.05, 10, 70);
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: i ? PINK : VIOLET, fog: false }));
      ring.position.set(-2.4 + i * 2.1, 0.9, -3.25);
      cafe.add(ring);
      const g = makeGlowStrip(2.6, 2.6, i ? PINK : VIOLET, glowTex, 0.2);
      g.position.copy(ring.position);
      g.position.z += 0.05;
      cafe.add(g);
    }

    /* موج نئون انعطاف‌پذیر */
    const wavePts = [];
    for (let i = 0; i <= 30; i++) {
      wavePts.push(new THREE.Vector3(-3.6 + i * 0.24, 2.15 + Math.sin(i * 0.55) * 0.32, -3.28));
    }
    const wave = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wavePts), 60, 0.035, 8, false),
      new THREE.MeshBasicMaterial({ color: PINK, fog: false })
    );
    cafe.add(wave);
    const waveGlow = makeGlowStrip(8, 1.6, PINK, glowTex, 0.14);
    waveGlow.position.set(0, 2.15, -3.22);
    cafe.add(waveGlow);

    /* خط لبه کانتر */
    const counter = new THREE.Mesh(new THREE.BoxGeometry(5.4, 1.0, 0.9), new THREE.MeshBasicMaterial({ color: 0x151521 }));
    counter.position.set(0, -1.45, 0.9);
    cafe.add(counter);

    const counterStrip = makeLightLine(5.4, 0.04, CYAN, true);
    counterStrip.position.set(0, -0.93, 0.42);
    cafe.add(counterStrip);

    const counterGlow = makeGlowStrip(5.8, 1.2, CYAN, glowTex, 0.26);
    counterGlow.rotation.x = Math.PI / 2;
    counterGlow.position.set(0, floor.position.y + 0.02, 0.9);
    cafe.add(counterGlow);

    /* آویزهای نور */
    for (let i = -1; i <= 1; i++) {
      const cord = makeLightLine(0.9, 0.012, 0x3a3a52, false);
      cord.position.set(i * 1.5, 2.55, -1.2);
      cafe.add(cord);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), new THREE.MeshBasicMaterial({ color: VIOLET, fog: false }));
      bulb.position.set(i * 1.5, 2.0, -1.2);
      cafe.add(bulb);
      const bg = makeGlowStrip(0.9, 0.9, VIOLET, glowTex, 0.5);
      bg.position.copy(bulb.position);
      cafe.add(bg);
    }
  }
  cafe.visible = false;
  scene.add(cafe);

  /* ═══ فضا ۳: هتل لوکس (سرد ستاره‌باران + طلایی) ═══ */
  const hotel = new THREE.Group();
  let stars = null;   /* سقف ستاره‌باران — برای چشمک در حلقه رندر */
  {
    const CYAN = 0x9fe8ff, GOLD = 0xffb800;

    /* سقف ستاره‌باران */
    const N = IS_MOBILE ? 130 : 240;
    const sPos = new Float32Array(N * 3);
    const sCol = new Float32Array(N * 3);
    const cA = new THREE.Color(0xffffff), cB = new THREE.Color(CYAN);
    for (let i = 0; i < N; i++) {
      sPos[i * 3]     = (Math.random() - 0.5) * 10;
      sPos[i * 3 + 1] = 2.55 + Math.random() * 0.15;
      sPos[i * 3 + 2] = -2.9 + Math.random() * 3.4;
      const c = Math.random() > 0.6 ? cB : cA;
      sCol[i * 3] = c.r; sCol[i * 3 + 1] = c.g; sCol[i * 3 + 2] = c.b;
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    sGeo.setAttribute('color', new THREE.BufferAttribute(sCol, 3));
    const starsPts = new THREE.Points(sGeo, new THREE.PointsMaterial({
      size: 0.06, map: glowTex, vertexColors: true, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false
    }));
    hotel.add(starsPts);
    stars = starsPts;

    /* لاین طولانی لابی */
    const lobby = lineWithGlow(9.5, 0.05, CYAN, new THREE.Vector3(0, 2.3, -0.4), 10, 1.4, 0.16);
    hotel.add(lobby.line); hotel.add(lobby.glow);

    /* ستون‌های طلایی */
    for (const x of [-2.6, 2.6]) {
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.4, 0.5), new THREE.MeshBasicMaterial({ color: 0x161622 }));
      col.position.set(x, 0.3, -1.6);
      hotel.add(col);
      const strip = lineWithGlow(4.2, 0.035, GOLD, new THREE.Vector3(x + 0.27, 0.3, -1.35), 0.8, 4.6, 0.2, false);
      hotel.add(strip.line); hotel.add(strip.glow);
    }

    /* جلوی پذیرش + نور زمین */
    const desk = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.15, 0.8), new THREE.MeshBasicMaterial({ color: 0x15151f }));
    desk.position.set(0, -1.3, -2.6);
    hotel.add(desk);
    const deskGlow = makeGlowStrip(3.8, 1.6, GOLD, glowTex, 0.24);
    deskGlow.rotation.x = Math.PI / 2;
    deskGlow.position.set(0, floor.position.y + 0.02, -2.4);
    hotel.add(deskGlow);
  }
  hotel.visible = false;
  scene.add(hotel);

  const ROOMS = { living, cafe, hotel };

  /* ── بلوم ── */
  const { composer, bloom } = makeComposer(renderer, scene, camera, 1.3, 0.75, 0.1);
  watchResize(canvas, renderer, composer, camera);

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 }).observe(canvas);

  const clock = new THREE.Clock();
  let t = 0;

  function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    /* ستاره‌باران: چشمک */
    if (hotel.visible && stars) {
      stars.material.opacity = 0.75 + Math.sin(t * 2.1) * 0.18;
    }

    /* چرخش آرام حلقه روسری نشیمن */
    if (living.visible) {
      living.children.forEach(o => {
        if (o.geometry && o.geometry.type === 'TorusGeometry') o.rotation.z += dt * 0.15;
      });
    }

    /* دوربین */
    easeOrbit(orb, dt);
    camRT = 9.5;
    camR += (camRT - camR) * Math.min(dt * 2.2, 1);
    const yaw = orb.yaw + Math.sin(t * 0.25) * 0.05;
    camera.position.set(Math.sin(yaw) * camR, 1.35 + orb.pitch * 3.6, Math.cos(yaw) * camR);
    camera.lookAt(0, 0.25, -0.2);

    composer.render();
  }
  loop();

  window.Linenory3D.studio = {
    setRoom(name) {
      Object.entries(ROOMS).forEach(([key, g]) => { g.visible = key === name; });
      camR = 10.6;   /* پول‌بک سینمایی هنگام تعویض */
    }
  };
}

/* ═══════════ راه‌اندازی ═══════════ */
window.Linenory3D = window.Linenory3D || {};

const heroCanvas = document.getElementById('heroCanvas');
const simCanvas = document.getElementById('simCanvas');
const studioCanvas = document.getElementById('studioCanvas');

function boot3D() {
  try { if (heroCanvas) initHero(heroCanvas); }
  catch (err) { console.warn('Hero 3D failed:', err); heroCanvas && (heroCanvas.style.display = 'none'); }

  try { if (simCanvas) initSimulator(simCanvas); }
  catch (err) { console.warn('Simulator 3D failed:', err); simCanvas && (simCanvas.style.display = 'none'); }

  try { if (studioCanvas) initStudio(studioCanvas); }
  catch (err) { console.warn('Studio 3D failed:', err); studioCanvas && (studioCanvas.style.display = 'none'); }

  document.dispatchEvent(new CustomEvent('linenory:3d-ready'));
}

if ('requestIdleCallback' in window && !IS_MOBILE) {
  /* روی دسکتاپ: صحنه‌های پایین‌ صفحه بعد از آماده‌شدن صفحه اصلی */
  requestIdleCallback(boot3D, { timeout: 1800 });
} else {
  boot3D();
}
