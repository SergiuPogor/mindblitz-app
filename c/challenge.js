// Challenge page: reads ?code=MB-... and shows what the friend has to beat. The code carries everything (see
// app/.../game/challenge/ChallengeCode.kt), so nothing is fetched. GAMES must follow the GameId order in Catalog.kt
// (ChallengeCodesTest checks it).
(() => {
  const GAMES = [
    ["FLASH_GRID", "Flash Grid", "memory"],
    ["ECHO_PADS", "Echo Pads", "memory"],
    ["DEJA_VU", "Déjà Vu", "memory"],
    ["NUMBER_HUNT", "Number Hunt", "speed"],
    ["COLOR_CLASH", "Color Clash", "speed"],
    ["REFLEX", "Reflex", "speed"],
    ["QUICK_MATH", "Quick Math", "math"],
    ["TARGET_SUM", "Target Sum", "math"],
    ["SERIES", "Number Pattern", "logic"],
    ["FRUIT_ALGEBRA", "Fruit Algebra", "logic"],
    ["ARROW_STORM", "Arrow Storm", "focus"],
    ["SHADE_SPOTTER", "Shade Spotter", "focus"],
    ["CARD_PAIRS", "Card Pairs", "memory"],
    ["PATH_RECALL", "Path Recall", "memory"],
    ["DOT_FLASH", "Dot Flash", "focus"],
    ["MIRROR_MIND", "Mirror Mind", "logic"],
    ["BALANCE_SCALES", "Balance Scales", "logic"],
    ["MATCHSTICK_FIX", "Matchstick Fix", "math"],
    ["MAGIC_GRID", "Magic Grid", "logic"],
    ["NUMBER_CHAIN", "Number Chain", "math"],
    ["CUBE_FOLD", "Cube Fold", "logic"],
    ["MAZE_DASH", "Maze Dash", "focus"],
    ["GLOW_SWITCH", "Glow Switch", "logic"],
    ["QUICK_COUNT", "Quick Count", "speed"],
    ["SPOT_CHANGE", "Spot the Change", "focus"],
    ["SWIPE_SORT", "Swipe Sort", "speed"],
    ["ESTIMATE_IT", "Estimate It", "math"],
    ["SYMBOL_CODE", "Symbol Code", "focus"],
  ];
  const SKILLS = { memory: "Memory", speed: "Speed", math: "Math", logic: "Logic", focus: "Focus" };
  const ABC = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const PACKAGE = "app.mindblitz.game";
  // The Play fallback carries a referrer, so Play Console shows installs that came through challenge links.
  const STORE = "https://play.google.com/store/apps/details?id=" + PACKAGE +
    "&referrer=" + encodeURIComponent("utm_source=website&utm_medium=challenge_link&utm_campaign=site");

  function crc8(bytes) {
    let crc = 0;
    for (const b of bytes) {
      crc ^= b & 0xff;
      for (let i = 0; i < 8; i++) crc = crc & 0x80 ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
    }
    return crc;
  }
  const val = (ch) => (ch === "I" || ch === "L" ? 1 : ch === "O" ? 0 : ABC.indexOf(ch));
  const bytes = (h) => [Math.floor(h / 2 ** 24) & 0xff, Math.floor(h / 2 ** 16) & 0xff, Math.floor(h / 2 ** 8) & 0xff, h & 0xff];
  const bits = (h, shift, count) => Math.floor(h / 2 ** shift) % 2 ** count;

  /** Symbol values of the code body with [prefix] removed, or null. */
  function symbols(code, prefix) {
    let s = code.toUpperCase().replace(/[\s.\-_]/g, "");
    if (!s.startsWith(prefix)) return null;
    s = s.slice(prefix.length);
    const v = [...s].map(val);
    return v.some((x) => x < 0) ? null : v;
  }

  /** {kind, ...} for a code, or null when it is not valid. */
  function parse(code) {
    const up = code.toUpperCase();
    if (up.startsWith("MBT-")) {
      const v = symbols(code, "MBT");
      return v && v.length === 12 ? { kind: "thanks" } : null;
    }
    if (up.startsWith("MBF-")) {
      const v = symbols(code, "MBF");
      if (!v || v.length !== 8) return null;
      const base = v.reduce((a, x) => a * 32 + x, 0);
      const header = Math.floor(base / 256);
      return crc8([70, ...bytes(header)]) === base % 256 ? { kind: "invite" } : null;
    }
    const v = symbols(code, "MB");
    if (!v || v.length < 8 || v.length > 16) return null;
    const base = v.slice(0, 8).reduce((a, x) => a * 32 + x, 0);
    const header = Math.floor(base / 256);
    const name = v.slice(8);
    if (crc8([67, name.length, ...name, ...bytes(header)]) !== base % 256 || name.some((x) => x > 25)) return null;
    const who = name.length ? String.fromCharCode(...name.map((x) => 65 + x)) : "";
    const display = who ? who[0] + who.slice(1).toLowerCase() : "";
    if (bits(header, 30, 2) !== 1) return { kind: "newer" };
    if (bits(header, 29, 1) === 0) {
      const game = GAMES[bits(header, 23, 6)];
      if (!game) return { kind: "newer" };
      return { kind: "game", name: display, game: game[1], skill: game[2], score: bits(header, 0, 14) };
    }
    return { kind: "blitz", name: display, day: bits(header, 17, 12), score: bits(header, 7, 10) };
  }

  const $ = (id) => document.getElementById(id);
  const show = (id, on = true) => { const el = $(id); if (el) el.hidden = !on; };

  document.addEventListener("DOMContentLoaded", () => {
    const raw = (new URLSearchParams(location.search).get("code") || "").trim();
    const code = raw.toUpperCase();
    const c = raw ? parse(code) : null;
    const android = /Android/i.test(navigator.userAgent);

    if (!c) {
      show("ch-card", false);
      show(raw ? "ch-bad" : "ch-empty");
      return;
    }
    const who = c.name || "A friend";
    $("ch-code").textContent = code;
    if (c.kind === "game") {
      $("ch-title").textContent = `${who} challenges you`;
      $("ch-score").textContent = c.score;
      $("ch-what").textContent = `to beat on ${c.game}`;
      $("ch-skill").textContent = SKILLS[c.skill];
      show("sk-" + c.skill);
      $("ch-line").textContent = `Same puzzles, same 45 seconds. Can you beat ${c.score}?`;
      document.title = `Can you beat ${c.score} on ${c.game}? | MindBlitz`;
    } else if (c.kind === "blitz") {
      $("ch-title").textContent = `${who} challenges you`;
      $("ch-score").textContent = c.score;
      $("ch-what").textContent = `out of 1000 in Daily Blitz #${c.day}`;
      $("ch-skill").textContent = "Daily Blitz";
      show("sk-blitz");
      $("ch-line").textContent = "Five games, the same puzzles. Blitz challenges last 7 days.";
      document.title = `Can you beat ${c.score} in Daily Blitz #${c.day}? | MindBlitz`;
    } else if (c.kind === "invite") {
      $("ch-title").textContent = "You're invited to MindBlitz";
      show("ch-hero", false);
      $("ch-skill").textContent = "Invite";
      show("sk-invite");
      $("ch-line").textContent = "Enter this code in your first 7 days and you both get 200 coins.";
    } else if (c.kind === "thanks") {
      $("ch-title").textContent = "Your friend joined MindBlitz";
      show("ch-hero", false);
      $("ch-skill").textContent = "Thank you";
      show("sk-invite");
      $("ch-line").textContent = "Open this code in MindBlitz to collect your 200 coins.";
    } else {
      $("ch-title").textContent = "A MindBlitz challenge";
      show("ch-hero", false);
      $("ch-skill").textContent = "Challenge";
      show("sk-blitz");
      $("ch-line").textContent = "This code needs the latest version of MindBlitz.";
    }

    const open = $("ch-open");
    const deep = "mindblitz://challenge?code=" + encodeURIComponent(code);
    open.href = android
      ? `intent://challenge?code=${encodeURIComponent(code)}#Intent;scheme=mindblitz;package=${PACKAGE};S.browser_fallback_url=${encodeURIComponent(STORE)};end`
      : deep;
    if (!android) show("ch-phone");

    const copy = $("ch-copy");
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code);
        copy.textContent = "Copied";
      } catch (e) {
        const r = document.createRange();
        r.selectNodeContents($("ch-code"));
        const sel = getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
      }
    });
  });
})();
