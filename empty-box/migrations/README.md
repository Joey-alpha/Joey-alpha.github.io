# Empty Box v2 Migration

This folder contains the safe, manual migration path from the old
`spaces` + `notes.content` snapshot schema to structured `empty_box_*`
tables.

Nothing in this folder modifies Supabase automatically. Run SQL manually only
after reviewing the generated files.

## Files

- `001_empty_box_v2_schema.sql`
  Creates the new v2 tables next to the old `spaces` and `notes` tables.
  It does not drop or change old tables.
- `migrate-v1-backups-to-v2.mjs`
  Converts one or more exported backup JSON files into v2 records and a SQL
  import file. It also writes a local-storage import JSON for browser-local v2
  data.
- `002_empty_box_v2_single_user_policies.sql`
  Optional permissive RLS/grant setup for the current single-user anon-key app.
- `003_empty_box_v2_quick_add_rpc.sql`
  Replaces the old iOS Shortcuts RPC so `empty_box_add_task` writes directly to
  `empty_box_tasks` instead of the old `notes.content` JSON snapshot.

## Recommended Flow

1. Keep the three device backups somewhere safe.
2. In Supabase SQL Editor, run `001_empty_box_v2_schema.sql`.
   If a previous attempt failed midway, rerun the whole file. The schema uses
   `create table if not exists`, `drop constraint if exists`, and
   `create index if not exists`.
3. If Supabase blocks reads/writes because of RLS or grants, run
   `002_empty_box_v2_single_user_policies.sql`.
4. Run `003_empty_box_v2_quick_add_rpc.sql` so iOS Shortcuts quick-add uses the
   v2 task table. The function signature stays `empty_box_add_task(text, text)`,
   so existing Shortcuts should not need URL or body changes.
5. Put your exported backup JSON files outside the repo or under a temporary
   ignored folder.
6. Run a dry conversion:

   ```bash
   node empty-box/migrations/migrate-v1-backups-to-v2.mjs \
     /path/to/device-a-backup.json \
     /path/to/device-b-backup.json \
     /path/to/device-c-backup.json
   ```

7. Review generated files:

   ```text
   empty-box/migrations/out/empty-box-v2-summary.json
   empty-box/migrations/out/empty-box-v2-records.json
   empty-box/migrations/out/empty-box-v2-import.sql
   empty-box/migrations/out/empty-box-v2-local-import.json
   ```

8. If the summary looks right, copy `empty-box-v2-import.sql` into Supabase SQL
   Editor and run it.
9. Do not delete old `spaces` or `notes`. Keep them as rollback data until the
   v2 frontend has been tested on all devices.

## Conversion Rules

- Each backup file becomes one v2 space by default.
- Within one backup file, the same task text maps to one task record.
- Across different backup files, same text is not automatically merged.
- Inbox is created as a real group.
- Must Do tabs become groups.
- Star tasks use `is_starred` and `star_position`.
- Daily tasks use `is_daily` and `daily_position`.
- Daily completion history becomes `empty_box_daily_completions`.
- Completed history becomes `empty_box_task_completions` with text snapshots.
- Reflection text becomes one dated `empty_box_reflections` row.

## Local Browser Data

The frontend uses a v2 storage adapter for both cloud and browser-local data.
Local storage mirrors the v2 shape instead of going back to one huge state blob.

Recommended local keys:

```text
empty-box-v2::spaces
empty-box-v2::space::<spaceId>::groups
empty-box-v2::space::<spaceId>::tasks
empty-box-v2::space::<spaceId>::daily_completions
empty-box-v2::space::<spaceId>::task_completions
empty-box-v2::space::<spaceId>::reflections
```

The conversion script already generates `empty-box-v2-local-import.json` in this
shape:

```json
{
  "version": 3,
  "format": "empty-box-v2-local-import",
  "entries": {
    "empty-box-v2::spaces": [],
    "empty-box-v2::space::<spaceId>::groups": [],
    "empty-box-v2::space::<spaceId>::tasks": [],
    "empty-box-v2::space::<spaceId>::daily_completions": [],
    "empty-box-v2::space::<spaceId>::task_completions": [],
    "empty-box-v2::space::<spaceId>::reflections": []
  }
}
```

The app import flow accepts this file directly. Imported spaces are treated as
`local_only`, so a browser-local restore does not accidentally bind that data to
cloud sync.

## Rollback

Rollback is simple as long as old data is not deleted:

- Switch the frontend back to v1 storage.
- Keep using old `spaces` and `notes`.
- Restore browser backups if local state was overwritten.
