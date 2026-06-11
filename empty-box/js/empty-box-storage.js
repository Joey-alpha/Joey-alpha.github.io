(function () {
    const { normalizeState, createEmptyState } = window.EmptyBoxState;

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
    const MUST_DO_TASK_LIMIT = 6;

    const keys = {
        STORAGE_KEY,
        UPDATE_PING_KEY,
        SPACE_LIST_KEY,
        CURRENT_SPACE_ID_KEY,
        CURRENT_STORAGE_MODE_KEY,
        MIGRATION_DONE_KEY,
        MIGRATION_DISMISSED_KEY,
        CLOUD_STATE_SOURCE
    };

    let getAppState = createEmptyState;
    let setAppState = () => {};
    let getBooting = () => false;
    let setLegacyMode = () => {};
    let reportCloudSyncError = () => {};
    let activeLegacyMode = false;

    function configure(options = {}) {
        if (typeof options.getState === 'function') getAppState = options.getState;
        if (typeof options.setState === 'function') setAppState = options.setState;
        if (typeof options.isBooting === 'function') getBooting = options.isBooting;
        if (typeof options.setLegacyMode === 'function') setLegacyMode = options.setLegacyMode;
        if (typeof options.reportCloudSyncError === 'function') reportCloudSyncError = options.reportCloudSyncError;
    }

    function setActiveLegacyMode(nextValue) {
        activeLegacyMode = Boolean(nextValue);
        setLegacyMode(activeLegacyMode);
    }

    function createId(prefix) {
        if (crypto && crypto.randomUUID) return crypto.randomUUID();
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
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
        configure,
        keys,
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
            setActiveLegacyMode(true);
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
            setActiveLegacyMode(false);
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
                setActiveLegacyMode(true);
                return normalizeState(readJson(STORAGE_KEY, {}));
            }
            setActiveLegacyMode(false);
            if (space.storage_mode === 'cloud_sync') {
                return this.getCloudState(space);
            }
            return normalizeState(readJson(spaceStateKey(space.id), {}));
        },
    
        async saveAppState(nextState, forcedSpace = null) {
            if (getBooting()) return;
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
                    reportCloudSyncError(`云端同步失败：${formatErrorMessage(error)}`);
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
                    setActiveLegacyMode(false);
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
                state: getAppState()
            };
        },
    
        async importData(payload) {
            const importedState = payload && payload.version === 2 ? payload.state : payload;
            const nextState = normalizeState(importedState);
            setAppState(nextState);
            await this.saveAppState(nextState);
            return nextState;
        }
    };
    
    
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
            dailyTasks: mergeUnique(base.dailyTasks, incoming.dailyTasks),
            dailyCompletedByDate: { ...incoming.dailyCompletedByDate, ...base.dailyCompletedByDate },
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
            dailyTasks: mergeUnique(base.dailyTasks, incoming.dailyTasks),
            dailyCompletedByDate: { ...incoming.dailyCompletedByDate, ...base.dailyCompletedByDate },
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
    
    StorageService.formatErrorMessage = formatErrorMessage;
    StorageService.readJson = readJson;
    StorageService.writeJson = writeJson;

    window.EmptyBoxStorage = StorageService;
})();
