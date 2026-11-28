'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const { SaveManager, GameState, RoundEngine, SoundEngine, CLUES, ENDING_CLUES, ENDINGS, EndingSequence, MeiluGame } = require('../public/scenes/care-home/app.js');

function memory(raw = null) {
  let value = raw;
  return { getItem: () => value, setItem: (_, next) => { value = next; }, read: () => JSON.parse(value) };
}

function freshSave(raw = null) { return new SaveManager(memory(raw)); }

const FIRST_NIGHT_LETTERS = ['letter-004', 'letter-041', 'letter-088'];
const INVESTIGATION_EVIDENCE = [
  ...FIRST_NIGHT_LETTERS, 'letter-119', 'letter-207', 'letter-333', 'archive-1971',
  'journal-1', 'journal-2', 'journal-3', 'journal-4', 'journal-5', 'nurse-warning'
];

function reachStage(save, state, target, { allEndingClues = false } = {}) {
  if (allEndingClues) Object.keys(CLUES).forEach((id) => save.collect(id));
  if (target >= 1) {
    save.collect('extra-chair');
    assert.equal(state.advance(1), true);
  }
  if (target >= 2) {
    FIRST_NIGHT_LETTERS.forEach((id) => save.collect(id));
    save.data.run.contacts = 1;
    assert.equal(state.advance(2), true);
  }
  if (target >= 3) {
    save.data.run.tutorialComplete = true;
    assert.equal(state.advance(3), true);
  }
  if (target >= 4) {
    INVESTIGATION_EVIDENCE.forEach((id) => save.collect(id));
    assert.equal(state.advance(4), true);
  }
  if (target >= 5) {
    [1, 2, 3, 4].forEach((id) => state.cameras.add(id));
    state.qteResolved = true;
    assert.equal(state.advance(5), true);
  }
  if (target >= 6) {
    save.data.run.finalComplete = true;
    assert.equal(state.advance(6), true);
  }
  return { save, state };
}

test('save v2 sanitizes corrupt metadata, clues, endings and run fields', () => {
  assert.equal(new SaveManager(memory('{broken')).data.version, 2);
  const raw = {
    version: 2, deaths: -2, endings: ['A', 'A', 'X'],
    clues: ['letter-333', 'unknown', 'letter-333'], booked: 'true',
    run: { stage: 9, contacts: -4, topics: ['discharge', 'invalid', 'discharge'], tutorialComplete: 1,
      finalComplete: true, cameras: [1, 1, 9], qteResolved: 'true', hardRound: true, ending: 'X' }
  };
  const save = new SaveManager(memory(JSON.stringify(raw)));
  assert.equal(save.data.version, 2);
  assert.deepEqual(save.data.endings, ['A']);
  assert.deepEqual(save.data.clues, ['letter-333']);
  assert.equal(save.data.deaths, 0);
  assert.equal(save.data.booked, false);
  assert.deepEqual(save.data.run, {
    stage: 6, contacts: 0, topics: ['discharge'], tutorialComplete: false, finalComplete: true,
    cameras: [1], qteResolved: false, hardRound: true, ending: null
  });
});

test('unavailable storage remains playable in memory', () => {
  const save = new SaveManager({ getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } });
  assert.doesNotThrow(() => { save.collect('extra-chair'); save.die(); save.book(); save.unlock('A'); });
  assert.equal(save.available, false);
  assert.equal(save.data.deaths, 1);
  assert.equal(save.data.booked, true);
  assert.equal(save.data.run.stage, 0);
});

test('reload restores the v2 run; new visit clears clues, booking and run but preserves meta', () => {
  const storage = memory();
  const save = new SaveManager(storage);
  save.collect('letter-333'); save.book(); save.die(); save.die(); save.unlock('B');
  Object.assign(save.data.run, { stage: 4, contacts: 3, topics: ['warning', 'tea'], tutorialComplete: true, hardRound: true });
  save.persist();
  assert.equal(save.collect('letter-333'), false);
  assert.equal(save.collect('unknown'), false);
  const restored = new SaveManager(storage);
  assert.equal(restored.data.version, 2);
  assert.equal(restored.data.deaths, 2);
  assert.equal(restored.data.booked, true);
  assert.deepEqual(restored.data.clues, ['letter-333']);
  assert.equal(restored.data.run.stage, 4);
  assert.equal(restored.data.run.contacts, 3);
  assert.deepEqual(restored.data.run.topics, ['warning', 'tea']);
  assert.equal(restored.data.run.hardRound, true);
  restored.newVisit();
  assert.equal(storage.read().version, 2);
  assert.deepEqual(storage.read().endings, ['B']);
  assert.equal(storage.read().deaths, 2);
  assert.equal(storage.read().booked, false);
  assert.deepEqual(storage.read().clues, []);
  assert.deepEqual(storage.read().run, SaveManager.freshRun());
});

