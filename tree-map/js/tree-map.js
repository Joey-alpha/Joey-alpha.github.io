(function () {
    const STORAGE_KEY = 'roadmap-tree-single-file-v1';
    const SUPABASE_URL = 'https://ufwvkabshfrrodmtycjj.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd3ZrYWJzaGZycm9kbXR5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjg4NjMsImV4cCI6MjA5NDc0NDg2M30.kSQJBTLSjd5XhLX0cddqjUfSw0QXt-Ilr2UsGPMamIo';
    const SPACE_LIST_KEY = 'tree-map-spaces-v1';
    const CURRENT_SPACE_ID_KEY = 'tree_map_current_space_id';
    const CURRENT_STORAGE_MODE_KEY = 'tree_map_current_storage_mode';
    const TITLE_DEFAULT = 'New Topic';
    const NODE_W = 180;
    const NODE_H = 108;
    const H_GAP = 48;
    const V_GAP = 42;
    const MAX_COUNT_REF = 360;
    const MAX_MINUTES_REF = 12000;
    const MINUTES_PER_POINT = 20;
    const COUNT_VALUE = 1;
    const MASTER_THRESHOLD = MAX_COUNT_REF + MAX_MINUTES_REF / MINUTES_PER_POINT;
    const COUNT_HALF_LIFE_DAYS = 90;
    const MINUTES_HALF_LIFE_DAYS = 60;
    const CONSISTENCY_WINDOW_DAYS = 30;
    const MAX_CONSISTENCY_BONUS = 0.25;
    const PARENT_IMPACT_BENEFIT = 'benefit';
    const PARENT_IMPACT_HARM = 'harm';
    const LEVEL_THRESHOLDS = [
        0,
        2,
        5,
        10,
        18,
        30,
        45,
        65,
        90,
        120,
        160,
        210,
        270,
        340,
        420,
        520,
        640,
        780,
        900,
        960,
    ];
    const LEVEL_COUNT = LEVEL_THRESHOLDS.length;
    const LEVEL_COLORS = [
        '#64748b',
        '#2563eb',
        '#0e7490',
        '#047857',
        '#4d7c0f',
        '#a16207',
        '#c2410c',
        '#b91c1c',
        '#7e22ce',
        '#1f2937',
    ];

    const viewport = document.getElementById('viewport');
    const scene = document.getElementById('scene');
    const edges = document.getElementById('edges');
    const nodesLayer = document.getElementById('nodesLayer');
    const statusText = document.getElementById('statusText');
    const nodeQuickActions = document.getElementById('nodeQuickActions');

    const editorBackdrop = document.getElementById('editorBackdrop');
    const editorForm = document.getElementById('editorForm');
    const titleInput = document.getElementById('titleInput');
    const parentImpactPanel = document.getElementById('parentImpactPanel');
    const parentImpactButtons = Array.from(document.querySelectorAll('[data-impact]'));
    const editorStats = document.getElementById('editorStats');
    const plusCountBtn = document.getElementById('plusCountBtn');
    const plusTimeBtn = document.getElementById('plusTimeBtn');
    const toggleStatsBtn = document.getElementById('toggleStatsBtn');
    const saveNodeBtn = document.getElementById('saveNodeBtn');
    const cancelNodeBtn = document.getElementById('cancelNodeBtn');

    const exportBackdrop = document.getElementById('exportBackdrop');
    const importExportArea = document.getElementById('importExportArea');
    const importInput = document.getElementById('importInput');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsBackdrop = document.getElementById('settingsBackdrop');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const nodeSearchGroup = document.querySelector('.search-group');
    const nodeSearchToggleBtn = document.getElementById('nodeSearchToggleBtn');
    const nodeSearchInput = document.getElementById('nodeSearchInput');
    const nodeSearchPrevBtn = document.getElementById('nodeSearchPrevBtn');
    const nodeSearchNextBtn = document.getElementById('nodeSearchNextBtn');
    const nodeSearchStatus = document.getElementById('nodeSearchStatus');
    const currentSpaceName = document.getElementById('currentSpaceName');
    const spaceSelect = document.getElementById('spaceSelect');
    const newLocalSpaceBtn = document.getElementById('newLocalSpaceBtn');
    const newCloudSpaceBtn = document.getElementById('newCloudSpaceBtn');
    const renameSpaceBtn = document.getElementById('renameSpaceBtn');
    const refreshCloudSpacesBtn = document.getElementById('refreshCloudSpacesBtn');
    const migrationSourceSelect = document.getElementById('migrationSourceSelect');
    const migrationTargetSelect = document.getElementById('migrationTargetSelect');
    const migrateSpaceBtn = document.getElementById('migrateSpaceBtn');
    const deleteSpaceBtn = document.getElementById('deleteSpaceBtn');
    const spaceStatus = document.getElementById('spaceStatus');
    const spaceNameBackdrop = document.getElementById('spaceNameBackdrop');
    const spaceNameTitle = document.getElementById('spaceNameTitle');
    const spaceNameInput = document.getElementById('spaceNameInput');
    const spaceNameMessage = document.getElementById('spaceNameMessage');
    const spaceNameSaveBtn = document.getElementById('spaceNameSaveBtn');
    const spaceNameCancelBtn = document.getElementById('spaceNameCancelBtn');

    let state = createSampleState();
    let selectedId = state.rootIds[0] || null;
    let editingId = null;
    let nodeEls = new Map();
    let layoutMap = new Map();
    let dragState = null;
    let panState = null;
    let tapInfo = { id: null, ts: 0 };
    let ignoreNodeClickUntil = 0;
    let pendingNewNodeId = null;
    let pendingNewNodePreviousSelectedId = null;
    let pinchState = null;
    let searchState = { query: '', matches: [], index: -1, focused: false };
    let searchCollapseTimer = 0;
    let quickActionsRestoreTimer = 0;
    let dragAutoPanFrame = 0;
    let dragAutoPanLastTs = 0;
    let activeLegacyMode = false;
    let pendingSpaceMode = 'local_only';
    let pendingRenameSpaceId = null;
    const CHIP_DOUBLE_TAP_MS = 360;
    const CHIP_TAP_MOVE_PX = 12;
    const NODE_EDIT_TAP_MS = 420;
    const SEARCH_EMPTY_COLLAPSE_MS = 4000;
    const QUICK_ACTIONS_RESTORE_MS = 140;
    const DRAG_AUTO_PAN_EDGE_PX = 72;
    const DRAG_AUTO_PAN_MAX_SPEED = 520;

    function createSampleState() {
        const rootId = uid();
        return {
            rootIds: [rootId],
            nodes: {
                [rootId]: {
                    id: rootId,
                    title: 'Root Topic',
                    activityLog: [],
                    children: [],
                    parentImpact: PARENT_IMPACT_BENEFIT,
                    collapsed: false,
                },
            },
        };
    }

    function flattenRoots(roots) {
        const out = {};
        (function walk(node) {
            out[node.id] = {
                id: node.id,
                title: node.title,
                activityLog: Array.isArray(node.activityLog) ? node.activityLog : [],
                children: Array.isArray(node.children) ? node.children.map(c => c.id) : [],
                parentImpact: normalizeParentImpact(node.parentImpact),
                collapsed: !!node.collapsed,
            };
            (node.children || []).forEach(walk);
        })({ id: '__dummy__', title: '', activityLog: [], children: roots || [], collapsed: false });
        delete out.__dummy__;
        return out;
    }

    function uid() {
        return 'n_' + Math.random().toString(36).slice(2, 10);
    }

    function nonNegativeNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : 0;
    }

    function safeTimestamp(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : Date.now();
    }

    function normalizeParentImpact(value) {
        if (
            value === PARENT_IMPACT_HARM ||
            value === 'damage' ||
            value === 'harmful' ||
            value === 'bad' ||
            value === 'negative'
        ) {
            return PARENT_IMPACT_HARM;
        }
        return PARENT_IMPACT_BENEFIT;
    }

    function isHarmfulNode(node) {
        return normalizeParentImpact(node && node.parentImpact) === PARENT_IMPACT_HARM;
    }

    function parentImpactSign(node) {
        return isHarmfulNode(node) ? -1 : 1;
    }

    function parentImpactLabel(node) {
        return isHarmfulNode(node) ? '损害' : '助益';
    }

    function readJson(key, fallback = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function createId(prefix) {
        if (crypto && crypto.randomUUID) return crypto.randomUUID();
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function spaceStateKey(spaceId) {
        return `${STORAGE_KEY}::space::${spaceId}`;
    }

    function getSupabaseHeaders(extra = {}) {
        return {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            ...extra,
        };
    }

    async function supabaseRequest(path, options = {}) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
            ...options,
            headers: getSupabaseHeaders(options.headers || {}),
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
        } catch (e) {
            return error && error.message ? error.message : String(error);
        }
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return createSampleState();
            const parsed = JSON.parse(raw);
            return normalizeState(parsed);
        } catch (e) {
            return createSampleState();
        }
    }

    function readLegacyState() {
        return normalizeState(readJson(STORAGE_KEY, createSampleState()));
    }

    function saveState() {
        TreeMapStorage.saveState(state);
    }

    function normalizeState(input) {
        if (!input || typeof input !== 'object') return createSampleState();
        const nodes = {};
        const sourceNodes = input.nodes || {};
        Object.keys(sourceNodes).forEach(id => {
            const n = sourceNodes[id] || {};
            nodes[id] = {
                id,
                title: typeof n.title === 'string' && n.title.trim() ? n.title : TITLE_DEFAULT,
                activityLog: Array.isArray(n.activityLog)
                    ? n.activityLog.map(a => ({
                        ts: safeTimestamp(a.ts),
                        count: nonNegativeNumber(a.count),
                        minutes: nonNegativeNumber(a.minutes),
                    }))
                    : [],
                children: Array.isArray(n.children) ? n.children.filter(cid => typeof cid === 'string') : [],
                parentImpact: normalizeParentImpact(n.parentImpact),
                collapsed: !!n.collapsed,
            };
        });
        let rootIds = Array.isArray(input.rootIds) ? input.rootIds.filter(id => nodes[id]) : Object.keys(nodes);
        if (!rootIds.length) return createSampleState();

        const childSet = new Set();
        Object.values(nodes).forEach(n => {
            n.children = n.children.filter(cid => nodes[cid] && cid !== n.id);
            n.children.forEach(cid => childSet.add(cid));
        });
        rootIds = rootIds.filter(id => !childSet.has(id));
        if (!rootIds.length) {
            const first = Object.keys(nodes)[0];
            rootIds = first ? [first] : [];
        }
        return { rootIds, nodes };
    }

    const TreeMapStorage = {
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
                    ...space,
                });
            });
            const merged = [...byId.values()].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
            this.saveSpaces(merged);
            this.ensureValidCurrentSpace();
            return merged;
        },

        async syncCloudSpaces() {
            const rows = await supabaseRequest('tree_map_spaces?select=id,owner_id,name,storage_mode,created_at&order=created_at.asc');
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

        async setCurrentSpace(spaceId) {
            const space = this.getSpaces().find(item => item.id === spaceId);
            if (!space) return null;
            localStorage.setItem(CURRENT_SPACE_ID_KEY, space.id);
            localStorage.setItem(CURRENT_STORAGE_MODE_KEY, space.storage_mode);
            activeLegacyMode = false;
            return space;
        },

        async createSpace({ name, storage_mode = 'local_only', initialState = createSampleState() }) {
            const now = new Date().toISOString();
            const space = {
                id: createId('tree-space'),
                owner_id: null,
                name: name || (storage_mode === 'cloud_sync' ? 'Cloud Tree' : 'Local Tree'),
                storage_mode,
                created_at: now,
            };

            if (storage_mode === 'cloud_sync') {
                await supabaseRequest('tree_map_spaces', {
                    method: 'POST',
                    body: JSON.stringify(space),
                });
            }

            const spaces = this.getSpaces().filter(item => item.id !== space.id);
            spaces.push(space);
            this.saveSpaces(spaces);
            await this.setCurrentSpace(space.id);
            await this.saveState(initialState, space);
            return space;
        },

        async renameSpace(spaceId, name) {
            const nextName = String(name || '').trim();
            if (!nextName) throw new Error('Space name cannot be empty.');

            const space = this.getSpaces().find(item => item.id === spaceId);
            if (!space) throw new Error('Space was not found.');

            const updated = { ...space, name: nextName };
            if (space.storage_mode === 'cloud_sync') {
                const rows = await supabaseRequest(`tree_map_spaces?id=eq.${encodeURIComponent(space.id)}&select=id,name`, {
                    method: 'PATCH',
                    headers: { Prefer: 'return=representation' },
                    body: JSON.stringify({ name: nextName }),
                });
                if (!Array.isArray(rows) || !rows.some(row => row.id === space.id && row.name === nextName)) {
                    throw new Error('Remote rename was not applied. Check Supabase UPDATE policy for tree_map_spaces.');
                }
            }

            this.saveSpaces(this.getSpaces().map(item => item.id === space.id ? updated : item));
            return updated;
        },

        async deleteCurrentSpace() {
            const space = this.getCurrentSpace();
            if (!space) return null;

            if (space.storage_mode === 'cloud_sync') {
                await supabaseRequest(`tree_map_states?space_id=eq.${encodeURIComponent(space.id)}`, {
                    method: 'DELETE',
                    headers: { Prefer: 'return=representation' },
                });
                const deletedSpaces = await supabaseRequest(`tree_map_spaces?id=eq.${encodeURIComponent(space.id)}&select=id`, {
                    method: 'DELETE',
                    headers: { Prefer: 'return=representation' },
                });
                if (!Array.isArray(deletedSpaces) || !deletedSpaces.length) {
                    const stillExists = await supabaseRequest(`tree_map_spaces?id=eq.${encodeURIComponent(space.id)}&select=id`);
                    if (Array.isArray(stillExists) && stillExists.length) {
                        throw new Error('Remote space was not deleted. Check Supabase DELETE policy for tree_map_spaces.');
                    }
                }
            } else {
                localStorage.removeItem(spaceStateKey(space.id));
            }

            const spaces = this.getSpaces().filter(item => item.id !== space.id);
            this.saveSpaces(spaces);
            localStorage.removeItem(CURRENT_SPACE_ID_KEY);
            localStorage.removeItem(CURRENT_STORAGE_MODE_KEY);
            this.ensureValidCurrentSpace();
            return space;
        },

        async getSpaceState(spaceId) {
            const space = this.getSpaces().find(item => item.id === spaceId);
            if (!space) throw new Error('Source or target space was not found.');
            if (space.storage_mode === 'cloud_sync') {
                return this.getCloudState(space);
            }
            return normalizeState(readJson(spaceStateKey(space.id), {}));
        },

        async saveStateToSpace(spaceId, nextState) {
            const space = this.getSpaces().find(item => item.id === spaceId);
            if (!space) throw new Error('Target space was not found.');
            await this.saveState(nextState, space);
            return space;
        },

        async getCurrentState() {
            const space = this.getCurrentSpace();
            if (!space) {
                activeLegacyMode = true;
                return loadState();
            }
            activeLegacyMode = false;
            if (space.storage_mode === 'cloud_sync') {
                return this.getCloudState(space);
            }
            return normalizeState(readJson(spaceStateKey(space.id), {}));
        },

        async getCloudState(space) {
            const rows = await supabaseRequest(`tree_map_states?space_id=eq.${encodeURIComponent(space.id)}&select=content,updated_at`);
            const snapshot = Array.isArray(rows) ? rows[0] : null;
            return snapshot && snapshot.content ? normalizeState(snapshot.content) : createSampleState();
        },

        async saveCloudState(nextState, space) {
            const normalized = normalizeState(nextState);
            const now = new Date().toISOString();
            const existing = await supabaseRequest(`tree_map_states?space_id=eq.${encodeURIComponent(space.id)}&select=space_id`);
            if (Array.isArray(existing) && existing.length) {
                await supabaseRequest(`tree_map_states?space_id=eq.${encodeURIComponent(space.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        content: normalized,
                        updated_at: now,
                    }),
                });
                return;
            }
            await supabaseRequest('tree_map_states', {
                method: 'POST',
                body: JSON.stringify({
                    space_id: space.id,
                    owner_id: null,
                    content: normalized,
                    created_at: now,
                    updated_at: now,
                }),
            });
        },

        async saveState(nextState, forcedSpace = null) {
            const normalized = normalizeState(nextState);
            const space = forcedSpace || this.getCurrentSpace();
            if (!space || activeLegacyMode) {
                writeJson(STORAGE_KEY, normalized);
                return;
            }
            if (space.storage_mode === 'cloud_sync') {
                this.saveCloudState(normalized, space).catch(error => {
                    console.error('Tree Map cloud sync failed:', error);
                    if (spaceStatus) spaceStatus.textContent = `Cloud sync failed: ${formatErrorMessage(error)}`;
                });
            } else {
                writeJson(spaceStateKey(space.id), normalized);
            }
        },

        async importData(payload) {
            state = normalizeState(payload && payload.version === 2 ? payload.state : payload);
            await this.saveState(state);
            return state;
        },
    };

    function getNode(id) {
        return state.nodes[id] || null;
    }

    function getChildren(id) {
        const n = getNode(id);
        return n ? n.children.map(getNode).filter(Boolean) : [];
    }

    function findParentId(targetId) {
        for (const id of Object.keys(state.nodes)) {
            if ((state.nodes[id].children || []).includes(targetId)) return id;
        }
        return null;
    }

    function isDescendant(ancestorId, maybeDescId) {
        if (ancestorId === maybeDescId) return true;
        const node = getNode(ancestorId);
        if (!node) return false;
        for (const cid of node.children) {
            if (cid === maybeDescId || isDescendant(cid, maybeDescId)) return true;
        }
        return false;
    }

    function addNode(title = TITLE_DEFAULT) {
        const id = uid();
        state.nodes[id] = {
            id,
            title,
            activityLog: [],
            children: [],
            parentImpact: PARENT_IMPACT_BENEFIT,
            collapsed: false,
        };
        return id;
    }

    function addRoot() {
        const previousSelectedId = selectedId;
        const id = addNode('');
        state.rootIds.push(id);
        selectedId = id;
        render();
        openEditor(id, { isNew: true, previousSelectedId });
    }

    function addChild(parentId) {
        if (!getNode(parentId)) return addRoot();
        const previousSelectedId = selectedId;
        const id = addNode('');
        getNode(parentId).children.push(id);
        getNode(parentId).collapsed = false;
        selectedId = id;
        render();
        adjustViewAfterLayoutChange();
        openEditor(id, { isNew: true, previousSelectedId });
    }

    function addSibling(nodeId) {
        const parentId = findParentId(nodeId);
        const previousSelectedId = selectedId;
        const id = addNode('');
        if (parentId) {
            const siblings = getNode(parentId).children;
            const idx = siblings.indexOf(nodeId);
            siblings.splice(idx + 1, 0, id);
        } else {
            const idx = state.rootIds.indexOf(nodeId);
            state.rootIds.splice(Math.max(0, idx) + 1, 0, id);
        }
        selectedId = id;
        render();
        adjustViewAfterLayoutChange();
        openEditor(id, { isNew: true, previousSelectedId });
    }

    function promoteToRoot(nodeId) {
        if (!nodeId || !getNode(nodeId)) return;
        if (state.rootIds.includes(nodeId)) return;

        const parentId = findParentId(nodeId);
        if (parentId) {
            const p = getNode(parentId);
            p.children = p.children.filter(id => id !== nodeId);
        }

        // Insert after the top-level root ancestor (keeps the layout more predictable).
        let insertAt = state.rootIds.length;
        let cur = nodeId;
        let pid = parentId;
        while (pid) {
            cur = pid;
            pid = findParentId(pid);
        }
        const rootIdx = state.rootIds.indexOf(cur);
        if (rootIdx >= 0) insertAt = rootIdx + 1;

        state.rootIds.splice(insertAt, 0, nodeId);
        selectedId = nodeId;
        persistAndRender();
        adjustViewAfterLayoutChange();
    }

    function deleteNode(nodeId) {
        if (!getNode(nodeId)) return;
        const parentId = findParentId(nodeId);
        if (parentId) {
            const p = getNode(parentId);
            p.children = p.children.filter(id => id !== nodeId);
        } else {
            state.rootIds = state.rootIds.filter(id => id !== nodeId);
        }
        removeSubtree(nodeId);
        if (!state.rootIds.length) {
            const id = addNode('Root Topic');
            state.rootIds = [id];
        }
        selectedId = state.rootIds[0] || Object.keys(state.nodes)[0] || null;
        persistAndRender();
        adjustViewAfterLayoutChange();
    }

    function removeSubtree(id) {
        const node = getNode(id);
        if (!node) return;
        node.children.forEach(removeSubtree);
        delete state.nodes[id];
    }

    function removeNodeReference(nodeId) {
        const parentId = findParentId(nodeId);
        if (parentId) {
            const parent = getNode(parentId);
            if (parent) parent.children = parent.children.filter(id => id !== nodeId);
        } else {
            state.rootIds = state.rootIds.filter(id => id !== nodeId);
        }
    }

    function discardPendingNewNode() {
        const nodeId = pendingNewNodeId;
        if (!nodeId) return false;
        pendingNewNodeId = null;
        const previousSelectedId = pendingNewNodePreviousSelectedId;
        pendingNewNodePreviousSelectedId = null;

        if (getNode(nodeId)) {
            removeNodeReference(nodeId);
            removeSubtree(nodeId);
        }

        selectedId = previousSelectedId && getNode(previousSelectedId)
            ? previousSelectedId
            : state.rootIds[0] || Object.keys(state.nodes)[0] || null;
        saveState();
        render();
        return true;
    }

    function moveNode(dragId, targetId, mode) {
        if (!dragId || !targetId || dragId === targetId) return;
        if (isDescendant(dragId, targetId)) return;
        const oldParent = findParentId(dragId);
        if (oldParent) {
            getNode(oldParent).children = getNode(oldParent).children.filter(id => id !== dragId);
        } else {
            state.rootIds = state.rootIds.filter(id => id !== dragId);
        }

        if (mode === 'child') {
            const target = getNode(targetId);
            if (!target) return;
            target.children.push(dragId);
            target.collapsed = false;
        } else {
            const parentId = findParentId(targetId);
            if (parentId) {
                const arr = getNode(parentId).children;
                const idx = arr.indexOf(targetId);
                arr.splice(idx + (mode === 'after' ? 1 : 0), 0, dragId);
            } else {
                const idx = state.rootIds.indexOf(targetId);
                state.rootIds.splice(idx + (mode === 'after' ? 1 : 0), 0, dragId);
            }
        }
        selectedId = dragId;
        persistAndRender();
    }

    function getVisibleTraversalIds() {
        const ids = [];
        const seen = new Set();
        const walk = id => {
            const node = getNode(id);
            if (!node || seen.has(id)) return;
            seen.add(id);
            ids.push(id);
            if (!node.collapsed) node.children.forEach(walk);
        };
        state.rootIds.forEach(walk);
        return ids;
    }

    function getNodeTraversalIds() {
        const ids = [];
        const seen = new Set();
        const walk = id => {
            if (!id || seen.has(id) || !getNode(id)) return;
            seen.add(id);
            ids.push(id);
            getNode(id).children.forEach(walk);
        };
        state.rootIds.forEach(walk);
        Object.keys(state.nodes).forEach(walk);
        return ids;
    }

    function findAncestorIds(targetId) {
        const ancestors = [];
        let parentId = findParentId(targetId);
        while (parentId) {
            ancestors.unshift(parentId);
            parentId = findParentId(parentId);
        }
        return ancestors;
    }

    function expandAncestorsForNode(nodeId) {
        let changed = false;
        findAncestorIds(nodeId).forEach(id => {
            const node = getNode(id);
            if (node && node.collapsed) {
                node.collapsed = false;
                changed = true;
            }
        });
        return changed;
    }

    function centerViewOnNode(nodeId) {
        if (!layoutMap.has(nodeId)) return false;
        const pos = layoutMap.get(nodeId);
        const rect = viewport.getBoundingClientRect();
        view.x = Math.round(rect.width / 2 - (pos.x + pos.width / 2) * view.scale);
        view.y = Math.round(rect.height / 2 - (pos.y + pos.height / 2) * view.scale);
        applyView();
        return true;
    }

    function getNavigationTarget(direction) {
        if (!selectedId || !getNode(selectedId)) return null;

        if (direction === 'up') return findParentId(selectedId);

        if (direction === 'down') {
            const node = getNode(selectedId);
            return node && node.children.length ? node.children[0] : null;
        }

        const parentId = findParentId(selectedId);
        const siblings = parentId ? getNode(parentId).children : state.rootIds;
        const index = siblings.indexOf(selectedId);
        if (index < 0) return null;
        if (direction === 'left') return siblings[index - 1] || null;
        if (direction === 'right') return siblings[index + 1] || null;
        return null;
    }

    function moveSelection(direction) {
        const targetId = getNavigationTarget(direction);
        if (!targetId) return false;

        if (direction === 'down') {
            const current = getNode(selectedId);
            if (current && current.collapsed && current.children.length) {
                current.collapsed = false;
                saveState();
                render();
                centerViewOnNode(selectedId);
                return true;
            }
        }

        selectNode(targetId);
        centerViewOnNode(targetId);
        return true;
    }

    function suspendNodeQuickActions() {
        if (!nodeQuickActions) return;
        if (quickActionsRestoreTimer) {
            window.clearTimeout(quickActionsRestoreTimer);
            quickActionsRestoreTimer = 0;
        }
        nodeQuickActions.classList.add('viewport-moving');
    }

    function restoreNodeQuickActions(delay = QUICK_ACTIONS_RESTORE_MS) {
        if (!nodeQuickActions) return;
        if (quickActionsRestoreTimer) window.clearTimeout(quickActionsRestoreTimer);
        quickActionsRestoreTimer = window.setTimeout(() => {
            quickActionsRestoreTimer = 0;
            nodeQuickActions.classList.remove('viewport-moving');
            updateNodeQuickActions();
        }, delay);
    }

    function updateNodeQuickActions() {
        if (!nodeQuickActions) return;
        const node = selectedId ? getNode(selectedId) : null;
        const pos = selectedId ? layoutMap.get(selectedId) : null;
        const shouldHide = !node || !pos || editorBackdrop.classList.contains('open') ||
            exportBackdrop.classList.contains('open') || settingsBackdrop.classList.contains('open') ||
            spaceNameBackdrop.classList.contains('open');

        if (shouldHide) {
            nodeQuickActions.classList.add('hidden');
            return;
        }

        nodeQuickActions.classList.remove('hidden');
        if (quickActionsRestoreTimer) {
            window.clearTimeout(quickActionsRestoreTimer);
            quickActionsRestoreTimer = 0;
        }
        nodeQuickActions.classList.remove('viewport-moving');
        const viewportRect = viewport.getBoundingClientRect();
        const scaledLeft = viewportRect.left + view.x + pos.x * view.scale;
        const scaledTop = viewportRect.top + view.y + pos.y * view.scale;
        const scaledWidth = pos.width * view.scale;
        const scaledHeight = pos.height * view.scale;
        const gap = 8;
        const menuWidth = nodeQuickActions.offsetWidth || 148;
        const menuHeight = nodeQuickActions.offsetHeight || 72;
        const viewportPadding = 8;
        let left = scaledLeft + scaledWidth + gap;
        if (left + menuWidth > window.innerWidth - viewportPadding) {
            left = scaledLeft - menuWidth - gap;
        }
        let top = scaledTop + scaledHeight / 2 - menuHeight / 2;
        left = clamp(left, viewportPadding, window.innerWidth - menuWidth - viewportPadding);
        top = clamp(top, viewportPadding, window.innerHeight - menuHeight - viewportPadding);

        nodeQuickActions.style.setProperty('--quick-x', `${Math.round(left)}px`);
        nodeQuickActions.style.setProperty('--quick-y', `${Math.round(top)}px`);
        nodeQuickActions.querySelector('[data-node-action="make-root"]').disabled = state.rootIds.includes(selectedId);
        ['left', 'up', 'down', 'right'].forEach(direction => {
            const button = nodeQuickActions.querySelector(`[data-node-action="move-${direction}"]`);
            if (button) button.disabled = !getNavigationTarget(direction);
        });
    }

    function setSearchStatus(text) {
        if (nodeSearchStatus) nodeSearchStatus.textContent = text || '';
    }

    function clearSearchCollapseTimer() {
        if (!searchCollapseTimer) return;
        window.clearTimeout(searchCollapseTimer);
        searchCollapseTimer = 0;
    }

    function scheduleEmptySearchCollapse() {
        clearSearchCollapseTimer();
        if (!nodeSearchInput || nodeSearchInput.value.trim()) return;
        searchCollapseTimer = window.setTimeout(() => {
            if (nodeSearchInput.value.trim()) return;
            setSearchOpen(false);
        }, SEARCH_EMPTY_COLLAPSE_MS);
    }

    function setSearchOpen(isOpen) {
        if (!nodeSearchGroup || !nodeSearchToggleBtn) return;
        clearSearchCollapseTimer();
        nodeSearchGroup.classList.toggle('collapsed', !isOpen);
        nodeSearchToggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        if (isOpen) {
            setTimeout(() => nodeSearchInput.focus({ preventScroll: true }), 0);
            scheduleEmptySearchCollapse();
        }
    }

    function updateSearchControls() {
        if (!nodeSearchPrevBtn || !nodeSearchNextBtn) return;
        const disabled = searchState.matches.length < 2;
        nodeSearchPrevBtn.disabled = disabled;
        nodeSearchNextBtn.disabled = disabled;
    }

    function runNodeSearch(preferredId = selectedId) {
        const query = nodeSearchInput ? nodeSearchInput.value.trim().toLowerCase() : '';
        searchState.query = query;
        searchState.matches = [];
        searchState.index = -1;
        searchState.focused = false;

        if (!query) {
            setSearchStatus('');
            updateSearchControls();
            return;
        }

        searchState.matches = getNodeTraversalIds().filter(id => {
            const node = getNode(id);
            return node && node.title.toLowerCase().includes(query);
        });

        if (!searchState.matches.length) {
            setSearchStatus('0');
            updateSearchControls();
            return;
        }

        const preferredIndex = searchState.matches.indexOf(preferredId);
        searchState.index = preferredIndex >= 0 ? preferredIndex : 0;
        setSearchStatus(`${searchState.index + 1}/${searchState.matches.length}`);
        updateSearchControls();
    }

    function focusSearchResult(index) {
        if (!searchState.matches.length) return;
        const count = searchState.matches.length;
        searchState.index = ((index % count) + count) % count;
        const nodeId = searchState.matches[searchState.index];

        if (expandAncestorsForNode(nodeId)) {
            saveState();
            render();
        }

        selectNode(nodeId);
        centerViewOnNode(nodeId);
        searchState.focused = true;
        setSearchStatus(`${searchState.index + 1}/${count}`);
        updateSearchControls();
    }

    function stepSearchResult(delta) {
        const wasFocused = searchState.focused;
        runNodeSearch(selectedId);
        if (!searchState.matches.length) return;
        const nextIndex = wasFocused && searchState.index >= 0
            ? searchState.index + delta
            : searchState.index;
        focusSearchResult(nextIndex);
    }

    function refreshSearchAfterTreeChange() {
        if (!nodeSearchInput || !nodeSearchInput.value.trim()) return;
        runNodeSearch(selectedId);
    }

    function persistAndRender() {
        saveState();
        render();
        refreshSearchAfterTreeChange();
    }

    function toggleNodeCollapse(id) {
        const node = getNode(id);
        if (!node || !node.children.length) return false;
        trackNodePosition(id);
        node.collapsed = !node.collapsed;
        persistAndRender();
        adjustViewAfterLayoutChange();
        return true;
    }

    function openEditorFromNodeGesture(id) {
        tapInfo = { id: null, ts: 0 };
        openEditor(id);
    }

    function closestElement(target, selector) {
        return target instanceof Element ? target.closest(selector) : null;
    }

    function ageDays(ts) {
        const time = Number(ts);
        if (!Number.isFinite(time)) return 0;
        return Math.max(0, (Date.now() - time) / 86400000);
    }

    function decay(days, halfLife) {
        const safeDays = Math.max(0, Number(days) || 0);
        const safeHalfLife = Math.max(1, Number(halfLife) || 1);
        return Math.pow(0.5, safeDays / safeHalfLife);
    }

    function localDateKey(ts) {
        const date = new Date(ts);
        if (Number.isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function countActiveDays(entries, windowDays = CONSISTENCY_WINDOW_DAYS) {
        const activeDays = new Set();
        const safeEntries = Array.isArray(entries) ? entries : [];
        safeEntries.forEach(entry => {
            const ts = Number(entry.ts);
            if (!Number.isFinite(ts) || ageDays(ts) > windowDays) return;
            const count = nonNegativeNumber(entry.count);
            const minutes = nonNegativeNumber(entry.minutes);
            if (count <= 0 && minutes <= 0) return;
            const key = localDateKey(ts);
            if (key) activeDays.add(key);
        });
        return activeDays.size;
    }

    function clamp(value, min, max) {
        const number = Number(value);
        if (!Number.isFinite(number)) return min;
        return Math.max(min, Math.min(max, number));
    }

    function getLevelFromPoints(points) {
        const value = nonNegativeNumber(points);
        let level = 1;
        while (level < LEVEL_COUNT && value >= LEVEL_THRESHOLDS[level]) {
            level++;
        }
        return level;
    }

    function getProgressRatioFromPoints(points) {
        const value = nonNegativeNumber(points);
        const level = getLevelFromPoints(value);
        if (level >= LEVEL_COUNT) return 1;

        const currentThreshold = LEVEL_THRESHOLDS[level - 1];
        const nextThreshold = LEVEL_THRESHOLDS[level] || MASTER_THRESHOLD;
        const span = Math.max(1, nextThreshold - currentThreshold);
        return clamp((value - currentThreshold) / span, 0, 1);
    }

    function getProgressFromPoints(points) {
        return getProgressRatioFromPoints(points) * 100;
    }

    function childMetricWeight(metric) {
        return Math.max(0.0001, nonNegativeNumber(metric && metric.activityMass));
    }

    function computeSelfMetrics(node) {
        let rawCount = 0;
        let rawMinutes = 0;
        let decayedCount = 0;
        let decayedMinutes = 0;

        for (const entry of node.activityLog) {
            const days = ageDays(entry.ts);
            const count = nonNegativeNumber(entry.count);
            const minutes = nonNegativeNumber(entry.minutes);
            rawCount += count;
            rawMinutes += minutes;
            decayedCount += count * decay(days, COUNT_HALF_LIFE_DAYS);
            decayedMinutes += minutes * decay(days, MINUTES_HALF_LIFE_DAYS);
        }

        const countScore = Math.min(1, decayedCount / MAX_COUNT_REF);
        const minuteScore = Math.min(1, decayedMinutes / MAX_MINUTES_REF);
        const countFreshness = rawCount > 0 ? Math.min(1, decayedCount / rawCount) : 0;
        const minuteFreshness = rawMinutes > 0 ? Math.min(1, decayedMinutes / rawMinutes) : 0;
        const freshness = rawCount + rawMinutes > 0
            ? (countFreshness * 0.5 + minuteFreshness * 0.5)
            : 0;
        const basePoints = decayedCount * COUNT_VALUE + decayedMinutes / MINUTES_PER_POINT;
        const activeDaysLast30 = countActiveDays(node.activityLog);
        const consistencyBonus = Math.min(
            MAX_CONSISTENCY_BONUS,
            (activeDaysLast30 / CONSISTENCY_WINDOW_DAYS) * MAX_CONSISTENCY_BONUS
        );
        const selfPoints = basePoints * (1 + consistencyBonus);
        const selfProgress = getProgressFromPoints(selfPoints);
        const activityMass = countScore + minuteScore + freshness * 0.5;

        return {
            rawCount,
            rawMinutes,
            decayedCount,
            decayedMinutes,
            countScore,
            minuteScore,
            countFreshness,
            minuteFreshness,
            freshness,
            basePoints,
            activeDaysLast30,
            consistencyBonus,
            selfProgress,
            selfPoints,
            activityMass,
        };
    }

    function computeTreeProgress(id, memo = new Map()) {
        if (memo.has(id)) return memo.get(id);
        const node = getNode(id);
        if (!node) return null;
        const self = computeSelfMetrics(node);
        const childEntries = node.children
            .map(cid => ({ node: getNode(cid), metrics: computeTreeProgress(cid, memo) }))
            .filter(entry => entry.node && entry.metrics);
        let points = self.selfPoints;
        if (childEntries.length) {
            const massSum = childEntries.reduce((s, entry) => s + childMetricWeight(entry.metrics), 0);
            const childPointAvg = massSum > 0
                ? childEntries.reduce((s, entry) => {
                    const signedPoints = nonNegativeNumber(entry.metrics.points) * parentImpactSign(entry.node);
                    return s + signedPoints * childMetricWeight(entry.metrics);
                }, 0) / massSum
                : 0;
            const totalChildren = childEntries.length;
            const activeChildren = childEntries.filter(entry => {
                const metrics = entry.metrics;
                return nonNegativeNumber(metrics.points) > 0 || nonNegativeNumber(metrics.activityMass) > 0;
            }).length;
            const coverageFactor = totalChildren > 0
                ? Math.max(0.6, Math.min(1, 0.6 + 0.4 * (activeChildren / totalChildren)))
                : 1;
            const selfWeight = 0.15 + 0.25 * self.freshness;
            const childWeight = 1 - selfWeight;
            points = self.selfPoints * selfWeight + childPointAvg * childWeight * coverageFactor;
        }
        const safePoints = nonNegativeNumber(points);
        const result = {
            ...self,
            progress: getProgressFromPoints(safePoints),
            points: safePoints,
        };
        memo.set(id, result);
        return result;
    }

    function visibleRoots() {
        return state.rootIds.map(getNode).filter(Boolean);
    }

    function measureSubtree(id) {
        const node = getNode(id);
        if (!node) return { width: NODE_W, height: NODE_H };
        if (node.collapsed || !node.children.length) return { width: NODE_W, height: NODE_H };
        const childSizes = node.children.map(measureSubtree);
        const totalWidth = childSizes.reduce((s, c) => s + c.width, 0) + H_GAP * Math.max(0, childSizes.length - 1);
        const height = NODE_H + V_GAP + Math.max(...childSizes.map(c => c.height));
        return { width: Math.max(NODE_W, totalWidth), height };
    }

    function layoutTree(id, left, top) {
        const node = getNode(id);
        if (!node) return { width: NODE_W, height: NODE_H };
        const size = measureSubtree(id);
        const x = left + (size.width - NODE_W) / 2;
        const y = top;
        layoutMap.set(id, { x, y, width: NODE_W, height: NODE_H, subtreeWidth: size.width, subtreeHeight: size.height });

        if (!node.collapsed && node.children.length) {
            const childSizes = node.children.map(measureSubtree);
            let cursor = left;
            node.children.forEach((cid, i) => {
                layoutTree(cid, cursor, top + NODE_H + V_GAP);
                cursor += childSizes[i].width + H_GAP;
            });
        }
        return size;
    }

    function layoutForest() {
        layoutMap.clear();
        const roots = visibleRoots();
        const sizes = roots.map(r => measureSubtree(r.id));
        let left = 40;
        const top = 40;
        roots.forEach((r, i) => {
            layoutTree(r.id, left, top);
            left += sizes[i].width + 80;
        });
        const bounds = Array.from(layoutMap.values()).reduce((acc, p) => {
            acc.maxX = Math.max(acc.maxX, p.x + p.width);
            acc.maxY = Math.max(acc.maxY, p.y + p.height);
            return acc;
        }, { maxX: 0, maxY: 0 });
        const width = Math.max(bounds.maxX + 80, viewport.clientWidth);
        const height = Math.max(bounds.maxY + 100, viewport.clientHeight);
        return { width, height };
    }

    const view = {
        x: 80,
        y: 24,
        scale: 1,
    };

    function applyView(options = {}) {
        scene.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
        if (options.deferQuickActions) {
            suspendNodeQuickActions();
            restoreNodeQuickActions();
            return;
        }
        updateNodeQuickActions();
    }

    function resetView() {
        view.scale = 1;
        if (layoutMap.size === 0) {
            view.x = 80;
            view.y = 24;
            applyView();
            return;
        }

        const bounds = Array.from(layoutMap.values()).reduce((acc, p) => {
            acc.minX = Math.min(acc.minX, p.x);
            acc.minY = Math.min(acc.minY, p.y);
            acc.maxX = Math.max(acc.maxX, p.x + p.width);
            acc.maxY = Math.max(acc.maxY, p.y + p.height);
            return acc;
        }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

        const treeCenterX = (bounds.minX + bounds.maxX) / 2;
        const treeCenterY = (bounds.minY + bounds.maxY) / 2;
        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenterX = viewportRect.width / 2;
        const viewportCenterY = viewportRect.height / 2;

        view.x = Math.round(viewportCenterX - treeCenterX);
        view.y = Math.round(viewportCenterY - treeCenterY);

        // ensure there is a small margin when tree is smaller than viewport
        const minX = Math.min(80, view.x);
        const minY = Math.min(24, view.y);
        view.x = view.x > minX ? view.x : minX;
        view.y = view.y > minY ? view.y : minY;

        applyView();
    }

    let lastTrackedNodeId = null;
    let lastTrackedNodeScreenPos = null;

    function trackNodePosition(nodeId) {
        if (!nodeId || !layoutMap.has(nodeId)) return;
        const pos = layoutMap.get(nodeId);
        const screenX = pos.x * view.scale + view.x;
        const screenY = pos.y * view.scale + view.y;
        lastTrackedNodeId = nodeId;
        lastTrackedNodeScreenPos = { x: screenX, y: screenY };
    }

    function adjustViewAfterLayoutChange() {
        if (!lastTrackedNodeId || !lastTrackedNodeScreenPos || !layoutMap.has(lastTrackedNodeId)) {
            // 如果没有跟踪的节点，则使用原来的居中逻辑
            if (layoutMap.size === 0) {
                view.x = 80;
                view.y = 24;
                applyView();
                return;
            }

            const bounds = Array.from(layoutMap.values()).reduce((acc, p) => {
                acc.minX = Math.min(acc.minX, p.x);
                acc.minY = Math.min(acc.minY, p.y);
                acc.maxX = Math.max(acc.maxX, p.x + p.width);
                acc.maxY = Math.max(acc.maxY, p.y + p.height);
                return acc;
            }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });

            const treeCenterX = (bounds.minX + bounds.maxX) / 2;
            const treeCenterY = (bounds.minY + bounds.maxY) / 2;
            const viewportRect = viewport.getBoundingClientRect();
            const viewportCenterX = viewportRect.width / 2;
            const viewportCenterY = viewportRect.height / 2;

            view.x = Math.round(viewportCenterX - treeCenterX * view.scale);
            view.y = Math.round(viewportCenterY - treeCenterY * view.scale);

            applyView();
            return;
        }

        // 保持跟踪节点的位置不变
        const newPos = layoutMap.get(lastTrackedNodeId);
        const newScreenX = newPos.x * view.scale + view.x;
        const newScreenY = newPos.y * view.scale + view.y;

        const deltaX = lastTrackedNodeScreenPos.x - newScreenX;
        const deltaY = lastTrackedNodeScreenPos.y - newScreenY;

        view.x += deltaX;
        view.y += deltaY;

        applyView();

        // 重置跟踪状态
        lastTrackedNodeId = null;
        lastTrackedNodeScreenPos = null;
    }

    function worldPoint(clientX, clientY) {
        const rect = viewport.getBoundingClientRect();
        return {
            x: (clientX - rect.left - view.x) / view.scale,
            y: (clientY - rect.top - view.y) / view.scale,
        };
    }

    function zoomAt(clientX, clientY, factor) {
        const before = worldPoint(clientX, clientY);
        view.scale = Math.max(0.35, Math.min(2.4, view.scale * factor));
        const rect = viewport.getBoundingClientRect();
        view.x = clientX - rect.left - before.x * view.scale;
        view.y = clientY - rect.top - before.y * view.scale;
        applyView({ deferQuickActions: true });
    }

    function updateDraggedNodePosition() {
        if (!dragState || !dragState.dragging) return;
        const el = nodeEls.get(dragState.id);
        if (!el) return;
        const wp = worldPoint(dragState.lastClientX, dragState.lastClientY);
        el.style.left = (wp.x - dragState.pointerOffsetX) + 'px';
        el.style.top = (wp.y - dragState.pointerOffsetY) + 'px';
    }

    function computeDragAutoPanVelocity(clientX, clientY) {
        const rect = viewport.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const edge = DRAG_AUTO_PAN_EDGE_PX;
        const maxSpeed = DRAG_AUTO_PAN_MAX_SPEED;
        let vx = 0;
        let vy = 0;

        if (x < edge) vx = clamp((edge - x) / edge, 0, 1) * maxSpeed;
        else if (x > rect.width - edge) vx = -clamp((x - (rect.width - edge)) / edge, 0, 1) * maxSpeed;

        if (y < edge) vy = clamp((edge - y) / edge, 0, 1) * maxSpeed;
        else if (y > rect.height - edge) vy = -clamp((y - (rect.height - edge)) / edge, 0, 1) * maxSpeed;

        return { x: vx, y: vy };
    }

    function startDragAutoPan() {
        if (dragAutoPanFrame) return;
        dragAutoPanLastTs = 0;
        dragAutoPanFrame = window.requestAnimationFrame(tickDragAutoPan);
    }

    function stopDragAutoPan() {
        if (dragAutoPanFrame) {
            window.cancelAnimationFrame(dragAutoPanFrame);
            dragAutoPanFrame = 0;
        }
        dragAutoPanLastTs = 0;
    }

    function tickDragAutoPan(ts) {
        dragAutoPanFrame = 0;
        if (!dragState || !dragState.dragging) {
            dragAutoPanLastTs = 0;
            return;
        }

        const dt = dragAutoPanLastTs ? Math.min(64, ts - dragAutoPanLastTs) : 16;
        dragAutoPanLastTs = ts;
        const velocity = computeDragAutoPanVelocity(dragState.lastClientX, dragState.lastClientY);

        if (velocity.x || velocity.y) {
            view.x += velocity.x * dt / 1000;
            view.y += velocity.y * dt / 1000;
            applyView({ deferQuickActions: true });
            updateDraggedNodePosition();

            const target = detectDropTarget(dragState.lastClientX, dragState.lastClientY, dragState.id);
            dragState.dropTargetId = target ? target.id : null;
            dragState.dropMode = target ? target.mode : 'child';
            paintDropTarget();
        }

        dragAutoPanFrame = window.requestAnimationFrame(tickDragAutoPan);
    }
    function getLevelInfo(points) {
        const value = nonNegativeNumber(points);
        const level = getLevelFromPoints(value);

        const currentMin = LEVEL_THRESHOLDS[level - 1];
        const nextMin = level < LEVEL_COUNT ? LEVEL_THRESHOLDS[level] : MASTER_THRESHOLD;
        const levelProgress = getProgressRatioFromPoints(value);
        const levelPercent = levelProgress * 100;

        return { points: value, level, currentMin, nextMin, levelProgress, levelPercent };
    }

    function getMasteryLabel(points) {
        const value = nonNegativeNumber(points);
        if (value >= 4000) return '大师';
        if (value >= 2500) return '精通 II';
        if (value >= 1500) return '精通 I';
        if (value >= MASTER_THRESHOLD) return '熟练';
        return '';
    }

    function levelColor(level) {
        const index = Math.max(0, Math.min(LEVEL_COLORS.length - 1, level - 1));
        return LEVEL_COLORS[index];
    }

    function formatPoints(points) {
        const value = nonNegativeNumber(points);
        if (value >= 100) return String(Math.round(value));
        if (value >= 10) return value.toFixed(1).replace(/\.0$/, '');
        return value.toFixed(1).replace(/\.0$/, '');
    }

    function formatPointTarget(info) {
        if (info.level >= LEVEL_COUNT) {
            return `${formatPoints(info.points)} / ${formatPoints(info.currentMin)}+ pts`;
        }
        return `${formatPoints(info.points)} / ${formatPoints(info.nextMin)} pts`;
    }

    function renderProgressSegments(info) {
        const fill = clamp(info.levelPercent, 0, 100);
        return `<div class="progress-segment current" style="--fill:${fill.toFixed(1)}%"></div>`;
    }

    function renderParentImpactChip(id, node) {
        if (!findParentId(id)) return '';
        const harmful = isHarmfulNode(node);
        const label = harmful ? '损害' : '助益';
        const title = harmful ? '损害：以负数计入父节点' : '助益：正向计入父节点';
        return `<button type="button" class="impact-chip ${harmful ? 'harm' : 'benefit'}" data-impact-chip="true" title="${title}" aria-label="${title}">${label === '损害' ? '-' : '+'}</button>`;
    }
    function render() {
        const progressMemo = new Map();
        const sceneSize = layoutForest();
        scene.style.width = sceneSize.width + 'px';
        scene.style.height = sceneSize.height + 'px';
        edges.setAttribute('width', sceneSize.width);
        edges.setAttribute('height', sceneSize.height);
        nodesLayer.style.width = sceneSize.width + 'px';
        nodesLayer.style.height = sceneSize.height + 'px';

        edges.innerHTML = '';
        nodesLayer.innerHTML = '';
        nodeEls = new Map();

        for (const id of layoutMap.keys()) {
            const node = getNode(id);
            const pos = layoutMap.get(id);
            const metrics = computeTreeProgress(id, progressMemo);
            const el = document.createElement('div');
            el.className = 'node' + (id === selectedId ? ' selected' : '') + (node.collapsed ? ' collapsed' : '');
            el.style.left = pos.x + 'px';
            el.style.top = pos.y + 'px';
            el.dataset.id = id;

            const levelInfo = getLevelInfo(metrics.points);
            const color = levelColor(levelInfo.level);
            el.style.setProperty('--level-color', color);
            const pointTarget = formatPointTarget(levelInfo);
            const impactChip = renderParentImpactChip(id, node);

            el.innerHTML = `
  ${impactChip}
  <div class="node-title">${escapeHtml(node.title)}</div>
  <div class="progress-label">
    <span class="level-badge">Lv ${levelInfo.level}</span>
    <span class="progress-points">${pointTarget}</span>
  </div>
  <div class="progress">
    ${renderProgressSegments(levelInfo)}
  </div>
  ${node.children && node.children.length > 0 ? '<div class="toggle-circle"></div>' : ''}
`;
            nodesLayer.appendChild(el);
            nodeEls.set(id, el);
            attachNodeEvents(el, id);
        }

        for (const [id, pos] of layoutMap.entries()) {
            const node = getNode(id);
            if (!node || node.collapsed) continue;
            node.children.forEach(cid => {
                const childNode = getNode(cid);
                const childPos = layoutMap.get(cid);
                if (!childPos) return;
                const harmful = isHarmfulNode(childNode);
                const x1 = pos.x + NODE_W / 2;
                const y1 = pos.y + NODE_H;
                const x2 = childPos.x + NODE_W / 2;
                const y2 = childPos.y;
                const midY = y1 + (y2 - y1) * 0.45;
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', harmful ? '#d64b4b' : '#cfd5e4');
                path.setAttribute('stroke-width', harmful ? '2.5' : '2');
                if (harmful) path.setAttribute('stroke-dasharray', '5 5');
                path.setAttribute('stroke-linecap', 'round');
                edges.appendChild(path);
            });
        }

        updateStatus();
        applyView();
    }

    function updateStatus() {
        const node = selectedId ? getNode(selectedId) : null;
        if (!node) {
            statusText.textContent = 'No selection';
            return;
        }
        const metrics = computeTreeProgress(selectedId, new Map());
        const levelInfo = getLevelInfo(metrics.points);
        const masteryLabel = getMasteryLabel(metrics.points);
        statusText.textContent = `${node.title} · Lv ${levelInfo.level}${masteryLabel ? ` · ${masteryLabel}` : ''} · ${formatPoints(metrics.points)} pts`;
    }

    function attachNodeEvents(el, id) {
        el.addEventListener('click', function (e) {
            e.stopPropagation();
            if (Date.now() < ignoreNodeClickUntil) {
                e.preventDefault();
                return;
            }
            if (closestElement(e.target, '.impact-chip') || closestElement(e.target, '.toggle-circle')) return;
            selectNode(id);
            const now = Date.now();
            if (e.detail > 1 || (tapInfo.id === id && now - tapInfo.ts < NODE_EDIT_TAP_MS)) {
                openEditorFromNodeGesture(id);
                return;
            }
            tapInfo = { id, ts: now };
        });

        el.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            openEditorFromNodeGesture(id);
        });

        el.addEventListener('pointerdown', function (e) {
            if (e.button !== 0 && e.pointerType !== 'touch') return;
            if (closestElement(e.target, '.toggle-circle')) return;
            if (closestElement(e.target, '.impact-chip')) return;
            e.stopPropagation();
            selectNode(id);
            el.setPointerCapture(e.pointerId);
            const start = worldPoint(e.clientX, e.clientY);
            const pos = layoutMap.get(id);

            dragState = {
                id,
                pointerId: e.pointerId,
                startClientX: e.clientX,
                startClientY: e.clientY,
                lastClientX: e.clientX,
                lastClientY: e.clientY,
                startWorldX: start.x,
                startWorldY: start.y,
                originLeft: pos.x,
                originTop: pos.y,
                pointerOffsetX: start.x - pos.x,
                pointerOffsetY: start.y - pos.y,
                dragging: false,
                dropTargetId: null,
                dropMode: 'child',
            };
        });

        el.addEventListener('pointermove', function (e) {
            if (!dragState || dragState.pointerId !== e.pointerId || dragState.id !== id) return;
            dragState.lastClientX = e.clientX;
            dragState.lastClientY = e.clientY;

            const moved = Math.hypot(e.clientX - dragState.startClientX, e.clientY - dragState.startClientY);

            if (!dragState.dragging && moved > 8) {
                dragState.dragging = true;
                el.classList.add('dragging');
                startDragAutoPan();
            }

            if (!dragState.dragging) return;

            updateDraggedNodePosition();
            el.style.zIndex = '50';

            const target = detectDropTarget(e.clientX, e.clientY, id);
            dragState.dropTargetId = target ? target.id : null;
            dragState.dropMode = target ? target.mode : 'child';
            paintDropTarget();
        });

        el.addEventListener('pointerup', function (e) {
            if (!dragState || dragState.pointerId !== e.pointerId || dragState.id !== id) return;
            el.releasePointerCapture(e.pointerId);
            el.classList.remove('dragging');
            el.style.zIndex = '';
            const wasDragging = dragState.dragging;
            if (wasDragging) {
                ignoreNodeClickUntil = Date.now() + 500;
                tapInfo = { id: null, ts: 0 };
                stopDragAutoPan();
            }

            if (wasDragging && dragState.dropTargetId) {
                moveNode(id, dragState.dropTargetId, dragState.dropMode);
            } else {
                el.style.left = dragState.originLeft + 'px';
                el.style.top = dragState.originTop + 'px';
            }

            clearDropTarget();
            dragState = null;
        });

        el.addEventListener('pointercancel', function () {
            el.classList.remove('dragging');
            el.style.zIndex = '';
            if (dragState && dragState.dragging) {
                ignoreNodeClickUntil = Date.now() + 500;
                tapInfo = { id: null, ts: 0 };
                stopDragAutoPan();
            }
            if (dragState) {
                el.style.left = dragState.originLeft + 'px';
                el.style.top = dragState.originTop + 'px';
            }
            clearDropTarget();
            dragState = null;
        });

        const toggleCircle = el.querySelector('.toggle-circle');
        if (toggleCircle) {
            toggleCircle.addEventListener('click', function (e) {
                e.stopPropagation();
                toggleNodeCollapse(id);
            });
        }

        const impactChip = el.querySelector('.impact-chip');
        if (impactChip) {
            bindImpactChipInteractions(impactChip, id);
        }
    }

    function bindImpactChipInteractions(impactChip, id) {
        let pointerId = null;
        let pointerType = '';
        let startX = 0;
        let startY = 0;
        let moved = false;
        let lastTap = { ts: 0, x: 0, y: 0 };
        let ignoreSyntheticClickUntil = 0;

        const isTouchPointer = event => event.pointerType === 'touch' || event.pointerType === 'pen';
        const suppressNativeTouch = event => {
            event.preventDefault();
            event.stopPropagation();
            ignoreSyntheticClickUntil = Date.now() + 700;
        };
        const releasePointer = event => {
            if (impactChip.releasePointerCapture && impactChip.hasPointerCapture && impactChip.hasPointerCapture(event.pointerId)) {
                impactChip.releasePointerCapture(event.pointerId);
            }
        };
        const clearState = () => {
            pointerId = null;
            pointerType = '';
            moved = false;
        };

        impactChip.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            if (isTouchPointer(e)) suppressNativeTouch(e);
            pointerId = e.pointerId;
            pointerType = e.pointerType;
            startX = e.clientX;
            startY = e.clientY;
            moved = false;
            if (impactChip.setPointerCapture) impactChip.setPointerCapture(e.pointerId);
        });

        impactChip.addEventListener('pointermove', function (e) {
            if (pointerId !== e.pointerId) return;
            if (Math.hypot(e.clientX - startX, e.clientY - startY) > CHIP_TAP_MOVE_PX) {
                moved = true;
            }
        });

        impactChip.addEventListener('pointerup', function (e) {
            if (pointerId !== e.pointerId) return;
            const isTouch = isTouchPointer(e) || pointerType === 'touch' || pointerType === 'pen';
            if (isTouch) suppressNativeTouch(e);

            if (!isTouch) {
                releasePointer(e);
                clearState();
                return;
            }

            if (!moved) {
                const now = Date.now();
                const closeToLastTap = Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) <= CHIP_TAP_MOVE_PX;
                if (lastTap.ts && now - lastTap.ts < CHIP_DOUBLE_TAP_MS && closeToLastTap) {
                    lastTap = { ts: 0, x: 0, y: 0 };
                    toggleParentImpact(id);
                } else {
                    lastTap = { ts: now, x: e.clientX, y: e.clientY };
                    selectNode(id);
                }
            }

            releasePointer(e);
            clearState();
        });

        impactChip.addEventListener('pointercancel', function (e) {
            releasePointer(e);
            clearState();
        });
        impactChip.addEventListener('lostpointercapture', clearState);
        impactChip.addEventListener('contextmenu', event => event.preventDefault());
        impactChip.addEventListener('selectstart', event => event.preventDefault());

        impactChip.addEventListener('click', function (e) {
            e.stopPropagation();
            if (Date.now() < ignoreSyntheticClickUntil) {
                e.preventDefault();
                return;
            }
            selectNode(id);
        });
        impactChip.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            e.preventDefault();
            if (Date.now() < ignoreSyntheticClickUntil) return;
            toggleParentImpact(id);
        });
    }

    function detectDropTarget(clientX, clientY, dragId) {
        const wp = worldPoint(clientX, clientY);
        for (const [id, pos] of layoutMap.entries()) {
            if (id === dragId || isDescendant(dragId, id)) continue;
            if (wp.x >= pos.x && wp.x <= pos.x + pos.width && wp.y >= pos.y && wp.y <= pos.y + pos.height) {
                const relY = (wp.y - pos.y) / pos.height;
                let mode = 'child';
                if (relY < 0.22) mode = 'before';
                else if (relY > 0.78) mode = 'after';
                return { id, mode };
            }
        }
        return detectSiblingSortTarget(wp, dragId);
    }

    function detectSiblingSortTarget(wp, dragId) {
        const parentId = findParentId(dragId);
        const siblingIds = parentId ? getNode(parentId).children : state.rootIds;
        const siblingBoxes = siblingIds
            .filter(id => id !== dragId)
            .map(id => ({ id, pos: layoutMap.get(id) }))
            .filter(item => item.pos)
            .sort((a, b) => a.pos.x - b.pos.x);

        if (!siblingBoxes.length) return null;

        const rowTop = Math.min(...siblingBoxes.map(item => item.pos.y));
        const rowBottom = Math.max(...siblingBoxes.map(item => item.pos.y + item.pos.height));
        const rowSlack = Math.max(24, V_GAP / 2);
        if (wp.y < rowTop - rowSlack || wp.y > rowBottom + rowSlack) return null;

        for (const item of siblingBoxes) {
            const midpoint = item.pos.x + item.pos.width / 2;
            if (wp.x < midpoint) return { id: item.id, mode: 'before' };
        }

        return { id: siblingBoxes[siblingBoxes.length - 1].id, mode: 'after' };
    }

    function paintDropTarget() {
        clearDropTarget();
        if (!dragState || !dragState.dropTargetId) return;
        const el = nodeEls.get(dragState.dropTargetId);
        if (el) el.classList.add('drop-target');
    }

    function clearDropTarget() {
        nodeEls.forEach(el => el.classList.remove('drop-target'));
    }

    function selectNode(id) {
        selectedId = id;
        nodeEls.forEach((el, nid) => el.classList.toggle('selected', nid === id));
        updateStatus();
        updateNodeQuickActions();
    }

    function setParentImpact(id, impact) {
        const node = getNode(id);
        if (!node || !findParentId(id)) return;
        node.parentImpact = normalizeParentImpact(impact);
        persistAndRender();
        updateParentImpactUI();
        updateEditorStats();
    }

    function toggleParentImpact(id) {
        const node = getNode(id);
        if (!node || !findParentId(id)) return;
        const nextImpact = isHarmfulNode(node) ? PARENT_IMPACT_BENEFIT : PARENT_IMPACT_HARM;
        setParentImpact(id, nextImpact);
    }

    function updateParentImpactUI() {
        const node = editingId ? getNode(editingId) : null;
        const hasParent = !!(editingId && findParentId(editingId));
        if (!node || !hasParent) {
            parentImpactPanel.hidden = true;
            return;
        }
        const impact = normalizeParentImpact(node.parentImpact);
        parentImpactPanel.hidden = false;
        parentImpactButtons.forEach(btn => {
            const active = btn.dataset.impact === impact;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }

    function setEditorStatsOpen(isOpen) {
        editorStats.hidden = !isOpen;
        toggleStatsBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function openEditor(id, options = {}) {
        const node = getNode(id);
        if (!node) return;
        if (options.isNew) {
            pendingNewNodeId = id;
            pendingNewNodePreviousSelectedId = options.previousSelectedId || null;
        } else {
            pendingNewNodeId = null;
            pendingNewNodePreviousSelectedId = null;
        }
        editingId = id;
        titleInput.value = node.title;
        editorBackdrop.classList.add('open');
        updateNodeQuickActions();
        setEditorStatsOpen(false);
        updateParentImpactUI();
        updateEditorStats();
        titleInput.focus({ preventScroll: true });
        titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    }

    function closeEditor() {
        if (pendingNewNodeId) {
            discardPendingNewNode();
        }
        editingId = null;
        editorBackdrop.classList.remove('open');
        updateNodeQuickActions();
    }

    function updateEditorStats() {
        const node = editingId ? getNode(editingId) : null;
        if (!node) return;
        const m = computeTreeProgress(editingId, new Map());
        const levelInfo = getLevelInfo(m.points);
        const masteryLabel = getMasteryLabel(m.points);
        const parentId = findParentId(editingId);
        const stats = [
            `Level: <strong>Lv ${levelInfo.level}${masteryLabel ? ` · ${masteryLabel}` : ''}</strong> · ${formatPointTarget(levelInfo)}`,
            `Raw count: ${m.rawCount.toFixed(0)} · Decayed: ${m.decayedCount.toFixed(1)}`,
            `Raw minutes: ${m.rawMinutes.toFixed(0)} · Decayed: ${m.decayedMinutes.toFixed(1)}`,
            `Consistency: ${m.activeDaysLast30}/${CONSISTENCY_WINDOW_DAYS} days · +${(m.consistencyBonus * 100).toFixed(1)}%`,
            `Freshness: ${(m.freshness * 100).toFixed(0)}%`,
        ];
        if (parentId) {
            stats.splice(1, 0, `Parent impact: <strong>${parentImpactLabel(node)}</strong> · ${isHarmfulNode(node) ? '-' : '+'}${formatPoints(m.points)} pts to parent`);
        }
        editorStats.innerHTML = stats.join('<br>');
    }

    function saveEditor() {
        const node = editingId ? getNode(editingId) : null;
        if (!node) return;
        const nextTitle = titleInput.value.trim();
        if (pendingNewNodeId === editingId && !nextTitle) {
            closeEditor();
            return;
        }
        pendingNewNodeId = null;
        pendingNewNodePreviousSelectedId = null;
        node.title = nextTitle || TITLE_DEFAULT;
        persistAndRender();
        closeEditor();
    }

    function shouldSaveEditorOnTitleBlur() {
        if (!editorBackdrop.classList.contains('open')) return false;
        if (!editingId) return false;
        if (!window.matchMedia('(pointer: coarse)').matches && !('ontouchstart' in window)) return false;
        const active = document.activeElement;
        return !active || !editorForm.contains(active);
    }

    function pushActivity(id, count, minutes) {
        const node = getNode(id);
        if (!node) return;
        node.activityLog.push({ ts: Date.now(), count, minutes });
        updateEditorStats();
        persistAndRender();
    }

    function exportJson() {
        importExportArea.value = JSON.stringify(state, null, 2);
        exportBackdrop.classList.add('open');
        updateNodeQuickActions();
        importExportArea.focus();
        importExportArea.select();
    }

    function makeDownloadFilename() {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
        return `roadmap-tree_${timestamp}.json`;
    }

    function isLikelyIOS() {
        // iPadOS can report as Mac; this catches it.
        return /iP(ad|hone|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    }

    async function downloadJsonFile() {
        const data = importExportArea.value || JSON.stringify(state, null, 2);
        const filename = makeDownloadFilename();

        const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        if (isLikelyIOS()) {
            // iPhone/iPad Safari often ignores a[download] for blob URLs.
            // Web Share (Save to Files) is the most reliable path on iOS.
            try {
                const file = new File([blob], filename, { type: blob.type });
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: filename });
                    URL.revokeObjectURL(url);
                    return;
                }
            } catch (e) {
                // Fall through to open-in-tab fallback.
            }

            // iOS fallback: open the blob URL so the user can Share -> Save to Files.
            try {
                window.open(url, '_blank', 'noopener');
            } catch (e) { }
            setTimeout(() => URL.revokeObjectURL(url), 2000);
            return;
        }

        // Non-iOS browsers (including macOS Safari): trigger a real download.
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.rel = 'noopener';
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Delay revoke so Safari has time to resolve the blob URL.
        setTimeout(() => URL.revokeObjectURL(url), 2000);
    }

    function closeExport() {
        exportBackdrop.classList.remove('open');
        updateNodeQuickActions();
    }

    function loadJsonString(text) {
        try {
            const parsed = JSON.parse(text);
            state = normalizeState(parsed && parsed.version === 2 ? parsed.state : parsed);
            selectedId = state.rootIds[0] || null;
            persistAndRender();
            adjustViewAfterLayoutChange();
            closeExport();
        } catch (e) {
            alert('Invalid JSON');
        }
    }

    function cloneNodeWithId(node, nextId) {
        return {
            ...node,
            id: nextId,
            activityLog: Array.isArray(node.activityLog) ? node.activityLog.map(entry => ({ ...entry })) : [],
            children: Array.isArray(node.children) ? [...node.children] : [],
        };
    }

    function mergeForestIntoState(targetState, incomingState) {
        const target = normalizeState(targetState);
        const incoming = normalizeState(incomingState);
        const idMap = new Map();
        const mergedNodes = { ...target.nodes };

        Object.keys(incoming.nodes).forEach(oldId => {
            let nextId = oldId;
            if (mergedNodes[nextId]) {
                do {
                    nextId = uid();
                } while (mergedNodes[nextId] || idMapHasValue(idMap, nextId));
            }
            idMap.set(oldId, nextId);
        });

        Object.entries(incoming.nodes).forEach(([oldId, node]) => {
            const nextId = idMap.get(oldId);
            const cloned = cloneNodeWithId(node, nextId);
            cloned.children = cloned.children
                .map(childId => idMap.get(childId))
                .filter(Boolean);
            mergedNodes[nextId] = cloned;
        });

        const incomingRoots = incoming.rootIds
            .map(rootId => idMap.get(rootId))
            .filter(Boolean);
        return normalizeState({
            nodes: mergedNodes,
            rootIds: [...target.rootIds, ...incomingRoots],
        });
    }

    function idMapHasValue(idMap, value) {
        for (const mappedValue of idMap.values()) {
            if (mappedValue === value) return true;
        }
        return false;
    }

    function renderCurrentSpaceName(current = TreeMapStorage.getCurrentSpace()) {
        if (!currentSpaceName) return;
        if (!current) {
            currentSpaceName.textContent = activeLegacyMode ? 'Space · Legacy local' : '';
            currentSpaceName.title = '';
            return;
        }
        currentSpaceName.textContent = `Space · ${current.name}`;
        currentSpaceName.title = `${current.name} · ${current.storage_mode === 'cloud_sync' ? 'Cloud' : 'Local'}`;
    }

    function renderSpaceSettings() {
        const spaces = TreeMapStorage.getSpaces();
        const current = TreeMapStorage.getCurrentSpace();
        spaceSelect.innerHTML = '';
        migrationSourceSelect.innerHTML = '';
        migrationTargetSelect.innerHTML = '';

        if (!spaces.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = activeLegacyMode ? 'Legacy local data' : 'No space';
            spaceSelect.appendChild(option);
        }

        const legacyOption = document.createElement('option');
        legacyOption.value = 'legacy';
        legacyOption.textContent = 'Legacy local data';
        migrationSourceSelect.appendChild(legacyOption);

        spaces.forEach(space => {
            const option = document.createElement('option');
            option.value = space.id;
            option.textContent = `${space.name} · ${space.storage_mode === 'cloud_sync' ? 'Cloud' : 'Local'}`;
            option.selected = current && current.id === space.id;
            spaceSelect.appendChild(option);

            const sourceOption = option.cloneNode(true);
            sourceOption.selected = false;
            migrationSourceSelect.appendChild(sourceOption);

            const targetOption = option.cloneNode(true);
            targetOption.selected = current && current.id === space.id;
            migrationTargetSelect.appendChild(targetOption);
        });

        const localCount = spaces.filter(space => space.storage_mode === 'local_only').length;
        const cloudCount = spaces.filter(space => space.storage_mode === 'cloud_sync').length;
        const label = current
            ? `${current.storage_mode === 'cloud_sync' ? 'Cloud sync' : 'Local only'}`
            : 'Legacy local';
        renderCurrentSpaceName(current);
        spaceStatus.textContent = `${current ? current.name : 'Current'} · ${label} · Local ${localCount} / Cloud ${cloudCount}`;
        renameSpaceBtn.disabled = !current;
    }

    async function refreshCloudSpaces(showStatus = false) {
        try {
            if (showStatus) spaceStatus.textContent = 'Refreshing cloud spaces...';
            await TreeMapStorage.syncCloudSpaces();
            renderSpaceSettings();
        } catch (error) {
            console.error(error);
            if (showStatus) spaceStatus.textContent = `Refresh failed: ${formatErrorMessage(error)}`;
        }
    }

    function openSettings() {
        renderSpaceSettings();
        settingsBackdrop.classList.add('open');
        updateNodeQuickActions();
        refreshCloudSpaces();
    }

    function closeSettings() {
        settingsBackdrop.classList.remove('open');
        updateNodeQuickActions();
    }

    function openSpaceNameDialog(storageMode, space = null) {
        pendingSpaceMode = storageMode;
        pendingRenameSpaceId = space ? space.id : null;
        const isRename = storageMode === 'rename';
        spaceNameTitle.textContent = isRename ? 'Rename Space' : storageMode === 'cloud_sync' ? 'New Cloud Tree' : 'New Local Tree';
        spaceNameInput.value = isRename && space ? space.name : '';
        spaceNameMessage.textContent = '';
        spaceNameSaveBtn.textContent = isRename ? 'Save' : 'Create';
        spaceNameBackdrop.classList.add('open');
        updateNodeQuickActions();
        setTimeout(() => {
            spaceNameInput.focus();
            if (isRename) spaceNameInput.select();
        }, 0);
    }

    function closeSpaceNameDialog() {
        spaceNameBackdrop.classList.remove('open');
        spaceNameMessage.textContent = '';
        pendingRenameSpaceId = null;
        spaceNameSaveBtn.textContent = 'Create';
        updateNodeQuickActions();
    }

    async function saveNamedSpace() {
        const storageMode = pendingSpaceMode;
        const name = spaceNameInput.value.trim();
        try {
            if (storageMode === 'rename') {
                await TreeMapStorage.renameSpace(pendingRenameSpaceId, name);
                closeSpaceNameDialog();
                renderSpaceSettings();
                return;
            }

            await TreeMapStorage.createSpace({
                name: name || (storageMode === 'cloud_sync' ? 'Cloud Tree' : 'Local Tree'),
                storage_mode: storageMode,
                initialState: createSampleState(),
            });
            state = await TreeMapStorage.getCurrentState();
            selectedId = state.rootIds[0] || null;
            closeSpaceNameDialog();
            renderSpaceSettings();
            render();
            resetView();
        } catch (error) {
            console.error(error);
            spaceNameMessage.textContent = `${storageMode === 'rename' ? 'Rename' : 'Create'} failed: ${formatErrorMessage(error)}`;
        }
    }

    function openRenameSpaceDialog() {
        const current = TreeMapStorage.getCurrentSpace();
        if (!current) {
            spaceStatus.textContent = 'No space selected.';
            return;
        }
        openSpaceNameDialog('rename', current);
    }

    async function switchCurrentSpace(spaceId) {
        await TreeMapStorage.setCurrentSpace(spaceId);
        state = await TreeMapStorage.getCurrentState();
        selectedId = state.rootIds[0] || null;
        renderSpaceSettings();
        render();
        resetView();
        updateSearchControls();
    }

    async function deleteCurrentSpace() {
        const current = TreeMapStorage.getCurrentSpace();
        if (!current) {
            spaceStatus.textContent = 'No space selected.';
            return;
        }
        const confirmed = window.confirm(`Delete "${current.name}"?`);
        if (!confirmed) return;
        try {
            await TreeMapStorage.deleteCurrentSpace();
            await refreshCloudSpaces();
            state = await TreeMapStorage.getCurrentState();
            selectedId = state.rootIds[0] || null;
            renderSpaceSettings();
            render();
            resetView();
        } catch (error) {
            console.error(error);
            spaceStatus.textContent = `Delete failed: ${formatErrorMessage(error)}`;
        }
    }

    async function migrateSpaceData() {
        const sourceId = migrationSourceSelect.value;
        const targetId = migrationTargetSelect.value;
        if (!sourceId || !targetId) {
            spaceStatus.textContent = 'Choose source and target spaces.';
            return;
        }
        if (sourceId === targetId) {
            spaceStatus.textContent = 'Source and target must be different.';
            return;
        }
        const sourceLabel = migrationSourceSelect.options[migrationSourceSelect.selectedIndex]?.textContent || 'source';
        const targetLabel = migrationTargetSelect.options[migrationTargetSelect.selectedIndex]?.textContent || 'target';
        const confirmed = window.confirm(`Append forest from "${sourceLabel}" into "${targetLabel}"? Target data will be kept.`);
        if (!confirmed) return;
        try {
            const sourceState = sourceId === 'legacy'
                ? readLegacyState()
                : await TreeMapStorage.getSpaceState(sourceId);
            const targetState = await TreeMapStorage.getSpaceState(targetId);
            const mergedState = mergeForestIntoState(targetState, sourceState);
            await TreeMapStorage.saveStateToSpace(targetId, mergedState);
            const current = TreeMapStorage.getCurrentSpace();
            if (current && current.id === targetId) {
                state = mergedState;
                selectedId = state.rootIds[0] || null;
                render();
                resetView();
            }
            renderSpaceSettings();
            spaceStatus.textContent = 'Migration complete. Source forest appended to target.';
        } catch (error) {
            console.error(error);
            spaceStatus.textContent = `Migration failed: ${formatErrorMessage(error)}`;
        }
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    viewport.addEventListener('pointerdown', function (e) {
        if (e.target !== viewport && e.target !== scene && e.target !== nodesLayer && e.target !== edges) return;
        viewport.setPointerCapture(e.pointerId);
        panState = {
            pointerId: e.pointerId,
            startX: e.clientX,
            startY: e.clientY,
            viewX: view.x,
            viewY: view.y,
        };
        suspendNodeQuickActions();
        viewport.classList.add('panning');
    });

    viewport.addEventListener('pointermove', function (e) {
        if (panState && panState.pointerId === e.pointerId) {
            view.x = panState.viewX + (e.clientX - panState.startX);
            view.y = panState.viewY + (e.clientY - panState.startY);
            applyView({ deferQuickActions: true });
        }
    });

    viewport.addEventListener('pointerup', function (e) {
        if (panState && panState.pointerId === e.pointerId) {
            viewport.releasePointerCapture(e.pointerId);
            panState = null;
            viewport.classList.remove('panning');
            restoreNodeQuickActions(70);
        }
    });
    viewport.addEventListener('pointercancel', function () {
        panState = null;
        viewport.classList.remove('panning');
        restoreNodeQuickActions(70);
    });

    viewport.addEventListener('wheel', function (e) {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.08 : 0.92;
        zoomAt(e.clientX, e.clientY, factor);
    }, { passive: false });

    viewport.addEventListener('touchstart', function (e) {
        if (e.touches.length === 2) {
            suspendNodeQuickActions();
            pinchState = {
                dist: touchDistance(e.touches[0], e.touches[1]),
                center: touchCenter(e.touches[0], e.touches[1]),
                scale: view.scale,
            };
        }
    }, { passive: false });

    viewport.addEventListener('touchmove', function (e) {
        if (e.touches.length === 2 && pinchState) {
            e.preventDefault();
            const dist = touchDistance(e.touches[0], e.touches[1]);
            const center = touchCenter(e.touches[0], e.touches[1]);
            const factor = dist / Math.max(1, pinchState.dist);
            view.scale = Math.max(0.35, Math.min(2.4, pinchState.scale * factor));
            const rect = viewport.getBoundingClientRect();
            view.x = center.x - rect.left - ((center.x - rect.left - view.x) / Math.max(0.0001, factor));
            view.y = center.y - rect.top - ((center.y - rect.top - view.y) / Math.max(0.0001, factor));
            applyView({ deferQuickActions: true });
        }
    }, { passive: false });

    viewport.addEventListener('touchend', function (e) {
        if (e.touches.length < 2) {
            pinchState = null;
            restoreNodeQuickActions(70);
        }
    });

    function touchDistance(a, b) {
        return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    }
    function touchCenter(a, b) {
        return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
    }

    document.getElementById('addRootBtn').addEventListener('click', addRoot);
    nodeQuickActions.addEventListener('pointerdown', function (e) {
        e.stopPropagation();
    });
    nodeQuickActions.addEventListener('click', function (e) {
        const button = closestElement(e.target, '[data-node-action]');
        if (!button || button.disabled) return;
        e.preventDefault();
        e.stopPropagation();
        const action = button.dataset.nodeAction;
        if (action === 'add-child') {
            if (selectedId) addChild(selectedId); else addRoot();
        } else if (action === 'add-sibling') {
            if (selectedId) addSibling(selectedId); else addRoot();
        } else if (action === 'make-root') {
            if (selectedId) promoteToRoot(selectedId);
        } else if (action === 'delete') {
            if (selectedId) deleteNode(selectedId);
        } else if (action.startsWith('move-')) {
            moveSelection(action.replace('move-', ''));
        }
    });
    document.getElementById('exportBtn').addEventListener('click', exportJson);
    document.getElementById('resetViewBtn').addEventListener('click', resetView);
    nodeSearchToggleBtn.addEventListener('click', function () {
        setSearchOpen(nodeSearchGroup.classList.contains('collapsed'));
    });
    nodeSearchInput.addEventListener('input', function () {
        runNodeSearch(selectedId);
        if (nodeSearchInput.value.trim()) {
            clearSearchCollapseTimer();
        } else {
            scheduleEmptySearchCollapse();
        }
    });
    nodeSearchInput.addEventListener('focus', function () {
        scheduleEmptySearchCollapse();
    });
    nodeSearchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearSearchCollapseTimer();
            stepSearchResult(e.shiftKey ? -1 : 1);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            if (nodeSearchInput.value) {
                nodeSearchInput.value = '';
                runNodeSearch();
                scheduleEmptySearchCollapse();
            } else {
                setSearchOpen(false);
            }
        }
    });
    nodeSearchPrevBtn.addEventListener('click', function () {
        clearSearchCollapseTimer();
        stepSearchResult(-1);
        nodeSearchInput.focus();
    });
    nodeSearchNextBtn.addEventListener('click', function () {
        clearSearchCollapseTimer();
        stepSearchResult(1);
        nodeSearchInput.focus();
    });
    document.getElementById('copyJsonBtn').addEventListener('click', async function () {
        try {
            await navigator.clipboard.writeText(importExportArea.value);
        } catch (e) {
            importExportArea.select();
            document.execCommand('copy');
        }
    });
    document.getElementById('downloadJsonBtn').addEventListener('click', downloadJsonFile);
    document.getElementById('loadJsonBtn').addEventListener('click', function () {
        loadJsonString(importExportArea.value);
    });
    document.getElementById('closeExportBtn').addEventListener('click', closeExport);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);

    importInput.addEventListener('change', function (e) {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function () {
            loadJsonString(String(reader.result || ''));
            importInput.value = '';
        };
        reader.readAsText(file);
    });

    spaceSelect.addEventListener('change', function () {
        if (spaceSelect.value) switchCurrentSpace(spaceSelect.value);
    });
    newLocalSpaceBtn.addEventListener('click', function () {
        openSpaceNameDialog('local_only');
    });
    newCloudSpaceBtn.addEventListener('click', function () {
        openSpaceNameDialog('cloud_sync');
    });
    renameSpaceBtn.addEventListener('click', openRenameSpaceDialog);
    refreshCloudSpacesBtn.addEventListener('click', function () {
        refreshCloudSpaces(true);
    });
    deleteSpaceBtn.addEventListener('click', deleteCurrentSpace);
    migrateSpaceBtn.addEventListener('click', migrateSpaceData);
    spaceNameSaveBtn.addEventListener('click', saveNamedSpace);
    spaceNameCancelBtn.addEventListener('click', closeSpaceNameDialog);
    spaceNameInput.addEventListener('input', function () {
        spaceNameMessage.textContent = '';
    });
    spaceNameInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveNamedSpace();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closeSpaceNameDialog();
        }
    });

    plusCountBtn.addEventListener('click', function () {
        if (editingId) pushActivity(editingId, 1, 0);
    });
    plusTimeBtn.addEventListener('click', function () {
        if (editingId) pushActivity(editingId, 0, 20);
    });
    toggleStatsBtn.addEventListener('click', function () {
        setEditorStatsOpen(editorStats.hidden);
    });
    parentImpactButtons.forEach(btn => {
        btn.addEventListener('click', function () {
            if (editingId) setParentImpact(editingId, btn.dataset.impact);
        });
    });
    editorForm.addEventListener('submit', function (e) {
        e.preventDefault();
        saveEditor();
    });
    cancelNodeBtn.addEventListener('click', closeEditor);
    editorBackdrop.addEventListener('click', function (e) {
        if (e.target === editorBackdrop) closeEditor();
    });
    exportBackdrop.addEventListener('click', function (e) {
        if (e.target === exportBackdrop) closeExport();
    });
    settingsBackdrop.addEventListener('click', function (e) {
        if (e.target === settingsBackdrop) closeSettings();
    });
    spaceNameBackdrop.addEventListener('click', function (e) {
        if (e.target === spaceNameBackdrop) closeSpaceNameDialog();
    });

    titleInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveEditor();
        }
    });
    titleInput.addEventListener('blur', function () {
        window.setTimeout(() => {
            if (shouldSaveEditorOnTitleBlur()) saveEditor();
        }, 0);
    });

    window.addEventListener('keydown', function (e) {
        const tag = document.activeElement && document.activeElement.tagName;
        const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
        if (editorBackdrop.classList.contains('open')) {
            if (e.key === 'Escape') closeEditor();
            return;
        }
        if (exportBackdrop.classList.contains('open')) {
            if (e.key === 'Escape') closeExport();
            return;
        }
        if (settingsBackdrop.classList.contains('open')) {
            if (e.key === 'Escape') closeSettings();
            return;
        }
        if (spaceNameBackdrop.classList.contains('open')) {
            if (e.key === 'Escape') closeSpaceNameDialog();
            return;
        }
        if (inInput) return;
        if (!selectedId) {
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                const firstId = getVisibleTraversalIds()[0];
                if (firstId) {
                    e.preventDefault();
                    selectNode(firstId);
                    centerViewOnNode(firstId);
                }
            }
            return;
        }

        if (e.key === 'Enter') {
            e.preventDefault();
            openEditor(selectedId);
        } else if (e.key === 'Tab') {
            e.preventDefault();
            addChild(selectedId);
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            deleteNode(selectedId);
        } else if (e.key === ' ') {
            e.preventDefault();
            toggleNodeCollapse(selectedId);
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            moveSelection('left');
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            moveSelection('right');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            moveSelection('up');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            moveSelection('down');
        }
    });

    viewport.addEventListener('click', function (e) {
        if (e.target === viewport || e.target === scene || e.target === nodesLayer || e.target === edges) {
            selectedId = null;
            nodeEls.forEach(el => el.classList.remove('selected'));
            updateStatus();
        }
    });

    async function initApp() {
        await refreshCloudSpaces();
        state = await TreeMapStorage.getCurrentState();
        selectedId = state.rootIds[0] || null;
        if (!TreeMapStorage.getCurrentSpace() && !localStorage.getItem(STORAGE_KEY)) {
            await TreeMapStorage.createSpace({
                name: 'Local Tree',
                storage_mode: 'local_only',
                initialState: state,
            });
            state = await TreeMapStorage.getCurrentState();
            selectedId = state.rootIds[0] || null;
        }
        renderSpaceSettings();
        render();
        resetView();
    }

    initApp();
})();
