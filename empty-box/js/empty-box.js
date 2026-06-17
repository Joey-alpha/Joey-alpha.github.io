const StorageService = window.EmptyBoxStorage;
const Dialogs = window.EmptyBoxDialogs;
const TaskActions = window.EmptyBoxTaskActions;
const HomeLists = window.EmptyBoxHomeLists;
const MustDo = window.EmptyBoxMustDo;
const TaskModel = window.EmptyBoxTaskModel;
const Settings = window.EmptyBoxSettings;
const { STORAGE_KEY, UPDATE_PING_KEY, MIGRATION_DONE_KEY, MIGRATION_DISMISSED_KEY } = StorageService.keys;
const { formatErrorMessage } = StorageService;
const {
    MUST_DO_INBOX_CRITERION,
    cloneDefaultMustDoCriteria,
    createMustDoCriterionId,
    isInboxMustDoCriterion,
    normalizeTaskList,
    normalizeState,
    createEmptyState
} = window.EmptyBoxState;
const MUST_DO_TASK_LIMIT = 6;
const MUST_DO_CRITERION_DOUBLE_TAP_MS = 360;
const MUST_DO_CRITERION_TAP_MOVE_PX = 12;
const MUST_DO_HIDDEN_RETENTION_DAYS = 30;
const MUST_DO_ITEM_SWIPE_PX = 58;
const MUST_DO_AUTO_SCROLL_EDGE_PX = 72;
const MUST_DO_AUTO_SCROLL_MAX_PX = 22;
const QUOTE_ROTATION_MS = 2 * 60 * 60 * 1000;
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
const criterionOverlay = document.getElementById('criterionOverlay');
const moveTaskOverlay = document.getElementById('moveTaskOverlay');
const migrationOverlay = document.getElementById('migrationOverlay');
const spaceNameOverlay = document.getElementById('spaceNameOverlay');
const confirmOverlay = document.getElementById('confirmOverlay');

const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const addInput = document.getElementById('addInput');
const confirmAddBtn = document.getElementById('confirmAddBtn');

const blindboxTaskText = document.getElementById('blindboxTaskText');
const blindboxActions = document.getElementById('blindboxActions');
const acceptBlindboxBtn = document.getElementById('acceptBlindboxBtn');
const rerollBlindboxBtn = document.getElementById('rerollBlindboxBtn');

const mustDoOverlay = document.getElementById('mustDoOverlay');
const mustDoCriteriaBar = document.getElementById('mustDoCriteriaBar');
const mustDoSelection = document.getElementById('mustDoSelection');
const mustDoSummary = document.getElementById('mustDoSummary');
const confirmMustDoBtn = document.getElementById('confirmMustDoBtn');
const mustDoPanel = document.getElementById('mustDoPanel');
const mustDoList = document.getElementById('mustDoList');
const dailyPanel = document.getElementById('dailyPanel');
const dailyList = document.getElementById('dailyList');
const pinnedPanel = document.getElementById('pinnedPanel');
const pinnedTitle = document.getElementById('pinnedTitle');
const pinnedList = document.getElementById('pinnedList');

const criterionDialogTitle = document.getElementById('criterionDialogTitle');
const criterionDialogInput = document.getElementById('criterionDialogInput');
const criterionDialogMessage = document.getElementById('criterionDialogMessage');
const criterionDialogSaveBtn = document.getElementById('criterionDialogSaveBtn');
const criterionDialogPinBtn = document.getElementById('criterionDialogPinBtn');
const criterionDialogDeleteBtn = document.getElementById('criterionDialogDeleteBtn');
const criterionDialogCancelBtn = document.getElementById('criterionDialogCancelBtn');
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
const transferSpaceNotesBtn = document.getElementById('transferSpaceNotesBtn');
const spaceTransferStatus = document.getElementById('spaceTransferStatus');
const spaceStatus = document.getElementById('spaceStatus');
const migrateLocalBtn = document.getElementById('migrateLocalBtn');
const migrateCloudBtn = document.getElementById('migrateCloudBtn');
const migrateMergeBtn = document.getElementById('migrateMergeBtn');
const migrateLaterBtn = document.getElementById('migrateLaterBtn');
const migrationStatus = document.getElementById('migrationStatus');
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
    mustDoOverlay,
    criterionOverlay,
    moveTaskOverlay,
    migrationOverlay,
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
        criterionOverlay: closeCriterionDialog,
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
    mustDoCriteria: cloneDefaultMustDoCriteria(),
    activeMustDoCriterionId: MUST_DO_INBOX_CRITERION.id,
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
let criterionDialogMode = 'add';
let criterionDialogCriterionId = null;
let isBooting = true;
let pendingMoveTask = '';

StorageService.configure({
    getState: () => state,
    setState: nextState => {
        state = nextState;
    },
    isBooting: () => isBooting,
    setLegacyMode: () => {},
    reportCloudSyncError: message => {
        if (spaceStatus) spaceStatus.textContent = message;
    }
});

