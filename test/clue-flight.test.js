'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { MeiluGame, SaveManager, sampleClueFlight, CLUE_FLIGHT_DURATION } = require('../public/scenes/care-home/app.js');

const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < .001, `${actual} should equal ${expected}`);

test('flight stages preserve the lift, 75% checkpoint, 85% arrival and 850ms absorption', () => {
  const start = { x: 230, y: 340 };
  const end = { x: 920, y: 690 };
  assert.equal(CLUE_FLIGHT_DURATION, 850);
  assert.deepEqual(sampleClueFlight(start, end, 0), { ...start, scale: .85, rotation: -6, opacity: 0 });
  const lift = sampleClueFlight(start, end, .22);
  near(lift.x, start.x); near(lift.y, start.y - 24);
  near(lift.scale, 1.08); near(lift.rotation, 3); near(lift.opacity, 1);
  const checkpoint = sampleClueFlight(start, end, .75);
  assert.ok(checkpoint.x > start.x && checkpoint.x < end.x);
  assert.ok(checkpoint.scale > .32 && checkpoint.scale < 1.08);
  const arrival = sampleClueFlight(start, end, .85);
  near(arrival.x, end.x); near(arrival.y, end.y);
  near(arrival.scale, .32); near(arrival.rotation, 24); near(arrival.opacity, 1);
  const absorbed = sampleClueFlight(start, end, 1);
  near(absorbed.x, end.x); near(absorbed.y, end.y);
  near(absorbed.scale, .05); near(absorbed.rotation, 42); near(absorbed.opacity, 0);
});

test('flight rises along an arc and accelerates toward the desk from either side', () => {
  for (const [start, end] of [
    [{ x: 10, y: 500 }, { x: 900, y: 650 }],
    [{ x: 350, y: 650 }, { x: 250, y: 600 }],
    [{ x: 250, y: 600 }, { x: 250, y: 600 }]
  ]) {
    const early = sampleClueFlight(start, end, .22 + .63 * .25);
    assert.ok(early.y < start.y - 24, 'paper initially travels upward');
    if (start.x !== end.x) {
      const middle = sampleClueFlight(start, end, .22 + .63 * .5);
      assert.ok(Math.abs(middle.x - start.x) < Math.abs(end.x - start.x) * .5, 'front-loaded flight must remain slow');
    }
    for (let step = 0; step <= 100; step += 1) {
      assert.ok(Object.values(sampleClueFlight(start, end, step / 100)).every(Number.isFinite));
    }
  }
});

function element() {
  return {
    textContent: '', children: [], style: {}, animations: [],
    append(...nodes) { this.children.push(...nodes); },
    setAttribute() {}, remove() { this.removed = true; },
    animate(frames, options) {
      const animation = { frames, options, cancel() { this.cancelled = true; } };
      this.animations.push(animation);
      return animation;
    }
  };
}

function withFlight(run) {
  const previous = Object.fromEntries(['window', 'document', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'].map((key) => [key, global[key]]));
  const frames = new Map();
  global.performance = { now: () => 1000 };
  let nextFrame = 0;
  global.requestAnimationFrame = (callback) => { frames.set(++nextFrame, callback); return nextFrame; };
  global.cancelAnimationFrame = (id) => frames.delete(id);
  global.window = { innerWidth: 1280, innerHeight: 800 };
  global.document = { hidden: false, createElement: element, querySelectorAll: () => [] };
  let deskRect = { left: 1100, top: 700, width: 150, height: 54 };
  const nodes = new Map();
  const sounds = [];
  const game = Object.assign(Object.create(MeiluGame.prototype), {
    save: new SaveManager(), clueFlights: new Map(), body: element(), reduced: { matches: false },
    sound: { paperLift: () => sounds.push('paper'), letterDrop: () => sounds.push('drop') },
    $(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); },
    text(selector, text) { this.$(selector).textContent = text; },
    renderDesk() { this.renderMeta(); }, notice() {}, checkEvidence() {}
  });
  game.$('#desk-toggle').getBoundingClientRect = () => deskRect;
  const step = (elapsed) => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(performance.now() + elapsed));
  };
  try { run({ game, nodes, frames, sounds, step, moveDesk: (rect) => { deskRect = rect; } }); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete global[key]; else global[key] = value;
    }
  }
}

