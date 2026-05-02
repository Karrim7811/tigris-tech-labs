# ALEVANT Mobile

React Native (Expo SDK 55) shell, **forked from the PRAIX mobile app pattern** at `Z:/TigrisTechLabs/Products/praix-mobile/appstorecortex/praix-app/`.

The mobile app is a thin native wrapper around `app.alevant.ai` (and the agent's tenant subdomain) plus four native-only capabilities:

1. **Floating microphone** — draggable across all screens; tap to record voice notes / Sofia commands.
2. **Shake-to-Sofia** — accelerometer 2.5g threshold opens the Sofia chat sheet.
3. **Background audio recording** — Live Notes during showings, listing presentations, calls.
4. **Push notifications** — Sofia hot-lead handoffs, Vesper approval pings, transaction risk alerts.

## Stack

| Component | Technology |
|---|---|
| Framework | React Native 0.83 |
| Platform | Expo SDK 55 |
| Audio | expo-audio (background recording) |
| Push | expo-notifications |
| Motion | expo-sensors (Accelerometer) |
| Camera | expo-camera (open-house QR + business card scan) |
| Location | expo-location |
| Haptics | expo-haptics |
| Speech | expo-speech (TTS daily standup) |
| Auth | expo-apple-authentication + Supabase session |
| Secure store | expo-secure-store (auth tokens) |
| WebView | react-native-webview |
| Navigation | React Navigation v7 |

## Repo layout (mirror PRAIX pattern)

```
mobile/
├── app.json                  # Expo config (bundle id: com.alevant.app)
├── eas.json                  # EAS Build profiles (preview + production)
├── package.json
├── App.tsx                   # Root navigator + WebView
├── src/
│   ├── screens/
│   │   ├── Cockpit.tsx       # Native dashboard with KPIs + standup play
│   │   ├── Sofia.tsx         # Native voice chat sheet
│   │   ├── Inbox.tsx         # Native lead inbox
│   │   ├── Webview.tsx       # Tenant app via authenticated WebView
│   │   └── Onboard.tsx       # Mobile-friendly onboarding launcher
│   ├── components/
│   │   ├── FloatingMic.tsx   # Persistent draggable mic
│   │   ├── ShakeListener.tsx # Accelerometer hook
│   │   └── BrandTheme.tsx    # Tenant brand-kit theming
│   └── lib/
│       ├── native-bridge.ts  # postMessage bridge into the WebView
│       ├── supabase.ts       # Mobile Supabase client
│       └── push.ts           # expo-notifications setup + token registration
```

## Bundle identifiers

- iOS: `com.alevant.app`
- Android: `com.alevant.app`
- EAS Project ID: TBD (run `eas init` in this directory after fork).

## Deep linking

Custom scheme: `alevant://`
Universal links: `https://app.alevant.ai/*`, `https://*.alevant.ai/*`

## Native bridge contract

Web app at `app.alevant.ai` checks `window.ReactNativeWebView` and forwards these intents to native:

```ts
// From web → native
window.ReactNativeWebView.postMessage(JSON.stringify({
  type: "open_sofia_voice",            // open native voice sheet
  type: "play_standup_audio", url,     // TTS through expo-speech
  type: "schedule_local_notification", title, body, when,
  type: "haptic", style,
  type: "open_camera_for_business_card",
  type: "request_location_for_visit_log",
}));

// From native → web (via WebView injectJavaScript)
window.dispatchEvent(new CustomEvent("alevant:voice_transcript", { detail }));
window.dispatchEvent(new CustomEvent("alevant:push_received", { detail }));
window.dispatchEvent(new CustomEvent("alevant:shake", { detail }));
```

## Fork instructions

```bash
# From Z:/TigrisTechLabs/Products/
cp -r praix-mobile/appstorecortex/praix-app/ alevant-app/mobile-source/

# Inside the fork:
# 1. Update package.json name → alevant-mobile
# 2. Update app.json:
#    - "name": "ALEVANT"
#    - "slug": "alevant"
#    - "bundleIdentifier": "com.alevant.app"
#    - "package": "com.alevant.app"
#    - "scheme": "alevant"
# 3. Replace API base URL constant: PRAIX → ALEVANT
#    grep -RIn "praix.ai" → replace with "alevant.ai"
# 4. Replace branding tokens (copper #C4875A → indigo #3D4F8C)
# 5. Update EAS project: rm .easignore && eas init
# 6. Test on simulator: pnpm ios / pnpm android
```

## Status

✅ Architecture spec'd · 🟨 Fork from PRAIX shell when EAS slot opens · 🟨 First TestFlight build for Bichi.
