// Light and dark theme. Follows the device setting until the visitor picks one with the button; that choice is kept
// in this browser's localStorage only. Loaded in <head> so the page never flashes the wrong theme.
(() => {
  const root = document.documentElement;
  const dark = window.matchMedia("(prefers-color-scheme: dark)");
  let saved = null;
  try { saved = localStorage.getItem("theme"); } catch (e) { /* Storage can be blocked. */ }
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  const current = () => root.dataset.theme || (dark.matches ? "dark" : "light");

  function label(btn) {
    const next = current() === "dark" ? "light" : "dark";
    btn.setAttribute("aria-label", `Switch to ${next} theme`);
    btn.title = `Switch to ${next} theme`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("theme");
    if (!btn) return;
    label(btn);
    btn.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (e) { /* ignore */ }
      label(btn);
    });
    dark.addEventListener("change", () => label(btn));
  });
})();
