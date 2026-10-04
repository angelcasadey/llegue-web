/* ===========================================================
   Llegué — Demo animada del hero
   ---------------------------------------------------------
   • Sin librerías: Web Animations API (opacity/transform).
   • Se pausa solo cuando el hero sale de pantalla o la
     pestaña está oculta.
   • Respeta prefers-reduced-motion (muestra una pantalla fija).
   • Sin JS: el HTML ya muestra la primera pantalla.

   CÓMO AGREGAR O CAMBIAR UNA ESCENA
   1. Agrega/reemplaza el <img class="demo__scene"> en el HTML
      (en el mismo orden que SCENE_STARTS).
   2. Ajusta SCENE_STARTS y TOTAL.
   3. Si la escena lleva toque / aro, añádelo en EFFECTS.
   Las coordenadas son % de la pantalla (x: 0-100, y: 0-100).
   =========================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-llegue-demo]');
  if (!root || typeof root.animate !== 'function') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var screen = root.querySelector('.demo__screen');
  var scenes = Array.prototype.slice.call(screen.querySelectorAll('.demo__scene'));
  if (scenes.length < 2) return;

  /* ---------- LÍNEA DE TIEMPO (ms) ---------- */
  var TOTAL = 15500;   // duración del ciclo completo
  var FADE = 360;      // fundido entre pantallas

  // Momento en que entra cada pantalla (misma cantidad que los <img>)
  //   0 empleado listo · 1 check-in registrado · 2 admin ve "Puntual"
  //   3 empleado salida pendiente · 4 admin por aprobar · 5 aprobado
  var SCENE_STARTS = [0, 2200, 4500, 7200, 9000, 10900];

  // La primera pantalla vuelve a entrar sobre la última (loop sin corte)
  var LOOP_AT = 14600;

  /* ---------- EFECTOS ---------- */
  var EFFECTS = [
    // Escena 0: el empleado toca "Registrar entrada"
    { type: 'tap',   x: 50,   y: 25.9, at: 1050 },
    { type: 'press', x: 28.4, y: 15.2, w: 43.2, h: 21.4, radius: '26%', at: 1050 },

    // Escena 2: el admin ve al empleado "Puntual" (aro doble)
    { type: 'pulse', x: 84.5, y: 34.2, w: 20, h: 4.6, at: 5000 },
    { type: 'pulse', x: 84.5, y: 34.2, w: 20, h: 4.6, at: 5900 },

    // Escena 4: el admin toca "Aprobar"
    { type: 'tap',   x: 28.2, y: 60.4, at: 10250 },
    { type: 'press', x: 7.9,  y: 58.1, w: 40.7, h: 4.4, radius: '14px', at: 10250 }
  ];

  /* ---------- utilidades ---------- */
  var anims = [];
  var OPTS = { duration: TOTAL, iterations: Infinity, easing: 'linear' };

  function frac(ms) { return Math.min(Math.max(ms / TOTAL, 0), 1); }

  function el(tag, cls) {
    var n = document.createElement(tag);
    n.className = cls;
    screen.appendChild(n);
    return n;
  }

  function run(node, keyframes) {
    var a = node.animate(keyframes, OPTS);
    anims.push(a);
  }

  /* opacidad de una pantalla: entra con fundido sobre la anterior y se
     retira en corte duro cuando la siguiente ya la cubre al 100 % */
  function sceneKeyframes(inAt, outAt) {
    var k = [];
    if (inAt === null) {
      k.push({ opacity: 1, offset: 0 });
    } else {
      k.push({ opacity: 0, offset: 0 });
      k.push({ opacity: 0, offset: frac(inAt), easing: 'ease-out' });
      k.push({ opacity: 1, offset: frac(inAt + FADE) });
    }
    k.push({ opacity: 1, offset: frac(outAt) });
    k.push({ opacity: 0, offset: frac(outAt) });
    k.push({ opacity: 0, offset: 1 });
    return k;
  }

  /* ---------- construcción ---------- */
  function build() {
    // Pantallas
    scenes.forEach(function (img, i) {
      var inAt = i === 0 ? null : SCENE_STARTS[i];
      var next = i < scenes.length - 1 ? SCENE_STARTS[i + 1] : LOOP_AT;
      run(img, sceneKeyframes(inAt, next + FADE));
    });

    // Copia de la primera pantalla que cierra el loop encima de la última
    var ghost = scenes[0].cloneNode(false);
    ghost.setAttribute('aria-hidden', 'true');
    ghost.removeAttribute('fetchpriority');
    screen.appendChild(ghost);   // al final = por encima de todas las pantallas
    run(ghost, sceneKeyframes(LOOP_AT, TOTAL));

    // Efectos
    EFFECTS.forEach(function (fx) {
      if (fx.type === 'tap') addTap(fx);
      if (fx.type === 'press') addPress(fx);
      if (fx.type === 'pulse') addPulse(fx);
    });

    root.setAttribute('data-ready', 'true');
  }

  var CENTER = 'translate(-50%, -50%) ';

  function addTap(fx) {
    var dot = el('div', 'demo__touch');
    var ring = el('div', 'demo__ripple');
    var from = { left: (fx.x + 16) + '%', top: (fx.y + 12) + '%' };
    var to = { left: fx.x + '%', top: fx.y + '%' };
    var a0 = fx.at - 600;

    function f(ms, o) {
      var base = { offset: frac(ms) };
      for (var p in o) base[p] = o[p];
      return base;
    }

    // dedo: llega desde abajo-derecha, toca, se retira
    run(dot, [
      f(0,          { opacity: 0, left: from.left, top: from.top, transform: CENTER + 'scale(.7)' }),
      f(a0,         { opacity: 0, left: from.left, top: from.top, transform: CENTER + 'scale(.7)', easing: 'ease-out' }),
      f(a0 + 220,   { opacity: 1, left: from.left, top: from.top, transform: CENTER + 'scale(.7)' }),
      f(fx.at,      { opacity: 1, left: to.left,   top: to.top,   transform: CENTER + 'scale(1)' }),
      f(fx.at + 130,{ opacity: 1, left: to.left,   top: to.top,   transform: CENTER + 'scale(.8)' }),
      f(fx.at + 300,{ opacity: 1, left: to.left,   top: to.top,   transform: CENTER + 'scale(1)' }),
      f(fx.at + 620,{ opacity: 0, left: to.left,   top: to.top,   transform: CENTER + 'scale(1)' }),
      f(TOTAL,      { opacity: 0, left: to.left,   top: to.top,   transform: CENTER + 'scale(1)' })
    ]);

    // onda expansiva desde el punto de toque
    ring.style.left = to.left;
    ring.style.top = to.top;
    run(ring, [
      f(0,           { opacity: 0,   transform: CENTER + 'scale(.5)' }),
      f(fx.at,       { opacity: 0,   transform: CENTER + 'scale(.5)', easing: 'ease-out' }),
      f(fx.at + 100, { opacity: 0.6, transform: CENTER + 'scale(.6)' }),
      f(fx.at + 650, { opacity: 0,   transform: CENTER + 'scale(2)' }),
      f(TOTAL,       { opacity: 0,   transform: CENTER + 'scale(2)' })
    ]);
  }

  function addPress(fx) {
    var n = el('div', 'demo__press');
    n.style.left = fx.x + '%';
    n.style.top = fx.y + '%';
    n.style.width = fx.w + '%';
    n.style.height = fx.h + '%';
    n.style.borderRadius = fx.radius || '12px';
    run(n, [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: frac(fx.at), easing: 'ease-out' },
      { opacity: 1, offset: frac(fx.at + 90) },
      { opacity: 0, offset: frac(fx.at + 420) },
      { opacity: 0, offset: 1 }
    ]);
  }

  function addPulse(fx) {
    var n = el('div', 'demo__pulse');
    n.style.left = fx.x + '%';
    n.style.top = fx.y + '%';
    n.style.width = fx.w + '%';
    n.style.height = fx.h + '%';
    run(n, [
      { opacity: 0,   transform: CENTER + 'scale(.9)',  offset: 0 },
      { opacity: 0,   transform: CENTER + 'scale(.9)',  offset: frac(fx.at), easing: 'ease-out' },
      { opacity: 0.75,transform: CENTER + 'scale(1)',   offset: frac(fx.at + 120) },
      { opacity: 0,   transform: CENTER + 'scale(1.35)',offset: frac(fx.at + 800) },
      { opacity: 0,   transform: CENTER + 'scale(1.35)',offset: 1 }
    ]);
  }

  /* ---------- ahorro de batería: pausa fuera de pantalla ---------- */
  function setPlaying(on) {
    anims.forEach(function (a) { on ? a.play() : a.pause(); });
  }

  function watch() {
    var visible = true;
    var tabVisible = !document.hidden;
    function sync() { setPlaying(visible && tabVisible); }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.2 }).observe(root);
    }
    document.addEventListener('visibilitychange', function () {
      tabVisible = !document.hidden;
      sync();
    });
  }

  /* ---------- arranque: espera a que las imágenes estén decodificadas ---------- */
  var ready = scenes.map(function (img) {
    return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  });
  Promise.all(ready).then(function () {
    build();
    watch();
  });
})();
