(function () {
    const noop = () => {};

    const hooks = {
        getTaskState: () => ({
            selected: false,
            daily: false,
            dailyDoneToday: false,
            canStar: true
        }),
        editTask: noop,
        copyTask: async () => {},
        moveTask: noop,
        completeTask: noop,
        toggleStar: noop,
        toggleDaily: noop
    };

    function configure(options = {}) {
        Object.entries(options).forEach(([key, value]) => {
            if (key in hooks && typeof value === 'function') {
                hooks[key] = value;
            }
        });
    }

    function closeSiblingMenus(row) {
        row.parentElement?.querySelectorAll('.candidate-item.is-menu-open').forEach(item => {
            item.classList.remove('is-menu-open');
        });
    }

    function closeAllMenus() {
        document.querySelectorAll('.candidate-item.is-menu-open').forEach(item => {
            item.classList.remove('is-menu-open');
        });
    }

    document.addEventListener('click', event => {
        if (event.target.closest('.candidate-more-btn, .candidate-actions')) return;
        closeAllMenus();
    });

    function createButton(text, className = 'btn secondary compact') {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = className;
        button.textContent = text;
        button.addEventListener('pointerdown', event => event.stopPropagation());
        return button;
    }

    function createMenu({ row, label, task, editMode = 'home', rerender }) {
        const refreshList = rerender || noop;
        const taskState = hooks.getTaskState(task);
        const moreButton = createButton('⋯', 'candidate-more-btn');
        moreButton.setAttribute('aria-label', '更多操作');

        const actions = document.createElement('div');
        actions.className = 'candidate-actions';
        actions.addEventListener('pointerdown', event => event.stopPropagation());

        const editButton = createButton('编辑');
        const copyButton = createButton('复制');
        const moveButton = createButton('移动');
        const completeButton = createButton(taskState.dailyDoneToday ? '今日已完成' : '完成');
        completeButton.disabled = taskState.dailyDoneToday;
        const starButton = createButton(
            taskState.selected ? 'Unstar' : 'Star',
            `btn ${taskState.selected ? 'primary' : 'secondary'} compact`
        );
        starButton.disabled = !taskState.selected && !taskState.canStar;
        const dailyButton = createButton(
            taskState.daily ? 'Daily✓' : 'Daily',
            `btn ${taskState.daily ? 'primary' : 'secondary'} compact`
        );

        actions.append(editButton, copyButton, moveButton, completeButton, starButton, dailyButton);

        moreButton.addEventListener('click', event => {
            event.stopPropagation();
            const shouldOpen = !row.classList.contains('is-menu-open');
            closeSiblingMenus(row);
            row.classList.toggle('is-menu-open', shouldOpen);
        });

        editButton.addEventListener('click', event => {
            event.stopPropagation();
            row.classList.remove('is-menu-open');
            hooks.editTask({ row, label, task, editMode, rerender: refreshList });
        });

        copyButton.addEventListener('click', async event => {
            event.stopPropagation();
            await hooks.copyTask({ button: copyButton, task });
        });

        moveButton.addEventListener('click', event => {
            event.stopPropagation();
            row.classList.remove('is-menu-open');
            hooks.moveTask(task);
        });

        completeButton.addEventListener('click', event => {
            event.stopPropagation();
            if (taskState.dailyDoneToday) return;
            row.classList.remove('is-menu-open');
            hooks.completeTask({ task, rerender: refreshList });
        });

        starButton.addEventListener('click', event => {
            event.stopPropagation();
            row.classList.remove('is-menu-open');
            hooks.toggleStar({ task, selected: taskState.selected, rerender: refreshList });
        });

        dailyButton.addEventListener('click', event => {
            event.stopPropagation();
            row.classList.remove('is-menu-open');
            hooks.toggleDaily({ task, rerender: refreshList });
        });

        return { moreButton, actions };
    }

    window.EmptyBoxTaskActions = {
        configure,
        createMenu
    };
})();
