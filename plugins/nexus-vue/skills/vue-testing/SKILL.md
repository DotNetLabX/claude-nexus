---
name: vue-testing
description: Testing a Vue 3 app with Vitest - components tested by their behaviour, composables with and without a host component, Pinia stores alone and inside components, async work, and where end-to-end tests go. Use when writing or reviewing a test for a Vue component, composable or Pinia store, or adding the test step of a feature slice.
user-invocable: true
---

# Vue Testing

Unit and component tests for a Vue 3 app, run by Vitest.

## Assumes

- **Vitest**, **Vue Test Utils** (`@vue/test-utils`) and a DOM environment for Vitest (the Vue testing guide
  sets it up with `happy-dom`) — the stack that guide recommends (vuejs.org/guide/scaling-up/testing).
- **Pinia** setup stores (`pinia-patterns`), and `@pinia/testing` for components that use a store.
- Where the tests live and how they are named is the project's own: its Vue conventions file (`vue.md`,
  § Testing) when it has one, else the existing tests.

**A different runner or library?** Keep the principles below (behaviour over internals, a fresh store per
test, mocked network, awaited async work) and translate the calls; Testing Library for Vue mounts and
queries differently but tests the same things.

## What to Test

- **A component by what it does, not how it does it** — through its public surface: the props it takes,
  the events it emits, the slots it renders, and what the user sees and clicks. Never read or set its
  internal state (`wrapper.vm`) (vuejs.org/guide/scaling-up/testing#component-testing).
- **No snapshot-only tests.** A snapshot of the HTML says nothing about whether the output is right;
  assert the text, attributes and events that matter.
- **Logic worth many cases goes in a plain function**, tested on its own; the component test then covers
  only the wiring.
- **Children are rendered, not mocked**, unless one is expensive or reaches the network.

## Components

```typescript
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import QuantityPicker from './QuantityPicker.vue'

describe('QuantityPicker', () => {
  it('should stop at the maximum when increment is clicked past it', async () => {
    const wrapper = mount(QuantityPicker, { props: { max: 2 } })
    const increment = wrapper.get('[data-testid="increment"]')

    await increment.trigger('click')
    await increment.trigger('click')
    await increment.trigger('click')

    expect(wrapper.get('[data-testid="quantity"]').text()).toBe('2')
    expect(increment.attributes('disabled')).toBeDefined()
    expect(wrapper.emitted('change')).toEqual([[1], [2]])
  })
})
```

Await `trigger` and `setValue`: each returns once Vue has updated the DOM (test-utils.vuejs.org/guide/advanced/async-suspense).

## Composables

A composable that uses only reactivity (`ref`, `computed`, `watch`) needs no component
(vuejs.org/guide/scaling-up/testing#testing-composables). One that creates a watcher runs inside an
`effectScope` that the test stops afterwards: a watcher left running, above all one over a ref shared at
module level, outlives its test and reacts in the next one. Stopping the scope disposes every watcher and
computed created in it (vuejs.org/api/reactivity-advanced#effectscope). For a `useAutosave(draft, save)`
that watches `draft` and calls `save`:

```typescript
import { effectScope, nextTick, ref } from 'vue'
import type { EffectScope } from 'vue'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useAutosave } from './useAutosave'

let scope: EffectScope
beforeEach(() => { scope = effectScope() })
afterEach(() => scope.stop())

it('should save the draft when it changes', async () => {
  const draft = ref('')
  const save = vi.fn()
  scope.run(() => useAutosave(draft, save))

  draft.value = 'hello'
  await nextTick()
  expect(save).toHaveBeenCalledWith('hello')
})
```

A composable that uses a lifecycle hook or `inject` needs a component to run in; mount it inside a
throwaway app (vuejs.org/guide/scaling-up/testing#testing-composables):

```typescript
// test-utils/withSetup.ts
import { createApp } from 'vue'
import type { App } from 'vue'

export function withSetup<T>(composable: () => T, provide?: (app: App) => void): [T, App] {
  let result!: T
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
  })
  provide?.(app)
  app.mount(document.createElement('div'))
  return [result, app]
}
```

The composable runs during `mount`, so a value it reads with `inject` is provided through the second
argument, before the mount — `withSetup(() => useCart(), (app) => app.provide(cartKey, testCart))`. The
returned `app` is for `app.unmount()`, which runs the composable's unmount hooks.

The composable under test:

```typescript
// useWindowWidth.ts
import { onMounted, onUnmounted, ref } from 'vue'

export function useWindowWidth() {
  const width = ref(window.innerWidth)
  const update = () => { width.value = window.innerWidth }
  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))
  return width
}
```

```typescript
import { afterEach, expect, it, vi } from 'vitest'
import { withSetup } from '../test-utils/withSetup'
import { useWindowWidth } from './useWindowWidth'

afterEach(() => vi.unstubAllGlobals())

it('should stop following the window when its component unmounts', () => {
  const [width, app] = withSetup(() => useWindowWidth())

  vi.stubGlobal('innerWidth', 500)
  window.dispatchEvent(new Event('resize'))
  expect(width.value).toBe(500)

  app.unmount()
  vi.stubGlobal('innerWidth', 800)
  window.dispatchEvent(new Event('resize'))
  expect(width.value).toBe(500)
})
```

`vi.stubGlobal` sets a browser global for the test and `vi.unstubAllGlobals` puts it back
(vitest.dev/api/vi.html).

## Stores

A store test creates a fresh Pinia before each test, so no state leaks between tests, and mocks the API
module the store calls (pinia.vuejs.org/cookbook/testing.html, vitest.dev/guide/mocking/modules):

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { ordersApi } from '@/api/orders'
import { useOrderStore } from './orderStore'

vi.mock('@/api/orders', () => ({ ordersApi: { getAll: vi.fn() } }))

describe('orderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.mocked(ordersApi.getAll).mockReset()
  })

  it('should hold the orders when the request succeeds', async () => {
    vi.mocked(ordersApi.getAll).mockResolvedValue([{ id: 1, name: 'First' }])
    const store = useOrderStore()

    await store.fetchOrders()

    expect(store.orders).toEqual([{ id: 1, name: 'First' }])
    expect(store.error).toBeNull()
  })

  it('should set the error when the request fails', async () => {
    vi.mocked(ordersApi.getAll).mockRejectedValue(new Error('offline'))
    const store = useOrderStore()

    await store.fetchOrders()

    expect(store.error).toBe('offline')
  })
})
```

## Components That Use a Store

Mount with `createTestingPinia()` from `@pinia/testing`. It gives every store a fresh state, seeds it with
`initialState` (keyed by the id the store passes to `defineStore` — here `'order'`), and replaces each action with a spy that does nothing
(pinia.vuejs.org/cookbook/testing.html):

```typescript
import { expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useOrderStore } from '@/stores/orderStore'
import OrderList from './OrderList.vue'

it('should list the held orders and ask for a refresh when mounted', () => {
  const wrapper = mount(OrderList, {
    global: {
      plugins: [createTestingPinia({
        createSpy: vi.fn,
        initialState: { order: { orders: [{ id: 1, name: 'First' }] } },
      })],
    },
  })

  expect(wrapper.text()).toContain('First')
  expect(useOrderStore().fetchOrders).toHaveBeenCalledOnce()
})
```

- **`createSpy: vi.fn`** is required unless Vitest runs with `globals: true`.
- **`stubActions: false`** runs the real actions (still spied) — for a test that needs the store to do its
  work, with the API module mocked as in Stores above.
- **The setup-store caveat:** a stub replaces an action on the store object only. Inside a setup store, an
  action that calls another action calls the closed-over function, so that inner call is never stubbed.
  Assert on what the outer action does, or run the real actions.

## Async Work

`await trigger(...)` waits for Vue's DOM update, not for a promise Vue does not know about, such as a
mocked request. When the mock resolves at once, `await flushPromises()` (from `@vue/test-utils`) after
the code under test starts the request lets its reply land before you assert
(test-utils.vuejs.org/guide/advanced/async-suspense):

```typescript
import { expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { ordersApi } from '@/api/orders'
import OrderList from './OrderList.vue'

vi.mock('@/api/orders', () => ({ ordersApi: { getAll: vi.fn() } }))

it('should show the orders when the request resolves', async () => {
  vi.mocked(ordersApi.getAll).mockResolvedValue([{ id: 1, name: 'First' }])
  const wrapper = mount(OrderList, {
    global: { plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: false })] },
  })

  await flushPromises()

  expect(wrapper.text()).toContain('First')
})
```

`flushPromises` runs no timers. Work behind a `setTimeout` or `setInterval` — a debounce, a poll, a
retry — runs under Vitest's fake timers: `vi.useFakeTimers()` before the code starts the timer,
`vi.advanceTimersByTime(ms)` or `vi.runAllTimers()` to move it, and `vi.useRealTimers()` after the test;
fake timers move only when you advance them (vitest.dev/guide/mocking/timers, vitest.dev/api/vi.html).

Never wait with a fixed delay (`setTimeout`) — it is slow and still flaky.

## End-to-End Tests

A flow across pages, against the built app in a real browser, is an end-to-end test: write it with
Playwright, the Vue guide's first recommendation (vuejs.org/guide/scaling-up/testing#e2e-testing), not with
Vitest.

## What this skill does NOT do

- Configure Vitest or Vite, or set up a browser-mode or end-to-end runner.
- Decide which features need tests — the project's testing conventions do.
- Shape the code under test — stores are `pinia-patterns`', components and composables `vue-patterns`' and
  `vue-component-architecture`'; `create-vue-feature` places the test step in a new slice.
