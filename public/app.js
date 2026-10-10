import { Game, WEAPONS } from './game.js';
const game = new Game();
const $ = id => document.getElementById(id);
const canvas = $('scene'); const ctx = canvas.getContext('2d');
function resizeScene() {
  // Keep the knight visible on narrow screens without cropping or stretching.
  const width = Math.round(canvas.clientWidth / canvas.clientHeight * 480);
  if (canvas.width !== width) canvas.width = width;
}
new ResizeObserver(resizeScene).observe(canvas);
let last = performance.now(), shownState = '', toastUntil = 0, best = 0, sound = false, audio;
try { best = Number(localStorage.getItem('knight-best')) || 0; } catch {}
$('best').textContent = best;
function beep(type) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type === 'gold' ? 'sine' : 'triangle';
    const frequency = { swing: 130, hit: 80, gold: 720, hurt: 65, win: 550, lose: 100 }[type];
    if (!frequency) return;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, audio.currentTime + .12);
    gain.gain.setValueAtTime(.065, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .15);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .16);
  } catch { /* Audio is optional. */ }
}
function toast(text) { $('toast').textContent = text; toastUntil = performance.now() + 1800; }
function refreshShop() {
  const next = WEAPONS[game.weapon + 1];
  $('shop').replaceChildren();
  const items = [
    { id: 'weapon', name: next?.name ?? 'Bästa vapnet', cost: next?.cost, enabled: !!next },
    { id: 'armor', name: `Rustning ${game.armor + 1}`, cost: 75, enabled: game.armor < 3 },
    { id: 'potion', name: 'Läkedryck +40', cost: 35, enabled: game.health < 100 },
  ];
  for (const item of items) {
    const button = document.createElement('button');
    button.textContent = item.name;
    const price = document.createElement('small'); price.textContent = item.enabled ? `${item.cost} mynt` : item.id === 'potion' ? 'Full hälsa' : 'Fullt uppgraderad'; button.append(price);
    button.disabled = !item.enabled || game.bank < item.cost;
    button.addEventListener('click', () => { if (game.buy(item.id)) { beep('gold'); refreshShop(); updateHud(); } });
    $('shop').append(button);
  }
}
function updatePanel() {
  const state = game.paused ? 'paused' : game.state;
  if (state === shownState) return;
  shownState = state;
  $('overlay').hidden = state === 'running'; $('shop').hidden = state !== 'shop';
  $('pause').disabled = game.state !== 'running'; $('strike').disabled = state !== 'running';
  $('pause').textContent = game.paused ? 'Fortsätt' : 'Pausa';
  if (state === 'ready') return;
  if (state === 'shop') {
    $('panel-kicker').textContent = 'KUNGEN ÄR NÖJD. FÖR STUNDEN.';
    $('panel-title').textContent = 'Skatten är indriven.';
    $('panel-text').textContent = `Du samlade ${game.collected} mynt. Köp utrustning inför dag ${game.day + 1}; nästa skattemål är ${150 + game.day * 65} mynt. Hälsan följer med till nästa dag.`;
    $('start').textContent = 'Nästa dag →'; $('panel-note').textContent = 'Bättre vapen ger mer skada. Rustning minskar skadan du tar.';
    refreshShop();
  } else if (state === 'over') {
    $('panel-kicker').textContent = game.health <= 0 ? 'RIDDARNS ARBETSDAG ÄR ÖVER' : 'KUNGEN SAKNAR SINA MYNT';
    $('panel-title').textContent = game.health <= 0 ? 'Rustningen höll inte.' : 'För lite i skattkistan.';
    $('panel-text').textContent = `Dag ${game.day}: ${game.collected} av ${game.goal} mynt. Totalt samlade du ${game.total} mynt. Träffa när målen är nära och använd kraftslag mot vagnar och vakter.`;
    $('start').textContent = 'Försök igen →'; $('panel-note').textContent = 'En ny omgång börjar på dag 1.';
  } else if (state === 'paused') {
    $('panel-kicker').textContent = 'EN LITEN RAST'; $('panel-title').textContent = 'Riddaren vilar.';
    $('panel-text').textContent = 'Skatten, tiden och byborna väntar tills du fortsätter.';
    $('start').textContent = 'Fortsätt →'; $('panel-note').textContent = 'Tryck P eller knappen för att fortsätta.';
  }
}
function updateHud() {
  $('day').textContent = String(game.day).padStart(2, '0');
  $('quota').textContent = `${game.collected} / ${game.goal}`;
  $('tax-bar').style.width = `${Math.min(100, game.collected / game.goal * 100)}%`;
  $('health').textContent = game.health; $('health-bar').style.width = `${game.health}%`;
  $('time').textContent = `${Math.ceil(game.time)}s`; $('bank').textContent = game.bank;
  $('charge-bar').style.width = `${Math.min(100, game.charge / .55 * 100)}%`;
  $('location').textContent = ['KORPBYN', 'EKDALEN', 'KUNGSVÄGEN'][(game.day - 1) % 3];
  updatePanel();
}
$('start').addEventListener('click', () => {
  if (game.paused) game.togglePause();
  else if (game.state === 'shop') game.nextDay();
  else { if (game.state === 'over') game.reset(); game.startDay(); }
  last = performance.now(); updateHud(); canvas.focus({ preventScroll: true });
});
$('pause').addEventListener('click', () => { game.togglePause(); updateHud(); });
$('sound').addEventListener('click', () => {
  sound = !sound; $('sound').textContent = sound ? 'Ljud på' : 'Ljud av'; $('sound').setAttribute('aria-pressed', String(sound)); if (sound) beep('gold');
});
for (const surface of [canvas, $('strike')]) {
  surface.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); surface.setPointerCapture(event.pointerId); game.beginCharge();
  });
  surface.addEventListener('pointerup', event => { event.preventDefault(); game.release(); });
  surface.addEventListener('pointercancel', () => { game.charging = false; game.charge = 0; });
}
$('strike').addEventListener('click', event => { if (event.detail === 0) game.attack(); });
window.addEventListener('keydown', event => {
  if (event.code === 'KeyP' && !event.repeat) { game.togglePause(); updateHud(); return; }
  if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) return;
  if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) game.beginCharge(); }
});
window.addEventListener('keyup', event => { if (event.code === 'Space') { event.preventDefault(); game.release(); } });
window.addEventListener('blur', () => { if (game.state === 'running' && !game.paused) { game.togglePause(); updateHud(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'running' && !game.paused) { game.togglePause(); updateHud(); } });

// Original vector scenery and characters, drawn directly on the canvas.
function rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, h); }
function ellipse(x, y, rx, ry, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
function poly(points, color) { ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); }
function line(x1, y1, x2, y2, color, width = 3) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function house(x, y, scale, variant) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  rect(0, 0, 150, 155, variant ? '#c6b68a' : '#d6c49a');
  poly([[-14, 5], [75, -87], [165, 5]], variant ? '#5c5b4b' : '#805f4a');
  poly([[75, -87], [165, 5], [155, 13], [73, -65]], '#433f35');
  for (let i = 0; i < 4; i++) line(-4 + i * 18, -i * 17, 151 - i * 18, -i * 17, '#3b3a3235', 3);
  rect(112, -70, 18, 42, '#656656'); rect(108, -75, 25, 8, '#92917a');
  rect(0, 0, 9, 155, '#615b48'); rect(141, 0, 9, 155, '#615b48'); rect(0, 68, 150, 8, '#615b48');
  line(7, 7, 70, 68, '#74664d', 6); line(143, 7, 80, 68, '#74664d', 6);
  rect(55, 85, 38, 70, '#4a493c'); ellipse(74, 86, 19, 15, '#4a493c'); rect(58, 87, 31, 68, '#68614b');
  line(73, 89, 73, 153, '#3d4034', 2); ellipse(83, 120, 2, 2, '#d4bd7e');
  for (const wx of [21, 106]) { rect(wx, 24, 24, 29, '#394d49'); rect(wx - 3, 51, 30, 4, '#7e7558'); line(wx + 12, 25, wx + 12, 52, '#aba580', 3); }
  rect(15, 112, 23, 28, '#435751'); line(26, 112, 26, 140, '#a6a17f', 3);
  ctx.restore();
}
function tree(x, y, scale) {
  rect(x - 5 * scale, y - 95 * scale, 11 * scale, 105 * scale, '#5c654e');
  ellipse(x - 22 * scale, y - 109 * scale, 37 * scale, 42 * scale, '#4e7662');
  ellipse(x + 21 * scale, y - 120 * scale, 39 * scale, 45 * scale, '#66866c');
  ellipse(x, y - 148 * scale, 39 * scale, 38 * scale, '#729374');
}
function scenery(now) {
  const sky = ctx.createLinearGradient(0, 0, 0, 390); sky.addColorStop(0, '#83a9a0'); sky.addColorStop(1, '#d6d6a8'); ctx.fillStyle = sky; ctx.fillRect(0, 0, 960, 480);
  ellipse(758, 73, 36, 36, '#eee4b594');
  for (let i = 0; i < 6; i++) {
    const x = ((i * 211 - game.x * .08) % 1250 + 1250) % 1250 - 120;
    ellipse(x, 75 + i % 3 * 25, 60, 12, '#d5dfc44a'); ellipse(x + 25, 64 + i % 3 * 25, 36, 20, '#d5dfc44a');
  }
  poly([[0, 220], [100, 146], [220, 216], [370, 135], [550, 211], [760, 155], [960, 216], [960, 350], [0, 350]], '#7c9980');
  poly([[0, 272], [175, 209], [295, 250], [505, 196], [675, 267], [900, 218], [960, 230], [960, 350], [0, 350]], '#648570');
  const tower = 740 - game.x * .12 % 1100;
  rect(tower, 148, 68, 130, '#88907a'); rect(tower + 12, 111, 44, 47, '#939982');
  for (let i = 0; i < 4; i++) rect(tower + 10 + i * 12, 100, 8, 15, '#939982');
  rect(tower + 26, 173, 14, 25, '#526759');
  line(tower + 39, 112, tower + 39, 73, '#5a6957', 2); poly([[tower + 40, 75], [tower + 74, 83], [tower + 40, 95]], '#8e6150');
  rect(0, 292, 960, 105, '#78916d');
  for (let i = -1; i < 5; i++) {
    const x = i * 310 - (game.x * .55 % 310);
    tree(x + 218, 317, .9); house(x + 15, 222, .86, i % 2);
  }
  for (let i = -1; i < 7; i++) {
    const x = i * 180 - (game.x * .8 % 180);
    rect(x, 326, 5, 46, '#747451'); rect(x + 90, 326, 5, 46, '#747451'); rect(x, 337, 180, 5, '#858665'); rect(x, 355, 180, 5, '#858665');
  }
  poly([[0, 367], [960, 350], [960, 480], [0, 480]], '#b2a37a');
  rect(0, 371, 960, 3, '#d2be8b');
  for (let i = 0; i < 70; i++) {
    const x = ((i * 83 - game.x) % 1060 + 1060) % 1060 - 50;
    const y = 385 + (i * 29 % 87);
    ellipse(x, y, 4 + i % 5, 1.5, i % 2 ? '#8c896750' : '#d9c69980');
  }
  for (let i = 0; i < 12; i++) { const x = ((i * 97 - game.x) % 1120 + 1120) % 1120 - 90; line(x, 371, x + 4, 364, '#586a49', 2); line(x + 5, 371, x + 10, 362, '#586a49', 2); }
}
function person(entity, now) {
  const x = 200 + entity.x - game.x;
  if (x < -100 || x > 1050) return;
  const fallen = entity.resolved;
  if (fallen && !entity.hit) return;
  ctx.save(); ctx.translate(x, 386);
  if (entity.hit) ctx.translate(Math.sin(now / 20) * 4, 0);
  if (fallen) { ctx.rotate(.9); ctx.globalAlpha = .5; }
  ellipse(0, 0, 22, 5, '#2c392d30');
  if (entity.type === 'barrel') {
    ellipse(0, -22, 24, 29, '#906344'); rect(-22, -45, 44, 44, '#986d46'); ellipse(0, -45, 22, 6, '#ba8c59');
    for (const i of [-12, -2, 9]) line(i, -43, i - 1, -2, '#694d34', 2);
    rect(-23, -35, 46, 5, '#555c50'); rect(-23, -12, 46, 5, '#555c50');
  } else if (entity.type === 'cart') {
    rect(-39, -41, 78, 30, '#936749'); rect(-43, -45, 86, 7, '#bf9461');
    for (let i = 0; i < 4; i++) line(-35, -37 + i * 7, 34, -37 + i * 7, '#604e39', 2);
    ellipse(-24, -8, 14, 14, '#4a4b3d'); ellipse(25, -8, 14, 14, '#4a4b3d');
    ellipse(-24, -8, 8, 8, '#b79a68'); ellipse(25, -8, 8, 8, '#b79a68');
    line(-24, -19, -24, 3, '#53513d', 2); line(25, -19, 25, 3, '#53513d', 2);
    ellipse(-13, -51, 19, 15, '#c0b17b'); ellipse(18, -51, 18, 15, '#b5a46c');
  } else if (entity.type === 'wizard') {
    poly([[-20, -4], [-14, -68], [12, -68], [23, -4]], '#655386');
    poly([[-24, -70], [4, -113], [19, -72]], '#6d598e'); rect(-25, -74, 48, 7, '#4b426d');
    ellipse(0, -64, 12, 13, '#d4b791'); poly([[-10, -59], [12, -60], [1, -31]], '#e4dfc5');
    line(26, -3, 30, -93, '#726243', 5); ellipse(30, -95, 7, 9, '#a4c3ce');
    ellipse(29, -95, 15 + Math.sin(now / 200) * 3, 15, '#c0b0e133');
    ctx.fillStyle = '#e7d7fa'; ctx.font = 'bold 16px Georgia'; ctx.fillText('!', -4, -125);
  } else {
    const guard = entity.type === 'guard';
    const bob = Math.sin(now / 190 + entity.x) * 2;
    ctx.translate(0, bob);
    rect(-14, -23, 10, 22, '#4c493b'); rect(6, -23, 10, 22, '#4c493b');
    ellipse(-10, -2, 9, 4, '#373d33'); ellipse(13, -2, 9, 4, '#373d33');
    poly([[-19, -26], [-15, -61], [14, -61], [20, -26]], guard ? '#778783' : '#aa7956');
    rect(-17, -33, 34, 5, '#5a4b36');
    line(-15, -55, -23, -30, guard ? '#889c94' : '#ba8a65', 9); line(14, -55, 23, -31, guard ? '#889c94' : '#ba8a65', 9);
    ellipse(0, -72, 13, 15, '#dab38a');
    if (guard) {
      ellipse(0, -80, 16, 13, '#9aada6'); rect(-16, -80, 32, 10, '#9aada6'); rect(-11, -75, 22, 4, '#394848');
      poly([[-29, -45], [-14, -48], [-16, -20], [-26, -12], [-33, -26]], '#596f6b');
      line(26, -21, 26, -83, '#9bada5', 4); rect(20, -34, 13, 4, '#c7b681');
    } else { ellipse(0, -82, 15, 8, '#615440'); rect(-15, -82, 30, 5, '#615440'); ellipse(19, -26, 11, 14, '#b5a16b'); }
    rect(-5, -73, 3, 3, '#343b32'); rect(5, -73, 3, 3, '#343b32');
  }
  if (!fallen && entity.hp > 1) { ctx.fillStyle = '#f4e4b3'; ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.fillText('◆'.repeat(entity.hp), 0, -130); }
  ctx.restore();
}
function knight(now) {
  ctx.save(); ctx.translate(200, 390);
  const walking = game.state === 'running' && !game.paused;
  const step = walking ? Math.sin(game.x / 16) : 0;
  ellipse(0, 0, 33, 7, '#27352e40');
  poly([[-17, -91], [-40 - step * 2, -40], [-10, -32], [1, -89]], '#7e3d35');
  line(-12, -33, -15 + step * 9, -6, '#283537', 13); line(10, -33, 13 - step * 9, -6, '#344346', 13);
  rect(-26 + step * 9, -8, 23, 9, '#1c282e'); rect(2 - step * 9, -8, 25, 9, '#202d32');
  poly([[-24, -84], [-16, -38], [20, -38], [25, -84], [8, -97]], '#29393d');
  poly([[-15, -81], [-9, -46], [4, -46], [9, -83]], '#435659');
  rect(-22, -46, 44, 7, '#252e30'); rect(-3, -47, 10, 9, '#b8a275');
  ellipse(-23, -82, 15, 13, '#3c4d50'); ellipse(22, -82, 14, 13, '#46585a');
  ellipse(0, -109, 24, 25, '#35474c'); poly([[-23, -110], [24, -110], [20, -86], [-19, -86]], '#26363b');
  poly([[-20, -118], [1, -135], [1, -87], [-16, -90]], '#4d6062');
  rect(-18, -109, 36, 5, '#111d21'); rect(-13, -108, 8, 2, '#d6ae60'); rect(7, -108, 8, 2, '#d6ae60');
  for (let i = 0; i < 3; i++) rect(7 + i * 4, -98, 2, 8, '#142226');
  poly([[-2, -135], [4, -150], [25, -152], [38, -144], [7, -142], [4, -132]], '#9c493a');
  line(-26, -72, -25, -47, '#405052', 13);
  poly([[-40, -67], [-16, -70], [-17, -36], [-28, -25], [-42, -39]], '#283b3f');
  line(-30, -62, -29, -37, '#a39260', 3); line(-39, -51, -20, -51, '#a39260', 3);
  const swing = game.swing > 0;
  const charge = game.charging ? Math.min(1, game.charge / .55) : 0;
  const angle = swing ? .9 - game.swing * 7 : -1.1 - charge * 1.2;
  ctx.save(); ctx.translate(23, -75); ctx.rotate(angle);
  line(0, 0, 22, 20, '#455759', 13); ellipse(24, 21, 8, 8, '#273638');
  line(24, 21, 79, 21, '#8d7450', 8);
  if (game.weapon === 0) { rect(59, 9, 32, 25, '#76503c'); rect(64, 10, 7, 23, '#9e7450'); }
  else if (game.weapon === 1) { rect(61, 4, 30, 34, '#8a9992'); rect(65, 8, 8, 25, '#c2c4ad'); }
  else { ellipse(80, 21, 19, 19, '#778b87'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; line(80 + Math.cos(a) * 16, 21 + Math.sin(a) * 16, 80 + Math.cos(a) * 26, 21 + Math.sin(a) * 26, '#bac3ae', 5); } }
  ctx.restore();
  if (swing) {
    ctx.strokeStyle = '#ffe6a5aa'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(25, -78, 105, -.95, .7); ctx.stroke();
  }
  if (charge >= 1) { ellipse(0, -78, 48, 70, '#f4cc6620'); }
  ctx.restore();
}
function draw(now) {
  scenery(now);
  const entities = game.state === 'ready' ? [
    { type: 'barrel', x: 220, hp: 1 }, { type: 'villager', x: 365, hp: 1 }, { type: 'cart', x: 570, hp: 2 }, { type: 'wizard', x: 700, hp: 1 },
  ] : game.entities;
  for (const entity of entities) person(entity, now);
  knight(now);
  for (const effect of game.effects) {
    const x = 200 + effect.x - game.x, y = 290 - (1.2 - effect.life) * 55;
    ctx.save(); ctx.globalAlpha = Math.min(1, effect.life * 2); ctx.fillStyle = effect.kind === 'magic' ? '#e5c5ff' : '#ffe198';
    ctx.font = 'bold 26px Georgia'; ctx.strokeStyle = '#3d432d'; ctx.lineWidth = 3; ctx.strokeText(effect.text, x, y); ctx.fillText(effect.text, x, y);
    if (effect.kind === 'gold') for (let i = 0; i < 5; i++) { const a = i * 1.25; ellipse(x + Math.cos(a) * (1.2 - effect.life) * 70, y + Math.sin(a) * 20 + 15, 4, 6, '#f1ca6a'); }
    ctx.restore();
  }
  if (game.combo > 1) { ctx.fillStyle = '#fff0b5'; ctx.font = 'bold 19px Georgia'; ctx.textAlign = 'center'; ctx.fillText(`${game.combo} I RAD!`, 200, 218); ctx.textAlign = 'start'; }
  const shade = ctx.createLinearGradient(0, 430, 0, 480); shade.addColorStop(0, '#152b2900'); shade.addColorStop(1, '#152b2944'); ctx.fillStyle = shade; ctx.fillRect(0, 430, 960, 50);
}
function frame(now) {
  game.update((now - last) / 1000); last = now;
  for (const event of game.events.splice(0)) {
    beep(event.type);
    if (event.type === 'hurt') toast(event.message);
    if (['win', 'lose'].includes(event.type)) {
      best = Math.max(best, game.total); $('best').textContent = best;
      try { localStorage.setItem('knight-best', String(best)); } catch {}
    }
  }
  $('toast').classList.toggle('visible', now < toastUntil);
  updateHud(); draw(now); requestAnimationFrame(frame);
}
updateHud(); requestAnimationFrame(frame);
