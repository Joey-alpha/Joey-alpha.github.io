(function () {
    const ITEM_SWIPE_PX = 58;
    const AUTO_SCROLL_EDGE_PX = 72;
    const AUTO_SCROLL_MAX_PX = 22;

    const config = {
        elements: {},
        getState: () => null,
        saveState: () => {},
        openOverlay: () => {},
        ensureItemTabs: () => {},
        renderItemTabs: () => {},
        renderPinnedTabList: () => {},
        renderFabState: () => {},
        renderNow: () => {},
        renderTaskText: () => {},
        createTaskActionMenu: () => ({ moreButton: document.createTextNode(''), actions: document.createTextNode('') }),
        isTextCompositionEvent: () => false,
        isInboxTab: () => false,
        getActiveTabItems: () => [],
        setActiveGroupTaskOrder: () => {},
        taskTextExists: () => false,
        appendTaskToBox: () => {},
        syncTabState: () => {},
        startTextEdit: () => {},
        isDailyTask: () => false,
        isDailyTaskDoneToday: () => false,
        inboxTab: { id: '__inbox__', name: 'Inbox' }
    };

    function configure(options = {}) {
        Object.assign(config, options);
        config.elements = options.elements || config.elements;
        bindListEvents();
    }

    function getState() {
        return config.getState();
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

    function bindListEvents() {
        const { itemManagerList } = config.elements;
        if (!itemManagerList || itemManagerList.dataset.itemManagerBound === 'true') return;
        itemManagerList.dataset.itemManagerBound = 'true';

        itemManagerList.addEventListener('dragover', event => {
            const dragTypes = Array.from(event.dataTransfer?.types || []);
            if (!dragTypes.includes('text/plain')) return;
            event.preventDefault();
            autoScrollList(event.clientY);
        });

        itemManagerList.addEventListener('click', event => {
            if (event.target.closest('.candidate-more-btn, .candidate-actions')) return;
            itemManagerList.querySelectorAll('.candidate-item.is-menu-open').forEach(item => {
                item.classList.remove('is-menu-open');
            });
        });
    }

    function bindMoveInteractions(row) {
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
            if (event.pointerType === 'mouse' || Math.abs(deltaY) >= ITEM_SWIPE_PX) return;
            if (deltaX <= -ITEM_SWIPE_PX) {
                row.classList.add('is-actions-revealed');
            }
            if (deltaX >= ITEM_SWIPE_PX) {
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

    function bindDragInteractions(row, task) {
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
            autoScrollList(event.clientY);
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
            const tasks = config.getActiveTabItems();
            const fromIndex = tasks.indexOf(draggingTask);
            const toIndex = tasks.indexOf(task);
            if (fromIndex === -1 || toIndex === -1) return;
            tasks.splice(fromIndex, 1);
            tasks.splice(toIndex, 0, draggingTask);
            config.setActiveGroupTaskOrder(tasks);
            renderItems();
            config.saveState();
        });
    }

    function autoScrollList(clientY) {
        const { itemManagerList } = config.elements;
        const rect = itemManagerList.getBoundingClientRect();
        const distanceToTop = clientY - rect.top;
        const distanceToBottom = rect.bottom - clientY;
        let delta = 0;

        if (distanceToTop < AUTO_SCROLL_EDGE_PX) {
            delta = -Math.ceil((1 - Math.max(distanceToTop, 0) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_PX);
        } else if (distanceToBottom < AUTO_SCROLL_EDGE_PX) {
            delta = Math.ceil((1 - Math.max(distanceToBottom, 0) / AUTO_SCROLL_EDGE_PX) * AUTO_SCROLL_MAX_PX);
        }

        if (delta) itemManagerList.scrollTop += delta;
    }

    function addItemToActiveTab(value) {
        const state = getState();
        const text = value.trim();
        if (!text) return { ok: false, message: 'item 内容不能为空' };
        if (config.taskTextExists(text)) return { ok: false, message: '已存在同名 item' };
        const groupId = state.activeMustDoCriterionId || config.inboxTab.id;
        config.appendTaskToBox(text, groupId);
        config.saveState();
        config.renderFabState();
        config.renderPinnedTabList();
        config.syncTabState(groupId);
        return { ok: true };
    }

    function createAddRow() {
        const row = document.createElement('div');
        row.className = 'item-manager-add';
        row.tabIndex = 0;
        row.setAttribute('role', 'button');
        row.setAttribute('aria-label', '添加新 item');

        const renderPrompt = () => {
            row.classList.remove('is-editing');
            row.innerHTML = '<span class="item-manager-add-plus">+</span><span>新建 item</span>';
        };

        const startEdit = () => {
            if (row.classList.contains('is-editing')) return;
            row.classList.add('is-editing');
            row.innerHTML = '';
            const input = document.createElement('textarea');
            input.className = 'item-manager-inline-input';
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
                const result = addItemToActiveTab(value);
                if (!result.ok) {
                    finished = false;
                    input.setCustomValidity(result.message);
                    input.reportValidity();
                    input.focus();
                    return;
                }
                finished = true;
                renderItems();
            };

            input.addEventListener('pointerdown', event => event.stopPropagation());
            input.addEventListener('click', event => event.stopPropagation());
            input.addEventListener('keydown', event => {
                if (isTaskLineBreakShortcut(event)) {
                    event.preventDefault();
                    insertTextareaLineBreak(input);
                    return;
                }
                if (config.isTextCompositionEvent(event)) return;
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

    function renderItems() {
        const state = getState();
        const { itemManagerList } = config.elements;
        itemManagerList.innerHTML = '';
        const isInbox = config.isInboxTab(state.activeMustDoCriterionId);
        const tasks = config.getActiveTabItems();
        if (!tasks.length) {
            const empty = document.createElement('div');
            empty.className = 'reflection-empty';
            empty.textContent = isInbox ? 'Inbox 为空' : '这个 Tab 还没有 item';
            itemManagerList.appendChild(empty);
        }
        tasks.forEach(task => {
            const selected = state.mustDoTasks.includes(task);
            const daily = config.isDailyTask(task);
            const dailyDoneToday = daily && config.isDailyTaskDoneToday(task);
            const row = document.createElement('div');
            row.className = `candidate-item${selected ? ' is-selected' : ''}${daily ? ' is-daily' : ''}${dailyDoneToday ? ' is-daily-done' : ''}`;
            row.setAttribute('aria-selected', selected ? 'true' : 'false');
            row.title = '拖动排序，点击 ⋯ 查看操作';
            const label = document.createElement('span');
            label.className = 'candidate-text';
            config.renderTaskText(label, task);
            const starBadge = document.createElement('span');
            starBadge.className = 'candidate-status-badge candidate-star-badge';
            starBadge.textContent = 'Star';
            starBadge.hidden = !selected;
            const dailyBadge = document.createElement('span');
            dailyBadge.className = 'candidate-status-badge candidate-daily-badge';
            dailyBadge.textContent = 'Daily';
            dailyBadge.hidden = !daily;
            const { moreButton, actions } = config.createTaskActionMenu({
                row,
                label,
                task,
                rerender: renderItems
            });
            row.append(label, starBadge, dailyBadge, moreButton, actions);
            bindMoveInteractions(row);
            bindDragInteractions(row, task);

            itemManagerList.appendChild(row);
        });
        itemManagerList.appendChild(createAddRow());
    }

    function open() {
        const { itemManagerOverlay } = config.elements;
        config.ensureItemTabs();
        config.renderItemTabs();
        renderItems();
        config.openOverlay(itemManagerOverlay);
    }

    window.EmptyBoxItemManager = {
        configure,
        renderItems,
        open
    };
})();
