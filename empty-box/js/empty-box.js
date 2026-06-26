const StorageService = window.EmptyBoxStorage;
const Dialogs = window.EmptyBoxDialogs;
const TaskActions = window.EmptyBoxTaskActions;
const HomeLists = window.EmptyBoxHomeLists;
const ItemTabs = window.EmptyBoxItemTabs;
const ItemManager = window.EmptyBoxItemManager;
const TaskModel = window.EmptyBoxTaskModel;
const Settings = window.EmptyBoxSettings;
const { UPDATE_PING_KEY } = StorageService.keys;
const { formatErrorMessage } = StorageService;
const {
    MUST_DO_INBOX_CRITERION: INBOX_TAB,
    cloneDefaultMustDoCriteria: cloneDefaultTabs,
    createMustDoCriterionId: createTabId,
    isInboxMustDoCriterion: isInboxTab,
    normalizeTaskList,
    normalizeState,
    createEmptyState
} = window.EmptyBoxState;
const STAR_TASK_LIMIT = 6;
const TAB_DOUBLE_TAP_MS = 360;
const TAB_TAP_MOVE_PX = 12;
const TAB_HIDDEN_RETENTION_DAYS = 30;
const QUOTE_ROTATION_MS = 2 * 60 * 60 * 1000;
const EDITING_LINE_BREAK_PLACEHOLDER = '\u200b';
const QUOTES = [
    { theme: '斯多葛', text: '控制可控，接受不可控。' },
    { theme: '斯多葛', text: '外界不可测，心境可调。' },
    { theme: '斯多葛', text: '今天的选择，胜过昨日的悔恨。' },
    { theme: '斯多葛', text: '不因他人而动摇，不因境遇而忧虑。' },
    { theme: '斯多葛', text: '简单生活，自在心灵。' },
    { theme: '斯多葛', text: '痛苦是成长的契机。' },
    { theme: '斯多葛', text: '情绪源于判断，非事件本身。' },
    { theme: '斯多葛', text: '忍耐即力量。' },
    { theme: '斯多葛', text: '面对命运，坦然无惧。' },
    { theme: '斯多葛', text: '拥抱理性，而非激情。' },
    { theme: '斯多葛', text: '每一次挑战都是自我试炼。' },
    { theme: '斯多葛', text: '内心宁静，比外界财富更珍贵。' },
    { theme: '斯多葛', text: '少欲知足，心无挂碍。' },
    { theme: '斯多葛', text: '善待自己，善待他人。' },
    { theme: '斯多葛', text: '以德为导，而非名利。' },
    { theme: '斯多葛', text: '冷静观察，明智行动。' },
    { theme: '斯多葛', text: '一切皆暂时，唯品行永存。' },
    { theme: '斯多葛', text: '接受批评，修正自我。' },
    { theme: '斯多葛', text: '不抱怨，不责怪，不逃避。' },
    { theme: '斯多葛', text: '今日之所做，决定明日之自由。' },
    { theme: '塔勒布', text: '小心黑天鹅，尊重未知。' },
    { theme: '塔勒布', text: '抵御脆弱，拥抱反脆弱。' },
    { theme: '塔勒布', text: '运气不可控，但抗压可练。' },
    { theme: '塔勒布', text: '不要依赖线性预测。' },
    { theme: '塔勒布', text: '经验有限，谨慎 extrapolate。' },
    { theme: '塔勒布', text: '风险意识，高于过度自信。' },
    { theme: '塔勒布', text: '随机性是真实的朋友。' },
    { theme: '塔勒布', text: '少即是多，冗余即安全。' },
    { theme: '塔勒布', text: '不确定性才是常态。' },
    { theme: '塔勒布', text: '用失败学习，用波动成长。' },
    { theme: '塔勒布', text: '不要被过往成功迷惑。' },
    { theme: '塔勒布', text: '审慎而非盲目。' },
    { theme: '塔勒布', text: '可承受的错误，才是智慧投资。' },
    { theme: '塔勒布', text: '不预测未来，准备应对未来。' },
    { theme: '塔勒布', text: '小机会，大影响。' },
    { theme: '塔勒布', text: '拥抱波动，而非恐惧波动。' },
    { theme: '塔勒布', text: '不要把人生赌在概率之外。' },
    { theme: '塔勒布', text: '简单策略，胜过复杂模型。' },
    { theme: '塔勒布', text: '经验教训，胜过理论臆测。' },
    { theme: '塔勒布', text: '反脆弱者，笑对混沌。' },
    { theme: '时间管理', text: '今日事，今日毕。' },
    { theme: '时间管理', text: '时间是最稀缺的资源。' },
    { theme: '时间管理', text: '划定界限，专注高效。' },
    { theme: '时间管理', text: '每一分钟都值得投资。' },
    { theme: '时间管理', text: '先做重要事，再做紧急事。' },
    { theme: '时间管理', text: '计划不等于行动，行动才有效。' },
    { theme: '时间管理', text: '拒绝拖延，从第一步开始。' },
    { theme: '时间管理', text: '小步快跑，累积大成。' },
    { theme: '时间管理', text: '断舍离时间浪费。' },
    { theme: '时间管理', text: '日清日结，清爽心境。' },
    { theme: '时间管理', text: '时间管理，是自我尊重。' },
    { theme: '时间管理', text: '一次只做一件事。' },
    { theme: '时间管理', text: '用好番茄钟，战胜分心。' },
    { theme: '时间管理', text: '优先级高于数量。' },
    { theme: '时间管理', text: '预留缓冲，避免仓促。' },
    { theme: '时间管理', text: '每天总结，提升效率。' },
    { theme: '时间管理', text: '不被紧急牵制，掌控主动权。' },
    { theme: '时间管理', text: '目标明确，行动有的放矢。' },
    { theme: '时间管理', text: '时间不等人，安排不拖延。' },
    { theme: '时间管理', text: '好的开始，是时间管理的一半。' }
];

const body = document.body;
const hour = new Date().getHours();
const systemDarkModeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
const greeting = document.getElementById('greeting');
const timeText = document.getElementById('timeText');
const ambientHint = document.getElementById('ambientHint');
const quoteStrip = document.getElementById('quoteStrip');

const nowTaskText = document.getElementById('nowTaskText');
const completeNowBtn = document.getElementById('completeNowBtn');
const reflectionTextarea = document.getElementById('reflectionTextarea');
const reflectionCompletedList = document.getElementById('reflectionCompletedList');
const reflectionCountText = document.getElementById('reflectionCountText');

const addFab = document.getElementById('addFab');
const searchFab = document.getElementById('searchFab');
const blindboxFab = document.getElementById('blindboxFab');
const settingsFab = document.getElementById('settingsFab');
const reflectionFab = document.getElementById('reflectionFab');
const undoFab = document.getElementById('undoFab');

const searchOverlay = document.getElementById('searchOverlay');
const addOverlay = document.getElementById('addOverlay');
const blindboxOverlay = document.getElementById('blindboxOverlay');
const reflectionOverlay = document.getElementById('reflectionOverlay');
const settingsOverlay = document.getElementById('settingsOverlay');
const tabOverlay = document.getElementById('tabOverlay');
const moveTaskOverlay = document.getElementById('moveTaskOverlay');
const spaceNameOverlay = document.getElementById('spaceNameOverlay');
const confirmOverlay = document.getElementById('confirmOverlay');

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const addInput = document.getElementById('addInput');
const addInputWordingHint = document.getElementById('addInputWordingHint');
const confirmAddBtn = document.getElementById('confirmAddBtn');

const blindboxTaskText = document.getElementById('blindboxTaskText');
const blindboxActions = document.getElementById('blindboxActions');
const acceptBlindboxBtn = document.getElementById('acceptBlindboxBtn');
const rerollBlindboxBtn = document.getElementById('rerollBlindboxBtn');

const itemManagerOverlay = document.getElementById('itemManagerOverlay');
const itemTabsBar = document.getElementById('itemTabsBar');
const itemManagerList = document.getElementById('itemManagerList');
const starPanel = document.getElementById('starPanel');
const starList = document.getElementById('starList');
const dailyPanel = document.getElementById('dailyPanel');
const dailyList = document.getElementById('dailyList');
const pinnedPanel = document.getElementById('pinnedPanel');
const pinnedTitle = document.getElementById('pinnedTitle');
const pinnedList = document.getElementById('pinnedList');

