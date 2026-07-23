---
name: pinia-patterns
description: Pinia state management — setup stores, storeToRefs, store vs view state, async/initialize/optimistic patterns, store composition, localStorage persistence. Use when creating a Pinia store, extending an existing store with new state or actions, or persisting store state to localStorage. Loaded when creating or modifying Pinia stores.
user-invocable: true
---

# Pinia Patterns

Pinia 3 with Composition API (setup stores). This project uses setup stores exclusively.

## Assumes

- **Pinia 3** with **setup stores** (Composition API) and **Vue 3** — this project uses setup stores
  exclusively.
- **Framework-native — no extra packages presumed.** The patterns here use only Pinia and the Vue
  reactivity primitives. The localStorage-persistence pattern below uses the plain Web Storage API
  directly; adopt a persistence plugin (e.g. `pinia-plugin-persistedstate`) only if the project already
  carries one — do not add a dependency just to persist one store.

## Setup Store Pattern

```typescript
// stores/settingsStore.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  // State
  const settings = ref<Settings | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters (computed)
  const isConfigured = computed(() => !!settings.value)
  const workflowStages = computed(() => settings.value?.workflowStages ?? [])

  // Actions
  async function fetchSettings() {
    loading.value = true
    error.value = null
    try {
      settings.value = await settingsApi.get()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load'
    } finally {
      loading.value = false
    }
  }

  async function updateSettings(updates: Partial<Settings>) {
    try {
      settings.value = await settingsApi.update(updates)
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save'
    }
  }

  return {
    settings,
    loading,
    error,
    isConfigured,
    workflowStages,
    fetchSettings,
    updateSettings,
  }
})
```

## Using Stores in Components

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settingsStore'

const store = useSettingsStore()

// Destructure reactive state/getters with storeToRefs
const { settings, loading, error } = storeToRefs(store)

// Actions can be destructured directly (they are plain functions)
const { fetchSettings, updateSettings } = store

onMounted(fetchSettings)
</script>
```

**Rules:**
- `storeToRefs()` for state and getters — preserves reactivity
- Destructure actions directly from store — they are plain functions
- Never destructure state without `storeToRefs` — loses reactivity

## Store vs View State

| State Type | Where | Example |
|-----------|-------|---------|
| Shared business data | Store | `settings`, `developers`, `sprints` |
| Loading/error flags | Store | `loading`, `error` |
| Computed business logic | Store (getter) | `isConfigured`, `activeSprintCount` |
| Form draft/edits | View (local ref) | `form`, `editedName`, `selectedTab` |
| UI transient state | View (local ref) | `isModalOpen`, `hoveredRow`, `sortDirection` |
| Detection/analysis results | Store | `detectionResult`, `sidelinedStatuses` |

**The rule:** Store actions only mutate store-owned state. View handlers mutate view-local state. The store never touches form drafts.

## Sync from Store Pattern

When a view has a local form that mirrors store state:

```vue
<script setup lang="ts">
const store = useSettingsStore()
const { settings } = storeToRefs(store)

// Local form state — editable copy
const form = reactive({
  workflowStages: [] as string[],
  sprintLength: 14,
})

// Sync from store on mount
function syncFromStore() {
  if (settings.value) {
    form.workflowStages = [...settings.value.workflowStages]
    form.sprintLength = settings.value.sprintLength
  }
}

onMounted(async () => {
  await store.fetchSettings()
  syncFromStore()
})

