(() => {
  function mount() {
    const container = document.getElementById('constellation-root');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'constellation-canvas';
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1;
    let nodes = [];
    let animationId = 0;
    let pointer = { x: 0, y: 0, inside: false };

    const LINE_COLOR = 'rgba(71, 182, 232, 0.22)';
    const NODE_COLOR = 'rgba(255,255,255,0.9)';
    const GLOW_COLOR = 'rgba(71, 182, 232, 0.6)';

    function rand(min, max) { return Math.random() * (max - min) + min; }

    function resize() {
      const rect = container.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      const pw = Math.floor(w * dpr);
      const ph = Math.floor(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw; canvas.height = ph;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        initNodes();
      }
    }

    function initNodes() {
      const target = Math.max(36, Math.min(110, Math.floor((w * h) / 12000)));
      nodes = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: rand(-0.15, 0.15),
        vy: rand(-0.15, 0.15),
        r: rand(1, 2),
        pulse: rand(0, Math.PI * 2),
      }));
    }

    function step(now) {
      ctx.clearRect(0, 0, w, h);

      // Update positions
      for (let n of nodes) {
        // gentle motion
        n.x += n.vx;
        n.y += n.vy;

        // boundary bounce
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;

        // subtle pointer attraction
        if (pointer.inside) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const dist2 = dx * dx + dy * dy;
          const maxR = 160; // px
          if (dist2 < maxR * maxR) {
            const f = 0.0007; // attraction factor
            n.vx += dx * f;
            n.vy += dy * f;
          }
        }

        // friction
        n.vx *= 0.995;
        n.vy *= 0.995;
      }

      // Draw connections (simple, minimal)
      const maxD = 110; // link threshold
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < maxD) {
            const t = 1 - d / maxD; // 0..1
            let boost = 1;
            if (pointer.inside) {
              const m1 = Math.hypot(a.x - pointer.x, a.y - pointer.y);
              const m2 = Math.hypot(b.x - pointer.x, b.y - pointer.y);
              const near = Math.min(m1, m2);
              if (near < 140) boost = 1 + (1 - near / 140) * 0.8;
            }
            ctx.strokeStyle = `rgba(71, 182, 232, ${0.08 + t * 0.22 * boost})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes with subtle twinkle
      for (let n of nodes) {
        n.pulse += 0.02;
        const tw = (Math.sin(n.pulse) + 1) * 0.5; // 0..1
        const r = n.r + tw * 0.6;
        const glow = 3 + tw * 3;
        let alpha = 0.8;
        if (pointer.inside) {
          const m = Math.hypot(n.x - pointer.x, n.y - pointer.y);
          if (m < 120) alpha = 1;
        }
        ctx.shadowColor = GLOW_COLOR;
        ctx.shadowBlur = glow;
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(step);
    }

    function onMove(e) {
      const rect = container.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.inside = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= rect.width && pointer.y <= rect.height;
    }

    function onLeave() { pointer.inside = false; }

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) cancelAnimationFrame(animationId);
      else animationId = requestAnimationFrame(step);
    });
    window.addEventListener('mousemove', onMove, { passive: true });
    container.addEventListener('mouseleave', onLeave, { passive: true });

    resize();
    animationId = requestAnimationFrame(step);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true });
  } else {
    mount();
  }
})();
