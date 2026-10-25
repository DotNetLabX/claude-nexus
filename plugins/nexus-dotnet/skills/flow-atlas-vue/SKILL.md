---
name: flow-atlas-vue
description: "The Vue client profile for a flow atlas - its entry kind (a route and the view it opens), its tier words (route, view, store, API module), the S1 tool that lists routes, views, stores and every server call, and the join that links each call to the server entry it reaches by verb and route. Use when building or refreshing a flow atlas over a Vue client, mapping which store and API call a screen runs, or linking a client page to the server endpoint behind it."
---

# Flow atlas — Vue client profile

Needs the `nexus-pro` plugin — if `build-flow-atlas` is not in your skill list, stop and tell the user `/plugin install nexus-pro@claude-nexus-pro`.
It also needs the repo's switch on — `features.flowAtlas` set to `true` in `.claude/nexus-agents.json`; `build-flow-atlas` checks it first and builds nothing while it is off.

## Assumes

- **The `build-flow-atlas` skill** (`nexus-pro`): the page kinds, the row grammar, the stages and the atlas tool.
  This profile supplies only the client parts.
- **A Vue 3 client** with a router file (`router.ts` or `router/index.ts`), views under a `views/` folder, Pinia
  setup stores (`defineStore`) and API modules — objects of functions that call `fetch` directly or through a small
  wrapper. Another layout adapts by mapping each concern to where it lives; the tool reads the shapes, not the
  folder names beyond `views/` and the router file.
- **A server profile's S1 output to join against** — `flow-atlas-dotnet`'s, beside this profile.

## Tiers

`route` → `view` → `store` → `api module` → the server entry. A client entry page starts at the route, and its last
client row is a link row that continues in the server entry page the join found.

## S1 — run the tool

The tool sits in this skill's `tools/` folder; the base directory is the path the platform prints as
`Base directory for this skill:` when the skill loads. Write its output outside the repo it reads:

```bash
node "{base-dir}/tools/extract-vue.mjs" --repo {client tree} > {scratch}/client.json
node "{base-dir}/tools/extract-vue.mjs" join --repo {client tree} --server {scratch}/server.json > {scratch}/join.json
```

Test code — `*.spec.*`, `*.test.*` and anything under `__tests__/` — is left out of both; `--include-tests` reads it
too.

The first prints `testCode` (whether test code was read, and how many test files the tree holds), `routes[]`
(path → view), `views[]` (the stores each view uses), `stores[]` (the API-module members each store calls) and
`calls[]` (verb, raw route, normalised key, `fetch` or the wrapper it went through, the API-module member, file,
line). `join` prints `matches[]` and `unresolved[]`. Exit 2: a tree or the server
file is missing.

## The join rule

- **Only code is read.** Comments, the inside of strings, a template literal's text (its `${…}` expressions are
  code) and a `.vue` file's template are never read as calls.
- **A literal call** — `fetch('/api/…')` — is read directly; its verb comes from the options' `method`, and is GET
  only where no option can set it — a `method` shorthand, a spread or a computed key leaves it unresolved.
- **A wrapper is followed one level.** A wrapper is a module-level function or arrow function, exported or not
  (`export const get = (path) => fetch(path)`, `async function getJson(path) { … fetch(path, …) … }`), whose first
  parameter is the path and whose body passes it to `fetch` as the URL; that `fetch` is not a call, but any other
  request in its body is. A function
  that builds its own URL (`` fetch(`/api/items/${id}`) ``) is not a wrapper, and its `fetch` is a call. A call
  counts as one only where the file defines the wrapper or imports an exported one (by its declaration or an export
  list, `export { getJson as get }`) — by name, under an alias, or
  through a namespace (`http.get(…)`); a member call that shares the name (`params.get(…)`), or a call where a parameter or a
  local declaration rebinds the name, is not one. At each call site the route is the first argument and the verb the
  argument at the position of the wrapper's `verb` or `method` parameter, defaulting to the wrapper's own; a wrapper
  with no such parameter takes the verb its `fetch` options give, by the literal-call rule above.
- **A verb given but not a literal** (a variable, an options object built elsewhere), or a wrapper default that is
  not a literal, leaves the call unresolved — never GET, never a guessed default.
- **A query string is dropped**, and **a route held in a named constant is resolved** by scope — the innermost
  binding around the call, then the file's own, then an import — never from an unrelated file; a parameter, a `let`,
  or a name declared twice in one scope leaves it unresolved.
- **The server's global route prefix** is applied to every server route not marked absolute, except a route whose
  leading segments already are the prefix (`api/orders` under `api` stays `api/orders`). A server entry whose
  prefix (`routePrefixConflict`) or route group is unresolved is never joined, and an unmatched call says how many
  such entries it was not compared with.
- **Both sides are normalised the same way:** a client `${…}`, a server `{name}` or `{name:constraint}`, and a
  `:name` segment all become `{}`; segments compare without case. A root route is an empty route, and joins.
- **No match, or several, is `join: unresolved`** on the client row — never a guessed link. It sits among the row's
  cross-references, with the tool's reason (`sendJson; join: unresolved — no server entry matches PUT
  api/orders/{}/archive`), written as given — the tool's reasons never hold `; `, so they parse — and the row's
  `next` holds no link. Read it by hand; a call whose route or verb the tool
  could not resolve lands here too.

## A small sample

```typescript
// router.ts
{ path: '/orders/:orderId', name: 'OrderDetail', component: () => import('@/views/OrderDetailView.vue') }

// views/OrderDetailView.vue (script setup)
const store = useOrderStore()
onMounted(() => store.fetchOrder(Number(route.params.orderId)))

// stores/orderStore.ts
async function fetchOrder(orderId: number) {
  order.value = await ordersApi.get(orderId)
}

// api/orders.ts
export const ordersApi = {
  get: (orderId: number) => getJson<Order>(`/api/orders/${orderId}`),
}
```

| id | tier | symbol | wired-how | next |
|---|---|---|---|---|
| r1 | route | /orders/:orderId → OrderDetailView | route | r2 |
| r2 | view | OrderDetailView → useOrderStore.fetchOrder | direct-call | r3 |
| r3 | store | useOrderStore.fetchOrder → ordersApi.get | direct-call | r4 |
| r4 | api module | ordersApi.get — GET api/orders/{} | getJson | continues-in {docs/flow-atlas/entries/get-order.md, GET orders/{orderId:int}} then — |
| r5 | api module | ordersApi.archive — PUT api/orders/{}/archive | sendJson; join: unresolved — no server entry matches PUT api/orders/{}/archive | — |

Each row also carries its `file` and its search, as the page grammar requires. Row r4 links to the server entry
page whose entry id the join matched; the server route `orders/{orderId:int}` reads `api/orders/{}` once the prefix
and the normalising are applied. Row r5, from another entry page, is a call the join could not match: it ends there.

## What this skill does NOT do

- Build the atlas — `build-flow-atlas` owns the pages, the stages and the verification.
- Read the server — `flow-atlas-dotnet` lists the entries this profile joins to.
- Follow a wrapper more than one level, or guess a route built at run time.
