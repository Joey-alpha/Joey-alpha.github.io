-- Empty Box v2 schema.
-- Safe to run alongside the old spaces/notes snapshot schema.
-- This file intentionally does not drop or modify existing spaces/notes tables.

create extension if not exists pgcrypto;

create table if not exists public.empty_box_spaces (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid null,
    name text not null,
    storage_mode text not null default 'cloud_sync',
    active_group_id uuid null,
    pinned_group_id uuid null,
    current_task_id uuid null,
    current_task_started_at timestamptz null,
    blindbox_reject_count integer not null default 0,
    blindbox_cooldown_until timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz null,
    constraint empty_box_spaces_storage_mode_check
        check (storage_mode in ('cloud_sync', 'local_only'))
);

create table if not exists public.empty_box_groups (
    id uuid primary key default gen_random_uuid(),
    space_id uuid not null references public.empty_box_spaces(id) on delete cascade,
    name text not null,
    kind text not null default 'custom',
    position integer not null default 0,
    is_default boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint empty_box_groups_kind_check
        check (kind in ('inbox', 'custom')),
    constraint empty_box_groups_space_name_unique
        unique (space_id, name)
);

create table if not exists public.empty_box_tasks (
    id uuid primary key default gen_random_uuid(),
    space_id uuid not null references public.empty_box_spaces(id) on delete cascade,
    group_id uuid null references public.empty_box_groups(id) on delete set null,
    text text not null,
    status text not null default 'active',
    group_position integer not null default 0,
    is_starred boolean not null default false,
    star_position integer null,
    is_daily boolean not null default false,
    daily_position integer null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz null,
    constraint empty_box_tasks_status_check
        check (status in ('active', 'completed', 'archived'))
);

create table if not exists public.empty_box_daily_completions (
    id uuid primary key default gen_random_uuid(),
    space_id uuid not null references public.empty_box_spaces(id) on delete cascade,
    task_id uuid not null references public.empty_box_tasks(id) on delete cascade,
    date_key date not null,
    completed_at timestamptz not null default now(),
    constraint empty_box_daily_completions_task_date_unique
        unique (task_id, date_key)
);

create table if not exists public.empty_box_task_completions (
    id uuid primary key default gen_random_uuid(),
    space_id uuid not null references public.empty_box_spaces(id) on delete cascade,
    task_id uuid null references public.empty_box_tasks(id) on delete set null,
    task_text_snapshot text not null,
    tags text[] not null default '{}',
    completed_at timestamptz not null default now()
);

create table if not exists public.empty_box_reflections (
    id uuid primary key default gen_random_uuid(),
    space_id uuid not null references public.empty_box_spaces(id) on delete cascade,
    date_key date not null,
    content text not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint empty_box_reflections_space_date_unique
        unique (space_id, date_key)
);

alter table public.empty_box_spaces
    drop constraint if exists empty_box_spaces_active_group_fk;

alter table public.empty_box_spaces
    add constraint empty_box_spaces_active_group_fk
    foreign key (active_group_id)
    references public.empty_box_groups(id)
    on delete set null;

alter table public.empty_box_spaces
    drop constraint if exists empty_box_spaces_pinned_group_fk;

alter table public.empty_box_spaces
    add constraint empty_box_spaces_pinned_group_fk
    foreign key (pinned_group_id)
    references public.empty_box_groups(id)
    on delete set null;

alter table public.empty_box_spaces
    drop constraint if exists empty_box_spaces_current_task_fk;

alter table public.empty_box_spaces
    add constraint empty_box_spaces_current_task_fk
    foreign key (current_task_id)
    references public.empty_box_tasks(id)
    on delete set null;

create index if not exists empty_box_groups_space_position_idx
    on public.empty_box_groups (space_id, position);

create index if not exists empty_box_tasks_space_group_position_idx
    on public.empty_box_tasks (space_id, group_id, group_position);

create index if not exists empty_box_tasks_space_star_idx
    on public.empty_box_tasks (space_id, is_starred, star_position)
    where is_starred = true;

create index if not exists empty_box_tasks_space_daily_idx
    on public.empty_box_tasks (space_id, is_daily, daily_position)
    where is_daily = true;

create index if not exists empty_box_daily_completions_space_date_idx
    on public.empty_box_daily_completions (space_id, date_key);

create index if not exists empty_box_task_completions_space_completed_idx
    on public.empty_box_task_completions (space_id, completed_at desc);

create index if not exists empty_box_reflections_space_date_idx
    on public.empty_box_reflections (space_id, date_key desc);
