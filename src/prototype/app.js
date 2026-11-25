/* Кликабельный прототип: один экран телефона, настоящие нажатия, состояние счёта живёт в памяти страницы.
   Экраны берутся из тех же шаблонов, что и слайды. Переходы — transform и opacity, кривая expo.out. */
(() => {
  const { buildDevice, buildView, icon } = window.Proto;
  const NB = ' ';
  const fmt = n => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NB);
  const rub = n => fmt(n) + NB + '₽';
  const fmt1 = v => v.toFixed(1).replace('.', ',');
  const fmt2 = v => v.toFixed(2).replace('.', ',');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const EXP = 84000;                       // расходы семьи в месяц, от них считается запас прочности
  const CHK = '<div class="check" style="width:22px; height:22px"><i data-ic="check" data-s="14" data-w="3" style="color:var(--on-mint)"></i></div>';
  const RAD = '<div class="radio" style="width:22px; height:22px"></div>';

  // ───────── состояние ─────────
  const fresh1 = () => ({ total: 300000, core: 240000, stage: 'half', ops: [], shown: null, penalty: false });
  const fresh2 = () => ({ salary: false, env: [142800, 33600, 0, 0, 0, 51600], shown: null, feed: [] });   // до зарплаты 10-го: 228 000 ₽
  let A = fresh1(), B = fresh2();
  const flow = () => A.total - A.core;
  const rate = () => ({ new: 10.5, half: 11.5, full: 12.5 }[A.stage]) - (A.penalty ? 1 : 0);
  const months = () => A.core / EXP;
  const avgAll = () => (A.core * rate() + flow() * 6) / A.total;                 // средняя ставка по счёту: запас по сетке, на каждый день 6% на новые деньги

  // ───────── сцена ─────────
  const mobile = Math.min(innerWidth, innerHeight) < 620;
  document.body.classList.toggle('mobile', mobile);
  const fitEl = document.getElementById('fit');
  const device = buildDevice([]);
  fitEl.appendChild(device);
  const screen = device.querySelector('.screen');
  const fit = () => {
    const w = mobile ? 440 : 477, h = mobile ? 956 : 987, pad = mobile ? 0 : 40;
    const k = Math.min((innerWidth - pad) / w, (innerHeight - pad) / h, mobile ? 9 : 1.15);
    fitEl.style.transform = `scale(${k})`;
  };
  fit(); addEventListener('resize', fit);
  const add = (cls, html = '') => { const e = document.createElement('div'); e.className = cls; e.innerHTML = html; screen.appendChild(e); e.querySelectorAll('[data-ic]').forEach(icon); return e; };
  const gs = buildView('c1-offer').querySelector('.status'); gs.className = 'status gstatus'; screen.appendChild(gs); add('home-ind');
  const pill = add('menu-pill tp', '<i data-ic="grid" data-s="14"></i><span>Сценарии</span>');
  const toastEl = add('toast');
  let toastT;
  const toast = text => { toastEl.textContent = text; clearTimeout(toastT); gsap.killTweensOf(toastEl); gsap.fromTo(toastEl, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .35, ease: 'power3.out' }); toastT = setTimeout(() => gsap.to(toastEl, { y: 10, opacity: 0, duration: .2, ease: 'power2.out' }), 2400); };
  const centerOf = el => { const r = el.getBoundingClientRect(), s = screen.getBoundingClientRect(), k = s.width / 440; return { x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height / 2) / k }; };
  const burst = (p, n = 12, r = 70, r0 = 30) => {
    if (reduced) return;
    const ringEl = add('halo-ring');
    gsap.fromTo(ringEl, { x: p.x, y: p.y, scale: .5, opacity: .9 }, { scale: 1.4, opacity: 0, duration: .75, ease: 'power2.out', onComplete: () => ringEl.remove() });
    for (let k = 0; k < n; k++) {
      const a = (Math.PI * 2 * k) / n + (k % 2 ? .18 : 0), d = r * (k % 2 ? 1 : .72), s = add('spark');
      gsap.fromTo(s, { x: p.x + Math.cos(a) * r0, y: p.y + Math.sin(a) * r0, scale: 1, opacity: 1 }, { x: p.x + Math.cos(a) * d, y: p.y + Math.sin(a) * d, scale: .3, opacity: 0, duration: .8, ease: 'power2.out', onComplete: () => s.remove() });
    }
  };
  const count = (el, from, to, f = rub, dur = .8) => { if (reduced) { el.textContent = f(to); return; } const o = { v: from }; gsap.to(o, { v: to, duration: dur, ease: 'power2.out', onUpdate: () => { el.textContent = f(o.v); } }); };
  const pulse = (el, k = 1.1) => gsap.timeline().to(el, { scale: k, duration: .16, ease: 'power2.out', transformOrigin: '50% 50%' }).to(el, { scale: 1, duration: .5, ease: 'back.out(2.6)' });
  const arcs = ring => [0, 1, 2].map(i => ring.querySelector(`.arc[data-i="${i}"]`));
  const arcSet = (ring, vals, animate) => arcs(ring).forEach((a, i) => {
    const p = vals[i], dash = `${Math.max(+a.dataset.len * p, .01)} ${a.dataset.c}`, op = p >= 1 ? 1 : p > 0 ? .38 : 0;
    if (animate) { a.setAttribute('stroke-dasharray', `0.01 ${a.dataset.c}`); a.style.opacity = op; gsap.to(a, { attr: { 'stroke-dasharray': dash }, duration: .6, ease: 'power2.inOut', delay: .25 + i * .32 }); }
    else { a.setAttribute('stroke-dasharray', dash); a.style.opacity = op; }
  });
  const bonuses = () => { const p3 = Math.min(months() / 3, 1); return [1, A.stage === 'new' || A.penalty ? 0 : 1, A.stage === 'full' ? 1 : Math.min(p3, .95)]; };

  // ───────── экраны и переходы ─────────
  const views = {}, wire = {}, enter = {}, after = {};
  const HUB = `<div class="view" data-view="hub">
    <div class="glow" style="opacity:.6"></div>
    <div class="body" style="padding-top:76px; gap:14px">
      <div class="col gap8" style="padding:0 4px 4px"><div class="lbl">Прототип для теста</div><div class="h1">Накопительный счёт первого выбора</div><div class="t">Выберите сценарий. Всё нажимается, деньги не настоящие. Вернуться сюда — кнопка «Сценарии» вверху.</div></div>
      <div class="card hi" style="gap:6px; padding:16px 16px 8px">
        <div class="lbl" style="color:#9FE0B7; padding:0 2px 4px">Этап 1 · Счёт, которым платят</div>
        ${[['c1-open', 'spark', 'Открыть счёт', 'запас на месяц и автопополнение'], ['c1-pay', 'pay', 'Счёт и оплата покупки', 'кольцо ставки, SberPay'], ['c1-month', 'cal', 'Итоги месяца', 'новая надбавка и запас в месяцах'], ['c1-dip', 'bag', 'Не хватает на покупку', 'три варианта и чем они обернутся']].map(s => `<div class="row sc" data-sc="${s[0]}"><div class="av s g"><i data-ic="${s[1]}" data-s="18" class="mint"></i></div><div class="col sp"><div class="tb">${s[2]}</div><div class="ts" style="font-size:13px">${s[3]}</div></div><i data-ic="chev" data-s="16" class="soft"></i></div>`).join('')}
      </div>
      <div class="card" style="gap:6px; padding:16px 16px 8px">
        <div class="lbl" style="padding:0 2px 4px">Этап 2 · Один счёт на все цели</div>
        ${[['c2-salary', 'wallet', 'Счёт и зарплата', 'раскладка по конвертам'], ['c2-new', 'plus', 'Новый конверт', 'цель, взнос и правило'], ['c2-family', 'users', 'Общий конверт', 'семья, доступ, прогноз'], ['c2-borrow', 'car', 'Трата вне плана', 'откуда взять и чем это обернётся']].map(s => `<div class="row sc" data-sc="${s[0]}"><div class="av s n"><i data-ic="${s[1]}" data-s="18" class="soft"></i></div><div class="col sp"><div class="tb">${s[2]}</div><div class="ts" style="font-size:13px">${s[3]}</div></div><i data-ic="chev" data-s="16" class="soft"></i></div>`).join('')}
      </div>
    </div></div>`;
  const view = id => {
    if (views[id]) return views[id];
    let v;
    if (id === 'hub') { const t = document.createElement('div'); t.innerHTML = HUB; v = t.firstElementChild; v.querySelectorAll('[data-ic]').forEach(icon); }
    else v = buildView(id);
    v.style.visibility = 'hidden';
    screen.insertBefore(v, pill);
    views[id] = v;
    v.addEventListener('click', e => {                       // общие правила
      const b = e.target.closest('.nav .ic-btn'); if (b && b.querySelector('[data-ic="back"],[data-ic="close"]')) return back();
      const tab = e.target.closest('.tabbar .tab'); if (tab) { const k = tab.dataset.tab; if (tab.classList.contains('on')) return; if (id === 'c1-home' && k === 'ins') return go('c1-growth'); if (id === 'c1-growth' && k === 'acc') return back(); return toast('В прототипе этот раздел не открыт'); }
      const tg = e.target.closest('.tog'); if (tg && !tg.dataset.own) tg.classList.toggle('off');
    });
    wire[id] && wire[id](v);
    v.querySelectorAll('.cta, .nav .ic-btn, .sc, .chip, .tab').forEach(el => el.classList.add('tp'));
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
    cur = id;
  };
  const go = (id, mode = 'push', opts) => { if (busy || id === cur) return; stack.push({ id: cur, mode }); nav(id, mode, opts); };
  const back = () => { if (busy) return; const p = stack.pop() || { id: 'hub', mode: 'push' }; nav(p.id || 'hub', p.mode === 'rise' ? 'drop' : 'back'); };
  const home = (id, mode = 'push', opts) => { stack = id === 'hub' ? [] : [{ id: 'hub', mode: 'push' }]; nav(id, mode, opts); };
  const swap = (id, mode, opts) => nav(id, mode, opts);      // заменить текущий экран, не запоминая его
  pill.addEventListener('click', () => cur !== 'hub' && home('hub', 'back'));

  // шторки
  const sheetIn = v => { const sh = v.querySelector('.sheet'), sc = v.querySelector('.scrim'); if (reduced) { gsap.set(sc, { opacity: 1 }); gsap.set(sh, { yPercent: 0 }); return; } gsap.fromTo(sc, { opacity: 0 }, { opacity: 1, duration: .3, ease: 'power2.out', delay: .08 }); gsap.fromTo(sh, { yPercent: 104 }, { yPercent: 0, duration: .5, ease: E, delay: .1 }); };
  const choose = (v, i) => v.querySelectorAll('.sheet > .card').forEach((c, k) => { c.classList.toggle('hi', k === i); c.classList.toggle('flat', k !== i); c.querySelector('.radio').classList.toggle('on', k === i); const ts = c.querySelector('.ts'); if (ts) ts.classList.toggle('soft', k === i); });
  const chosen = v => [...v.querySelectorAll('.sheet > .card')].findIndex(c => c.classList.contains('hi'));
  // варианты «не хватает»: ничего не выбрано заранее, главная кнопка ждёт выбора
  const oList = v => [...v.querySelectorAll('.sheet > .opt')];
  const oPick = (v, i) => oList(v).forEach((c, k) => { c.classList.toggle('hi', k === i); c.querySelector('.radio').classList.toggle('on', k === i); });
  const oKind = v => { const c = oList(v).find(c => c.classList.contains('hi')); return c ? c.dataset.opt : ''; };
  const arm = (v, label) => { const b = v.querySelector('.sheet .cta'); b.classList.toggle('wait', !label); b.textContent = label || 'Выберите вариант'; if (label) gsap.fromTo(b, { scale: .97 }, { scale: 1, duration: .35, ease: 'back.out(2.2)' }); };

  // ═════════════ главный список ═════════════
  wire.hub = v => on(v, '.sc', t => {
    const s = t.dataset.sc;
    if (s === 'c1-open') { A = fresh1(); A.stage = 'new'; home('c1-offer'); }
    else if (s === 'c1-pay') { if (A.stage === 'new' && !A.opened) A = fresh1(); home('c1-home'); }
    else if (s === 'c1-month') { if (A.stage !== 'half') A = fresh1(); home('c1-home', 'none'); go('c1-month'); }
    else if (s === 'c1-dip') { A = fresh1(); A.total = 296520; home('c1-home', 'none'); go('c1-dip', 'rise'); }
    else if (s === 'c2-salary') { B = fresh2(); home('c2-home'); }
    else if (s === 'c2-new') { home('c2-home', 'none'); go('c2-new'); }
    else if (s === 'c2-family') { home('c2-home', 'none'); go('c2-family'); }
    else if (s === 'c2-borrow') { home('c2-home', 'none'); go('c2-borrow', 'rise'); }
  });

  // ═════════════ концепция 1 ═════════════
  wire['c1-offer'] = v => on(v, '.foot .cta', () => go('c1-floor'));

  wire['c1-floor'] = v => {
    const num = v.querySelector('[data-anim="floor-num"]'), fil = v.querySelector('.slider .fil'), knb = v.querySelector('.slider .knb'), sl = v.querySelector('.slider');
    const q = a => v.querySelector(`[data-a="${a}"]`), presets = [...v.querySelectorAll('.preset')];
    const set = p => {
      A.core = Math.min(Math.max(30000, Math.round(p * A.total / 1000) * 1000), A.total);
      const k = A.core / A.total * 100;
      num.textContent = rub(A.core); fil.style.width = k + '%'; knb.style.left = k + '%';
      q('floorEarn').textContent = `+${rub(A.core * .105 * 31 / 365)} за месяц`;
      q('floorCore').textContent = rub(A.core); q('floorFlow').textContent = rub(flow());
      presets.forEach(x => x.classList.toggle('on', +x.dataset.preset === A.core));
    };
    v._set = set;
    // ползунок: шаг 5 000 ₽; тянется сама дорожка, а не вся карточка — пресеты и ввод суммы нажимаются отдельно
    let drag = false;
    const move = e => { const r = sl.getBoundingClientRect(); set(Math.round(Math.min(1, Math.max(.1, (e.clientX - r.left) / r.width)) * A.total / 5000) * 5000 / A.total); };
    sl.style.touchAction = 'none'; sl.style.cursor = 'grab';
    sl.addEventListener('pointerdown', e => { drag = true; sl.setPointerCapture(e.pointerId); gsap.to(knb, { scale: 1.18, duration: .15 }); move(e); });
    sl.addEventListener('pointermove', e => drag && move(e));
    const up = () => { if (drag) { drag = false; gsap.to(knb, { scale: 1, duration: .35, ease: 'back.out(2.4)' }); } };
    sl.addEventListener('pointerup', up); sl.addEventListener('pointercancel', up);
    on(v, '.preset', t => { set(+t.dataset.preset / A.total); pulse(num, 1.04); });
    // ввод суммы: нажатие на число открывает поле, Enter или уход из поля — применить
    on(v, '[data-a="amount"]', () => {
      if (v.querySelector('.amount input')) return;
      const inp = document.createElement('input'); inp.type = 'text'; inp.inputMode = 'numeric'; inp.value = A.core;
      inp.style.cssText = 'font:inherit; font-family:"Geologica Variable",sans-serif; font-size:50px; font-weight:600; letter-spacing:-1.6px; color:var(--ink); background:transparent; border:0; outline:0; width:250px; padding:0; user-select:text; -webkit-user-select:text';
      num.style.display = 'none'; num.before(inp); inp.focus(); inp.select();
      const fin = () => { const x = +inp.value.replace(/\D/g, ''); inp.remove(); num.style.display = ''; if (x) set(x / A.total); };
      inp.addEventListener('blur', fin); inp.addEventListener('keydown', e => e.key === 'Enter' && inp.blur());
    });
    on(v, '.foot .cta', () => go('c1-stream'));
  };
  enter['c1-floor'] = v => v._set(A.core / A.total);

  wire['c1-stream'] = v => {
    const togs = [...v.querySelectorAll('.tog')], sums = [12000, 5000, 1400, 0], names = ['с зарплаты', 'из другого банка', 'округление', 'остаток месяца'], big = v.querySelector('.card.hi .big'), year = v.querySelector('.card.hi .sm'), sub = v.querySelector('[data-a="streamSub"]');
    let shown = 12000;
    const paint = animate => {
      const s = togs.reduce((a, x, i) => a + (x.classList.contains('off') ? 0 : sums[i]), 0), onNames = names.filter((n, i) => !togs[i].classList.contains('off'));
      if (animate) count(big, shown, s, x => '+' + rub(x), .5); else big.textContent = '+' + rub(s); shown = s;
      year.textContent = '≈ ' + rub(Math.round((A.total + s * 12 + (A.total + s * 6) * .112) / 5000) * 5000);
      sub.textContent = onNames.length ? `Включено: ${onNames.join(', ')}.${onNames.length < 4 ? ' Остальное включите сами, когда захотите' : ''}` : 'Ничего не включено: счёт будет расти только от ваших пополнений';
    };
    togs.forEach(t => { t.dataset.own = 1; t.classList.add('tp'); t.addEventListener('click', () => { t.classList.toggle('off'); paint(true); }); });
    v._paint = paint;
    on(v, '.foot .cta', () => { A.stage = 'new'; A.opened = true; A.shown = null; home('c1-home'); toast('Счёт открыт. Запас оставлен на декабрь'); });
  };
  enter['c1-stream'] = v => v._paint(false);

  const habit = (el, done, title, sub, mint) => { el.innerHTML = `${done ? CHK : RAD}<div class="col sp"><div class="tb" style="font-size:15.5px">${title}</div><div class="ts${mint ? ' mint' : ''}" style="font-size:13px">${sub}</div></div>`; el.querySelectorAll('[data-ic]').forEach(icon); };
  let tickRAF, tickV = 51.28;
  wire['c1-home'] = v => {
    on(v, '[data-anim="c1-paybtn"]', () => go('c1-pay', 'rise'));
    const acts = v.querySelectorAll('.body > .row > .col');
    acts[0].classList.add('tp'); acts[2].classList.add('tp');
    acts[0].addEventListener('click', () => { A.total += 5000; renderHome(v, true); toast('+5 000 ₽ с карты — на каждый день'); });
    on(v, '[data-a="over"]', () => toast('Вклад и фонд: в прототипе раздел не открыт'));
    acts[2].addEventListener('click', () => toast('Перевод в прототипе не настроен'));
    on(v, '[data-anim="ratecard"]', () => go(A.stage === 'full' ? 'c1-growth' : 'c1-month'));
  };
  const renderHome = (v, animate) => {
    const tot = v.querySelector('[data-anim="c1-total"]'), fl = v.querySelector('[data-anim="c1-flow-num"]'), lay = v.querySelectorAll('.layers i');
    const leg = v.querySelector('.layers + .row .ts');
    if (animate && A.shown) { count(tot, A.shown.total, A.total); count(fl, A.shown.flow, flow()); gsap.to(lay[0], { flexGrow: A.core / 1000, duration: .8 }); gsap.to(lay[1], { flexGrow: Math.max(flow() / 1000, .5), duration: .8 }); }
    else { tot.textContent = rub(A.total); fl.textContent = rub(flow()); gsap.set(lay[0], { flexGrow: A.core / 1000 }); gsap.set(lay[1], { flexGrow: Math.max(flow() / 1000, .5) }); }
    leg.innerHTML = `<span class="ink" style="font-weight:600">Запас</span> ${rub(A.core)}`;
    const ring = v.querySelector('.ring'), rv = ring.querySelector('.ring-v'), hs = v.querySelectorAll('[data-habit]'), m = months();
    const changed = !A.shown || A.shown.rate !== rate();
    arcSet(ring, bonuses(), changed);
    if (changed) { const o = { v: 9.5 }; rv.textContent = '9,5%'; gsap.to(o, { v: rate(), duration: .9, delay: .5, ease: 'power2.out', onUpdate: () => { rv.textContent = fmt1(o.v) + '%'; }, onComplete: () => pulse(rv, 1.12) }); }
    else rv.textContent = fmt1(rate()) + '%';
    habit(hs[0], true, 'Приток', 'зарплата приходит сюда');
    habit(hs[1], A.stage !== 'new' && !A.penalty, 'Стаж', A.penalty ? 'минус ступень · вернуть за 30 дней' : A.stage === 'new' ? '0 из 3 месяцев · ещё +1' : '6 месяцев без снятия', A.stage === 'new' || A.penalty);
    habit(hs[2], A.stage === 'full', 'Запас на три месяца', A.stage === 'full' ? `${fmt1(m)} месяца жизни` : `${fmt1(Math.min(m, 2.9))} из 3 · ещё +1`, A.stage !== 'full');
    const lifeEl = v.querySelector('[data-a="life"]'); if (animate && A.shown && A.shown.m !== m) count(lifeEl, A.shown.m, m, fmt1, .8); else lifeEl.textContent = fmt1(m);
    v.querySelector('[data-a="avg"]').innerHTML = `На запас сегодня <b class="ink">${fmt1(rate())}%</b> → до&nbsp;12,5%. В&nbsp;среднем по&nbsp;счёту — ${fmt1(avgAll())}%`;
    const ops = v.querySelector('[data-a="ops"]'), dyn = ops.querySelectorAll('.op-dyn'); dyn.forEach(x => x.remove());
    A.ops.slice(-2).forEach(o => ops.insertAdjacentHTML('afterbegin', `<div class="row op-dyn"><div class="av s n"><i data-ic="bag" data-s="18" class="soft"></i></div><div class="col sp"><div class="tb">${o.name}</div><div class="ts">${o.from}</div></div><div class="sm">−${rub(o.sum)}</div></div>`));
    ops.querySelectorAll('.op-dyn [data-ic]').forEach(icon);
    [...ops.querySelectorAll('.row')].forEach((r, i) => { r.style.display = i < 3 ? '' : 'none'; });
    A.shown = { total: A.total, flow: flow(), rate: rate(), m };
  };
  enter['c1-home'] = v => renderHome(v, !!A.shown);
  after['c1-home'] = v => {
    cancelAnimationFrame(tickRAF);
    const el = v.querySelector('[data-anim="tick"]'); let last = performance.now();
    const step = now => { if (cur !== 'c1-home') return; tickV += (now - last) / 1000 * (A.core * rate() + flow() * 6) / 100 / 365 / 86400; last = now; el.textContent = fmt2(tickV); tickRAF = requestAnimationFrame(step); };
    tickRAF = requestAnimationFrame(step);
  };

  wire['c1-pay'] = v => {
    on(v, '.sheet > .card', t => choose(v, [...v.querySelectorAll('.sheet > .card')].indexOf(t)));
    on(v, '.scrim', () => back());
    on(v, '.sheet .cta', t => {
      const fromAcc = chosen(v) === 0;
      if (fromAcc && flow() < 3480) return toast('На каждый день не хватает — пополните счёт');
      const ic = t.querySelector('i');
      gsap.timeline({ onComplete: () => { if (fromAcc) { A.total -= 3480; A.ops.push({ name: 'Магазин электроники', from: 'с «На каждый день»', sum: 3480 }); } swap('c1-paid', 'rise', { sum: 3480, from: fromAcc ? 'На каждый день' : 'Карта •• 4417', place: 'Магазин электроники' }); } })
        .to(ic, { scale: 1.35, duration: .18, ease: 'power2.out' }).to(ic, { scale: 1, duration: .3, ease: 'back.out(3)' });
    });
  };
  enter['c1-pay'] = v => { choose(v, 0); v.querySelector('[data-a="src"]').textContent = `На каждый день · ${rub(flow())} · 6%`; v.querySelector('[data-a="keep"]').textContent = `Запас ${rub(A.core)} не тронут и копится под ${fmt1(rate())}%`; gsap.set(v.querySelector('.sheet'), { yPercent: 104 }); gsap.set(v.querySelector('.scrim'), { opacity: 0 }); };
  after['c1-pay'] = sheetIn;

  wire['c1-paid'] = v => on(v, '.foot .cta', () => back());
  enter['c1-paid'] = (v, o = {}) => {
    v.querySelector('.body > .col .big').textContent = rub(o.sum || 3480);
    v.querySelector('.body > .col .ts').textContent = `${o.place || 'Магазин электроники'} · 12 декабря, 14:32`;
    const rows = v.querySelectorAll('.body > .card:not(.hi) .row');
    rows[0].querySelector('.tb').textContent = o.from || 'На каждый день';
    rows[1].querySelector('.sm').textContent = rub(flow());
    rows[2].querySelector('.sm').innerHTML = `${rub(A.core)} <span class="r">· ${fmt1(rate())}%</span>`;
    gsap.set(v.querySelector('[data-anim="paid-check"]'), { scale: .5, opacity: 0 });
  };
  after['c1-paid'] = v => { const c = v.querySelector('[data-anim="paid-check"]'); gsap.to(c, { scale: 1, opacity: 1, duration: .55, ease: 'back.out(1.9)', delay: .28, onStart: () => setTimeout(() => burst(centerOf(c), 12, 84, 46), 200) }); gsap.from(v.querySelectorAll('.body > .card'), { opacity: 0, y: 18, duration: .45, stagger: .07, delay: .5, ease: 'power3.out' }); };

  const DIP = { card: 'Доплатить с карты и оплатить', core: 'Взять из запаса и оплатить', parts: 'Оплатить частями' };
  wire['c1-dip'] = v => {
    on(v, '.sheet > .opt', t => { oPick(v, oList(v).indexOf(t)); arm(v, DIP[oKind(v)]); });
    on(v, '.scrim', () => back());
    on(v, '.sheet .cta', () => {
      const k = oKind(v), need = 74990 - flow(); if (!k) return toast('Выберите, чем доплатить');
      let o;
      if (k === 'parts') { A.total -= 12498; A.ops.push({ name: 'Ноутбук · 1 из 6 платежей', from: 'с «На каждый день»', sum: 12498 }); o = { sum: 12498, from: 'На каждый день · 1 из 6', place: 'Ноутбук, оплата частями' }; }
      else if (k === 'core') { A.core -= need; A.total -= 74990; A.penalty = true; A.ops.push({ name: 'Ноутбук', from: 'на каждый день и запас', sum: 74990 }); o = { sum: 74990, from: 'На каждый день и запас', place: 'Ноутбук' }; }
      else { A.total -= flow(); A.ops.push({ name: 'Ноутбук', from: 'на каждый день и карта', sum: 74990 }); o = { sum: 74990, from: 'На каждый день и карта', place: 'Ноутбук' }; }
      swap('c1-paid', 'rise', o);
      if (k === 'core') setTimeout(() => toast('Стаж: минус одна ступень. Вернёте за 30 дней — сохранится'), 900);
    });
  };
  enter['c1-dip'] = v => {
    const need = Math.max(74990 - flow(), 0), o = oList(v);
    oPick(v, -1); arm(v, '');
    v.querySelector('.sheet .h2').textContent = `На каждый день не хватает ${rub(need)}`; v.querySelector('.sheet .h2 + .t').textContent = `Покупка — ${rub(74990)}, на каждый день — ${rub(flow())}.`;
    o[0].querySelector('.ts').textContent = `${rub(need)} с карты. Запас и стаж целы`;
    o[1].querySelector('.ts').textContent = `Запас: ${fmt1(months())} → ${fmt1((A.core - need) / EXP)} месяца жизни`;
    v.querySelector('.sheet .info .ts').innerHTML = `Из запаса ничего не&nbsp;спишем: недополучите около ${rub(need * rate() / 1200)} процентов в&nbsp;месяц. Вернёте за&nbsp;30&nbsp;дней — стаж сохранится.`;
    gsap.set(v.querySelector('.sheet'), { yPercent: 104 }); gsap.set(v.querySelector('.scrim'), { opacity: 0 });
  };
  after['c1-dip'] = sheetIn;

  let M = null;                                              // расчёт итогов месяца
  wire['c1-month'] = v => {
    const tg = v.querySelector('.tog'); tg.dataset.own = 1; tg.classList.add('tp');
    tg.addEventListener('click', () => { tg.classList.toggle('off'); M.move = !tg.classList.contains('off'); paintMonth(v, true); });
    on(v, '.foot .cta', () => {
      if (M.move) A.core += M.left;
      const unlocked = M.move && M.unlock;
      if (unlocked) A.stage = 'full';
      A.shown = null; M = null;
      if (unlocked) { swap('c1-growth', 'push'); } else { back(); toast('Запас оставлен на январь'); }
    });
  };
  const paintMonth = (v, animate) => {
    const fl = v.querySelector('[data-anim="month-floor"]'), pl = v.querySelector('[data-anim="month-pill"]'), un = v.querySelector('[data-anim="unlock"]'), lay = v.querySelectorAll('.body > .card:nth-child(3) .layers i');
    const core = A.core + (M.move ? M.left : 0);
    if (animate) count(fl, M.move ? A.core : core + M.left, core); else fl.textContent = rub(core);
    gsap.to(pl, { opacity: M.move ? 1 : 0, scale: M.move ? 1 : .8, duration: animate ? .3 : 0 });
    gsap.set(lay[0], { flexGrow: A.core / 1000 }); gsap.to(lay[1], { flexGrow: M.move ? Math.max(M.left / 1000, .01) : .01, opacity: M.move ? 1 : 0, duration: .5 }); gsap.set(lay[2], { flexGrow: Math.max((A.total - core) / 1000, .5) });
    const show = M.move && M.unlock;
    if (animate) { gsap.to(un, { opacity: show ? 1 : 0, y: show ? 0 : 20, duration: .45, ease: 'power3.out' }); if (show) unlockShow(v); }
    else gsap.set(un, { opacity: 0, y: 20 });
  };
  const unlockShow = v => {
    const un = v.querySelector('[data-anim="unlock"]'), ring = un.querySelector('.ring'), rv = ring.querySelector('.ring-v'), a3 = arcs(ring)[2];
    arcSet(ring, [1, 1, .95]); rv.textContent = fmt1(rate()) + '%';
    const o = { v: rate() };
    gsap.timeline({ delay: .5 })
      .to(a3, { opacity: 1, attr: { 'stroke-dasharray': `${+a3.dataset.len} ${a3.dataset.c}` }, duration: .9, ease: 'power2.inOut' })
      .to(o, { v: rate() + 1, duration: .55, ease: 'power2.out', onUpdate: () => { rv.textContent = fmt1(o.v) + '%'; } }, '-=.5')
      .call(() => { burst(centerOf(ring), 10, 60, 34); pulse(ring, 1.1); });
  };
  enter['c1-month'] = v => {
    const left = Math.min(12400, Math.max(flow() - 3000, 0));
    M = { left, move: left > 0, unlock: A.stage === 'half' && !A.penalty && (A.core + left) / EXP >= 3 };
    const eC = A.core * rate() / 100 * 31 / 365, eF = flow() * .06 * 31 / 365, sms = v.querySelectorAll('.card.hi .sm');
    M.earn = eC + eF;
    v.querySelector('[data-anim="month-num"]').textContent = '+' + rub(0);
    sms[0].textContent = '+' + rub(eC); sms[1].textContent = '+' + rub(eF);
    v.querySelector('.body > .card:nth-child(2) .tb').innerHTML = left ? `Не потратили ${rub(left)}` : 'Свободного остатка нет';
    v.querySelector('.tog').classList.toggle('off', !left);
    pl(v).textContent = '+' + rub(left);
    gsap.set(v.querySelector('[data-anim="unlock"]'), { opacity: 0, y: 20 });
    paintMonth(v, false);
    gsap.set(v.querySelector('[data-anim="unlock"]'), { opacity: 0, y: 20 });
  };
  const pl = v => v.querySelector('[data-anim="month-pill"]');
  after['c1-month'] = v => {
    count(v.querySelector('[data-anim="month-num"]'), 0, M.earn, x => '+' + rub(x), 1);
    if (M.move) { count(v.querySelector('[data-anim="month-floor"]'), A.core, A.core + M.left, rub, 1); gsap.from(pl(v), { scale: .6, opacity: 0, duration: .5, ease: 'back.out(1.9)', delay: .3 }); }
    if (M.move && M.unlock) { gsap.to(v.querySelector('[data-anim="unlock"]'), { opacity: 1, y: 0, duration: .55, ease: 'back.out(1.5)', delay: 1.1 }); setTimeout(() => cur === 'c1-month' && M && unlockShow(v), 1200); }
  };

  wire['c1-growth'] = v => { on(v, '[data-anim="fullrate"]', () => toast('Ставка действует, пока запас не меньше трёх месяцев')); on(v, '[data-a="over"]', () => toast('Вклад и фонд: в прототипе раздел не открыт')); };
  enter['c1-growth'] = v => {
    const m = months(), tanks = v.querySelectorAll('.tank');
    v.querySelector('[data-anim="life"]').textContent = fmt1(Math.max(m - .1, 0));
    v.querySelector('[data-a="lifeSub"]').textContent = `${rub(A.core)} при расходах около ${rub(EXP)} в месяц`;
    gsap.set(v.querySelector('[data-a="six"]'), { scaleX: 0, transformOrigin: '0 50%' }); v.querySelector('[data-a="six"]').style.width = Math.min(m / 6, 1) * 100 + '%';
    tanks.forEach(t => { gsap.set(t.querySelector('.liq'), { yPercent: 100 }); t.querySelector('.tl').style.color = '#7F8D86'; });
    const full = m >= 3, gp = v.querySelector('[data-anim="goal-pill"]');
    gp.innerHTML = full ? '<i data-ic="check" data-s="14" data-w="3"></i>набраны' : `ещё ${rub(Math.max(3 * EXP - A.core, 0))}`; gp.querySelectorAll('[data-ic]').forEach(icon);
    const ring = v.querySelector('.ring'); arcSet(ring, [0, 0, 0]); ring.querySelector('.ring-v').textContent = fmt1(rate()) + '%';
    const txt = v.querySelectorAll('[data-anim="fullrate"] .col > div');
    txt[0].textContent = A.stage === 'full' ? 'Все три надбавки ваши' : 'Две надбавки из трёх'; txt[2].textContent = A.stage === 'full' ? 'ставка с января — 12,5%' : `ставка сейчас — ${fmt1(rate())}%`;
  };
  after['c1-growth'] = v => {
    const m = months(), tanks = [...v.querySelectorAll('.tank')], life = v.querySelector('[data-anim="life"]');
    tanks.forEach((t, i) => { const lv = Math.min(Math.max(m - i, 0), 1); gsap.to(t.querySelector('.liq'), { yPercent: (1 - lv) * 100, duration: 1, ease: 'power2.inOut', delay: .4 + i * .42 }); if (lv > .3) gsap.to(t.querySelector('.tl'), { color: '#06140B', duration: .3, delay: 1 + i * .42 }); });
    setTimeout(() => { if (cur !== 'c1-growth') return; count(life, Math.max(m - .1, 0), m, fmt1, .3); pulse(life, 1.1); if (m >= 3) pulse(tanks[2], 1.05); }, 2200);
    arcSet(v.querySelector('.ring'), bonuses(), true);
    gsap.to(v.querySelector('[data-a="six"]'), { scaleX: 1, duration: .9, delay: 1.9, ease: 'power3.out' });
  };

  // ═════════════ концепция 2 ═════════════
  const ADD = [7200, 12400, 23400, 9500, 12000, 7500];       // зарплата 10-го, 72 000 ₽: прибавка конвертам (в порядке конвертов счёта)
  wire['c2-home'] = v => {
    v._ready = [2, 3, 4].map(i => v.querySelector(`[data-env="${i}"] .ts`).innerHTML);
    on(v, '[data-env]', t => { const i = +t.dataset.env;
      if (i === 1) go('c2-family'); else if (i === 3) go('c2-autopay'); else if (i === 5) go('c2-borrow', 'rise');
      else if (i === 0) toast(`Запас: ${fmt1(B.env[0] / EXP)} месяца жизни. Цель — 3`); else toast(B.salary ? 'Конверт заплатит сам в срок' : 'Конверт ждёт зарплату'); });
    on(v, '.card.flat', () => B.salary ? go('c2-rule') : go('c2-salary', 'rise'));
    on(v, '.nav .ic-btn:last-child', () => go('c2-new'));
  };
  const render2 = (v, animate) => {
    const tot = v.querySelector('[data-anim="c2-total"]'), sum = B.env.reduce((a, x) => a + x, 0);
    const prev = B.shown;
    if (animate && prev) count(tot, prev.sum, sum, rub, 1.2); else tot.textContent = rub(sum);
    B.env.forEach((x, i) => {
      const el = v.querySelector(`[data-env="${i}"] .sm`), seg = v.querySelector(`[data-seg="${i}"]`);
      if (animate && prev && prev.env[i] !== x) { setTimeout(() => { count(el, prev.env[i], x); pulse(v.querySelector(`[data-env="${i}"] .av`), 1.16); }, i * 130); gsap.to(seg, { flexGrow: Math.max(x / 1000, .001), opacity: x ? 1 : 0, duration: .9, delay: i * .13 }); }
      else { el.textContent = rub(x); gsap.set(seg, { flexGrow: Math.max(x / 1000, .001), opacity: x ? 1 : 0 }); }
    });
    [2, 3, 4].forEach((i, k) => { v.querySelector(`[data-env="${i}"] .ts`).innerHTML = B.env[i] ? v._ready[k] : 'ждёт зарплату'; });
    v.querySelector('[data-env="0"] .ts').textContent = `${fmt1(B.env[0] / EXP)} месяца жизни · цель 3`;
    const lf = v.querySelector('[data-a="life"]'), m = B.env[0] / EXP; if (animate && prev && prev.m !== m) count(lf, prev.m, m, fmt1, .9); else lf.textContent = fmt1(m);
    v.querySelector('[data-a="today"]').textContent = fmt2((B.env[0] + B.env[1]) * 11.5 / 36500);
    v.querySelector('[data-a="saveSum"]').textContent = rub(B.env[0] + B.env[1]); v.querySelector('[data-a="spendSum"]').textContent = rub(sum - B.env[0] - B.env[1]);
    v.querySelector('[data-env="1"] .ts').textContent = `к 1 июня · ${Math.round(B.env[1] / 1200)}% цели`;
    const link = v.querySelector('.card.flat');
    link.querySelector('.ts').textContent = B.salary ? 'Следующая раскладка — аванс 25 декабря' : 'Получить зарплату 72 000 ₽';
    link.style.boxShadow = B.salary ? '' : 'inset 0 0 0 1.5px rgba(87,217,138,.6)';
    B.shown = { sum, env: [...B.env], m };
  };
  enter['c2-home'] = v => render2(v, !!B.shown);

  wire['c2-salary'] = v => on(v, '.foot .cta', () => { if (!B.salary) { B.salary = true; B.env = B.env.map((x, i) => x + ADD[i]); } back(); });
  enter['c2-salary'] = v => { v.querySelectorAll('[data-fall]').forEach(f => { gsap.set(f, { opacity: 0, y: 16 }); gsap.set(f.querySelector('.bar i'), { scaleX: 0, transformOrigin: '0 50%' }); gsap.set(f.querySelector('.check'), { scale: .5, opacity: 0 }); f.querySelector('.sm').textContent = rub(0); }); gsap.set(v.querySelectorAll('[data-anim="sal-done"], [data-anim="sal-buf"]'), { opacity: 0, y: 18 }); v.querySelector('[data-anim="sal-num"]').textContent = '+' + rub(0); };
  after['c2-salary'] = v => {
    const num = v.querySelector('[data-anim="sal-num"]'), falls = [...v.querySelectorAll('[data-fall]')], vals = [23400, 9500, 12000, 12400, 7200, 7500];
    count(num, 0, 72000, x => '+' + rub(x), 1);
    setTimeout(() => {
      if (cur !== 'c2-salary') return;
      const src = centerOf(num);
      falls.forEach((f, i) => {
        const d = i * .34, amt = f.querySelector('.sm'), to = centerOf(amt);
        gsap.to(f, { opacity: 1, y: 0, duration: .4, delay: d });
        if (!reduced) [0, .07, .14].forEach((dd, k) => { const c = add('coin'); gsap.timeline({ delay: d + .1 + dd, onComplete: () => c.remove() }).set(c, { x: src.x - 70 + k * 14, y: src.y, scale: .4, opacity: 0 }).to(c, { opacity: 1, scale: .7, duration: .12 }).to(c, { x: to.x, duration: .44, ease: 'power1.in' }, '<.04').to(c, { y: to.y, duration: .44, ease: 'power2.out' }, '<').to(c, { opacity: 0, scale: .25, duration: .12 }, '-=.06'); });
        setTimeout(() => { count(amt, 0, vals[i], rub, .5); pulse(amt, 1.08); }, (d + .56) * 1000);
        gsap.to(f.querySelector('.bar i'), { scaleX: 1, duration: .6, delay: d + .6, ease: 'power3.out' });
        gsap.to(f.querySelector('.check'), { scale: 1, opacity: 1, duration: .4, delay: d + 1, ease: 'back.out(2.4)' });
      });
      gsap.to(v.querySelectorAll('[data-anim="sal-done"], [data-anim="sal-buf"]'), { opacity: 1, y: 0, duration: .5, stagger: .22, delay: 2.7, ease: 'power3.out' });
    }, 900);
  };

  wire['c2-new'] = v => {
    on(v, '.body > .row.gap10 > .card', t => v.querySelectorAll('.body > .row.gap10 > .card').forEach(c => { c.classList.toggle('hi', c === t); c.querySelector('.radio').classList.toggle('on', c === t); }));
    on(v, '.chip', t => v.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === t)));
    on(v, '[data-a="term"]', () => toast('Срочный конверт: ставка выше на 1 п.п., если не трогать до даты'));
    on(v, '.foot .cta', () => { toast('Конверт создан'); go('c2-rule'); });
  };
  wire['c2-rule'] = v => { on(v, '.grip', () => toast('Порядок меняется перетаскиванием')); on(v, '.edit', () => toast('Сумму можно изменить: нажмите и введите')); on(v, '.foot .cta', () => { toast('Правило сохранено'); home('c2-home', 'back'); }); };
  wire['c2-autopay'] = v => on(v, '.foot .cta', () => toast('Сумму и дату можно поменять в любой момент'));
  enter['c2-autopay'] = v => gsap.set(v.querySelector('[data-anim="push"]'), { yPercent: -180, opacity: 0, pointerEvents: 'none' });
  after['c2-autopay'] = v => { const p = v.querySelector('[data-anim="push"]'); gsap.timeline({ delay: .6 }).to(p, { yPercent: 0, opacity: 1, duration: .6, ease: E }).to(p, { yPercent: -180, opacity: 0, duration: .28, ease: 'power2.out' }, '+=3.2'); };

  const BOR = { vac: 'Взять из «Отпуска» и оплатить', buf: 'Взять из запаса и оплатить', parts: 'Оплатить частями' };
  wire['c2-borrow'] = v => {
    on(v, '.sheet > .opt', t => { oPick(v, oList(v).indexOf(t)); arm(v, BOR[oKind(v)]); });
    on(v, '.scrim', () => back());
    on(v, '.sheet .cta', () => {
      const k = oKind(v), free = Math.min(B.env[5], 6200); if (!k) return toast('Выберите, откуда взять деньги');
      if (k === 'vac') { B.env[5] -= free; B.env[1] = Math.max(B.env[1] - 11800, 0); } else if (k === 'buf') { B.env[5] -= free; B.env[0] -= 11800; } else B.env[5] = Math.max(B.env[5] - 3000, 0);
      back(); setTimeout(() => toast(k === 'parts' ? 'Оплачено. Первый платёж — 3 000 ₽' : 'Оплачено 18 000 ₽. Вернёте за 30 дней — стаж сохранится'), 500);
    });
  };
  enter['c2-borrow'] = v => { oPick(v, -1); arm(v, ''); oList(v)[1].querySelector('.ts').textContent = `запас: ${fmt1(B.env[0] / EXP)} → ${fmt1((B.env[0] - 11800) / EXP)} месяца жизни`; gsap.set(v.querySelector('.sheet'), { yPercent: 104 }); gsap.set(v.querySelector('.scrim'), { opacity: 0 }); };
  after['c2-borrow'] = sheetIn;

  const famCards = v => [...v.querySelectorAll('.body > .card')];
  wire['c2-family'] = v => {
    on(v, '.foot .cta', () => { if (B.env[5] < 5000) return toast('В свободных меньше 5 000 ₽'); B.env[5] -= 5000; B.env[1] += 5000; paintFam(v, true); toast('+5 000 ₽ из свободных'); });
    on(v, '.nav .ic-btn:last-child', () => go('c2-invite'));
    const inv = famCards(v)[0].querySelectorAll('.row')[2]; inv.classList.add('tp'); inv.addEventListener('click', () => go('c2-invite'));
    on(v, '.body > .col, .body > .bar', () => go('c2-forecast'));
  };
  const paintFam = (v, animate) => {
    const tot = B.env[1], mx = B.salary ? 18000 : 12000, an = Math.max(tot - mx, 0), num = v.querySelector('[data-anim="fam-num"]'), rows = famCards(v)[0].querySelectorAll('.row .sm'), bar = v.querySelector('[data-anim="fam-bar"]'), feed = famCards(v)[1];
    if (animate && v._tot != null) { count(num, v._tot, tot); count(rows[0], v._an, an); pulse(num, 1.05); } else { num.textContent = rub(tot); rows[0].textContent = rub(an); }
    rows[1].textContent = rub(mx);
    // полоса и лента двигаются только через transform: полоса растёт масштабом, строки ленты съезжают вниз под новую
    const w1 = Math.min(tot / 1200, 100), w0 = v._w || w1; bar.style.width = w1 + '%'; gsap.fromTo(bar, { scaleX: w0 / w1 }, { scaleX: 1, transformOrigin: '0 50%', duration: animate ? .8 : 0, ease: 'power3.out' }); v._w = w1;
    if (animate) { feed.insertAdjacentHTML('afterbegin', '<div class="row"><div class="av s round g txt mint" style="font-size:14px">А</div><div class="col sp"><div class="tb">Анна внесла</div><div class="ts">только что</div></div><div class="sm mint">+5&nbsp;000&nbsp;₽</div></div>'); [...feed.children].forEach((r, i) => { if (i > 3) r.remove(); }); const rows = [...feed.children], h = rows[0].getBoundingClientRect().height / (screen.getBoundingClientRect().width / 440) + 13; gsap.from(rows[0], { opacity: 0, y: -10, duration: .35, ease: 'power3.out' }); gsap.from(rows.slice(1), { y: -h, duration: .45, ease: 'power3.out' }); }
    v._tot = tot; v._an = an;
  };
  enter['c2-family'] = v => paintFam(v, false);

  wire['c2-invite'] = v => {
    const roles = v.querySelector('.body > .card'); roles.querySelectorAll('.row').forEach(r => { r.classList.add('tp'); r.addEventListener('click', () => roles.querySelectorAll('.radio').forEach(x => x.classList.toggle('on', r.contains(x)))); });
    on(v, '.foot .cta', () => toast('Ссылка готова: её можно отправить в любой мессенджер'));
  };
  const FC = [['10 мая', 'Ускорить на 2&nbsp;000&nbsp;₽'], ['10 марта', 'Пригласить Максима'], ['18 мая', 'Включить округление']];
  wire['c2-forecast'] = v => {
    const cards = () => [...v.querySelectorAll('.body > .card')].slice(1), big = v.querySelector('.body > .col .big');
    on(v, '.body > .card', t => { const i = cards().indexOf(t); if (i < 0) return; cards().forEach((c, k) => { c.classList.toggle('hi', k === i); c.classList.toggle('flat', k !== i); c.querySelector('.radio').classList.toggle('on', k === i); }); big.textContent = FC[i][0]; pulse(big, 1.06); v.querySelector('.foot .cta').innerHTML = FC[i][1]; });
    on(v, '.foot .cta', () => { toast('Готово: цель придёт раньше'); back(); });
  };
  enter['c2-forecast'] = v => { v.querySelector('.body > .col .big').textContent = '1 июня'; const l = v.querySelector('[data-anim="fc-line"]'), n = l.getTotalLength(); gsap.fromTo(l, { strokeDasharray: n, strokeDashoffset: n }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', delay: .4 }); };

  // запуск
  document.fonts.ready.then(() => { nav('hub', 'none'); document.body.classList.add('ready'); window.__app = { go, home, back, state: () => ({ A, B, cur, stack: stack.length }) }; });
})();
