(function () {
    const LEGACY_NODES_KEY = 'mindMapNodes';
    const LEGACY_PAN_KEY = 'mindMapPan';
    const STORAGE_KEY = 'mind-jump-state-v1';
    const SPACE_LIST_KEY = 'mind-jump-spaces-v1';
    const CURRENT_SPACE_ID_KEY = 'mind_jump_current_space_id';
    const CURRENT_STORAGE_MODE_KEY = 'mind_jump_current_storage_mode';
    const SUPABASE_URL = 'https://ufwvkabshfrrodmtycjj.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd3ZrYWJzaGZycm9kbXR5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjg4NjMsImV4cCI6MjA5NDc0NDg2M30.kSQJBTLSjd5XhLX0cddqjUfSw0QXt-Ilr2UsGPMamIo';

    const viewport = document.getElementById('viewport');
    const content = document.getElementById('content');
    const currentSpaceName = document.getElementById('currentSpaceName');
    const addBtn = document.getElementById('addBtn');
    const clearBtn = document.getElementById('clearBtn');
    const settingsBtn = document.getElementById('settingsBtn');
    const nodeOverlay = document.getElementById('nodeOverlay');
    const input = document.getElementById('nodeInput');
    const confirmNodeBtn = document.getElementById('confirmNodeBtn');
    const cancelNodeBtn = document.getElementById('cancelNodeBtn');
    const settingsOverlay = document.getElementById('settingsOverlay');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const spaceSelect = document.getElementById('spaceSelect');
    const spaceStatus = document.getElementById('spaceStatus');
    const newLocalSpaceBtn = document.getElementById('newLocalSpaceBtn');
    const newCloudSpaceBtn = document.getElementById('newCloudSpaceBtn');
    const renameSpaceBtn = document.getElementById('renameSpaceBtn');
    const refreshCloudSpacesBtn = document.getElementById('refreshCloudSpacesBtn');
    const deleteSpaceBtn = document.getElementById('deleteSpaceBtn');
    const migrationSourceSelect = document.getElementById('migrationSourceSelect');
    const migrationTargetSelect = document.getElementById('migrationTargetSelect');
    const migrateSpaceBtn = document.getElementById('migrateSpaceBtn');
    const spaceNameOverlay = document.getElementById('spaceNameOverlay');
    const spaceNameTitle = document.getElementById('spaceNameTitle');
    const spaceNameInput = document.getElementById('spaceNameInput');
    const spaceNameMessage = document.getElementById('spaceNameMessage');
    const spaceNameSaveBtn = document.getElementById('spaceNameSaveBtn');
    const spaceNameCancelBtn = document.getElementById('spaceNameCancelBtn');

    let state = createEmptyState();
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let activeLegacyMode = false;
    let pendingSpaceMode = 'local_only';
    let pendingRenameSpaceId = null;
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

    function createEmptyState() {
        return { nodes: [], pan: { x: 0, y: 0 } };
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
        if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
        return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    }

    function normalizePan(input) {
        const x = Number(input && input.x);
        const y = Number(input && input.y);
        return {
            x: Number.isFinite(x) ? x : 0,
            y: Number.isFinite(y) ? y : 0,
        };
    }

    function normalizeState(input) {
        if (!input || typeof input !== 'object') return createEmptyState();
        const nodes = Array.isArray(input.nodes)
            ? input.nodes.map(node => ({
                text: String(node && node.text ? node.text : '').trim(),
                top: typeof (node && node.top) === 'string' ? node.top : `${parseInt(node && node.top, 10) || 0}px`,
                inactive: !!(node && node.inactive),
            })).filter(node => node.text)
            : [];
        return { nodes, pan: normalizePan(input.pan) };
    }

    function readLegacyState() {
        return normalizeState({
            nodes: readJson(LEGACY_NODES_KEY, []),
            pan: readJson(LEGACY_PAN_KEY, { x: 0, y: 0 }),
        });
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

    const MindJumpStorage = {
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
            const rows = await supabaseRequest('mind_jump_spaces?select=id,owner_id,name,storage_mode,created_at&order=created_at.asc');
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

        async createSpace({ name, storage_mode = 'local_only', initialState = createEmptyState() }) {
            const now = new Date().toISOString();
            const space = {
                id: createId('mind-space'),
                owner_id: null,
                name: name || (storage_mode === 'cloud_sync' ? 'Cloud Mind' : 'Local Mind'),
                storage_mode,
                created_at: now,
            };

            if (storage_mode === 'cloud_sync') {
                await supabaseRequest('mind_jump_spaces', {
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
                const rows = await supabaseRequest(`mind_jump_spaces?id=eq.${encodeURIComponent(space.id)}&select=id,name`, {
                    method: 'PATCH',
                    headers: { Prefer: 'return=representation' },
                    body: JSON.stringify({ name: nextName }),
                });
                if (!Array.isArray(rows) || !rows.some(row => row.id === space.id && row.name === nextName)) {
                    throw new Error('Remote rename was not applied. Check Supabase UPDATE policy for mind_jump_spaces.');
                }
            }

            this.saveSpaces(this.getSpaces().map(item => item.id === space.id ? updated : item));
            return updated;
        },

        async deleteCurrentSpace() {
            const space = this.getCurrentSpace();
            if (!space) return null;

            if (space.storage_mode === 'cloud_sync') {
                await supabaseRequest(`mind_jump_states?space_id=eq.${encodeURIComponent(space.id)}`, {
                    method: 'DELETE',
                    headers: { Prefer: 'return=representation' },
                });
                const deletedSpaces = await supabaseRequest(`mind_jump_spaces?id=eq.${encodeURIComponent(space.id)}&select=id`, {
                    method: 'DELETE',
                    headers: { Prefer: 'return=representation' },
                });
                if (!Array.isArray(deletedSpaces) || !deletedSpaces.length) {
                    const stillExists = await supabaseRequest(`mind_jump_spaces?id=eq.${encodeURIComponent(space.id)}&select=id`);
                    if (Array.isArray(stillExists) && stillExists.length) {
                        throw new Error('Remote space was not deleted. Check Supabase DELETE policy for mind_jump_spaces.');
                    }
                }
            } else {
                localStorage.removeItem(spaceStateKey(space.id));
            }

            this.saveSpaces(this.getSpaces().filter(item => item.id !== space.id));
            localStorage.removeItem(CURRENT_SPACE_ID_KEY);
            localStorage.removeItem(CURRENT_STORAGE_MODE_KEY);
            this.ensureValidCurrentSpace();
            return space;
        },

        async getSpaceState(spaceId) {
            const space = this.getSpaces().find(item => item.id === spaceId);
            if (!space) throw new Error('Source or target space was not found.');
            if (space.storage_mode === 'cloud_sync') return this.getCloudState(space);
            return normalizeState(readJson(spaceStateKey(space.id), createEmptyState()));
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
                return readLegacyState();
            }
            activeLegacyMode = false;
            if (space.storage_mode === 'cloud_sync') return this.getCloudState(space);
            return normalizeState(readJson(spaceStateKey(space.id), createEmptyState()));
        },

        async getCloudState(space) {
            const rows = await supabaseRequest(`mind_jump_states?space_id=eq.${encodeURIComponent(space.id)}&select=content,updated_at`);
            const snapshot = Array.isArray(rows) ? rows[0] : null;
            return snapshot && snapshot.content ? normalizeState(snapshot.content) : createEmptyState();
        },

        async saveCloudState(nextState, space) {
            const normalized = normalizeState(nextState);
            const now = new Date().toISOString();
            const existing = await supabaseRequest(`mind_jump_states?space_id=eq.${encodeURIComponent(space.id)}&select=space_id`);
            if (Array.isArray(existing) && existing.length) {
                await supabaseRequest(`mind_jump_states?space_id=eq.${encodeURIComponent(space.id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify({ content: normalized, updated_at: now }),
                });
                return;
            }
            await supabaseRequest('mind_jump_states', {
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
                writeJson(LEGACY_NODES_KEY, normalized.nodes);
                writeJson(LEGACY_PAN_KEY, normalized.pan);
                return;
            }
            if (space.storage_mode === 'cloud_sync') {
                this.saveCloudState(normalized, space).catch(error => {
                    console.error('Mind Jump cloud sync failed:', error);
                    if (spaceStatus) spaceStatus.textContent = `Cloud sync failed: ${formatErrorMessage(error)}`;
                });
            } else {
                writeJson(spaceStateKey(space.id), normalized);
            }
        },
    };

    function collectStateFromDom() {
        const nodes = Array.from(document.querySelectorAll('.node-container')).map(container => {
            const point = container.querySelector('.point');
            const label = container.querySelector('.label');
            return {
                text: label.textContent,
                top: point.style.top,
                inactive: container.classList.contains('is-inactive'),
            };
        });
        return normalizeState({ nodes, pan: { x: panX, y: panY } });
    }

    function saveData() {
        state = collectStateFromDom();
        MindJumpStorage.saveState(state);
    }

    function applyPan() {
        content.style.transform = `translate(${panX}px, ${panY}px)`;
    }

    function renderState(nextState) {
        state = normalizeState(nextState);
        panX = state.pan.x;
        panY = state.pan.y;
        content.innerHTML = '';
        state.nodes.forEach(data => createNode(data.text, data.top, false, data.inactive));
        applyPan();
        renderCurrentSpaceName();
    }

    function showModal() {
        nodeOverlay.classList.add('open');
        input.focus();
    }

    function closeModal() {
        nodeOverlay.classList.remove('open');
        input.value = '';
    }

    function updateShortcutHints() {
        addBtn.title = isMac ? '⌘ /' : 'Ctrl + /';
    }

    function confirmNode() {
        const text = input.value.trim();
        if (text) {
            createNode(text);
            closeModal();
        }
    }

    function createNode(text, savedTop = null, shouldSave = true, inactive = false) {
        const container = document.createElement('div');
        container.className = 'node-container';
        container.classList.toggle('is-inactive', !!inactive);

        const lastPoint = content.querySelector('.node-container:last-child .point');
        const initialTop = savedTop !== null ? savedTop : (lastPoint ? lastPoint.style.top : '0px');

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'delete-node-btn';
        deleteButton.textContent = '×';
        deleteButton.title = '删除';
        deleteButton.setAttribute('aria-label', `删除 ${text}`);

        const node = document.createElement('div');
        node.className = 'point';
        node.style.top = initialTop;

        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = text;
        label.contentEditable = true;
        label.spellcheck = false;
        label.onblur = saveData;
        label.onkeydown = e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                label.blur();
            }
        };

        node.appendChild(label);
        container.appendChild(deleteButton);
        container.appendChild(node);
        content.appendChild(container);
        attachNodeActions(container, deleteButton);
        makeDraggable(node);
        if (shouldSave) saveData();
    }

    function attachNodeActions(container, deleteButton) {
        deleteButton.addEventListener('mousedown', e => {
            e.stopPropagation();
        });
        deleteButton.addEventListener('click', e => {
            e.stopPropagation();
            container.remove();
            saveData();
        });
        container.addEventListener('dblclick', e => {
            if (e.target === deleteButton) return;
            e.preventDefault();
            container.classList.toggle('is-inactive');
            saveData();
        });
    }

    function makeDraggable(el) {
        let isDragging = false;
        let isReordering = false;
        let startY = 0;
        let startX = 0;
        let startOffsetTop = 0;
        let container = null;

        el.addEventListener('mousedown', e => {
            isDragging = true;
            isReordering = false;
            container = el.closest('.node-container');
            startX = e.clientX;
            startY = e.clientY;
            startOffsetTop = parseInt(el.style.top, 10) || 0;
            e.stopPropagation();
        });

        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            if (isHorizontalReorderGesture(e) || isReordering) {
                isReordering = true;
                if (container) {
                    container.classList.add('is-reordering');
                    container.style.transform = `translateX(${e.clientX - startX}px)`;
                    reorderContainerAt(container, e.clientX);
                }
                return;
            }
            const diffY = e.clientY - startY;
            el.style.top = `${startOffsetTop + diffY}px`;
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                isReordering = false;
                if (container) {
                    container.classList.remove('is-reordering');
                    container.style.transform = '';
                    container = null;
                }
                saveData();
            }
        });
    }

    function isHorizontalReorderGesture(event) {
        return isMac ? event.metaKey : event.ctrlKey;
    }

    function reorderContainerAt(container, clientX) {
        const siblings = Array.from(content.querySelectorAll('.node-container'))
            .filter(item => item !== container);
        const before = siblings.find(item => {
            const rect = item.getBoundingClientRect();
            return clientX < rect.left + rect.width / 2;
        });
        if (before) {
            content.insertBefore(container, before);
        } else {
            content.appendChild(container);
        }
    }

    function clearAll() {
        if (!confirm('确定要清空所有灵感吗？此操作不可撤销。')) return;
        content.innerHTML = '';
        panX = 0;
        panY = 0;
        applyPan();
        saveData();
    }

    function renderCurrentSpaceName(current = MindJumpStorage.getCurrentSpace()) {
        if (!current) {
            currentSpaceName.textContent = activeLegacyMode ? 'Space · Legacy local' : '';
            currentSpaceName.title = '';
            return;
        }
        currentSpaceName.textContent = `Space · ${current.name}`;
        currentSpaceName.title = `${current.name} · ${current.storage_mode === 'cloud_sync' ? 'Cloud' : 'Local'}`;
    }

    function renderSpaceSettings() {
        const spaces = MindJumpStorage.getSpaces();
        const current = MindJumpStorage.getCurrentSpace();
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
        const label = current ? (current.storage_mode === 'cloud_sync' ? 'Cloud sync' : 'Local only') : 'Legacy local';
        renderCurrentSpaceName(current);
        spaceStatus.textContent = `${current ? current.name : 'Current'} · ${label} · Local ${localCount} / Cloud ${cloudCount}`;
        renameSpaceBtn.disabled = !current;
        deleteSpaceBtn.disabled = !current;
        migrateSpaceBtn.disabled = !spaces.length;
    }

    async function refreshCloudSpaces(showStatus = false) {
        try {
            if (showStatus) spaceStatus.textContent = 'Refreshing cloud spaces...';
            await MindJumpStorage.syncCloudSpaces();
            renderSpaceSettings();
        } catch (error) {
            console.error(error);
            if (showStatus) spaceStatus.textContent = `Refresh failed: ${formatErrorMessage(error)}`;
        }
    }

    function openSettings() {
        renderSpaceSettings();
        settingsOverlay.classList.add('open');
        refreshCloudSpaces();
    }

    function closeSettings() {
        settingsOverlay.classList.remove('open');
    }

    function openSpaceNameDialog(storageMode, space = null) {
        pendingSpaceMode = storageMode;
        pendingRenameSpaceId = space ? space.id : null;
        const isRename = storageMode === 'rename';
        spaceNameTitle.textContent = isRename ? 'Rename Space' : storageMode === 'cloud_sync' ? 'New Cloud Mind' : 'New Local Mind';
        spaceNameInput.value = isRename && space ? space.name : '';
        spaceNameMessage.textContent = '';
        spaceNameSaveBtn.textContent = isRename ? 'Save' : 'Create';
        spaceNameOverlay.classList.add('open');
        setTimeout(() => {
            spaceNameInput.focus();
            if (isRename) spaceNameInput.select();
        }, 0);
    }

    function closeSpaceNameDialog() {
        spaceNameOverlay.classList.remove('open');
        spaceNameMessage.textContent = '';
        pendingRenameSpaceId = null;
        spaceNameSaveBtn.textContent = 'Create';
    }

    async function saveNamedSpace() {
        const storageMode = pendingSpaceMode;
        const name = spaceNameInput.value.trim();
        try {
            if (storageMode === 'rename') {
                await MindJumpStorage.renameSpace(pendingRenameSpaceId, name);
                closeSpaceNameDialog();
                renderSpaceSettings();
                renderCurrentSpaceName();
                return;
            }

            await MindJumpStorage.createSpace({
                name: name || (storageMode === 'cloud_sync' ? 'Cloud Mind' : 'Local Mind'),
                storage_mode: storageMode,
                initialState: createEmptyState(),
            });
            renderState(await MindJumpStorage.getCurrentState());
            closeSpaceNameDialog();
            renderSpaceSettings();
        } catch (error) {
            console.error(error);
            spaceNameMessage.textContent = `${storageMode === 'rename' ? 'Rename' : 'Create'} failed: ${formatErrorMessage(error)}`;
        }
    }

    function openRenameSpaceDialog() {
        const current = MindJumpStorage.getCurrentSpace();
        if (!current) {
            spaceStatus.textContent = 'No space selected.';
            return;
        }
        openSpaceNameDialog('rename', current);
    }

    async function switchCurrentSpace(spaceId) {
        await MindJumpStorage.setCurrentSpace(spaceId);
        renderState(await MindJumpStorage.getCurrentState());
        renderSpaceSettings();
        updateShortcutHints();
    }

    async function deleteCurrentSpace() {
        const current = MindJumpStorage.getCurrentSpace();
        if (!current) {
            spaceStatus.textContent = 'No space selected.';
            return;
        }
        if (!confirm(`Delete "${current.name}"?`)) return;
        try {
            await MindJumpStorage.deleteCurrentSpace();
            await refreshCloudSpaces();
            renderState(await MindJumpStorage.getCurrentState());
            renderSpaceSettings();
        } catch (error) {
            console.error(error);
            spaceStatus.textContent = `Delete failed: ${formatErrorMessage(error)}`;
        }
    }

    function mergeMindStates(targetState, incomingState) {
        const target = normalizeState(targetState);
        const incoming = normalizeState(incomingState);
        return normalizeState({
            nodes: [...target.nodes, ...incoming.nodes],
            pan: target.pan,
        });
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
        if (!confirm(`Append nodes from "${sourceLabel}" into "${targetLabel}"? Target data will be kept.`)) return;

        try {
            const sourceState = sourceId === 'legacy' ? readLegacyState() : await MindJumpStorage.getSpaceState(sourceId);
            const targetState = await MindJumpStorage.getSpaceState(targetId);
            const mergedState = mergeMindStates(targetState, sourceState);
            await MindJumpStorage.saveStateToSpace(targetId, mergedState);
            const current = MindJumpStorage.getCurrentSpace();
            if (current && current.id === targetId) renderState(mergedState);
            renderSpaceSettings();
            spaceStatus.textContent = 'Migration complete. Source nodes appended to target.';
        } catch (error) {
            console.error(error);
            spaceStatus.textContent = `Migration failed: ${formatErrorMessage(error)}`;
        }
    }

    viewport.addEventListener('mousedown', e => {
        if (e.target === viewport) {
            isPanning = true;
            viewport.dataset.startX = e.clientX - panX;
            viewport.dataset.startY = e.clientY - panY;
        }
    });

    window.addEventListener('mousemove', e => {
        if (!isPanning) return;
        panX = e.clientX - Number(viewport.dataset.startX);
        panY = e.clientY - Number(viewport.dataset.startY);
        applyPan();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            saveData();
        }
    });

    addBtn.addEventListener('click', showModal);
    clearBtn.addEventListener('click', clearAll);
    confirmNodeBtn.addEventListener('click', confirmNode);
    cancelNodeBtn.addEventListener('click', closeModal);
    settingsBtn.addEventListener('click', openSettings);
    closeSettingsBtn.addEventListener('click', closeSettings);
    spaceSelect.addEventListener('change', () => {
        if (spaceSelect.value) switchCurrentSpace(spaceSelect.value);
    });
    newLocalSpaceBtn.addEventListener('click', () => openSpaceNameDialog('local_only'));
    newCloudSpaceBtn.addEventListener('click', () => openSpaceNameDialog('cloud_sync'));
    renameSpaceBtn.addEventListener('click', openRenameSpaceDialog);
    refreshCloudSpacesBtn.addEventListener('click', () => refreshCloudSpaces(true));
    deleteSpaceBtn.addEventListener('click', deleteCurrentSpace);
    migrateSpaceBtn.addEventListener('click', migrateSpaceData);
    spaceNameSaveBtn.addEventListener('click', saveNamedSpace);
    spaceNameCancelBtn.addEventListener('click', closeSpaceNameDialog);
    spaceNameInput.addEventListener('input', () => {
        spaceNameMessage.textContent = '';
    });
    spaceNameInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveNamedSpace();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            closeSpaceNameDialog();
        }
    });

    [nodeOverlay, settingsOverlay, spaceNameOverlay].forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target !== overlay) return;
            if (overlay === nodeOverlay) closeModal();
            if (overlay === settingsOverlay) closeSettings();
            if (overlay === spaceNameOverlay) closeSpaceNameDialog();
        });
    });

    window.addEventListener('keydown', e => {
        if (spaceNameOverlay.classList.contains('open')) {
            if (e.key === 'Escape') closeSpaceNameDialog();
            return;
        }
        if (settingsOverlay.classList.contains('open')) {
            if (e.key === 'Escape') closeSettings();
            return;
        }
        if (nodeOverlay.classList.contains('open')) {
            if (e.key === 'Enter') confirmNode();
            if (e.key === 'Escape') closeModal();
            return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key === '/') {
            e.preventDefault();
            showModal();
        }
    });

    async function initApp() {
        await refreshCloudSpaces();
        const legacy = readLegacyState();
        const hasLegacyData = legacy.nodes.length || legacy.pan.x || legacy.pan.y;
        if (!MindJumpStorage.getCurrentSpace() && !hasLegacyData) {
            await MindJumpStorage.createSpace({
                name: 'Local Mind',
                storage_mode: 'local_only',
                initialState: createEmptyState(),
            });
        }
        renderState(await MindJumpStorage.getCurrentState());
        renderSpaceSettings();
        updateShortcutHints();
    }

    initApp();
})();
