(() => {
  "use strict";

  // Export font size in px. Everything else scales from it.
  const F = 144;
  // Proportions (in em) measured from a TikTok screenshot of the "Classic" white-box style.
  const M = {
    pitch: 1.192, // baseline-to-baseline distance
    rectTop: 1.02, // box top above baseline
    rectBottom: 0.452, // box bottom below baseline (lines that have a line below them)
    lastBottom: 0.404, // box bottom below baseline on the last line
    padX: 0.405, // horizontal padding inside the box
    radius: 0.155, // corner radius (outer and inner)
    snap: 0.155, // line edges closer than this are merged into one straight edge
    emojiSize: 0.98,
    emojiTop: 0.83, // emoji image top above baseline
    margin: 0.04, // transparent margin around the PNG
  };
  // Hook fonts. The TikTok Sans ones are self-hosted (see fonts/); the rest load from
  // Google Fonts the first time they're picked.
  const SANS = "system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, sans-serif";
  const FONTS = [
    { id: "tiktok", name: "TikTok Sans (default)", group: "TikTok", family: '"TikTok Sans Hook", "TikTok Sans"', weight: 600, fallback: SANS },
    { id: "tiktok-bold", name: "TikTok Sans Bold", group: "TikTok", family: '"TikTok Sans Hook", "TikTok Sans"', weight: 700, fallback: SANS },
    { id: "tiktok-black", name: "TikTok Sans Black", group: "TikTok", family: '"TikTok Sans Hook", "TikTok Sans"', weight: 900, fallback: SANS },
    { id: "montserrat", name: "Montserrat ExtraBold", group: "Sans", family: '"Montserrat"', css: "Montserrat:wght@800", weight: 800, fallback: SANS },
    { id: "poppins", name: "Poppins", group: "Sans", css: "Poppins:wght@700", weight: 700, fallback: SANS },
    { id: "inter", name: "Inter", group: "Sans", css: "Inter:wght@700", weight: 700, fallback: SANS },
    { id: "roboto", name: "Roboto", group: "Sans", css: "Roboto:wght@700", weight: 700, fallback: SANS },
    { id: "rubik", name: "Rubik", group: "Sans", css: "Rubik:wght@700", weight: 700, fallback: SANS },
    { id: "nunito", name: "Nunito", group: "Sans", css: "Nunito:wght@800", weight: 800, fallback: SANS },
    { id: "fredoka", name: "Fredoka", group: "Sans", css: "Fredoka:wght@600", weight: 600, fallback: SANS },
    { id: "bebas", name: "Bebas Neue", group: "Display", css: "Bebas+Neue", weight: 400, fallback: SANS },
    { id: "anton", name: "Anton", group: "Display", css: "Anton", weight: 400, fallback: SANS },
    { id: "oswald", name: "Oswald", group: "Display", css: "Oswald:wght@600", weight: 600, fallback: SANS },
    { id: "archivo-black", name: "Archivo Black", group: "Display", css: "Archivo+Black", weight: 400, fallback: SANS },
    { id: "lilita", name: "Lilita One", group: "Display", css: "Lilita+One", weight: 400, fallback: SANS },
    { id: "playfair", name: "Playfair Display", group: "Serif", css: "Playfair+Display:wght@700", weight: 700, fallback: "Georgia, serif" },
    { id: "dm-serif", name: "DM Serif Display", group: "Serif", css: "DM+Serif+Display", weight: 400, fallback: "Georgia, serif" },
    { id: "instrument-serif", name: "Instrument Serif", group: "Serif", css: "Instrument+Serif", weight: 400, fallback: "Georgia, serif" },
    { id: "abril", name: "Abril Fatface", group: "Serif", css: "Abril+Fatface", weight: 400, fallback: "Georgia, serif" },
    { id: "courier-prime", name: "Courier Prime", group: "Typewriter", css: "Courier+Prime:wght@700", weight: 700, fallback: '"Courier New", monospace' },
    { id: "space-mono", name: "Space Mono", group: "Typewriter", css: "Space+Mono:wght@700", weight: 700, fallback: '"Courier New", monospace' },
    { id: "caveat", name: "Caveat", group: "Handwritten", css: "Caveat:wght@700", weight: 700, fallback: "cursive" },
    { id: "permanent-marker", name: "Permanent Marker", group: "Handwritten", css: "Permanent+Marker", weight: 400, fallback: "cursive" },
    { id: "pacifico", name: "Pacifico", group: "Handwritten", css: "Pacifico", weight: 400, fallback: "cursive" },
    { id: "lobster", name: "Lobster", group: "Handwritten", css: "Lobster", weight: 400, fallback: "cursive" },
    { id: "comic-neue", name: "Comic Neue", group: "Handwritten", css: "Comic+Neue:wght@700", weight: 700, fallback: "cursive" },
  ];
  for (const f of FONTS) if (!f.family) f.family = `"${f.name}"`;
  const fontById = new Map(FONTS.map((f) => [f.id, f]));
  const fontString = (f) => `${f.weight} ${F}px ${f.family}, ${f.fallback}`;
  const REF_FONT = fontString(FONTS[0]);

  // Box colour / text colour pairs offered as one-tap swatches. The first is the default.
  const SWATCHES = [
    ["#ffffff", "#000000", "White box, black text (default)"],
    ["#000000", "#ffffff", "Black box, white text"],
    ["#fe2c55", "#ffffff", "Red box, white text"],
    ["#25f4ee", "#000000", "Cyan box, black text"],
    ["#ffd60a", "#000000", "Yellow box, black text"],
    ["#ff9500", "#ffffff", "Orange box, white text"],
    ["#34c759", "#ffffff", "Green box, white text"],
    ["#3496f0", "#ffffff", "Blue box, white text"],
    ["#8b5cf6", "#ffffff", "Purple box, white text"],
    ["#ff8fc7", "#000000", "Pink box, black text"],
    ["#0a0a0a", "#f2f0ec", "Ink box, Paper text (Get Known)"],
    ["#c9a227", "#0a0a0a", "Gold box, Ink text (Get Known)"],
  ];

  const DEFAULTS = Object.freeze({
    font: "tiktok",
    box: "#ffffff",
    text: "#000000",
    opacity: 100, // box opacity, %
    roundTop: 20, // corner roundness, 0–100; 20 = M.radius, 100 = 5× that (enough for a full pill)
    roundBottom: 20,
    gap: 0, // gap between lines in hundredths of an em; 0 = lines touch
    join: "merge", // "merge": touching lines become one TikTok shape; "stack": one block per line
    padSide: 0, // extra padding in hundredths of an em, added to TikTok's own
    padTop: 0,
    padBottom: 0,
    accent: false, // give the last line (the payoff) its own colours
    lastBox: "#c9a227",
    lastText: "#0a0a0a",
    width: 11.5, // line width in em
    align: "center",
  });

  // Everything a preset carries: the whole look, including where lines wrap, but not the text.
  const PRESET_KEYS = ["font", "box", "text", "opacity", "roundTop", "roundBottom", "gap", "join", "padSide", "padTop", "padBottom", "accent", "lastBox", "lastText", "align", "width"];

  const BUILTIN_PRESETS = [
    { id: "tiktok-classic", name: "TikTok Classic", style: {} },
    {
      id: "get-known",
      name: "Get Known",
      // Montserrat ExtraBold; Ink #0A0A0A boxes with Paper #F2F0EC text, the payoff line Gold #C9A227 with Ink text.
      style: { font: "montserrat", box: "#0a0a0a", text: "#f2f0ec", join: "stack", roundTop: 40, roundBottom: 40, padSide: 18.5, padTop: 26, padBottom: 20, accent: true, lastBox: "#c9a227", lastText: "#0a0a0a", width: 15 },
    },
  ];
  const EMOJI_FONT = `${Math.round(F * 0.9)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  const PREVIEW_SCALE = 0.5;
  const BLANK_GAP = 30; // an empty line adds at least this gap, in hundredths of an em

  const DATA = window.HOOK_EMOJI;
  // Self-hosted Apple emoji (built by scripts/build-emoji-assets.py).
  const IMG_HI = (u) => `emoji/160/${u}.webp`;
  const SHEET = (i) => `emoji/sheets/${i}.webp`;
  const SHEET_COLS = 16; // keep in sync with build-emoji-assets.py
  const SHEET_CELL = 64;

  const $ = (id) => document.getElementById(id);
  const textEl = $("text");
  const widthEl = $("width");
  const widthOut = $("widthOut");
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");

  // ---------- Settings ----------

  const STYLE_KEY = "hook-gen-style";

  const RANGES = { opacity: [0, 100], roundTop: [0, 100], roundBottom: [0, 100], gap: [0, 100], padSide: [-40, 80], padTop: [-20, 80], padBottom: [-20, 80], width: [4, 30] };

  // Defaults overridden by every valid field of v. Used for saved settings and for
  // presets, which can come from anyone, so nothing is trusted.
  function cleanStyle(v) {
    const s = { ...DEFAULTS };
    if (!v || typeof v !== "object") return s;
    if (fontById.has(v.font)) s.font = v.font;
    // Older settings and presets had one roundness for every corner.
    if (typeof v.round === "number" && v.round >= 0 && v.round <= 100) s.roundTop = s.roundBottom = v.round;
    for (const k of ["box", "text", "lastBox", "lastText"]) if (typeof v[k] === "string" && /^#[0-9a-f]{6}$/i.test(v[k])) s[k] = v[k].toLowerCase();
    for (const [k, [lo, hi]] of Object.entries(RANGES)) if (typeof v[k] === "number" && v[k] >= lo && v[k] <= hi) s[k] = v[k];
    if (["left", "center", "right"].includes(v.align)) s.align = v.align;
    if (["merge", "stack"].includes(v.join)) s.join = v.join;
    if (typeof v.accent === "boolean") s.accent = v.accent;
    return s;
  }

  function loadStyle() {
    try {
      return cleanStyle(JSON.parse(localStorage.getItem(STYLE_KEY) || "null"));
    } catch {
      return { ...DEFAULTS };
    }
  }
  const saveStyle = () => {
    try {
      localStorage.setItem(STYLE_KEY, JSON.stringify(S));
    } catch {}
  };

  const S = loadStyle();
  // The font being drawn. A newly picked font takes over once it has loaded,
  // so the preview never flashes a fallback font.
  let activeFont = FONTS[0];
  let FONT = fontString(activeFont);

  // Resolves with p's value, or with fallback if p takes longer than ms.
  const withTimeout = (p, ms, fallback) => Promise.race([p, new Promise((resolve) => setTimeout(() => resolve(fallback), ms))]);

  // Google Fonts stylesheets, added on first use. A failed one is dropped so the next pick retries.
  const fontSheets = new Map();
  function ensureFont(f, text) {
    let sheet = fontSheets.get(f.id);
    if (!sheet) {
      sheet = Promise.resolve();
      if (f.css) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${f.css}&display=block`;
        sheet = new Promise((resolve) => {
          link.onload = resolve;
          link.onerror = () => {
            link.remove();
            fontSheets.delete(f.id);
            resolve();
          };
        });
        document.head.appendChild(link);
      }
      fontSheets.set(f.id, sheet);
    }
    // The extra letters are the ones fontShift() measures. Resolves with the faces that loaded.
    const load = sheet.then(() => document.fonts.load(fontString(f), `${text || ""}Hdlkfbgjpqy`)).catch(() => []);
    return withTimeout(load, 10000, []);
  }

  // The font the user picked: it becomes the drawn font once it has loaded. If it can't
  // load, the picker goes back to the font still being drawn instead of faking it.
  function applyFont() {
    const f = fontById.get(S.font) || FONTS[0];
    // fontShift() compares against TikTok Sans, so that has to be loaded too.
    const ref = f === FONTS[0] ? null : ensureFont(FONTS[0], "");
    return Promise.all([ensureFont(f, textEl.value), ref]).then(([faces]) => {
      if (S.font !== f.id) return;
      if (!faces.length && f !== FONTS[0]) {
        S.font = activeFont.id;
        changed();
        $("fontStatus").textContent = `Couldn't load ${f.name}. Check your connection and pick it again.`;
        return;
      }
      $("fontStatus").textContent = "";
      if (activeFont === f) return;
      activeFont = f;
      FONT = fontString(f);
      queueRender();
    });
  }

  // How much taller / deeper the active font's letters reach than TikTok Sans, in em.
  // The box grows or shrinks by that much so every font keeps the same padding. For
  // other fonts the hook's own letters count too, so tall accents (Å, Ç) stay inside.
  function fontShift(text) {
    if (FONT === REF_FONT) return { a: 0, d: 0 };
    const ink = (font, extra) => {
      ctx.font = font;
      return [ctx.measureText(`Hdlkfb${extra}`).actualBoundingBoxAscent / F, ctx.measureText(`gjpqy${extra}`).actualBoundingBoxDescent / F];
    };
    const [ra, rd] = ink(REF_FONT, "");
    const [ca, cd] = ink(FONT, text);
    ctx.font = FONT;
    return { a: ca - ra, d: cd - rd };
  }

  // ---------- Emoji lookup ----------

  const stripFe0f = (u) => u.split("-").filter((c) => c !== "fe0f").join("-");
  const toChar = (u) => String.fromCodePoint(...u.split("-").map((h) => parseInt(h, 16)));

  const emojiByKey = new Map();
  for (const cat of DATA.cats) for (const [u] of cat.items) emojiByKey.set(stripFe0f(u), u);
  for (const u of DATA.extra) if (!emojiByKey.has(stripFe0f(u))) emojiByKey.set(stripFe0f(u), u);

  // Where each picker emoji sits in its category's sprite sheet.
  const sheetPos = new Map();
  DATA.cats.forEach((cat, i) => cat.items.forEach(([u], k) => sheetPos.set(u, { cat: i, col: k % SHEET_COLS, row: Math.floor(k / SHEET_COLS) })));

  // Single characters that are normally typed as plain text (©, ™, arrows…) stay text
  // unless they carry the emoji variation selector.
  const TEXT_DEFAULT = new Set(["00a9", "00ae", "2122", "203c", "2049", "2139", "2194", "2195", "2196", "2197", "2198", "2199", "21a9", "21aa", "24c2", "25aa", "25ab", "3030", "303d", "3297", "3299"]);

  const segmenter = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const graphemes = (s) => (segmenter ? Array.from(segmenter.segment(s), (x) => x.segment) : Array.from(s));

  function emojiFor(g) {
    const hex = Array.from(g, (c) => c.codePointAt(0).toString(16).padStart(4, "0"));
    const key = hex.filter((h) => h !== "fe0f").join("-");
    const u = emojiByKey.get(key);
    if (!u) return null;
    if (hex.length === 1 && TEXT_DEFAULT.has(key)) return null;
    return u;
  }

  // Splits a string into text runs and individual emoji.
  function tokenize(s) {
    const out = [];
    let buf = "";
    for (const g of graphemes(s)) {
      const u = emojiFor(g);
      if (u) {
        if (buf) out.push({ t: "text", s: buf });
        buf = "";
        out.push({ t: "emoji", u, s: g });
      } else {
        buf += g;
      }
    }
    if (buf) out.push({ t: "text", s: buf });
    return out;
  }

  // ---------- Emoji images ----------

  const imgCache = new Map();
  let renderQueued = false;
  let started = false; // set once the first renderReady() has the right font
  const queueRender = () => {
    if (renderQueued || !started) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      render();
    });
  };

  function loadImage(src) {
    let e = imgCache.get(src);
    if (!e) {
      const img = new Image();
      e = { img, ok: false, done: false };
      e.ready = new Promise((resolve) => {
        img.onload = () => { e.ok = true; e.done = true; resolve(); queueRender(); };
        img.onerror = () => { e.done = true; resolve(); queueRender(); };
      });
      img.src = src;
      imgCache.set(src, e);
    }
    return e;
  }

  const emojiImage = (u) => loadImage(IMG_HI(u));
  const sheetImage = (i) => loadImage(SHEET(i));

  // Draws the full-size emoji, or the picker's sprite sheet copy while that is still loading.
  function drawEmoji(u, x, y, size) {
    const e = emojiImage(u);
    if (e.ok) {
      ctx.drawImage(e.img, x, y, size, size);
      return true;
    }
    const pos = sheetPos.get(u);
    const sheet = pos && imgCache.get(SHEET(pos.cat));
    if (sheet && sheet.ok) {
      ctx.drawImage(sheet.img, pos.col * SHEET_CELL, pos.row * SHEET_CELL, SHEET_CELL, SHEET_CELL, x, y, size, size);
      return true;
    }
    return !e.done;
  }

  // ---------- Text ----------

  // iPhone-style curly quotes, like text typed on iOS.
  const smarten = (s) =>
    s
      .replace(/(^|[\s([{"“‘-])'/g, "$1‘")
      .replace(/'/g, "’")
      .replace(/(^|[\s([{‘-])"/g, "$1“")
      .replace(/"/g, "”");

  function measure(s) {
    let w = 0;
    for (const tok of tokenize(s)) w += tok.t === "emoji" ? M.emojiSize * F : ctx.measureText(tok.s).width;
    return w;
  }

  // Returns the wrapped lines, and for each one how many empty lines were typed above it.
  function wrap(text, maxW) {
    const lines = [], breaks = [];
    let blank = 0;
    const push = (line) => {
      if (!line) return;
      lines.push(line);
      breaks.push(lines.length > 1 ? blank : 0);
      blank = 0;
    };
    for (const para of text.split("\n")) {
      if (!para.trim()) {
        blank++;
        continue;
      }
      let cur = "";
      for (const token of para.split(/(\s+)/)) {
        if (!token) continue;
        if (/^\s+$/.test(token)) {
          if (cur) cur += token;
          continue;
        }
        const next = cur + token;
        if (!cur || measure(next.trimEnd()) <= maxW) {
          cur = next;
        } else {
          push(cur.trimEnd());
          cur = token;
        }
        // A single word wider than the line gets broken by character.
        if (measure(cur) > maxW && !/\s/.test(cur)) {
          let piece = "";
          for (const g of graphemes(cur)) {
            if (piece && measure(piece + g) > maxW) {
              push(piece);
              piece = g;
            } else {
              piece += g;
            }
          }
          cur = piece;
        }
      }
      push(cur.trim());
    }
    return { lines, breaks };
  }

  // ---------- Shape ----------

  // Adds the outline of the stacked line boxes to the current path: rounded outer
  // corners, and concave rounded corners wherever a narrower line meets a wider one.
  // Every corner is either at the top of a line (radius rTop) or at the bottom of one
  // (rBottom); each step between two lines has one of each.
  function shapePath(L, R, tops, bottoms, rTop, rBottom, squareTop = false, squareBottom = false) {
    const n = L.length;
    const V = [[R[0], tops[0], squareTop ? 0 : rTop]];
    for (let i = 0; i < n - 1; i++) {
      const a = R[i], b = R[i + 1];
      if (Math.abs(b - a) < 0.01) continue;
      const y = b < a ? bottoms[i] : tops[i + 1];
      V.push([a, y, rBottom], [b, y, rTop]); // bottom of line i, top of line i+1
    }
    V.push([R[n - 1], bottoms[n - 1], squareBottom ? 0 : rBottom], [L[n - 1], bottoms[n - 1], squareBottom ? 0 : rBottom]);
    for (let i = n - 2; i >= 0; i--) {
      const a = L[i + 1], b = L[i];
      if (Math.abs(b - a) < 0.01) continue;
      const y = a > b ? bottoms[i] : tops[i + 1];
      V.push([a, y, rTop], [b, y, rBottom]); // top of line i+1, bottom of line i
    }
    V.push([L[0], tops[0], squareTop ? 0 : rTop]);

    // Corners sharing an edge split it in proportion to their size, like CSS border-radius,
    // so together they never need more than the edge is long.
    const want = V.map((v) => v[2]);
    const share = (k, j) => {
      const len = Math.hypot(V[k][0] - V[j][0], V[k][1] - V[j][1]);
      const sum = want[k] + want[j];
      return sum > 0 ? (len * want[k]) / sum : 0;
    };
    V.forEach((v, k) => {
      v[2] = Math.min(want[k], share(k, (k + V.length - 1) % V.length), share(k, (k + 1) % V.length));
    });

    const sx = (L[0] + R[0]) / 2, sy = tops[0];
    ctx.moveTo(sx, sy);
    for (let k = 0; k < V.length; k++) {
      const [x, y, rad] = V[k];
      const [nx, ny] = k + 1 < V.length ? V[k + 1] : [sx, sy];
      ctx.arcTo(x, y, nx, ny, rad);
    }
    ctx.closePath();
  }

  // Lines whose edges almost line up get one straight edge instead of a tiny step.
  function snapEdges(E, pick, from = 0, to = E.length - 1) {
    const snap = M.snap * F;
    for (let pass = 0; pass < E.length; pass++) {
      let changed = false;
      for (let i = from; i < to; i++) {
        if (E[i] !== E[i + 1] && Math.abs(E[i] - E[i + 1]) < snap) {
          E[i] = E[i + 1] = pick(E[i], E[i + 1]);
          changed = true;
        }
      }
      if (!changed) break;
    }
  }

  // ---------- Render ----------

  let current = { lines: [], emoji: [] };

  function layout() {
    ctx.font = FONT;
    const { lines, breaks } = wrap(smarten(textEl.value), S.width * F);
    const emoji = [];
    for (const l of lines) for (const tok of tokenize(l)) if (tok.t === "emoji") emoji.push(tok.u);
    return { lines, breaks, emoji };
  }

  function render() {
    current = layout();
    const { lines, breaks } = current;
    const empty = lines.length === 0;
    $("empty").hidden = !empty;
    canvas.hidden = empty;
    $("download").disabled = empty;
    $("copy").disabled = empty;
    if (empty) {
      $("meta").textContent = "";
      return;
    }

    ctx.font = FONT;
    const n = lines.length;
    const shift = fontShift(lines.map((l) => tokenize(l).filter((t) => t.t === "text").map((t) => t.s).join("")).join(""));
    const padX = (M.padX + S.padSide / 100) * F, margin = Math.ceil(M.margin * F);
    const rTop = M.radius * (S.roundTop / 20) * F, rBottom = M.radius * (S.roundBottom / 20) * F;
    // How far the box reaches above / below the baseline, beyond TikTok's own (in em).
    const up = shift.a + S.padTop / 100, down = shift.d + S.padBottom / 100;
    const top = (M.rectTop + up) * F;
    const bottom = (M.rectBottom + down) * F;
    const lastBottom = (M.lastBottom + down) * F;
    const pitch = M.pitch + up + down; // between lines merged into one shape, in em
    const gapPx = (S.gap / 100) * F;
    const accent = S.accent && n > 1;

    // Lines are drawn in groups. Inside a group, lines merge into one TikTok shape. A gap,
    // "stack" mode, an empty line, or a last line with its own colours starts a new group.
    const blocks = S.gap > 0 || S.join === "stack";
    const blankPx = (Math.max(S.gap, BLANK_GAP) / 100) * F;
    // Space between line i-1 and line i: the gap setting plus any empty lines typed there.
    const sep = lines.map((_, i) => (i > 0 ? gapPx + breaks[i] * blankPx : 0));
    let gid = 0;
    const group = lines.map((_, i) => (i > 0 && (blocks || breaks[i] > 0 || (accent && i === n - 1)) ? ++gid : gid));
    const groups = [];
    group.forEach((g, i) => (i > 0 && g === group[i - 1] ? (groups[groups.length - 1].to = i) : groups.push({ from: i, to: i })));

    const widths = lines.map(measure);
    const boxW = widths.map((w) => w + 2 * padX);
    const maxW = Math.max(...boxW);

    const L = [], R = [], textX = [], baselines = [], tops = [], bottoms = [];
    let groupBase = margin + top, groupFrom = 0;
    lines.forEach((_, i) => {
      const x = S.align === "left" ? 0 : S.align === "right" ? maxW - boxW[i] : (maxW - boxW[i]) / 2;
      L.push(x + margin);
      R.push(x + boxW[i] + margin);
      textX.push(x + padX + margin);
      if (i > 0 && group[i] !== group[i - 1]) {
        // Touching blocks meet on a whole pixel, so no see-through seam appears between them.
        const prevBottom = sep[i] > 0 ? bottoms[i - 1] : (bottoms[i - 1] = Math.round(bottoms[i - 1]));
        groupBase = prevBottom + sep[i] + top;
        groupFrom = i;
      }
      const base = groupBase + (i - groupFrom) * pitch * F;
      baselines.push(base);
      tops.push(base - top);
      bottoms.push(base + (i === n - 1 || group[i + 1] !== group[i] ? lastBottom : bottom));
    });
    for (const g of groups) {
      snapEdges(L, Math.min, g.from, g.to);
      snapEdges(R, Math.max, g.from, g.to);
    }

    const W = Math.ceil(maxW + 2 * margin);
    const H = Math.ceil(bottoms[bottoms.length - 1] + margin);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    canvas.style.width = `${Math.round(W * PREVIEW_SCALE)}px`;

    ctx.clearRect(0, 0, W, H);
    if (S.opacity > 0) {
      ctx.globalAlpha = S.opacity / 100;
      for (const { from, to } of groups) {
        const span = (A) => A.slice(from, to + 1);
        ctx.fillStyle = accent && to === n - 1 ? S.lastBox : S.box;
        ctx.beginPath();
        // Corners where a block touches the one above or below stay square.
        shapePath(span(L), span(R), span(tops), span(bottoms), rTop, rBottom, from > 0 && sep[from] === 0, to < n - 1 && sep[to + 1] === 0);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    ctx.textBaseline = "alphabetic";
    lines.forEach((line, i) => {
      ctx.fillStyle = accent && i === n - 1 ? S.lastText : S.text;
      let x = textX[i];
      const base = baselines[i];
      for (const tok of tokenize(line)) {
        if (tok.t === "text") {
          ctx.font = FONT;
          ctx.fillText(tok.s, x, base);
          x += ctx.measureText(tok.s).width;
          continue;
        }
        const size = M.emojiSize * F;
        if (!drawEmoji(tok.u, x, base - M.emojiTop * F, size)) {
          ctx.font = EMOJI_FONT;
          ctx.fillText(tok.s, x, base);
        }
        x += size;
      }
    });
    ctx.font = FONT;

    $("meta").textContent = `${W} × ${H} px · transparent PNG`;
  }

  async function renderReady() {
    await applyFont();
    started = true;
    render();
    await Promise.all(current.emoji.map((u) => emojiImage(u).ready));
    render();
  }

  const getBlob = () => new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

  function fileName() {
    const slug = textEl.value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/, "");
    return `hook-${slug || "text"}.png`;
  }

  // One export at a time: extra clicks while a font or emoji is still loading are ignored.
  const downloadBtn = $("download");
  let exporting = false;
  downloadBtn.addEventListener("click", async () => {
    if (exporting) return;
    exporting = true;
    downloadBtn.setAttribute("aria-busy", "true");
    try {
      await renderReady();
      const blob = await getBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      exporting = false;
      downloadBtn.removeAttribute("aria-busy");
    }
  });

  const copyBtn = $("copy");
  if (window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    copyBtn.hidden = false;
    copyBtn.addEventListener("click", async () => {
      try {
        // Safari needs the ClipboardItem created synchronously inside the click.
        await navigator.clipboard.write([new ClipboardItem({ "image/png": renderReady().then(getBlob) })]);
        copyBtn.textContent = "Copied!";
      } catch {
        copyBtn.textContent = "Copy failed";
      }
      setTimeout(() => (copyBtn.textContent = "Copy image"), 1500);
    });
  }

  // ---------- Controls ----------

  const fontEl = $("font");
  const swatchesEl = $("presets");
  const alignBtns = document.querySelectorAll("#alignGroup button");
  const joinBtns = document.querySelectorAll("[data-join]");
  const colorInputs = { box: $("boxColor"), text: $("textColor"), lastBox: $("lastBoxColor"), lastText: $("lastTextColor") };
  const sliders = { opacity: $("opacity"), roundTop: $("roundTop"), roundBottom: $("roundBottom"), gap: $("gap"), width: widthEl, padSide: $("padSide"), padTop: $("padTop"), padBottom: $("padBottom") };

  const fontGroups = new Map();
  for (const f of FONTS) {
    if (!fontGroups.has(f.group)) fontGroups.set(f.group, fontEl.appendChild(Object.assign(document.createElement("optgroup"), { label: f.group })));
    fontGroups.get(f.group).appendChild(new Option(f.name, f.id));
  }

  for (const [box, text, label] of SWATCHES) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "Aa";
    b.style.background = box;
    b.style.color = text;
    b.dataset.box = box;
    b.dataset.text = text;
    b.setAttribute("aria-label", label);
    b.title = `${label}: ${box.toUpperCase()} / ${text.toUpperCase()}`;
    swatchesEl.appendChild(b);
  }

  const withDefault = (v, d, text = String(v)) => (v === d ? `${text} (default)` : text);
  // <output>s are live regions: rewriting one with the same text makes screen readers repeat it.
  const setText = (el, text) => {
    if (el.textContent !== text) el.textContent = text;
  };

  // Puts every control in line with S.
  function syncControls() {
    fontEl.value = S.font;
    for (const [k, el] of Object.entries(colorInputs)) el.value = S[k];
    for (const k of Object.keys(colorInputs)) setText($(`${k}Hex`), S[k].toUpperCase());
    swatchesEl.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.box === S.box && b.dataset.text === S.text)));
    $("accent").checked = S.accent;
    $("accentRow").hidden = !S.accent;
    for (const [k, el] of Object.entries(sliders)) el.value = S[k];
    setText($("opacityOut"), `${S.opacity}%`);
    setText($("roundTopOut"), withDefault(S.roundTop, DEFAULTS.roundTop));
    setText($("roundBottomOut"), withDefault(S.roundBottom, DEFAULTS.roundBottom));
    setText($("gapOut"), S.gap === 0 ? (S.join === "merge" ? "None (default)" : "None") : String(S.gap));
    setText(widthOut, S.width.toFixed(1));
    for (const k of ["padSide", "padTop", "padBottom"]) setText($(`${k}Out`), withDefault(S[k], 0, S[k] > 0 ? `+${S[k]}` : String(S[k])));
    alignBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.align === S.align)));
    joinBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.join === S.join)));
    markActivePreset();
  }

  function changed() {
    syncControls();
    saveStyle();
    queueRender();
  }

  textEl.addEventListener("input", () => {
    queueRender();
    // Load any new characters' subsets, for the drawn font and for one still on its way.
    document.fonts.load(FONT, textEl.value || "a").then(queueRender, () => {});
    const picked = fontById.get(S.font);
    if (picked && picked !== activeFont) document.fonts.load(fontString(picked), textEl.value || "a").catch(() => {});
  });
  fontEl.addEventListener("change", () => {
    S.font = fontEl.value;
    changed();
    applyFont();
  });
  for (const [k, el] of Object.entries(colorInputs)) {
    el.addEventListener("input", () => {
      S[k] = el.value.toLowerCase();
      changed();
    });
  }
  swatchesEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-box]");
    if (!b) return;
    S.box = b.dataset.box;
    S.text = b.dataset.text;
    changed();
  });
  $("accent").addEventListener("change", (e) => {
    S.accent = e.target.checked;
    changed();
  });
  for (const [k, el] of Object.entries(sliders)) {
    el.addEventListener("input", () => {
      S[k] = Number(el.value);
      changed();
    });
  }
  alignBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      S.align = btn.dataset.align;
      changed();
    });
  });
  joinBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      S.join = btn.dataset.join;
      changed();
    });
  });
  $("reset").addEventListener("click", () => {
    Object.assign(S, DEFAULTS);
    changed();
    applyFont();
  });

  // ---------- Presets ----------

  // Shared presets live in one public JSON document on jsonblob.com that anyone can read
  // and write. SHARED_STORE is its id, created once from the page's ?setup-presets panel.
  const SHARED_STORE = "";
  const STORE_API = "https://jsonblob.com/api/jsonBlob";
  const LOCAL_PRESETS_KEY = "hook-gen-my-presets"; // saved on this device only
  const MINE_KEY = "hook-gen-mine"; // ids of shared presets made on this device, so they can be deleted here
  const MAX_PRESETS = 300;

  const presetList = $("presetList");
  const presetStatus = $("presetStatus");
  const builtins = BUILTIN_PRESETS.map((p) => cleanPreset({ ...p, style: { ...DEFAULTS, ...p.style } }));
  let shared = [];
  let sharedState = SHARED_STORE ? "loading" : "off"; // loading | ok | error | off
  let sharedAt = 0;

  function cleanPreset(p) {
    if (!p || typeof p !== "object") return null;
    const name = typeof p.name === "string" ? p.name.replace(/\s+/g, " ").trim().slice(0, 40) : "";
    const id = typeof p.id === "string" && /^[a-z0-9-]{1,40}$/i.test(p.id) ? p.id : "";
    if (!name || !id) return null;
    const full = cleanStyle(p.style);
    const style = {};
    for (const k of PRESET_KEYS) style[k] = full[k];
    return { id, name, style, created: typeof p.created === "number" ? p.created : 0 };
  }

  function cleanList(list) {
    const seen = new Set(), out = [];
    for (const raw of Array.isArray(list) ? list : []) {
      const p = cleanPreset(raw);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }
    return out.slice(-MAX_PRESETS);
  }

  const readJSON = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  };
  const writeJSON = (key, v) => {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {}
  };
  let local = cleanList(readJSON(LOCAL_PRESETS_KEY, []));
  const mine = new Set((readJSON(MINE_KEY, []) || []).filter((x) => typeof x === "string"));

  async function readStore() {
    const r = await fetch(`${STORE_API}/${SHARED_STORE}`, { headers: { Accept: "application/json" }, cache: "no-store" });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    return { list: cleanList(data && data.presets), etag: r.headers.get("ETag") };
  }

  // Read, change, write back. If someone else saved in between, start again.
  async function updateStore(change) {
    for (let attempt = 0; attempt < 4; attempt++) {
      const { list, etag } = await readStore();
      const next = cleanList(change(list));
      const headers = { "Content-Type": "application/json", Accept: "application/json" };
      if (etag) headers["If-Match"] = etag;
      const r = await fetch(`${STORE_API}/${SHARED_STORE}`, { method: "PUT", headers, body: JSON.stringify({ presets: next }) });
      if (r.status === 412) continue;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return next;
    }
    throw new Error("busy");
  }

  async function loadShared() {
    if (!SHARED_STORE) return;
    try {
      shared = (await readStore()).list;
      sharedState = "ok";
    } catch {
      sharedState = shared.length ? "ok" : "error";
    }
    sharedAt = Date.now();
    renderPresets();
  }

  const styleOf = () => Object.fromEntries(PRESET_KEYS.map((k) => [k, S[k]]));
  const sameStyle = (p) => PRESET_KEYS.every((k) => p.style[k] === S[k]);

  function applyPreset(p) {
    Object.assign(S, p.style);
    changed();
    applyFont();
  }

  function presetButton(p, kind) {
    const item = document.createElement("div");
    item.className = "preset";
    const b = document.createElement("button");
    b.type = "button";
    b.className = "preset-apply";
    b.dataset.id = p.id;
    const sw = document.createElement("span");
    sw.className = "preset-swatch";
    sw.setAttribute("aria-hidden", "true");
    const chip = (box, text) => Object.assign(document.createElement("i"), { textContent: "Aa", style: `background:${box};color:${text}` });
    sw.appendChild(chip(p.style.box, p.style.text));
    if (p.style.accent) sw.appendChild(chip(p.style.lastBox, p.style.lastText));
    const name = document.createElement("span");
    name.className = "preset-name";
    name.textContent = p.name;
    b.append(sw, name);
    b.addEventListener("click", () => applyPreset(p));
    item.appendChild(b);
    if (kind === "local" || (kind === "shared" && mine.has(p.id))) {
      const del = document.createElement("button");
      del.type = "button";
      del.className = "preset-delete";
      del.textContent = "×";
      del.title = kind === "shared" ? "Delete for everyone" : "Delete from this device";
      del.setAttribute("aria-label", `Delete preset ${p.name}`);
      del.addEventListener("click", () => deletePreset(p, kind));
      item.appendChild(del);
    }
    return item;
  }

  function presetGroup(title, list, kind) {
    const wrap = document.createElement("div");
    wrap.className = "preset-group";
    const h = document.createElement("h3");
    h.textContent = title;
    const row = document.createElement("div");
    row.className = "preset-row";
    for (const p of list) row.appendChild(presetButton(p, kind));
    wrap.append(h, row);
    return wrap;
  }

  function renderPresets() {
    presetList.replaceChildren(presetGroup("Built in", builtins, "builtin"));
    if (SHARED_STORE) {
      const g = presetGroup("Shared by everyone", [...shared].reverse(), "shared");
      if (!shared.length) {
        const note = document.createElement("p");
        note.className = "preset-note";
        note.textContent = sharedState === "loading" ? "Loading…" : sharedState === "error" ? "Couldn't load shared presets right now." : "None yet. Save your style to share the first one.";
        g.appendChild(note);
      }
      presetList.appendChild(g);
    }
    if (local.length) presetList.appendChild(presetGroup("On this device", [...local].reverse(), "local"));
    markActivePreset();
  }

  function markActivePreset() {
    const all = new Map([...builtins, ...shared, ...local].map((p) => [p.id, p]));
    presetList.querySelectorAll(".preset-apply").forEach((b) => b.setAttribute("aria-pressed", String(sameStyle(all.get(b.dataset.id)))));
  }

  const say = (msg) => (presetStatus.textContent = msg);

  async function savePreset(name) {
    const preset = cleanPreset({ id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`, name, style: styleOf(), created: Date.now() });
    if (!preset) return;
    if (SHARED_STORE) {
      say("Sharing…");
      try {
        shared = await updateStore((list) => [...list, preset]);
        sharedState = "ok";
        mine.add(preset.id);
        writeJSON(MINE_KEY, [...mine]);
        renderPresets();
        say(`Shared “${preset.name}”. Everyone can use it now.`);
        return;
      } catch {
        say(`Couldn't reach the shared library, so “${preset.name}” is saved on this device only.`);
      }
    } else {
      say(`Saved “${preset.name}” on this device. Shared presets aren't switched on yet.`);
    }
    local = [...local, preset].slice(-MAX_PRESETS);
    writeJSON(LOCAL_PRESETS_KEY, local);
    renderPresets();
  }

  async function deletePreset(p, kind) {
    if (!window.confirm(kind === "shared" ? `Delete “${p.name}” for everyone?` : `Delete “${p.name}” from this device?`)) return;
    if (kind === "local") {
      local = local.filter((x) => x.id !== p.id);
      writeJSON(LOCAL_PRESETS_KEY, local);
      renderPresets();
      return;
    }
    say("Deleting…");
    try {
      shared = await updateStore((list) => list.filter((x) => x.id !== p.id));
      mine.delete(p.id);
      writeJSON(MINE_KEY, [...mine]);
      renderPresets();
      say(`Deleted “${p.name}”.`);
    } catch {
      say("Couldn't reach the shared library. Try again in a moment.");
    }
  }

  const saveForm = $("saveForm");
  const saveBtn = $("savePresetBtn");
  const showSaveForm = (open) => {
    saveForm.hidden = !open;
    saveBtn.setAttribute("aria-expanded", String(open));
    if (open) $("presetName").focus();
  };
  saveBtn.addEventListener("click", () => showSaveForm(saveForm.hidden));
  $("saveCancel").addEventListener("click", () => showSaveForm(false));
  saveForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("presetName").value.replace(/\s+/g, " ").trim();
    if (!name) return;
    showSaveForm(false);
    $("presetName").value = "";
    await savePreset(name);
  });

  // Fresh shared presets when the tab comes back after a while.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && SHARED_STORE && Date.now() - sharedAt > 60000) loadShared();
  });

  // One-time setup: /?setup-presets creates the shared store from the owner's browser.
  if (new URLSearchParams(location.search).has("setup-presets")) {
    $("setupPanel").hidden = false;
    $("setupBtn").addEventListener("click", async () => {
      const out = $("setupResult");
      out.textContent = "Creating…";
      try {
        const r = await fetch(STORE_API, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ presets: [] }) });
        const id = r.headers.get("X-jsonblob-id") || (r.headers.get("Location") || "").split("/").pop();
        if (!r.ok || !id) throw new Error(`HTTP ${r.status}`);
        out.textContent = `Done! Send Claude this id: ${id}`;
      } catch (err) {
        out.textContent = `jsonblob.com refused the request (${err.message}). Shared presets can't use it from this network.`;
      }
    });
  }

  renderPresets();
  syncControls();
  loadShared();

  // ---------- Emoji picker ----------

  const picker = $("picker");
  const pickerBtn = $("emojiBtn");
  const scroller = $("pickerScroll");
  const tabs = $("pickerTabs");
  const search = $("emojiSearch");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const RECENT_KEY = "hook-gen-recent";
  let built = false;

  const loadRecent = () => {
    try {
      const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(v) ? v.filter((u) => sheetPos.has(u)) : [];
    } catch {
      return [];
    }
  };
  const saveRecent = (list) => {
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {}
  };

  const names = new Map();
  for (const cat of DATA.cats) for (const [u, n] of cat.items) names.set(u, n);

  // Picker cells are drawn from one sprite sheet per category. A sheet is loaded
  // once, then a CSS rule paints every cell of that category at the same time.
  const PICK = 30; // cell size in CSS px
  const sheetStyle = document.head.appendChild(document.createElement("style"));
  const sheetOn = new Set();
  function useSheet(i) {
    const e = sheetImage(i);
    if (!sheetOn.has(i)) {
      sheetOn.add(i);
      e.ready.then(() => {
        sheetStyle.textContent += `.sp.c${i}{background-image:url("${SHEET(i)}")}`;
      });
    }
    return e.ready;
  }

  function emojiButton(u) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.u = u;
    const label = (names.get(u) || "").split(" ").slice(0, 3).join(" ");
    b.title = label;
    b.setAttribute("aria-label", label || toChar(u));
    const pos = sheetPos.get(u);
    const sp = document.createElement("span");
    sp.className = `sp c${pos.cat}`;
    sp.style.backgroundPosition = `-${pos.col * PICK}px -${pos.row * PICK}px`;
    b.appendChild(sp);
    return b;
  }

  function section(id, title, list) {
    const s = document.createElement("section");
    s.dataset.section = id;
    const h = document.createElement("h4");
    h.textContent = title;
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const u of list) grid.appendChild(emojiButton(u));
    s.append(h, grid);
    return s;
  }

  // Loads the sheets for a list of emoji, e.g. recents or search results.
  const useSheetsFor = (list) => new Set(list.map((u) => sheetPos.get(u).cat)).forEach(useSheet);

  function tab(id, title, icon) {
    const b = document.createElement("button");
    b.type = "button";
    b.title = title;
    b.dataset.target = id;
    const img = document.createElement("img");
    img.src = IMG_HI(icon);
    img.alt = title;
    b.appendChild(img);
    return b;
  }

  function renderRecentSection() {
    const recent = loadRecent();
    scroller.querySelector('[data-section="recent"]')?.remove();
    tabs.querySelector('[data-target="recent"]')?.remove();
    if (!recent.length) return;
    useSheetsFor(recent);
    scroller.prepend(section("recent", "Recently used", recent));
    tabs.prepend(tab("recent", "Recently used", "1f550"));
  }

  async function buildPicker() {
    if (built) return;
    built = true;
    DATA.cats.forEach((cat, i) => {
      scroller.appendChild(section(`c${i}`, cat.name, cat.items.map((x) => x[0])));
      tabs.appendChild(tab(`c${i}`, cat.name, cat.icon));
    });
    renderRecentSection();
    // Whatever is on screen loads first; the rest follow one by one in the background.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          for (const en of entries) if (en.isIntersecting) useSheet(Number(en.target.dataset.section.slice(1)));
        },
        { root: scroller, rootMargin: "200px 0px" }
      );
      scroller.querySelectorAll('section[data-section^="c"]').forEach((s) => io.observe(s));
    }
    for (let i = 0; i < DATA.cats.length; i++) await useSheet(i);
  }

  // Until the textarea has been focused its caret sits at 0, so append instead.
  let caretKnown = false;
  textEl.addEventListener("focus", () => (caretKnown = true));

  function insertEmoji(u) {
    const ch = toChar(u);
    const start = caretKnown ? textEl.selectionStart : textEl.value.length;
    const end = caretKnown ? textEl.selectionEnd : textEl.value.length;
    textEl.setRangeText(ch, start, end, "end");
    caretKnown = true;
    if (!coarse) textEl.focus();
    textEl.dispatchEvent(new Event("input"));
    const recent = [u, ...loadRecent().filter((x) => x !== u)].slice(0, 24);
    saveRecent(recent);
  }

  function setPicker(open) {
    picker.hidden = !open;
    pickerBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      buildPicker();
      if (!search.value) renderRecentSection();
      if (!coarse) search.focus();
    }
  }

  pickerBtn.addEventListener("click", () => setPicker(picker.hidden));
  $("pickerClose").addEventListener("click", () => setPicker(false));
  picker.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setPicker(false);
      pickerBtn.focus();
    }
  });

  // Keep the textarea's cursor position while clicking emoji.
  scroller.addEventListener("mousedown", (e) => e.preventDefault());
  scroller.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-u]");
    if (b) insertEmoji(b.dataset.u);
  });
  tabs.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-target]");
    if (!b) return;
    if (search.value) {
      search.value = "";
      search.dispatchEvent(new Event("input"));
    }
    const target = scroller.querySelector(`[data-section="${b.dataset.target}"]`);
    if (target) scroller.scrollTop = target.offsetTop;
  });

  scroller.addEventListener("scroll", () => {
    let active = null;
    for (const s of scroller.querySelectorAll("section[data-section]")) {
      if (s.hidden) continue;
      if (s.offsetTop <= scroller.scrollTop + 8) active = s.dataset.section;
    }
    tabs.querySelectorAll("button").forEach((t) => t.classList.toggle("active", t.dataset.target === active));
  });

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    scroller.querySelector('[data-section="results"]')?.remove();
    scroller.querySelector(".picker-empty")?.remove();
    const sections = scroller.querySelectorAll("section[data-section]");
    if (!q) {
      sections.forEach((s) => (s.hidden = false));
      return;
    }
    sections.forEach((s) => (s.hidden = true));
    const words = q.split(/\s+/);
    const hits = [];
    for (const cat of DATA.cats) {
      for (const [u, n] of cat.items) {
        if (words.every((w) => n.includes(w))) hits.push(u);
        if (hits.length >= 240) break;
      }
    }
    if (!hits.length) {
      const p = document.createElement("p");
      p.className = "picker-empty";
      p.textContent = "No emoji found";
      scroller.prepend(p);
      return;
    }
    useSheetsFor(hits);
    scroller.prepend(section("results", `Results for “${search.value.trim()}”`, hits));
    scroller.scrollTop = 0;
  });

  // ---------- Start ----------

  renderReady();
  // Warm up the first picker page so it opens instantly.
  (window.requestIdleCallback || setTimeout)(() => useSheet(0));
})();
