import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { normalizeHex } from '@/src/utils/colorUtils';
import { useAppTheme } from '@/src/hooks/useAppTheme';

function luminance(hex: string) {
    const channels = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2);
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export default function ContrastScreen() {
    const appTheme = useAppTheme();
    const [foreground, setForeground] = useState('#26243A');
    const [background, setBackground] = useState('#FFFFFF');
    const fg = normalizeHex(foreground);
    const bg = normalizeHex(background);
    const ratio = fg && bg ? (Math.max(luminance(fg), luminance(bg)) + 0.05) / (Math.min(luminance(fg), luminance(bg)) + 0.05) : 0;
    const result = (pass: boolean) => <Text style={[styles.result, { color: pass ? '#388157' : '#B84C4C' }]}>{pass ? 'PASS' : 'FAIL'}</Text>;
    return <ScrollView style={[styles.page, appTheme.dark && styles.pageDark]} contentContainerStyle={styles.content}>
        <Link href="/(tabs)/settings" asChild><Pressable style={styles.back}><Text style={styles.backText}>‹  Settings</Text></Pressable></Link>
        <Text style={styles.kicker}>ACCESSIBILITY TOOL</Text><Text style={[styles.title, appTheme.dark && styles.titleDark]}>Contrast checker</Text><Text style={[styles.subtitle, appTheme.dark && styles.subtitleDark]}>Check text legibility against WCAG contrast guidance.</Text>
        <View style={[styles.sample, { backgroundColor: bg || '#FFFFFF' }]}><Text style={[styles.sampleText, { color: fg || '#26243A' }]}>Aa  Readable by design</Text><Text style={[styles.sampleSmall, { color: fg || '#26243A' }]}>Small text preview · 14 px</Text></View>
        <View style={styles.fields}>{[[foreground, setForeground, 'FOREGROUND'], [background, setBackground, 'BACKGROUND']].map(([value, setter, label]) => <View key={label as string} style={styles.field}><Text style={styles.label}>{label as string}</Text><View style={styles.fieldContent}><View style={[styles.dot, { backgroundColor: normalizeHex(value as string) || '#EEEEEE' }]} /><TextInput accessibilityLabel={`${label} HEX`} value={value as string} onChangeText={setter as (text: string) => void} maxLength={7} autoCapitalize="characters" style={styles.input} /></View></View>)}</View>
        {(!fg || !bg) ? <Text style={styles.invalid}>Enter valid six-digit HEX colours.</Text> : <View style={styles.resultBox}><Text style={styles.ratio}>{ratio.toFixed(2)}:1</Text><Text style={styles.ratioLabel}>CONTRAST RATIO</Text><View style={styles.checkRow}><Text style={styles.checkLabel}>AA · normal text</Text>{result(ratio >= 4.5)}</View><View style={styles.checkRow}><Text style={styles.checkLabel}>AA · large text</Text>{result(ratio >= 3)}</View><View style={styles.checkRow}><Text style={styles.checkLabel}>AAA · normal text</Text>{result(ratio >= 7)}</View><View style={styles.checkRow}><Text style={styles.checkLabel}>AAA · large text</Text>{result(ratio >= 4.5)}</View>{ratio < 4.5 && <Text style={styles.explain}>Increase the difference in lightness between these colours to improve readability.</Text>}</View>}
    </ScrollView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F7F7FA' }, pageDark: { backgroundColor: '#17171D' }, content: { padding: 22, maxWidth: 620, width: '100%', alignSelf: 'center' }, back: { marginBottom: 17 }, backText: { color: '#5147B7', fontSize: 12, fontWeight: '600' }, kicker: { color: '#8D8B98', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }, title: { color: '#201F2A', fontSize: 23, fontWeight: '700', marginTop: 5 }, titleDark: { color: '#F4F3F8' }, subtitle: { color: '#777784', fontSize: 12, lineHeight: 18, marginTop: 5, marginBottom: 18 }, subtitleDark: { color: '#B1AFBB' }, sample: { minHeight: 105, borderRadius: 12, borderWidth: 1, borderColor: '#E9E8EF', padding: 17, justifyContent: 'center' }, sampleText: { fontSize: 23, fontWeight: '700' }, sampleSmall: { fontSize: 12, marginTop: 6 }, fields: { flexDirection: 'row', gap: 10, marginTop: 15 }, field: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 11, borderWidth: 1, borderColor: '#EBEAF0' }, label: { color: '#9694A0', fontSize: 8, fontWeight: '700', letterSpacing: 1 }, fieldContent: { flexDirection: 'row', alignItems: 'center', marginTop: 8 }, dot: { width: 20, height: 20, borderRadius: 6, marginRight: 8 }, input: { color: '#282733', fontWeight: '700', flex: 1, padding: 0 }, resultBox: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#EBEAF0', marginTop: 14, padding: 16 }, ratio: { color: '#292737', fontSize: 27, fontWeight: '700' }, ratioLabel: { color: '#9896A2', fontSize: 8, letterSpacing: 1, fontWeight: '700', marginBottom: 12 }, checkRow: { minHeight: 36, borderTopWidth: 1, borderTopColor: '#F0EFF3', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, checkLabel: { color: '#4F4D59', fontSize: 11 }, result: { fontSize: 9, fontWeight: '800', letterSpacing: 0.8 }, explain: { color: '#777784', fontSize: 10, lineHeight: 15, marginTop: 12 }, invalid: { color: '#B84C4C', fontSize: 11, marginTop: 12 } });