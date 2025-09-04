(() => {
  // Remove previous instances on hot reload
  for (const id of ['cosmic-glow', 'cosmic-flare']) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  // Background glow/beam layer (below content)
  const glow = document.createElement('canvas');
  glow.id = 'cosmic-glow';
  Object.assign(glow.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    zIndex: '0', pointerEvents: 'none', background: 'transparent'
  });
  document.body.appendChild(glow);

  // Foreground flare layer (above content) for lens bloom
  const flare = document.createElement('canvas');
  flare.id = 'cosmic-flare';
  Object.assign(flare.style, {
    position: 'fixed', inset: '0', width: '100%', height: '100%',
    zIndex: '3', pointerEvents: 'none', background: 'transparent',
    mixBlendMode: 'screen',
  });
  document.body.appendChild(flare);

  const bg = glow.getContext('2d');
  const fg = flare.getContext('2d');
  let w = 0, h = 0, dpr = 1;

  const beam = {
    angle: -4 * Math.PI / 180, // near-horizontal, slightly up
    lengthFactor: 1.35,
    widthFactor: 0.08, // narrower, more directional
  };

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    const pw = Math.floor(w * dpr), ph = Math.floor(h * dpr);
    for (const [c, ctx] of [[glow, bg], [flare, fg]]) {
      if (c.width !== pw || c.height !== ph) {
        c.width = pw; c.height = ph;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
      }
    }
    draw();
  }

  function draw() {
    bg.clearRect(0, 0, w, h);
    fg.clearRect(0, 0, w, h);

    // Parameters
    const originX = w * 1.02, originY = h * 0.5;
    const r = Math.max(w, h) * 0.6; // tighter starburst
    const beamLen = w * beam.lengthFactor;
    const beamWidth = Math.min(h * beam.widthFactor, 160);
    const coreWidth = Math.max(beamWidth * 0.6, 36);

    // 1) Main radial starburst (background)
    const grad = bg.createRadialGradient(originX, originY, 0, originX, originY, r);
    grad.addColorStop(0.0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.1, 'rgba(220,240,255,0.28)');
    grad.addColorStop(0.28, 'rgba(71,182,232,0.14)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.04)');
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');
    bg.save();
    bg.globalCompositeOperation = 'screen';
    bg.filter = 'blur(4px)';
    bg.fillStyle = grad;
    bg.fillRect(0, 0, w, h);
    bg.restore();

    // 2) Directed laser-like beam (background)
    bg.save();
    bg.translate(originX, originY);
    bg.rotate(beam.angle);
    bg.globalCompositeOperation = 'screen';

    // Soft outer beam
    let lg = bg.createLinearGradient(-beamLen, 0, 0, 0);
    lg.addColorStop(0.0, 'rgba(0,0,0,0)');
    lg.addColorStop(0.65, 'rgba(71,182,232,0.08)');
    lg.addColorStop(0.9, 'rgba(200,230,255,0.18)');
    lg.addColorStop(1.0, 'rgba(255,255,255,0.35)');
    bg.filter = 'blur(4px)';
    bg.fillStyle = lg;
    bg.fillRect(-beamLen, -beamWidth / 2, beamLen, beamWidth);

    // Hot core near the emitter
    const coreLen = Math.max(w * 0.28, 320);
    const cg = bg.createLinearGradient(-coreLen, 0, 0, 0);
    cg.addColorStop(0.0, 'rgba(71,182,232,0)');
    cg.addColorStop(0.65, 'rgba(210,235,255,0.55)');
    cg.addColorStop(0.9, 'rgba(255,255,255,0.9)');
    cg.addColorStop(1.0, 'rgba(255,255,255,1.0)');
    bg.filter = 'blur(3px)';
    bg.fillStyle = cg;
    bg.fillRect(-coreLen, -coreWidth / 2, coreLen, coreWidth);

    // Burst at emitter
    const br = Math.max(beamWidth * 0.7, 90);
    const burst = bg.createRadialGradient(0, 0, 0, 0, 0, br);
    burst.addColorStop(0.0, 'rgba(255,255,255,1.0)');
    burst.addColorStop(0.4, 'rgba(210,235,255,0.55)');
    burst.addColorStop(0.85, 'rgba(71,182,232,0.12)');
    burst.addColorStop(1.0, 'rgba(0,0,0,0)');
    bg.filter = 'blur(4px)';
    bg.fillStyle = burst;
    bg.beginPath();
    bg.arc(0, 0, br, 0, Math.PI * 2);
    bg.fill();
    bg.restore();

    // 3) Wispy nebula following the beam (background)
    bg.save();
    bg.globalCompositeOperation = 'screen';
    bg.filter = 'blur(12px)';
    const pCount = Math.floor((w * h) / 40000) + 8;
    for (let i = 0; i < pCount; i++) {
      const t = Math.random(); // along beam
      const jitter = (Math.random() - 0.5) * beamWidth * 0.5; // tighter to beam
      const px = originX - Math.cos(beam.angle) * t * beamLen + Math.sin(beam.angle) * jitter;
      const py = originY - Math.sin(beam.angle) * t * beamLen - Math.cos(beam.angle) * jitter;
      const pr = Math.max(beamWidth * (0.4 + Math.random() * 0.9), 40);
      const g = bg.createRadialGradient(px, py, 0, px, py, pr);
      const roll = Math.random();
      const tint = roll < 0.3 ? 'rgba(160,200,255,' : roll < 0.6 ? 'rgba(140,160,255,' : 'rgba(71,182,232,';
      const a0 = 0.04 + Math.random() * 0.06;
      g.addColorStop(0, `${tint}${a0.toFixed(3)})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      bg.fillStyle = g;
      bg.beginPath();
      bg.arc(px, py, pr, 0, Math.PI * 2);
      bg.fill();
    }
    bg.restore();

    // 4) Lens flare/bloom overlay (foreground, above content)
    fg.save();
    fg.globalCompositeOperation = 'screen';
    fg.filter = 'blur(8px)';
    const flareR = Math.max(w, h) * 0.5;
    const flareGrad = fg.createRadialGradient(originX, originY, 0, originX, originY, flareR);
    flareGrad.addColorStop(0.0, 'rgba(255,255,255,0.55)');
    flareGrad.addColorStop(0.18, 'rgba(220,240,255,0.22)');
    flareGrad.addColorStop(0.35, 'rgba(71,182,232,0.10)');
    flareGrad.addColorStop(1.0, 'rgba(0,0,0,0)');
    fg.fillStyle = flareGrad;
    fg.fillRect(0, 0, w, h);

    // Subtle streak along beam
    fg.translate(originX, originY);
    fg.rotate(beam.angle);
    const streak = fg.createLinearGradient(-beamLen, 0, 0, 0);
    streak.addColorStop(0.78, 'rgba(255,255,255,0)');
    streak.addColorStop(0.95, 'rgba(255,255,255,0.35)');
    streak.addColorStop(1.0, 'rgba(255,255,255,0.8)');
    fg.fillStyle = streak;
    fg.fillRect(-beamLen, -Math.max(coreWidth * 0.5, 22) / 2, beamLen, Math.max(coreWidth * 0.5, 22));
    fg.restore();
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
})();
