import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useSavedPalettes } from '@/src/hooks/useSavedPalettes';
import { useAppTheme } from '@/src/hooks/useAppTheme';

export default function SavedScreen() {
    const { palettes, ready, remove, rename, load, reload } = useSavedPalettes();
    const { dark } = useAppTheme();
    const router = useRouter();
    const [notice, setNotice] = useState('');
    const [editingId, setEditingId] = useState('');
    const [draftName, setDraftName] = useState('');
    useFocusEffect(useCallback(() => { void reload(); }, [reload]));
    const confirmDelete = (id: string, name: string) => {
        const deletePalette = async () => { await remove(id); setNotice('Palette deleted'); setTimeout(() => setNotice(''), 1600); };
        if (Platform.OS === 'web') {
            if (globalThis.confirm(`Delete “${name}” from this device?`)) void deletePalette();
            return;
        }
        Alert.alert('Delete palette?', `“${name}” will be removed from this device.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void deletePalette() }]);
    };
    return <ScrollView style={[styles.page, dark && styles.pageDark]} contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>YOUR COLLECTION</Text><Text style={[styles.title, dark && styles.titleDark]}>Saved palettes</Text><Text style={[styles.subtitle, dark && styles.subtitleDark]}>Colour directions worth keeping.</Text>
        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        {!ready ? <Text style={styles.empty}>Loading your collection…</Text> : palettes.length === 0 ? <View style={styles.emptyBox}><Text style={styles.emptyMark}>＋</Text><Text style={styles.emptyTitle}>A space for good colour.</Text><Text style={styles.emptyText}>Save a palette from Explore and it will stay here on this device.</Text></View> : palettes.map((palette) => <View key={palette.id} style={styles.item}><View style={styles.swatches}>{palette.colors.map((color, index) => <View key={`${palette.id}-${index}`} style={[styles.swatch, { backgroundColor: color }]} />)}</View><View style={styles.row}><View style={styles.info}>{editingId === palette.id ? <TextInput accessibilityLabel="Rename palette" autoFocus value={draftName} onChangeText={setDraftName} style={styles.renameInput} onSubmitEditing={async () => { await rename(palette.id, draftName); setEditingId(''); }} /> : <Text style={styles.name}>{palette.name}</Text>}<Text style={styles.meta}>{palette.harmony} · {new Date(palette.createdAt).toLocaleDateString()}</Text></View><View style={styles.actions}><Pressable accessibilityRole="button" onPress={async () => { await load(palette); router.push('/'); }} style={styles.action}><Text style={styles.actionText}>Use</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Rename ${palette.name}`} onPress={() => { setDraftName(palette.name); setEditingId(palette.id); }} style={styles.action}><Text style={styles.actionText}>Rename</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Delete ${palette.name}`} onPress={() => confirmDelete(palette.id, palette.name)} style={styles.delete}><Text style={styles.deleteText}>Remove</Text></Pressable></View></View>{editingId === palette.id && <Pressable onPress={async () => { await rename(palette.id, draftName); setEditingId(''); }} style={styles.renameSave}><Text style={styles.actionText}>Save name</Text></Pressable>}</View>)}
    </ScrollView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#F7F7FA' }, pageDark: { backgroundColor: '#17171D' }, content: { padding: 22, maxWidth: 720, width: '100%', alignSelf: 'center' }, kicker: { color: '#8D8B98', fontSize: 9, fontWeight: '700', letterSpacing: 1.5 }, title: { color: '#201F2A', fontSize: 23, fontWeight: '700', marginTop: 5 }, titleDark: { color: '#F4F3F8' }, subtitle: { color: '#777784', fontSize: 12, marginTop: 5, marginBottom: 22 }, subtitleDark: { color: '#B1AFBB' }, emptyBox: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#EBEAF0', minHeight: 210, alignItems: 'center', justifyContent: 'center', padding: 24 }, emptyMark: { width: 42, height: 42, textAlign: 'center', textAlignVertical: 'center', color: '#5147B7', backgroundColor: '#EEEFFA', borderRadius: 21, overflow: 'hidden', fontSize: 22 }, emptyTitle: { color: '#201F2A', fontSize: 15, fontWeight: '700', marginTop: 12 }, emptyText: { color: '#777784', fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 6, maxWidth: 240 }, empty: { color: '#777784', fontSize: 12, padding: 18 }, item: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEAF0', borderRadius: 13, padding: 12, marginBottom: 12 }, swatches: { flexDirection: 'row', gap: 5, marginBottom: 12 }, swatch: { flex: 1, height: 54, borderRadius: 7 }, row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, info: { flex: 1 }, name: { color: '#201F2A', fontSize: 13, fontWeight: '700' }, meta: { color: '#898793', fontSize: 10, marginTop: 4 }, actions: { flexDirection: 'row', gap: 5 }, action: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F0EFF8' }, actionText: { color: '#5147B7', fontSize: 9, fontWeight: '700' }, renameInput: { color: '#201F2A', fontSize: 12, fontWeight: '700', borderBottomWidth: 1, borderColor: '#5147B7', paddingVertical: 4 }, renameSave: { alignSelf: 'flex-end', marginTop: 8 }, delete: { paddingVertical: 8, paddingHorizontal: 8, borderRadius: 8, backgroundColor: '#F7F6FA' }, deleteText: { color: '#6B6876', fontSize: 9, fontWeight: '600' }, notice: { color: '#43845D', fontSize: 12, marginBottom: 10 } });