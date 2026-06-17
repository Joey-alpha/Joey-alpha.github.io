(function () {
    const { normalizeTaskList } = window.EmptyBoxState;

    const config = {
        getState: () => null,
        getTodayKey: () => '',
        getBlindboxTask: () => '',
        setBlindboxTask: () => {},
        updateBlindboxTaskText: () => {}
    };

    function configure(options = {}) {
        Object.assign(config, options);
    }

    function getState() {
        return config.getState();
    }

    function replaceTaskTextInList(list, previousText, nextText) {
        return normalizeTaskList((Array.isArray(list) ? list : []).map(task => task === previousText ? nextText : task));
    }

    function isDailyTask(task) {
        return getState().dailyTasks.includes(task);
    }

    function markDailyTaskDoneToday(task) {
        const state = getState();
        if (!isDailyTask(task)) return;
        const todayKey = config.getTodayKey();
        if (!state.dailyCompletedByDate || typeof state.dailyCompletedByDate !== 'object' || Array.isArray(state.dailyCompletedByDate)) {
            state.dailyCompletedByDate = {};
        }
        state.dailyCompletedByDate[todayKey] = normalizeTaskList([
            ...(state.dailyCompletedByDate[todayKey] || []),
            task
        ]);
    }

    function removeDailyCompletion(task, dateKey = config.getTodayKey()) {
        const state = getState();
        if (!state.dailyCompletedByDate?.[dateKey]) return;
        state.dailyCompletedByDate[dateKey] = normalizeTaskList(state.dailyCompletedByDate[dateKey]).filter(item => item !== task);
        if (!state.dailyCompletedByDate[dateKey].length) {
            delete state.dailyCompletedByDate[dateKey];
        }
    }

    function toggleDailyTask(task) {
        const state = getState();
        if (!task) return false;
        if (isDailyTask(task)) {
            state.dailyTasks = state.dailyTasks.filter(item => item !== task);
            Object.keys(state.dailyCompletedByDate || {}).forEach(dateKey => removeDailyCompletion(task, dateKey));
            return false;
        }
        state.dailyTasks = [...new Set([...state.dailyTasks, task])];
        removeDailyCompletion(task);
        return true;
    }

    function taskTextExists(text, previousText) {
        const state = getState();
        if (!text || text === previousText) return false;
        return state.boxTasks.includes(text) ||
            state.mustDoTasks.includes(text) ||
            state.dailyTasks.includes(text) ||
            state.nowTask === text;
    }

    function renameTaskText(previousText, nextText) {
        const state = getState();
        const trimmedText = nextText.trim();
        if (!previousText || previousText === trimmedText) return { ok: true };
        if (!trimmedText) return { ok: false, message: '任务内容不能为空' };
        if (taskTextExists(trimmedText, previousText)) return { ok: false, message: '已存在同名任务' };

        state.boxTasks = replaceTaskTextInList(state.boxTasks, previousText, trimmedText);
        state.mustDoTasks = replaceTaskTextInList(state.mustDoTasks, previousText, trimmedText);
        state.dailyTasks = replaceTaskTextInList(state.dailyTasks, previousText, trimmedText);
        if (state.nowTask === previousText) state.nowTask = trimmedText;
        if (config.getBlindboxTask() === previousText) {
            config.setBlindboxTask(trimmedText);
            config.updateBlindboxTaskText(trimmedText);
        }

        if (state.mustDoTaskGroups[previousText]) {
            const previousGroupId = state.mustDoTaskGroups[previousText];
            delete state.mustDoTaskGroups[previousText];
            state.mustDoTaskGroups[trimmedText] = previousGroupId;
        }
        Object.keys(state.mustDoTaskOrder).forEach(groupId => {
            state.mustDoTaskOrder[groupId] = replaceTaskTextInList(state.mustDoTaskOrder[groupId], previousText, trimmedText);
        });
        Object.values(state.mustDoHiddenByDate).forEach(hiddenByCriterion => {
            if (!hiddenByCriterion || typeof hiddenByCriterion !== 'object') return;
            Object.keys(hiddenByCriterion).forEach(criterionId => {
                hiddenByCriterion[criterionId] = replaceTaskTextInList(hiddenByCriterion[criterionId], previousText, trimmedText);
            });
        });
        Object.keys(state.dailyCompletedByDate).forEach(dateKey => {
            state.dailyCompletedByDate[dateKey] = replaceTaskTextInList(state.dailyCompletedByDate[dateKey], previousText, trimmedText);
        });

        return { ok: true, text: trimmedText };
    }

    window.EmptyBoxTaskModel = {
        configure,
        replaceTaskTextInList,
        isDailyTask,
        markDailyTaskDoneToday,
        removeDailyCompletion,
        toggleDailyTask,
        taskTextExists,
        renameTaskText
    };
})();
