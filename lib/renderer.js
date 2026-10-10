// GameArt2D's CC0 packs provide the character animations and foliage.
// Palette adaptations are cached once; original asset files stay unchanged.
function recolor(image, role) {
  const layer = document.createElement('canvas');
  layer.width = image.width; layer.height = image.height;
  const context = layer.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, layer.width, layer.height);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const r = pixels.data[i], g = pixels.data[i + 1], b = pixels.data[i + 2], a = pixels.data[i + 3];
    if (!a) continue;
    if (role === 'knight' && Math.max(r, g, b) - Math.min(r, g, b) < 42 && r > 65) {
      const shade = (r + g + b) / 3 * .34;
      pixels.data[i] = shade; pixels.data[i + 1] = shade + 6; pixels.data[i + 2] = shade + 13;
    } else if (role === 'wizard' && r > 125 && g < 100 && b < 100) {
      pixels.data[i] = r * .55; pixels.data[i + 1] = r * .24; pixels.data[i + 2] = r * .88;
    } else if (role === 'worker' && r > 130 && g < 130 && b < 90) {
      pixels.data[i] = r * .55; pixels.data[i + 1] = r * .38; pixels.data[i + 2] = r * .2;
    }
  }
  context.putImageData(pixels, 0, 0); return layer;
}