function isTextCompositionEvent(event) {
    return event.isComposing || event.keyCode === 229;
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
    nowTaskText.textContent = state.nowTask || '';
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
    const source = String(text || '');
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
}

function isTaskItemControlTarget(target) {
    return Boolean(target.closest('.candidate-more-btn, .candidate-actions, .candidate-text a'));
}

const createTaskActionMenu = options => TaskActions.createMenu(options);

function renderMustDoList() {
    HomeLists.renderMustDoList();
}

function isDailyTaskDoneToday(task) {
    const todayCompleted = state.dailyCompletedByDate?.[getTodayKey()] || [];
    return todayCompleted.includes(task);
}

function renderDailyList() {
    HomeLists.renderDailyList();
}

function getPinnedMustDoCriterion() {
    ensureMustDoCriteria();
    if (!state.pinnedMustDoCriterionId) return null;
    return state.mustDoCriteria.find(criterion => criterion.id === state.pinnedMustDoCriterionId) || null;
}

function renderPinnedCriterionList() {
    HomeLists.renderPinnedCriterionList();
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

function getMustDoHiddenRetentionKeys() {
    const today = new Date();
    const keys = [];
    for (let offset = 0; offset < MUST_DO_HIDDEN_RETENTION_DAYS; offset += 1) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        date.setDate(date.getDate() - offset);
        keys.push(formatDateKey(date));
    }
    return keys;
}

