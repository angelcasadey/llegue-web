/* ===========================================================
   Llegué — Demo animada de Eventos (dos teléfonos)
   ---------------------------------------------------------
   • Sin librerías: Web Animations API (opacity/transform).
   • Una sola línea de tiempo (TOTAL) compartida por los dos
     teléfonos, así quedan siempre sincronizados.
   • Pausa fuera de pantalla / pestaña oculta; respeta
     prefers-reduced-motion; sin JS se ve la primera pantalla.

   CÓMO EDITARLA
   1. Pantallas: el orden de los <img>/<div class="ev__scene"> en
      el HTML debe coincidir con PHONES[rol].starts.
   2. Quién tiene el foco (el otro se atenúa): FOCUS.
   3. Toques, aros, scanner: EFFECTS (coordenadas = % de pantalla).
   =========================================================== */
(function () {
  'use strict';

  var root = document.querySelector('[data-llegue-eventos]');
  if (!root || typeof root.animate !== 'function') return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ---------- LÍNEA DE TIEMPO (ms) ---------- */
  var TOTAL = 19200;    // ciclo completo
  var FADE = 360;       // fundido entre pantallas
  var DIM = 420;        // transición de foco entre teléfonos
  var LOOP_AT = 18300;  // la primera pantalla vuelve a entrar encima

  /* Momento en que entra cada pantalla de cada teléfono
     org : 0 crear evento · 1 evento creado · 2 asistente pendiente ·
           3 detalle + Aprobar · 4 scanner (CSS) · 5 acceso confirmado (CSS)
     spec: 0 inicio · 1 buscar · 2 evento · 3 registro · 4 pendiente ·
           5 aprobado · 6 QR                                              */
  var PHONES = {
    org:  { starts: [0, 3200, 7400, 9600, 14200, 16600] },
    spec: { starts: [0, 4000, 5000, 6100, 7400, 11700, 13100] }
  };

  /* Ventanas en las que cada teléfono "tiene el foco" */
  var FOCUS = {
    org:  [[0, 3400], [7400, 11700], [14200, TOTAL]],
    spec: [[3400, 7400], [11700, 18300]]
  };

  /* ---------- EFECTOS ---------- */
  var EFFECTS = {
    org: [
      // pantalla 0: se resaltan los tipos de boleto
      { type: 'pulse', x: 44.2, y: 72.9, w: 84, h: 7.2, at: 1100 },
      { type: 'pulse', x: 44.2, y: 72.9, w: 84, h: 7.2, at: 2000 },
      // pantalla 2: abre a la asistente pendiente
      { type: 'tap',   x: 50, y: 35.7, at: 8700 },
      { type: 'press', x: 0, y: 33.2, w: 100, h: 5.2, radius: '0', at: 8700 },
      // pantalla 3: toca "Aprobar"
      { type: 'tap',   x: 26.9, y: 95.6, at: 11200 },
      { type: 'press', x: 5.1, y: 94.2, w: 43.8, h: 3.2, radius: '12px', at: 11200 },
      // pantallas 4-5: scanner y acceso confirmado
      { type: 'scanline', at: 14550 },
      { type: 'draw', at: 16700 }
    ],
    spec: [
      // "Buscar evento"
      { type: 'tap',   x: 50, y: 16.5, at: 3600 },
      { type: 'press', x: 5.1, y: 13.2, w: 89.9, h: 6.7, radius: '20px', at: 3600 },
      // resultado de búsqueda
      { type: 'tap',   x: 50, y: 91.4, at: 4750 },
      { type: 'press', x: 4.1, y: 85.8, w: 91.8, h: 11, radius: '16px', at: 4750 },
      // "Registrarme a este evento"
      { type: 'tap',   x: 50, y: 94.9, at: 5800 },
      { type: 'press', x: 4.1, y: 91.9, w: 91.8, h: 6.1, radius: '14px', at: 5800 },
      // "Enviar registro"
      { type: 'tap',   x: 50, y: 90.5, at: 7050 },
      { type: 'press', x: 4.1, y: 87.4, w: 91.8, h: 6.1, radius: '14px', at: 7050 },
      // toca la tarjeta aprobada para ver su QR
      { type: 'tap',   x: 50, y: 30.7, at: 12600 },
      { type: 'press', x: 4.2, y: 24.4, w: 91.7, h: 12.6, radius: '18px', at: 12600 }
    ]
  };

  /* ---------- utilidades ---------- */
  var anims = [];
  var OPTS = { duration: TOTAL, iterations: Infinity, easing: 'linear' };
  var CENTER = 'translate(-50%, -50%) ';

  function frac(ms) { return Math.min(Math.max(ms / TOTAL, 0), 1); }
  function merge(a, b) { for (var k in b) a[k] = b[k]; return a; }
  function run(node, keyframes) { anims.push(node.animate(keyframes, OPTS)); }
  function mk(screen, tag, cls) {
    var n = document.createElement(tag);
    n.className = cls;
    screen.appendChild(n);
    return n;
  }
  function kf(ms, props) { return merge({ offset: frac(ms) }, props); }

  /* opacidad de una pantalla: entra con fundido encima de la anterior y se
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

  /* foco: el teléfono activo va al frente; el otro se atenúa */
  var ON  = { opacity: 1,    transform: 'scale(1)',    zIndex: 2 };
  var OFF = { opacity: 0.5,  transform: 'scale(.965)', zIndex: 1 };

  function focusKeyframes(windows) {
    function active(t) {
      for (var i = 0; i < windows.length; i++) if (t >= windows[i][0] && t < windows[i][1]) return true;
      return false;
    }
    var pts = [];
    windows.forEach(function (w) { pts.push(w[0], w[1]); });
    pts = pts.filter(function (p, i) { return p > 0 && p < TOTAL && pts.indexOf(p) === i; })
             .sort(function (a, b) { return a - b; });

    var k = [merge({ offset: 0 }, active(0) ? ON : OFF)];
    pts.forEach(function (p) {
      var before = active(p - 1), after = active(p + 1);
      if (before === after) return;
      k.push(merge({ offset: frac(p), easing: 'ease-out' }, before ? ON : OFF));
      k.push(merge({ offset: frac(p + DIM) }, after ? ON : OFF));
    });
    k.push(merge({ offset: 1 }, active(TOTAL - 1) ? ON : OFF));
    return k;
  }

  /* ---------- efectos ---------- */
  function addTap(screen, fx) {
    var dot = mk(screen, 'div', 'ev__touch');
    var ring = mk(screen, 'div', 'ev__ripple');
    var from = { left: (fx.x + 16) + '%', top: (fx.y + 12) + '%' };
    var to = { left: fx.x + '%', top: fx.y + '%' };
    var a0 = fx.at - 600;
    var hide = merge({ opacity: 0, transform: CENTER + 'scale(.7)' }, from);

    run(dot, [
      kf(0,           hide),
      kf(a0,          merge({ easing: 'ease-out' }, hide)),
      kf(a0 + 220,    merge({ opacity: 1, transform: CENTER + 'scale(.7)' }, from)),
      kf(fx.at,       merge({ opacity: 1, transform: CENTER + 'scale(1)' }, to)),
      kf(fx.at + 130, merge({ opacity: 1, transform: CENTER + 'scale(.8)' }, to)),
      kf(fx.at + 300, merge({ opacity: 1, transform: CENTER + 'scale(1)' }, to)),
      kf(fx.at + 620, merge({ opacity: 0, transform: CENTER + 'scale(1)' }, to)),
      kf(TOTAL,       merge({ opacity: 0, transform: CENTER + 'scale(1)' }, to))
    ]);

    ring.style.left = to.left;
    ring.style.top = to.top;
    run(ring, [
      kf(0,           { opacity: 0,   transform: CENTER + 'scale(.5)' }),
      kf(fx.at,       { opacity: 0,   transform: CENTER + 'scale(.5)', easing: 'ease-out' }),
      kf(fx.at + 100, { opacity: 0.6, transform: CENTER + 'scale(.6)' }),
      kf(fx.at + 650, { opacity: 0,   transform: CENTER + 'scale(2)' }),
      kf(TOTAL,       { opacity: 0,   transform: CENTER + 'scale(2)' })
    ]);
  }

  function addPress(screen, fx) {
    var n = mk(screen, 'div', 'ev__press');
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

  function addPulse(screen, fx) {
    var n = mk(screen, 'div', 'ev__pulse');
    n.style.left = fx.x + '%';
    n.style.top = fx.y + '%';
    n.style.width = fx.w + '%';
    n.style.height = fx.h + '%';
    run(n, [
      { opacity: 0,    transform: CENTER + 'scale(.94)', offset: 0 },
      { opacity: 0,    transform: CENTER + 'scale(.94)', offset: frac(fx.at), easing: 'ease-out' },
      { opacity: 0.75, transform: CENTER + 'scale(1)',   offset: frac(fx.at + 120) },
      { opacity: 0,    transform: CENTER + 'scale(1.12)',offset: frac(fx.at + 800) },
      { opacity: 0,    transform: CENTER + 'scale(1.12)',offset: 1 }
    ]);
  }

  /* línea del scanner: baja y sube dentro del visor (dos pasadas) */
  function addScanline(screen, fx) {
    var line = screen.querySelector('.ev__scan-line');
    if (!line) return;
    run(line, [
      kf(0,           { opacity: 0, top: '4%' }),
      kf(fx.at,       { opacity: 0, top: '4%', easing: 'ease-out' }),
      kf(fx.at + 120, { opacity: 1, top: '4%', easing: 'ease-in-out' }),
      kf(fx.at + 900, { opacity: 1, top: '94%', easing: 'ease-in-out' }),
      kf(fx.at + 1700,{ opacity: 1, top: '4%' }),
      kf(fx.at + 1850,{ opacity: 0, top: '4%' }),
      kf(TOTAL,       { opacity: 0, top: '4%' })
    ]);
  }

  /* palomita del acceso confirmado: se dibuja */
  function addDraw(screen, fx) {
    var path = screen.querySelector('.ev__ok-check path');
    if (!path) return;
    run(path, [
      kf(0,         { strokeDashoffset: 30 }),
      kf(fx.at,     { strokeDashoffset: 30, easing: 'ease-out' }),
      kf(fx.at + 520, { strokeDashoffset: 0 }),
      kf(TOTAL,     { strokeDashoffset: 0 })
    ]);
  }

  /* etiquetas de rol que cambian en el tiempo (data-windows="0-14200,18300-19200") */
  function tagKeyframes(spec) {
    var wins = spec.split(',').map(function (s) {
      var p = s.split('-'); return [parseInt(p[0], 10), parseInt(p[1], 10)];
    });
    var k = [];
    var startsVisible = wins.some(function (w) { return w[0] === 0; });
    k.push({ opacity: startsVisible ? 1 : 0, offset: 0 });
    wins.forEach(function (w) {
      if (w[0] > 0) {
        k.push({ opacity: 0, offset: frac(w[0] + 140) });
        k.push({ opacity: 1, offset: frac(w[0] + 360) });
      }
      if (w[1] < TOTAL) {
        k.push({ opacity: 1, offset: frac(w[1]) });
        k.push({ opacity: 0, offset: frac(w[1] + 140) });
      }
    });
    var endsVisible = wins.some(function (w) { return w[1] >= TOTAL; });
    k.push({ opacity: endsVisible ? 1 : 0, offset: 1 });
    k.sort(function (a, b) { return a.offset - b.offset; });
    return k;
  }

  /* ---------- construcción ---------- */
  function build() {
    Array.prototype.forEach.call(root.querySelectorAll('.ev__phone'), function (phone) {
      var role = phone.getAttribute('data-role');
      var cfg = PHONES[role];
      if (!cfg) return;
      var screen = phone.querySelector('.ev__screen');
      var scenes = Array.prototype.slice.call(screen.querySelectorAll('.ev__scene'));

      // pantallas
      scenes.forEach(function (node, i) {
        var inAt = i === 0 ? null : cfg.starts[i];
        var next = i < scenes.length - 1 ? cfg.starts[i + 1] : LOOP_AT;
        run(node, sceneKeyframes(inAt, next + FADE));
      });

      // copia de la primera pantalla que cierra el loop encima de la última
      var ghost = scenes[0].cloneNode(false);
      ghost.setAttribute('aria-hidden', 'true');
      ghost.removeAttribute('fetchpriority');
      screen.appendChild(ghost);
      run(ghost, sceneKeyframes(LOOP_AT, TOTAL));

      // efectos
      (EFFECTS[role] || []).forEach(function (fx) {
        if (fx.type === 'tap') addTap(screen, fx);
        if (fx.type === 'press') addPress(screen, fx);
        if (fx.type === 'pulse') addPulse(screen, fx);
        if (fx.type === 'scanline') addScanline(screen, fx);
        if (fx.type === 'draw') addDraw(screen, fx);
      });

      // foco
      if (FOCUS[role]) run(phone, focusKeyframes(FOCUS[role]));
    });

    // etiquetas de rol animadas
    Array.prototype.forEach.call(root.querySelectorAll('.ev__tag[data-windows]'), function (tag) {
      run(tag, tagKeyframes(tag.getAttribute('data-windows')));
    });

    root.setAttribute('data-ready', 'true');
  }

  /* ---------- ahorro de batería ---------- */
  function setPlaying(on) {
    anims.forEach(function (a) { on ? a.play() : a.pause(); });
  }
  function watch() {
    var visible = true, tabVisible = !document.hidden;
    function sync() { setPlaying(visible && tabVisible); }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        sync();
      }, { threshold: 0.15 }).observe(root);
    }
    document.addEventListener('visibilitychange', function () {
      tabVisible = !document.hidden;
      sync();
    });
  }

  /* ---------- arranque: esperar a que las imágenes estén decodificadas ---------- */
  var imgs = Array.prototype.slice.call(root.querySelectorAll('img.ev__scene'));
  Promise.all(imgs.map(function (img) {
    return img.decode ? img.decode().catch(function () {}) : Promise.resolve();
  })).then(function () {
    build();
    watch();
  });
})();
