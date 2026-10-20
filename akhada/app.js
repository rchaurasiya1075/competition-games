import { createAudio, createRecorder } from "./audio.js";
import { drawBackdrop, drawFighter, fx, shortName } from "./draw.js";
import { GAMES, LEVELS, createMatch } from "./games.js";

const KEY = "janata-akhada-v1";
const CLOTHS = ["#e07a2f", "#f4f1ea", "#1d4e89", "#b8432f", "#6e8b74", "#e7b7c8", "#2c2a26", "#245c48"];
const HAIR = ["Ganja", "Chhote", "Lambe", "Side"];
const BEARD = ["Nahi", "Halki", "Bhari"];
const BODY = ["Patla", "Mazboot", "Bhari"];
const FACE = ["Gol", "Lamba", "Chauras"];

const PRESETS = [
  { id: "modi", name: "Narendra Modi", cloth: "#e07a2f", hair: 1, hairColor: "#eceae4", beard: 2, beardColor: "#eceae4", glasses: true, face: 1, body: 1, skin: 2 },
  { id: "rahul", name: "Rahul Gandhi", cloth: "#f4f1ea", hair: 1, hairColor: "#241c16", beard: 1, beardColor: "#3a2e26", glasses: false, face: 1, body: 1, skin: 2 },
  { id: "kejri", name: "Arvind Kejriwal", cloth: "#f7f5f0", hair: 1, hairColor: "#1a1a1a", beard: 0, glasses: true, muffler: "#1d4e89", face: 2, body: 0, skin: 2 },
  { id: "shah", name: "Amit Shah", cloth: "#f4f1ea", hair: 3, hairColor: "#d9d4cc", beard: 0, glasses: true, face: 2, body: 1, skin: 2 },
  { id: "yogi", name: "Yogi Adityanath", cloth: "#d2652a", hair: 0, hairColor: "#1a1a1a", beard: 0, glasses: false, face: 1, body: 1, skin: 2 },
  { id: "mamata", name: "Mamata Banerjee", cloth: "#f7f4ee", hair: 2, hairColor: "#1c1c1c", beard: 0, glasses: false, face: 0, body: 0, skin: 2, saree: "#2a4d8f", gender: "f" },
  { id: "akhilesh", name: "Akhilesh Yadav", cloth: "#f4f1ea", hair: 1, hairColor: "#1a1a1a", beard: 0, glasses: false, cap: "#b8432f", face: 1, body: 1, skin: 2 },
  { id: "nitish", name: "Nitish Kumar", cloth: "#f4f1ea", hair: 1, hairColor: "#c8c2b8", beard: 0, glasses: true, face: 1, body: 0, skin: 2 },
  { id: "priyanka", name: "Priyanka Gandhi", cloth: "#f0d2c4", hair: 2, hairColor: "#1a120e", beard: 0, glasses: false, face: 0, body: 0, skin: 1, gender: "f" },
  { id: "gadkari", name: "Nitin Gadkari", cloth: "#f7f7f5", hair: 1, hairColor: "#2a2a2a", beard: 0, glasses: true, face: 2, body: 2, skin: 2 },
  { id: "smriti", name: "Smriti Irani", cloth: "#b8432f", hair: 2, hairColor: "#1a120e", beard: 0, glasses: false, face: 0, body: 0, skin: 1, gender: "f" },
  { id: "maya", name: "Mayawati", cloth: "#e7b7c8", hair: 2, hairColor: "#1a1a1a", beard: 0, glasses: false, face: 1, body: 1, skin: 2, gender: "f" },
  { id: "stalin", name: "M. K. Stalin", cloth: "#f4f1ea", hair: 1, hairColor: "#2c241c", beard: 1, beardColor: "#3a2a22", glasses: false, face: 2, body: 1, skin: 3 },
  { id: "naidu", name: "Chandrababu Naidu", cloth: "#f4f1ea", hair: 1, hairColor: "#e8e4dc", beard: 0, glasses: false, face: 1, body: 0, skin: 3 },
  { id: "tharoor", name: "Shashi Tharoor", cloth: "#243044", hair: 1, hairColor: "#d8d2c8", beard: 0, glasses: false, face: 1, body: 1, skin: 2 },
  { id: "nirmala", name: "Nirmala Sitharaman", cloth: "#6e8b74", hair: 2, hairColor: "#1a120e", beard: 0, glasses: false, face: 0, body: 0, skin: 2, saree: "#c9a06a", gender: "f" },
  { id: "apna", name: "Apna khiladi", cloth: "#f4f1ea", hair: 1, hairColor: "#241c16", beard: 0, glasses: false, face: 0, body: 1, skin: 2 },
];