test('v1 migration preserves meta records and starts with a fresh v2 run', () => {
  const storage = memory(JSON.stringify({
    version: 1, deaths: 7, endings: ['A', 'C', 'A'], clues: ['letter-333', 'journal-5', 'unknown'], booked: true,
    run: { stage: 6, contacts: 12, tutorialComplete: true }
  }));
  const save = new SaveManager(storage);
  assert.equal(save.data.version, 2);
  assert.equal(save.data.deaths, 7);
  assert.deepEqual(save.data.endings, ['A', 'C']);
  assert.deepEqual(save.data.clues, ['letter-333', 'journal-5']);
  assert.equal(save.data.booked, true);
  assert.deepEqual(save.data.run, SaveManager.freshRun());
});

test('GameState restores run progress and checkpoints it back to v2 storage', () => {
  const storage = memory(JSON.stringify({
    version: 2, deaths: 0, endings: [], clues: [], booked: false,
    run: { stage: 4, contacts: 2, topics: ['badge', 'tea'], tutorialComplete: true, finalComplete: false,
      cameras: [1, 3], qteResolved: true, hardRound: true, ending: 'B' }
  }));
  const save = new SaveManager(storage);
  const state = new GameState(save);
  assert.equal(state.stage, 4);
  assert.equal(state.hardRound, true);
  assert.equal(state.qteResolved, true);
  assert.deepEqual([...state.cameras], [1, 3]);
  assert.equal(state.ending, null, 'an ending is not restored before stage 6');
  state.stage = 5;
  state.checkpoint();
  const restored = new SaveManager(storage);
  assert.equal(restored.data.run.stage, 5);
  assert.equal(restored.data.run.contacts, 2);
  assert.deepEqual(restored.data.run.topics, ['badge', 'tea']);
  assert.equal(restored.data.run.qteResolved, true);
  assert.equal(restored.data.run.hardRound, true);
});

test('incomplete tutorial and final completion recover to their prior safe stages', () => {
  const withoutTutorial = new GameState(new SaveManager(memory(JSON.stringify({
    version: 2, clues: [], endings: [], deaths: 0, booked: false,
    run: { ...SaveManager.freshRun(), stage: 5, tutorialComplete: false }
  }))));
  assert.equal(withoutTutorial.stage, 1);
  const beforeFinal = new GameState(new SaveManager(memory(JSON.stringify({
    version: 2, clues: [], endings: [], deaths: 0, booked: false,
    run: { ...SaveManager.freshRun(), stage: 6, tutorialComplete: true, finalComplete: false }
  }))));
  assert.equal(beforeFinal.stage, 5);
});

test('stage progression rejects skips and enforces every evidence and round gate', () => {
  const save = freshSave();
  const state = new GameState(save);
  assert.equal(state.advance(2), false);
  assert.equal(state.advance(3), false);
  assert.equal(state.advance(1), false);
  save.collect('extra-chair');
  assert.equal(state.advance(1), true);
  assert.equal(state.advance(3), false);
  assert.equal(state.advance(2), false, 'first-night letters alone are insufficient without a contact');
  FIRST_NIGHT_LETTERS.forEach((id) => save.collect(id));
  assert.equal(state.advance(2), false);
  save.data.run.contacts = 1;
  assert.equal(state.advance(2), true);
  assert.equal(state.advance(4), false);
  assert.equal(state.advance(3), false);
  save.data.run.tutorialComplete = true;
  assert.equal(state.advance(3), true);
  assert.equal(state.advance(4), false);
  INVESTIGATION_EVIDENCE.filter((id) => id !== 'nurse-warning').forEach((id) => save.collect(id));
  assert.equal(state.investigationReady, false);
  assert.equal(state.advance(4), false);
  save.collect('nurse-warning');
  assert.equal(state.investigationReady, true);
  assert.equal(state.advance(4), true);
  assert.equal(state.advance(6), false);
  assert.equal(state.advance(5), false);
  [1, 2, 3].forEach((id) => state.cameras.add(id));
  state.qteResolved = true;
  assert.equal(state.advance(5), false);
  state.cameras.add(4);
  state.qteResolved = false;
  assert.equal(state.advance(5), false);
  state.qteResolved = true;
  assert.equal(state.advance(5), true);
  assert.equal(state.advance(6), false);
  save.data.run.finalComplete = true;
  assert.equal(state.advance(6), true);
  assert.equal(state.stage, 6);
});

test('six letters, the 1971 archive, all five journal pages and nurse warning each gate investigation', () => {
  const required = [...INVESTIGATION_EVIDENCE];
  assert.equal(required.filter((id) => id.startsWith('letter-')).length, 6);
  assert.equal(required.filter((id) => id.startsWith('journal-')).length, 5);
  for (const missing of required) {
    const save = freshSave();
    required.filter((id) => id !== missing).forEach((id) => save.collect(id));
    const state = new GameState(save);
    assert.equal(state.investigationReady, false, `${missing} must be required`);
    save.collect(missing);
    assert.equal(state.investigationReady, true, `${missing} completes the investigation evidence`);
  }
});

