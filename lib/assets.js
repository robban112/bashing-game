import { WEAPONS } from './game';

export const SPRITES = {
  weapons: WEAPONS.map(weapon => weapon.sprite),
  "body": ["/assets/gameart2d/part-body.png"],
  "head": ["/assets/gameart2d/part-head.png"],
  "hair": ["/assets/gameart2d/part-hair.png"],
  "upper-arm": ["/assets/gameart2d/part-upper-arm.png"],
  "forearm": ["/assets/gameart2d/part-forearm.png"],
  "hand": ["/assets/gameart2d/part-hand.png"],
  "thigh": ["/assets/gameart2d/part-thigh.png"],
  "shin": ["/assets/gameart2d/part-shin.png"],
  "boot": ["/assets/gameart2d/part-boot.png"],
  "shield": ["/assets/gameart2d/part-shield.png"],

  "idle": [
    "/assets/gameart2d/knight-idle-1.png",
    "/assets/gameart2d/knight-idle-2.png",
    "/assets/gameart2d/knight-idle-3.png",
    "/assets/gameart2d/knight-idle-4.png",
    "/assets/gameart2d/knight-idle-5.png",
    "/assets/gameart2d/knight-idle-6.png",
    "/assets/gameart2d/knight-idle-7.png",
    "/assets/gameart2d/knight-idle-8.png",
    "/assets/gameart2d/knight-idle-9.png",
    "/assets/gameart2d/knight-idle-10.png"
  ],
  "walk": [
    "/assets/gameart2d/knight-walk-1.png",
    "/assets/gameart2d/knight-walk-2.png",
    "/assets/gameart2d/knight-walk-3.png",
    "/assets/gameart2d/knight-walk-4.png",
    "/assets/gameart2d/knight-walk-5.png",
    "/assets/gameart2d/knight-walk-6.png",
    "/assets/gameart2d/knight-walk-7.png",
    "/assets/gameart2d/knight-walk-8.png",
    "/assets/gameart2d/knight-walk-9.png",
    "/assets/gameart2d/knight-walk-10.png"
  ],
  "attack": [
    "/assets/gameart2d/knight-attack-1.png",
    "/assets/gameart2d/knight-attack-2.png",
    "/assets/gameart2d/knight-attack-3.png",
    "/assets/gameart2d/knight-attack-4.png",
    "/assets/gameart2d/knight-attack-5.png",
    "/assets/gameart2d/knight-attack-6.png",
    "/assets/gameart2d/knight-attack-7.png",
    "/assets/gameart2d/knight-attack-8.png",
    "/assets/gameart2d/knight-attack-9.png",
    "/assets/gameart2d/knight-attack-10.png"
  ],
  "dead": [
    "/assets/gameart2d/knight-dead.png"
  ],
  "villager": [
    "/assets/gameart2d/villager.png"
  ],
  "worker": [
    "/assets/gameart2d/worker.png"
  ],
  "wizard": [
    "/assets/gameart2d/wizard.png"
  ],
  "tree": [
    "/assets/gameart2d/tree.png"
  ],
  "bush": [
    "/assets/gameart2d/bush.png"
  ],
  "crate": [
    "/assets/gameart2d/crate.png"
  ]
};

// Load local pack files before enabling play; canceled mounts never start a loop.
export async function loadSprites(signal) {
  const entries = await Promise.all(Object.entries(SPRITES).map(async ([name, urls]) => {
    const images = await Promise.all(urls.map(url => new Promise((resolve, reject) => {
      const image = new Image();
      const abort = () => { image.onload = null; image.onerror = null; image.src = ''; reject(new DOMException('Aborted', 'AbortError')); };
      signal.addEventListener('abort', abort, { once: true });
      const finish = callback => { signal.removeEventListener('abort', abort); image.onload = null; image.onerror = null; callback(); };
      image.onload = () => finish(() => resolve(image));
      image.onerror = () => finish(() => reject(new Error(`Could not load ${url}`)));
      if (signal.aborted) { abort(); return; }
      image.src = url;
    })));
    return [name, images];
  }));
  return Object.fromEntries(entries);
}
