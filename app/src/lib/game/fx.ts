export type SoundName = 'tap' | 'buy' | 'kill' | 'hatch' | 'evolve' | 'warn' | 'shock' | 'collect' | 'pass' | 'transcend';

/**
 * Effets de bord déclenchés par la logique de jeu. La logique reste pure et testable :
 * elle signale ce qui doit être annoncé ou joué, l'interface décide comment.
 */
export interface Fx {
  toast(message: string): void;
  sound(name: SoundName): void;
}

/** Fx silencieux, utile par défaut et dans les tests. */
export const silentFx: Fx = { toast() {}, sound() {} };

/** Fx qui enregistre tout, pour les tests. */
export function recordingFx(): Fx & { toasts: string[]; sounds: SoundName[] } {
  const toasts: string[] = [];
  const sounds: SoundName[] = [];
  return { toasts, sounds, toast: (m) => void toasts.push(m), sound: (s) => void sounds.push(s) };
}