function clonePreset(p) {
  return {
    preset: p.id,
    name: p.name,
    cloth: p.cloth,
    hair: p.hair,
    hairColor: p.hairColor,
    beard: p.beard,
    beardColor: p.beardColor || p.hairColor,
    glasses: !!p.glasses,
    face: p.face,
    body: p.body,
    skin: p.skin,
    saree: p.saree || "",
    gender: p.gender || "",
    muffler: p.muffler || "",
    cap: p.cap || "",
  };
}

const audio = createAudio();
let root = null;
let raf = 0;
let stopListen = () => {};
const input = {
  held: [false, false],
  heldB: [false, false],
  edge: [false, false],
  edgeB: [false, false],
  zone: [-1, -1],
};

const S = {
  level: 2,
  p1: clonePreset(PRESETS[0]),
  p2: clonePreset(PRESETS[1]),
  p2cpu: false,
  music: true,
  sfx: true,
  tally: [0, 0],
  series: null,
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!raw) return;
    if (raw.p1) S.p1 = { ...S.p1, ...raw.p1 };
    if (raw.p2) S.p2 = { ...S.p2, ...raw.p2 };
    if (typeof raw.p2cpu === "boolean") S.p2cpu = raw.p2cpu;
    if (raw.level >= 1 && raw.level <= 5) S.level = raw.level;
    if (Array.isArray(raw.tally)) S.tally = [raw.tally[0] | 0, raw.tally[1] | 0];
    if (typeof raw.music === "boolean") S.music = raw.music;
    if (typeof raw.sfx === "boolean") S.sfx = raw.sfx;
  } catch {
    /* ignore broken save */
  }
}

function save() {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        level: S.level,
        p1: S.p1,
        p2: S.p2,
        p2cpu: S.p2cpu,
        music: S.music,
        sfx: S.sfx,
        tally: S.tally,
      }),
    );
  } catch {
    /* ignore quota */
  }
}

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function toast(msg) {
  const t = el("div", "toast", msg);
  root.appendChild(t);
  setTimeout(() => t.remove(), 2400);
}

function paintPortrait(canvas, fighter) {
  const ctx = canvas.getContext("2d");
  canvas.width = 144;
  canvas.height = 168;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.fillStyle = "#1c1a17";
  ctx.fillRect(0, 0, 72, 84);
  drawFighter(ctx, 36, 80, 68, fighter, { expr: "idle", armL: 0.2, armR: -0.2 });
}

function applyPreset(player, preset) {
  const prev = PRESETS.find((p) => p.id === player.preset);
  const keepName = player.name && (!prev || player.name !== prev.name);
  const next = clonePreset(preset);
  if (keepName) next.name = player.name;
  return next;
}

function ensureCss() {
  if (document.getElementById("akhada-css")) return;
  const link = document.createElement("link");
  link.id = "akhada-css";
  link.rel = "stylesheet";
  link.href = new URL("./styles.css", import.meta.url).href;
  document.head.appendChild(link);
}

export function startAkhada(mount) {
  root = mount;
  ensureCss();
  load();
  audio.setMusic(S.music);
  audio.setSfx(S.sfx);
  const ac = new AbortController();
  stopListen = () => ac.abort();
  window.addEventListener("keydown", onKey, { signal: ac.signal });
  window.addEventListener("keyup", onKeyUp, { signal: ac.signal });
  showHome();
  window.__akhada = S;
  return stopAll;
}

function stopAll() {
  cancelAnimationFrame(raf);
  raf = 0;
  stopListen();
  audio.stop();
}

function unlock() {
  audio.unlock();
  audio.setMusic(S.music);
  audio.setSfx(S.sfx);
}

