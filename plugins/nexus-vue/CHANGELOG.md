# Changelog — nexus-vue

All notable changes to the `nexus-vue` plugin.

## [0.1.0] — 2026-11-02
- F352-VuePlugin: first release. The Vue front-end skills move here from `nexus-dotnet` 2.1.x, so a Vue team on any
  back end can install them without the .NET plugin, and a .NET team without Vue no longer gets them:
  - `vue-patterns`, `pinia-patterns`, `vue-component-architecture`, `create-vue-feature`, `tailwind-theme`,
    `frontend-review`, `flow-atlas-vue`
  - the conventions file `conventions/vue.md`
- The moved skills are brought up to date from the official Vue, Pinia, Vue Router and Tailwind CSS docs. Props
  defaults use the 3.5 destructure form, `dark:` is described correctly for Tailwind v4, and a routing section is
  added to `create-vue-feature`. The theme sample now follows the system setting until the user picks one, with
  light as the `:root` default and dark as the `.dark` class (it used to start dark).
- A new `vue-testing` skill covers testing components, composables and Pinia stores with Vitest. The Vue testing
  conventions move from `nexus-dotnet`'s `testing.md` into `vue.md` § Testing.
