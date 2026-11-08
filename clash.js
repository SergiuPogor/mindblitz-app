// A 20-second round of Color Clash, like the game in the app, playable on the landing page.
(() => {
  const COLORS = [["RED", "#ef4444"], ["GREEN", "#22c55e"], ["BLUE", "#38bdf8"], ["YELLOW", "#ffb020"], ["PURPLE", "#8b5cff"], ["PINK", "#ff4f8b"]];
  const SECONDS = 20;
  const $ = (id) => document.getElementById(id);
  const word = $("clash-word"), score = $("clash-score"), bar = $("clash-bar"), cover = $("clash-cover");
  const yes = $("clash-yes"), no = $("clash-no"), go = $("clash-go"), screen = $("clash");
  let points = 0, streak = 0, match = true, end = 0, timer = 0, best = 0;
  try { best = +localStorage.getItem("clash-best") || 0; } catch (e) { /* Storage can be blocked. */ }

  function next() {
    const w = COLORS[Math.floor(Math.random() * COLORS.length)];
    match = Math.random() < 0.5;
    let ink = w;
    while (!match && ink === w) ink = COLORS[Math.floor(Math.random() * COLORS.length)];
    word.textContent = w[0];
    word.style.color = ink[1];
    word.classList.remove("pop");
    void word.offsetWidth;
    word.classList.add("pop");
  }

  function answer(said) {
    if (!end) return;
    const right = said === match;
    streak = right ? streak + 1 : 0;
    points = Math.max(0, points + (right ? 10 + Math.min(streak, 10) : -5));
    score.textContent = points;
    screen.classList.remove("good", "bad");
    void screen.offsetWidth;
    screen.classList.add(right ? "good" : "bad");
    next();
  }

  function tick() {
    const left = end - performance.now();
    bar.style.transform = `scaleX(${Math.max(0, left / (SECONDS * 1000))})`;
    if (left <= 0) return finish();
    timer = requestAnimationFrame(tick);
  }

  function start() {
    points = 0; streak = 0; score.textContent = "0";
    cover.hidden = true; yes.disabled = no.disabled = false;
    next();
    end = performance.now() + SECONDS * 1000;
    timer = requestAnimationFrame(tick);
    yes.focus();
  }

  function finish() {
    cancelAnimationFrame(timer); end = 0;
    yes.disabled = no.disabled = true;
    const record = points > best;
    if (record) { best = points; try { localStorage.setItem("clash-best", best); } catch (e) { /* ignore */ } }
    cover.querySelector(".clash-title").textContent = record ? `New best: ${points}!` : `You scored ${points}`;
    cover.querySelector(".clash-sub").textContent = `Your best here: ${best}. The app has 27 more games, and a new Daily Blitz every day.`;
    go.textContent = "Play again";
    cover.hidden = false;
    go.focus();
  }

  go.addEventListener("click", start);
  yes.addEventListener("click", () => answer(true));
  no.addEventListener("click", () => answer(false));
  document.addEventListener("keydown", (e) => {
    if (!end || e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === "y" || k === "arrowright") { e.preventDefault(); answer(true); }
    if (k === "n" || k === "arrowleft") { e.preventDefault(); answer(false); }
  });
})();
