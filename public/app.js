(() => {
  'use strict';

  const body = document.body;
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const shifts = [...document.querySelectorAll('[data-shift]')];
  const progress = document.querySelector('.reading-progress span');
  const descent = document.querySelector('.descent');
  const enterTitle = document.querySelector('.enter-message h2');
  const enterOver = document.querySelector('.enter-message .over');
  const enterSub = document.querySelector('.enter-message .sub');
  const hudInstruction = document.querySelector('.hud-instruction');
  const hudTime = document.querySelector('.hud-time');
  const gate = document.querySelector('.gate');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const deskPanel = document.querySelector('#desk-panel');
  const deskToggle = document.querySelector('#desk-toggle');
  const deskClose = document.querySelector('#desk-close');
  const deskGreeting = document.querySelector('.desk-greeting');
  const deskAnswer = document.querySelector('.desk-answer');
  const deskDot = document.querySelector('.desk-dot');
  const invite = document.querySelector('#invite');
  const wardImage = document.querySelector('#ward-image');
  const wardLight = document.querySelector('#ward-light');
  const careNote = document.querySelector('[data-care-note]');
  const soundButtons = [...document.querySelectorAll('[data-sound-toggle]')];
  const soundTexts = [...document.querySelectorAll('[data-sound-label], .sound-text')];
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

  const themes = ['#f4f1ea', '#efeade', '#d9d1c2', '#1a1817', '#100f0e', '#100f0e'];
  const titles = [
    'MERCY HOUSE — 只接收长期住客的疗养院',
    'MERCY HOUSE — 夜间巡视记录',
    'MERCY HOUSE — 东翼 0333',
    'MERCY HOUSE — 没有出院记录',
    'MERCY HOUSE — 今晚无人值班',
    'MERCY HOUSE — 她去查房了'
  ];
  const scenes = [
    ['你已进入夜班区域', '这一层，只住一个人。', '可她的脚步声，是从走廊两端同时传来的。'],
    ['04:31 / 无人值班', '排班表是空的。', '脚步声，却从来没有停过。'],
    ['04:33 / 她停在门口', '别让她进来。', '她知道你醒着。']
  ];
  const deskReplies = [
    ['您好，这里是梅瑟疗养院夜班值班台。', '如需协助，请按床边呼叫铃。护士会尽快过去。本页面为虚构体验。'],
    ['夜间巡视正在进行。', '记录显示巡视已经结束三次，但走廊灯还亮着。请留在房间内。'],
    ['护士的工号已登记。', '姓名一栏是空的。所有记录都指向同一间房：0333。'],
    ['本轮没有出院名单。', '系统保留了你的入住日期，却没有离开日期。请不要签署任何表格。'],
    ['今晚没有护士值班。', '镜头里那个正在走过来的，不在排班表上。'],
    ['不要回应叩门声。', '她已经进去了。请待在床上，闭上眼，直到她离开。']
  ];

  let stage = -1;
  let scene = -1;
  let frame = null;
  let dirty = true;
  let tops = [];
  let descentTop = 0;
  let descentRange = 1;
  let pageRange = 1;
  let depthNow = 0;
  let audio = null;
  let soundOn = false;
  let soundBusy = false;
  let soundStep = '';
  let inviteOpener = null;
  let deskOpener = deskToggle;
  let lit = false;
  let jumped = false;
  let jumpTimer = null;

  function text(node, value) {
    if (node && node.textContent !== value) node.textContent = value;
  }
  function css(name, value) {
    if (root.style.getPropertyValue(name) !== value) root.style.setProperty(name, value);
  }
  function title(value) {
    if (document.title !== value) document.title = value;
  }

  function measure() {
    const y = window.scrollY;
    tops = chapters.map((c) => c.getBoundingClientRect().top + y);
    descentTop = descent.getBoundingClientRect().top + y;
    descentRange = Math.max(1, descent.offsetHeight - window.innerHeight);
    pageRange = Math.max(1, root.scrollHeight - window.innerHeight);
    dirty = false;
  }

  function applyStage(next) {
    if (next === stage) return;
    stage = next;
    body.dataset.stage = String(next);
    shifts.forEach((el) => {
      const early = next === 1 && el.closest('.program:nth-child(3)');
      const odd = next >= 2 || early;
      text(el, odd ? el.dataset.uncanny : el.dataset.calm);
    });
    if (themeMeta && themeMeta.content !== themes[next]) themeMeta.content = themes[next];
    text(deskGreeting, deskReplies[next][0]);
    text(deskAnswer, deskReplies[next][1]);
    text(deskDot, next >= 3 ? '!' : '1');
    updateCareNote();
    dirty = true;
    schedule();
  }

  function applyScene(next) {
    if (next === scene) return;
    scene = next;
    const copy = scenes[next];
    text(enterOver, copy[0]);
    text(enterTitle, copy[1]);
    text(enterSub, copy[2]);
    dirty = true;
  }

  function render() {
    frame = null;
    // Positions can change as images and fonts settle; recompute every frame is cheap for six chapters.
    measure();
    const y = window.scrollY;
    const line = y + window.innerHeight * .42;
    let next = 0;
    tops.forEach((top, i) => { if (line >= top) next = Math.min(i, chapters.length - 1); });
    applyStage(next);

    const depth = clamp((y - descentTop) / descentRange);
    depthNow = depth;
    css('--descent', depth.toFixed(4));
    css('--glow-opacity', clamp((depth - .2) / .3).toFixed(3));
    css('--message-opacity', (1 - clamp((depth - .24) / .12)).toFixed(3));
    css('--presence-opacity', clamp((depth - .3) / .16).toFixed(3));
    css('--side-opacity', (clamp((depth - .46) / .08) * (1 - clamp((depth - .66) / .06))).toFixed(3));
    css('--nurse-near', reduced.matches ? '0' : clamp((depth - .2) / .62).toFixed(4));
    css('--last-opacity', (clamp((depth - .44) / .08) * (1 - clamp((depth - .6) / .05))).toFixed(3));
    css('--final-opacity', (clamp((depth - .62) / .05) * (depth < .9 ? 1 : 0)).toFixed(3));
    css('--jump-opacity', depth > .9 ? '1' : '0');
    body.classList.toggle('approach', depth > .34 && depth < .9);

    progress.style.transform = `scaleX(${clamp(y / pageRange)})`;
    applyScene(depth > .3 ? 2 : depth > .14 ? 1 : 0);
    if (stage === 0 && y <= 1 && jumped) resetJump();
    if (depth > .9 && !jumped) triggerJump();

    title(depth > .88 ? 'MERCY HOUSE — 她已经进来了' : depth > .58 ? 'MERCY HOUSE — 别让她进来' : titles[stage]);
    text(hudInstruction, depth > .86 ? '她还不知道你醒着' : depth > .58 ? '不要回应叩门声' : '保持安静，继续向下 ↓');
    text(hudTime, `04:33:${String(Math.floor(depth * 59)).padStart(2, '0')}`);
    text(gate, depth > .45 ? '东翼 · 已封锁' : depth > .22 ? '东翼走廊' : '东翼 0333');
    updateSound();
  }

  function schedule(remeasure = false) {
    if (remeasure) dirty = true;
    if (frame !== null) return;
    frame = window.requestAnimationFrame(render);
  }

  function triggerJump() {
    if (jumped) return;
    jumped = true;
    if (reduced.matches) return;
    body.classList.add('jump-flash');
    playJumpSound();
    jumpTimer = window.setTimeout(() => {
      body.classList.remove('jump-flash');
      jumpTimer = null;
    }, 1600);
  }

  function resetJump() {
    jumped = false;
    window.clearTimeout(jumpTimer);
    jumpTimer = null;
    body.classList.remove('jump-flash');
  }

  window.addEventListener('scroll', () => schedule(), { passive: true });
  window.addEventListener('resize', () => schedule(true), { passive: true });
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function pinToTopOnce() {
    // The browser may restore the previous scroll offset after DOMContentLoaded.
    if (window.location.hash || window.scrollY <= 0) return;
    window.scrollTo(0, 0);
  }
  pinToTopOnce();
  window.addEventListener('DOMContentLoaded', pinToTopOnce);
  window.addEventListener('load', () => { pinToTopOnce(); window.setTimeout(pinToTopOnce, 0); schedule(true); });
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) pinToTopOnce();
    schedule(true);
  });
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(() => schedule(true));
    chapters.forEach((c) => ro.observe(c));
    ro.observe(body);
  }
  if (document.fonts) document.fonts.ready.then(() => schedule(true));
  reduced.addEventListener('change', () => {
    if (reduced.matches) {
      window.clearTimeout(jumpTimer);
      jumpTimer = null;
      body.classList.remove('jump-flash');
      if (audio) stopBursts(audio);
    }
    schedule(true);
  });

  function setSoundUI(on, unavailable = false) {
    soundOn = on;
    body.classList.toggle('sound-on', on);
    soundButtons.forEach((btn) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', on ? '关闭院内的安静' : '开启院内的安静');
      if (unavailable) btn.setAttribute('title', '环境音暂不可用，请稍后重试。');
      else btn.removeAttribute('title');
    });
    soundTexts.forEach((label) => text(label, on ? '关闭环境音' : '聆听院内的安静'));
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
    master.connect(comp);
    comp.connect(context.destination);
    const voices = [49, 98, 146.83].map((freq, i) => {
      const osc = context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = context.createGain();
      gain.gain.value = [.1, .04, .02][i];
      osc.connect(gain);
      gain.connect(master);
      osc.start();
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
    noise.buffer = buf;
    noise.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    const noiseGain = context.createGain();
    noiseGain.gain.value = .1;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
    return { context, master, comp, voices, filter, noiseGain, noise, bursts: new Set() };
  }

  function track(graph, source, nodes) {
    graph.bursts.add(source);
    source.onended = () => {
      graph.bursts.delete(source);
      nodes.forEach((n) => n.disconnect());
    };
  }

  function stopBursts(graph) {
    graph.bursts.forEach((s) => { try { s.stop(); } catch { /* already ended */ } });
    graph.bursts.clear();
  }

  function playCall() {
    if (!audio || !soundOn || document.hidden || audio.context.state !== 'running') return;
    const g = audio;
    const now = g.context.currentTime;
    const tones = stage >= 4 ? [392, 370] : [523.25, 493.88];
    tones.forEach((freq, i) => {
      const osc = g.context.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = g.context.createGain();
      const start = now + .02 + i * .36;
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.linearRampToValueAtTime(.03, start + .035);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .26);
      osc.connect(gain);
      gain.connect(g.master);
      track(g, osc, [osc, gain]);
      osc.start(start);
      osc.stop(start + .3);
    });
  }

  function updateSound() {
    if (!audio || !soundOn || document.hidden || audio.context.state !== 'running') return;
    const step = `${stage}:${Math.floor(depthNow * 12)}`;
    if (soundStep === step) return;
    soundStep = step;
    const now = audio.context.currentTime;
    const freqs = stage <= 1 ? [49, 98, 146.83] : stage === 2 ? [46.25, 92.5, 138.59] : stage === 3 ? [41.2, 43.65, 82.41] : [36.71, 38.89 + depthNow, 73.42];
    audio.voices.forEach((v, i) => v.frequency.setTargetAtTime(freqs[i], now, 1.6));
    audio.filter.frequency.setTargetAtTime(stage < 2 ? 480 : stage < 4 ? 260 : 170, now, 1.2);
    audio.noiseGain.gain.setTargetAtTime(stage < 2 ? .1 : stage < 4 ? .14 + depthNow * .04 : .18 + depthNow * .05, now, 1.4);
    audio.master.gain.setTargetAtTime(stage < 2 ? .2 : .24, now, .6);
    const detune = stage < 4 ? 0 : 8 + depthNow * 24;
    audio.voices.forEach((v) => v.detune.setTargetAtTime(detune, now, 1.1));
    if (stage >= 3 && Math.floor(depthNow * 12) % 12 === 0) playCall();
  }

  function playJumpSound() {
    if (!audio || !soundOn || reduced.matches || document.hidden || audio.context.state !== 'running') return;
    const g = audio;
    const now = g.context.currentTime;
    const src = g.context.createBufferSource();
    src.buffer = g.noise.buffer;
    const filter = g.context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 820;
    filter.Q.value = .7;
    const gain = g.context.createGain();
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.linearRampToValueAtTime(.07, now + .04);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .55);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(g.master);
    track(g, src, [src, filter, gain]);
    src.start();
    src.stop(now + .6);
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

  soundButtons.forEach((btn) => btn.addEventListener('click', toggleSound));
  document.addEventListener('visibilitychange', () => {
    if (!audio || !soundOn) return;
    if (document.hidden) {
      stopBursts(audio);
      audio.context.suspend().catch(() => {});
    } else {
      audio.context.resume().catch(() => setSoundUI(false, true));
    }
  });

  function openDesk(answer = null, opener = deskToggle) {
    deskOpener = opener;
    if (answer !== null) text(deskAnswer, answer);
    deskPanel.hidden = false;
    deskToggle.setAttribute('aria-expanded', 'true');
    deskClose.focus({ preventScroll: true });
  }
  function closeDesk(restore = false) {
    deskPanel.hidden = true;
    deskToggle.setAttribute('aria-expanded', 'false');
    if (restore) (deskOpener.isConnected ? deskOpener : deskToggle).focus({ preventScroll: true });
    deskOpener = deskToggle;
  }
  deskToggle.addEventListener('click', () => (deskPanel.hidden ? openDesk() : closeDesk()));
  deskClose.addEventListener('click', () => closeDesk(true));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !deskPanel.hidden) closeDesk(true);
  });

  document.querySelectorAll('.invite-trigger').forEach((btn) => {
    btn.addEventListener('click', (event) => {
      event.preventDefault();
      if (stage >= 2 && btn.matches('.link-quiet')) {
        openDesk('呼叫已接通。今晚没有护士值班。请不要开门。', btn);
        return;
      }
      inviteOpener = btn;
      closeDesk();
      if (!invite.open) invite.showModal();
    });
  });
  document.querySelector('.invite-close').addEventListener('click', () => invite.close());
  invite.addEventListener('click', (event) => {
    if (event.target !== invite) return;
    const r = invite.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) invite.close();
  });
  invite.addEventListener('close', () => {
    const opener = inviteOpener;
    inviteOpener = null;
    if (opener && opener.isConnected) opener.focus({ preventScroll: true });
  });
  document.querySelector('.invite-confirm').addEventListener('click', () => {
    inviteOpener = null;
    invite.close();
    document.querySelector('#ward').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth', block: 'start' });
  });

  function updateCareNote() {
    if (!careNote) return;
    text(careNote, lit
      ? stage >= 2 ? '走廊灯已开。她站在灯光的边缘，没有影子。' : '走廊灯已开，夜间巡视正常。'
      : stage >= 2 ? '走廊灯已关闭。请不要回应门外。' : '夜间巡视：每 40 分钟一次');
  }
  function setLight(on) {
    lit = on;
    wardLight.setAttribute('aria-pressed', String(on));
    wardLight.setAttribute('aria-label', on ? '关闭走廊灯' : '打开走廊灯');
    wardImage.classList.toggle('lit', on);
    text(wardLight.querySelector('span:not(.dot)'), on ? '关闭走廊灯' : '打开走廊灯');
    updateCareNote();
  }
  wardLight.addEventListener('click', () => setLight(!lit));

  function exitToDaylight(event) {
    event.preventDefault();
    if (audio) { stopBursts(audio); audio.context.suspend().catch(() => {}); }
    setSoundUI(false);
    closeDesk();
    inviteOpener = null;
    if (invite.open) invite.close();
    setLight(false);
    resetJump();
    depthNow = 0;
    stage = -1;
    scene = -1;
    applyStage(0);
    applyScene(0);
    body.classList.remove('jump-flash', 'sound-on');
    css('--descent', '0');
    css('--glow-opacity', '0');
    css('--message-opacity', '1');
    css('--presence-opacity', '0');
    css('--side-opacity', '0');
    css('--nurse-near', '0');
    css('--last-opacity', '0');
    css('--final-opacity', '0');
    css('--jump-opacity', '0');
    progress.style.transform = 'scaleX(0)';
    text(hudInstruction, '保持安静，继续向下 ↓');
    text(hudTime, '04:33:00');
    text(gate, '东翼 0333');
    title(titles[0]);
    if (window.location.hash) history.replaceState(history.state, '', window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const h1 = document.querySelector('#hero-title');
    h1.setAttribute('tabindex', '-1');
    h1.focus({ preventScroll: true });
    schedule(true);
  }
  document.querySelectorAll('[data-exit]').forEach((btn) => btn.addEventListener('click', exitToDaylight));

  setSoundUI(false);
  setLight(false);
  schedule(true);
})();
