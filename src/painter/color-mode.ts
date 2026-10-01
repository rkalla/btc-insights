export const COLOR_MODE_KEY = "btc-friday.color-mode";

const SCRIPT = `(function () {
  var key = ${JSON.stringify(COLOR_MODE_KEY)};
  var modes = ["system", "light", "dark"];
  var spoken = { system: "Using system colors", light: "Using light colors", dark: "Using dark colors" };
  var labels = { system: "Color mode: System", light: "Color mode: Light", dark: "Color mode: Dark" };
  var query = typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function stored() {
    try {
      var value = localStorage.getItem(key);
      return modes.indexOf(value) === -1 ? "system" : value;
    } catch (error) {
      return "system";
    }
  }
  function paintMeta(mode) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    var dark = mode === "dark" || (mode === "system" && query !== null && query.matches);
    meta.setAttribute("content", dark ? "#1C1B18" : "#F7F6F2");
  }
  function paintButton(mode) {
    var button = document.querySelector(".theme");
    if (!button || !button.setAttribute) return;
    button.setAttribute("aria-label", labels[mode] || labels.system);
    if (!button.querySelectorAll) return;
    var icons = button.querySelectorAll(".theme-icon");
    for (var i = 0; i < icons.length; i++) {
      var icon = icons[i];
      var show = icon.classList && icon.classList.contains("theme-icon--" + mode);
      if (show) icon.removeAttribute("hidden");
      else icon.setAttribute("hidden", "");
    }
  }
  function apply(mode) {
    var root = document.documentElement;
    root.setAttribute("data-color-mode", mode);
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    paintMeta(mode);
    paintButton(mode);
  }
  apply(stored());
  function syncButton() {
    paintButton(document.documentElement.getAttribute("data-color-mode") || "system");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", syncButton);
  else syncButton();
  if (query !== null && query.addEventListener) {
    query.addEventListener("change", function () {
      if ((document.documentElement.getAttribute("data-color-mode") || "system") === "system") apply("system");
    });
  }
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (target && target.nodeType === 3) target = target.parentElement;
    if (!target || !target.closest) return;
    var button = target.closest(".theme");
    if (!button) return;
    var current = document.documentElement.getAttribute("data-color-mode") || "system";
    var index = modes.indexOf(current);
    var next = modes[(index + 1) % modes.length];
    try {
      localStorage.setItem(key, next);
    } catch (error) {}
    apply(next);
    var live = document.querySelector("[data-color-mode-live]");
    if (live) live.textContent = spoken[next];
  });
})();`;

export function colorModeBoot(): string {
  return `<meta name="theme-color" content="#F7F6F2">
<script>${SCRIPT}</script>`;
}

export function colorModeSource(): string {
  return SCRIPT;
}
