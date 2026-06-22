import { useEffect, useRef } from 'react';

interface Bubble {
  x: number; y: number;
  r: number; dx: number; dy: number;
  opacity: number; color: string;
  phase: number; speed: number;
}

interface Wave {
  points: { x: number; y: number }[];
  dx: number; opacity: number; color: string; width: number;
}

const COLORS_DARK  = ['#6C63FF', '#7FE7C4', '#00D9FF', '#A78BFA'];
const COLORS_LIGHT = ['#4A44B0', '#3BAD8E', '#0099BB', '#7B5FA8'];

export function AnimatedBackground({ light = false }: { light?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const bubblesRef = useRef<Bubble[]>([]);
  const wavesRef   = useRef<Wave[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      init();
    };

    const colors = light ? COLORS_LIGHT : COLORS_DARK;

    const init = () => {
      const W = canvas.width, H = canvas.height;
      // More bubbles + higher opacity in light mode for visibility
      const count   = light ? 24 : 18;
      const opBase  = light ? 0.18 : 0.08;
      const opRange = light ? 0.20 : 0.14;
      bubblesRef.current = Array.from({ length: count }, () => ({
        x:       Math.random() * W,
        y:       Math.random() * H,
        r:       light ? (30 + Math.random() * 80) : (20 + Math.random() * 90),
        dx:      (Math.random() - 0.5) * 0.3,
        dy:      (Math.random() - 0.5) * 0.25,
        opacity: opBase + Math.random() * opRange,
        color:   colors[Math.floor(Math.random() * colors.length)],
        phase:   Math.random() * Math.PI * 2,
        speed:   0.004 + Math.random() * 0.006,
      }));

      // Wave lines alternate between lila and mint for a gradient feel
      const waveColors = light
        ? ['#6C63FF', '#7FE7C4', '#6C63FF', '#7FE7C4']
        : colors;
      wavesRef.current = Array.from({ length: 4 }, (_, wi) => ({
        points: Array.from({ length: 8 }, (_, pi) => ({
          x: (pi / 7) * W,
          y: H * (0.2 + wi * 0.2) + (Math.random() - 0.5) * 80,
        })),
        dx:      (Math.random() - 0.5) * 0.4,
        opacity: light ? (0.14 + Math.random() * 0.14) : (0.06 + Math.random() * 0.1),
        color:   waveColors[wi % waveColors.length],
        width:   light ? (1.5 + Math.random() * 2) : (1 + Math.random() * 1.5),
      }));
    };

    const draw = (t: number) => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, W, H);
      if (light) {
        grad.addColorStop(0,   '#F0EEFF');  // light lila
        grad.addColorStop(0.4, '#E8FBF4');  // light mint
        grad.addColorStop(0.7, '#F5EEFF');  // soft lila
        grad.addColorStop(1,   '#E0FBF2');  // mint
      } else {
        grad.addColorStop(0, '#0D0B1E');
        grad.addColorStop(0.5, '#0F1720');
        grad.addColorStop(1, '#0E1519');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      bubblesRef.current.forEach(b => {
        b.phase += b.speed;
        b.x += b.dx + Math.sin(b.phase) * 0.15;
        b.y += b.dy + Math.cos(b.phase * 0.7) * 0.12;
        if (b.x < -b.r) b.x = W + b.r;
        if (b.x > W + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = H + b.r;
        if (b.y > H + b.r) b.y = -b.r;

        const pulse = 1 + Math.sin(b.phase * 0.5) * 0.04;
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * pulse);
        grd.addColorStop(0, b.color + Math.round(b.opacity * 255).toString(16).padStart(2, '0'));
        grd.addColorStop(1, b.color + '00');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      wavesRef.current.forEach(wave => {
        wave.points.forEach((pt, i) => {
          pt.x += wave.dx;
          pt.y += Math.sin(t * 0.0006 + i * 0.8) * 0.35;
          if (pt.x > W + 100) pt.x = -100;
          if (pt.x < -100) pt.x = W + 100;
        });

        ctx.beginPath();
        ctx.moveTo(wave.points[0].x, wave.points[0].y);
        for (let i = 1; i < wave.points.length - 2; i++) {
          const mx = (wave.points[i].x + wave.points[i + 1].x) / 2;
          const my = (wave.points[i].y + wave.points[i + 1].y) / 2;
          ctx.quadraticCurveTo(wave.points[i].x, wave.points[i].y, mx, my);
        }
        ctx.strokeStyle = wave.color + Math.round(wave.opacity * 255).toString(16).padStart(2, '0');
        ctx.lineWidth = wave.width;
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [light]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}
