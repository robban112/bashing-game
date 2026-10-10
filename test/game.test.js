import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, DAY_LENGTH } from '../lib/game.js';
const target = (type = 'villager', hp = 1, gold = 15, x = 60) => ({ type, hp, gold, x, hit: 0, resolved: false });
function setup() { const game = new Game(() => .1); game.startDay(); game.entities = []; return game; }

test('attacks have range, cooldown, combo rewards and cannot collect twice', () => {
  const game = setup(); const near = target(), far = target('barrel', 1, 12, 400);
  game.entities = [near, far];
  assert.equal(game.attack(), true); assert.equal(game.collected, 15); assert.equal(near.resolved, true);
  assert.equal(game.attack(), false); assert.equal(far.hp, 1);
  game.cooldown = 0; game.attack(); assert.equal(game.collected, 15); assert.equal(game.combo, 0);
  game.cooldown = 0; game.entities.push(target()); game.attack(); assert.equal(game.collected, 30);
  game.cooldown = 0; game.entities.push(target()); game.attack(); assert.equal(game.collected, 47);
});
test('charged strikes break tough targets; quick strikes need two hits', () => {
  const game = setup(); game.entities = [target('cart', 2, 30)];
  game.attack(); assert.equal(game.entities[0].hp, 1); assert.equal(game.collected, 0);
  game.cooldown = 0; game.attack(); assert.equal(game.collected, 30);
  const charged = setup(); charged.entities = [target('cart', 2, 30)];
  charged.beginCharge(); for (let i = 0; i < 6; i++) charged.update(.1);
  assert.equal(charged.release(), true); assert.equal(charged.collected, 30);
});
test('wizards hurt and give no gold; missed guards hurt once, armor reduces damage', () => {
  const game = setup(); game.armor = 1; game.entities = [target('wizard', 1, 0)];
  game.attack(); assert.equal(game.health, 80); assert.equal(game.collected, 0);
  game.entities = [target('guard', 2, 25, -31)]; game.update(.01); assert.equal(game.health, 73);
  game.update(.01); assert.equal(game.health, 73);
});
test('day deadline banks coins once and enforces quota and health', () => {
  const success = setup(); success.collected = success.goal; success.time = .05; success.update(.1);
  assert.equal(success.state, 'shop'); assert.equal(success.bank, 150); assert.equal(success.total, 150);
  success.finish(); assert.equal(success.bank, 150);
  const failure = setup(); failure.collected = 149; failure.finish(); assert.equal(failure.state, 'over');
  const fallen = setup(); fallen.collected = 300; fallen.health = 0; fallen.finish(); assert.equal(fallen.state, 'over');
});
test('shop checks affordability, upgrade limits and carries health into next day', () => {
  const game = setup(); assert.equal(game.buy('weapon'), false);
  game.collected = 400; game.health = 55; game.finish();
  assert.equal(game.buy('weapon'), true); assert.equal(game.weapon, 1); assert.equal(game.bank, 300);
  assert.equal(game.buy('weapon'), true); assert.equal(game.buy('weapon'), false);
  assert.equal(game.buy('armor'), false);
  assert.equal(game.buy('potion'), true); assert.equal(game.health, 95); assert.equal(game.bank, 25);
  assert.equal(game.buy('potion'), false);
  assert.equal(game.nextDay(), true); assert.equal(game.day, 2); assert.equal(game.goal, 215);
  assert.equal(game.health, 95); assert.equal(game.weapon, 2); assert.equal(game.time, DAY_LENGTH);
  assert.equal(game.collected, 0); assert.equal(game.bank, 25);
});
test('pause freezes timer and movement and cancels charging; restart resets campaign', () => {
  const game = setup(); game.beginCharge(); game.update(.1); game.togglePause();
  const time = game.time, x = game.x; game.update(.1);
  assert.equal(game.time, time); assert.equal(game.x, x); assert.equal(game.charging, false);
  assert.equal(game.attack(), false); game.togglePause(); game.update(.1); assert.ok(game.x > x);
  game.reset(); assert.equal(game.state, 'ready'); assert.equal(game.weapon, 0); assert.equal(game.bank, 0);
});
test('a full deterministic day is playable and can meet its quota', () => {
  const game = new Game(() => .4); game.startDay();
  for (let i = 0; i < 500 && game.state === 'running'; i++) {
    if (game.entities.some(e => !e.resolved && e.x - game.x >= 0 && e.x - game.x < 100)) game.attack();
    game.update(.1);
  }
  assert.equal(game.state, 'shop'); assert.ok(game.collected >= game.goal);
});
