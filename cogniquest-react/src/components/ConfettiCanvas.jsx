import React, { useEffect, useRef } from 'react';

export default function ConfettiCanvas({ active }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#60a5fa','#3b82f6','#0ea5e9','#fbbf24','#34d399','#fff'];
    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 3,
      d: Math.random() * 4 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      tiltAngle: 0,
      tiltDelta: Math.random() * 0.07 + 0.05,
      tilt: Math.random() * 10 - 10,
    }));

    let frame = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.beginPath();
        ctx.lineWidth   = p.r;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r / 3, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r);
        ctx.stroke();
        p.tiltAngle += p.tiltDelta;
        p.y   += (Math.cos(frame + p.d) + p.d) * 1.8;
        p.x   += Math.sin(frame) * 1.2;
        p.tilt = Math.sin(p.tiltAngle) * 12;
        if (p.y > canvas.height) { p.x = Math.random() * canvas.width; p.y = -10; }
      });
      frame += 0.04;
      if (frame < 6) animRef.current = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}
    />
  );
}