test('night palette applies only to the first patrol, monitoring and final patrol', () => {
  const state = new GameState(freshSave());
  for (let stage = 0; stage <= 6; stage += 1) {
    state.stage = stage;
    assert.equal(state.night, [2, 4, 5].includes(stage), `stage ${stage}`);
  }
});

test('B requires an unbooked visit and one of its qualifying clues; choices are locked to stage 6', () => {
  const escapeClues = ['letter-333', 'night-contract', 'journal-5', 'nurse-warning'];
  for (const clue of escapeClues) {
    const save = freshSave();
    const state = new GameState(save);
    state.stage = 5;
    save.collect(clue);
    assert.equal(state.choose('B'), false, 'ending choices are unavailable before stage 6');
    state.stage = 6;
    assert.equal(state.canEscape, true, clue);
    assert.equal(state.choose('B'), true, clue);
    assert.equal(state.stage, 6, 'choosing an ending must not advance the stage');
    assert.equal(state.choose('A'), false, 'an ending can be chosen only once');
  }
  const booked = freshSave();
  const bookedState = new GameState(booked);
  bookedState.stage = 6;
  booked.collect('letter-333');
  booked.book();
  assert.equal(bookedState.canEscape, false);
  assert.equal(bookedState.choose('B'), false);
});

test('A becomes available only after final completion at stage 6', () => {
  const save = freshSave();
  const state = new GameState(save);
  reachStage(save, state, 5);
  assert.equal(state.choose('A'), false);
  assert.equal(state.advance(6), false);
  save.data.run.finalComplete = true;
  assert.equal(state.advance(6), true);
  assert.equal(state.choose('A'), true);
  assert.equal(state.stage, 6);
  assert.equal(state.choose('B'), false, 'the selected ending is final');
  assert.deepEqual(save.data.endings, ['A']);
});

test('C remains locked until every one of the 18 ending clues is collected', () => {
  const targetSave = freshSave();
  const targetState = new GameState(targetSave);
  targetState.stage = 6;
  assert.equal(ENDING_CLUES.length, 18);
  ENDING_CLUES.slice(0, -1).forEach((id) => targetSave.collect(id));
  assert.equal(targetState.endingClueCount, 17);
  assert.equal(targetState.canArchive, false);
  assert.equal(targetState.choose('C'), false);
  targetSave.collect(ENDING_CLUES.at(-1));
  assert.equal(targetState.canArchive, true);
  assert.equal(targetState.choose('C'), true);
  assert.equal(targetState.stage, 6);
  assert.equal(targetState.choose('A'), false);
  assert.equal(targetState.ending, 'C');
  assert.deepEqual(targetSave.data.endings, ['C']);
});

function sequenceClock() {
  const pending = new Map();
  let nextId = 0;
  return {
    schedule(callback) { const id = ++nextId; pending.set(id, callback); return id; },
    clear(id) { pending.delete(id); },
    next() {
      const entry = pending.entries().next().value;
      if (!entry) return false;
      pending.delete(entry[0]);
      entry[1]();
      return true;
    },
    get size() { return pending.size; }
  };
}

test('ending defaults call browser timers without binding them to the sequence', () => {
  const clock = sequenceClock();
  let cleared = 0;
  const sandbox = {
    module: { exports: {} },
    setTimeout(callback) {
      assert.notEqual(this?.constructor?.name, 'EndingSequence', 'Illegal invocation');
      return clock.schedule(callback);
    },
    clearTimeout(id) {
      assert.notEqual(this?.constructor?.name, 'EndingSequence', 'Illegal invocation');
      cleared++;
      clock.clear(id);
    }
  };
  const source = fs.readFileSync(path.resolve(__dirname, '../public/scenes/care-home/app.js'), 'utf8');
  vm.runInNewContext(source, sandbox);
  let completed = 0;
  const sequence = new sandbox.module.exports.EndingSequence({ lines: ['门外天亮了。'], onComplete: () => completed++ });
  sequence.start();
  assert.equal(clock.size, 1);
  sequence.skip();
  assert.equal(completed, 1);
  assert.equal(clock.size, 0);
  assert.ok(cleared > 0);
});

test('all ending subtitles finish once and preserve complete text', () => {
  for (const ending of Object.values(ENDINGS)) {
    const clock = sequenceClock();
    const rendered = [];
    let completed = 0;
    const sequence = new EndingSequence({
      lines: ending.lines, schedule: clock.schedule, clear: clock.clear,
      onLine(index, text) { rendered[index] = text; }, onComplete: () => completed++
    });
    assert.equal(sequence.start(), true);
    assert.equal(sequence.start(), false);
    let ticks = 0;
    while (clock.next()) assert.ok(++ticks < 1000, 'subtitle timer did not finish');
    assert.deepEqual(rendered, ending.lines);
    assert.equal(completed, 1);
    sequence.skip(); sequence.finish();
    assert.equal(completed, 1);
  }
});