function showHome() {
  cancelAnimationFrame(raf);
  const screen = el("div", "screen home");
  const wrap = el("div", "wrap");
  const hero = el("canvas", "hero");
  wrap.appendChild(hero);
  const kicker = el("p", "kicker", "Do khiladi");
  const title = el("h1", "", "Janata Akhada");
  const lede = el("p", "lede", "Naam likho, chehra chuno. Har dangal alag maidan, ek hi winner.");
  const actions = el("div", "stack");
  const two = el("button", "primary", "Do log khelein");
  const cpu = el("button", "ghost", "Dono khud khelen");
  two.onclick = () => {
    unlock();
    S.p2cpu = false;
    save();
    showRoster();
  };
  cpu.onclick = () => {
    unlock();
    S.p2cpu = true;
    save();
    showRoster();
  };
  actions.append(two, cpu);
  const tally = el("p", "lede", `Jeet ka hisaab: ${S.tally[0]} – ${S.tally[1]}`);
  const toggles = el("div", "row");
  toggles.append(toggle("Sangeet", S.music, (on) => {
    S.music = on;
    audio.setMusic(on);
    if (on) unlock();
    save();
  }));
  toggles.append(toggle("Awaz", S.sfx, (on) => {
    S.sfx = on;
    audio.setSfx(on);
    save();
  }));
  wrap.append(kicker, title, lede, actions, tally, toggles);
  screen.appendChild(wrap);
  root.replaceChildren(screen);
  startHero(hero);
}

function toggle(label, on, fn) {
  const b = el("button", "ghost", label);
  b.setAttribute("aria-pressed", on ? "true" : "false");
  b.onclick = () => {
    const next = b.getAttribute("aria-pressed") !== "true";
    b.setAttribute("aria-pressed", next ? "true" : "false");
    fn(next);
  };
  return b;
}

