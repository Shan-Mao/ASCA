(() => {
  'use strict';

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const CLUES = Object.freeze({
    'extra-chair': { title: '第十三把椅子', text: '花园灯故障后，十二个房间的藤架下出现了第十三把椅子。' },
    'archive-1971': { title: '1971 · 被注销的工牌', text: '原省立第三外科疗养所因记忆剥离与神经阻断实验被封存。主刀医师工牌 007 于 1971 年 9 月 14 日注销，通往 B 区地下室的走廊无法被水泥封死。' },
    'no-discharge': { title: '2018 · 消失的窗口', text: '档案室不再设立“出院办理窗口”，所有档案统一归入“长期静养”。' },
    'letter-041': { title: 'LETTER 041 · 床边的鞋印', text: '夜间床边有人站着。早上总多出一双鞋印。' },
    'letter-088': { title: 'LETTER 088 · 不是家属的签名', text: '探访登记的日期没有错，签名却不属于任何一位家属。' },
    'letter-333': { title: 'LETTER 333 · 不要锁门', text: '别答应夜班护士帮你锁门。锁上的门，第二天早上还是开的。' },
    'night-contract': {
      title: 'B 区夜间合同 · 三条入职须知',
      text: '入职强制条款已抄录。独自值守、不要对视、不要反锁，并数清 0333 号房的椅子。',
      rules: [
        '夜班全楼仅你一人当值。若在 04:30 前后于走廊遇见穿白大褂、佩戴旧式金属工牌的男性，请立刻低头退回自己房间，切勿对视或搭话；',
        '夜间休息时严禁反锁房门——锁上的门不仅挡不住他，还会让他知道你清醒着；',
        '若你发现自己被分配至 0333 号房，请数清屋内的椅子数量。'
      ]
    },
    'monitor-record': { title: '04:33 · 不在排班表上的人', text: '四路监控已核对。三号房登记人数为 0，门外员工的工牌却在 1971 年已注销。' },
    'letter-004': { title: 'LETTER 004 · 停在昨天的人', text: '二十多年过去，父亲仍以为昨天才入住，甚至忘记了孩子的名字。' },
    'letter-119': { title: 'LETTER 119 · 安神饮的成分', text: '未喝完的茶被带去化验：神经抑制剂正在抹掉长者的记忆。' },
    'letter-207': { title: 'LETTER 207 · 没有外地分院', text: '陈护士穿着病号服坐在玫瑰架下，反复念着“现在是 1971 年”。' },
    'nutrition-record': { title: '20:30 · 统一配送的安神饮', text: '每天 20:30 的琥珀色无标签玻璃杯，与来信里的化验结果指向同一份配方。' },
    'journal-1': { title: '陈护士日志 · 第 1 页', text: '入职第 1 夜：22°C 的 B 区出现白雾，空置的三号房床单却凹陷。' },
    'journal-2': { title: '陈护士日志 · 第 2 页', text: '入职第 3 夜：老人重复昨天的对话。倒掉安神饮后，记忆开始清醒。' },
    'journal-3': { title: '陈护士日志 · 第 3 页', text: '入职第 5 夜：监控中出现两个凹陷，白大褂的工牌刻着 1971 - 007。' },
    'journal-4': { title: '陈护士日志 · 第 4 页', text: '入职第 6 夜：反锁三道的门早晨敞开，湿鞋印一直延伸到床头。' },
    'journal-5': { title: '陈护士日志 · 最后一页', text: '陈护士被调去 0333。1,204 是未能离院的人数；别预约，别锁门，天亮前往南侧玫瑰园跑。' },
    'nurse-warning': { title: '王护士撤回的私信', text: '后台监控看得到。04:33 查房时千万别动、别锁门，熬过去后立刻往南侧花园跑。' }
  });
  const FIRST_LETTERS = Object.freeze(['letter-004', 'letter-041', 'letter-088']);
  const LETTERS = Object.freeze([...FIRST_LETTERS, 'letter-119', 'letter-207', 'letter-333']);
  const JOURNAL_CLUES = Object.freeze(Array.from({ length: 5 }, (_, index) => `journal-${index + 1}`));
  const ENDING_CLUES = Object.freeze(Object.keys(CLUES));
  const ENDINGS = Object.freeze({
    A: {
      title: '结局 A · 1998 — FOREVER',
      copy: '欢迎回家，0333 号长者。入住期限：1998 — FOREVER。',
      lines: ['你关上了门，躺回柔软的床铺。', '22°C 的微风吹散了所有让人疲惫的记忆。', '上午十点，玫瑰藤架下又多了一把椅子。', '欢迎回家，0333 号长者。']
    },
    B: {
      title: '结局 B · 15 分钟之外',
      copy: '你走出了院区。手机里那个无法删除的号码，仍在等待下一次接通。',
      lines: ['你没有锁门，在白大褂转身的一瞬溜进了南侧花园。', '穿过那条刚好 15 分钟的林荫小路，身后的红砖楼逐渐消失在晨雾里。', '你回到了喧嚣、沉重却真实的现实世界。', '只是手机通讯录里，多了一个无法删除的号码：0571 8800 3366。']
    },
    C: {
      title: '结局 C · 1971 的手术刀',
      copy: '被注销的工牌与原始病历终于拼合。你记住了麻醉之下的真相。',
      lines: ['1998 年的新主楼立在旧址北侧。通往 1971 档案室的地下走廊，从未被真正封死。', '工牌编号 007 的外科医生，至今仍在重复那场未能完成的记忆剥离手术。', '所谓的“把日子过得轻一点”，只是剥离痛苦意识的温柔麻醉。', '冷白荧光灯亮起。病历本的最后一栏，写着你的房号：0333。']
    }
  });

  const CLUE_FLIGHT_DURATION = 850;

  function sampleClueFlight(start, end, progress) {
    const p = clamp(progress);
    if (p <= .22) {
      const lift = 1 - (1 - p / .22) ** 3;
      return { x: start.x, y: start.y - 24 * lift, scale: .85 + .23 * lift, rotation: -6 + 9 * lift, opacity: lift };
    }
    if (p >= .85) {
      const absorb = (p - .85) / .15;
      return { x: end.x, y: end.y, scale: .32 - .27 * absorb, rotation: 24 + 18 * absorb, opacity: 1 - absorb };
    }
    const travel = (p - .22) / .63;
    // Invert the cubic's x coordinate so elapsed time follows the requested easing.
    const cubic = (t, a, b) => 3 * (1 - t) ** 2 * t * a + 3 * (1 - t) * t ** 2 * b + t ** 3;
    let low = 0;
    let high = 1;
    for (let step = 0; step < 16; step += 1) {
      const middle = (low + high) / 2;
      if (cubic(middle, .32, .67) < travel) low = middle;
      else high = middle;
    }
    const t = cubic((low + high) / 2, 0, .2);
    const ctrlX = start.x + (end.x - start.x) * .35;
    const ctrlY = Math.min(start.y, end.y) - 140;
    return {
      x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * ctrlX + t ** 2 * end.x,
      y: (1 - t) ** 2 * (start.y - 24) + 2 * (1 - t) * t * ctrlY + t ** 2 * end.y,
      scale: 1.08 - .76 * travel,
      rotation: 3 + 21 * travel,
      opacity: 1
    };
  }

  class EndingSequence {
    constructor({ lines, onLine = () => {}, onComplete = () => {}, schedule = (callback, delay) => setTimeout(callback, delay), clear = (timer) => clearTimeout(timer), reduced = false, isHidden = () => false }) {
      this.lines = lines;
      this.onLine = onLine;
      this.onComplete = onComplete;
      this.schedule = schedule;
      this.clear = clear;
      this.reduced = reduced;
      this.isHidden = isHidden;
      this.line = 0;
      this.character = 0;
      this.timer = null;
      this.started = false;
      this.active = false;
    }

    start() {
      if (this.started) return false;
      this.started = true;
      this.active = true;
      if (this.reduced) this.skip();
      else this.tick();
      return true;
    }

    queue(delay) {
      this.timer = this.schedule(() => { this.timer = null; this.tick(); }, delay);
    }

    tick() {
      if (!this.active) return;
      if (this.isHidden()) { this.queue(120); return; }
      if (this.line >= this.lines.length) { this.finish(); return; }
      const characters = Array.from(this.lines[this.line]);
      this.character += 1;
      const complete = this.character >= characters.length;
      this.onLine(this.line, characters.slice(0, this.character).join(''), complete);
      if (complete) { this.line += 1; this.character = 0; }
      this.queue(complete ? 650 : 32);
    }

    finish() {
      if (!this.active) return;
      this.active = false;
      this.clear(this.timer);
      this.timer = null;
      this.onComplete();
    }

    skip() {
      if (!this.active) return;
      this.clear(this.timer);
      this.timer = null;
      for (let index = this.line; index < this.lines.length; index += 1) this.onLine(index, this.lines[index], true);
      this.line = this.lines.length;
      this.finish();
    }

    cancel() {
      this.active = false;
      this.clear(this.timer);
      this.timer = null;
    }
  }

  class SaveManager {
    static KEY = 'meilu_care_save';

    constructor(storage = null) {
      this.storage = storage;
      this.available = Boolean(storage);
      this.data = { version: 2, deaths: 0, endings: [], clues: [], booked: false, run: SaveManager.freshRun() };
      try {
        const raw = JSON.parse(storage?.getItem(SaveManager.KEY) || 'null');
        if (raw && typeof raw === 'object') {
          this.data.deaths = Number.isSafeInteger(raw.deaths) && raw.deaths >= 0 ? Math.min(raw.deaths, 999999) : 0;
          this.data.endings = [...new Set(Array.isArray(raw.endings) ? raw.endings.filter((id) => ['A', 'B', 'C'].includes(id)) : [])];
          this.data.clues = [...new Set(Array.isArray(raw.clues) ? raw.clues.filter((id) => Object.hasOwn(CLUES, id)) : [])];
          this.data.booked = raw.booked === true;
          if (raw.version === 2 && raw.run && typeof raw.run === 'object') {
            const run = raw.run;
            this.data.run = {
              stage: Number.isInteger(run.stage) ? clamp(run.stage, 0, 6) : 0,
              contacts: Number.isSafeInteger(run.contacts) ? clamp(run.contacts, 0, 999) : 0,
              topics: [...new Set(Array.isArray(run.topics) ? run.topics.filter((topic) => ['discharge', 'badge', 'tea', 'chairs', 'warning'].includes(topic)) : [])],
              tutorialComplete: run.tutorialComplete === true,
              finalComplete: run.finalComplete === true,
              cameras: [...new Set(Array.isArray(run.cameras) ? run.cameras.filter((id) => [1, 2, 3, 4].includes(id)) : [])],
              qteResolved: run.qteResolved === true,
              hardRound: run.hardRound === true,
              ending: ['A', 'B', 'C'].includes(run.ending) ? run.ending : null
            };
          }
        }
      } catch {
        // A damaged or unavailable save must never prevent a new visit.
      }
    }

    persist() {
      try {
        if (!this.storage) return false;
        this.storage.setItem(SaveManager.KEY, JSON.stringify(this.data));
        this.available = true;
        return true;
      } catch {
        this.available = false;
        return false;
      }
    }

    collect(id) {
      if (!Object.hasOwn(CLUES, id) || this.data.clues.includes(id)) return false;
      this.data.clues.push(id);
      this.persist();
      return true;
    }

    die() {
      this.data.deaths = Math.min(this.data.deaths + 1, 999999);
      this.persist();
    }

    unlock(id) {
      if (!['A', 'B', 'C'].includes(id)) return false;
      if (!this.data.endings.includes(id)) this.data.endings.push(id);
      this.persist();
      return true;
    }

    static freshRun() { return { stage: 0, contacts: 0, topics: [], tutorialComplete: false, finalComplete: false, cameras: [], qteResolved: false, hardRound: false, ending: null }; }
    book() { this.data.booked = true; this.persist(); }
    newVisit() { this.data.clues = []; this.data.booked = false; this.data.run = SaveManager.freshRun(); return this.persist(); }
  }

  class GameState {
    constructor(save) {
      this.save = save;
      const run = save.data.run;
      this.stage = run.stage;
      this.cameras = new Set(run.cameras);
      this.qteResolved = run.qteResolved;
      this.hardRound = run.hardRound;
      this.ending = run.ending;
      // A checkpoint may resume a round, but it cannot manufacture a completed night.
      if (this.stage >= 3 && !run.tutorialComplete) this.stage = 1;
      if (this.stage === 6 && !run.finalComplete) this.stage = 5;
      if (this.stage < 6) this.ending = null;
    }

    has(id) { return this.save.data.clues.includes(id); }
    get night() { return [2, 4, 5].includes(this.stage); }
    get firstNightReady() { return FIRST_LETTERS.every((id) => this.has(id)) && this.save.data.run.contacts > 0; }
    get investigationReady() { return LETTERS.every((id) => this.has(id)) && JOURNAL_CLUES.every((id) => this.has(id)) && this.has('archive-1971') && this.has('nurse-warning'); }
    get endingClueCount() { return ENDING_CLUES.filter((id) => this.has(id)).length; }
    get canEscape() { return !this.save.data.booked && ['letter-333', 'night-contract', 'journal-5', 'nurse-warning'].some((id) => this.has(id)); }
    get canArchive() { return this.endingClueCount === ENDING_CLUES.length; }

    checkpoint() {
      Object.assign(this.save.data.run, { stage: this.stage, cameras: [...this.cameras], qteResolved: this.qteResolved, hardRound: this.hardRound, ending: this.ending });
      this.save.persist();
    }

    advance(next) {
      if (next !== this.stage + 1 || next > 6) return false;
      if (next === 1 && !this.has('extra-chair')) return false;
      if (next === 2 && !this.firstNightReady) return false;
      if (next === 3 && !this.save.data.run.tutorialComplete) return false;
      if (next === 4 && !this.investigationReady) return false;
      if (next === 5 && (this.cameras.size !== 4 || !this.qteResolved)) return false;
      if (next === 6 && !this.save.data.run.finalComplete) return false;
      this.stage = next;
      this.checkpoint();
      return true;
    }

    choose(id) {
      if (this.stage !== 6 || this.ending || !['A', 'B', 'C'].includes(id)) return false;
      if (id === 'B' && !this.canEscape || id === 'C' && !this.canArchive) return false;
      this.ending = id;
      this.save.unlock(id);
      this.checkpoint();
      return true;
    }
  }

  class RoundEngine {
    constructor({ hard = false, tutorial = false, onPhase = () => {}, onDeath = () => {}, onComplete = () => {}, onHesitate = () => {} } = {}) {
      this.hard = hard;
      this.tutorial = tutorial;
      this.onPhase = onPhase;
      this.onDeath = onDeath;
      this.onComplete = onComplete;
      this.onHesitate = onHesitate;
      this.thresholds = tutorial ? [.35, .72] : hard ? [.16, .34, .52, .70, .88] : [.28, .58, .84];
      this.duration = tutorial ? 15000 : 30000;
      this.warningDuration = tutorial ? 1200 : hard ? 500 : 850;
      this.redDuration = tutorial ? 1300 : hard ? 2500 : 1900;
      this.phase = 'ready';
      this.progress = 0;
      this.checks = 0;
      this.paused = false;
      this.held = false;
      this.lastWheel = -Infinity;
      this.hesitated = false;
    }

    start(now) {
      this.progress = 0;
      this.checks = 0;
      this.paused = false;
      this.held = false;
      this.lastWheel = -Infinity;
      this.lastTick = now;
      this.lastInput = now;
      this.hesitated = false;
      this.setPhase('safe', now);
    }

    setPhase(phase, now) {
      this.phase = phase;
      this.phaseAt = now;
      this.onPhase(phase);
    }

    input(kind, now) {
      if (this.paused || !['safe', 'warning', 'red'].includes(this.phase)) return;
      if (this.phase === 'red') { this.die('红灯查房期间，门内传出了动静。'); return; }
      if (kind === 'hold') this.held = true;
      if (kind === 'wheel') this.lastWheel = now;
      if (kind === 'hold' || kind === 'wheel') {
        this.lastInput = now;
        this.hesitated = false;
      }
    }

    release() { this.held = false; }

    update(now) {
      if (this.paused || !['safe', 'warning', 'red'].includes(this.phase)) return;
      const dt = clamp(now - this.lastTick, 0, 100);
      this.lastTick = now;
      if (this.phase === 'warning') {
        if (now - this.phaseAt >= this.warningDuration) {
          this.lastWheel = -Infinity;
          this.setPhase('red', now);
          if (this.held) this.die('红灯亮起后，你仍然没有松手。');
        }
        return;
      }
      if (this.phase === 'red') {
        if (now - this.phaseAt >= this.redDuration) {
          this.checks += 1;
          this.lastInput = now;
          this.hesitated = false;
          this.setPhase('safe', now);
        }
        return;
      }
      const moving = this.held || now - this.lastWheel < 220;
      if (moving) {
        this.lastInput = now;
        this.progress = clamp(this.progress + dt / this.duration);
      }
      const idle = now - this.lastInput;
      if (idle > 3000 && !this.hesitated) {
        this.hesitated = true;
        this.onHesitate();
      }
      if (idle > 6500) { this.die('敲门后，你仍停留太久。他替你完成了查房。'); return; }
      if (this.progress >= 1) {
        this.setPhase('complete', now);
        this.onComplete();
      } else if (this.checks < this.thresholds.length && this.progress >= this.thresholds[this.checks]) {
        this.setPhase('warning', now);
      }
    }

    die(reason) {
      if (!['safe', 'warning', 'red'].includes(this.phase)) return;
      this.held = false;
      this.setPhase('dead', this.lastTick);
      this.onDeath(reason);
    }

    pause(now) {
      if (this.paused || !['safe', 'warning', 'red'].includes(this.phase)) return;
      this.paused = true;
      this.pausedAt = now;
      this.held = false;
      this.lastWheel = -Infinity;
    }

    resume(now) {
      if (!this.paused) return;
      const elapsed = now - this.pausedAt;
      this.phaseAt += elapsed;
      this.lastInput += elapsed;
      this.lastTick = now;
      this.paused = false;
    }
  }

  class SoundEngine {
    constructor(onChange = () => {}) {
      this.context = null;
      this.enabled = false;
      this.busy = false;
      this.stage = 0;
      this.onChange = onChange;
      this.sources = new Set();
      this.timers = new Set();
      this.endingId = null;
      this.endingResolved = false;
    }

    create() {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Web Audio unavailable');
      const ctx = new Audio();
      this.context = ctx;
      this.master = ctx.createGain();
      this.master.gain.value = .42;
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -22;
      limiter.ratio.value = 6;
      this.master.connect(limiter);
      limiter.connect(ctx.destination);
      this.noise = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      const wind = ctx.createBufferSource();
      wind.buffer = this.noise;
      wind.loop = true;
      this.windFilter = ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.value = 480;
      this.windGain = ctx.createGain();
      this.windGain.gain.value = .09;
      wind.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.master);
      wind.start();
      this.wind = wind;
    }

    get ready() { return this.enabled && this.context?.state === 'running' && !document.hidden; }

    async toggle() {
      if (this.busy) return;
      this.busy = true;
      try {
        if (!this.context) this.create();
        if (this.enabled) {
          this.enabled = false;
          this.stopEffects();
          await this.context.suspend();
        } else {
          await this.context.resume();
          this.enabled = true;
          this.setStage(this.stage);
          if (this.endingId) {
            if (this.endingResolved) this.endingAmbience(this.endingId);
            else this.startEnding(this.endingId);
          }
        }
        this.onChange(this.enabled);
      } catch {
        this.enabled = false;
        this.onChange(false, true);
      } finally { this.busy = false; }
    }

    setStage(stage) {
      this.stage = stage;
      if (!this.context) return;
      const now = this.context.currentTime;
      const night = [2, 4, 5, 6].includes(stage);
      this.windGain.gain.setTargetAtTime(night ? .035 : .09, now, .8);
      this.windFilter.frequency.setTargetAtTime(night ? 170 : 480, now, .8);
    }

    track(source, nodes, end) {
      this.sources.add(source);
      source.onended = () => {
        this.sources.delete(source);
        nodes.forEach((node) => node.disconnect());
      };
      source.start();
      source.stop(end);
    }

    tone(frequency, delay, duration, volume, type = 'sine', pan = 0) {
      if (!this.ready) return;
      const ctx = this.context;
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(25, frequency * .65), now + duration);
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + .012);
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      osc.connect(gain);
      const nodes = [osc, gain];
      if (typeof ctx.createStereoPanner === 'function') {
        const panner = ctx.createStereoPanner();
        panner.pan.value = pan;
        gain.connect(panner);
        panner.connect(this.master);
        nodes.push(panner);
      } else gain.connect(this.master);
      this.sources.add(osc);
      osc.onended = () => { this.sources.delete(osc); nodes.forEach((node) => node.disconnect()); };
      osc.start(now);
      osc.stop(now + duration + .02);
    }

    relay() {
      if (!this.ready) return;
      const ctx = this.context;
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      source.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1600;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(.055, now);
      gain.gain.exponentialRampToValueAtTime(.0001, now + .045);
      source.connect(filter); filter.connect(gain); gain.connect(this.master);
      this.track(source, [source, filter, gain], now + .05);
    }

    heartbeat() {
      this.tone(55, 0, .16, .28);
      this.tone(55, .24, .18, .2);
    }

    footstep(side = -1) {
      this.tone(74, 0, .3, .25, 'triangle', side * .85);
      this.tone(110, .04, .12, .07, 'sine', side * .85);
    }

    alarm() {
      this.tone(130, 0, .5, .11, 'sawtooth');
      this.tone(62, 0, .65, .32);
    }

    impact() {
      this.tone(45, 0, .8, .48);
      this.tone(220, 0, .36, .14, 'sawtooth');
      this.relay();
    }

    noiseBurst(frequency, duration, volume, type = 'bandpass') {
      if (!this.ready) return;
      const ctx = this.context;
      const now = ctx.currentTime;
      const source = ctx.createBufferSource();
      source.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.setValueAtTime(frequency, now);
      filter.frequency.exponentialRampToValueAtTime(Math.max(80, frequency * .45), now + duration);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(.12, duration / 4));
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      source.connect(filter); filter.connect(gain); gain.connect(this.master);
      this.track(source, [source, filter, gain], now + duration);
    }

    paperLift() {
      this.noiseBurst(2100, .18, .045, 'highpass');
      this.noiseBurst(950, .12, .025);
    }

    letterDrop() {
      this.tone(165, 0, .16, .14, 'triangle');
      this.tone(82, .015, .2, .1);
      this.noiseBurst(430, .09, .05, 'lowpass');
    }

    doorLatch() {
      this.relay();
      this.tone(1850, 0, .055, .09, 'triangle');
      this.tone(290, .09, .18, .08, 'triangle');
      this.noiseBurst(310, .65, .025, 'lowpass');
    }

    endingAmbience(id) {
      if (!this.context) return;
      const now = this.context.currentTime;
      this.windGain.gain.setTargetAtTime(id === 'A' ? .1 : id === 'B' ? .065 : .018, now, 1.2);
      this.windFilter.frequency.setTargetAtTime(id === 'A' ? 750 : id === 'B' ? 1100 : 260, now, 1.2);
    }

    startEnding(id) {
      this.stopEffects();
      this.endingId = id;
      this.endingResolved = false;
      this.endingAmbience(id);
      if (!this.ready) return;
      let beat = 0;
      const play = () => {
        if (!this.ready || this.endingId !== id || this.endingResolved) return;
        if (id === 'A') {
          this.noiseBurst(820, 2.4, .028, 'lowpass');
        } else if (id === 'B') {
          this.footstep(beat % 2 ? 1 : -1);
          if (beat % 4 === 0) this.noiseBurst(1300, .9, .075);
        } else {
          this.tone(85, 0, .045, .045, 'triangle');
          this.noiseBurst(1700, .035, .018);
          if (beat % 8 === 0) this.noiseBurst(480, 1.2, .025);
        }
        beat += 1;
        const timer = setTimeout(() => { this.timers.delete(timer); play(); }, id === 'A' ? 2600 : id === 'B' ? 350 : 135);
        this.timers.add(timer);
      };
      play();
    }

    settleEnding() {
      this.endingResolved = true;
      this.stopEffects();
      if (this.endingId) this.endingAmbience(this.endingId);
    }

    stopEnding() {
      this.endingId = null;
      this.endingResolved = false;
      this.stopEffects();
      this.setStage(this.stage);
    }

    stopEffects() {
      this.timers.forEach((timer) => clearTimeout(timer));
      this.timers.clear();
      this.sources.forEach((source) => { try { source.stop(); } catch { /* already stopped */ } });
    }

    async suspend() {
      this.stopEffects();
      if (this.context?.state === 'running') await this.context.suspend().catch(() => {});
    }

    async resume() {
      if (this.enabled && this.context?.state === 'suspended') {
        await this.context.resume().catch(() => {});
        if (this.endingId && !this.endingResolved) this.startEnding(this.endingId);
      }
    }
  }

  // The UI controller is exported after its definition for deterministic integration tests.

  class MeiluGame {
    constructor() {
      this.body = document.body;
      this.root = document.documentElement;
      this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      let storage = null;
      try { storage = window.localStorage; } catch { /* private browsing fallback */ }
      this.save = new SaveManager(storage);
      this.save.persist();
      this.state = new GameState(this.save);
      this.sound = new SoundEngine((on, unavailable) => this.renderSound(on, unavailable));
      this.clueFlights = new Map();
      this.deskCatch = null;
      this.badgeCatch = null;
      this.round = null;
      this.frame = null;
      this.qte = null;
      this.activeCamera = null;
      this.noticeTimer = null;
      this.jumpTimer = null;
      this.nurseTimer = null;
      this.cinema = null;
      this.cinemaFinished = false;
      this.holds = new Map();
      this.keys = new Set();
      this.pointerHeld = false;
      this.holdPointerId = null;
      this.pointerPosition = null;
      this.lit = false;
      this.suspendedRound = [2, 5].includes(this.state.stage);
      this.journalPage = 1;
      this.chatTimers = new Set();
      this.chatHistory = [];
      this.pendingWarning = false;
      this.stageSince = performance.now();
      this.hintLevel = 0;
      this.shifts = [...document.querySelectorAll('[data-shift]')];
      this.$ = (selector) => document.querySelector(selector);
      this.entrance = ['#hero-title', '.hero-lede', '.hero-card small', '[data-op-note]', '#ending-title', '#ending-copy', '#ending-requirement'].map((selector) => [selector, this.$(selector).innerHTML]);
      this.identity = [...document.querySelectorAll('.head-phone, .utility .header-width > span:last-child')].map((node) => [node, node.innerHTML]);
      this.bind();
      this.restoreClues();
      this.renderMeta();
      this.renderDesk();
      this.renderStage();
      this.renderSound(false);
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
      this.root.style.scrollBehavior = 'auto';
      window.scrollTo(0, 0);
      this.root.style.removeProperty('scroll-behavior');
      this.audioTimer = window.setInterval(() => {
        if (this.round && !this.round.paused && ['safe', 'warning', 'red'].includes(this.round.phase)) {
          this.sound.heartbeat();
          if (this.round.phase !== 'safe') this.sound.footstep(this.round.checks % 2 ? 1 : -1);
        }
      }, 1250);
      this.hintTimer = setInterval(() => this.checkHints(), 1000);
      this.renderJournal(false);
      this.updateCameras();
      if (this.state.ending) this.startCinema(this.state.ending);
      else if (this.state.stage === 6) this.scrollTo('#epilogue');
      else if (this.suspendedRound) { this.selectDeskTab('comms'); this.openDesk(); }
    }

    text(selector, value) { const node = this.$(selector); if (node && node.textContent !== value) node.textContent = value; }
    show(selector, visible = true) { const node = this.$(selector); if (node) node.hidden = !visible; }
    scrollTo(selector) { this.$(selector)?.scrollIntoView({ behavior: this.reduced.matches ? 'instant' : 'smooth', block: 'start' }); }

    notice(message) {
      clearTimeout(this.noticeTimer);
      this.text('#game-notice', message);
      this.show('#game-notice');
      this.noticeTimer = setTimeout(() => this.show('#game-notice', false), 5200);
    }

    bind() {
      document.querySelectorAll('[data-sound-toggle]').forEach((button) => button.addEventListener('click', () => this.sound.toggle()));
      document.addEventListener('click', (event) => {
        if (event.target.closest?.('button, summary') && !event.target.closest?.('[data-sound-toggle]')) this.sound.relay();
      });
      this.$('#theatre-lamp').addEventListener('click', () => this.toggleLamp());
      this.shifts.forEach((node) => {
        const reveal = () => this.revealShift(node);
        node.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') reveal(); });
        node.addEventListener('click', reveal);
        node.addEventListener('keydown', (event) => {
          if (['Enter', ' '].includes(event.key) && event.target === node) { event.preventDefault(); reveal(); }
        });
      });
      document.querySelectorAll('[data-letter]').forEach((button) => this.bindLetter(button));
      this.$('#contract-attachment').addEventListener('click', (event) => this.collectContract(event.currentTarget));
      this.$('#archive-search-form')?.addEventListener('submit', (event) => { event.preventDefault(); this.searchArchive(this.$('#archive-query').value, event.submitter || this.$('#archive-query')); });
      document.querySelectorAll('[data-search-term]').forEach((button) => button.addEventListener('click', () => this.searchArchive(button.dataset.searchTerm, button)));
      this.$('#journal-prev')?.addEventListener('click', () => this.turnJournal(-1));
      this.$('#journal-next')?.addEventListener('click', () => this.turnJournal(1));
      document.querySelectorAll('[data-morning-target]').forEach((button) => button.addEventListener('click', () => this.scrollTo(button.dataset.morningTarget)));
      this.$('#start-tutorial')?.addEventListener('click', () => this.startRound());
      this.$('#second-night-enter')?.addEventListener('click', () => {
        if (this.advance(4)) { this.scrollTo('#observation'); this.notice('B 区夜间记录已接通。04:29，排班表上只有王护士。'); }
      });
      this.$('#desk-chat-form')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = this.$('#desk-input');
        const message = input.value.trim();
        if (message) { this.sendMessage(message); input.value = ''; }
      });
      document.querySelectorAll('[data-chat]').forEach((button) => button.addEventListener('click', () => this.sendMessage(button.dataset.chat)));
      const letters = this.$('.case-grid');
      letters?.addEventListener('pointermove', (event) => {
        const bounds = letters.getBoundingClientRect();
        letters.style.setProperty('--flash-x', `${event.clientX - bounds.left}px`);
        letters.style.setProperty('--flash-y', `${event.clientY - bounds.top}px`);
        letters.classList.add('flashlight-on');
      });
      letters?.addEventListener('pointerleave', () => letters.classList.remove('flashlight-on'));
      this.$('.nutrition-card')?.addEventListener('toggle', (event) => { if (event.target.open) this.collect('nutrition-record', true, event.target.querySelector('summary')); });
      document.querySelectorAll('[data-apply]').forEach((button) => button.addEventListener('click', () => {
        this.text('#application-title', `${button.dataset.job} · 申请回执`);
        this.openDialog('#application-dialog');
      }));
      this.$('#application-close').addEventListener('click', () => this.$('#application-dialog').close());
      this.$('#application-contract').addEventListener('click', (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const origin = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
        this.$('#application-dialog').close();
        this.collectContract(origin);
      });
      document.querySelectorAll('.intake-trigger').forEach((button) => button.addEventListener('click', () => this.openDialog('#intake')));
      this.$('#intake-close').addEventListener('click', () => this.$('#intake').close());
      this.$('#intake-confirm').addEventListener('click', () => {
        this.save.book();
        this.$('#intake').close();
        this.renderDesk();
        this.checkEvidence();
        this.notice('参观预约已在本机登记。值班台将为你保留 0333；本轮出口已归入“长期静养”。');
      });
      document.querySelectorAll('[data-camera]').forEach((button) => button.addEventListener('click', () => this.openCamera(Number(button.dataset.camera))));
      this.$('#camera-close').addEventListener('click', () => this.closeCamera());
      this.$('#start-round').addEventListener('click', () => this.startRound());
      this.$('#retry-round').addEventListener('click', () => this.startRound(true));
      this.$('#leave-round').addEventListener('click', () => this.leaveRound());
      this.$('#round-pause').addEventListener('click', () => this.pauseRound());
      this.$('#round-resume').addEventListener('click', () => this.resumeRound());
      const hold = this.$('#round-hold');
      hold.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || this.holdPointerId !== null || !this.isRoundActive()) return;
        event.preventDefault();
        this.pointerHeld = true;
        this.holdPointerId = event.pointerId;
        hold.setPointerCapture?.(event.pointerId);
        hold.classList.add('is-held');
        this.round?.input('hold', performance.now());
      });
      const release = (event) => {
        if (this.holdPointerId === null || event?.pointerId !== this.holdPointerId) return;
        this.pointerHeld = false;
        this.holdPointerId = null;
        hold.classList.remove('is-held');
        if (this.round) this.round.held = this.keys.size > 0;
      };
      hold.addEventListener('pointerup', release);
      hold.addEventListener('pointercancel', release);
      hold.addEventListener('lostpointercapture', release);
      window.addEventListener('pointerup', release);
      window.addEventListener('wheel', (event) => {
        if (!this.isRoundActive()) return;
        event.preventDefault();
        if (event.deltaY !== 0 || event.deltaX !== 0) this.round.input('wheel', performance.now());
        this.body.classList.remove('hesitate-on');
      }, { passive: false });
      document.addEventListener('keydown', (event) => this.onKeyDown(event));
      document.addEventListener('keyup', (event) => {
        this.keys.delete(event.code);
        if (this.round) this.round.held = this.keys.size > 0 || this.pointerHeld;
      });
      window.addEventListener('pointermove', (event) => {
        if (!this.isRoundActive() || event.pointerType !== 'mouse') return;
        if (this.round.phase === 'red' && this.pointerPosition && Math.hypot(event.clientX - this.pointerPosition.x, event.clientY - this.pointerPosition.y) > 24) {
          this.round.input('movement', performance.now());
        } else if (!this.pointerPosition || this.round.phase !== 'red') this.pointerPosition = { x: event.clientX, y: event.clientY };
      });
      window.addEventListener('touchmove', (event) => {
        if (!this.isRoundActive()) return;
        if (event.target.closest?.('#retry-panel')) return;
        event.preventDefault();
        this.round.input('wheel', performance.now());
      }, { passive: false });
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
      window.addEventListener('resize', () => this.onScroll(), { passive: true });
      window.addEventListener('blur', () => { this.cancelHolds(); this.pauseRound(); });
      document.addEventListener('visibilitychange', () => this.onVisibility());
      this.$('#desk-toggle').addEventListener('click', () => this.toggleDesk());
      this.$('#desk-close').addEventListener('click', () => this.closeDesk(true));
      ['notes', 'comms'].forEach((tab) => this.$(`#tab-${tab}`).addEventListener('click', () => this.selectDeskTab(tab)));
      this.$('#desk-panel').addEventListener('keydown', (event) => {
        if (event.target.getAttribute('role') === 'tab' && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const tab = event.key === 'Home' ? 'notes' : event.key === 'End' ? 'comms' : event.target.id === 'tab-notes' ? 'comms' : 'notes';
          this.selectDeskTab(tab);
          this.$(`#tab-${tab}`).focus();
        }
      });
      this.$('#round-complete-continue').addEventListener('click', () => this.enterEpilogue());
      this.$('#desk-whisper-close').addEventListener('click', () => this.dismissNurse());
      this.$('#ending-a').addEventListener('click', () => this.chooseEnding('A'));
      this.$('#ending-b').addEventListener('click', () => this.chooseEnding('B'));
      this.$('#archive-trigger').addEventListener('click', () => this.chooseEnding('C'));
      this.$('#archive-close').addEventListener('click', () => this.$('#archive-dialog').close());
      this.$('#cinema-skip').addEventListener('click', () => this.cinema?.skip());
      this.$('#cinema-return').addEventListener('click', () => this.closeCinema());
      this.$('#cinema-replay').addEventListener('click', () => this.newVisit());
      this.$('#cinema-archive').addEventListener('click', () => this.$('#archive-dialog').showModal());
      this.$('#ending-cinema').addEventListener('cancel', (event) => {
        event.preventDefault();
        if (this.cinemaFinished) this.closeCinema();
        else this.cinema?.skip();
      });
      this.$('#new-visit').addEventListener('click', () => this.newVisit());
      document.querySelectorAll('[data-reset-visit]').forEach((button) => button.addEventListener('click', () => this.newVisit()));
      this.$('#reset-cancel').addEventListener('click', () => this.$('#reset-dialog').close());
      this.$('#reset-confirm').addEventListener('click', () => {
        const dialog = this.$('#reset-dialog');
        if (!dialog.open) return;
        dialog.close();
        this.resetVisit();
      });
      document.querySelectorAll('[data-exit]').forEach((button) => button.addEventListener('click', () => this.safeExit()));
      this.reduced.addEventListener('change', () => {
        this.body.classList.remove('jump-flash');
        if (this.reduced.matches) {
          this.cinema?.skip();
          this.clearClueFlights();
          this.renderDesk();
        }
      });
      window.addEventListener('pagehide', () => {
        this.clearClueFlights();
        this.renderDesk();
        this.cancelHolds();
        this.pauseRound();
        this.sound.suspend();
      });
    }

    onKeyDown(event) {
      if (this.$('#reset-dialog')?.open) return;
      if (event.key === 'Escape') {
        if (this.$('#ending-cinema')?.open) return;
        if (this.isRoundActive()) { event.preventDefault(); this.pauseRound(); return; }
        if (this.qte) this.closeCamera();
        if (!this.$('#desk-panel').hidden) this.closeDesk(true);
        return;
      }
      if (!this.isRoundActive()) return;
      if (['Tab', 'Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;
      if (event.target.closest?.('#round-pause, #round-resume, #retry-panel, [data-exit]') && ['Enter', ' '].includes(event.key)) return;
      if (['Space', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.code)) {
        event.preventDefault();
        if (['Space', 'ArrowDown'].includes(event.code)) this.keys.add(event.code);
        this.round.input(['Space', 'ArrowDown'].includes(event.code) ? 'hold' : 'movement', performance.now());
        this.body.classList.remove('hesitate-on');
      } else if (this.round.phase === 'red' && !event.repeat) this.round.input('movement', performance.now());
    }

    openDialog(selector) {
      if (this.body.classList.contains('round-active') || this.state.ending) return;
      this.closeDesk();
      const dialog = this.$(selector);
      if (!dialog.open) dialog.showModal();
    }

    toggleLamp() {
      this.lit = !this.lit;
      this.$('#theatre-plate').classList.toggle('lit', this.lit);
      this.$('#theatre-lamp').setAttribute('aria-pressed', String(this.lit));
      this.text('#theatre-lamp span:not(.dot)', this.lit ? '关闭花园灯' : '打开花园灯');
      if (this.state.stage === 0) {
        this.collect('extra-chair', false, this.$('#theatre-lamp'));
        this.advance(1);
        this.$('#theatre-plate').classList.add('lamp-fault');
        this.sound.relay();
        this.notice('灯闪了一下。十二间房，却摆了十三把椅子。长按家属来信，或回看院史中的旧字。');
        this.checkEvidence();
      }
      this.text('[data-op-note]', this.lit ? '花园灯故障。架下多出第 13 把椅子；椅背上写着 0333。' : '花园灯关着。那把多出来的椅子还在。');
    }

    revealShift(node) {
      if (this.state.stage < 3) return;
      if (node.dataset.clue) this.collect(node.dataset.clue, true, node);
      if (node.classList.contains('is-shifted')) return;
      node.classList.add('is-shifted', 'glitching');
      node.textContent = node.dataset.uncanny;
      if (node.dataset.clue) this.collect(node.dataset.clue, true, node);
      setTimeout(() => node.classList.remove('glitching'), 420);
    }

    bindLetter(button) {
      const id = button.dataset.letter;
      const cancel = () => {
        const hold = this.holds.get(button);
        if (hold) { cancelAnimationFrame(hold.frame); clearTimeout(hold.timer); }
        this.holds.delete(button);
        button.style.setProperty('--hold', '0');
      };
      const start = () => {
        if (this.state.stage < 1 || !FIRST_LETTERS.includes(id) && this.state.stage < 3 || this.state.has(id) || this.holds.has(button)) return;
        const hold = { start: performance.now(), frame: null, timer: null };
        const finish = () => {
          if (!this.holds.has(button)) return;
          cancel();
          this.collect(id, true, button);
          this.revealLetter(id);
        };
        const tick = (now) => {
          if (!this.holds.has(button)) return;
          const amount = clamp((now - hold.start) / 1200);
          button.style.setProperty('--hold', String(amount));
          if (amount >= 1) finish();
          else hold.frame = requestAnimationFrame(tick);
        };
        this.holds.set(button, hold);
        // Completion is independent of frame rate on low-power mobile devices.
        hold.timer = setTimeout(finish, 1200);
        hold.frame = requestAnimationFrame(tick);
      };
      button.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        start();
      });
      ['pointerup', 'pointercancel', 'lostpointercapture', 'blur'].forEach((type) => button.addEventListener(type, cancel));
      button.addEventListener('contextmenu', (event) => event.preventDefault());
      button.addEventListener('keydown', (event) => {
        if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); if (!event.repeat) start(); }
      });
      button.addEventListener('keyup', (event) => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); cancel(); } });
    }

    cancelHolds() {
      this.holds.forEach((hold, button) => {
        cancelAnimationFrame(hold.frame);
        clearTimeout(hold.timer);
        button.style.setProperty('--hold', '0');
      });
      this.holds.clear();
    }

    revealLetter(id) {
      const button = document.querySelector(`[data-letter="${id}"]`);
      if (!button) return;
      const card = button.closest('.case');
      card.classList.add('revealed');
      card.querySelector('.case-hidden').setAttribute('aria-hidden', 'false');
      button.textContent = '夹层已显影 · 已收入异常笔记';
      button.setAttribute('aria-pressed', 'true');
    }

    restoreClues() {
      this.save.data.clues.forEach((id) => {
        if (id.startsWith('letter-')) this.revealLetter(id);
      });
    }

    collect(id, notify = true, origin = null) {
      if (!this.save.collect(id)) return false;
      this.flyClue(id, origin);
      this.renderDesk();
      this.renderMeta();
      if (notify) this.notice(`发现档案摘录：${CLUES[id].title}`);
      this.checkEvidence();
      return true;
    }

    flyClue(id, origin) {
      const desk = this.$('#desk-toggle');
      if (this.reduced.matches || document.hidden || !desk?.getBoundingClientRect) return;
      let point = origin;
      if (origin?.getBoundingClientRect) {
        const rect = origin.getBoundingClientRect();
        if (rect.width && rect.height && rect.bottom > 0 && rect.top < window.innerHeight) point = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
        else point = null;
      }
      const start = {
        x: clamp(point?.clientX ?? window.innerWidth / 2, 0, window.innerWidth) - 90,
        y: clamp(point?.clientY ?? window.innerHeight / 2, 0, window.innerHeight) - 55
      };
      const card = document.createElement('div');
      card.className = 'flying-clue-card';
      card.setAttribute('aria-hidden', 'true');
      const icon = document.createElement('img');
      icon.src = './assets/new/clue-letter.svg';
      icon.alt = '';
      icon.width = 44;
      icon.height = 44;
      const copy = document.createElement('div');
      copy.className = 'flying-clue-copy';
      const label = document.createElement('small');
      label.textContent = `档案摘录 · #${String(this.save.data.clues.indexOf(id) + 1).padStart(2, '0')}`;
      const title = document.createElement('strong');
      title.textContent = `《${CLUES[id].title}》`;
      copy.append(label, title);
      card.append(icon, copy);
      const flight = { card, frame: null };
      this.clueFlights.set(id, flight);
      this.body.append(card);
      this.sound.paperLift();
      const started = performance.now();
      const tick = (now) => {
        if (!this.clueFlights.has(id)) return;
        // Viewport coordinates stay independent of page scroll; remeasure for resize/layout shifts.
        const rect = desk.getBoundingClientRect();
        const end = { x: rect.left + rect.width / 2 - 90, y: rect.top + rect.height / 2 - 55 };
        const progress = clamp((now - started) / CLUE_FLIGHT_DURATION);
        const sample = sampleClueFlight(start, end, progress);
        card.style.transform = `translate3d(${sample.x}px, ${sample.y}px, 0) rotate(${sample.rotation}deg) scale(${sample.scale})`;
        card.style.opacity = String(sample.opacity);
        if (progress >= 1) this.finishClueFlight(id);
        else flight.frame = requestAnimationFrame(tick);
      };
      tick(started);
    }

    finishClueFlight(id) {
      const flight = this.clueFlights.get(id);
      if (!flight) return;
      cancelAnimationFrame(flight.frame);
      flight.card.remove();
      this.clueFlights.delete(id);
      this.renderDesk();
      this.sound.letterDrop();
      if (this.reduced.matches || document.hidden) return;
      this.deskCatch?.cancel();
      this.badgeCatch?.cancel();
      this.deskCatch = this.$('#desk-toggle').animate([
        { transform: 'scale(1)', offset: 0 },
        { transform: 'scale(1.28)', offset: .35 },
        { transform: 'scale(.94)', offset: .7 },
        { transform: 'scale(1)', offset: 1 }
      ], { duration: 300, easing: 'ease-out' });
      this.badgeCatch = this.$('#desk-dot').animate([
        { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(204, 169, 94, .8)' },
        { transform: 'scale(1.2)', boxShadow: '0 0 0 8px rgba(158, 178, 139, .45)', offset: .45 },
        { transform: 'scale(1)', boxShadow: '0 0 0 14px rgba(204, 169, 94, 0)' }
      ], { duration: 380, easing: 'ease-out' });
    }

    clearClueFlights() {
      this.clueFlights?.forEach((flight) => {
        cancelAnimationFrame(flight.frame);
        flight.card.remove();
      });
      this.clueFlights?.clear();
      this.deskCatch?.cancel();
      this.badgeCatch?.cancel();
    }

    searchArchive(query, origin = this.$('#archive-query')) {
      const term = String(query || '').replace(/\s+/g, '');
      const library = this.$('#archive-library');
      const records = library ? [...library.content.querySelectorAll('[data-record]')] : [];
      const record = records.find((entry) => entry.dataset.record === term) || records.find((entry) => term.length >= 2 && entry.dataset.record.includes(term));
      this.show('#archive-result');
      this.show('.archive-image-wrap', false);
      this.text('#archive-result-title', record?.querySelector('h3')?.textContent || '院内记录查询回执');
      if (!record) {
        this.text('#archive-result-copy', '暂未检索到对应记录。请使用上方公开的六个热门关键词，或向护理值班台说明想查阅的事项。');
        return;
      }
      if (record.dataset.record === '1971旧址档案' && this.state.stage < 3) {
        this.text('#archive-result-copy', '该卷宗正在修复，日间访客暂不可调阅。档案室将在明日上午重新开放，请保留查询编号 1971。');
        return;
      }
      this.text('#archive-result-copy', record.querySelector('p').textContent);
      const image = record.querySelector('img');
      if (image) {
        const visible = this.$('#archive-result-image');
        visible.src = image.getAttribute('src');
        visible.alt = image.getAttribute('alt') || record.dataset.record;
        this.show('.archive-image-wrap');
      }
      if (record.dataset.record === '1971旧址档案') this.collect('archive-1971', true, origin);
      if (record.dataset.record === '出院办理流程') this.collect('no-discharge', true, origin);
      if (record.dataset.record === '营养配餐') this.collect('nutrition-record', true, origin);
    }

    renderJournal(collect = true) {
      const open = this.state.stage >= 3;
      this.show('#journal-locked', !open);
      this.show('#journal-copy', open);
      this.$('#journal-prev').disabled = !open || this.journalPage <= 1;
      this.$('#journal-next').disabled = !open || this.journalPage >= 5;
      this.text('#journal-page', open ? `残页 ${this.journalPage} / 5` : '交接原件 · 暂未移交');
      if (!open) return;
      const page = this.$('#journal-library')?.content.querySelector(`[data-journal-page="${this.journalPage}"]`);
      if (!page) return;
      this.text('#journal-copy', page.textContent.trim());
      if (collect) this.collect(`journal-${this.journalPage}`, false, this.$('#journal-copy'));
    }

    turnJournal(direction) {
      if (this.state.stage < 3) return;
      this.journalPage = clamp(this.journalPage + direction, 1, 5);
      this.renderJournal();
    }

    appendMessage(text, visitor = false) {
      const log = this.$('#desk-messages');
      if (!log) return;
      const message = document.createElement('p');
      message.className = `chat-message ${visitor ? 'is-visitor' : 'is-nurse'}`;
      message.textContent = `${visitor ? '你' : '王护士'}：${text}`;
      log.append(message);
      while (log.children.length > 40) log.firstElementChild.remove();
      const scroller = log.closest('.desk-body');
      if (scroller) scroller.scrollTop = scroller.scrollHeight;
    }

    nurseReply(topic) {
      const page = this.$('#nurse-library')?.content.querySelector(`[data-topic="${topic}"] p`);
      return page?.textContent.trim() || '您好，护理值班台已收到。院史、家属来信和照护公示均可在页面内查询。';
    }

    sendMessage(message) {
      if (this.state.ending || this.body.classList.contains('round-active')) return;
      const text = String(message).trim().slice(0, 160);
      if (!text) return;
      this.appendMessage(text, true);
      const run = this.save.data.run;
      if (this.state.stage >= 1) run.contacts = Math.min(run.contacts + 1, 999);
      let topic = null;
      if (/锁门|0333|333|陈护士/.test(text)) topic = 'warning';
      else if (/1971|工牌|007/.test(text)) topic = 'badge';
      else if (/出院|离开/.test(text)) topic = 'discharge';
      else if (/安神|茶|食谱/.test(text)) topic = 'tea';
      else if (/椅子|13/.test(text)) topic = 'chairs';
      if (topic && this.state.stage >= 3 && !run.topics.includes(topic)) run.topics.push(topic);
      const warning = this.state.stage >= 3 && run.topics.length >= 3 && run.topics.includes('warning') && !this.state.has('nurse-warning') && !this.pendingWarning;
      if (warning) this.pendingWarning = true;
      const reply = () => {
        if (topic === 'warning' && !warning && !this.state.has('nurse-warning')) this.appendMessage('0333 的相关记录请通过正式渠道核验。您也可以先查阅院史与膳食公示。');
        else if (topic) this.appendMessage(this.nurseReply(topic));
        else this.appendMessage('您好，您可以询问出院、1971 工牌、安神饮、椅子或陈护士。护理值班台会逐项核对记录。');
        if (warning) {
          if (topic !== 'warning') this.appendMessage(this.nurseReply('warning'));
          this.pendingWarning = false;
          this.collect('nurse-warning', true, this.$('#desk-messages').lastElementChild);
        }
      };
      if (topic === 'badge') {
        this.appendMessage('（对方正在输入……）');
        const timer = setTimeout(() => { this.chatTimers.delete(timer); reply(); }, 2000);
        this.chatTimers.add(timer);
      } else reply();
      this.save.persist();
      this.checkEvidence();
      this.renderDesk();
    }

    checkHints() {
      if (document.hidden || this.body.classList.contains('round-active') || this.state.ending) return;
      const elapsed = performance.now() - this.stageSince;
      const hints = [
        '花园照明由访客自行开启。南侧藤架下，木椅已按房间数摆放。',
        '三封早期家属来信的墨迹有些浅。值班台还在等候您的第一次咨询。',
        'B 区首次值守记录尚未完成。绿灯前进，红灯请放轻呼吸。',
        '昨日调阅的 1971 卷宗已修复；陈护士留下五页交接记录，值班台可以逐项核对。',
        '夜间交接请核对四路监控。最后一路画面，不宜久看。',
        '0333 的值守记录尚未签收。请回值班台继续本轮巡视。',
        '脚步声已经远去。门后的访客状态单，需要您在天亮前确认。'
      ];
      if (elapsed >= 15000 && this.hintLevel < 1) { this.text('#ticker-hint', hints[this.state.stage]); this.hintLevel = 1; }
      if (elapsed >= 22000 && this.hintLevel < 2) {
        this.hintLevel = 2;
        this.text('#desk-whisper-copy', `王护士：${hints[this.state.stage]}`);
        this.show('#desk-whisper');
        this.$('#desk-toggle').classList.add('is-urgent');
        this.sound.tone(660, 0, .18, .035);
        this.sound.tone(880, .2, .25, .025);
      }
    }

    collectContract(origin = this.$('#contract-attachment')) {
      this.collect('night-contract', true, origin);
      this.selectDeskTab('notes');
      this.openDesk();
      this.notice('入职合同附件已抄入异常笔记，三条值守规则可随时查阅。');
    }

    checkEvidence() {
      if (this.state.stage === 1) {
        this.$('#start-tutorial').disabled = !this.state.firstNightReady;
        this.show('#first-night-note');
      }
      if (this.state.stage >= 3) {
        const pages = JOURNAL_CLUES.filter((id) => this.state.has(id)).length;
        const letters = LETTERS.filter((id) => this.state.has(id)).length;
        this.text('#investigation-status', `记录核验：来信 ${letters}/6 · 交接残页 ${pages}/5 · 1971 卷宗${this.state.has('archive-1971') ? '已调阅' : '待调阅'} · 值班对话 ${this.save.data.run.topics.length}/3${this.state.has('nurse-warning') ? '（私信已收）' : ''}`);
        this.$('#second-night-enter').disabled = !this.state.investigationReady;
      }
      if (this.state.stage === 6) this.renderEndingChoices();
    }

    advance(next) {
      if (!this.state.advance(next)) return false;
      this.stageSince = performance.now();
      this.hintLevel = 0;
      this.dismissNurse();
      this.renderStage();
      this.renderDesk();
      return true;
    }

    renderStage() {
      const stage = this.state.stage;
      this.body.dataset.stage = String(stage);
      this.body.dataset.night = String(this.state.night);
      this.body.dataset.uncanny = String(stage >= 3);
      this.show('#cases', stage >= 1);
      document.querySelectorAll('[data-second-day]').forEach((node) => { node.hidden = stage < 3; });
      this.show('#first-night-note', stage === 1 || stage === 2 && this.suspendedRound);
      if (stage === 2 && this.suspendedRound) this.$('#start-tutorial').disabled = false;
      this.show('#morning-note', stage >= 3 && stage < 5);
      this.show('#observation', stage >= 4);
      const activeRound = [2, 5].includes(stage) && !this.suspendedRound;
      this.show('#descent', activeRound || stage === 6 && this.round?.phase === 'complete' && !this.state.ending);
      this.$('#descent').classList.toggle('is-active', activeRound || stage === 6 && this.round?.phase === 'complete' && !this.state.ending);
      this.show('#epilogue', stage === 6);
      this.$('meta[name="theme-color"]').content = this.state.night ? '#0b0f0e' : '#f7f8f5';
      this.sound.setStage(stage);
      this.shifts.forEach((node) => {
        if (stage >= 3) {
          node.textContent = node.dataset.uncanny;
          node.classList.add('is-shifted');
        }
      });
      const statuses = [
        '访客权限：日间公共区 · 花园照明：关闭',
        '访客权限：第 1 日黄昏 · 来信阅览已开放',
        '访客权限：第 1 夜 02:00 · B 区首次值守',
        '访客权限：第 2 日公共区 · 旧档修复完成',
        '访客权限：第 2 夜 04:29 · 监控室已接通',
        '访客权限：第 2 夜 04:33 · 0333 夜间值守',
        '访客权限：天亮前 · 离院记录待确认'
      ];
      this.text('#visitor-status', statuses[stage]);
      document.title = `梅麓：04:33 | ${stage === 6 ? '天亮前的抉择' : this.state.night ? 'B 区夜间值守' : '梅麓疗养院'}`;
      this.renderJournal(false);
      this.checkEvidence();
    }

    renderMeta() {
      this.text('#resident-count', (1204 + this.save.data.deaths).toLocaleString('en-US'));
      this.text('#ending-progress', `已解锁结局 ${this.save.data.endings.length}/3`);
      this.text('#ending-unlocks', `档案图鉴（已解锁结局 ${this.save.data.endings.length}/3） · 本机死亡记录 ${this.save.data.deaths} 次`);
      const count = this.save.data.clues.filter((id) => !this.clueFlights?.has(id)).length;
      this.text('#notes-count', `已收集 ${count}/${Object.keys(CLUES).length} 条关键线索`);
      this.text('#desk-dot', `${count}/${Object.keys(CLUES).length}`);
      this.text('#cinema-unlocks', `已解锁结局：${this.save.data.endings.length} / 3`);
      document.querySelectorAll('[data-ending-badge]').forEach((badge) => {
        const unlocked = this.save.data.endings.includes(badge.dataset.endingBadge);
        badge.classList.toggle('is-unlocked', unlocked);
        badge.setAttribute('aria-label', `${ENDINGS[badge.dataset.endingBadge]?.title || badge.dataset.endingBadge} · ${unlocked ? '已解锁' : '未解锁'}`);
      });
    }

    renderSound(on, unavailable = false) {
      this.body.classList.toggle('sound-on', on);
      document.querySelectorAll('[data-sound-toggle]').forEach((button) => {
        button.setAttribute('aria-pressed', String(on));
        button.setAttribute('aria-label', on ? '关闭院区环境音' : '开启院区环境音');
      });
      document.querySelectorAll('[data-sound-label], .sound-text').forEach((label) => { label.textContent = on ? '关闭环境音' : '聆听院区环境'; });
      if (unavailable) this.notice('此浏览器暂不能播放合成音效，画面与全部游戏机制仍可使用。');
    }

    onScroll() {
      const range = Math.max(1, this.root.scrollHeight - innerHeight);
      this.$('.reading-progress span').style.transform = `scaleX(${clamp(scrollY / range)})`;
      if (this.state.stage === 0) {
        const end = this.$('#about-hospital').getBoundingClientRect().bottom + scrollY;
        const limit = Math.max(0, end - innerHeight);
        if (scrollY > limit + 1) window.scrollTo({ top: limit, behavior: 'instant' });
      }
    }

    openCamera(id) {
      if (this.state.stage !== 4 || ![1, 2, 3, 4].includes(id)) return;
      if (this.qte && id !== 4) this.resolveQte(true);
      this.activeCamera = id;
      this.state.cameras.add(id);
      const figure = this.$(`.cam-${id}`);
      this.$('#camera-image').src = figure.querySelector('img').src;
      this.$('#camera-image').alt = figure.querySelector('img').alt;
      this.text('#camera-title', `CAM 0${id} / ${['一楼走廊', '三号房', '三号房门', '三号房门旁'][id - 1]}`);
      this.text('#camera-description', ['04:29 · 一楼走廊无人。门灯正常。', '04:31 · 三号房登记 0 人。空床却有两处凹陷。请勿开门。', '04:32 · 一名白大褂站在门外。今晚排班表上没有这个人。', '04:33 · 你正在被看着。立刻切换其他摄像头，或关闭这幅画面。'][id - 1]);
      this.show('#camera-view');
      this.$('#camera-view').scrollIntoView({ behavior: 'instant', block: 'start' });
      this.$('#camera-close').focus({ preventScroll: true });
      document.querySelectorAll('.cam').forEach((cam, index) => {
        cam.classList.toggle('is-checked', this.state.cameras.has(index + 1));
        cam.classList.toggle('is-active', index + 1 === id);
        cam.querySelector('.cam-open').setAttribute('aria-pressed', String(index + 1 === id));
      });
      if (id === 4 && !this.state.qteResolved && !this.qte) this.startQte();
      this.updateCameras();
    }

    startQte() {
      this.show('#camera-qte');
      this.body.classList.add('qte-on');
      this.qte = { deadline: performance.now() + 2500, remaining: 2500, timer: null };
      this.sound.alarm();
      const tick = () => {
        if (!this.qte || document.hidden) return;
        const remaining = Math.max(0, this.qte.deadline - performance.now());
        this.text('#qte-countdown', (remaining / 1000).toFixed(1));
        if (remaining <= 0) this.resolveQte(false);
      };
      tick();
      this.qte.timer = setInterval(tick, 50);
    }

    resolveQte(success) {
      if (!this.qte) return;
      success = Boolean(success && performance.now() < this.qte.deadline);
      clearInterval(this.qte.timer);
      this.qte = null;
      this.state.qteResolved = true;
      this.state.hardRound = !success;
      this.body.classList.remove('qte-on');
      this.show('#camera-qte', false);
      this.state.checkpoint();
      if (!success) {
        this.text('#camera-description', '画面自动断开。他记住了你的房号；下一轮将有五次红灯查房，松手时间更短。');
        this.sound.impact();
      } else this.notice('你及时避开了他的视线。返回 0333 前，核对其余监控。');
      this.updateCameras();
    }

    closeCamera() {
      if (this.qte) this.resolveQte(true);
      this.activeCamera = null;
      this.show('#camera-view', false);
      document.querySelectorAll('.cam').forEach((cam) => {
        cam.classList.remove('is-active');
        cam.querySelector('.cam-open').setAttribute('aria-pressed', 'false');
      });
    }

    updateCameras() {
      const ready = this.state.cameras.size === 4 && this.state.qteResolved;
      this.text('#camera-status', `已检查 ${this.state.cameras.size}/4 路监控${ready ? this.state.hardRound ? ' · 视线暴露：高难度查房（五轮红灯）' : ' · 视线已避开：常规查房（三轮红灯）' : ' · 请逐一打开并核对画面'}`);
      this.$('#start-round').disabled = !ready;
      if (ready) this.collect('monitor-record', true, this.$('#camera-close'));
      this.state.checkpoint();
    }

    isRoundActive() { return [2, 5].includes(this.state.stage) && this.round && !this.round.paused && ['safe', 'warning', 'red'].includes(this.round.phase); }

    isolateRound(active) {
      document.querySelectorAll('#main > *, .masthead, .utility, .tools, .desk').forEach((node) => {
        if (node.id !== 'descent') node.inert = active;
      });
    }

    startRound(retry = false) {
      if (this.state.stage === 1 && !this.advance(2)) return;
      if (this.state.stage === 4 && !this.advance(5)) return;
      if (![2, 5].includes(this.state.stage)) return;
      this.suspendedRound = false;
      this.renderStage();
      this.closeDesk();
      this.closeCamera();
      this.cancelHolds();
      clearTimeout(this.noticeTimer);
      this.show('#game-notice', false);
      clearTimeout(this.jumpTimer);
      clearTimeout(this.frame);
      this.keys.clear();
      this.pointerHeld = false;
      this.holdPointerId = null;
      this.pointerPosition = null;
      this.body.classList.remove('has-died', 'caught-on', 'jump-flash', 'hesitate-on', 'round-paused');
      this.body.classList.add('round-active');
      this.isolateRound(true);
      this.show('#retry-panel', false);
      this.show('#round-hold');
      this.show('#round-pause');
      this.show('#round-exit');
      this.show('#round-resume', false);
      this.show('#round-complete-continue', false);
      this.round = new RoundEngine({
        hard: this.state.hardRound,
        tutorial: this.state.stage === 2,
        onPhase: (phase) => this.roundPhase(phase),
        onDeath: (reason) => this.die(reason),
        onComplete: () => this.completeRound(),
        onHesitate: () => {
          this.body.classList.add('hesitate-on');
          this.text('#round-status', '你没有继续往下滚。他敲门了。绿灯仍亮，继续缓慢前进。');
          this.sound.footstep(0);
        }
      });
      this.round.start(performance.now());
      this.renderRound();
      this.$('#descent').focus({ preventScroll: true });
      this.sound.resume();
      const tick = () => {
        if (!this.round || ![2, 5].includes(this.state.stage)) return;
        this.round.update(performance.now());
        this.renderRound();
        if (['safe', 'warning', 'red'].includes(this.round.phase)) this.frame = setTimeout(tick, 33);
      };
      // Keep the rules clock independent of the browser's animation-frame budget.
      this.frame = setTimeout(tick, 33);
    }

    roundPhase(phase) {
      this.$('#descent').dataset.phase = phase;
      this.body.classList.remove('hesitate-on');
      if (phase === 'safe') {
        this.text('#round-status', '绿灯 · 缓慢滚动，或按住空格 / ↓ / 下方按钮前进。停下超过 3 秒，他会敲门。');
        this.text('.hud-instruction', '绿灯前进 · 红灯松手');
      } else if (phase === 'warning') {
        this.text('#round-status', '红灯即将亮起 — 立刻松手，不要动！');
        this.text('.hud-instruction', '松开按键与触屏，停止滚动');
        this.sound.alarm();
      } else if (phase === 'red') {
        this.text('#round-status', '红灯查房 · 保持静止，等他走开。');
        this.text('.hud-instruction', '不要滚动、按键或大幅移动鼠标');
        this.sound.footstep(this.round?.checks % 2 ? 1 : -1);
      }
    }

    renderRound() {
      if (!this.round) return;
      const percent = Math.min(100, Math.floor(this.round.progress * 100));
      this.$('#breath-meter').setAttribute('aria-valuenow', String(percent));
      this.$('#breath-fill').style.width = `${percent}%`;
      this.text('#breath-value', `${percent}%`);
      this.text('.hud-time', `${this.round.tutorial ? '02:00' : '04:33'}:${String(Math.floor(this.round.progress * 59)).padStart(2, '0')}`);
      this.text('.hud-count', `已避开 ${this.round.checks}/${this.round.thresholds.length} 次查房`);
      this.root.style.setProperty('--descent', this.round.progress.toFixed(3));
      this.root.style.setProperty('--surgeon-near', this.round.progress.toFixed(3));
    }

    pauseRound() {
      if (!this.isRoundActive()) return;
      this.round.pause(performance.now());
      this.keys.clear();
      this.pointerHeld = false;
      this.holdPointerId = null;
      this.pointerPosition = null;
      this.$('#round-hold').classList.remove('is-held');
      this.body.classList.add('round-paused');
      this.show('#round-hold', false);
      this.show('#round-pause', false);
      this.show('#round-resume');
      this.text('#round-status', '值守已暂停，计时和查房均已冻结。继续后请先确认灯色。');
      this.sound.suspend();
      this.$('#round-resume').focus({ preventScroll: true });
    }

    resumeRound() {
      if (!this.round?.paused) return;
      this.pointerPosition = null;
      this.round.resume(performance.now());
      this.body.classList.remove('round-paused');
      this.show('#round-hold');
      this.show('#round-pause');
      this.show('#round-resume', false);
      this.roundPhase(this.round.phase);
      this.sound.resume();
      this.$('#descent').focus({ preventScroll: true });
    }

    die(reason) {
      this.save.die();
      this.renderMeta();
      this.body.classList.add('caught-on', 'has-died');
      this.text('#round-status', '查房失败 · 本轮已结束。');
      this.text('#death-reason', `${reason} 本机死亡记录：${this.save.data.deaths} 次。已收集线索保留。`);
      this.show('#round-hold', false);
      this.show('#round-pause', false);
      this.sound.impact();
      this.jumpTimer = setTimeout(() => {
        if (this.round?.phase !== 'dead') return;
        this.body.classList.remove('caught-on');
        if (!this.reduced.matches) this.body.classList.add('jump-flash');
        this.show('#retry-panel');
        this.$('#retry-round').focus({ preventScroll: true });
      }, this.reduced.matches ? 100 : 650);
    }

    leaveRound() {
      this.isolateRound(false);
      this.body.classList.remove('round-active', 'has-died', 'caught-on', 'jump-flash');
      this.suspendedRound = true;
      this.show('#retry-panel', false);
      this.show('#descent', false);
      this.$('#descent').classList.remove('is-active');
      this.renderStage();
      this.scrollTo(this.state.stage === 2 ? '#first-night-note' : '#observation');
      this.selectDeskTab('comms');
      this.openDesk();
      this.renderDesk();
    }

    completeRound() {
      if (![2, 5].includes(this.state.stage)) return;
      const tutorial = this.state.stage === 2;
      this.isolateRound(false);
      this.body.classList.remove('round-active', 'round-paused', 'hesitate-on');
      this.keys.clear();
      this.pointerHeld = false;
      this.holdPointerId = null;
      this.suspendedRound = false;
      if (tutorial) {
        this.save.data.run.tutorialComplete = true;
        this.advance(3);
        this.show('#descent', false);
        this.$('#descent').classList.remove('is-active');
        this.renderJournal();
        this.notice('天亮了。门缝里塞进一张纸条：“明日调查 1971 档案与陈护士日志。”');
        this.scrollTo('#morning-note');
        this.$('#morning-note').setAttribute('tabindex', '-1');
        this.$('#morning-note').focus({ preventScroll: true });
        this.sound.doorLatch();
        return;
      }
      this.save.data.run.finalComplete = true;
      this.advance(6);
      this.body.classList.add('round-complete');
      this.show('#descent');
      this.$('#descent').classList.add('is-active');
      ['#round-hold', '#round-pause', '#round-resume', '#round-exit'].forEach((selector) => this.show(selector, false));
      this.show('#round-complete-continue');
      this.$('.allclear').removeAttribute('aria-hidden');
      this.text('#round-status', '巡房结束。一切正常。');
      this.text('.hud-instruction', '脚步声已远去 · 天亮前，推开房门');
      this.renderRound();
      this.renderEndingChoices();
      this.sound.doorLatch();
      const message = '脚步声已经远去。推开 0333 号房门，在天亮前确认访客状态单。';
      this.text('#desk-whisper-copy', message);
      this.$('#desk-toggle').classList.add('is-urgent');
      this.show('#desk-whisper');
      clearTimeout(this.nurseTimer);
      this.nurseTimer = setTimeout(() => this.show('#desk-whisper', false), 12000);
      this.$('#descent').scrollIntoView({ behavior: 'instant', block: 'start' });
      this.$('#round-complete-continue').focus({ preventScroll: true });
    }

    dismissNurse() {
      clearTimeout(this.nurseTimer);
      this.show('#desk-whisper', false);
      this.$('#desk-toggle').classList.remove('is-urgent');
    }

    enterEpilogue() {
      if (this.state.stage !== 6) return;
      this.$('#descent').classList.remove('is-active');
      this.show('#descent', false);
      this.dismissNurse();
      this.closeDesk();
      this.renderEndingChoices();
      this.scrollTo('#epilogue');
      this.$('#epilogue').focus({ preventScroll: true });
    }

    renderEndingChoices() {
      this.text('#ending-registration', this.save.data.booked ? '已签署长期入住预约' : '未登记的临时访客');
      this.text('#ending-clues', `${this.state.endingClueCount} / ${ENDING_CLUES.length} 条`);
      this.text('#ending-requirement', this.state.canArchive
        ? '全部线索已经闭合。留下、离开，或打开工牌背后的档案；确认后，本轮只有一个结局。'
        : this.save.data.booked ? '预约已经归档，南侧出口已锁定；仍可补查公开制度与入职须知，拼齐全部档案后调查真相。'
          : this.state.canEscape ? '你记得：不要锁门。南侧玫瑰园的出口仍开着；尚缺的档案也可回到页面补查。'
            : '先看清每个出口的条件。可返回院史与来信补查线索，选择之前不会开始下一轮查房。');
      const choices = [
        ['#ending-b', '#ending-b-note', this.state.canEscape, '未登记 · 已知“不锁门”。南侧玫瑰园仍有出口。', '[条件未满足：你已被登记在册，或尚未知晓夜间门锁的秘密]'],
        ['#archive-trigger', '#ending-c-note', this.state.canArchive, '全部线索已齐全。工牌 007 背后的 1971 年原始档案可以解密。', `[档案已加密：还缺 ${ENDING_CLUES.filter((id) => !this.state.has(id)).map((id) => CLUES[id].title).join('、')}]`]
      ];
      choices.forEach(([selector, note, unlocked, explanation, locked]) => {
        const button = this.$(selector);
        button.disabled = false;
        button.setAttribute('aria-disabled', String(!unlocked));
        button.setAttribute('title', unlocked ? explanation : locked);
        button.classList.toggle('is-locked', !unlocked);
        button.classList.toggle('is-unlocked', unlocked);
        this.show(selector);
        this.text(note, unlocked ? explanation : locked);
      });
      this.show('#ending-choice-group', !this.state.ending);
      this.renderMeta();
    }

    chooseEnding(id) {
      if (!this.state.choose(id)) {
        if (this.state.stage === 6) this.notice(id === 'B' ? '出口尚未打开：不能有入住预约，并且需要知晓“不要锁门”。' : `档案尚未解密：已掌握 ${this.state.endingClueCount}/${ENDING_CLUES.length} 条线索，请按状态单补查。`);
        return false;
      }
      this.body.classList.remove('round-complete');
      this.renderStage();
      this.closeDesk();
      this.dismissNurse();
      this.show('#ending-choice-group', false);
      this.show('#round-complete-continue', false);
      this.body.dataset.ending = id;
      this.renderMeta();
      this.renderDesk();
      this.startCinema(id);
      return true;
    }

    startCinema(id) {
      this.cancelCinema();
      const ending = ENDINGS[id];
      if (!ending) return;
      this.cinemaFinished = false;
      const dialog = this.$('#ending-cinema');
      dialog.dataset.ending = id;
      dialog.style.setProperty('--cinema-progress', '0');
      dialog.classList.remove('is-complete');
      dialog.classList.add('is-playing');
      this.text('#cinema-heading', ending.title);
      this.text('#cinema-result-title', ending.title);
      this.text('#cinema-result-copy', ending.copy);
      this.text('#cinema-announcement', '结局演出开始。可随时跳过，查看完整字幕与结局卡片。');
      this.show('#cinema-card', false);
      this.show('#cinema-skip');
      this.show('#cinema-archive', false);
      const lines = this.$('#cinema-lines');
      lines.replaceChildren();
      const paragraphs = ending.lines.map(() => {
        const paragraph = document.createElement('p');
        paragraph.className = 'cinema-line';
        lines.append(paragraph);
        return paragraph;
      });
      this.body.classList.add('cinema-open');
      if (!dialog.open) dialog.showModal();
      this.$('#cinema-skip').focus({ preventScroll: true });
      dialog.scrollTop = 0;
      this.sound.startEnding(id);
      this.cinema = new EndingSequence({
        lines: ending.lines,
        reduced: this.reduced.matches,
        isHidden: () => document.hidden,
        onLine: (index, text, complete) => {
          paragraphs[index].textContent = text;
          paragraphs[index].classList.add('is-visible');
          paragraphs[index].classList.toggle('is-current', !complete);
          const progress = (index + text.length / ending.lines[index].length) / ending.lines.length;
          dialog.style.setProperty('--cinema-progress', progress.toFixed(3));
          if (complete) this.text('#cinema-announcement', text);
        },
        onComplete: () => this.finishCinema()
      });
      this.cinema.start();
    }

    finishCinema() {
      if (this.cinemaFinished || this.state.stage !== 6) return;
      this.cinemaFinished = true;
      const id = this.state.ending;
      const ending = ENDINGS[id];
      this.$('#ending-cinema').classList.remove('is-playing');
      this.$('#ending-cinema').classList.add('is-complete');
      this.$('#ending-cinema').style.setProperty('--cinema-progress', '1');
      this.sound.settleEnding();
      this.show('#cinema-skip', false);
      this.show('#cinema-card');
      this.show('#cinema-archive', id === 'C');
      this.show('#new-visit');
      this.text('#ending-title', ending.title);
      this.text('#ending-copy', ending.copy);
      this.text('#ending-requirement', '本轮结局已归档。重新进入院区会重置本轮登记与线索，保留累计死亡数和结局徽章。');
      if (id === 'A') {
        this.body.classList.add('ending-day', 'permanent-stay');
        this.$('#hero-title').innerHTML = '把日子，<br>永远留在这里。';
        this.text('.hero-lede', '0333 号房已为你保留。花园里的第十三把椅子，从今天起有了名字。入住期限：1998 — FOREVER。');
        this.text('.hero-card small', '你的探访记录，已转为长期入住');
        document.querySelectorAll('.intake-trigger').forEach((button) => { button.hidden = true; });
        this.text('.head-phone', '0333');
        this.text('.utility .header-width > span:last-child', '院内照护专线 · 0333');
      } else if (id === 'B') this.body.classList.add('ending-day');
      if (id !== 'C') {
        this.sound.setStage(0);
        this.$('meta[name="theme-color"]').content = getComputedStyle(this.root).getPropertyValue('--porcelain').trim();
      }
      document.title = `梅麓：04:33 | ${ending.title.replace(/^结局 [ABC] · /, '')}`;
      this.renderMeta();
      this.text('#cinema-announcement', `${ending.title}。已解锁结局：${this.save.data.endings.length} / 3。可以返回院区或保留记忆开始二周目。`);
      this.$('#cinema-return').focus({ preventScroll: true });
      this.$('#cinema-card').scrollIntoView({ behavior: this.reduced.matches ? 'instant' : 'smooth', block: 'nearest' });
    }

    cancelCinema() {
      this.cinema?.cancel();
      this.cinema = null;
      this.cinemaFinished = false;
      this.sound.stopEnding();
      const dialog = this.$('#ending-cinema');
      if (dialog?.open) dialog.close();
      this.body.classList.remove('cinema-open');
    }

    closeCinema() {
      if (!this.cinemaFinished) return;
      const id = this.state.ending;
      this.cancelCinema();
      this.scrollTo(id === 'A' ? '#main' : '#epilogue');
      const target = this.$(id === 'A' ? '#hero-title' : '#epilogue');
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }

    renderDesk() {
      const list = this.$('#clue-list');
      list.replaceChildren();
      const filed = this.save.data.clues.filter((id) => !this.clueFlights?.has(id));
      filed.forEach((id) => {
        const clue = CLUES[id];
        const item = document.createElement('li');
        const title = document.createElement('strong');
        title.textContent = clue.title;
        const paragraph = document.createElement('p');
        paragraph.textContent = clue.text;
        item.append(title, paragraph);
        if (clue.rules) {
          const rules = document.createElement('ol');
          clue.rules.forEach((rule) => { const li = document.createElement('li'); li.textContent = rule; rules.append(li); });
          item.append(rules);
        }
        list.append(item);
      });
      if (!filed.length) {
        const item = document.createElement('li');
        item.textContent = '暂无异常记录。欢迎来院看看；玫瑰藤架的花园灯由访客自行开启。';
        list.append(item);
      }
      const choices = this.$('#desk-choices');
      choices.replaceChildren();
      const choice = (label, action) => {
        const button = document.createElement('button');
        button.type = 'button'; button.textContent = label; button.addEventListener('click', action); choices.append(button);
      };
      const replies = [
        ['王护士 · 日间值班台 · 在线', '欢迎来院。公开制度、院史与招聘资料均可查阅；花园照明由来访者自行开启。'],
        ['王护士 · 黄昏值班台 · 在线', '前三封早期来信已经取出。墨迹很浅，可以按住显影；读完也请向值班台咨询一次，再签收首次夜间巡视记录。'],
        ['王护士 · 首夜值班台 · 在线', '02:00 的巡视尚未结束。绿灯时前进，预警亮起立即松手，红灯期间保持静止。Esc 可暂停值守。'],
        ['王护士 · 第 2 日值班台 · 在线', '1971 卷宗已完成修复，五页交接残页和后三封来信已移交。有关出院、工牌、安神饮和陈护士的疑问，可以在下方逐项发送。'],
        ['王护士 · 夜间值班台 · 在线', '04:29，请逐一核对四路监控。最后一路视线停留不要超过 2.5 秒。'],
        ['王护士 · 04:33 值班台 · 在线', '0333 的门，请保持没有反锁。绿灯前进，红灯静止，安全期停下超过 3 秒会传来敲门声。'],
        ['王护士 · 天亮前的最后一条回执', '脚步声已经远去。请推开房门，核对登记状态与线索记录，天亮前确认最后一个出口。']
      ];
      const reply = this.state.ending ? ['本轮来访已经归档。', '本机图鉴保留了这次记忆。清除访客缓存可开始新的来访，累计死亡和结局徽章仍会保留。'] : replies[this.state.stage];
      this.text('#desk-greeting', reply[0]);
      this.text('#desk-answer', `${reply[1]}${this.save.data.booked ? ' 本轮预约状态：已提交，南侧离院出口关闭。' : ''}${!this.save.available ? ' 本机存储不可用，本次记录仅在当前页面保留。' : ''}`);
      if (this.state.ending) choice('清除访客缓存（重置本局）', () => this.newVisit());
      else if ([2, 5].includes(this.state.stage) && this.suspendedRound) {
        choice('重新签收本轮值守', () => this.startRound(true));
      } else {
        choice('查询院内公开记录', () => { this.closeDesk(); this.scrollTo('#search-archive'); });
        choice('查阅院史与交接日志', () => { this.closeDesk(); this.scrollTo('#about-hospital'); });
        if (this.state.stage === 0) choice('查看南侧花园照明', () => { this.closeDesk(); this.scrollTo('#theatre'); });
        if (this.state.stage >= 1) choice('回到家属来信', () => { this.closeDesk(); this.scrollTo('#cases'); });
        if (this.state.stage === 1 && this.state.firstNightReady) choice('签收 02:00 首次巡视记录', () => this.startRound());
        if (this.state.stage === 3 && this.state.investigationReady) choice('接通 B 区夜间监控', () => { if (this.advance(4)) { this.closeDesk(); this.scrollTo('#observation'); } });
        if (this.state.stage === 4) choice('返回四路夜间监控', () => { this.closeDesk(); this.scrollTo('#observation'); });
        if (this.state.stage === 6) choice('返回天亮前的访客状态单', () => this.enterEpilogue());
      }
      this.renderMeta();
    }

    selectDeskTab(name) {
      ['notes', 'comms'].forEach((tab) => {
        const selected = tab === name;
        this.$(`#tab-${tab}`).setAttribute('aria-selected', String(selected));
        this.$(`#tab-${tab}`).tabIndex = selected ? 0 : -1;
        this.show(`#desk-${tab}`, selected);
      });
    }

    openDesk() {
      if (this.state.stage >= 4) this.dismissNurse();
      this.show('#desk-panel');
      this.$('#desk-toggle').setAttribute('aria-expanded', 'true');
    }

    toggleDesk() { if (this.$('#desk-panel').hidden) this.openDesk(); else this.closeDesk(); }
    closeDesk(focus = false) {
      this.show('#desk-panel', false);
      this.$('#desk-toggle').setAttribute('aria-expanded', 'false');
      if (focus) this.$('#desk-toggle').focus({ preventScroll: true });
    }

    onVisibility() {
      if (document.hidden) {
        this.clearClueFlights();
        this.renderDesk();
        this.cancelHolds();
        if (this.qte) this.qte.remaining = Math.max(0, this.qte.deadline - performance.now());
        this.pauseRound();
        this.sound.suspend();
      } else {
        if (this.qte) this.qte.deadline = performance.now() + this.qte.remaining;
        if (!this.round?.paused) this.sound.resume();
      }
    }

    safeExit() {
      this.cancelCinema();
      this.dismissNurse();
      clearTimeout(this.frame);
      clearTimeout(this.jumpTimer);
      if (this.qte) clearInterval(this.qte.timer);
      this.cancelHolds();
      this.sound.suspend();
      // Reload from the public entrance; keep the run's evidence and booking intact.
      window.location.replace(window.location.pathname + window.location.search);
    }

    newVisit() {
      const dialog = this.$('#reset-dialog');
      if (!dialog.open) dialog.showModal();
    }

    resetVisit() {
      this.clearClueFlights();
      this.cancelCinema();
      this.dismissNurse();
      this.chatTimers?.forEach((timer) => clearTimeout(timer));
      this.chatTimers?.clear();
      this.pendingWarning = false;
      this.stageSince = performance.now();
      this.hintLevel = 0;
      this.journalPage = 1;
      this.$('#desk-messages')?.replaceChildren();
      this.show('#archive-result', false);
      if (this.save.newVisit()) {
        window.location.replace(window.location.pathname + window.location.search);
        return;
      }
      clearTimeout(this.frame);
      clearTimeout(this.jumpTimer);
      clearTimeout(this.noticeTimer);
      if (this.qte) clearInterval(this.qte.timer);
      this.cancelHolds();
      this.isolateRound(false);
      this.round = null;
      this.qte = null;
      this.activeCamera = null;
      this.keys.clear();
      this.pointerHeld = false;
      this.holdPointerId = null;
      this.pointerPosition = null;
      this.lit = false;
      this.suspendedRound = false;
      this.state = new GameState(this.save);
      this.body.classList.remove('round-active', 'round-paused', 'has-died', 'caught-on', 'jump-flash', 'hesitate-on', 'qte-on', 'ending-day', 'permanent-stay', 'round-complete', 'cinema-open');
      delete this.body.dataset.ending;
      this.root.style.removeProperty('--descent');
      this.root.style.removeProperty('--surgeon-near');
      this.entrance.forEach(([selector, html]) => { this.$(selector).innerHTML = html; });
      this.identity?.forEach(([node, html]) => { node.innerHTML = html; });
      document.querySelectorAll('.intake-trigger').forEach((button) => { button.hidden = false; });
      this.$('#hero-title').removeAttribute('tabindex');
      this.$('.allclear').setAttribute('aria-hidden', 'true');
      this.show('#round-complete-continue', false);
      this.show('#cinema-card', false);
      this.$('#cinema-lines').replaceChildren();
      this.shifts.forEach((node) => {
        node.textContent = node.dataset.calm;
        node.classList.remove('is-shifted', 'glitching');
        node.removeAttribute('role');
        node.removeAttribute('tabindex');
        node.removeAttribute('aria-label');
      });
      document.querySelectorAll('[data-letter]').forEach((button) => {
        const card = button.closest('.case');
        card.classList.remove('revealed');
        card.querySelector('.case-hidden').setAttribute('aria-hidden', 'true');
        button.textContent = '长按 1.2 秒，显影夹层';
        button.setAttribute('aria-pressed', 'false');
      });
      document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
      document.querySelectorAll('.job-card[open]').forEach((card) => { card.open = false; });
      document.querySelectorAll('.cam').forEach((cam) => {
        cam.classList.remove('is-active', 'is-checked');
        const button = cam.querySelector('.cam-open');
        button.setAttribute('aria-pressed', 'false');
        button.textContent = '查看';
      });
      this.$('#theatre-plate').classList.remove('lit', 'lamp-fault');
      this.$('#theatre-lamp').setAttribute('aria-pressed', 'false');
      this.text('#theatre-lamp span:not(.dot)', '打开花园灯');
      ['#retry-panel', '#round-resume', '#camera-view', '#camera-qte', '#new-visit', '#ending-b', '#archive-trigger'].forEach((selector) => this.show(selector, false));
      this.$('#archive-trigger').disabled = true;
      this.show('#ending-a');
      this.show('#round-hold');
      this.show('#round-pause');
      this.$('#round-hold').classList.remove('is-held');
      this.closeDesk();
      this.selectDeskTab('comms');
      this.updateCameras();
      this.renderStage();
      this.renderDesk();
      this.renderEndingChoices();
      window.scrollTo({ top: 0, behavior: 'instant' });
      this.notice('新的来访已开始。本机存储不可用，死亡和结局记录仍保留在当前页面；刷新或关闭页面后将无法保留。');
    }
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { SaveManager, GameState, RoundEngine, SoundEngine, CLUES, ENDING_CLUES, ENDINGS, EndingSequence, MeiluGame, sampleClueFlight, CLUE_FLIGHT_DURATION };
  }
  if (typeof document !== 'undefined') new MeiluGame();
})();
