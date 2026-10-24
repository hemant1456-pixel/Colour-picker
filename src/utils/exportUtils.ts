import { encode } from 'fast-png';
import type { Palette } from '../types/palette';

export function toCssVariables(palette: Palette): string {
  const names = ['primary', 'secondary', 'accent', 'background', 'text'];
  return palette.colors.map((color, index) => `--color-${names[index] ?? `tone-${index + 1}`}: ${color};`).join('\n');
}

export function toPaletteJson(palette: Palette): string {
  return JSON.stringify({ name: palette.name, harmony: palette.harmony, colors: palette.colors, createdAt: new Date(palette.createdAt).toISOString() }, null, 2);
}

export function makePalettePng(palette: Palette): Uint8Array {
  const width = 1000;
  const height = 320;
  const padding = 24;
  const gap = 12;
  const swatchWidth = Math.floor((width - padding * 2 - gap * (palette.colors.length - 1)) / palette.colors.length);
  const data = new Uint8Array(width * height * 4);
  for (let index = 0; index < width * height; index += 1) data[index * 4 + 3] = 255;
  palette.colors.forEach((color, swatchIndex) => {
    const startX = padding + swatchIndex * (swatchWidth + gap);
    const rgb = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
    for (let y = padding; y < height - padding; y += 1) {
      for (let x = startX; x < startX + swatchWidth; x += 1) {
        const offset = (y * width + x) * 4;
        data[offset] = rgb[0];
        data[offset + 1] = rgb[1];
        data[offset + 2] = rgb[2];
      }
    }
  });
  return encode({ width, height, data, channels: 4, depth: 8 });
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let start = 0; start < bytes.length; start += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(start, start + chunkSize));
  }
  return btoa(binary);
}