test('skip shows every subtitle; cancel prevents stale callbacks and completion', () => {
  for (const skip of [false, true]) {
    const clock = sequenceClock();
    const rendered = [];
    let completed = 0;
    const sequence = new EndingSequence({
      lines: ['南侧玫瑰园', '门没有锁。'], schedule: clock.schedule, clear: clock.clear,
      onLine(index, text) { rendered[index] = text; }, onComplete: () => completed++
    });
    sequence.start();
    if (skip) sequence.skip(); else sequence.cancel();
    assert.equal(clock.size, 0);
    const before = [...rendered];
    sequence.tick();
    assert.deepEqual(rendered, before);
    assert.equal(completed, skip ? 1 : 0);
    if (skip) assert.deepEqual(rendered, sequence.lines);
  }
});

test('hidden ending subtitles wait; reduced motion renders the ending immediately', () => {
  const clock = sequenceClock();
  let hidden = true;
  let completed = 0;
  const rendered = [];
  const sequence = new EndingSequence({
    lines: ['天亮了。'], schedule: clock.schedule, clear: clock.clear, isHidden: () => hidden,
    onLine(index, text) { rendered[index] = text; }, onComplete: () => completed++
  });
  sequence.start(); clock.next();
  assert.deepEqual(rendered, []);
  hidden = false;
  while (clock.next()) {}
  assert.deepEqual(rendered, sequence.lines);
  assert.equal(completed, 1);
  const reduced = new EndingSequence({ lines: ['天亮了。'], reduced: true, schedule: clock.schedule, clear: clock.clear, onComplete: () => completed++ });
  reduced.start();
  assert.equal(completed, 2);
  assert.equal(clock.size, 0);
});

function play(hard, tutorial = false) {
  let completed = 0;
  let deaths = 0;
  const engine = new RoundEngine({ hard, tutorial, onComplete: () => completed++, onDeath: () => deaths++ });
  engine.start(0);
  for (let now = 50; now < 60000 && engine.phase !== 'complete' && engine.phase !== 'dead'; now += 50) {
    if (engine.phase === 'safe') engine.input('hold', now);
    else engine.release();
    engine.update(now);
  }
  return { engine, completed, deaths };
}

test('tutorial and both final-round difficulties use their configured durations and thresholds', () => {
  const configurations = [
    { hard: false, tutorial: true, duration: 15000, thresholds: 2, warning: 1200, red: 1300 },
    { hard: false, tutorial: false, duration: 30000, thresholds: 3, warning: 850, red: 1900 },
    { hard: true, tutorial: false, duration: 30000, thresholds: 5, warning: 500, red: 2500 }
  ];
  for (const config of configurations) {
    const engine = new RoundEngine(config);
    assert.equal(engine.duration, config.duration);
    assert.equal(engine.thresholds.length, config.thresholds);
    assert.equal(engine.warningDuration, config.warning);
    assert.equal(engine.redDuration, config.red);
    const result = play(config.hard, config.tutorial);
    assert.equal(result.engine.phase, 'complete');
    assert.equal(result.engine.progress, 1);
    assert.equal(result.engine.checks, config.thresholds);
    assert.equal(result.completed, 1);
    assert.equal(result.deaths, 0);
  }
});

test('red-light movement kills once, and holding through the warning also kills', () => {
  let deaths = 0;
  const engine = new RoundEngine({ onDeath: () => deaths++ });
  engine.start(0); engine.setPhase('red', 0);
  engine.input('wheel', 10); engine.input('wheel', 20); engine.update(100);
  assert.equal(engine.phase, 'dead');
  assert.equal(deaths, 1);
  engine.start(1000); engine.input('hold', 1000); engine.setPhase('warning', 1000);
  engine.update(1850);
  assert.equal(engine.phase, 'dead');
  assert.equal(deaths, 2);
});

test('releasing during the warning and remaining still survives the red period', () => {
  const engine = new RoundEngine();
  engine.start(0); engine.input('hold', 0); engine.setPhase('warning', 0);
  engine.release(); engine.update(850);
  assert.equal(engine.phase, 'red');
  engine.update(2750);
  assert.equal(engine.phase, 'safe');
  assert.equal(engine.checks, 1);
});

test('three-second hesitation warns; prolonged inactivity ends the round', () => {
  let knocks = 0;
  const engine = new RoundEngine({ onHesitate: () => knocks++ });
  engine.start(0); engine.update(3100); engine.update(4000);
  assert.equal(knocks, 1);
  assert.equal(engine.phase, 'safe');
  engine.input('wheel', 4100); engine.update(4100);
  engine.update(7200);
  assert.equal(knocks, 2);
  engine.update(11000);
  assert.equal(engine.phase, 'dead');
});

test('pause freezes red timing, drops held input, and resumes with time remaining', () => {
  const engine = new RoundEngine();
  engine.start(0); engine.input('hold', 0); engine.setPhase('red', 100);
  engine.pause(500);
  assert.equal(engine.held, false);
  engine.update(10000);
  assert.equal(engine.phase, 'red');
  engine.resume(10500); engine.update(10500);
  assert.equal(engine.phase, 'red');
  engine.update(12000);
  assert.equal(engine.phase, 'safe');
});