export function createRenderer(canvas, game, sprites) {
  const ctx = canvas.getContext('2d');
  const parts = Object.fromEntries(['body', 'head', 'hair', 'upper-arm', 'forearm', 'hand', 'thigh', 'shin', 'boot', 'shield'].map(name => [name, recolor(sprites[name][0], 'knight')]));
  const wizard = recolor(sprites.wizard[0], 'wizard');
  const worker = recolor(sprites.worker[0], 'worker');
  let width = 960, height = 540, ground = 440, player = 190;
  let animationTime = 0, lastTime = 0;
  const ink = '#352a28';
  function rect(x, y, w, h, color, outline = false) {
    ctx.fillStyle = color; ctx.fillRect(x, y, w, h);
    if (outline) { ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.strokeRect(x, y, w, h); }
  }
  function ellipse(x, y, rx, ry, color, outline = false) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    if (outline) { ctx.strokeStyle = ink; ctx.lineWidth = 2.5; ctx.stroke(); }
  }
  function poly(points, color, outline = true) {
    ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill();
    if (outline) { ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  function line(x1, y1, x2, y2, color = ink, lineWidth = 3) {
    ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function sprite(image, x, y, h, flip = false) {
    const w = h * image.width / image.height;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(image, -w * .46, -h * .96, w, h); ctx.restore();
  }
  function text(label, x, y, size = 22, color = '#fff5ce') {
    ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`; ctx.textAlign = 'center';
    ctx.strokeStyle = ink; ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeText(label, x, y); ctx.fillStyle = color; ctx.fillText(label, x, y);
  }
  function house(x, y, variant) {
    ctx.save(); ctx.translate(x, y);
    rect(0, -188, 196, 188, variant ? '#efd5a2' : '#f4e0b6', true);
    poly([[-18, -186], [91, -288], [218, -186], [203, -173], [-15, -173]], variant ? '#a55340' : '#b67342');
    poly([[91, -288], [218, -186], [205, -173], [95, -264]], '#803f34');
    for (let i = 0; i < 4; i++) line(3 + i * 19, -188 - i * 17, 193 - i * 17, -188 - i * 17, '#542f2940', 2);
    rect(0, -185, 12, 185, '#71503c', true); rect(182, -185, 14, 185, '#71503c', true);
    rect(0, -91, 196, 12, '#71503c', true); line(9, -175, 86, -97, '#71503c', 9); line(185, -175, 107, -97, '#71503c', 9);
    for (const wx of [24, 132]) {
      rect(wx, -153, 36, 42, '#507a82', true); line(wx + 18, -151, wx + 18, -113, '#d5be83', 4); line(wx + 2, -132, wx + 34, -132, '#d5be83', 4);
      rect(wx - 3, -111, 42, 6, '#a47b49', true);
    }
    ellipse(100, -59, 25, 25, '#785640', true); rect(75, -60, 50, 60, '#785640', true);
    for (let i = 1; i < 4; i++) line(75 + i * 12, -73, 75 + i * 12, -2, '#513c30', 2);
    ellipse(112, -31, 3, 3, '#edbf5a', true);
    rect(36, -253, 23, 43, '#ad8e74', true); rect(31, -256, 33, 10, '#ccb096', true);
    ctx.restore();
  }
  function scenery() {
    const sky = ctx.createLinearGradient(0, 0, 0, ground); sky.addColorStop(0, '#86b9cc'); sky.addColorStop(1, '#e6e4ad');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, width, height);
    ellipse(width * .78, Math.max(95, ground * .24), 43, 43, '#ffe6a9');
    for (let i = 0; i < Math.ceil(width / 250) + 1; i++) {
      const x = ((i * 270 - game.x * .09) % (width + 280) + width + 280) % (width + 280) - 120;
      const y = 100 + i % 3 * 62;
      ellipse(x, y, 69, 17, '#f8f4da9c'); ellipse(x + 28, y - 11, 39, 25, '#f8f4da9c');
    }
    for (let i = -1; i < Math.ceil(width / 360) + 1; i++) {
      const x = i * 360 - game.x * .12 % 360;
      ellipse(x + 150, ground - 110, 270, 215, '#96ad79');
      ellipse(x + 40, ground - 42, 260, 160, '#77956b');
    }
    const castle = width * .71 - game.x * .16 % 800;
    rect(castle - 90, ground - 252, 190, 100, '#b4b497');
    for (const offset of [-100, 60]) {
      rect(castle + offset, ground - 342, 54, 186, '#abb49a');
      for (let i = 0; i < 4; i++) rect(castle + offset + i * 16, ground - 353, 10, 21, '#abb49a');
      rect(castle + offset + 20, ground - 306, 13, 25, '#617772');
    }
    line(castle + 92, ground - 353, castle + 92, ground - 392, '#5b6a5a', 2);
    poly([[castle + 94, ground - 391], [castle + 133, ground - 381], [castle + 94, ground - 369]], '#bd6548', false);
    rect(0, ground - 62, width, 76, '#87966a');
    for (let i = -1; i < Math.ceil(width / 330) + 1; i++) {
      const x = i * 330 - game.x * .55 % 330;
      ctx.drawImage(sprites.tree[0], x + 169, ground - 300, 180, 265);
      house(x - 50, ground - 45, i % 2);
      ctx.drawImage(sprites.bush[0], x + 150, ground - 55, 85, 43);
    }
    for (let i = -1; i < Math.ceil(width / 145) + 1; i++) {
      const x = i * 145 - game.x * .78 % 145;
      rect(x, ground - 71, 8, 67, '#ac9b65', true); rect(x, ground - 56, 145, 9, '#c0b17e', true); rect(x, ground - 27, 145, 8, '#c0b17e', true);
    }
    rect(0, ground - 2, width, height - ground + 2, '#cbb382');
    line(0, ground - 2, width, ground - 2, '#6b6543', 3);
    rect(0, ground, width, 6, '#e1cb96');
    for (let i = 0; i < Math.ceil(width / 20); i++) {
      const x = ((i * 79 - game.x) % (width + 100) + width + 100) % (width + 100) - 50;
      const y = ground + 12 + i * 23 % Math.max(20, height - ground - 14);
      ellipse(x, y, 4 + i % 5, 2, i % 2 ? '#9c895d60' : '#edd8a290');
    }
  }
  function target(entity) {
    const x = player + entity.x - game.x;
    if (x < -130 || x > width + 180) return;
    if (entity.resolved && !entity.hit) return;
    ctx.save(); ctx.translate(x, ground);
    if (entity.hit) ctx.translate(Math.sin(animationTime / 18) * 5, 0);
    if (entity.resolved) { ctx.rotate(.8); ctx.globalAlpha = Math.min(1, entity.hit / .3); }
    ellipse(0, 3, entity.type === 'cart' ? 55 : 30, 7, '#352a2833');
    if (entity.type === 'barrel') {
      ellipse(0, -36, 32, 38, '#b07646', true); rect(-29, -68, 58, 62, '#b07646');
      for (const offset of [-19, -7, 7, 19]) line(offset, -64, offset, -6, '#795238', 2);
      ellipse(0, -68, 29, 8, '#d6a15b', true);
      rect(-32, -55, 64, 8, '#657474', true); rect(-32, -19, 64, 8, '#657474', true);
      ellipse(-19, -51, 2, 2, '#d2d4b3'); ellipse(19, -15, 2, 2, '#d2d4b3');
    } else if (entity.type === 'cart') {
      ctx.drawImage(sprites.crate[0], -47, -88, 65, 62); ctx.drawImage(sprites.crate[0], 4, -76, 57, 55);
      rect(-55, -43, 112, 26, '#a16c42', true); rect(-60, -46, 122, 9, '#ce9c5e', true);
      for (const offset of [-34, 37]) {
        ellipse(offset, -9, 20, 20, '#68503b', true); ellipse(offset, -9, 13, 13, '#b79256', true);
        line(offset - 12, -9, offset + 12, -9, ink, 2); line(offset, -21, offset, 3, ink, 2);
      }
    } else if (entity.type === 'wizard') {
      // CC0 Santa supplies the expressive face; a purple robe and pointed hat turn him into the village wizard.
      ctx.drawImage(wizard, 175, 28, 400, 555, -58, -189, 136, 189);
      poly([[-51, -12], [-25, -104], [35, -104], [54, -12]], '#7851a0');
      poly([[-44, -152], [1, -229], [27, -153]], '#9264b7');
      ellipse(-5, -153, 47, 7, '#765094', true);
      for (const [sx, sy] of [[2, -191], [-14, -165], [-23, -61], [25, -30]]) text('✦', sx, sy, 13, '#f7d46d');
      line(57, -5, 64, -171, '#705237', 6); ellipse(65, -178, 11, 14, '#b3d3e0', true);
      ellipse(65, -178, 24 + Math.sin(animationTime / 150) * 3, 24, '#b494dd33');
      text('!', 4, -247, 25, '#ead3ff');
    } else if (entity.type === 'guard') {
      sprite(sprites.idle[Math.floor(animationTime / 150) % sprites.idle.length], 0, 0, 180, true);
    } else {
      const image = Math.floor(entity.x) % 2 ? sprites.villager[0] : worker;
      sprite(image, 0, Math.sin(animationTime / 190 + entity.x) * 1.5, image === worker ? 166 : 156, true);
    }
    if (!entity.resolved && entity.hp > 1) text('◆'.repeat(entity.hp), 0, entity.type === 'guard' ? -190 : -103, 13, '#fff0b2');
    ctx.restore();
  }
  function knight() {
    const walking = game.state === 'running' && !game.paused;
    const step = walking ? Math.sin(animationTime / 105) : 0;
    const bob = walking ? Math.abs(step) * 2 : Math.sin(animationTime / 450);
    const swinging = game.swing > 0;
    const duration = game.cooldown > .32 ? .32 : .22;
    const progress = swinging ? Math.min(1, Math.max(0, 1 - game.swing / duration)) : 0;
    const armAngle = swinging ? -1.8 + progress * 3.2 : game.charging ? -1.5 : .25 + step * .08;
    ellipse(player, ground + 4, 42, 9, '#352a2838');
    ctx.save(); ctx.translate(player, ground + bob);
    if (game.state === 'over' && game.health <= 0) { ctx.rotate(1.35); ctx.translate(-65, -40); }
    function part(name, x, y, scale = .34) {
      const image = parts[name]; ctx.drawImage(image, x, y, image.width * scale, image.height * scale);
    }
    // Modular CC0 limbs leave the sword hand free for the selected sprite.
    for (const [x, phase] of [[-25, -1], [17, 1]]) {
      ctx.save(); ctx.translate(x, -57); ctx.rotate(step * phase * .32);
      part('thigh', -7, -6); part('shin', -6, 12); part('boot', -17, 36); ctx.restore();
    }
    part('body', -27, -105, .42);
    part('upper-arm', -42, -104); part('shield', -64, -93, .31);
    part('head', -65, -238, .36); part('hair', -34, -169, .34);
    ctx.save(); ctx.translate(18, -100); ctx.rotate(armAngle);
    part('upper-arm', -6, -8, .38); part('forearm', 10, 2, .38);
    ctx.translate(34, 21); ctx.rotate(.55);
    // Exactly the same sprite as the shop card; grip is (50, 135) in its viewBox.
    const weapon = sprites.weapons[game.weapon];
    ctx.drawImage(weapon, -25, -67.5, 50, 80);
    ctx.rotate(-.55); part('hand', -9, -7, .34); ctx.restore();
    ctx.restore();
    if (game.swing > 0) {
      ctx.strokeStyle = '#fff2b9cc'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(player + 20, ground - 115, 118, -1, .65); ctx.stroke();
    }
    if (game.charging && game.charge >= .55) {
      ctx.strokeStyle = '#ffe399'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(player, ground - 113, 102, -.4, .5); ctx.stroke();
      text('KRAFT!', player, ground - 245, 20, '#ffdc77');
    }
  }
  return function draw(now) {
    if (!game.paused) animationTime += Math.min(100, now - (lastTime || now));
    lastTime = now;
    width = Math.max(640, canvas.width / canvas.height * 540);
    height = canvas.height / canvas.width * width;
    ground = height * .8; player = Math.min(190, width * .3);
    const scale = canvas.width / width; ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height); ctx.imageSmoothingEnabled = true;
    scenery();
    const entities = game.state === 'ready' ? [
      { type: 'barrel', x: 220, hp: 1 }, { type: 'villager', x: 370, hp: 1 },
      { type: 'cart', x: 570, hp: 2 }, { type: 'wizard', x: 740, hp: 1 },
    ] : game.entities;
    for (const entity of entities) target(entity);
    knight();
    for (const effect of game.effects) {
      const x = player + effect.x - game.x, y = ground - 180 - (1.2 - effect.life) * 55;
      ctx.save(); ctx.globalAlpha = Math.min(1, effect.life * 2);
      text(effect.text, x, y, 29, effect.kind === 'magic' ? '#ecd6ff' : '#ffe280');
      if (effect.kind === 'gold') {
        const age = 1.2 - effect.life;
        for (let i = 0; i < 5; i++) { const a = i * 1.25; ellipse(x + Math.cos(a) * age * 80, y + Math.sin(a) * 25 + 25, 5, 7, '#fbd16e', true); }
        if (effect.life > .8) text('POW!', x + 32, ground - 96, 24, '#fff2d0');
      }
      ctx.restore();
    }
    if (game.combo > 1) text(`${game.combo} I RAD!`, player, ground - 265, 22, '#ffdc77');
  };
}
