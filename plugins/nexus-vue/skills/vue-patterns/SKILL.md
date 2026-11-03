---
name: vue-patterns
description: Vue 3 Composition API patterns — script setup macros, reactivity, composables, lifecycle, built-in components, URL-state sync. Use when writing or reviewing a Vue SFC — adding a composable, typing props/emits with the script-setup macros, wiring reactivity (ref/computed/watch), or using a built-in component (Transition/Teleport/Suspense). MUST be used for Vue.js tasks.
user-invocable: true
---

# Vue Patterns

Vue 3.5+ with `<script setup lang="ts">`. Always Composition API. Never Options API.

## Assumes

- **Vue 3.5+** with `<script setup lang="ts">` and the Composition API throughout (never Options API).
- **The reference client layout** for the `## Project Conventions` section only — the `client/src/…`
  folder paths and the globally-registered `RouterLink` / `RouterView` are that app's setup. The pattern
  guidance (macros, reactivity, composables, built-in components) is layout-agnostic.

**Different layout?** The Project Conventions paths are discovery-driven, not a contract — read the target
app's existing structure and follow it; only the *shape* (types / api / stores / components / composables /
views) carries over.

## Principles

- TypeScript first — all props, emits, and composable returns fully typed
- `shallowRef` over `ref` for large objects (only `.value` assignment triggers)
- Props with defaults (Vue 3.5+): destructure with native defaults — `const { items = [] } = defineProps<{ items?: string[] }>()`, no factory needed. `withDefaults` is the form for an app below 3.5; it still works on 3.5+, so existing code need not be rewritten (vuejs.org/guide/typescript/composition-api#props-default-values)
- A destructured prop passed to `watch` or a composable goes in as a getter — `watch(() => id, …)`, `useFeature(() => id)`; a bare `id` passes a value that never changes (vuejs.org/guide/components/props#reactive-props-destructure)
- Composables use `use` prefix and return refs (not reactive objects)
- One composable = one lifecycle concern
- Never `v-html` on content a user could have written — Vue escapes text, `v-html` does not (vuejs.org/guide/best-practices/security)

## Script Setup Macros

See `references/script-setup.md` for full patterns.

Summary:
- **defineProps** — type-based: `defineProps<{ title: string }>()`. Defaults by destructure (3.5+), `withDefaults` below 3.5
- **defineEmits** — named tuple: `defineEmits<{ update: [value: string] }>()`
- **defineModel** — two-way binding (Vue 3.4+): `const model = defineModel<string>()`
- **defineExpose** — explicitly expose to parent via template refs
- **defineOptions** — `inheritAttrs: false`, custom `name`
- **defineSlots** — typed slot props

## Reactivity

See `references/reactivity.md` for full patterns.

Summary:
- `ref` for primitives and small objects. `shallowRef` for large data.
- `computed` for derived state. Writable computed for two-way transforms.
- A computed getter is pure: no state writes, requests or DOM changes inside it. A value derived from other state is a `computed`, not a watcher that assigns a ref; watchers are for side effects (vuejs.org/guide/essentials/computed#getters-should-be-side-effect-free).
- `watch` with `deep: 2` depth limit (3.5+), `once: true` (3.4+)
- `watchEffect` auto-tracks deps. Use `onWatcherCleanup` (3.5+) for teardown.
- `toValue()` (3.3+) to unwrap `MaybeRefOrGetter<T>` in composables.

## Composable Pattern

```typescript
// composables/useFeature.ts
import { ref, onMounted } from 'vue'

export function useFeature(options: FeatureOptions) {
  const data = ref<Data | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetchData(options)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load'
    } finally {
      loading.value = false
    }
  }

  onMounted(load)

  return { data, loading, error, reload: load } // return refs, not reactive
}
```

**Call it synchronously in setup.** A composable is called in `<script setup>` or `setup()`, before any `await` — only `<script setup>` restores the component context after one — so its hooks and watchers attach to the component and stop with it. Whatever it starts (a listener, a timer, a socket) it stops in `onUnmounted` (vuejs.org/guide/reusability/composables#usage-restrictions).

**Module-level refs** — for shared state across call sites, declare refs outside the function. Per-call state goes inside the function. Pinia stores are preferred for shared business state.

## Template Refs and IDs

- **`useTemplateRef`** (3.5+) — `const input = useTemplateRef<HTMLInputElement>('input')` for `<input ref="input">`. It is `null` until mount and again after a `v-if` removes the element; read it in `onMounted` or guard for `null` in a watcher (vuejs.org/guide/essentials/template-refs).
- **`useId`** (3.5+) — `const id = useId()` gives an ID unique in the app and stable across server and client, for `<label :for="id">` / `:id="id"` and `aria-*` pairs. Call it in setup, never inside a `computed` (vuejs.org/api/composition-api-helpers#useid).

## Built-in Components

- **Transition** — `<Transition name="fade">` with CSS classes `.fade-enter-active`, `.fade-leave-active`
- **TransitionGroup** — list animations, `key` required on children
- **Teleport** — `<Teleport to="body">` for modals/toasts. `:disabled` to render in-place.
- **Suspense** — wraps async components (top-level `await` in `<script setup>`)
- **KeepAlive** — `:include`/`:exclude` by component name, `:max` cache limit

## URL-State Sync

Views that persist selection state in the URL follow a two-part pattern: watch the URL to seed the store, watch the store to update the URL.

```vue
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const store = useFeatureStore()

// 1. Seed store from URL — now, and on every later URL change
watch(
  () => route.query.itemId,
  (param) => {
    if (param && !isNaN(Number(param))) {
      store.selectItem(Number(param))  // use store action, not direct mutation
    }
  },
  { immediate: true },
)

onMounted(() => store.initialize())

// 2. Keep URL in sync when selection changes
watch(
  () => store.selectedItemId,
  (id) => {
    if (id !== null) {
      router.replace({ query: { ...route.query, itemId: String(id) } })
    }
  }
)
</script>
```

**Rules:**
- Use `router.replace` (not `push`) to avoid polluting browser history with filter changes.
- Seed from URL **before** `initialize()` so the first fetch uses the URL value — the `immediate` watcher runs during setup, before mount.
- Seed with a watcher, never in `onMounted` alone: a URL change that keeps the same route (`?itemId=1` to `?itemId=2`, `/items/1` to `/items/2`) reuses the component, so its mount hooks do not run again (router.vuejs.org/guide/essentials/dynamic-matching, Reacting to Params Changes).
- Use store actions for mutations, not direct property assignment.

## Recommended Packages

See `references/recommended-packages.md` for the approved ecosystem stack.

## Project Conventions

These paths are the **reference app's** layout, not a universal Vue contract — treat them as
discovery-driven: read the target app's existing structure and match it. The *shape* is what carries
across apps; the exact paths may differ.

- Types live in `client/src/types/index.ts`
- API modules in `client/src/api/{resource}.ts` using `apiFetch`
- Stores in `client/src/stores/{name}Store.ts`
- Components in `client/src/components/`
- Composables in `client/src/composables/`
- Views in `client/src/views/{Name}View.vue`
- `RouterLink` and `RouterView` are globally registered — no import needed
