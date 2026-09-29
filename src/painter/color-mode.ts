export const COLOR_MODE_KEY = "btc-friday.color-mode";

const SCRIPT = `(function () {
  var key = ${JSON.stringify(COLOR_MODE_KEY)};
  var modes = ["system", "light", "dark"];
  var spoken = { system: "Using system colors", light: "Using light colors", dark: "Using dark colors" };
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
  function apply(mode) {
    var root = document.documentElement;
    root.setAttribute("data-color-mode", mode);
    if (mode === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", mode);
    paintMeta(mode);
  }
  apply(stored());
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
