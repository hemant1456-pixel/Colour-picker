import { decode } from 'fast-png';
import { hslToHex } from './colorUtils';

export function extractDominantColors(base64Png: string, limit = 5): string[] {
  const binary = atob(base64Png);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const image = decode(bytes);
  const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();
  const channels = image.channels;
  for (let pixel = 0; pixel < image.width * image.height; pixel += 1) {
    const offset = pixel * channels;
    let red: number;
    let green: number;
    let blue: number;
    let alpha = 255;
    if (channels < 3) {
      red = green = blue = image.data[offset];
      if (channels === 2) alpha = image.data[offset + 1];
    } else {
      red = image.data[offset];
      green = image.data[offset + 1];
      blue = image.data[offset + 2];
      if (channels === 4) alpha = image.data[offset + 3];
    }
    if (alpha < 128) continue;
    const key = [red, green, blue].map((value) => Math.round(value / 32) * 32).join(',');
    const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
    bucket.count += 1;
    bucket.r += red;
    bucket.g += green;
    bucket.b += blue;
    buckets.set(key, bucket);
  }
  return [...buckets.values()]
    .sort((first, second) => second.count - first.count)
    .slice(0, limit)
    .map((bucket) => `#${[bucket.r, bucket.g, bucket.b].map((channel) => Math.round(channel / bucket.count).toString(16).padStart(2, '0')).join('')}`.toUpperCase());
}

export function imagePaletteFallback(): string[] {
  return [0, 72, 144, 216, 288].map((hue) => hslToHex({ h: hue, s: 55, l: 56 }));
}