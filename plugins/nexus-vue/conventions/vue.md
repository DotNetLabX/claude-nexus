# Vue Conventions

Programming conventions for Vue 3 + TypeScript. Complements the plugin's front-end skills (vue-patterns, vue-component-architecture, pinia-patterns, tailwind-theme, vue-testing).

## Reactivity Gotchas

- When a composable is called in multiple places, declare shared reactive refs at **module level** (outside the exported function). Function-scoped refs give each call site an isolated copy.
- Guard against empty-state flickering by checking all three conditions: `data.length === 0 && result === null && !loading`. Without the `!loading` guard, the empty-state message flashes during async calls.
- When multiple code paths write to the same form field (e.g., a value filled on mount vs a manual refresh), apply the **same guard conditions** on both paths. Guard parity prevents silent data loss on empty results.

## Component Patterns

- `RouterLink` is globally registered by Vue Router — no import needed in `<script setup>`.
- Optional props with defaults: destructure with native defaults (Vue 3.5+) — `const { items = [] } = defineProps<T>()`; `withDefaults(defineProps<T>(), { items: () => [] })` is the below-3.5 form, and existing uses of it keep working (the vue-patterns skill).
- `<select>` elements need `appearance-none bg-transparent` Tailwind classes to override native browser styling.

## Store / View Boundary

- Store actions only mutate store-owned state. View handlers mutate form/UI state. Never cross the boundary.
- Error state from the store (`error` ref) must be surfaced in views — not silently swallowed.
- Empty state must be rendered when data or filter produces zero results. Don't let `v-if="list.length > 0"` silently hide valid empty results.

## White Flash Prevention

- In `index.html`'s `<head>`, give each theme its literal hex page background (`html` and `html.dark`), beside the inline script that sets the theme class. Tailwind CSS custom property tokens are not available until the CSS file loads (the tailwind-theme skill).

## TypeScript

- `erasableSyntaxOnly` (Vite default) forbids `enum` declarations. Use type unions: `type OrderStatus = 'Open' | 'Shipped'`.

## Testing

- **Location:** a test sits beside the file it tests, named `{name}.spec.ts` (`OrderList.vue` → `OrderList.spec.ts`).
- **Framework:** Vitest with `@vue/test-utils`; `@pinia/testing` for components that use a store. MSW for API mocking when a test needs the real HTTP layer.
- **Naming:** `describe` names the unit; each `it` reads `should {outcome} when {condition}`:

```typescript
describe('OrderListStore', () => {
  it('should return no orders when no filter matches', () => { ... })
})
```

- **How to write them:** the vue-testing skill — components by their behaviour, composables, stores, async work.