function startHero(canvas) {
  const ctx = canvas.getContext("2d");
  let last = 0;
  const loop = (ts) => {
    if (!canvas.isConnected) return;
    raf = requestAnimationFrame(loop);
    if (!last) last = ts;
    const t = ts / 1000;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = Math.max(2, Math.floor(rect.width * dpr));
    const h = Math.max(2, Math.floor(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawBackdrop(ctx, rect.width, rect.height, "akhada", t);
    const bob = Math.sin(t * 1.6) * 0.04;
    drawFighter(ctx, rect.width * 0.32, rect.height * 0.9, Math.min(130, rect.height * 0.7), S.p1, {
      lean: -0.12 + bob,
      armL: 1.05,
      armR: 1.25,
      expr: "focus",
    });
    drawFighter(ctx, rect.width * 0.68, rect.height * 0.9, Math.min(130, rect.height * 0.7), S.p2, {
      lean: 0.12 - bob,
      armL: -1.25,
      armR: -1.05,
      expr: "focus",
    });
  };
  raf = requestAnimationFrame(loop);
}

function showRoster() {
  cancelAnimationFrame(raf);
  const screen = el("div", "screen roster");
  const wrap = el("div", "wrap");
  wrap.append(el("p", "kicker", "Roster"), el("h1", "", "Apna khiladi"));
  const grid = el("div", "players");
  grid.append(playerCard(0), playerCard(1));
  wrap.appendChild(grid);
  wrap.append(el("p", "label", "Star"));
  const segs = el("div", "segs");
  LEVELS.forEach((name, i) => {
    const b = el("button", S.level === i + 1 ? "seg on" : "seg", name);
    b.onclick = () => {
      S.level = i + 1;
      save();
      showRoster();
    };
    segs.appendChild(b);
  });
  wrap.appendChild(segs);
  const go = el("button", "primary", "Game chuno");
  go.style.marginTop = "16px";
  go.onclick = () => {
    unlock();
    save();
    showPick();
  };
  const back = el("button", "ghost", "Wapas");
  back.onclick = () => showHome();
  const row = el("div", "row");
  row.style.marginTop = "12px";
  row.append(go, back);
  wrap.appendChild(row);
  screen.appendChild(wrap);
  root.replaceChildren(screen);
}

function playerCard(index) {
  const player = index === 0 ? S.p1 : S.p2;
  const card = el("section", "panel");
  card.append(el("h2", "", index === 0 ? "Khiladi 1" : "Khiladi 2"));
  const nameLabel = el("label", "label", "Naam");
  const name = el("input");
  name.type = "text";
  name.maxLength = 18;
  name.value = player.name;
  name.oninput = () => {
    player.name = name.value.slice(0, 18);
    save();
  };
  card.append(nameLabel, name);
  card.append(el("p", "label", "Character"));
  const scroller = el("div", "presets");
  PRESETS.forEach((preset) => {
    const b = el("button", preset.id === player.preset ? "preset on" : "preset");
    const c = document.createElement("canvas");
    paintPortrait(c, clonePreset(preset));
    const s = el("span", "", preset.name);
    b.append(c, s);
    b.onclick = () => {
      const next = applyPreset(player, preset);
      if (index === 0) S.p1 = next;
      else S.p2 = next;
      save();
      showRoster();
    };
    scroller.appendChild(b);
  });
  card.appendChild(scroller);
  card.append(el("p", "label", "Rang"));
  const skins = el("div", "swatches");
  ["#f3d0b0", "#e0b089", "#c48852", "#8d5524", "#5c3317"].forEach((color, i) => {
    const b = el("button", player.skin === i ? "swatch on" : "swatch");
    b.style.background = color;
    b.setAttribute("aria-label", `Rang ${i + 1}`);
    b.onclick = () => {
      player.skin = i;
      save();
      showRoster();
    };
    skins.appendChild(b);
  });
  card.appendChild(skins);
  card.append(el("p", "label", "Kapda"));
  const cloths = el("div", "swatches");
  CLOTHS.forEach((color) => {
    const b = el("button", player.cloth === color ? "swatch on" : "swatch");
    b.style.background = color;
    b.setAttribute("aria-label", "Kapde ka rang");
    b.onclick = () => {
      player.cloth = color;
      save();
      showRoster();
    };
    cloths.appendChild(b);
  });
  card.appendChild(cloths);
  card.append(choiceRow("Shareer", BODY, player.body, (i) => {
    player.body = i;
  }));
  card.append(choiceRow("Chehra", FACE, player.face, (i) => {
    player.face = i;
  }));
  card.append(choiceRow("Baal", HAIR, player.hair, (i) => {
    player.hair = i;
  }));
  card.append(choiceRow("Daadhi", BEARD, player.beard, (i) => {
    player.beard = i;
  }));
  const glasses = el("button", player.glasses ? "chip on" : "chip", "Chashma");
  glasses.onclick = () => {
    player.glasses = !player.glasses;
    save();
    showRoster();
  };
  card.appendChild(glasses);
  return card;
}

function choiceRow(label, items, value, fn) {
  const box = el("div");
  box.append(el("p", "label", label));
  const row = el("div", "chips");
  items.forEach((name, i) => {
    const b = el("button", value === i ? "chip on" : "chip", name);
    b.onclick = () => {
      fn(i);
      save();
      showRoster();
    };
    row.appendChild(b);
  });
  box.appendChild(row);
  return box;
}

function showPick() {
  cancelAnimationFrame(raf);
  const screen = el("div", "screen pick");
  const wrap = el("div", "wrap");
  wrap.append(el("p", "kicker", LEVELS[S.level - 1]), el("h1", "", "Kaun sa dangal"));
  wrap.append(el("p", "lede", `${shortName(S.p1.name)} aur ${shortName(S.p2.name)} khud khelenge.`));
  const series = el("button", "game wide");
  series.append(el("span", "mark", "POORI SERIES"), el("strong", "", "Ikkis game, ek bajrang"), el("p", "", "Saare game khelo. Jis ke zyada jeet, wahi winner."));
  series.onclick = () => {
    unlock();
    S.series = { ids: GAMES.map((g) => g.id), index: 0, score: [0, 0] };
    startMatch(S.series.ids[0]);
  };
  const games = el("div", "games");
  games.appendChild(series);
  GAMES.forEach((g, i) => {
    const b = el("button", "game");
    b.append(el("span", "mark", String(i + 1).padStart(2, "0")), el("strong", "", g.name), el("p", "", g.line));
    b.onclick = () => {
      unlock();
      S.series = null;
      startMatch(g.id);
    };
    games.appendChild(b);
  });
  wrap.appendChild(games);
  const back = el("button", "ghost", "Roster");
  back.style.marginTop = "14px";
  back.onclick = () => showRoster();
  wrap.appendChild(back);
  screen.appendChild(wrap);
  root.replaceChildren(screen);
}

function clearEdges() {
  input.edge = [false, false];
  input.edgeB = [false, false];
  input.zone = [-1, -1];
}

function onKey(e) {
  if (e.repeat) return;
  const map = {
    KeyA: [0, "edge"],
    KeyS: [0, "edge"],
    KeyF: [0, "edge"],
    KeyD: [0, "edgeB"],
    ArrowLeft: [1, "edge"],
    ArrowDown: [1, "edge"],
    KeyJ: [1, "edge"],
    ArrowRight: [1, "edgeB"],
    KeyL: [1, "edgeB"],
  };
  const zones = { KeyZ: [0, 0], KeyX: [0, 1], KeyC: [0, 2], KeyI: [1, 0], KeyO: [1, 1], KeyP: [1, 2] };
  if (map[e.code]) {
    const [p, kind] = map[e.code];
    if (kind === "edge") {
      input.held[p] = true;
      input.edge[p] = true;
    } else {
      input.heldB[p] = true;
      input.edgeB[p] = true;
    }
    e.preventDefault();
  }
  if (zones[e.code]) {
    const [p, z] = zones[e.code];
    input.zone[p] = z;
    input.edge[p] = true;
    e.preventDefault();
  }
}

function onKeyUp(e) {
  if (["KeyA", "KeyS", "KeyF"].includes(e.code)) input.held[0] = false;
  if (e.code === "KeyD") input.heldB[0] = false;
  if (["ArrowLeft", "ArrowDown", "KeyJ"].includes(e.code)) input.held[1] = false;
  if (["ArrowRight", "KeyL"].includes(e.code)) input.heldB[1] = false;
}

function bindHold(btn, player, alt, zone) {
  const down = (e) => {
    e.preventDefault();
    unlock();
    try {
      btn.setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetic or already released */
    }
    if (alt) {
      input.heldB[player] = true;
      input.edgeB[player] = true;
    } else {
      input.held[player] = true;
      input.edge[player] = true;
    }
    if (zone != null) input.zone[player] = zone;
  };
  const up = () => {
    if (alt) input.heldB[player] = false;
    else input.held[player] = false;
  };
  btn.addEventListener("pointerdown", down);
  btn.addEventListener("pointerup", up);
  btn.addEventListener("pointercancel", up);
}

function startMatch(id) {
  cancelAnimationFrame(raf);
  clearEdges();
  input.held = [false, false];
  input.heldB = [false, false];
  const names = [S.p1.name.trim() || "Khiladi 1", S.p2.name.trim() || "Khiladi 2"];
  let match;
  try {
    match = createMatch(id, {
      level: S.level,
      p2cpu: S.p2cpu,
      p1: S.p1,
      p2: S.p2,
      names,
      sfx: audio,
    });
  } catch (err) {
    toast(String(err?.message || "Game nahi khuli"));
    showPick();
    return;
  }
  const screen = el("div", "match");
  const bar = el("div", "bar");
  const back = el("button", "ghost", "Wapas");
  const title = el("div", "bar-title", match.name);
  const pause = el("button", "ghost", "Roko");
  const recBtn = el("button", "ghost", "Record");
  bar.append(back, title, pause, recBtn);
  const hud = el("div", "hudline", "");
  const canvas = el("canvas", "stage");
  const meta = GAMES.find((g) => g.id === id);
  const hint = el("p", "hint", meta?.line || "");
  screen.append(bar, hud, canvas, hint);
  root.replaceChildren(screen);

  const recorder = createRecorder(canvas, audio);
  recBtn.onclick = async () => {
    unlock();
    const state = await recorder.toggle(id);
    if (state === "started") {
      recBtn.textContent = "Stop";
      recBtn.setAttribute("aria-pressed", "true");
    } else if (state === "saved") {
      recBtn.textContent = "Record";
      recBtn.setAttribute("aria-pressed", "false");
      toast("Video save ho gayi");
    } else if (state === "denied") toast("Screen permission nahi mili");
    else toast("Is browser mein recording nahi chalti");
  };

  let paused = false;
  pause.onclick = () => {
    paused = !paused;
    pause.textContent = paused ? "Chalu" : "Roko";
  };
  back.onclick = () => {
    recorder.stop();
    cancelAnimationFrame(raf);
    S.series = null;
    showPick();
  };

  const ctx = canvas.getContext("2d");
  let last = 0;
  let count = 0.45;
  let ended = false;
  let whistled = false;

  const loop = (ts) => {
    raf = requestAnimationFrame(loop);
    if (!canvas.isConnected) return;
    if (!last) last = ts;
    const dt = Math.min(0.05, (ts - last) / 1000);
    last = ts;
    fx.tick(dt);
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1);
    const bw = Math.max(2, Math.floor(rect.width * dpr));
    const bh = Math.max(2, Math.floor(rect.height * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const viewW = rect.width;
    const viewH = rect.height;
    ctx.save();
    if (fx.shake) ctx.translate((Math.random() - 0.5) * fx.shake * 8, (Math.random() - 0.5) * fx.shake * 5);
    try {
      match.draw(ctx, viewW, viewH);
    } catch (err) {
      ctx.restore();
      cancelAnimationFrame(raf);
      toast(String(err?.message || "Draw ruk gaya"));
      return;
    }
    fx.draw(ctx);
    ctx.restore();
    if (recorder.on) {
      ctx.fillStyle = "#c4503e";
      ctx.beginPath();
      ctx.arc(viewW - 16, 16, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    hud.textContent = `${LEVELS[S.level - 1]}  ·  ${match.hud?.() || ""}`;
    if (paused) {
      ctx.fillStyle = "rgba(12,11,10,0.45)";
      ctx.fillRect(0, 0, viewW, viewH);
      textCenter(ctx, "Ruka hua", viewW / 2, viewH / 2);
      clearEdges();
      return;
    }
    if (count > 0) {
      count -= dt;
      if (count <= 0 && !whistled) {
        whistled = true;
        audio.whistle();
      }
      clearEdges();
      return;
    }
    let result = null;
    try {
      result = match.update(dt, input);
    } catch (err) {
      cancelAnimationFrame(raf);
      toast(String(err?.message || "Game ruk gayi"));
      return;
    }
    clearEdges();
    if (result && !ended) {
      ended = true;
      cancelAnimationFrame(raf);
      finish(result, names, id, canvas);
    }
  };
  raf = requestAnimationFrame(loop);
}

function textCenter(ctx, str, x, y) {
  ctx.font = "600 42px FreeSans, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4f1ea";
  ctx.fillText(str, x, y);
}

function finish(result, names, id, canvas) {
  audio.cheer();
  const winner = result.winner === 1 ? 1 : 0;
  S.tally[winner] += 1;
  save();
  if (S.series) S.series.score[winner] += 1;
  const dim = el("div", "overlay");
  const card = el("div", "card");
  card.append(el("p", "kicker", "Jeet"), el("h2", "winname", names[winner]));
  card.append(el("p", "lede", result.reason || "Is game ka winner"));
  if (S.series) {
    card.append(el("p", "lede", `Series ${S.series.score[0]} – ${S.series.score[1]}`));
  }
  const row = el("div", "row");
  const again = el("button", "primary", S.series ? "Agla" : "Dobara");
  again.onclick = () => {
    if (!S.series) {
      startMatch(id);
      return;
    }
    S.series.index += 1;
    if (S.series.index >= S.series.ids.length) {
      if (S.series.score[0] === S.series.score[1]) {
        S.series.ids.push("ghanti");
        startMatch("ghanti");
        return;
      }
      showChampion(names);
      return;
    }
    startMatch(S.series.ids[S.series.index]);
  };
  const home = el("button", "ghost", "Ghar");
  home.onclick = () => {
    S.series = null;
    showHome();
  };
  row.append(again, home);
  if (!S.series) {
    const more = el("button", "ghost", "Doosra game");
    more.onclick = () => showPick();
    row.appendChild(more);
  }
  card.appendChild(row);
  dim.appendChild(card);
  root.appendChild(dim);
  if (canvas) canvas.dataset.winner = names[winner];
}

function showChampion(names) {
  cancelAnimationFrame(raf);
  const score = S.series ? S.series.score : [0, 0];
  const winner = score[0] === score[1] ? 0 : score[0] > score[1] ? 0 : 1;
  const screen = el("div", "screen home");
  const wrap = el("div", "wrap");
  wrap.append(el("p", "kicker", "Bajrang"), el("h1", "", names[winner]));
  wrap.append(el("p", "lede", `Series ${score[0]} – ${score[1]}. Saare game ka ek winner.`));
  const again = el("button", "primary", "Series phir se");
  again.onclick = () => {
    S.series = { ids: GAMES.map((g) => g.id), index: 0, score: [0, 0] };
    startMatch(S.series.ids[0]);
  };
  const home = el("button", "ghost", "Ghar");
  home.onclick = () => {
    S.series = null;
    showHome();
  };
  const row = el("div", "row");
  row.append(again, home);
  wrap.appendChild(row);
  screen.appendChild(wrap);
  root.replaceChildren(screen);
}
