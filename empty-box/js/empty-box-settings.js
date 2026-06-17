(function () {
    const config = {
        elements: {},
        storage: null,
        formatErrorMessage: error => error?.message || String(error || ''),
        createEmptyState: () => ({}),
        getState: () => null,
        setState: () => {},
        resetLastCompletedTask: () => {},
        renderNow: () => {},
        renderReflectionFab: () => {},
        openOverlay: () => {},
        closeOverlay: () => {},
        openConfirmDialog: async () => false,
        isTextCompositionEvent: () => false,
        storageKey: '',
        migrationDoneKey: '',
        migrationDismissedKey: ''
    };

    let pendingSpaceMode = 'local_only';
    let pendingRenameSpaceId = null;

    function configure(options = {}) {
        Object.assign(config, options);
        config.elements = options.elements || config.elements;
    }

    function renderSpaceSettings() {
        const {
            spaceSelect,
            migrateSourceSpaceSelect,
            migrateTargetSpaceSelect,
            spaceStatus,
            renameSpaceBtn,
            deleteSpaceBtn,
            transferSpaceNotesBtn,
            spaceTransferStatus
        } = config.elements;
        const spaces = config.storage.getSpaces();
        const current = config.storage.getCurrentSpace();
        spaceSelect.innerHTML = '';
        migrateSourceSpaceSelect.innerHTML = '';
        migrateTargetSpaceSelect.innerHTML = '';

        if (!spaces.length) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = localStorage.getItem(config.storageKey) ? '旧版 item 数据' : '未选择 Space';
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
        const { spaceStatus } = config.elements;
        try {
            if (showStatus) spaceStatus.textContent = '正在刷新云端 Space...';
            const spaces = await config.storage.syncCloudSpaces();
            renderSpaceSettings();
            if (showStatus) {
                const cloudCount = spaces.filter(space => space.storage_mode === 'cloud_sync').length;
                spaceStatus.textContent = `云端 Space 已刷新：${cloudCount} 个`;
            }
            return spaces;
        } catch (error) {
            console.error(error);
            if (showStatus) spaceStatus.textContent = `刷新云端 Space 失败：${config.formatErrorMessage(error)}`;
            return config.storage.getSpaces();
        }
    }

    function shouldShowMigrationPrompt() {
        const hasLegacy = !!localStorage.getItem(config.storageKey);
        return hasLegacy &&
            localStorage.getItem(config.migrationDoneKey) !== 'true' &&
            localStorage.getItem(config.migrationDismissedKey) !== 'true';
    }

    function showMigrationPromptIfNeeded() {
        const { migrationStatus, migrationOverlay } = config.elements;
        if (shouldShowMigrationPrompt()) {
            migrationStatus.textContent = '';
            config.openOverlay(migrationOverlay);
        }
    }

    function openSpaceNameDialog(storageMode, space = null) {
        const {
            spaceNameTitle,
            spaceNameInput,
            spaceNameMessage,
            spaceNameConfirmBtn,
            spaceNameOverlay
        } = config.elements;
        pendingSpaceMode = storageMode;
        pendingRenameSpaceId = space ? space.id : null;
        const isRename = storageMode === 'rename';
            spaceNameTitle.textContent = isRename ? '重命名 Space' : storageMode === 'cloud_sync' ? '新建云端 Space' : '新建本地 Space';
        spaceNameInput.value = isRename && space ? space.name : '';
        spaceNameMessage.textContent = '';
        spaceNameConfirmBtn.textContent = isRename ? '保存' : '创建';
        config.openOverlay(spaceNameOverlay);
        requestAnimationFrame(() => {
            spaceNameInput.focus();
            if (isRename) spaceNameInput.select();
        });
    }

    function closeSpaceNameDialog() {
        const { spaceNameOverlay, spaceNameMessage, spaceNameConfirmBtn } = config.elements;
        config.closeOverlay(spaceNameOverlay);
        spaceNameMessage.textContent = '';
        pendingRenameSpaceId = null;
        spaceNameConfirmBtn.textContent = '创建';
    }

    async function saveNamedSpace() {
        const { spaceNameInput, spaceNameMessage } = config.elements;
        const storageMode = pendingSpaceMode;
        const name = spaceNameInput.value.trim();
        try {
            if (storageMode === 'rename') {
                await config.storage.renameSpace(pendingRenameSpaceId, name);
                closeSpaceNameDialog();
                renderSpaceSettings();
                config.renderNow();
                return;
            }
            await config.storage.createSpace({
                name: name || (storageMode === 'cloud_sync' ? '云端 Space' : '本地 Space'),
                storage_mode: storageMode,
                initialState: config.createEmptyState()
            });
            closeSpaceNameDialog();
            config.setState(await config.storage.getCurrentState());
            renderSpaceSettings();
            config.renderNow();
        } catch (error) {
            console.error(error);
            spaceNameMessage.textContent = `${storageMode === 'rename' ? '重命名' : '创建'}失败：${config.formatErrorMessage(error)}`;
        }
    }

    function openRenameSpaceDialog() {
        const current = config.storage.getCurrentSpace();
        if (!current) {
            config.elements.spaceStatus.textContent = '当前没有可重命名的 Space。';
            return;
        }
        openSpaceNameDialog('rename', current);
    }

    async function transferSelectedSpaceNotes() {
        const {
            migrateSourceSpaceSelect,
            migrateTargetSpaceSelect,
            transferSpaceNotesBtn,
            spaceTransferStatus
        } = config.elements;
        const sourceId = migrateSourceSpaceSelect.value;
        const targetId = migrateTargetSpaceSelect.value;
        const source = config.storage.getSpaceById(sourceId);
        const target = config.storage.getSpaceById(targetId);
        if (!source || !target) {
            spaceTransferStatus.textContent = '请选择源 Space 和目标 Space。';
            return;
        }
        if (source.id === target.id) {
            spaceTransferStatus.textContent = '源 Space 和目标 Space 不能相同。';
            return;
        }

        const ok = await config.openConfirmDialog({
            title: '迁移 Space 内容',
            message: `把“${source.name}”的 items 和 Tabs 迁移到“${target.name}”？迁移后源 Space 会被清空。`,
            confirmText: '开始迁移'
        });
        if (!ok) return;

        try {
            transferSpaceNotesBtn.disabled = true;
            spaceTransferStatus.textContent = '正在迁移...';
            const result = await config.storage.transferSpaceNotes(source.id, target.id);
            config.setState(result.state);
            renderSpaceSettings();
            config.renderNow();
            spaceTransferStatus.textContent = `已迁移到“${target.name}”，源 Space 已清空。`;
        } catch (error) {
            console.error(error);
            spaceTransferStatus.textContent = `迁移失败：${config.formatErrorMessage(error)}`;
            renderSpaceSettings();
        }
    }

    async function deleteCurrentSpace() {
        const { deleteSpaceBtn, spaceStatus } = config.elements;
        const current = config.storage.getCurrentSpace();
        if (!current) {
            spaceStatus.textContent = '当前没有可删除的 Space。';
            return;
        }

        const ok = await config.openConfirmDialog({
            title: '删除 Space',
            message: `删除“${current.name}”？这个 Space 里的 items 和 Tabs 也会一起删除。`,
            confirmText: '删除',
            danger: true
        });
        if (!ok) return;

        try {
            deleteSpaceBtn.disabled = true;
            spaceStatus.textContent = '正在删除 Space...';
            const deleted = await config.storage.deleteSpace(current.id);
            const nextCurrent = config.storage.getCurrentSpace();
            if (!nextCurrent) {
                await config.storage.createSpace({
                    name: '默认本地 Space',
                    storage_mode: 'local_only',
                    initialState: config.createEmptyState()
                });
            }
            config.setState(await config.storage.getCurrentState());
            config.resetLastCompletedTask();
            renderSpaceSettings();
            config.renderNow();
            spaceStatus.textContent = `已删除“${deleted.name}”。`;
        } catch (error) {
            console.error(error);
            spaceStatus.textContent = `删除失败：${config.formatErrorMessage(error)}`;
            renderSpaceSettings();
        }
    }

    async function finishMigration(mode) {
        const { migrationStatus, migrationOverlay } = config.elements;
        try {
            migrationStatus.textContent = '正在迁移...';
            config.setState(await config.storage.migrateLegacyData(mode));
            config.closeOverlay(migrationOverlay);
            renderSpaceSettings();
            config.renderNow();
        } catch (error) {
            console.error(error);
            migrationStatus.textContent = '迁移失败，请检查 Supabase 表、RLS 或网络。旧数据仍保留在本地。';
        }
    }

    async function exportJson() {
        const data = await config.storage.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'empty-box-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    async function importJson(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            config.setState(await config.storage.importData(parsed));
            config.renderNow();
            config.renderReflectionFab();
            renderSpaceSettings();
            config.closeOverlay(config.elements.settingsOverlay);
        } catch { }
        config.elements.importJsonInput.value = '';
    }

    function bindEvents() {
        const {
            settingsOverlay,
            settingsFab,
            spaceSelect,
            newLocalSpaceBtn,
            newCloudSpaceBtn,
            renameSpaceBtn,
            refreshCloudSpacesBtn,
            deleteSpaceBtn,
            transferSpaceNotesBtn,
            migrateSourceSpaceSelect,
            migrateTargetSpaceSelect,
            spaceTransferStatus,
            spaceNameConfirmBtn,
            spaceNameCancelBtn,
            spaceNameInput,
            spaceNameMessage,
            migrateLocalBtn,
            migrateCloudBtn,
            migrateMergeBtn,
            migrateLaterBtn,
            migrationOverlay,
            exportJsonBtn,
            importJsonInput
        } = config.elements;

        settingsFab.addEventListener('click', async () => {
            renderSpaceSettings();
            config.openOverlay(settingsOverlay);
            await refreshCloudSpaces();
        });

        spaceSelect.addEventListener('change', async () => {
            if (!spaceSelect.value) return;
            await config.storage.setCurrentSpace(spaceSelect.value);
            config.setState(await config.storage.getCurrentState());
            renderSpaceSettings();
            config.renderNow();
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
                const target = config.storage.getSpaces().find(space => space.id !== migrateSourceSpaceSelect.value);
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
            if (config.isTextCompositionEvent(event)) return;
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
            localStorage.setItem(config.migrationDismissedKey, 'true');
            config.closeOverlay(migrationOverlay);
        });
        exportJsonBtn.addEventListener('click', exportJson);
        importJsonInput.addEventListener('change', importJson);
    }

    window.EmptyBoxSettings = {
        configure,
        bindEvents,
        renderSpaceSettings,
        refreshCloudSpaces,
        shouldShowMigrationPrompt,
        showMigrationPromptIfNeeded,
        openSpaceNameDialog,
        closeSpaceNameDialog,
        saveNamedSpace,
        openRenameSpaceDialog,
        transferSelectedSpaceNotes,
        deleteCurrentSpace,
        finishMigration
    };
})();
