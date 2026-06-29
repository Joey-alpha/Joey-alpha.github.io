# Empty Box Architecture Notes

This app intentionally runs without a build step. Modules are loaded by
`index.html` as plain scripts, so shared APIs live on `window.EmptyBox*`.

## Script Order

1. `js/empty-box-state.js`
   - Owns the persisted state shape.
   - Exposes `window.EmptyBoxState`.
   - Add new persisted fields here first.
2. `js/empty-box-storage.js`
   - Owns localStorage, Supabase REST calls, spaces, space transfer, import/export.
   - Exposes `window.EmptyBoxStorage`.
   - Requires app hooks for the current in-memory state and boot status.
3. `js/empty-box-dialogs.js`
   - Owns generic overlay open/close behavior, confirm dialog state, and close-button/backdrop events.
   - Exposes `window.EmptyBoxDialogs`.
   - Requires app hooks for business-specific overlay close handlers.
4. `js/empty-box-task-model.js`
   - Owns task business rules that do not need DOM rendering.
   - Exposes `window.EmptyBoxTaskModel`.
   - Requires app hooks for the current state and small UI side effects during rename.
5. `js/empty-box-ai.js`
   - Owns DeepSeek API settings, AI task organization prompts, task rewrite calls,
     and applying AI tab/group organization results to state.
   - Exposes `window.EmptyBoxAI`.
   - Stores the DeepSeek API key only in browser localStorage, outside Space data.
6. `js/empty-box-settings.js`
   - Owns settings UI, space management, space transfer, and import/export.
   - Exposes `window.EmptyBoxSettings`.
   - Requires app hooks for state updates, overlays, confirmations, and rendering refreshes.
7. `js/empty-box-task-actions.js`
   - Owns the shared item `...` action menu DOM and button wiring.
   - Exposes `window.EmptyBoxTaskActions`.
   - Requires app hooks for editing, copying, AI rewriting, moving, completing, Star, and Daily.
8. `js/empty-box-home-lists.js`
   - Owns the home-page Must Do, Daily, and pinned tab list rendering.
   - Owns home-list item selection and drag sorting.
   - Exposes `window.EmptyBoxHomeLists`.
   - Requires app hooks for state, task menu creation, and group ordering.
9. `js/empty-box-item-tabs.js`
   - Owns Must Do tab bar rendering and tab drag/tap interactions.
   - Exposes `window.EmptyBoxItemTabs`.
   - Requires app hooks for group actions and task moves.
10. `js/empty-box-item-manager.js`
   - Owns the item manager overlay list rendering, item drag sorting, mobile swipe actions, and bottom add row.
   - Exposes `window.EmptyBoxItemManager`.
   - Requires app hooks for task state, rendering, group ordering, and shared item menus.
11. `js/empty-box.js`
   - Owns DOM, rendering, item interactions, and application boot.

`quick-add.html` should load the shared state module before `quick-add.js`.
If Quick Add needs storage behavior in the future, prefer calling a shared
module or Supabase RPC instead of duplicating state normalization.

## Change Guide

- State field changes:
  Update `empty-box-state.js`, then any rendering logic in `empty-box.js`.
- Local/cloud persistence, spaces, space transfer, import/export:
  Update `empty-box-storage.js`.
- Generic overlays and confirm dialog:
  Update `empty-box-dialogs.js`; update hooks in `empty-box.js` when an overlay needs custom close behavior.
- Item action menu structure:
  Update `empty-box-task-actions.js`; update the hooks in `empty-box.js` when behavior changes.
- Task business rules:
  Update `empty-box-task-model.js`; update hooks in `empty-box.js` when behavior needs UI side effects.
- AI task organization and rewriting:
  Update `empty-box-ai.js`; update settings/action hooks in `empty-box.js` when UI entry points change.
- Settings, spaces, space transfer, import/export:
  Update `empty-box-settings.js`; update hooks in `empty-box.js` when state/render coordination changes.
- Home-page Must Do, Daily list, pinned home list:
  Update `empty-box-home-lists.js`; update the hooks in `empty-box.js` when behavior changes.
- Tab bar:
  Update `empty-box-item-tabs.js`; update hooks in `empty-box.js` when behavior changes.
- Item manager list interactions:
  Update `empty-box-item-manager.js`; update hooks in `empty-box.js` when behavior changes.
- Tab dialogs and mutations:
  Update `empty-box.js` for now. This is the next split candidate.
- Styling:
  Keep shared item menu selectors in sync across `.item-manager-list`,
  `.candidate-list`, `.star-list`, `.daily-list`, and `.pinned-list`.

## Next Split Candidates

- Move Tab dialogs and mutations behind `empty-box-item-tabs.js` or a dedicated tab model.
