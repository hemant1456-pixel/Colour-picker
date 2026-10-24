import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Palette } from '../types/palette';

const STORAGE_KEY = 'smart-colour-studio.palettes.v1';
export const CURRENT_PALETTE_KEY = 'smart-colour-studio.current-palette.v1';
export const ACTIVE_PALETTE_KEY = 'smart-colour-studio.active-palette.v1';

async function readPalettes(): Promise<Palette[]> {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) as Palette[] : [];
}

export function useSavedPalettes() {
    const [palettes, setPalettes] = useState<Palette[]>([]);
    const [ready, setReady] = useState(false);

    const reload = useCallback(async () => {
        try {
            setPalettes(await readPalettes());
        } catch {
            setPalettes([]);
        } finally {
            setReady(true);
        }
    }, []);

    useEffect(() => { void reload(); }, [reload]);

    const save = useCallback(async (palette: Palette) => {
        const stored = await readPalettes();
        const updated = [palette, ...stored.filter((item) => item.id !== palette.id)];
        setPalettes(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, []);

    const remove = useCallback(async (id: string) => {
        const updated = (await readPalettes()).filter((palette) => palette.id !== id);
        setPalettes(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, []);

    const rename = useCallback(async (id: string, name: string) => {
        const updated = (await readPalettes()).map((palette) => palette.id === id ? { ...palette, name: name.trim() || palette.name } : palette);
        setPalettes(updated);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }, []);

    const load = useCallback(async (palette: Palette) => {
        await AsyncStorage.setItem(CURRENT_PALETTE_KEY, JSON.stringify(palette));
    }, []);

    return { palettes, ready, save, remove, rename, load, reload };
}