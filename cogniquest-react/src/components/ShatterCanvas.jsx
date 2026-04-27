import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Matter from 'matter-js';

const { Engine, Runner, Bodies, Body, Composite, Events } = Matter;

// ── Rounded rect path ─────────────────────────────────────────────────────────
function rrPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y,     x + w, y + r,     r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x,     y + h, x,     y + h - r, r);
  ctx.lineTo(x,    y + r);
  ctx.arcTo(x,     y,     x + r, y,         r);
  ctx.closePath();
}

// ── Thick glass card renderer ─────────────────────────────────────────────────
function drawGlassCard(ctx, img, w, h, angle, speed) {
  const hw = w / 2, hh = h / 2, r = 10;

  // 1. Clip to rounded rect
  rrPath(ctx, -hw, -hh, w, h, r);
  ctx.save();
  ctx.clip();

  // 2. Card image
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, -hw, -hh, w, h);
  } else {
    ctx.fillStyle = '#0a1a4a';
    ctx.fill();
  }

  // 3. Fresnel edge darkening (glass depth)
  const fresnel = ctx.createRadialGradient(0, 0, Math.min(hw, hh) * 0.25, 0, 0, Math.max(hw, hh) * 1.3);
  fresnel.addColorStop(0,   'rgba(140,200,255,0.03)');
  fresnel.addColorStop(0.6, 'rgba(90,160,240,0.10)');
  fresnel.addColorStop(1,   'rgba(40,100,200,0.28)');
  ctx.fillStyle = fresnel;
  ctx.fill();

  // 4. Rotating specular hotspot — shifts with angle
  const spx = Math.cos(angle * 2.3) * hw * 0.45;
  const spy = Math.sin(angle * 2.3) * hh * 0.45 - hh * 0.2;
  const spBrightness = 0.18 + Math.min(speed / 14, 0.22);
  const spec = ctx.createRadialGradient(spx, spy, 0, spx, spy, Math.max(hw, hh) * 0.9);
  spec.addColorStop(0, `rgba(255,255,255,${spBrightness})`);
  spec.addColorStop(0.4, `rgba(200,230,255,${spBrightness * 0.3})`);
  spec.addColorStop(1,   'rgba(180,220,255,0)');
  ctx.fillStyle = spec;
  ctx.fill();

  // 5. Diagonal glare stripe — sweeps as card tilts
  const glareOffset = ((angle + Math.PI) % (Math.PI * 2)) / (Math.PI * 2);
  const gx = -hw * 1.5 + glareOffset * w * 3;
  const gl = ctx.createLinearGradient(gx, -hh, gx + w * 0.28, hh);
  gl.addColorStop(0,    'rgba(255,255,255,0)');
  gl.addColorStop(0.4,  'rgba(255,255,255,0.13)');
  gl.addColorStop(0.5,  'rgba(255,255,255,0.22)');
  gl.addColorStop(0.6,  'rgba(255,255,255,0.13)');
  gl.addColorStop(1,    'rgba(255,255,255,0)');
  ctx.fillStyle = gl;
  ctx.fill();

  // 6. Internal refraction lines (subtle horizontal bands)
  ctx.strokeStyle = 'rgba(180,220,255,0.06)';
  ctx.lineWidth   = 1;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-hw, i * hh * 0.42);
    ctx.lineTo( hw, i * hh * 0.42 - 14);
    ctx.stroke();
  }

  ctx.restore(); // end clip

  // 7. Outer glow border
  ctx.shadowColor = 'rgba(140,210,255,0.6)';
  ctx.shadowBlur  = 14;
  rrPath(ctx, -hw, -hh, w, h, r);
  ctx.strokeStyle = 'rgba(190,225,255,0.65)';
  ctx.lineWidth   = 2.8;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // 8. Top-left bright bevel (glass catches overhead light)
  ctx.beginPath();
  ctx.moveTo(-hw + r, -hh + 1.2);
  ctx.lineTo( hw - r, -hh + 1.2);
  ctx.arcTo(hw - 1.2, -hh + 1.2, hw - 1.2, -hh + r, r);
  ctx.lineTo( hw - 1.2, 0);
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth   = 1.4;
  ctx.stroke();

  // 9. Bottom-right dark bevel (shadow face of thick glass)
  ctx.beginPath();
  ctx.moveTo(hw - 1.2, 0);
  ctx.lineTo(hw - 1.2, hh - r);
  ctx.arcTo(hw - 1.2, hh - 1.2, hw - r, hh - 1.2, r);
  ctx.lineTo(-hw + r, hh - 1.2);
  ctx.strokeStyle = 'rgba(60,120,200,0.4)';
  ctx.lineWidth   = 1.4;
  ctx.stroke();
}

