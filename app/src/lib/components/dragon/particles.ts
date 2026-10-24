import type { Lineage } from '#lib/game/constants.ts';

interface Particle {
  kind: 'burst' | 'ambient' | 'wave';
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
}

const MAX_PARTICLES = 260;

/**
 * Particules d'ambiance propres à chaque lignée (braises, neige, spores, fumée, poussière,
 * éclairs) et gerbes au toucher. Dessinées en mode additif sur un canevas transparent.
 */
export class ParticleLayer {
  private particles: Particle[] = [];
  private sprites = new Map<string, HTMLCanvasElement>();
  private raf = 0;
  private last = 0;
  private lastFrame = 0;
  private boltTimer = 2;
  private bolt: { pts: [number, number][]; life: number } | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private lineage: () => Lineage
  ) {
    this.raf = requestAnimationFrame(this.frame);
  }

  private sprite(color: string): HTMLCanvasElement {
    let s = this.sprites.get(color);
    if (s) return s;
    s = document.createElement('canvas');
    s.width = s.height = 32;
    const g = s.getContext('2d')!;
    const r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    r.addColorStop(0, color);
    r.addColorStop(1, color + '00');
    g.fillStyle = r;
    g.fillRect(0, 0, 32, 32);
    this.sprites.set(color, s);
    return s;
  }

  private emit(p: Omit<Particle, 'max'>): void {
    if (this.particles.length < MAX_PARTICLES) this.particles.push({ ...p, max: p.life });
  }

  /** Gerbe d'étincelles au point touché (coordonnées relatives au canevas, en px). */
  burst(x: number, y: number): void {
    const color = this.lineage().burst;
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 120;
      this.emit({ kind: 'burst', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 30, life: 0.5 + Math.random() * 0.4, size: 5 + Math.random() * 6, color });
    }
  }

  private ambient(W: number, H: number): void {
    const R = Math.random;
    const q = R();
    switch (this.lineage().fx) {
      case 'ember':
        if (q < 0.18) this.emit({ kind: 'ambient', x: R() * W, y: H + 6, vx: (R() - 0.5) * 14, vy: -(30 + R() * 50), life: 4 + R() * 3, size: 3 + R() * 3, color: '#ff9a3a' });
        break;
      case 'snow':
        if (q < 0.25) this.emit({ kind: 'ambient', x: R() * W, y: -6, vx: (R() - 0.3) * 30, vy: 25 + R() * 35, life: 7, size: 2 + R() * 3, color: '#e6f6ff' });
        break;
      case 'spore':
        if (q < 0.15) this.emit({ kind: 'wave', x: R() * W, y: H + 6, vx: 0, vy: -(18 + R() * 30), life: 7, size: 3 + R() * 4, color: '#8dff8a' });
        break;
      case 'smoke':
        if (q < 0.06) this.emit({ kind: 'ambient', x: R() * W, y: H + 20, vx: (R() - 0.5) * 10, vy: -(14 + R() * 16), life: 8, size: 40 + R() * 50, color: '#6a2030' });
        break;
      case 'dust':
        if (q < 0.15) this.emit({ kind: 'ambient', x: R() * W, y: R() * H, vx: (R() - 0.5) * 10, vy: -(6 + R() * 10), life: 5, size: 2 + R() * 3, color: '#ffe08a' });
        break;
      case 'bolt':
        break;
    }
  }

  private frame = (ms: number): void => {
    this.raf = requestAnimationFrame(this.frame);
    if (ms - this.lastFrame < 33 || document.hidden) return;
    this.lastFrame = ms;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const t = ms / 1000;
    const dt = Math.min(t - this.last, 0.05);
    this.last = t;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.25);
    if (this.canvas.width !== Math.round(W * dpr)) {
      this.canvas.width = Math.round(W * dpr);
      this.canvas.height = Math.round(H * dpr);
    }
    const g = this.canvas.getContext('2d');
    if (!g) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    this.ambient(W, H);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt + (p.kind === 'wave' ? Math.sin(t * 2 + p.max * 9) * 10 * dt : 0);
      p.y += p.vy * dt;
      const r = p.life / p.max;
      g.globalAlpha = Math.max(0, Math.min(1, r * 2, (1 - r) * 4 + 0.15)) * 0.9;
      g.drawImage(this.sprite(p.color), p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
    }
    g.globalAlpha = 1;
    this.drawBolt(g, W, H, dt);
  };

  /** Lignée de la foudre : un éclair zèbre le portrait de temps à autre. */
  private drawBolt(g: CanvasRenderingContext2D, W: number, H: number, dt: number): void {
    this.boltTimer -= dt;
    if (this.lineage().fx === 'bolt' && this.boltTimer <= 0) {
      this.boltTimer = 1.2 + Math.random() * 2.6;
      let x = W * (0.2 + Math.random() * 0.6);
      let y = 0;
      const pts: [number, number][] = [[x, 0]];
      const target = H * (0.35 + Math.random() * 0.4);
      while (y < target) {
        y += H * 0.07 + Math.random() * H * 0.05;
        x += (Math.random() - 0.5) * W * 0.12;
        pts.push([x, y]);
      }
      this.bolt = { pts, life: 0.2 };
    }
    if (!this.bolt) return;
    this.bolt.life -= dt;
    if (this.bolt.life <= 0) {
      this.bolt = null;
      return;
    }
    const a = this.bolt.life / 0.2;
    g.globalAlpha = a * 0.16;
    g.fillStyle = '#b99bff';
    g.fillRect(0, 0, W, H);
    g.globalAlpha = a;
    g.strokeStyle = '#e8dcff';
    g.lineWidth = 2;
    g.shadowColor = '#9a6bff';
    g.shadowBlur = 14;
    g.beginPath();
    this.bolt.pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.stroke();
    g.shadowBlur = 0;
    g.globalAlpha = 1;
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    this.particles = [];
  }
}
