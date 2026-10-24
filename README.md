# Smart Colour Studio

An offline-first Expo mobile app for exploring, saving, previewing, and exporting colour palettes. The application uses React Native, Expo Router, TypeScript, and AsyncStorage. Colour math and palette generation are kept in `src/utils` and do not depend on UI components.

## Requirements

- Node.js LTS and npm
- Expo Go on an Android or iOS device for device testing
- An Expo account and EAS CLI for cloud Android builds

## Install and run

From this project directory:

```sh
npm install
npx expo start
```

Scan the QR code with Expo Go. Keep the computer and phone on the same network. Use `npx expo start --tunnel` if the local network blocks device discovery. Press `a` to launch an available Android emulator or `i` for an iOS simulator (macOS required for the iOS simulator).

For the web preview, run `npm run web`. The Android and iOS deliverables remain native React Native apps; web is only a development preview.

## Android APK

The EAS `preview` profile is configured to create an installable APK. Sign in and install the build CLI once:

```sh
npm install --global eas-cli
eas login
eas build:configure
```

Then request the APK build:

```sh
npm run build:android:apk
```

EAS will build in the cloud and print a build page/download link. Download the `.apk` to the Android device and approve installation from that source when prompted. For a Play Store release, use the `production` profile, which outputs an Android App Bundle (`.aab`):

```sh
eas build --platform android --profile production
```

## Features

- Harmony generation for complementary, analogous, triadic, split-complementary, and monochromatic palettes
- Interactive colour picker and validated HEX, RGB, and HSL input
- Lockable swatches, random palettes, copy-to-clipboard, and reset
- Palette storage on-device with rename, load, and delete actions
- A palette-driven sample design with its own light/dark preview control
- WCAG AA/AAA contrast checks for normal and large text
- CSS variables, JSON, PNG, and share exports
- On-device dominant colour sampling from a selected gallery image
- Persistent application light/dark preference

No server or API key is required. Image processing, palette generation, and saved data remain local to the device.