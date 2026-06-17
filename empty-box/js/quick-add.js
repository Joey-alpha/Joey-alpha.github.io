const UPDATE_PING_KEY = 'activation-task-demo-last-updated';
const MUST_DO_INBOX_CRITERION_ID = '__inbox__';
const { normalizeState } = window.EmptyBoxState;
const StorageService = window.EmptyBoxStorage;

const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const closeBtn = document.getElementById('closeBtn');
const message = document.getElementById('message');
let isSubmitting = false;

async function loadState() {
  try {
    return await StorageService.getCurrentState();
  } catch {
    return normalizeState({});
  }
}

async function saveState(state) {
  await StorageService.saveAppState(normalizeState(state));
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
