(() => {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const shifts = [...document.querySelectorAll('[data-shift]')];
  const progress = document.querySelector('.reading-progress span');
  const descent = document.querySelector('.descent');
  const openingOver = document.querySelector('.opening .over');
  const openingTitle = document.querySelector('.opening h2');
  const openingSub = document.querySelector('.opening .sub');
  const hudInstruction = document.querySelector('.hud-instruction');
  const hudTime = document.querySelector('.hud-time');
  const hudCount = document.querySelector('.hud-count');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const camTimes = [...document.querySelectorAll('.cam-time')];
  const camFour = document.querySelector('.cam-4 .cam-bar b');
  const deskPanel = document.querySelector('#desk-panel');
  const deskBtn = document.querySelector('#desk-toggle');
  const deskClose = document.querySelector('#desk-close');
  const deskGreeting = document.querySelector('.desk-greeting');
  const deskAnswer = document.querySelector('.desk-answer');
  const deskDot = document.querySelector('.desk-dot');
  const intake = document.querySelector('#intake');
  const plate = document.querySelector('#theatre-plate');
  const lampBtn = document.querySelector('#theatre-lamp');
  const opNote = document.querySelector('[data-op-note]');
  const shroudCount = document.querySelector('[data-shroud]');
  const tagExtra = document.querySelector('.shroud-ridge.r4');
  const soundButtons = [...document.querySelectorAll('[data-sound-toggle]')];
  const soundLabels = [...document.querySelectorAll('[data-sound-label], .sound-text')];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  const themes = ['#f2f3f0', '#eceeeb', '#d3d8d6', '#15191c', '#0d1012', '#0d1012'];
  const titles = [
    'DEMETER ATELIER — 一间不接受转诊的私人外科研究所',
    'DEMETER ATELIER — 矫正项目',
    'DEMETER ATELIER — 手术室 03',
    'DEMETER ATELIER — 没有术后',
    'DEMETER ATELIER — 今晚没有手术',
    'DEMETER ATELIER — 他正在准备你的台子'
  ];
  const scenes = [
    ['你已进入手术区域', '手术室里，只会有一个人醒着。', '白布下的形状，比正常人多了一处起伏。'],
    ['04:31 / 无排班', '今晚没有手术。', '可手术灯已经亮了。'],
    ['04:33 / 他站定了', '别让他缝完。', '你还没有被纠正。']
  ];
  const deskReplies = [
    ['您好，这里是德墨忒尔研究所值班台。', '评估申请请出示你的原始照片。我们不接受已经做过修正的身体。本页面为虚构体验。'],
    ['今晚的手术记录尚未归档。', '系统显示台次为空，但手术灯已经预热九十分钟。请留在等候区。'],
    ['主刀医生：Dr. A. Voss。', '执业资格已于 1971 年注销。可档案显示，他从未停止执刀。'],
    ['本轮没有术后记录。', '所有档案都停在「术中」一栏。请不要询问自己的结束时间。'],
    ['今晚没有安排手术。', '手术台上的白布已经铺好，尺寸与你相符。'],
    ['不要与他对视。', '他已经知道你醒着。请闭上眼，保持呼吸均匀，直到他离开。']
  ];

  let stage = -1;
  let scene = -1;
  let frame = null;
  let tops = [];
  let descentTop = 0;
  let descentRange = 1;
  let pageRange = 1;
  let depthNow = 0;
  let audio = null;
  let soundOn = false;
  let soundBusy = false;
  let soundStep = '';
  let intakeOpener = null;
  let deskOpener = deskBtn;
  let lit = false;
  let jumped = false;
  let jumpTimer = null;
  let beatShown = false;
  let clearShown = false;
  let clearTimer = null;
  let caughtShown = false;
  let lastScrollAt = performance.now();

  function text(node, value) { if (node && node.textContent !== value) node.textContent = value; }
  function css(name, value) { if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value); }
  function title(value) { if (document.title !== value) document.title = value; }

  function measure() {
    const y = window.scrollY;
    tops = chapters.map((c) => c.getBoundingClientRect().top + y);
    descentTop = descent.getBoundingClientRect().top + y;
    descentRange = Math.max(1, descent.offsetHeight - window.innerHeight);
    pageRange = Math.max(1, root.scrollHeight - window.innerHeight);
  }

  function localStamp(offsetSeconds) {
    const now = new Date(Date.now() - offsetSeconds * 1000);
    return [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((n) => String(n).padStart(2, '0')).join(':');
  }

  function revealViewerTime() {
    camTimes.forEach((node, i) => text(node, localStamp((camTimes.length - i) * 83)));
    text(camFour, '你正在被看着');
  }

  function applyStage(next) {
    if (next === stage) return;
    stage = next;
    body.dataset.stage = String(next);
    shifts.forEach((el) => {
      const early = next === 1 && el.closest('.proc:nth-child(3)');
      const odd = next >= 2 || early;
      text(el, odd ? el.dataset.uncanny : el.dataset.calm);
    });
    if (themeMeta && themeMeta.content !== themes[next]) themeMeta.content = themes[next];
    text(deskGreeting, deskReplies[next][0]);
    text(deskAnswer, deskReplies[next][1]);
    text(deskDot, next >= 3 ? '!' : '1');
    updateOpNote();
    if (next >= 4) revealViewerTime();
    schedule();
  }

  function applyScene(next) {
    if (next === scene) return;
    scene = next;
    const c = scenes[next];
    text(openingOver, c[0]);
    text(openingTitle, c[1]);
    text(openingSub, c[2]);
  }

  function paintShroud(depth) {
    if (shroudCount) text(shroudCount, depth > .28 ? 'UNDER THE SHEET: 5  ←  多出来的那一处' : 'UNDER THE SHEET: 4');
    if (tagExtra) tagExtra.classList.toggle('extra-on', depth > .28);
    css('--extra-glow', clamp((depth - .28) / .1).toFixed(3));
    css('--shroud-opacity', clamp((depth - .02) / .1).toFixed(3));
  }

  function render() {
    frame = null;
    try {
    measure();
    const y = window.scrollY;
    paintShroud(clamp((y - descentTop) / descentRange));
    const line = y + window.innerHeight * .42;
    let next = 0;
    tops.forEach((top, i) => { if (line >= top) next = Math.min(i, chapters.length - 1); });
    applyStage(next);

    const depth = clamp((y - descentTop) / descentRange);
    depthNow = depth;
    css('--descent', depth.toFixed(4));
    css('--glow-opacity', clamp((depth - .18) / .28).toFixed(3));
    css('--message-opacity', (1 - clamp((depth - .22) / .12)).toFixed(3));
    css('--presence-opacity', clamp((depth - .16) / .12).toFixed(3));
    css('--side-opacity', (clamp((depth - .44) / .08) * (1 - clamp((depth - .64) / .06))).toFixed(3));
    css('--surgeon-near', reduced.matches ? '0' : clamp((depth - .1) / .55).toFixed(4));
    css('--last-opacity', (clamp((depth - .3) / .07) * (1 - clamp((depth - .48) / .05))).toFixed(3));
    css('--final-opacity', (clamp((depth - .56) / .05) * (depth < .9 ? 1 : 0)).toFixed(3));
    css('--jump-opacity', depth > .9 ? '1' : '0');
    css('--shroud-opacity', clamp((depth - .02) / .1).toFixed(3));
    css('--extra-glow', clamp((depth - .28) / .1).toFixed(3));
    if (tagExtra) tagExtra.classList.toggle('extra-on', depth > .28);
    if (depth > .28 && shroudCount) text(shroudCount, 'UNDER THE SHEET: 5  ←  多出来的那一处');
    else if (shroudCount) text(shroudCount, 'UNDER THE SHEET: 4');

    body.classList.toggle('approach', depth > .3 && depth < .9);

    const idle = performance.now() - lastScrollAt;
    if (!reduced.matches && depth > .22 && depth < .92 && idle > 6500) {
      css('--surgeon-near', clamp((depth - .1) / .55 + Math.min((idle - 6500) / 30000, .5)).toFixed(4));
      css('--presence-opacity', clamp(.6 + (depth - .2)).toFixed(3));
    }

    progress.style.transform = `scaleX(${clamp(y / pageRange)})`;
    applyScene(depth > .3 ? 2 : depth > .14 ? 1 : 0);
    if (stage === 0 && y <= 1 && (jumped || beatShown || clearShown || caughtShown)) resetBeats();
    if (depth > .9 && !jumped) triggerJump();
    checkBeat(depth);
    checkClear(depth);
    checkCaught(depth);

    title(depth > .88 ? 'DEMETER ATELIER — 你现在是对称的' : depth > .56 ? 'DEMETER ATELIER — 别让他缝完' : titles[stage]);
    text(hudInstruction, depth > .86 ? '他不需要你的同意' : depth > .56 ? '不要与他对视' : '保持清醒，继续向下 ↓');
    text(hudTime, `04:33:${String(Math.floor(depth * 59)).padStart(2, '0')}`);
    text(hudCount, depth > .3 ? `他还剩 ${Math.max(1, Math.round((1 - depth) * 11))} 针` : '档案 0333');
    updateSound();
    } catch (error) {
      if (!window.__mercyOnce) { window.__mercyOnce = true; console.error(error); }
    }
  }

  function schedule() {
    if (frame !== null) return;
    frame = window.requestAnimationFrame(render);
  }

  function soundBurst() {
    if (!audio || !soundOn || reduced.matches || document.hidden || audio.context.state !== 'running') return;
    const g = audio;
    const now = g.context.currentTime;
    const src = g.context.createBufferSource();
    src.buffer = g.noise.buffer;
    const f = g.context.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 760;
    f.Q.value = .7;
    const gain = g.context.createGain();
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.linearRampToValueAtTime(.06, now + .04);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .5);
    src.connect(f); f.connect(gain); gain.connect(g.master);
    track(g, src, [src, f, gain]);
    src.start(); src.stop(now + .55);
  }

  function triggerJump() {
    if (jumped) return;
    jumped = true;
    if (reduced.matches) return;
    body.classList.add('jump-flash');
    soundBurst();
    jumpTimer = window.setTimeout(() => { body.classList.remove('jump-flash'); jumpTimer = null; }, 1500);
  }

  function resetBeats() {
    jumped = false; beatShown = false; clearShown = false; caughtShown = false;
    window.clearTimeout(jumpTimer); window.clearTimeout(clearTimer);
    jumpTimer = null; clearTimer = null;
    body.classList.remove('jump-flash', 'blink-on', 'clear-on', 'clear-fail', 'caught-on', 'hesitate-on');
  }

  function checkBeat(depth) {
    if (reduced.matches || beatShown) return;
    if (depth > .48 && depth < .9) {
      beatShown = true;
      const on = () => body.classList.add('blink-on');
      const off = () => body.classList.remove('blink-on');
      on(); soundBurst();
      window.setTimeout(off, 110);
      window.setTimeout(() => { if (!reduced.matches) on(); }, 310);
      window.setTimeout(off, 400);
      window.setTimeout(() => { if (!reduced.matches) on(); }, 620);
      window.setTimeout(off, 720);
    }
  }

  function checkClear(depth) {
    if (reduced.matches || clearShown) return;
    if (depth > .86) {
      clearShown = true;
      body.classList.add('clear-on');
      clearTimer = window.setTimeout(() => { body.classList.add('clear-fail'); soundBurst(); }, 1150);
      clearTimer = window.setTimeout(() => { body.classList.remove('clear-on', 'clear-fail'); clearTimer = null; }, 2300);
    }
  }

  function checkCaught(depth) {
    if (reduced.matches || caughtShown) return;
    if (depth > .93) {
      caughtShown = true;
      body.classList.add('caught-on');
      soundBurst();
      window.setTimeout(() => body.classList.remove('caught-on'), 900);
    }
  }

  window.addEventListener('scroll', () => {
    lastScrollAt = performance.now();
    body.classList.remove('hesitate-on');
    schedule();
  }, { passive: true });
  window.setInterval(() => {
    if (reduced.matches) return;
    const idle = performance.now() - lastScrollAt;
    if (idle > 9000 && depthNow > .25 && depthNow < .9) body.classList.add('hesitate-on');
  }, 1000);

  window.addEventListener('resize', () => schedule(), { passive: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function pinTop() {
    if (window.location.hash || window.scrollY <= 0) return;
    window.scrollTo(0, 0);
  }
  pinTop();
  window.addEventListener('load', () => { pinTop(); window.setTimeout(pinTop, 0); schedule(); });
  window.addEventListener('pageshow', (e) => { if (!e.persisted) pinTop(); schedule(); });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => schedule());
    chapters.forEach((c) => ro.observe(c));
    ro.observe(body);
  }
  if (document.fonts) document.fonts.ready.then(() => schedule());
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      window.clearTimeout(jumpTimer); window.clearTimeout(clearTimer);
      body.classList.remove('jump-flash', 'blink-on', 'clear-on', 'clear-fail', 'caught-on', 'hesitate-on');
    }
    schedule();
  });
  window.setInterval(() => { if (stage >= 4 && stage < 5) revealViewerTime(); }, 1000);

  function setSoundUI(on, unavailable = false) {
    soundOn = on;
    body.classList.toggle('sound-on', on);
    soundButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? '关闭手术室环境音' : '开启手术室环境音');
      if (unavailable) btn.setAttribute('title', '环境音暂不可用，请稍后重试。');
      else btn.removeAttribute('title');
    });
    soundLabels.forEach((l) => text(l, on ? '关闭环境音' : '聆听手术室环境'));
  }

  function createAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error('Web Audio not supported');
    const context = new Ctx();
    const master = context.createGain();
    master.gain.value = 0;
    const comp = context.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.ratio.value = 4;
    master.connect(comp); comp.connect(context.destination);
    const voices = [48.99, 98, 146.83].map((freq, i) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = context.createGain();
      gain.gain.value = [.09, .035, .018][i];
      osc.connect(gain); gain.connect(master); osc.start();
      return osc;
    });
    const buf = context.createBuffer(1, context.sampleRate * 3, context.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      last = (last + (Math.random() * 2 - 1) * .02) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = context.createBufferSource();
    noise.buffer = buf; noise.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 460;
    const noiseGain = context.createGain(); noiseGain.gain.value = .09;
    noise.connect(filter); filter.connect(noiseGain); noiseGain.connect(master); noise.start();
    return { context, master, comp, voices, filter, noiseGain, noise, bursts: new Set() };
  }

  function track(g, source, nodes) {
    g.bursts.add(source);
    source.onended = () => { g.bursts.delete(source); nodes.forEach((n) => n.disconnect()); };
  }

  function stopBursts(g) {
    g.bursts.forEach((s) => { try { s.stop(); } catch { /* already ended */ } });
    g.bursts.clear();
  }

  function updateSound() {
    if (!audio || !soundOn || document.hidden || audio.context.state !== 'running') return;
    const step = `${stage}:${Math.floor(depthNow * 12)}`;
    if (soundStep === step) return;
    soundStep = step;
    const now = audio.context.currentTime;
    const freqs = stage <= 1 ? [48.99, 98, 146.83] : stage === 2 ? [46.25, 92.5, 138.59] : [41.2, 43.65, 82.41];
    audio.voices.forEach((v, i) => v.frequency.setTargetAtTime(freqs[i], now, 1.6));
    audio.filter.frequency.setTargetAtTime(stage < 2 ? 460 : stage < 4 ? 260 : 170, now, 1.2);
    audio.noiseGain.gain.setTargetAtTime(stage < 2 ? .09 : stage < 4 ? .13 + depthNow * .04 : .17 + depthNow * .05, now, 1.4);
    audio.master.gain.setTargetAtTime(stage < 2 ? .19 : .23, now, .6);
    audio.voices.forEach((v) => v.detune.setTargetAtTime(stage < 4 ? 0 : 7 + depthNow * 22, now, 1.1));
  }

  async function toggleSound() {
    if (soundBusy) return;
    soundBusy = true;
    try {
      if (!audio) audio = createAudio();
      if (soundOn) {
        stopBursts(audio);
        await audio.context.suspend();
        setSoundUI(false);
      } else {
        await audio.context.resume();
        soundStep = '';
        setSoundUI(true);
        updateSound();
      }
    } catch {
      setSoundUI(false, true);
    } finally {
      soundBusy = false;
    }
  }

  soundButtons.forEach((b) => b.addEventListener('click', toggleSound));
  document.addEventListener('visibilitychange', () => {
    if (!audio || !soundOn) return;
    if (document.hidden) { stopBursts(audio); audio.context.suspend().catch(() => {}); }
    else audio.context.resume().catch(() => setSoundUI(false, true));
  });

  function openDesk(answer = null, opener = deskBtn) {
    deskOpener = opener;
    if (answer !== null) text(deskAnswer, answer);
    deskPanel.hidden = false;
    deskBtn.setAttribute('aria-expanded', 'true');
    deskClose.focus({ preventScroll: true });
  }

  function closeDesk(restore = false) {
    deskPanel.hidden = true;
    deskBtn.setAttribute('aria-expanded', 'false');
    if (restore) (deskOpener.isConnected ? deskOpener : deskBtn).focus({ preventScroll: true });
    deskOpener = deskBtn;
  }

  deskBtn.addEventListener('click', () => (deskPanel.hidden ? openDesk() : closeDesk()));
  deskClose.addEventListener('click', () => closeDesk(true));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !deskPanel.hidden) closeDesk(true);
  });

  document.querySelectorAll('.intake-trigger').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (stage >= 2 && btn.matches('.quiet-link')) {
        openDesk('呼叫已接通。主刀医生：Dr. A. Voss。执业资格：已注销。请不要躺上手术台。', btn);
        return;
      }
      intakeOpener = btn;
      closeDesk();
      if (!intake.open) intake.showModal();
    });
  });
  document.querySelector('.intake-close').addEventListener('click', () => intake.close());
  intake.addEventListener('click', (e) => {
    if (e.target !== intake) return;
    const r = intake.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) intake.close();
  });
  intake.addEventListener('close', () => {
    const opener = intakeOpener;
    intakeOpener = null;
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
  document.querySelector('.intake-confirm').addEventListener('click', () => {
    intakeOpener = null;
    intake.close();
    document.querySelector('#theatre').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  });

  function updateOpNote() {
    if (!opNote) return;
    text(opNote, lit
      ? stage >= 2 ? '无影灯已开。台上的人不是今晚的排班对象。' : '无影灯已开，手术按计划进行。'
      : stage >= 2 ? '手术灯已关闭。请不要听见器械声。' : '本台手术：面部对称矫正');
  }

  function setLight(on) {
    lit = on;
    lampBtn.setAttribute('aria-pressed', String(on));
    lampBtn.setAttribute('aria-label', on ? '关闭手术灯' : '打开手术灯');
    plate.classList.toggle('lit', on);
    text(lampBtn.querySelector('span:not(.dot)'), on ? '关闭手术灯' : '打开手术灯');
    updateOpNote();
  }

  lampBtn.addEventListener('click', () => setLight(!lit));

  function exitToOutside(e) {
    e.preventDefault();
    if (audio) { stopBursts(audio); audio.context.suspend().catch(() => {}); }
    setSoundUI(false);
    closeDesk();
    intakeOpener = null;
    if (intake.open) intake.close();
    setLight(false);
    resetBeats();
    depthNow = 0;
    stage = -1;
    scene = -1;
    applyStage(0);
    applyScene(0);
    body.classList.remove('jump-flash', 'sound-on', 'clear-on', 'clear-fail', 'caught-on', 'hesitate-on', 'blink-on', 'approach');
    css('--descent', '0');
    css('--glow-opacity', '0');
    css('--message-opacity', '1');
    css('--presence-opacity', '0');
    css('--side-opacity', '0');
    css('--surgeon-near', '0');
    css('--last-opacity', '0');
    css('--final-opacity', '0');
    css('--jump-opacity', '0');
    css('--shroud-opacity', '0');
    css('--extra-glow', '0');
    progress.style.transform = 'scaleX(0)';
    text(hudInstruction, '保持清醒，继续向下 ↓');
    text(hudTime, '04:33:00');
    text(hudCount, '档案 0333');
    if (shroudCount) text(shroudCount, 'UNDER THE SHEET: 4');
    title(titles[0]);
    if (window.location.hash) history.replaceState(history.state, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const h1 = document.querySelector('#hero-title');
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
    lastScrollAt = performance.now();
    schedule();
  }

  document.querySelectorAll('[data-exit]').forEach((b) => b.addEventListener('click', exitToOutside));

  setSoundUI(false);
  setLight(false);
  schedule();
})();