// ── Polygon vertices for irregular glass chunks ───────────────────────────────
function polyVerts(cx, cy, r, sides) {
  return Array.from({ length: sides }, (_, i) => {
    const a = (i / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.85;
    const d = r * (0.5 + Math.random() * 0.5);
    return { x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d };
  });
}

// ── Glass shard renderer ──────────────────────────────────────────────────────
function drawShard(ctx, body, kind) {
  const verts = body.vertices;
  const px    = body.position.x;
  const py    = body.position.y;
  const spd   = Math.hypot(body.velocity.x, body.velocity.y);
  const size  = kind === 'chunk' ? 28 : 12;

  ctx.beginPath();
  ctx.moveTo(verts[0].x, verts[0].y);
  for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y);
  ctx.closePath();

  const g = ctx.createRadialGradient(px, py, 0, px, py, size);
  g.addColorStop(0, 'rgba(210,240,255,0.48)');
  g.addColorStop(0.5,'rgba(150,210,255,0.18)');
  g.addColorStop(1,  'rgba(80,160,230,0.06)');
  ctx.fillStyle = g;
  ctx.fill();

  ctx.strokeStyle = 'rgba(220,245,255,0.92)';
  ctx.lineWidth   = kind === 'chunk' ? 1.5 : 0.9;
  ctx.stroke();

  // Specular glint proportional to speed
  if (spd > 0.5 && verts.length > 1) {
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    ctx.lineTo(verts[1].x, verts[1].y);
    ctx.strokeStyle = `rgba(255,255,255,${Math.min(spd / 9, 0.85)})`;
    ctx.lineWidth   = 2;
    ctx.stroke();
  }
}

// ── Spawn shatter at impact point ─────────────────────────────────────────────
const MAX_SHARDS = 220;

function spawnShatter(engine, cx, cy, shardsRef, impactsRef) {
  const now = performance.now();
  const newBodies = [];
  const existing  = shardsRef.current.length;

  const chunksN   = Math.min(5 + Math.floor(Math.random() * 4), MAX_SHARDS - existing);
  const splinterN = Math.min(12 + Math.floor(Math.random() * 7), MAX_SHARDS - existing - chunksN);

  for (let i = 0; i < chunksN; i++) {
    const r = 16 + Math.random() * 24;
    const s = 4  + Math.floor(Math.random() * 3);
    let body;
    try {
      body = Bodies.fromVertices(cx, cy, polyVerts(cx, cy, r, s), {
        restitution: 0.45 + Math.random() * 0.25, friction: 0.45, frictionAir: 0.01,
        label: 'chunk', collisionFilter: { category: 0x0004, mask: 0x0002 | 0x0004 },
      }, true);
    } catch {
      body = Bodies.polygon(cx, cy, s, r, {
        restitution: 0.45, friction: 0.45, frictionAir: 0.01,
        label: 'chunk', collisionFilter: { category: 0x0004, mask: 0x0002 | 0x0004 },
      });
    }
    const a = Math.random() * Math.PI * 2;
    const v = 1.5 + Math.random() * 5;
    Body.setVelocity(body, { x: Math.cos(a) * v, y: -Math.abs(Math.sin(a)) * v - 1.5 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.6);
    Composite.add(engine.world, body);
    newBodies.push({ body, kind: 'chunk', born: now });
  }

  for (let i = 0; i < splinterN; i++) {
    const w = 12 + Math.random() * 34;
    const h =  2 + Math.random() * 5;
    const body = Bodies.rectangle(
      cx + (Math.random() - 0.5) * 50, cy - Math.random() * 10, w, h, {
        restitution: 0.55 + Math.random() * 0.35, friction: 0.3, frictionAir: 0.013,
        label: 'splinter', collisionFilter: { category: 0x0004, mask: 0x0002 | 0x0004 },
      }
    );
    const a = Math.PI + (Math.random() - 0.5) * Math.PI * 1.9;
    const v = 3 + Math.random() * 10;
    Body.setVelocity(body, { x: Math.cos(a) * v, y: Math.sin(a) * v - 3 });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 1.5);
    Composite.add(engine.world, body);
    newBodies.push({ body, kind: 'splinter', born: now });
  }

  // Dust — pure canvas, no physics
  for (let i = 0; i < 55; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = 1 + Math.random() * 9;
    impactsRef.current.push({
      kind: 'dust',
      x: cx + (Math.random() - 0.5) * 40, y: cy,
      vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5,
      size: 0.8 + Math.random() * 2.5,
      born: now, life: 900 + Math.random() * 900,
    });
  }

  // Trim oldest bodies if over cap
  if (existing + newBodies.length > MAX_SHARDS) {
    const excess = existing + newBodies.length - MAX_SHARDS;
    const removed = shardsRef.current.splice(0, excess);
    removed.forEach(s => Composite.remove(engine.world, s.body));
  }

  return newBodies;
}

