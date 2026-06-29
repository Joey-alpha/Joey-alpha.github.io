(function () {
    const API_KEY_STORAGE_KEY = 'emptyBox.deepseekApiKey';
    const MODEL_STORAGE_KEY = 'emptyBox.deepseekModel';
    const DEFAULT_MODEL = 'deepseek-chat';
    const API_URL = 'https://api.deepseek.com/chat/completions';
    const INBOX_ID = window.EmptyBoxState.MUST_DO_INBOX_CRITERION.id;

    const { createMustDoCriterionId, normalizeTaskList } = window.EmptyBoxState;

    function getApiKey() {
        return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    }

    function setApiKey(value) {
        const key = String(value || '').trim();
        if (key) {
            localStorage.setItem(API_KEY_STORAGE_KEY, key);
        } else {
            localStorage.removeItem(API_KEY_STORAGE_KEY);
        }
    }

    function getModel() {
        return localStorage.getItem(MODEL_STORAGE_KEY) || DEFAULT_MODEL;
    }

    function setModel(value) {
        const model = String(value || '').trim() || DEFAULT_MODEL;
        localStorage.setItem(MODEL_STORAGE_KEY, model);
    }

    function hasApiKey() {
        return Boolean(getApiKey());
    }

    function getTaskPool(state) {
        return normalizeTaskList([
            ...(Array.isArray(state.boxTasks) ? state.boxTasks : []),
            ...(Array.isArray(state.dailyTasks) ? state.dailyTasks : []),
            typeof state.nowTask === 'string' ? state.nowTask : ''
        ]);
    }

    function buildOrganizationPrompt(state) {
        const tabs = Array.isArray(state.mustDoCriteria)
            ? state.mustDoCriteria.map(tab => tab.name).filter(Boolean)
            : [];
        const taskPool = getTaskPool(state);
        return [
            '请重新整理这些待办任务。',
            '',
            '目标：',
            '- 只用用户给出的原始任务，不要新增、删除、改写任务文字。',
            '- 每个任务必须只出现在一个 tab 中。',
            '- 可以保留已有 tab，也可以合并、重命名、创建新 tab。',
            '- tab 数量尽量少而清晰，优先按行动场景/项目归类。',
            '- 不确定归类的任务放入 Inbox。',
            '',
            '输出 JSON，格式必须是：',
            '{"tabs":[{"name":"Tab 名称","tasks":["原始任务"]}],"inbox":["原始任务"],"summary":"一句话说明"}',
            '',
            `已有 tabs：${JSON.stringify(tabs)}`,
            `任务：${JSON.stringify(taskPool)}`
        ].join('\n');
    }

    function buildRewritePrompt(task) {
        return [
            '请把这个待办改写成更可执行的写法。',
            '',
            '规则：',
            '- 保留原意，不扩大任务范围。',
            '- 用用户原来的语言风格，中文任务用中文，英文任务用英文。',
            '- 明确第一步动作、对象、必要上下文。',
            '- 不要写成长句，不要写解释。',
            '',
            '输出 JSON，格式必须是：',
            '{"text":"改写后的任务","reason":"简短原因"}',
            '',
            `原任务：${JSON.stringify(task)}`
        ].join('\n');
    }

    async function requestJson(prompt) {
        const key = getApiKey();
        if (!key) throw new Error('请先在设置里填写 DeepSeek API Key。');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${key}`
            },
            body: JSON.stringify({
                model: getModel(),
                messages: [
                    {
                        role: 'system',
                        content: 'You return strict JSON only. Do not wrap JSON in markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.2
            })
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(errorText || `DeepSeek 请求失败：HTTP ${response.status}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('DeepSeek 没有返回可用内容。');
        try {
            return JSON.parse(content);
        } catch {
            throw new Error('DeepSeek 返回的内容不是有效 JSON。');
        }
    }

    function normalizeOrganizationResult(state, rawResult) {
        const taskPool = getTaskPool(state);
        const taskSet = new Set(taskPool);
        const seenTasks = new Set();
        const tabs = [];
        const pushTask = task => {
            const text = typeof task === 'string' ? task.trim() : '';
            if (!text || !taskSet.has(text) || seenTasks.has(text)) return '';
            seenTasks.add(text);
            return text;
        };

        (Array.isArray(rawResult?.tabs) ? rawResult.tabs : []).forEach(tab => {
            const name = String(tab?.name || '').trim();
            if (!name || /^inbox$/i.test(name)) return;
            const tasks = normalizeTaskList((Array.isArray(tab?.tasks) ? tab.tasks : []).map(pushTask));
            if (tasks.length) tabs.push({ name, tasks });
        });

        const inbox = normalizeTaskList((Array.isArray(rawResult?.inbox) ? rawResult.inbox : []).map(pushTask));
        taskPool.forEach(task => {
            if (!seenTasks.has(task)) inbox.push(task);
        });

        return {
            tabs,
            inbox: normalizeTaskList(inbox),
            summary: String(rawResult?.summary || '').trim()
        };
    }

    function applyOrganization(state, normalizedResult) {
        const criteria = normalizedResult.tabs.map(tab => ({
            id: createMustDoCriterionId(),
            name: tab.name
        }));
        const taskGroups = {};
        const taskOrder = {};

        normalizedResult.inbox.forEach(task => {
            if (!taskOrder[INBOX_ID]) taskOrder[INBOX_ID] = [];
            taskOrder[INBOX_ID].push(task);
        });

        normalizedResult.tabs.forEach((tab, index) => {
            const groupId = criteria[index].id;
            taskOrder[groupId] = [];
            tab.tasks.forEach(task => {
                taskGroups[task] = groupId;
                taskOrder[groupId].push(task);
            });
        });

        state.mustDoCriteria = criteria.length ? criteria : window.EmptyBoxState.cloneDefaultMustDoCriteria();
        state.mustDoTaskGroups = taskGroups;
        state.mustDoTaskOrder = taskOrder;
        state.mustDoHiddenByDate = {};
        state.activeMustDoCriterionId = INBOX_ID;
        if (!criteria.some(tab => tab.id === state.pinnedMustDoCriterionId)) {
            state.pinnedMustDoCriterionId = '';
        }
    }

    async function organizeTasks(state) {
        const result = await requestJson(buildOrganizationPrompt(state));
        return normalizeOrganizationResult(state, result);
    }

    async function rewriteTask(task) {
        const result = await requestJson(buildRewritePrompt(task));
        const text = String(result?.text || '').trim();
        if (!text) throw new Error('DeepSeek 没有返回改写后的任务。');
        return {
            text,
            reason: String(result?.reason || '').trim()
        };
    }

    window.EmptyBoxAI = {
        DEFAULT_MODEL,
        getApiKey,
        setApiKey,
        getModel,
        setModel,
        hasApiKey,
        getTaskPool,
        buildOrganizationPrompt,
        organizeTasks,
        applyOrganization,
        rewriteTask
    };
})();
