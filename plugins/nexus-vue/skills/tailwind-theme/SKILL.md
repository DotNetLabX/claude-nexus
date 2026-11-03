---
name: tailwind-theme
description: Tailwind CSS v4 theme patterns — design tokens, @theme directive, dark mode, responsive design, component styling. Use when styling a component or view, adding or changing a design token or theme colour, or setting up dark and light mode.
user-invocable: true
---

# Tailwind Theme Patterns

Tailwind CSS v4 with CSS-first configuration. No `tailwind.config.js`.

## Assumes

- **Tailwind CSS v4** with its Vite plugin and CSS-first configuration, in a **Vue 3** app.
- The sample stylesheet path (`client/src/assets/main.css`) is the reference client layout; use the app's own
  main stylesheet where it differs. An app still on Tailwind v3 adapts by keeping its `tailwind.config.js` and
  reading the token pattern only.

## Tailwind v4 Setup

Tailwind v4 is fundamentally different from v3:

```css
/* client/src/assets/main.css */
@import "tailwindcss";

/* `dark:` follows the .dark class on <html>, the same switch the tokens use */
@custom-variant dark (&:where(.dark, .dark *));

/* Design tokens — two-layer pattern */
@theme inline {
  --color-surface-page: var(--surface-page);
  --color-surface-card: var(--surface-card);
  --color-surface-elevated: var(--surface-elevated);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-border-default: var(--border-default);
  --color-accent: var(--accent);
}
```

**Two-layer pattern:**
1. `@theme inline` declares aliases mapping Tailwind utility names to CSS custom properties
2. `:root` and `.dark` blocks define the actual token values

