export type Harmony = 'Complementary' | 'Analogous' | 'Triadic' | 'Split' | 'Mono';

export type Palette = {
  id: string;
  name: string;
  colors: string[];
  harmony: Harmony;
  createdAt: number;
};