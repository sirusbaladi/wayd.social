(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'starfield';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    zIndex: '0',
    pointerEvents: 'none',
    background: 'transparent',
  });
  // Place behind all content
  document.body.prepend(canvas);

  const ctx = canvas.getContext('2d');
  let w = 0,
    h = 0,
    dpr = 1,
    stars = [],
    animationId = 0;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    const pw = Math.floor(w * dpr);
    const ph = Math.floor(h * dpr);
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      initStars();
    }
  }

  function initStars() {
    const density = 9000; // higher = fewer stars
    const count = Math.max(80, Math.floor((w * h) / density));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      size: rand(0.6, 1.6),
      baseAlpha: rand(0.25, 0.7),
      twinkleAmp: rand(0.05, 0.35),
      twinkleSpeed: rand(0.5, 1.2),
      phase: Math.random() * Math.PI * 2,
      drift: rand(0.02, 0.08), // px per frame at 60fps (scaled by dt)
      bluish: Math.random() < 0.2, // 20% slightly blue tint
    }));
  }

  let last = performance.now();
  function draw(now) {
    const dt = Math.min((now - last) / 1000, 0.05); // cap delta for stability
    last = now;

    ctx.clearRect(0, 0, w, h);

    for (let s of stars) {
      s.y += s.drift * dt * 60;
      if (s.y > h + 2) {
        s.y = -2;
        s.x = Math.random() * w;
      }

      const alpha = s.baseAlpha + Math.sin(now * 0.001 * s.twinkleSpeed + s.phase) * s.twinkleAmp;
      const a = Math.max(0, Math.min(1, alpha));
      const color = s.bluish ? `hsla(210, 60%, 85%, ${a})` : `rgba(255,255,255,${a})`;

      ctx.shadowColor = color;
      ctx.shadowBlur = 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    animationId = requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });

  // Initialize
  resize();
  last = performance.now();
  animationId = requestAnimationFrame(draw);

  // Optional: pause animation when tab is hidden to save resources
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      last = performance.now();
      animationId = requestAnimationFrame(draw);
    }
  });
})();