`inline` is required because each alias references another variable. Without it a utility reads the alias,
which resolves where the alias is defined, not on the element being styled — so a value set lower in the
tree is missed. With it, the utility writes `var(--surface-page)` directly
(tailwindcss.com/docs/theme#referencing-other-variables).

```css
:root {
  --surface-page: #ffffff;
  --surface-card: #f8fafc;
  --text-primary: #1e293b;
}

.dark {
  --surface-page: #0a0a0f;
  --surface-card: #12121a;
  --text-primary: #e2e8f0;
}
```

Every token the `@theme inline` block names gets a value in both blocks; the sample shows three.

## Dark Mode

The theme is a `dark` class on `<html>`, set from the user's saved choice, else from the system setting
(tailwindcss.com/docs/dark-mode).

Set it before the first paint with a small script inline in `index.html`'s `<head>`, so the page never
renders in the wrong theme first:

```html
<script>
  const saved = localStorage.getItem('theme')
  const dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', dark)
</script>
```

Change it from the app with a composable:

```typescript
// composables/useTheme.ts
import { ref } from 'vue'

type Theme = 'dark' | 'light' | 'system'

const theme = ref<Theme>((localStorage.getItem('theme') as Theme | null) ?? 'system')
const isDark = ref(document.documentElement.classList.contains('dark'))
const systemDark = matchMedia('(prefers-color-scheme: dark)')

function apply() {
  isDark.value = theme.value === 'dark' || (theme.value === 'system' && systemDark.matches)
  document.documentElement.classList.toggle('dark', isDark.value)
}

systemDark.addEventListener('change', apply)

export function useTheme() {
  function setTheme(next: Theme) {
    theme.value = next
    if (next === 'system') localStorage.removeItem('theme')
    else localStorage.setItem('theme', next)
    apply()
  }
  return { theme, isDark, setTheme }
}
```

`classList.toggle` changes only the `dark` class; assigning `className` would wipe every other class on
`<html>`.

Prefer token classes to `dark:` pairs:
```vue
<!-- Token: the theme lives in one place, the stylesheet -->
<div class="bg-surface-page text-text-primary">

<!-- Valid v4, but every component that writes it repeats the theme -->
<div class="bg-white dark:bg-gray-900">
```

`dark:` is a working v4 variant, and with the `@custom-variant` line above it follows the same `.dark` class.
Tokens stay the recommendation because they keep one theme source: a palette change edits the token
blocks, not every component. Use `dark:` for a one-off a token does not cover.

## Component Styling

Use computed class maps for variants:

```typescript
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
} as const

const variantClasses = {
  primary: 'bg-accent text-white hover:opacity-90',
  secondary: 'bg-surface-card text-text-primary hover:bg-surface-elevated',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const

const buttonClasses = computed(() => [
  'inline-flex items-center justify-center font-medium transition-colors rounded-lg',
  sizeClasses[props.size],
  variantClasses[props.variant],
])
```

**Never build a class name by interpolation** (`` `bg-${color}-600` ``). Tailwind finds classes by reading
the source as plain text, so a class that only exists after the string is joined is never generated. Map
each prop value to a complete class string, as the maps above do
(tailwindcss.com/docs/detecting-classes-in-source-files#dynamic-class-names).

## Responsive Design

Mobile-first. Layer breakpoints:

```vue
<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  <div v-for="item in items" :key="item.id"
       class="rounded-lg bg-surface-card p-4 shadow-sm">
    {{ item.name }}
  </div>
</div>
```

## Form Elements

```vue
<select class="appearance-none bg-transparent text-text-primary border border-border-default
               rounded-lg px-3 py-1.5 text-sm focus:outline-hidden focus:ring-1 focus:ring-accent">
  <option v-for="opt in options" :key="opt.value" :value="opt.value">
    {{ opt.label }}
  </option>
</select>
```

**Note:** `<select>` elements need `appearance-none bg-transparent` to override native browser styling.

## White Flash Prevention

The token values arrive with the stylesheet, so until it loads the page has no background colour. Next to
the theme script in `index.html`'s `<head>`, give each theme its literal page background:

```html
<style>
  html { background-color: #ffffff; }
  html.dark { background-color: #0a0a0f; }
</style>
```

## Animations

Prefer Tailwind utilities:
```vue
<div class="transform hover:scale-105 transition-transform duration-200">
  Hover effect
</div>

<div class="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full">
  <!-- Loading spinner -->
</div>
```

## Chart Libraries and Design Tokens

JS chart libraries (ApexCharts, Chart.js) accept hex color strings, not CSS utility classes. Read CSS custom properties at runtime:

```typescript
const { isDark } = useTheme()

function getToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

const chartOptions = computed(() => {
  void isDark.value // re-read the tokens when the theme changes
  return {
    colors: [getToken('--accent')],
    xaxis: {
      labels: { style: { colors: getToken('--text-muted') } }
    },
    yaxis: {
      labels: { style: { colors: getToken('--text-muted') } },
      title: { style: { color: getToken('--text-muted') } }
    },
    grid: { borderColor: getToken('--border-default') },
    legend: { labels: { colors: getToken('--text-secondary') } },
    tooltip: { theme: isDark.value ? 'dark' : 'light' }
  }
})
```

**Rules:**
- Never hardcode hex values in chart configs — read from CSS custom properties.
- Re-compute chart options on theme change (read `isDark` inside the `computed`, or `watch` it).
- Read the value-layer names — the ones the `:root` and `.dark` blocks define (`--accent`, `--text-muted`).

## v3 Names That Changed in v4

Models trained on v3 code write the v3 names. In v4 (tailwindcss.com/docs/upgrade-guide — the renamed
utilities, the default ring width, variables in arbitrary values, and the important modifier):

| v3 | v4 |
|----|----|
| `shadow-sm` / `shadow` | `shadow-xs` / `shadow-sm` |
| `drop-shadow-sm` / `drop-shadow` | `drop-shadow-xs` / `drop-shadow-sm` |
| `blur-sm` / `blur` | `blur-xs` / `blur-sm` (also `backdrop-blur-*`) |
| `rounded-sm` / `rounded` | `rounded-xs` / `rounded-sm` |
| `outline-none` | `outline-hidden` (`outline-none` now sets `outline-style: none`) |
| `ring` (3px, blue) | `ring-3 ring-blue-500` (`ring` is now 1px, and its default colour is `currentColor`) |
| `bg-[--brand]` | `bg-(--brand)` |
| `!flex` | `flex!` (the important mark goes at the end; the leading form still works but is deprecated) |

## What NOT to Do

- No `tailwind.config.js` — v4 uses CSS-first configuration
- No `@tailwind base/components/utilities` directives — use `@import "tailwindcss"`
- No hardcoded color values in components — use design tokens
- No `dark:` pairs for colours the tokens cover — the tokens are the one theme source
- No class names built by string interpolation — map to complete class strings
- No `@apply` in components — use utility classes directly
