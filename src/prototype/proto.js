/* Сборка экранов: иконки, системная строка, рамка iPhone 18 Pro Max, режимы показа.
   ?s=<id>      — один экран в рамке (для съёмки кадра)
   ?reel=c1|c2  — запись сцены (см. reel.js)
   без параметров — галерея всех экранов */

const IC = {
  back: 'M15 5l-7 7 7 7', close: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', chev: 'M9 5l7 7-7 7',
  check: 'M5 12.5l4.5 4.5L19 7.5', down: 'M12 4v14M6 13l6 6 6-6',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  pay: 'M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5zM3 10h18M7 15h3',
  swap: 'M7 7h12l-3-3M17 17H5l3 3',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z',
  bolt: 'M13 3L5 13.5h6L10 21l8-10.5h-6z',
  shield: 'M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z',
  plane: 'M3 11.5l18-7.5-6.5 17-3.2-7.2zM11.3 13.8L21 4',
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  kid: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8M9 10h.01M15 10h.01',
  percent: 'M19 5L5 19M7.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 18a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  cal: 'M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16M8 3v4M16 3v4',
  wallet: 'M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3M4 7.5V17a2 2 0 0 0 2 2h13a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1H6.5A2.5 2.5 0 0 1 4 7.5zM16 13.5h.01',
  repeat: 'M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4',
  coins: 'M9 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM14.5 9.2A5 5 0 1 1 10 18.9',
  faceid: 'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M9 9.5v1.5M15 9.5v1.5M12 9.5v3.5h-1M9 15.5c1.8 1.4 4.2 1.4 6 0',
  car: 'M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16M4 16h16v3H4zM7.5 19v1.5M16.5 19v1.5M7.5 13h9',
  bag: 'M6 8h12l-1 11H7zM9 8V7a3 3 0 0 1 6 0v1',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5V12l3 2',
  chart: 'M4 19h16M7 16v-5M12 16V6M17 16V9',
  grip: 'M9 7h.01M15 7h.01M9 12h.01M15 12h.01M9 17h.01M15 17h.01',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  up: 'M12 20V6M6 11l6-6 6 6',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 7.6h.01',
  bank: 'M4 9.5l8-5 8 5M5.5 10v8M10 10v8M14 10v8M18.5 10v8M4 19.5h16',
  trend: 'M4 17l5.5-5.5 3.5 3.5L20 8M15 8h5v5',
  undo: 'M9 7L5 11l4 4M5 11h9a5 5 0 0 1 0 10h-2',
  timer: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 9v4l2.5 1.5M9.5 2.5h5',
  doc: 'M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v4h4M9 12h6M9 16h4',
};

function icon(el) {
  const n = el.dataset.ic, s = +(el.dataset.s || 24), w = el.dataset.w || (n === 'more' || n === 'grip' ? 3 : 2);
  el.style.display = 'inline-flex'; el.style.flex = 'none';
  el.innerHTML = `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"><path d="${IC[n] || ''}"/></svg>`;
}

const STATUS = `<div class="status"><span>9:41</span><span class="sys">
<svg width="19" height="12" viewBox="0 0 19 12" fill="currentColor"><rect x="0" y="8" width="3.2" height="4" rx="1"/><rect x="5.2" y="5.5" width="3.2" height="6.5" rx="1"/><rect x="10.4" y="3" width="3.2" height="9" rx="1"/><rect x="15.6" y="0" width="3.2" height="12" rx="1"/></svg>
<svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1.5 4.2a10 10 0 0 1 14 0M4 6.9a6.4 6.4 0 0 1 9 0"/><circle cx="8.5" cy="10" r="1.2" fill="currentColor" stroke="none"/></svg>
<svg width="28" height="13" viewBox="0 0 28 13" fill="none"><rect x=".6" y=".6" width="23.8" height="11.8" rx="3.8" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/><rect x="2.3" y="2.3" width="17" height="8.4" rx="2.3" fill="currentColor"/><path d="M26 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2z" fill="currentColor" fill-opacity=".5"/></svg>
</span></div>`;

function qr(el) {
  // декоративный узор в духе QR: три метки и детерминированный шум
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const N = 21, finder = (r, c) => {
    for (const [fr, fc] of [[0, 0], [0, N - 7], [N - 7, 0]]) {
      const y = r - fr, x = c - fc;
      if (y >= 0 && y < 7 && x >= 0 && x < 7) return (y === 0 || y === 6 || x === 0 || x === 6 || (y > 1 && y < 5 && x > 1 && x < 5)) ? 1 : 0;
      if (y >= -1 && y <= 7 && x >= -1 && x <= 7) return 0;
    }
    return -1;
  };
  let h = '';
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const f = finder(r, c), on = f === -1 ? rnd() > .52 : f;
    h += `<i style="background:${on ? '#0A0E0C' : 'transparent'}; border-radius:1.5px"></i>`;
  }
  el.innerHTML = h;
}

