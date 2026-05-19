const STORAGE_KEY = 'activation-task-demo-state';
const UPDATE_PING_KEY = 'activation-task-demo-last-updated';
const SUPABASE_URL = 'https://ufwvkabshfrrodmtycjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd3ZrYWJzaGZycm9kbXR5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjg4NjMsImV4cCI6MjA5NDc0NDg2M30.kSQJBTLSjd5XhLX0cddqjUfSw0QXt-Ilr2UsGPMamIo';
const SPACE_LIST_KEY = 'empty-box-spaces-v1';
const CURRENT_SPACE_ID_KEY = 'current_space_id';
const CURRENT_STORAGE_MODE_KEY = 'current_storage_mode';
const CLOUD_STATE_SOURCE = 'empty_box_state';

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const closeBtn = document.getElementById('closeBtn');
const message = document.getElementById('message');

function createEmptyState() {
  return {
    boxTasks: [],
    completedTasks: [],
    nowTask: '',
    nowTaskStartedAt: 0,
    reflectionNote: '',
    blindboxRejectCount: 0,
    blindboxCooldownUntil: 0,
    mustDoTasks: [],
    mustDoCriteria: [
      { id: 'urgent', name: '紧急' },
      { id: 'important', name: '重要' }
    ],
    activeMustDoCriterionId: 'urgent',
    mustDoHiddenByDate: {}
  };
}

function normalizeState(parsed) {
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  const fallback = createEmptyState();
  return {
    boxTasks: Array.isArray(source.boxTasks) ? source.boxTasks.filter(Boolean) : [],
    completedTasks: Array.isArray(source.completedTasks) ? source.completedTasks.filter(Boolean) : [],
    nowTask: typeof source.nowTask === 'string' ? source.nowTask : '',
    nowTaskStartedAt: Number.isFinite(source.nowTaskStartedAt) ? source.nowTaskStartedAt : 0,
    reflectionNote: typeof source.reflectionNote === 'string' ? source.reflectionNote : '',
    blindboxRejectCount: Number.isFinite(source.blindboxRejectCount) ? source.blindboxRejectCount : 0,
    blindboxCooldownUntil: Number.isFinite(source.blindboxCooldownUntil) ? source.blindboxCooldownUntil : 0,
    mustDoTasks: Array.isArray(source.mustDoTasks) ? source.mustDoTasks.filter(Boolean) : [],
    mustDoCriteria: Array.isArray(source.mustDoCriteria) && source.mustDoCriteria.length ? source.mustDoCriteria : fallback.mustDoCriteria,
    activeMustDoCriterionId: typeof source.activeMustDoCriterionId === 'string' ? source.activeMustDoCriterionId : fallback.activeMustDoCriterionId,
    mustDoHiddenByDate: source.mustDoHiddenByDate && typeof source.mustDoHiddenByDate === 'object' ? source.mustDoHiddenByDate : {}
  };
}

function readJson(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function spaceStateKey(spaceId) {
  return `${STORAGE_KEY}::space::${spaceId}`;
}

function getSpaces() {
  const spaces = readJson(SPACE_LIST_KEY, []);
  return Array.isArray(spaces) ? spaces : [];
}

function getCurrentSpace() {
  const currentId = localStorage.getItem(CURRENT_SPACE_ID_KEY);
  return getSpaces().find(space => space.id === currentId) || null;
}

function getSupabaseHeaders(extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: getSupabaseHeaders(options.headers || {})
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Supabase ${response.status}: ${detail || response.statusText}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function loadState() {
  const space = getCurrentSpace();
  try {
    if (!space) return normalizeState(readJson(STORAGE_KEY, {}));
    if (space.storage_mode === 'cloud_sync') {
      const rows = await supabaseRequest(`notes?space_id=eq.${encodeURIComponent(space.id)}&source=eq.${encodeURIComponent(CLOUD_STATE_SOURCE)}&order=updated_at.desc`);
      const snapshot = rows && rows[0];
      return snapshot ? normalizeState(JSON.parse(snapshot.content || '{}')) : createEmptyState();
    }
    return normalizeState(readJson(spaceStateKey(space.id), {}));
  } catch {
    return normalizeState(readJson(STORAGE_KEY, {}));
  }
}

async function saveState(state) {
  const normalized = normalizeState(state);
  const space = getCurrentSpace();

  if (!space) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
    return;
  }

  if (space.storage_mode === 'cloud_sync') {
    const now = new Date().toISOString();
    const noteId = `state-${space.id}`;
    const note = {
      id: noteId,
      owner_id: null,
      space_id: space.id,
      content: JSON.stringify(normalized),
      source: CLOUD_STATE_SOURCE,
      old_local_id: space.id,
      created_at: now,
      updated_at: now
    };
    const existing = await supabaseRequest(`notes?id=eq.${encodeURIComponent(noteId)}&select=id`);
    if (existing.length) {
      await supabaseRequest(`notes?id=eq.${encodeURIComponent(noteId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: note.content,
          source: note.source,
          old_local_id: note.old_local_id,
          updated_at: note.updated_at
        })
      });
      localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
      return;
    }
    await supabaseRequest('notes', {
      method: 'POST',
      body: JSON.stringify(note)
    });
  } else {
    localStorage.setItem(spaceStateKey(space.id), JSON.stringify(normalized));
  }
  localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
}

async function addToBoxQuick(value) {
  const text = value.trim();
  if (!text) {
    return { ok: false, reason: 'empty' };
  }

  const state = await loadState();

  if (
    state.boxTasks.includes(text) ||
    state.completedTasks.includes(text) ||
    text === state.nowTask
  ) {
    return { ok: false, reason: 'duplicate' };
  }

  state.boxTasks.unshift(text);
  await saveState(state);
  return { ok: true };
}

function setMessage(text, type) {
  message.textContent = text;
  message.className = 'message' + (type ? ' ' + type : '');
}

function tryCloseWindow() {
  window.close();

  setTimeout(() => {
    setMessage('已添加，可以直接关闭这个窗口。', 'success');
  }, 200);
}

async function submit() {
  const result = await addToBoxQuick(taskInput.value);

  if (!result.ok) {
    if (result.reason === 'empty') {
      setMessage('任务不能为空。', 'error');
    } else if (result.reason === 'duplicate') {
      setMessage('任务已存在，不重复添加。', 'error');
    } else {
      setMessage('添加失败。', 'error');
    }
    return;
  }

  setMessage('已添加。', 'success');
  taskInput.value = '';
  tryCloseWindow();
}

function readPrefill() {
  const params = new URLSearchParams(window.location.search);
  return (params.get('text') || '').trim();
}

const prefill = readPrefill();
if (prefill) {
  taskInput.value = prefill;
}

setTimeout(() => {
  taskInput.focus();
  taskInput.select();
}, 50);

addBtn.addEventListener('click', submit);
closeBtn.addEventListener('click', () => window.close());

taskInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submit();
  } else if (e.key === 'Escape') {
    window.close();
  }
});