function pruneMustDoHiddenByDate() {
    const retainedKeys = new Set(getMustDoHiddenRetentionKeys());
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
    const retainedKeys = new Set(getMustDoHiddenRetentionKeys());
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

function ensureMustDoCriteria() {
    if (!Array.isArray(state.mustDoCriteria) || !state.mustDoCriteria.length) {
        state.mustDoCriteria = cloneDefaultMustDoCriteria();
    }
    if (!isInboxMustDoCriterion(state.activeMustDoCriterionId) &&
        !state.mustDoCriteria.some(criterion => criterion.id === state.activeMustDoCriterionId)) {
        state.activeMustDoCriterionId = MUST_DO_INBOX_CRITERION.id;
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
    const validCriterionIds = new Set(state.mustDoCriteria.map(criterion => criterion.id));
    const validGroupIds = new Set([MUST_DO_INBOX_CRITERION.id, ...validCriterionIds]);
    const taskPool = getMustDoCandidatePool();
    Object.keys(state.mustDoTaskGroups).forEach(task => {
        if (!validCriterionIds.has(state.mustDoTaskGroups[task]) || !taskPool.includes(task)) {
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
    pruneMustDoHiddenByDate();
}

function getMustDoCandidatePool() {
    return [...new Set([...state.boxTasks, ...state.dailyTasks, state.nowTask].filter(Boolean))];
}

function getTaskGroupIdRaw(task) {
    return state.mustDoTaskGroups[task] || MUST_DO_INBOX_CRITERION.id;
}

function getTaskGroupCount(groupId) {
    return getMustDoCandidatePool().filter(task => getTaskGroupIdRaw(task) === groupId).length;
}

function removeTaskFromAllGroupOrders(task) {
    if (!task || !state.mustDoTaskOrder || typeof state.mustDoTaskOrder !== 'object') return;
    Object.keys(state.mustDoTaskOrder).forEach(groupId => {
        state.mustDoTaskOrder[groupId] = normalizeTaskList(state.mustDoTaskOrder[groupId]).filter(item => item !== task);
    });
}

function appendTaskToGroupOrder(task, groupId = MUST_DO_INBOX_CRITERION.id) {
    ensureMustDoCriteria();
    if (!task) return;
    removeTaskFromAllGroupOrders(task);
    if (!state.mustDoTaskOrder[groupId]) state.mustDoTaskOrder[groupId] = [];
    state.mustDoTaskOrder[groupId] = [...normalizeTaskList(state.mustDoTaskOrder[groupId]), task];
}

function appendTaskToBox(task, groupId = MUST_DO_INBOX_CRITERION.id) {
    if (!task) return;
    state.boxTasks = state.boxTasks.filter(item => item !== task);
    state.boxTasks.push(task);
    if (isInboxMustDoCriterion(groupId)) {
        delete state.mustDoTaskGroups[task];
    } else {
        state.mustDoTaskGroups[task] = groupId;
    }
    appendTaskToGroupOrder(task, groupId);
}

function getTaskGroupId(task) {
    ensureMustDoCriteria();
    return getTaskGroupIdRaw(task);
}

function setTaskGroup(task, criterionId) {
    ensureMustDoCriteria();
    if (!task) return;
    const previousGroupId = getTaskGroupId(task);
    if (state.mustDoTaskOrder[previousGroupId]) {
        state.mustDoTaskOrder[previousGroupId] = state.mustDoTaskOrder[previousGroupId].filter(item => item !== task);
    }
    if (isInboxMustDoCriterion(criterionId)) {
        delete state.mustDoTaskGroups[task];
        if (!state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION.id]) state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION.id] = [];
        state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION.id] = state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION.id].filter(item => item !== task);
        state.mustDoTaskOrder[MUST_DO_INBOX_CRITERION.id].push(task);
        return;
    }
    if (state.mustDoCriteria.some(criterion => criterion.id === criterionId)) {
        state.mustDoTaskGroups[task] = criterionId;
        if (!state.mustDoTaskOrder[criterionId]) state.mustDoTaskOrder[criterionId] = [];
        state.mustDoTaskOrder[criterionId] = state.mustDoTaskOrder[criterionId].filter(item => item !== task);
        state.mustDoTaskOrder[criterionId].push(task);
    }
}

function getTasksForMustDoCriterion(criterionId) {
    ensureMustDoCriteria();
    const targetId = criterionId || MUST_DO_INBOX_CRITERION.id;
    const tasks = getMustDoCandidatePool().filter(task => {
        const groupId = getTaskGroupId(task);
        return isInboxMustDoCriterion(targetId) ? isInboxMustDoCriterion(groupId) : groupId === targetId;
    });
    const order = state.mustDoTaskOrder[targetId] || [];
    return [
        ...order.filter(task => tasks.includes(task)),
        ...tasks.filter(task => !order.includes(task))
    ];
}

function getGroupedMustDoCandidates() {
    return getTasksForMustDoCriterion(state.activeMustDoCriterionId);
}

function setActiveGroupTaskOrder(tasks) {
    ensureMustDoCriteria();
    const activeId = state.activeMustDoCriterionId;
    const activeTasks = getGroupedMustDoCandidates();
    state.mustDoTaskOrder[activeId] = normalizeTaskList(tasks).filter(task => activeTasks.includes(task));
}

function setCriterionTaskOrder(criterionId, tasks) {
    ensureMustDoCriteria();
    const targetId = criterionId || MUST_DO_INBOX_CRITERION.id;
    const activeTasks = getTasksForMustDoCriterion(targetId);
    state.mustDoTaskOrder[targetId] = normalizeTaskList(tasks).filter(task => activeTasks.includes(task));
}

function moveTaskToGroup(task, groupId, switchToGroup = false) {
    const previousGroupId = getTaskGroupId(task);
    setTaskGroup(task, groupId);
    if (switchToGroup) {
        state.activeMustDoCriterionId = groupId;
        renderMustDoCriteria();
    } else if (previousGroupId === state.activeMustDoCriterionId || groupId === state.activeMustDoCriterionId) {
        syncMustDoCriterionActiveState();
    }
    buildMustDoCandidates();
    renderPinnedCriterionList();
    saveState();
}

function reorderMustDoCriterion(draggedCriterionId, targetCriterionId, position = 'before') {
    if (!draggedCriterionId || draggedCriterionId === targetCriterionId || isInboxMustDoCriterion(draggedCriterionId)) return;
    const fromIndex = state.mustDoCriteria.findIndex(criterion => criterion.id === draggedCriterionId);
    if (fromIndex === -1) return;

    const [draggedCriterion] = state.mustDoCriteria.splice(fromIndex, 1);
    if (isInboxMustDoCriterion(targetCriterionId)) {
        state.mustDoCriteria.unshift(draggedCriterion);
    } else {
        const targetIndex = state.mustDoCriteria.findIndex(criterion => criterion.id === targetCriterionId);
        if (targetIndex === -1) {
            state.mustDoCriteria.push(draggedCriterion);
        } else {
            const insertIndex = position === 'after' ? targetIndex + 1 : targetIndex;
            state.mustDoCriteria.splice(insertIndex, 0, draggedCriterion);
        }
    }
    renderMustDoCriteria();
    buildMustDoCandidates();
    renderPinnedCriterionList();
    saveState();
}

function updateMustDoSummary() {
    if (mustDoSummary) mustDoSummary.textContent = '';
}

function syncMustDoCriterionActiveState() {
    mustDoCriteriaBar.querySelectorAll('.must-do-criterion:not(.add)').forEach(button => {
        const isActive = button.dataset.criterionId === state.activeMustDoCriterionId;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
}

function refreshMustDoOverlayState() {
    renderMustDoCriteria();
    updateMustDoSummary();
    buildMustDoCandidates();
    renderPinnedCriterionList();
    saveState();
}

function activateMustDoCriterion(criterionId) {
    state.activeMustDoCriterionId = criterionId;
    syncMustDoCriterionActiveState();
    updateMustDoSummary();
    buildMustDoCandidates();
    saveState();
}

function openCriterionNameDialog(mode, criterion = null) {
    criterionDialogMode = mode;
    criterionDialogCriterionId = criterion ? criterion.id : null;
    criterionDialogTitle.textContent = mode === 'add' ? '新增 Tab' : '修改 Tab';
    criterionDialogInput.style.display = 'block';
    criterionDialogInput.value = criterion ? criterion.name : '';
    criterionDialogMessage.textContent = '';
    criterionDialogSaveBtn.style.display = 'inline-flex';
    criterionDialogSaveBtn.textContent = mode === 'add' ? '新增' : '保存';
    criterionDialogPinBtn.style.display = 'none';
    criterionDialogDeleteBtn.style.display = 'none';
    criterionDialogCancelBtn.textContent = '取消';
    openOverlay(criterionOverlay);
    criterionDialogInput.focus();
    criterionDialogInput.select();
}

function openCriterionMessageDialog(title, message) {
    criterionDialogMode = 'message';
    criterionDialogCriterionId = null;
    criterionDialogTitle.textContent = title;
    criterionDialogInput.style.display = 'none';
    criterionDialogMessage.textContent = message;
    criterionDialogSaveBtn.style.display = 'none';
    criterionDialogPinBtn.style.display = 'none';
    criterionDialogDeleteBtn.style.display = 'none';
    criterionDialogCancelBtn.textContent = '知道了';
    openOverlay(criterionOverlay);
}

function openCriterionDeleteDialog(criterion) {
    criterionDialogMode = 'delete';
    criterionDialogCriterionId = criterion.id;
    criterionDialogTitle.textContent = '删除 Tab';
    criterionDialogInput.style.display = 'none';
    criterionDialogMessage.textContent = `删除“${criterion.name}”？`;
    criterionDialogSaveBtn.style.display = 'none';
    criterionDialogPinBtn.style.display = 'none';
    criterionDialogDeleteBtn.style.display = 'inline-flex';
    criterionDialogCancelBtn.textContent = '取消';
    openOverlay(criterionOverlay);
}

function openCriterionManageDialog(criterion) {
    criterionDialogMode = 'manage';
    criterionDialogCriterionId = criterion.id;
    criterionDialogTitle.textContent = criterion.name;
    criterionDialogInput.style.display = 'none';
    criterionDialogMessage.textContent = '管理这个 Tab';
    criterionDialogSaveBtn.style.display = 'inline-flex';
    criterionDialogSaveBtn.textContent = '重命名';
    criterionDialogPinBtn.style.display = 'inline-flex';
    criterionDialogPinBtn.textContent = state.pinnedMustDoCriterionId === criterion.id ? '取消 Pin' : 'Pin 到首页';
    criterionDialogDeleteBtn.style.display = 'inline-flex';
    criterionDialogCancelBtn.textContent = '取消';
    openOverlay(criterionOverlay);
}

function closeCriterionDialog() {
    closeOverlay(criterionOverlay);
    criterionDialogMessage.textContent = '';
    criterionDialogCriterionId = null;
}

function showCriterionDialogMessage(message) {
    criterionDialogMessage.textContent = message;
}

function saveCriterionNameDialog() {
    if (criterionDialogMode === 'manage') {
        const criterionId = criterionDialogCriterionId;
        closeCriterionDialog();
        renameMustDoCriterion(criterionId);
        return;
    }

    const trimmedName = criterionDialogInput.value.trim();
    if (!trimmedName) {
        showCriterionDialogMessage('请输入 Tab 名称');
        return;
    }

    ensureMustDoCriteria();

    if (criterionDialogMode === 'add') {
        const existing = state.mustDoCriteria.find(criterion => criterion.name === trimmedName);
        if (existing) {
            state.activeMustDoCriterionId = existing.id;
        } else {
            const criterion = { id: createMustDoCriterionId(), name: trimmedName };
            state.mustDoCriteria.push(criterion);
            state.activeMustDoCriterionId = criterion.id;
        }
        closeCriterionDialog();
        refreshMustDoOverlayState();
        return;
    }

    if (criterionDialogMode === 'rename') {
        const criterion = state.mustDoCriteria.find(item => item.id === criterionDialogCriterionId);
        if (!criterion) return;
        if (trimmedName === criterion.name) {
            closeCriterionDialog();
            return;
        }

        const duplicate = state.mustDoCriteria.some(item => item.id !== criterion.id && item.name === trimmedName);
        if (duplicate) {
            showCriterionDialogMessage('已经有这个 Tab');
            return;
        }

        criterion.name = trimmedName;
        closeCriterionDialog();
        refreshMustDoOverlayState();
    }
}

function renameMustDoCriterion(criterionId) {
    ensureMustDoCriteria();
    const criterion = state.mustDoCriteria.find(item => item.id === criterionId);
    if (!criterion) return;
    openCriterionNameDialog('rename', criterion);
}

function togglePinnedMustDoCriterion(criterionId) {
    ensureMustDoCriteria();
    if (isInboxMustDoCriterion(criterionId)) return;
    const criterion = state.mustDoCriteria.find(item => item.id === criterionId);
    if (!criterion) return;
    state.pinnedMustDoCriterionId = state.pinnedMustDoCriterionId === criterionId ? '' : criterionId;
    closeCriterionDialog();
    renderPinnedCriterionList();
    saveState();
}

function deleteMustDoCriterion(criterionId) {
    ensureMustDoCriteria();
    if (isInboxMustDoCriterion(criterionId)) {
        openCriterionMessageDialog('不能删除', 'Inbox 是默认 Tab');
        return;
    }
    if (state.mustDoCriteria.length <= 1) {
        openCriterionMessageDialog('不能删除', '至少保留一个 Tab');
        return;
    }

    const criterionIndex = state.mustDoCriteria.findIndex(item => item.id === criterionId);
    if (criterionIndex === -1) return;

    const criterion = state.mustDoCriteria[criterionIndex];
    openCriterionDeleteDialog(criterion);
}

function manageMustDoCriterion(criterionId) {
    ensureMustDoCriteria();
    if (isInboxMustDoCriterion(criterionId)) return;
    const criterion = state.mustDoCriteria.find(item => item.id === criterionId);
    if (!criterion) return;
    openCriterionManageDialog(criterion);
}

function handleCriterionDeleteDialogAction() {
    if (criterionDialogMode === 'manage') {
        const criterionId = criterionDialogCriterionId;
        closeCriterionDialog();
        deleteMustDoCriterion(criterionId);
        return;
    }
    confirmDeleteMustDoCriterion();
}

function handleCriterionPinDialogAction() {
    if (criterionDialogMode !== 'manage') return;
    togglePinnedMustDoCriterion(criterionDialogCriterionId);
}

function confirmDeleteMustDoCriterion() {
    ensureMustDoCriteria();
    const criterionId = criterionDialogCriterionId;
    if (isInboxMustDoCriterion(criterionId)) {
        closeCriterionDialog();
        return;
    }
    const criterionIndex = state.mustDoCriteria.findIndex(item => item.id === criterionId);
    if (criterionIndex === -1) {
        closeCriterionDialog();
        return;
    }

    state.mustDoCriteria.splice(criterionIndex, 1);
    Object.keys(state.mustDoTaskGroups).forEach(task => {
        if (state.mustDoTaskGroups[task] === criterionId) {
            delete state.mustDoTaskGroups[task];
        }
    });
    delete state.mustDoTaskOrder[criterionId];
    Object.values(state.mustDoHiddenByDate).forEach(hiddenByCriterion => {
        if (hiddenByCriterion && typeof hiddenByCriterion === 'object') {
            delete hiddenByCriterion[criterionId];
        }
    });

    if (state.activeMustDoCriterionId === criterionId) {
        state.activeMustDoCriterionId = MUST_DO_INBOX_CRITERION.id;
    }
    if (state.pinnedMustDoCriterionId === criterionId) {
        state.pinnedMustDoCriterionId = '';
    }
    closeCriterionDialog();
    refreshMustDoOverlayState();
}

function renderMustDoCriteria() {
    ensureMustDoCriteria();
    MustDo.renderCriteria();
}

function addMustDoCriterion() {
    openCriterionNameDialog('add');
}

function getMoveTaskGroups() {
    ensureMustDoCriteria();
    return [MUST_DO_INBOX_CRITERION, ...state.mustDoCriteria];
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
        transferSpaceNotesBtn,
        spaceTransferStatus,
        spaceStatus,
        migrateLocalBtn,
        migrateCloudBtn,
        migrateMergeBtn,
        migrateLaterBtn,
        migrationOverlay,
        migrationStatus,
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
    isTextCompositionEvent,
    storageKey: STORAGE_KEY,
    migrationDoneKey: MIGRATION_DONE_KEY,
    migrationDismissedKey: MIGRATION_DISMISSED_KEY
});

TaskActions.configure({
    getTaskState: task => {
        const daily = isDailyTask(task);
        return {
            selected: state.mustDoTasks.includes(task),
            daily,
            dailyDoneToday: daily && isDailyTaskDoneToday(task),
            canStar: state.mustDoTasks.length < MUST_DO_TASK_LIMIT
        };
    },
    editTask: ({ row, label, task, editMode, rerender }) => {
        if (editMode === 'search') {
            startSearchItemTextEdit(row, label, task);
            return;
        }
        startMustDoItemTextEdit(row, label, task, rerender);
    },
    copyTask: ({ button, task }) => handleCopyTask(button, task),
    moveTask: task => openMoveTaskDialog(task),
    completeTask: ({ task, rerender }) => {
        completeTask(task);
        rerender();
        updateMustDoSummary();
        renderMustDoList();
        renderNow();
    },
    toggleStar: ({ task, selected, rerender }) => {
        if (selected) {
            state.mustDoTasks = state.mustDoTasks.filter(t => t !== task);
        } else if (state.mustDoTasks.length < MUST_DO_TASK_LIMIT) {
            state.mustDoTasks.push(task);
        }
        rerender();
        updateMustDoSummary();
        renderMustDoList();
        saveState();
    },
    toggleDaily: ({ task, rerender }) => {
        toggleDailyTask(task);
        rerender();
        updateMustDoSummary();
        renderDailyList();
        saveState();
    }
});

HomeLists.configure({
    elements: {
        mustDoPanel,
        mustDoList,
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
    getPinnedMustDoCriterion,
    getTasksForMustDoCriterion,
    setCriterionTaskOrder,
    buildMustDoCandidates,
    getActiveMustDoCriterionId: () => state.activeMustDoCriterionId,
    tapMovePx: MUST_DO_CRITERION_TAP_MOVE_PX
});

MustDo.configure({
    elements: {
        mustDoCriteriaBar
    },
    getState: () => state,
    inboxCriterion: MUST_DO_INBOX_CRITERION,
    isInboxCriterion: isInboxMustDoCriterion,
    getTaskGroupCount,
    activateCriterion: activateMustDoCriterion,
    manageCriterion: manageMustDoCriterion,
    reorderCriterion: reorderMustDoCriterion,
    moveTaskToGroup,
    addCriterion: addMustDoCriterion,
    tapMovePx: MUST_DO_CRITERION_TAP_MOVE_PX,
    doubleTapMs: MUST_DO_CRITERION_DOUBLE_TAP_MS
});

function bindMustDoItemMoveInteractions(row, task) {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    const isActionTarget = target => Boolean(target.closest('button, input, textarea'));

    row.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (isActionTarget(event.target)) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
    });

    row.addEventListener('pointerup', event => {
        if (pointerId !== event.pointerId) return;
        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;
        pointerId = null;
        if (event.pointerType === 'mouse' || Math.abs(deltaY) >= MUST_DO_ITEM_SWIPE_PX) return;
        if (deltaX <= -MUST_DO_ITEM_SWIPE_PX) {
            row.classList.add('is-actions-revealed');
        }
        if (deltaX >= MUST_DO_ITEM_SWIPE_PX) {
            row.classList.remove('is-actions-revealed');
        }
    });

    row.addEventListener('pointercancel', () => {
        pointerId = null;
    });

    row.addEventListener('click', event => {
        if (!row.classList.contains('is-actions-revealed') || isActionTarget(event.target)) return;
        row.classList.remove('is-actions-revealed');
    });
}

function bindMustDoItemDragInteractions(row, task) {
    row.draggable = true;
    row.dataset.task = task;

    row.addEventListener('dragstart', event => {
        row.classList.remove('is-menu-open');
        row.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-empty-box-task', task);
        event.dataTransfer.setData('text/plain', task);
    });

    row.addEventListener('dragend', () => {
        row.classList.remove('is-dragging');
    });

    row.addEventListener('dragover', event => {
        event.preventDefault();
        autoScrollMustDoSelection(event.clientY);
        const draggingTask = event.dataTransfer.getData('text/plain');
        if (!draggingTask || draggingTask === task) return;
        row.classList.add('is-drag-over');
    });

    row.addEventListener('dragleave', () => {
        row.classList.remove('is-drag-over');
    });

    row.addEventListener('drop', event => {
        event.preventDefault();
        row.classList.remove('is-drag-over');
        const draggingTask = event.dataTransfer.getData('text/plain');
        if (!draggingTask || draggingTask === task) return;
        const tasks = getGroupedMustDoCandidates();
        const fromIndex = tasks.indexOf(draggingTask);
        const toIndex = tasks.indexOf(task);
        if (fromIndex === -1 || toIndex === -1) return;
        tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, draggingTask);
        setActiveGroupTaskOrder(tasks);
        buildMustDoCandidates();
        saveState();
    });
}