function ring(el) {
  // кольцо из трёх дуг: приток, стаж, запас прочности
  const size = +(el.dataset.size || 132), got = (el.dataset.ring || '0,0,0').split(',').map(Number);
  const r = 56, C = 2 * Math.PI * r, seg = C / 3, gap = 13, L = seg - gap;
  let arcs = '';
  for (let i = 0; i < 3; i++) {
    const off = -(i * seg + gap / 2);
    arcs += `<circle cx="66" cy="66" r="${r}" fill="none" style="stroke:var(--trk)" stroke-width="10" stroke-linecap="round" stroke-dasharray="${L} ${C}" stroke-dashoffset="${off}"/>`;
    arcs += `<circle class="arc" data-i="${i}" data-len="${L}" data-c="${C}" cx="66" cy="66" r="${r}" fill="none" stroke="#57D98A" stroke-width="10" stroke-linecap="round" stroke-dasharray="${Math.max(L * got[i], .01)} ${C}" stroke-dashoffset="${off}" style="opacity:${got[i] >= 1 ? 1 : got[i] > 0 ? .38 : 0}"/>`;
  }
  el.style.width = el.style.height = size + 'px';
  el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 132 132">${arcs}</svg><div class="ring-c"><div class="ring-v" style="font-size:${Math.round(size * .215)}px">${el.dataset.rate || ''}</div>${el.dataset.label ? `<div class="ring-l" style="font-size:13px">${el.dataset.label}</div>` : ''}</div>`;
}

function buildView(id) {
  const tpl = document.querySelector(`template[data-id="${id}"]`);
  const view = tpl.content.firstElementChild.cloneNode(true);
  view.dataset.view = id;
  view.insertAdjacentHTML('afterbegin', STATUS);
  view.insertAdjacentHTML('beforeend', '<div class="home-ind"></div>');
  view.querySelectorAll('[data-ic]').forEach(icon);
  view.querySelectorAll('[data-qr]').forEach(qr);
  view.querySelectorAll('[data-ring]').forEach(ring);
  return view;
}

function buildDevice(ids) {
  const d = document.createElement('div');
  d.className = 'device';
  d.innerHTML = `<div class="btn b1"></div><div class="btn b2"></div><div class="btn b3"></div><div class="btn b4"></div><div class="case"></div><div class="bezel"></div><div class="screen"></div><div class="island"></div>`;
  const scr = d.querySelector('.screen');
  ids.forEach(id => scr.appendChild(buildView(id)));
  return d;
}

const Q = new URLSearchParams(location.search);
// ?theme=light — светлая тема: переменные палитры меняются на экране телефона
const _bd = buildDevice;
const themed = ids => { const d = _bd(ids); if (Q.get('theme') === 'light') d.querySelector('.screen').dataset.theme = 'light'; return d; };
window.Proto = { buildDevice: themed, buildView, icon };

// экраны объединённого прототипа лежат в unified.html: для съёмки одного кадра (?s=u-…) и галереи подгружаем их сюда
const withUnified = async () => { if (document.querySelector('template[data-id^="u-"]')) return; try { const h = await (await fetch('unified.html')).text(); document.body.insertAdjacentHTML('beforeend', h); } catch (e) {} };
let pending = null;
if (window.__APP) {
  // экраны собирает кликабельный прототип (app.js)
} else if (Q.get('s')) {
  document.body.className = 'still';
  const put = () => document.body.appendChild(themed([Q.get('s')]));
  if (document.querySelector(`template[data-id="${Q.get('s')}"]`)) put(); else pending = withUnified().then(put);
} else if (Q.get('reel')) {
  document.body.className = 'reel';
  const g = document.createElement('script'); g.src = '../tools/node_modules/gsap/dist/gsap.min.js';
  g.onload = () => { const s = document.createElement('script'); s.src = 'reel.js'; document.body.appendChild(s); };
  document.body.appendChild(g);
} else {
  document.body.className = 'gallery';
  document.querySelectorAll('template[data-id]').forEach(t => {
    const f = document.createElement('figure');
    const w = document.createElement('div'); w.className = 'wrap';
    w.appendChild(themed([t.dataset.id]));
    f.appendChild(w);
    f.insertAdjacentHTML('beforeend', `<figcaption>${t.dataset.id} · ${t.dataset.cap}</figcaption>`);
    document.body.appendChild(f);
  });
}
if (!Q.get('reel')) Promise.resolve(pending).then(() => document.fonts.ready).then(() => { window.__ready = true; });
