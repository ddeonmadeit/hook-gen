# Hook Generator

Make TikTok-style text hooks (white rounded box, black TikTok Sans text) with real Apple emoji on any device, and download them as transparent PNGs.

Static site, no build step: `index.html`, `style.css`, `app.js`, `emoji-data.js`, `fonts/`.

- **Run locally:** `python3 -m http.server` and open http://localhost:8000
- **Deploy:** import this repo at https://vercel.com/new (Framework preset: Other, no build command).
- **Emoji:** Apple emoji images come from [iamcal/emoji-data](https://github.com/iamcal/emoji-data) via jsDelivr. `node scripts/build-emoji-data.mjs` regenerates `emoji-data.js`.
- **Font:** [TikTok Sans](https://github.com/tiktok/TikTokSans) (SIL OFL 1.1), static instance at opsz 24 / SemiBold, in `fonts/`.
