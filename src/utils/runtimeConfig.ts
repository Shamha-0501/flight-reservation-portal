// src/utils/runtimeConfig.ts
function hexToRgbTriplet(hex: string) {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `${r} ${g} ${b}`;
}

export type ThemeTokens = Record<string, string>;

function toRgbTriplet(v: string) {
  if (/^\d+\s+\d+\s+\d+$/.test(v.trim())) return v.trim();
  if (v.startsWith("#")) return hexToRgbTriplet(v);
  return v;
}

function tokensToCssVars(tokens?: ThemeTokens) {
  if (!tokens) return "";

  const pairs: Array<[string, string | undefined]> = [
    ["bg", tokens.bg],
    ["fg", tokens.fg],
    ["primary", tokens.primary],
    ["secondary", tokens.secondary],
    ["border", tokens.border],
    ["muted", tokens.muted],
    ["menu", tokens.menu],
    ["icon", tokens.icon],
    ["radius", tokens.radius],
  ];

  return pairs
    .filter(([, v]) => !!v)
    .map(([k, v]) => {
      if (!v) return "";
      const value = k === "radius" ? v : toRgbTriplet(v);
      return `  --${k}: ${value};`;
    })
    .filter(Boolean)
    .join("\n");
}

type ThemeInput = ThemeTokens | { light?: ThemeTokens; dark?: ThemeTokens };

function isModeObject(x: ThemeInput): x is { light?: ThemeTokens; dark?: ThemeTokens } {
  return typeof x === "object" && x !== null && ("light" in x || "dark" in x);
}

/**
 * Writes CSS variables in a scoped way so switching works:
 * - light vars -> :root
 * - dark vars  -> html[data-theme="dark"]
 *
 * Accepts either:
 *  - applyTenantTheme(tokens)  // old (single mode)
 *  - applyTenantTheme({ light, dark }) // new
 */
export function applyTenantTheme(input: ThemeInput) {
  const id = "tenant-runtime-theme";
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = id;
    document.head.appendChild(style);
  }

  let light: ThemeTokens | undefined;
  let dark: ThemeTokens | undefined;

  if (isModeObject(input)) {
    light = input.light;
    dark = input.dark;
  } else {
    // Backward compatible: treat provided tokens as light
    light = input;
    dark = undefined;
  }

  const lightCss = tokensToCssVars(light);
  const darkCss = tokensToCssVars(dark);

  // If nothing to apply, don't wipe out existing theme styles
  if (!lightCss && !darkCss) return;

//   style.textContent = `
// :root {
// ${lightCss}
// }
// ${darkCss ? `
// html[data-theme="dark"] {
// ${darkCss}
// }
// `.trim() : ""}
// `.trim();
}
