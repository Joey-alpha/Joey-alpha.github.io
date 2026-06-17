# Empty Box Architecture Notes

This app intentionally runs without a build step. Modules are loaded by
`index.html` as plain scripts, so shared APIs live on `window.EmptyBox*`.

## Script Order

1. `js/empty-box-state.js`
   - Owns the persisted state shape.
   - Exposes `window.EmptyBoxState`.
   - Add new persisted fields here first.
2. `js/empty-box-storage.js`
   - Owns localStorage, Supabase REST calls, spaces, migration, import/export.
   - Exposes `window.EmptyBoxStorage`.
   - Requires app hooks for the current in-memory state and boot status.
3. `js/empty-box-task-actions.js`
   - Owns the shared item `...` action menu DOM and button wiring.
   - Exposes `window.EmptyBoxTaskActions`.
   - Requires app hooks for editing, copying, moving, completing, Star, and Daily.
4. `js/empty-box-home-lists.js`
   - Owns the home-page Must Do, Daily, and pinned tab list rendering.
   - Owns home-list item selection and drag sorting.
   - Exposes `window.EmptyBoxHomeLists`.
   - Requires app hooks for state, task menu creation, and group ordering.
5. `js/empty-box.js`
   - Owns DOM, rendering, item interactions, and application boot.

`quick-add.html` should load the shared state module before `quick-add.js`.
If Quick Add needs storage behavior in the future, prefer calling a shared
module or Supabase RPC instead of duplicating state normalization.

## Change Guide

- State field changes:
  Update `empty-box-state.js`, then any rendering logic in `empty-box.js`.
- Local/cloud persistence, spaces, migration, import/export:
  Update `empty-box-storage.js`.
- Item action menu structure:
  Update `empty-box-task-actions.js`; update the hooks in `empty-box.js` when behavior changes.
- Home-page Must Do, Daily list, pinned home list:
  Update `empty-box-home-lists.js`; update the hooks in `empty-box.js` when behavior changes.
- Must Do tabs and group management:
  Update `empty-box.js` for now. This is the next split candidate.
- Styling:
  Keep shared item menu selectors in sync across `.must-do-selection`,
  `.candidate-list`, `.must-do-list`, `.daily-list`, and `.pinned-list`.

## Next Split Candidates

- `empty-box-must-do.js`: tab rendering, tab drag sorting, item drag sorting, pinned tab logic.