test('new evidence persists immediately but only files and bounces on arrival; duplicates do nothing', () => {
  withFlight(({ game, frames, sounds, step }) => {
    assert.equal(game.collect('extra-chair', false, { clientX: 500, clientY: 400 }), true);
    assert.deepEqual(game.save.data.clues, ['extra-chair']);
    assert.equal(game.$('#desk-dot').textContent, '0/18');
    assert.equal(game.body.children.length, 1);
    const card = game.body.children[0];
    assert.equal(card.children[0].src, './assets/new/clue-letter.svg');
    assert.equal(card.children[1].children[0].textContent, '档案摘录 · #01');
    assert.equal(card.children[1].children[1].textContent, '《第十三把椅子》');
    assert.deepEqual(sounds, ['paper']);
    assert.equal(game.collect('extra-chair'), false);
    assert.equal(game.collect('not-a-clue'), false);
    assert.equal(frames.size, 1);
    step(840);
    assert.equal(game.$('#desk-dot').textContent, '0/18');
    step(851);
    assert.equal(card.removed, true);
    assert.equal(frames.size, 0);
    assert.equal(game.$('#desk-dot').textContent, '1/18');
    assert.deepEqual(sounds, ['paper', 'drop']);
    const bounce = game.$('#desk-toggle').animations[0];
    assert.equal(bounce.options.duration, 300);
    assert.deepEqual(bounce.frames.map((frame) => frame.transform), ['scale(1)', 'scale(1.28)', 'scale(.94)', 'scale(1)']);
    game.finishClueFlight('extra-chair');
    assert.deepEqual(sounds, ['paper', 'drop'], 'arrival is idempotent');
  });
});

test('flight remeasures the target after resize and absorbs at its exact center', () => {
  withFlight(({ game, moveDesk, step }) => {
    game.collect('extra-chair', false, { getBoundingClientRect: () => ({ left: 10, top: 200, width: 180, height: 50, bottom: 250 }) });
    const card = game.body.children[0];
    assert.match(card.style.transform, /^translate3d\(10px, 170px, 0\)/);
    global.window.innerWidth = 390;
    global.window.innerHeight = 844;
    moveDesk({ left: 210, top: 760, width: 150, height: 54 });
    step(780);
    assert.match(card.style.transform, /^translate3d\(195px, 732px, 0\)/);
    step(851);
    assert.equal(card.removed, true);
    assert.equal(game.$('#desk-dot').textContent, '1/18');
  });
});

test('concurrent clues cannot jump the counter and cleanup cancels all pending callbacks', () => {
  withFlight(({ game, frames, sounds }) => {
    game.collect('extra-chair', false);
    game.collect('letter-041', false);
    assert.equal(game.$('#desk-dot').textContent, '0/18');
    assert.equal(game.clueFlights.size, 2);
    game.finishClueFlight('letter-041');
    assert.equal(game.$('#desk-dot').textContent, '1/18');
    game.renderMeta();
    assert.equal(game.$('#desk-dot').textContent, '1/18', 'unrelated render must not reveal evidence in flight');
    game.clearClueFlights();
    game.renderMeta();
    assert.equal(game.$('#desk-dot').textContent, '2/18');
    assert.equal(frames.size, 0);
    assert.ok(game.body.children.every((card) => card.removed));
    assert.deepEqual(sounds, ['paper', 'paper', 'drop']);
    assert.equal(game.$('#desk-toggle').animations[0].cancelled, true);
  });
});

test('reduced motion and hidden documents file evidence immediately with no moving card', () => {
  for (const mode of ['reduced', 'hidden']) withFlight(({ game, frames }) => {
    if (mode === 'reduced') game.reduced.matches = true;
    else global.document.hidden = true;
    game.collect('extra-chair', false);
    assert.equal(game.$('#desk-dot').textContent, '1/18');
    assert.equal(game.body.children.length, 0);
    assert.equal(frames.size, 0);
  });
});
