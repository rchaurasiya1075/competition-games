import { bar, drawBackdrop, drawFighter, fx, shortName, text } from "./draw.js";

export const LEVELS = ["Mela", "Kasba", "Zila", "Rajya", "Rashtriya"];

export const GAMES = [
  { id: "rassi", name: "Rassi Khich", line: "Dono taraf khicho. Rassi apne kone tak le jao." },
  { id: "kusti", name: "Kusti", line: "Sahi mauke par pakad. Pehle paanch pakad." },
  { id: "bahu", name: "Bahu Bali", line: "Haath dabao, lekin thak mat jaana." },
  { id: "daud", name: "Sau Meter", line: "Baaya-daaya badalte raho. Galat pair pe ruk jaoge." },
  { id: "mukka", name: "Mukka", line: "Upar ya neeche — pehle sahi mukka." },
  { id: "cricket", name: "Chhakka", line: "Gend par bat. Chhah gend, zyada run." },
  { id: "teer", name: "Teerandazi", line: "Kamaan kheench ke beech mein chhodo." },
  { id: "penalty", name: "Penalty", line: "Ek shoot kare, doosra rokhe. Saath mein chuno." },
  { id: "pathar", name: "Pathar", line: "Bar sabse upar ho, tab uthao." },
  { id: "ghanti", name: "Ghanti", line: "Hari batti par pehle dabao. Lal par haar." },
];

function skillOf(level) {
  return [0.4, 0.54, 0.67, 0.8, 0.9][Math.max(0, Math.min(4, level - 1))];
}

function boom(env, x, y, color = "#e7d3a1") {
  fx.punch(0.9);
  fx.burst(x > 8 ? x : 150, y > 8 ? y : 120, color, 10);
  env.sfx?.hit?.();
}

export function createMatch(id, env) {
  const build = BUILD[id];
  if (!build) throw new Error("Yeh game nahi mili");
  const match = build({ ...env, skill: skillOf(env.level) });
  match.id = id;
  match.name = GAMES.find((g) => g.id === id)?.name || id;
  return match;
}

function feet(h) {
  return h * 0.9;
}

