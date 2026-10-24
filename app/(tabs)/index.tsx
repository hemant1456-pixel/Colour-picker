import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ColorPicker, { HueSlider, Panel1 } from 'reanimated-color-picker';
import { Dices, Download, ImagePlus, LockKeyhole, RotateCcw, Share2, Shuffle, UnlockKeyhole } from 'lucide-react-native';
import { formatColor, normalizeHex, parseColor, type ColorFormat } from '@/src/utils/colorUtils';
import { makePalette, harmonies } from '@/src/utils/paletteUtils';
import { bytesToBase64, makePalettePng, toCssVariables, toPaletteJson } from '@/src/utils/exportUtils';
import { extractDominantColors } from '@/src/utils/imageColorUtils';
import type { Harmony } from '@/src/types/palette';
import { createPalette } from '@/src/utils/paletteUtils';
import { ACTIVE_PALETTE_KEY, CURRENT_PALETTE_KEY, useSavedPalettes } from '@/src/hooks/useSavedPalettes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppTheme } from '@/src/hooks/useAppTheme';

const ink = '#201F2A';
const muted = '#777784';

export default function ExploreScreen() {
  const { dark } = useAppTheme();
  const [baseColor, setBaseColor] = useState('#6558D3');
  const [input, setInput] = useState('#6558D3');
  const [inputFormat, setInputFormat] = useState<ColorFormat>('HEX');
  const [harmony, setHarmony] = useState<Harmony>('Analogous');
  const [copied, setCopied] = useState('');
  const [seed, setSeed] = useState(0);
  const [lockedColors, setLockedColors] = useState<Array<string | null>>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [paletteName, setPaletteName] = useState('My colour story');
  const [imageColors, setImageColors] = useState<string[]>([]);
  const [imageBusy, setImageBusy] = useState(false);
  const { save } = useSavedPalettes();
  const generatedColors = makePalette(baseColor, harmony, seed);
  const colors = (imageColors.length ? imageColors : generatedColors).map((color, index) => lockedColors[index] ?? color);

  useEffect(() => {
    void AsyncStorage.setItem(ACTIVE_PALETTE_KEY, JSON.stringify({ colors, harmony, name: paletteName }));
  }, [colors, harmony, paletteName]);

  useFocusEffect(useCallback(() => {
    let active = true;
    void AsyncStorage.getItem(CURRENT_PALETTE_KEY).then(async (stored) => {
      if (!active || !stored) return;
      const palette = JSON.parse(stored) as { colors: string[]; harmony: Harmony; name: string };
      const firstColor = palette.colors[0] ?? '#6558D3';
      setBaseColor(firstColor);
      setInput(formatColor(firstColor, inputFormat));
      setHarmony(palette.harmony);
      setPaletteName(palette.name);
      setImageColors(palette.colors);
      setLockedColors([]);
      setSeed(0);
      await AsyncStorage.removeItem(CURRENT_PALETTE_KEY);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [inputFormat]));

  const applyInput = (value: string) => {
    setInput(value);
    const parsed = parseColor(value, inputFormat);
    if (parsed) {
      setBaseColor(parsed);
      setImageColors([]);
    }
  };

  const changeInputFormat = (format: ColorFormat) => {
    setInputFormat(format);
    setInput(formatColor(baseColor, format));
  };

  const toggleLock = (index: number) => {
    setLockedColors((current) => {
      const next = [...current];
      next[index] = next[index] ? null : colors[index];
      return next;
    });
  };

  const copyColor = async (color: string) => {
    await Clipboard.setStringAsync(color);
    setCopied(color);
    setTimeout(() => setCopied(''), 1400);
  };

  const saveCurrentPalette = async () => {
    await save(createPalette(colors, harmony, paletteName.trim() || `${harmony} palette`));
    setSavedMessage('Saved to your collection');
    setTimeout(() => setSavedMessage(''), 1800);
  };

  const resetPalette = () => {
    setBaseColor('#6558D3');
    setInput(formatColor('#6558D3', inputFormat));
    setHarmony('Analogous');
    setSeed(0);
    setLockedColors([]);
  };

  const randomPalette = () => {
    const random = `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, '0')}`.toUpperCase();
    setBaseColor(random);
    setInput(formatColor(random, inputFormat));
    setSeed(Math.floor(Math.random() * 360));
    setLockedColors([]);
    setImageColors([]);
  };

  const showFeedback = (message: string) => {
    setSavedMessage(message);
    setTimeout(() => setSavedMessage(''), 2200);
  };

  const chooseImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showFeedback('Photo library permission is needed to extract colours.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
      if (result.canceled || !result.assets[0]) return;
      setImageBusy(true);
      const normalized = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 72, height: 72 } }], { base64: true, format: ImageManipulator.SaveFormat.PNG });
      if (!normalized.base64) throw new Error('The selected image could not be read.');
      const extracted = extractDominantColors(normalized.base64, 5);
      if (!extracted.length) throw new Error('No visible colours were found in that image.');
      setImageColors(extracted);
      setBaseColor(extracted[0]);
      setInput(formatColor(extracted[0], inputFormat));
      setLockedColors([]);
      setPaletteName('Image palette');
      showFeedback(`${extracted.length} colours extracted`);
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Could not read that image. Try a JPEG or PNG.');
    } finally {
      setImageBusy(false);
    }
  };

  const exportJson = async () => {
    const json = toPaletteJson(createPalette(colors, harmony, paletteName));
    try {
      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(json);
        showFeedback('Palette JSON copied');
        return;
      }
      const uri = `${FileSystem.cacheDirectory}smart-colour-palette.json`;
      await FileSystem.writeAsStringAsync(uri, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: 'Share palette JSON' });
    } catch {
      showFeedback('Could not export JSON. Try sharing the palette instead.');
    }
  };

  const exportPng = async () => {
    try {
      const png = makePalettePng(createPalette(colors, harmony, paletteName));
      if (Platform.OS === 'web') {
        const blob = new Blob([new Uint8Array(png).buffer as ArrayBuffer], { type: 'image/png' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'smart-colour-palette.png';
        anchor.click();
        URL.revokeObjectURL(url);
        showFeedback('Palette PNG downloaded');
        return;
      }
      const uri = `${FileSystem.cacheDirectory}smart-colour-palette.png`;
      await FileSystem.writeAsStringAsync(uri, bytesToBase64(png), { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share palette image' });
    } catch {
      showFeedback('Could not create the PNG export.');
    }
  };

  const exportCss = async () => {
    await Clipboard.setStringAsync(toCssVariables(createPalette(colors, harmony, paletteName)));
    showFeedback('CSS variables copied');
  };

  const sharePalette = async () => {
    const details = toPaletteJson(createPalette(colors, harmony, paletteName));
    if (Platform.OS === 'web') {
      await Clipboard.setStringAsync(details);
      showFeedback('Palette data copied for sharing');
      return;
    }
    await Share.share({ title: paletteName, message: details });
  };

  return (
    <View style={[styles.screen, dark && styles.screenDark]}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topline}>
          <View>
            <Text style={styles.eyebrow}>YOUR CREATIVE WORKSPACE</Text>
            <Text style={[styles.title, dark && styles.textDark]}>Colour studio</Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>CS</Text></View>
        </View>

        <View style={styles.intro}>
          <View style={styles.introText}>
            <Text style={styles.introTitle}>Find your next{'\n'}perfect palette.</Text>
            <Text style={styles.introCopy}>Thoughtful colour, ready for your next idea.</Text>
          </View>
          <View style={styles.miniPalette}>
            {['#6558D3', '#8B83E7', '#C8C3F7', '#F0B77D'].map((color) => <View key={color} style={[styles.miniDot, { backgroundColor: color }]} />)}
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={[styles.sectionTitle, dark && styles.textDark]}>Build a palette</Text>
          <Text style={styles.sectionNote}>01 / COLOUR</Text>
        </View>
        <View style={[styles.inputCard, dark && styles.surfaceDark]}>
          <View style={[styles.colorPreview, { backgroundColor: baseColor }]} />
          <View style={styles.inputCopy}>
            <View style={styles.inputLabelRow}><Text style={styles.inputLabel}>BASE COLOUR</Text><View style={styles.formatChoices}>{(['HEX', 'RGB', 'HSL'] as ColorFormat[]).map((format) => <Pressable key={format} onPress={() => changeInputFormat(format)}><Text style={[styles.formatChoice, inputFormat === format && styles.formatChoiceActive]}>{format}</Text></Pressable>)}</View></View>
            <TextInput accessibilityLabel={`Base colour ${inputFormat} value`} autoCapitalize="characters" value={input} onChangeText={applyInput} style={[styles.hexInput, dark && styles.textDark]} maxLength={inputFormat === 'HEX' ? 7 : 24} placeholder={formatColor('#6558D3', inputFormat)} placeholderTextColor="#A5A4AE" />
          </View>
          <View style={styles.validMark}><Text style={styles.validMarkText}>✓</Text></View>
        </View>
        {!parseColor(input, inputFormat) && <Text style={styles.errorText}>Enter a valid {inputFormat} colour value.</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel={pickerOpen ? 'Close colour picker' : 'Open colour picker'} onPress={() => setPickerOpen((open) => !open)} style={styles.pickerToggle}><Text style={styles.pickerToggleText}>{pickerOpen ? 'Close colour picker' : 'Choose with colour picker'}</Text><Text style={styles.pickerChevron}>{pickerOpen ? '−' : '+'}</Text></Pressable>
        {pickerOpen && <ColorPicker value={baseColor} onChangeJS={({ hex }) => { setBaseColor(hex.toUpperCase()); setInput(formatColor(hex, inputFormat)); }} style={styles.picker}><Panel1 style={styles.pickerPanel} /><HueSlider style={styles.hueSlider} /></ColorPicker>}

        <View style={[styles.sectionHeading, styles.harmonyHeading]}>
          <Text style={[styles.sectionTitle, dark && styles.textDark]}>Colour harmony</Text>
          <Text style={styles.sectionNote}>02 / MOOD</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.harmonyList}>
          {harmonies.map((item) => <Pressable key={item} onPress={() => setHarmony(item)} style={[styles.harmonyChip, dark && styles.surfaceDark, harmony === item && styles.harmonyChipActive]}><Text style={[styles.harmonyText, dark && styles.mutedDark, harmony === item && styles.harmonyTextActive]}>{item}</Text></Pressable>)}
        </ScrollView>

        <View style={styles.paletteHeading}>
          <View style={styles.paletteTitleGroup}><Text style={[styles.sectionTitle, dark && styles.textDark]}>Your colours</Text><Text style={[styles.subtitle, dark && styles.mutedDark]}>{harmony} · {colors.length} considered tones</Text><TextInput accessibilityLabel="Palette name" value={paletteName} onChangeText={setPaletteName} style={[styles.nameInput, dark && styles.mutedDark]} placeholder="Name this palette" /></View>
          <View style={styles.paletteActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="Save palette" onPress={saveCurrentPalette} style={styles.saveButton}><Text style={styles.saveText}>Save</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Regenerate unlocked colours" onPress={() => { setSeed(Math.floor(Math.random() * 360)); setImageColors([]); }} style={styles.shuffleButton}><Shuffle size={16} color="#5147B7" /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Generate random palette" onPress={randomPalette} style={styles.shuffleButton}><Dices size={17} color="#5147B7" /></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Reset palette" onPress={resetPalette} style={styles.shuffleButton}><RotateCcw size={16} color="#5147B7" /></Pressable>
          </View>
        </View>
        <View style={styles.swatches}>
          {colors.map((color, index) => <View key={`${index}-${color}`} style={styles.swatch}><Pressable accessibilityRole="button" accessibilityLabel={`Copy colour ${color}`} onPress={() => copyColor(color)}><View style={[styles.swatchColor, { backgroundColor: color }]} /></Pressable><View style={styles.swatchCaption}><Text style={styles.swatchLabel}>{copied === color ? 'COPIED' : color}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${lockedColors[index] ? 'Unlock' : 'Lock'} colour ${index + 1}`} onPress={() => toggleLock(index)} style={styles.lockButton}>{lockedColors[index] ? <LockKeyhole size={13} color="#5147B7" /> : <UnlockKeyhole size={13} color="#9A98A5" />}</Pressable></View></View>)}
        </View>
        <Text style={styles.hint}>Tap a swatch to copy · locked colours stay fixed when regenerated</Text>
        <View style={styles.toolRow}>
          <Pressable accessibilityRole="button" onPress={chooseImage} disabled={imageBusy} style={styles.toolButton}><ImagePlus size={15} color="#5147B7" /><Text style={styles.toolText}>{imageBusy ? 'Reading…' : 'Extract from image'}</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={exportCss} style={styles.toolButton}><Text style={styles.cssIcon}>{'{ }'}</Text><Text style={styles.toolText}>Copy CSS</Text></Pressable>
        </View>
        <View style={styles.toolRow}>
          <Pressable accessibilityRole="button" onPress={exportJson} style={styles.toolButton}><Download size={15} color="#5147B7" /><Text style={styles.toolText}>Export JSON</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={exportPng} style={styles.toolButton}><Download size={15} color="#5147B7" /><Text style={styles.toolText}>Export PNG</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={sharePalette} style={styles.toolButton}><Share2 size={15} color="#5147B7" /><Text style={styles.toolText}>Share</Text></Pressable>
        </View>
        {!!imageColors.length && <View style={styles.extractedRow}><Text style={styles.hint}>Extracted from your image</Text>{imageColors.map((color, index) => <View key={`${index}-${color}`} style={[styles.extractedDot, { backgroundColor: color }]} />)}</View>}
        {!!savedMessage && <Text style={styles.savedMessage}>{savedMessage}</Text>}
        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F7FA' },
  screenDark: { backgroundColor: '#17171D' },
  textDark: { color: '#F4F3F8' },
  mutedDark: { color: '#B1AFBB' },
  surfaceDark: { backgroundColor: '#222229', borderColor: '#34333C' },
  content: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 30, maxWidth: 720, width: '100%', alignSelf: 'center' },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  eyebrow: { color: '#8D8B98', fontSize: 9, fontWeight: '700', letterSpacing: 1.7, marginBottom: 5 },
  title: { color: ink, fontSize: 23, fontWeight: '700' },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E8E6F8', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#5A50B9', fontWeight: '700', fontSize: 12 },
  intro: { minHeight: 156, borderRadius: 16, backgroundColor: '#EEEFFA', padding: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 25, overflow: 'hidden' },
  introText: { flex: 1 },
  introTitle: { fontSize: 23, lineHeight: 28, fontWeight: '700', color: '#29263E', marginBottom: 8 },
  introCopy: { fontSize: 12, lineHeight: 18, color: '#69677A', maxWidth: 210 },
  miniPalette: { flexDirection: 'row', alignItems: 'center', width: 70, height: 105, transform: [{ rotate: '12deg' }] },
  miniDot: { width: 28, height: 80, borderRadius: 18, marginLeft: -10, borderWidth: 2, borderColor: '#EEEFFA' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: ink },
  sectionNote: { fontSize: 9, color: '#A2A0AC', fontWeight: '700', letterSpacing: 1.1 },
  inputCard: { borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEAF0', minHeight: 72, padding: 11, flexDirection: 'row', alignItems: 'center' },
  colorPreview: { width: 48, height: 48, borderRadius: 10, marginRight: 13 },
  inputCopy: { flex: 1 },
  inputLabel: { fontSize: 9, color: '#9A98A5', fontWeight: '700', letterSpacing: 1.2, marginBottom: 4 },
  inputLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  formatChoices: { flexDirection: 'row', gap: 8 },
  formatChoice: { color: '#AAA8B2', fontSize: 8, fontWeight: '700' },
  formatChoiceActive: { color: '#5147B7' },
  hexInput: { fontSize: 16, fontWeight: '700', color: ink, padding: 0, outlineStyle: 'none' as never },
  validMark: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E8F3EC', alignItems: 'center', justifyContent: 'center' },
  validMarkText: { fontSize: 14, color: '#43845D', fontWeight: '700' },
  errorText: { fontSize: 12, color: '#B64747', marginTop: 7 },
  pickerToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, paddingHorizontal: 3 },
  pickerToggleText: { color: '#5147B7', fontSize: 11, fontWeight: '600' },
  pickerChevron: { color: '#5147B7', fontSize: 17 },
  picker: { gap: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EBEAF0', borderRadius: 12, padding: 12, marginBottom: 5 },
  pickerPanel: { height: 140, borderRadius: 8 },
  hueSlider: { height: 24, borderRadius: 12 },
  harmonyHeading: { marginTop: 24 },
  harmonyList: { gap: 8, paddingBottom: 4 },
  harmonyChip: { borderWidth: 1, borderColor: '#E6E4EC', borderRadius: 18, backgroundColor: '#FFFFFF', paddingVertical: 9, paddingHorizontal: 14 },
  harmonyChipActive: { backgroundColor: '#5147B7', borderColor: '#5147B7' },
  harmonyText: { color: '#696775', fontSize: 11, fontWeight: '600' },
  harmonyTextActive: { color: '#FFFFFF' },
  paletteHeading: { marginTop: 25, marginBottom: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  paletteTitleGroup: { flexShrink: 1 },
  paletteActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saveButton: { height: 38, borderRadius: 12, backgroundColor: '#5147B7', paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  subtitle: { color: muted, fontSize: 11, marginTop: 4 },
  nameInput: { color: '#777784', fontSize: 10, marginTop: 4, padding: 0, outlineStyle: 'none' as never },
  shuffleButton: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E9E8EF', alignItems: 'center', justifyContent: 'center' },
  swatches: { flexDirection: 'row', gap: 8 },
  swatch: { flex: 1, minWidth: 0 },
  swatchColor: { height: 90, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(32,31,42,0.06)' },
  swatchCaption: { minHeight: 28, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 2 },
  swatchLabel: { textAlign: 'center', color: '#676571', fontSize: 8, fontWeight: '700', flex: 1 },
  lockButton: { minWidth: 24, height: 28, alignItems: 'center', justifyContent: 'center' },
  hint: { color: '#A19FAC', fontSize: 10, marginTop: 9 },
  toolRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  toolButton: { flex: 1, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E9E8EF', backgroundColor: '#FFFFFF' },
  toolText: { color: '#5147B7', fontSize: 9, fontWeight: '700' },
  cssIcon: { color: '#5147B7', fontSize: 12, fontWeight: '800' },
  extractedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 },
  extractedDot: { width: 18, height: 18, borderRadius: 9 },
  savedMessage: { color: '#43845D', fontSize: 12, fontWeight: '600', marginTop: 8 },
  footerSpace: { height: 20 },
});