// Save sends form → store → API
async function save() {
  await store.updateSettings({
    workflowStages: form.workflowStages,
    sprintLength: form.sprintLength,
  })
  syncFromStore() // re-sync after save
}
</script>
```

## Async Action Pattern

Every async action follows the same shape:

```typescript
async function doSomething(args: Args) {
  loading.value = true
  error.value = null
  try {
    const result = await api.call(args)
    state.value = result
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Unknown error'
  } finally {
    loading.value = false
  }
}
```

## Initialize Pattern

Stores that load reference data before fetching primary data use a two-phase `initialize()` action. Views call `initialize()` on mount instead of individual fetches.

```typescript
export const useFeatureStore = defineStore('feature', () => {
  const referenceData = ref<RefType[]>([])
  const primaryData = ref<DataType | null>(null)
  const loading = ref(false)
  const initializing = ref(false)
  const error = ref<string | null>(null)

  async function initialize() {
    initializing.value = true
    error.value = null
    try {
      const [refs, extras] = await Promise.all([fetchRefs(), fetchExtras()])
      referenceData.value = refs
      // Set defaults from reference data
      if (refs.length > 0 && selectedId.value === null) {
        selectedId.value = refs[0].id
      }
      await fetchPrimary()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to initialize'
    } finally {
      initializing.value = false
    }
  }

  return { referenceData, primaryData, loading, initializing, error, initialize }
})
```

**Rules:**
- `initializing` covers the full bootstrap (reference + primary). `loading` covers subsequent refreshes.
- Views show a skeleton/spinner while `initializing`, and a subtle "Updating..." while `loading`.

## Optimistic Update with Revert

For user-initiated mutations where immediate feedback matters:

```typescript
async function updateField(id: string, newValue: number) {
  // 1. Snapshot previous state
  const entry = data.value?.items.find(i => i.id === id)
  const previousValue = entry?.field ?? defaultValue

  // 2. Optimistic local mutation
  if (entry) {
    entry.field = newValue
  }

  try {
    // 3. Persist to API
    await api.update(id, newValue)
    // 4. Re-fetch for server-computed fields (rolling averages, etc.)
    await fetchData()
  } catch (e) {
    // 5. Revert on error
    if (entry) {
      entry.field = previousValue
    }
    error.value = e instanceof Error ? e.message : 'Failed to update'
  }
}
```

**Rules:**
- Snapshot before mutating so you can revert.
- Re-fetch after success if the server computes derived values.
- Expose `error` state — don't show toasts from the store.

## Persisting State to localStorage

Some store state should survive a reload — a selected filter, a collapsed-panel flag, a saved preference.
Persist it with the plain Web Storage API and a `watch`; no plugin required (see Assumes).

```typescript
export const useUiStore = defineStore('ui', () => {
  const STORAGE_KEY = 'ui:preferences'

  // Seed from localStorage on store creation (guard JSON.parse)
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') }
    catch { return {} }
  })()

  const sidebarCollapsed = ref<boolean>(saved.sidebarCollapsed ?? false)
  const theme = ref<string>(saved.theme ?? 'system')

  // Write through on any change
  watch(
    [sidebarCollapsed, theme],
    () => localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sidebarCollapsed: sidebarCollapsed.value,
      theme: theme.value,
    })),
  )

  return { sidebarCollapsed, theme }
})
```

**Rules:**
- Persist **UI/preference** state only — never server-owned business data (re-fetch that from the API).
- Guard `JSON.parse` in a try/catch — a corrupt or absent key must not break store creation.
- Namespace the key (`ui:preferences`) so multiple stores don't collide.
- If the project already carries a persistence plugin, use it instead of hand-rolling the `watch`.

## Store Composition

Stores can use other stores:

```typescript
export const useDashboardStore = defineStore('dashboard', () => {
  const settingsStore = useSettingsStore()
  const sprintStore = useSprintStore()

  const summary = computed(() => {
    if (!settingsStore.isConfigured) return null
    // combine data from multiple stores
  })

  return { summary }
})
```

**Call stores inside the setup function, not at module level.**

## Extending an Existing Store

Adding state, a getter, or an action to a store that **already exists** is an edit-in-place — not a new
store, and not `Store Composition` (that combines *separate* stores; this grows *one*). When a feature
needs more from a resource's existing store:

1. **Add the ref(s)** to the store's state block, **the action(s)** that mutate them (following the Async
   Action Pattern), and any derived `computed` getter.
2. **Return the new members** from the setup function — a ref or action missing from the returned object
   is invisible to components.
3. **Consume them** via `storeToRefs` (state/getters) or a direct destructure (actions); existing
   consumers are unaffected.

Prefer extending the resource's existing store over spinning up a second store for the same resource.
Split into a new store only when the file crosses the ~300-line anti-pattern threshold below, or the state
genuinely belongs to a different domain.

## Naming Conventions

- File: `client/src/stores/{name}Store.ts`
- Export: `use{Name}Store`
- Store ID: `'{name}'` (lowercase, matches file)
- State: descriptive nouns (`settings`, `developers`, `sprints`)
- Getters: `is*`, `has*`, `*Count`, `active*`
- Actions: verb phrases (`fetchSettings`, `updateSettings`, `detectWorkflowStages`)

## Anti-Patterns

| Don't | Do |
|-------|-----|
| Destructure state without `storeToRefs` | `const { x } = storeToRefs(store)` |
| Store mutates form/UI state | Keep form state in view |
| Massive store (300+ lines) | Split by domain |
| Store calls `showToast()` | Expose error state, view handles UI |
| Options API store syntax | Setup store (Composition API) |
| Call store at module level | Call inside setup function |
