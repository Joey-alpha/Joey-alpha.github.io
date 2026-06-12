const STORAGE_KEY = 'activation-task-demo-state';
const UPDATE_PING_KEY = 'activation-task-demo-last-updated';
const SUPABASE_URL = 'https://ufwvkabshfrrodmtycjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd3ZrYWJzaGZycm9kbXR5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjg4NjMsImV4cCI6MjA5NDc0NDg2M30.kSQJBTLSjd5XhLX0cddqjUfSw0QXt-Ilr2UsGPMamIo';
const SPACE_LIST_KEY = 'empty-box-spaces-v1';
const CURRENT_SPACE_ID_KEY = 'current_space_id';
const CURRENT_STORAGE_MODE_KEY = 'current_storage_mode';
const CLOUD_STATE_SOURCE = 'empty_box_state';
const MUST_DO_INBOX_CRITERION_ID = '__inbox__';
const { createEmptyState, normalizeState } = window.EmptyBoxState;

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const closeBtn = document.getElementById('closeBtn');
const message = document.getElementById('message');
let isSubmitting = false;

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
    state.mustDoTasks.includes(text) ||
    state.dailyTasks.includes(text) ||
    text === state.nowTask
  ) {
    return { ok: false, reason: 'duplicate' };
  }

  state.boxTasks.push(text);
  // Keep the main app's tab order cache in sync with bottom insertion.
  Object.keys(state.mustDoTaskOrder).forEach(groupId => {
    state.mustDoTaskOrder[groupId] = Array.isArray(state.mustDoTaskOrder[groupId])
      ? state.mustDoTaskOrder[groupId].filter(task => task !== text)
      : [];
  });
  state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION_ID] = [
    ...(Array.isArray(state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION_ID])
      ? state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION_ID]
      : []),
    text
  ];
  await saveState(state);
  return { ok: true };
}

function setMessage(text, type) {
  message.textContent = text;
  message.className = 'message' + (type ? ' ' + type : '');
}

function setSubmitting(nextSubmitting) {
  isSubmitting = nextSubmitting;
  taskInput.disabled = nextSubmitting;
  addBtn.disabled = nextSubmitting;
  addBtn.textContent = nextSubmitting ? '添加中…' : '放进 box';
}

function tryCloseWindow() {
  window.close();

  setTimeout(() => {
    setMessage('已添加，可以直接关闭这个窗口。', 'success');
  }, 200);
}

async function submit() {
  if (isSubmitting) return;
  setSubmitting(true);
  setMessage('添加中…', '');

  let result;
  try {
    result = await addToBoxQuick(taskInput.value);
  } catch (error) {
    console.error(error);
    setSubmitting(false);
    setMessage('添加失败。', 'error');
    return;
  }

  if (!result.ok) {
    setSubmitting(false);
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
  setSubmitting(false);
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
  if (e.isComposing) return;
  if (e.key === 'Enter') {
    e.preventDefault();
    submit();
  } else if (e.key === 'Escape') {
    window.close();
  }
});