function autoScrollMustDoSelection(clientY) {
    const rect = mustDoSelection.getBoundingClientRect();
    const distanceToTop = clientY - rect.top;
    const distanceToBottom = rect.bottom - clientY;
    let delta = 0;

    if (distanceToTop < MUST_DO_AUTO_SCROLL_EDGE_PX) {
        delta = -Math.ceil((1 - Math.max(distanceToTop, 0) / MUST_DO_AUTO_SCROLL_EDGE_PX) * MUST_DO_AUTO_SCROLL_MAX_PX);
    } else if (distanceToBottom < MUST_DO_AUTO_SCROLL_EDGE_PX) {
        delta = Math.ceil((1 - Math.max(distanceToBottom, 0) / MUST_DO_AUTO_SCROLL_EDGE_PX) * MUST_DO_AUTO_SCROLL_MAX_PX);
    }

    if (delta) mustDoSelection.scrollTop += delta;
}

function resetEditableTaskLabel(label) {
    label.contentEditable = 'false';
    label.removeAttribute('contenteditable');
    label.removeAttribute('role');
    label.removeAttribute('aria-label');
    label.removeAttribute('spellcheck');
    label.classList.remove('is-edit-invalid');
    label.title = '';
    delete label.dataset.originalText;
}

function startTaskTextEdit({ row, label, task, rerender, onAfterSave }) {
    row.draggable = false;
    row.classList.remove('is-menu-open', 'is-actions-revealed');
    row.classList.add('is-editing');
    label.textContent = task;
    label.contentEditable = 'true';
    label.setAttribute('role', 'textbox');
    label.setAttribute('aria-label', '编辑 item 内容');
    label.setAttribute('spellcheck', 'false');
    label.dataset.originalText = task;
    label.focus();
    placeContentEditableCursorAtEnd(label);

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
        const result = renameTaskText(task, label.textContent);
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
    });
    label.addEventListener('blur', () => finish(true, 'blur'), { once: true });
}

