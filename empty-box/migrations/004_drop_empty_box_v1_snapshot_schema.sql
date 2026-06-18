-- Run manually only after current empty_box_* data has been verified.
-- This removes the old Empty Box v1 snapshot tables that stored state in
-- public.notes.content and listed spaces in public.spaces.

drop table if exists public.notes cascade;
drop table if exists public.spaces cascade;
