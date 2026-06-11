(function () {
    const DEFAULT_MUST_DO_CRITERIA = [
        { id: 'urgent', name: '紧急' },
        { id: 'important', name: '重要' }
    ];
    const MUST_DO_INBOX_CRITERION = { id: '__inbox__', name: 'Inbox' };

    function cloneDefaultMustDoCriteria() {
        return DEFAULT_MUST_DO_CRITERIA.map(criterion => ({ ...criterion }));
    }

    function createMustDoCriterionId() {
        return `criterion-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function isInboxMustDoCriterion(criterionId) {
        return criterionId === MUST_DO_INBOX_CRITERION.id;
    }

    function normalizeTaskList(value, dedupe = true) {
        const tasks = Array.isArray(value)
            ? value.map(task => typeof task === 'string' ? task.trim() : '').filter(Boolean)
            : [];
        return dedupe ? [...new Set(tasks)] : tasks;
    }

    function normalizeMustDoCriteria(value) {
        const source = Array.isArray(value) ? value : [];
        const criteria = [];
        source.forEach(item => {
            if (item && typeof item === 'object' && item.id === MUST_DO_INBOX_CRITERION.id) return;
            const rawName = typeof item === 'string'
                ? item
                : item && typeof item === 'object' && typeof item.name === 'string'
                    ? item.name
                    : '';
            const name = rawName.trim();
            if (!name) return;
            let id = (item && typeof item === 'object' && typeof item.id === 'string' ? item.id : '').trim();
            if (!id || criteria.some(criterion => criterion.id === id)) {
                id = createMustDoCriterionId();
            }
            criteria.push({ id, name });
        });
        return criteria.length ? criteria : cloneDefaultMustDoCriteria();
    }

    function normalizeMustDoHiddenByDate(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        const hiddenByDate = {};
        Object.entries(value).forEach(([dateKey, hiddenByCriterion]) => {
            if (!hiddenByCriterion || typeof hiddenByCriterion !== 'object' || Array.isArray(hiddenByCriterion)) return;
            hiddenByDate[dateKey] = {};
            Object.entries(hiddenByCriterion).forEach(([criterionId, tasks]) => {
                hiddenByDate[dateKey][criterionId] = normalizeTaskList(tasks);
            });
        });
        return hiddenByDate;
    }

    function normalizeDailyCompletedByDate(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        const completedByDate = {};
        Object.entries(value).forEach(([dateKey, tasks]) => {
            const normalizedTasks = normalizeTaskList(tasks);
            if (normalizedTasks.length) {
                completedByDate[dateKey] = normalizedTasks;
            }
        });
        return completedByDate;
    }

    function getStateTaskPool(source) {
        return normalizeTaskList([
            ...(Array.isArray(source.boxTasks) ? source.boxTasks : []),
            ...(Array.isArray(source.dailyTasks) ? source.dailyTasks : []),
            typeof source.nowTask === 'string' ? source.nowTask : ''
        ]);
    }

    function deriveMustDoTaskGroups(source, criteria, hiddenByDate) {
        const validCriterionIds = new Set(criteria.map(criterion => criterion.id));
        const taskPool = getStateTaskPool(source);
        const existingGroups = source.mustDoTaskGroups && typeof source.mustDoTaskGroups === 'object' && !Array.isArray(source.mustDoTaskGroups)
            ? source.mustDoTaskGroups
            : null;

        if (existingGroups) {
            const taskGroups = {};
            taskPool.forEach(task => {
                const criterionId = existingGroups[task];
                if (typeof criterionId === 'string' && validCriterionIds.has(criterionId)) {
                    taskGroups[task] = criterionId;
                }
            });
            return taskGroups;
        }

        const hiddenByCriterion = new Map(criteria.map(criterion => [criterion.id, new Set()]));
        Object.values(hiddenByDate).forEach(hiddenForDate => {
            if (!hiddenForDate || typeof hiddenForDate !== 'object' || Array.isArray(hiddenForDate)) return;
            Object.entries(hiddenForDate).forEach(([criterionId, tasks]) => {
                if (!hiddenByCriterion.has(criterionId) || !Array.isArray(tasks)) return;
                tasks.forEach(task => hiddenByCriterion.get(criterionId).add(task));
            });
        });

        const taskGroups = {};
        taskPool.forEach(task => {
            const matchingCriteria = criteria.filter(criterion => !hiddenByCriterion.get(criterion.id).has(task));
            if (matchingCriteria.length === 1) {
                taskGroups[task] = matchingCriteria[0].id;
            }
        });
        return taskGroups;
    }

    function normalizeMustDoTaskOrder(value, taskGroups, taskPool) {
        const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
        const taskSet = new Set(taskPool);
        const validGroupIds = new Set([MUST_DO_INBOX_CRITERION.id, ...Object.values(taskGroups)]);
        const order = {};

        Object.entries(source).forEach(([groupId, tasks]) => {
            if (!validGroupIds.has(groupId)) return;
            const normalizedTasks = normalizeTaskList(tasks).filter(task => taskSet.has(task));
            if (normalizedTasks.length) {
                order[groupId] = normalizedTasks;
            }
        });

        taskPool.forEach(task => {
            const groupId = taskGroups[task] || MUST_DO_INBOX_CRITERION.id;
            if (!order[groupId]) order[groupId] = [];
            if (!order[groupId].includes(task)) {
                order[groupId].push(task);
            }
        });

        return order;
    }

    function normalizeState(parsed) {
        const source = parsed && typeof parsed === 'object' ? parsed : {};
        const mustDoCriteria = normalizeMustDoCriteria(source.mustDoCriteria);
        const mustDoHiddenByDate = normalizeMustDoHiddenByDate(source.mustDoHiddenByDate);
        const mustDoTaskGroups = deriveMustDoTaskGroups(source, mustDoCriteria, mustDoHiddenByDate);
        const taskPool = getStateTaskPool(source);
        const activeMustDoCriterionId = typeof source.activeMustDoCriterionId === 'string' &&
            (isInboxMustDoCriterion(source.activeMustDoCriterionId) ||
                mustDoCriteria.some(criterion => criterion.id === source.activeMustDoCriterionId))
            ? source.activeMustDoCriterionId
            : MUST_DO_INBOX_CRITERION.id;
        const pinnedMustDoCriterionId = typeof source.pinnedMustDoCriterionId === 'string' &&
            !isInboxMustDoCriterion(source.pinnedMustDoCriterionId) &&
            mustDoCriteria.some(criterion => criterion.id === source.pinnedMustDoCriterionId)
            ? source.pinnedMustDoCriterionId
            : '';

        return {
            ...source,
            boxTasks: normalizeTaskList(source.boxTasks),
            completedTasks: normalizeTaskList(source.completedTasks, false),
            nowTask: typeof source.nowTask === 'string' ? source.nowTask : '',
            nowTaskStartedAt: Number.isFinite(source.nowTaskStartedAt) ? source.nowTaskStartedAt : 0,
            reflectionNote: typeof source.reflectionNote === 'string' ? source.reflectionNote : '',
            blindboxRejectCount: Number.isFinite(source.blindboxRejectCount) ? source.blindboxRejectCount : 0,
            blindboxCooldownUntil: Number.isFinite(source.blindboxCooldownUntil) ? source.blindboxCooldownUntil : 0,
            mustDoTasks: normalizeTaskList(source.mustDoTasks),
            dailyTasks: normalizeTaskList(source.dailyTasks),
            dailyCompletedByDate: normalizeDailyCompletedByDate(source.dailyCompletedByDate),
            mustDoCriteria,
            activeMustDoCriterionId,
            pinnedMustDoCriterionId,
            mustDoHiddenByDate,
            mustDoTaskGroups,
            mustDoTaskOrder: normalizeMustDoTaskOrder(source.mustDoTaskOrder, mustDoTaskGroups, taskPool)
        };
    }

    function createEmptyState() {
        return normalizeState({});
    }

    window.EmptyBoxState = {
        DEFAULT_MUST_DO_CRITERIA,
        MUST_DO_INBOX_CRITERION,
        cloneDefaultMustDoCriteria,
        createMustDoCriterionId,
        isInboxMustDoCriterion,
        normalizeTaskList,
        normalizeMustDoCriteria,
        normalizeMustDoHiddenByDate,
        normalizeDailyCompletedByDate,
        getStateTaskPool,
        deriveMustDoTaskGroups,
        normalizeMustDoTaskOrder,
        normalizeState,
        createEmptyState
    };
})();