function startMustDoItemTextEdit(row, label, task, rerender = buildMustDoCandidates) {
    startTaskTextEdit({
        row,
        label,
        task,
        rerender,
        onAfterSave: () => {
            updateMustDoSummary();
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
            updateMustDoSummary();
            renderNow();
        }
    });
}

function addTaskToActiveMustDoGroup(value) {
    const text = value.trim();
    if (!text) return { ok: false, message: 'item 内容不能为空' };
    if (taskTextExists(text)) return { ok: false, message: '已存在同名 item' };
    const groupId = state.activeMustDoCriterionId || MUST_DO_INBOX_CRITERION.id;
    appendTaskToBox(text, groupId);
    saveState();
    renderFabState();
    renderPinnedCriterionList();
    return { ok: true };
}

function createMustDoAddItemRow() {
    const row = document.createElement('div');
    row.className = 'must-do-add-item';
    row.tabIndex = 0;
    row.setAttribute('role', 'button');
    row.setAttribute('aria-label', '添加新 item');

    const renderPrompt = () => {
        row.classList.remove('is-editing');
        row.innerHTML = '<span class="must-do-add-plus">+</span><span>新建 item</span>';
    };

    const startEdit = () => {
        if (row.classList.contains('is-editing')) return;
        row.classList.add('is-editing');
        row.innerHTML = '';
        const input = document.createElement('input');
        input.className = 'must-do-inline-input';
        input.placeholder = '输入新 item…';
        input.setAttribute('aria-label', '新 item 内容');
        row.appendChild(input);
        input.focus();

        let finished = false;
        const finish = shouldSave => {
            if (finished) return;
            const value = input.value.trim();
            if (!shouldSave || !value) {
                finished = true;
                renderPrompt();
                return;
            }
            const result = addTaskToActiveMustDoGroup(value);
            if (!result.ok) {
                finished = false;
                input.setCustomValidity(result.message);
                input.reportValidity();
                input.focus();
                return;
            }
            finished = true;
            renderMustDoCriteria();
            buildMustDoCandidates();
            updateMustDoSummary();
        };

        input.addEventListener('pointerdown', event => event.stopPropagation());
        input.addEventListener('click', event => event.stopPropagation());
        input.addEventListener('keydown', event => {
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
        input.addEventListener('input', () => input.setCustomValidity(''));
        input.addEventListener('blur', () => finish(true));
    };

    row.addEventListener('click', startEdit);
    row.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            startEdit();
        }
    });
    renderPrompt();
    return row;
}

