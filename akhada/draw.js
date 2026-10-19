export const SKINS = ["#f3d0b0", "#e0b089", "#c48852", "#8d5524", "#5c3317"];

export const fx = {
  shake: 0,
  parts: [],
  punch(n = 1) {
    this.shake = Math.min(1.6, this.shake + n);
  },
  burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 30 + Math.random() * 140;
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 30,
        life: 0.35 + Math.random() * 0.25,
        max: 0.6,
        r: 1.5 + Math.random() * 2.2,
        color,
      });
    }
    if (this.parts.length > 90) this.parts.splice(0, this.parts.length - 90);
  },
  tick(dt) {
    this.shake = Math.max(0, this.shake - dt * 2.4);
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 520 * dt;
      p.life -= dt;
      if (p.life <= 0) this.parts.splice(i, 1);
    }
  },
  draw(ctx) {
    for (const p of this.parts) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  },
};

export function shortName(s) {
  const t = String(s || "").trim() || "Khiladi";
  return t.length > 16 ? `${t.slice(0, 15)}…` : t;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function eye(ctx, x, y, r) {
  ctx.fillStyle = "#1a1614";
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4f1ea";
  ctx.beginPath();
  ctx.arc(x + r * 0.25, y - r * 0.25, r * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function limb(ctx, x1, y1, ang, len, w, color) {
  const x2 = x1 + Math.sin(ang) * len;
  const y2 = y1 + Math.cos(ang) * len;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x2, y2, w * 0.48, 0, Math.PI * 2);
  ctx.fill();
  return { x: x2, y: y2 };
}

export function drawFighter(ctx, x, y, h, f, pose = {}) {
  const skin = SKINS[Math.max(0, Math.min(SKINS.length - 1, f.skin | 0))];
  const k = [0.86, 1, 1.18][f.body] ?? 1;
  const lean = pose.lean || 0;
  const legH = h * 0.36;
  const torsoH = h * 0.3;
  const headRy = h * 0.125 * (f.face === 1 ? 1.08 : 1);
  const headRx = headRy * (f.face === 2 ? 1.05 : f.face === 0 ? 0.98 : 0.84);
  const shoulder = -legH - torsoH;
  const headCy = shoulder - headRy * 0.92;
  const sw = h * 0.15 * k;
  const legW = h * 0.055 * k;

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(0, 3, h * 0.16 * k, h * 0.035, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(lean);

  const stride = pose.stride || 0;
  const squat = pose.squat || 0;
  ctx.fillStyle = f.gender === "f" ? f.cloth : "#2a2622";
  const lh = legH * (1 - squat * 0.08);
  roundRect(ctx, -h * 0.08 * k - legW / 2 + stride * h * 0.06, -lh, legW, lh, 5);
  ctx.fill();
  roundRect(ctx, h * 0.08 * k - legW / 2 - stride * h * 0.06, -lh, legW, lh, 5);
  ctx.fill();
  ctx.fillStyle = "#1a1614";
  roundRect(ctx, -h * 0.1 * k + stride * h * 0.06, -h * 0.03, h * 0.09, h * 0.035, 3);
  ctx.fill();
  roundRect(ctx, h * 0.02 * k - stride * h * 0.06, -h * 0.03, h * 0.09, h * 0.035, 3);
  ctx.fill();

  const tw = h * 0.28 * k;
  ctx.fillStyle = f.cloth || "#f4f1ea";
  roundRect(ctx, -tw / 2, shoulder, tw, torsoH + h * 0.02, h * 0.04);
  ctx.fill();
  ctx.strokeStyle = "rgba(20,18,16,0.25)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = shade(f.cloth || "#f4f1ea", -28);
  ctx.beginPath();
  ctx.moveTo(0, shoulder + 4);
  ctx.lineTo(-tw * 0.12, shoulder + torsoH * 0.28);
  ctx.lineTo(tw * 0.12, shoulder + torsoH * 0.28);
  ctx.stroke();
  if (f.saree) {
    ctx.fillStyle = f.saree;
    ctx.fillRect(-tw / 2, shoulder + torsoH * 0.55, tw, Math.max(3, h * 0.018));
  }

  const armW = h * 0.04 * k;
  const armL = h * 0.26;
  limb(ctx, -sw, shoulder + h * 0.04, pose.armL ?? 0.25, armL, armW, skin);
  limb(ctx, sw, shoulder + h * 0.04, pose.armR ?? -0.25, armL, armW, skin);

  if (f.muffler) {
    ctx.strokeStyle = f.muffler;
    ctx.lineWidth = Math.max(3, h * 0.035);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-sw * 0.4, shoulder + h * 0.02);
    ctx.quadraticCurveTo(sw * 0.2, shoulder + h * 0.12, -sw * 0.1, shoulder + h * 0.2);
    ctx.stroke();
  }

  ctx.fillStyle = skin;
  ctx.beginPath();
  if (f.face === 2) {
    roundRect(ctx, -headRx, headCy - headRy, headRx * 2, headRy * 2, headRx * 0.35);
    ctx.fill();
  } else {
    ctx.ellipse(0, headCy, headRx, headRy, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = f.hairColor || "#221c18";
  if (f.hair === 1) {
    ctx.beginPath();
    ctx.ellipse(0, headCy - headRy * 0.22, headRx * 1.02, headRy * 0.62, 0, Math.PI, 0);
    ctx.fill();
  } else if (f.hair === 2) {
    ctx.beginPath();
    ctx.ellipse(0, headCy - headRy * 0.18, headRx * 1.05, headRy * 0.7, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-headRx * 1.08, headCy + headRy * 0.15, headRx * 0.4, headRy * 1.35);
    ctx.fillRect(headRx * 0.68, headCy + headRy * 0.15, headRx * 0.4, headRy * 1.35);
  } else if (f.hair === 3) {
    ctx.beginPath();
    ctx.ellipse(-headRx * 0.62, headCy + 1, headRx * 0.42, headRy * 0.72, 0, 0, Math.PI * 2);
    ctx.ellipse(headRx * 0.62, headCy + 1, headRx * 0.42, headRy * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (f.cap) {
    ctx.fillStyle = f.cap;
    roundRect(ctx, -headRx * 1.05, headCy - headRy * 1.05, headRx * 2.1, headRy * 0.48, 4);
    ctx.fill();
    ctx.fillRect(-headRx * 1.2, headCy - headRy * 0.62, headRx * 2.4, Math.max(3, h * 0.016));
  }

  const eyeY = headCy + headRy * 0.02;
  const eyeDx = headRx * 0.38;
  const er = Math.max(1.4, headRx * 0.13);
  if (pose.expr === "hurt") {
    ctx.strokeStyle = "#1a1614";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-eyeDx - er, eyeY);
    ctx.lineTo(-eyeDx + er, eyeY);
    ctx.moveTo(eyeDx - er, eyeY);
    ctx.lineTo(eyeDx + er, eyeY);
    ctx.stroke();
  } else {
    eye(ctx, -eyeDx, eyeY, er);
    eye(ctx, eyeDx, eyeY, er);
  }

  ctx.strokeStyle = f.hair === 0 ? "#6a5344" : f.hairColor || "#221c18";
  ctx.lineWidth = Math.max(1.4, h * 0.012);
  ctx.lineCap = "round";
  const browLift = pose.expr === "hurt" ? 3 : pose.expr === "focus" ? -1 : 0;
  ctx.beginPath();
  ctx.moveTo(-eyeDx - er, eyeY - er * 1.7 + browLift);
  ctx.lineTo(-eyeDx + er, eyeY - er * 1.45);
  ctx.moveTo(eyeDx - er, eyeY - er * 1.45);
  ctx.lineTo(eyeDx + er, eyeY - er * 1.7 + browLift);
  ctx.stroke();

  if (f.glasses) {
    ctx.strokeStyle = "#161412";
    ctx.lineWidth = Math.max(1.3, h * 0.011);
    const gw = headRx * 0.52;
    const gh = headRy * 0.36;
    roundRect(ctx, -eyeDx - gw / 2, eyeY - gh / 2, gw, gh, 3);
    ctx.stroke();
    roundRect(ctx, eyeDx - gw / 2, eyeY - gh / 2, gw, gh, 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-eyeDx + gw / 2, eyeY);
    ctx.lineTo(eyeDx - gw / 2, eyeY);
    ctx.stroke();
  }

  if (f.beard >= 1) {
    ctx.fillStyle = f.beardColor || f.hairColor || "#2a2420";
    ctx.beginPath();
    ctx.ellipse(
      0,
      headCy + headRy * 0.62,
      headRx * (f.beard === 2 ? 0.78 : 0.42),
      headRy * (f.beard === 2 ? 0.48 : 0.22),
      0,
      0,
      Math.PI,
    );
    ctx.fill();
  }

  ctx.strokeStyle = "#7a4038";
  ctx.lineWidth = Math.max(1.2, h * 0.01);
  const my = headCy + headRy * 0.38;
  ctx.beginPath();
  if (pose.expr === "win") ctx.arc(0, my - 1, headRx * 0.22, 0.2, Math.PI - 0.2);
  else if (pose.expr === "hurt") ctx.arc(0, my + headRy * 0.18, headRx * 0.16, Math.PI + 0.25, -0.25);
  else {
    ctx.moveTo(-headRx * 0.16, my);
    ctx.lineTo(headRx * 0.16, my);
  }
  ctx.stroke();

  ctx.restore();
}

function shade(hex, amt) {
  const n = hex.replace("#", "");
  if (n.length !== 6) return hex;
  const r = Math.max(0, Math.min(255, parseInt(n.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(n.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(n.slice(4, 6), 16) + amt));
  return `rgb(${r},${g},${b})`;
}

export function drawBackdrop(ctx, w, h, kind, t) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#1a1612");
  g.addColorStop(0.5, "#2a231c");
  g.addColorStop(1, "#3c3228");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "rgba(232, 206, 160, 0.09)";
  ctx.beginPath();
  ctx.ellipse(w * 0.18, h * 0.12, Math.min(90, w * 0.16), 36, 0, 0, Math.PI * 2);
  ctx.ellipse(w * 0.82, h * 0.12, Math.min(90, w * 0.16), 36, 0, 0, Math.PI * 2);
  ctx.fill();

  const base = h * 0.56;
  const count = Math.max(10, Math.floor(w / 36));
  for (let i = 0; i < count; i++) {
    const x = ((i + 0.5) * w) / count;
    const bob = Math.sin(t * 1.8 + i * 0.7) * 1.5;
    ctx.fillStyle = i % 2 === 0 ? "#3a342c" : "#4a4034";
    ctx.beginPath();
    ctx.ellipse(x, base + bob, 8, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SKINS[i % SKINS.length];
    ctx.beginPath();
    ctx.arc(x, base - 14 + bob, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = kind === "pitch" ? "#3f5c45" : kind === "track" ? "#7a463c" : "#5c4b39";
  ctx.fillRect(0, h * 0.62, w, h * 0.4);
  ctx.fillStyle = "rgba(244,241,234,0.18)";
  ctx.fillRect(0, h * 0.62, w, 3);

  ctx.save();
  if (kind === "akhada") {
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.76, Math.min(w * 0.32, 220), Math.min(h * 0.13, 78), 0, 0, Math.PI * 2);
    ctx.fillStyle = "#c6a36e";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#8a6239";
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.76, Math.min(w * 0.16, 110), Math.min(h * 0.065, 40), 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(90,60,30,0.35)";
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (kind === "track") {
    ctx.strokeStyle = "rgba(244,241,234,0.4)";
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(12, h * 0.74);
    ctx.lineTo(w - 12, h * 0.74);
    ctx.moveTo(12, h * 0.86);
    ctx.lineTo(w - 12, h * 0.86);
    ctx.stroke();
    ctx.setLineDash([]);
    const fx0 = w * 0.88;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#1a1614" : "#f4f1ea";
      ctx.fillRect(fx0, h * 0.64 + i * ((h * 0.28) / 8), 16, (h * 0.28) / 8);
    }
  } else if (kind === "ring") {
    const x = w * 0.12;
    const rw = w * 0.76;
    const y = h * 0.66;
    ctx.fillStyle = "#243044";
    ctx.fillRect(x, y, rw, h * 0.2);
    ctx.strokeStyle = "#f4f1ea";
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x, y + 10 + i * 12);
      ctx.lineTo(x + rw, y + 10 + i * 12);
      ctx.stroke();
    }
    ctx.fillStyle = "#c9b79a";
    ctx.fillRect(x - 4, y - 8, 8, h * 0.26);
    ctx.fillRect(x + rw - 4, y - 8, 8, h * 0.26);
  } else if (kind === "pitch") {
    ctx.fillStyle = "#d8c7a2";
    ctx.fillRect(w * 0.08, h * 0.66, w * 0.34, h * 0.2);
    ctx.fillRect(w * 0.58, h * 0.66, w * 0.34, h * 0.2);
    ctx.fillStyle = "#f4f1ea";
    stump(ctx, w * 0.22, h * 0.7);
    stump(ctx, w * 0.72, h * 0.7);
  } else if (kind === "goal") {
    ctx.strokeStyle = "#f4f1ea";
    ctx.lineWidth = 3;
    const gx = w * 0.28;
    const gy = h * 0.2;
    const gw = w * 0.44;
    const gh = h * 0.42;
    ctx.strokeRect(gx, gy, gw, gh);
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      ctx.moveTo(gx, gy + (gh * i) / 5);
      ctx.lineTo(gx + gw, gy + (gh * i) / 5);
    }
    for (let i = 1; i < 6; i++) {
      ctx.moveTo(gx + (gw * i) / 6, gy);
      ctx.lineTo(gx + (gw * i) / 6, gy + gh);
    }
    ctx.stroke();
  } else if (kind === "range") {
    ctx.fillStyle = "#6d8f62";
    ctx.fillRect(0, h * 0.62, w, h * 0.4);
    target(ctx, w * 0.25, h * 0.4, Math.min(70, w * 0.16));
    target(ctx, w * 0.75, h * 0.4, Math.min(70, w * 0.16));
  } else if (kind === "yard") {
    ctx.fillStyle = "#6b6a66";
    roundRect(ctx, w * 0.18, h * 0.7, w * 0.22, h * 0.08, 6);
    ctx.fill();
    roundRect(ctx, w * 0.6, h * 0.7, w * 0.22, h * 0.08, 6);
    ctx.fill();
  } else if (kind === "table") {
    ctx.fillStyle = "#6a432c";
    ctx.beginPath();
    ctx.moveTo(w * 0.18, h * 0.62);
    ctx.lineTo(w * 0.82, h * 0.62);
    ctx.lineTo(w * 0.74, h * 0.86);
    ctx.lineTo(w * 0.26, h * 0.86);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(244,241,234,0.25)";
    ctx.stroke();
  }
  ctx.restore();
}

function stump(ctx, x, y) {
  ctx.fillStyle = "#f4f1ea";
  for (let i = -1; i <= 1; i++) ctx.fillRect(x + i * 7 - 1.5, y, 3, 28);
  ctx.fillRect(x - 10, y, 20, 3);
}

function target(ctx, x, y, r) {
  const rings = ["#f4f1ea", "#c4654a", "#f4f1ea", "#c4654a", "#e7d7a8"];
  rings.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, r * (1 - i * 0.18), 0, Math.PI * 2);
    ctx.fill();
  });
}

export function text(ctx, str, x, y, opt = {}) {
  ctx.font = `${opt.weight || 600} ${opt.size || 15}px "Noto Sans Devanagari", FreeSans, sans-serif`;
  ctx.textAlign = opt.align || "center";
  ctx.textBaseline = opt.base || "alphabetic";
  ctx.fillStyle = opt.color || "#f4f1ea";
  ctx.fillText(str, x, y);
}

export function bar(ctx, x, y, w, h, t, a, b) {
  ctx.fillStyle = "rgba(20,18,16,0.45)";
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (b > a) {
    ctx.fillStyle = "rgba(232, 206, 160, 0.85)";
    roundRect(ctx, x + a * w, y, Math.max(4, (b - a) * w), h, h / 2);
    ctx.fill();
  }
  const nx = x + Math.max(0, Math.min(1, t)) * w;
  ctx.fillStyle = "#f4f1ea";
  ctx.beginPath();
  ctx.arc(nx, y + h / 2, h * 0.72, 0, Math.PI * 2);
  ctx.fill();
}
