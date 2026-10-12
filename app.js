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
  const WEIGHT = 600;
  const FAMILY = '"TikTok Sans Hook", "TikTok Sans", system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
  const FONT = `${WEIGHT} ${F}px ${FAMILY}`;
  const EMOJI_FONT = `${Math.round(F * 0.9)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  const PREVIEW_SCALE = 0.5;

  const DATA = window.HOOK_EMOJI;
  const IMG_HI = (u) => `https://cdn.jsdelivr.net/gh/iamcal/emoji-data@v${DATA.version}/img-apple-160/${u}.png`;
  const IMG_LO = (u) => `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@${DATA.version}/img/apple/64/${u}.png`;

  const $ = (id) => document.getElementById(id);
  const textEl = $("text");
  const widthEl = $("width");
  const widthOut = $("widthOut");
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");

  const state = { align: "center" };

  // ---------- Emoji lookup ----------

  const stripFe0f = (u) => u.split("-").filter((c) => c !== "fe0f").join("-");
  const toChar = (u) => String.fromCodePoint(...u.split("-").map((h) => parseInt(h, 16)));

  const emojiByKey = new Map();
  for (const cat of DATA.cats) for (const [u] of cat.items) emojiByKey.set(stripFe0f(u), u);
  for (const u of DATA.extra) if (!emojiByKey.has(stripFe0f(u))) emojiByKey.set(stripFe0f(u), u);

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

  function emojiImage(u) {
    let e = imgCache.get(u);
    if (!e) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      e = { img, ok: false, done: false };
      e.ready = new Promise((resolve) => {
        img.onload = () => { e.ok = true; e.done = true; resolve(); queueRender(); };
        img.onerror = () => { e.done = true; resolve(); queueRender(); };
      });
      img.src = IMG_HI(u);
      imgCache.set(u, e);
    }
    return e;
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

  // Outline of the stacked line boxes: rounded outer corners, and concave
  // rounded corners wherever a narrower line meets a wider one.
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

    const sx = (L[0] + R[0]) / 2, sy = tops[0];
    ctx.beginPath();
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
    const lines = wrap(smarten(textEl.value), parseFloat(widthEl.value) * F);
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
    const padX = M.padX * F, r = M.radius * F, margin = Math.ceil(M.margin * F);
    const widths = lines.map(measure);
    const boxW = widths.map((w) => w + 2 * padX);
    const maxW = Math.max(...boxW);

    const L = [], R = [], textX = [], baselines = [], tops = [], bottoms = [];
    lines.forEach((_, i) => {
      const x = state.align === "left" ? 0 : state.align === "right" ? maxW - boxW[i] : (maxW - boxW[i]) / 2;
      L.push(x + margin);
      R.push(x + boxW[i] + margin);
      textX.push(x + padX + margin);
      const base = margin + M.rectTop * F + i * M.pitch * F;
      baselines.push(base);
      tops.push(base - M.rectTop * F);
      bottoms.push(base + (i === lines.length - 1 ? M.lastBottom : M.rectBottom) * F);
    });
    snapEdges(L, Math.min);
    snapEdges(R, Math.max);

    const W = Math.ceil(maxW + 2 * margin);
    const H = Math.ceil(bottoms[bottoms.length - 1] + margin);
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    canvas.style.width = `${Math.round(W * PREVIEW_SCALE)}px`;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    shapePath(L, R, tops, bottoms, r);
    ctx.fill();

    ctx.fillStyle = "#000";
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
        const e = emojiImage(tok.u);
        if (e.ok) {
          ctx.drawImage(e.img, x, base - M.emojiTop * F, size, size);
        } else if (e.done) {
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
    await document.fonts.load(FONT, textEl.value || "a").catch(() => {});
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

  const showWidth = () => (widthOut.textContent = `${parseFloat(widthEl.value).toFixed(1)}`);
  showWidth();

  textEl.addEventListener("input", () => {
    queueRender();
    document.fonts.load(FONT, textEl.value || "a").then(queueRender, () => {});
  });
  widthEl.addEventListener("input", () => {
    showWidth();
    queueRender();
  });
  document.querySelectorAll(".segmented button").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.align = btn.dataset.align;
      document.querySelectorAll(".segmented button").forEach((b) => b.setAttribute("aria-checked", String(b === btn)));
      queueRender();
    });
  });

  // ---------- Emoji picker ----------

  const picker = $("picker");
  const pickerBtn = $("emojiBtn");
  const scroller = $("pickerScroll");
  const tabs = $("pickerTabs");
  const search = $("emojiSearch");
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const RECENT_KEY = "hook-gen-recent";
  let built = false;
  let observer = null;

  const loadRecent = () => {
    try {
      const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      return Array.isArray(v) ? v.filter((u) => typeof u === "string" && emojiByKey.has(stripFe0f(u))) : [];
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

  function emojiButton(u, lazy) {
    const b = document.createElement("button");
    b.type = "button";
    b.dataset.u = u;
    const label = (names.get(u) || "").split(" ").slice(0, 3).join(" ");
    b.title = label;
    const img = document.createElement("img");
    img.alt = label || toChar(u);
    img.width = 30;
    img.height = 30;
    if (lazy && observer) {
      img.dataset.src = IMG_LO(u);
      observer.observe(img);
    } else {
      img.src = IMG_LO(u);
    }
    b.appendChild(img);
    return b;
  }

  function section(id, title, list, lazy) {
    const s = document.createElement("section");
    s.dataset.section = id;
    const h = document.createElement("h4");
    h.textContent = title;
    const grid = document.createElement("div");
    grid.className = "grid";
    for (const u of list) grid.appendChild(emojiButton(u, lazy));
    s.append(h, grid);
    return s;
  }

  function tab(id, title, icon) {
    const b = document.createElement("button");
    b.type = "button";
    b.title = title;
    b.dataset.target = id;
    const img = document.createElement("img");
    img.src = IMG_LO(icon);
    img.alt = title;
    b.appendChild(img);
    return b;
  }

  function renderRecentSection() {
    const recent = loadRecent();
    scroller.querySelector('[data-section="recent"]')?.remove();
    tabs.querySelector('[data-target="recent"]')?.remove();
    if (!recent.length) return;
    scroller.prepend(section("recent", "Recently used", recent, false));
    tabs.prepend(tab("recent", "Recently used", "1f550"));
  }

  function buildPicker() {
    if (built) return;
    built = true;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const en of entries) {
            if (!en.isIntersecting) continue;
            en.target.src = en.target.dataset.src;
            observer.unobserve(en.target);
          }
        },
        { root: scroller, rootMargin: "300px 0px" }
      );
    }
    DATA.cats.forEach((cat, i) => {
      scroller.appendChild(section(`c${i}`, cat.name, cat.items.map((x) => x[0]), true));
      tabs.appendChild(tab(`c${i}`, cat.name, cat.icon));
    });
    renderRecentSection();
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
    scroller.prepend(section("results", `Results for “${search.value.trim()}”`, hits, false));
    scroller.scrollTop = 0;
  });

  // ---------- Start ----------

  renderReady();
})();
