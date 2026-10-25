import type { SoundName } from '#lib/game/fx.ts';

/**
 * Sons courts synthétisés (Web Audio) pour les actions,
 * et musique d'ambiance depuis un fichier audio.
 */
interface Tone {
  f: number;
  f2?: number;
  w?: OscillatorType;
  du: number;
  v?: number;
  d?: number;
}

interface Noise {
  f?: number;
  f2?: number;
  ft?: BiquadFilterType;
  du?: number;
  v?: number;
  q?: number;
  d?: number;
}

export interface AudioSettings {
  sound: boolean;
  music: boolean;
  haptics: boolean;
  /** Volume des effets sonores, de 0 à 100. */
  volume: number;
  /** Volume de la musique, de 0 à 100. */
  musicVolume: number;
}

export class SoundBoard {
  private ctx: AudioContext | null = null;
  private musicAudio: HTMLAudioElement;

  constructor(private settings: () => AudioSettings) {
    this.musicAudio = new Audio('/audio/ambiance.ogg');
    this.musicAudio.loop = true;
    this.musicAudio.volume = 0;
  }

  private context(): AudioContext | null {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return null;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  private get volume(): number {
    return Math.max(0, Math.min(100, this.settings().volume)) / 100;
  }

  /** Gain de la musique : discret même à 100 %, coupé net à 0 %. */
  private get musicLevel(): number {
    const v = Math.max(0, Math.min(100, this.settings().musicVolume)) / 100;
    return v > 0 ? Math.max(0.008, v * 0.75) : 0;
  }

  /** Applique tout de suite un changement de volume de la musique en cours. */
  updateMusicVolume(): void {
    this.musicAudio.volume = this.musicLevel;
  }

  private tone(o: Tone): void {
    const c = this.context();
    if (!c) return;
    const t = c.currentTime + (o.d || 0);
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = o.w || 'sine';
    osc.frequency.setValueAtTime(o.f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + o.du);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, (o.v || 0.1) * this.volume), t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + o.du);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + o.du + 0.05);
  }

  private noise(o: Noise): void {
    const c = this.context();
    if (!c) return;
    const t = c.currentTime + (o.d || 0);
    const du = o.du || 0.16;
    const n = Math.max(1, Math.floor(c.sampleRate * du));
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 1.6);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = o.ft || 'bandpass';
    filter.frequency.setValueAtTime(o.f || 800, t);
    if (o.f2) filter.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), t + du);
    filter.Q.value = o.q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(Math.max(0.0001, (o.v || 0.08) * this.volume), t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + du);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t);
  }

  vibrate(pattern: number | number[]): void {
    if (!this.settings().haptics) return;
    try {
      navigator.vibrate?.(pattern);
    } catch {
      /* vibration non prise en charge (iPhone notamment) */
    }
  }

  play(name: SoundName): void {
    if (!this.settings().sound) return;
    try {
      this.effects[name]();
    } catch {
      /* audio indisponible : le jeu continue en silence */
    }
  }

  private effects: Record<SoundName, () => void> = {
    tap: () => {
      this.noise({ f: 1400, f2: 2800, du: 0.1, v: 0.035, q: 0.7 });
      if (Math.random() < 0.3) this.tone({ f: 1760, du: 0.08, v: 0.015 });
      this.vibrate(6);
    },
    buy: () => {
      this.tone({ f: 880, du: 0.12, v: 0.07 });
      this.tone({ f: 1318, du: 0.16, v: 0.06, d: 0.07 });
      this.vibrate(10);
    },
    kill: () => {
      this.tone({ f: 523, w: 'triangle', du: 0.12, v: 0.09 });
      this.tone({ f: 659, w: 'triangle', du: 0.12, v: 0.09, d: 0.09 });
      this.tone({ f: 784, w: 'triangle', du: 0.2, v: 0.1, d: 0.18 });
      this.noise({ f: 5200, ft: 'highpass', du: 0.3, v: 0.02 });
      this.vibrate([40, 50, 40]);
    },
    hatch: () => {
      [659, 831, 988].forEach((f, i) => this.tone({ f, du: 0.14, v: 0.09, d: i * 0.11 }));
      this.tone({ f: 1318, du: 0.3, v: 0.11, d: 0.33 });
      this.noise({ f: 5000, ft: 'highpass', du: 0.35, v: 0.02, d: 0.33 });
      this.vibrate([20, 30, 20, 30, 50]);
    },
    evolve: () => {
      [330, 415, 494].forEach((f, i) => this.tone({ f, w: 'triangle', du: 0.16, v: 0.09, d: i * 0.13 }));
      this.tone({ f: 659, w: 'triangle', du: 0.32, v: 0.1, d: 0.39 });
      this.noise({ f: 4000, ft: 'highpass', du: 0.4, v: 0.025, d: 0.39 });
      this.vibrate([20, 40, 60]);
    },
    warn: () => {
      this.tone({ f: 294, w: 'triangle', du: 0.4, v: 0.08 });
      this.tone({ f: 440, w: 'triangle', du: 0.4, v: 0.05 });
      this.vibrate([50, 50, 50]);
    },
    shock: () => {
      this.tone({ f: 110, f2: 55, du: 0.16, v: 0.12 });
      this.noise({ f: 260, ft: 'lowpass', du: 0.25, v: 0.09 });
      this.vibrate([80, 50, 80]);
    },
    collect: () => {
      this.tone({ f: 988, du: 0.16, v: 0.09 });
      this.tone({ f: 1480, du: 0.22, v: 0.08, d: 0.08 });
      this.noise({ f: 6000, ft: 'highpass', du: 0.25, v: 0.02 });
      this.vibrate(15);
    },
    pass: () => {
      this.tone({ f: 659, du: 0.1, v: 0.09 });
      this.tone({ f: 831, du: 0.12, v: 0.09, d: 0.09 });
      this.tone({ f: 988, du: 0.22, v: 0.1, d: 0.18 });
      this.vibrate([30, 40, 60]);
    },
    transcend: () => {
      this.tone({ f: 220, du: 0.6, v: 0.08 });
      this.tone({ f: 330, du: 0.5, v: 0.07, d: 0.1 });
      this.tone({ f: 440, du: 0.5, v: 0.08, d: 0.25 });
      this.tone({ f: 660, du: 0.6, v: 0.09, d: 0.4 });
      this.noise({ f: 4500, ft: 'highpass', du: 0.7, v: 0.02, d: 0.4 });
      this.vibrate([50, 60, 50, 60, 120]);
    }
  };

  /** Démarre la musique (à appeler après un geste de l'utilisateur, exigence des navigateurs). */
  async startMusic(): Promise<void> {
    if (!this.settings().music) return;
    try {
      this.musicAudio.volume = this.musicLevel;
      await this.musicAudio.play();
    } catch {
      this.stopMusic();
    }
  }

  stopMusic(): void {
    this.musicAudio.pause();
    this.musicAudio.currentTime = 0;
  }
}
