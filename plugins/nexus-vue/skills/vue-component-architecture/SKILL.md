---
name: vue-component-architecture
description: Vue 3 component architecture — level hierarchy, split decisions, composable lifecycle, store boundaries, props resolution. Use when designing the components of a new view or feature, deciding which level a component belongs to, or splitting a component that has grown too large.
user-invocable: true
---

# Vue Component Architecture

Opinionated rules for structuring Vue 3 components. The component levels, the split signals, the
composable-lifecycle rules, the store boundary and the props-resolution table are adapted from
`vue-clean-components`, a skill in KIMJINWOO4/vue-skills used under the MIT licence; its copyright and
permission notice is in this plugin's `NOTICE.md`.

## Assumes

- **Vue 3** with `<script setup>`, **Pinia** setup stores (`pinia-patterns`) and composables.
- The level mapping below reads the reference client layout (`views/`, `components/`, `composables/` under
  `client/src/`); where the app is laid out differently, map the same levels onto its folders.

## Component Levels

Every component has a level. The level determines what it may access.

| Level | Name | Max Lines | Store Access | Composables | Children |
|-------|------|-----------|-------------|-------------|----------|
| L0 | Page (View) | < 100 | Read + load/select | OK | L1 |
| L1 | Feature | < 200 | Full CRUD | OK | L2, L3 |
| L2 | Controller | < 150 | via inject | OK | L3, L4 |
| L3 | Humble | < 100 | Forbidden | Forbidden | L4 |
| L4 | Atomic | < 50 | Forbidden | Forbidden | None |

An L0 view reads store state and calls only the actions that load its data or choose what it shows — a
load on its route param, a filter, a selection. Creating, changing or deleting data is L1's.

**Decision tree:**
- Route target → L0 (`*View.vue` in `views/`)
- Independent feature area → L1 (e.g., `OrderSummaryCard.vue`)
- Fetches data or wires composables → L2
- Props-only, no logic → L3
- Single UI primitive → L4

**The reference layout's mapping:**
- `client/src/views/*View.vue` → L0
- `client/src/components/App*.vue`, `PageLayout.vue`, `PageToolbar.vue` → L1/L2
- Feature-specific sub-components → L3
- Design tokens, icons → L4

## When to Split

**MUST split** when a component exceeds 200 lines.

| Signal | Extract To |
|--------|-----------|
| 3+ `v-if` branches, each > 30 lines | Conditional components |
| `v-for` body > 20 lines | Item component |
| 2-3 collapsible sections, each > 50 lines | Section components |
| Script fetches 2+ independent data sources | Composable per source |
| 5+ props with 3+ handlers | provide/inject |

**Do NOT split when:**
- Component < 150 lines of mostly static markup
- Splitting adds files without improving comprehension
- Only 1 occurrence (no reuse benefit)

## Inline vs External Composables

**A composable that one component uses is written in that component's file; it moves to its own file
under `composables/` when a second component needs it.**

```typescript
// One user: defined beside the component that calls it
<script setup lang="ts">
function useFormState() {
  const form = ref({ name: '', email: '' })
  const errors = ref<Record<string, string>>({})
  return { form, errors }
}

const { form, errors } = useFormState()
</script>

// Two or more users: its own file
// client/src/composables/useTheme.ts
export function useTheme() { /* ... */ }
```

**Composable rules:**
- Must use Vue lifecycle APIs (ref, watch, onMounted) — otherwise it's a plain function, drop `use` prefix
- One composable = one lifecycle concern
- Setup and cleanup stay together (`onMounted` + `onUnmounted`)
- Return refs in a named object, never an array
- A failure is returned as an `error` ref beside the data, as the official `useFetch` example returns
  `{ data, error }`; the component decides what the user sees, so a composable opens no toast, alert or
  dialog (vuejs.org/guide/reusability/composables)

## Store Boundary

**In store:** Shared business state, business actions, computed getters.

**NOT in store:** UI-only state (local ref), form draft state (view-local reactive), API call logic (composable/service), transient UI state (drag, hover).

**Project convention:** Store actions only mutate store-owned state. View handlers mutate form/UI state. Never cross the boundary.

Store > 300 lines → split into domain-focused stores.

## Props Resolution

| Props Count | Action |
|------------|--------|
| 1-3 | Fine as-is |
| 4-5 | Consider "Preserve Whole Object" (pass entity, not fields) |
| 6+ | Must use provide/inject or split component |
| 3+ handler props | Must use provide/inject action object |

**No props drilling beyond 1 level.** Use provide/inject with typed `InjectionKey` symbols for deeper passing.

### Typed provide/inject

The provider owns the state and every change to it; consumers get a read-only view of the state and the
functions that change it (vuejs.org/guide/components/provide-inject#working-with-reactivity). The key is
an `InjectionKey`, so provider and consumer share one type, and it lives in a file both import
(vuejs.org/guide/typescript/composition-api#typing-provide-inject).

```typescript
// selectionContext.ts
import { inject, provide, readonly, ref } from 'vue'
import type { InjectionKey, Ref } from 'vue'

interface SelectionContext {
  selectedId: Readonly<Ref<string | null>>
  select: (id: string) => void
  clear: () => void
}

const selectionKey: InjectionKey<SelectionContext> = Symbol('selection')

export function provideSelection(): SelectionContext {
  const selectedId = ref<string | null>(null)
  const context: SelectionContext = {
    selectedId: readonly(selectedId),
    select: (id) => { selectedId.value = id },
    clear: () => { selectedId.value = null },
  }
  provide(selectionKey, context)
  return context
}

export function useSelection(): SelectionContext {
  const context = inject(selectionKey)
  if (!context) throw new Error('useSelection() needs provideSelection() in a parent component')
  return context
}
```

The L1 Feature calls `provideSelection()` in its setup; any L2 below it calls `useSelection()`. `inject`
returns `undefined` when no parent provides the key, so the consumer fails loudly rather than reading an
empty value.

## Anti-Patterns

| Instead of | Write |
|------------|-------|
| A `modelValue` prop plus an `update:modelValue` emit | `defineModel<T>()`, the recommended form since Vue 3.4 (vuejs.org/guide/components/v-model) |
| `defineEmits(['event'])` | The typed form `defineEmits<{ event: [args] }>()` (vuejs.org/guide/typescript/composition-api#typing-component-emits) |
| A composable in its own file that one component uses | Define it in that component's file |
| A composable that opens a toast or an alert | Return an `error` ref; the component shows it |
| Store mutating form/UI state | Keep form state in view, store state in store |
