import { bar, drawBackdrop, drawFighter, fx, roundRect, shortName, text } from "./draw.js";

export const LEVELS = ["Mela", "Kasba", "Zila", "Rajya", "Rashtriya"];

export const GAMES = [
  { id: "takkar", name: "Takkar", line: "Magic se vaar. Jaan lo to badhe. Jiski jaan khatam, wahi haara." },
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
  { id: "dor", name: "String Circle", line: "Ghera mein dor. Jiski dor zyada faili, wahi jeete." },
  { id: "niklo", name: "Nikal Bhaag", line: "Chamakdar ghere se pehle nikalne wala jeete." },
  { id: "dino", name: "Dino Flask", line: "Apni nali se pehle char dino bahar nikalo." },
  { id: "hathiyar", name: "Hathiyar Gola", line: "Ghere mein bandook uthao. Doosre ki jaan khatam karo." },
  { id: "pahunch", name: "Ek Saath", line: "Kya dono ek saath neeche pahunchenge?" },
  { id: "kirane", name: "Kirane", line: "Parabola par rangin kirane. Zyada pakdo, jeeto." },
  { id: "gada", name: "Gada Gola", line: "Chain ki gada. Jiski jaan pehle khatam, woh haara." },
  { id: "pees", name: "Gend Pesai", line: "Do roller. Zyada gend peesne wala jeete." },
  { id: "rage", name: "Rage Gola", line: "Atom chhuo, tabhi goli. Dil sirf vaar par kate." },
];

function skillOf(level) {
  return [0.4, 0.54, 0.67, 0.8, 0.9][Math.max(0, Math.min(4, level - 1))];
}

function nerve(env, p) {
  const skew = env.bias?.[p] || 0;
  return Math.max(0.3, Math.min(0.97, env.skill + skew));
}

function boom(env, x, y, color = "#e7d3a1") {
  fx.punch(0.9);
  fx.burst(x > 8 ? x : 150, y > 8 ? y : 120, color, 10);
  env.sfx?.hit?.();
}

export function createMatch(id, env) {
  const build = BUILD[id];
  if (!build) throw new Error("Yeh game nahi mili");
  const bias = [(Math.random() - 0.48) * 0.18, (Math.random() - 0.52) * 0.18];
  const match = build({ ...env, auto: true, skill: skillOf(env.level), bias });
  match.id = id;
  match.name = GAMES.find((g) => g.id === id)?.name || id;
  return match;
}

function feet(h) {
  return h * 0.9;
}

