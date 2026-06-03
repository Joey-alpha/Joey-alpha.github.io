const STORAGE_KEY = 'activation-task-demo-state';
const UPDATE_PING_KEY = 'activation-task-demo-last-updated';
const SUPABASE_URL = 'https://ufwvkabshfrrodmtycjj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd3ZrYWJzaGZycm9kbXR5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjg4NjMsImV4cCI6MjA5NDc0NDg2M30.kSQJBTLSjd5XhLX0cddqjUfSw0QXt-Ilr2UsGPMamIo';
const SPACE_LIST_KEY = 'empty-box-spaces-v1';
const CURRENT_SPACE_ID_KEY = 'current_space_id';
const CURRENT_STORAGE_MODE_KEY = 'current_storage_mode';
const MIGRATION_DONE_KEY = 'empty-box-migration-done';
const MIGRATION_DISMISSED_KEY = 'empty-box-migration-dismissed';
const CLOUD_STATE_SOURCE = 'empty_box_state';
const DEFAULT_MUST_DO_CRITERIA = [
    { id: 'urgent', name: '紧急' },
    { id: 'important', name: '重要' }
];
const MUST_DO_TASK_LIMIT = 6;
const MUST_DO_INBOX_CRITERION = { id: '__inbox__', name: 'Inbox' };
const MUST_DO_CRITERION_DOUBLE_TAP_MS = 360;
const MUST_DO_CRITERION_TAP_MOVE_PX = 12;
const MUST_DO_HIDDEN_RETENTION_DAYS = 14;
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

const criterionDialogTitle = document.getElementById('criterionDialogTitle');
const criterionDialogInput = document.getElementById('criterionDialogInput');
const criterionDialogMessage = document.getElementById('criterionDialogMessage');
const criterionDialogSaveBtn = document.getElementById('criterionDialogSaveBtn');
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

function cloneDefaultMustDoCriteria() {
    return DEFAULT_MUST_DO_CRITERIA.map(criterion => ({ ...criterion }));
}

