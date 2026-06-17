#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

const OUT_DIR = resolve('empty-box/migrations/out');
const INBOX_ID = '__inbox__';
const LOCAL_V2_SPACE_KEY = 'empty-box-v2::spaces';

function usage() {
  console.error('Usage: node empty-box/migrations/migrate-v1-backups-to-v2.mjs backup-a.json backup-b.json ...');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeTaskList(value, dedupe = true) {
  const tasks = asArray(value)
    .map(task => typeof task === 'string' ? task.trim() : '')
    .filter(Boolean);
  return dedupe ? [...new Set(tasks)] : tasks;
}

function toIso(value, fallback) {
  if (Number.isFinite(value) && value > 0) return new Date(value).toISOString();
  if (typeof value === 'string' && value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return fallback;
}

function toDateKey(value) {
  return String(value || new Date().toISOString()).slice(0, 10);
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlUuid(value) {
  return value ? `${sqlString(value)}::uuid` : 'null';
}

function sqlTextArray(values) {
  const items = asArray(values).map(sqlString);
  return items.length ? `array[${items.join(', ')}]::text[]` : "'{}'::text[]";
}

function extractState(payload) {
  return payload && payload.version === 2 && payload.state ? payload.state : payload;
}

function pickSpaceName(payload, filePath, index) {
  if (payload && payload.version === 2) {
    const current = asArray(payload.spaces).find(space => space.id === payload.current_space_id);
    if (current?.name) return `${current.name} migrated ${index + 1}`;
  }
  return basename(filePath, '.json').replaceAll('_', ' ').replaceAll('-', ' ');
}

function createUniqueGroupName(rawName, usedNames) {
  const baseName = String(rawName || '').trim() || '分组';
  let name = baseName;
  let index = 2;
  while (usedNames.has(name)) {
    name = `${baseName} ${index}`;
    index += 1;
  }
  usedNames.add(name);
  return name;
}

function createGroupRecords({ state, spaceId, exportedAt }) {
  const oldToNewGroupId = new Map();
  const groups = [];
  const usedGroupNames = new Set(['Inbox']);

  const inboxUuid = randomUUID();
  oldToNewGroupId.set(INBOX_ID, inboxUuid);
  groups.push({
    id: inboxUuid,
    space_id: spaceId,
    name: 'Inbox',
    kind: 'inbox',
    position: 0,
    is_default: true,
    created_at: exportedAt,
    updated_at: exportedAt
  });

  asArray(state.mustDoCriteria).forEach((criterion, index) => {
    const rawName = typeof criterion === 'string' ? criterion : criterion?.name;
    const oldId = typeof criterion === 'object' && criterion?.id ? criterion.id : `criterion-${index}`;
    if (!String(rawName || '').trim() || oldId === INBOX_ID) return;
    const name = createUniqueGroupName(rawName, usedGroupNames);
    const id = randomUUID();
    oldToNewGroupId.set(oldId, id);
    groups.push({
      id,
      space_id: spaceId,
      name,
      kind: 'custom',
      position: index + 1,
      is_default: false,
      created_at: exportedAt,
      updated_at: exportedAt
    });
  });

  return { groups, oldToNewGroupId };
}

function createTaskRecords({ state, spaceId, exportedAt, oldToNewGroupId }) {
  const taskTexts = normalizeTaskList([
    ...asArray(state.boxTasks),
    state.nowTask,
    ...asArray(state.mustDoTasks),
    ...asArray(state.dailyTasks)
  ]);
  const taskByText = new Map();
  const groupPositions = new Map();

  Object.entries(state.mustDoTaskOrder || {}).forEach(([oldGroupId, orderedTasks]) => {
    normalizeTaskList(orderedTasks).forEach((task, index) => {
      groupPositions.set(`${oldGroupId}:${task}`, index);
      if (!taskByText.has(task) && !taskTexts.includes(task)) taskTexts.push(task);
    });
  });

  const boxPosition = new Map(normalizeTaskList(state.boxTasks).map((task, index) => [task, index]));
  const starredPosition = new Map(normalizeTaskList(state.mustDoTasks).map((task, index) => [task, index]));
  const dailyPosition = new Map(normalizeTaskList(state.dailyTasks).map((task, index) => [task, index]));

  const tasks = taskTexts.map((text, index) => {
    const oldGroupId = state.mustDoTaskGroups?.[text] || INBOX_ID;
    const groupId = oldToNewGroupId.get(oldGroupId) || oldToNewGroupId.get(INBOX_ID);
    const groupPosition = groupPositions.get(`${oldGroupId}:${text}`) ?? boxPosition.get(text) ?? index;
    const id = randomUUID();
    const task = {
      id,
      space_id: spaceId,
      group_id: groupId,
      text,
      status: 'active',
      group_position: groupPosition,
      is_starred: starredPosition.has(text),
      star_position: starredPosition.has(text) ? starredPosition.get(text) : null,
      is_daily: dailyPosition.has(text),
      daily_position: dailyPosition.has(text) ? dailyPosition.get(text) : null,
      created_at: exportedAt,
      updated_at: exportedAt,
      completed_at: null
    };
    taskByText.set(text, task);
    return task;
  });

  return { tasks, taskByText };
}

function parseCompletionRecord(record) {
  const value = String(record || '');
  const match = value.match(/^(.*?)【(.+)】$/);
  if (!match) return { text: value, tags: [] };
  return {
    text: match[1],
    tags: match[2].split('·').map(item => item.trim()).filter(Boolean)
  };
}

function convertBackup(payload, filePath, index) {
  const state = extractState(payload) || {};
  const exportedAt = toIso(payload?.exported_at, new Date().toISOString());
  const spaceId = randomUUID();
  const { groups, oldToNewGroupId } = createGroupRecords({ state, spaceId, exportedAt });
  const { tasks, taskByText } = createTaskRecords({ state, spaceId, exportedAt, oldToNewGroupId });
  const activeGroupId = oldToNewGroupId.get(state.activeMustDoCriterionId || INBOX_ID) || oldToNewGroupId.get(INBOX_ID);
  const pinnedGroupId = oldToNewGroupId.get(state.pinnedMustDoCriterionId || '') || null;
  const currentTask = state.nowTask ? taskByText.get(state.nowTask) : null;

  const space = {
    id: spaceId,
    owner_id: null,
    name: pickSpaceName(payload, filePath, index),
    storage_mode: 'cloud_sync',
    active_group_id: activeGroupId,
    pinned_group_id: pinnedGroupId,
    current_task_id: currentTask?.id || null,
    current_task_started_at: currentTask ? toIso(state.nowTaskStartedAt, exportedAt) : null,
    blindbox_reject_count: Number.isFinite(state.blindboxRejectCount) ? state.blindboxRejectCount : 0,
    blindbox_cooldown_until: toIso(state.blindboxCooldownUntil, null),
    created_at: exportedAt,
    updated_at: exportedAt,
    deleted_at: null
  };

  const dailyCompletions = [];
  Object.entries(state.dailyCompletedByDate || {}).forEach(([dateKey, completedTasks]) => {
    normalizeTaskList(completedTasks).forEach(text => {
      const task = taskByText.get(text);
      if (!task) return;
      dailyCompletions.push({
        id: randomUUID(),
        space_id: spaceId,
        task_id: task.id,
        date_key: dateKey,
        completed_at: `${dateKey}T00:00:00.000Z`
      });
    });
  });

  const completions = normalizeTaskList(state.completedTasks, false).map((record, completionIndex) => {
    const parsed = parseCompletionRecord(record);
    const task = taskByText.get(parsed.text);
    const completedAt = new Date(new Date(exportedAt).getTime() + completionIndex * 1000).toISOString();
    return {
      id: randomUUID(),
      space_id: spaceId,
      task_id: task?.id || null,
      task_text_snapshot: parsed.text,
      tags: parsed.tags,
      completed_at: completedAt
    };
  });

  const reflections = state.reflectionNote ? [{
    id: randomUUID(),
    space_id: spaceId,
    date_key: toDateKey(exportedAt),
    content: state.reflectionNote,
    created_at: exportedAt,
    updated_at: exportedAt
  }] : [];

  return { space, groups, tasks, dailyCompletions, completions, reflections };
}

function valuesSql(records, columns, formatters) {
  if (!records.length) return '';
  return records.map(record => `(${columns.map(column => formatters[column](record[column])).join(', ')})`).join(',\n');
}

function buildImportSql(records) {
  const lines = [
    '-- Generated by migrate-v1-backups-to-v2.mjs.',
    '-- Review before running in Supabase SQL Editor.',
    'begin;'
  ];

  const spacesWithoutRefs = records.spaces.map(space => ({
    ...space,
    active_group_id: null,
    pinned_group_id: null,
    current_task_id: null
  }));

  const spaceColumns = ['id', 'owner_id', 'name', 'storage_mode', 'active_group_id', 'pinned_group_id', 'current_task_id', 'current_task_started_at', 'blindbox_reject_count', 'blindbox_cooldown_until', 'created_at', 'updated_at', 'deleted_at'];
  const groupColumns = ['id', 'space_id', 'name', 'kind', 'position', 'is_default', 'created_at', 'updated_at'];
  const taskColumns = ['id', 'space_id', 'group_id', 'text', 'status', 'group_position', 'is_starred', 'star_position', 'is_daily', 'daily_position', 'created_at', 'updated_at', 'completed_at'];
  const dailyColumns = ['id', 'space_id', 'task_id', 'date_key', 'completed_at'];
  const completionColumns = ['id', 'space_id', 'task_id', 'task_text_snapshot', 'tags', 'completed_at'];
  const reflectionColumns = ['id', 'space_id', 'date_key', 'content', 'created_at', 'updated_at'];

  const f = {
    id: sqlUuid,
    owner_id: sqlUuid,
    space_id: sqlUuid,
    group_id: sqlUuid,
    task_id: sqlUuid,
    active_group_id: sqlUuid,
    pinned_group_id: sqlUuid,
    current_task_id: sqlUuid,
    name: sqlString,
    storage_mode: sqlString,
    kind: sqlString,
    text: sqlString,
    status: sqlString,
    task_text_snapshot: sqlString,
    content: sqlString,
    date_key: value => sqlString(value),
    tags: sqlTextArray,
    position: value => String(value),
    group_position: value => String(value),
    star_position: value => value === null ? 'null' : String(value),
    daily_position: value => value === null ? 'null' : String(value),
    blindbox_reject_count: value => String(value || 0),
    is_default: value => value ? 'true' : 'false',
    is_starred: value => value ? 'true' : 'false',
    is_daily: value => value ? 'true' : 'false',
    current_task_started_at: value => value ? `${sqlString(value)}::timestamptz` : 'null',
    blindbox_cooldown_until: value => value ? `${sqlString(value)}::timestamptz` : 'null',
    created_at: value => `${sqlString(value)}::timestamptz`,
    updated_at: value => `${sqlString(value)}::timestamptz`,
    completed_at: value => value ? `${sqlString(value)}::timestamptz` : 'null',
    deleted_at: value => value ? `${sqlString(value)}::timestamptz` : 'null'
  };

  const inserts = [
    ['empty_box_spaces', spaceColumns, spacesWithoutRefs],
    ['empty_box_groups', groupColumns, records.groups],
    ['empty_box_tasks', taskColumns, records.tasks],
    ['empty_box_daily_completions', dailyColumns, records.dailyCompletions],
    ['empty_box_task_completions', completionColumns, records.completions],
    ['empty_box_reflections', reflectionColumns, records.reflections]
  ];

  inserts.forEach(([table, columns, rows]) => {
    if (!rows.length) return;
    lines.push(`insert into public.${table} (${columns.join(', ')}) values`);
    lines.push(`${valuesSql(rows, columns, f)};`);
  });

  records.spaces.forEach(space => {
    lines.push(
      'update public.empty_box_spaces set ' +
      `active_group_id = ${sqlUuid(space.active_group_id)}, ` +
      `pinned_group_id = ${sqlUuid(space.pinned_group_id)}, ` +
      `current_task_id = ${sqlUuid(space.current_task_id)} ` +
      `where id = ${sqlUuid(space.id)};`
    );
  });

  lines.push('commit;');
  return `${lines.join('\n')}\n`;
}

function localSpaceKey(spaceId, collection) {
  return `empty-box-v2::space::${spaceId}::${collection}`;
}

function groupBySpace(records) {
  return records.reduce((bySpace, record) => {
    if (!bySpace[record.space_id]) bySpace[record.space_id] = [];
    bySpace[record.space_id].push(record);
    return bySpace;
  }, {});
}

function buildLocalImport(records, summary) {
  const groupsBySpace = groupBySpace(records.groups);
  const tasksBySpace = groupBySpace(records.tasks);
  const dailyCompletionsBySpace = groupBySpace(records.dailyCompletions);
  const taskCompletionsBySpace = groupBySpace(records.completions);
  const reflectionsBySpace = groupBySpace(records.reflections);
  const entries = {
    [LOCAL_V2_SPACE_KEY]: records.spaces
  };

  records.spaces.forEach(space => {
    entries[localSpaceKey(space.id, 'groups')] = groupsBySpace[space.id] || [];
    entries[localSpaceKey(space.id, 'tasks')] = tasksBySpace[space.id] || [];
    entries[localSpaceKey(space.id, 'daily_completions')] = dailyCompletionsBySpace[space.id] || [];
    entries[localSpaceKey(space.id, 'task_completions')] = taskCompletionsBySpace[space.id] || [];
    entries[localSpaceKey(space.id, 'reflections')] = reflectionsBySpace[space.id] || [];
  });

  return {
    version: 3,
    format: 'empty-box-v2-local-import',
    generated_at: new Date().toISOString(),
    summary,
    keys: {
      spaces: LOCAL_V2_SPACE_KEY,
      space_prefix: 'empty-box-v2::space::<spaceId>::'
    },
    entries
  };
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    usage();
    process.exit(1);
  }

  const converted = [];
  for (const [index, file] of files.entries()) {
    const filePath = resolve(file);
    const payload = JSON.parse(await readFile(filePath, 'utf8'));
    converted.push(convertBackup(payload, filePath, index));
  }

  const records = {
    spaces: converted.map(item => item.space),
    groups: converted.flatMap(item => item.groups),
    tasks: converted.flatMap(item => item.tasks),
    dailyCompletions: converted.flatMap(item => item.dailyCompletions),
    completions: converted.flatMap(item => item.completions),
    reflections: converted.flatMap(item => item.reflections)
  };

  const summary = {
    input_files: files.map(file => basename(file)),
    spaces: records.spaces.length,
    groups: records.groups.length,
    tasks: records.tasks.length,
    daily_completions: records.dailyCompletions.length,
    task_completions: records.completions.length,
    reflections: records.reflections.length
  };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'empty-box-v2-records.json'), `${JSON.stringify({ summary, records }, null, 2)}\n`);
  await writeFile(join(OUT_DIR, 'empty-box-v2-import.sql'), buildImportSql(records));
  await writeFile(join(OUT_DIR, 'empty-box-v2-local-import.json'), `${JSON.stringify(buildLocalImport(records, summary), null, 2)}\n`);
  await writeFile(join(OUT_DIR, 'empty-box-v2-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote ${join(OUT_DIR, 'empty-box-v2-records.json')}`);
  console.log(`Wrote ${join(OUT_DIR, 'empty-box-v2-import.sql')}`);
  console.log(`Wrote ${join(OUT_DIR, 'empty-box-v2-local-import.json')}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
