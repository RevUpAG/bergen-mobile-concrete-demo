(() => {
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- Dispatch: calls first, texts second. Confirm which number takes texts before launch. ---- */
const TEL = '+12017977550';
const apple = /iP(hone|ad|od)|Macintosh/.test(navigator.userAgent);  // iOS and macOS Messages read &body=, Android reads ?body=
const sms = body => `sms:${TEL}${apple ? '&' : '?'}body=${encodeURIComponent(body)}`;
$$('[data-sms]').forEach(a => a.href = sms('Hi Matt, '));

/* ---- Quarter yards: they sell in 1/4 yard steps ---- */
const Q = ['', '¼', '½', '¾'], QA = ['', '1/4', '1/2', '3/4'];
const upQ = v => Math.ceil(v * 4 - 1e-9) / 4, nearQ = v => Math.round(v * 4) / 4;
const fq = (v, a) => { const w = Math.floor(v + 1e-9), r = Math.round((v - w) * 4) % 4, f = (a ? QA : Q)[r]; return w ? w + (f ? (a ? ' ' : '') + f : '') : (f || '0'); };
const pq = s => {  // "8", "8.5", "8 1/2", "8½" -> 8.5
  s = String(s).trim().replace(',', '.').replace(/([¼½¾])/g, m => ' ' + QA[Q.indexOf(m)]);
  let m = s.match(/^(\d+(?:\.\d+)?)?\s*(?:(\d+)\s*\/\s*(\d+))?$/);
  if (!m || (!m[1] && !m[2]) || m[3] === '0') return NaN;
  return (m[1] ? +m[1] : 0) + (m[2] ? m[2] / m[3] : 0);
};

/* ---- Yard meter: whole yards on black drums, quarters on the orange one ---- */
function meter(el, ints) {
  const D = Array.from({ length: 11 }, (_, i) => `<span>${i % 10}</span>`).join(''), F = [...Q, ''].map(c => `<span>${c}</span>`).join('');
  const drums = [];
  for (let k = ints - 1; k >= 0; k--) { el.insertAdjacentHTML('beforeend', `<i><b>${D}</b></i>`); drums.push([el.lastElementChild.firstChild, 4 * 10 ** k, 10]); }
  el.insertAdjacentHTML('beforeend', `<i class="q"><b>${F}</b></i><span class="u">cubic yards</span>`); drums.push([el.querySelector('.q b'), 1, 4]);
  const max = 4 * 10 ** ints - 1;
  return (v, roll) => {
    const n = Math.max(0, Math.min(v * 4, max)), N = roll ? n : Math.round(n);
    el.classList.toggle('whole', !roll && N % 4 === 0);  // whole yards: the quarter drum steps back
    for (const [b, p, base] of drums) {
      const x = N / p, w = Math.floor(x + 1e-9), carry = p === 1 ? x - w : Math.max(0, (N % p) - (p - 1));  // a drum turns while the one below goes past its last step
      b.style.transform = `translateY(${-(w % base + carry) * 1.26}em)`;
    }
  };
}
const yards = {
  slab: (l, w, t) => l * w * t / 12 / 27,
  foot: (l, w, d) => l * (w / 12) * (d / 12) / 27,
  col: (d, h, n) => Math.PI * (d / 24) ** 2 * h * n / 27,
  yd: y => y
};

/* ---- Home hero: concrete slumps into the form, the meter follows the volume ---- */
const scene = $('#scene');
if (scene) {
  const cv = $('#pour'), cx = cv.getContext('2d'), rig = $('#rig'), jobEl = $('#job'), setHero = meter($('#hm'), 2);
  const JOBS = [['Patio, 12 × 16 ft', yards.slab(16, 12, 4)], ['Driveway, 18 × 24 ft', yards.slab(24, 18, 5)], ['Walkway, 3 × 30 ft', yards.slab(30, 3, 4)], ['Footing, 60 ft run', yards.foot(60, 16, 10)]].map(([j, y]) => [j, upQ(y)]);
  let G, pat, hs, job = 0, phase = 'pour', clock = 0, poured = 0, screed = 0, fade = 1, last = 0, seen = true;
  const STEP = 3, POUR = 6.4;
  const grain = (w, h, base, dots, seed) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, w, h);
    let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < w * h / 26; i++) { g.fillStyle = dots[(r() * dots.length) | 0]; const z = .5 + r() * 1.5; g.fillRect(r() * w, r() * h, z, z); }
    return c;
  };
  const layout = () => {
    const r = scene.getBoundingClientRect(), t = rig.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * dpr; cv.height = r.height * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = parseFloat(getComputedStyle($('.hero .wrap')).paddingLeft), boxL = Math.max(0, (r.width - 1240) / 2) + pad;
    const tx = t.left - r.left, ty = t.top - r.top, gy = ty + t.height * .972;
    G = { w: r.width, h: r.height, gy, x0: boxL, x1: tx + t.width * .285, sx: tx + t.width * .027, sy: ty + t.height * .735, sw: t.width * .02 };
    G.floor = G.h - Math.max(16, (G.h - gy) * .2); G.depth = G.floor - gy; G.n = Math.max(8, Math.floor((G.x1 - G.x0) / STEP));
    G.cap = G.n * G.depth; G.si = Math.round((G.sx - G.x0) / STEP);
    pat = { wet: cx.createPattern(grain(160, 160, '#a9aea9', ['#8d928d', '#bfc4be', '#979c97', '#7f847f'], 7), 'repeat'), road: cx.createPattern(grain(200, 200, '#282c2e', ['#34393b', '#1f2223', '#43494b'], 11), 'repeat'), base: cx.createPattern(grain(120, 120, '#1a1c1d', ['#4a4f50', '#2f3334', '#5d6364'], 5), 'repeat') };
    hs = new Float32Array(G.n).fill(phase !== 'pour' ? G.depth : G.depth * Math.min(1, poured)); draw(0);
  };
  const addVol = v => {
    for (let k = -2; k <= 2; k++) { const i = Math.max(0, Math.min(G.n - 1, G.si + k)); hs[i] += v / 5; }
    const lim = STEP * .075;
    for (let it = 0; it < 90; it++) for (let i = 0; i < G.n - 1; i++) { const a = (it & 1) ? G.n - 2 - i : i, d = hs[a] - hs[a + 1], m = Math.abs(d) - lim; if (m > 0) { const q = Math.sign(d) * m * .46; hs[a] -= q; hs[a + 1] += q; } }
  };
  const draw = t => {
    const { w, h, gy, x0, x1, floor, n, sx, sy, sw } = G; cx.clearRect(0, 0, w, h);
    cx.fillStyle = pat.road; cx.fillRect(0, gy, w, h - gy); cx.fillStyle = '#1c1f20'; cx.fillRect(0, gy, w, 3);
    cx.fillStyle = '#17191a'; cx.fillRect(x0, gy, x1 - x0, h - gy); cx.fillStyle = pat.base; cx.fillRect(x0, floor, x1 - x0, h - floor);
    cx.strokeStyle = '#7d4a33'; cx.lineWidth = 2.5; const ry = floor - (floor - gy) * .34; cx.beginPath(); cx.moveTo(x0, ry); cx.lineTo(x1, ry); cx.stroke();
    cx.fillStyle = '#a0603f'; for (let x = x0 + 14; x < x1; x += 26) { cx.beginPath(); cx.arc(x, ry - 4, 3, 0, 7); cx.fill(); }
    cx.globalAlpha = fade; cx.fillStyle = pat.wet; cx.beginPath(); cx.moveTo(x0, floor);
    for (let i = 0; i < n; i++) cx.lineTo(x0 + i * STEP, floor - hs[i]);
    cx.lineTo(x1, floor - hs[n - 1]); cx.lineTo(x1, floor); cx.closePath(); cx.fill();
    cx.strokeStyle = 'rgba(255,255,255,.55)'; cx.lineWidth = 1.5; cx.beginPath(); for (let i = 0; i < n; i++) { const y = floor - hs[i]; i ? cx.lineTo(x0 + i * STEP, y) : cx.moveTo(x0, y); } cx.stroke(); cx.globalAlpha = 1;
    if (phase === 'pour' && !still) {
      const top = floor - hs[Math.max(0, Math.min(n - 1, G.si))] + 3, wob = k => Math.sin(t * 9 + k * .13) * sw * .13 + Math.sin(t * 17 + k * .31) * sw * .08;
      cx.fillStyle = pat.wet; cx.beginPath(); cx.moveTo(sx - sw * .5, sy);
      for (let y = sy; y <= top; y += 5) cx.lineTo(sx - sw * .5 - wob(y - t * 260), y);
      for (let y = top; y >= sy; y -= 5) cx.lineTo(sx + sw * .55 + wob(y + 40 - t * 260), y);
      cx.closePath(); cx.save(); cx.translate(0, (t * 300) % 160); cx.fill(); cx.restore();
      cx.fillStyle = '#6f746f'; for (let k = 0; k < 9; k++) { const u = (t * 1.9 + k / 9) % 1, y = sy + (top - sy) * u * u; cx.beginPath(); cx.arc(sx + Math.sin(k * 5.3) * sw * .42, y, 1 + (k % 3) * .7, 0, 7); cx.fill(); }
    }
    cx.fillStyle = '#c9925a'; cx.fillRect(x0 - 8, gy - 7, 8, h - gy + 7); cx.fillRect(x1, gy - 7, 8, h - gy + 7); cx.fillStyle = 'rgba(0,0,0,.28)'; cx.fillRect(x0 - 2, gy - 7, 2, h); cx.fillRect(x1 + 6, gy - 7, 2, h);
    if (phase === 'screed') { const x = x0 + screed * STEP; cx.fillStyle = '#e0b07a'; cx.fillRect(x - 5, gy - 24, 10, 24); cx.fillStyle = '#8a5d33'; cx.fillRect(x - 5, gy - 4, 10, 4); }
  };
  const tickFrame = ms => {
    const dt = Math.min(.05, (ms - last) / 1000 || 0); last = ms;
    if (!seen) return; clock += dt;
    if (phase === 'pour') { const v = Math.min(G.cap * dt / POUR, G.cap * (1 - poured)); poured += v / G.cap; addVol(v); if (poured >= .9999) { poured = 1; phase = 'screed'; screed = G.n - 1; } setHero(JOBS[job][1] * poured, poured < 1); }
    else if (phase === 'screed') { const to = Math.max(0, screed - G.n * dt / .9); for (let i = Math.floor(to); i <= screed && i < G.n; i++) hs[i] = G.depth; screed = to; if (to <= 0) { phase = 'hold'; clock = 0; hs.fill(G.depth); } }
    else if (phase === 'hold') { if (clock > 2.4) phase = 'fade'; }
    else { fade = Math.max(0, fade - dt * 2.4); if (!fade) { job = (job + 1) % JOBS.length; jobEl.textContent = JOBS[job][0]; hs.fill(0); poured = 0; fade = 1; phase = 'pour'; } }
    draw(ms / 1000); requestAnimationFrame(tickFrame);
  };
  const start = () => {
    if (still) { phase = 'hold'; poured = 1; }
    layout(); setHero(still ? JOBS[0][1] : 0);
    let rw = innerWidth; addEventListener('resize', () => { if (innerWidth !== rw || innerWidth > 899) { rw = innerWidth; layout(); } });
    if (still) return;
    const run = v => { if (v && !seen) { seen = true; last = performance.now(); requestAnimationFrame(tickFrame); } else if (!v) seen = false; };
    seen = false; new IntersectionObserver(e => run(e[0].isIntersecting && !document.hidden)).observe(scene);
    document.addEventListener('visibilitychange', () => run(!document.hidden && scene.getBoundingClientRect().bottom > 0));
  };
  rig.complete ? start() : rig.addEventListener('load', start, { once: true });
}

