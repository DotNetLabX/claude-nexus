---
name: create-vue-feature
description: Creates a complete front-end feature slice in a Vue app — types, API module, Pinia store, components, view, route and its guard, tests. Use when adding a page or a feature slice to a Vue app, or extending a slice that already exists with a new field, API call, store action or component.
---

# Create Vue Feature

Creates a complete frontend vertical slice. Each step produces or modifies the files of one concern.

## Assumes

- **The reference client layout** — a Vite + Vue 3 SPA rooted at `client/src/` with the standard folders
  (`types/`, `api/`, `stores/`, `components/`, `views/`, `router.ts`), an `apiFetch` client wrapper, and
  **Pinia** setup stores. Every step's path assumes that layout.
- **The app shell** the steps wire into — the app's own page layout components (`PageLayout` /
  `PageToolbar` in the reference layout) and a nav host (`AppSidebar.vue` or equivalent) for the
  `RouterLink`.

**If your app's layout differs** — a different `src` root, a `features/`-per-slice structure, no
`apiFetch` wrapper — do not force the reference paths. See "When the layout doesn't match" below: keep the
same slice *shape* (types → api → store → components → view → route → nav) and remap each step to where
that concern lives in your app.

## Steps

1. **Define types.** Add TypeScript interfaces for the feature's API responses and domain objects to `client/src/types/index.ts`. Follow existing patterns in the file.

2. **Create API module.** Create `client/src/api/{resource}.ts` using the `apiFetch` wrapper. Follow the pattern in existing API modules (e.g., `client/src/api/settings.ts`).

   ```typescript
   import { apiFetch } from './client'
   import type { MyResource } from '@/types'

   export const myResourceApi = {
     getAll: () => apiFetch<MyResource[]>('/api/my-resource'),
     getById: (id: number) => apiFetch<MyResource>(`/api/my-resource/${id}`),
   }
   ```

3. **Create Pinia store.** Create `client/src/stores/{name}Store.ts` following `pinia-patterns` skill. Include: state refs, loading/error flags, computed getters, async actions.

4. **Create components.** Create feature components in `client/src/components/`. Follow `vue-component-architecture` skill for level assignment:
   - Feature container → L1 (< 200 lines)
   - Data display sections → L3 (props-only)
   - Reusable UI pieces → L4 (< 50 lines)