function buildMustDoCandidates() {
    mustDoSelection.innerHTML = '';
    const isInbox = isInboxMustDoCriterion(state.activeMustDoCriterionId);
    const tasks = getGroupedMustDoCandidates();
    if (!tasks.length) {
        const empty = document.createElement('div');
        empty.className = 'reflection-empty';
        empty.textContent = isInbox ? 'Inbox 为空' : '这个 Tab 还没有 item';
        mustDoSelection.appendChild(empty);
    }
    tasks.forEach(task => {
        const selected = state.mustDoTasks.includes(task);
        const daily = isDailyTask(task);
        const dailyDoneToday = daily && isDailyTaskDoneToday(task);
        const row = document.createElement('div');
        row.className = `candidate-item${selected ? ' is-selected' : ''}${daily ? ' is-daily' : ''}${dailyDoneToday ? ' is-daily-done' : ''}`;
        row.setAttribute('aria-selected', selected ? 'true' : 'false');
        row.title = '拖动排序，点击 ⋯ 查看操作';
        const label = document.createElement('span');
        label.className = 'candidate-text';
        renderTaskText(label, task);
        const starBadge = document.createElement('span');
        starBadge.className = 'candidate-status-badge candidate-star-badge';
        starBadge.textContent = 'Star';
        starBadge.hidden = !selected;
        const dailyBadge = document.createElement('span');
        dailyBadge.className = 'candidate-status-badge candidate-daily-badge';
        dailyBadge.textContent = 'Daily';
        dailyBadge.hidden = !daily;
        const { moreButton, actions } = createTaskActionMenu({
            row,
            label,
            task,
            rerender: buildMustDoCandidates
        });
        row.append(label, starBadge, dailyBadge, moreButton, actions);
        bindMustDoItemMoveInteractions(row, task);
        bindMustDoItemDragInteractions(row, task);

        mustDoSelection.appendChild(row);
    });
    mustDoSelection.appendChild(createMustDoAddItemRow());
}

