-- Optional single-user policies for the current anon-key app.
--
-- This matches the current app model where the browser uses the Supabase anon
-- key directly and there is no login identity yet.
--
-- Security note:
-- These policies are permissive. They are convenient for a single-user personal
-- app, but they are not appropriate for a multi-user product. If auth is added
-- later, replace these with owner_id = auth.uid() policies.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.empty_box_spaces to anon, authenticated;
grant select, insert, update, delete on public.empty_box_groups to anon, authenticated;
grant select, insert, update, delete on public.empty_box_tasks to anon, authenticated;
grant select, insert, update, delete on public.empty_box_daily_completions to anon, authenticated;
grant select, insert, update, delete on public.empty_box_task_completions to anon, authenticated;
grant select, insert, update, delete on public.empty_box_reflections to anon, authenticated;

alter table public.empty_box_spaces enable row level security;
alter table public.empty_box_groups enable row level security;
alter table public.empty_box_tasks enable row level security;
alter table public.empty_box_daily_completions enable row level security;
alter table public.empty_box_task_completions enable row level security;
alter table public.empty_box_reflections enable row level security;

drop policy if exists "single user read spaces" on public.empty_box_spaces;
create policy "single user read spaces"
    on public.empty_box_spaces for select
    using (true);

drop policy if exists "single user write spaces" on public.empty_box_spaces;
create policy "single user write spaces"
    on public.empty_box_spaces for all
    using (true)
    with check (true);

drop policy if exists "single user read groups" on public.empty_box_groups;
create policy "single user read groups"
    on public.empty_box_groups for select
    using (true);

drop policy if exists "single user write groups" on public.empty_box_groups;
create policy "single user write groups"
    on public.empty_box_groups for all
    using (true)
    with check (true);

drop policy if exists "single user read tasks" on public.empty_box_tasks;
create policy "single user read tasks"
    on public.empty_box_tasks for select
    using (true);

drop policy if exists "single user write tasks" on public.empty_box_tasks;
create policy "single user write tasks"
    on public.empty_box_tasks for all
    using (true)
    with check (true);

drop policy if exists "single user read daily completions" on public.empty_box_daily_completions;
create policy "single user read daily completions"
    on public.empty_box_daily_completions for select
    using (true);

drop policy if exists "single user write daily completions" on public.empty_box_daily_completions;
create policy "single user write daily completions"
    on public.empty_box_daily_completions for all
    using (true)
    with check (true);

drop policy if exists "single user read task completions" on public.empty_box_task_completions;
create policy "single user read task completions"
    on public.empty_box_task_completions for select
    using (true);

drop policy if exists "single user write task completions" on public.empty_box_task_completions;
create policy "single user write task completions"
    on public.empty_box_task_completions for all
    using (true)
    with check (true);

drop policy if exists "single user read reflections" on public.empty_box_reflections;
create policy "single user read reflections"
    on public.empty_box_reflections for select
    using (true);

drop policy if exists "single user write reflections" on public.empty_box_reflections;
create policy "single user write reflections"
    on public.empty_box_reflections for all
    using (true)
    with check (true);
