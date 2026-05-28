const MAX_DEPTH = 4;
const LOOP_W = 1000;
const LOOP_H = 1000;
const stepNames = ["Goals", "Problems", "Diagnosis", "Design", "Doing"];

const STORAGE_KEY = "loopMachine_autosave_v1";
const STORAGE_META_KEY = "loopMachine_autosave_meta_v1";
const SPACE_LIST_KEY = "five-process-spaces-v1";
const CURRENT_SPACE_ID_KEY = "five_process_current_space_id";
const CURRENT_CONTENT_ID_KEY = "five_process_current_content_id";
const CURRENT_STORAGE_MODE_KEY = "five_process_current_storage_mode";
const SUPABASE_URL = "https://ufwvkabshfrrodmtycjj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmd3ZrYWJzaGZycm9kbXR5Y2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjg4NjMsImV4cCI6MjA5NDc0NDg2M30.kSQJBTLSjd5XhLX0cddqjUfSw0QXt-Ilr2UsGPMamIo";
const SAVE_DEBOUNCE_MS = 500;

const world = document.getElementById("world");
const viewport = document.getElementById("viewport");
const minimap = document.getElementById("minimap");
const mmCtx = minimap.getContext("2d");
const saveIndicator = document.getElementById("saveIndicator");
const toast = document.getElementById("toast");
const settingsBtn = document.getElementById("settingsBtn");
const settingsBackdrop = document.getElementById("settingsBackdrop");
const spaceSelect = document.getElementById("spaceSelect");
const contentSelect = document.getElementById("contentSelect");
const renameSpaceBtn = document.getElementById("renameSpaceBtn");
const renameContentBtn = document.getElementById("renameContentBtn");
const migrateSourceSelect = document.getElementById("migrateSourceSelect");
const migrateTargetSelect = document.getElementById("migrateTargetSelect");
const settingsStatus = document.getElementById("settingsStatus");
const nameBackdrop = document.getElementById("nameBackdrop");
const nameDialogTitle = document.getElementById("nameDialogTitle");
const nameInput = document.getElementById("nameInput");
const nameMessage = document.getElementById("nameMessage");
const nameSaveBtn = document.getElementById("nameSaveBtn");
const nameCancelBtn = document.getElementById("nameCancelBtn");

function createEmptyState() {
    return {
        id: "root",
        title: "MAIN MACHINE",
        content: ["", "", "", "", ""],
        children: {},
        x: 0,
        y: 0,
        scale: 1
    };
}

let stateTree = createEmptyState();
let navigationStack = [stateTree];
let activeLegacyMode = false;
let pendingNameAction = null;
let pendingNameValue = "";

let cam = {
    x: 0,
    y: 0,
    zoom: 0.8,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
};

let saveTimer = null;
let toastTimer = null;

function getSystemTheme() {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function applyTheme() {
    document.body.dataset.theme = getSystemTheme();
    drawMiniMap();
}

function showToast(message, duration = 1800) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, duration);
}

function setSaveStatus(status, text) {
    saveIndicator.className = "save-indicator";
    if (status) saveIndicator.classList.add(status);
    saveIndicator.textContent = text;
}

