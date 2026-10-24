import { hexToHsl, hslToHex, normalizeHex } from './colorUtils';
import type { Harmony, Palette } from '../types/palette';

export const harmonies: Harmony[] = ['Complementary', 'Analogous', 'Triadic', 'Split', 'Mono'];

export function makePalette(baseColor: string, harmony: Harmony, hueShift = 0): string[] {
  const base = hexToHsl(normalizeHex(baseColor) ?? '#5B55D9');
  base.h = (base.h + hueShift + 360) % 360;
  const offsets: Record<Harmony, number[]> = {
    Complementary: [0, 180, 0, 180, 0],
    Analogous: [-48, -24, 0, 24, 48],
    Triadic: [0, 120, 240, 120, 240],
    Split: [0, 150, 210, 150, 210],
    Mono: [0, 0, 0, 0, 0],
  };
  return offsets[harmony].map((offset, index) => {
    const lightness = harmony === 'Mono' ? [34, 46, 58, 70, 82][index] : Math.max(28, Math.min(78, base.l + [0, 12, -10, 20, -18][index]));
    const saturation = harmony === 'Mono' ? base.s : Math.max(30, Math.min(88, base.s + [0, -8, 6, -12, 10][index]));
    return hslToHex({ h: base.h + offset, s: saturation, l: lightness });
  });
}

export function createPalette(colors: string[], harmony: Harmony, name = 'Untitled palette'): Palette {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name, colors, harmony, createdAt: Date.now() };
}