// ── Main component ────────────────────────────────────────────────────────────
const ShatterCanvas = forwardRef(function ShatterCanvas(_, ref) {
  const canvasRef  = useRef(null);
  const engineRef  = useRef(null);
  const runnerRef  = useRef(null);
  const rafRef     = useRef(null);
  const fallingRef = useRef([]);
  const shardsRef  = useRef([]);
  const impactsRef = useRef([]);
  const shakeRef   = useRef({ until: 0 });
  const dragRef    = useRef(null); // { body, ox, oy }

  useImperativeHandle(ref, () => ({
    triggerFall(cx, cy, cardWidth, cardHeight, imageSrc) {
      const engine = engineRef.current;
      if (!engine) return;
      const body = Bodies.rectangle(cx, cy, cardWidth, cardHeight, {
        restitution: 0, friction: 0.1, frictionAir: 0.005,
        label: 'fallingCard', collisionFilter: { category: 0x0001, mask: 0x0002 },
      });
      Body.setVelocity(body, { x: (Math.random() - 0.5) * 2.5, y: 1 });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.06);
      Composite.add(engine.world, body);
      const img = new Image();
      img.src = imageSrc;
      fallingRef.current.push({ body, img, w: cardWidth, h: cardHeight, trail: [], crackLines: [], cracked: false });
    },
    clearAll() {
      const engine = engineRef.current;
      if (!engine) return;
      [...fallingRef.current, ...shardsRef.current].forEach(s => Composite.remove(engine.world, s.body));
      fallingRef.current = [];
      shardsRef.current  = [];
      impactsRef.current = [];
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const engine = Engine.create({ gravity: { y: 3.0 } });
    engineRef.current = engine;

    const floor = Bodies.rectangle(canvas.width / 2, canvas.height + 25, canvas.width * 3, 50,
      { isStatic: true, label: 'floor', collisionFilter: { category: 0x0002, mask: 0xFFFF } });
    const wallL = Bodies.rectangle(-25, canvas.height / 2, 50, canvas.height * 2,
      { isStatic: true, label: 'wall',  collisionFilter: { category: 0x0002, mask: 0xFFFF } });
    const wallR = Bodies.rectangle(canvas.width + 25, canvas.height / 2, 50, canvas.height * 2,
      { isStatic: true, label: 'wall',  collisionFilter: { category: 0x0002, mask: 0xFFFF } });
    Composite.add(engine.world, [floor, wallL, wallR]);

    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Card hits floor/wall → shatter
    Events.on(engine, 'collisionStart', (event) => {
      for (const pair of event.pairs) {
        let cardBody = null;
        if (pair.bodyA.label === 'fallingCard' && pair.bodyB.label !== 'fallingCard') cardBody = pair.bodyA;
        if (pair.bodyB.label === 'fallingCard' && pair.bodyA.label !== 'fallingCard') cardBody = pair.bodyB;
        if (!cardBody) continue;

        const idx = fallingRef.current.findIndex(c => c.body === cardBody);
        if (idx === -1) continue;
        fallingRef.current.splice(idx, 1);
        Composite.remove(engine.world, cardBody);

        const { x, y } = cardBody.position;
        const newBodies = spawnShatter(engine, x, y, shardsRef, impactsRef);
        shardsRef.current = [...shardsRef.current, ...newBodies];

        shakeRef.current.until = performance.now() + 280;

        // Shockwave + flash
        const now = performance.now();
        impactsRef.current.push({ kind: 'shockwave', x, y, born: now, life: 500, maxR: 130 });
        impactsRef.current.push({ kind: 'flash',     x, y, born: now, life: 220 });
      }
    });

    // ── Mouse drag for shards ─────────────────────────────────────────────
    const DRAG_RADIUS = 60;

    const onDown = (e) => {
      const mx = e.clientX ?? e.touches?.[0]?.clientX;
      const my = e.clientY ?? e.touches?.[0]?.clientY;
      if (mx == null) return;

      let closest = null, closestDist = DRAG_RADIUS;
      for (const s of shardsRef.current) {
        const d = Math.hypot(mx - s.body.position.x, my - s.body.position.y);
        if (d < closestDist) { closest = s; closestDist = d; }
      }
      if (closest) {
        dragRef.current = {
          body: closest.body,
          ox: mx - closest.body.position.x,
          oy: my - closest.body.position.y,
        };
        Body.setStatic(closest.body, true); // freeze while held
      }
    };

    const onMove = (e) => {
      if (!dragRef.current) return;
      const mx = e.clientX ?? e.touches?.[0]?.clientX;
      const my = e.clientY ?? e.touches?.[0]?.clientY;
      if (mx == null) return;
      const { body, ox, oy } = dragRef.current;
      Body.setPosition(body, { x: mx - ox, y: my - oy });
    };

    const onUp = (e) => {
      if (!dragRef.current) return;
      const { body } = dragRef.current;
      Body.setStatic(body, false);
      // Give it a gentle release velocity
      const mx = e.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
      const my = e.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
      Body.setVelocity(body, {
        x: (mx - body.position.x - dragRef.current.ox) * 0.1,
        y: (my - body.position.y - dragRef.current.oy) * 0.1,
      });
      dragRef.current = null;
    };

    window.addEventListener('mousedown',  onDown);
    window.addEventListener('mousemove',  onMove);
    window.addEventListener('mouseup',    onUp);
    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove',  onMove, { passive: true });
    window.addEventListener('touchend',   onUp);

    // ── Draw loop ─────────────────────────────────────────────────────────
    const TRAIL = 7;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const now = performance.now();

      // Camera shake
      let sx = 0, sy = 0;
      if (now < shakeRef.current.until) {
        const t   = (shakeRef.current.until - now) / 280;
        const mag = 6 * t;
        sx = (Math.random() - 0.5) * mag;
        sy = (Math.random() - 0.5) * mag;
      }
      ctx.save();
      ctx.translate(sx, sy);

      // ── Falling cards ─────────────────────────────────────────────────
      for (const card of fallingRef.current) {
        const { body, img, w, h, trail } = card;
        const { x, y } = body.position;
        const a = body.angle;
        const spd = Math.hypot(body.velocity.x, body.velocity.y);

        trail.push({ x, y, a });
        if (trail.length > TRAIL) trail.shift();

        // Motion-blur ghost trail
        for (let t = 0; t < trail.length - 1; t++) {
          const pt = trail[t];
          ctx.save();
          ctx.globalAlpha = ((t + 1) / trail.length) * 0.15;
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.a);
          rrPath(ctx, -w / 2, -h / 2, w, h, 10);
          ctx.fillStyle = 'rgba(60,120,220,0.5)';
          ctx.fill();
          ctx.restore();
        }

        // Crack lines appear in last 30% of fall
        const dist = canvas.height - y;
        if (!card.cracked && dist < canvas.height * 0.30) {
          card.cracked = true;
          const n = 5 + Math.floor(Math.random() * 5);
          for (let i = 0; i < n; i++) {
            card.crackLines.push({
              a:   Math.random() * Math.PI * 2,
              len: (0.3 + Math.random() * 0.5) * Math.min(w, h),
            });
          }
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);

        // Glass card
        drawGlassCard(ctx, img, w, h, a, spd);

        // Crack overlay
        if (card.crackLines.length) {
          const progress = Math.max(0, 1 - dist / (canvas.height * 0.30));
          rrPath(ctx, -w / 2, -h / 2, w, h, 10);
          ctx.save();
          ctx.clip();
          ctx.strokeStyle = `rgba(210,235,255,${0.1 + progress * 0.55})`;
          ctx.lineWidth   = 0.9;
          const cx0 = (Math.random() - 0.5) * w * 0.25;
          const cy0 = (Math.random() - 0.5) * h * 0.25;
          for (const cl of card.crackLines) {
            ctx.beginPath();
            ctx.moveTo(cx0, cy0);
            ctx.lineTo(cx0 + Math.cos(cl.a) * cl.len, cy0 + Math.sin(cl.a) * cl.len);
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.restore();
      }

      // ── Persistent glass shards (no fade) ────────────────────────────
      for (const shard of shardsRef.current) {
        // Drag highlight
        const isDragged = dragRef.current?.body === shard.body;
        ctx.save();
        if (isDragged) {
          ctx.shadowColor = 'rgba(180,230,255,0.8)';
          ctx.shadowBlur  = 18;
        }
        drawShard(ctx, shard.body, shard.kind);
        ctx.restore();
      }

      // ── Canvas-only impact effects ────────────────────────────────────
      const alive = [];
      for (const fx of impactsRef.current) {
        const age  = now - fx.born;
        const fade = Math.max(0, 1 - age / fx.life);
        if (fade <= 0) continue;
        alive.push(fx);

        if (fx.kind === 'dust') {
          fx.x  += fx.vx * 0.9;
          fx.y  += fx.vy * 0.9;
          fx.vy += 0.28;
          fx.vx *= 0.97;
          ctx.save();
          ctx.globalAlpha = fade * 0.75;
          ctx.fillStyle   = 'rgba(200,235,255,1)';
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, fx.size * (1 - age / fx.life * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

        } else if (fx.kind === 'shockwave') {
          const t  = age / fx.life;
          const rr = fx.maxR * t;
          ctx.save();
          ctx.globalAlpha = fade * 0.65;
          ctx.strokeStyle = 'rgba(200,235,255,1)';
          ctx.lineWidth   = 2.8 * (1 - t);
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, rr, 0, Math.PI * 2);
          ctx.stroke();
          if (t > 0.12) {
            ctx.globalAlpha = fade * 0.3;
            ctx.lineWidth   = 1.6 * (1 - t);
            ctx.beginPath();
            ctx.arc(fx.x, fx.y, fx.maxR * (t - 0.12), 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();

        } else if (fx.kind === 'flash') {
          ctx.save();
          ctx.globalAlpha = fade * 0.9;
          const gr = ctx.createRadialGradient(fx.x, fx.y, 0, fx.x, fx.y, 90);
          gr.addColorStop(0, 'rgba(230,248,255,1)');
          gr.addColorStop(1, 'rgba(120,200,255,0)');
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, 90, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      impactsRef.current = alive;

      ctx.restore(); // end shake
      rafRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousedown',  onDown);
      window.removeEventListener('mousemove',  onMove);
      window.removeEventListener('mouseup',    onUp);
      window.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onUp);
      cancelAnimationFrame(rafRef.current);
      Events.off(engine);
      Runner.stop(runner);
      Engine.clear(engine);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        zIndex: 999,
      }}
    />
  );
});

export default ShatterCanvas;