5. **Create view.** Create `client/src/views/{Name}View.vue` as an L0 page component (< 100 lines). The view:
   - Imports and initializes the store
   - Loads its data from a `watch` on the route param it depends on, with `immediate: true` — not from
     `onMounted` alone: a move to the same route with another param reuses the view, so its mount hooks
     do not run again (`vue-patterns`' URL-State Sync). A view that depends on no param loads on mount.
   - Passes data to feature components via props
   - Handles local form state (if applicable) using the sync-from-store pattern

6. **Wire route.** Add route entry in `client/src/router.ts` with lazy loading:
   ```typescript
   {
     path: '/my-feature',
     name: 'MyFeature',
     component: () => import('@/views/MyFeatureView.vue'),
   }
   ```
   A route that must check something before it opens (sign-in, a role, unsaved changes) gets a guard —
   see Routing below.

7. **Add navigation.** Add `RouterLink` or nav entry in the app shell (`AppSidebar.vue` or equivalent).

8. **Write tests.** A test for the store's actions and one for each component that has behaviour, as the
   `vue-testing` skill shows — by what the user sees and does, not by the component's internals.

9. **Verify:** `developer.md` § The step test rule.

## Arguments

Pass the feature name as argument: `/create-vue-feature OrderHistory`

The feature name determines: type names, API module file, store name, view name, route path.

## Routing

A guard decides whether a navigation goes ahead (router.vuejs.org/guide/advanced/navigation-guards):

```typescript
// router.ts
router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const auth = useAuthStore()
  await auth.ensureSession()
  if (auth.isLoggedIn) return true
  return { name: 'Login', query: { redirect: to.fullPath } }
})
```

**Rules:**
- **Return the result.** `true` or nothing lets the navigation through, `false` cancels it, a route
  location redirects to it. The optional third argument `next` is still supported, but it must be called
  exactly once on every path through the guard; returning is the form the Router guide teaches.
- **A guard can be `async`.** The navigation waits for it. Throwing an `Error` cancels the navigation and
  reaches `router.onError`.
- **No redirect loops.** A guard must never redirect to a route it would redirect again — here the login
  route has no `requiresAuth`. Where the target is checked by the same rule, test `to.name` against it
  first.
- **Read stores inside the guard**, never at the top of the router file (`pinia-patterns`' Stores in
  Router Guards).

## Page Shell Pattern

Every view wraps its content in the app's own page layout components — `PageLayout` and `PageToolbar` in
the reference layout. Use the app's equivalents, or plain markup where it has none. The sample is a view
for a route with an `:id` param; its store's `load(id)` follows `pinia-patterns`' Async Action Pattern:

```vue
<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import PageLayout from '@/components/PageLayout.vue'
import PageToolbar from '@/components/PageToolbar.vue'
import { useFeatureStore } from '@/stores/featureStore'

const route = useRoute()
const store = useFeatureStore()

watch(
  () => route.params.id,
  (id) => { if (id) store.load(Number(id)) },  // id is undefined while leaving the route
  { immediate: true },
)

function onStatusChange(status: string) {
  store.selectStatus(status)
}
</script>

<template>
  <PageLayout title="FeatureName">
    <template #toolbar>
      <PageToolbar
        :statuses="store.statuses"
        :selected-status="store.selectedStatus"
        @update:selected-status="onStatusChange"
      />
    </template>

    <!-- Loading state -->
    <div v-if="store.loading" class="flex items-center justify-center h-64">
      <div class="text-text-muted text-sm">Loading...</div>
    </div>

    <!-- Empty state -->
    <div v-else-if="!store.data" class="flex flex-col items-center justify-center h-64 gap-1">
      <p class="text-text-primary font-medium">No data yet</p>
      <p class="text-text-muted text-sm">Items appear here once they are added.</p>
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Feature content here -->
    </template>
  </PageLayout>
</template>
```

Views follow the three-state template: loading → empty → content. A store built on `pinia-patterns`'
Initialize Pattern shows `initializing` for the first load instead.

## Feature Folder Structure

```
client/src/
├── types/index.ts                          # Add interfaces here
├── api/{resource}.ts                       # API module
├── stores/{name}Store.ts                   # Pinia store
├── stores/{name}Store.spec.ts              # Store test, beside the store
├── components/{FeatureName}*.vue           # Feature components (and their *.spec.ts)
├── views/{FeatureName}View.vue             # Page view
└── router.ts                               # Route entry
```

## Checklist

- [ ] Types defined in `types/index.ts`
- [ ] API module uses `apiFetch` wrapper
- [ ] Store follows setup store pattern with loading/error
- [ ] Components assigned correct levels (L0-L4)
- [ ] View is < 100 lines, delegates to components
- [ ] Route uses lazy loading
- [ ] Navigation wired in app shell
- [ ] Data keyed on a route param loads from a `watch` with `immediate: true`
- [ ] Tests for the store and the components with behaviour (`vue-testing`)
- [ ] Verified: `developer.md` § The step test rule

## Extending an existing slice

The 9-step list and the Checklist above are the **creation** path — a brand-new feature. Adding to a
feature that already exists is the more common case, and it is **edit-in-place**, not new files:

- **New field on an existing response** — add it to the existing interface in `types/index.ts`; do not
  create a new type file.
- **New API call** — add a function to the existing `api/{resource}.ts` module (a new `getSummary`,
  `update`, …), not a new module.
- **New state / action / getter** — add refs, a computed, or an async action to the **existing**
  `stores/{name}Store.ts` (see `pinia-patterns`' extend-an-existing-store section), rather than a second
  store for the same resource.
- **New UI on an existing view** — add or edit a component under the existing feature folder and slot it
  into the current view; only add a route + nav entry if it is a genuinely new page.
- **Tests** — add the cases for the new behaviour to the existing `*.spec.ts` beside the file you changed.

Rule of thumb: touch the file that already owns the concern. Reach for the creation path only when the
resource, store, or view does not exist yet. Skip the route/nav steps entirely when extending — the page
is already reachable.

## When the layout doesn't match

The reference paths (`client/src/api/…`, `stores/…`) are one app's layout, not a contract. When the
consuming app differs:

- **Different root or aliasing** — a `src/` (no `client/`) root, an `@/` alias that points elsewhere:
  substitute the real path; the step's *intent* (an API module, a store) is what matters.
- **Feature-first structure** — some apps colocate a slice under `features/{name}/` (types, api, store,
  component together). Keep the same concerns; place them in that folder instead of the shared top-level
  ones.
- **No `apiFetch` wrapper** — use the app's own HTTP client (an axios instance, a `fetch` wrapper); the
  API-module shape (a typed object of endpoint functions) is unchanged.
- **Different nav host** — wire the `RouterLink` into whatever shell the app uses; there may be no
  `AppSidebar.vue`.

If you cannot find the equivalent location, read one existing slice in the target app end-to-end first and
mirror it — the app's own convention wins over the reference paths here.
