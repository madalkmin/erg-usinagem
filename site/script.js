(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (n, d) { return n.toFixed(d).replace('.', ','); };

  /* ---------- variante clara / escura ---------- */
  var btns = document.querySelectorAll('.variant button');
  function setVariant(v) {
    root.setAttribute('data-theme', v);
    btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.set === v)); });
    try { localStorage.setItem('erg-variante', v); } catch (e) {}
    var url = new URL(location.href);
    url.searchParams.set('v', v);
    history.replaceState(null, '', url);
  }
  btns.forEach(function (b) { b.addEventListener('click', function () { setVariant(b.dataset.set); }); });
  setVariant(root.getAttribute('data-theme') || 'escuro');

  /* ---------- teste de tipografia (atual × nova) ---------- */
  var tbtns = document.querySelectorAll('[data-type-set]');
  function setType(t) {
    root.setAttribute('data-type', t);
    tbtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.typeSet === t)); });
    try { localStorage.setItem('erg-tipo', t); } catch (e) {}
    var url = new URL(location.href);
    url.searchParams.set('t', t);
    history.replaceState(null, '', url);
  }
  tbtns.forEach(function (b) { b.addEventListener('click', function () { setType(b.dataset.typeSet); }); });
  setType(root.getAttribute('data-type') || 'atual');

  /* ---------- relógio ---------- */
  var clock = document.getElementById('clock');
  function tick() { clock.textContent = new Date().toLocaleTimeString('pt-BR', { hour12: false }); }
  tick(); setInterval(tick, 1000);
  var y = String(new Date().getFullYear());
  document.getElementById('year').textContent = y;
  document.getElementById('year2').textContent = y;

  /* ---------- nav com borda ao rolar ---------- */
  var nav = document.getElementById('nav');
  var lastY = 0;
  addEventListener('scroll', function () {
    var y = scrollY;
    nav.classList.toggle('is-stuck', y > 40);
    // esconde ao descer, mostra ao subir
    if (Math.abs(y - lastY) > 6) { nav.classList.toggle('is-hidden', y > lastY && y > 240); lastY = y; }
  }, { passive: true });

  /* ---------- percurso de ferramenta ---------- */
  var path = document.getElementById('toolpath');
  var ghost = document.getElementById('toolpathGhost');
  var tool = document.getElementById('tool');
  var rx = document.getElementById('rx'), ry = document.getElementById('ry'), rz = document.getElementById('rz');
  var rs = document.getElementById('rs'), passEl = document.getElementById('pass'), glog = document.getElementById('glog');

  // coordenadas SVG -> mm (peça 110 × 80 mm, origem no canto inferior esquerdo)
  var toMM = function (x, y) { return [(x - 80) * 0.25, (400 - y) * 0.25]; };

  function buildPath() {
    var d = [], cx = 300, cy = 240, i, a, r;
    // bolsão central em espiral
    var turns = 8, steps = turns * 48, r0 = 4, r1 = 58;
    for (i = 0; i <= steps; i++) {
      a = (i / 48) * Math.PI * 2;
      r = r0 + (r1 - r0) * (i / steps);
      d.push((i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2));
    }
    // acabamento do furo Ø35
    for (i = 0; i <= 64; i++) {
      a = (i / 64) * Math.PI * 2; r = 61;
      d.push('L' + (cx + r * Math.cos(a)).toFixed(2) + ' ' + (cy + r * Math.sin(a)).toFixed(2));
    }
    // 4 furos de fixação
    [[124, 124], [476, 124], [476, 356], [124, 356]].forEach(function (h) {
      d.push('M' + (h[0] + 3) + ' ' + h[1]); // G00 rápido
      for (var k = 0; k <= 32; k++) {
        var t = (k / 32) * Math.PI * 2;
        d.push('L' + (h[0] + 3 * Math.cos(t)).toFixed(2) + ' ' + (h[1] + 3 * Math.sin(t)).toFixed(2));
      }
    });
    // contorno externo com raio de canto (ferramenta por fora)
    var o = 9, x0 = 80 - o, y0 = 80 - o, x1 = 520 + o, y1 = 400 + o, rc = 24 + o;
    d.push('M' + (x0 + rc) + ' ' + y0, 'L' + (x1 - rc) + ' ' + y0);
    d.push('A' + rc + ' ' + rc + ' 0 0 1 ' + x1 + ' ' + (y0 + rc), 'L' + x1 + ' ' + (y1 - rc));
    d.push('A' + rc + ' ' + rc + ' 0 0 1 ' + (x1 - rc) + ' ' + y1, 'L' + (x0 + rc) + ' ' + y1);
    d.push('A' + rc + ' ' + rc + ' 0 0 1 ' + x0 + ' ' + (y1 - rc), 'L' + x0 + ' ' + (y0 + rc));
    d.push('A' + rc + ' ' + rc + ' 0 0 1 ' + (x0 + rc) + ' ' + y0);
    return d.join(' ');
  }

  var d = buildPath();
  path.setAttribute('d', d);
  ghost.setAttribute('d', d);
  var L = path.getTotalLength();
  path.style.strokeDasharray = L;

  var PASSES = 6, DURATION = 18000, HOLD = 1400;
  var pass = 1, start = null, holding = false, nLine = 100, lastLog = 0, visible = true;

  function setTool(len) {
    var p = path.getPointAtLength(len);
    tool.setAttribute('transform', 'translate(' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) + ')');
    var mm = toMM(p.x, p.y);
    rx.textContent = mm[0].toFixed(3);
    ry.textContent = mm[1].toFixed(3);
    return mm;
  }
  function log(mm, now) {
    if (now - lastLog < 260) return;
    lastLog = now;
    nLine += 2;
    var li = document.createElement('li');
    li.textContent = 'N' + String(nLine).padStart(4, '0') + ' G01 X' + mm[0].toFixed(3) + ' Y' + mm[1].toFixed(3);
    glog.appendChild(li);
    while (glog.children.length > 3) glog.removeChild(glog.firstChild);
  }
  function setPass() {
    passEl.textContent = 'PASSE ' + pass + '/' + PASSES;
    rz.textContent = (-0.5 * pass).toFixed(3);
  }

  function frame(now) {
    if (!visible) { start = null; requestAnimationFrame(frame); return; }
    if (start === null) start = now - (frame.elapsed || 0);
    var el = now - start;
    frame.elapsed = el;
    if (el < DURATION) {
      var p = el / DURATION; // linear: avanço constante, como na máquina
      path.style.strokeDashoffset = L * (1 - p);
      log(setTool(L * p), now);
      rs.textContent = String(12000 + Math.round(Math.sin(now / 700) * 18));
    } else if (el < DURATION + HOLD) {
      path.style.strokeDashoffset = 0;
    } else {
      pass = pass >= PASSES ? 1 : pass + 1;
      setPass();
      start = now; frame.elapsed = 0;
    }
    requestAnimationFrame(frame);
  }

  setPass();
  if (reduce) {
    path.style.strokeDashoffset = 0;
    setTool(L);
  } else {
    path.style.strokeDashoffset = L;
    requestAnimationFrame(frame);
    // pausa quando o desenho sai da tela
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(document.getElementById('drawing'));
  }

  /* ---------- mira com coordenadas ---------- */
  var svg = document.getElementById('drawingSvg');
  var cross = document.getElementById('cross'), cH = document.getElementById('crossH'), cV = document.getElementById('crossV'), cT = document.getElementById('crossT');
  svg.addEventListener('pointermove', function (e) {
    var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    var p = pt.matrixTransform(svg.getScreenCTM().inverse());
    cH.setAttribute('d', 'M0 ' + p.y + 'H600');
    cV.setAttribute('d', 'M' + p.x + ' 0V480');
    var mm = toMM(p.x, p.y);
    cT.textContent = 'X' + fmt(mm[0], 2) + '  Y' + fmt(mm[1], 2);
    cT.setAttribute('x', Math.min(p.x + 8, 486));
    cT.setAttribute('y', Math.max(p.y - 8, 14));
    cross.classList.add('is-on');
  });
  svg.addEventListener('pointerleave', function () { cross.classList.remove('is-on'); });

  /* ---------- títulos de seção: quebra por palavra ---------- */
  document.querySelectorAll('.sec-title').forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className = 'w';
            var inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(el);
  });

  /* ---------- reveal ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- contadores ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count), dec = +el.dataset.dec, t0 = null, dur = 1400;
    if (reduce) { el.textContent = fmt(target, dec); return; }
    (function step(now) {
      if (!t0) t0 = now;
      var k = Math.min((now - t0) / dur, 1);
      k = 1 - Math.pow(1 - k, 4);
      // tolerância "desce" até o valor; demais sobem
      var v = dec === 3 ? 0.1 - (0.1 - target) * k : target * k;
      el.textContent = fmt(v, dec);
      if (k < 1) requestAnimationFrame(step);
    })(performance.now());
  }
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); } });
  }, { threshold: .6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  /* ---------- relatório dimensional ---------- */
  var report = document.getElementById('report');
  new IntersectionObserver(function (es, obs) {
    if (!es[0].isIntersecting) return;
    obs.disconnect();
    var rows = report.querySelectorAll('tbody tr');
    rows.forEach(function (tr, i) {
      setTimeout(function () {
        var td = tr.querySelector('[data-m]'), v = parseFloat(td.dataset.m), dd = +(td.dataset.d || 3), n = 0;
        var iv = setInterval(function () {
          n++;
          td.textContent = fmt(v + (Math.random() - .5) * 0.02 * (8 - n) / 8, dd);
          if (n >= 8) { clearInterval(iv); td.textContent = fmt(v, dd); tr.classList.add('is-on'); }
        }, reduce ? 0 : 45);
        if (i === rows.length - 1) setTimeout(function () { report.classList.add('is-done'); }, reduce ? 0 : 500);
      }, reduce ? 0 : 280 * i);
    });
  }, { threshold: .4 }).observe(report);

  /* ---------- linha do processo ---------- */
  var flow = document.getElementById('flow');
  var steps = flow.querySelectorAll('.flow__step');
  function flowProgress() {
    var r = flow.getBoundingClientRect(), vh = innerHeight;
    var p = Math.min(Math.max((vh * 0.75 - r.top) / (r.height + vh * 0.25), 0), 1);
    flow.style.setProperty('--p', p.toFixed(3));
    steps.forEach(function (s, i) { s.classList.toggle('is-done', p >= i / steps.length); });
  }
  addEventListener('scroll', flowProgress, { passive: true });
  flowProgress();

  /* ---------- upload (somente visual) ---------- */
  var drop = document.getElementById('drop'), fileInput = document.getElementById('fileInput'), dropText = document.getElementById('dropText');
  ['dragenter', 'dragover'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (t) { drop.addEventListener(t, function () { drop.classList.remove('is-over'); }); });
  fileInput.addEventListener('change', function () {
    var f = fileInput.files;
    if (!f.length) return;
    dropText.innerHTML = '';
    var b = document.createElement('b');
    b.textContent = f.length === 1 ? f[0].name : f.length + ' arquivos selecionados';
    dropText.appendChild(b);
  });
  document.getElementById('quoteForm').addEventListener('submit', function (e) {
    e.preventDefault();
    document.getElementById('formMsg').textContent = '> Protótipo: envio desativado. Integração com e-mail/CRM na próxima etapa.';
  });

  /* ---------- entrada do hero ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('is-loaded'); }); });

  /* ---------- rolagem suave (Lenis) ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var target = id === '#topo' ? 0 : document.querySelector(id);
        if (target === null) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -80 });
      });
    });
  }

  /* ---------- régua milimetrada ---------- */
  var ruler = document.getElementById('ruler'), rulerVal = document.getElementById('rulerVal');
  var hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', function (e) {
    var r = ruler.getBoundingClientRect();
    var x = Math.min(Math.max(e.clientX - r.left, 0), r.width);
    ruler.style.setProperty('--x', x + 'px');
    rulerVal.textContent = fmt(x / 8, 1) + ' mm';  // 8 px = 1 mm na régua
    ruler.classList.add('is-on');
  });
  hero.addEventListener('pointerleave', function () { ruler.classList.remove('is-on'); });

  /* ---------- trilho lateral ---------- */
  var rail = document.querySelector('.rail'), railN = document.getElementById('railN'), railT = document.getElementById('railT'), railBar = document.getElementById('railBar');
  var marks = [['topo', '01', 'Início'], ['escala', 'Ø', 'Escala'], ['capacidades', '02', 'Capacidades'], ['processo', '03', 'Processo'], ['materiais', '04', 'Materiais'], ['qualidade', '05', 'Qualidade'], ['orcamento', '06', 'Orçamento']]
    .map(function (m) { return { el: document.getElementById(m[0]), n: m[1], t: m[2] }; });
  function railUpdate() {
    var y = scrollY + innerHeight * 0.4, cur = marks[0];
    marks.forEach(function (m) { if (m.el && m.el.getBoundingClientRect().top + scrollY <= y) cur = m; });
    if (railN.textContent !== cur.n) { railN.textContent = cur.n; railT.textContent = cur.t; }
    var max = document.documentElement.scrollHeight - innerHeight;
    railBar.parentNode.style.setProperty('--p', (scrollY / max).toFixed(3));
    rail.classList.toggle('is-on', scrollY > innerHeight * 0.5);
  }
  addEventListener('scroll', railUpdate, { passive: true });
  railUpdate();

  /* ---------- figura de escala ---------- */
  var ticks = document.getElementById('sfTicks'), tk = '';
  for (var t = 0; t < 120; t++) {
    var ang = t / 120 * Math.PI * 2, major = t % 10 === 0, r1 = 245, r2 = major ? 228 : 237;
    tk += '<path' + (major ? ' class="major"' : '') + ' d="M' + (260 + r1 * Math.cos(ang)).toFixed(1) + ' ' + (260 + r1 * Math.sin(ang)).toFixed(1) + 'L' + (260 + r2 * Math.cos(ang)).toFixed(1) + ' ' + (260 + r2 * Math.sin(ang)).toFixed(1) + '"/>';
  }
  ticks.innerHTML = tk;
  var sfig = document.getElementById('scaleFig');
  new IntersectionObserver(function (es, obs) {
    if (es[0].isIntersecting) { sfig.classList.add('is-in'); obs.disconnect(); }
  }, { threshold: .35 }).observe(sfig);
})();