/* ---- Photos: the first image loads first, then everything else before anyone scrolls to it ---- */
const eager = () => $$('[loading=lazy]').forEach(i => i.loading = 'eager'), lead = $('#rig') || $('.pph img');
lead && !lead.complete ? lead.addEventListener('load', eager, { once: true }) : eager(); addEventListener('load', eager);

/* ---- Equipment chooser: advances on its own until someone takes over ---- */
const where = $('.where');
if (where) {
  const tabs = [...where.querySelectorAll('[role=tab]')], units = where.querySelector('.units');
  const active = () => tabs.findIndex(b => b.getAttribute('aria-selected') === 'true');
  const pick = (i, focus) => {
    const b = tabs[(i + tabs.length) % tabs.length];
    tabs.forEach(t => { const on = t === b; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; $('#u-' + t.dataset.k).classList.toggle('on', on); });
    if (focus) b.focus();
  };
  const take = () => where.classList.remove('auto');
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => { take(); pick(i); });
    b.addEventListener('keydown', e => { const s = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]; if (s) { e.preventDefault(); take(); pick(i + s, true); } });
  });
  if (!still) where.classList.add('auto', 'hold');
  where.querySelector('.spots').addEventListener('animationend', e => { if (e.animationName === 'run') pick(active() + 1); });
  let out = true, over = false; const hold = () => where.classList.toggle('hold', out || over);
  new IntersectionObserver(e => { out = !e[0].isIntersecting; hold(); }, { threshold: .3 }).observe(where);
  units.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { over = true; hold(); } });
  units.addEventListener('pointerleave', () => { over = false; hold(); });
  units.addEventListener('focusin', take);
  let tx, ty; units.addEventListener('touchstart', e => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  units.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.6) { take(); pick(active() + (dx < 0 ? 1 : -1)); } });
}

