(function () {
    const { normalizeState, createEmptyState } = window.EmptyBoxState;

    const STORAGE_KEY = 'activation-task-demo-state';
    const UPDATE_PING_KEY = 'activation-task-demo-last-updated';
    const SUPABASE_URL = 'https://ufwvkabshfrrodmtycjj.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd3ZrYWJzaGZycm9kbXR5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjg4NjMsImV4cCI6MjA5NDc0NDg2M30.kSQJBTLSjd5XhLX0cddqjUfSw0QXt-Ilr2UsGPMamIo';
    const SPACE_LIST_KEY = 'empty-box-spaces-v1';
    const V2_SPACE_LIST_KEY = 'empty-box-v2::spaces';
    const CURRENT_SPACE_ID_KEY = 'current_space_id';
    const CURRENT_STORAGE_MODE_KEY = 'current_storage_mode';
    const MIGRATION_DONE_KEY = 'empty-box-migration-done';
    const MIGRATION_DISMISSED_KEY = 'empty-box-migration-dismissed';
    const CLOUD_BACKUP_PREFIX = 'empty-box-v2::cloud-backup::';
    const MUST_DO_TASK_LIMIT = 6;

    const keys = {
        STORAGE_KEY,
        UPDATE_PING_KEY,
            SPACE_LIST_KEY,
            V2_SPACE_LIST_KEY,
            CURRENT_SPACE_ID_KEY,
        CURRENT_STORAGE_MODE_KEY,
        MIGRATION_DONE_KEY,
        MIGRATION_DISMISSED_KEY
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

    function v2SpaceCollectionKey(spaceId, collection) {
        return `empty-box-v2::space::${spaceId}::${collection}`;
    }

    function isUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
    }

    function nextPosition(values, value) {
        const index = values.indexOf(value);
        return index >= 0 ? index : null;
    }

    function getTodayKey() {
        return new Date().toISOString().slice(0, 10);
    }

    function cloudBackupKey(spaceId) {
        return `${CLOUD_BACKUP_PREFIX}${spaceId}`;
    }

    function hasCloudRecords(records) {
        return Boolean(
            records &&
            (
                (Array.isArray(records.tasks) && records.tasks.length) ||
                (Array.isArray(records.dailyCompletions) && records.dailyCompletions.length) ||
                (Array.isArray(records.completions) && records.completions.length) ||
                (Array.isArray(records.reflections) && records.reflections.length) ||
                (records.space && (records.space.current_task_id || records.space.active_group_id || records.space.pinned_group_id))
            )
        );
    }

    function toCompletionRecord(row) {
        const text = row.task_text_snapshot || '';
        const tags = Array.isArray(row.tags) ? row.tags.filter(Boolean) : [];
        return tags.length ? `${text}【${tags.join(' · ')}】` : text;
    }

    function normalizeSpace(space) {
        return {
            owner_id: null,
            storage_mode: 'local_only',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...space
        };
    }

    function createUniqueGroupName(rawName, usedNames) {
        const baseName = String(rawName || '').trim() || 'Tab';
        let name = baseName;
        let index = 2;
        while (usedNames.has(name)) {
            name = `${baseName} ${index}`;
            index += 1;
        }
        usedNames.add(name);
        return name;
    }

    function stateToV2Records(state, space) {
        const normalized = normalizeState(state);
        const now = new Date().toISOString();
        const inboxGroupId = createId('group');
        const usedGroupNames = new Set(['Inbox']);
        const oldToNewGroupId = new Map([[window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id, inboxGroupId]]);
        const groups = [{
            id: inboxGroupId,
            space_id: space.id,
            name: 'Inbox',
            kind: 'inbox',
            position: 0,
            is_default: true,
            created_at: now,
            updated_at: now
        }];

        normalized.mustDoCriteria.forEach((criterion, index) => {
            const groupId = isUuid(criterion.id) ? criterion.id : createId('group');
            const groupName = createUniqueGroupName(criterion.name, usedGroupNames);
            oldToNewGroupId.set(criterion.id, groupId);
            groups.push({
                id: groupId,
                space_id: space.id,
                name: groupName,
                kind: 'custom',
                position: index + 1,
                is_default: false,
                created_at: now,
                updated_at: now
            });
        });

        const taskTexts = window.EmptyBoxState.getStateTaskPool(normalized);
        Object.values(normalized.mustDoTaskOrder || {}).forEach(tasks => {
            window.EmptyBoxState.normalizeTaskList(tasks).forEach(task => {
                if (!taskTexts.includes(task)) taskTexts.push(task);
            });
        });

        const taskByText = new Map();
        const tasks = taskTexts.map((text, index) => {
            const oldGroupId = normalized.mustDoTaskGroups[text] || window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id;
            const groupId = oldToNewGroupId.get(oldGroupId) || inboxGroupId;
            const groupOrder = window.EmptyBoxState.normalizeTaskList(normalized.mustDoTaskOrder[oldGroupId] || []);
            const starPosition = nextPosition(normalized.mustDoTasks, text);
            const dailyPosition = nextPosition(normalized.dailyTasks, text);
            const task = {
                id: createId('task'),
                space_id: space.id,
                group_id: groupId,
                text,
                status: 'active',
                group_position: nextPosition(groupOrder, text) ?? nextPosition(normalized.boxTasks, text) ?? index,
                is_starred: starPosition !== null,
                star_position: starPosition,
                is_daily: dailyPosition !== null,
                daily_position: dailyPosition,
                created_at: now,
                updated_at: now,
                completed_at: null
            };
            taskByText.set(text, task);
            return task;
        });

        const dailyCompletions = [];
        Object.entries(normalized.dailyCompletedByDate || {}).forEach(([dateKey, completedTasks]) => {
            window.EmptyBoxState.normalizeTaskList(completedTasks).forEach(text => {
                const task = taskByText.get(text);
                if (!task) return;
                dailyCompletions.push({
                    id: createId('daily-completion'),
                    space_id: space.id,
                    task_id: task.id,
                    date_key: dateKey,
                    completed_at: `${dateKey}T00:00:00.000Z`
                });
            });
        });

        const completions = window.EmptyBoxState.normalizeTaskList(normalized.completedTasks, false).map(record => ({
            id: createId('completion'),
            space_id: space.id,
            task_id: null,
            task_text_snapshot: String(record || '').replace(/【.*】$/, ''),
            tags: (String(record || '').match(/【(.+)】$/)?.[1] || '').split('·').map(item => item.trim()).filter(Boolean),
            completed_at: now
        }));

        const reflections = normalized.reflectionNote ? [{
            id: createId('reflection'),
            space_id: space.id,
            date_key: getTodayKey(),
            content: normalized.reflectionNote,
            created_at: now,
            updated_at: now
        }] : [];

        const currentTask = normalized.nowTask ? taskByText.get(normalized.nowTask) : null;
        const activeGroupId = oldToNewGroupId.get(normalized.activeMustDoCriterionId) || inboxGroupId;
        const pinnedGroupId = oldToNewGroupId.get(normalized.pinnedMustDoCriterionId) || null;
        const nextSpace = normalizeSpace({
            ...space,
            active_group_id: activeGroupId,
            pinned_group_id: pinnedGroupId,
            current_task_id: currentTask?.id || null,
            current_task_started_at: currentTask ? new Date(normalized.nowTaskStartedAt || Date.now()).toISOString() : null,
            blindbox_reject_count: normalized.blindboxRejectCount,
            blindbox_cooldown_until: normalized.blindboxCooldownUntil ? new Date(normalized.blindboxCooldownUntil).toISOString() : null,
            updated_at: now
        });

        return { space: nextSpace, groups, tasks, dailyCompletions, completions, reflections };
    }

    function v2RecordsToState(records) {
        const space = records.space || {};
        const groups = [...(records.groups || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
        const tasks = [...(records.tasks || [])]
            .filter(task => task.status !== 'completed')
            .sort((a, b) => (a.group_position || 0) - (b.group_position || 0));
        const taskById = new Map(tasks.map(task => [task.id, task]));
        const inboxGroup = groups.find(group => group.kind === 'inbox' || group.is_default) || groups[0] || null;
        const customGroups = groups.filter(group => group.id !== inboxGroup?.id);
        const groupById = new Map(groups.map(group => [group.id, group]));
        const mustDoTaskGroups = {};
        const mustDoTaskOrder = {};
        if (inboxGroup) mustDoTaskOrder[window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id] = [];

        tasks.forEach(task => {
            const group = groupById.get(task.group_id);
            const groupKey = group && group.id !== inboxGroup?.id ? group.id : window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id;
            if (groupKey !== window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id) mustDoTaskGroups[task.text] = groupKey;
            if (!mustDoTaskOrder[groupKey]) mustDoTaskOrder[groupKey] = [];
            mustDoTaskOrder[groupKey].push(task.text);
        });

        const dailyCompletedByDate = {};
        (records.dailyCompletions || []).forEach(completion => {
            const task = taskById.get(completion.task_id);
            if (!task) return;
            if (!dailyCompletedByDate[completion.date_key]) dailyCompletedByDate[completion.date_key] = [];
            dailyCompletedByDate[completion.date_key].push(task.text);
        });

        const currentTask = taskById.get(space.current_task_id);
        const activeGroupId = space.active_group_id && space.active_group_id !== inboxGroup?.id
            ? space.active_group_id
            : window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id;
        const pinnedGroupId = space.pinned_group_id && space.pinned_group_id !== inboxGroup?.id ? space.pinned_group_id : '';

        return normalizeState({
            boxTasks: tasks.map(task => task.text),
            completedTasks: [...(records.completions || [])]
                .sort((a, b) => String(b.completed_at || '').localeCompare(String(a.completed_at || '')))
                .map(toCompletionRecord),
            nowTask: currentTask?.text || '',
            nowTaskStartedAt: space.current_task_started_at ? new Date(space.current_task_started_at).getTime() : 0,
            reflectionNote: [...(records.reflections || [])]
                .sort((a, b) => String(b.date_key || '').localeCompare(String(a.date_key || '')))
                .map(reflection => reflection.content)
                .filter(Boolean)
                .join('\n\n'),
            blindboxRejectCount: Number(space.blindbox_reject_count || 0),
            blindboxCooldownUntil: space.blindbox_cooldown_until ? new Date(space.blindbox_cooldown_until).getTime() : 0,
            mustDoTasks: tasks.filter(task => task.is_starred).sort((a, b) => (a.star_position ?? 0) - (b.star_position ?? 0)).map(task => task.text),
            dailyTasks: tasks.filter(task => task.is_daily).sort((a, b) => (a.daily_position ?? 0) - (b.daily_position ?? 0)).map(task => task.text),
            dailyCompletedByDate,
            mustDoCriteria: customGroups.map(group => ({ id: group.id, name: group.name })),
            activeMustDoCriterionId: activeGroupId,
            pinnedMustDoCriterionId: pinnedGroupId,
            mustDoTaskGroups,
            mustDoTaskOrder
        });
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

    async function getCloudRecordsRaw(spaceId) {
        const [spaces, groups, tasks, dailyCompletions, completions, reflections] = await Promise.all([
            supabaseRequest(`empty_box_spaces?id=eq.${encodeURIComponent(spaceId)}&limit=1`),
            supabaseRequest(`empty_box_groups?space_id=eq.${encodeURIComponent(spaceId)}&order=position.asc`),
            supabaseRequest(`empty_box_tasks?space_id=eq.${encodeURIComponent(spaceId)}&order=group_position.asc`),
            supabaseRequest(`empty_box_daily_completions?space_id=eq.${encodeURIComponent(spaceId)}&order=date_key.desc`),
            supabaseRequest(`empty_box_task_completions?space_id=eq.${encodeURIComponent(spaceId)}&order=completed_at.desc`),
            supabaseRequest(`empty_box_reflections?space_id=eq.${encodeURIComponent(spaceId)}&order=date_key.desc`)
        ]);
        return {
            space: Array.isArray(spaces) ? spaces[0] || null : null,
            groups: Array.isArray(groups) ? groups : [],
            tasks: Array.isArray(tasks) ? tasks : [],
            dailyCompletions: Array.isArray(dailyCompletions) ? dailyCompletions : [],
            completions: Array.isArray(completions) ? completions : [],
            reflections: Array.isArray(reflections) ? reflections : []
        };
    }

    function saveCloudBackup(spaceId, records) {
        if (!hasCloudRecords(records)) return;
        writeJson(cloudBackupKey(spaceId), {
            backed_up_at: new Date().toISOString(),
            records
        });
    }

    function sameCloudValue(left, right) {
        if (left == null && right == null) return true;
        if (Array.isArray(left) || Array.isArray(right)) {
            return JSON.stringify(left || []) === JSON.stringify(right || []);
        }
        return left === right;
    }

    function changedFields(existing, nextRow, fields) {
        if (!existing) return fields;
        return fields.filter(field => !sameCloudValue(existing[field], nextRow[field]));
    }

    function splitRowChanges(nextRows, existingById, compareFields, patchFields = compareFields) {
        const inserts = [];
        const patches = [];
        nextRows.forEach(row => {
            const existing = existingById.get(row.id);
            if (!existing) {
                inserts.push(row);
                return;
            }
            if (!changedFields(existing, row, compareFields).length) return;
            const body = {};
            patchFields.forEach(field => {
                if (field in row) body[field] = row[field];
            });
            patches.push({ id: row.id, body });
        });
        return { inserts, patches };
    }

    async function insertRows(table, rows) {
        if (!rows.length) return;
        await supabaseRequest(table, {
            method: 'POST',
            body: JSON.stringify(rows)
        });
    }

    async function patchRows(table, patches) {
        for (const patch of patches) {
            await supabaseRequest(`${table}?id=eq.${encodeURIComponent(patch.id)}`, {
                method: 'PATCH',
                body: JSON.stringify(patch.body)
            });
        }
    }

    async function deleteRows(table, ids) {
        const cleanIds = [...new Set(ids.filter(Boolean))];
        if (!cleanIds.length) return;
        await supabaseRequest(`${table}?id=in.(${cleanIds.map(id => encodeURIComponent(id)).join(',')})`, {
            method: 'DELETE'
        });
    }

    function isInboxGroup(group) {
        return group?.kind === 'inbox' || group?.is_default === true;
    }

    function reconcileGroups(desiredGroups, existingGroups) {
        const existingById = new Map(existingGroups.map(group => [group.id, group]));
        const existingInbox = existingGroups.find(isInboxGroup);
        const customByName = new Map();
        existingGroups
            .filter(group => !isInboxGroup(group))
            .forEach(group => {
                if (!customByName.has(group.name)) customByName.set(group.name, group);
            });

        const groupIdByDesiredId = new Map();
        const rows = desiredGroups.map(group => {
            const existing = isInboxGroup(group)
                ? existingInbox
                : existingById.get(group.id) || customByName.get(group.name);
            const id = existing?.id || group.id || createId('group');
            groupIdByDesiredId.set(group.id, id);
            return {
                ...group,
                id,
                created_at: existing?.created_at || group.created_at
            };
        });
        const desiredIds = new Set(rows.map(group => group.id));
        return {
            rows,
            groupIdByDesiredId,
            deleteIds: existingGroups.filter(group => !desiredIds.has(group.id)).map(group => group.id)
        };
    }

    function reconcileTasks(desiredTasks, existingTasks, groupIdByDesiredId) {
        const activeExisting = existingTasks.filter(task => task.status !== 'completed');
        const activeByText = new Map();
        activeExisting.forEach(task => {
            if (!activeByText.has(task.text)) activeByText.set(task.text, task);
        });

        const usedTexts = new Set();
        const taskIdByText = new Map();
        const rows = desiredTasks.map(task => {
            const existing = activeByText.get(task.text);
            usedTexts.add(task.text);
            const id = existing?.id || task.id || createId('task');
            taskIdByText.set(task.text, id);
            return {
                ...task,
                id,
                group_id: groupIdByDesiredId.get(task.group_id) || task.group_id,
                created_at: existing?.created_at || task.created_at
            };
        });

        return {
            rows,
            taskIdByText,
            deleteIds: activeExisting.filter(task => !usedTexts.has(task.text)).map(task => task.id)
        };
    }

    function reconcileDailyCompletions(desiredRows, existingRows, taskIdByText, desiredTasks) {
        const taskTextByDesiredId = new Map(desiredTasks.map(task => [task.id, task.text]));
        const existingByKey = new Map(existingRows.map(row => [`${row.date_key}::${row.task_id}`, row]));
        const rows = desiredRows.map(row => {
            const text = taskTextByDesiredId.get(row.task_id);
            const taskId = taskIdByText.get(text) || row.task_id;
            const existing = existingByKey.get(`${row.date_key}::${taskId}`);
            return {
                ...row,
                id: existing?.id || row.id || createId('daily-completion'),
                task_id: taskId,
                completed_at: existing?.completed_at || row.completed_at
            };
        });
        const desiredIds = new Set(rows.map(row => row.id));
        return {
            rows,
            deleteIds: existingRows.filter(row => !desiredIds.has(row.id)).map(row => row.id)
        };
    }

    function completionKey(row) {
        const tags = Array.isArray(row.tags) ? row.tags.join('\u0001') : '';
        return `${row.task_text_snapshot || ''}\u0002${tags}`;
    }

    function reconcileCompletions(desiredRows, existingRows) {
        const existingByKey = new Map();
        existingRows.forEach(row => {
            const key = completionKey(row);
            if (!existingByKey.has(key)) existingByKey.set(key, []);
            existingByKey.get(key).push(row);
        });
        const rows = desiredRows.map(row => {
            const queue = existingByKey.get(completionKey(row)) || [];
            const existing = queue.shift() || null;
            return {
                ...row,
                id: existing?.id || row.id || createId('completion'),
                completed_at: existing?.completed_at || row.completed_at
            };
        });
        const desiredIds = new Set(rows.map(row => row.id));
        return {
            rows,
            deleteIds: existingRows.filter(row => !desiredIds.has(row.id)).map(row => row.id)
        };
    }

    function reconcileReflections(desiredRows, existingRows) {
        const existingByDate = new Map(existingRows.map(row => [row.date_key, row]));
        const rows = desiredRows.map(row => {
            const existing = existingByDate.get(row.date_key);
            return {
                ...row,
                id: existing?.id || row.id || createId('reflection'),
                created_at: existing?.created_at || row.created_at
            };
        });
        const desiredIds = new Set(rows.map(row => row.id));
        return {
            rows,
            deleteIds: existingRows.filter(row => !desiredIds.has(row.id)).map(row => row.id)
        };
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
            const legacySpaces = readJson(SPACE_LIST_KEY, []);
            const v2Spaces = readJson(V2_SPACE_LIST_KEY, []);
            const byId = new Map();
            (Array.isArray(legacySpaces) ? legacySpaces : []).forEach(space => {
                if (space?.id) byId.set(space.id, normalizeSpace(space));
            });
            (Array.isArray(v2Spaces) ? v2Spaces : []).forEach(space => {
                if (space?.id) byId.set(space.id, normalizeSpace(space));
            });
            return [...byId.values()];
        },
    
        saveSpaces(spaces) {
            const normalized = (Array.isArray(spaces) ? spaces : []).map(normalizeSpace);
            writeJson(SPACE_LIST_KEY, normalized);
            writeJson(V2_SPACE_LIST_KEY, normalized);
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
            const rows = await supabaseRequest('empty_box_spaces?select=*&deleted_at=is.null&order=created_at.asc');
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
                await supabaseRequest('empty_box_spaces', {
                    method: 'POST',
                    body: JSON.stringify(normalizeSpace(space))
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
                await supabaseRequest(`empty_box_spaces?id=eq.${encodeURIComponent(space.id)}`, {
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
            return this.getLocalV2State(space);
        },
    
        async saveStateToSpace(nextState, space) {
            if (!space) return;
            const normalized = normalizeState(nextState);
            if (space.storage_mode === 'cloud_sync') {
                await this.saveCloudState(normalized, space);
            } else {
                this.saveLocalV2State(normalized, space);
            }
            localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
        },
    
        async clearSpaceState(space) {
            if (!space) return;
            if (space.storage_mode === 'cloud_sync') {
                await this.clearCloudV2State(space.id);
            } else {
                localStorage.removeItem(spaceStateKey(space.id));
                ['groups', 'tasks', 'daily_completions', 'task_completions', 'reflections'].forEach(collection => {
                    localStorage.removeItem(v2SpaceCollectionKey(space.id, collection));
                });
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
            return this.getLocalV2State(space);
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
                this.saveLocalV2State(normalized, space);
            }
            localStorage.setItem(UPDATE_PING_KEY, String(Date.now()));
        },
    
        async getCloudState(space) {
            const [groups, tasks, dailyCompletions, completions, reflections] = await Promise.all([
                supabaseRequest(`empty_box_groups?space_id=eq.${encodeURIComponent(space.id)}&order=position.asc`),
                supabaseRequest(`empty_box_tasks?space_id=eq.${encodeURIComponent(space.id)}&order=group_position.asc`),
                supabaseRequest(`empty_box_daily_completions?space_id=eq.${encodeURIComponent(space.id)}&order=date_key.desc`),
                supabaseRequest(`empty_box_task_completions?space_id=eq.${encodeURIComponent(space.id)}&order=completed_at.desc`),
                supabaseRequest(`empty_box_reflections?space_id=eq.${encodeURIComponent(space.id)}&order=date_key.desc`)
            ]);
            return v2RecordsToState({ space, groups, tasks, dailyCompletions, completions, reflections });
        },
    
        async saveCloudState(nextState, space) {
            const normalized = normalizeState(nextState);
            const records = stateToV2Records(nextState, space);
            const existingRecords = await getCloudRecordsRaw(space.id);
            const existingHasContent = hasCloudRecords(existingRecords);
            saveCloudBackup(space.id, existingRecords);
            if (existingHasContent && !records.tasks.length && !records.completions.length && !records.dailyCompletions.length && !records.reflections.length && !records.space.current_task_id) {
                throw new Error('Refused to overwrite non-empty cloud data with an empty local state. Export/import or delete the Space explicitly if this was intentional.');
            }

            const groups = reconcileGroups(records.groups, existingRecords.groups);
            const tasks = reconcileTasks(records.tasks, existingRecords.tasks, groups.groupIdByDesiredId);
            const dailyCompletions = reconcileDailyCompletions(records.dailyCompletions, existingRecords.dailyCompletions, tasks.taskIdByText, records.tasks);
            const completions = reconcileCompletions(records.completions, existingRecords.completions);
            const reflections = reconcileReflections(records.reflections, existingRecords.reflections);

            const existingGroupsById = new Map(existingRecords.groups.map(row => [row.id, row]));
            const existingTasksById = new Map(existingRecords.tasks.map(row => [row.id, row]));
            const existingDailyById = new Map(existingRecords.dailyCompletions.map(row => [row.id, row]));
            const existingCompletionsById = new Map(existingRecords.completions.map(row => [row.id, row]));
            const existingReflectionsById = new Map(existingRecords.reflections.map(row => [row.id, row]));

            const groupChanges = splitRowChanges(
                groups.rows,
                existingGroupsById,
                ['space_id', 'name', 'kind', 'position', 'is_default'],
                ['space_id', 'name', 'kind', 'position', 'is_default', 'updated_at']
            );
            const taskChanges = splitRowChanges(
                tasks.rows,
                existingTasksById,
                ['space_id', 'group_id', 'text', 'status', 'group_position', 'is_starred', 'star_position', 'is_daily', 'daily_position', 'completed_at'],
                ['space_id', 'group_id', 'text', 'status', 'group_position', 'is_starred', 'star_position', 'is_daily', 'daily_position', 'completed_at', 'updated_at']
            );
            const dailyChanges = splitRowChanges(
                dailyCompletions.rows,
                existingDailyById,
                ['space_id', 'task_id', 'date_key', 'completed_at']
            );
            const completionChanges = splitRowChanges(
                completions.rows,
                existingCompletionsById,
                ['space_id', 'task_id', 'task_text_snapshot', 'tags', 'completed_at']
            );
            const reflectionChanges = splitRowChanges(
                reflections.rows,
                existingReflectionsById,
                ['space_id', 'date_key', 'content'],
                ['space_id', 'date_key', 'content', 'updated_at']
            );

            await insertRows('empty_box_groups', groupChanges.inserts);
            await patchRows('empty_box_groups', groupChanges.patches);
            await insertRows('empty_box_tasks', taskChanges.inserts);
            await patchRows('empty_box_tasks', taskChanges.patches);
            await insertRows('empty_box_daily_completions', dailyChanges.inserts);
            await patchRows('empty_box_daily_completions', dailyChanges.patches);
            await insertRows('empty_box_task_completions', completionChanges.inserts);
            await patchRows('empty_box_task_completions', completionChanges.patches);
            await insertRows('empty_box_reflections', reflectionChanges.inserts);
            await patchRows('empty_box_reflections', reflectionChanges.patches);

            await deleteRows('empty_box_daily_completions', dailyCompletions.deleteIds);
            await deleteRows('empty_box_task_completions', completions.deleteIds);
            await deleteRows('empty_box_reflections', reflections.deleteIds);
            await deleteRows('empty_box_tasks', tasks.deleteIds);
            await deleteRows('empty_box_groups', groups.deleteIds);

            await supabaseRequest(`empty_box_spaces?id=eq.${encodeURIComponent(space.id)}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    active_group_id: groups.groupIdByDesiredId.get(records.space.active_group_id) || records.space.active_group_id,
                    pinned_group_id: records.space.pinned_group_id ? groups.groupIdByDesiredId.get(records.space.pinned_group_id) || records.space.pinned_group_id : null,
                    current_task_id: normalized.nowTask ? tasks.taskIdByText.get(normalized.nowTask) || null : null,
                    current_task_started_at: records.space.current_task_started_at,
                    blindbox_reject_count: records.space.blindbox_reject_count,
                    blindbox_cooldown_until: records.space.blindbox_cooldown_until,
                    updated_at: records.space.updated_at
                })
            });
        },

        getLocalV2State(space) {
            const groups = readJson(v2SpaceCollectionKey(space.id, 'groups'), null);
            const tasks = readJson(v2SpaceCollectionKey(space.id, 'tasks'), null);
            if (!Array.isArray(groups) || !Array.isArray(tasks)) {
                return normalizeState(readJson(spaceStateKey(space.id), {}));
            }
            return v2RecordsToState({
                space,
                groups,
                tasks,
                dailyCompletions: readJson(v2SpaceCollectionKey(space.id, 'daily_completions'), []),
                completions: readJson(v2SpaceCollectionKey(space.id, 'task_completions'), []),
                reflections: readJson(v2SpaceCollectionKey(space.id, 'reflections'), [])
            });
        },

        saveLocalV2State(nextState, space) {
            const records = stateToV2Records(nextState, space);
            writeJson(v2SpaceCollectionKey(space.id, 'groups'), records.groups);
            writeJson(v2SpaceCollectionKey(space.id, 'tasks'), records.tasks);
            writeJson(v2SpaceCollectionKey(space.id, 'daily_completions'), records.dailyCompletions);
            writeJson(v2SpaceCollectionKey(space.id, 'task_completions'), records.completions);
            writeJson(v2SpaceCollectionKey(space.id, 'reflections'), records.reflections);
            const spaces = this.getSpaces().map(item => item.id === space.id ? records.space : item);
            this.saveSpaces(spaces);
            return records;
        },

        async clearCloudV2State(spaceId) {
            await supabaseRequest(`empty_box_spaces?id=eq.${encodeURIComponent(spaceId)}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    active_group_id: null,
                    pinned_group_id: null,
                    current_task_id: null
                })
            });
            await supabaseRequest(`empty_box_daily_completions?space_id=eq.${encodeURIComponent(spaceId)}`, { method: 'DELETE' });
            await supabaseRequest(`empty_box_task_completions?space_id=eq.${encodeURIComponent(spaceId)}`, { method: 'DELETE' });
            await supabaseRequest(`empty_box_reflections?space_id=eq.${encodeURIComponent(spaceId)}`, { method: 'DELETE' });
            await supabaseRequest(`empty_box_tasks?space_id=eq.${encodeURIComponent(spaceId)}`, { method: 'DELETE' });
            await supabaseRequest(`empty_box_groups?space_id=eq.${encodeURIComponent(spaceId)}`, { method: 'DELETE' });
            const remainingGroups = await supabaseRequest(`empty_box_groups?space_id=eq.${encodeURIComponent(spaceId)}&select=id,name&limit=1`);
            if (Array.isArray(remainingGroups) && remainingGroups.length) {
                throw new Error('云端 Tab 清空未生效：请检查 empty_box_groups 的 DELETE policy 或外键约束。');
            }
        },
    
        async assertCloudSpaceDeleted(spaceId) {
            const [remainingTasks, remainingGroups, remainingSpaces] = await Promise.all([
                supabaseRequest(`empty_box_tasks?space_id=eq.${encodeURIComponent(spaceId)}&select=id&limit=1`),
                supabaseRequest(`empty_box_groups?space_id=eq.${encodeURIComponent(spaceId)}&select=id&limit=1`),
                supabaseRequest(`empty_box_spaces?id=eq.${encodeURIComponent(spaceId)}&select=id&limit=1`)
            ]);
            if ((Array.isArray(remainingTasks) && remainingTasks.length) ||
                (Array.isArray(remainingGroups) && remainingGroups.length) ||
                (Array.isArray(remainingSpaces) && remainingSpaces.length)) {
                throw new Error('云端删除未生效：请检查 Supabase empty_box_* 表的 DELETE policy 或外键约束。');
            }
        },
    
        async deleteSpace(spaceId) {
            const space = this.getSpaceById(spaceId);
            if (!space) return null;
    
            if (space.storage_mode === 'cloud_sync') {
                await this.clearCloudV2State(space.id);
                await supabaseRequest(`empty_box_spaces?id=eq.${encodeURIComponent(space.id)}`, {
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
    
        async transferSpaceContent(sourceSpaceId, targetSpaceId) {
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
            if (payload && payload.format === 'empty-box-v2-local-import' && payload.entries) {
                Object.entries(payload.entries).forEach(([key, value]) => {
                    writeJson(key, value);
                });
                const importedSpaces = Array.isArray(payload.entries[V2_SPACE_LIST_KEY])
                    ? payload.entries[V2_SPACE_LIST_KEY].map(space => normalizeSpace({
                        ...space,
                        storage_mode: 'local_only'
                    }))
                    : [];
                if (importedSpaces.length) {
                    this.saveSpaces(importedSpaces);
                    await this.setCurrentSpace(importedSpaces[0].id);
                    const nextState = await this.getCurrentState();
                    setAppState(nextState);
                    return nextState;
                }
                return getAppState();
            }
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
        const mergedGroups = mergeTransferGroups(base, incoming);
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
            mustDoCriteria: mergedGroups.mustDoCriteria,
            activeMustDoCriterionId: base.activeMustDoCriterionId,
            mustDoHiddenByDate: base.mustDoHiddenByDate,
            mustDoTaskGroups: mergedGroups.mustDoTaskGroups,
            mustDoTaskOrder: mergedGroups.mustDoTaskOrder
        });
    }

    function mergeTransferGroups(base, incoming) {
        const inboxId = window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id;
        const sourceToTargetGroupId = new Map([[inboxId, inboxId]]);
        const usedNames = new Set(['Inbox', ...base.mustDoCriteria.map(criterion => criterion.name)]);
        const usedIds = new Set([inboxId, ...base.mustDoCriteria.map(criterion => criterion.id)]);
        const targetIdByName = new Map(base.mustDoCriteria.map(criterion => [criterion.name, criterion.id]));
        const mustDoCriteria = base.mustDoCriteria.map(criterion => ({ ...criterion }));

        incoming.mustDoCriteria.forEach(criterion => {
            const existingId = targetIdByName.get(criterion.name);
            if (existingId) {
                sourceToTargetGroupId.set(criterion.id, existingId);
                return;
            }

            const nextId = criterion.id && !usedIds.has(criterion.id) ? criterion.id : createId('criterion');
            const nextName = createUniqueGroupName(criterion.name, usedNames);
            usedIds.add(nextId);
            targetIdByName.set(nextName, nextId);
            sourceToTargetGroupId.set(criterion.id, nextId);
            mustDoCriteria.push({ id: nextId, name: nextName });
        });

        const baseTaskSet = new Set(window.EmptyBoxState.getStateTaskPool(base));
        const incomingTaskSet = new Set(window.EmptyBoxState.getStateTaskPool(incoming));
        const mustDoTaskGroups = { ...base.mustDoTaskGroups };
        const mustDoTaskOrder = {};

        Object.entries(base.mustDoTaskOrder || {}).forEach(([groupId, tasks]) => {
            mustDoTaskOrder[groupId] = window.EmptyBoxState.normalizeTaskList(tasks);
        });

        Object.entries(incoming.mustDoTaskOrder || {}).forEach(([sourceGroupId, tasks]) => {
            const targetGroupId = sourceToTargetGroupId.get(sourceGroupId) || inboxId;
            if (!mustDoTaskOrder[targetGroupId]) mustDoTaskOrder[targetGroupId] = [];
            window.EmptyBoxState.normalizeTaskList(tasks).forEach(task => {
                if (!incomingTaskSet.has(task) || baseTaskSet.has(task)) return;
                mustDoTaskGroups[task] = targetGroupId;
                if (!mustDoTaskOrder[targetGroupId].includes(task)) {
                    mustDoTaskOrder[targetGroupId].push(task);
                }
            });
        });

        incomingTaskSet.forEach(task => {
            if (baseTaskSet.has(task) || mustDoTaskGroups[task]) return;
            const sourceGroupId = incoming.mustDoTaskGroups[task] || inboxId;
            const targetGroupId = sourceToTargetGroupId.get(sourceGroupId) || inboxId;
            mustDoTaskGroups[task] = targetGroupId;
            if (!mustDoTaskOrder[targetGroupId]) mustDoTaskOrder[targetGroupId] = [];
            if (!mustDoTaskOrder[targetGroupId].includes(task)) {
                mustDoTaskOrder[targetGroupId].push(task);
            }
        });

        Object.keys(mustDoTaskGroups).forEach(task => {
            if (mustDoTaskGroups[task] === inboxId) {
                delete mustDoTaskGroups[task];
            }
        });

        return { mustDoCriteria, mustDoTaskGroups, mustDoTaskOrder };
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
