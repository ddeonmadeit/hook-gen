# Hook Generator

Make TikTok-style text hooks (white rounded box, black TikTok Sans text) with real Apple emoji on any device, and download them as transparent PNGs.

Static site, no build step: `index.html`, `style.css`, `app.js`, `emoji-data.js`, `emoji/`, `fonts/`.

- **Run locally:** `python3 -m http.server` and open http://localhost:8000
- **Live site:** https://ddeonmadeit.github.io/hook-gen/ (GitHub Pages, deployed from `main` / root).
- **Emoji:** Apple emoji images from [iamcal/emoji-data](https://github.com/iamcal/emoji-data), self-hosted in `emoji/` (160px WebP per emoji, plus one 64px sprite sheet per picker category). `node scripts/build-emoji-data.mjs` regenerates `emoji-data.js`; `python3 scripts/build-emoji-assets.py <emoji-data checkout>` regenerates `emoji/`.
- **Font:** [TikTok Sans](https://github.com/tiktok/TikTokSans) (SIL OFL 1.1), static instance at opsz 24 / SemiBold, in `fonts/`.
