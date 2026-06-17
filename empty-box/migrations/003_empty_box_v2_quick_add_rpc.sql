-- Replaces the old iOS Shortcuts quick-add RPC that wrote notes.content JSON.
-- Keeps the same function signature so existing Shortcuts can keep calling:
-- /rest/v1/rpc/empty_box_add_task

create or replace function public.empty_box_add_task(
    p_space_id text,
    p_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    target_space_id uuid := p_space_id::uuid;
    task_text text := nullif(trim(p_text), '');
    inbox_group_id uuid;
    next_position integer;
begin
    if task_text is null then
        return;
    end if;

    if not exists (
        select 1
        from public.empty_box_spaces
        where id = target_space_id
          and deleted_at is null
    ) then
        raise exception 'empty_box_add_task: space % not found', p_space_id;
    end if;

    select id
    into inbox_group_id
    from public.empty_box_groups
    where space_id = target_space_id
      and (kind = 'inbox' or is_default = true or name = 'Inbox')
    order by is_default desc, position asc, created_at asc
    limit 1;

    if inbox_group_id is null then
        inbox_group_id := gen_random_uuid();
        insert into public.empty_box_groups (
            id, space_id, name, kind, position, is_default, created_at, updated_at
        )
        values (
            inbox_group_id, target_space_id, 'Inbox', 'inbox', 0, true, now(), now()
        );
    end if;

    if exists (
        select 1
        from public.empty_box_tasks
        where space_id = target_space_id
          and status = 'active'
          and text = task_text
    ) then
        return;
    end if;

    select coalesce(max(group_position), -1) + 1
    into next_position
    from public.empty_box_tasks
    where space_id = target_space_id
      and group_id = inbox_group_id
      and status = 'active';

    insert into public.empty_box_tasks (
        id,
        space_id,
        group_id,
        text,
        status,
        group_position,
        is_starred,
        star_position,
        is_daily,
        daily_position,
        created_at,
        updated_at,
        completed_at
    )
    values (
        gen_random_uuid(),
        target_space_id,
        inbox_group_id,
        task_text,
        'active',
        next_position,
        false,
        null,
        false,
        null,
        now(),
        now(),
        null
    );

    update public.empty_box_spaces
    set updated_at = now()
    where id = target_space_id;
end;
$$;

grant execute on function public.empty_box_add_task(text, text) to anon, authenticated;