function readJson(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function createId(prefix) {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSupabaseHeaders(extra = {}) {
    return {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        ...extra,
    };
}

async function supabaseRequest(path, options = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        ...options,
        headers: getSupabaseHeaders(options.headers || {}),
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Supabase ${response.status}: ${detail || response.statusText}`);
    }
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

function formatErrorMessage(error) {
    try {
        const detail = JSON.parse(String(error.message).replace(/^Supabase \d+:\s*/, ""));
        return detail.message || detail.details || error.message;
    } catch {
        return error && error.message ? error.message : String(error);
    }
}

function localContentsKey(spaceId) {
    return `${STORAGE_KEY}::space::${spaceId}::contents`;
}

function currentContentKey(spaceId) {
    return `${CURRENT_CONTENT_ID_KEY}::${spaceId}`;
}

function serializeLoop(loop) {
    const steps = {};
    const children = {};
    for (let i = 0; i < stepNames.length; i++) {
        if (loop.content[i]) steps[stepNames[i]] = loop.content[i];
        if (loop.children[i]) children[stepNames[i]] = serializeLoop(loop.children[i]);
    }
    return {
        title: loop.title,
        x: loop.x,
        y: loop.y,
        scale: loop.scale,
        steps,
        children
    };
}

function deserializeLoop(data) {
    const node = {
        id: Math.random().toString(36).slice(2),
        title: data.title || "",
        content: ["", "", "", "", ""],
        children: {},
        x: data.x ?? 0,
        y: data.y ?? 0,
        scale: data.scale ?? 1
    };

    if (data.steps) {
        Object.entries(data.steps).forEach(([k, v]) => {
            const i = stepNames.indexOf(k);
            if (i >= 0) node.content[i] = v;
        });
    }

    if (data.children) {
        Object.entries(data.children).forEach(([k, v]) => {
            const i = stepNames.indexOf(k);
            if (i >= 0) node.children[i] = deserializeLoop(v);
        });
    }

    return node;
}

function createPayloadFromTree(root = stateTree) {
    return {
        version: 1,
        time: Date.now(),
        root: serializeLoop(root)
    };
}

function restorePayload(payload) {
    if (!payload || !payload.root) return false;
    stateTree = deserializeLoop(payload.root);
    stripRuntimeFields(stateTree);
    navigationStack = [stateTree];
    return true;
}

function stripRuntimeFields(node) {
    if (!node) return;
    delete node.dom;
    Object.values(node.children || {}).forEach(stripRuntimeFields);
}

const FiveProcessStorage = {
    getSpaces() {
        const spaces = readJson(SPACE_LIST_KEY, []);
        return Array.isArray(spaces) ? spaces : [];
    },

    saveSpaces(spaces) {
        writeJson(SPACE_LIST_KEY, spaces);
    },

    getCurrentSpace() {
        const currentId = localStorage.getItem(CURRENT_SPACE_ID_KEY);
        return this.getSpaces().find(space => space.id === currentId) || null;
    },

    async setCurrentSpace(spaceId) {
        const space = this.getSpaces().find(item => item.id === spaceId);
        if (!space) return null;
        localStorage.setItem(CURRENT_SPACE_ID_KEY, space.id);
        localStorage.setItem(CURRENT_STORAGE_MODE_KEY, space.storage_mode);
        activeLegacyMode = false;
        return space;
    },

    async syncCloudSpaces() {
        const rows = await supabaseRequest("five_process_spaces?select=id,owner_id,name,storage_mode,created_at&order=created_at.asc");
        const localSpaces = this.getSpaces().filter(space => space.storage_mode !== "cloud_sync");
        const cloudSpaces = (Array.isArray(rows) ? rows : []).filter(space => space.storage_mode === "cloud_sync");
        const merged = [...localSpaces, ...cloudSpaces].sort((a, b) => String(a.created_at || "").localeCompare(String(b.created_at || "")));
        this.saveSpaces(merged);
        return merged;
    },

    async createSpace(name, storageMode) {
        const now = new Date().toISOString();
        const space = {
            id: createId("five-space"),
            owner_id: null,
            name: name || (storageMode === "cloud_sync" ? "Cloud Space" : "Local Space"),
            storage_mode: storageMode,
            created_at: now
        };
        if (storageMode === "cloud_sync") {
            await supabaseRequest("five_process_spaces", {
                method: "POST",
                body: JSON.stringify(space)
            });
        }
        this.saveSpaces([...this.getSpaces().filter(item => item.id !== space.id), space]);
        await this.setCurrentSpace(space.id);
        return space;
    },

    async renameSpace(spaceId, name) {
        const nextName = String(name || "").trim();
        if (!nextName) throw new Error("Space name cannot be empty.");

        const space = this.getSpaces().find(item => item.id === spaceId);
        if (!space) throw new Error("Space was not found.");

        if (space.storage_mode === "cloud_sync") {
            await supabaseRequest(`five_process_spaces?id=eq.${encodeURIComponent(space.id)}`, {
                method: "PATCH",
                body: JSON.stringify({ name: nextName })
            });
        }

        this.saveSpaces(this.getSpaces().map(item => item.id === space.id ? { ...item, name: nextName } : item));
        return { ...space, name: nextName };
    },

    getCurrentContentId(spaceId) {
        return localStorage.getItem(currentContentKey(spaceId));
    },

    setCurrentContentId(spaceId, contentId) {
        localStorage.setItem(currentContentKey(spaceId), contentId);
    },

    async getContents(space) {
        if (!space) return [];
        if (space.storage_mode === "cloud_sync") {
            const rows = await supabaseRequest(`five_process_contents?space_id=eq.${encodeURIComponent(space.id)}&select=id,space_id,owner_id,title,content,created_at,updated_at&order=updated_at.desc`);
            return Array.isArray(rows) ? rows : [];
        }
        const contents = readJson(localContentsKey(space.id), []);
        return Array.isArray(contents) ? contents : [];
    },

    async saveLocalContents(space, contents) {
        if (space.storage_mode === "local_only") writeJson(localContentsKey(space.id), contents);
    },

    async createContent(space, title, payload = createPayloadFromTree()) {
        const now = new Date().toISOString();
        const nextTitle = title || payload.root?.title || "MAIN MACHINE";
        const nextPayload = {
            ...payload,
            root: {
                ...payload.root,
                title: nextTitle
            }
        };
        const item = {
            id: createId("five-content"),
            space_id: space.id,
            owner_id: null,
            title: nextTitle,
            content: nextPayload,
            created_at: now,
            updated_at: now
        };
        if (space.storage_mode === "cloud_sync") {
            await supabaseRequest("five_process_contents", {
                method: "POST",
                body: JSON.stringify(item)
            });
        } else {
            const contents = await this.getContents(space);
            contents.unshift(item);
            await this.saveLocalContents(space, contents);
        }
        this.setCurrentContentId(space.id, item.id);
        return item;
    },

    async copyContentToSpace(targetSpace, sourceContent) {
        if (!targetSpace) throw new Error("Target space was not found.");
        if (!sourceContent) throw new Error("Source content was not found.");

        const now = new Date().toISOString();
        const title = sourceContent.title || sourceContent.content?.root?.title || "MAIN MACHINE";
        const payload = {
            ...sourceContent.content,
            root: {
                ...sourceContent.content?.root,
                title
            }
        };
        const item = {
            id: createId("five-content"),
            space_id: targetSpace.id,
            owner_id: null,
            title,
            content: payload,
            created_at: now,
            updated_at: now
        };

        if (targetSpace.storage_mode === "cloud_sync") {
            await supabaseRequest("five_process_contents", {
                method: "POST",
                body: JSON.stringify(item)
            });
        } else {
            const contents = await this.getContents(targetSpace);
            contents.unshift(item);
            await this.saveLocalContents(targetSpace, contents);
        }
        return item;
    },

    async renameContent(space, contentId, title) {
        const nextTitle = String(title || "").trim();
        if (!nextTitle) throw new Error("Content name cannot be empty.");
        if (!space) throw new Error("Create a space first.");

        const item = (await this.getContents(space)).find(content => content.id === contentId);
        if (!item) throw new Error("Content was not found.");

        const nextContent = {
            ...item.content,
            root: {
                ...item.content?.root,
                title: nextTitle
            }
        };
        const patch = {
            title: nextTitle,
            content: nextContent,
            updated_at: new Date().toISOString()
        };

        if (space.storage_mode === "cloud_sync") {
            await supabaseRequest(`five_process_contents?id=eq.${encodeURIComponent(item.id)}`, {
                method: "PATCH",
                body: JSON.stringify(patch)
            });
        } else {
            const contents = await this.getContents(space);
            await this.saveLocalContents(space, contents.map(content => content.id === item.id
                ? { ...content, ...patch }
                : content));
        }

        return { ...item, ...patch };
    },

    async getCurrentContent(space) {
        const contents = await this.getContents(space);
        let item = contents.find(content => content.id === this.getCurrentContentId(space.id));
        if (!item) item = contents[0] || null;
        if (item) this.setCurrentContentId(space.id, item.id);
        return item;
    },

    async saveCurrentContent(payload = createPayloadFromTree()) {
        const space = this.getCurrentSpace();
        if (!space || activeLegacyMode) {
            writeJson(STORAGE_KEY, payload);
            writeJson(STORAGE_META_KEY, { savedAt: payload.time, title: payload.root?.title || "MAIN MACHINE" });
            return;
        }
        let item = await this.getCurrentContent(space);
        if (!item) {
            await this.createContent(space, payload.root?.title || "MAIN MACHINE", payload);
            return;
        }
        const now = new Date().toISOString();
        if (space.storage_mode === "cloud_sync") {
            await supabaseRequest(`five_process_contents?id=eq.${encodeURIComponent(item.id)}`, {
                method: "PATCH",
                body: JSON.stringify({ title: payload.root?.title || item.title, content: payload, updated_at: now })
            });
        } else {
            const contents = await this.getContents(space);
            await this.saveLocalContents(space, contents.map(content => content.id === item.id
                ? { ...content, title: payload.root?.title || content.title, content: payload, updated_at: now }
                : content));
        }
    },

    async loadCurrentContent() {
        const space = this.getCurrentSpace();
        if (!space) return null;
        const item = await this.getCurrentContent(space);
        if (!item) return null;
        return {
            ...item.content,
            root: {
                ...item.content?.root,
                title: item.title || item.content?.root?.title || "MAIN MACHINE"
            }
        };
    },

    async deleteCurrentContent() {
        const space = this.getCurrentSpace();
        const item = space ? await this.getCurrentContent(space) : null;
        if (!space || !item) return;
        if (space.storage_mode === "cloud_sync") {
            await supabaseRequest(`five_process_contents?id=eq.${encodeURIComponent(item.id)}`, { method: "DELETE" });
        } else {
            await this.saveLocalContents(space, (await this.getContents(space)).filter(content => content.id !== item.id));
        }
        localStorage.removeItem(currentContentKey(space.id));
    },

    async deleteCurrentSpace() {
        const space = this.getCurrentSpace();
        if (!space) return;
        if (space.storage_mode === "cloud_sync") {
            await supabaseRequest(`five_process_contents?space_id=eq.${encodeURIComponent(space.id)}`, { method: "DELETE" });
            await supabaseRequest(`five_process_spaces?id=eq.${encodeURIComponent(space.id)}`, { method: "DELETE" });
        } else {
            localStorage.removeItem(localContentsKey(space.id));
        }
        this.saveSpaces(this.getSpaces().filter(item => item.id !== space.id));
        localStorage.removeItem(CURRENT_SPACE_ID_KEY);
        localStorage.removeItem(CURRENT_STORAGE_MODE_KEY);
    }
};

function autoSave(immediate = false) {
    const doSave = () => {
        try {
            const payload = createPayloadFromTree();
            FiveProcessStorage.saveCurrentContent(payload).catch(err => {
                console.error("Cloud save failed:", err);
                setSaveStatus("error", "Cloud save failed");
            });

            const savedTime = new Date(payload.time).toLocaleTimeString();
            setSaveStatus("saved", `Saved ✓ ${savedTime}`);
        } catch (err) {
            console.error("AutoSave failed:", err);
            setSaveStatus("error", "Save failed");
        }
    };

    clearTimeout(saveTimer);
    setSaveStatus("saving", "Saving...");

    if (immediate) {
        doSave();
    } else {
        saveTimer = setTimeout(doSave, SAVE_DEBOUNCE_MS);
    }
}

function tryRestore() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    try {
        const data = JSON.parse(saved);
        if (!data || !data.root) return false;

        stateTree = deserializeLoop(data.root);
        stripRuntimeFields(stateTree);
        navigationStack = [stateTree];

        const savedAt = data.time ? new Date(data.time).toLocaleString() : "未知时间";
        setSaveStatus("saved", "Recovered ✓");
        showToast(`已恢复上次缓存（${savedAt}）`, 2200);
        return true;
    } catch (err) {
        console.error("Restore failed:", err);
        setSaveStatus("error", "Restore failed");
        return false;
    }
}

function clearAutoSave() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_META_KEY);
    setSaveStatus("", "Cache cleared");
    showToast("本地缓存已清除");
}

function clearCanvas() {
    const ok = confirm("确定要清空当前画布吗？此操作会同时清除本地自动保存缓存。");
    if (!ok) return;

    stateTree = createEmptyState();
    navigationStack = [stateTree];
    world.innerHTML = "";

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_META_KEY);

    setSaveStatus("", "Cleared");
    renderAll(true);
    showToast("画布已清空");
}

function collectAllLoops(root) {
    let arr = [root];
    Object.values(root.children).forEach(c => arr.push(...collectAllLoops(c)));
    return arr;
}

function updateWorld() {
    world.style.transform = `translate(${cam.x}px, ${cam.y}px) scale(${cam.zoom})`;
}

function renderAll(animate = true) {
    const current = navigationStack[navigationStack.length - 1];
    const allLoops = collectAllLoops(stateTree);

    allLoops.forEach(l => {
        if (l.dom) l.dom.style.display = "none";
    });

    drawLoop(current);
    if (current.dom) current.dom.style.display = "block";

    if (navigationStack.length > 1) {
        const parent = navigationStack[navigationStack.length - 2];
        drawLoop(parent);
        if (parent.dom) parent.dom.style.display = "block";
    }

    Object.values(current.children).forEach(child => {
        drawLoop(child);
        if (child.dom) child.dom.style.display = "block";
    });

    document.getElementById("current-title").innerText = current.title;
    document.getElementById("level-idx").innerText = navigationStack.length - 1;
    document.getElementById("backBtn").style.visibility = navigationStack.length > 1 ? "visible" : "hidden";

    if (animate) {
        cam.zoom = 1 / current.scale;
        cam.x = window.innerWidth / 2 - (current.x + 0.5 * LOOP_W * current.scale) * cam.zoom;
        cam.y = window.innerHeight / 2 - (current.y + 0.5 * LOOP_H * current.scale) * cam.zoom;
        world.style.transition = "transform 0.8s cubic-bezier(.85,0,.15,1)";
    } else {
        world.style.transition = "none";
    }

    updateWorld();
    drawMiniMap();
}

function showGlobalMap() {
    const allLoops = collectAllLoops(stateTree);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    allLoops.forEach(l => {
        minX = Math.min(minX, l.x);
        minY = Math.min(minY, l.y);
        maxX = Math.max(maxX, l.x + LOOP_W * l.scale);
        maxY = Math.max(maxY, l.y + LOOP_H * l.scale);
    });

    const worldWidth = maxX - minX;
    const worldHeight = maxY - minY;
    const scaleX = window.innerWidth / worldWidth;
    const scaleY = window.innerHeight / worldHeight;
    const targetZoom = Math.min(scaleX, scaleY) * 0.95;

    cam.zoom = targetZoom;
    cam.x = window.innerWidth / 2 - (minX + worldWidth / 2) * cam.zoom;
    cam.y = window.innerHeight / 2 - (minY + worldHeight / 2) * cam.zoom;

    world.style.transition = "transform 0.8s cubic-bezier(0.85,0,0.15,1)";
    updateWorld();
    drawMiniMap();
}

function drawLoop(data) {
    if (data.dom) {
        data.dom.style.left = `${data.x}px`;
        data.dom.style.top = `${data.y}px`;
        data.dom.style.transform = `scale(${data.scale})`;
        const title = data.dom.querySelector(".center-evolution h1");
        if (title) title.textContent = data.title;
        return;
    }

    const layer = document.createElement("div");
    layer.className = "canvas-layer";
    layer.style.cssText = `left:${data.x}px;top:${data.y}px;transform:scale(${data.scale});transform-origin:0 0;`;
    data.dom = layer;

    layer.innerHTML = `
        <svg width="1000" height="1000" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <marker id="arrowhead" markerWidth="15" markerHeight="10" refX="0" refY="5" orient="auto">
                    <polygon points="0 0,15 5,0 10" fill="var(--primary)" />
                </marker>
            </defs>
            <g transform="translate(360,380) scale(0.4,-0.4) translate(-1100,-1000)" fill="var(--muted)">
                <path d="M2060 1729 c-218 -157 -435 -336 -589 -486 l-104 -102 -67 -10 c-194 -30 -431 -146 -632 -307 -81 -65 -228 -211 -228 -226 0 -6 25 16 55 50 165 182 430 357 653 432 82 27 202 53 202 42 0 -2 -22 -35 -50 -72 -158 -213 -212 -461 -134 -616 42 -84 88 -117 170 -122 59 -4 72 -1 138 32 130 64 246 217 277 363 15 74 6 189 -19 245 -50 113 -173 187 -315 188 -31 1 -30 3 74 104 155 151 461 400 649 528 14 9 21 17 15 17 -5 0 -48 -27 -95 -60z m-506 -625 c63 -22 138 -92 165 -155 66 -153 19 -347 -121 -494 -135 -143 -283 -175 -378 -82 -144 140 -82 479 133 724 31 35 32 35 93 29 34 -3 82 -13 108 -22z"/>
            </g>
        </svg>
        <div class="center-evolution"><h1>${escapeHtml(data.title)}</h1></div>
    `;

    const N = stepNames.length;
    const radiusX = LOOP_W * 0.3;
    const radiusY = LOOP_H * 0.3;

    stepNames.forEach((name, i) => {
        const mappedI = i === 0 ? 4 : (i === 4 ? 0 : i);
        const angle = 2 * Math.PI * mappedI / N - Math.PI / 2;
        const cx = 0.5 * LOOP_W + radiusX * Math.cos(angle);
        const cy = 0.5 * LOOP_H + radiusY * Math.sin(angle);

        const node = document.createElement("div");
        node.className = "step-node";
        node.style.left = `${cx}px`;
        node.style.top = `${cy}px`;

        node.innerHTML = `
            <div class="step-label">${i + 1}. ${name}</div>
            <textarea placeholder="Details..."></textarea>
            <button class="expand-btn" ${navigationStack.length >= MAX_DEPTH ? "disabled" : ""}>EXPAND LOOP ↘</button>
        `;

        const ta = node.querySelector("textarea");
        ta.value = data.content[i] || "";

        ta.oninput = (e) => {
            data.content[i] = e.target.value;
            ta.style.height = "auto";
            ta.style.height = ta.scrollHeight + "px";
            autoSave(false);
        };

        ta.onblur = () => autoSave(true);

        ta.style.height = "auto";
        ta.style.height = ta.scrollHeight + "px";

        node.querySelector("button").onclick = (e) => {
            e.stopPropagation();
            drillDown(data, i, angle);
        };

        layer.appendChild(node);
    });

    world.appendChild(layer);
}

function drillDown(p, idx, angle) {
    if (navigationStack.length >= MAX_DEPTH) return;

    if (!p.children[idx]) {
        const title = (p.content[idx] || stepNames[idx]).toUpperCase();
        const CHILD_SCALE = p.scale * 0.1;
        const parentCenterX = p.x + 0.5 * LOOP_W * p.scale;
        const parentCenterY = p.y + 0.5 * LOOP_H * p.scale;
        const parentRadius = Math.max(LOOP_W, LOOP_H) * p.scale * 0.45;
        const childRadius = Math.max(LOOP_W, LOOP_H) * CHILD_SCALE * 0.45;
        const baseDistance = parentRadius + childRadius + 40;

        let childCenterX = parentCenterX + Math.cos(angle) * baseDistance;
        let childCenterY = parentCenterY + Math.sin(angle) * baseDistance;

        Object.values(p.children).forEach(sib => {
            const sx = sib.x + 0.5 * LOOP_W * sib.scale;
            const sy = sib.y + 0.5 * LOOP_H * sib.scale;
            const dist = Math.hypot(childCenterX - sx, childCenterY - sy);
            const minGap = 120;
            if (dist < minGap) {
                const push = minGap - dist;
                childCenterX += ((childCenterX - sx) / (dist || 1)) * push;
                childCenterY += ((childCenterY - sy) / (dist || 1)) * push;
            }
        });

        const childX = childCenterX - 0.5 * LOOP_W * CHILD_SCALE;
        const childY = childCenterY - 0.5 * LOOP_H * CHILD_SCALE;

        p.children[idx] = {
            id: Math.random().toString(36).slice(2),
            title,
            content: ["", "", "", "", ""],
            children: {},
            x: childX,
            y: childY,
            scale: CHILD_SCALE,
            animFrom: { x: parentCenterX, y: parentCenterY }
        };

        autoSave(false);
    }

    navigationStack.push(p.children[idx]);
    renderAll(true);
    autoSave(false);
}

function goBack() {
    if (navigationStack.length > 1) {
        navigationStack.pop();
        renderAll(true);
        autoSave(false);
    }
}

function resetView() {
    renderAll(true);
}

function zoom(factor) {
    const viewportCenterX = viewport.clientWidth / 2;
    const viewportCenterY = viewport.clientHeight / 2;
    const worldX = (viewportCenterX - cam.x) / cam.zoom;
    const worldY = (viewportCenterY - cam.y) / cam.zoom;
    cam.zoom *= factor;
    cam.x = viewportCenterX - worldX * cam.zoom;
    cam.y = viewportCenterY - worldY * cam.zoom;
    updateWorld();
    drawMiniMap();
}

function getBounds() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    navigationStack.forEach(l => {
        minX = Math.min(minX, l.x);
        minY = Math.min(minY, l.y);
        maxX = Math.max(maxX, l.x + LOOP_W * l.scale);
        maxY = Math.max(maxY, l.y + LOOP_H * l.scale);
    });

    if (!isFinite(minX)) return null;
    return { minX, minY, maxX, maxY };
}

function drawMiniMap() {
    const w = minimap.width = minimap.clientWidth;
    const h = minimap.height = minimap.clientHeight;
    const styles = getComputedStyle(document.body);
    const mutedColor = styles.getPropertyValue("--muted").trim() || "#888";
    const primaryColor = styles.getPropertyValue("--primary").trim() || "#ff4d4d";

    mmCtx.clearRect(0, 0, w, h);

    const b = getBounds();
    if (!b) return;

    const worldW = b.maxX - b.minX;
    const worldH = b.maxY - b.minY;
    const scale = Math.min(w / worldW, h / worldH) * 0.9;
    const offsetX = (w - worldW * scale) / 2;
    const offsetY = (h - worldH * scale) / 2;

    navigationStack.forEach(l => {
        mmCtx.strokeStyle = mutedColor;
        mmCtx.lineWidth = 1;
        mmCtx.strokeRect(
            offsetX + (l.x - b.minX) * scale,
            offsetY + (l.y - b.minY) * scale,
            LOOP_W * l.scale * scale,
            LOOP_H * l.scale * scale
        );
    });

    const viewLeft = (-cam.x) / cam.zoom;
    const viewTop = (-cam.y) / cam.zoom;
    const viewW = viewport.clientWidth / cam.zoom;
    const viewH = viewport.clientHeight / cam.zoom;

    mmCtx.strokeStyle = primaryColor;
    mmCtx.lineWidth = 2;
    mmCtx.strokeRect(
        offsetX + (viewLeft - b.minX) * scale,
        offsetY + (viewTop - b.minY) * scale,
        viewW * scale,
        viewH * scale
    );
}

function exportMarkdownDFS() {
    function loopToMarkdownDFS(loop, level = 0) {
        let md = `${"#".repeat(level + 1)} ${loop.title}\n\n`;
        for (let i = 0; i < stepNames.length; i++) {
            if (loop.content[i]) {
                md += `**${i + 1}. ${stepNames[i]}**\n\n${loop.content[i]}\n\n`;
            }
            if (loop.children[i]) {
                md += loopToMarkdownDFS(loop.children[i], level + 1);
            }
        }
        return md;
    }

    const blob = new Blob([loopToMarkdownDFS(stateTree)], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "loops.md";
    a.click();
    URL.revokeObjectURL(a.href);
}

function exportJSON() {
    const json = JSON.stringify({
        version: 1,
        exportTime: Date.now(),
        root: serializeLoop(stateTree)
    }, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "loops.json";
    a.click();
    URL.revokeObjectURL(a.href);
}

function parseJSON(jsonText) {
    let data;
    try {
        data = JSON.parse(jsonText);
    } catch (e) {
        alert("Invalid JSON");
        return;
    }

    if (!data?.root) {
        alert("Invalid JSON structure");
        return;
    }

    stateTree = deserializeLoop(data.root);
    stripRuntimeFields(stateTree);
    navigationStack = [stateTree];
    world.innerHTML = "";
    renderAll(true);
    autoSave(true);
    showToast("JSON 已导入并写入本地缓存");
}

function openSettings() {
    renderSettings().catch(err => {
        console.error(err);
        settingsStatus.textContent = formatErrorMessage(err);
    });
    settingsBackdrop.classList.add("open");
    FiveProcessStorage.syncCloudSpaces().then(renderSettings).catch(() => { });
}

function closeSettings() {
    settingsBackdrop.classList.remove("open");
}

function openNameDialog(title, action, initialValue = "") {
    pendingNameAction = action;
    pendingNameValue = initialValue;
    nameDialogTitle.textContent = title;
    nameInput.value = initialValue;
    nameMessage.textContent = "";
    nameBackdrop.classList.add("open");
    setTimeout(() => {
        nameInput.focus();
        if (initialValue) nameInput.select();
    }, 0);
}

function closeNameDialog() {
    nameBackdrop.classList.remove("open");
    nameMessage.textContent = "";
    pendingNameAction = null;
    pendingNameValue = "";
}

async function renderSettings() {
    const spaces = FiveProcessStorage.getSpaces();
    const currentSpace = FiveProcessStorage.getCurrentSpace();
    const contents = currentSpace ? await FiveProcessStorage.getContents(currentSpace) : [];
    const currentContent = currentSpace ? await FiveProcessStorage.getCurrentContent(currentSpace) : null;

    spaceSelect.innerHTML = "";
    contentSelect.innerHTML = "";
    migrateSourceSelect.innerHTML = "";
    migrateTargetSelect.innerHTML = "";

    if (!spaces.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = activeLegacyMode ? "Legacy local data" : "No space";
        spaceSelect.appendChild(option);
    }

    spaces.forEach(space => {
        const option = document.createElement("option");
        option.value = space.id;
        option.textContent = `${space.name} · ${space.storage_mode === "cloud_sync" ? "Cloud" : "Local"}`;
        option.selected = currentSpace && currentSpace.id === space.id;
        spaceSelect.appendChild(option);
    });

    if (!contents.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "No content";
        contentSelect.appendChild(option);
    }

    contents.forEach(content => {
        const option = document.createElement("option");
        option.value = content.id;
        option.textContent = content.title || "MAIN MACHINE";
        option.selected = currentContent && currentContent.id === content.id;
        contentSelect.appendChild(option);
    });

    spaces.forEach(space => {
        const source = document.createElement("option");
        source.value = space.id;
        source.textContent = `${space.name} · ${space.storage_mode === "cloud_sync" ? "Cloud" : "Local"}`;
        source.selected = currentSpace && currentSpace.id === space.id;
        migrateSourceSelect.appendChild(source);

        const target = document.createElement("option");
        target.value = space.id;
        target.textContent = source.textContent;
        target.selected = currentSpace && currentSpace.id !== space.id;
        migrateTargetSelect.appendChild(target);
    });

    if (spaces.length > 1 && migrateSourceSelect.value === migrateTargetSelect.value) {
        const fallbackTarget = spaces.find(space => space.id !== migrateSourceSelect.value);
        if (fallbackTarget) migrateTargetSelect.value = fallbackTarget.id;
    }

    const localCount = spaces.filter(space => space.storage_mode === "local_only").length;
    const cloudCount = spaces.filter(space => space.storage_mode === "cloud_sync").length;
    settingsStatus.textContent = `${currentSpace ? currentSpace.name : "Legacy"} · ${currentSpace?.storage_mode === "cloud_sync" ? "Cloud sync" : "Local"} · ${contents.length} contents · Local ${localCount} / Cloud ${cloudCount}`;
    renameSpaceBtn.disabled = !currentSpace;
    renameContentBtn.disabled = !currentContent;
    document.getElementById("migrateContentBtn").disabled = spaces.length < 2;
}

async function switchSpace(spaceId) {
    await autoSaveCurrentNow();
    await FiveProcessStorage.setCurrentSpace(spaceId);
    const payload = await FiveProcessStorage.loadCurrentContent();
    if (payload) restorePayload(payload);
    else {
        stateTree = createEmptyState();
        navigationStack = [stateTree];
    }
    world.innerHTML = "";
    renderAll(true);
    resetView();
    await renderSettings();
}

async function switchContent(contentId) {
    const space = FiveProcessStorage.getCurrentSpace();
    if (!space || !contentId) return;
    await autoSaveCurrentNow();
    FiveProcessStorage.setCurrentContentId(space.id, contentId);
    const payload = await FiveProcessStorage.loadCurrentContent();
    if (payload) restorePayload(payload);
    world.innerHTML = "";
    renderAll(true);
    resetView();
    await renderSettings();
}

async function autoSaveCurrentNow() {
    await FiveProcessStorage.saveCurrentContent(createPayloadFromTree());
}

async function handleNameSave() {
    const name = nameInput.value.trim();
    try {
        if (pendingNameAction === "localSpace") {
            const space = await FiveProcessStorage.createSpace(name || "Local Space", "local_only");
            await FiveProcessStorage.createContent(space, stateTree.title || "MAIN MACHINE", createPayloadFromTree());
        } else if (pendingNameAction === "cloudSpace") {
            const space = await FiveProcessStorage.createSpace(name || "Cloud Space", "cloud_sync");
            await FiveProcessStorage.createContent(space, stateTree.title || "MAIN MACHINE", createPayloadFromTree());
        } else if (pendingNameAction === "renameSpace") {
            const space = FiveProcessStorage.getCurrentSpace();
            if (!space) throw new Error("Create a space first.");
            await FiveProcessStorage.renameSpace(space.id, name || pendingNameValue);
        } else if (pendingNameAction === "content") {
            const space = FiveProcessStorage.getCurrentSpace();
            if (!space) throw new Error("Create a space first.");
            stateTree = createEmptyState();
            stateTree.title = name || "MAIN MACHINE";
            navigationStack = [stateTree];
            await FiveProcessStorage.createContent(space, stateTree.title, createPayloadFromTree());
            world.innerHTML = "";
            renderAll(true);
            resetView();
        } else if (pendingNameAction === "duplicate") {
            const space = FiveProcessStorage.getCurrentSpace();
            if (!space) throw new Error("Create a space first.");
            const duplicateTitle = name || `${stateTree.title || "MAIN MACHINE"} Copy`;
            const duplicated = createPayloadFromTree();
            duplicated.root.title = duplicateTitle;
            await FiveProcessStorage.createContent(space, duplicateTitle, duplicated);
            stateTree.title = duplicateTitle;
            stripRuntimeFields(stateTree);
            world.innerHTML = "";
            renderAll(true);
            resetView();
        } else if (pendingNameAction === "renameContent") {
            const space = FiveProcessStorage.getCurrentSpace();
            if (!space) throw new Error("Create a space first.");
            const current = await FiveProcessStorage.getCurrentContent(space);
            if (!current) throw new Error("No content selected.");
            const nextName = name || pendingNameValue;
            await FiveProcessStorage.renameContent(space, current.id, nextName);
            stateTree.title = nextName;
            stripRuntimeFields(stateTree);
            world.innerHTML = "";
            renderAll(true);
            autoSave(false);
        }
        closeNameDialog();
        await renderSettings();
        showToast("Saved");
    } catch (error) {
        console.error(error);
        nameMessage.textContent = formatErrorMessage(error);
    }
}

async function deleteCurrentContent() {
    if (!confirm("Delete current content?")) return;
    await FiveProcessStorage.deleteCurrentContent();
    const payload = await FiveProcessStorage.loadCurrentContent();
    if (payload) restorePayload(payload);
    else {
        stateTree = createEmptyState();
        navigationStack = [stateTree];
    }
    world.innerHTML = "";
    renderAll(true);
    resetView();
    await renderSettings();
}

async function deleteCurrentSpace() {
    const space = FiveProcessStorage.getCurrentSpace();
    if (!space || !confirm(`Delete space "${space.name}"?`)) return;
    await FiveProcessStorage.deleteCurrentSpace();
    stateTree = createEmptyState();
    navigationStack = [stateTree];
    world.innerHTML = "";
    renderAll(true);
    resetView();
    await renderSettings();
}

async function openRenameSpaceDialog() {
    const space = FiveProcessStorage.getCurrentSpace();
    if (!space) {
        settingsStatus.textContent = "No space selected.";
        return;
    }
    openNameDialog("Rename Space", "renameSpace", space.name);
}

async function openRenameContentDialog() {
    const space = FiveProcessStorage.getCurrentSpace();
    const content = space ? await FiveProcessStorage.getCurrentContent(space) : null;
    if (!content) {
        settingsStatus.textContent = "No content selected.";
        return;
    }
    openNameDialog("Rename Content", "renameContent", content.title || stateTree.title || "MAIN MACHINE");
}

async function migrateSpaceCopy() {
    const sourceId = migrateSourceSelect.value;
    const targetId = migrateTargetSelect.value;
    const spaces = FiveProcessStorage.getSpaces();
    const sourceSpace = spaces.find(space => space.id === sourceId);
    const targetSpace = spaces.find(space => space.id === targetId);
    if (!sourceSpace || !targetSpace) {
        settingsStatus.textContent = "Choose source and target spaces.";
        return;
    }
    if (sourceId === targetId) {
        settingsStatus.textContent = "Source and target must be different.";
        return;
    }

    await autoSaveCurrentNow();
    const sourceContents = await FiveProcessStorage.getContents(sourceSpace);
    if (!sourceContents.length) {
        settingsStatus.textContent = "Source space has no contents.";
        return;
    }

    for (const content of sourceContents) {
        await FiveProcessStorage.copyContentToSpace(targetSpace, content);
    }

    await renderSettings();
    settingsStatus.textContent = `Copied ${sourceContents.length} contents from "${sourceSpace.name}" to "${targetSpace.name}".`;
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

viewport.addEventListener("mousedown", e => {
    if (e.target.closest(".step-node")) return;
    cam.isDragging = true;
    cam.lastMouseX = e.clientX;
    cam.lastMouseY = e.clientY;
    document.body.style.userSelect = "none";
});

window.addEventListener("mousemove", e => {
    if (!cam.isDragging) return;

    cam.x += e.clientX - cam.lastMouseX;
    cam.y += e.clientY - cam.lastMouseY;
    cam.lastMouseX = e.clientX;
    cam.lastMouseY = e.clientY;

    updateWorld();
    drawMiniMap();
});

window.addEventListener("mouseup", () => {
    cam.isDragging = false;
    document.body.style.userSelect = "";
});

viewport.addEventListener("wheel", e => {
    e.preventDefault();

    const zoomIntensity = 0.0015;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const worldX = (mouseX - cam.x) / cam.zoom;
    const worldY = (mouseY - cam.y) / cam.zoom;

    cam.zoom *= Math.exp(-e.deltaY * zoomIntensity);
    cam.zoom = Math.min(Math.max(cam.zoom, 0.05), 10);

    cam.x = mouseX - worldX * cam.zoom;
    cam.y = mouseY - worldY * cam.zoom;

    updateWorld();
    drawMiniMap();
}, { passive: false });

minimap.addEventListener("click", e => {
    const rect = minimap.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const b = getBounds();
    if (!b) return;

    const worldW = b.maxX - b.minX;
    const worldH = b.maxY - b.minY;
    const scale = Math.min(minimap.width / worldW, minimap.height / worldH) * 0.9;
    const offsetX = (minimap.width - worldW * scale) / 2;
    const offsetY = (minimap.height - worldH * scale) / 2;

    const worldX = (mx - offsetX) / scale + b.minX;
    const worldY = (my - offsetY) / scale + b.minY;

    cam.x = viewport.clientWidth / 2 - worldX * cam.zoom;
    cam.y = viewport.clientHeight / 2 - worldY * cam.zoom;

    updateWorld();
    drawMiniMap();
});

document.getElementById("importInput").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => parseJSON(ev.target.result);
    reader.readAsText(file);

    e.target.value = "";
});

window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
    applyTheme();
});
document.getElementById("exportMDBtn").addEventListener("click", exportMarkdownDFS);
document.getElementById("exportJSONSettingsBtn").addEventListener("click", exportJSON);
document.getElementById("importJSONBtn").addEventListener("click", () => document.getElementById("importInput").click());
document.getElementById("clearCanvasBtn").addEventListener("click", clearCanvas);
document.getElementById("clearCacheBtn").addEventListener("click", clearAutoSave);
settingsBtn.addEventListener("click", openSettings);
document.getElementById("closeSettingsBtn").addEventListener("click", closeSettings);
document.getElementById("refreshCloudSpacesBtn").addEventListener("click", async () => {
    try {
        settingsStatus.textContent = "Refreshing cloud spaces...";
        await FiveProcessStorage.syncCloudSpaces();
        await renderSettings();
    } catch (error) {
        settingsStatus.textContent = `Refresh failed: ${formatErrorMessage(error)}`;
    }
});
document.getElementById("newLocalSpaceBtn").addEventListener("click", () => openNameDialog("New Local Space", "localSpace"));
document.getElementById("newCloudSpaceBtn").addEventListener("click", () => openNameDialog("New Cloud Space", "cloudSpace"));
renameSpaceBtn.addEventListener("click", () => {
    openRenameSpaceDialog().catch(error => {
        console.error(error);
        settingsStatus.textContent = `Rename failed: ${formatErrorMessage(error)}`;
    });
});
document.getElementById("newContentBtn").addEventListener("click", () => openNameDialog("New Content", "content"));
renameContentBtn.addEventListener("click", () => {
    openRenameContentDialog().catch(error => {
        console.error(error);
        settingsStatus.textContent = `Rename failed: ${formatErrorMessage(error)}`;
    });
});
document.getElementById("duplicateContentBtn").addEventListener("click", () => openNameDialog("Duplicate Content", "duplicate"));
document.getElementById("deleteContentBtn").addEventListener("click", () => {
    deleteCurrentContent().catch(error => {
        console.error(error);
        settingsStatus.textContent = `Delete failed: ${formatErrorMessage(error)}`;
    });
});
document.getElementById("deleteSpaceBtn").addEventListener("click", () => {
    deleteCurrentSpace().catch(error => {
        console.error(error);
        settingsStatus.textContent = `Delete failed: ${formatErrorMessage(error)}`;
    });
});
document.getElementById("migrateContentBtn").addEventListener("click", () => {
    migrateSpaceCopy().catch(error => {
        console.error(error);
        settingsStatus.textContent = `Migration failed: ${formatErrorMessage(error)}`;
    });
});

spaceSelect.addEventListener("change", () => {
    if (spaceSelect.value) switchSpace(spaceSelect.value).catch(error => {
        settingsStatus.textContent = `Switch failed: ${formatErrorMessage(error)}`;
    });
});
contentSelect.addEventListener("change", () => {
    if (contentSelect.value) switchContent(contentSelect.value).catch(error => {
        settingsStatus.textContent = `Switch failed: ${formatErrorMessage(error)}`;
    });
});
nameSaveBtn.addEventListener("click", handleNameSave);
nameCancelBtn.addEventListener("click", closeNameDialog);
nameInput.addEventListener("keydown", e => {
    if (e.key === "Enter") handleNameSave();
    if (e.key === "Escape") closeNameDialog();
});
settingsBackdrop.addEventListener("click", e => {
    if (e.target === settingsBackdrop) closeSettings();
});
nameBackdrop.addEventListener("click", e => {
    if (e.target === nameBackdrop) closeNameDialog();
});

window.addEventListener("beforeunload", () => {
    autoSave(true);
});

window.addEventListener("resize", () => {
    drawMiniMap();
});

document.addEventListener("keydown", e => {
    const active = document.activeElement;
    const tag = active?.tagName;

    if (tag === "INPUT" || tag === "TEXTAREA" || active?.isContentEditable) return;

    if (e.ctrlKey) {
        switch (e.key) {
            case "ArrowLeft":
                e.preventDefault();
                goBack();
                break;
            case "/":
            case "?":
                e.preventDefault();
                resetView();
                break;
            case "+":
            case "=":
                e.preventDefault();
                zoom(1.2);
                break;
            case "-":
                e.preventDefault();
                zoom(1 / 1.2);
                break;
            case "0":
                e.preventDefault();
                resetView();
                break;
        }
    }
});

async function initApp() {
    applyTheme();

    try {
        await FiveProcessStorage.syncCloudSpaces();
    } catch (error) {
        console.warn("Cloud space sync skipped:", error);
    }

    const currentSpace = FiveProcessStorage.getCurrentSpace();
    if (currentSpace) {
        let payload = await FiveProcessStorage.loadCurrentContent();
        if (!payload) {
            await FiveProcessStorage.createContent(currentSpace, stateTree.title || "MAIN MACHINE", createPayloadFromTree());
            payload = await FiveProcessStorage.loadCurrentContent();
        }
        if (payload) restorePayload(payload);
    } else if (!tryRestore()) {
        const space = await FiveProcessStorage.createSpace("Local Space", "local_only");
        await FiveProcessStorage.createContent(space, stateTree.title || "MAIN MACHINE", createPayloadFromTree());
        setSaveStatus("", "Ready");
    }

    renderAll(true);
    autoSave(false);
}

initApp().catch(error => {
    console.error(error);
    setSaveStatus("error", "Init failed");
    renderAll(true);
});