function openMustDoOverlay() {
    ensureMustDoCriteria();
    renderMustDoCriteria();
    updateMustDoSummary();
    buildMustDoCandidates();
    openOverlay(mustDoOverlay);
}

function updateMustDoState() {
    renderMustDoList();
    saveState();
}

function completeTask(task) {
    if (!task) return;
    const isMustDo = state.mustDoTasks.includes(task);
    const isDaily = isDailyTask(task);
    lastCompletedTask = task;
    const completionTags = [
        isMustDo ? 'Star' : '',
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
    if (isMustDo) {
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
    nowTaskText.contentEditable = 'true';
    nowTaskText.focus();

    placeContentEditableCursorAtEnd(nowTaskText);
}

function finishInlineEdit() {
    if (!isEditing) return;
    isEditing = false;
    nowTaskText.contentEditable = 'false';
    nowTaskText.classList.remove('is-editing');
    const previousText = state.nowTask;
    const nextText = nowTaskText.textContent.trim();
    const wasEmpty = !state.nowTask;
    const wasMustDo = state.mustDoTasks.includes(previousText);
    const wasDaily = state.dailyTasks.includes(previousText);
    if (wasMustDo && previousText !== nextText) {
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

function shouldShowMigrationPrompt() {
    return Settings.shouldShowMigrationPrompt();
}

function showMigrationPromptIfNeeded() {
    Settings.showMigrationPromptIfNeeded();
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

async function transferSelectedSpaceNotes() {
    return Settings.transferSelectedSpaceNotes();
}

async function deleteCurrentSpace() {
    return Settings.deleteCurrentSpace();
}

async function finishMigration(mode) {
    return Settings.finishMigration(mode);
}

completeNowBtn.addEventListener('click', () => {
    if (!state.nowTask) return;
    completeTask(state.nowTask);
    renderNow();
    renderMustDoList();
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
    addInput.focus();
});

confirmAddBtn.addEventListener('click', () => {
    const added = addToBox(addInput.value);
    if (!added) return;
    addInput.value = '';
    closeOverlay(addOverlay);
});

addInput.addEventListener('keydown', e => {
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

ambientHint.addEventListener('dblclick', openMustDoOverlay);

mustDoSelection.addEventListener('dragover', event => {
    const dragTypes = Array.from(event.dataTransfer?.types || []);
    if (!dragTypes.includes('text/plain')) return;
    event.preventDefault();
    autoScrollMustDoSelection(event.clientY);
});

mustDoSelection.addEventListener('click', event => {
    if (event.target.closest('.candidate-more-btn, .candidate-actions')) return;
    mustDoSelection.querySelectorAll('.candidate-item.is-menu-open').forEach(item => {
        item.classList.remove('is-menu-open');
    });
});

confirmMustDoBtn.addEventListener('click', () => {
    closeOverlay(mustDoOverlay);
    renderMustDoList();
    saveState();
});

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

criterionDialogSaveBtn.addEventListener('click', saveCriterionNameDialog);
criterionDialogPinBtn.addEventListener('click', handleCriterionPinDialogAction);
criterionDialogDeleteBtn.addEventListener('click', handleCriterionDeleteDialogAction);
criterionDialogCancelBtn.addEventListener('click', closeCriterionDialog);
moveTaskCancelBtn.addEventListener('click', closeMoveTaskDialog);

criterionDialogInput.addEventListener('input', () => {
    criterionDialogMessage.textContent = '';
});

criterionDialogInput.addEventListener('keydown', event => {
    if (isTextCompositionEvent(event)) return;
    if (event.key === 'Enter') {
        event.preventDefault();
        saveCriterionNameDialog();
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        closeCriterionDialog();
    }
});

nowTaskText.addEventListener('click', startInlineEdit);
nowTaskText.addEventListener('blur', finishInlineEdit);
nowTaskText.addEventListener('keydown', e => {
    if (isTextCompositionEvent(e)) return;
    if (e.key === 'Enter') {
        e.preventDefault();
        nowTaskText.blur();
    }
});

Dialogs.bindCloseEvents();

async function initApp() {
    await refreshCloudSpaces();
    await loadState();
    isBooting = false;
    if (!StorageService.getCurrentSpace() && !localStorage.getItem(STORAGE_KEY)) {
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
    showMigrationPromptIfNeeded();
}

initApp();

window.addEventListener('storage', async e => {
    if (e.key === STORAGE_KEY || e.key === UPDATE_PING_KEY) {
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