test('wheel bursts advance at a bounded rate and stop without continuing on momentum', () => {
  const engine = new RoundEngine();
  engine.start(0); engine.input('wheel', 0); engine.update(100);
  const before = engine.progress;
  assert.ok(before > 0 && before < .01);
  engine.update(1000);
  assert.equal(engine.progress, before);
});

test('small-text palette meets AA contrast even over the brightest camera image', () => {
  const luminance = (hex) => {
    const channels = hex.match(/[a-f0-9]{2}/gi).map((value) => parseInt(value, 16) / 255);
    const linear = channels.map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
    return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
  };
  for (const [foreground, background] of [['f7faf4', '35594a'], ['21382f', 'ffffff'], ['edf4ef', '595959'], ['bedccd', '121a18'], ['48665a', 'f7faf4']]) {
    const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
    assert.ok((values[0] + .05) / (values[1] + .05) >= 4.5, `${foreground} / ${background}`);
  }
  const css = fs.readFileSync(path.resolve(__dirname, '../public/scenes/care-home/styles.css'), 'utf8');
  // The transient archival label is explicitly specified at 12px; persistent UI stays >=13px.
  assert.match(css, /\.flying-clue-copy small\s*\{[^}]*font: 12px\/1\.4/);
  const persistent = css.replace(/\.flying-clue-copy small\s*\{[^}]*\}/g, '');
  const sizes = [...persistent.matchAll(/font(?:-size)?:\s*(\d+(?:\.\d+)?)px/g)].map((match) => Number(match[1]));
  assert.ok(sizes.every((size) => size >= 13), 'legacy microscopic font size remains');
});

test('HTML binds all game IDs, uses only local assets, and ships ten original JPGs', () => {
  const scene = path.resolve(__dirname, '../public/scenes/care-home');
  const html = fs.readFileSync(path.join(scene, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(scene, 'app.js'), 'utf8');
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, 'duplicate HTML IDs');
  const required = [...js.matchAll(/this\.\$\('#([\w-]+)'\)/g)].map((match) => match[1]);
  required.forEach((id) => assert.ok(ids.includes(id), `missing #${id}`));
  const media = fs.readdirSync(path.join(scene, 'media')).filter((name) => name.endsWith('.jpg'));
  assert.equal(media.length, 10);
  for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
    assert.ok(!/^https?:\/\//.test(url), `external resource: ${url}`);
    if (!url.startsWith('#')) assert.ok(fs.existsSync(path.resolve(scene, url.split('?')[0])), `missing ${url}`);
  }
});

test('all four new photos are distinct landscape JPEGs larger than 50 KB', () => {
  const scene = path.resolve(__dirname, '../public/scenes/care-home');
  const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  const hashes = new Set(fs.readdirSync(path.join(scene, 'media')).filter((name) => name.endsWith('.jpg')).map((name) => hash(path.join(scene, 'media', name))));
  for (const name of ['heritage-1971.jpg', 'ward-corridor-day.jpg', 'herbal-cup.jpg', 'archive-files.jpg']) {
    const file = path.join(scene, 'assets/new', name);
    const bytes = fs.readFileSync(file);
    assert.ok(bytes.length > 50 * 1024, `${name} is too small`);
    assert.equal(bytes.readUInt16BE(0), 0xffd8, `${name} is not a JPEG`);
    const digest = hash(file);
    assert.equal(hashes.has(digest), false, `${name} reuses an existing photograph`);
    hashes.add(digest);
    let dimensions = null;
    for (let offset = 2; offset + 8 < bytes.length;) {
      assert.equal(bytes[offset], 0xff, `${name} has an invalid JPEG marker`);
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd8) continue;
      const length = bytes.readUInt16BE(offset);
      assert.ok(length >= 2, `${name} has an invalid JPEG segment`);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        dimensions = { height: bytes.readUInt16BE(offset + 3), width: bytes.readUInt16BE(offset + 5) };
        break;
      }
      offset += length;
    }
    assert.ok(dimensions && dimensions.width > dimensions.height, `${name} must be a landscape photo`);
    assert.ok(dimensions.width >= 1000, `${name} must retain a high-resolution source`);
  }
});

