import { S } from "./state";

let ctx: AudioContext | null = null;

export function beep(f: number, d = 0.08, type: OscillatorType = "square", v = 0.04, slide = 0): void {
  if (S.mute) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = ctx || new AC();
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(t + d);
  } catch { /* audio is optional */ }
}

export const chime = (): void => [520, 660, 880].forEach((f, i) => setTimeout(() => beep(f, 0.12, "triangle", 0.05), i * 90));
