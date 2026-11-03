# Recommended Packages

The recommended ecosystem. All are tree-shakeable and actively maintained. Versions: install the current
major and check npm for it — majors below are named only where a fact depends on one.

## Core Stack

| Package | Purpose |
|---------|---------|
| `vue` 3.5+ | SPA framework |
| `pinia` | State management |
| `vue-router` | Client-side routing |
| a chart library (`vue3-apexcharts`, `vue-echarts`) | Charts and sparklines |
| `tailwindcss` 4 | Utility-first CSS |
| `vite` | Build tool |
| `typescript` | Type safety |

## Recommended Additions

| Package | Purpose | Install |
|---------|---------|---------|
| `@vueuse/core` | 200+ composables (storage, media, fetch, sensors) | `npm i @vueuse/core` |
| `@tanstack/vue-query` | Server-state cache, background refetch, stale-while-revalidate | `npm i @tanstack/vue-query` |
| `@tanstack/vue-table` | Headless table logic (sort, filter, pagination) | `npm i @tanstack/vue-table` |
| `vee-validate` + a schema library | Schema-based form validation, composable API | `npm i vee-validate` — see the note on zod |
| `date-fns` | Tree-shakeable date functions, built-in TS types | `npm i date-fns` |
| `shadcn-vue` + `reka-ui` | Accessible component primitives, Tailwind v4 native | `npx shadcn-vue@latest init` |
| `@heroicons/vue` | 300+ icons by Tailwind team | `npm i @heroicons/vue` |

## Install Priority

1. `@vueuse/core` + `date-fns` — pure utility, zero UI risk
2. `@tanstack/vue-query` — simplifies async data in stores
3. `@tanstack/vue-table` — headless, pairs with Tailwind
4. `vee-validate` + a schema library — when form complexity grows
5. `shadcn-vue` + `reka-ui` — modifies CSS entry point, do last

## Notes

- **vee-validate with zod is unverified for zod 4.** The `@vee-validate/zod` adapter was written for zod 3;
  before pairing them, check on npm that the adapter's `zod` peer range covers the zod major you install, or
  use the schema support vee-validate's own docs name for that version.
- **shadcn-vue** uses Reka UI (not Radix Vue). Tailwind v4 supported natively.
- **VueUse** — check the current major's Vue peer range on npm; recent majors need Vue 3.5+.
- **TanStack Query** complements Pinia (server state vs client state).
- **Keep the chart library the app already has** — a second one only when it cannot cover the use case (for
  example, a series of more than 100k points).
- **date-fns** coexists with native Temporal API (Chrome 144+).

## Do NOT Add

- Full UI kits (Vuetify, PrimeVue, Element Plus) — a full kit fights the app's design tokens
- Moment.js or Luxon — use date-fns instead
- Axios — use the app's fetch wrapper
- A second chart library unless the first cannot cover the use case
