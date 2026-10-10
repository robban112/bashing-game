export const DAY_LENGTH = 40;
export const WEAPONS = [
  { name: 'Träningssvärd', damage: 1, reach: 110, cost: 0 },
  { name: 'Järnsvärd', damage: 2, reach: 120, cost: 100 },
  { name: 'Kungligt svärd', damage: 3, reach: 135, cost: 240 },
];
const TYPES = {
  villager: { hp: 1, gold: 15 }, barrel: { hp: 1, gold: 12 },
  cart: { hp: 2, gold: 30 }, guard: { hp: 2, gold: 25 }, wizard: { hp: 1, gold: 0 },
};
export class Game {
  constructor(random = Math.random) { this.random = random; this.reset(); }
  reset() {
    this.state = 'ready'; this.day = 1; this.bank = 0; this.total = 0;
    this.weapon = 0; this.armor = 0; this.health = 100;
    this.entities = []; this.effects = []; this.events = []; this.x = 0;
    this.collected = 0; this.time = DAY_LENGTH; this.combo = 0;
    this.cooldown = 0; this.swing = 0; this.charge = 0; this.charging = false;
    this.paused = false; this.goal = 150;
  }
  startDay() {
    if (!['ready', 'shop'].includes(this.state)) return false;
    this.state = 'running'; this.x = 0; this.time = DAY_LENGTH;
    this.goal = 150 + (this.day - 1) * 65; this.collected = 0;
    this.entities = []; this.effects = []; this.events = [];
    this.cooldown = 0; this.swing = 0; this.combo = 0; this.comboTime = 0;
    this.charge = 0; this.charging = false; this.paused = false;
    this.nextSpawn = 270; this.spawn(); return true;
  }
  spawn() {
    const roll = this.random();
    const type = roll < .34 ? 'villager' : roll < .59 ? 'barrel' : roll < .76 ? 'cart' : roll < .9 ? 'guard' : 'wizard';
    const data = TYPES[type];
    this.entities.push({ type, x: this.nextSpawn, hp: data.hp, gold: data.gold, hit: 0, resolved: false });
    this.nextSpawn += 155 + this.random() * 95;
  }
  beginCharge() {
    if (this.state !== 'running' || this.paused || this.cooldown > 0 || this.charging) return false;
    this.charging = true; this.charge = 0; return true;
  }
  release() {
    if (!this.charging) return false;
    const power = this.charge >= .55;
    this.charging = false; this.charge = 0;
    return this.attack(power);
  }
  attack(power = false) {
    if (this.state !== 'running' || this.paused || this.cooldown > 0) return false;
    this.cooldown = power ? .65 : .32; this.swing = power ? .32 : .22;
    const weapon = WEAPONS[this.weapon]; let hits = 0;
    this.events.push({ type: 'swing', power });
    for (const entity of this.entities) {
      const distance = entity.x - this.x;
      if (entity.resolved || distance < -25 || distance > weapon.reach + (power ? 30 : 0)) continue;
      hits++;
      if (entity.type === 'wizard') {
        entity.resolved = true; this.hurt(25, 'Förbannelse!'); this.combo = 0;
        this.effects.push({ x: entity.x, text: 'MAGI!', kind: 'magic', life: 1 });
        continue;
      }
      entity.hp -= weapon.damage + (power ? 1 : 0); entity.hit = .3;
      this.events.push({ type: 'hit' });
      if (entity.hp <= 0) {
        entity.resolved = true; this.combo++; this.comboTime = 2.8;
        const amount = entity.gold + Math.min(10, Math.max(0, this.combo - 1) * 2);
        this.collected += amount;
        this.effects.push({ x: entity.x, text: `+${amount}`, kind: 'gold', life: 1.2 });
        this.events.push({ type: 'gold', amount });
      }
    }
    if (!hits) { this.combo = 0; this.events.push({ type: 'miss' }); }
    if (this.health <= 0) this.finish();
    return true;
  }
  hurt(amount, message) {
    this.health = Math.max(0, this.health - Math.max(1, amount - this.armor * 5));
    this.events.push({ type: 'hurt', message });
  }
  update(dt) {
    if (this.state !== 'running' || this.paused) return;
    dt = Math.max(0, Math.min(dt, .1));
    this.time = Math.max(0, this.time - dt);
    this.x += (96 + Math.min(40, (this.day - 1) * 6)) * dt;
    this.cooldown = Math.max(0, this.cooldown - dt); this.swing = Math.max(0, this.swing - dt);
    if (this.charging) this.charge = Math.min(1, this.charge + dt);
    this.comboTime = Math.max(0, this.comboTime - dt);
    if (!this.comboTime) this.combo = 0;
    while (this.nextSpawn < this.x + 1100) this.spawn();
    for (const entity of this.entities) {
      entity.hit = Math.max(0, entity.hit - dt);
      if (!entity.resolved && entity.x < this.x - 30) {
        entity.resolved = true;
        if (entity.type === 'guard') this.hurt(12, 'Vakten slog tillbaka!');
      }
    }
    this.entities = this.entities.filter(entity => entity.x > this.x - 240);
    for (const effect of this.effects) effect.life -= dt;
    this.effects = this.effects.filter(effect => effect.life > 0);
    if (this.time <= 0 || this.health <= 0) this.finish();
  }
  finish() {
    if (this.state !== 'running') return;
    this.bank += this.collected; this.total += this.collected;
    this.charging = false; this.charge = 0;
    this.state = this.health > 0 && this.collected >= this.goal ? 'shop' : 'over';
    this.events.push({ type: this.state === 'shop' ? 'win' : 'lose' });
  }
  buy(item) {
    if (this.state !== 'shop') return false;
    if (item === 'weapon') {
      const next = WEAPONS[this.weapon + 1];
      if (!next || this.bank < next.cost) return false;
      this.bank -= next.cost; this.weapon++; return true;
    }
    if (item === 'potion' && this.health < 100 && this.bank >= 35) {
      this.bank -= 35; this.health = Math.min(100, this.health + 40); return true;
    }
    if (item === 'armor' && this.armor < 3 && this.bank >= 75) {
      this.bank -= 75; this.armor++; return true;
    }
    return false;
  }
  nextDay() { if (this.state !== 'shop') return false; this.day++; return this.startDay(); }
  togglePause() {
    if (this.state !== 'running') return;
    this.paused = !this.paused; this.charging = false; this.charge = 0;
  }
}
