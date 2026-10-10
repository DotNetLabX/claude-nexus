# Recommended Packages

The recommended ecosystem. All are tree-shakeable and actively maintained.

## Core Stack

| Package | Purpose |
|---------|---------|
| `vue` 3.5+ | SPA framework |
| `pinia` 3 | State management |
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
| `vee-validate` + `zod` | Schema-based form validation, composable API | `npm i vee-validate @vee-validate/zod zod` |
| `date-fns` | Tree-shakeable date functions, built-in TS types | `npm i date-fns` |
| `shadcn-vue` + `reka-ui` | Accessible component primitives, Tailwind v4 native | `npx shadcn-vue@latest init` |
| `@heroicons/vue` | 300+ icons by Tailwind team | `npm i @heroicons/vue` |

## Install Priority

1. `@vueuse/core` + `date-fns` — pure utility, zero UI risk
2. `@tanstack/vue-query` — simplifies async data in stores
3. `@tanstack/vue-table` — headless, pairs with Tailwind
4. `vee-validate` + `zod` — when form complexity grows
5. `shadcn-vue` + `reka-ui` — modifies CSS entry point, do last

## Notes

- **shadcn-vue v1** uses Reka UI (not Radix Vue). Tailwind v4 supported natively.
- **VueUse v14** requires Vue 3.5+.
- **TanStack Query v5** complements Pinia (server state vs client state).
- **Keep the chart library the app already has** — a second one only when it cannot cover the use case (for
  example, a series of more than 100k points).
- **date-fns v4** coexists with native Temporal API (Chrome 144+).

## Do NOT Add

- Full UI kits (Vuetify, PrimeVue, Element Plus) — a full kit fights the app's design tokens
- Moment.js or Luxon — use date-fns instead
- Axios — use the app's fetch wrapper
- A second chart library unless the first cannot cover the use case
