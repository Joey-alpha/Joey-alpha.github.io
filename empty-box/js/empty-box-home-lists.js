(function () {
    const { normalizeTaskList } = window.EmptyBoxState;

    const config = {
        elements: {},
        getState: () => null,
        saveState: () => {},
        renderNow: () => {},
        renderTaskText: () => {},
        createTaskActionMenu: () => ({ moreButton: document.createTextNode(''), actions: document.createTextNode('') }),
        isTaskItemControlTarget: () => false,
        appendTaskToBox: () => {},
        getTaskGroupIdRaw: () => '',
        getTodayKey: () => '',
        getPinnedTab: () => null,
        getTasksForTab: () => [],
        setTabTaskOrder: () => {},
        renderItemManagerItems: () => {},
        getActiveTabId: () => '',
        tapMovePx: 12
    };

    function configure(options = {}) {
        Object.assign(config, options);
        config.elements = options.elements || config.elements;
    }

    function getState() {
        return config.getState();
    }

    function reorderTaskList(tasks, draggedTask, targetTask) {
        if (!draggedTask || !targetTask || draggedTask === targetTask) return false;
        const reorderedTasks = [...tasks];
        const fromIndex = reorderedTasks.indexOf(draggedTask);
        const toIndex = reorderedTasks.indexOf(targetTask);
        if (fromIndex === -1 || toIndex === -1) return false;
        reorderedTasks.splice(fromIndex, 1);
        reorderedTasks.splice(toIndex, 0, draggedTask);
        return reorderedTasks;
    }

    function reorderStarTask(draggedTask, targetTask) {
        const state = getState();
        const tasks = reorderTaskList(state.mustDoTasks, draggedTask, targetTask);
        if (!tasks) return false;
        state.mustDoTasks = tasks;
        renderStarList();
        config.saveState();
        return true;
    }

    function reorderDailyTask(draggedTask, targetTask) {
        const state = getState();
        const tasks = reorderTaskList(state.dailyTasks, draggedTask, targetTask);
        if (!tasks) return false;
        state.dailyTasks = tasks;
        renderDailyList();
        config.saveState();
        return true;
    }

    function reorderPinnedTabTask(tabId, draggedTask, targetTask) {
        const tasks = reorderTaskList(config.getTasksForTab(tabId), draggedTask, targetTask);
        if (!tasks) return false;
        config.setTabTaskOrder(tabId, tasks);
        renderPinnedTabList();
        if (tabId === config.getActiveTabId()) config.renderItemManagerItems();
        config.saveState();
        return true;
    }

    function selectHomeTask(task) {
        const state = getState();
        if (state.nowTask && state.nowTask !== task && !state.boxTasks.includes(state.nowTask)) {
            config.appendTaskToBox(state.nowTask, config.getTaskGroupIdRaw(state.nowTask));
        }
        state.boxTasks = state.boxTasks.filter(item => item !== task);
        state.nowTask = task;
        state.nowTaskStartedAt = Date.now();
        config.renderNow();
    }

    function bindHomeListItemDragInteractions(item, task, { selector, dataType, reorder }) {
        item.draggable = true;
        item.dataset.task = task;
        let pointerId = null;
        let startX = 0;
        let startY = 0;
        let didPointerDrag = false;

        item.addEventListener('pointerdown', event => {
            item.draggable = !config.isTaskItemControlTarget(event.target);
        }, true);
        item.addEventListener('pointerup', () => {
            item.draggable = true;
        }, true);
        item.addEventListener('pointercancel', () => {
            item.draggable = true;
        }, true);

        item.addEventListener('dragstart', event => {
            if (config.isTaskItemControlTarget(event.target)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            item.classList.add('is-dragging');
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData(dataType, task);
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('is-dragging');
        });
        item.addEventListener('dragover', event => {
            event.preventDefault();
            const draggedTask = event.dataTransfer.getData(dataType);
            if (!draggedTask || draggedTask === task) return;
            item.classList.add('is-drag-over');
        });
        item.addEventListener('dragleave', () => {
            item.classList.remove('is-drag-over');
        });
        item.addEventListener('drop', event => {
            event.preventDefault();
            item.classList.remove('is-drag-over');
            const draggedTask = event.dataTransfer.getData(dataType);
            reorder(draggedTask, task);
        });

        item.addEventListener('pointerdown', event => {
            if (event.pointerType === 'mouse' || config.isTaskItemControlTarget(event.target)) return;
            pointerId = event.pointerId;
            startX = event.clientX;
            startY = event.clientY;
            didPointerDrag = false;
            if (item.setPointerCapture) item.setPointerCapture(event.pointerId);
        });
        item.addEventListener('pointermove', event => {
            if (pointerId !== event.pointerId) return;
            const moved = Math.hypot(event.clientX - startX, event.clientY - startY);
            if (moved <= config.tapMovePx) return;
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
            const targetItem = document.elementFromPoint(event.clientX, event.clientY)?.closest(selector);
            reorder(task, targetItem?.dataset.task);
        });
        item.addEventListener('pointercancel', event => {
            if (pointerId !== event.pointerId) return;
            pointerId = null;
            didPointerDrag = false;
            item.classList.remove('is-dragging');
        });
    }

    function bindStarListItemDragInteractions(item, task) {
        bindHomeListItemDragInteractions(item, task, {
            selector: '.star-item',
            dataType: 'application/x-empty-box-selected-task',
            reorder: reorderStarTask
        });
    }

    function bindDailyListItemDragInteractions(item, task) {
        bindHomeListItemDragInteractions(item, task, {
            selector: '.daily-item',
            dataType: 'application/x-empty-box-daily-task',
            reorder: reorderDailyTask
        });
    }

    function bindPinnedListItemDragInteractions(item, task, tabId) {
        bindHomeListItemDragInteractions(item, task, {
            selector: '.pinned-item',
            dataType: 'application/x-empty-box-pinned-task',
            reorder: (draggedTask, targetTask) => reorderPinnedTabTask(tabId, draggedTask, targetTask)
        });
    }

    function bindHomeItemClick(item, task) {
        item.addEventListener('click', event => {
            if (Date.now() < Number(item.dataset.suppressClickUntil || 0)) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            if (config.isTaskItemControlTarget(event.target)) return;
            selectHomeTask(task);
        });
    }

    function isDailyTaskDoneToday(task) {
        const state = getState();
        const todayCompleted = state.dailyCompletedByDate?.[config.getTodayKey()] || [];
        return todayCompleted.includes(task);
    }

    function getActiveDailyTasks() {
        return normalizeTaskList(getState().dailyTasks).filter(task => !isDailyTaskDoneToday(task));
    }

    function renderStarList() {
        const state = getState();
        const { starPanel, starList } = config.elements;
        starList.innerHTML = '';
        if (!state.mustDoTasks.length) {
            starPanel.classList.remove('active');
            starList.innerHTML = '<div class="reflection-empty">当前没有 Star item</div>';
            return;
        }
        starPanel.classList.add('active');
        state.mustDoTasks.forEach((task, index) => {
            const item = document.createElement('div');
            item.className = `star-item candidate-item has-actions${state.nowTask === task ? ' is-current' : ''}`;
            const taskText = document.createElement('span');
            taskText.className = 'candidate-text';
            config.renderTaskText(taskText, task);
            const orderText = document.createElement('span');
            orderText.className = 'star-order';
            orderText.textContent = String(index + 1);
            const { moreButton, actions } = config.createTaskActionMenu({
                row: item,
                label: taskText,
                task,
                rerender: renderStarList
            });
            item.append(taskText, orderText, moreButton, actions);
            bindStarListItemDragInteractions(item, task);
            bindHomeItemClick(item, task);
            starList.appendChild(item);
        });
    }

    function renderDailyList() {
        const state = getState();
        const { dailyPanel, dailyList } = config.elements;
        dailyList.innerHTML = '';
        if (!state.dailyTasks.length) {
            dailyPanel.classList.remove('active');
            return;
        }

        dailyPanel.classList.add('active');
        const activeDailyTasks = getActiveDailyTasks();
        if (!activeDailyTasks.length) {
            dailyList.innerHTML = '<div class="reflection-empty">今日 Daily 已完成</div>';
            return;
        }

        activeDailyTasks.forEach(task => {
            const item = document.createElement('div');
            item.className = `daily-item candidate-item has-actions${state.nowTask === task ? ' is-current' : ''}`;
            const taskText = document.createElement('span');
            taskText.className = 'candidate-text';
            config.renderTaskText(taskText, task);
            const { moreButton, actions } = config.createTaskActionMenu({
                row: item,
                label: taskText,
                task,
                rerender: renderDailyList
            });
            item.append(taskText, moreButton, actions);
            bindDailyListItemDragInteractions(item, task);
            bindHomeItemClick(item, task);
            dailyList.appendChild(item);
        });
    }

    function renderPinnedTabList() {
        const state = getState();
        const { pinnedPanel, pinnedTitle, pinnedList } = config.elements;
        pinnedList.innerHTML = '';
        const tab = config.getPinnedTab();
        if (!tab) {
            pinnedPanel.classList.remove('active');
            return;
        }

        const tasks = config.getTasksForTab(tab.id);
        if (!tasks.length) {
            pinnedPanel.classList.remove('active');
            return;
        }

        pinnedTitle.textContent = tab.name;
        pinnedPanel.classList.add('active');
        tasks.forEach(task => {
            const item = document.createElement('div');
            item.className = `pinned-item candidate-item has-actions${state.nowTask === task ? ' is-current' : ''}`;
            const taskText = document.createElement('span');
            taskText.className = 'candidate-text';
            config.renderTaskText(taskText, task);
            const { moreButton, actions } = config.createTaskActionMenu({
                row: item,
                label: taskText,
                task,
                rerender: renderPinnedTabList
            });
            item.append(taskText, moreButton, actions);
            bindPinnedListItemDragInteractions(item, task, tab.id);
            bindHomeItemClick(item, task);
            pinnedList.appendChild(item);
        });
    }

    function renderAll() {
        renderDailyList();
        renderPinnedTabList();
        renderStarList();
    }

    window.EmptyBoxHomeLists = {
        configure,
        renderAll,
        renderStarList,
        renderDailyList,
        renderPinnedTabList
    };
})();
