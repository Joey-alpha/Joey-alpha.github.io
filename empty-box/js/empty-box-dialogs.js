(function () {
    const config = {
        overlays: [],
        confirm: {},
        closeHandlers: {}
    };
    let pendingConfirmResolve = null;

    function configure(options = {}) {
        config.overlays = options.overlays || config.overlays;
        config.confirm = options.confirm || config.confirm;
        config.closeHandlers = options.closeHandlers || config.closeHandlers;
    }

    function openOverlay(element) {
        element?.classList.add('active');
    }

    function closeOverlay(element) {
        element?.classList.remove('active');
    }

    function closeConfirmDialog(result = false) {
        closeOverlay(config.confirm.overlay);
        if (pendingConfirmResolve) {
            pendingConfirmResolve(result);
            pendingConfirmResolve = null;
        }
    }

    function openConfirmDialog({ title, message, confirmText = '确定', danger = false }) {
        if (pendingConfirmResolve) {
            pendingConfirmResolve(false);
            pendingConfirmResolve = null;
        }
        config.confirm.title.textContent = title;
        config.confirm.message.textContent = message;
        config.confirm.acceptButton.textContent = confirmText;
        config.confirm.acceptButton.classList.toggle('danger', danger);
        openOverlay(config.confirm.overlay);
        config.confirm.acceptButton.focus();
        return new Promise(resolve => {
            pendingConfirmResolve = resolve;
        });
    }

    function hoistOverlaysToViewportLayer() {
        const appRoot = document.querySelector('.app');
        if (!appRoot) return;
        config.overlays.forEach(overlay => {
            if (overlay && overlay.parentElement !== appRoot) {
                appRoot.appendChild(overlay);
            }
        });
    }

    function closeByElement(element) {
        const handler = config.closeHandlers[element?.id];
        if (handler) {
            handler();
            return;
        }
        closeOverlay(element);
    }

    function bindCloseEvents() {
        config.confirm.acceptButton.addEventListener('click', () => closeConfirmDialog(true));
        config.confirm.cancelButton.addEventListener('click', () => closeConfirmDialog(false));

        document.querySelectorAll('[data-close]').forEach(button => {
            button.addEventListener('click', () => {
                const target = document.getElementById(button.dataset.close);
                closeByElement(target);
            });
        });

        config.overlays.forEach(overlay => {
            overlay.addEventListener('click', event => {
                if (event.target !== overlay) return;
                closeByElement(overlay);
            });
        });
    }

    window.EmptyBoxDialogs = {
        configure,
        openOverlay,
        closeOverlay,
        openConfirmDialog,
        closeConfirmDialog,
        hoistOverlaysToViewportLayer,
        bindCloseEvents
    };
})();
