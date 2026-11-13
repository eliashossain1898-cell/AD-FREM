# AdFrame Studio — Master Workflow & Agent Rulebook

This project is an autonomous **AI Commercial Video Ad Studio** built for 9:16 vertical Bangla Reels (`1080×1920`, `30fps`) using Remotion, Edge-TTS neural Bangla speech, `rembg` AI cutouts, and FFmpeg/Pydub audio mastering.

---

## 1. Installed Core Stack & Official Agent Skills

### Node.js / Remotion Packages
- `remotion`, `@remotion/cli`, `@remotion/renderer`, `@remotion/player`: Core programmatic 9:16 video engine (`1080×1920`, `30fps`), browser `<Player>`, and headless Chromium MP4 renderer.
- `@remotion/transitions`: Scene transitions (`TransitionSeries`, `fade()`, `slide()`, `linearTiming`).
- `@remotion/google-fonts`: Pre-configured Google Fonts (`HindSiliguri`, `BalooDa2`, `AnekBangla`, `NotoSansBengali`, `Montserrat`, `BebasNeue`).
- `@remotion/fonts`: Local Unicode font loader registering `public/fonts/LiAdorNoirritUnicode.ttf` (`Li Ador Noirrit`).
- `@remotion/sfx`: Royalty-free transition & impact sound effects (`whoosh`, `whip`, `ding`, `vineBoom`).
- `@remotion/captions`: Frame-accurate `Caption` schema & `createTikTokStyleCaptions()` token highlighter.
- `lucide-react`: Crisp vector icons for pricing badges and Cash-on-Delivery CTA screens.
- `@google/genai`: Server-side Gemini (`gemini-4-hydrogen`) Bangla commercial script & hook generator.

### Official Remotion Agent Skills
Installed locally under `.agents/skills/` (`remotion-best-practices`, `remotion-captions`, `remotion-markup`, `remotion-saas`, `remotion-render`, etc.) plus `https://www.remotion.dev/llms.txt` reference patterns.

### Python AI Audio & Cutout Pipeline
- `edge-tts`: Free Microsoft Neural Bangla voiceovers:
  - `bn-BD-PradeepNeural` (Male, authoritative commercial & tech tone)
  - `bn-BD-NabanitaNeural` (Female, warm beauty & lifestyle tone)
- `rembg[cli]` + `onnxruntime` + `pillow`: Automatic AI background removal and bounding-box trimming to transparent PNG cutouts.
- `pydub` + `ffmpeg-python` + system `ffmpeg`: Exact audio duration detection (ms -> frames @ 30fps) and sidechain-style background music auto-ducking.

---

## 2. Remotion Best Practices (Strict Rules)

1. **Frame-Driven Animations Only**: Drive all motion with `useCurrentFrame()`, `interpolate()`, `spring()`, and `Easing.bezier()`. Never use CSS `transition`, CSS `@keyframes`, or Tailwind `animate-*` inside Remotion compositions.
2. **Isolate `useCurrentFrame()`**: Keep `useCurrentFrame()` inside leaf components (`VideoBackground`, `HookBanner`, `SyncedCaptions`, `ProductBadge`, `CTAScreen`) so the root timeline never re-renders unnecessarily.
3. **Zero Mirror Effect on Footage**: `VideoBackground.tsx` uses `objectFit: 'cover'`, `objectPosition: 'center center'`, and strictly positive `scale(...)` transforms. Never apply `scaleX(-1)`.
4. **Asset Resolution**: Place static assets in `public/` and resolve via `resolveMediaSrc()` (`staticFile()` during CLI rendering, root `/` in Vite browser preview).
5. **Transition Duration Math**: When using `<TransitionSeries>` with a 15-frame transition, total duration is `scene1 + scene2 - 15`. Keep `calculateMetadata()` synchronized with voiceover frame length.

---

## 3. Marketing Font Mappings by Product Category

| Category | Bangla Hook Headline | Bangla Captions & Body | English / Price Numerals | Color Grade Preset | Default Voice |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`luxury`** (Luxury / Watch / Jewellery) | `Li Ador Noirrit` (`public/fonts/LiAdorNoirritUnicode.ttf`) | `Hind Siliguri` | `Montserrat` | `luxury-warm` | `bn-BD-PradeepNeural` |
| **`beauty`** (Beauty / Skincare / Fashion) | `Baloo Da Two` (`BalooDa2`) | `Noto Sans Bengali` | `Montserrat` | `beauty-glow` | `bn-BD-NabanitaNeural` |
| **`gadget`** (Gadget / Electronics / Gaming) | `Anek Bangla` | `Hind Siliguri` | `Bebas Neue` | `gadget-crisp` | `bn-BD-PradeepNeural` |

---

## 4. Reusable Ad Components (`src/components/`)

- `VideoBackground.tsx`: 9:16 center-crop (`objectFit: 'cover'`), zero mirror effect, slow Ken Burns zoom/pan, CSS color grading (`luxury-warm`, `beauty-glow`, `gadget-crisp`, `cinematic-contrast`, `natural`), and contrast scrim.
- `HookBanner.tsx`: 3-second (`90` frames @ `30fps`) scroll-stopping Bangla headline with `WebkitTextStroke`, drop-shadow, spring physics, and `@remotion/sfx` (`whoosh`, `whip`, `ding`, `vineBoom`).
- `SyncedCaptions.tsx`: Frame-accurate Bangla subtitles powered by `generate_voice.py` timestamps and `@remotion/captions` `createTikTokStyleCaptions()`.
- `ProductBadge.tsx`: Animated offer badge with regular vs offer price, discount label, and category `lucide-react` icon.
- `CTAScreen.tsx`: End-screen `"ORDER NOW / ক্যাশ অন ডেলিভারি"` card displaying the real `rembg` transparent PNG cutout overlay.

---

## 5. One-Command Build Pipeline

Generate a Bangla voiceover + frame-accurate SubMaker `.json`/`.vtt` captions, remove product background, and render a `1080×1920` MP4 Reel in a single step:

```bash
python3 generate_voice.py \
  --text "আপনার স্টাইলকে দিন রাজকীয় ছোঁয়া। প্রিমিয়াম ঘড়ি এখন ৫০ শতাংশ ছাড়ে! আজই অর্ডার করুন।" \
  --voice bn-BD-PradeepNeural \
  --out-audio public/audio/voiceover.mp3 \
  --out-json public/audio/captions.json \
  --out-vtt public/audio/captions.vtt \
&& python3 remove_bg.py public/media/watch-bg.jpg public/cutouts/watch-cutout.png \
&& npx remotion render src/remotion/index.ts BanglaCommercialAd out/commercial.mp4
```

### Optional BGM Auto-Ducking
Pass `--bgm path/to/music.mp3 --out-mixed public/audio/mixed.mp3` to `generate_voice.py` to automatically attenuate background music during spoken Bangla phrases.

### Launch Interactive Remotion Studio or Web App
- Web Studio (Vite + Express + Remotion Player + AI Copy + Voice/Cutout APIs): `npm run dev`
- Native Remotion Studio: `npm run remotion:studio`
