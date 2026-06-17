(function () {
    const config = {
        elements: {},
        getState: () => null,
        inboxCriterion: { id: '__inbox__', name: 'Inbox' },
        isInboxCriterion: id => id === '__inbox__',
        getTaskGroupCount: () => 0,
        activateCriterion: () => {},
        manageCriterion: () => {},
        reorderCriterion: () => {},
        moveTaskToGroup: () => {},
        addCriterion: () => {},
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

    function bindCriterionInteractions(button, criterion) {
        const { mustDoCriteriaBar } = config.elements;

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
                config.reorderCriterion(draggedCriterionId, criterion.id, position);
                return;
            }
            const task = event.dataTransfer.getData('application/x-empty-box-task') || event.dataTransfer.getData('text/plain');
            if (!task) return;
            config.moveTaskToGroup(task, criterion.id);
        });

        if (config.isInboxCriterion(criterion.id)) {
            button.addEventListener('click', event => {
                event.preventDefault();
                config.activateCriterion(criterion.id);
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
            config.manageCriterion(criterion.id);
        });
        button.addEventListener('selectstart', event => event.preventDefault());

        button.addEventListener('click', event => {
            if (Date.now() < suppressClickUntil) {
                event.preventDefault();
                event.stopPropagation();
                return;
            }
            event.preventDefault();
            config.activateCriterion(criterion.id);
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
                config.manageCriterion(criterion.id);
            } else {
                lastTouchTap = { ts: now, x: event.clientX, y: event.clientY };
            }
        });

        button.addEventListener('dblclick', event => {
            event.preventDefault();
            event.stopPropagation();
            config.manageCriterion(criterion.id);
        });
    }

    function renderCriteria() {
        const state = getState();
        const { mustDoCriteriaBar } = config.elements;
        const inboxCriterion = config.inboxCriterion;
        mustDoCriteriaBar.innerHTML = '';

        const inboxCount = config.getTaskGroupCount(inboxCriterion.id);
        const inboxButton = document.createElement('button');
        inboxButton.type = 'button';
        inboxButton.className = `must-do-criterion fixed${inboxCount ? ' has-tasks' : ''}${config.isInboxCriterion(state.activeMustDoCriterionId) ? ' active' : ''}`;
        inboxButton.dataset.criterionId = inboxCriterion.id;
        inboxButton.dataset.count = String(inboxCount);
        inboxButton.setAttribute('aria-pressed', config.isInboxCriterion(state.activeMustDoCriterionId) ? 'true' : 'false');
        inboxButton.title = inboxCount ? `Inbox items · ${inboxCount} 项` : 'Inbox items';
        inboxButton.textContent = inboxCriterion.name;
        bindCriterionInteractions(inboxButton, inboxCriterion);
        mustDoCriteriaBar.appendChild(inboxButton);

        state.mustDoCriteria.forEach(criterion => {
            const taskCount = config.getTaskGroupCount(criterion.id);
            const pinned = criterion.id === state.pinnedMustDoCriterionId;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `must-do-criterion${taskCount ? ' has-tasks' : ''}${criterion.id === state.activeMustDoCriterionId ? ' active' : ''}${pinned ? ' is-pinned' : ''}`;
            button.dataset.criterionId = criterion.id;
            button.dataset.count = String(taskCount);
            button.setAttribute('aria-pressed', criterion.id === state.activeMustDoCriterionId ? 'true' : 'false');
            button.title = [
                criterion.name,
                taskCount ? `${taskCount} 项` : '',
                pinned ? '已 Pin 到首页' : ''
            ].filter(Boolean).join(' · ');
            button.textContent = criterion.name;
            bindCriterionInteractions(button, criterion);
            mustDoCriteriaBar.appendChild(button);
        });

        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'must-do-criterion add';
        addButton.setAttribute('aria-label', '新增 Tab');
        addButton.title = '新增 Tab';
        addButton.textContent = '+';
        addButton.addEventListener('click', config.addCriterion);
        mustDoCriteriaBar.appendChild(addButton);
    }

    window.EmptyBoxMustDo = {
        configure,
        renderCriteria
    };
})();