function puff(ctx, x, y, t) {
  ctx.fillStyle = "rgba(92, 62, 36, 0.35)";
  for (let i = 0; i < 4; i++) {
    const a = t * 4 + i * 1.4;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 16, y - 6 - (i % 3) * 7, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

const BUILD = {
  takkar(env) {
    const col = [env.p1.cloth || "#ff4b6e", env.p2.cloth || "#3ecbff"];
    const b = [
      { x: -0.46, y: 0.12, vx: 0.22, vy: -0.48 },
      { x: 0.44, y: -0.16, vx: -0.18, vy: 0.5 },
    ];
    const hp = [8, 8];
    const maxHp = 10;
    const trail = [[], []];
    const bits = [];
    const shots = [];
    const power = [0, 0];
    const ammo = [0, 0];
    const gunCool = [0, 0];
    let magic = null;
    let heal = null;
    let magicAt = 1.2;
    let healAt = 3.2;
    let cool = 0.4;
    let flash = 0;
    let clock = 0;
    let nudged = false;

    function burst(x, y, color) {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.18 + Math.random() * 0.4;
        bits.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.4, color });
      }
    }

    return {
      controls: "mash",
      verbs: ["Takkar", "Takkar"],
      update(dt) {
        cool = Math.max(0, cool - dt);
        flash = Math.max(0, flash - dt);
        clock += dt;
        if (!magic && clock >= magicAt) {
          const a = Math.random() * Math.PI * 2;
          magic = { x: Math.cos(a) * 0.12, y: Math.sin(a) * 0.12 };
        }
        if (!heal && clock >= healAt) {
          const a = Math.random() * Math.PI * 2;
          heal = { x: Math.cos(a) * 0.42, y: Math.sin(a) * 0.42 };
        }
        if (!nudged && clock > 6 && hp[0] === 8 && hp[1] === 8 && !power[0] && !power[1]) {
          nudged = true;
          for (let p = 0; p < 2; p++) {
            const d = Math.hypot(b[p].x, b[p].y) || 1;
            b[p].vx = (-b[p].x / d) * 0.7;
            b[p].vy = (-b[p].y / d) * 0.7;
          }
        }
        for (let p = 0; p < 2; p++) {
          const me = b[p];
          const want = 0.62 + nerve(env, p) * 0.12;
          const sp = Math.hypot(me.vx, me.vy) || 1;
          me.vx *= want / sp;
          me.vy *= want / sp;
          me.x += me.vx * dt;
          me.y += me.vy * dt;
          const d = Math.hypot(me.x, me.y) || 1;
          if (d > 0.74) {
            const nx = me.x / d;
            const ny = me.y / d;
            const v = me.vx * nx + me.vy * ny;
            if (v > 0) {
              me.vx -= 2 * v * nx;
              me.vy -= 2 * v * ny;
            }
            me.vx -= nx * 0.28;
            me.vy -= ny * 0.28;
            const slip = (Math.random() - 0.5) * 0.16;
            me.vx += -ny * slip;
            me.vy += nx * slip;
            me.x = nx * 0.74;
            me.y = ny * 0.74;
          }
          trail[p].push({ x: me.x, y: me.y });
          if (trail[p].length > 7) trail[p].shift();
          if (magic && (me.x - magic.x) ** 2 + (me.y - magic.y) ** 2 < 0.03) {
            power[p] = 4;
            ammo[p] = 2;
            gunCool[p] = 0.45;
            magic = null;
            magicAt = clock + 3.2;
            burst(me.x, me.y, "#ffe08a");
            env.sfx?.pop?.();
          }
          if (heal && (me.x - heal.x) ** 2 + (me.y - heal.y) ** 2 < 0.03) {
            hp[p] = Math.min(maxHp, hp[p] + 1);
            heal = null;
            healAt = clock + 6;
            burst(me.x, me.y, "#7dffb3");
            env.sfx?.beep?.();
          }
          if (ammo[p] > 0) {
            gunCool[p] -= dt;
            if (gunCool[p] <= 0) {
              const foe = b[1 - p];
              const aim = Math.atan2(foe.y - me.y, foe.x - me.x) + (Math.random() - 0.5) * 0.35;
              const spd = 0.72;
              shots.push({ x: me.x, y: me.y, vx: Math.cos(aim) * spd, vy: Math.sin(aim) * spd, p, life: 1.5 });
              ammo[p] -= 1;
              gunCool[p] = 1.05;
              if (ammo[p] <= 0) power[p] = 0;
            }
          } else power[p] = 0;
        }
        const dx = b[1].x - b[0].x;
        const dy = b[1].y - b[0].y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < 0.2) {
          const nx = dx / dist;
          const ny = dy / dist;
          const rel = (b[1].vx - b[0].vx) * nx + (b[1].vy - b[0].vy) * ny;
          if (rel < 0) {
            b[0].vx += rel * nx;
            b[0].vy += rel * ny;
            b[1].vx -= rel * nx;
            b[1].vy -= rel * ny;
            if (cool <= 0) {
              cool = 0.7;
              flash = 0.18;
              env.sfx?.tap?.();
            }
          }
          const push = (0.2 - dist) * 0.55;
          b[0].x -= nx * push;
          b[0].y -= ny * push;
          b[1].x += nx * push;
          b[1].y += ny * push;
        }
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          const foe = b[1 - s.p];
          const ax = foe.x - s.x;
          const ay = foe.y - s.y;
          const al = Math.hypot(ax, ay) || 1;
          s.vx += (ax / al) * dt * 0.9;
          s.vy += (ay / al) * dt * 0.9;
          const ssp = Math.hypot(s.vx, s.vy) || 1;
          if (ssp > 0.9) {
            s.vx *= 0.9 / ssp;
            s.vy *= 0.9 / ssp;
          }
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt;
          if ((s.x - foe.x) ** 2 + (s.y - foe.y) ** 2 < 0.028) {
            hp[1 - s.p] = Math.max(0, hp[1 - s.p] - 1);
            flash = 0.25;
            burst(foe.x, foe.y, col[1 - s.p]);
            env.sfx?.hit?.();
            shots.splice(i, 1);
            continue;
          }
          const sd = Math.hypot(s.x, s.y) || 1;
          if (sd > 0.78) {
            const nx = s.x / sd;
            const ny = s.y / sd;
            const v = s.vx * nx + s.vy * ny;
            if (v > 0) {
              s.vx -= 2 * v * nx;
              s.vy -= 2 * v * ny;
            }
            s.x = nx * 0.78;
            s.y = ny * 0.78;
          }
          if (s.life <= 0) shots.splice(i, 1);
        }
        for (let i = bits.length - 1; i >= 0; i--) {
          bits[i].x += bits[i].vx * dt;
          bits[i].y += bits[i].vy * dt;
          bits[i].life -= dt;
          if (bits[i].life <= 0) bits.splice(i, 1);
        }
        if (hp[0] <= 0 || hp[1] <= 0) {
          return { winner: hp[0] === hp[1] ? 0 : hp[0] > hp[1] ? 0 : 1, reason: "Jaan khatam" };
        }
        return null;
      },
      hud() {
        const who = power[0] > 0 || ammo[0] > 0 ? 0 : power[1] > 0 || ammo[1] > 0 ? 1 : -1;
        if (who >= 0) return `${shortName(env.names[who])} ke paas magic`;
        return `${hp[0]} – ${hp[1]} jaan`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#070910";
        ctx.fillRect(0, 0, w, h);
        const n0 = shortName(env.names[0]);
        const n1 = shortName(env.names[1]);
        text(ctx, n0, w * 0.22, h * 0.06, { size: 14, color: col[0], weight: 800 });
        text(ctx, n1, w * 0.78, h * 0.06, { size: 14, color: col[1], weight: 800 });
        for (let i = 0; i < maxHp; i++) {
          heartIcon(ctx, w * 0.22 - 72 + i * 15, h * 0.1, i < hp[0], col[0]);
          heartIcon(ctx, w * 0.78 - 72 + i * 15, h * 0.1, i < hp[1], col[1]);
        }
        const cx = w / 2;
        const cy = h * 0.56;
        const R = Math.min(w * 0.49, h * 0.44);
        ctx.strokeStyle = "rgba(120,160,210,0.16)";
        ctx.lineWidth = 1;
        for (let i = 1; i <= 3; i++) {
          ctx.beginPath();
          ctx.arc(cx, cy, (R * i) / 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.strokeStyle = flash > 0 ? "#fff6d0" : "rgba(244,246,252,0.92)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        const put = (x, y) => [cx + x * R, cy + y * R];
        for (const bit of bits) {
          const [px, py] = put(bit.x, bit.y);
          ctx.globalAlpha = Math.max(0, bit.life * 2);
          ctx.fillStyle = bit.color;
          ctx.beginPath();
          ctx.arc(px, py, 3 + bit.life * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (magic) {
          const [px, py] = put(magic.x, magic.y);
          const spin = clock * 3;
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(spin);
          ctx.fillStyle = "#ffe08a";
          ctx.shadowColor = "#ffd15a";
          ctx.shadowBlur = 16;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
            ctx.lineTo(Math.cos(a + 0.4) * 5, Math.sin(a + 0.4) * 5);
          }
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          ctx.shadowBlur = 0;
        }
        if (heal) {
          const [px, py] = put(heal.x, heal.y);
          ctx.shadowColor = "#7dffb3";
          ctx.shadowBlur = 12;
          heartIcon(ctx, px, py, true, "#7dffb3");
          ctx.shadowBlur = 0;
        }
        for (const s of shots) {
          const [px, py] = put(s.x, s.y);
          ctx.fillStyle = col[s.p];
          ctx.shadowColor = col[s.p];
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        for (let p = 0; p < 2; p++) {
          trail[p].forEach((t, i) => {
            const [px, py] = put(t.x, t.y);
            ctx.globalAlpha = ((i + 1) / trail[p].length) * 0.35;
            ctx.fillStyle = col[p];
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        }
        ctx.globalAlpha = 1;
        for (let p = 0; p < 2; p++) {
          const [px, py] = put(b[p].x, b[p].y);
          const rr = 18;
          if (ammo[p] > 0) {
            ctx.strokeStyle = "#ffe08a";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, rr + 8, 0, Math.PI * 2);
            ctx.stroke();
          }
          rageFace(ctx, px, py, rr, col[p], hp[p] <= 3);
          ctx.fillStyle = "rgba(6,8,16,0.78)";
          const label = p === 0 ? n0 : n1;
          const tw = Math.min(100, label.length * 7 + 14);
          roundRect(ctx, px - tw / 2, py + rr + 5, tw, 16, 8);
          ctx.fill();
          text(ctx, label, px, py + rr + 17, { size: 11, color: col[p], weight: 700 });
        }
      },
    };
  },

  rassi(env) {
    let pos = 0;
    let vel = 0;
    const total = [0, 0];
    const surge = [0, 0];
    const might = [0, 1].map((p) => 0.78 + nerve(env, p) * 0.4);
    let turn = Math.random() < 0.5 ? 0 : 1;
    let turnT = 0;
    let turnLen = 1.05 + Math.random() * 0.35;
    let swaps = 0;
    let clock = 0;

    function beginTurn(who) {
      turn = who;
      turnT = 0;
      turnLen = 1.0 + Math.random() * 0.45;
      swaps += 1;
    }

    return {
      controls: "mash",
      verbs: ["Khicho", "Khicho"],
      update(dt) {
        clock += dt;
        turnT += dt;
        const ramp = Math.sin(Math.min(1, turnT / turnLen) * Math.PI);
        for (let p = 0; p < 2; p++) {
          const attack = p === turn ? 1 : 0.58;
          surge[p] = ramp * might[p] * attack;
          total[p] += surge[p] * dt;
        }
        const push = surge[0] - surge[1];
        const target = Math.max(-1, Math.min(1, -push * 1.15));
        vel += (target - pos) * dt * 4.2;
        vel *= Math.max(0, 1 - dt * 2.2);
        pos += vel * dt * 1.35;
        pos = Math.max(-1.05, Math.min(1.05, pos));
        if (turnT < turnLen) return null;
        const ahead = total[0] === total[1] ? (pos <= 0 ? 0 : 1) : total[0] > total[1] ? 0 : 1;
        const across = (ahead === 0 && pos < -0.78) || (ahead === 1 && pos > 0.78);
        if (swaps >= 4 && across) return { winner: ahead, reason: "Zyada dam laga diya" };
        if (swaps >= 8) return { winner: ahead, reason: "Zyada dam laga diya" };
        beginTurn(swaps >= 4 ? ahead : 1 - turn);
        return null;
      },
      hud() {
        if (Math.abs(surge[0] - surge[1]) < 0.08) return "Rassi kasti hai";
        const who = surge[0] > surge[1] ? shortName(env.names[0]) : shortName(env.names[1]);
        return `${who} zor laga raha hai`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "akhada", clock);
        const slide = pos * w * 0.18;
        const x1 = w * 0.22 + slide;
        const x2 = w * 0.78 + slide;
        const y = feet(h);
        const hgt = Math.min(190, h * 0.46);
        const ropeY = y - hgt * 0.5;
        ctx.strokeStyle = "rgba(255,255,255,0.75)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 6]);
        ctx.beginPath();
        ctx.moveTo(w / 2, h * 0.66);
        ctx.lineTo(w / 2, h * 0.9);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#c4503e";
        ctx.fillRect(w * 0.08, h * 0.7, 5, 28);
        ctx.fillRect(w * 0.92, h * 0.7, 5, 28);
        ctx.strokeStyle = "#5a341c";
        ctx.lineWidth = 8;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1 + hgt * 0.16, ropeY);
        ctx.quadraticCurveTo(w / 2 + slide * 0.15, ropeY + 8, x2 - hgt * 0.16, ropeY);
        ctx.stroke();
        ctx.strokeStyle = "#e7c27a";
        ctx.lineWidth = 2;
        ctx.stroke();
        const knot = w / 2 + slide * 0.35;
        ctx.fillStyle = "#c4503e";
        ctx.fillRect(knot - 7, ropeY - 8, 14, 16);
        const dig = (p) => 0.18 + surge[p] * 0.55;
        drawFighter(ctx, x1, y, hgt, env.p1, {
          lean: -(0.32 + surge[0] * 0.28 - Math.max(0, pos) * 0.35),
          armL: 1.65,
          armR: 1.95,
          stride: Math.sin(clock * (5 + surge[0] * 7)) * dig(0),
          squat: 0.06 + surge[0] * 0.14,
          expr: surge[0] > surge[1] ? "focus" : "hurt",
        });
        drawFighter(ctx, x2, y, hgt, env.p2, {
          lean: 0.32 + surge[1] * 0.28 - Math.max(0, -pos) * 0.35,
          armL: -1.95,
          armR: -1.65,
          stride: Math.sin(clock * (5 + surge[1] * 7) + 0.6) * dig(1),
          squat: 0.06 + surge[1] * 0.14,
          expr: surge[1] > surge[0] ? "focus" : "hurt",
        });
        if (surge[0] > 0.35) puff(ctx, x1, y, clock);
        if (surge[1] > 0.35) puff(ctx, x2, y, clock + 1);
        text(ctx, shortName(env.names[0]), x1, y - hgt - 12, { size: 14, color: "#1a1614" });
        text(ctx, shortName(env.names[1]), x2, y - hgt - 12, { size: 14, color: "#1a1614" });
      },
    };
  },

  kusti(env) {
    const score = [0, 0];
    const phase = [Math.random(), Math.random()];
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
          if (lock[p] > 0) continue;
          const miss = Math.random() > nerve(env, p);
          const target = miss ? center + width : center;
          if (Math.abs(t - target) >= 0.03) continue;
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
        const hgt = Math.min(176, h * 0.42);
        const spin = clock * 0.7;
        const x1 = w * 0.5 + Math.cos(spin) * w * 0.1;
        const x2 = w * 0.5 + Math.cos(spin + Math.PI) * w * 0.1;
        const lean = (score[1] - score[0]) * 0.05;
        drawFighter(ctx, x1, y, hgt, env.p1, {
          lean: -0.22 + lean,
          armL: 0.7,
          armR: 1.35,
          expr: flash[0] === "Pakad" && flashT[0] > 0 ? "win" : "focus",
        });
        drawFighter(ctx, x2, y, hgt, env.p2, {
          lean: 0.22 + lean,
          armL: -1.35,
          armR: -0.7,
          expr: flash[1] === "Pakad" && flashT[1] > 0 ? "win" : "focus",
        });
        text(ctx, `${score[0]}`, w * 0.14, h * 0.22, { size: 28, color: "#1a1614" });
        text(ctx, `${score[1]}`, w * 0.86, h * 0.22, { size: 28, color: "#1a1614" });
        text(ctx, shortName(env.names[0]), w * 0.14, h * 0.28, { size: 12, color: "#3a2a22" });
        text(ctx, shortName(env.names[1]), w * 0.86, h * 0.28, { size: 12, color: "#3a2a22" });
        if (flashT[0] > 0) text(ctx, flash[0], x1, y - hgt - 8, { size: 18, color: "#1a1614" });
        if (flashT[1] > 0) text(ctx, flash[1], x2, y - hgt - 8, { size: 18, color: "#1a1614" });
      },
    };
  },

  bahu(env) {
    let pos = 0;
    const stam = [1, 1];
    const force = [0, 0];
    let clock = 0;
    const wait = [0.1, 0.14];
    const acc = [0, 0];
    return {
      controls: "mash",
      verbs: ["Dabao", "Dabao"],
      update(dt) {
        clock += dt;
        for (let p = 0; p < 2; p++) {
          stam[p] = Math.min(1, stam[p] + dt * 0.28);
          force[p] *= Math.max(0, 1 - dt * 1.4);
          acc[p] += dt;
          if (acc[p] < wait[p]) continue;
          acc[p] = 0;
          wait[p] = (0.2 + (1 - nerve(env, p)) * 0.16) * (0.85 + Math.random() * 0.3);
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
        pos += (force[1] - force[0]) * dt * 5.4;
        pos = Math.max(-1.05, Math.min(1.05, pos));
        if (pos <= -0.9) return { winner: 0, reason: "Haath dab gaya" };
        if (pos >= 0.9) return { winner: 1, reason: "Haath dab gaya" };
        return null;
      },
      hud() {
        if (Math.abs(pos) < 0.08) return "Haath seedha";
        const who = pos < 0 ? shortName(env.names[0]) : shortName(env.names[1]);
        return `${who} daba raha hai`;
      },
      draw(ctx, w, h) {
        drawBackdrop(ctx, w, h, "table", clock);
        const y = h * 0.9;
        const hgt = Math.min(150, h * 0.34);
        const strain = Math.max(-1, Math.min(1, pos));
        drawFighter(ctx, w * 0.18, y, hgt, env.p1, {
          lean: -0.08 - strain * 0.12,
          armL: 0.3,
          armR: 0.2,
          expr: strain < 0 ? "focus" : "hurt",
        });
        drawFighter(ctx, w * 0.82, y, hgt, env.p2, {
          lean: 0.08 - strain * 0.12,
          armL: -0.2,
          armR: -0.3,
          expr: strain > 0 ? "focus" : "hurt",
        });
        const handX = w * 0.5 + pos * w * 0.28;
        const handY = h * 0.56 - Math.abs(pos) * h * 0.04;
        ctx.strokeStyle = SKINS_SAFE(env.p1);
        ctx.lineWidth = 16;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(w * 0.3, h * 0.62);
        ctx.quadraticCurveTo(w * 0.4, h * 0.5, handX, handY);
        ctx.stroke();
        ctx.strokeStyle = SKINS_SAFE(env.p2);
        ctx.beginPath();
        ctx.moveTo(w * 0.7, h * 0.62);
        ctx.quadraticCurveTo(w * 0.6, h * 0.5, handX, handY);
        ctx.stroke();
        ctx.fillStyle = "#f4f1ea";
        ctx.beginPath();
        ctx.arc(handX, handY, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1a1614";
        ctx.lineWidth = 2;
        ctx.stroke();
        text(ctx, shortName(env.names[0]), w * 0.18, h * 0.18, { size: 14 });
        text(ctx, shortName(env.names[1]), w * 0.82, h * 0.18, { size: 14 });
      },
    };
  },

  daud(env) {
    const pos = [0, 0];
    const expect = [0, 0];
    const lock = [0, 0];
    const since = [0.3, 0.3];
    let clock = 0;
    const cpuT = [Math.random() * 0.1, Math.random() * 0.1];
    const cpuLeg = [0, 0];
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
          cpuT[p] += dt;
          const gap = ideal * (0.9 + (1 - nerve(env, p)) * 0.4);
          if (cpuT[p] < gap) continue;
          cpuT[p] = 0;
          const leg = Math.random() < 0.78 + nerve(env, p) * 0.2 ? cpuLeg[p] : 1 - cpuLeg[p];
          step(p, leg);
          cpuLeg[p] = 1 - cpuLeg[p];
        }
        if (pos[0] >= 100 || pos[1] >= 100) {
          const winner = pos[0] === pos[1] ? (Math.random() < 0.5 ? 0 : 1) : pos[0] > pos[1] ? 0 : 1;
          return { winner, reason: "Finish line" };
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
        drawFighter(ctx, xOf(0), h * 0.72, hgt, env.p1, {
          stride: lock[0] > 0 ? 0 : Math.sin(pos[0] * 0.55) * 1.1,
          armL: Math.sin(pos[0] * 0.55),
          armR: -Math.sin(pos[0] * 0.55),
          lean: -0.16,
          expr: lock[0] > 0 ? "hurt" : "focus",
        });
        drawFighter(ctx, xOf(1), h * 0.9, hgt, env.p2, {
          stride: lock[1] > 0 ? 0 : Math.sin(pos[1] * 0.55 + 0.8) * 1.1,
          armL: Math.sin(pos[1] * 0.55 + 0.8),
          armR: -Math.sin(pos[1] * 0.55 + 0.8),
          lean: -0.16,
          expr: lock[1] > 0 ? "hurt" : "focus",
        });
        text(ctx, shortName(env.names[0]), 12, h * 0.64, { size: 13, align: "left", color: "#f4f1ea" });
        text(ctx, shortName(env.names[1]), 12, h * 0.82, { size: 13, align: "left", color: "#f4f1ea" });
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
    const cpuAt = [0, 0];
    let clock = 0;
    let lunge = [0, 0];
    const need = 6;
    function open() {
      phase = "open";
      cue = Math.random() < 0.5 ? 0 : 1;
      timer = Math.max(0.36, 0.78 - env.level * 0.07);
      elapsed = 0;
      taken = false;
      cpuAt[0] = 0.07 + (1 - nerve(env, 0)) * 0.32 + Math.random() * 0.08;
      cpuAt[1] = 0.07 + (1 - nerve(env, 1)) * 0.32 + Math.random() * 0.08;
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
        if (!taken) {
          const order = cpuAt[0] <= cpuAt[1] ? [0, 1] : [1, 0];
          for (const p of order) {
            if (taken || elapsed < cpuAt[p]) continue;
            const which = Math.random() < 0.52 + nerve(env, p) * 0.42 ? cue : 1 - cue;
            press(p, which);
          }
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
        drawFighter(ctx, w * 0.32 - lunge[0] * 28, y, hgt, env.p1, {
          lean: -0.08 - lunge[0] * 0.2,
          armL: -0.5,
          armR: 0.4 + lunge[0] * 1.6,
          expr: lunge[0] > 0.4 ? "focus" : "idle",
        });
        drawFighter(ctx, w * 0.68 + lunge[1] * 28, y, hgt, env.p2, {
          lean: 0.08 + lunge[1] * 0.2,
          armL: -0.4 - lunge[1] * 1.6,
          armR: 0.5,
          expr: lunge[1] > 0.4 ? "focus" : "idle",
        });
        if (lunge[0] > 0.35 || lunge[1] > 0.35) {
          ctx.fillStyle = "#f4f1ea";
          ctx.beginPath();
          ctx.arc(w / 2, h * 0.62, 10 + (lunge[0] + lunge[1]) * 8, 0, Math.PI * 2);
          ctx.fill();
        }
        text(ctx, String(hits[0]), w * 0.18, h * 0.2, { size: 28 });
        text(ctx, String(hits[1]), w * 0.82, h * 0.2, { size: 28 });
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
    const aim = [0.84, 0.84];
    let clock = 0;
    const total = { n: 6 };
    function begin() {
      t = 0;
      flight = Math.max(0.58, 1.18 - env.level * 0.08 - ball * 0.03);
      shot = [null, null];
      resolved = [false, false];
      aim[0] = 0.84 + (Math.random() - 0.5) * (1.18 - nerve(env, 0)) * 0.32;
      aim[1] = 0.84 + (Math.random() - 0.5) * (1.18 - nerve(env, 1)) * 0.32;
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
          if (progress >= aim[p]) {
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
            if (total.n >= 12) return { winner: Math.random() < 0.5 ? 0 : 1, reason: "Akhiri gend" };
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
    const aimOff = [Math.random() * 0.24 - 0.12, Math.random() * 0.24 - 0.12];
    const patience = [0.25 + Math.random() * 0.7, 0.25 + Math.random() * 0.7];
    const fullFor = [0, 0];
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
          let holding = false;
          if (left[p] > 0) {
            if (power[p] <= 0) power[p] = 0.01;
            power[p] = Math.min(1, power[p] + dt * 0.55);
            const aim = aimOff[p] * (1.15 - nerve(env, p));
            const good = Math.abs(sw - aim) < 0.1 + (1 - nerve(env, p)) * 0.2 && power[p] > 0.58;
            if (power[p] >= 0.98) fullFor[p] += dt;
            holding = !good && fullFor[p] < patience[p];
            if (good || fullFor[p] >= patience[p]) {
              fullFor[p] = 0;
              fire(p, power[p], sw);
            }
          }
          was[p] = holding;
        }
        const done = left[0] === 0 && left[1] === 0 && !fly[0] && !fly[1];
        if (done) {
          if (scores[0] !== scores[1]) return { winner: scores[0] > scores[1] ? 0 : 1, reason: `${scores[0]} – ${scores[1]} ank` };
          if (!sudden) {
            sudden = true;
            left[0] = 1;
            left[1] = 1;
          } else return { winner: Math.random() < 0.5 ? 0 : 1, reason: "Akhiri teer" };
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
    let think = 0.45;
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
      think = 0.28 + Math.random() * 0.55;
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
          think -= dt;
          if (think <= 0) {
            if (shot < 0) shot = Math.floor(Math.random() * 3);
            if (keep < 0) {
              const guess = Math.random() < nerve(env, k) * 0.62;
              keep = guess && shot >= 0 ? shot : Math.floor(Math.random() * 3);
            }
          }
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
        const ballT = stage === "show" ? Math.min(1, anim / 0.7) : 0;
        const bx = w * 0.5 + (sx - w * 0.5) * ballT;
        const by = h * 0.78 - ballT * h * 0.42;
        ctx.fillStyle = "#f4f1ea";
        ctx.beginPath();
        ctx.arc(bx, by, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#1a1614";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        const s = shooter();
        const keeper = 1 - s;
        const hgt = Math.min(130, h * 0.3);
        drawFighter(ctx, keeperX, h * 0.7, hgt * 0.85, keeper === 0 ? env.p1 : env.p2, {
          lean: dive * ((kx - w * 0.5) / w) * 2,
          armL: dive ? -1.3 : 0.4,
          armR: dive ? 1.3 : -0.4,
          expr: "focus",
        });
        drawFighter(ctx, w * 0.5, h * 0.95, hgt, s === 0 ? env.p1 : env.p2, {
          lean: -0.12,
          armR: -0.4 - ballT * 1.4,
          expr: "focus",
        });
        if (stage === "show") text(ctx, saved ? "ROKA" : "GOL", w / 2, h * 0.16, { size: 28 });
        else text(ctx, shot < 0 ? "SHOOT" : ["BAEN", "MADHYA", "DAEN"][shot], w / 2, h * 0.16, { size: 22 });
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
          let tap = false;
          if (done[p] < need) {
            const v = value(p);
            const rising = Math.cos(phase[p] * Math.PI * 2) > 0;
            const gate = 0.78 + (1 - nerve(env, p)) * 0.18;
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
          } else return { winner: Math.random() < 0.5 ? 0 : 1, reason: "Akhiri pathar" };
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
    const react = [0, 0];
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
        if (mode === "wait") {
          for (let p = 0; p < 2; p++) {
            if (Math.random() < dt * (1 - nerve(env, p)) * 0.05) return scoreMaybe(p);
          }
          if (timer <= 0) {
            mode = "go";
            goT = 0;
            react[0] = Math.max(0.05, 0.2 - nerve(env, 0) * 0.14 + Math.random() * 0.07);
            react[1] = Math.max(0.05, 0.2 - nerve(env, 1) * 0.14 + Math.random() * 0.07);
            env.sfx?.beep?.();
          }
          return null;
        }
        if (mode === "go") {
          goT += dt;
          const ready = [goT >= react[0], goT >= react[1]];
          if (ready[0] || ready[1]) {
            const p = ready[0] && ready[1] ? (react[0] <= react[1] ? 0 : 1) : ready[0] ? 0 : 1;
            score(p, "Pehle");
          }
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

  dor(env) {
    const rad = 0.075;
    const lim = 0.9 - rad;
    const b = [
      { x: -0.42, y: 0.18, vx: 0.35 + Math.random() * 0.3, vy: -0.25 },
      { x: 0.4, y: -0.22, vx: -0.3 - Math.random() * 0.25, vy: 0.28 },
    ];
    const col = [env.p1.cloth || "#e07a2f", env.p2.cloth || "#2f6b45"];
    const own = [0, 0];
    let clock = 0;
    let surgeT = 0.4;
    let attacker = Math.random() < 0.5 ? 0 : 1;
    let leader = -1;
    let flips = 0;
    let share = [0.5, 0.5];

    function kick() {
      const ahead = own[0] === own[1] ? attacker : own[0] > own[1] ? 0 : 1;
      attacker = flips >= 2 ? ahead : 1 - attacker;
      const a = b[attacker];
      a.vx += -a.x * 1.1;
      a.vy += -a.y * 1.1;
      const d = b[1 - attacker];
      const mag = Math.hypot(d.x, d.y) || 1;
      d.vx += (d.x / mag) * 0.7;
      d.vy += (d.y / mag) * 0.7;
    }

    return {
      controls: "mash",
      verbs: ["Kheench", "Kheench"],
      update(dt) {
        clock += dt;
        surgeT += dt;
        if (surgeT > 1.35) {
          surgeT = 0;
          kick();
        }
        for (let p = 0; p < 2; p++) {
          b[p].x += b[p].vx * dt;
          b[p].y += b[p].vy * dt;
          b[p].vx *= 1 - dt * 0.15;
          b[p].vy *= 1 - dt * 0.15;
          const d = Math.hypot(b[p].x, b[p].y) || 0.001;
          if (d > lim) {
            const nx = b[p].x / d;
            const ny = b[p].y / d;
            const vdot = b[p].vx * nx + b[p].vy * ny;
            if (vdot > 0) {
              b[p].vx -= 2 * vdot * nx;
              b[p].vy -= 2 * vdot * ny;
            }
            b[p].x = nx * lim;
            b[p].y = ny * lim;
          }
        }
        let dx = b[1].x - b[0].x;
        let dy = b[1].y - b[0].y;
        let dist = Math.hypot(dx, dy) || 0.001;
        if (dist < rad * 2) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = rad * 2 - dist;
          b[0].x -= nx * overlap * 0.5;
          b[0].y -= ny * overlap * 0.5;
          b[1].x += nx * overlap * 0.5;
          b[1].y += ny * overlap * 0.5;
          const rel = (b[1].vx - b[0].vx) * nx + (b[1].vy - b[0].vy) * ny;
          if (rel < 0) {
            const j = -rel;
            b[0].vx -= j * nx;
            b[0].vy -= j * ny;
            b[1].vx += j * nx;
            b[1].vy += j * ny;
          }
        }
        let c0 = 0;
        const N = 64;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          const px = Math.cos(a);
          const py = Math.sin(a);
          const d0 = (px - b[0].x) ** 2 + (py - b[0].y) ** 2;
          const d1 = (px - b[1].x) ** 2 + (py - b[1].y) ** 2;
          if (d0 <= d1) c0 += 1;
        }
        share = [c0 / N, 1 - c0 / N];
        own[0] += share[0] * dt;
        own[1] += share[1] * dt;
        const now = share[0] >= share[1] ? 0 : 1;
        if (leader !== -1 && leader !== now && Math.abs(share[0] - share[1]) > 0.06) flips += 1;
        leader = now;
        if (clock > 5.5) {
          const w = own[0] >= own[1] ? 0 : 1;
          b[w].vx += -b[w].x * dt * 2.4;
          b[w].vy += -b[w].y * dt * 2.4;
          const other = b[1 - w];
          const mag = Math.hypot(other.x, other.y) || 0.001;
          other.vx += (other.x / mag) * dt * 2.1;
          other.vy += (other.y / mag) * dt * 2.1;
        }
        const hot = share[0] >= 0.64 || share[1] >= 0.64;
        if (hot && clock > 6.2 && (flips >= 1 || clock > 8)) {
          const w = share[0] >= share[1] ? 0 : 1;
          if (own[w] + 0.2 >= own[1 - w]) return { winner: w, reason: "Zyada dor le li" };
        }
        if (clock > 14) return { winner: own[0] >= own[1] ? 0 : 1, reason: "Zyada dor le li" };
        return null;
      },
      hud() {
        const who = share[0] >= share[1] ? shortName(env.names[0]) : shortName(env.names[1]);
        return `${who} ki dor badi hai`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#05060a";
        ctx.fillRect(0, 0, w, h);
        text(ctx, "STRING CIRCLE", w / 2, h * 0.09, { size: 18, color: "#f4f1ea", weight: 700 });
        const cx = w / 2;
        const cy = h * 0.5;
        const R = Math.min(w * 0.4, h * 0.32);
        ctx.strokeStyle = "rgba(255,255,255,0.28)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        const N = 150;
        ctx.lineWidth = 1;
        for (let i = 0; i < N; i++) {
          const a = (i / N) * Math.PI * 2;
          const px = Math.cos(a);
          const py = Math.sin(a);
          const d0 = (px - b[0].x) ** 2 + (py - b[0].y) ** 2;
          const d1 = (px - b[1].x) ** 2 + (py - b[1].y) ** 2;
          const p = d0 <= d1 ? 0 : 1;
          ctx.strokeStyle = col[p];
          ctx.globalAlpha = 0.55;
          ctx.beginPath();
          ctx.moveTo(cx + b[p].x * R, cy + b[p].y * R);
          ctx.lineTo(cx + px * R, cy + py * R);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        for (let p = 0; p < 2; p++) {
          const x = cx + b[p].x * R;
          const y = cy + b[p].y * R;
          const rr = rad * R * 1.15;
          ctx.fillStyle = col[p];
          ctx.shadowColor = col[p];
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(x, y, rr, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = SKINS_SAFE(p === 0 ? env.p1 : env.p2);
          ctx.beginPath();
          ctx.arc(x, y, rr * 0.62, 0, Math.PI * 2);
          ctx.fill();
          text(ctx, (env.names[p] || "?").slice(0, 1), x, y + rr * 0.22, { size: Math.max(11, rr * 0.7), color: "#1a1614" });
        }
        text(ctx, `${Math.round(share[0] * 100)}`, w * 0.22, h * 0.9, { size: 22, color: col[0] });
        text(ctx, `${Math.round(share[1] * 100)}`, w * 0.78, h * 0.9, { size: 22, color: col[1] });
        text(ctx, shortName(env.names[0]), w * 0.22, h * 0.95, { size: 12, color: "#c8c2b8" });
        text(ctx, shortName(env.names[1]), w * 0.78, h * 0.95, { size: 12, color: "#c8c2b8" });
      },
    };
  },

  niklo(env) {
    const lim = 0.78;
    const rad = 0.055;
    const b = [
      { x: 0.15, y: -0.05, vx: 0.15, vy: 0.72 },
      { x: -0.28, y: 0.12, vx: -0.1, vy: -0.66 },
    ];
    const col = [env.p1.cloth || "#e7d3a1", env.p2.cloth || "#c4503e"];
    let gap = Math.random() * Math.PI * 2;
    let clock = 0;
    const sparks = Array.from({ length: 180 }, (_, i) => ({
      a: (i / 180) * Math.PI * 2,
      j: (Math.random() - 0.5) * 0.08,
      s: 0.4 + Math.random() * 1.1,
      hot: Math.random() > 0.72,
    }));

    function wrap(d) {
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      return d;
    }

    return {
      controls: "mash",
      verbs: ["Bhago", "Bhago"],
      update(dt) {
        clock += dt;
        const gapW = Math.min(1.25, 0.36 + clock * 0.055);
        gap += dt * 0.55;
        for (let p = 0; p < 2; p++) {
          const gx = Math.cos(gap) * (lim - 0.02);
          const gy = Math.sin(gap) * (lim - 0.02);
          const dx = gx - b[p].x;
          const dy = gy - b[p].y;
          const len = Math.hypot(dx, dy) || 1;
          const pull = (clock < 2.4 ? 0.08 : 0.18 + nerve(env, p) * 0.4) * dt;
          b[p].vx += (dx / len) * pull + (Math.random() - 0.5) * dt * 0.8;
          b[p].vy += (dy / len) * pull + (Math.random() - 0.5) * dt * 0.8;
          const sp = Math.hypot(b[p].vx, b[p].vy) || 1;
          const max = 0.7 + nerve(env, p) * 0.35;
          if (sp > max) {
            b[p].vx *= max / sp;
            b[p].vy *= max / sp;
          }
          b[p].x += b[p].vx * dt;
          b[p].y += b[p].vy * dt;
        }
        let dx = b[1].x - b[0].x;
        let dy = b[1].y - b[0].y;
        let dist = Math.hypot(dx, dy) || 0.001;
        if (dist < rad * 2.1) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = rad * 2.1 - dist;
          b[0].x -= nx * overlap * 0.5;
          b[0].y -= ny * overlap * 0.5;
          b[1].x += nx * overlap * 0.5;
          b[1].y += ny * overlap * 0.5;
          const rel = (b[1].vx - b[0].vx) * nx + (b[1].vy - b[0].vy) * ny;
          if (rel < 0) {
            const j = -rel;
            b[0].vx -= j * nx;
            b[0].vy -= j * ny;
            b[1].vx += j * nx;
            b[1].vy += j * ny;
          }
        }
        let out = -1;
        let best = 0;
        for (let p = 0; p < 2; p++) {
          const d = Math.hypot(b[p].x, b[p].y) || 0.001;
          const ang = Math.atan2(b[p].y, b[p].x);
          const open = Math.abs(wrap(ang - gap)) < gapW / 2;
          if (d > lim && open && clock > 2.6 && d > best) {
            best = d;
            out = p;
          } else if (d > lim) {
            const nx = b[p].x / d;
            const ny = b[p].y / d;
            const vdot = b[p].vx * nx + b[p].vy * ny;
            if (vdot > 0) {
              b[p].vx -= 1.85 * vdot * nx;
              b[p].vy -= 1.85 * vdot * ny;
            }
            b[p].x = nx * lim;
            b[p].y = ny * lim;
          }
        }
        if (out >= 0) return { winner: out, reason: "Ghere se nikal gaya" };
        return null;
      },
      hud() {
        return "Will it escape?";
      },
      draw(ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#12162a");
        g.addColorStop(1, "#070814");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        text(ctx, "Will it escape?", w / 2, h * 0.1, { size: 26, color: "#f7f4ee", weight: 800 });
        const cx = w / 2;
        const cy = h * 0.52;
        const R = Math.min(w * 0.4, h * 0.3);
        const gapW = Math.min(1.25, 0.36 + clock * 0.055);
        for (const s of sparks) {
          let d = s.a - gap;
          while (d > Math.PI) d -= Math.PI * 2;
          while (d < -Math.PI) d += Math.PI * 2;
          if (Math.abs(d) < gapW / 2) continue;
          const rr = 1 + s.j;
          const x = cx + Math.cos(s.a + clock * 0.05) * R * rr;
          const y = cy + Math.sin(s.a + clock * 0.05) * R * rr;
          ctx.fillStyle = s.hot ? "#f4fbff" : "#7ee7ff";
          ctx.globalAlpha = 0.45 + s.s * 0.35;
          ctx.beginPath();
          ctx.arc(x, y, s.s * 1.7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        for (let p = 0; p < 2; p++) {
          buddy(ctx, cx + b[p].x * R, cy + b[p].y * R, rad * R * 1.7, col[p]);
        }
        text(ctx, shortName(env.names[0]), w * 0.22, h * 0.93, { size: 13, color: col[0] });
        text(ctx, shortName(env.names[1]), w * 0.78, h * 0.93, { size: 13, color: col[1] });
      },
    };
  },

  dino(env) {
    const out = [0, 0];
    const dinos = Array.from({ length: 10 }, (_, i) => {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * 0.45;
      return { p: i < 5 ? 0 : 1, x: Math.cos(a) * d, y: Math.sin(a) * d, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 };
    });
    let clock = 0;
    return {
      controls: "mash",
      verbs: ["Bhago", "Bhago"],
      update(dt) {
        clock += dt;
        for (const d of dinos) {
          const nx = d.p === 0 ? -0.38 : 0.38;
          d.vx += (nx - d.x) * dt * (0.16 + nerve(env, d.p) * 0.28);
          d.vy += (-1.05 - d.y) * dt * (0.08 + nerve(env, d.p) * 0.14);
          d.vx += (Math.random() - 0.5) * dt * 1.6;
          d.vy += (Math.random() - 0.5) * dt * 1.6;
          const sp = Math.hypot(d.vx, d.vy) || 1;
          const max = 0.7 + nerve(env, d.p) * 0.4;
          if (sp > max) {
            d.vx *= max / sp;
            d.vy *= max / sp;
          }
          d.x += d.vx * dt;
          d.y += d.vy * dt;
          const neck = (d.x < -0.18 && d.x > -0.58) || (d.x > 0.18 && d.x < 0.58);
          const len = Math.hypot(d.x, d.y) || 1;
          if (len > 0.88 && !(neck && d.y < -0.15)) {
            d.x *= 0.88 / len;
            d.y *= 0.88 / len;
            const ux = d.x / 0.88;
            const uy = d.y / 0.88;
            const v = d.vx * ux + d.vy * uy;
            if (v > 0) {
              d.vx -= 1.7 * v * ux;
              d.vy -= 1.7 * v * uy;
            }
          }
          if (neck && d.y < -0.7) {
            if (d.x < 0) {
              d.x = Math.max(-0.56, Math.min(-0.2, d.x));
            } else {
              d.x = Math.max(0.2, Math.min(0.56, d.x));
            }
            d.vy -= dt * 0.8;
            if (d.y < -1.45) {
              const side = d.x < 0 ? 0 : 1;
              if (d.p === side) out[d.p] += 1;
              const a = Math.random() * Math.PI * 2;
              d.x = Math.cos(a) * 0.25;
              d.y = Math.sin(a) * 0.25;
              d.vx = 0;
              d.vy = 0.2;
            }
          }
        }
        if (out[0] >= 4 || out[1] >= 4) {
          if (out[0] !== out[1]) return { winner: out[0] > out[1] ? 0 : 1, reason: `${out[0]}–${out[1]} dino bahar` };
        }
        if (clock > 16) return { winner: out[0] >= out[1] ? 0 : 1, reason: `${out[0]}–${out[1]} dino bahar` };
        return null;
      },
      hud() {
        return `Bahar ${out[0]} – ${out[1]}`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#10080c";
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h * 0.58;
        const R = Math.min(w * 0.38, h * 0.28);
        const map = (x, y) => [cx + x * R, cy + y * R];
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i <= 80; i++) {
          const a = Math.PI * 0.18 + (i / 80) * Math.PI * 1.64;
          const [px, py] = map(Math.cos(a) * 0.9, Math.sin(a) * 0.9);
          ctx.strokeStyle = `hsl(${(i / 80) * 280}, 90%, 58%)`;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
          if (i > 0) ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(px, py);
        }
        for (const side of [-1, 1]) {
          const x0 = side < 0 ? -0.56 : 0.2;
          const x1 = side < 0 ? -0.2 : 0.56;
          const g = ctx.createLinearGradient(0, cy - R * 1.55, 0, cy - R * 0.45);
          if (side < 0) {
            g.addColorStop(0, "#fff");
            g.addColorStop(1, "#ff4d3a");
          } else {
            g.addColorStop(0, "#7a4dff");
            g.addColorStop(1, "#3aa0ff");
          }
          ctx.strokeStyle = g;
          ctx.lineWidth = 4;
          ctx.beginPath();
          const [a1, b1] = map(x0, -0.72);
          const [a2, b2] = map(x0, -1.55);
          const [c1, d1] = map(x1, -1.55);
          const [c2, d2] = map(x1, -0.72);
          ctx.moveTo(a1, b1);
          ctx.lineTo(a2, b2);
          ctx.moveTo(c2, d2);
          ctx.lineTo(c1, d1);
          ctx.stroke();
        }
        for (const d of dinos) {
          const [px, py] = map(d.x, d.y);
          dinoSprite(ctx, px, py, Math.max(7, R * 0.045), d.p);
        }
        text(ctx, `${out[0]}`, w * 0.22, h * 0.12, { size: 28, color: "#ffb15a" });
        text(ctx, `${out[1]}`, w * 0.78, h * 0.12, { size: 28, color: "#7eb6ff" });
        text(ctx, shortName(env.names[0]), w * 0.22, h * 0.17, { size: 12, color: "#e7d8c8" });
        text(ctx, shortName(env.names[1]), w * 0.78, h * 0.17, { size: 12, color: "#e7d8c8" });
      },
    };
  },

  hathiyar(env) {
    const hp = [160, 160];
    const b = [
      { x: -0.38, y: 0.12, vx: 0.15, vy: 0.05, gun: null, cool: 0.3 },
      { x: 0.38, y: -0.08, vx: -0.12, vy: 0.08, gun: null, cool: 0.5 },
    ];
    const guns = [];
    const shots = [];
    let clock = 0;
    let spawn = 0.3;
    const kindOf = ["bandook", "rifle", "laser"];
    return {
      controls: "tap",
      verbs: ["Chalao", "Chalao"],
      update(dt) {
        clock += dt;
        spawn -= dt;
        if (spawn <= 0 && guns.length < 3) {
          spawn = 1.15;
          const a = Math.random() * Math.PI * 2;
          const d = 0.15 + Math.random() * 0.5;
          guns.push({ x: Math.cos(a) * d, y: Math.sin(a) * d, k: kindOf[(Math.random() * 3) | 0] });
        }
        for (let p = 0; p < 2; p++) {
          const me = b[p];
          const foe = b[1 - p];
          let tx = foe.x;
          let ty = foe.y;
          if (!me.gun && guns.length) {
            let best = guns[0];
            let bd = 99;
            for (const g of guns) {
              const dd = (g.x - me.x) ** 2 + (g.y - me.y) ** 2;
              if (dd < bd) {
                bd = dd;
                best = g;
              }
            }
            tx = best.x;
            ty = best.y;
          }
          const dx = tx - me.x;
          const dy = ty - me.y;
          const len = Math.hypot(dx, dy) || 1;
          me.vx += (dx / len) * dt * (1.05 + nerve(env, p) * 0.7);
          me.vy += (dy / len) * dt * (1.05 + nerve(env, p) * 0.7);
          me.vx += (Math.random() - 0.5) * dt * (1.1 - nerve(env, p));
          me.vy += (Math.random() - 0.5) * dt * (1.1 - nerve(env, p));
          const sp = Math.hypot(me.vx, me.vy) || 1;
          const max = 0.62 + nerve(env, p) * 0.2;
          if (sp > max) {
            me.vx *= max / sp;
            me.vy *= max / sp;
          }
          me.x += me.vx * dt;
          me.y += me.vy * dt;
          const wall = Math.hypot(me.x, me.y);
          if (wall > 0.8) {
            me.x *= 0.8 / wall;
            me.y *= 0.8 / wall;
            me.vx *= -0.35;
            me.vy *= -0.35;
          }
          if (!me.gun) {
            for (let i = guns.length - 1; i >= 0; i--) {
              const g = guns[i];
              if ((g.x - me.x) ** 2 + (g.y - me.y) ** 2 < 0.012) {
                me.gun = g.k;
                guns.splice(i, 1);
                me.cool = 0.2;
                break;
              }
            }
          }
          me.cool -= dt;
          if (me.gun && me.cool <= 0) {
            const aim = Math.atan2(foe.y - me.y, foe.x - me.x);
            const a = aim + (Math.random() - 0.5) * (1.05 - nerve(env, p)) * 0.7;
            const speed = me.gun === "laser" ? 1.7 : me.gun === "rifle" ? 1.15 : 1.4;
            const dmg = me.gun === "laser" ? 24 : me.gun === "rifle" ? 16 : 9;
            shots.push({ x: me.x, y: me.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, p, dmg, life: 1.2 });
            me.cool = me.gun === "bandook" ? 0.26 : 0.52;
            if (Math.random() < 0.16) me.gun = null;
          }
        }
        const dx = b[1].x - b[0].x;
        const dy = b[1].y - b[0].y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < 0.2) {
          const nx = dx / dist;
          const ny = dy / dist;
          const push = (0.2 - dist) * 0.5;
          b[0].x -= nx * push;
          b[0].y -= ny * push;
          b[1].x += nx * push;
          b[1].y += ny * push;
        }
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt;
          const foe = b[1 - s.p];
          if ((s.x - foe.x) ** 2 + (s.y - foe.y) ** 2 < 0.016) {
            hp[1 - s.p] -= s.dmg;
            shots.splice(i, 1);
            continue;
          }
          if (s.life <= 0 || s.x * s.x + s.y * s.y > 1.1) shots.splice(i, 1);
        }
        if (hp[0] <= 0 || hp[1] <= 0) {
          const w = hp[0] === hp[1] ? 0 : hp[0] > hp[1] ? 0 : 1;
          return { winner: w, reason: "Doosra gir gaya" };
        }
        return null;
      },
      hud() {
        return `${Math.max(0, hp[0] | 0)} – ${Math.max(0, hp[1] | 0)}`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#070b16";
        ctx.fillRect(0, 0, w, h);
        const col = [env.p1.cloth || "#e23b3b", env.p2.cloth || "#3b7be2"];
        text(ctx, `${shortName(env.names[0])} vs ${shortName(env.names[1])}`, w / 2, h * 0.16, { size: 18, color: "#f4f7ff", weight: 800 });
        for (let p = 0; p < 2; p++) {
          const x = p === 0 ? w * 0.08 : w * 0.52;
          ctx.fillStyle = "rgba(255,255,255,0.08)";
          ctx.fillRect(x, h * 0.055, w * 0.4, 10);
          ctx.fillStyle = col[p];
          ctx.fillRect(x, h * 0.055, w * 0.4 * Math.max(0, hp[p]) / 160, 10);
          text(ctx, shortName(env.names[p]), p === 0 ? x : x + w * 0.4, h * 0.05, { size: 11, color: "#d5dbe8", align: p === 0 ? "left" : "right" });
        }
        const cx = w / 2;
        const cy = h * 0.56;
        const R = Math.min(w * 0.4, h * 0.3);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = "rgba(90,150,230,0.16)";
        ctx.lineWidth = 1;
        for (let i = -5; i <= 5; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + (i * R) / 5, cy - R);
          ctx.lineTo(cx + (i * R) / 5, cy + R);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - R, cy + (i * R) / 5);
          ctx.lineTo(cx + R, cy + (i * R) / 5);
          ctx.stroke();
        }
        ctx.restore();
        ctx.strokeStyle = "rgba(220,232,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        const put = (x, y) => [cx + x * R, cy + y * R];
        for (const g of guns) {
          const [px, py] = put(g.x, g.y);
          ctx.fillStyle = "#101826";
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = g.k === "laser" ? "#7dffe1" : g.k === "rifle" ? "#ffd56a" : "#ff8b7a";
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.strokeStyle = "#e8eef8";
          ctx.beginPath();
          ctx.moveTo(px - 6, py);
          ctx.lineTo(px + 7, py - 2);
          ctx.moveTo(px + 4, py - 2);
          ctx.lineTo(px + 4, py - 6);
          ctx.stroke();
        }
        for (const s of shots) {
          const [px, py] = put(s.x, s.y);
          ctx.fillStyle = s.dmg > 20 ? "#7dffe1" : s.dmg > 12 ? "#ffd56a" : "#ffb0a4";
          ctx.beginPath();
          ctx.arc(px, py, s.dmg > 12 ? 3.5 : 2.4, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let p = 0; p < 2; p++) {
          const [px, py] = put(b[p].x, b[p].y);
          faceBall(ctx, px, py, Math.max(18, R * 0.11), p === 0 ? env.p1 : env.p2);
          text(ctx, shortName(env.names[p]), px, py + R * 0.2, { size: 11, color: "#f4f7ff" });
        }
      },
    };
  },

  pahunch(env) {
    const ball = [
      { x: -0.95, vx: 0, pace: 0.12 + Math.random() * 0.03 },
      { x: 0.95, vx: 0, pace: 0.12 + Math.random() * 0.03 },
    ];
    let clock = 0;
    let winner = -1;
    let winAt = 0;
    return {
      controls: "mash",
      verbs: ["Ladhko", "Ladhko"],
      update(dt) {
        clock += dt;
        let arrived = 0;
        for (let p = 0; p < 2; p++) {
          const speed = ball[p].pace + nerve(env, p) * 0.045;
          ball[p].vx = -Math.sign(ball[p].x || 1) * speed;
          ball[p].x += ball[p].vx * dt;
          if (Math.abs(ball[p].x) < 0.04) arrived += 1;
        }
        if (winner < 0) {
          const near = [Math.abs(ball[0].x), Math.abs(ball[1].x)];
          if (near[0] < 0.05 || near[1] < 0.05) {
            winner = near[0] <= near[1] ? 0 : 1;
            winAt = clock;
          }
        }
        if (winner >= 0 && (arrived === 2 || clock > winAt + 0.45)) return { winner, reason: "Pehle pahuncha" };
        if (clock > 11) return { winner: Math.abs(ball[0].x) <= Math.abs(ball[1].x) ? 0 : 1, reason: "Pehle pahuncha" };
        return null;
      },
      hud() {
        return "Will they arrive at once?";
      },
      draw(ctx, w, h) {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#14182a");
        g.addColorStop(1, "#070910");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        text(ctx, "Will they all arrive at once?", w / 2, h * 0.12, { size: 16, color: "#f4f6fb", weight: 800 });
        const done = (Math.abs(ball[0].x) < 0.05 ? 1 : 0) + (Math.abs(ball[1].x) < 0.05 ? 1 : 0);
        text(ctx, "balls:", w / 2 - 16, h * 0.18, { size: 18, color: "#f4f6fb", align: "right" });
        text(ctx, String(done), w / 2 + 8, h * 0.18, { size: 18, color: "#f5d34a", align: "left" });
        const cx = w / 2;
        const top = h * 0.4;
        const R = Math.min(w * 0.4, h * 0.24);
        const pt = (x) => [cx + x * R, top + x * x * R * 0.9];
        ctx.strokeStyle = "#7ef0ff";
        ctx.shadowColor = "#7ef0ff";
        ctx.shadowBlur = 12;
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const x = -1 + (i / 40) * 2;
          const [px, py] = pt(x);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
        const [fx, fy] = pt(0);
        ctx.strokeStyle = "#f5d34a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(fx, fy - 18, 10, 0, Math.PI * 2);
        ctx.stroke();
        const col = [env.p1.cloth || "#d46bff", env.p2.cloth || "#f5d34a"];
        for (let p = 0; p < 2; p++) {
          const [px, py] = pt(ball[p].x);
          ctx.fillStyle = col[p];
          ctx.shadowColor = col[p];
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py - 12, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        text(ctx, shortName(env.names[0]), w * 0.22, h * 0.9, { size: 13, color: col[0] });
        text(ctx, shortName(env.names[1]), w * 0.78, h * 0.9, { size: 13, color: col[1] });
      },
    };
  },

  kirane(env) {
    const hit = [0, 0];
    let rays = 0;
    let clock = 0;
    const target = 240;
    const off = [-0.2, 0.2];
    let acc = 0;
    return {
      controls: "mash",
      verbs: ["Pakdo", "Pakdo"],
      update(dt) {
        clock += dt;
        off[0] = -0.28 + Math.sin(clock * 1.15) * 0.2;
        off[1] = 0.28 + Math.sin(clock * 1.15 + 1.4) * 0.2;
        acc += dt * 32;
        while (acc >= 1 && rays < target) {
          acc -= 1;
          rays += 1;
          const x = -1 + ((rays * 0.618033) % 1) * 2;
          for (let p = 0; p < 2; p++) {
            const rad = 0.13 + nerve(env, p) * 0.055;
            if (Math.abs(x - off[p]) < rad) hit[p] += 1;
          }
        }
        if (rays >= target) return { winner: hit[0] === hit[1] ? (nerve(env, 0) >= nerve(env, 1) ? 0 : 1) : hit[0] > hit[1] ? 0 : 1, reason: "Zyada kirane pakdi" };
        return null;
      },
      hud() {
        return `RAYS ${rays}`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#05060a";
        ctx.fillRect(0, 0, w, h);
        text(ctx, `RAYS:  ${rays}`, w / 2, h * 0.1, { size: 22, color: "#f7f7f7", weight: 800 });
        const left = w * 0.14;
        const right = w * 0.86;
        const top = h * 0.16;
        const bot = h * 0.72;
        const mid = (left + right) / 2;
        const half = (right - left) / 2;
        const yAt = (x) => {
          const u = (x - mid) / half;
          return bot - (1 - u * u) * (bot - top) * 0.55;
        };
        const blockers = [0, 1].map((p) => mid + off[p] * half);
        ctx.lineWidth = 1;
        for (let i = 0; i <= 70; i++) {
          const x = left + ((right - left) * i) / 70;
          const hue = (i / 70) * 300;
          ctx.strokeStyle = `hsl(${hue}, 85%, 58%)`;
          ctx.globalAlpha = 0.8;
          let yEnd = yAt(x);
          for (let p = 0; p < 2; p++) {
            if (Math.abs(x - blockers[p]) < half * 0.11 && yEnd > top + (bot - top) * 0.28) yEnd = top + (bot - top) * 0.34;
          }
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, yEnd);
          ctx.stroke();
          if (yEnd > top + (bot - top) * 0.5) {
            const focusX = mid + (x < mid ? -1 : 1) * half * 0.08;
            const focusY = bot - 8;
            ctx.globalAlpha = 0.45;
            ctx.beginPath();
            ctx.moveTo(x, yEnd);
            ctx.lineTo(focusX, focusY);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#f4f4f4";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const x = left + ((right - left) * i) / 40;
          const y = yAt(x);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const col = [env.p1.cloth || "#5aa2ff", env.p2.cloth || "#ffb14a"];
        for (let p = 0; p < 2; p++) {
          const bw = half * 0.2;
          const bh = (bot - top) * 0.28;
          const x = blockers[p] - bw / 2;
          const y = top + (bot - top) * 0.34;
          const grd = ctx.createLinearGradient(x, y, x, y + bh);
          grd.addColorStop(0, col[p]);
          grd.addColorStop(1, p === 0 ? "#ffd56a" : "#7af0ff");
          ctx.fillStyle = grd;
          ctx.globalAlpha = 0.88;
          ctx.fillRect(x, y, bw, bh);
        }
        ctx.globalAlpha = 1;
        text(ctx, `${hit[0] | 0}`, w * 0.22, h * 0.9, { size: 22, color: col[0] });
        text(ctx, `${hit[1] | 0}`, w * 0.78, h * 0.9, { size: 22, color: col[1] });
      },
    };
  },

  gada(env) {
    const hp = [260, 260];
    const b = [
      { x: -0.22, y: 0.02, vx: 0.05, vy: 0, ang: Math.random() * 6, cool: 0 },
      { x: 0.24, y: -0.04, vx: -0.05, vy: 0, ang: Math.random() * 6, cool: 0 },
    ];
    let clock = 0;
    return {
      controls: "mash",
      verbs: ["Ghumao", "Ghumao"],
      update(dt) {
        clock += dt;
        for (let p = 0; p < 2; p++) {
          const me = b[p];
          const foe = b[1 - p];
          const dx = foe.x - me.x;
          const dy = foe.y - me.y;
          const len = Math.hypot(dx, dy) || 1;
          me.vx += (dx / len) * dt * (1.15 + nerve(env, p) * 0.7);
          me.vy += (dy / len) * dt * (1.15 + nerve(env, p) * 0.7);
          me.vx *= 1 - dt * 0.35;
          me.vy *= 1 - dt * 0.35;
          me.x += me.vx * dt;
          me.y += me.vy * dt;
          if (Math.abs(me.x) > 0.78) {
            me.x = Math.sign(me.x) * 0.78;
            me.vx *= -0.75;
          }
          if (Math.abs(me.y) > 0.72) {
            me.y = Math.sign(me.y) * 0.72;
            me.vy *= -0.75;
          }
          me.ang += dt * (2.6 + nerve(env, p) * 2.4) * (p === 0 ? 1 : -1);
          me.cool -= dt;
          const tx = me.x + Math.cos(me.ang) * 0.42;
          const ty = me.y + Math.sin(me.ang) * 0.42;
          if (me.cool <= 0 && (tx - foe.x) ** 2 + (ty - foe.y) ** 2 < 0.04) {
            hp[1 - p] -= 34 + Math.random() * 22 + nerve(env, p) * 8;
            foe.vx += Math.cos(me.ang) * 0.4;
            foe.vy += Math.sin(me.ang) * 0.4;
            me.cool = 0.28;
          }
        }
        const dx = b[1].x - b[0].x;
        const dy = b[1].y - b[0].y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < 0.2) {
          const nx = dx / dist;
          const ny = dy / dist;
          b[0].x -= nx * (0.2 - dist) * 0.5;
          b[0].y -= ny * (0.2 - dist) * 0.5;
          b[1].x += nx * (0.2 - dist) * 0.5;
          b[1].y += ny * (0.2 - dist) * 0.5;
        }
        if (hp[0] <= 0 || hp[1] <= 0 || (clock > 14 && hp[0] !== hp[1])) {
          const w = hp[0] === hp[1] ? 0 : hp[0] > hp[1] ? 0 : 1;
          return { winner: w, reason: "Gada se gira diya" };
        }
        return null;
      },
      hud() {
        return `${Math.max(0, hp[0] | 0)} vs ${Math.max(0, hp[1] | 0)}`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, w, h);
        const col = [env.p1.cloth || "#3ec6ff", env.p2.cloth || "#ff7a3c"];
        text(ctx, shortName(env.names[0]), w * 0.16, h * 0.1, { size: 13, color: "#f2f2f2", align: "left" });
        text(ctx, shortName(env.names[1]), w * 0.84, h * 0.1, { size: 13, color: "#f2f2f2", align: "right" });
        text(ctx, String(Math.max(0, hp[0] | 0)), w * 0.16, h * 0.15, { size: 26, color: "#fff", align: "left", weight: 800 });
        text(ctx, String(Math.max(0, hp[1] | 0)), w * 0.84, h * 0.15, { size: 26, color: "#fff", align: "right", weight: 800 });
        text(ctx, "VS", w / 2, h * 0.15, { size: 18, color: "#fff", weight: 800 });
        ctx.fillStyle = col[0];
        ctx.fillRect(w * 0.16, h * 0.175, w * 0.24 * Math.max(0, hp[0]) / 260, 6);
        ctx.fillStyle = col[1];
        ctx.fillRect(w * 0.6 + w * 0.24 * (1 - Math.max(0, hp[1]) / 260), h * 0.175, w * 0.24 * Math.max(0, hp[1]) / 260, 6);
        const left = w * 0.1;
        const top = h * 0.24;
        const side = Math.min(w * 0.8, h * 0.5);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, side, side);
        const put = (x, y) => [left + ((x + 0.9) / 1.8) * side, top + ((y + 0.85) / 1.7) * side];
        for (let p = 0; p < 2; p++) {
          const [px, py] = put(b[p].x, b[p].y);
          const [tx, ty] = put(b[p].x + Math.cos(b[p].ang) * 0.42, b[p].y + Math.sin(b[p].ang) * 0.42);
          ctx.strokeStyle = "#8a5a32";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(tx, ty);
          ctx.stroke();
          sickle(ctx, tx, ty, b[p].ang);
          ctx.fillStyle = col[p];
          ctx.beginPath();
          ctx.arc(px, py, side * 0.06, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = SKINS_SAFE(p === 0 ? env.p1 : env.p2);
          ctx.beginPath();
          ctx.arc(px, py, side * 0.036, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    };
  },

  pees(env) {
    const score = [0, 0];
    const balls = Array.from({ length: 28 }, () => ({
      p: Math.random() < 0.5 ? 0 : 1,
      x: (Math.random() - 0.5) * 1.35,
      y: -0.2 - Math.random() * 1.3,
      vx: (Math.random() - 0.5) * 0.2,
      vy: Math.random() * 0.2,
      hue: Math.random() * 360,
    }));
    let rot = 0;
    let clock = 0;
    return {
      controls: "mash",
      verbs: ["Peeso", "Peeso"],
      update(dt) {
        clock += dt;
        rot += dt * 2.4;
        for (const b of balls) {
          b.vy += dt * 0.42;
          const s0 = 0.28 + nerve(env, 0) * 0.35;
          const s1 = 0.28 + nerve(env, 1) * 0.35;
          b.vx += ((-0.18 - b.x) * s0 + (0.18 - b.x) * s1) * dt * 0.35;
          b.vx += (Math.random() - 0.5) * dt * 0.4;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          let crushed = -1;
          for (let gi = 0; gi < 2; gi++) {
            const gx = gi === 0 ? -0.18 : 0.18;
            const dx = b.x - gx;
            const dy = b.y;
            const d = Math.hypot(dx, dy) || 0.001;
            if (d < 0.2) crushed = gi;
          }
          if (crushed >= 0 && b.y > -0.22 && b.y < 0.22) {
            score[crushed] += 1;
            b.x = (Math.random() - 0.5) * 1.15;
            b.y = -1.35 - Math.random() * 0.3;
            b.vx = 0;
            b.vy = 0;
            b.hue = Math.random() * 360;
          }
          if (b.y > 1.15 || Math.abs(b.x) > 1.05) {
            b.x = (Math.random() - 0.5) * 1.1;
            b.y = -1.2;
            b.vy = 0;
          }
        }
        if ((score[0] >= 34 || score[1] >= 34) && score[0] !== score[1]) {
          return { winner: score[0] > score[1] ? 0 : 1, reason: "Zyada gend peesi" };
        }
        if (clock > 16) return { winner: score[0] >= score[1] ? 0 : 1, reason: "Zyada gend peesi" };
        return null;
      },
      hud() {
        return `Peesi ${score[0]} – ${score[1]}`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#120818";
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h * 0.5;
        const S = Math.min(w, h) * 0.34;
        for (const b of balls) {
          if (b.y < -0.15) continue;
          const x = cx + b.x * S;
          const y = cy + b.y * S;
          ctx.fillStyle = `hsl(${b.hue}, 78%, 54%)`;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,255,255,0.45)";
          ctx.beginPath();
          ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        gear(ctx, cx - S * 0.18, cy, S * 0.2, rot, env.p1.cloth || "#c084fc");
        gear(ctx, cx + S * 0.18, cy, S * 0.2, -rot, env.p2.cloth || "#4ade80");
        for (const b of balls) {
          if (b.y >= -0.15) continue;
          const x = cx + b.x * S;
          const y = cy + b.y * S;
          ctx.fillStyle = `hsl(${b.hue}, 78%, 54%)`;
          ctx.beginPath();
          ctx.arc(x, y, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        const col = [env.p1.cloth || "#c084fc", env.p2.cloth || "#4ade80"];
        text(ctx, `${score[0]}`, w * 0.22, h * 0.9, { size: 26, color: col[0], weight: 800 });
        text(ctx, `${score[1]}`, w * 0.78, h * 0.9, { size: 26, color: col[1], weight: 800 });
        text(ctx, shortName(env.names[0]), w * 0.22, h * 0.95, { size: 12, color: "#ddd" });
        text(ctx, shortName(env.names[1]), w * 0.78, h * 0.95, { size: 12, color: "#ddd" });
      },
    };
  },

  rage(env) {
    const hearts = [8, 8];
    const b = [
      { x: -0.34, y: 0.16, vx: 0.62, vy: -0.28, gun: false, ammo: 0, cool: 0 },
      { x: 0.36, y: -0.18, vx: -0.5, vy: 0.4, gun: false, ammo: 0, cool: 0 },
    ];
    let weapon = null;
    let armAt = 1.4;
    const shots = [];
    const bits = [];
    const hurt = [0, 0];
    let clock = 0;
    const col = [env.p1.cloth || "#ff4b6e", env.p2.cloth || "#79d2ff"];
    const rageOf = (p) => 1 + (8 - hearts[p]) * 0.14;

    function burst(x, y, color) {
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 0.2 + Math.random() * 0.55;
        bits.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.4 + Math.random() * 0.3, color });
      }
    }

    function dropAtom(from) {
      const a = Math.random() * Math.PI * 2;
      const dist = 0.34 + Math.random() * 0.12;
      let x = from.x + Math.cos(a) * dist;
      let y = from.y + Math.sin(a) * dist;
      const d = Math.hypot(x, y) || 1;
      if (d > 0.62) {
        x *= 0.62 / d;
        y *= 0.62 / d;
      }
      weapon = { x, y, lock: 0.85 };
    }

    return {
      controls: "mash",
      verbs: ["Tez", "Tez"],
      update(dt) {
        clock += dt;
        if (!weapon && clock >= armAt) {
          const a = Math.random() * Math.PI * 2;
          weapon = { x: Math.cos(a) * 0.15, y: Math.sin(a) * 0.15, lock: 0.3 };
        }
        if (weapon) {
          weapon.lock = Math.max(0, weapon.lock - dt);
          if (weapon.lock <= 0) {
            weapon.spin = (weapon.spin || 0) + dt * 0.9;
            weapon.x = Math.cos(weapon.spin) * 0.28;
            weapon.y = Math.sin(weapon.spin) * 0.28;
          }
        }
        for (let p = 0; p < 2; p++) hurt[p] = Math.max(0, hurt[p] - dt);
        for (let p = 0; p < 2; p++) {
          const me = b[p];
          const foe = b[1 - p];
          const rage = rageOf(p);
          const sp0 = Math.hypot(me.vx, me.vy) || 1;
          const want = (0.42 + nerve(env, p) * 0.05) * Math.min(rage, 1.55);
          me.vx *= want / sp0;
          me.vy *= want / sp0;
          me.x += me.vx * dt;
          me.y += me.vy * dt;
          const wall = Math.hypot(me.x, me.y) || 1;
          if (wall > 0.78) {
            const nx = me.x / wall;
            const ny = me.y / wall;
            const v = me.vx * nx + me.vy * ny;
            if (v > 0) {
              me.vx -= 2 * v * nx;
              me.vy -= 2 * v * ny;
            }
            const slip = (Math.random() - 0.5) * 0.06;
            me.vx += -ny * slip;
            me.vy += nx * slip;
            me.x = nx * 0.78;
            me.y = ny * 0.78;
          }
          if (weapon && weapon.lock <= 0 && (me.x - weapon.x) ** 2 + (me.y - weapon.y) ** 2 < 0.05) {
            me.gun = true;
            me.ammo = 2;
            me.cool = 0.35;
            weapon = null;
            env.sfx?.beep?.();
          }
          if (!me.gun) continue;
          me.cool -= dt;
          if (me.cool > 0 || me.ammo <= 0) continue;
          const aim = Math.atan2(foe.y - me.y, foe.x - me.x) + (Math.random() - 0.5) * 0.22;
          const spd = 0.85 * Math.min(rage, 1.5);
          shots.push({ x: me.x, y: me.y, vx: Math.cos(aim) * spd, vy: Math.sin(aim) * spd, p, life: 2.2 });
          me.ammo -= 1;
          me.cool = 0.95;
          if (me.ammo <= 0) {
            me.gun = false;
            dropAtom(me);
          }
        }
        const dx = b[1].x - b[0].x;
        const dy = b[1].y - b[0].y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < 0.2) {
          const nx = dx / dist;
          const ny = dy / dist;
          const rel = (b[1].vx - b[0].vx) * nx + (b[1].vy - b[0].vy) * ny;
          if (rel < 0) {
            const j = -rel;
            b[0].vx -= j * nx;
            b[0].vy -= j * ny;
            b[1].vx += j * nx;
            b[1].vy += j * ny;
          }
          const push = (0.2 - dist) * 0.5;
          b[0].x -= nx * push;
          b[0].y -= ny * push;
          b[1].x += nx * push;
          b[1].y += ny * push;
        }
        for (let i = shots.length - 1; i >= 0; i--) {
          const s = shots[i];
          const foe = b[1 - s.p];
          const aimx = foe.x - s.x;
          const aimy = foe.y - s.y;
          const alen = Math.hypot(aimx, aimy) || 1;
          s.vx += (aimx / alen) * dt * 2.2;
          s.vy += (aimy / alen) * dt * 2.2;
          const ssp = Math.hypot(s.vx, s.vy) || 1;
          if (ssp > 1.15) {
            s.vx *= 1.15 / ssp;
            s.vy *= 1.15 / ssp;
          }
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.life -= dt;
          if (hurt[1 - s.p] <= 0 && (s.x - foe.x) ** 2 + (s.y - foe.y) ** 2 < 0.02) {
            hearts[1 - s.p] -= 1;
            hurt[1 - s.p] = 0.55;
            foe.vx += s.vx * 0.2;
            foe.vy += s.vy * 0.2;
            burst(foe.x, foe.y, col[1 - s.p]);
            env.sfx?.hit?.();
            shots.splice(i, 1);
            continue;
          }
          const sw = Math.hypot(s.x, s.y) || 1;
          if (sw > 0.86) {
            const nx = s.x / sw;
            const ny = s.y / sw;
            const v = s.vx * nx + s.vy * ny;
            if (v > 0) {
              s.vx -= 2 * v * nx;
              s.vy -= 2 * v * ny;
            }
            s.x = nx * 0.86;
            s.y = ny * 0.86;
          }
          if (s.life <= 0) shots.splice(i, 1);
        }
        for (let i = bits.length - 1; i >= 0; i--) {
          const bit = bits[i];
          bit.x += bit.vx * dt;
          bit.y += bit.vy * dt;
          bit.life -= dt;
          if (bit.life <= 0) bits.splice(i, 1);
        }
        if (bits.length > 70) bits.splice(0, bits.length - 70);
        if (hearts[0] <= 0 || hearts[1] <= 0 || (clock > 36 && hearts[0] !== hearts[1])) {
          const w = hearts[0] === hearts[1] ? 0 : hearts[0] > hearts[1] ? 0 : 1;
          return { winner: w, reason: "Aakhri dil bacha" };
        }
        return null;
      },
      hud() {
        const holder = b[0].gun ? 0 : b[1].gun ? 1 : -1;
        if (holder >= 0) return `${shortName(env.names[holder])} ke paas atom`;
        if (hearts[0] < hearts[1]) return `${shortName(env.names[0])} rage mein hai`;
        if (hearts[1] < hearts[0]) return `${shortName(env.names[1])} rage mein hai`;
        return weapon ? "Atom ghum raha hai" : "Atom aa raha hai";
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#070b18";
        ctx.fillRect(0, 0, w, h);
        const n0 = shortName(env.names[0]);
        const n1 = shortName(env.names[1]);
        text(ctx, n0, w * 0.3, h * 0.2, { size: 20, color: col[0], weight: 800 });
        text(ctx, "VS", w / 2, h * 0.2, { size: 16, color: "#f4f6fb", weight: 800 });
        text(ctx, n1, w * 0.7, h * 0.2, { size: 20, color: col[1], weight: 800 });
        for (let i = 0; i < 8; i++) {
          heartIcon(ctx, w * 0.5 - 60 + i * 17, h * 0.07, i < hearts[0], col[0]);
          heartIcon(ctx, w * 0.5 - 60 + i * 17, h * 0.12, i < hearts[1], col[1]);
        }
        const cx = w / 2;
        const cy = h * 0.58;
        const R = Math.min(w * 0.4, h * 0.3);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.clip();
        ctx.strokeStyle = "rgba(120,160,220,0.14)";
        ctx.lineWidth = 1;
        for (let i = -5; i <= 5; i++) {
          ctx.beginPath();
          ctx.moveTo(cx + (i * R) / 5, cy - R);
          ctx.lineTo(cx + (i * R) / 5, cy + R);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - R, cy + (i * R) / 5);
          ctx.lineTo(cx + R, cy + (i * R) / 5);
          ctx.stroke();
        }
        const put = (x, y) => [cx + x * R, cy + y * R];
        for (const bit of bits) {
          const [px, py] = put(bit.x, bit.y);
          ctx.globalAlpha = Math.max(0, bit.life);
          ctx.fillStyle = bit.color;
          ctx.beginPath();
          ctx.arc(px, py, 3 + bit.life * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        for (const s of shots) {
          const [px, py] = put(s.x, s.y);
          ctx.fillStyle = col[s.p];
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        if (weapon) {
          const [px, py] = put(weapon.x, weapon.y);
          const spin = clock * 3;
          ctx.strokeStyle = "rgba(226,177,90,0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(px, py, 14, 6, spin, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(px, py, 14, 6, spin + 1.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "#ffe7a3";
          ctx.shadowColor = "#e2b15a";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#fff6d8";
          ctx.beginPath();
          ctx.arc(px + Math.cos(spin) * 14, py + Math.sin(spin) * 6, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        for (let p = 0; p < 2; p++) {
          const [px, py] = put(b[p].x, b[p].y);
          const rr = Math.max(16, R * 0.09) * (hurt[p] > 0 ? 1.08 : 1);
          if (b[p].gun) {
            ctx.strokeStyle = "#ffe7a3";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(px, py, rr + 7, 0, Math.PI * 2);
            ctx.stroke();
          }
          rageFace(ctx, px, py, rr, col[p], hearts[p] <= 4);
          ctx.fillStyle = "rgba(6,8,16,0.72)";
          const label = p === 0 ? n0 : n1;
          ctx.font = `700 11px "Noto Sans Devanagari", FreeSans, sans-serif`;
          const tw = Math.min(108, label.length * 7 + 16);
          roundRect(ctx, px - tw / 2, py + rr + 4, tw, 16, 8);
          ctx.fill();
          text(ctx, label, px, py + rr + 16, { size: 11, color: col[p], weight: 700 });
        }
        ctx.restore();
        ctx.strokeStyle = "rgba(236,242,255,0.9)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
      },
    };
  },

  billi(env) {
    const score = [0, 0];
    const col = [env.p1.cloth || "#8fd4ff", env.p2.cloth || "#ffc14d"];
    const cats = [];
    const drop = (n) => {
      for (let i = 0; i < n; i++) {
        cats.push({
          x: (Math.random() - 0.5) * 0.7,
          y: -0.55 + Math.random() * 0.25,
          vx: (Math.random() - 0.5) * 0.25,
          vy: 0.05 + Math.random() * 0.2,
          cool: 0,
        });
      }
    };
    drop(28);
    const wheels = [
      { x: -0.34, y: 0.08, a: 0.4 },
      { x: 0.34, y: 0.08, a: 2.2 },
    ];
    const teeth = 7;
    const spin = [1.7 + nerve(env, 0) * 0.18, -(1.65 + nerve(env, 1) * 0.18)];
    const wheelCool = [0, 0.2];
    let clock = 0;
    let rain = 0.15;

    return {
      controls: "mash",
      verbs: ["Ghum", "Ghum"],
      update(dt) {
        clock += dt;
        rain -= dt;
        if (rain <= 0 && cats.length < 78) {
          drop(3);
          rain = 0.42;
        }
        for (let p = 0; p < 2; p++) {
          wheels[p].a += spin[p] * dt;
          wheelCool[p] = Math.max(0, wheelCool[p] - dt);
        }
        for (const c of cats) {
          c.cool = Math.max(0, c.cool - dt);
          c.vy += 1.05 * dt;
          c.vx *= 0.998;
          c.x += c.vx * dt;
          c.y += c.vy * dt;
          const d = Math.hypot(c.x, c.y) || 1;
          if (d > 0.86) {
            const nx = c.x / d;
            const ny = c.y / d;
            const v = c.vx * nx + c.vy * ny;
            if (v > 0) {
              c.vx -= 1.7 * v * nx;
              c.vy -= 1.7 * v * ny;
            }
            c.x = nx * 0.86;
            c.y = ny * 0.86;
          }
          if (c.y > 1.2) {
            c.x = (Math.random() - 0.5) * 0.4;
            c.y = -0.7;
            c.vy = 0.2;
          }
          for (let p = 0; p < 2; p++) {
            if (c.cool > 0) break;
            const w = wheels[p];
            const dx = c.x - w.x;
            const dy = c.y - w.y;
            const rd = Math.hypot(dx, dy);
            if (rd < 0.07 || rd > 0.3) continue;
            let ang = Math.atan2(dy, dx) - w.a;
            ang = ((ang % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            const slot = (Math.PI * 2) / teeth;
            const into = Math.abs((ang % slot) - slot * 0.5);
            if (into > 0.28 || wheelCool[p] > 0) continue;
            const dir = Math.sign(spin[p]) || 1;
            const tx = (-dy / rd) * dir;
            const ty = (dx / rd) * dir;
            c.vx = tx * 1.25;
            c.vy = ty * 1.25;
            c.cool = 0.55;
            const pace = Math.max(0.16, 0.48 - (score[0] + score[1]) * 0.004);
            wheelCool[p] = pace;
            score[p] += 1;
            env.sfx?.pop?.();
          }
        }
        if (clock > 12 && (score[0] >= 48 || score[1] >= 48) && score[0] !== score[1]) {
          return { winner: score[0] > score[1] ? 0 : 1, reason: "Zyada billi uthayi" };
        }
        if (clock > 22 && score[0] !== score[1]) {
          return { winner: score[0] > score[1] ? 0 : 1, reason: "Zyada billi uthayi" };
        }
        return null;
      },
      hud() {
        return `${score[0]} – ${score[1]} billi`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#070b16";
        ctx.fillRect(0, 0, w, h);
        const cx = w / 2;
        const cy = h * 0.46;
        const R = Math.min(w * 0.42, h * 0.32);
        ctx.strokeStyle = "rgba(170, 198, 235, 0.45)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#b9d7ff";
        for (let i = 0; i < 34; i++) {
          const a = (i / 34) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
        const put = (x, y) => [cx + x * R, cy + y * R];
        for (let p = 0; p < 2; p++) {
          const [wx, wy] = put(wheels[p].x, wheels[p].y);
          ctx.strokeStyle = "rgba(186, 206, 230, 0.55)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(wx, wy, R * 0.36, wheels[p].a - 0.2, wheels[p].a + 1.5 * Math.sign(spin[p] || 1));
          ctx.stroke();
          toothedWheel(ctx, wx, wy, R * 0.3, wheels[p].a, col[p]);
        }
        for (const c of cats) {
          const [px, py] = put(c.x, c.y);
          miniCat(ctx, px, py, 4.4);
        }
        text(ctx, shortName(env.names[0]), w * 0.24, h * 0.78, { size: 14, color: col[0], weight: 700 });
        text(ctx, shortName(env.names[1]), w * 0.76, h * 0.78, { size: 14, color: col[1], weight: 700 });
        text(ctx, `${score[0]}`, w * 0.24, h * 0.86, { size: 40, color: "#f4f7ff", weight: 800 });
        text(ctx, `${score[1]}`, w * 0.76, h * 0.86, { size: 40, color: "#f4f7ff", weight: 800 });
      },
    };
  },

  jor(env) {
    const balls = [
      { x: -0.2, y: -0.28, vx: 0.62, vy: 0.18, p: 0, hue: 12, cool: 0 },
      { x: 0.22, y: -0.22, vx: -0.55, vy: 0.28, p: 1, hue: 168, cool: 0.15 },
    ];
    let bar = 2.2;
    let clock = 0;
    const gap = 0.95;

    function count(p) {
      let n = 0;
      for (const b of balls) if (b.p === p) n += 1;
      return n;
    }

    function split(b) {
      if (b.cool > 0 || count(b.p) >= 34) return;
      const j = (Math.random() - 0.5) * 0.55;
      balls.push({
        x: b.x * 0.92,
        y: b.y * 0.92,
        vx: -b.vx * 0.75 + j,
        vy: b.vy * 0.75 + (Math.random() - 0.35) * 0.4,
        p: b.p,
        hue: (b.hue + 28 + Math.random() * 18) % 360,
        cool: 0.34,
      });
      b.cool = 0.42;
      b.hue = (b.hue + 16) % 360;
      env.sfx?.pop?.();
    }

    return {
      controls: "mash",
      verbs: ["Lapak", "Lapak"],
      update(dt) {
        clock += dt;
        bar += dt * 0.45;
        const ax = Math.cos(bar) * -0.05 - Math.sin(bar) * 0.16;
        const ay = Math.sin(bar) * -0.05 + Math.cos(bar) * 0.16;
        const bx = Math.cos(bar) * 0.74 - Math.sin(bar) * 0.16;
        const by = Math.sin(bar) * 0.74 + Math.cos(bar) * 0.16;
        const lx = bx - ax;
        const ly = by - ay;
        const l2 = lx * lx + ly * ly || 1;
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i];
          b.cool -= dt;
          const sp = Math.hypot(b.vx, b.vy) || 1;
          const want = 0.62 + nerve(env, b.p) * 0.08;
          if (sp < want * 0.75) {
            b.vx *= want / sp;
            b.vy *= want / sp;
          } else if (sp > 1.15) {
            b.vx *= 1.15 / sp;
            b.vy *= 1.15 / sp;
          }
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          let t = ((b.x - ax) * lx + (b.y - ay) * ly) / l2;
          t = Math.max(0, Math.min(1, t));
          const qx = ax + lx * t;
          const qy = ay + ly * t;
          const dx = b.x - qx;
          const dy = b.y - qy;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.04) {
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            const vn = b.vx * nx + b.vy * ny;
            if (vn < 0) {
              b.vx -= 2 * vn * nx;
              b.vy -= 2 * vn * ny;
            }
            b.x = qx + nx * 0.045;
            b.y = qy + ny * 0.045;
            split(b);
          }
          const d = Math.hypot(b.x, b.y) || 1;
          if (d > 0.88) {
            let a = Math.atan2(b.y, b.x) - gap;
            while (a > Math.PI) a -= Math.PI * 2;
            while (a < -Math.PI) a += Math.PI * 2;
            if (Math.abs(a) < 0.34) {
              balls.splice(i, 1);
              continue;
            }
            const nx = b.x / d;
            const ny = b.y / d;
            const v = b.vx * nx + b.vy * ny;
            if (v > 0) {
              b.vx -= 2 * v * nx;
              b.vy -= 2 * v * ny;
            }
            b.x = nx * 0.88;
            b.y = ny * 0.88;
            split(b);
          }
        }
        const n0 = count(0);
        const n1 = count(1);
        if ((n0 >= 30 || n1 >= 30) && n0 !== n1) return { winner: n0 > n1 ? 0 : 1, reason: "Ghera bhar diya" };
        if (clock > 6 && (n0 === 0 || n1 === 0) && n0 !== n1) return { winner: n0 > n1 ? 0 : 1, reason: "Zyada gend bachi" };
        if (clock > 22 && n0 !== n1) return { winner: n0 > n1 ? 0 : 1, reason: "Zyada gend bachi" };
        return null;
      },
      hud() {
        return `${count(0)} – ${count(1)} gend`;
      },
      draw(ctx, w, h) {
        ctx.fillStyle = "#050208";
        ctx.fillRect(0, 0, w, h);
        const col = [env.p1.cloth || "#ff5a7a", env.p2.cloth || "#3ee0ff"];
        text(ctx, `${shortName(env.names[0])}  ${count(0)}`, w * 0.27, h * 0.1, { size: 15, color: col[0], weight: 800 });
        text(ctx, `${count(1)}  ${shortName(env.names[1])}`, w * 0.73, h * 0.1, { size: 15, color: col[1], weight: 800 });
        const cx = w / 2;
        const cy = h * 0.5;
        const R = Math.min(w * 0.4, h * 0.3);
        const gapW = 0.68;
        ctx.strokeStyle = "#ff3ec8";
        ctx.lineWidth = 8;
        ctx.shadowColor = "#ff3ec8";
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(cx, cy, R, gap + gapW / 2, gap - gapW / 2 + Math.PI * 2);
        ctx.stroke();
        const ax = Math.cos(bar) * -0.05 - Math.sin(bar) * 0.16;
        const ay = Math.sin(bar) * -0.05 + Math.cos(bar) * 0.16;
        const bx = Math.cos(bar) * 0.74 - Math.sin(bar) * 0.16;
        const by = Math.sin(bar) * 0.74 + Math.cos(bar) * 0.16;
        ctx.strokeStyle = "#c6ff4a";
        ctx.shadowColor = "#c6ff4a";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(cx + ax * R, cy + ay * R);
        ctx.lineTo(cx + bx * R, cy + by * R);
        ctx.stroke();
        ctx.shadowBlur = 0;
        for (const b of balls) {
          const px = cx + b.x * R;
          const py = cy + b.y * R;
          ctx.fillStyle = `hsl(${b.hue} 90% 62%)`;
          ctx.shadowColor = `hsl(${b.hue} 90% 60%)`;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.beginPath();
          ctx.arc(px - 1.4, py - 1.4, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      },
    };
  },
};

function toothedWheel(ctx, x, y, r, a, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = "#c5ceda";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#e7edf5";
  for (let i = 0; i < 7; i++) {
    ctx.save();
    ctx.rotate((i / 7) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(r * 0.28, -r * 0.1);
    ctx.lineTo(r * 0.92, -r * 0.08);
    ctx.lineTo(r * 0.92, r * 0.08);
    ctx.lineTo(r * 0.28, r * 0.1);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = "#8b93a3";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function miniCat(ctx, x, y, s) {
  ctx.fillStyle = "#f7f9ff";
  ctx.beginPath();
  ctx.arc(x, y, s, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - s * 0.75, y - s * 0.15);
  ctx.lineTo(x - s * 0.4, y - s * 1.2);
  ctx.lineTo(x - s * 0.05, y - s * 0.4);
  ctx.moveTo(x + s * 0.75, y - s * 0.15);
  ctx.lineTo(x + s * 0.4, y - s * 1.2);
  ctx.lineTo(x + s * 0.05, y - s * 0.4);
  ctx.fill();
  ctx.fillStyle = "#1b2030";
  ctx.fillRect(x - s * 0.32, y - s * 0.05, s * 0.16, s * 0.18);
  ctx.fillRect(x + s * 0.14, y - s * 0.05, s * 0.16, s * 0.18);
}

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

function dinoSprite(ctx, x, y, s, team) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = team === 0 ? "#d2ee62" : "#7dce45";
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 1.2, s * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.72, -s * 0.42, s * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-s * 0.7, 0);
  ctx.quadraticCurveTo(-s * 1.55, -s * 0.15, -s * 1.75, -s * 0.55);
  ctx.quadraticCurveTo(-s * 1.15, -s * 0.1, -s * 0.45, s * 0.16);
  ctx.fill();
  ctx.fillStyle = "#1c2808";
  ctx.beginPath();
  ctx.arc(s * 0.84, -s * 0.5, Math.max(1, s * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function faceBall(ctx, x, y, r, f) {
  const skin = SKINS_SAFE(f);
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = skin;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.fillStyle = f.hairColor || "#241c18";
  const hair = f.hair === 0 ? 0.22 : f.hair === 2 ? 0.7 : 0.48;
  ctx.fillRect(x - r, y - r, r * 2, r * hair);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(x, y + r * 0.15, r * 0.7, r * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1614";
  ctx.beginPath();
  ctx.arc(x - r * 0.22, y + r * 0.02, r * 0.07, 0, Math.PI * 2);
  ctx.arc(x + r * 0.22, y + r * 0.02, r * 0.07, 0, Math.PI * 2);
  ctx.fill();
  if (f.beard) {
    ctx.fillStyle = f.hairColor || "#241c18";
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.42, r * 0.38, r * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = f.cloth || "#e7d3a1";
  ctx.lineWidth = Math.max(3, r * 0.12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  if (f.glasses) {
    ctx.strokeStyle = "#efeae2";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(x - r * 0.22, y + r * 0.02, r * 0.16, 0, Math.PI * 2);
    ctx.arc(x + r * 0.22, y + r * 0.02, r * 0.16, 0, Math.PI * 2);
    ctx.moveTo(x - r * 0.06, y + r * 0.02);
    ctx.lineTo(x + r * 0.06, y + r * 0.02);
    ctx.stroke();
  }
}

function sickle(ctx, x, y, ang) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.strokeStyle = "#d5d8e0";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0.2, Math.PI * 1.25);
  ctx.stroke();
  ctx.fillStyle = "#c5cad3";
  ctx.beginPath();
  ctx.moveTo(10, 1);
  ctx.lineTo(18, 7);
  ctx.lineTo(7, 8);
  ctx.fill();
  ctx.restore();
}

function gear(ctx, x, y, r, rot, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = "#d7d7e0";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#1a1a22";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e6e6ee";
  for (let i = 0; i < 8; i++) {
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(r * 0.78, -3, r * 0.32, 6);
  }
  ctx.restore();
}

function buddy(ctx, x, y, r, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.55, -r * 0.15);
  ctx.lineTo(-r * 0.85, -r * 1.05);
  ctx.lineTo(-r * 0.15, -r * 0.45);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.55, -r * 0.15);
  ctx.lineTo(r * 0.85, -r * 1.05);
  ctx.lineTo(r * 0.15, -r * 0.45);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.beginPath();
  ctx.arc(0, r * 0.08, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#241c18";
  ctx.beginPath();
  ctx.ellipse(-r * 0.26, -r * 0.02, r * 0.1, r * 0.14, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.26, -r * 0.02, r * 0.1, r * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(-r * 0.22, -r * 0.08, r * 0.035, 0, Math.PI * 2);
  ctx.arc(r * 0.3, -r * 0.08, r * 0.035, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#241c18";
  ctx.lineWidth = Math.max(1, r * 0.08);
  ctx.beginPath();
  ctx.arc(0, r * 0.18, r * 0.2, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
}

function heartIcon(ctx, x, y, filled, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 4);
  ctx.bezierCurveTo(-7, -2, -3.5, -8, 0, -3.5);
  ctx.bezierCurveTo(3.5, -8, 7, -2, 0, 4);
  ctx.fillStyle = filled ? color : "rgba(255,255,255,0.08)";
  ctx.fill();
  if (!filled) {
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function rageFace(ctx, x, y, r, color, angry) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1630";
  if (angry) {
    ctx.beginPath();
    ctx.ellipse(x - r * 0.22, y - r * 0.02, r * 0.08, r * 0.05, -0.5, 0, Math.PI * 2);
    ctx.ellipse(x + r * 0.22, y - r * 0.02, r * 0.08, r * 0.05, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1630";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.4, y - r * 0.28);
    ctx.lineTo(x - r * 0.08, y - r * 0.14);
    ctx.moveTo(x + r * 0.4, y - r * 0.28);
    ctx.lineTo(x + r * 0.08, y - r * 0.14);
    ctx.moveTo(x - r * 0.18, y + r * 0.22);
    ctx.quadraticCurveTo(x, y + r * 0.05, x + r * 0.18, y + r * 0.22);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x - r * 0.2, y - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.arc(x + r * 0.2, y - r * 0.05, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1a1630";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(x, y + r * 0.08, r * 0.2, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, r + 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
