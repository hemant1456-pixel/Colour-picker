import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { makePalette } from '@/src/utils/paletteUtils';
import { useAppTheme } from '@/src/hooks/useAppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ACTIVE_PALETTE_KEY } from '@/src/hooks/useSavedPalettes';

export default function PreviewScreen() {
    const appTheme = useAppTheme();
    const [dark, setDark] = useState(false);
    const [colors, setColors] = useState(() => makePalette('#6558D3', 'Analogous'));
    useFocusEffect(useCallback(() => {
        let active = true;
        void AsyncStorage.getItem(ACTIVE_PALETTE_KEY).then((stored) => {
            if (!active || !stored) return;
            const palette = JSON.parse(stored) as { colors?: string[] };
            if (palette.colors?.length) setColors(palette.colors);
        }).catch(() => undefined);
        return () => { active = false; };
    }, []));
    const surface = dark ? '#17171D' : '#FFFFFF';
    const page = dark ? '#222229' : '#F1F1F5';
    const text = dark ? '#F5F4FA' : '#252430';
    return (
        <ScrollView style={[styles.page, { backgroundColor: appTheme.dark ? '#17171D' : '#F7F7FA' }]} contentContainerStyle={styles.content}>
            <View style={styles.header}><View><Text style={styles.kicker}>LIVE CANVAS</Text><Text style={[styles.title, appTheme.dark && styles.titleDark]}>Design preview</Text></View><View style={styles.mode}><Text style={styles.modeText}>{dark ? 'Dark' : 'Light'}</Text><Switch accessibilityLabel="Toggle dark preview" value={dark} onValueChange={setDark} trackColor={{ true: colors[0] }} /></View></View>
            <View style={[styles.browser, { backgroundColor: page }]}>
                <View style={[styles.nav, { backgroundColor: surface }]}><Text style={[styles.brand, { color: colors[0] }]}>north.</Text><Text style={[styles.navLinks, { color: text }]}>Studio     Journal     About</Text><View style={[styles.navButton, { backgroundColor: colors[0] }]}><Text style={styles.navButtonText}>Let’s talk</Text></View></View>
                <View style={[styles.hero, { backgroundColor: colors[0] }]}><Text style={styles.heroLabel}>INDEPENDENT CREATIVE STUDIO</Text><Text style={styles.heroTitle}>Make room{'\n'}for good ideas.</Text><Text style={styles.heroCopy}>We build thoughtful digital experiences for people moving the world forward.</Text><View style={styles.buttonRow}><View style={[styles.primary, { backgroundColor: colors[2] }]}><Text style={[styles.primaryText, { color: dark ? '#17171D' : '#FFFFFF' }]}>Explore our work</Text></View><View style={styles.secondary}><Text style={styles.secondaryText}>Our approach  ↗</Text></View></View></View>
                <View style={[styles.cards, { backgroundColor: surface }]}><Text style={[styles.cardEyebrow, { color: colors[1] }]}>SELECTED WORK</Text><View style={styles.cardRow}><View style={[styles.card, { backgroundColor: colors[3] }]}><Text style={[styles.cardTitle, { color: text }]}>Form & function</Text><Text style={styles.cardCopy}>Brand systems · 2025</Text></View><View style={[styles.card, { backgroundColor: colors[4] }]}><Text style={[styles.cardTitle, { color: text }]}>A quieter web</Text><Text style={styles.cardCopy}>Digital product · 2025</Text></View></View></View>
            </View>
            <Text style={styles.caption}>Palette applied to a sample studio website</Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F7F7FA' }, content: { padding: 22, maxWidth: 760, width: '100%', alignSelf: 'center' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, kicker: { color: '#8D8B98', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }, title: { color: '#201F2A', fontSize: 23, fontWeight: '700', marginTop: 4 }, titleDark: { color: '#F4F3F8' }, mode: { flexDirection: 'row', alignItems: 'center', gap: 8 }, modeText: { color: '#65636F', fontSize: 12 }, browser: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E4EB' }, nav: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 }, brand: { fontSize: 17, fontWeight: '800' }, navLinks: { fontSize: 8, fontWeight: '600' }, navButton: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 7 }, navButtonText: { fontSize: 8, color: '#FFFFFF', fontWeight: '700' }, hero: { padding: 24 }, heroLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 8, fontWeight: '700', letterSpacing: 1.4 }, heroTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 32, lineHeight: 36, marginTop: 12 }, heroCopy: { color: 'rgba(255,255,255,0.85)', fontSize: 11, lineHeight: 17, maxWidth: 300, marginTop: 10 }, buttonRow: { flexDirection: 'row', gap: 8, marginTop: 18 }, primary: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 7 }, primaryText: { fontWeight: '700', fontSize: 9 }, secondary: { borderColor: 'rgba(255,255,255,0.55)', borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 7 }, secondaryText: { color: '#FFFFFF', fontSize: 9, fontWeight: '600' }, cards: { padding: 15 }, cardEyebrow: { fontSize: 8, fontWeight: '800', letterSpacing: 1.4, marginBottom: 10 }, cardRow: { flexDirection: 'row', gap: 9 }, card: { flex: 1, minHeight: 90, borderRadius: 8, padding: 11, justifyContent: 'flex-end' }, cardTitle: { fontSize: 12, fontWeight: '700' }, cardCopy: { color: '#777784', fontSize: 8, marginTop: 4 }, caption: { color: '#9A98A5', fontSize: 10, textAlign: 'center', marginTop: 12 } });