export function createAudio() {
  let ctx = null;
  let master = null;
  let music = null;
  let sfx = null;
  let musicOn = true;
  let sfxOn = true;
  let drone = [];
  let timer = 0;
  let next = 0;
  let lastTap = 0;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC({ latencyHint: "interactive" });
      master = ctx.createGain();
      music = ctx.createGain();
      sfx = ctx.createGain();
      music.gain.value = 0.32;
      sfx.gain.value = 0.7;
      master.gain.value = 0.9;
      music.connect(master);
      sfx.connect(master);
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function envGain(bus, when, peak, dur) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), when + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    g.connect(bus);
    return g;
  }

  function tone(bus, when, freq, dur, type, peak) {
    if (!ctx) return;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    const g = envGain(bus, when, peak, dur);
    o.connect(g);
    o.start(when);
    o.stop(when + dur + 0.02);
  }

  function noise(bus, when, dur, peak, hp = 800) {
    if (!ctx) return;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = hp;
    const g = envGain(bus, when, peak, dur);
    src.connect(filter);
    filter.connect(g);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  function kick(when) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(150, when);
    o.frequency.exponentialRampToValueAtTime(46, when + 0.12);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.45, when + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.16);
    o.connect(g);
    g.connect(music);
    o.start(when);
    o.stop(when + 0.18);
  }

  function hat(when) {
    noise(music, when, 0.05, 0.08, 4000);
  }

  function startDrone() {
    stopDrone();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.value = 0.045;
    filter.connect(g);
    g.connect(music);
    [146.83, 220].forEach((freq) => {
      const o = ctx.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = freq;
      o.connect(filter);
      o.start();
      drone.push(o);
    });
  }

  function stopDrone() {
    drone.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* already stopped */
      }
    });
    drone = [];
  }

  function pump() {
    if (!ctx || !musicOn) return;
    const horizon = ctx.currentTime + 0.28;
    while (next < horizon) {
      kick(next);
      hat(next + 0.25);
      next += 0.5;
    }
  }

  function loopMusic() {
    window.clearInterval(timer);
    timer = 0;
    if (!musicOn || !ctx) return;
    if (!drone.length) startDrone();
    if (next < ctx.currentTime) next = ctx.currentTime + 0.05;
    pump();
    timer = window.setInterval(pump, 90);
  }

  function sfxOk() {
    return ctx && sfxOn;
  }

  const api = {
    unlock() {
      ensure();
      if (musicOn) loopMusic();
    },
    setMusic(on) {
      musicOn = on;
      if (!ctx) return;
      if (on) loopMusic();
      else {
        window.clearInterval(timer);
        timer = 0;
        stopDrone();
      }
    },
    setSfx(on) {
      sfxOn = on;
    },
    musicOn: () => musicOn,
    sfxOn: () => sfxOn,
    beep() {
      if (!sfxOk()) return;
      tone(sfx, ctx.currentTime, 660, 0.12, "sine", 0.2);
    },
    whistle() {
      if (!sfxOk()) return;
      const t0 = ctx.currentTime;
      tone(sfx, t0, 880, 0.18, "square", 0.08);
      tone(sfx, t0 + 0.16, 1320, 0.22, "square", 0.07);
    },
    tap() {
      if (!sfxOk()) return;
      const now = ctx.currentTime;
      if (now - lastTap < 0.045) return;
      lastTap = now;
      noise(sfx, now, 0.04, 0.05, 1200);
    },
    hit() {
      if (!sfxOk()) return;
      const t0 = ctx.currentTime;
      tone(sfx, t0, 110, 0.16, "sine", 0.35);
      noise(sfx, t0, 0.08, 0.12, 200);
    },
    miss() {
      if (!sfxOk()) return;
      tone(sfx, ctx.currentTime, 180, 0.1, "triangle", 0.12);
    },
    cheer() {
      if (!sfxOk()) return;
      const t0 = ctx.currentTime;
      noise(sfx, t0, 0.45, 0.12, 500);
      [523, 659, 784].forEach((f, i) => tone(sfx, t0 + i * 0.04, f, 0.28, "triangle", 0.1));
    },
    mix(stream) {
      if (!ensure()) return () => {};
      const dest = ctx.createMediaStreamDestination();
      master.connect(dest);
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      return () => {
        try {
          master.disconnect(dest);
        } catch {
          /* ignore */
        }
      };
    },
    stop() {
      window.clearInterval(timer);
      timer = 0;
      stopDrone();
    },
  };

  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.visibilityState === "visible" && ctx.state === "suspended") ctx.resume();
  });

  return api;
}

export function createRecorder(canvas, audio) {
  let rec = null;
  let chunks = [];
  let unmix = () => {};
  let mime = "";

  function pickMime() {
    if (typeof MediaRecorder === "undefined") return "";
    const types = ["video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus", "video/webm", "video/mp4"];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  }

  return {
    get on() {
      return !!(rec && rec.state === "recording");
    },
    supported() {
      return typeof MediaRecorder !== "undefined" && !!canvas.captureStream;
    },
    async toggle(name) {
      if (rec && rec.state === "recording") {
        rec.stop();
        return "saved";
      }
      audio.unlock();
      mime = pickMime();
      let stream;
      try {
        stream = canvas.captureStream(30);
      } catch {
        stream = null;
      }
      if (!stream && navigator.mediaDevices?.getDisplayMedia) {
        try {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        } catch {
          return "denied";
        }
      }
      if (!stream) return "unsupported";
      try {
        unmix = audio.mix(stream) || (() => {});
      } catch {
        unmix = () => {};
      }
      try {
        rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      } catch {
        return "unsupported";
      }
      chunks = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
      };
      rec.onstop = () => {
        unmix();
        unmix = () => {};
        const type = mime || chunks[0]?.type || "video/webm";
        const blob = new Blob(chunks, { type });
        const ext = type.includes("mp4") ? "mp4" : "webm";
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `janata-akhada-${name || "match"}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        stream.getTracks().forEach((t) => {
          if (t.kind === "video" && t.readyState === "live" && !canvas.captureStream) t.stop();
        });
      };
      rec.start(250);
      return "started";
    },
    stop() {
      if (rec && rec.state === "recording") rec.stop();
    },
  };
}