const tabDialogTitle = document.getElementById('tabDialogTitle');
const tabDialogInput = document.getElementById('tabDialogInput');
const tabDialogMessage = document.getElementById('tabDialogMessage');
const tabDialogSaveBtn = document.getElementById('tabDialogSaveBtn');
const tabDialogPinBtn = document.getElementById('tabDialogPinBtn');
const tabDialogDeleteBtn = document.getElementById('tabDialogDeleteBtn');
const tabDialogCancelBtn = document.getElementById('tabDialogCancelBtn');
const moveTaskTitle = document.getElementById('moveTaskTitle');
const moveTaskList = document.getElementById('moveTaskList');
const moveTaskCancelBtn = document.getElementById('moveTaskCancelBtn');

const exportJsonBtn = document.getElementById('exportJsonBtn');
const importJsonInput = document.getElementById('importJsonInput');
const spaceSelect = document.getElementById('spaceSelect');
const newLocalSpaceBtn = document.getElementById('newLocalSpaceBtn');
const newCloudSpaceBtn = document.getElementById('newCloudSpaceBtn');
const renameSpaceBtn = document.getElementById('renameSpaceBtn');
const refreshCloudSpacesBtn = document.getElementById('refreshCloudSpacesBtn');
const deleteSpaceBtn = document.getElementById('deleteSpaceBtn');
const migrateSourceSpaceSelect = document.getElementById('migrateSourceSpaceSelect');
const migrateTargetSpaceSelect = document.getElementById('migrateTargetSpaceSelect');
const transferSpaceContentBtn = document.getElementById('transferSpaceContentBtn');
const spaceTransferStatus = document.getElementById('spaceTransferStatus');
const spaceStatus = document.getElementById('spaceStatus');
const spaceNameTitle = document.getElementById('spaceNameTitle');
const spaceNameInput = document.getElementById('spaceNameInput');
const spaceNameMessage = document.getElementById('spaceNameMessage');
const spaceNameConfirmBtn = document.getElementById('spaceNameConfirmBtn');
const spaceNameCancelBtn = document.getElementById('spaceNameCancelBtn');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmAcceptBtn = document.getElementById('confirmAcceptBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');

const overlayStack = [
    searchOverlay,
    addOverlay,
    blindboxOverlay,
    reflectionOverlay,
    settingsOverlay,
    itemManagerOverlay,
    tabOverlay,
    moveTaskOverlay,
    spaceNameOverlay,
    confirmOverlay
];

Dialogs.configure({
    overlays: overlayStack,
    confirm: {
        overlay: confirmOverlay,
        title: confirmTitle,
        message: confirmMessage,
        acceptButton: confirmAcceptBtn,
        cancelButton: confirmCancelBtn
    },
    closeHandlers: {
        tabOverlay: closeTabDialog,
        moveTaskOverlay: closeMoveTaskDialog,
        spaceNameOverlay: closeSpaceNameDialog,
        confirmOverlay: () => closeConfirmDialog(false)
    }
});

function hoistOverlaysToViewportLayer() {
    Dialogs.hoistOverlaysToViewportLayer();
}

hoistOverlaysToViewportLayer();

let state = {
    boxTasks: [],
    completedTasks: [],
    nowTask: '',
    nowTaskStartedAt: 0,
    reflectionNote: '',
    blindboxRejectCount: 0,
    blindboxCooldownUntil: 0,
    mustDoTasks: [],
    dailyTasks: [],
    dailyCompletedByDate: {},
    mustDoCriteria: cloneDefaultTabs(),
    activeMustDoCriterionId: INBOX_TAB.id,
    pinnedMustDoCriterionId: '',
    mustDoHiddenByDate: {},
    mustDoTaskGroups: {},
    mustDoTaskOrder: {}
};

let blindboxTask = '没有 item';
let isEditing = false;

let lastCompletedTask = null;
let shakeThreshold = 15;
let lastShake = 0;
let tabDialogMode = 'add';
let tabDialogTabId = null;
let isBooting = true;
let pendingMoveTask = '';

StorageService.configure({
    getState: () => state,
    setState: nextState => {
        state = nextState;
    },
    isBooting: () => isBooting,
    reportCloudSyncError: message => {
        if (spaceStatus) spaceStatus.textContent = message;
    }
});

function isTextCompositionEvent(event) {
    return event.isComposing || event.keyCode === 229;
}

function isTaskLineBreakShortcut(event) {
    return (event.key === 'Enter' || event.code === 'Enter' || event.keyCode === 13 || event.keyCode === 229) &&
        (event.metaKey || event.ctrlKey);
}

