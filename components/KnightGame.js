'use client';

import { useEffect, useRef, useState } from 'react';
import { Game, WEAPONS } from '../lib/game';
import { createRenderer } from '../lib/renderer';
import { loadSprites } from '../lib/assets';

function snapshot(game) {
  return {
    state: game.state, paused: game.paused, day: game.day, collected: game.collected,
    goal: game.goal, health: game.health, time: Math.ceil(game.time), bank: game.bank,
    total: game.total, weapon: game.weapon, armor: game.armor, charge: Math.min(100, game.charge / .55 * 100),
  };
}

export default function KnightGame() {
  const canvasRef = useRef(null);
  const rootRef = useRef(null);
  const gameRef = useRef(null);
  const publishRef = useRef(() => {});
  const soundRef = useRef(false);
  const [view, setView] = useState(() => snapshot(new Game()));
  const [sound, setSound] = useState(false);
  const [best, setBest] = useState(0);
  const [toast, setToast] = useState('');
  const [assetsReady, setAssetsReady] = useState(false);
  const [assetError, setAssetError] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const game = new Game();
    gameRef.current = game;
    const controller = new AbortController();
    let draw;
    setAssetsReady(false); setAssetError(false);
    setFullscreenSupported(!!document.fullscreenEnabled);
    const onFullscreen = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onFullscreen);
    let last = performance.now(), lastPublish = 0, frameId, audio, toastUntil = 0, record = 0;
    try { record = Math.max(0, Number(localStorage.getItem('knight-best')) || 0); } catch {}
    setBest(record);
    const publish = () => {
      const next = snapshot(game);
      setView(previous => Object.keys(next).every(key => previous[key] === next[key]) ? previous : next);
    };
    publishRef.current = publish;
    function beep(type) {
      if (!soundRef.current) return;
      const frequency = { swing: 130, hit: 80, gold: 720, hurt: 65, win: 550, lose: 100 }[type];
      if (!frequency) return;
      try {
        audio ??= new (window.AudioContext || window.webkitAudioContext)();
        void audio.resume().catch(() => {});
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = type === 'gold' ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency / 2, audio.currentTime + .12);
        gain.gain.setValueAtTime(.065, audio.currentTime);
        gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .15);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .16);
      } catch { /* Audio is optional. */ }
    }
    function resize() {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width) canvas.width = width;
      if (canvas.height !== height) canvas.height = height;
    }
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    function pauseOnBlur() {
      if (game.state === 'running' && !game.paused) { game.togglePause(); publish(); }
    }
    function onVisibility() { if (document.hidden) pauseOnBlur(); }
    function keydown(event) {
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.code === 'KeyP' && !event.repeat) { game.togglePause(); publish(); return; }
      if (event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) return;
      if (event.code === 'Space') { event.preventDefault(); if (!event.repeat) game.beginCharge(); }
    }
    function keyup(event) {
      if (event.code === 'Space' && game.charging) { event.preventDefault(); game.release(); publish(); }
    }
    window.addEventListener('keydown', keydown); window.addEventListener('keyup', keyup);
    window.addEventListener('blur', pauseOnBlur); document.addEventListener('visibilitychange', onVisibility);
    function frame(now) {
      game.update((now - last) / 1000); last = now;
      for (const event of game.events.splice(0)) {
        beep(event.type);
        if (event.type === 'hurt') { setToast(event.message); toastUntil = now + 1800; }
        if (event.type === 'win' || event.type === 'lose') {
          record = Math.max(record, game.total); setBest(record);
          try { localStorage.setItem('knight-best', String(record)); } catch {}
          publish();
        }
      }
      if (toastUntil && now >= toastUntil) { setToast(''); toastUntil = 0; }
      if (now - lastPublish >= 80) { publish(); lastPublish = now; }
      draw(now); frameId = requestAnimationFrame(frame);
    }
    publish();
    loadSprites(controller.signal).then(sprites => {
      if (controller.signal.aborted) return;
      draw = createRenderer(canvas, game, sprites);
      last = performance.now(); setAssetsReady(true);
      frameId = requestAnimationFrame(frame);
    }).catch(error => {
      if (error.name !== 'AbortError') { setAssetError(true); setAssetsReady(false); }
    });
    return () => {
      controller.abort(); cancelAnimationFrame(frameId); observer.disconnect();
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('keydown', keydown); window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', pauseOnBlur); document.removeEventListener('visibilitychange', onVisibility);
      if (audio) void audio.close().catch(() => {});
      gameRef.current = null; publishRef.current = () => {};
    };
  }, []);

  function action(callback) {
    if (!gameRef.current) return;
    callback(gameRef.current); publishRef.current();
  }
  function start() {
    if (assetError) { window.location.reload(); return; }
    if (!assetsReady) return;
    action(game => {
      if (game.paused) game.togglePause();
      else if (game.state === 'shop') game.nextDay();
      else { if (game.state === 'over') game.reset(); game.startDay(); }
    });
    canvasRef.current?.focus({ preventScroll: true });
  }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch { setToast('Helskärm stöds inte här. Spelet fyller redan fönstret.'); }
  }
  function pointerDown(event) {
    if (event.button !== 0) return;
    event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId);
    action(game => game.beginCharge());
  }
  function pointerUp(event) { event.preventDefault(); action(game => game.release()); }
  function cancelCharge() { action(game => { game.charging = false; game.charge = 0; }); }
  const input = { onPointerDown: pointerDown, onPointerUp: pointerUp, onPointerCancel: cancelCharge, onLostPointerCapture: cancelCharge };
  const state = view.paused ? 'paused' : view.state;
  const panel = state === 'shop' ? {
    kicker: 'KUNGEN ÄR NÖJD. FÖR STUNDEN.', title: 'Skatten är indriven.',
    text: `Du samlade ${view.collected} mynt. Köp utrustning inför dag ${view.day + 1}; nästa skattemål är ${150 + view.day * 65} mynt. Hälsan följer med till nästa dag.`,
    button: 'Nästa dag', note: 'Bättre vapen ger mer skada. Rustning minskar skadan du tar.',
  } : state === 'over' ? {
    kicker: view.health <= 0 ? 'RIDDARNS ARBETSDAG ÄR ÖVER' : 'KUNGEN SAKNAR SINA MYNT',
    title: view.health <= 0 ? 'Rustningen höll inte.' : 'För lite i skattkistan.',
    text: `Dag ${view.day}: ${view.collected} av ${view.goal} mynt. Totalt samlade du ${view.total} mynt. Träffa när målen är nära och använd kraftslag mot vagnar och vakter.`,
    button: 'Försök igen', note: 'En ny omgång börjar på dag 1.',
  } : state === 'paused' ? {
    kicker: 'EN LITEN RAST', title: 'Riddaren vilar.',
    text: 'Skatten, tiden och byborna väntar tills du fortsätter.', button: 'Fortsätt', note: 'Tryck P eller knappen för att fortsätta.',
  } : {
    kicker: 'KUNGEN VILL HA SITT GULD', title: <>En hård dags<br />skattearbete.</>,
    text: 'Byn har gömt sina mynt. Du sköter förhandlingen. Samla dagens skatt innan tiden tar slut — men lämna trollkarlarna i fred.',
    button: 'Ut i byn', note: 'Klicka / mellanslag: slå · Håll och släpp: kraftslag',
  };
  const nextWeapon = WEAPONS[view.weapon + 1];
  const shop = [
    { id: 'weapon', name: nextWeapon?.name ?? 'Bästa vapnet', cost: nextWeapon?.cost, enabled: !!nextWeapon },
    { id: 'armor', name: view.armor < 3 ? `Rustning ${view.armor + 1}` : 'Bästa rustningen', cost: 75, enabled: view.armor < 3 },
    { id: 'potion', name: 'Läkedryck +40', cost: 35, enabled: view.health < 100 },
  ];

  return (
    <main ref={rootRef} className="game-root">
      <section className="game-shell" aria-label="Svarta riddaren">
        <div className="viewport">
          <canvas ref={canvasRef} id="scene" width="960" height="540" tabIndex={0} {...input} aria-label="Sidscrollande spel. Tryck mellanslag eller klicka för att slå. Håll in och släpp för kraftslag. P pausar." />
          <div className="scene-label" aria-hidden="true"><span id="location">{['KORPBYN', 'EKDALEN', 'KUNGSVÄGEN'][(view.day - 1) % 3]}</span></div>
          <div id="overlay" className="overlay" hidden={state === 'running'}>
            <div id="panel" className="panel">
              {state === 'ready' && <p className="game-logo">SVARTA RIDD<span>AREN</span></p>}
              <p id="panel-kicker" className="eyebrow">{panel.kicker}</p>
              <h1 id="panel-title">{panel.title}</h1>
              <p id="panel-text">{panel.text}</p>
              {state === 'ready' && <div className="quick-guide"><span>✦ Slå nära</span><span>◈ Samla mynt</span><span>☄ Undvik magi</span></div>}
              {state === 'shop' && <div id="shop" className="shop">{shop.map(item => (
                <button key={item.id} disabled={!item.enabled || view.bank < item.cost} onClick={() => action(game => game.buy(item.id))}>
                  <span className="shop-icon" aria-hidden="true">{item.id === 'weapon' ? '⚔' : item.id === 'armor' ? '♜' : '♥'}</span>
                  {item.name}<small>{item.enabled ? `${item.cost} mynt` : item.id === 'potion' ? 'Full hälsa' : 'Fullt uppgraderad'}</small>
                </button>
              ))}</div>}
              <button id="start" className="primary" onClick={start} disabled={!assetsReady && !assetError}>
                {assetError ? 'Ladda om' : assetsReady ? panel.button : 'Laddar riddaren…'}<span aria-hidden="true">→</span>
              </button>
              <p id="panel-note" className="panel-note">{assetError ? 'Grafiken kunde inte laddas. Försök ladda om sidan.' : panel.note}</p>
              {state === 'ready' && <p className="asset-credit">Sprites av pzUH / GameArt2D · CC0</p>}
            </div>
          </div>
          <div id="toast" className={`toast${toast ? ' visible' : ''}`} role="status" aria-live="polite">{toast}</div>
        </div>
        <div className="hud">
          <div className="stat day"><span>DAG</span><strong id="day">{String(view.day).padStart(2, '0')}</strong></div>
          <div className="stat tax"><span>DAGENS SKATT <b id="quota">{view.collected} / {view.goal}</b></span><div className="meter"><i id="tax-bar" style={{ width: `${Math.min(100, view.collected / view.goal * 100)}%` }} /></div></div>
          <div className="stat health"><span>HÄLSA <b id="health">{view.health}</b></span><div className="meter"><i id="health-bar" style={{ width: `${view.health}%` }} /></div></div>
          <div className="stat"><span>TID</span><strong id="time">{view.time}s</strong></div>
          <div className="stat"><span>MYNTPUNG</span><strong className="gold" id="bank">{view.bank}</strong></div>
        </div>
        <div className="tools">
          <button id="sound" aria-pressed={sound} onClick={() => { soundRef.current = !sound; setSound(!sound); }}>{sound ? 'Ljud på' : 'Ljud av'}</button>
          {fullscreenSupported && <button id="fullscreen" aria-pressed={fullscreen} onClick={toggleFullscreen}>{fullscreen ? 'Lämna helskärm' : 'Helskärm'}</button>}
          <button id="pause" disabled={view.state !== 'running'} onClick={() => action(game => game.togglePause())}>{view.paused ? 'Fortsätt' : 'Pausa'}</button>
        </div>
        <footer className="game-controls">
          <div className="control-hint"><span className="key">SPACE</span><span>Slå · håll för kraftslag</span></div>
          <div className="record">REKORD <b id="best">{best}</b> MYNT</div>
          <div className="charge"><span>KRAFTSLAG</span><div className="meter"><i id="charge-bar" style={{ width: `${view.charge}%` }} /></div></div>
          <button id="strike" className="strike" disabled={state !== 'running' || !assetsReady} {...input} onClick={event => { if (event.detail === 0) action(game => game.attack()); }}>SLÅ <span aria-hidden="true">✦</span></button>
        </footer>
      </section>
    </main>
  );
}
