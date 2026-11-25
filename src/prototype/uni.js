/* Объединённый прототип «месяц Анны»: один счёт, который копит, платит и раскладывает.
   История идёт по событиям (кнопка «Дальше» в верхней плашке), между ними всё нажимается. Состояние живёт в памяти страницы.
   Модель версии 2: «тратится» без процентов; в «копится» прежние деньги (якорь) под 7,5%, новые — по сетке 9,5% + надбавки;
   каждый месяц без снятия 1/12 якоря переходит на сетку. Все цифры на экранах считаются из состояния.
   Переходы — transform и opacity, кривая expo.out; отклик — back.out. */
(() => {
  const { buildDevice, buildView, icon } = window.Proto;
  const NB = ' ', EXP = 84000, GOAL = 120000, OLD = 7.5, BASE = 9.5, CAP = 6 * EXP;
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  const rub = n => fmt(n) + NB + '₽';
  const fmt1 = v => v.toFixed(1).replace('.', ',');
  const fmt2 = v => v.toFixed(2).replace('.', ',');
  const CHK = '<div class="check" style="width:20px; height:20px"><i data-ic="check" data-s="13" data-w="3" style="color:var(--on-mint)"></i></div>';
  const RAD = '<div class="radio" style="width:20px; height:20px"></div>';
  const icons = el => el.querySelectorAll('[data-ic]').forEach(icon);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ───────── состояние ─────────
  // bufO/vacO — прежние деньги (якорь), bufN/vacN — новые; day — число декабря, до которого начислены проценты
  const fresh = () => ({ step: 0, date: '1 декабря', period: 'декабрь', bufO: 138000, bufN: 0, vacO: 0, vacN: 0, hasGoal: false, cr: 0, zh: 0, sd: 0, free: 54400,
    inflow: false, tenure: false, life: false, broken: false, taken: 0, takenFrom: '', ten: 0, paid: '', shown: null, anchor0: 138000, wo: 0, accO: 0, accN: 0, day: 1, auto: false, asked: false });
  let S = fresh();
  const buf = () => S.bufO + S.bufN, vac = () => S.vacO + S.vacN, old = () => S.bufO + S.vacO, nw = () => S.bufN + S.vacN;
  const save = () => buf() + vac(), pays = () => S.cr + S.zh + S.sd, spend = () => pays() + S.free, total = () => save() + spend();
  const rate = () => BASE + (S.inflow ? 1 : 0) + (S.tenure ? 1 : 0) + (S.life ? 1 : 0);          // сетка: ставка на новые деньги
  const yearly = () => (old() * OLD + Math.min(nw(), CAP) * rate() + Math.max(nw() - CAP, 0) * OLD) / 100;   // сверх подушки на 6 месяцев — 7,5%
  const avg = () => save() ? yearly() / save() * 100 : rate();                                   // средняя ставка на «копится»
  const daily = () => yearly() / 365;
  const months = () => buf() / EXP;
  const arcVals = () => [S.inflow ? 1 : 0, S.tenure ? 1 : Math.min(S.ten / 3, .9), S.life ? 1 : Math.min(months() / 3, .95)];
  const accrue = to => { const d = Math.max(to - S.day, 0); S.accO += d * old() * OLD / 36500; S.accN += d * nw() * rate() / 36500; S.day = Math.max(S.day, to); };
  const take = (k, sum) => { const o = Math.min(S[k + 'O'], sum); S[k + 'O'] -= o; S[k + 'N'] -= sum - o; };        // снятие: сначала прежние деньги
  const writeOff = () => { const x = Math.min(Math.round(S.anchor0 * (S.wo + 1) / 12) - Math.round(S.anchor0 * S.wo / 12), old()); if (x <= 0) return 0; S.wo++; const kb = S.bufO / old(), b = Math.round(x * kb), v = Math.round(x) - b; S.bufO -= b; S.bufN += b; S.vacO -= v; S.vacN += v; return b + v; };

  // ───────── сцена ─────────
  const framed = new URLSearchParams(location.search).get('frame');   // ?frame=1 — съёмка для слайдов: всегда в рамке, фон прозрачный
  if (framed) document.documentElement.style.background = document.body.style.background = 'transparent';
  const mobile = !framed && Math.min(innerWidth, innerHeight) < 620;
  document.body.classList.toggle('mobile', mobile);
  const fitEl = document.getElementById('fit'), device = buildDevice([]);
  fitEl.appendChild(device);
  const screen = device.querySelector('.screen');
  const fit = () => { const w = mobile ? 440 : 477, h = mobile ? 956 : 987, pad = mobile ? 0 : 40; fitEl.style.transform = `scale(${Math.min((innerWidth - pad) / w, (innerHeight - pad) / h, mobile ? 9 : 1.15)})`; };
  fit(); addEventListener('resize', fit);
  const add = (cls, html = '') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; screen.appendChild(e); icons(e); return e; };
  const gs = buildView('u-start').querySelector('.status'); gs.className = 'status gstatus'; screen.appendChild(gs); add('home-ind');
  const pill = add('menu-pill tp', '<i data-ic="clock" data-s="14"></i><span></span><b></b>');
  const toastEl = add('toast');
  let toastT;
  const toast = text => { toastEl.textContent = text; clearTimeout(toastT); gsap.killTweensOf(toastEl); gsap.fromTo(toastEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out' }); toastT = setTimeout(() => gsap.to(toastEl, { y: 10, opacity: 0, duration: .2, ease: 'power2.out' }), 2600); };
  const centerOf = el => { const r = el.getBoundingClientRect(), s = screen.getBoundingClientRect(), k = s.width / 440; return { x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height / 2) / k }; };
  const burst = (p, n = 12, r = 70, r0 = 30) => {
    if (reduced) return;
    const h = add('halo-ring');
    gsap.fromTo(h, { x: p.x, y: p.y, scale: .5, opacity: .9 }, { scale: 1.4, opacity: 0, duration: .75, ease: 'power2.out', onComplete: () => h.remove() });
    for (let k = 0; k < n; k++) { const a = (Math.PI * 2 * k) / n + (k % 2 ? .18 : 0), d = r * (k % 2 ? 1 : .72), s = add('spark'); gsap.fromTo(s, { x: p.x + Math.cos(a) * r0, y: p.y + Math.sin(a) * r0, scale: 1, opacity: 1 }, { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, scale: .3, opacity: 0, duration: .8, ease: 'power2.out', onComplete: () => s.remove() }); }
  };
  const count = (el, from, to, f = rub, dur = .8) => { if (reduced) { el.textContent = f(to); return; } const o = { v: from }; gsap.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = f(o.v); } }); };
  const pulse = (el, k = 1.1) => gsap.timeline().to(el, { scale: k, duration: .16, ease: 'power2.out', transformOrigin: '50% 50%' }).to(el, { scale: 1, duration: .5, ease: 'back.out(2.6)' });
  const arcs = ring => [0, 1, 2].map(i => ring.querySelector(`.arc[data-i="${i}"]`));
  const arcSet = (ring, vals, animate, from) => arcs(ring).forEach((a, i) => {
    const L = +a.dataset.len, C = a.dataset.c, p = vals[i], dash = `${Math.max(L * p, .01)} ${C}`, op = p >= 1 ? 1 : p > 0 ? .38 : 0;
    if (animate) { const p0 = from ? from[i] : 0; a.setAttribute('stroke-dasharray', `${Math.max(L * p0, .01)} ${C}`); gsap.to(a, { opacity: op, attr: { 'stroke-dasharray': dash }, duration: .7, ease: 'power2.inOut', delay: .2 + i * .25 }); }
    else { a.setAttribute('stroke-dasharray', dash); a.style.opacity = op; }
  });
  const rollRate = (el, from, to, delay = .4) => { const o = { v: from }; el.textContent = fmt1(from) + '%'; gsap.to(o, { v: to, duration: .7, delay, ease: 'power2.out', onUpdate: () => { el.textContent = fmt1(o.v) + '%'; }, onComplete: () => pulse(el, 1.12) }); };
  const note = (v, title, text) => { const n = document.createElement('div'); n.className = 'rpush'; n.innerHTML = `<div class="av s" style="background:var(--green)"><i data-ic="check" data-s="18" data-w="3" style="color:#fff"></i></div><div class="col sp"><div class="row"><div class="tb" style="font-size:15px">${title}</div><span class="sp"></span><div class="lbl" style="color:var(--soft)">сейчас</div></div><div class="ts soft" style="font-size:13.5px">${text}</div></div>`; v.appendChild(n); icons(n); gsap.timeline({ onComplete: () => n.remove() }).fromTo(n, { yPercent: -180, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .6, ease: 'expo.out' }).to(n, { yPercent: -180, opacity: 0, duration: .28, ease: 'power2.out' }, '+=2.1'); };

  // ───────── экраны и переходы ─────────
  const views = {}, wire = {}, enter = {}, after = {};
  const view = id => {
    if (views[id]) return views[id];
    const v = buildView(id);
    v.style.visibility = 'hidden';
    screen.insertBefore(v, pill);
    views[id] = v;
    v.addEventListener('click', e => {
      const b = e.target.closest('.nav .ic-btn'); if (b && b.querySelector('[data-ic="back"],[data-ic="close"]')) return back();
      const tg = e.target.closest('.tog'); if (tg && !tg.dataset.own) tg.classList.toggle('off');
    });
    wire[id] && wire[id](v);
    v.querySelectorAll('.cta, .nav .ic-btn, .chip, .tab').forEach(el => el.classList.add('tp'));
    return v;
  };
  const on = (v, sel, fn) => { v.querySelectorAll(sel).forEach(el => el.classList.add('tp')); v.addEventListener('click', e => { const t = e.target.closest(sel); if (t && v.contains(t)) fn(t, e); }); };
  let cur = null, busy = false, stack = [];
  const E = 'expo.out';
  const nav = (id, mode = 'push', opts = {}) => {
    if (busy || id === cur) return;
    const to = view(id), from = cur && views[cur];
    busy = true;
    enter[id] && enter[id](to, opts);
    gsap.set(to, { visibility: 'visible', xPercent: 0, yPercent: 0, scale: 1, opacity: 1 });
    const done = () => { if (from) gsap.set(from, { visibility: 'hidden', xPercent: 0, yPercent: 0, scale: 1, opacity: 1 }); busy = false; };
    const start = () => { after[id] && after[id](to, opts); };
    if (!from || mode === 'none') { done(); start(); }
    else if (reduced) { screen.insertBefore(to, pill); gsap.fromTo(to, { opacity: 0 }, { opacity: 1, duration: .2, ease: 'power1.out', onComplete: done }); start(); }   // без движения: только проявление
    else if (mode === 'push') { screen.insertBefore(to, pill); gsap.fromTo(to, { xPercent: 100 }, { xPercent: 0, duration: .5, ease: E }); gsap.to(from, { xPercent: -28, opacity: .35, duration: .5, ease: E, onComplete: done }); start(); }
    else if (mode === 'back') { screen.insertBefore(from, pill); gsap.fromTo(to, { xPercent: -28, opacity: .35 }, { xPercent: 0, opacity: 1, duration: .42, ease: E }); gsap.to(from, { xPercent: 100, duration: .42, ease: E, onComplete: done }); start(); }
    else if (mode === 'rise') { screen.insertBefore(to, pill); gsap.fromTo(to, { yPercent: 100 }, { yPercent: 0, duration: .5, ease: E }); gsap.to(from, { scale: .94, opacity: .4, duration: .5, ease: E, transformOrigin: '50% 30%', onComplete: done }); start(); }
    else { screen.insertBefore(from, pill); gsap.fromTo(to, { scale: .94, opacity: .4 }, { scale: 1, opacity: 1, duration: .45, ease: E, transformOrigin: '50% 30%' }); gsap.to(from, { yPercent: 100, duration: .45, ease: E, onComplete: done }); start(); }
    cur = id; paintPill();
  };
  const go = (id, mode = 'push', opts) => { if (busy || id === cur) return; stack.push({ id: cur, mode }); nav(id, mode, opts); };
  const back = () => { if (busy) return; const p = stack.pop() || { id: 'u-home', mode: 'push' }; nav(p.id || 'u-home', p.mode === 'rise' ? 'drop' : 'back'); };
  const toHome = (mode = 'back') => { stack = []; nav('u-home', mode); };
  const sheetIn = v => { if (reduced) { gsap.set(v.querySelector('.scrim'), { opacity: 1 }); gsap.set(v.querySelector('.sheet'), { yPercent: 0 }); return; } gsap.fromTo(v.querySelector('.scrim'), { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power2.out', delay: .08 }); gsap.fromTo(v.querySelector('.sheet'), { yPercent: 104 }, { yPercent: 0, duration: .5, ease: E, delay: .1 }); };
  const sheetPrep = v => { gsap.set(v.querySelector('.sheet'), { yPercent: 104 }); gsap.set(v.querySelector('.scrim'), { opacity: 0 }); };
  // варианты в шторке: ничего не выбрано заранее, главная кнопка ждёт выбора
  const opts = v => [...v.querySelectorAll('.sheet > .opt, .sheet > .card')].filter(c => c.style.display !== 'none');
  const choose = (v, i) => opts(v).forEach((c, k) => { c.classList.toggle('hi', k === i); if (c.classList.contains('card')) c.classList.toggle('flat', k !== i); c.querySelector('.radio').classList.toggle('on', k === i); });
  const chosen = v => opts(v).findIndex(c => c.classList.contains('hi'));
  const arm = (v, label) => { const b = v.querySelector('.sheet .cta'); b.classList.toggle('wait', !label); b.textContent = label || 'Выберите вариант'; if (label) gsap.fromTo(b, { scale: .97 }, { scale: 1, duration: .35, ease: 'back.out(2.2)' }); };

  // ───────── история ─────────
  const EV = [
    { date: '1 декабря', title: 'Открыть счёт' },
    { date: '3 декабря', title: 'Первая цель — отпуск', run: () => go('c2-new') },
    { date: '10 декабря', title: 'Пришла зарплата', run: () => { note(views['u-home'], 'Пришла зарплата', S.asked ? '72&nbsp;000&nbsp;₽ · раскладываем по конвертам' : '72&nbsp;000&nbsp;₽ · первую раскладку покажем и спросим'); setTimeout(() => cur === 'u-home' && go('c2-salary', 'rise', { kind: 'sal' }), 1300); } },
    { date: '12 декабря', title: 'Покупка в магазине', run: () => go('c1-pay', 'rise') },
    { date: '14 декабря', title: 'Крупная покупка: смартфон', run: () => go('u-short', 'rise') },
    { date: '25 декабря', title: 'Аванс и платежи', run: () => autopay() },
    { date: '31 декабря', title: 'Итоги месяца', run: () => go('u-month') },
    { date: '10 марта', title: 'Три месяца спустя', run: () => { jump(3, 2); if (!S.broken) { S.ten = 3; S.tenure = true; } else S.ten = 2; go('u-mile', 'rise', { k: 'march' }); } },
    { date: '1 июня', title: 'Полгода спустя', run: () => { jump(3); S.tenure = true; S.ten = 3; S.life = months() >= 3; go('u-mile', 'rise', { k: 'june' }); } },
    { date: '1 июня', title: 'Путь пройден', run: () => { S = fresh(); stack = []; nav('u-start', 'back'); paintPill(); } },
  ];
  const DAY = [1, 3, 10, 12, 14, 25, 32];                                        // до какого числа начислены проценты к началу события
  const done = n => { if (S.step === n) { S.date = EV[n].date; S.step = n + 1; S.period = n >= 8 ? 'июнь' : n >= 7 ? 'март' : 'декабрь'; paintPill(); } };
  // верхняя плашка ведёт рассказ: на счёте — следующее событие и «Дальше», на остальных экранах — дата и возврат к счёту
  const paintPill = () => { const home = cur === 'u-home' && S.step > 0, ev = EV[S.step]; pill.querySelector('span').textContent = home ? `${ev.date} · ${ev.title}` : S.date; pill.querySelector('b').textContent = home ? (S.step === 9 ? 'Заново' : 'Дальше') : S.step ? 'к счёту' : ''; pill.querySelector('b').style.display = home || S.step ? '' : 'none'; if (pill._wide !== home) { pill._wide = home; gsap.to(pill, { y: home ? 46 : 0, duration: reduced ? 0 : .4, ease: 'power3.out' }); } };
  const advance = () => { if (busy || !S.step) return; if (cur !== 'u-home') { toHome(); setTimeout(advance, 650); return; } if (DAY[S.step]) accrue(DAY[S.step]); S.date = EV[S.step].date; EV[S.step].run(); };   // на экранах события плашка показывает его дату
  pill.addEventListener('click', () => { if (!S.step) return; cur === 'u-home' ? advance() : toHome(); });
  // месяц вперёд: проценты и остаток месяца уходят в запас как новые деньги, раскладка вносит в цель, 1/12 якоря переходит на сетку
  const jump = (n, w = n) => { for (let i = 0; i < n; i++) { /* w — сколько концов месяца прошло: с 31 декабря по 10 марта их два */ S.bufN += 20000 + Math.round(yearly() / 12); if (S.hasGoal) { const add = Math.min(12400, GOAL - vac()); S.vacN += add; S.bufN += 12400 - add; } if (i < w) writeOff(); } S.cr = 23400; S.zh = 9500; S.sd = 12000; S.free = 52000; };
  const advIn = () => { S.bufN += 4800; S.free += 43200; };
  const autopay = () => {
    const v = views['u-home'];
    note(v, 'Кредит оплачен', '23&nbsp;400&nbsp;₽ из конверта · 15 декабря');
    setTimeout(() => { S.cr = 0; renderHome(v, true); }, 500);
    const zh = () => { if (cur !== 'u-home') return; note(v, 'ЖКХ оплачено', '9&nbsp;340&nbsp;₽ · остаток 160&nbsp;₽ вернулся в свободные'); setTimeout(() => { S.zh = 0; S.free += 160; S.paid = 'оплачены · сад 5-го'; done(5); renderHome(v, true); }, 500); };
    if (S.auto) {
      setTimeout(() => { if (cur !== 'u-home') return; note(v, 'Аванс разложен', '48&nbsp;000&nbsp;₽: запас +4&nbsp;800, свободные +43&nbsp;200'); setTimeout(() => { advIn(); renderHome(v, true); }, 500); }, 3300);
      setTimeout(zh, 6600);
    } else {
      setTimeout(() => cur === 'u-home' && go('c2-salary', 'rise', { kind: 'adv', then: () => setTimeout(zh, 1700) }), 3300);
    }
  };

  // ═════════════ открытие ═════════════
  wire['u-start'] = v => { on(v, '.foot .cta', () => go('u-setup')); on(v, '[data-a="move"]', () => go('u-move')); };
  wire['u-setup'] = v => {
    const card = v.querySelector('[data-a="slider"]'), sl = card.querySelector('.slider'), fil = sl.querySelector('.fil'), knb = sl.querySelector('.knb');
    const set = p => { const tot = S.bufO + S.free; S.bufO = Math.min(Math.max(Math.round(p * tot / 2000) * 2000, 40000), tot - 10000); S.free = tot - S.bufO; S.anchor0 = S.bufO; const q = S.bufO / tot * 100; fil.style.width = q + '%'; knb.style.left = q + '%'; v.querySelector('[data-a="buf"]').textContent = rub(S.bufO); v.querySelector('[data-a="free"]').textContent = rub(S.free); v.querySelector('[data-a="life"]').textContent = `${fmt1(months())} месяца жизни`; };
    v._set = set;
    let drag = false; const move = e => { const r = sl.getBoundingClientRect(); set((e.clientX - r.left) / r.width); };
    card.style.touchAction = 'none'; card.style.cursor = 'grab';
    card.addEventListener('pointerdown', e => { drag = true; card.setPointerCapture(e.pointerId); gsap.to(knb, { scale: 1.18, duration: .15 }); move(e); });
    card.addEventListener('pointermove', e => drag && move(e));
    const up = () => { if (drag) { drag = false; gsap.to(knb, { scale: 1, duration: .35, ease: 'back.out(2.4)' }); } };
    card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up);
    on(v, '.foot .cta', () => { done(0); S.shown = null; toHome('push'); toast('Счёт открыт. Нажмите «Дальше», чтобы прожить месяц'); });
  };
  enter['u-setup'] = v => v._set(S.bufO / (S.bufO + S.free));

  // ═════════════ счёт ═════════════
  const ROWS = { buf: ['g', 'shield', 'var(--mint-ink)', 'Запас'], vac: ['b', 'plane', 'var(--blue)', 'Отпуск'], pays: ['a', 'cal', 'var(--amber)', 'Платежи'], free: ['n', 'wallet', 'var(--soft)', 'Свободные'] };
  const rowHTML = k => `<div class="row er" data-e="${k}"><div class="av s ${ROWS[k][0]}"><i data-ic="${ROWS[k][1]}" data-s="18" style="color:${ROWS[k][2]}"></i></div><div class="col sp"><div class="tb">${ROWS[k][3]}</div><div class="ts" data-sub></div></div><div class="sm" data-val></div></div>`;
  let tickRAF, tickV = 0, tickDay = -1;
  wire['u-home'] = v => {
    v.querySelector('[data-a="save"]').innerHTML = rowHTML('buf') + rowHTML('vac');
    v.querySelector('[data-a="spend"]').innerHTML = rowHTML('pays') + rowHTML('free');
    icons(v);
    on(v, '[data-a="ratecard"]', () => S.broken ? go('u-lost') : go('u-insights'));
    on(v, '[data-e]', t => { const k = t.dataset.e; if (k === 'buf') go('u-insights'); else if (k === 'vac') go('c2-family'); else if (k === 'pays') pays() ? go('c2-autopay') : toast('Платежи наполнятся в день зарплаты'); else go('c1-pay', 'rise'); });
    on(v, '[data-a="topup"]', () => { S.free += 5000; renderHome(v, true); toast('+5 000 ₽ с карты — в свободные'); });
    on(v, '[data-a="pay"]', () => go('c1-pay', 'rise'));
    on(v, '[data-a="out"]', () => go('u-out'));
    on(v, '[data-a="goal"]', () => S.hasGoal ? go('c2-forecast') : go('c2-new'));
    on(v, '.tabbar .tab', t => t.dataset.a === 'tabIns' ? go('u-insights') : t.classList.contains('on') ? 0 : toast('История в прототипе не открыта'));
  };
  const habit = (done, title, sub, mint) => `<div class="row gap10">${done ? CHK : RAD}<div class="col sp"><div class="tb" style="font-size:15px">${title}</div><div class="ts${mint ? ' mint' : ''}" style="font-size:13px">${sub}</div></div></div>`;
  const splitLine = () => `прежние ${rub(old())} · 7,5%${nw() ? `   ·   новые ${rub(nw())} · ${fmt1(rate())}%` : ''}`;
  const renderHome = (v, animate) => {
    const q = a => v.querySelector(`[data-a="${a}"]`), prev = S.shown, m = months();
    const vals = { buf: buf(), vac: vac(), pays: pays(), free: S.free };
    const rem = Math.max(3 * EXP - buf(), 0);
    const subs = { buf: rem ? `до трёх месяцев — ${rub(rem)}` : m >= 6 ? 'шесть месяцев набраны' : 'три месяца набраны · дальше — шесть', vac: vac() >= GOAL ? 'цель готова' : `вдвоём · к 1 июня · ${Math.round(vac() / 1200)}%`, pays: pays() ? (S.paid || 'кредит, ЖКХ, сад · готовы') : (S.paid || 'ждут зарплату 10-го'), free: 'карта и SberPay' };
    const vacRow = v.querySelector('[data-e="vac"]'), wasGoal = vacRow.style.display !== 'none';
    vacRow.style.display = S.hasGoal ? '' : 'none';
    if (animate && S.hasGoal && !wasGoal) { const h = vacRow.getBoundingClientRect().height / (screen.getBoundingClientRect().width / 440); gsap.from(vacRow, { opacity: 0, y: -10, duration: .45, ease: 'power3.out' }); gsap.from(q('spend').parentElement, { y: -h, duration: .5, ease: 'power3.out' }); }   // новая строка проявляется, блок ниже съезжает на её высоту
    Object.keys(vals).forEach((k, i) => { const r = v.querySelector(`[data-e="${k}"]`), el = r.querySelector('[data-val]'); r.querySelector('[data-sub]').textContent = subs[k];
      if (animate && prev && prev.vals[k] !== vals[k]) setTimeout(() => { count(el, prev.vals[k], vals[k]); pulse(r.querySelector('.av'), 1.16); }, i * 120); else el.textContent = rub(vals[k]); });
    if (animate && prev) { count(q('total'), prev.total, total(), rub, 1.1); count(q('saveSum'), prev.save, save()); count(q('spendSum'), prev.spend, spend()); if (prev.m !== m) { count(q('life'), prev.m, m, fmt1, .9); pulse(q('life'), 1.06); } else q('life').textContent = fmt1(m); }
    else { q('total').textContent = rub(total()); q('saveSum').textContent = rub(save()); q('spendSum').textContent = rub(spend()); q('life').textContent = fmt1(m); }
    const ring = v.querySelector('.ring'), rv = ring.querySelector('.ring-v'), av = arcVals();
    if (animate && prev && prev.rate !== rate()) { arcSet(ring, av, true, prev.arcs); rollRate(rv, prev.rate, rate(), .5); setTimeout(() => cur === 'u-home' && burst(centerOf(ring), 12, 70, 44), 1150); }
    else if (!prev) { arcSet(ring, av, true); rv.textContent = fmt1(rate()) + '%'; } else { arcSet(ring, av); rv.textContent = fmt1(rate()) + '%'; }
    q('habits').innerHTML = habit(S.inflow, 'Приток', S.inflow ? 'деньги пришли и остались' : 'ждём зарплату 10-го · +1', !S.inflow)
      + habit(S.tenure, 'Стаж', S.tenure ? 'три месяца без снятия' : S.broken ? 'минус ступень · как вернуть' : `${Math.floor(S.ten)} из 3 месяцев · +1`, !S.tenure)
      + habit(S.life, 'Запас на три месяца', S.life ? `${fmt1(m)} месяца жизни` : `${fmt1(Math.min(m, 2.9))} из 3 · +1`, !S.life);
    icons(q('habits'));
    q('avg').innerHTML = `В среднем на «копится» сегодня <b style="font-weight:600">${fmt1(avg())}%</b> → до 12,5%`;
    q('split').textContent = splitLine();
    q('saveLbl').textContent = `Копится · в среднем ${fmt1(avg())}%`;
    S.shown = { total: total(), save: save(), spend: spend(), vals, rate: rate(), arcs: av, m };
  };
  enter['u-home'] = v => { renderHome(v, !!S.shown); };
  after['u-home'] = v => {
    paintPill();
    cancelAnimationFrame(tickRAF);
    // проценты считаются каждый день: к 9:41 набежала часть дневной суммы; выплата — завтра
    if (tickDay !== S.step) { tickDay = S.step; tickV = daily() * (9 + 41 / 60) / 24; }
    const el = v.querySelector('[data-a="tick"]'); let last = performance.now();
    const step = now => { if (cur !== 'u-home') return; tickV += (now - last) / 1000 * daily() / 86400; last = now; el.textContent = fmt2(tickV); tickRAF = requestAnimationFrame(step); };
    el.textContent = fmt2(tickV); tickRAF = requestAnimationFrame(step);
    if (S.pendingBonus) { const t = S.pendingBonus; S.pendingBonus = ''; setTimeout(() => toast(t), 1500); }
  };

  // ═════════════ цель, зарплата ═════════════
  wire['c2-new'] = v => {
    on(v, '.body > .row.gap10 > .card', t => v.querySelectorAll('.body > .row.gap10 > .card').forEach(c => { c.classList.toggle('hi', c === t); c.querySelector('.radio').classList.toggle('on', c === t); }));
    on(v, '.chip', t => v.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === t)));
    on(v, '[data-a="term"]', () => go('u-term'));
    // 46 000 ₽ из свободных — прежние деньги клиента: остаются под 7,5% и входят в якорь
    on(v, '.foot .cta', () => { if (!S.hasGoal) { const put = Math.min(46000, S.free); S.hasGoal = true; S.vacO = put; S.free -= put; S.anchor0 = old(); } done(1); toHome(); toast('Конверт «Отпуск» создан'); });
  };
  // раскладка поступления: зарплата 10-го закрывает платежи, цель и 10% в запас; аванс 25-го — 10% в запас, остальное свободные
  const SPLIT = { sal: { sum: 72000, vals: [23400, 9500, 12000, 12400, 7200, 7500], kind: 'Зарплата', date: '10 декабря, 09:14', done: ['Платежи декабря закрыты', 'Кредит, ЖКХ и сад оплатятся сами в срок'] },
                  adv: { sum: 48000, vals: [0, 0, 0, 0, 4800, 43200], kind: 'Аванс', date: '25 декабря, 09:02', done: ['Платежи уже были наполнены', 'С зарплаты 10-го: аванс идёт в запас и свободные'] } };
  let SP = null;
  const salApply = () => { const k = SP.k; if (k === 'sal' && S.step === 2) { S.cr = 23400; S.zh = 9500; S.sd = 12000; S.bufN += 7200; if (S.hasGoal) S.vacN += 12400; else S.free += 12400; S.free += 7500; S.inflow = true; S.paid = ''; S.pendingBonus = 'Надбавка за приток: ставка на новые деньги 10,5%'; done(2); } else if (k === 'adv' && !SP.applied) advIn(); SP.applied = true; };
  const salRows = v => [...v.querySelectorAll('[data-fall]')].filter(f => f.style.display !== 'none');
  const salRun = v => {                                           // монеты летят из суммы в конверты, полосы показывают долю поступления
    const num = v.querySelector('[data-anim="sal-num"]'), falls = salRows(v), vals = SP.d.vals.filter(x => x > 0), src = centerOf(num);
    falls.forEach((f, i) => {
      const d = i * .3, amt = f.querySelector('.sm'), to = centerOf(amt);
      if (!reduced) [0, .07, .14].forEach((dd, k) => { const c = add('coin'); gsap.timeline({ delay: d + .1 + dd, onComplete: () => c.remove() }).set(c, { x: src.x - 70 + k * 14, y: src.y, scale: .4, opacity: 0 }).to(c, { opacity: 1, scale: .7, duration: .12 }).to(c, { x: to.x, duration: .44, ease: 'power1.in' }, '<.04').to(c, { y: to.y, duration: .44, ease: 'power2.out' }, '<').to(c, { opacity: 0, scale: .25, duration: .12 }, '-=.06'); });
      setTimeout(() => { count(amt, 0, vals[i], rub, .5); pulse(amt, 1.08); }, (d + .56) * 1000);
      gsap.fromTo(f.querySelector('.bar i'), { scaleX: 0 }, { scaleX: 1, duration: .6, delay: d + .6, ease: 'power3.out', transformOrigin: '0 50%' });
      gsap.to(f.querySelector('.check'), { scale: 1, opacity: 1, duration: .4, delay: d + 1, ease: 'back.out(2.4)' });
    });
    const dn = v.querySelectorAll('[data-anim="sal-done"], [data-anim="sal-buf"]');
    dn.forEach(e => { e.style.display = ''; }); gsap.fromTo(dn, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .5, stagger: .2, delay: falls.length * .3 + .9, ease: 'power3.out' });
  };
  wire['c2-salary'] = v => {
    const tg = v.querySelector('[data-a="auto"]'); tg.dataset.own = 1; tg.classList.add('tp'); tg.addEventListener('click', () => tg.classList.toggle('off'));
    on(v, '.foot .cta', t => {
      if (SP.ask) {                                               // первая раскладка: клиент подтвердил
        SP.ask = false; S.asked = true; S.auto = !tg.classList.contains('off');
        const ask = v.querySelector('[data-anim="sal-ask"]');
        gsap.to(ask, { opacity: 0, y: -8, duration: .2, ease: 'power2.out', onComplete: () => { ask.style.display = 'none'; } });
        v.querySelector('[data-a="salT"]').textContent = 'Разложили по конвертам'; t.textContent = 'Перейти к счёту'; t.classList.add('sec');
        salRows(v).forEach(f => { f.querySelector('.sm').textContent = rub(0); });
        salApply(); setTimeout(() => cur === 'c2-salary' && salRun(v), 280);
        return;
      }
      salApply(); const then = SP.then; back(); then && then();
    });
  };
  enter['c2-salary'] = (v, o = {}) => {
    const k = o.kind || 'sal', d = SPLIT[k], q = a => v.querySelector(`[data-a="${a}"]`);
    SP = { k, d, ask: !S.auto, then: o.then, applied: false };
    q('salKind').textContent = d.kind; q('salDate').textContent = d.date;
    v.querySelectorAll('[data-fall]').forEach((f, i) => { const x = d.vals[i], pct = Math.round(x / d.sum * 100); f.style.display = x ? '' : 'none'; f.querySelector('.pct').textContent = pct + '%'; f.querySelector('.bar i').style.width = pct + '%'; f.querySelector('.sm').textContent = rub(SP.ask ? x : 0);
      gsap.set(f, { opacity: 0, y: 16 }); gsap.set(f.querySelector('.bar i'), { scaleX: SP.ask ? 1 : 0, transformOrigin: '0 50%' }); gsap.set(f.querySelector('.check'), { scale: .5, opacity: 0 }); });
    const ask = v.querySelector('[data-anim="sal-ask"]'), dn = v.querySelectorAll('[data-anim="sal-done"], [data-anim="sal-buf"]');
    ask.style.display = SP.ask ? '' : 'none'; gsap.set(ask, { opacity: SP.ask ? 1 : 0, y: 0 }); q('auto').classList.add('off');
    ask.querySelector('.ts').innerHTML = k === 'sal' ? 'аванс 25-го разложим сами и&nbsp;пришлём уведомление' : 'следующие поступления разложим сами';
    dn.forEach(e => { e.style.display = SP.ask ? 'none' : ''; }); gsap.set(dn, { opacity: 0, y: 18 });
    q('salT').textContent = SP.ask ? (S.asked ? 'Проверьте раскладку и подтвердите' : 'Первая раскладка: проверьте и подтвердите') : 'Разложили по конвертам';
    const cta = q('salCta'); cta.textContent = SP.ask ? `Разложить ${rub(d.sum)}` : 'Перейти к счёту'; cta.classList.toggle('sec', !SP.ask);
    v.querySelector('[data-anim="sal-num"]').textContent = '+' + rub(0);
    const b2 = buf() + (k === 'sal' ? 7200 : 4800);
    v.querySelector('[data-anim="sal-done"] .tb').textContent = d.done[0]; v.querySelector('[data-anim="sal-done"] .ts').textContent = d.done[1];
    v.querySelector('[data-anim="sal-buf"] .ts').innerHTML = `<b class="ink" style="font-weight:600">Запас — уже ${fmt1(b2 / EXP)} месяца жизни.</b> ${rub(b2)}, цель — 3 месяца`;
  };
  after['c2-salary'] = v => {
    count(v.querySelector('[data-anim="sal-num"]'), 0, SP.d.sum, x => '+' + rub(x), 1);
    gsap.to(salRows(v), { opacity: 1, y: 0, duration: .4, stagger: .08, delay: .35, ease: 'power3.out' });
    if (!SP.ask) setTimeout(() => cur === 'c2-salary' && salRun(v), 900);
  };

  // ═════════════ оплата ═════════════
  const payOpts = v => [...v.querySelectorAll('.sheet > .card')];
  wire['c1-pay'] = v => {
    const pick = i => payOpts(v).forEach((c, k) => { c.classList.toggle('hi', k === i); c.classList.toggle('flat', k !== i); c.querySelector('.radio').classList.toggle('on', k === i); });
    v._pick = pick;
    on(v, '.sheet > .card', t => pick(payOpts(v).indexOf(t)));
    on(v, '.scrim', () => back());
    on(v, '.sheet .cta', t => {
      const acc = payOpts(v).findIndex(c => c.classList.contains('hi')) === 0;
      if (acc && S.free < 3480) return toast('В свободных не хватает — пополните счёт');
      const ic = t.querySelector('i');
      gsap.timeline({ onComplete: () => { if (acc) S.free -= 3480; done(3); nav('c1-paid', 'rise', { sum: 3480, from: acc ? 'Свободные' : 'Карта •• 4417', place: 'Магазин электроники' }); } }).to(ic, { scale: 1.35, duration: .18, ease: 'power2.out' }).to(ic, { scale: 1, duration: .3, ease: 'back.out(3)' });
    });
  };
  enter['c1-pay'] = v => { v._pick(0); v.querySelector('[data-a="src"]').textContent = `Свободные · ${rub(S.free)}`; v.querySelector('[data-a="keep"]').textContent = `Запас и цели не тронуты: копятся в среднем под ${fmt1(avg())}%`; sheetPrep(v); };
  after['c1-pay'] = sheetIn;
  wire['c1-paid'] = v => on(v, '.foot .cta', () => toHome('drop'));
  enter['c1-paid'] = (v, o = {}) => {
    v.querySelector('.body > .col .big').textContent = rub(o.sum || 3480);
    v.querySelector('.body > .col .ts').textContent = `${o.place || 'Магазин электроники'} · ${S.date}`;
    const rows = v.querySelectorAll('.body > .card:not(.hi) .row');
    rows[0].querySelector('.tb').textContent = o.from || 'Свободные';
    rows[1].querySelector('.t').textContent = 'Осталось в свободных'; rows[1].querySelector('.sm').textContent = rub(S.free);
    rows[2].querySelector('.t').textContent = 'Копится'; rows[2].querySelector('.sm').innerHTML = `${rub(save())} <span class="r">· ${fmt1(avg())}%</span>`;
    v.querySelector('.card.hi .tb').textContent = o.dip ? 'Со счёта ничего не списано сверх покупки' : 'Запас и цели не тронуты';
    v.querySelector('.card.hi .ts').textContent = o.dip ? 'Стаж — минус одна ступень. Вернёте за 30 дней — сохранится' : `Копятся дальше: около ${rub(yearly() / 12)} процентов в месяц`;
    gsap.set(v.querySelector('[data-anim="paid-check"]'), { scale: .5, opacity: 0 });
  };
  after['c1-paid'] = v => { const c = v.querySelector('[data-anim="paid-check"]'); gsap.to(c, { scale: 1, opacity: 1, duration: .55, ease: 'back.out(1.9)', delay: .28, onStart: () => setTimeout(() => burst(centerOf(c), 12, 84, 46), 200) }); gsap.from(v.querySelectorAll('.body > .card'), { opacity: 0, y: 18, duration: .45, stagger: .07, delay: .5, ease: 'power3.out' }); };

  // не хватает: четыре варианта, ни один не выбран заранее
  const SHORT = { card: 'Доплатить с карты и оплатить', vac: 'Взять из «Отпуска» и оплатить', buf: 'Взять из запаса и оплатить', parts: 'Оплатить частями' };
  const PRICE = 31990, PART = 5332;                                 // смартфон; частями — 6 платежей
  const need = () => Math.max(PRICE - S.free, 0);
  wire['u-short'] = v => {
    const kind = () => { const c = opts(v)[chosen(v)]; return c ? c.dataset.opt : ''; };
    on(v, '.sheet > .opt', t => { choose(v, opts(v).indexOf(t)); arm(v, SHORT[kind()]); });
    on(v, '.scrim', () => back());
    on(v, '.sheet .cta', () => {
      const k = kind(), n = need(); if (!k) return toast('Выберите, откуда взять деньги');
      let o;
      if (k === 'parts') { S.free -= Math.min(PART, S.free); o = { sum: PART, from: 'Свободные · 1 из 6 платежей', place: 'Смартфон, оплата частями' }; }
      else if (k === 'card') { S.free = 0; o = { sum: PRICE, from: 'Свободные и карта •• 4417', place: 'Смартфон' }; }
      else { if (k === 'vac') { const t = Math.min(n, vac()); take('vac', t); take('buf', n - t); } else take('buf', n); S.free = 0; S.broken = true; S.taken = n; S.takenFrom = k === 'vac' ? '«Отпуска»' : 'запаса'; S.ten = 0; o = { sum: PRICE, from: k === 'vac' ? 'Свободные и «Отпуск»' : 'Свободные и запас', place: 'Смартфон', dip: true }; S.pendingBonus = 'Стаж: минус одна ступень. Вернёте за 30 дней — сохранится'; }
      done(4); nav('c1-paid', 'rise', o);
    });
  };
  enter['u-short'] = v => {
    const q = a => v.querySelector(`[data-a="${a}"]`), n = need(), sh = n / 12400;
    v.querySelector('[data-opt="vac"]').style.display = S.hasGoal && vac() > 0 ? '' : 'none';
    q('need').textContent = `В свободных не хватает ${rub(n)}`;
    q('needSub').textContent = `Покупка — ${rub(PRICE)}, в свободных — ${rub(S.free)}.`;
    q('cardSub').textContent = `${rub(n)} с карты. Цели и стаж целы`;
    q('vacSub').textContent = sh < 1.25 ? 'цель сдвинется на месяц: к 1 июля' : sh < 1.75 ? 'цель сдвинется на полтора месяца: к середине июля' : 'цель сдвинется на два месяца: к 1 августа';
    q('bufSub').textContent = `запас: ${fmt1(months())} → ${fmt1((buf() - n) / EXP)} месяца жизни`;
    q('cost').innerHTML = `Из накоплений ничего не&nbsp;спишем: недополучите около ${rub(n * OLD / 1200)} процентов в&nbsp;месяц. Вернёте за&nbsp;30&nbsp;дней — стаж сохранится. Деньги под кредит, ЖКХ и&nbsp;сад не&nbsp;предлагаем.`;
    choose(v, -1); arm(v, ''); sheetPrep(v);
  };
  after['u-short'] = sheetIn;

  // ═════════════ итоги месяца ═════════════
  let M = null;
  wire['u-month'] = v => {
    ['toBuf', 'toVac'].forEach(a => { const t = v.querySelector(`[data-a="${a}"]`); t.dataset.own = 1; t.classList.add('tp'); t.addEventListener('click', () => { t.classList.toggle('off'); M[a] = !t.classList.contains('off'); }); });
    on(v, '.foot .cta', () => {
      // остаток месяца и проценты — новые деньги; 1/12 якоря переходит на сетку, если месяц прошёл без снятия
      if (M.toBuf) { S.bufN += M.b; S.free -= M.b; } if (M.toVac && S.hasGoal) { S.vacN += M.c; S.free -= M.c; }
      S.bufN += Math.round(M.eO + M.eN); S.accO = S.accN = 0;
      if (!S.broken) { writeOff(); S.ten = 1; }
      done(6); toHome(); toast('Декабрь позади. Дальше — перемотка на три месяца');
    });
  };
  enter['u-month'] = v => {
    accrue(32);
    const q = a => v.querySelector(`[data-a="${a}"]`), eO = S.accO, eN = S.accN;
    const left = Math.max(Math.floor((S.free - 15000) / 1000) * 1000, 0), b = S.hasGoal ? Math.round(left * .6 / 1000) * 1000 : left, c = left - b;
    const wo = S.broken ? 0 : Math.min(S.anchor0 / 12, old());
    M = { eO, eN, b, c, toBuf: b > 0, toVac: c > 0, wo };
    q('earn').textContent = '+' + rub(0); q('earnOld').textContent = '+' + rub(eO); q('earnNew').textContent = '+' + rub(eN); q('earnNewL').textContent = `Новые · ${fmt1(rate())}%`;
    q('left').textContent = rub(left); q('toBufSub').textContent = `${rub(b)} · запас станет ${fmt1((buf() + b) / EXP)} месяца`; q('toVacSub').textContent = `${rub(c)} · цель ближе на ${Math.round(c / 1200)}%`;
    q('vacRow').style.display = S.hasGoal && c ? '' : 'none';
    q('toBuf').classList.toggle('off', !b); q('toVac').classList.toggle('off', !c);
    q('moveTitle').textContent = wo ? `${rub(wo)} переходят на новую ставку` : 'Прежние деньги в декабре остаются под 7,5%';
    q('moveSub').textContent = wo ? `1/12 прежних денег за месяц без снятия. Под 7,5% остаётся ${rub(old() - wo)}` : 'в месяц со снятием переход не идёт; с января — снова по 1/12';
    gsap.set(q('moveBar'), { scaleX: 0, transformOrigin: '0 50%' }); q('moveBar').style.width = wo ? '8.33%' : '0%';
    q('tenTitle').textContent = S.broken ? 'Стаж: минус одна ступень' : 'Стаж: 1 из 3 месяцев';
    q('tenSub').textContent = S.broken ? `вернёте ${rub(S.taken)} до 13 января — ступень сохранится` : 'ещё два месяца без снятия — и ставка +1';
    q('tenRate').textContent = `+1 п.п.`; gsap.set(q('tenBar'), { scaleX: 0, transformOrigin: '0 50%' }); q('tenBar').style.width = S.broken ? '4%' : '33%';
  };
  after['u-month'] = v => { count(v.querySelector('[data-a="earn"]'), 0, M.eO + M.eN, x => '+' + rub(x), 1); gsap.to(v.querySelectorAll('[data-a="moveBar"], [data-a="tenBar"]'), { scaleX: 1, duration: .9, delay: .5, stagger: .15, ease: 'power3.out' }); gsap.from(v.querySelectorAll('.body > .card'), { opacity: 0, y: 18, duration: .45, stagger: .07, ease: 'power3.out' }); };

  // ═════════════ вехи: март и июнь ═════════════
  wire['u-mile'] = v => on(v, '.foot .cta', () => { const k = v._k; if (k === 'march') { done(7); toHome('drop'); } else { done(8); stack = []; nav('u-insights', 'push'); } });
  const fact = (ic, col, a, b) => `<div class="row"><div class="av s n"><i data-ic="${ic}" data-s="18" style="color:${col}"></i></div><div class="t ink sp">${a}</div><div class="sm">${b}</div></div>`;
  enter['u-mile'] = (v, o) => {
    const q = a => v.querySelector(`[data-a="${a}"]`), ring = v.querySelector('.ring'), june = o.k === 'june', ok = june || !S.broken;
    v._k = o.k; v._ok = ok; v._from = rate() - (ok ? 1 : 0);
    q('date').textContent = june ? '1 июня · полгода спустя' : '10 марта · три месяца спустя';
    q('title').textContent = june ? (S.hasGoal ? 'Отпуск готов. Запаса хватает на три месяца' : 'Запаса хватает на три месяца') : ok ? 'Три месяца без снятия' : 'Стаж: 2 из 3 месяцев';
    q('text').textContent = june ? `Все три надбавки ваши. Новые деньги копятся под 12,5%, в среднем на «копится» — ${fmt1(avg())}%.` : ok ? 'Надбавка за стаж ваша. Ставка на новые деньги — 11,5%.' : 'В декабре вы брали из накоплений: стаж откатился на одну ступень, а не в ноль. Надбавка придёт 1 апреля.';
    q('facts').innerHTML = fact('shield', 'var(--mint-ink)', 'Запас', `${rub(buf())} · ${fmt1(months())} мес.`) + (S.hasGoal ? fact('plane', 'var(--blue)', 'Отпуск', vac() >= GOAL ? 'готово' : `${rub(vac())} из ${rub(GOAL)}`) : '') + fact('repeat', 'var(--soft)', 'Прежние под 7,5%', old() ? rub(old()) : 'все на новой ставке') + fact('bolt', 'var(--mint-ink)', 'Счёт зарабатывает', `${rub(yearly() / 12)} в месяц`);
    icons(q('facts')); q('cta').textContent = june ? 'Посмотреть аналитику' : 'Дальше';
    arcSet(ring, june ? [1, 1, .95] : [1, ok ? .9 : .66, Math.min(months() / 3, .95)]); ring.querySelector('.ring-v').textContent = fmt1(v._from) + '%';
    gsap.set(v.querySelectorAll('.body > *'), { opacity: 0, y: 18 });
  };
  after['u-mile'] = v => {
    const ring = v.querySelector('.ring'), rv = ring.querySelector('.ring-v'), a = arcs(ring)[v._k === 'june' ? 2 : 1];
    gsap.to(v.querySelectorAll('.body > *'), { opacity: 1, y: 0, duration: .55, stagger: .1, delay: .25, ease: 'power3.out' });
    if (!v._ok) return;
    gsap.timeline({ delay: 1.1 }).to(a, { opacity: 1, attr: { 'stroke-dasharray': `${+a.dataset.len} ${a.dataset.c}` }, duration: .9, ease: 'power2.inOut' })
      .call(() => rollRate(rv, v._from, v._from + 1, 0), null, '-=.45')
      .call(() => { if (cur !== 'u-mile') return; const p = centerOf(ring); burst(p, 16, 150, 112); pulse(ring, 1.06); if (v._k === 'june') setTimeout(() => cur === 'u-mile' && burst(p, 20, 190, 120), 380); }, null, '+=.35');
  };

  // ═════════════ аналитика ═════════════
  const tankHTML = l => `<div class="tank" style="height:132px"><div class="liq"><svg class="wave" viewBox="0 0 200 10" preserveAspectRatio="none"><path d="M0 10 V5 Q12.5 0 25 5 T50 5 T75 5 T100 5 T125 5 T150 5 T175 5 T200 5 V10 Z" fill="#57D98A"/></svg></div><div class="tl">${l}</div></div>`;
  const play = {};
  let io;
  wire['u-insights'] = v => {
    const sc = v.querySelector('.body.scroll');
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !e.target._played) { e.target._played = true; gsap.to(e.target, { opacity: 1, y: 0, duration: .55, ease: 'power3.out' }); const f = play[e.target.dataset.k]; f && f(e.target); } }), { root: sc, threshold: .3 });
    [...v.querySelectorAll('.rv')].forEach((c, i) => { c.dataset.k = ['life', 'rate', 'donut', 'goal', 'earn', 'tip', 'more'][i]; });
    on(v, '[data-a="toTerm"]', (t, e) => { e.stopPropagation(); go('u-term'); });
    on(v, '[data-a="goalCard"]', (t, e) => { if (!e.target.closest('[data-a="toTerm"]')) go('c2-forecast'); });
    on(v, '[data-a="toRaise"]', () => go('u-raise'));
    on(v, '[data-a="toOver"]', () => toast('Вклад и фонд: в прототипе раздел не открыт'));
  };
  const y = r => 104 - (r - 9.5) / 3 * 84;
  enter['u-insights'] = v => {
    const q = a => v.querySelector(`[data-a="${a}"]`), m = months(), sv = save(), sp = spend(), tot = total();
    q('period').textContent = S.period; v.querySelector('.body.scroll').scrollTop = 0;
    q('life').textContent = fmt1(0); q('lifeSub').textContent = `${rub(buf())} в запасе при расходах около ${rub(EXP)} в месяц`;
    q('tanks').innerHTML = tankHTML('1-й месяц') + tankHTML('2-й месяц') + tankHTML('3-й месяц');
    q('tanks').querySelectorAll('.liq').forEach(l => gsap.set(l, { yPercent: 100 })); q('tanks').querySelectorAll('.tl').forEach(l => { l.style.color = 'var(--mute)'; });
    const rem = Math.max(3 * EXP - buf(), 0);
    q('lifeTip').textContent = S.life || !rem ? 'Три месяца набраны: надбавка за запас ваша' : `До трёх месяцев осталось ${rub(rem)} — это ${Math.ceil(rem / 20000)} мес. по 20 000 ₽ в запас`;
    gsap.set(q('six'), { scaleX: 0, transformOrigin: '0 50%' }); q('six').style.width = Math.min(m / 6, 1) * 100 + '%';
    q('rate').textContent = fmt1(rate()) + '%';
    q('rateNext').textContent = !S.inflow ? '+1 после зарплаты' : !S.tenure ? '+1 за стаж' : !S.life ? '+1 за запас' : 'максимум';
    q('avgLine').innerHTML = `В среднем на «копится» сегодня <b class="ink" style="font-weight:600">${fmt1(avg())}%</b>: ${old() ? `прежние ${rub(old())} под 7,5%, ` : ''}новые ${rub(nw())} под ${fmt1(rate())}%`;
    // ступени ставки: пройденный путь сплошной, ожидаемый — пунктиром
    const xs = [8, 34, 124, 214, 352], now = S.step >= 9 ? 214 : S.step >= 8 ? 124 : S.step >= 3 ? 60 : S.step >= 1 ? 22 : 8, r = rate();
    const pts = [[xs[0], 9.5]]; let rr = 9.5; if (S.inflow) { pts.push([xs[1], rr], [xs[1], rr + 1]); rr++; } if (S.tenure) { pts.push([xs[2], rr], [xs[2], rr + 1]); rr++; } if (S.life) { pts.push([xs[3], rr], [xs[3], rr + 1]); rr++; }
    pts.push([Math.max(now, pts[pts.length - 1][0]), rr]);
    const fut = [[pts[pts.length - 1][0], rr]]; let fr = rr; [[!S.inflow, xs[1]], [!S.tenure, xs[2]], [!S.life, xs[3]]].forEach(([nd, x]) => { if (nd) { const xx = Math.max(x, fut[fut.length - 1][0] + 30); fut.push([xx, fr], [xx, fr + 1]); fr++; } }); fut.push([xs[4], fr]);
    const d = a => a.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${y(p[1])}`).join(' '), last = pts[pts.length - 1];
    q('steps').innerHTML = [9.5, 10.5, 11.5, 12.5].map(g => `<line x1="0" y1="${y(g)}" x2="360" y2="${y(g)}" style="stroke:var(--line)" stroke-width="1"/>`).join('') + `<path d="${d(fut)}" fill="none" stroke="#57D98A" stroke-opacity=".45" stroke-width="2.5" stroke-dasharray="3 7" stroke-linecap="round"/><path class="ln" d="${d(pts)}" fill="none" stroke="#57D98A" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><circle class="dotp" cx="${last[0]}" cy="${y(r)}" r="13" fill="#57D98A" fill-opacity=".22"/><circle class="dot" cx="${last[0]}" cy="${y(r)}" r="6.5" fill="#57D98A"/>`;
    // бублик: цвет продублирован названием и суммой в легенде
    const segs = [['Запас', buf(), '#57D98A'], ['Отпуск', vac(), '#6FB7FF'], ['Платежи', pays(), '#F0B341'], ['Свободные', S.free, '#7C8C85']].filter(s => s[1] > 0), C = 2 * Math.PI * 60; let off = 0;
    q('donut').innerHTML = `<circle cx="75" cy="75" r="60" fill="none" style="stroke:var(--trk)" stroke-width="18"/>` + segs.map(s => { const len = Math.max(s[1] / tot * C - 5, 1), h = `<circle class="sg" data-len="${len}" cx="75" cy="75" r="60" fill="none" stroke="${s[2]}" stroke-width="18" stroke-linecap="round" stroke-dasharray="0.01 ${C}" stroke-dashoffset="${-off - 2.5}" style="opacity:0"/>`; off += s[1] / tot * C; return h; }).join('');
    q('donutSum').textContent = rub(tot); q('donutPct').textContent = '0%'; v._pct = Math.round(sv / tot * 100);
    q('legend').innerHTML = segs.map(s => `<div class="row gap8"><span class="dot" style="background:${s[2]}; border-radius:50%"></span><div class="ts ink sp">${s[0]}</div><div class="sm" style="font-size:15px">${rub(s[1])}</div></div>`).join('');
    q('goalCard').style.display = S.hasGoal ? '' : 'none';
    q('goalSum').textContent = rub(0); q('goalEta').textContent = vac() >= GOAL ? 'готово' : 'к 1 июня'; gsap.set(q('goalBar'), { width: Math.min(vac() / GOAL * 100, 100) + '%', scaleX: 0, transformOrigin: '0 50%' });
    const eo = old() * OLD / 1200, base = nw() * BASE / 1200, bon = nw() * (r - BASE) / 1200; v._earn = eo + base + bon;
    q('mEarn').textContent = '+' + rub(0);
    const parts = [['Прежние деньги · 7,5%', eo, '#7C8C85'], ['Новые деньги · база 9,5%', base, '#1E9A3A'], [`Надбавки за привычки, +${fmt1(r - BASE)} п.п.`, bon, '#A5F5C0']].filter(s => s[1] > 1);
    q('earnBar').innerHTML = parts.map(s => `<i style="flex:${s[1]}; background:${s[2]}; transform:scaleX(0); transform-origin:0 50%"></i>`).join('');
    q('earnLegend').innerHTML = parts.map(s => `<div class="row gap8"><span class="dot" style="background:${s[2]}"></span><div class="ts soft sp">${s[0]}</div><div class="ts ink" style="font-weight:600">+${rub(s[1])}</div></div>`).join('') + '<div class="row gap8"><span class="dot" style="box-shadow:inset 0 0 0 1.5px var(--line2)"></span><div class="ts sp">«Тратится»</div><div class="ts">без процентов</div></div>';
    q('tip').textContent = !S.inflow ? 'Зарплата на счёт даст надбавку за приток, а прежние деньги перейдут на новую ставку за год, а не за два' : !S.tenure ? 'Не берите из «копится» три месяца: стаж добавит +1 п.п. на новые деньги' : !S.life ? `Запас на три месяца добавит ещё +1 п.п.: осталось ${rub(rem)}` : 'Вы на максимальной ставке. Она действует на подушку до шести месяцев — 504 000 ₽';
    v.querySelectorAll('.rv').forEach(c => { c._played = false; gsap.set(c, { opacity: 0, y: 24 }); });
  };
  play.life = c => { const m = months(), el = c.querySelector('[data-a="life"]'); count(el, 0, m, fmt1, 1.1); [...c.querySelectorAll('.tank')].forEach((t, i) => { const lv = Math.min(Math.max(m - i, 0), 1); gsap.to(t.querySelector('.liq'), { yPercent: (1 - lv) * 100, duration: 1.1, ease: 'power2.inOut', delay: .25 + i * .35 }); if (lv > .3) gsap.to(t.querySelector('.tl'), { color: '#06140B', duration: .3, delay: .9 + i * .35 }); }); gsap.to(c.querySelector('[data-a="six"]'), { scaleX: 1, duration: .9, delay: 1.3, ease: 'power3.out' }); };
  play.rate = c => { const l = c.querySelector('.ln'), n = l.getTotalLength(), dots = c.querySelectorAll('.dot, .dotp'); gsap.fromTo(l, { strokeDasharray: n, strokeDashoffset: n }, { strokeDashoffset: 0, duration: 1.1, ease: 'power2.inOut' }); gsap.fromTo(dots, { scale: .5, opacity: 0, transformOrigin: '50% 50%' }, { scale: 1, opacity: 1, duration: .45, ease: 'back.out(2.4)', delay: 1 }); if (!reduced) gsap.to(c.querySelector('.dotp'), { scale: 1.9, opacity: 0, duration: 1.5, ease: 'power2.out', repeat: -1, delay: 1.5, transformOrigin: '50% 50%' }); };
  play.donut = c => { const v = views['u-insights']; c.querySelectorAll('.sg').forEach((s, i) => gsap.to(s, { opacity: 1, attr: { 'stroke-dasharray': `${s.dataset.len} 400` }, duration: .7, ease: 'power2.inOut', delay: i * .22 })); count(c.querySelector('[data-a="donutPct"]'), 0, v._pct, x => Math.round(x) + '%', 1.1); gsap.from(c.querySelectorAll('[data-a="legend"] > .row'), { opacity: 0, x: 14, duration: .4, stagger: .1, delay: .2 }); };
  play.goal = c => { count(c.querySelector('[data-a="goalSum"]'), 0, vac(), rub, 1); gsap.to(c.querySelector('[data-a="goalBar"]'), { scaleX: 1, duration: 1, ease: 'power3.out', delay: .15 }); };
  play.earn = c => { const v = views['u-insights']; count(c.querySelector('[data-a="mEarn"]'), 0, v._earn, x => '+' + rub(x), 1); gsap.to(c.querySelectorAll('[data-a="earnBar"] i'), { scaleX: 1, duration: .6, stagger: .18, ease: 'power3.out', delay: .1 }); };
  after['u-insights'] = v => v.querySelectorAll('.rv').forEach(c => { io.unobserve(c); io.observe(c); });

  // ═════════════ новые экраны версии 2 ═════════════
  // стаж откатился на ступень: вернуть сумму за 30 дней — и ступень сохранится
  wire['u-lost'] = v => {
    on(v, '[data-a="lostCta"]', () => { if (!S.broken) return back(); if (S.free < S.taken) return toast('В свободных пока меньше. После зарплаты хватит'); const k = S.takenFrom === '«Отпуска»' ? 'vac' : 'buf'; S.free -= S.taken; S[k + 'O'] += S.taken; S.broken = false; S.taken = 0; S.ten = S.step > 6 ? 1 : 0; toHome(); toast('Сумма возвращена: стаж сохранён'); });
    on(v, '[data-a="lostSkip"]', () => back());
  };
  enter['u-lost'] = v => {
    if (!S.broken) return;
    const q = a => v.querySelector(`[data-a="${a}"]`), ring = v.querySelector('.ring');
    arcSet(ring, [S.inflow ? 1 : 0, .1, Math.min(months() / 3, .95)]); ring.querySelector('.ring-v').textContent = fmt1(rate()) + '%';
    q('lostTitle').textContent = 'Стаж: минус одна ступень'; q('lostSub').textContent = 'надбавка за стаж придёт на месяц позже';
    q('lostText').innerHTML = `14 декабря вы взяли из ${S.takenFrom} ${rub(S.taken)}. Стаж не&nbsp;обнулился — откатился на&nbsp;одну ступень: надбавка +1&nbsp;п.п. придёт 1&nbsp;апреля вместо 1&nbsp;марта.`;
    q('lostWay1').textContent = `Вернуть ${rub(S.taken)} до 13 января`; q('lostWay1').nextElementSibling.innerHTML = 'ступень сохранится, надбавка придёт 1&nbsp;марта. Право на&nbsp;ошибку — раз в&nbsp;квартал';
    q('lostWay2').textContent = 'надбавка придёт сама 1 апреля';
    q('lostCost').innerHTML = `Со счёта ничего не&nbsp;списано. Месяц без надбавки — это около ${rub(Math.max(nw(), 40000) * .01 / 12)} недополученных процентов.`;
    q('lostCta').textContent = `Вернуть ${rub(S.taken)} из свободных`;
  };
  after['u-lost'] = v => gsap.from(v.querySelectorAll('.body > *'), { opacity: 0, y: 16, duration: .5, stagger: .08, ease: 'power3.out' });
  wire['u-move'] = v => { on(v, '.foot .cta:not(.sec)', () => go('u-setup')); on(v, '[data-a="stay"]', () => back()); };
  enter['u-move'] = v => gsap.set(v.querySelectorAll('.cols i'), { scaleY: 0, transformOrigin: '50% 100%' });
  after['u-move'] = v => { [...v.querySelectorAll('.cols > div')].forEach((c, i) => gsap.to(c.querySelectorAll('i'), { scaleY: 1, duration: .6, delay: .35 + i * .045, ease: 'power3.out' })); };
  wire['u-out'] = v => { on(v, '[data-a="outCta"]', () => { toast('В прототипе перевод не уходит: экран показывает цену решения'); back(); }); };
  enter['u-out'] = v => {
    if (!S.step) return;
    const q = a => v.querySelector(`[data-a="${a}"]`), sum = 100000, f = Math.min(S.free, sum), b = Math.min(sum - f, buf());
    q('outFree').textContent = rub(f); q('outBuf').textContent = rub(b);
    q('outLife').textContent = `Запас: ${fmt1(months())} → ${fmt1((buf() - b) / EXP)} месяца жизни`;
    q('outCost').innerHTML = `Недополучите около ${rub(b * OLD / 1200)} процентов в&nbsp;месяц. Со&nbsp;счёта ничего не&nbsp;спишем`;
  };
  after['u-out'] = v => gsap.from(v.querySelectorAll('.body > .card'), { opacity: 0, y: 16, duration: .45, stagger: .07, delay: .1, ease: 'power3.out' });
  wire['u-term'] = v => on(v, '.foot .cta', () => { toast('Конверт «Отпуск» стал срочным до 1 июня'); back(); });
  enter['u-term'] = v => { if (S.hasGoal) v.querySelector('[data-a="termSum"]').textContent = rub(vac()); };
  after['u-term'] = v => gsap.from(v.querySelectorAll('.body > .row > .card, .body > .card'), { opacity: 0, y: 16, duration: .45, stagger: .07, delay: .1, ease: 'power3.out' });
  wire['u-raise'] = v => on(v, '.foot .cta', () => { toast('Правила включены: сработают, когда вырастет зарплата'); back(); });
  enter['u-raise'] = v => gsap.set(v.querySelectorAll('.cols i'), { scaleY: 0, transformOrigin: '50% 100%' });
  after['u-raise'] = v => [...v.querySelectorAll('.cols > div')].forEach((c, i) => gsap.to(c.querySelectorAll('i'), { scaleY: 1, duration: .55, delay: .4 + i * .07, ease: 'power3.out' }));

  // ═════════════ общий конверт, платежи, прогноз ═════════════
  const famCards = v => [...v.querySelectorAll('.body > .card')];
  wire['c2-family'] = v => {
    on(v, '.foot .cta', () => { if (S.free < 5000) return toast('В свободных меньше 5 000 ₽'); S.free -= 5000; S.vacO += 5000; paintFam(v, true); toast('+5 000 ₽ из свободных'); });
    on(v, '.nav .ic-btn:last-child', () => go('c2-invite'));
    const inv = famCards(v)[0].querySelectorAll('.row')[2]; inv.classList.add('tp'); inv.addEventListener('click', () => go('c2-invite'));
    on(v, '.body > .col, .body > .bar', () => go('c2-forecast'));
  };
  const paintFam = (v, animate) => {
    const tot = vac(), mx = Math.round(tot * .39 / 1000) * 1000, an = tot - mx, num = v.querySelector('[data-anim="fam-num"]'), rows = famCards(v)[0].querySelectorAll('.row .sm'), feed = famCards(v)[1];
    if (animate && v._tot != null) { count(num, v._tot, tot); count(rows[0], v._an, an); pulse(num, 1.05); } else { num.textContent = rub(tot); rows[0].textContent = rub(an); }
    rows[1].textContent = rub(mx);
    // полоса и лента двигаются только через transform: полоса растёт масштабом, строки ленты съезжают вниз под новую
    const fb = v.querySelector('[data-anim="fam-bar"]'), w1 = Math.min(tot / 1200, 100), w0 = v._w || w1; fb.style.width = w1 + '%'; gsap.fromTo(fb, { scaleX: w0 / w1 }, { scaleX: 1, transformOrigin: '0 50%', duration: animate ? .8 : 0, ease: 'power3.out' }); v._w = w1;
    if (animate) { feed.insertAdjacentHTML('afterbegin', '<div class="row"><div class="av s round g txt mint" style="font-size:14px">А</div><div class="col sp"><div class="tb">Анна внесла</div><div class="ts">только что</div></div><div class="sm mint">+5&nbsp;000&nbsp;₽</div></div>'); [...feed.children].forEach((r, i) => { if (i > 3) r.remove(); }); const rows = [...feed.children], h = rows[0].getBoundingClientRect().height / (screen.getBoundingClientRect().width / 440) + 13; gsap.from(rows[0], { opacity: 0, y: -10, duration: .35, ease: 'power3.out' }); gsap.from(rows.slice(1), { y: -h, duration: .45, ease: 'power3.out' }); }
    v._tot = tot; v._an = an;
  };
  enter['c2-family'] = v => paintFam(v, false);
  wire['c2-invite'] = v => { const roles = v.querySelector('.body > .card'); roles.querySelectorAll('.row').forEach(r => { r.classList.add('tp'); r.addEventListener('click', () => roles.querySelectorAll('.radio').forEach(x => x.classList.toggle('on', r.contains(x)))); }); on(v, '.foot .cta', () => toast('Ссылка готова: её можно отправить в любой мессенджер')); };
  wire['c2-autopay'] = v => on(v, '.foot .cta', () => toast('Сумму и дату можно поменять в любой момент'));
  enter['c2-autopay'] = v => gsap.set(v.querySelector('[data-anim="push"]'), { yPercent: -180, opacity: 0, pointerEvents: 'none' });
  const FC = [['10 мая', 'Ускорить на 2&nbsp;000&nbsp;₽'], ['10 марта', 'Пригласить Максима'], ['18 мая', 'Включить округление']];
  wire['c2-forecast'] = v => {
    const cards = () => [...v.querySelectorAll('.body > .card')].slice(1), big = v.querySelector('.body > .col .big');
    on(v, '.body > .card', t => { const i = cards().indexOf(t); if (i < 0) return; cards().forEach((c, k) => { c.classList.toggle('hi', k === i); c.classList.toggle('flat', k !== i); c.querySelector('.radio').classList.toggle('on', k === i); }); big.textContent = FC[i][0]; pulse(big, 1.06); v.querySelector('.foot .cta').innerHTML = FC[i][1]; });
    on(v, '.foot .cta', () => { toast('Готово: цель придёт раньше'); back(); });
  };
  enter['c2-forecast'] = v => { v.querySelector('.body > .col .big').textContent = '1 июня'; const l = v.querySelector('[data-anim="fc-line"]'), n = l.getTotalLength(); gsap.fromTo(l, { strokeDasharray: n, strokeDashoffset: n }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', delay: .4 }); };

  // запуск
  document.fonts.ready.then(() => { paintPill(); nav('u-start', 'none'); document.body.classList.add('ready'); window.__app = { advance, go, state: () => ({ S, cur, busy, total: total(), rate: rate(), avg: avg(), buf: buf(), vac: vac(), old: old(), nw: nw(), months: months(), daily: daily(), monthly: yearly() / 12 }) }; });
})();
