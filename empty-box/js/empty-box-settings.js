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
        renderItemManager: () => {},
        saveState: () => {},
        openOverlay: () => {},
        closeOverlay: () => {},
        openConfirmDialog: async () => false,
        isTextCompositionEvent: () => false,
        copyText: async () => {}
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
            transferSpaceContentBtn,
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
            option.textContent = '未选择 Space';
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

        const mode = current ? current.storage_mode : null;
        const label = mode === 'cloud_sync' ? '云端同步' : mode === 'local_only' ? '仅本地' : '未选择';
        const cloudCount = spaces.filter(space => space.storage_mode === 'cloud_sync').length;
        const localCount = spaces.filter(space => space.storage_mode === 'local_only').length;
        const currentName = current ? current.name : '未选择';

        spaceStatus.textContent = `${currentName} · ${label} · 本地 ${localCount} / 云端 ${cloudCount}`;
        renameSpaceBtn.disabled = !current;
        deleteSpaceBtn.disabled = !current;
        transferSpaceContentBtn.disabled = spaces.length < 2;
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

    async function transferSelectedSpaceContent() {
        const {
            migrateSourceSpaceSelect,
            migrateTargetSpaceSelect,
            transferSpaceContentBtn,
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
            transferSpaceContentBtn.disabled = true;
            spaceTransferStatus.textContent = '正在迁移...';
            const result = await config.storage.transferSpaceContent(source.id, target.id);
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

    function renderAiSettings() {
        const { aiApiKeyInput, aiModelInput, aiSettingsStatus } = config.elements;
        if (!window.EmptyBoxAI || !aiApiKeyInput || !aiModelInput) return;
        aiApiKeyInput.value = window.EmptyBoxAI.hasApiKey() ? '••••••••••••••••' : '';
        aiModelInput.value = window.EmptyBoxAI.getModel();
        if (!aiSettingsStatus.textContent) {
            aiSettingsStatus.textContent = window.EmptyBoxAI.hasApiKey()
                ? 'DeepSeek API Key 已保存在本机浏览器。'
                : 'API Key 只会保存在本机浏览器，不会写入 Space 数据。';
        }
    }

    function saveAiSettings() {
        const { aiApiKeyInput, aiModelInput, aiSettingsStatus } = config.elements;
        const value = aiApiKeyInput.value.trim();
        if (value && !/^•+$/.test(value)) {
            window.EmptyBoxAI.setApiKey(value);
        }
        window.EmptyBoxAI.setModel(aiModelInput.value);
        renderAiSettings();
        aiSettingsStatus.textContent = 'AI 设置已保存。';
    }

    function clearAiSettings() {
        const { aiApiKeyInput, aiSettingsStatus } = config.elements;
        window.EmptyBoxAI.setApiKey('');
        aiApiKeyInput.value = '';
        aiSettingsStatus.textContent = 'DeepSeek API Key 已清除。';
    }

    async function copyAiTasksPrompt() {
        const { aiSettingsStatus } = config.elements;
        try {
            await config.copyText(window.EmptyBoxAI.buildOrganizationPrompt(config.getState()));
            aiSettingsStatus.textContent = '已复制整理输入，可以粘贴给 AI。';
        } catch (error) {
            console.error(error);
            aiSettingsStatus.textContent = `复制失败：${config.formatErrorMessage(error)}`;
        }
    }

    async function organizeTasksWithAi() {
        const { organizeTasksWithAiBtn, aiSettingsStatus } = config.elements;
        try {
            if (!window.EmptyBoxAI.hasApiKey()) {
                aiSettingsStatus.textContent = '请先保存 DeepSeek API Key。';
                return;
            }
            saveAiSettings();
            organizeTasksWithAiBtn.disabled = true;
            aiSettingsStatus.textContent = '正在请求 DeepSeek 重新归类...';
            const result = await window.EmptyBoxAI.organizeTasks(config.getState());
            const summaryLines = [
                result.summary,
                `将创建 ${result.tabs.length} 个 tab，Inbox 保留 ${result.inbox.length} 个 item。`,
                '这会重建当前待办池的 tabs、分组和排序，但不会删除 item、Daily、Star 或完成记录。'
            ].filter(Boolean);
            const ok = await config.openConfirmDialog({
                title: '应用 AI 归类？',
                message: summaryLines.join('\n'),
                confirmText: '应用归类'
            });
            if (!ok) {
                aiSettingsStatus.textContent = '已取消应用 AI 归类。';
                return;
            }
            window.EmptyBoxAI.applyOrganization(config.getState(), result);
            config.saveState();
            config.renderNow();
            config.renderItemManager();
            aiSettingsStatus.textContent = 'AI 归类已应用。';
        } catch (error) {
            console.error(error);
            aiSettingsStatus.textContent = `AI 归类失败：${config.formatErrorMessage(error)}`;
        } finally {
            organizeTasksWithAiBtn.disabled = false;
        }
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
            transferSpaceContentBtn,
            migrateSourceSpaceSelect,
            migrateTargetSpaceSelect,
            spaceTransferStatus,
            spaceNameConfirmBtn,
            spaceNameCancelBtn,
            spaceNameInput,
            spaceNameMessage,
            exportJsonBtn,
            importJsonInput,
            aiApiKeyInput,
            aiModelInput,
            aiSettingsStatus,
            saveAiSettingsBtn,
            clearAiSettingsBtn,
            copyAiTasksPromptBtn,
            organizeTasksWithAiBtn
        } = config.elements;

        settingsFab.addEventListener('click', async () => {
            renderSpaceSettings();
            renderAiSettings();
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
        transferSpaceContentBtn.addEventListener('click', transferSelectedSpaceContent);
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
        exportJsonBtn.addEventListener('click', exportJson);
        importJsonInput.addEventListener('change', importJson);
        saveAiSettingsBtn.addEventListener('click', saveAiSettings);
        clearAiSettingsBtn.addEventListener('click', clearAiSettings);
        copyAiTasksPromptBtn.addEventListener('click', copyAiTasksPrompt);
        organizeTasksWithAiBtn.addEventListener('click', organizeTasksWithAi);
        aiApiKeyInput.addEventListener('input', () => {
            aiSettingsStatus.textContent = '';
        });
        aiModelInput.addEventListener('input', () => {
            aiSettingsStatus.textContent = '';
        });
    }

    window.EmptyBoxSettings = {
        configure,
        bindEvents,
        renderSpaceSettings,
        refreshCloudSpaces,
        openSpaceNameDialog,
        closeSpaceNameDialog,
        saveNamedSpace,
        openRenameSpaceDialog,
        transferSelectedSpaceContent,
        deleteCurrentSpace
    };
})();
