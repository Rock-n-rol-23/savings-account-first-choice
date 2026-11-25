/* Сцены прототипа: одна временная шкала GSAP на концепцию.
   Запись: шкала перематывается покадрово (window.__seek). Живой показ: ?live=1 — шкала играет по кругу.
   Двигаются только transform и opacity (плюс длина дуг кольца); кривые: выход на место power3.out, экраны и шторки expo.out, отклик back.out. */
(() => {
  const { buildDevice, icon } = window.Proto;
  const Q = new URLSearchParams(location.search);
  const which = Q.get('reel'), live = Q.get('live');
  const SETS = {
    c1: ['c1-pay', 'c1-paid', 'c1-home', 'c1-month', 'c1-growth'],
    c2: ['c2-home', 'c2-salary', 'c2-family', 'c2-forecast'],
  };

  const st = document.createElement('style');
  st.textContent = `
    body.reel { width: 540px; height: 1040px; overflow: hidden; background: #111815; position: relative; }
    body.reel.live { background: transparent; }
    body.reel .halo { position: absolute; left: -130px; top: 120px; width: 800px; height: 800px; background: radial-gradient(closest-side, rgba(45,187,82,.26), rgba(45,187,82,0)); }
    body.reel .device { position: absolute; left: 34.5px; top: 26.5px; box-shadow: 0 40px 90px rgba(0,0,0,.55); border-radius: 79px; }
    body.reel .view { visibility: hidden; will-change: transform, opacity; }
    body.reel .view .status, body.reel .view .home-ind { visibility: hidden; }
    .touch { position: absolute; left: 0; top: 0; width: 54px; height: 54px; margin: -27px 0 0 -27px; border-radius: 50%; background: rgba(255,255,255,.26); box-shadow: 0 0 0 1.5px rgba(255,255,255,.55), 0 6px 18px rgba(0,0,0,.35); opacity: 0; z-index: 80; pointer-events: none; }
    .shade { position: absolute; inset: 0; background: #020403; opacity: 0; z-index: 90; pointer-events: none; }
    .halo-ring { position: absolute; left: 0; top: 0; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; box-shadow: 0 0 0 3px rgba(165,245,192,.9); opacity: 0; z-index: 74; pointer-events: none; }
    .rpush { position: absolute; left: 12px; right: 12px; top: 58px; border-radius: 28px; padding: 14px 16px; background: rgba(40,50,45,.82); backdrop-filter: blur(26px) saturate(1.5); -webkit-backdrop-filter: blur(26px) saturate(1.5); box-shadow: inset 0 0 0 1px rgba(255,255,255,.12), 0 18px 44px rgba(0,0,0,.55); display: flex; gap: 12px; align-items: center; z-index: 70; }
  `;
  document.head.appendChild(st);

  document.body.insertAdjacentHTML('beforeend', '<div class="halo"></div>');
  const device = buildDevice(SETS[which]);
  document.body.appendChild(device);
  const screen = device.querySelector('.screen');
  const V = id => screen.querySelector(`[data-view="${id}"]`);
  const $ = (view, sel) => V(view).querySelector(sel);
  const $$ = (view, sel) => [...V(view).querySelectorAll(sel)];
  const add = cls => { const e = document.createElement('div'); e.className = cls; screen.appendChild(e); return e; };
  const touch = add('touch'), shade = add('shade');
  // системная строка и индикатор «домой» неподвижны: экраны ездят под ними
  const sb = screen.querySelector('.view .status').cloneNode(true); sb.style.cssText = 'position:absolute; left:0; right:0; top:0; z-index:85; visibility:visible'; screen.appendChild(sb);
  const hi = add('home-ind'); hi.style.zIndex = 86;

  const NB = ' ';
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  const fmt1 = v => v.toFixed(1).replace('.', ',');
  const centerOf = el => { const r = el.getBoundingClientRect(), s = screen.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; };

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  const inits = [];                     // состояние «до начала»: нужно при каждом новом круге
  const init = f => { inits.push(f); f(); };

  // — приёмы —
  const tap = (el, at, p) => {
    tl.set(touch, { x: p.x, y: p.y, scale: 1.25, opacity: 0 }, at)
      .to(touch, { opacity: 1, scale: 1, duration: .22, ease: 'power2.out' }, at)
      .to(el, { scale: .96, duration: .14, ease: 'power2.out', transformOrigin: '50% 50%' }, at + .16)
      .to(touch, { scale: .78, duration: .14, ease: 'power2.out' }, at + .16)
      .to(el, { scale: 1, duration: .32, ease: 'back.out(2.2)' }, at + .32)
      .to(touch, { opacity: 0, scale: 1.3, duration: .3, ease: 'power2.out' }, at + .32);
  };
  const push = (from, to, at) => {      // новый экран въезжает справа, прежний уходит влево
    tl.set(V(to), { visibility: 'visible', xPercent: 100, opacity: 1 }, at)
      .to(V(to), { xPercent: 0, duration: .62, ease: 'expo.out' }, at)
      .to(V(from), { xPercent: -28, opacity: .35, duration: .62, ease: 'expo.out' }, at)
      .set(V(from), { visibility: 'hidden', xPercent: 0, opacity: 1 }, at + .64);
  };
  const rise = (from, to, at) => {      // экран поднимается снизу поверх прежнего
    tl.set(V(to), { visibility: 'visible', yPercent: 100, opacity: 1 }, at)
      .to(V(to), { yPercent: 0, duration: .7, ease: 'expo.out' }, at)
      .to(V(from), { scale: .94, opacity: .4, duration: .7, ease: 'expo.out', transformOrigin: '50% 30%' }, at)
      .set(V(from), { visibility: 'hidden', scale: 1, opacity: 1 }, at + .72);
  };
  const count = (el, from, to, at, dur = .9, pre = '', post = NB + '₽', f = fmt) => {
    const o = { v: from };
    init(() => { o.v = from; el.textContent = pre + f(from) + post; });
    tl.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = pre + f(o.v) + post; } }, at);
  };
  const stagger = (els, at, step = .07, y = 18) => {
    tl.set(els, { opacity: 0, y }, 0);
    els.forEach((el, i) => tl.to(el, { opacity: 1, y: 0, duration: .5 }, at + i * step));
  };
  const pop = (el, at) => { tl.set(el, { scale: .6, opacity: 0, transformOrigin: '50% 50%' }, 0).to(el, { scale: 1, opacity: 1, duration: .55, ease: 'back.out(1.9)' }, at); };
  const wipe = (el, at, dur = .7) => { tl.set(el, { scaleX: 0, transformOrigin: '0 50%' }, 0).to(el, { scaleX: 1, duration: dur }, at); };
  // кольцо ставки
  const arcSet = (ring, vals) => vals.forEach((p, i) => { const a = ring.querySelector(`.arc[data-i="${i}"]`); a.setAttribute('stroke-dasharray', `${Math.max(+a.dataset.len * p, .01)} ${a.dataset.c}`); a.style.opacity = p > 0 ? 1 : 0; });
  const arcTo = (ring, i, p, at, dur = .7, op = 1) => { const a = ring.querySelector(`.arc[data-i="${i}"]`); tl.set(a, { opacity: op }, at).to(a, { attr: { 'stroke-dasharray': `${+a.dataset.len * p} ${a.dataset.c}` }, duration: dur, ease: 'power2.inOut' }, at); };
  const pulse = (el, at, k = 1.1) => { tl.to(el, { scale: k, duration: .18, ease: 'power2.out', transformOrigin: '50% 50%' }, at).to(el, { scale: 1, duration: .6, ease: 'back.out(2.6)' }, at + .18); };
  // искры и расходящееся кольцо вокруг точки
  const burst = (p, at, n = 14, r = 78, r0 = 0, halo = 1.9) => {
    const ringEl = add('halo-ring');
    tl.set(ringEl, { x: p.x, y: p.y, scale: .5, opacity: 0 }, 0)
      .to(ringEl, { opacity: .9, duration: .08 }, at).to(ringEl, { scale: halo, opacity: 0, duration: .75, ease: 'power2.out' }, at + .04);
    for (let k = 0; k < n; k++) {
      const a = (Math.PI * 2 * k) / n + (k % 2 ? .18 : 0), d = r * (k % 2 ? 1 : .72), s = add('spark');
      tl.set(s, { x: p.x + Math.cos(a) * r0, y: p.y + Math.sin(a) * r0, scale: 1, opacity: 0 }, 0)
        .to(s, { opacity: 1, duration: .05 }, at)
        .to(s, { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, scale: .3, opacity: 0, duration: .8, ease: 'power2.out' }, at + .03);
    }
  };
  const pushNote = (view, html) => { const n = document.createElement('div'); n.className = 'rpush'; n.innerHTML = html; V(view).appendChild(n); n.querySelectorAll('[data-ic]').forEach(icon); return n; };
  const loopOut = at => { tl.to(shade, { opacity: 1, duration: .4, ease: 'power2.in' }, at); tl.to({}, { duration: .01 }, at + .6); };

  // ═════════════ Концепция 1: оплата → счёт с кольцом ставки → итоги и новая надбавка → запас прочности ═════════════
  if (which === 'c1') {
    const sheet = $('c1-pay', '[data-anim="sheet"]'), scrim = $('c1-pay', '[data-anim="scrim"]'), cta = $('c1-pay', '[data-anim="paycta"]');
    const paidBtn = $('c1-paid', '.foot .cta'), monthCta = $('c1-month', '[data-anim="month-cta"]');
    const check = $('c1-paid', '[data-anim="paid-check"]');
    const homeRing = $('c1-home', '.ring'), homeRate = homeRing.querySelector('.ring-v'), habits = $$('c1-home', '[data-habit]');
    const unlock = $('c1-month', '[data-anim="unlock"]'), mRing = unlock.querySelector('.ring'), mRate = mRing.querySelector('.ring-v');
    const gRing = $('c1-growth', '.ring'), tanks = $$('c1-growth', '.tank');
    const rateCard = $('c1-home', '[data-anim="ratecard"]');
    const P = { cta: centerOf(cta), month: centerOf(monthCta), paid: centerOf(paidBtn), check: centerOf(check), mRing: centerOf(mRing), rate: centerOf(rateCard) };

    V('c1-pay').style.visibility = 'visible';
    tl.fromTo(shade, { opacity: 1 }, { opacity: 0, duration: .45, ease: 'power2.out' }, 0);
    // 0.5 — шторка SberPay
    tl.set(sheet, { yPercent: 104 }, 0).set(scrim, { opacity: 0 }, 0)
      .to(scrim, { opacity: 1, duration: .45, ease: 'power2.out' }, .5)
      .to(sheet, { yPercent: 0, duration: .75, ease: 'expo.out' }, .5);
    stagger([...sheet.children].slice(1), .62, .05, 14);
    tap(cta, 3.0, P.cta);
    // 3.7 — оплачено
    rise('c1-pay', 'c1-paid', 3.7);
    pop(check, 4.0);
    burst(P.check, 4.22, 12, 84);
    stagger($$('c1-paid', '.body > .col > .t, .body > .col > .big, .body > .col > .ts'), 4.15, .08, 14);
    stagger($$('c1-paid', '.body > .card'), 4.45, .12);
    tap(paidBtn, 6.5, P.paid);
    // 7.1 — счёт: остаток обновился, кольцо ставки собирается из надбавок, проценты капают
    push('c1-paid', 'c1-home', 7.1);
    count($('c1-home', '[data-anim="c1-total"]'), 300000, 296520, 7.7, 1.0);
    count($('c1-home', '[data-anim="c1-flow-num"]'), 60000, 56520, 7.7, 1.0);
    tl.to($('c1-home', '[data-anim="c1-flow"]'), { flexGrow: 56.5, duration: 1.0, ease: 'power2.out' }, 7.7);
    const tick = $('c1-home', '[data-anim="tick"]'), tk = { v: 51.27 };
    const tickFmt = () => { tick.textContent = tk.v.toFixed(2).replace('.', ','); };
    init(() => { tk.v = 51.27; tickFmt(); });
    tl.to(tk, { v: 51.29, duration: 5.4, ease: 'none', onUpdate: tickFmt }, 7.1);
    init(() => { arcSet(homeRing, [0, 0, 0]); homeRate.textContent = '9,5%'; });
    tl.set(habits, { opacity: 0, x: 14 }, 0);
    const rate = { v: 9.5 }, rateFmt = () => { homeRate.textContent = fmt1(rate.v) + '%'; };
    init(() => { rate.v = 9.5; });
    [[8.5, 1, 10.5], [9.35, 1, 11.5], [10.2, .95, 11.5]].forEach(([at, p, r], i) => {
      arcTo(homeRing, i, p, at, .65, i === 2 ? .38 : 1);
      tl.to(habits[i], { opacity: 1, x: 0, duration: .45 }, at + .1);
      if (i < 2) { tl.to(rate, { v: r, duration: .55, ease: 'power2.out', onUpdate: rateFmt }, at + .25); pulse(homeRate, at + .78, 1.12); }
    });
    tap(rateCard, 11.85, P.rate);
    // 12.5 — итоги месяца и новая надбавка
    push('c1-home', 'c1-month', 12.5);
    count($('c1-month', '[data-anim="month-num"]'), 0, 2650, 12.9, 1.0, '+');
    stagger($$('c1-month', '.body > .card').slice(1, 3), 13.05, .14);
    count($('c1-month', '[data-anim="month-floor"]'), 240000, 252400, 14.0, 1.0);
    pop($('c1-month', '[data-anim="month-pill"]'), 14.0);
    wipe($('c1-month', '[data-anim="month-add"]'), 14.1, .8);
    const mArc = mRing.querySelector('.arc[data-i="2"]');
    init(() => { arcSet(mRing, [1, 1, .95]); mArc.style.opacity = .38; mRate.textContent = '11,5%'; });
    tl.set(unlock, { opacity: 0, y: 26, scale: .96, transformOrigin: '50% 100%' }, 0)
      .to(unlock, { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(1.5)' }, 15.2);
    tl.to(mArc, { opacity: 1, attr: { 'stroke-dasharray': `${+mArc.dataset.len} ${mArc.dataset.c}` }, duration: .9, ease: 'power2.inOut' }, 15.85);
    const mr = { v: 11.5 }; init(() => { mr.v = 11.5; });
    tl.to(mr, { v: 12.5, duration: .55, ease: 'power2.out', onUpdate: () => { mRate.textContent = fmt1(mr.v) + '%'; } }, 16.22);
    burst(P.mRing, 16.85, 10, 60, 34, 1.3);
    pulse(mRing, 16.85, 1.1);
    tap(monthCta, 18.6, P.month);
    // 19.3 — запас прочности: три месяца наполняются, затем цифра и кольцо
    push('c1-month', 'c1-growth', 19.3);
    const life = $('c1-growth', '[data-anim="life"]');
    count(life, 2.9, 3.0, 21.45, .3, '', '', fmt1);
    pulse(life, 21.72, 1.1);
    tanks.forEach((t, i) => {
      const liq = t.querySelector('.liq'), wave = t.querySelector('.wave'), lab = t.querySelector('.tl');
      tl.set(liq, { yPercent: 100 }, 0).to(liq, { yPercent: 0, duration: 1.0, ease: 'power2.inOut' }, 19.7 + i * .42);
      tl.fromTo(wave, { xPercent: 0 }, { xPercent: -50, duration: 1.96, ease: 'none', repeat: 2 }, 19.3);
      tl.set(lab, { color: '#7F8D86' }, 0).to(lab, { color: '#06140B', duration: .3 }, 20.3 + i * .42);
    });
    pulse(tanks[2], 21.54, 1.05);
    wipe($('c1-growth', '[data-a="six"]'), 22.0, .9);
    pop($('c1-growth', '[data-anim="goal-pill"]'), 21.6);
    stagger($$('c1-growth', '.body > .card').slice(1), 21.9, .16);
    init(() => { arcSet(gRing, [0, 0, 0]); });
    [0, 1, 2].forEach(i => arcTo(gRing, i, 1, 22.3 + i * .22, .45));
    pulse(gRing, 23.25, 1.08);
    loopOut(25.0);
  }

  // ═════════════ Концепция 2: зарплата → раскладка → счёт → общий конверт → прогноз ═════════════
  if (which === 'c2') {
    const home = V('c2-home');
    const before = [142800, 33600, 0, 0, 0, 51600], after = [150000, 46000, 23400, 9500, 12000, 59100];   // зарплата 10-го — 72 000 ₽
    const rows = [0, 1, 2, 3, 4, 5].map(i => home.querySelector(`[data-env="${i}"]`));
    const segs = [0, 1, 2, 3, 4, 5].map(i => home.querySelector(`[data-seg="${i}"]`));
    const status = [2, 3, 4].map(i => rows[i].querySelector('.ts'));
    const readyHTML = status.map(s => s.innerHTML);
    const bufTxt = rows[0].querySelector('.ts'), vacTxt = rows[1].querySelector('.ts');
    const bufAfter = bufTxt.innerHTML, vacAfter = vacTxt.innerHTML;
    const openBtn = $('c2-salary', '.foot .cta'), vacRow = rows[1];
    const linkTxt = $('c2-home', '.card.flat .ts'), totEl = $('c2-home', '[data-anim="c2-total"]');
    const salNum = $('c2-salary', '[data-anim="sal-num"]'), falls = $$('c2-salary', '[data-fall]');
    const note = pushNote('c2-home', `<div class="av s" style="background:var(--green)"><i data-ic="wallet" data-s="18" style="color:#fff"></i></div><div class="col sp"><div class="row"><div class="tb" style="font-size:15px">Пришла зарплата</div><span class="sp"></span><div class="lbl" style="color:var(--soft)">сейчас</div></div><div class="ts soft" style="font-size:13.5px">72&nbsp;000&nbsp;₽ · раскладываем по конвертам</div></div>`);
    const P = { open: centerOf(openBtn), vac: centerOf(vacRow), sal: centerOf(salNum), amt: falls.map(f => centerOf(f.querySelector('.sm'))), note: centerOf(note), fam: null };
    const fallVals = [23400, 9500, 12000, 12400, 7200, 7500];
    const lifeEl = $('c2-home', '[data-a="life"]'), saveEl = $('c2-home', '[data-a="saveSum"]'), spendEl = $('c2-home', '[data-a="spendSum"]');

    home.style.visibility = 'visible';
    init(() => {
      totEl.textContent = fmt(228000) + NB + '₽';
      rows.forEach((r, i) => { r.querySelector('.sm').textContent = fmt(before[i]) + NB + '₽'; });
      status.forEach(s => { s.innerHTML = 'ждёт зарплату'; });
      bufTxt.innerHTML = '1,7 месяца жизни · цель 3'; vacTxt.innerHTML = 'к 1 июня · 28% цели';
      linkTxt.textContent = 'Зарплата 10 декабря разложится сама';
    });
    segs.forEach((s, i) => tl.set(s, { flexGrow: Math.max(before[i] / 1000, .001), opacity: before[i] ? 1 : 0 }, 0));
    tl.fromTo(shade, { opacity: 1 }, { opacity: 0, duration: .45, ease: 'power2.out' }, 0);
    // 0.7 — уведомление
    tl.set(note, { yPercent: -160, opacity: 0 }, 0)
      .to(note, { yPercent: 0, opacity: 1, duration: .6, ease: 'expo.out' }, .7)
      .to(note, { yPercent: -160, opacity: 0, duration: .3, ease: 'power2.out' }, 2.5);
    tap(note, 2.05, P.note);
    // 2.7 — раскладка: монеты летят из суммы в конверты
    rise('c2-home', 'c2-salary', 2.7);
    count(salNum, 0, 72000, 3.0, 1.0, '+');
    tl.set(falls, { opacity: 0, y: 16 }, 0);
    falls.forEach((f, i) => {
      const at = 3.9 + i * .34, bar = f.querySelector('.bar i'), chk = f.querySelector('.check'), amt = f.querySelector('.sm');
      tl.to(f, { opacity: 1, y: 0, duration: .4 }, at - .1);
      [0, .07, .14].forEach((d, k) => {
        const coin = add('coin'), t0 = at + d;
        tl.set(coin, { x: P.sal.x - 70 + k * 14, y: P.sal.y, scale: .4, opacity: 0 }, 0)
          .to(coin, { opacity: 1, scale: .7, duration: .12, ease: 'power2.out' }, t0)
          .to(coin, { x: P.amt[i].x, duration: .44, ease: 'power1.in' }, t0 + .04)
          .to(coin, { y: P.amt[i].y, duration: .44, ease: 'power2.out' }, t0 + .04)
          .to(coin, { opacity: 0, scale: .25, duration: .12, ease: 'power2.in' }, t0 + .42);
      });
      count(amt, 0, fallVals[i], at + .46, .5);
      pulse(amt, at + .5, 1.08);
      tl.set(bar, { scaleX: 0, transformOrigin: '0 50%' }, 0).to(bar, { scaleX: 1, duration: .6 }, at + .5);
      tl.set(chk, { scale: .5, opacity: 0, transformOrigin: '50% 50%' }, 0).to(chk, { scale: 1, opacity: 1, duration: .4, ease: 'back.out(2.4)' }, at + .9);
    });
    stagger([$('c2-salary', '[data-anim="sal-done"]'), $('c2-salary', '[data-anim="sal-buf"]')], 6.4, .22);
    tap(openBtn, 8.6, P.open);
    // 9.2 — счёт после раскладки
    tl.set(home, { visibility: 'visible', yPercent: 0, scale: .94, opacity: .4 }, 9.2)
      .to(home, { scale: 1, opacity: 1, duration: .6, ease: 'expo.out' }, 9.2)
      .to(V('c2-salary'), { yPercent: 100, duration: .6, ease: 'expo.out' }, 9.2)
      .set(V('c2-salary'), { visibility: 'hidden' }, 9.82);
    const tot = { v: 228000 }; init(() => { tot.v = 228000; });
    tl.to(tot, { v: 300000, duration: 1.6, ease: 'power2.out', onUpdate: () => { totEl.textContent = fmt(tot.v) + NB + '₽'; } }, 9.7);
    count(lifeEl, 1.7, 1.8, 10.2, .5, '', '', fmt1); pulse(lifeEl, 10.7, 1.06);
    count(saveEl, 176400, 196000, 9.8, 1.0); count(spendEl, 51600, 104000, 10.1, 1.2);
    count($('c2-home', '[data-a="today"]'), 55.58, 61.75, 10.0, 1.0, '', '', v => v.toFixed(2).replace('.', ','));
    rows.forEach((r, i) => {
      const o = { v: before[i] }, el = r.querySelector('.sm'), at = 9.8 + i * .16;
      init(() => { o.v = before[i]; });
      tl.to(o, { v: after[i], duration: .9, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v) + NB + '₽'; } }, at);
      tl.to(segs[i], { flexGrow: after[i] / 1000, opacity: 1, duration: .9 }, at);
      tl.fromTo(r.querySelector('.av'), { scale: 1 }, { scale: 1.16, duration: .2, ease: 'power2.out', yoyo: true, repeat: 1, transformOrigin: '50% 50%' }, at);
    });
    status.forEach((s, i) => tl.call(() => { s.innerHTML = readyHTML[i]; }, null, 9.8 + (i + 2) * .16 + .45));
    tl.call(() => { bufTxt.innerHTML = bufAfter; }, null, 10.3);
    tl.call(() => { vacTxt.innerHTML = vacAfter; }, null, 10.46);
    tl.call(() => { linkTxt.textContent = 'Следующая раскладка — аванс 25 декабря'; }, null, 10.9);
    tap(vacRow, 12.9, P.vac);
    // 13.5 — общий конверт: взнос появляется в ленте, сумма и полоса растут
    push('c2-home', 'c2-family', 13.5);
    const fbar = $('c2-family', '[data-anim="fam-bar"]'), feed = $('c2-family', '[data-anim="fam-feed"]'), famNum = $('c2-family', '[data-anim="fam-num"]');
    const feedH = feed.getBoundingClientRect().height, famP = centerOf(famNum);
    tl.set(fbar, { width: '33.3%' }, 0);
    tl.set(feed, { height: 0, opacity: 0, marginBottom: -13, overflow: 'hidden' }, 0)
      .to(feed, { height: feedH, marginBottom: 0, duration: .5, ease: 'power3.out' }, 14.3)
      .to(feed, { opacity: 1, duration: .35, ease: 'power2.out' }, 14.42);
    count(famNum, 40000, 46000, 14.5, .8);
    count($('c2-family', '[data-anim="fam-m"]'), 12000, 18000, 14.5, .8);
    tl.to(fbar, { width: '38.3%', duration: .8 }, 14.5);
    tap(famNum, 15.85, famP);
    // 16.5 — прогноз: линия и заливка рисуются вместе
    push('c2-family', 'c2-forecast', 16.5);
    const line = $('c2-forecast', '[data-anim="fc-line"]'), svg = line.closest('svg'), len = line.getTotalLength();
    const NS = 'http://www.w3.org/2000/svg', cp = document.createElementNS(NS, 'clipPath'), cr = document.createElementNS(NS, 'rect');
    cp.id = 'fcclip'; cr.setAttribute('x', 0); cr.setAttribute('y', 0); cr.setAttribute('height', 196); cr.setAttribute('width', 368); cp.appendChild(cr); svg.querySelector('defs').appendChild(cp);
    svg.querySelector('path[fill^="url"]').setAttribute('clip-path', 'url(#fcclip)');
    tl.set(cr, { attr: { width: 0 } }, 0).to(cr, { attr: { width: 368 }, duration: 1.2, ease: 'power2.inOut' }, 16.9);
    tl.set(line, { strokeDasharray: len, strokeDashoffset: len }, 0).to(line, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 16.9);
    const dots = [...svg.querySelectorAll('circle')];
    tl.set(dots.slice(1), { scale: .5, opacity: 0, transformOrigin: '50% 50%' }, 0);
    tl.to(dots[1], { scale: 1, opacity: 1, duration: .4, ease: 'back.out(2.4)' }, 18.0).to(dots[2], { scale: 1, opacity: 1, duration: .4, ease: 'back.out(2.4)' }, 18.2);
    stagger($$('c2-forecast', '.body > .card').slice(1), 18.2, .14);
    loopOut(20.4);
  }

  tl.call(() => inits.forEach(f => f()), null, .005);
  window.__seek = t => { tl.time(Math.max(t, 0.001), false); };
  window.__dur = tl.duration();
  document.fonts.ready.then(() => {
    tl.time(0.001, false);
    window.__ready = true;
    if (live) {
      document.body.classList.add('live');
      const fit = () => { document.documentElement.style.zoom = Math.min(innerHeight / 1040, innerWidth / 540); };
      fit(); addEventListener('resize', fit);
      tl.eventCallback('onComplete', () => tl.restart());
      tl.play();
      document.addEventListener('click', () => tl.paused(!tl.paused()));
    }
  });
})();