const BUILD = {
  rassi(env) {
    let pos = 0;
    const stam = [1, 1];
    const pull = [0, 0];
    let time = 22 - env.level * 1.5;
    let sudden = false;
    let cpuT = 0.1;
    let clock = 0;
    return {
      controls: "mash",
      verbs: ["Khicho", "Khicho"],
      update(dt, input) {
        clock += dt;
        if (!sudden) time -= dt;
        for (let p = 0; p < 2; p++) {
          stam[p] = Math.min(1, stam[p] + dt * 0.34);
          pull[p] = Math.max(0, pull[p] - dt * 1.7);
          let tap = p === 1 && env.p2cpu ? false : input.edge[p];
          if (p === 1 && env.p2cpu) {
            cpuT += dt;
            const gap = 0.28 - env.skill * 0.14;
            if (cpuT >= gap * (0.85 + Math.random() * 0.3)) {
              cpuT = 0;
              tap = true;
            }
          }
          if (!tap) continue;
          env.sfx?.tap?.();
          if (stam[p] > 0.12) {
            pull[p] += 0.085 * (0.4 + stam[p]);
            stam[p] = Math.max(0, stam[p] - 0.07);
          } else pull[p] += 0.02;
        }
        pos += (pull[1] - pull[0]) * dt * 3.4;
        pos = Math.max(-1.2, Math.min(1.2, pos));
        if (pos <= -1) return { winner: 0, reason: "Rassi is taraf aa gayi" };
        if (pos >= 1) return { winner: 1, reason: "Rassi us taraf aa gayi" };
        if (!sudden && time <= 0) {
          if (Math.abs(pos) > 0.06) return { winner: pos < 0 ? 0 : 1, reason: "Samay khatam" };
          sudden = true;
        }
        return null;
      },
      hud() {
        return sudden ? "Sudden — koi ek kheenche" : `Samay ${Math.max(0, time).toFixed(0)}s`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "akhada", clock);
        const x1 = w * 0.24 + pos * w * 0.1;
        const x2 = w * 0.76 + pos * w * 0.1;
        const y = feet(h);
        const ropeY = y - h * 0.22;
        ctx.strokeStyle = "#c2a36e";
        ctx.lineWidth = 7;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1 + 20, ropeY);
        ctx.lineTo(x2 - 20, ropeY);
        ctx.stroke();
        ctx.fillStyle = "#6b4428";
        ctx.fillRect((x1 + x2) / 2 - 7, ropeY - 10, 14, 20);
        const hgt = Math.min(168, h * 0.42);
        drawFighter(ctx, x1, y, hgt, env.p1, { lean: -0.16, armL: 1.15, armR: 1.35, expr: pull[0] > pull[1] ? "focus" : "hurt" });
        drawFighter(ctx, x2, y, hgt, env.p2, { lean: 0.16, armL: -1.35, armR: -1.15, expr: pull[1] > pull[0] ? "focus" : "hurt" });
        text(ctx, shortName(env.names[0]), x1, y - hgt - 8, { size: 13 });
        text(ctx, shortName(env.names[1]), x2, y - hgt - 8, { size: 13 });
        bar(ctx, w * 0.2, h * 0.14, w * 0.6, 10, (pos + 1) / 2, 0, 0);
      },
    };
  },

  kusti(env) {
    const score = [0, 0];
    const phase = [Math.random(), Math.random() * 0.5];
    const width = Math.max(0.08, 0.18 - env.level * 0.018);
    const speed = 0.42 + env.level * 0.07;
    let clock = 0;
    let lock = [0, 0];
    let flash = ["", ""];
    let flashT = [0, 0];
    const need = 5;
    return {
      controls: "tap",
      verbs: ["Pakdo", "Pakdo"],
      update(dt, input) {
        clock += dt;
        for (let p = 0; p < 2; p++) {
          phase[p] = (phase[p] + dt * speed) % 1;
          lock[p] = Math.max(0, lock[p] - dt);
          flashT[p] = Math.max(0, flashT[p] - dt);
          const center = 0.5;
          const t = phase[p];
          const inZone = Math.abs(t - center) < width / 2 || Math.abs(t - center) > 1 - width / 2;
          let tap = p === 1 && env.p2cpu ? false : input.edge[p];
          if (p === 1 && env.p2cpu && lock[p] <= 0) {
            const miss = Math.random() > env.skill;
            const target = miss ? center + width : center;
            if (Math.abs(t - target) < 0.03) tap = true;
          }
          if (!tap || lock[p] > 0) continue;
          env.sfx?.tap?.();
          if (inZone) {
            score[p] += 1;
            flash[p] = "Pakad";
            boom(env, p === 0 ? 0 : 0, 0);
          } else {
            flash[p] = "Chhuk";
            lock[p] = 0.28;
            env.sfx?.miss?.();
          }
          flashT[p] = 0.45;
        }
        if (score[0] >= need || score[1] >= need) {
          if (score[0] !== score[1]) return { winner: score[0] > score[1] ? 0 : 1, reason: `${score[0]}–${score[1]} pakad` };
        }
        return null;
      },
      hud() {
        return `Pakad ${score[0]} – ${score[1]}  ·  ${need} tak`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "akhada", clock);
        const y = feet(h);
        const hgt = Math.min(170, h * 0.4);
        const lean = (score[1] - score[0]) * 0.03;
        drawFighter(ctx, w * 0.38, y, hgt, env.p1, { lean: -0.12 + lean, armL: 0.9, armR: 1.1, expr: flash[0] === "Pakad" && flashT[0] > 0 ? "win" : "focus" });
        drawFighter(ctx, w * 0.62, y, hgt, env.p2, { lean: 0.12 + lean, armL: -1.1, armR: -0.9, expr: flash[1] === "Pakad" && flashT[1] > 0 ? "win" : "focus" });
        text(ctx, shortName(env.names[0]), w * 0.22, h * 0.2, { size: 13 });
        text(ctx, shortName(env.names[1]), w * 0.78, h * 0.2, { size: 13 });
        bar(ctx, w * 0.08, h * 0.28, w * 0.3, 12, phase[0], 0.5 - width / 2, 0.5 + width / 2);
        bar(ctx, w * 0.62, h * 0.28, w * 0.3, 12, phase[1], 0.5 - width / 2, 0.5 + width / 2);
        if (flashT[0] > 0) text(ctx, flash[0], w * 0.23, h * 0.4, { size: 18 });
        if (flashT[1] > 0) text(ctx, flash[1], w * 0.77, h * 0.4, { size: 18 });
      },
    };
  },

  bahu(env) {
    let pos = 0;
    const stam = [1, 1];
    const force = [0, 0];
    let clock = 0;
    let cpuT = 0.12;
    let time = 18 - env.level;
    return {
      controls: "mash",
      verbs: ["Dabao", "Dabao"],
      update(dt, input) {
        clock += dt;
        time -= dt;
        for (let p = 0; p < 2; p++) {
          stam[p] = Math.min(1, stam[p] + dt * 0.28);
          force[p] *= Math.max(0, 1 - dt * 1.4);
          let tap = p === 1 && env.p2cpu ? false : input.edge[p];
          if (p === 1 && env.p2cpu) {
            cpuT += dt;
            const gap = 0.22 + (1 - env.skill) * 0.12;
            if (cpuT >= gap) {
              cpuT = 0;
              tap = true;
            }
          }
          if (!tap) continue;
          env.sfx?.tap?.();
          if (stam[p] > 0.22) {
            force[p] += 0.16 * stam[p];
            stam[p] -= 0.1;
          } else {
            force[p] -= 0.08;
            stam[p] = Math.max(0, stam[p] - 0.04);
            env.sfx?.miss?.();
          }
        }
        pos += (force[1] - force[0]) * dt * 1.6;
        pos = Math.max(-1.05, Math.min(1.05, pos));
        if (pos <= -1) return { winner: 0, reason: "Haath dab gaya" };
        if (pos >= 1) return { winner: 1, reason: "Haath dab gaya" };
        if (time <= 0 && Math.abs(pos) > 0.05) return { winner: pos < 0 ? 0 : 1, reason: "Samay khatam" };
        if (time < -6) return { winner: pos <= 0 ? 0 : 1, reason: "Akhiri dabav" };
        return null;
      },
      hud() {
        return time > 0 ? `Samay ${Math.ceil(time)}s` : "Akhiri dabav";
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "table", clock);
        const y = h * 0.78;
        const hgt = Math.min(150, h * 0.36);
        drawFighter(ctx, w * 0.2, y, hgt, env.p1, { lean: -0.04, armL: 0.4, armR: 1.2, expr: "focus" });
        drawFighter(ctx, w * 0.8, y, hgt, env.p2, { lean: 0.04, armL: -1.2, armR: -0.4, expr: "focus" });
        const handX = w * 0.5 + pos * w * 0.22;
        const handY = h * 0.58;
        ctx.strokeStyle = SKINS_SAFE(env.p1);
        ctx.lineWidth = 14;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(w * 0.32, h * 0.6);
        ctx.quadraticCurveTo(w * 0.4, h * 0.5, handX, handY);
        ctx.stroke();
        ctx.strokeStyle = SKINS_SAFE(env.p2);
        ctx.beginPath();
        ctx.moveTo(w * 0.68, h * 0.6);
        ctx.quadraticCurveTo(w * 0.6, h * 0.5, handX, handY);
        ctx.stroke();
        ctx.fillStyle = "#f4f1ea";
        ctx.beginPath();
        ctx.arc(handX, handY, 11, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, shortName(env.names[0]), w * 0.2, h * 0.22, { size: 13 });
        text(ctx, shortName(env.names[1]), w * 0.8, h * 0.22, { size: 13 });
        bar(ctx, w * 0.08, h * 0.3, w * 0.28, 8, stam[0], 0, 0);
        bar(ctx, w * 0.64, h * 0.3, w * 0.28, 8, stam[1], 0, 0);
      },
    };
  },

  daud(env) {
    const pos = [0, 0];
    const expect = [0, 0];
    const lock = [0, 0];
    const since = [0.3, 0.3];
    let clock = 0;
    let cpuT = 0.05;
    let cpuLeg = 0;
    const ideal = 0.3 - (env.level - 1) * 0.028;
    function step(p, leg) {
      if (lock[p] > 0) return;
      if (leg !== expect[p]) {
        lock[p] = 0.32;
        pos[p] = Math.max(0, pos[p] - 3);
        env.sfx?.miss?.();
        return;
      }
      const err = Math.abs(since[p] - ideal);
      const add = Math.max(1.2, 4.2 - err * 14);
      pos[p] += add;
      expect[p] = 1 - expect[p];
      since[p] = 0;
      env.sfx?.tap?.();
    }
    return {
      controls: "dual",
      verbs: ["Baaya", "Daaya"],
      update(dt, input) {
        clock += dt;
        for (let p = 0; p < 2; p++) {
          since[p] += dt;
          lock[p] = Math.max(0, lock[p] - dt);
        }
        if (!(env.p2cpu && false)) {
          if (input.edge[0]) step(0, 0);
          if (input.edgeB[0]) step(0, 1);
        }
        if (!env.p2cpu) {
          if (input.edge[1]) step(1, 0);
          if (input.edgeB[1]) step(1, 1);
        } else {
          cpuT += dt;
          const gap = ideal * (0.92 + (1 - env.skill) * 0.35);
          if (cpuT >= gap) {
            cpuT = 0;
            if (Math.random() < env.skill) step(1, cpuLeg);
            else step(1, 1 - cpuLeg);
            cpuLeg = 1 - cpuLeg;
          }
        }
        if (pos[0] >= 100 || pos[1] >= 100) {
          return { winner: pos[0] === pos[1] ? (Math.random() < 0.5 ? 0 : 1) : pos[0] > pos[1] ? 0 : 1, reason: "Finish line" };
        }
        return null;
      },
      hud() {
        return `${Math.floor(pos[0])}m – ${Math.floor(pos[1])}m`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "track", clock);
        const hgt = Math.min(130, h * 0.32);
        const xOf = (p) => w * 0.08 + (pos[p] / 100) * w * 0.72;
        drawFighter(ctx, xOf(0), h * 0.74, hgt, env.p1, {
          stride: Math.sin(clock * 14) * (lock[0] > 0 ? 0 : 0.8),
          armL: Math.sin(clock * 14),
          armR: -Math.sin(clock * 14),
          lean: -0.08,
          expr: lock[0] > 0 ? "hurt" : "focus",
        });
        drawFighter(ctx, xOf(1), h * 0.9, hgt, env.p2, {
          stride: Math.sin(clock * 14 + 1) * (lock[1] > 0 ? 0 : 0.8),
          armL: Math.sin(clock * 14 + 1),
          armR: -Math.sin(clock * 14 + 1),
          lean: -0.08,
          expr: lock[1] > 0 ? "hurt" : "focus",
        });
        text(ctx, shortName(env.names[0]), w * 0.2, 28, { size: 13, align: "left" });
        text(ctx, shortName(env.names[1]), w * 0.2, 48, { size: 13, align: "left" });
      },
    };
  },

  mukka(env) {
    const hits = [0, 0];
    let phase = "gap";
    let timer = 0.7;
    let cue = 0;
    let taken = false;
    let elapsed = 0;
    let cpuAt = 0;
    let clock = 0;
    let lunge = [0, 0];
    const need = 6;
    function open() {
      phase = "open";
      cue = Math.random() < 0.5 ? 0 : 1;
      timer = Math.max(0.36, 0.78 - env.level * 0.07);
      elapsed = 0;
      taken = false;
      cpuAt = 0.08 + (1 - env.skill) * 0.34 + Math.random() * 0.06;
    }
    function press(p, which) {
      if (taken || phase !== "open") return;
      taken = true;
      lunge[p] = 1;
      if (which === cue) {
        hits[p] += 1;
        boom(env, p === 0 ? 80 : 0, 0);
      } else {
        hits[1 - p] += 1;
        env.sfx?.miss?.();
        fx.punch(0.5);
      }
    }
    return {
      controls: "dual",
      verbs: ["Upar", "Neeche"],
      update(dt, input) {
        clock += dt;
        timer -= dt;
        lunge[0] = Math.max(0, lunge[0] - dt * 2.4);
        lunge[1] = Math.max(0, lunge[1] - dt * 2.4);
        if (phase === "gap") {
          if (timer <= 0) open();
          return null;
        }
        elapsed += dt;
        if (input.edge[0]) press(0, 0);
        if (input.edgeB[0]) press(0, 1);
        if (!env.p2cpu) {
          if (input.edge[1]) press(1, 0);
          if (input.edgeB[1]) press(1, 1);
        } else if (!taken && elapsed >= cpuAt) {
          const which = Math.random() < 0.55 + env.skill * 0.4 ? cue : 1 - cue;
          press(1, which);
        }
        if (taken || timer <= 0) {
          if ((hits[0] >= need || hits[1] >= need) && hits[0] !== hits[1]) {
            return { winner: hits[0] > hits[1] ? 0 : 1, reason: `${hits[0]}–${hits[1]} mukke` };
          }
          phase = "gap";
          timer = 0.42 + Math.random() * 0.25;
        }
        return null;
      },
      hud() {
        const call = phase === "open" ? (cue === 0 ? "UPAR" : "NEECHE") : "Taiyar";
        return `${call}   ·   ${hits[0]} – ${hits[1]}`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "ring", clock);
        const y = h * 0.86;
        const hgt = Math.min(160, h * 0.4);
        drawFighter(ctx, w * 0.32 - lunge[0] * 8, y, hgt, env.p1, {
          lean: -0.06,
          armL: -0.4 - lunge[0] * (cue === 0 ? 1.2 : 0.2),
          armR: 0.8 + lunge[0],
          expr: lunge[0] > 0.4 ? "focus" : "idle",
        });
        drawFighter(ctx, w * 0.68 + lunge[1] * 8, y, hgt, env.p2, {
          lean: 0.06,
          armL: -0.8 - lunge[1],
          armR: 0.4 + lunge[1] * 1.1,
          expr: lunge[1] > 0.4 ? "focus" : "idle",
        });
        if (phase === "open") {
          text(ctx, cue === 0 ? "UPAR" : "NEECHE", w / 2, h * 0.22, { size: 32 });
        }
      },
    };
  },

  cricket(env) {
    const runs = [0, 0];
    let ball = 0;
    let t = 0;
    let flight = 1.15;
    let shot = [null, null];
    let resolved = [false, false];
    let clock = 0;
    const total = { n: 6 };
    function begin() {
      t = 0;
      flight = Math.max(0.58, 1.18 - env.level * 0.08 - ball * 0.03);
      shot = [null, null];
      resolved = [false, false];
    }
    begin();
    function judge(progress) {
      const d = Math.abs(progress - 0.84);
      if (progress < 0.45) return "miss";
      if (d < 0.08) return "six";
      if (d < 0.16) return "four";
      if (d < 0.26) return "one";
      return "miss";
    }
    return {
      controls: "tap",
      verbs: ["Maaro", "Maaro"],
      update(dt, input) {
        clock += dt;
        t += dt;
        const progress = t / flight;
        for (let p = 0; p < 2; p++) {
          if (resolved[p]) continue;
          let tap = p === 1 && env.p2cpu ? false : input.edge[p];
          if (p === 1 && env.p2cpu) {
            const aim = 0.84 + (Math.random() - 0.5) * (1.15 - env.skill) * 0.28;
            if (progress >= aim) tap = true;
          }
          if (tap) {
            resolved[p] = true;
            shot[p] = judge(progress);
            const add = { six: 6, four: 4, one: 1, miss: 0 }[shot[p]];
            runs[p] += add;
            if (add) boom(env, p === 0 ? 40 : 0, 0);
            else env.sfx?.miss?.();
          } else if (progress > 1.12) {
            resolved[p] = true;
            shot[p] = "miss";
          }
        }
        if (resolved[0] && resolved[1] && t > flight + 0.55) {
          ball += 1;
          if (ball >= total.n) {
            if (runs[0] !== runs[1]) return { winner: runs[0] > runs[1] ? 0 : 1, reason: `${runs[0]} – ${runs[1]} run` };
            total.n += 1;
          }
          begin();
        }
        return null;
      },
      hud() {
        return `Gend ${Math.min(ball + 1, total.n)}   ·   ${runs[0]} – ${runs[1]}`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "pitch", clock);
        const progress = Math.min(1.05, t / flight);
        for (let p = 0; p < 2; p++) {
          const cx = p === 0 ? w * 0.25 : w * 0.75;
          const ballY = h * 0.2 + progress * h * 0.5;
          ctx.fillStyle = "#c4503e";
          ctx.beginPath();
          ctx.arc(cx, ballY, 7, 0, Math.PI * 2);
          ctx.fill();
          const hgt = Math.min(120, h * 0.28);
          drawFighter(ctx, cx, h * 0.9, hgt, p === 0 ? env.p1 : env.p2, {
            armL: shot[p] && shot[p] !== "miss" ? -1.4 : 0.4,
            armR: -0.2,
            expr: shot[p] === "six" || shot[p] === "four" ? "win" : shot[p] === "miss" ? "hurt" : "focus",
          });
          if (shot[p]) text(ctx, labelShot(shot[p]), cx, h * 0.34, { size: 20 });
        }
      },
    };
  },

  teer(env) {
    const scores = [0, 0];
    const left = [5, 5];
    const power = [0, 0];
    const was = [false, false];
    const fly = [null, null];
    let clock = 0;
    let sudden = false;
    let time = 34;
    function sway() {
      return Math.sin(clock * (1.3 + env.level * 0.18)) * (0.45 + env.level * 0.06);
    }
    function fire(p, pow, sw) {
      if (left[p] <= 0 || fly[p]) return;
      const miss = sw * (1.15 - pow * 0.4);
      const acc = Math.max(0, 1 - Math.abs(miss) * 1.35);
      const pts = Math.round(acc * 10);
      left[p] -= 1;
      power[p] = 0;
      fly[p] = { t: 0, pts, miss };
      env.sfx?.tap?.();
    }
    return {
      controls: "hold",
      verbs: ["Kheenchho", "Kheenchho"],
      update(dt, input) {
        clock += dt;
        time -= dt;
        const sw = sway();
        for (let p = 0; p < 2; p++) {
          if (fly[p]) {
            fly[p].t += dt;
            if (fly[p].t > 0.45) {
              scores[p] += fly[p].pts;
              if (fly[p].pts >= 8) boom(env, 0, 0);
              fly[p] = null;
            }
            continue;
          }
          let holding = p === 1 && env.p2cpu ? false : input.held[p];
          if (p === 1 && env.p2cpu && left[p] > 0) {
            if (power[p] <= 0) power[p] = 0.01;
            power[p] = Math.min(1, power[p] + dt * 0.55);
            const good = Math.abs(sw) < 0.1 + (1 - env.skill) * 0.34 && power[p] > 0.55;
            holding = !good;
            if (good || power[p] >= 0.98) fire(p, power[p], sw);
          }
          if (time <= 0 && left[p] > 0) fire(p, Math.max(power[p], 0.35), sw);
          if (holding && left[p] > 0 && !fly[p]) power[p] = Math.min(1, power[p] + dt * 0.55);
          if (power[p] >= 1 && left[p] > 0 && !fly[p]) fire(p, 1, sw);
          if (was[p] && !holding && power[p] > 0.12 && !fly[p]) fire(p, power[p], sw);
          if (!holding && !fly[p] && !(p === 1 && env.p2cpu)) power[p] = 0;
          was[p] = holding;
        }
        const done = left[0] === 0 && left[1] === 0 && !fly[0] && !fly[1];
        if (done) {
          if (scores[0] !== scores[1]) return { winner: scores[0] > scores[1] ? 0 : 1, reason: `${scores[0]} – ${scores[1]} ank` };
          if (!sudden) {
            sudden = true;
            left[0] = 1;
            left[1] = 1;
          }
        }
        return null;
      },
      hud() {
        return `Ank ${scores[0]} – ${scores[1]}   ·   teer ${left[0]}/${left[1]}`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "range", clock);
        const sw = sway();
        for (let p = 0; p < 2; p++) {
          const cx = p === 0 ? w * 0.25 : w * 0.75;
          const mark = (fly[p]?.miss ?? sw) * 46;
          if (fly[p]) {
            ctx.fillStyle = "#1a1614";
            ctx.beginPath();
            ctx.arc(cx + mark, h * 0.4, 4, 0, Math.PI * 2);
            ctx.fill();
          }
          text(ctx, fly[p] ? String(fly[p].pts) : "", cx, h * 0.28, { size: 18 });
          const hgt = Math.min(130, h * 0.32);
          const pull = power[p];
          drawFighter(ctx, cx, h * 0.9, hgt, p === 0 ? env.p1 : env.p2, {
            armL: -1.1 - pull * 0.4,
            armR: -0.4,
            expr: "focus",
          });
          bar(ctx, cx - 40, h * 0.62, 80, 8, pull, 0.7, 0.9);
        }
      },
    };
  },

  penalty(env) {
    const goals = [0, 0];
    let round = 0;
    let stage = "pick";
    let timer = 2.5 - env.level * 0.12;
    let shot = -1;
    let keep = -1;
    let anim = 0;
    let clock = 0;
    let saved = false;
    const each = 3;
    function shooter() {
      return round % 2 === 0 ? 0 : 1;
    }
    function resetPick() {
      stage = "pick";
      timer = Math.max(1.15, 2.4 - env.level * 0.18);
      shot = -1;
      keep = -1;
      anim = 0;
    }
    return {
      controls: "zones",
      verbs: ["Baen", "Madhya", "Daen"],
      update(dt, input) {
        clock += dt;
        const s = shooter();
        const k = 1 - s;
        if (stage === "pick") {
          timer -= dt;
          if (shot < 0 && input.zone[s] >= 0) shot = input.zone[s];
          if (keep < 0 && !(k === 1 && env.p2cpu) && input.zone[k] >= 0) keep = input.zone[k];
          if (k === 1 && env.p2cpu && keep < 0 && Math.random() < dt * 1.4) keep = Math.floor(Math.random() * 3);
          if (s === 1 && env.p2cpu && shot < 0 && Math.random() < dt * 1.4) shot = Math.floor(Math.random() * 3);
          if (timer <= 0 || (shot >= 0 && keep >= 0)) {
            if (shot < 0) shot = Math.floor(Math.random() * 3);
            if (keep < 0) keep = Math.floor(Math.random() * 3);
            saved = shot === keep;
            if (!saved) {
              goals[s] += 1;
              env.sfx?.hit?.();
            } else env.sfx?.miss?.();
            stage = "show";
            anim = 0;
          }
          return null;
        }
        anim += dt;
        if (anim > 1.15) {
          round += 1;
          const played = [Math.ceil(round / 2), Math.floor(round / 2)];
          if (played[0] >= each && played[1] >= each && goals[0] !== goals[1]) {
            return { winner: goals[0] > goals[1] ? 0 : 1, reason: `${goals[0]}–${goals[1]} gol` };
          }
          if (played[0] >= each + 4 && goals[0] === goals[1]) {
            return { winner: Math.random() < 0.5 ? 0 : 1, reason: "Akhiri gol" };
          }
          resetPick();
        }
        return null;
      },
      hud() {
        const s = shooter();
        const who = stage === "pick" ? `${shortName(env.names[s])} shoot` : saved ? "Roka" : "Gol";
        return `${who}   ·   ${goals[0]} – ${goals[1]}`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "goal", clock);
        const spots = [w * 0.36, w * 0.5, w * 0.64];
        const dive = stage === "show" ? Math.min(1, anim / 0.35) : 0;
        const kx = keep >= 0 ? spots[keep] : w * 0.5;
        const sx = shot >= 0 ? spots[shot] : w * 0.5;
        const keeperX = w * 0.5 + (kx - w * 0.5) * dive;
        ctx.fillStyle = "#9eb0c2";
        roundBody(ctx, keeperX, h * 0.48, 16);
        const ballT = stage === "show" ? Math.min(1, anim / 0.7) : 0;
        const bx = w * 0.5 + (sx - w * 0.5) * ballT;
        const by = h * 0.82 - ballT * h * 0.38;
        ctx.fillStyle = "#f4f1ea";
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();
        const s = shooter();
        const hgt = Math.min(120, h * 0.28);
        drawFighter(ctx, w * 0.5, h * 0.95, hgt, s === 0 ? env.p1 : env.p2, { armR: -0.6 - ballT, expr: "focus" });
        if (stage === "show") text(ctx, saved ? "ROKA" : "GOL", w / 2, h * 0.24, { size: 28 });
        else text(ctx, `${Math.max(0, timer).toFixed(1)}s`, w / 2, h * 0.24, { size: 22 });
      },
    };
  },

  pathar(env) {
    const phase = [Math.random(), Math.random()];
    const done = [0, 0];
    const total = [0, 0];
    const flash = ["", ""];
    const flashT = [0, 0];
    let clock = 0;
    const need = 3;
    const speed = 0.65 + env.level * 0.16;
    let sudden = false;
    const latched = [false, false];
    function value(p) {
      return (Math.sin(phase[p] * Math.PI * 2) + 1) / 2;
    }
    function lift(p) {
      if (done[p] >= need) return;
      const v = value(p);
      const pts = v > 0.62 ? Math.round(v * 100) : 0;
      total[p] += pts;
      done[p] += 1;
      flash[p] = pts ? String(pts) : "Gira";
      flashT[p] = 0.5;
      if (pts > 80) boom(env, 0, 0);
      else env.sfx?.tap?.();
    }
    return {
      controls: "tap",
      verbs: ["Uthao", "Uthao"],
      update(dt, input) {
        clock += dt;
        for (let p = 0; p < 2; p++) {
          if (done[p] < need) phase[p] += dt * speed;
          flashT[p] = Math.max(0, flashT[p] - dt);
          let tap = p === 1 && env.p2cpu ? false : input.edge[p];
          if (p === 1 && env.p2cpu && done[p] < need) {
            const v = value(p);
            const rising = Math.cos(phase[p] * Math.PI * 2) > 0;
            const gate = 0.78 + (1 - env.skill) * 0.18;
            if (v < 0.45) latched[p] = false;
            if (!latched[p] && rising && v >= gate) {
              latched[p] = true;
              tap = true;
            }
          }
          if (tap) lift(p);
        }
        if (done[0] >= need && done[1] >= need && flashT[0] <= 0 && flashT[1] <= 0) {
          if (total[0] !== total[1]) return { winner: total[0] > total[1] ? 0 : 1, reason: `${total[0]} – ${total[1]}` };
          if (!sudden) {
            sudden = true;
            done[0] = need - 1;
            done[1] = need - 1;
          }
        }
        return null;
      },
      hud() {
        return `Pathar ${total[0]} – ${total[1]}`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "yard", clock);
        for (let p = 0; p < 2; p++) {
          const cx = p === 0 ? w * 0.28 : w * 0.72;
          const v = value(p);
          ctx.fillStyle = "#8d8c88";
          ctx.beginPath();
          ctx.ellipse(cx, h * 0.7 - v * 30, 22, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          const hgt = Math.min(140, h * 0.34);
          drawFighter(ctx, cx, h * 0.9, hgt, p === 0 ? env.p1 : env.p2, {
            squat: 1 - v * 0.4,
            armL: -0.8,
            armR: 0.8,
            expr: v > 0.8 ? "focus" : "idle",
          });
          bar(ctx, cx - 50, h * 0.34, 100, 12, v, 0.82, 1);
          if (flashT[p] > 0) text(ctx, flash[p], cx, h * 0.28, { size: 18 });
          text(ctx, `${done[p]}/${need}`, cx, h * 0.48, { size: 12, color: "#a39e94" });
        }
      },
    };
  },

  ghanti(env) {
    const wins = [0, 0];
    let mode = "wait";
    let timer = 1.1 + Math.random() * 1.6;
    let goT = 0;
    let cpuAt = 0;
    let clock = 0;
    let banner = "";
    let bannerT = 0;
    const need = 3;
    function wait() {
      mode = "wait";
      timer = 0.9 + Math.random() * (2.4 - env.level * 0.15);
      banner = "";
    }
    function score(p, why) {
      wins[p] += 1;
      banner = why;
      bannerT = 0.7;
      mode = "gap";
      timer = 0.75;
      if (why === "Jaldi") env.sfx?.miss?.();
      else boom(env, 0, 0);
    }
    return {
      controls: "tap",
      verbs: ["Dabao", "Dabao"],
      update(dt, input) {
        clock += dt;
        timer -= dt;
        bannerT = Math.max(0, bannerT - dt);
        const edge = [env.p2cpu ? false : input.edge[0], env.p2cpu ? false : input.edge[1]];
        if (!env.p2cpu) edge[1] = input.edge[1];
        edge[0] = input.edge[0];
        if (mode === "wait") {
          if (edge[0]) return scoreMaybe(0);
          if (edge[1] && !env.p2cpu) return scoreMaybe(1);
          if (timer <= 0) {
            mode = "go";
            goT = 0;
            cpuAt = 0.22 - env.skill * 0.14 + Math.random() * 0.05;
            env.sfx?.beep?.();
          }
          return null;
        }
        if (mode === "go") {
          goT += dt;
          if (edge[0] && !(edge[1] && !env.p2cpu && false)) {
            /* fall through */
          }
          if (edge[0] || (edge[1] && !env.p2cpu)) {
            const p = edge[0] && edge[1] ? 0 : edge[0] ? 0 : 1;
            score(p, "Pehle");
          } else if (env.p2cpu && goT >= cpuAt) score(1, "Pehle");
          if (wins[0] >= need || wins[1] >= need) {
            if (wins[0] !== wins[1]) return { winner: wins[0] > wins[1] ? 0 : 1, reason: `${wins[0]}–${wins[1]} round` };
          }
          return null;
        }
        if (timer <= 0) {
          if ((wins[0] >= need || wins[1] >= need) && wins[0] !== wins[1]) {
            return { winner: wins[0] > wins[1] ? 0 : 1, reason: `${wins[0]}–${wins[1]} round` };
          }
          wait();
        }
        return null;
        function scoreMaybe(p) {
          score(1 - p, "Jaldi");
          if ((wins[0] >= need || wins[1] >= need) && wins[0] !== wins[1]) {
            return { winner: wins[0] > wins[1] ? 0 : 1, reason: `${wins[0]}–${wins[1]} round` };
          }
          return null;
        }
      },
      hud() {
        return `Round ${wins[0]} – ${wins[1]}`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "ring", clock);
        const on = mode === "go";
        ctx.fillStyle = on ? "#d7e7c8" : "#c4503e";
        ctx.beginPath();
        ctx.arc(w / 2, h * 0.32, Math.min(48, w * 0.1), 0, Math.PI * 2);
        ctx.fill();
        text(ctx, on ? "AB" : "RUKO", w / 2, h * 0.34, { size: 16, color: "#141210" });
        if (bannerT > 0) text(ctx, banner, w / 2, h * 0.48, { size: 22 });
        const hgt = Math.min(140, h * 0.34);
        drawFighter(ctx, w * 0.28, h * 0.9, hgt, env.p1, { expr: mode === "go" ? "focus" : "idle", armL: 0.2, armR: -0.2 });
        drawFighter(ctx, w * 0.72, h * 0.9, hgt, env.p2, { expr: mode === "go" ? "focus" : "idle", armL: 0.2, armR: -0.2 });
      },
    };
  },
};

function labelShot(s) {
  if (s === "six") return "CHHAKKA";
  if (s === "four") return "CHAUKA";
  if (s === "one") return "EK";
  return "MISSED";
}

function roundBody(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - r * 0.7, y, r * 1.4, r * 2.1);
}

function SKINS_SAFE(f) {
  return ["#f3d0b0", "#e0b089", "#c48852", "#8d5524", "#5c3317"][Math.max(0, Math.min(4, f.skin | 0))];
}
