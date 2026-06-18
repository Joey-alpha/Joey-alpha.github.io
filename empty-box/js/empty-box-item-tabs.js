(function () {
    const config = {
        elements: {},
        getState: () => null,
        inboxTab: { id: '__inbox__', name: 'Inbox' },
        isInboxTab: id => id === '__inbox__',
        getTaskGroupCount: () => 0,
        activateTab: () => {},
        manageTab: () => {},
        reorderTab: () => {},
        moveTaskToGroup: () => {},
        addTab: () => {},
        tapMovePx: 12,
        doubleTapMs: 360
    };

    function configure(options = {}) {
        Object.assign(config, options);
        config.elements = options.elements || config.elements;
    }

    function getState() {
        return config.getState();
    }

    function bindTabInteractions(button, tab) {
        const { itemTabsBar } = config.elements;

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
            const draggedTabId = event.dataTransfer.getData('application/x-empty-box-tab');
            if (draggedTabId) {
                const rect = button.getBoundingClientRect();
                const position = event.clientX > rect.left + rect.width / 2 ? 'after' : 'before';
                config.reorderTab(draggedTabId, tab.id, position);
                return;
            }
            const task = event.dataTransfer.getData('application/x-empty-box-task') || event.dataTransfer.getData('text/plain');
            if (!task) return;
            config.moveTaskToGroup(task, tab.id);
        });

        if (config.isInboxTab(tab.id)) {
            button.addEventListener('click', event => {
                event.preventDefault();
                config.activateTab(tab.id);
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
            event.dataTransfer.setData('application/x-empty-box-tab', tab.id);
        });
        button.addEventListener('dragend', () => {
            button.classList.remove('is-dragging');
            itemTabsBar.querySelectorAll('.is-drop-target').forEach(item => item.classList.remove('is-drop-target'));
        });

        button.addEventListener('contextmenu', event => {
            event.preventDefault();
            event.stopPropagation();
            config.manageTab(tab.id);
        });
        button.addEventListener('selectstart', event => event.preventDefault());

        button.addEventListener('click', event => {
            if (Date.now() < suppressClickUntil) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            event.preventDefault();
            config.activateTab(tab.id);
        });

        button.addEventListener('pointerup', event => {
            if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
            const now = Date.now();
            const closeToLastTap = Math.hypot(event.clientX - lastTouchTap.x, event.clientY - lastTouchTap.y) <= config.tapMovePx;
            if (lastTouchTap.ts && now - lastTouchTap.ts < config.doubleTapMs && closeToLastTap) {
                event.preventDefault();
                event.stopPropagation();
                lastTouchTap = { ts: 0, x: 0, y: 0 };
                suppressClickUntil = Date.now() + 350;
                config.manageTab(tab.id);
            } else {
                lastTouchTap = { ts: now, x: event.clientX, y: event.clientY };
            }
        });

        button.addEventListener('dblclick', event => {
            event.preventDefault();
            event.stopPropagation();
            config.manageTab(tab.id);
        });
    }

    function renderTabs() {
        const state = getState();
        const { itemTabsBar } = config.elements;
        const inboxTab = config.inboxTab;
        itemTabsBar.innerHTML = '';

        const inboxCount = config.getTaskGroupCount(inboxTab.id);
        const inboxButton = document.createElement('button');
        inboxButton.type = 'button';
        inboxButton.className = `item-tab fixed${inboxCount ? ' has-tasks' : ''}${config.isInboxTab(state.activeMustDoCriterionId) ? ' active' : ''}`;
        inboxButton.dataset.tabId = inboxTab.id;
        inboxButton.dataset.count = String(inboxCount);
        inboxButton.setAttribute('aria-pressed', config.isInboxTab(state.activeMustDoCriterionId) ? 'true' : 'false');
        inboxButton.title = inboxCount ? `Inbox items · ${inboxCount} 项` : 'Inbox items';
        inboxButton.textContent = inboxTab.name;
        bindTabInteractions(inboxButton, inboxTab);
        itemTabsBar.appendChild(inboxButton);

        state.mustDoCriteria.forEach(tab => {
            const taskCount = config.getTaskGroupCount(tab.id);
            const pinned = tab.id === state.pinnedMustDoCriterionId;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `item-tab${taskCount ? ' has-tasks' : ''}${tab.id === state.activeMustDoCriterionId ? ' active' : ''}${pinned ? ' is-pinned' : ''}`;
            button.dataset.tabId = tab.id;
            button.dataset.count = String(taskCount);
            button.setAttribute('aria-pressed', tab.id === state.activeMustDoCriterionId ? 'true' : 'false');
            button.title = [
                tab.name,
                taskCount ? `${taskCount} 项` : '',
                pinned ? '已 Pin 到首页' : ''
            ].filter(Boolean).join(' · ');
            button.textContent = tab.name;
            bindTabInteractions(button, tab);
            itemTabsBar.appendChild(button);
        });

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'item-tab add';
        addButton.setAttribute('aria-label', '新增 Tab');
        addButton.title = '新增 Tab';
        addButton.textContent = '+';
        addButton.addEventListener('click', config.addTab);
        itemTabsBar.appendChild(addButton);
    }

    window.EmptyBoxItemTabs = {
        configure,
        renderTabs
    };
})();