function insertTextareaLineBreak(input) {
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    if (typeof input.setRangeText === 'function') {
        input.setRangeText('\n', start, end, 'end');
    } else {
        input.value = `${input.value.slice(0, start)}\n${input.value.slice(end)}`;
        const nextCursor = start + 1;
        input.selectionStart = nextCursor;
        input.selectionEnd = nextCursor;
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertContentEditableLineBreak(element) {
    let selection = window.getSelection();
    if (!selection || !selection.rangeCount || !element.contains(selection.getRangeAt(0).commonAncestorContainer)) {
        placeContentEditableCursorAtEnd(element);
        selection = window.getSelection();
    }
    if (!selection || !selection.rangeCount) return;
    if (document.execCommand && document.execCommand('insertText', false, `\n${EDITING_LINE_BREAK_PLACEHOLDER}`)) {
        return;
    }
    const range = selection.getRangeAt(0);
    range.deleteContents();
    const lineBreak = document.createTextNode(`\n${EDITING_LINE_BREAK_PLACEHOLDER}`);
    range.insertNode(lineBreak);
    range.setStart(lineBreak, lineBreak.length);
    range.setEnd(lineBreak, lineBreak.length);
    selection.removeAllRanges();
    selection.addRange(range);
}

function cleanEditableTaskText(text) {
    return String(text || '').replaceAll(EDITING_LINE_BREAK_PLACEHOLDER, '').trim();
}

function saveState() {
    StorageService.saveAppState(state);
}

async function loadState() {
    try {
        state = await StorageService.getCurrentState();
    } catch { }
}

function hasBoxTasks() {
    return state.boxTasks.length > 0;
}

function renderFabState() {
    const hasTasks = hasBoxTasks();
    const isCoolingDown = Date.now() < state.blindboxCooldownUntil;
    searchFab.disabled = !hasTasks;
    blindboxFab.disabled = !hasTasks || isCoolingDown;
    blindboxFab.title = isCoolingDown ? '盲盒冷却中' : '盲盒';
}

function renderNow() {
    const displayText = String(state.nowTask || '').replace(/\s+$/, '');
    nowTaskText.textContent = displayText;
    window.EmptyBoxTaskWording?.applyToElement(nowTaskText, displayText);
    nowTaskText.classList.toggle('is-empty', !state.nowTask);
    completeNowBtn.style.visibility = state.nowTask ? 'visible' : 'hidden';
    undoFab.style.display = lastCompletedTask ? 'inline-flex' : 'none';
    renderFabState();
    HomeLists.renderAll();
    saveState();
}

function openOverlay(el) {
    Dialogs.openOverlay(el);
}

function closeOverlay(el) {
    Dialogs.closeOverlay(el);
}

function closeConfirmDialog(result = false) {
    Dialogs.closeConfirmDialog(result);
}

function openConfirmDialog({ title, message, confirmText = '确定', danger = false }) {
    return Dialogs.openConfirmDialog({ title, message, confirmText, danger });
}

function normalizeTaskLinkHref(value) {
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function splitTrailingLinkPunctuation(value) {
    const match = value.match(/[),.!?:;，。！？；：）】》]+$/);
    if (!match) return [value, ''];
    const trailing = match[0];
    return [value.slice(0, -trailing.length), trailing];
}

function renderTaskText(element, text) {
    element.textContent = '';
    const source = String(text || '').replace(/\s+$/, '');
    const linkPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
    let cursor = 0;
    source.replace(linkPattern, (match, _unused, offset) => {
        if (offset > cursor) {
            element.appendChild(document.createTextNode(source.slice(cursor, offset)));
        }
        const [linkText, trailing] = splitTrailingLinkPunctuation(match);
        if (linkText) {
            const anchor = document.createElement('a');
            anchor.href = normalizeTaskLinkHref(linkText);
            anchor.textContent = linkText;
            anchor.target = '_blank';
            anchor.rel = 'noopener noreferrer';
            anchor.draggable = false;
            element.appendChild(anchor);
        }
        if (trailing) {
            element.appendChild(document.createTextNode(trailing));
        }
        cursor = offset + match.length;
        return match;
    });
    if (cursor < source.length) {
        element.appendChild(document.createTextNode(source.slice(cursor)));
    }
    window.EmptyBoxTaskWording?.applyToElement(element, source);
}

function isTaskItemControlTarget(target) {
    return Boolean(target.closest('.candidate-more-btn, .candidate-actions, .candidate-text a, .task-wording-needs-work'));
}

const createTaskActionMenu = options => TaskActions.createMenu(options);

function renderStarList() {
    HomeLists.renderStarList();
}

function isDailyTaskDoneToday(task) {
    const todayCompleted = state.dailyCompletedByDate?.[getTodayKey()] || [];
    return todayCompleted.includes(task);
}

function renderDailyList() {
    HomeLists.renderDailyList();
}

function getPinnedTab() {
    ensureItemTabs();
    if (!state.pinnedMustDoCriterionId) return null;
    return state.mustDoCriteria.find(tab => tab.id === state.pinnedMustDoCriterionId) || null;
}

function renderPinnedTabList() {
    HomeLists.renderPinnedTabList();
}

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayKey() {
    return formatDateKey(new Date());
}

function getTabHiddenRetentionKeys() {
    const today = new Date();
    const keys = [];
    for (let offset = 0; offset < TAB_HIDDEN_RETENTION_DAYS; offset += 1) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        date.setDate(date.getDate() - offset);
        keys.push(formatDateKey(date));
    }
    return keys;
}

function pruneHiddenTabsByDate() {
    const retainedKeys = new Set(getTabHiddenRetentionKeys());
    Object.keys(state.mustDoHiddenByDate).forEach(dateKey => {
        if (!retainedKeys.has(dateKey)) {
            delete state.mustDoHiddenByDate[dateKey];
        }
    });
}

function pruneDailyCompletedByDate() {
    if (!state.dailyCompletedByDate || typeof state.dailyCompletedByDate !== 'object' || Array.isArray(state.dailyCompletedByDate)) {
        state.dailyCompletedByDate = {};
        return;
    }
    const retainedKeys = new Set(getTabHiddenRetentionKeys());
    Object.keys(state.dailyCompletedByDate).forEach(dateKey => {
        if (!retainedKeys.has(dateKey)) {
            delete state.dailyCompletedByDate[dateKey];
            return;
        }
        state.dailyCompletedByDate[dateKey] = normalizeTaskList(state.dailyCompletedByDate[dateKey])
            .filter(task => state.dailyTasks.includes(task));
        if (!state.dailyCompletedByDate[dateKey].length) {
            delete state.dailyCompletedByDate[dateKey];
        }
    });
}

function ensureItemTabs() {
    if (!Array.isArray(state.mustDoCriteria) || !state.mustDoCriteria.length) {
        state.mustDoCriteria = cloneDefaultTabs();
    }
    if (!isInboxTab(state.activeMustDoCriterionId) &&
        !state.mustDoCriteria.some(tab => tab.id === state.activeMustDoCriterionId)) {
        state.activeMustDoCriterionId = INBOX_TAB.id;
    }
    if (!state.mustDoHiddenByDate || typeof state.mustDoHiddenByDate !== 'object' || Array.isArray(state.mustDoHiddenByDate)) {
        state.mustDoHiddenByDate = {};
    }
    if (!state.mustDoTaskGroups || typeof state.mustDoTaskGroups !== 'object' || Array.isArray(state.mustDoTaskGroups)) {
        state.mustDoTaskGroups = {};
    }
    if (!state.mustDoTaskOrder || typeof state.mustDoTaskOrder !== 'object' || Array.isArray(state.mustDoTaskOrder)) {
        state.mustDoTaskOrder = {};
    }
    state.dailyTasks = normalizeTaskList(state.dailyTasks);
    pruneDailyCompletedByDate();
    const validTabIds = new Set(state.mustDoCriteria.map(tab => tab.id));
    const validGroupIds = new Set([INBOX_TAB.id, ...validTabIds]);
    const taskPool = getItemPool();
    Object.keys(state.mustDoTaskGroups).forEach(task => {
        if (!validTabIds.has(state.mustDoTaskGroups[task]) || !taskPool.includes(task)) {
            delete state.mustDoTaskGroups[task];
        }
    });
    Object.keys(state.mustDoTaskOrder).forEach(groupId => {
        if (!validGroupIds.has(groupId)) {
            delete state.mustDoTaskOrder[groupId];
            return;
        }
        state.mustDoTaskOrder[groupId] = normalizeTaskList(state.mustDoTaskOrder[groupId]).filter(task =>
            taskPool.includes(task) && getTaskGroupIdRaw(task) === groupId
        );
    });
    pruneHiddenTabsByDate();
}

function getItemPool() {
    return [...new Set([...state.boxTasks, ...state.dailyTasks, state.nowTask].filter(Boolean))];
}

function getTaskGroupIdRaw(task) {
    return state.mustDoTaskGroups[task] || INBOX_TAB.id;
}

function getTaskGroupCount(groupId) {
    return getItemPool().filter(task => getTaskGroupIdRaw(task) === groupId).length;
}

function removeTaskFromAllGroupOrders(task) {
    if (!task || !state.mustDoTaskOrder || typeof state.mustDoTaskOrder !== 'object') return;
    Object.keys(state.mustDoTaskOrder).forEach(groupId => {
        state.mustDoTaskOrder[groupId] = normalizeTaskList(state.mustDoTaskOrder[groupId]).filter(item => item !== task);
    });
}

function appendTaskToGroupOrder(task, groupId = INBOX_TAB.id) {
    ensureItemTabs();
    if (!task) return;
    removeTaskFromAllGroupOrders(task);
    if (!state.mustDoTaskOrder[groupId]) state.mustDoTaskOrder[groupId] = [];
    state.mustDoTaskOrder[groupId] = [...normalizeTaskList(state.mustDoTaskOrder[groupId]), task];
}

function appendTaskToBox(task, groupId = INBOX_TAB.id) {
    if (!task) return;
    state.boxTasks = state.boxTasks.filter(item => item !== task);
    state.boxTasks.push(task);
    if (isInboxTab(groupId)) {
        delete state.mustDoTaskGroups[task];
    } else {
        state.mustDoTaskGroups[task] = groupId;
    }
    appendTaskToGroupOrder(task, groupId);
}

function getTaskGroupId(task) {
    ensureItemTabs();
    return getTaskGroupIdRaw(task);
}

function setTaskGroup(task, tabId) {
    ensureItemTabs();
    if (!task) return;
    const previousGroupId = getTaskGroupId(task);
    if (state.mustDoTaskOrder[previousGroupId]) {
        state.mustDoTaskOrder[previousGroupId] = state.mustDoTaskOrder[previousGroupId].filter(item => item !== task);
    }
    if (isInboxTab(tabId)) {
        delete state.mustDoTaskGroups[task];
        if (!state.mustDoTaskOrder[INBOX_TAB.id]) state.mustDoTaskOrder[INBOX_TAB.id] = [];
        state.mustDoTaskOrder[INBOX_TAB.id] = state.mustDoTaskOrder[INBOX_TAB.id].filter(item => item !== task);
        state.mustDoTaskOrder[INBOX_TAB.id].push(task);
        return;
    }
    if (state.mustDoCriteria.some(tab => tab.id === tabId)) {
        state.mustDoTaskGroups[task] = tabId;
        if (!state.mustDoTaskOrder[tabId]) state.mustDoTaskOrder[tabId] = [];
        state.mustDoTaskOrder[tabId] = state.mustDoTaskOrder[tabId].filter(item => item !== task);
        state.mustDoTaskOrder[tabId].push(task);
    }
}

function getTasksForTab(tabId) {
    ensureItemTabs();
    const targetId = tabId || INBOX_TAB.id;
    const tasks = getItemPool().filter(task => {
        const groupId = getTaskGroupId(task);
        return isInboxTab(targetId) ? isInboxTab(groupId) : groupId === targetId;
    });
    const order = state.mustDoTaskOrder[targetId] || [];
    return [
        ...order.filter(task => tasks.includes(task)),
        ...tasks.filter(task => !order.includes(task))
    ];
}

function getActiveTabItems() {
    return getTasksForTab(state.activeMustDoCriterionId);
}

function setActiveGroupTaskOrder(tasks) {
    ensureItemTabs();
    const activeId = state.activeMustDoCriterionId;
    const activeTasks = getActiveTabItems();
    state.mustDoTaskOrder[activeId] = normalizeTaskList(tasks).filter(task => activeTasks.includes(task));
}

function setTabTaskOrder(tabId, tasks) {
    ensureItemTabs();
    const targetId = tabId || INBOX_TAB.id;
    const activeTasks = getTasksForTab(targetId);
    state.mustDoTaskOrder[targetId] = normalizeTaskList(tasks).filter(task => activeTasks.includes(task));
}

function moveTaskToGroup(task, groupId, switchToGroup = false) {
    const previousGroupId = getTaskGroupId(task);
    setTaskGroup(task, groupId);
    if (switchToGroup) {
        state.activeMustDoCriterionId = groupId;
        renderItemTabs();
    } else {
        syncActiveTabState([previousGroupId, groupId]);
    }
    renderItemManagerItems();
    renderPinnedTabList();
    saveState();
}

function reorderTab(draggedTabId, targetTabId, position = 'before') {
    if (!draggedTabId || draggedTabId === targetTabId || isInboxTab(draggedTabId)) return;
    const fromIndex = state.mustDoCriteria.findIndex(tab => tab.id === draggedTabId);
    if (fromIndex === -1) return;

    const [draggedTab] = state.mustDoCriteria.splice(fromIndex, 1);
    if (isInboxTab(targetTabId)) {
        state.mustDoCriteria.unshift(draggedTab);
    } else {
        const targetIndex = state.mustDoCriteria.findIndex(tab => tab.id === targetTabId);
        if (targetIndex === -1) {
            state.mustDoCriteria.push(draggedTab);
        } else {
            const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
            state.mustDoCriteria.splice(insertIndex, 0, draggedTab);
        }
    }
    renderItemTabs();
    renderItemManagerItems();
    renderPinnedTabList();
    saveState();
}

function syncActiveTabState(tabIds = null) {
    const targetIds = tabIds
        ? new Set(normalizeTaskList(Array.isArray(tabIds) ? tabIds : [tabIds]))
        : null;
    itemTabsBar.querySelectorAll('.item-tab:not(.add)').forEach(button => {
        const tabId = button.dataset.tabId;
        if (targetIds && !targetIds.has(tabId)) return;
        const isActive = tabId === state.activeMustDoCriterionId;
        const taskCount = getTaskGroupCount(tabId);
        const tab = isInboxTab(tabId)
            ? INBOX_TAB
            : state.mustDoCriteria.find(item => item.id === tabId);
        const pinned = tabId === state.pinnedMustDoCriterionId;
        button.classList.toggle('active', isActive);
        button.classList.toggle('has-tasks', Boolean(taskCount));
        button.classList.toggle('is-pinned', pinned);
        button.dataset.count = String(taskCount);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        button.title = [
            tab?.name || button.textContent,
            taskCount ? `${taskCount} 项` : '',
            pinned ? '已 Pin 到首页' : ''
        ].filter(Boolean).join(' · ');
    });
}

function refreshItemManagerState() {
    renderItemTabs();
    renderItemManagerItems();
    renderPinnedTabList();
    saveState();
}

function activateTab(tabId) {
    state.activeMustDoCriterionId = tabId;
    syncActiveTabState();
    renderItemManagerItems();
    saveState();
}

function openTabNameDialog(mode, tab = null) {
    tabDialogMode = mode;
    tabDialogTabId = tab ? tab.id : null;
    tabDialogTitle.textContent = mode === 'add' ? '新增 Tab' : '修改 Tab';
    tabDialogInput.style.display = 'block';
    tabDialogInput.value = tab ? tab.name : '';
    tabDialogMessage.textContent = '';
    tabDialogSaveBtn.style.display = 'inline-flex';
    tabDialogSaveBtn.textContent = mode === 'add' ? '新增' : '保存';
    tabDialogPinBtn.style.display = 'none';
    tabDialogDeleteBtn.style.display = 'none';
    tabDialogCancelBtn.textContent = '取消';
    openOverlay(tabOverlay);
    tabDialogInput.focus();
    tabDialogInput.select();
}

function openTabMessageDialog(title, message) {
    tabDialogMode = 'message';
    tabDialogTabId = null;
    tabDialogTitle.textContent = title;
    tabDialogInput.style.display = 'none';
    tabDialogMessage.textContent = message;
    tabDialogSaveBtn.style.display = 'none';
    tabDialogPinBtn.style.display = 'none';
    tabDialogDeleteBtn.style.display = 'none';
    tabDialogCancelBtn.textContent = '知道了';
    openOverlay(tabOverlay);
}

function openTabDeleteDialog(tab) {
    tabDialogMode = 'delete';
    tabDialogTabId = tab.id;
    tabDialogTitle.textContent = '删除 Tab';
    tabDialogInput.style.display = 'none';
    tabDialogMessage.textContent = `删除“${tab.name}”？`;
    tabDialogSaveBtn.style.display = 'none';
    tabDialogPinBtn.style.display = 'none';
    tabDialogDeleteBtn.style.display = 'inline-flex';
    tabDialogCancelBtn.textContent = '取消';
    openOverlay(tabOverlay);
}

function openTabManageDialog(tab) {
    tabDialogMode = 'manage';
    tabDialogTabId = tab.id;
    tabDialogTitle.textContent = tab.name;
    tabDialogInput.style.display = 'none';
    tabDialogMessage.textContent = '管理这个 Tab';
    tabDialogSaveBtn.style.display = 'inline-flex';
    tabDialogSaveBtn.textContent = '重命名';
    tabDialogPinBtn.style.display = 'inline-flex';
    tabDialogPinBtn.textContent = state.pinnedMustDoCriterionId === tab.id ? '取消 Pin' : 'Pin 到首页';
    tabDialogDeleteBtn.style.display = 'inline-flex';
    tabDialogCancelBtn.textContent = '取消';
    openOverlay(tabOverlay);
}

function closeTabDialog() {
    closeOverlay(tabOverlay);
    tabDialogMessage.textContent = '';
    tabDialogTabId = null;
}

function showTabDialogMessage(message) {
    tabDialogMessage.textContent = message;
}

function saveTabNameDialog() {
    if (tabDialogMode === 'manage') {
        const tabId = tabDialogTabId;
        closeTabDialog();
        renameTab(tabId);
        return;
    }

    const trimmedName = tabDialogInput.value.trim();
    if (!trimmedName) {
        showTabDialogMessage('请输入 Tab 名称');
        return;
    }

    ensureItemTabs();

    if (tabDialogMode === 'add') {
        const existing = state.mustDoCriteria.find(tab => tab.name === trimmedName);
        if (existing) {
            state.activeMustDoCriterionId = existing.id;
        } else {
            const tab = { id: createTabId(), name: trimmedName };
            state.mustDoCriteria.push(tab);
            state.activeMustDoCriterionId = tab.id;
        }
        closeTabDialog();
        refreshItemManagerState();
        return;
    }

    if (tabDialogMode === 'rename') {
        const tab = state.mustDoCriteria.find(item => item.id === tabDialogTabId);
        if (!tab) return;
        if (trimmedName === tab.name) {
            closeTabDialog();
            return;
        }

        const duplicate = state.mustDoCriteria.some(item => item.id !== tab.id && item.name === trimmedName);
        if (duplicate) {
            showTabDialogMessage('已经有这个 Tab');
            return;
        }

        tab.name = trimmedName;
        closeTabDialog();
        refreshItemManagerState();
    }
}

function renameTab(tabId) {
    ensureItemTabs();
    const tab = state.mustDoCriteria.find(item => item.id === tabId);
    if (!tab) return;
    openTabNameDialog('rename', tab);
}

function togglePinnedTab(tabId) {
    ensureItemTabs();
    if (isInboxTab(tabId)) return;
    const tab = state.mustDoCriteria.find(item => item.id === tabId);
    if (!tab) return;
    state.pinnedMustDoCriterionId = state.pinnedMustDoCriterionId === tabId ? '' : tabId;
    closeTabDialog();
    renderPinnedTabList();
    saveState();
}

function deleteTab(tabId) {
    ensureItemTabs();
    if (isInboxTab(tabId)) {
        openTabMessageDialog('不能删除', 'Inbox 是默认 Tab');
        return;
    }
    if (state.mustDoCriteria.length <= 1) {
        openTabMessageDialog('不能删除', '至少保留一个 Tab');
        return;
    }

    const tabIndex = state.mustDoCriteria.findIndex(item => item.id === tabId);
    if (tabIndex === -1) return;

    const tab = state.mustDoCriteria[tabIndex];
    openTabDeleteDialog(tab);
}

function manageTab(tabId) {
    ensureItemTabs();
    if (isInboxTab(tabId)) return;
    const tab = state.mustDoCriteria.find(item => item.id === tabId);
    if (!tab) return;
    openTabManageDialog(tab);
}

function handleTabDeleteDialogAction() {
    if (tabDialogMode === 'manage') {
        const tabId = tabDialogTabId;
        closeTabDialog();
        deleteTab(tabId);
        return;
    }
    confirmDeleteTab();
}

function handleTabPinDialogAction() {
    if (tabDialogMode !== 'manage') return;
    togglePinnedTab(tabDialogTabId);
}

function confirmDeleteTab() {
    ensureItemTabs();
    const tabId = tabDialogTabId;
    if (isInboxTab(tabId)) {
        closeTabDialog();
        return;
    }
    const tabIndex = state.mustDoCriteria.findIndex(item => item.id === tabId);
    if (tabIndex === -1) {
        closeTabDialog();
        return;
    }

    state.mustDoCriteria.splice(tabIndex, 1);
    Object.keys(state.mustDoTaskGroups).forEach(task => {
        if (state.mustDoTaskGroups[task] === tabId) {
            delete state.mustDoTaskGroups[task];
        }
    });
    delete state.mustDoTaskOrder[tabId];
    Object.values(state.mustDoHiddenByDate).forEach(hiddenByTab => {
        if (hiddenByTab && typeof hiddenByTab === 'object') {
            delete hiddenByTab[tabId];
        }
    });

    if (state.activeMustDoCriterionId === tabId) {
        state.activeMustDoCriterionId = INBOX_TAB.id;
    }
    if (state.pinnedMustDoCriterionId === tabId) {
        state.pinnedMustDoCriterionId = '';
    }
    closeTabDialog();
    refreshItemManagerState();
}

function renderItemTabs() {
    ensureItemTabs();
    ItemTabs.renderTabs();
}

function addTab() {
    openTabNameDialog('add');
}

function getMoveTaskGroups() {
    ensureItemTabs();
    return [INBOX_TAB, ...state.mustDoCriteria];
}

function replaceTaskTextInList(list, previousText, nextText) {
    return TaskModel.replaceTaskTextInList(list, previousText, nextText);
}

function placeInputCursorAtEnd(input) {
    const end = input.value.length;
    input.setSelectionRange(end, end);
}

function placeContentEditableCursorAtEnd(element) {
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

async function copyTaskText(task) {
    if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(task);
        return;
    }
    const textarea = document.createElement('textarea');
    textarea.value = task;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}

async function handleCopyTask(button, task) {
    const previousText = button.textContent;
    try {
        await copyTaskText(task);
        button.textContent = '已复制';
        setTimeout(() => {
            button.textContent = previousText;
        }, 900);
    } catch (error) {
        console.error(error);
        button.textContent = '复制失败';
        setTimeout(() => {
            button.textContent = previousText;
        }, 1200);
    }
}

function isDailyTask(task) {
    return TaskModel.isDailyTask(task);
}

function markDailyTaskDoneToday(task) {
    TaskModel.markDailyTaskDoneToday(task);
}

function removeDailyCompletion(task, dateKey = getTodayKey()) {
    TaskModel.removeDailyCompletion(task, dateKey);
}

function toggleDailyTask(task) {
    return TaskModel.toggleDailyTask(task);
}

function taskTextExists(text, previousText) {
    return TaskModel.taskTextExists(text, previousText);
}

function renameTaskText(previousText, nextText) {
    return TaskModel.renameTaskText(previousText, nextText);
}

function closeMoveTaskDialog() {
    pendingMoveTask = '';
    closeOverlay(moveTaskOverlay);
}

function openMoveTaskDialog(task) {
    pendingMoveTask = task;
    moveTaskTitle.textContent = `移动“${task}”到 Tab`;
    moveTaskList.innerHTML = '';
    const currentGroupId = getTaskGroupId(task);
    getMoveTaskGroups().forEach(group => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn ${group.id === currentGroupId ? 'primary' : 'secondary'}`;
        button.textContent = group.name;
        button.disabled = group.id === currentGroupId;
        button.addEventListener('click', () => {
            moveTaskToGroup(task, group.id);
            closeMoveTaskDialog();
        });
        moveTaskList.appendChild(button);
    });
    openOverlay(moveTaskOverlay);
}

TaskModel.configure({
    getState: () => state,
    getTodayKey,
    getBlindboxTask: () => blindboxTask,
    setBlindboxTask: task => {
        blindboxTask = task;
    },
    updateBlindboxTaskText: task => {
        blindboxTaskText.textContent = task;
    }
});

Settings.configure({
    elements: {
        settingsOverlay,
        settingsFab,
        spaceSelect,
        newLocalSpaceBtn,
        newCloudSpaceBtn,
        renameSpaceBtn,
        refreshCloudSpacesBtn,
        deleteSpaceBtn,
        migrateSourceSpaceSelect,
        migrateTargetSpaceSelect,
        transferSpaceContentBtn,
        spaceTransferStatus,
        spaceStatus,
        spaceNameOverlay,
        spaceNameTitle,
        spaceNameInput,
        spaceNameMessage,
        spaceNameConfirmBtn,
        spaceNameCancelBtn,
        exportJsonBtn,
        importJsonInput
    },
    storage: StorageService,
    formatErrorMessage,
    createEmptyState,
    getState: () => state,
    setState: nextState => {
        state = nextState;
    },
    resetLastCompletedTask: () => {
        lastCompletedTask = null;
    },
    renderNow,
    renderReflectionFab,
    openOverlay,
    closeOverlay,
    openConfirmDialog,
    isTextCompositionEvent
});

TaskActions.configure({
    getTaskState: task => {
        const daily = isDailyTask(task);
        return {
            selected: state.mustDoTasks.includes(task),
            daily,
            dailyDoneToday: daily && isDailyTaskDoneToday(task),
            canStar: state.mustDoTasks.length < STAR_TASK_LIMIT
        };
    },
    editTask: ({ row, label, task, editMode, rerender }) => {
        if (editMode === 'search') {
            startSearchItemTextEdit(row, label, task);
            return;
        }
        startItemManagerTextEdit(row, label, task, rerender);
    },
    copyTask: ({ button, task }) => handleCopyTask(button, task),
    moveTask: task => openMoveTaskDialog(task),
    completeTask: ({ task, rerender }) => {
        const affectedTabId = getTaskGroupIdRaw(task);
        completeTask(task);
        rerender();
        syncActiveTabState(affectedTabId);
        renderStarList();
        renderNow();
    },
    toggleStar: ({ task, selected, rerender }) => {
        if (selected) {
            state.mustDoTasks = state.mustDoTasks.filter(t => t !== task);
        } else if (state.mustDoTasks.length < STAR_TASK_LIMIT) {
            state.mustDoTasks.push(task);
        }
        rerender();
        renderStarList();
        saveState();
    },
    toggleDaily: ({ task, rerender }) => {
        const affectedTabId = getTaskGroupIdRaw(task);
        toggleDailyTask(task);
        rerender();
        syncActiveTabState(affectedTabId);
        renderDailyList();
        saveState();
    }
});

HomeLists.configure({
    elements: {
        starPanel,
        starList,
        dailyPanel,
        dailyList,
        pinnedPanel,
        pinnedTitle,
        pinnedList
    },
    getState: () => state,
    saveState,
    renderNow,
    renderTaskText,
    createTaskActionMenu,
    isTaskItemControlTarget,
    appendTaskToBox,
    getTaskGroupIdRaw,
    getTodayKey,
    getPinnedTab,
    getTasksForTab,
    setTabTaskOrder,
    renderItemManagerItems,
    getActiveTabId: () => state.activeMustDoCriterionId,
    tapMovePx: TAB_TAP_MOVE_PX
});

ItemTabs.configure({
    elements: {
        itemTabsBar
    },
    getState: () => state,
    inboxTab: INBOX_TAB,
    isInboxTab: isInboxTab,
    getTaskGroupCount,
    activateTab,
    manageTab,
    reorderTab,
    moveTaskToGroup,
    addTab,
    tapMovePx: TAB_TAP_MOVE_PX,
    doubleTapMs: TAB_DOUBLE_TAP_MS
});

ItemManager.configure({
    elements: {
        itemManagerOverlay,
        itemManagerList
    },
    getState: () => state,
    saveState,
    openOverlay,
    ensureItemTabs,
    renderItemTabs,
    renderPinnedTabList,
    renderFabState,
    renderNow,
    renderTaskText,
    createTaskActionMenu,
    isTextCompositionEvent,
    isInboxTab,
    getActiveTabItems,
    setActiveGroupTaskOrder,
    taskTextExists,
    appendTaskToBox,
    syncTabState: syncActiveTabState,
    startTextEdit: startItemManagerTextEdit,
    isDailyTask,
    isDailyTaskDoneToday,
    inboxTab: INBOX_TAB
});

function resetEditableTaskLabel(label) {
    label.contentEditable = 'false';
    label.removeAttribute('contenteditable');
    label.removeAttribute('role');
    label.removeAttribute('aria-label');
    label.removeAttribute('spellcheck');
    label.classList.remove('is-edit-invalid', 'task-wording-editing-hint', 'is-open');
    label.removeAttribute('data-wording-hint');
    label.title = '';
    delete label.dataset.originalText;
}

function startTaskTextEdit({ row, label, task, rerender, onAfterSave }) {
    row.draggable = false;
    row.classList.remove('is-menu-open', 'is-actions-revealed');
    row.classList.add('is-editing');
    label.querySelectorAll('.task-wording-badge').forEach(item => item.remove());
    label.classList.remove('task-wording-needs-work');
    label.removeAttribute('data-wording-hint');
    label.removeAttribute('aria-label');
    label.removeAttribute('title');
    label.textContent = task;
    label.contentEditable = 'true';
    label.setAttribute('role', 'textbox');
    label.setAttribute('aria-label', '编辑 item 内容');
    label.setAttribute('spellcheck', 'false');
    label.dataset.originalText = task;
    label.focus();
    placeContentEditableCursorAtEnd(label);
    window.EmptyBoxTaskWording?.updateTextBoxHint(label, cleanEditableTaskText(label.textContent));

    let finished = false;
    const finish = (shouldSave, source = 'commit') => {
        if (finished) return;
        finished = true;
        if (!shouldSave) {
            label.textContent = task;
            resetEditableTaskLabel(label);
            row.classList.remove('is-editing');
            rerender();
            return;
        }
        const result = renameTaskText(task, cleanEditableTaskText(label.textContent));
        if (!result.ok) {
            if (source === 'blur') {
                resetEditableTaskLabel(label);
                row.classList.remove('is-editing');
                rerender();
                return;
            }
            finished = false;
            label.classList.add('is-edit-invalid');
            label.title = result.message;
            label.focus();
            placeContentEditableCursorAtEnd(label);
            return;
        }
        resetEditableTaskLabel(label);
        row.classList.remove('is-editing');
        rerender();
        onAfterSave();
    };

    const stopEditingEvent = event => event.stopPropagation();
    label.addEventListener('pointerdown', stopEditingEvent);
    label.addEventListener('click', stopEditingEvent);
    label.addEventListener('dblclick', stopEditingEvent);
    label.addEventListener('keydown', event => {
        if (isTaskLineBreakShortcut(event)) {
            event.preventDefault();
            insertContentEditableLineBreak(label);
            window.EmptyBoxTaskWording?.updateTextBoxHint(label, cleanEditableTaskText(label.textContent));
            return;
        }
        if (isTextCompositionEvent(event)) return;
        if (event.key === 'Enter') {
            event.preventDefault();
            finish(true);
        }
        if (event.key === 'Escape') {
            event.preventDefault();
            finish(false);
        }
    });
    label.addEventListener('input', () => {
        label.classList.remove('is-edit-invalid');
        label.title = '';
        window.EmptyBoxTaskWording?.updateTextBoxHint(label, cleanEditableTaskText(label.textContent));
    });
    label.addEventListener('blur', () => finish(true, 'blur'), { once: true });
}

function startItemManagerTextEdit(row, label, task, rerender = renderItemManagerItems) {
    startTaskTextEdit({
        row,
        label,
        task,
        rerender,
        onAfterSave: () => {
            renderNow();
        }
    });
}

function startSearchItemTextEdit(row, label, task) {
    startTaskTextEdit({
        row,
        label,
        task,
        rerender: () => renderSearchResults(searchInput.value),
        onAfterSave: () => {
            renderNow();
        }
    });
}

function renderItemManagerItems() {
    ItemManager.renderItems();
}

function openItemManager() {
    ItemManager.open();
}

function updateStarState() {
    renderStarList();
    saveState();
}

function completeTask(task) {
    if (!task) return;
    const isStarred = state.mustDoTasks.includes(task);
    const isDaily = isDailyTask(task);
    lastCompletedTask = task;
    const completionTags = [
        isStarred ? 'Star' : '',
        isDaily ? 'Daily' : ''
    ].filter(Boolean);
    state.completedTasks.push(completionTags.length ? `${task}【${completionTags.join(' · ')}】` : task);
    state.boxTasks = state.boxTasks.filter(item => item !== task);
    if (isDaily) {
        markDailyTaskDoneToday(task);
    } else {
        delete state.mustDoTaskGroups[task];
        Object.keys(state.mustDoTaskOrder).forEach(groupId => {
            state.mustDoTaskOrder[groupId] = state.mustDoTaskOrder[groupId].filter(item => item !== task);
        });
    }
    if (isStarred) {
        state.mustDoTasks = state.mustDoTasks.filter(item => item !== task);
    }
    if (state.nowTask === task) {
        state.nowTask = '';
        state.nowTaskStartedAt = 0;
    }
}

function addToBox(value) {
    const text = value.trim();
    if (!text) return false;
    if (!taskTextExists(text)) {
        appendTaskToBox(text);
        saveState();
        renderFabState();
        return true;
    }
    return false;
}

function renderSearchResults(keyword) {
    searchResults.innerHTML = '';
    const text = keyword.trim().toLowerCase();
    if (!text) return;
    const matched = state.boxTasks.filter(task => task !== state.nowTask && task.toLowerCase().includes(text));
    matched.forEach(task => {
        const selected = state.mustDoTasks.includes(task);
        const daily = isDailyTask(task);
        const dailyDoneToday = daily && isDailyTaskDoneToday(task);
        const row = document.createElement('div');
        row.className = `candidate-item has-actions${selected ? ' is-selected' : ''}${daily ? ' is-daily' : ''}${dailyDoneToday ? ' is-daily-done' : ''}`;
        const taskText = document.createElement('span');
        taskText.className = 'candidate-text';
        renderTaskText(taskText, task);
        const starBadge = document.createElement('span');
        starBadge.className = 'candidate-status-badge candidate-star-badge';
        starBadge.textContent = 'Star';
        starBadge.hidden = !selected;
        const dailyBadge = document.createElement('span');
        dailyBadge.className = 'candidate-status-badge candidate-daily-badge';
        dailyBadge.textContent = 'Daily';
        dailyBadge.hidden = !daily;
        const selectButton = document.createElement('button');
        selectButton.className = 'btn primary';
        selectButton.textContent = '设为当前';
        const { moreButton, actions } = createTaskActionMenu({
            row,
            label: taskText,
            task,
            editMode: 'search',
            rerender: () => renderSearchResults(searchInput.value)
        });
        row.append(taskText, starBadge, dailyBadge, selectButton, moreButton, actions);

        selectButton.addEventListener('click', () => {
            if (state.nowTask && !state.boxTasks.includes(state.nowTask)) {
                appendTaskToBox(state.nowTask, getTaskGroupIdRaw(state.nowTask));
            }
            state.boxTasks = state.boxTasks.filter(item => item !== task);
            state.nowTask = task;
            state.nowTaskStartedAt = Date.now();
            searchInput.value = '';
            searchResults.innerHTML = '';
            closeOverlay(searchOverlay);
            renderNow();
        });
        searchResults.appendChild(row);
    });
}

function rerollBlindbox() {
    const pool = state.boxTasks.filter(task => task !== state.nowTask && !state.completedTasks.includes(task));
    blindboxTask = pool[Math.floor(Math.random() * pool.length)] || '没有 item';
    blindboxTaskText.textContent = blindboxTask;

    if (blindboxTask === '没有 item') {
        blindboxActions.style.display = 'none';
    } else {
        blindboxActions.style.display = 'flex';
        rerollBlindboxBtn.style.display = pool.length <= 1 ? 'none' : 'inline-flex';
    }
}

function registerBlindboxReject() {
    state.blindboxRejectCount += 1;
    if (state.blindboxRejectCount >= 3) {
        state.blindboxCooldownUntil = Date.now() + 60 * 60 * 1000;
        state.blindboxRejectCount = 0;
    }
    saveState();
    renderFabState();
}

function resetBlindboxRejects() {
    state.blindboxRejectCount = 0;
    state.blindboxCooldownUntil = 0;
    saveState();
    renderFabState();
}

function startInlineEdit() {
    if (isEditing) return;
    isEditing = true;
    nowTaskText.classList.remove('is-empty');
    nowTaskText.classList.add('is-editing');
    nowTaskText.querySelectorAll('.task-wording-badge').forEach(item => item.remove());
    nowTaskText.classList.remove('task-wording-needs-work');
    nowTaskText.removeAttribute('data-wording-hint');
    nowTaskText.removeAttribute('aria-label');
    nowTaskText.removeAttribute('title');
    nowTaskText.textContent = state.nowTask || '';
    nowTaskText.contentEditable = 'true';
    if (!nowTaskText.textContent) {
        nowTaskText.textContent = EDITING_LINE_BREAK_PLACEHOLDER;
    }
    nowTaskText.focus();

    placeContentEditableCursorAtEnd(nowTaskText);
    window.EmptyBoxTaskWording?.updateTextBoxHint(nowTaskText, cleanEditableTaskText(nowTaskText.textContent));
}

function finishInlineEdit() {
    if (!isEditing) return;
    isEditing = false;
    nowTaskText.contentEditable = 'false';
    nowTaskText.classList.remove('is-editing');
    nowTaskText.classList.remove('task-wording-editing-hint', 'is-open');
    nowTaskText.removeAttribute('data-wording-hint');
    const previousText = state.nowTask;
    const nextText = cleanEditableTaskText(nowTaskText.textContent);
    const wasEmpty = !state.nowTask;
    const wasStarred = state.mustDoTasks.includes(previousText);
    const wasDaily = state.dailyTasks.includes(previousText);
    if (wasStarred && previousText !== nextText) {
        if (nextText) {
            state.mustDoTasks = [...new Set(state.mustDoTasks.map(task => task === previousText ? nextText : task))];
        } else {
            state.mustDoTasks = state.mustDoTasks.filter(task => task !== previousText);
        }
    }
    if (wasDaily && previousText !== nextText) {
        if (nextText) {
            state.dailyTasks = replaceTaskTextInList(state.dailyTasks, previousText, nextText);
            Object.keys(state.dailyCompletedByDate).forEach(dateKey => {
                state.dailyCompletedByDate[dateKey] = replaceTaskTextInList(state.dailyCompletedByDate[dateKey], previousText, nextText);
            });
        } else {
            state.dailyTasks = state.dailyTasks.filter(task => task !== previousText);
            Object.keys(state.dailyCompletedByDate).forEach(dateKey => removeDailyCompletion(previousText, dateKey));
        }
    }
    if (previousText && previousText !== nextText && state.mustDoTaskGroups[previousText]) {
        const previousGroupId = state.mustDoTaskGroups[previousText];
        delete state.mustDoTaskGroups[previousText];
        if (nextText) {
            state.mustDoTaskGroups[nextText] = previousGroupId;
        }
    }
    if (previousText && previousText !== nextText) {
        Object.keys(state.mustDoTaskOrder).forEach(groupId => {
            state.mustDoTaskOrder[groupId] = state.mustDoTaskOrder[groupId].map(task => task === previousText ? nextText : task);
        });
    }
    state.nowTask = nextText;
    if (!state.nowTask) {
        state.nowTaskStartedAt = 0;
    } else if (wasEmpty) {
        state.nowTaskStartedAt = Date.now();
    }
    renderNow();
}

function isReflectionTime() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const time = h * 60 + m;
    return (time >= 11 * 60 + 30 && time <= 12 * 60) ||
        (time >= 17 * 60 && time <= 17 * 60 + 30) ||
        (time >= 20 * 60 && time <= 20 * 60 + 30);
}

function renderReflectionFab() {
    reflectionFab.style.display = isReflectionTime() ? 'inline-flex' : 'none';
}

function getQuoteSlot(date = new Date()) {
    return Math.floor(date.getTime() / QUOTE_ROTATION_MS);
}

function renderQuote() {
    if (!quoteStrip || !QUOTES.length) return;
    const quote = QUOTES[getQuoteSlot() % QUOTES.length];
    quoteStrip.textContent = `${quote.theme} · ${quote.text}`;
}

function renderSpaceSettings() {
    Settings.renderSpaceSettings();
}

async function refreshCloudSpaces(showStatus = false) {
    return Settings.refreshCloudSpaces(showStatus);
}

function openSpaceNameDialog(storageMode, space = null) {
    Settings.openSpaceNameDialog(storageMode, space);
}

function closeSpaceNameDialog() {
    Settings.closeSpaceNameDialog();
}

async function saveNamedSpace() {
    return Settings.saveNamedSpace();
}

function openRenameSpaceDialog() {
    Settings.openRenameSpaceDialog();
}

async function transferSelectedSpaceContent() {
    return Settings.transferSelectedSpaceContent();
}

async function deleteCurrentSpace() {
    return Settings.deleteCurrentSpace();
}

completeNowBtn.addEventListener('click', () => {
    if (!state.nowTask) return;
    const affectedTabId = getTaskGroupIdRaw(state.nowTask);
    completeTask(state.nowTask);
    syncActiveTabState(affectedTabId);
    renderNow();
    renderStarList();
});

function undoLastComplete() {
    if (!lastCompletedTask) return;
    const possibleRecords = [
        lastCompletedTask,
        `${lastCompletedTask}【Star】`,
        `${lastCompletedTask}【必做】`,
        `${lastCompletedTask}【Daily】`,
        `${lastCompletedTask}【Star · Daily】`,
        `${lastCompletedTask}【必做 · Daily】`
    ];
    const index = state.completedTasks.findLastIndex(record => possibleRecords.includes(record));
    if (index > -1) {
        state.completedTasks.splice(index, 1);
    }
    removeDailyCompletion(lastCompletedTask);
    state.nowTask = lastCompletedTask;
    state.nowTaskStartedAt = Date.now();
    lastCompletedTask = null;
    renderNow();
}

addFab.addEventListener('click', () => {
    openOverlay(addOverlay);
    window.EmptyBoxTaskWording?.updateInputHint(addInputWordingHint, addInput.value);
    addInput.focus();
});

confirmAddBtn.addEventListener('click', () => {
    const added = addToBox(addInput.value);
    if (!added) return;
    addInput.value = '';
    window.EmptyBoxTaskWording?.updateInputHint(addInputWordingHint, addInput.value);
    closeOverlay(addOverlay);
});

addInput.addEventListener('input', () => {
    window.EmptyBoxTaskWording?.updateInputHint(addInputWordingHint, addInput.value);
});

addInput.addEventListener('keydown', e => {
    if (isTaskLineBreakShortcut(e)) {
        e.preventDefault();
        insertTextareaLineBreak(addInput);
        return;
    }
    if (isTextCompositionEvent(e)) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        confirmAddBtn.click();
    }
});

searchFab.addEventListener('click', () => {
    if (!hasBoxTasks()) return;
    openOverlay(searchOverlay);
    searchInput.focus();
});

searchInput.addEventListener('input', e => {
    renderSearchResults(e.target.value);
});

searchResults.addEventListener('click', event => {
    if (event.target.closest('.candidate-more-btn, .candidate-actions')) return;
    searchResults.querySelectorAll('.candidate-item.is-menu-open').forEach(item => {
        item.classList.remove('is-menu-open');
    });
});

ambientHint.addEventListener('dblclick', openItemManager);

blindboxFab.addEventListener('click', () => {
    if (!hasBoxTasks()) return;
    if (Date.now() < state.blindboxCooldownUntil) return;
    registerBlindboxReject();
    if (Date.now() < state.blindboxCooldownUntil) return;
    rerollBlindbox();
    openOverlay(blindboxOverlay);
});

acceptBlindboxBtn.addEventListener('click', () => {
    if (!blindboxTask || blindboxTask === '没有 item') return;
    if (state.nowTask && !state.boxTasks.includes(state.nowTask)) {
        appendTaskToBox(state.nowTask, getTaskGroupIdRaw(state.nowTask));
    }
    state.boxTasks = state.boxTasks.filter(item => item !== blindboxTask);
    state.nowTask = blindboxTask;
    state.nowTaskStartedAt = Date.now();
    resetBlindboxRejects();
    closeOverlay(blindboxOverlay);
    renderNow();
});

rerollBlindboxBtn.addEventListener('click', () => {
    registerBlindboxReject();
    if (Date.now() < state.blindboxCooldownUntil) {
        closeOverlay(blindboxOverlay);
        return;
    }
    rerollBlindbox();
});

function renderReflectionCompleted() {
    reflectionCompletedList.innerHTML = '';
    const items = state.completedTasks;
    reflectionCountText.textContent = items.length ? `今日完成 ${items.length} 项` : '';
    if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'reflection-empty';
        empty.textContent = '今天还没有完成的 item';
        reflectionCompletedList.appendChild(empty);
        return;
    }
    items.forEach((task, index) => {
        const row = document.createElement('div');
        row.className = 'reflection-completed-item';
        row.textContent = `${index + 1}. ${task}`;
        row.title = '双击删除';
        row.addEventListener('dblclick', () => {
            state.completedTasks.splice(index, 1);
            saveState();
            renderReflectionCompleted();
        });
        reflectionCompletedList.appendChild(row);
    });
    reflectionCompletedList.scrollTop = reflectionCompletedList.scrollHeight;
}

reflectionFab.addEventListener('click', () => {
    reflectionTextarea.value = state.reflectionNote || '';
    renderReflectionCompleted();
    openOverlay(reflectionOverlay);
});

reflectionTextarea.addEventListener('input', () => {
    state.reflectionNote = reflectionTextarea.value;
    saveState();
});

Settings.bindEvents();

undoFab.addEventListener('click', undoLastComplete);

tabDialogSaveBtn.addEventListener('click', saveTabNameDialog);
tabDialogPinBtn.addEventListener('click', handleTabPinDialogAction);
tabDialogDeleteBtn.addEventListener('click', handleTabDeleteDialogAction);
tabDialogCancelBtn.addEventListener('click', closeTabDialog);
moveTaskCancelBtn.addEventListener('click', closeMoveTaskDialog);

tabDialogInput.addEventListener('input', () => {
    tabDialogMessage.textContent = '';
});

tabDialogInput.addEventListener('keydown', event => {
    if (isTextCompositionEvent(event)) return;
    if (event.key === 'Enter') {
        event.preventDefault();
        saveTabNameDialog();
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        closeTabDialog();
    }
});

nowTaskText.addEventListener('click', startInlineEdit);
nowTaskText.addEventListener('blur', finishInlineEdit);
nowTaskText.addEventListener('keydown', e => {
    if (isTaskLineBreakShortcut(e)) {
        e.preventDefault();
        insertContentEditableLineBreak(nowTaskText);
        window.EmptyBoxTaskWording?.updateTextBoxHint(nowTaskText, cleanEditableTaskText(nowTaskText.textContent));
        return;
    }
    if (isTextCompositionEvent(e)) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        nowTaskText.blur();
    }
});
nowTaskText.addEventListener('input', () => {
    window.EmptyBoxTaskWording?.updateTextBoxHint(nowTaskText, cleanEditableTaskText(nowTaskText.textContent));
});

Dialogs.bindCloseEvents();

async function initApp() {
    await refreshCloudSpaces();
    await loadState();
    isBooting = false;
    if (!StorageService.getCurrentSpace()) {
        await StorageService.createSpace({
            name: '默认本地 Space',
            storage_mode: 'local_only',
            initialState: state
        });
        state = await StorageService.getCurrentState();
    }
    renderReflectionFab();
    renderQuote();
    setInterval(renderReflectionFab, 60000);
    setInterval(renderQuote, 60000);
    renderNow();
    renderSpaceSettings();
}

initApp();

window.addEventListener('storage', async e => {
    if (e.key === UPDATE_PING_KEY) {
        await loadState();
        renderNow();
        renderSpaceSettings();
    }
});

window.addEventListener('focus', async () => {
    await loadState();
    renderNow();
    renderSpaceSettings();
});

window.addEventListener('devicemotion', (event) => {
    if (!lastCompletedTask) return;
    const acceleration = event.accelerationIncludingGravity;
    if (!acceleration) return;
    const now = Date.now();
    if (now - lastShake < 1000) return;
    const x = acceleration.x || 0;
    const y = acceleration.y || 0;
    const z = acceleration.z || 0;
    const total = Math.sqrt(x * x + y * y + z * z);
    if (total > shakeThreshold) {
        lastShake = now;
        undoLastComplete();
    }
});

window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && (event.key === '/' || event.code === 'Slash')) {
        event.preventDefault();
        addFab.click();
        return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undoLastComplete();
    }
});

function applySystemColorMode(event = systemDarkModeQuery) {
    const prefersDark = Boolean(event && event.matches);
    body.classList.toggle('night', prefersDark);
}

applySystemColorMode();
if (systemDarkModeQuery) {
    systemDarkModeQuery.addEventListener('change', applySystemColorMode);
}

const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
const minute = String(new Date().getMinutes()).padStart(2, '0');
timeText.textContent = `${weekday} · ${String(hour).padStart(2, '0')}:${minute}`;

if (hour >= 18 && hour < 22) {
    greeting.textContent = '夜晚';
    ambientHint.textContent = '🌙';
} else if (hour >= 22 || hour < 6) {
    greeting.textContent = '夜深了';
    ambientHint.textContent = '🌌';
} else if (hour >= 6 && hour < 11) {
    greeting.textContent = '早上';
    ambientHint.textContent = '💧';
} else {
    greeting.textContent = '下午';
    ambientHint.textContent = '🌿';
}