test('the seven-stage document preserves the requested flow and complete evidence libraries', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../public/scenes/care-home/index.html'), 'utf8');
  const order = ['hero', 'search-archive', 'procedures', 'theatre', 'about-hospital', 'cases', 'observation', 'descent', 'epilogue'];
  let previous = -1;
  for (const id of order) {
    const index = html.indexOf(`id="${id}"`);
    assert.ok(index > previous, `${id} is missing or out of order`);
    previous = index;
  }
  assert.ok(html.indexOf('rumor-banner') < html.indexOf('id="hero"'));
  const records = [...html.matchAll(/data-record="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(records.sort(), ['24小时护理', '营养配餐', '15分钟林荫道', '0333号房', '出院办理流程', '1971旧址档案'].sort());
  const pages = [...html.matchAll(/data-journal-page="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(pages, ['1', '2', '3', '4', '5']);
  const letters = [...html.matchAll(/data-letter-card="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(letters, ['letter-004', 'letter-041', 'letter-088', 'letter-119', 'letter-207', 'letter-333']);
  const topics = [...html.matchAll(/data-topic="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(topics.sort(), ['discharge', 'badge', 'tea', 'chairs', 'warning'].sort());
  const prose = html.replace(/<svg\b[\s\S]*?<\/svg>/g, '').replace(/<[^>]*>/g, '');
  assert.ok((prose.match(/[\u3400-\u9fff]/g) || []).length >= 4000, 'story copy must include at least 4,000 Chinese characters');
  for (const text of [
    '本院所有夜间巡房均由持证护士规范执行',
    '严禁擅自推门或替长者反锁房门。',
    '连续饮用三个月以上者，夜间梦游与哭闹率下降 98%。',
    '每天上午 10:00 树影最宜散步',
    '该编号仅用于登记“无陪同家属、自愿预约短期试住的临时访客”',
    '原一楼大厅“出院结算窗口”已正式改造为桂花茶歇区',
    '施工队发现通往 B 区地下室的走廊无法被水泥封死',
    '张大爷连续三天问我今天是不是五月十二号',
    '排班表上今晚明明只有我一个人',
    '1,204 是住进这里再也没出去过的人数',
    '轻得像一片随时会飘走的羽毛',
    '可那些日子我都在国外，根本没来过梅麓',
    '他们不是在治病，是在抹掉他的记忆',
    '梅麓根本没有外地分院',
    '天亮前白大褂查完房的瞬间，往南侧玫瑰藤架跑',
    '【系统提示：王护士撤回了一条消息】'
  ]) assert.ok(prose.includes(text), `missing original story text: ${text}`);
});

function uiElement() {
  const listeners = new Map();
  const attributes = new Map();
  const classes = new Set();
  return {
    textContent: '', innerHTML: '', hidden: false, dataset: {}, children: [], open: false,
    style: { setProperty() {}, removeProperty() {} },
    classList: {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle(name, force = !classes.has(name)) { if (force) classes.add(name); else classes.delete(name); }
    },
    append(...nodes) { this.children.push(...nodes); },
    appendChild(node) { this.children.push(node); return node; },
    replaceChildren(...nodes) { this.children = [...nodes]; },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    content: { querySelector() { return null; }, querySelectorAll() { return []; } },
    scrollIntoView() { this.scrolled = true; },
    showModal() { this.open = true; },
    close() { this.open = false; },
    remove() { this.removed = true; },
    setAttribute: (name, value) => attributes.set(name, value),
    getAttribute: (name) => attributes.get(name),
    removeAttribute: (name) => attributes.delete(name),
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, []);
      listeners.get(type).push(handler);
    },
    emit(type, values = {}) {
      const event = { target: this, preventDefault() {}, ...values };
      (listeners.get(type) || []).forEach((handler) => handler(event));
    },
    focus() {}, setPointerCapture() {}, closest: () => null
  };
}

function withUi(run) {
  const previous = { window: global.window, document: global.document };
  const nodes = new Map();
  const groups = new Map();
  const windowStub = Object.assign(uiElement(), { location: { pathname: '/', search: '', replace() { windowStub.reloads++; } }, reloads: 0, scrollTo() {} });
  const documentStub = Object.assign(uiElement(), {
    title: '',
    querySelectorAll: (selector) => groups.get(selector) || [],
    querySelector: (selector) => groups.get(selector)?.[0] || null,
    createElement: (tagName) => Object.assign(uiElement(), { tagName: String(tagName).toUpperCase() }),
    createDocumentFragment: () => uiElement()
  });
  global.window = windowStub;
  global.document = documentStub;
  const game = Object.assign(Object.create(MeiluGame.prototype), {
    body: uiElement(), root: uiElement(), reduced: uiElement(), shifts: [],
    holds: new Map(), keys: new Set(), pointerHeld: false, holdPointerId: null, pointerPosition: null,
    qte: null, frame: null, jumpTimer: null, noticeTimer: null, entrance: [],
    save: new SaveManager(), sound: { suspend() {}, resume() {}, relay() {}, alarm() {}, impact() {}, footstep() {}, tone() {}, doorLatch() {}, setStage() {}, stopEnding() {} },
    $(selector) {
      if (!nodes.has(selector)) nodes.set(selector, uiElement());
      return nodes.get(selector);
    },
    notice(message) { this.lastNotice = message; },
    renderDesk() { this.renderMeta(); }
  });
  game.state = new GameState(game.save);
  game.state.stage = 5;
  game.round = new RoundEngine();
  game.round.start(performance.now());
  try { run({ game, nodes, groups, window: windowStub }); }
  finally {
    if (previous.window === undefined) delete global.window; else global.window = previous.window;
    if (previous.document === undefined) delete global.document; else global.document = previous.document;
  }
}

test('three distinct desk topics under cross-examination reveal the nurse warning', () => {
  withUi(({ game, nodes }) => {
    game.save = freshSave();
    game.state = new GameState(game.save);
    game.state.stage = 3;
    game.chatTimers = new Set();
    game.appendMessage = () => {};
    game.nurseReply = () => '已收到核验请求。';
    game.renderDesk = () => {};
    game.checkEvidence = () => {};
    game.collect = function collect(id) { return this.save.collect(id); };
    nodes.set('#nurse-library', Object.assign(uiElement(), {
      content: { querySelector: () => ({ textContent: '已收到核验请求。' }) }
    }));

    game.sendMessage('请查询出院办理记录');
    game.sendMessage('安神茶的成分是什么');
    assert.equal(game.save.data.clues.includes('nurse-warning'), false);
    game.sendMessage('0333 的门不要锁');

    assert.equal(game.save.data.run.contacts, 3);
    assert.deepEqual(game.save.data.run.topics, ['discharge', 'tea', 'warning']);
    assert.equal(game.save.data.clues.includes('nurse-warning'), true);
  });
});

test('first patrol completion restores day two and the final patrol exposes the door', () => {
  for (const stage of [2, 5]) {
    withUi(({ game }) => {
      game.state.stage = stage;
      game.save.data.run.tutorialComplete = stage === 5;
      game.round.tutorial = stage === 2;
      game.round.phase = 'complete';
      game.completeRound();
      assert.equal(game.state.stage, stage === 2 ? 3 : 6);
      assert.equal(game.state.night, false);
      assert.equal(game.body.classList.contains('round-active'), false);
      assert.equal(game.save.data.run.tutorialComplete, true);
      if (stage === 2) {
        assert.equal(game.$('#descent').hidden, true);
        assert.equal(game.$('#morning-note').hidden, false);
        assert.equal(game.$('#epilogue').hidden, true);
      } else {
        assert.equal(game.save.data.run.finalComplete, true);
        assert.equal(game.$('#round-complete-continue').hidden, false);
        game.enterEpilogue();
        assert.equal(game.$('#descent').hidden, true);
        assert.equal(game.$('#epilogue').hidden, false);
        assert.equal(game.$('#epilogue').scrolled, true);
      }
      clearTimeout(game.nurseTimer);
    });
  }
});

test('morning note links scroll to their archive and journal targets', () => {
  withUi(({ game, groups }) => {
    const buttons = ['#search-archive', '#journal-desk'].map((target) => {
      const button = uiElement();
      button.dataset.morningTarget = target;
      return button;
    });
    groups.set('[data-morning-target]', buttons);
    game.bind();
    buttons.forEach((button) => {
      button.emit('click');
      assert.equal(game.$(button.dataset.morningTarget).scrolled, true);
    });
  });
});

test('mobile forward hold ignores another pointer release and cancels only its owner', () => {
  withUi(({ game, window }) => {
    game.bind();
    const hold = game.$('#round-hold');
    hold.emit('pointerdown', { button: 0, pointerId: 11 });
    hold.emit('pointerdown', { button: 0, pointerId: 22 });
    window.emit('pointerup', { pointerId: 22 });
    hold.emit('lostpointercapture', { pointerId: 22 });
    assert.equal(game.holdPointerId, 11);
    assert.equal(game.round.held, true);
    hold.emit('pointercancel', { pointerId: 11 });
    assert.equal(game.holdPointerId, null);
    assert.equal(game.round.held, false);
  });
});

test('red-light mouse movement initializes its baseline and still detects cumulative movement', () => {
  withUi(({ game, window }) => {
    game.bind();
    game.round.setPhase('red', performance.now());
    window.emit('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 100 });
    window.emit('pointermove', { pointerType: 'mouse', clientX: 115, clientY: 100 });
    assert.equal(game.round.phase, 'red');
    window.emit('pointermove', { pointerType: 'mouse', clientX: 130, clientY: 100 });
    assert.equal(game.round.phase, 'dead');
  });
});

test('pause and resume discard stale pointer position and held touch identity', () => {
  withUi(({ game, window }) => {
    game.bind();
    game.round.setPhase('red', performance.now());
    game.pointerPosition = { x: 10, y: 10 };
    game.pointerHeld = true;
    game.holdPointerId = 11;
    game.pauseRound();
    assert.equal(game.pointerPosition, null);
    assert.equal(game.holdPointerId, null);
    assert.equal(game.pointerHeld, false);
    game.resumeRound();
    window.emit('pointermove', { pointerType: 'mouse', clientX: 700, clientY: 400 });
    window.emit('pointermove', { pointerType: 'mouse', clientX: 701, clientY: 400 });
    assert.equal(game.round.phase, 'red');
  });
});

test('late CAM04 responses fail even before the expiry interval runs', () => {
  for (const late of [false, true]) {
    withUi(({ game }) => {
      game.updateCameras = () => {};
      game.qte = { deadline: late ? performance.now() - 1 : performance.now() + 2500, timer: null };
      game.resolveQte(true);
      assert.equal(game.state.qteResolved, true);
      assert.equal(game.state.hardRound, late);
      assert.equal(game.qte, null);
    });
  }
});

test('canceling a new visit preserves the save, active round and open cinema', () => {
  withUi(({ game, window }) => {
    const storage = memory();
    game.save = new SaveManager(storage);
    game.save.die(); game.save.unlock('C'); game.save.book(); game.save.collect('letter-333');
    game.state = new GameState(game.save);
    game.state.stage = 5;
    const state = game.state;
    const round = game.round;
    const before = JSON.stringify(game.save.data);
    const persisted = storage.read();
    let canceledCinema = false;
    game.cancelCinema = () => { canceledCinema = true; };
    game.bind();
    game.$('#ending-cinema').open = true;
    game.newVisit();
    assert.equal(game.$('#reset-dialog').open, true);
    game.$('#reset-cancel').emit('click');
    assert.equal(game.$('#reset-dialog').open, false);
    assert.equal(game.$('#ending-cinema').open, true);
    assert.equal(JSON.stringify(game.save.data), before);
    assert.deepEqual(storage.read(), persisted);
    assert.equal(game.state, state);
    assert.equal(game.round, round);
    assert.equal(canceledCinema, false);
    assert.equal(window.reloads, 0);
  });
});

test('every reset entry asks for confirmation before changing the visit', () => {
  withUi(({ game, groups, window }) => {
    const resetButton = uiElement();
    groups.set('[data-reset-visit]', [resetButton]);
    game.bind();
    const before = JSON.stringify(game.save.data);
    for (const button of [game.$('#new-visit'), game.$('#cinema-replay'), resetButton]) {
      button.emit('click');
      assert.equal(game.$('#reset-dialog').open, true);
      assert.equal(JSON.stringify(game.save.data), before);
      game.$('#reset-cancel').emit('click');
    }
    assert.equal(window.reloads, 0);
  });
});

test('new visit resets the page in memory when writes fail and preserves Meta records', () => {
  withUi(({ game, groups, window }) => {
    game.save = new SaveManager({ getItem() { return null; }, setItem() { throw new Error('quota'); } });
    game.save.die(); game.save.die(); game.save.unlock('A'); game.save.book(); game.save.collect('letter-333');
    game.state = new GameState(game.save);
    game.state.stage = 5;
    game.body.dataset.ending = 'A';
    game.body.classList.add('ending-day', 'round-active');
    game.entrance = [['#hero-title', '把日子，<br>过得轻一点。']];
    game.$('#hero-title').innerHTML = '永久入住';
    const shift = uiElement();
    shift.dataset.calm = '表世界档案'; shift.textContent = '里世界档案'; shift.classList.add('is-shifted');
    game.shifts = [shift];
    const letter = uiElement();
    const card = uiElement();
    const hidden = uiElement();
    card.classList.add('revealed');
    card.querySelector = () => hidden;
    letter.closest = () => card;
    groups.set('[data-letter]', [letter]);
    game.bind();
    game.newVisit();
    game.$('#reset-confirm').emit('click');
    assert.equal(window.reloads, 0);
    assert.equal(game.state.stage, 0);
    assert.equal(game.round, null);
    assert.equal(game.save.data.deaths, 2);
    assert.deepEqual(game.save.data.endings, ['A']);
    assert.deepEqual(game.save.data.clues, []);
    assert.equal(game.save.data.booked, false);
    assert.equal(game.$('#hero-title').innerHTML, '把日子，<br>过得轻一点。');
    assert.equal(shift.textContent, '表世界档案');
    assert.equal(shift.classList.contains('is-shifted'), false);
    assert.equal(card.classList.contains('revealed'), false);
    assert.equal(hidden.getAttribute('aria-hidden'), 'true');
    assert.equal(game.$('#cases').hidden, true);
    assert.equal(game.$('#start-round').disabled, true);
    assert.match(game.lastNotice, /当前页面/);
  });
});

test('new visit reloads only after its reset has been persisted', () => {
  withUi(({ game, window }) => {
    const storage = memory();
    game.save = new SaveManager(storage);
    game.save.die(); game.save.unlock('B'); game.save.book(); game.save.collect('night-contract');
    game.bind();
    game.$('#reset-confirm').emit('click');
    assert.equal(window.reloads, 0);
    game.newVisit();
    assert.equal(window.reloads, 0);
    game.$('#reset-confirm').emit('click');
    assert.equal(window.reloads, 1);
    assert.deepEqual(storage.read(), { version: 2, deaths: 1, endings: ['B'], clues: [], booked: false, run: SaveManager.freshRun() });
  });
});