/* ---- Estimate and text to dispatch ---- */
const form = $('#form');
if (form) {
  const setQ = meter($('#qm'), 3), shape = $('#shape'), W = $('#w'), YY = $('#yy');
  const FIELDS = { slab: ['sl', 'sw', 'st'], foot: ['fl', 'fw', 'fd'], col: ['cd', 'ch', 'cn'], yd: ['yy'] };
  const WHAT = { slab: 'Slab', foot: 'Footing', col: '', yd: '' };
  const num = id => { const v = id === 'yy' ? nearQ(pq(YY.value)) : parseFloat($('#' + id).value.replace(',', '.')); return isFinite(v) && v > 0 ? Math.min(v, 5000) : 0; };
  const kind = () => $('[name=kind]:checked').value, via = () => $('[name=via]:checked');
  const fmt = v => String(+v.toFixed(2));
  const art = s => { s = s.trim(); const l = s.charAt(0).toLowerCase() + s.slice(1); return /^(a|an|the|my|our|some|\d+)\s|s$/i.test(l) ? l : (/^[aeiou]/i.test(l) ? 'an ' : 'a ') + l; };
  const auto = w => { if (!W.dataset.user) W.value = w; };
  let text = '';
  const box = (L, Wd, H, labs) => {
    const big = Math.max(L, Wd), s = 150 / big, l = Math.max(L * s, 22), w = Math.max(Wd * s, 22), z = Math.max(11, Math.min(90, H * s)), c = .866, q = .5;
    const P = (x, y, k) => [(x - y) * c, (x + y) * q - k], p = [P(0, 0, z), P(l, 0, z), P(l, w, z), P(0, w, z), P(l, 0, 0), P(l, w, 0), P(0, w, 0)];
    const xs = p.map(a => a[0]), ys = p.map(a => a[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), k = Math.min(210 / (x1 - x0), 118 / (y1 - y0)), ox = 160 - (x0 + x1) / 2 * k, oy = 78 - (y0 + y1) / 2 * k;
    const m = p.map(a => [a[0] * k + ox, a[1] * k + oy]), poly = (ids, f) => `<polygon points="${ids.map(i => m[i].map(n => n.toFixed(1)).join()).join(' ')}" fill="${f}" stroke="#1c1f20" stroke-width="2" stroke-linejoin="round"/>`;
    const mid = (a, b) => [(m[a][0] + m[b][0]) / 2, (m[a][1] + m[b][1]) / 2], R = mid(4, 5), F = mid(5, 6), V = mid(1, 4);
    return poly([0, 1, 2, 3], '#c5c9c4') + poly([1, 2, 5, 4], '#8d928d') + poly([3, 2, 5, 6], '#a9aea9') + (labs ? `<text x="${R[0] + 8}" y="${R[1] + 18}">${labs[1]}</text><text x="${F[0] - 8}" y="${F[1] + 18}" text-anchor="end">${labs[0]}</text><text x="${V[0] + 8}" y="${V[1] + 4}">${labs[2]}</text>` : '');
  };
  const calc = () => {
    const k = kind(), v = FIELDS[k].map(num), ok = v.every(Boolean), raw = ok ? yards[k](...v) : 0, y = k === 'yd' ? raw : upQ(raw);
    $$('[data-for]').forEach(d => d.hidden = d.dataset.for !== k);
    let job = 'Add your sizes', art2 = '', dims = '';
    if (ok) {
      if (k === 'slab') { job = `Slab, ${fmt(v[0])} × ${fmt(v[1])} ft, ${fmt(v[2])} in thick`; dims = `It's ${fmt(v[0])} x ${fmt(v[1])} ft, ${fmt(v[2])} in thick.`; art2 = box(v[0], v[1], v[2] / 12, [fmt(v[0]) + ' ft', fmt(v[1]) + ' ft', fmt(v[2]) + ' in']); }
      if (k === 'foot') { job = `Footing or wall, ${fmt(v[0])} ft long, ${fmt(v[1])} in wide, ${fmt(v[2])} in deep`; dims = `It's ${fmt(v[0])} ft long, ${fmt(v[1])} in wide, ${fmt(v[2])} in deep.`; art2 = box(v[0], v[1] / 12, v[2] / 12, [fmt(v[0]) + ' ft', fmt(v[1]) + ' in', fmt(v[2]) + ' in']); }
      if (k === 'col') { job = `${fmt(v[2])} round columns, ${fmt(v[0])} in across, ${fmt(v[1])} ft tall`; dims = `${fmt(v[2])} columns, ${fmt(v[0])} in across, ${fmt(v[1])} ft tall.`; const r = Math.max(13, Math.min(34, v[0] * 1.5)), h = Math.max(26, Math.min(104, v[1] * 14)), n = Math.min(4, Math.round(v[2])), g = r * 2 + 12, x = 160 - (n - 1) * g / 2; for (let i = 0; i < n; i++) { const c = x + i * g, e = r * .36, b = 146; art2 += `<path d="M${c - r} ${b - h}v${h}a${r} ${e} 0 0 0 ${2 * r} 0v${-h}z" fill="#a9aea9" stroke="#1c1f20" stroke-width="2"/><ellipse cx="${c}" cy="${b - h}" rx="${r}" ry="${e}" fill="#c5c9c4" stroke="#1c1f20" stroke-width="2"/>`; } }
      if (k === 'yd') { const c = Math.cbrt(y); job = `${fq(y)} cubic yards`; art2 = box(c * 1.5, c, c * .67); }
    }
    shape.innerHTML = art2; setQ(y); $('#live').textContent = ok ? fq(y) : '0'; $('#live-u').textContent = k === 'yd' ? 'yards' : 'yards, estimated'; $('.est').textContent = k === 'yd' ? 'Your yardage' : 'Estimated yardage';
    const loads = Math.ceil(y / 11 - 1e-9);
    $('#also').textContent = !ok ? 'Fill in every size to see your yards.' : y > 999 ? 'That’s a big one. Call dispatch and we’ll plan it with you.' : (k === 'yd' ? '' : 'Rounded up to the next quarter yard. ') + (loads <= 1 ? 'Fits on one truck.' : `About ${loads} truckloads.`);
    const t = $('#t').value.trim(), d = $('#d').value, day = d ? new Date(d + 'T12:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }) : '';
    const what = W.value.trim(), name = $('#n').value.trim(), notes = $('#m').value.trim().replace(/\s+/g, ' '), o = via();
    $('#k-job').textContent = what && ok && !job.toLowerCase().startsWith(what.toLowerCase()) ? `${what}: ${job}` : job; $('#k-via').textContent = o.dataset.label; $('#k-town').textContent = t || 'Not filled in'; $('#k-day').textContent = day || 'Not filled in';
    text = ok ? `Hi Matt, I'm looking for ${k === 'yd' ? '' : 'about '}${fq(y, 1)} yard${y > 1 ? 's' : ''}${t ? ' in ' + t : ''}${day ? ' on ' + day : ''}${what ? ' for ' + art(what) : ''}.${dims ? ' ' + dims : ''} ${o.dataset.say}${notes ? ' ' + notes : ''}${name ? ` Thanks, ${name}` : ''}` : '';
    $('#msg').textContent = text || 'Add your sizes and your text shows up here.';
    $('#text-it').href = sms(text || 'Hi Matt, ');
  };
  form.addEventListener('input', e => { if (e.target === W) W.dataset.user = W.value.trim() ? 1 : ''; if (e.target.name === 'kind') auto(WHAT[kind()]); calc(); });
  form.addEventListener('submit', e => e.preventDefault());
  $$('.chips button').forEach(b => b.addEventListener('click', () => { b.dataset.p.split(',').forEach((n, i) => $('#' + FIELDS.slab[i]).value = n); auto(b.dataset.w); calc(); }));
  $$('[data-q]').forEach(b => b.addEventListener('click', () => { const v = nearQ(pq(YY.value)) || 0; YY.value = fq(Math.max(.25, Math.min(999.75, v + .25 * b.dataset.q))); calc(); }));
  YY.addEventListener('change', () => { const v = nearQ(pq(YY.value)); if (v > 0) YY.value = fq(v); calc(); });
  $$('[data-use]').forEach(b => b.addEventListener('click', () => { const r = $(`[name=via][value=${b.dataset.use}]`); if (r) r.checked = true; calc(); $('#quote').scrollIntoView({ behavior: still ? 'auto' : 'smooth' }); }));
  const now = new Date(); $('#d').min = new Date(now - now.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  $('#copy').addEventListener('click', async e => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(text); b.textContent = 'Copied'; } catch { b.textContent = 'Couldn’t copy, please call dispatch'; }
    setTimeout(() => b.textContent = 'Copy the text', 2600);
  });
  auto(WHAT[kind()]); calc();
  window.bmc = { fq, pq, upQ, nearQ };  // for the test script
}

/* ---- Carousels ---- */
$$('.car').forEach(c => {
  const st = c.querySelector('.stage'), S = [...st.children], n = S.length, dots = c.querySelector('.dots'), pp = c.querySelector('.pp');
  let pos = 0, to = 0, fan = still ? 1 : .62, Wd = 1, raf = 0, prev = 0, at = -1, out = true, over = false, off = still, down = null;
  dots.innerHTML = S.map((_, i) => `<button type="button" aria-label="${i + 1} of ${n}"><i></i></button>`).join('');
  const near = (i, p) => ((i - p + n / 2) % n + n) % n - n / 2; // shortest way round the loop
  const hold = () => c.classList.toggle('hold', out || over || off || !!down);
  const paint = () => {
    S.forEach((s, i) => { const d = near(i, pos), a = Math.abs(d); s.style.transform = `translate3d(${(d * Wd * fan).toFixed(1)}px,0,0) scale(${(1 - Math.min(a, 1) * .14).toFixed(4)})`; s.style.setProperty('--d', (Math.min(a, 1) * .62).toFixed(3)); s.style.zIndex = 20 - Math.round(a * 2); s.style.visibility = a > 2.45 ? 'hidden' : ''; });
    const i = (Math.round(pos) % n + n) % n; if (i === at) return; at = i;
    S.forEach((s, j) => s.classList.toggle('on', j === i)); [...dots.children].forEach((b, j) => { b.classList.toggle('on', j === i); b.setAttribute('aria-current', j === i); });
  };
  const loop = t => {
    const dt = Math.min(.05, Math.max(0, t - prev) / 1000); prev = t;
    if (!down) { pos += (to - pos) * (1 - Math.exp(-dt * 8)); if (Math.abs(to - pos) < .001) pos = to; }
    if ((fan += (1 - fan) * (1 - Math.exp(-dt * 4.5))) > .999) fan = 1;
    paint(); raf = down || pos !== to || fan !== 1 ? requestAnimationFrame(loop) : 0;
  };
  const wake = () => { if (!raf) { prev = performance.now(); raf = requestAnimationFrame(loop); } };
  const go = k => { to = k; if (still) { pos = k; paint(); } else wake(); };
  c.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => go(Math.round(to) + +b.dataset.d)));
  [...dots.children].forEach((b, i) => b.addEventListener('click', () => go(Math.round(to) + Math.round(near(i, Math.round(to))))));
  dots.addEventListener('animationend', () => go(Math.round(to) + 1));
  st.addEventListener('keydown', e => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); go(Math.round(to) + d); } });
  st.addEventListener('pointerdown', e => { if (e.button) return; down = { x: e.clientX, p: pos, lx: e.clientX, lt: e.timeStamp, v: 0, s: Math.round(to) }; st.setPointerCapture(e.pointerId); st.classList.add('drag'); hold(); wake(); });
  st.addEventListener('pointermove', e => { if (!down) return; down.v = .7 * (e.clientX - down.lx) / Math.max(1, e.timeStamp - down.lt) + .3 * down.v; down.lx = e.clientX; down.lt = e.timeStamp; pos = to = down.p - (e.clientX - down.x) / Wd; });
  const up = e => {
    if (!down) return; const g = down, moved = Math.abs(e.clientX - g.x); down = null; st.classList.remove('drag'); hold();
    if (e.type === 'pointerup' && moved < 6) { const r = st.getBoundingClientRect(); go(g.s + Math.round((e.clientX - r.left - r.width / 2) / Wd)); }
    else go(Math.max(g.s - 2, Math.min(g.s + 2, Math.round(pos - g.v * 170 / Wd))));
  };
  st.addEventListener('pointerup', up); st.addEventListener('pointercancel', up);
  c.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { over = true; hold(); } });
  c.addEventListener('pointerleave', () => { over = false; hold(); });
  c.addEventListener('focusin', e => { if (e.target.matches(':focus-visible')) { over = true; hold(); } });
  c.addEventListener('focusout', () => { over = false; hold(); });
  pp.addEventListener('click', () => { off = !off; c.classList.toggle('off', off); pp.setAttribute('aria-label', off ? 'Play' : 'Pause'); over = false; hold(); });
  if (still) pp.hidden = true;
  new ResizeObserver(() => { Wd = S[0].offsetWidth * .93 + 12; paint(); }).observe(st);
  new IntersectionObserver(e => { out = !e[0].isIntersecting; hold(); if (!out && !still) wake(); }, { threshold: .3 }).observe(st);
});

/* ---- Header, menu and phone bar ---- */
const hdr = $('.hdr'), tuck = () => hdr.classList.toggle('sm', scrollY > 24); addEventListener('scroll', tuck, { passive: true }); tuck();
const nav = $('#nav'), burger = $('#burger'), toggle = v => { nav.classList.toggle('open', v); burger.setAttribute('aria-expanded', v); };
burger.addEventListener('click', () => toggle(!nav.classList.contains('open')));
$$('#menu a').forEach(a => a.addEventListener('click', () => toggle(false)));
addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { toggle(false); burger.focus(); } });
document.addEventListener('click', e => { if (!nav.contains(e.target)) toggle(false); });
const vis = new Map(), dock = $('#dock'), io = new IntersectionObserver(es => { es.forEach(e => vis.set(e.target, e.isIntersecting)); dock.classList.toggle('on', ![...vis.values()].some(Boolean)); }, { rootMargin: '-110px 0px 0px' });
$$('[data-nodock]').forEach(el => io.observe(el));
})();
