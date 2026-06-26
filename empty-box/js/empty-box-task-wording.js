(function () {
    const ABSTRACT_STARTERS = [
        '整理', '研究', '学习', '推进', '处理', '准备', '优化', '看一下', '看看', '了解', '规划', '复盘',
        '跟进', '完善', '思考', '弄一下', '搞一下', '做一下'
    ];
    const ACTION_STARTERS = [
        '打开', '搜索', '复制', '下载', '写下', '发给', '预约', '决定', '拿出', '放进', '列出', '检查',
        '确认', '判断', '限时', '先写', '先列', '新建', '创建', '发送', '联系', '问', '改', '删', '加',
        'open', 'search', 'copy', 'download', 'write', 'send', 'email', 'message', 'call', 'decide',
        'check', 'list', 'create', 'draft', 'review', 'fix', 'update', 'add', 'remove'
    ];
    const EXPLORATION_STARTERS = ['研究', '了解', '看看', '看一下', '试试', '找找', '探索'];
    const TIMEBOX_PATTERN = /(\d+\s*(分钟|小时|分|h|hour|hours|min|mins|minutes)|限时|番茄钟|timer|timebox)/i;
    const QUESTION_PATTERN = /[?？]|^(决定|判断|确认)[:：]/;
    const MONEY_PATTERN = /(要钱|还钱|欠款|欠钱|报销|付款|打款|转账|账单|发票|\d+\s*(元|块|万|美元|人民币))/;
    const WEAK_OBJECTS = ['电脑', '手机', '微信', '邮箱', '文档', '文件', '网页', 'app', '软件', '资料', '材料'];

    function normalize(text) {
        return String(text || '').trim().replace(/\s+/g, ' ');
    }

    function startsWithAny(text, starters) {
        const lower = text.toLowerCase();
        return starters.some(starter => lower.startsWith(starter.toLowerCase()));
    }

    function getMatchingStarter(text, starters) {
        const lower = text.toLowerCase();
        return starters.find(starter => lower.startsWith(starter.toLowerCase())) || '';
    }

    function getActionStarter(text) {
        return getMatchingStarter(text, ACTION_STARTERS);
    }

    function getActionBody(text) {
        const starter = getActionStarter(text);
        return starter ? text.slice(starter.length).trim().replace(/^[:：,，]/, '').trim() : text;
    }

    function hasConcreteObject(text) {
        const body = getActionBody(text);
        if (!body || body.length < 3) return false;
        if (WEAK_OBJECTS.some(item => body.toLowerCase() === item.toLowerCase())) return false;
        return /[\u4e00-\u9fa5]{2,}|[a-z0-9][a-z0-9\s._-]{2,}/i.test(body);
    }

    function hasOutcomeCue(text) {
        return /(先|只|列|写|补|改|发|问|确认|判断|决定|下载|复制|完成|提交|发给|放进|整理到|做到|拿到|找到|选出|\d+\s*(条|个|张|分钟|小时|页|次))/i.test(text) ||
            /\b(first|only|draft|list|send|ask|confirm|decide|finish|submit|copy|download|fix|update)\b/i.test(text);
    }

    function hasConcreteCue(text) {
        return hasConcreteObject(text) && hasOutcomeCue(text);
    }

    function stripAbstractStarter(text) {
        const starter = ABSTRACT_STARTERS.find(item => text.startsWith(item));
        return starter ? text.slice(starter.length).trim().replace(/^[:：,，]/, '').trim() || text : text;
    }

    function createSuggestion(text, type) {
        const value = normalize(text);
        if (!value) return '';

        const contactMatch = value.match(/^给(.+?)(发消息|发微信|打电话|电话|说|问)(.*)$/);
        if (contactMatch) {
            const person = contactMatch[1].trim();
            if (MONEY_PATTERN.test(value)) {
                return `给${person}发微信：确认金额和具体还款时间`;
            }
            return `给${person}发消息：确认一个具体问题和截止时间`;
        }

        if (type === 'exploration') {
            const topic = stripAbstractStarter(value);
            return `限时 30 分钟，只判断「${topic}」是否值得继续`;
        }

        if (type === 'abstract') {
            const topic = stripAbstractStarter(value);
            return `打开相关材料，先完成「${topic}」的第一个小步骤`;
        }

        if (type === 'short') {
            return `打开相关入口，先写下${value}的下一步动作`;
        }

        if (type === 'weak-action') {
            const body = getActionBody(value);
            return body ? `补上对「${body}」要做出的第一个小结果` : '补上要打开/搜索/联系的对象，以及第一小步';
        }

        return `改成：打开/搜索/发给 + 具体对象 + 第一小步`;
    }

    function analyze(text) {
        const value = normalize(text);
        if (!value) return { ok: true, reason: '', suggestion: '' };

        if (QUESTION_PATTERN.test(value)) {
            const questionBody = value.replace(/^(决定|判断|确认)[:：]/, '').trim();
            if (questionBody.length < 6) {
                return {
                    ok: false,
                    reason: '判断题还太空，问题本身需要更具体',
                    suggestion: '写成：决定/判断/确认 + 一个具体选择或具体问题'
                };
            }
            return { ok: true, reason: '判断题写法清楚', suggestion: '' };
        }

        if (startsWithAny(value, EXPLORATION_STARTERS) && !TIMEBOX_PATTERN.test(value)) {
            return {
                ok: false,
                reason: '探索型 item 建议加时间盒',
                suggestion: createSuggestion(value, 'exploration')
            };
        }

        if (startsWithAny(value, ABSTRACT_STARTERS) && !hasConcreteCue(value)) {
            return {
                ok: false,
                reason: '这更像项目标题',
                suggestion: createSuggestion(value, 'abstract')
            };
        }

        if (startsWithAny(value, ACTION_STARTERS) && !hasConcreteCue(value)) {
            return {
                ok: false,
                reason: hasConcreteObject(value) ? '还缺少一个可完成的小结果' : '动作太空，缺少具体对象或入口',
                suggestion: createSuggestion(value, 'weak-action')
            };
        }

        if (!startsWithAny(value, ACTION_STARTERS) && !hasConcreteCue(value)) {
            return {
                ok: false,
                reason: '缺少启动动作，看到它时可能还要重新想第一步',
                suggestion: createSuggestion(value, 'generic')
            };
        }

        if (value.length <= 6 && !startsWithAny(value, ACTION_STARTERS)) {
            return {
                ok: false,
                reason: '描述太短，建议补上具体入口或第一步动作',
                suggestion: createSuggestion(value, 'short')
            };
        }

        return { ok: true, reason: '写法可执行', suggestion: '' };
    }

    function applyToElement(element, text) {
        element.querySelectorAll('.task-wording-badge').forEach(item => item.remove());
        const result = analyze(text);
        element.classList.toggle('task-wording-needs-work', !result.ok);
        if (result.ok) {
            element.removeAttribute('data-wording-hint');
            element.removeAttribute('aria-label');
            element.removeAttribute('tabindex');
            element.removeAttribute('title');
        } else {
            const hint = result.suggestion ? `${result.reason}\n建议：${result.suggestion}` : result.reason;
            element.dataset.wordingHint = hint;
            element.tabIndex = 0;
        }
        return result;
    }

    function formatHint(result) {
        if (!result || result.ok) return '';
        return result.suggestion ? `${result.reason}\n建议：${result.suggestion}` : result.reason;
    }

    function updateInputHint(element, text) {
        if (!element) return;
        const value = normalize(text);
        const result = analyze(value);
        const hint = value ? formatHint(result) : '';
        element.classList.toggle('is-hidden', !hint);
        element.textContent = hint;
        if (hint) {
            element.setAttribute('role', 'note');
        } else {
            element.removeAttribute('role');
        }
    }

    function updateTextBoxHint(element, text) {
        if (!element) return;
        const value = normalize(text);
        const result = analyze(value);
        const hint = value ? formatHint(result) : '';
        element.classList.toggle('task-wording-editing-hint', Boolean(hint));
        element.classList.toggle('is-open', Boolean(hint));
        if (hint) {
            element.dataset.wordingHint = hint;
            element.setAttribute('aria-label', hint);
        } else {
            element.removeAttribute('data-wording-hint');
            element.removeAttribute('aria-label');
        }
    }

    document.addEventListener('click', event => {
        document.querySelectorAll('.task-wording-needs-work.is-open').forEach(item => {
            if (!item.contains(event.target)) item.classList.remove('is-open');
        });
        const target = event.target.closest('.task-wording-needs-work');
        if (!target || target.isContentEditable) return;
        target.focus({ preventScroll: true });
        target.classList.add('is-open');
        event.preventDefault();
        event.stopImmediatePropagation();
    }, true);

    document.addEventListener('focusout', event => {
        const target = event.target.closest?.('.task-wording-needs-work');
        if (target) target.classList.remove('is-open');
    });

    window.EmptyBoxTaskWording = {
        analyze,
        applyToElement,
        updateInputHint,
        updateTextBoxHint
    };
})();
