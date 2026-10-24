export type Hsl = { h: number; s: number; l: number };
export type Rgb = { r: number; g: number; b: number };
export type ColorFormat = 'HEX' | 'RGB' | 'HSL';

export function normalizeHex(value: string): string | null {
    const raw = value.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(raw)) {
        return `#${raw.split('').map((part) => part + part).join('')}`.toUpperCase();
    }
    return /^[0-9a-f]{6}$/i.test(raw) ? `#${raw}`.toUpperCase() : null;
}

export function hexToHsl(hex: string): Hsl {
    const normalized = normalizeHex(hex) ?? '#5B55D9';
    const r = parseInt(normalized.slice(1, 3), 16) / 255;
    const g = parseInt(normalized.slice(3, 5), 16) / 255;
    const b = parseInt(normalized.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let h = 0;
    const l = (max + min) / 2;
    let s = 0;
    if (delta > 0) {
        s = delta / (1 - Math.abs(2 * l - 1));
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h = (h * 60 + 360) % 360;
    }
    return { h, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: Hsl): string {
    const saturation = Math.max(0, Math.min(100, s)) / 100;
    const lightness = Math.max(0, Math.min(100, l)) / 100;
    const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
    const section = ((h % 360) + 360) % 360 / 60;
    const x = chroma * (1 - Math.abs((section % 2) - 1));
    const [r, g, b] = section < 1 ? [chroma, x, 0] : section < 2 ? [x, chroma, 0] : section < 3 ? [0, chroma, x] : section < 4 ? [0, x, chroma] : section < 5 ? [x, 0, chroma] : [chroma, 0, x];
    const m = lightness - chroma / 2;
    return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function hexToRgb(hex: string): Rgb {
    const normalized = normalizeHex(hex) ?? '#5B55D9';
    return {
        r: parseInt(normalized.slice(1, 3), 16),
        g: parseInt(normalized.slice(3, 5), 16),
        b: parseInt(normalized.slice(5, 7), 16),
    };
}

export function parseColor(value: string, format: ColorFormat): string | null {
    if (format === 'HEX') return normalizeHex(value);
    const numbers = value.match(/-?\d*\.?\d+/g)?.map(Number);
    if (!numbers || numbers.length !== 3 || numbers.some((number) => !Number.isFinite(number))) return null;
    if (format === 'RGB') {
        if (numbers.some((number) => number < 0 || number > 255)) return null;
        return `#${numbers.map((number) => Math.round(number).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    }
    if (numbers[0] < 0 || numbers[0] > 360 || numbers[1] < 0 || numbers[1] > 100 || numbers[2] < 0 || numbers[2] > 100) return null;
    return hslToHex({ h: numbers[0], s: numbers[1], l: numbers[2] });
}

export function formatColor(hex: string, format: ColorFormat): string {
    const normalized = normalizeHex(hex) ?? '#5B55D9';
    if (format === 'HEX') return normalized;
    if (format === 'RGB') {
        const { r, g, b } = hexToRgb(normalized);
        return `rgb(${r}, ${g}, ${b})`;
    }
    const { h, s, l } = hexToHsl(normalized);
    return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}