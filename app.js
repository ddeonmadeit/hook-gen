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
  // Hook fonts. The first is the TikTok default (self-hosted, see fonts/); the rest load
  // from Google Fonts the first time they're picked. TikTok Sans variants come from the
  // page's own TikTok Sans stylesheet.
  const SANS = "system-ui, -apple-system, \"Segoe UI\", Roboto, Arial, sans-serif";
  const FONTS = [
    { id: "tiktok", name: "TikTok Sans (default)", group: "TikTok", family: '"TikTok Sans Hook", "TikTok Sans"', weight: 600, fallback: SANS },
    { id: "tiktok-bold", name: "TikTok Sans Bold", group: "TikTok", family: '"TikTok Sans"', weight: 700, fallback: SANS },
    { id: "tiktok-black", name: "TikTok Sans Black", group: "TikTok", family: '"TikTok Sans"', weight: 900, fallback: SANS },
    { id: "montserrat", name: "Montserrat", group: "Sans", css: "Montserrat:wght@800", weight: 800, fallback: SANS },
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

  // Box colour / text colour pairs offered as one-tap presets. The first is the default.
  const PRESETS = [
    ["#ffffff", "#000000"],
    ["#000000", "#ffffff"],
    ["#fe2c55", "#ffffff"],
    ["#25f4ee", "#000000"],
    ["#ffd60a", "#000000"],
    ["#ff9500", "#ffffff"],
    ["#34c759", "#ffffff"],
    ["#3496f0", "#ffffff"],
    ["#8b5cf6", "#ffffff"],
    ["#ff8fc7", "#000000"],
  ];

  const DEFAULTS = Object.freeze({
    font: "tiktok",
    box: "#ffffff",
    text: "#000000",
    opacity: 100, // box opacity, %
    round: 20, // corner roundness, 0–100; 20 = M.radius, 100 = 5× that (enough for a full pill)
    gap: 0, // gap between lines in hundredths of an em; 0 = joined (TikTok default)
    width: 11.5, // line width in em
    align: "center",
  });
  const EMOJI_FONT = `${Math.round(F * 0.9)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  const PREVIEW_SCALE = 0.5;

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

  function loadStyle() {
    const s = { ...DEFAULTS };
    try {
      const v = JSON.parse(localStorage.getItem(STYLE_KEY) || "null");
      if (v && typeof v === "object") {
        if (fontById.has(v.font)) s.font = v.font;
        for (const k of ["box", "text"]) if (/^#[0-9a-f]{6}$/i.test(v[k])) s[k] = v[k].toLowerCase();
        for (const [k, lo, hi] of [["opacity", 0, 100], ["round", 0, 100], ["gap", 0, 100], ["width", 4, 30]]) {
          if (typeof v[k] === "number" && v[k] >= lo && v[k] <= hi) s[k] = v[k];
        }
        if (["left", "center", "right"].includes(v.align)) s.align = v.align;
      }
    } catch {}
    return s;
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

  // Google Fonts stylesheets, added on first use.
  const fontSheets = new Map();
  function ensureFont(f, text) {
    let sheet = fontSheets.get(f.id);
    if (!sheet) {
      sheet = Promise.resolve();
      if (f.css) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${f.css}&display=block`;
        sheet = new Promise((resolve) => (link.onload = link.onerror = resolve));
        document.head.appendChild(link);
      }
      fontSheets.set(f.id, sheet);
    }
    // The extra letters are the ones fontShift() measures.
    return sheet.then(() => document.fonts.load(fontString(f), `${text || ""}Hdlkfbgjpqy`)).catch(() => {});
  }

  function applyFont() {
    const f = fontById.get(S.font) || FONTS[0];
    return ensureFont(f, textEl.value).then(() => {
      if (S.font !== f.id || activeFont === f) return;
      activeFont = f;
      FONT = fontString(f);
      queueRender();
    });
  }

  // How much taller / deeper the active font's letters reach than TikTok Sans, in em.
  // The box grows or shrinks by that much so every font keeps the same padding.
  function fontShift() {
    if (FONT === REF_FONT) return { a: 0, d: 0 };
    const ink = (font) => {
      ctx.font = font;
      return [ctx.measureText("Hdlkfb").actualBoundingBoxAscent / F, ctx.measureText("gjpqy").actualBoundingBoxDescent / F];
    };
    const [ra, rd] = ink(REF_FONT);
    const [ca, cd] = ink(FONT);
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
  const queueRender = () => {
    if (renderQueued) return;
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

  function wrap(text, maxW) {
    const lines = [];
    for (const para of text.split("\n")) {
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
          lines.push(cur.trimEnd());
          cur = token;
        }
        // A single word wider than the line gets broken by character.
        if (measure(cur) > maxW && !/\s/.test(cur)) {
          let piece = "";
          for (const g of graphemes(cur)) {
            if (piece && measure(piece + g) > maxW) {
              lines.push(piece);
              piece = g;
            } else {
              piece += g;
            }
          }
          cur = piece;
        }
      }
      lines.push(cur.trim());
    }
    return lines.filter((l) => l.length > 0);
  }

  // ---------- Shape ----------

  // Adds the outline of the stacked line boxes to the current path: rounded outer
  // corners, and concave rounded corners wherever a narrower line meets a wider one.
  function shapePath(L, R, tops, bottoms, r) {
    const n = L.length;
    const V = [[R[0], tops[0], r]];
    for (let i = 0; i < n - 1; i++) {
      const a = R[i], b = R[i + 1], d = Math.abs(b - a);
      if (d < 0.01) continue;
      const y = b < a ? bottoms[i] : tops[i + 1];
      const rr = Math.min(r, d / 2);
      V.push([a, y, rr], [b, y, rr]);
    }
    V.push([R[n - 1], bottoms[n - 1], r], [L[n - 1], bottoms[n - 1], r]);
    for (let i = n - 2; i >= 0; i--) {
      const a = L[i + 1], b = L[i], d = Math.abs(b - a);
      if (d < 0.01) continue;
      const y = a > b ? bottoms[i] : tops[i + 1];
      const rr = Math.min(r, d / 2);
      V.push([a, y, rr], [b, y, rr]);
    }
    V.push([L[0], tops[0], r]);

    // A corner can use at most half of each edge it touches (matters for big radii).
    const half = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]) / 2;
    V.forEach((v, k) => {
      v[2] = Math.min(v[2], half(V[(k + V.length - 1) % V.length], v), half(v, V[(k + 1) % V.length]));
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
  function snapEdges(E, pick) {
    const snap = M.snap * F;
    for (let pass = 0; pass < E.length; pass++) {
      let changed = false;
      for (let i = 0; i < E.length - 1; i++) {
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
    const lines = wrap(smarten(textEl.value), S.width * F);
    const emoji = [];
    for (const l of lines) for (const tok of tokenize(l)) if (tok.t === "emoji") emoji.push(tok.u);
    return { lines, emoji };
  }

  function render() {
    current = layout();
    const { lines } = current;
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
    const shift = fontShift();
    const padX = M.padX * F, r = M.radius * (S.round / 20) * F, margin = Math.ceil(M.margin * F);
    // Gap 0 joins the lines into one TikTok-style shape; any gap gives each line its own box.
    const joined = S.gap === 0;
    const top = (M.rectTop + shift.a) * F;
    const bottom = (M.rectBottom + shift.d) * F;
    const lastBottom = (M.lastBottom + shift.d) * F;
    const pitch = joined ? M.pitch + shift.a + shift.d : (top + lastBottom) / F + S.gap / 100;
    const widths = lines.map(measure);
    const boxW = widths.map((w) => w + 2 * padX);
    const maxW = Math.max(...boxW);

    const L = [], R = [], textX = [], baselines = [], tops = [], bottoms = [];
    lines.forEach((_, i) => {
      const x = S.align === "left" ? 0 : S.align === "right" ? maxW - boxW[i] : (maxW - boxW[i]) / 2;
      L.push(x + margin);
      R.push(x + boxW[i] + margin);
      textX.push(x + padX + margin);
      const base = margin + top + i * pitch * F;
      baselines.push(base);
      tops.push(base - top);
      bottoms.push(base + (!joined || i === lines.length - 1 ? lastBottom : bottom));
    });
    if (joined) {
      snapEdges(L, Math.min);
      snapEdges(R, Math.max);
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
      ctx.fillStyle = S.box;
      ctx.globalAlpha = S.opacity / 100;
      ctx.beginPath();
      if (joined) shapePath(L, R, tops, bottoms, r);
      else lines.forEach((_, i) => shapePath([L[i]], [R[i]], [tops[i]], [bottoms[i]], r));
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = S.text;
    ctx.textBaseline = "alphabetic";
    lines.forEach((line, i) => {
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

  $("download").addEventListener("click", async () => {
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
  const boxEl = $("boxColor");
  const textColorEl = $("textColor");
  const opacityEl = $("opacity");
  const roundEl = $("round");
  const gapEl = $("gap");
  const presetsEl = $("presets");
  const alignBtns = document.querySelectorAll(".segmented button");

  const groups = new Map();
  for (const f of FONTS) {
    if (!groups.has(f.group)) groups.set(f.group, fontEl.appendChild(Object.assign(document.createElement("optgroup"), { label: f.group })));
    groups.get(f.group).appendChild(new Option(f.name, f.id));
  }

  for (const [box, text] of PRESETS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "Aa";
    b.style.background = box;
    b.style.color = text;
    b.dataset.box = box;
    b.dataset.text = text;
    b.setAttribute("aria-label", `${box} box with ${text} text`);
    b.title = `Box ${box.toUpperCase()}, text ${text.toUpperCase()}`;
    presetsEl.appendChild(b);
  }

  // Puts every control in line with S.
  function syncControls() {
    fontEl.value = S.font;
    boxEl.value = S.box;
    textColorEl.value = S.text;
    $("boxHex").textContent = S.box.toUpperCase();
    $("textHex").textContent = S.text.toUpperCase();
    presetsEl.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.box === S.box && b.dataset.text === S.text)));
    opacityEl.value = S.opacity;
    $("opacityOut").textContent = `${S.opacity}%`;
    roundEl.value = S.round;
    $("roundOut").textContent = S.round === DEFAULTS.round ? `${S.round} (default)` : String(S.round);
    gapEl.value = S.gap;
    $("gapOut").textContent = S.gap === 0 ? "Joined (default)" : String(S.gap);
    widthEl.value = S.width;
    widthOut.textContent = S.width.toFixed(1);
    alignBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.align === S.align)));
  }

  function changed() {
    syncControls();
    saveStyle();
    queueRender();
  }

  textEl.addEventListener("input", () => {
    queueRender();
    document.fonts.load(FONT, textEl.value || "a").then(queueRender, () => {});
  });
  fontEl.addEventListener("change", () => {
    S.font = fontEl.value;
    changed();
    applyFont();
  });
  boxEl.addEventListener("input", () => {
    S.box = boxEl.value.toLowerCase();
    changed();
  });
  textColorEl.addEventListener("input", () => {
    S.text = textColorEl.value.toLowerCase();
    changed();
  });
  presetsEl.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-box]");
    if (!b) return;
    S.box = b.dataset.box;
    S.text = b.dataset.text;
    changed();
  });
  for (const [el, key] of [[opacityEl, "opacity"], [roundEl, "round"], [gapEl, "gap"], [widthEl, "width"]]) {
    el.addEventListener("input", () => {
      S[key] = Number(el.value);
      changed();
    });
  }
  alignBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      S.align = btn.dataset.align;
      changed();
    });
  });
  $("reset").addEventListener("click", () => {
    Object.assign(S, DEFAULTS);
    changed();
    applyFont();
  });

  syncControls();

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