function createMustDoCriterionId() {
    return `criterion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isInboxMustDoCriterion(criterionId) {
    return criterionId === MUST_DO_INBOX_CRITERION.id;
}

function normalizeTaskList(value, dedupe = true) {
    const tasks = Array.isArray(value)
        ? value.map(task => typeof task === 'string' ? task.trim() : '').filter(Boolean)
        : [];
    return dedupe ? [...new Set(tasks)] : tasks;
}

function normalizeMustDoCriteria(value) {
    const source = Array.isArray(value) ? value : [];
    const criteria = [];
    source.forEach(item => {
        if (item && typeof item === 'object' && item.id === MUST_DO_INBOX_CRITERION.id) return;
        const rawName = typeof item === 'string'
            ? item
            : item && typeof item === 'object' && typeof item.name === 'string'
                ? item.name
                : '';
        const name = rawName.trim();
        if (!name) return;
        let id = (item && typeof item === 'object' && typeof item.id === 'string' ? item.id : '').trim();
        if (!id || criteria.some(criterion => criterion.id === id)) {
            id = createMustDoCriterionId();
        }
        criteria.push({ id, name });
    });
    return criteria.length ? criteria : cloneDefaultMustDoCriteria();
}

function normalizeMustDoHiddenByDate(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const hiddenByDate = {};
    Object.entries(value).forEach(([dateKey, hiddenByCriterion]) => {
        if (!hiddenByCriterion || typeof hiddenByCriterion !== 'object' || Array.isArray(hiddenByCriterion)) return;
        hiddenByDate[dateKey] = {};
        Object.entries(hiddenByCriterion).forEach(([criterionId, tasks]) => {
            hiddenByDate[dateKey][criterionId] = normalizeTaskList(tasks);
        });
    });
    return hiddenByDate;
}

function getStateTaskPool(source) {
    return normalizeTaskList([
        ...(Array.isArray(source.boxTasks) ? source.boxTasks : []),
        typeof source.nowTask === 'string' ? source.nowTask : ''
    ]);
}

function deriveMustDoTaskGroups(source, criteria, hiddenByDate) {
    const validCriterionIds = new Set(criteria.map(criterion => criterion.id));
    const taskPool = getStateTaskPool(source);
    const existingGroups = source.mustDoTaskGroups && typeof source.mustDoTaskGroups === 'object' && !Array.isArray(source.mustDoTaskGroups)
        ? source.mustDoTaskGroups
        : null;

    if (existingGroups) {
        const taskGroups = {};
        taskPool.forEach(task => {
            const criterionId = existingGroups[task];
            if (typeof criterionId === 'string' && validCriterionIds.has(criterionId)) {
                taskGroups[task] = criterionId;
            }
        });
        return taskGroups;
    }

    const hiddenByCriterion = new Map(criteria.map(criterion => [criterion.id, new Set()]));
    Object.values(hiddenByDate).forEach(hiddenForDate => {
        if (!hiddenForDate || typeof hiddenForDate !== 'object' || Array.isArray(hiddenForDate)) return;
        Object.entries(hiddenForDate).forEach(([criterionId, tasks]) => {
            if (!hiddenByCriterion.has(criterionId) || !Array.isArray(tasks)) return;
            tasks.forEach(task => hiddenByCriterion.get(criterionId).add(task));
        });
    });

    const taskGroups = {};
    taskPool.forEach(task => {
        const matchingCriteria = criteria.filter(criterion => !hiddenByCriterion.get(criterion.id).has(task));
        if (matchingCriteria.length === 1) {
            taskGroups[task] = matchingCriteria[0].id;
        }
    });
    return taskGroups;
}

function normalizeMustDoTaskOrder(value, taskGroups, taskPool) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const taskSet = new Set(taskPool);
    const validGroupIds = new Set([MUST_DO_INBOX_CRITERION.id, ...Object.values(taskGroups)]);
    const order = {};

    Object.entries(source).forEach(([groupId, tasks]) => {
        if (!validGroupIds.has(groupId)) return;
        const normalizedTasks = normalizeTaskList(tasks).filter(task => taskSet.has(task));
        if (normalizedTasks.length) {
            order[groupId] = normalizedTasks;
        }
    });

    taskPool.forEach(task => {
        const groupId = taskGroups[task] || MUST_DO_INBOX_CRITERION.id;
        if (!order[groupId]) order[groupId] = [];
        if (!order[groupId].includes(task)) {
            order[groupId].push(task);
        }
    });

    return order;
}

function normalizeState(parsed) {
    const source = parsed && typeof parsed === 'object' ? parsed : {};
    const mustDoCriteria = normalizeMustDoCriteria(source.mustDoCriteria);
    const mustDoHiddenByDate = normalizeMustDoHiddenByDate(source.mustDoHiddenByDate);
    const mustDoTaskGroups = deriveMustDoTaskGroups(source, mustDoCriteria, mustDoHiddenByDate);
    const taskPool = getStateTaskPool(source);
    const activeMustDoCriterionId = typeof source.activeMustDoCriterionId === 'string' &&
        (isInboxMustDoCriterion(source.activeMustDoCriterionId) ||
            mustDoCriteria.some(criterion => criterion.id === source.activeMustDoCriterionId))
        ? source.activeMustDoCriterionId
        : MUST_DO_INBOX_CRITERION.id;

    return {
        boxTasks: normalizeTaskList(source.boxTasks),
        completedTasks: normalizeTaskList(source.completedTasks, false),
        nowTask: typeof source.nowTask === 'string' ? source.nowTask : '',
        nowTaskStartedAt: Number.isFinite(source.nowTaskStartedAt) ? source.nowTaskStartedAt : 0,
        reflectionNote: typeof source.reflectionNote === 'string' ? source.reflectionNote : '',
        blindboxRejectCount: Number.isFinite(source.blindboxRejectCount) ? source.blindboxRejectCount : 0,
        blindboxCooldownUntil: Number.isFinite(source.blindboxCooldownUntil) ? source.blindboxCooldownUntil : 0,
        mustDoTasks: normalizeTaskList(source.mustDoTasks),
        mustDoCriteria,
        activeMustDoCriterionId,
        mustDoHiddenByDate,
        mustDoTaskGroups,
        mustDoTaskOrder: normalizeMustDoTaskOrder(source.mustDoTaskOrder, mustDoTaskGroups, taskPool)
    };
}

let state = {
    boxTasks: [],
    completedTasks: [],
    nowTask: '',
    nowTaskStartedAt: 0,
    reflectionNote: '',
    blindboxRejectCount: 0,
    blindboxCooldownUntil: 0,
    mustDoTasks: [],
    mustDoCriteria: cloneDefaultMustDoCriteria(),
    activeMustDoCriterionId: MUST_DO_INBOX_CRITERION.id,
    mustDoHiddenByDate: {},
    mustDoTaskGroups: {},
    mustDoTaskOrder: {}
};

let blindboxTask = '没有任务';
let isEditing = false;

let lastCompletedTask = null;
let shakeThreshold = 15;
let lastShake = 0;
let criterionDialogMode = 'add';
let criterionDialogCriterionId = null;
let pendingSpaceMode = 'local_only';
let pendingRenameSpaceId = null;
let isBooting = true;
let activeLegacyMode = false;
let pendingConfirmResolve = null;
let pendingMoveTask = '';

function createId(prefix) {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isTextCompositionEvent(event) {
    return event.isComposing || event.keyCode === 229;
}

function createEmptyState() {
    return normalizeState({});
}

function readJson(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function spaceStateKey(spaceId) {
    return `${STORAGE_KEY}::space::${spaceId}`;
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

function formatErrorMessage(error) {
    try {
        const detail = JSON.parse(String(error.message).replace(/^Supabase \d+:\s*/, ''));
        return detail.message || detail.details || error.message;
    } catch {
        return error && error.message ? error.message : String(error);
    }
}

const StorageService = {
    getSpaces() {
        const spaces = readJson(SPACE_LIST_KEY, []);
        return Array.isArray(spaces) ? spaces : [];
    },

    saveSpaces(spaces) {
        writeJson(SPACE_LIST_KEY, spaces);
    },

    replaceCloudSpaces(nextSpaces) {
        const byId = new Map();
        this.getSpaces()
            .filter(space => space.storage_mode !== 'cloud_sync')
            .forEach(space => byId.set(space.id, space));
        nextSpaces.forEach(space => {
            if (!space || !space.id) return;
            byId.set(space.id, {
                owner_id: null,
                created_at: new Date().toISOString(),
                ...space
            });
        });
        const merged = [...byId.values()].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
        this.saveSpaces(merged);
        this.ensureValidCurrentSpace();
        return merged;
    },

    async syncCloudSpaces() {
        // Cloud spaces are shared through Supabase; local_only spaces remain browser-local.
        const rows = await supabaseRequest('spaces?select=id,owner_id,name,storage_mode,created_at&order=created_at.asc');
        const cloudSpaces = (Array.isArray(rows) ? rows : [])
            .filter(space => space && space.storage_mode === 'cloud_sync');
        return this.replaceCloudSpaces(cloudSpaces);
    },

    ensureValidCurrentSpace() {
        const currentId = localStorage.getItem(CURRENT_SPACE_ID_KEY);
        if (!currentId) return null;
        const spaces = this.getSpaces();
        const current = spaces.find(space => space.id === currentId);
        if (current) return current;
        const fallback = spaces.find(space => space.storage_mode === 'local_only') || spaces[0] || null;
        if (fallback) {
            localStorage.setItem(CURRENT_SPACE_ID_KEY, fallback.id);
            localStorage.setItem(CURRENT_STORAGE_MODE_KEY, fallback.storage_mode);
            return fallback;
        }
        localStorage.removeItem(CURRENT_SPACE_ID_KEY);
        localStorage.removeItem(CURRENT_STORAGE_MODE_KEY);
        activeLegacyMode = true;
        return null;
    },

    getCurrentSpace() {
        this.ensureValidCurrentSpace();
        const currentId = localStorage.getItem(CURRENT_SPACE_ID_KEY);
        return this.getSpaces().find(space => space.id === currentId) || null;
    },

    async createSpace({ name, storage_mode = 'local_only', initialState = createEmptyState() }) {
        const now = new Date().toISOString();
        const space = {
            id: createId('space'),
            owner_id: null,
            name: name || (storage_mode === 'cloud_sync' ? '云端 Space' : '本地 Space'),
            storage_mode,
            created_at: now
        };

        if (storage_mode === 'cloud_sync') {
            await supabaseRequest('spaces', {
                method: 'POST',
                body: JSON.stringify(space)
            });
        }

        const spaces = this.getSpaces().filter(item => item.id !== space.id);
        spaces.push(space);
        this.saveSpaces(spaces);
        await this.setCurrentSpace(space.id);
        if (space.storage_mode === 'cloud_sync') {
            await this.saveCloudState(normalizeState(initialState), space);
            localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
        } else {
            await this.saveAppState(initialState, space);
        }
        return space;
    },

    async renameSpace(spaceId, name) {
        const nextName = String(name || '').trim();
        if (!nextName) throw new Error('Space 名称不能为空');

        const space = this.getSpaceById(spaceId);
        if (!space) throw new Error('找不到要重命名的 Space');

        const updated = { ...space, name: nextName };
        if (space.storage_mode === 'cloud_sync') {
            await supabaseRequest(`spaces?id=eq.${encodeURIComponent(space.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({ name: nextName })
            });
        }

        const spaces = this.getSpaces().map(item => item.id === space.id ? updated : item);
        this.saveSpaces(spaces);
        localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
        return updated;
    },

    async setCurrentSpace(spaceId) {
        const space = this.getSpaces().find(item => item.id === spaceId);
        if (!space) return null;
        localStorage.setItem(CURRENT_SPACE_ID_KEY, space.id);
        localStorage.setItem(CURRENT_STORAGE_MODE_KEY, space.storage_mode);
        activeLegacyMode = false;
        return space;
    },

    getSpaceById(spaceId) {
        return this.getSpaces().find(item => item.id === spaceId) || null;
    },

    async getSpaceState(space) {
        if (!space) return createEmptyState();
        if (space.storage_mode === 'cloud_sync') {
            return this.getCloudState(space);
        }
        return normalizeState(readJson(spaceStateKey(space.id), {}));
    },

    async saveStateToSpace(nextState, space) {
        if (!space) return;
        const normalized = normalizeState(nextState);
        if (space.storage_mode === 'cloud_sync') {
            await this.saveCloudState(normalized, space);
        } else {
            writeJson(spaceStateKey(space.id), normalized);
        }
        localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
    },

    async clearSpaceState(space) {
        if (!space) return;
        if (space.storage_mode === 'cloud_sync') {
            await supabaseRequest(`notes?space_id=eq.${encodeURIComponent(space.id)}`, {
                method: 'DELETE'
            });
        } else {
            localStorage.removeItem(spaceStateKey(space.id));
        }
        localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
    },

    async getCurrentState() {
        const space = this.getCurrentSpace();
        if (!space) {
            activeLegacyMode = true;
            return normalizeState(readJson(STORAGE_KEY, {}));
        }
        activeLegacyMode = false;
        if (space.storage_mode === 'cloud_sync') {
            return this.getCloudState(space);
        }
        return normalizeState(readJson(spaceStateKey(space.id), {}));
    },

    async saveAppState(nextState, forcedSpace = null) {
        if (isBooting) return;
        const normalized = normalizeState(nextState);
        const space = forcedSpace || this.getCurrentSpace();

        if (!space || activeLegacyMode) {
            writeJson(STORAGE_KEY, normalized);
            localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
            return;
        }

        if (space.storage_mode === 'cloud_sync') {
            this.saveCloudState(normalized, space).catch(error => {
                console.error('Cloud sync failed:', error);
                if (spaceStatus) spaceStatus.textContent = `云端同步失败：${formatErrorMessage(error)}`;
            });
        } else {
            writeJson(spaceStateKey(space.id), normalized);
        }
        localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
    },

    async getCloudState(space) {
        const rows = await this.getNotes(space.id, CLOUD_STATE_SOURCE);
        const snapshot = rows[0];
        if (!snapshot) return createEmptyState();
        return normalizeState(JSON.parse(snapshot.content || '{}'));
    },

    async saveCloudState(nextState, space) {
        const id = `state-${space.id}`;
        const now = new Date().toISOString();
        const note = {
            id,
            owner_id: null,
            space_id: space.id,
            content: JSON.stringify(nextState),
            source: CLOUD_STATE_SOURCE,
            old_local_id: space.id,
            created_at: now,
            updated_at: now
        };
        const existing = await supabaseRequest(`notes?id=eq.${encodeURIComponent(id)}&select=id`);
        if (existing.length) {
            await supabaseRequest(`notes?id=eq.${encodeURIComponent(id)}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    content: note.content,
                    source: note.source,
                    old_local_id: note.old_local_id,
                    updated_at: note.updated_at
                })
            });
            return;
        }
        await supabaseRequest('notes', {
            method: 'POST',
            body: JSON.stringify(note)
        });
    },

    async addNote(note) {
        const space = this.getCurrentSpace();
        if (!space) return null;
        const now = new Date().toISOString();
        const nextNote = {
            id: note.id || createId('note'),
            owner_id: note.owner_id || null,
            space_id: note.space_id || space.id,
            content: note.content || '',
            source: note.source || 'manual',
            old_local_id: note.old_local_id || null,
            created_at: note.created_at || now,
            updated_at: now
        };
        if (space.storage_mode === 'cloud_sync') {
            await supabaseRequest('notes', {
                method: 'POST',
                body: JSON.stringify(nextNote)
            });
        }
        return nextNote;
    },

    async getNotes(spaceId, source = '') {
        const sourceFilter = source ? `&source=eq.${encodeURIComponent(source)}` : '';
        return supabaseRequest(`notes?space_id=eq.${encodeURIComponent(spaceId)}${sourceFilter}&order=updated_at.desc`);
    },

    async updateNote(noteId, patch) {
        const now = new Date().toISOString();
        return supabaseRequest(`notes?id=eq.${encodeURIComponent(noteId)}`, {
            method: 'PATCH',
            body: JSON.stringify({ ...patch, updated_at: now })
        });
    },

    async deleteNote(noteId) {
        return supabaseRequest(`notes?id=eq.${encodeURIComponent(noteId)}`, {
            method: 'DELETE'
        });
    },

    async assertCloudSpaceDeleted(spaceId) {
        const [remainingNotes, remainingSpaces] = await Promise.all([
            supabaseRequest(`notes?space_id=eq.${encodeURIComponent(spaceId)}&select=id&limit=1`),
            supabaseRequest(`spaces?id=eq.${encodeURIComponent(spaceId)}&select=id&limit=1`)
        ]);
        if ((Array.isArray(remainingNotes) && remainingNotes.length) ||
            (Array.isArray(remainingSpaces) && remainingSpaces.length)) {
            throw new Error('云端删除未生效：请检查 Supabase spaces/notes 表的 DELETE policy 或外键约束。');
        }
    },

    async deleteSpace(spaceId) {
        const space = this.getSpaceById(spaceId);
        if (!space) return null;

        if (space.storage_mode === 'cloud_sync') {
            await supabaseRequest(`notes?space_id=eq.${encodeURIComponent(space.id)}`, {
                method: 'DELETE',
                headers: { Prefer: 'return=representation' }
            });
            await supabaseRequest(`spaces?id=eq.${encodeURIComponent(space.id)}`, {
                method: 'DELETE',
                headers: { Prefer: 'return=representation' }
            });
            await this.assertCloudSpaceDeleted(space.id);
        } else {
            localStorage.removeItem(spaceStateKey(space.id));
        }

        const nextSpaces = this.getSpaces().filter(item => item.id !== space.id);
        this.saveSpaces(nextSpaces);

        if (localStorage.getItem(CURRENT_SPACE_ID_KEY) === space.id) {
            const fallback = nextSpaces.find(item => item.storage_mode === 'local_only') || nextSpaces[0] || null;
            if (fallback) {
                await this.setCurrentSpace(fallback.id);
            } else {
                localStorage.removeItem(CURRENT_SPACE_ID_KEY);
                localStorage.removeItem(CURRENT_STORAGE_MODE_KEY);
                activeLegacyMode = false;
            }
        }

        localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
        return space;
    },

    async transferSpaceNotes(sourceSpaceId, targetSpaceId) {
        const source = this.getSpaceById(sourceSpaceId);
        const target = this.getSpaceById(targetSpaceId);
        if (!source || !target) throw new Error('请选择有效的源 Space 和目标 Space');
        if (source.id === target.id) throw new Error('源 Space 和目标 Space 不能相同');

        const sourceState = await this.getSpaceState(source);
        const targetState = await this.getSpaceState(target);
        const merged = mergeTransferStates(targetState, sourceState);
        await this.saveStateToSpace(merged, target);
        await this.clearSpaceState(source);
        await this.setCurrentSpace(target.id);
        return { source, target, state: merged };
    },

    async migrateLegacyData(mode) {
        const legacyState = normalizeState(readJson(STORAGE_KEY, {}));
        const backupKey = `${STORAGE_KEY}::legacy-backup::${Date.now()}`;
        writeJson(backupKey, legacyState);

        if (mode === 'local_only' || mode === 'cloud_sync') {
            await this.createSpace({
                name: mode === 'cloud_sync' ? '旧数据云端 Space' : '旧数据本地 Space',
                storage_mode: mode,
                initialState: legacyState
            });
            localStorage.setItem(MIGRATION_DONE_KEY, 'true');
            localStorage.removeItem(MIGRATION_DISMISSED_KEY);
            return legacyState;
        }

        const existingSpace = this.getCurrentSpace();
        if (!existingSpace) {
            await this.createSpace({
                name: '合并后的本地 Space',
                storage_mode: 'local_only',
                initialState: legacyState
            });
            localStorage.setItem(MIGRATION_DONE_KEY, 'true');
            localStorage.removeItem(MIGRATION_DISMISSED_KEY);
            return legacyState;
        }

        const current = await this.getCurrentState();
        const merged = mergeStates(current, legacyState);
        await this.saveAppState(merged);
        localStorage.setItem(MIGRATION_DONE_KEY, 'true');
        localStorage.removeItem(MIGRATION_DISMISSED_KEY);
        return merged;
    },

    async exportData() {
        const space = this.getCurrentSpace();
        return {
            version: 2,
            exported_at: new Date().toISOString(),
            current_space_id: space ? space.id : null,
            current_storage_mode: space ? space.storage_mode : 'legacy_local',
            spaces: this.getSpaces(),
            state
        };
    },

    async importData(payload) {
        const importedState = payload && payload.version === 2 ? payload.state : payload;
        state = normalizeState(importedState);
        await this.saveAppState(state);
        return state;
    }
};

window.EmptyBoxStorage = StorageService;

function mergeUnique(a, b) {
    return [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].filter(Boolean))];
}

function mergeStates(target, source) {
    const base = normalizeState(target);
    const incoming = normalizeState(source);
    return normalizeState({
        ...base,
        boxTasks: mergeUnique(base.boxTasks, incoming.boxTasks),
        completedTasks: mergeUnique(base.completedTasks, incoming.completedTasks),
        nowTask: base.nowTask || incoming.nowTask,
        nowTaskStartedAt: base.nowTaskStartedAt || incoming.nowTaskStartedAt,
        reflectionNote: [base.reflectionNote, incoming.reflectionNote].filter(Boolean).join('\n\n'),
        blindboxRejectCount: Math.max(base.blindboxRejectCount, incoming.blindboxRejectCount),
        blindboxCooldownUntil: Math.max(base.blindboxCooldownUntil, incoming.blindboxCooldownUntil),
        mustDoTasks: mergeUnique(base.mustDoTasks, incoming.mustDoTasks).slice(0, MUST_DO_TASK_LIMIT),
        mustDoCriteria: mergeCriteria(base.mustDoCriteria, incoming.mustDoCriteria),
        activeMustDoCriterionId: base.activeMustDoCriterionId || incoming.activeMustDoCriterionId,
        mustDoHiddenByDate: { ...incoming.mustDoHiddenByDate, ...base.mustDoHiddenByDate },
        mustDoTaskGroups: { ...incoming.mustDoTaskGroups, ...base.mustDoTaskGroups },
        mustDoTaskOrder: { ...incoming.mustDoTaskOrder, ...base.mustDoTaskOrder }
    });
}

function mergeTransferStates(target, source) {
    const base = normalizeState(target);
    const incoming = normalizeState(source);
    return normalizeState({
        ...base,
        boxTasks: mergeUnique(base.boxTasks, incoming.boxTasks),
        completedTasks: mergeUnique(base.completedTasks, incoming.completedTasks),
        nowTask: base.nowTask || incoming.nowTask,
        nowTaskStartedAt: base.nowTaskStartedAt || incoming.nowTaskStartedAt,
        reflectionNote: [base.reflectionNote, incoming.reflectionNote].filter(Boolean).join('\n\n'),
        blindboxRejectCount: Math.max(base.blindboxRejectCount, incoming.blindboxRejectCount),
        blindboxCooldownUntil: Math.max(base.blindboxCooldownUntil, incoming.blindboxCooldownUntil),
        mustDoTasks: base.mustDoTasks,
        mustDoCriteria: base.mustDoCriteria,
        activeMustDoCriterionId: base.activeMustDoCriterionId,
        mustDoHiddenByDate: base.mustDoHiddenByDate,
        mustDoTaskGroups: base.mustDoTaskGroups,
        mustDoTaskOrder: base.mustDoTaskOrder
    });
}

function mergeCriteria(a, b) {
    const seen = new Set();
    return [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])].filter(item => {
        if (!item || seen.has(item.name)) return false;
        seen.add(item.name);
        return true;
    });
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
    renderMustDoList();
    saveState();
}

function openOverlay(el) {
    el.classList.add('active');
}

function closeOverlay(el) {
    el.classList.remove('active');
}

function closeConfirmDialog(result = false) {
    closeOverlay(confirmOverlay);
    if (pendingConfirmResolve) {
        pendingConfirmResolve(result);
        pendingConfirmResolve = null;
    }
}

function openConfirmDialog({ title, message, confirmText = '确定', danger = false }) {
    if (pendingConfirmResolve) {
        pendingConfirmResolve(false);
        pendingConfirmResolve = null;
    }
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmAcceptBtn.textContent = confirmText;
    confirmAcceptBtn.classList.toggle('danger', danger);
    openOverlay(confirmOverlay);
    confirmAcceptBtn.focus();
    return new Promise(resolve => {
        pendingConfirmResolve = resolve;
    });
}

function reorderSelectedMustDoTask(draggedTask, targetTask) {
    if (!draggedTask || !targetTask || draggedTask === targetTask) return false;
    const tasks = [...state.mustDoTasks];
    const fromIndex = tasks.indexOf(draggedTask);
    const toIndex = tasks.indexOf(targetTask);
    if (fromIndex === -1 || toIndex === -1) return false;
    tasks.splice(fromIndex, 1);
    tasks.splice(toIndex, 0, draggedTask);
    state.mustDoTasks = tasks;
    renderMustDoList();
    saveState();
    return true;
}

function bindMustDoListItemDragInteractions(item, task) {
    item.draggable = true;
    item.dataset.task = task;
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let didPointerDrag = false;

    item.addEventListener('dragstart', event => {
        item.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-empty-box-selected-task', task);
    });
    item.addEventListener('dragend', () => {
        item.classList.remove('is-dragging');
    });
    item.addEventListener('dragover', event => {
        event.preventDefault();
        const draggedTask = event.dataTransfer.getData('application/x-empty-box-selected-task');
        if (!draggedTask || draggedTask === task) return;
        item.classList.add('is-drag-over');
    });
    item.addEventListener('dragleave', () => {
        item.classList.remove('is-drag-over');
    });
    item.addEventListener('drop', event => {
        event.preventDefault();
        item.classList.remove('is-drag-over');
        const draggedTask = event.dataTransfer.getData('application/x-empty-box-selected-task');
        reorderSelectedMustDoTask(draggedTask, task);
    });

    item.addEventListener('pointerdown', event => {
        if (event.pointerType === 'mouse') return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        didPointerDrag = false;
        if (item.setPointerCapture) item.setPointerCapture(event.pointerId);
    });
    item.addEventListener('pointermove', event => {
        if (pointerId !== event.pointerId) return;
        const moved = Math.hypot(event.clientX - startX, event.clientY - startY);
        if (moved <= MUST_DO_CRITERION_TAP_MOVE_PX) return;
        didPointerDrag = true;
        item.classList.add('is-dragging');
        event.preventDefault();
    });
    item.addEventListener('pointerup', event => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        item.classList.remove('is-dragging');
        if (item.releasePointerCapture && item.hasPointerCapture && item.hasPointerCapture(event.pointerId)) {
            item.releasePointerCapture(event.pointerId);
        }
        if (!didPointerDrag) return;
        event.preventDefault();
        event.stopPropagation();
        item.dataset.suppressClickUntil = String(Date.now() + 350);
        const targetItem = document.elementFromPoint(event.clientX, event.clientY)?.closest('.must-do-item');
        reorderSelectedMustDoTask(task, targetItem?.dataset.task);
    });
    item.addEventListener('pointercancel', event => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        didPointerDrag = false;
        item.classList.remove('is-dragging');
    });
}

function renderMustDoList() {
    mustDoList.innerHTML = '';
    if (!state.mustDoTasks.length) {
        mustDoPanel.classList.remove('active');
        mustDoList.innerHTML = '<div class="reflection-empty">当前未设置必做任务</div>';
        return;
    }
    mustDoPanel.classList.add('active');
    state.mustDoTasks.forEach((task, index) => {
        const item = document.createElement('div');
        item.className = 'must-do-item';
        const taskText = document.createElement('span');
        taskText.textContent = task;
        const orderText = document.createElement('span');
        orderText.className = 'must-do-order';
        orderText.textContent = String(index + 1);
        item.append(taskText, orderText);
        bindMustDoListItemDragInteractions(item, task);
        item.addEventListener('click', event => {
            if (Date.now() < Number(item.dataset.suppressClickUntil || 0)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (state.nowTask && state.nowTask !== task && !state.boxTasks.includes(state.nowTask)) {
                prependTaskToBox(state.nowTask, getTaskGroupIdRaw(state.nowTask));
            }
            state.boxTasks = state.boxTasks.filter(item => item !== task);
            state.nowTask = task;
            state.nowTaskStartedAt = Date.now();
            renderNow();
        });
        mustDoList.appendChild(item);
    });
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
    return [...new Set([...state.boxTasks, state.nowTask].filter(Boolean))];
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

function prependTaskToGroupOrder(task, groupId = MUST_DO_INBOX_CRITERION.id) {
    ensureMustDoCriteria();
    if (!task) return;
    removeTaskFromAllGroupOrders(task);
    if (!state.mustDoTaskOrder[groupId]) state.mustDoTaskOrder[groupId] = [];
    state.mustDoTaskOrder[groupId] = [task, ...normalizeTaskList(state.mustDoTaskOrder[groupId])];
}

function prependTaskToBox(task, groupId = MUST_DO_INBOX_CRITERION.id) {
    if (!task) return;
    state.boxTasks = state.boxTasks.filter(item => item !== task);
    state.boxTasks.unshift(task);
    if (isInboxMustDoCriterion(groupId)) {
        delete state.mustDoTaskGroups[task];
    } else {
        state.mustDoTaskGroups[task] = groupId;
    }
    prependTaskToGroupOrder(task, groupId);
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

function getGroupedMustDoCandidates() {
    ensureMustDoCriteria();
    const activeId = state.activeMustDoCriterionId;
    const tasks = getMustDoCandidatePool().filter(task => {
        const groupId = getTaskGroupId(task);
        return isInboxMustDoCriterion(activeId) ? isInboxMustDoCriterion(groupId) : groupId === activeId;
    });
    const order = state.mustDoTaskOrder[activeId] || [];
    return [
        ...order.filter(task => tasks.includes(task)),
        ...tasks.filter(task => !order.includes(task))
    ];
}

function setActiveGroupTaskOrder(tasks) {
    ensureMustDoCriteria();
    const activeId = state.activeMustDoCriterionId;
    const activeTasks = getGroupedMustDoCandidates();
    state.mustDoTaskOrder[activeId] = normalizeTaskList(tasks).filter(task => activeTasks.includes(task));
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
    criterionDialogTitle.textContent = mode === 'add' ? '新增分组' : '修改分组';
    criterionDialogInput.style.display = 'block';
    criterionDialogInput.value = criterion ? criterion.name : '';
    criterionDialogMessage.textContent = '';
    criterionDialogSaveBtn.style.display = 'inline-flex';
    criterionDialogSaveBtn.textContent = mode === 'add' ? '新增' : '保存';
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
    criterionDialogDeleteBtn.style.display = 'none';
    criterionDialogCancelBtn.textContent = '知道了';
    openOverlay(criterionOverlay);
}

function openCriterionDeleteDialog(criterion) {
    criterionDialogMode = 'delete';
    criterionDialogCriterionId = criterion.id;
    criterionDialogTitle.textContent = '删除分组';
    criterionDialogInput.style.display = 'none';
    criterionDialogMessage.textContent = `删除“${criterion.name}”？`;
    criterionDialogSaveBtn.style.display = 'none';
    criterionDialogDeleteBtn.style.display = 'inline-flex';
    criterionDialogCancelBtn.textContent = '取消';
    openOverlay(criterionOverlay);
}

function openCriterionManageDialog(criterion) {
    criterionDialogMode = 'manage';
    criterionDialogCriterionId = criterion.id;
    criterionDialogTitle.textContent = criterion.name;
    criterionDialogInput.style.display = 'none';
    criterionDialogMessage.textContent = '管理这个分组';
    criterionDialogSaveBtn.style.display = 'inline-flex';
    criterionDialogSaveBtn.textContent = '重命名';
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
        showCriterionDialogMessage('请输入分组名');
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
            showCriterionDialogMessage('已经有这个分组');
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

function deleteMustDoCriterion(criterionId) {
    ensureMustDoCriteria();
    if (isInboxMustDoCriterion(criterionId)) {
        openCriterionMessageDialog('不能删除', 'Inbox 是默认分组');
        return;
    }
    if (state.mustDoCriteria.length <= 1) {
        openCriterionMessageDialog('不能删除', '至少保留一个分组');
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
    closeCriterionDialog();
    refreshMustDoOverlayState();
}

function bindMustDoCriterionInteractions(button, criterion) {
    button.addEventListener('dragover', event => {
        event.preventDefault();
        event.stopPropagation();
        button.classList.add('is-drop-target');
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    });
    button.addEventListener('dragleave', () => {
        button.classList.remove('is-drop-target');
    });
    button.addEventListener('drop', event => {
        event.preventDefault();
        event.stopPropagation();
        button.classList.remove('is-drop-target');
        const draggedCriterionId = event.dataTransfer.getData('application/x-empty-box-criterion');
        if (draggedCriterionId) {
            const rect = button.getBoundingClientRect();
            const position = event.clientX > rect.left + rect.width / 2 ? 'after' : 'before';
            reorderMustDoCriterion(draggedCriterionId, criterion.id, position);
            return;
        }
        const task = event.dataTransfer.getData('application/x-empty-box-task') || event.dataTransfer.getData('text/plain');
        if (!task) return;
        moveTaskToGroup(task, criterion.id);
    });

    if (isInboxMustDoCriterion(criterion.id)) {
        button.addEventListener('click', event => {
            event.preventDefault();
            activateMustDoCriterion(criterion.id);
        });
        button.addEventListener('dblclick', event => {
            event.preventDefault();
            event.stopPropagation();
        });
        return;
    }

    let lastTouchTap = { ts: 0, x: 0, y: 0 };
    let suppressClickUntil = 0;

    button.draggable = true;
    button.addEventListener('dragstart', event => {
        button.classList.add('is-dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('application/x-empty-box-criterion', criterion.id);
    });
    button.addEventListener('dragend', () => {
        button.classList.remove('is-dragging');
        mustDoCriteriaBar.querySelectorAll('.is-drop-target').forEach(item => item.classList.remove('is-drop-target'));
    });

    button.addEventListener('contextmenu', event => {
        event.preventDefault();
        event.stopPropagation();
        manageMustDoCriterion(criterion.id);
    });
    button.addEventListener('selectstart', event => event.preventDefault());

    button.addEventListener('click', event => {
        if (Date.now() < suppressClickUntil) {
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        event.preventDefault();
        activateMustDoCriterion(criterion.id);
    });

    button.addEventListener('pointerup', event => {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        const now = Date.now();
        const closeToLastTap = Math.hypot(event.clientX - lastTouchTap.x, event.clientY - lastTouchTap.y) <= MUST_DO_CRITERION_TAP_MOVE_PX;
        if (lastTouchTap.ts && now - lastTouchTap.ts < MUST_DO_CRITERION_DOUBLE_TAP_MS && closeToLastTap) {
            event.preventDefault();
            event.stopPropagation();
            lastTouchTap = { ts: 0, x: 0, y: 0 };
            suppressClickUntil = Date.now() + 350;
            manageMustDoCriterion(criterion.id);
        } else {
            lastTouchTap = { ts: now, x: event.clientX, y: event.clientY };
        }
    });

    button.addEventListener('dblclick', event => {
        event.preventDefault();
        event.stopPropagation();
        manageMustDoCriterion(criterion.id);
    });
}

function renderMustDoCriteria() {
    ensureMustDoCriteria();
    mustDoCriteriaBar.innerHTML = '';
    const inboxCount = getTaskGroupCount(MUST_DO_INBOX_CRITERION.id);
    const inboxButton = document.createElement('button');
    inboxButton.type = 'button';
    inboxButton.className = `must-do-criterion fixed${inboxCount ? ' has-tasks' : ''}${isInboxMustDoCriterion(state.activeMustDoCriterionId) ? ' active' : ''}`;
    inboxButton.dataset.criterionId = MUST_DO_INBOX_CRITERION.id;
    inboxButton.dataset.count = String(inboxCount);
    inboxButton.setAttribute('aria-pressed', isInboxMustDoCriterion(state.activeMustDoCriterionId) ? 'true' : 'false');
    inboxButton.title = inboxCount ? `未分组任务 · ${inboxCount} 项` : '未分组任务';
    inboxButton.textContent = MUST_DO_INBOX_CRITERION.name;
    bindMustDoCriterionInteractions(inboxButton, MUST_DO_INBOX_CRITERION);
    mustDoCriteriaBar.appendChild(inboxButton);

    state.mustDoCriteria.forEach(criterion => {
        const taskCount = getTaskGroupCount(criterion.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `must-do-criterion${taskCount ? ' has-tasks' : ''}${criterion.id === state.activeMustDoCriterionId ? ' active' : ''}`;
        button.dataset.criterionId = criterion.id;
        button.dataset.count = String(taskCount);
        button.setAttribute('aria-pressed', criterion.id === state.activeMustDoCriterionId ? 'true' : 'false');
        button.title = taskCount ? `${criterion.name} · ${taskCount} 项` : criterion.name;
        button.textContent = criterion.name;
        bindMustDoCriterionInteractions(button, criterion);
        mustDoCriteriaBar.appendChild(button);
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'must-do-criterion add';
    addButton.setAttribute('aria-label', '新增分组');
    addButton.title = '新增分组';
    addButton.textContent = '+';
    addButton.addEventListener('click', addMustDoCriterion);
    mustDoCriteriaBar.appendChild(addButton);
}

function addMustDoCriterion() {
    openCriterionNameDialog('add');
}

function getMoveTaskGroups() {
    ensureMustDoCriteria();
    return [MUST_DO_INBOX_CRITERION, ...state.mustDoCriteria];
}

function replaceTaskTextInList(list, previousText, nextText) {
    return normalizeTaskList((Array.isArray(list) ? list : []).map(task => task === previousText ? nextText : task));
}

function taskTextExists(text, previousText) {
    if (!text || text === previousText) return false;
    return state.boxTasks.includes(text) ||
        state.mustDoTasks.includes(text) ||
        state.nowTask === text ||
        state.completedTasks.includes(text);
}

function renameTaskText(previousText, nextText) {
    const trimmedText = nextText.trim();
    if (!previousText || previousText === trimmedText) return { ok: true };
    if (!trimmedText) return { ok: false, message: '任务内容不能为空' };
    if (taskTextExists(trimmedText, previousText)) return { ok: false, message: '已存在同名任务' };

    state.boxTasks = replaceTaskTextInList(state.boxTasks, previousText, trimmedText);
    state.mustDoTasks = replaceTaskTextInList(state.mustDoTasks, previousText, trimmedText);
    if (state.nowTask === previousText) state.nowTask = trimmedText;
    if (blindboxTask === previousText) {
        blindboxTask = trimmedText;
        blindboxTaskText.textContent = trimmedText;
    }

    if (state.mustDoTaskGroups[previousText]) {
        const previousGroupId = state.mustDoTaskGroups[previousText];
        delete state.mustDoTaskGroups[previousText];
        state.mustDoTaskGroups[trimmedText] = previousGroupId;
    }
    Object.keys(state.mustDoTaskOrder).forEach(groupId => {
        state.mustDoTaskOrder[groupId] = replaceTaskTextInList(state.mustDoTaskOrder[groupId], previousText, trimmedText);
    });
    Object.values(state.mustDoHiddenByDate).forEach(hiddenByCriterion => {
        if (!hiddenByCriterion || typeof hiddenByCriterion !== 'object') return;
        Object.keys(hiddenByCriterion).forEach(criterionId => {
            hiddenByCriterion[criterionId] = replaceTaskTextInList(hiddenByCriterion[criterionId], previousText, trimmedText);
        });
    });
    return { ok: true };
}

function closeMoveTaskDialog() {
    pendingMoveTask = '';
    closeOverlay(moveTaskOverlay);
}

function openMoveTaskDialog(task) {
    pendingMoveTask = task;
    moveTaskTitle.textContent = `移动“${task}”`;
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

function startMustDoItemTextEdit(row, label, task) {
    row.draggable = false;
    row.classList.remove('is-actions-revealed');
    row.classList.add('is-editing');
    const input = document.createElement('input');
    input.className = 'must-do-inline-input';
    input.value = task;
    input.setAttribute('aria-label', '编辑任务内容');
    label.replaceWith(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (shouldSave, source = 'commit') => {
        if (finished) return;
        finished = true;
        if (!shouldSave) {
            row.classList.remove('is-editing');
            buildMustDoCandidates();
            return;
        }
        const result = renameTaskText(task, input.value);
        if (!result.ok) {
            if (source === 'blur') {
                row.classList.remove('is-editing');
                buildMustDoCandidates();
                return;
            }
            finished = false;
            input.setCustomValidity(result.message);
            input.reportValidity();
            input.focus();
            input.select();
            return;
        }
        input.setCustomValidity('');
        row.classList.remove('is-editing');
        buildMustDoCandidates();
        updateMustDoSummary();
        renderNow();
    };

    input.addEventListener('pointerdown', event => event.stopPropagation());
    input.addEventListener('click', event => event.stopPropagation());
    input.addEventListener('dblclick', event => event.stopPropagation());
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
    input.addEventListener('blur', () => finish(true, 'blur'));
}

function buildMustDoCandidates() {
    mustDoSelection.innerHTML = '';
    const isInbox = isInboxMustDoCriterion(state.activeMustDoCriterionId);
    const tasks = getGroupedMustDoCandidates();
    if (!tasks.length) {
        const empty = document.createElement('div');
        empty.className = 'reflection-empty';
        empty.textContent = isInbox ? 'Inbox 为空' : '这个分组还没有任务';
        mustDoSelection.appendChild(empty);
        return;
    }
    tasks.forEach(task => {
        const selected = state.mustDoTasks.includes(task);
        const row = document.createElement('div');
        row.className = 'candidate-item';
        row.title = '拖动排序，点击 ⋯ 查看操作';
        const label = document.createElement('span');
        label.className = 'candidate-text';
        label.textContent = task;
        const moreButton = document.createElement('button');
        moreButton.type = 'button';
        moreButton.className = 'candidate-more-btn';
        moreButton.setAttribute('aria-label', '更多操作');
        moreButton.textContent = '⋯';
        const actions = document.createElement('div');
        actions.className = 'candidate-actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn secondary compact';
        editButton.textContent = '编辑';
        const moveButton = document.createElement('button');
        moveButton.type = 'button';
        moveButton.className = 'btn secondary compact';
        moveButton.textContent = '移动';
        const completeButton = document.createElement('button');
        completeButton.type = 'button';
        completeButton.className = 'btn secondary compact';
        completeButton.textContent = '完成';
        const selectButton = document.createElement('button');
        selectButton.type = 'button';
        selectButton.className = `btn ${selected ? 'primary' : 'secondary'} compact`;
        selectButton.textContent = selected ? '取消' : '选中';
        actions.append(editButton, moveButton, completeButton, selectButton);
        row.append(label, moreButton, actions);
        bindMustDoItemMoveInteractions(row, task);
        bindMustDoItemDragInteractions(row, task);

        moreButton.addEventListener('click', (e) => {
            e.stopPropagation();
            const shouldOpen = !row.classList.contains('is-menu-open');
            mustDoSelection.querySelectorAll('.candidate-item.is-menu-open').forEach(item => {
                item.classList.remove('is-menu-open');
            });
            row.classList.toggle('is-menu-open', shouldOpen);
        });

        editButton.addEventListener('click', (e) => {
            e.stopPropagation();
            row.classList.remove('is-menu-open');
            startMustDoItemTextEdit(row, label, task);
        });

        moveButton.addEventListener('click', (e) => {
            e.stopPropagation();
            row.classList.remove('is-menu-open');
            openMoveTaskDialog(task);
        });

        completeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            row.classList.remove('is-menu-open');
            completeTask(task);
            buildMustDoCandidates();
            updateMustDoSummary();
            renderMustDoList();
            renderNow();
        });

        selectButton.addEventListener('click', (e) => {
            e.stopPropagation();
            row.classList.remove('is-menu-open');
            if (selected) {
                state.mustDoTasks = state.mustDoTasks.filter(t => t !== task);
                buildMustDoCandidates();
                updateMustDoSummary();
                renderMustDoList();
                saveState();
                return;
            }
            if (state.mustDoTasks.length < MUST_DO_TASK_LIMIT) {
                state.mustDoTasks.push(task);
                buildMustDoCandidates();
                updateMustDoSummary();
                renderMustDoList();
                saveState();
            }
        });

        mustDoSelection.appendChild(row);
    });
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
    lastCompletedTask = task;
    state.completedTasks.push(isMustDo ? `${task}【必做】` : task);
    state.boxTasks = state.boxTasks.filter(item => item !== task);
    delete state.mustDoTaskGroups[task];
    Object.keys(state.mustDoTaskOrder).forEach(groupId => {
        state.mustDoTaskOrder[groupId] = state.mustDoTaskOrder[groupId].filter(item => item !== task);
    });
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
    if (!state.boxTasks.includes(text) && !state.completedTasks.includes(text) && text !== state.nowTask) {
        prependTaskToBox(text);
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
        const row = document.createElement('div');
        row.className = 'candidate-item';
        const taskText = document.createElement('span');
        taskText.textContent = task;
        const selectButton = document.createElement('button');
        selectButton.className = 'btn primary';
        selectButton.textContent = '选择';
        row.append(taskText, selectButton);
        selectButton.addEventListener('click', () => {
            if (state.nowTask && !state.boxTasks.includes(state.nowTask)) {
                prependTaskToBox(state.nowTask, getTaskGroupIdRaw(state.nowTask));
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
    blindboxTask = pool[Math.floor(Math.random() * pool.length)] || '没有任务';
    blindboxTaskText.textContent = blindboxTask;

    if (blindboxTask === '没有任务') {
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

    const range = document.createRange();
    range.selectNodeContents(nowTaskText);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
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
    if (wasMustDo && previousText !== nextText) {
        if (nextText) {
            state.mustDoTasks = [...new Set(state.mustDoTasks.map(task => task === previousText ? nextText : task))];
        } else {
            state.mustDoTasks = state.mustDoTasks.filter(task => task !== previousText);
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
    const spaces = StorageService.getSpaces();
    const current = StorageService.getCurrentSpace();
    spaceSelect.innerHTML = '';
    migrateSourceSpaceSelect.innerHTML = '';
    migrateTargetSpaceSelect.innerHTML = '';

    if (!spaces.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = activeLegacyMode ? '旧版本地数据' : '未选择 Space';
        spaceSelect.appendChild(option);
    }

    spaces.forEach(space => {
        const option = document.createElement('option');
        option.value = space.id;
        option.textContent = `${space.name} · ${space.storage_mode === 'cloud_sync' ? '云端同步' : '本地'}`;
        option.selected = current && current.id === space.id;
        spaceSelect.appendChild(option);

        const sourceOption = option.cloneNode(true);
        const targetOption = option.cloneNode(true);
        sourceOption.textContent = `从：${option.textContent}`;
        targetOption.textContent = `到：${option.textContent}`;
        sourceOption.selected = current && current.id === space.id;
        targetOption.selected = false;
        migrateSourceSpaceSelect.appendChild(sourceOption);
        migrateTargetSpaceSelect.appendChild(targetOption);
    });

    if (spaces.length) {
        const defaultTarget = spaces.find(space => !current || space.id !== current.id) || spaces[0];
        migrateTargetSpaceSelect.value = defaultTarget.id;
    } else {
        const sourcePlaceholder = document.createElement('option');
        sourcePlaceholder.value = '';
        sourcePlaceholder.textContent = '没有可迁移的 Space';
        migrateSourceSpaceSelect.appendChild(sourcePlaceholder);
        const targetPlaceholder = sourcePlaceholder.cloneNode(true);
        migrateTargetSpaceSelect.appendChild(targetPlaceholder);
    }

    const mode = current ? current.storage_mode : 'legacy_local';
    const label = mode === 'cloud_sync' ? '云端同步' : mode === 'local_only' ? '仅本地' : '旧本地数据';
    const cloudCount = spaces.filter(space => space.storage_mode === 'cloud_sync').length;
    const localCount = spaces.filter(space => space.storage_mode === 'local_only').length;
    const currentName = current ? current.name : '未选择';
    spaceStatus.textContent = `${currentName} · ${label} · 本地 ${localCount} / 云端 ${cloudCount}`;
    renameSpaceBtn.disabled = !current;
    deleteSpaceBtn.disabled = !current;
    transferSpaceNotesBtn.disabled = spaces.length < 2;
    if (!spaceTransferStatus.textContent && spaces.length < 2) {
        spaceTransferStatus.textContent = '至少需要两个 Space 才能迁移。';
    } else if (spaces.length >= 2 && spaceTransferStatus.textContent === '至少需要两个 Space 才能迁移。') {
        spaceTransferStatus.textContent = '';
    }
}

async function refreshCloudSpaces(showStatus = false) {
    try {
        if (showStatus) spaceStatus.textContent = '正在刷新云端 Space...';
        const spaces = await StorageService.syncCloudSpaces();
        renderSpaceSettings();
        if (showStatus) {
            const cloudCount = spaces.filter(space => space.storage_mode === 'cloud_sync').length;
            spaceStatus.textContent = `云端 Space 已刷新：${cloudCount} 个`;
        }
        return true;
    } catch (error) {
        console.error(error);
        if (showStatus) spaceStatus.textContent = `刷新云端 Space 失败：${formatErrorMessage(error)}`;
        return false;
    }
}

function shouldShowMigrationPrompt() {
    const hasLegacy = !!localStorage.getItem(STORAGE_KEY);
    return hasLegacy &&
        localStorage.getItem(MIGRATION_DONE_KEY) !== 'true' &&
        localStorage.getItem(MIGRATION_DISMISSED_KEY) !== 'true';
}

function showMigrationPromptIfNeeded() {
    if (shouldShowMigrationPrompt()) {
        migrationStatus.textContent = '';
        openOverlay(migrationOverlay);
    }
}

function openSpaceNameDialog(storageMode, space = null) {
    pendingSpaceMode = storageMode;
    pendingRenameSpaceId = space ? space.id : null;
    const isRename = storageMode === 'rename';
    spaceNameTitle.textContent = isRename ? '重命名 Space' : storageMode === 'cloud_sync' ? '新建云端分区' : '新建本地分区';
    spaceNameInput.value = isRename && space ? space.name : '';
    spaceNameMessage.textContent = '';
    spaceNameConfirmBtn.textContent = isRename ? '保存' : '创建';
    openOverlay(spaceNameOverlay);
    setTimeout(() => {
        spaceNameInput.focus();
        if (isRename) spaceNameInput.select();
    }, 0);
}

function closeSpaceNameDialog() {
    closeOverlay(spaceNameOverlay);
    spaceNameMessage.textContent = '';
    pendingRenameSpaceId = null;
    spaceNameConfirmBtn.textContent = '创建';
}

async function saveNamedSpace() {
    const storageMode = pendingSpaceMode;
    const name = spaceNameInput.value.trim();
    try {
        if (storageMode === 'rename') {
            await StorageService.renameSpace(pendingRenameSpaceId, name);
            closeSpaceNameDialog();
            renderSpaceSettings();
            renderNow();
            return;
        }

        await StorageService.createSpace({
            name: name || (storageMode === 'cloud_sync' ? '云端分区' : '本地分区'),
            storage_mode: storageMode,
            initialState: createEmptyState()
        });
        closeSpaceNameDialog();
        state = await StorageService.getCurrentState();
        renderSpaceSettings();
        renderNow();
    } catch (error) {
        console.error(error);
        spaceNameMessage.textContent = `${storageMode === 'rename' ? '重命名' : '创建'}失败：${formatErrorMessage(error)}`;
    }
}

function openRenameSpaceDialog() {
    const current = StorageService.getCurrentSpace();
    if (!current) {
        spaceStatus.textContent = '当前没有可重命名的 Space。';
        return;
    }
    openSpaceNameDialog('rename', current);
}

async function transferSelectedSpaceNotes() {
    const sourceId = migrateSourceSpaceSelect.value;
    const targetId = migrateTargetSpaceSelect.value;
    const source = StorageService.getSpaceById(sourceId);
    const target = StorageService.getSpaceById(targetId);
    if (!source || !target) {
        spaceTransferStatus.textContent = '请选择源 Space 和目标 Space。';
        return;
    }
    if (source.id === target.id) {
        spaceTransferStatus.textContent = '源 Space 和目标 Space 不能相同。';
        return;
    }

    const ok = await openConfirmDialog({
        title: '迁移 Notes',
        message: `把“${source.name}”的 Notes 迁移到“${target.name}”？迁移后源 Space 会被清空。`,
        confirmText: '开始迁移'
    });
    if (!ok) return;

    try {
        transferSpaceNotesBtn.disabled = true;
        spaceTransferStatus.textContent = '正在迁移...';
        const result = await StorageService.transferSpaceNotes(source.id, target.id);
        state = result.state;
        renderSpaceSettings();
        renderNow();
        spaceTransferStatus.textContent = `已迁移到“${target.name}”，源 Space 已清空。`;
    } catch (error) {
        console.error(error);
        spaceTransferStatus.textContent = `迁移失败：${formatErrorMessage(error)}`;
        renderSpaceSettings();
    }
}

async function deleteCurrentSpace() {
    const current = StorageService.getCurrentSpace();
    if (!current) {
        spaceStatus.textContent = '当前没有可删除的 Space。';
        return;
    }

    const ok = await openConfirmDialog({
        title: '删除 Space',
        message: `删除“${current.name}”？这个 Space 里的 Notes 也会一起删除。`,
        confirmText: '删除',
        danger: true
    });
    if (!ok) return;

    try {
        deleteSpaceBtn.disabled = true;
        spaceStatus.textContent = '正在删除 Space...';
        const deleted = await StorageService.deleteSpace(current.id);
        const nextCurrent = StorageService.getCurrentSpace();
        if (!nextCurrent) {
            await StorageService.createSpace({
                name: '默认本地 Space',
                storage_mode: 'local_only',
                initialState: createEmptyState()
            });
        }
        state = await StorageService.getCurrentState();
        lastCompletedTask = null;
        renderSpaceSettings();
        renderNow();
        spaceStatus.textContent = `已删除“${deleted.name}”。`;
    } catch (error) {
        console.error(error);
        spaceStatus.textContent = `删除失败：${formatErrorMessage(error)}`;
        renderSpaceSettings();
    }
}

async function finishMigration(mode) {
    try {
        migrationStatus.textContent = '正在迁移...';
        state = await StorageService.migrateLegacyData(mode);
        closeOverlay(migrationOverlay);
        renderSpaceSettings();
        renderNow();
    } catch (error) {
        console.error(error);
        migrationStatus.textContent = '迁移失败，请检查 Supabase 表、RLS 或网络。旧数据仍保留在本地。';
    }
}

completeNowBtn.addEventListener('click', () => {
    if (!state.nowTask) return;
    completeTask(state.nowTask);
    renderNow();
    renderMustDoList();
});

function undoLastComplete() {
    if (!lastCompletedTask) return;
    const index = state.completedTasks.lastIndexOf(lastCompletedTask);
    if (index > -1) {
        state.completedTasks.splice(index, 1);
    }
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
    if (!blindboxTask || blindboxTask === '没有任务') return;
    if (state.nowTask && !state.boxTasks.includes(state.nowTask)) {
        prependTaskToBox(state.nowTask, getTaskGroupIdRaw(state.nowTask));
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
        empty.textContent = '今天还没有完成的任务';
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

settingsFab.addEventListener('click', async () => {
    renderSpaceSettings();
    openOverlay(settingsOverlay);
    await refreshCloudSpaces();
});

spaceSelect.addEventListener('change', async () => {
    if (!spaceSelect.value) return;
    await StorageService.setCurrentSpace(spaceSelect.value);
    state = await StorageService.getCurrentState();
    renderSpaceSettings();
    renderNow();
});

newLocalSpaceBtn.addEventListener('click', () => openSpaceNameDialog('local_only'));
newCloudSpaceBtn.addEventListener('click', () => openSpaceNameDialog('cloud_sync'));
renameSpaceBtn.addEventListener('click', openRenameSpaceDialog);
refreshCloudSpacesBtn.addEventListener('click', () => refreshCloudSpaces(true));
deleteSpaceBtn.addEventListener('click', deleteCurrentSpace);
transferSpaceNotesBtn.addEventListener('click', transferSelectedSpaceNotes);
migrateSourceSpaceSelect.addEventListener('change', () => {
    spaceTransferStatus.textContent = '';
    if (migrateSourceSpaceSelect.value === migrateTargetSpaceSelect.value) {
        const target = StorageService.getSpaces().find(space => space.id !== migrateSourceSpaceSelect.value);
        if (target) migrateTargetSpaceSelect.value = target.id;
    }
});
migrateTargetSpaceSelect.addEventListener('change', () => {
    spaceTransferStatus.textContent = '';
});
spaceNameConfirmBtn.addEventListener('click', saveNamedSpace);
spaceNameCancelBtn.addEventListener('click', closeSpaceNameDialog);
spaceNameInput.addEventListener('input', () => {
    spaceNameMessage.textContent = '';
});
spaceNameInput.addEventListener('keydown', event => {
    if (isTextCompositionEvent(event)) return;
    if (event.key === 'Enter') {
        event.preventDefault();
        saveNamedSpace();
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        closeSpaceNameDialog();
    }
});
migrateLocalBtn.addEventListener('click', () => finishMigration('local_only'));
migrateCloudBtn.addEventListener('click', () => finishMigration('cloud_sync'));
migrateMergeBtn.addEventListener('click', () => finishMigration('merge'));
migrateLaterBtn.addEventListener('click', () => {
    localStorage.setItem(MIGRATION_DISMISSED_KEY, 'true');
    closeOverlay(migrationOverlay);
});

undoFab.addEventListener('click', undoLastComplete);

criterionDialogSaveBtn.addEventListener('click', saveCriterionNameDialog);
criterionDialogDeleteBtn.addEventListener('click', handleCriterionDeleteDialogAction);
criterionDialogCancelBtn.addEventListener('click', closeCriterionDialog);
moveTaskCancelBtn.addEventListener('click', closeMoveTaskDialog);
confirmAcceptBtn.addEventListener('click', () => closeConfirmDialog(true));
confirmCancelBtn.addEventListener('click', () => closeConfirmDialog(false));

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

exportJsonBtn.addEventListener('click', async () => {
    const data = await StorageService.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'empty-box-backup.json';
    a.click();
    URL.revokeObjectURL(url);
});

importJsonInput.addEventListener('change', async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        state = await StorageService.importData(parsed);
        renderNow();
        renderReflectionFab();
        renderSpaceSettings();
        closeOverlay(settingsOverlay);
    } catch { }
    importJsonInput.value = '';
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

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = document.getElementById(btn.dataset.close);
        if (target === criterionOverlay) {
            closeCriterionDialog();
        } else if (target === moveTaskOverlay) {
            closeMoveTaskDialog();
        } else if (target === spaceNameOverlay) {
            closeSpaceNameDialog();
        } else if (target === confirmOverlay) {
            closeConfirmDialog(false);
        } else {
            closeOverlay(target);
        }
    });
});

[searchOverlay, addOverlay, blindboxOverlay, reflectionOverlay, settingsOverlay, criterionOverlay, moveTaskOverlay, migrationOverlay, spaceNameOverlay, confirmOverlay].forEach(overlay => {
    overlay.addEventListener('click', e => {
        if (e.target !== overlay) return;
        if (overlay === criterionOverlay) {
            closeCriterionDialog();
        } else if (overlay === moveTaskOverlay) {
            closeMoveTaskDialog();
        } else if (overlay === spaceNameOverlay) {
            closeSpaceNameDialog();
        } else if (overlay === confirmOverlay) {
            closeConfirmDialog(false);
        } else {
            closeOverlay(overlay);
        }
    });
});

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

const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][new Date().getDay()];
const minute = String(new Date().getMinutes()).padStart(2, '0');
timeText.textContent = `${weekday} · ${String(hour).padStart(2, '0')}:${minute}`;

if (hour >= 18 && hour < 22) {
    body.className = 'evening';
    greeting.textContent = '夜晚';
    ambientHint.textContent = '🌙';
} else if (hour >= 22 || hour < 6) {
    body.className = 'night';
    greeting.textContent = '夜深了';
    ambientHint.textContent = '🌌';
} else if (hour >= 6 && hour < 11) {
    body.className = 'morning';
    greeting.textContent = '早上';
    ambientHint.textContent = '💧';
} else {
    body.className = 'day';
    greeting.textContent = '下午';
    ambientHint.textContent = '🌿';
}
