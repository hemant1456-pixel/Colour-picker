import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

const THEME_KEY = 'smart-colour-studio.theme.v1';
const ThemeContext = createContext<{ dark: boolean; toggleTheme: () => void }>({ dark: false, toggleTheme: () => undefined });

export function AppThemeProvider({ children }: { children: ReactNode }) {
    const [dark, setDark] = useState(false);
    useEffect(() => {
        void AsyncStorage.getItem(THEME_KEY).then((value) => setDark(value === 'dark')).catch(() => undefined);
    }, []);
    const toggleTheme = useCallback(() => {
        setDark((current) => {
            const next = !current;
            void AsyncStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
            return next;
        });
    }, []);
    return <ThemeContext.Provider value={{ dark, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
    return useContext(ThemeContext);
}