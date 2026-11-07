(function () {
    'use strict';

    var CSS = __NEO_CSS__;
    var STYLE_ID = 'modloader-neo-ui-style';
    var TAB_KEY = 'modloader-neo-ui-tab';
    var BRAND = 'ModLoader Neo v1.0.0';
    var TABS = [
        { idx: 2, key: 'mods', label: '已添加 Mod', badge: 'mods' },
        { idx: 4, key: 'readme', label: 'ReadMe' },
        { idx: 5, key: 'config', label: 'Mod 配置' },
        { idx: 6, key: 'log', label: '日志', badge: 'log' },
        { idx: 7, key: 'debug', label: '诊断' }
    ];

    function ensureStyle(doc) {
        if (!doc || !doc.head) {
            return;
        }
        var style = doc.getElementById(STYLE_ID);
        if (!style) {
            style = doc.createElement('style');
            style.id = STYLE_ID;
            style.textContent = CSS;
            doc.head.appendChild(style);
            return;
        }
        if (style !== doc.head.lastElementChild) {
            doc.head.appendChild(style);
        }
    }

    function getGui(doc) {
        try {
            var view = doc.defaultView || window;
            var parent = view.parent || view;
            return (parent && parent.modLoaderGui) || window.modLoaderGui;
        } catch (e) {
            return window.modLoaderGui;
        }
    }

    function closeGui(doc) {
        var gui = getGui(doc);
        if (!gui || !gui.gui || !gui.gui.isOpen) {
            return false;
        }
        gui.gui.close();
        try {
            if (gui.modSubUiAngularJsService && gui.modSubUiAngularJsService.release) {
                gui.modSubUiAngularJsService.release();
            }
        } catch (e) {}
        return true;
    }

    function ripple(doc, event) {
        var target = event.target;
        if (!target || !target.closest) {
            return;
        }
        var button = target.closest('#MyConfig input[type="button"], #MyConfig button');
        if (!button || button.disabled) {
            return;
        }
        button.classList.remove('neo-ripple');
        void button.offsetWidth;
        button.classList.add('neo-ripple');
        setTimeout(function () {
            button.classList.remove('neo-ripple');
        }, 520);
    }

    function bindDoc(doc) {
        if (!doc || doc.__modLoaderNeoUIBound) {
            return;
        }
        doc.__modLoaderNeoUIBound = true;
        doc.addEventListener('click', function (event) {
            ripple(doc, event);
        }, true);
        doc.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape' && event.keyCode !== 27) {
                return;
            }
            if (closeGui(doc)) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
    }

    function brandStartBanner() {
        var banner = document.getElementById('startBannerModLoaderGui');
        if (!banner) {
            return;
        }
        if (banner.textContent !== BRAND) {
            banner.textContent = BRAND;
        }
    }

    function brandVersionDisplay() {
        var nodes = [
            document.getElementById('gameVersionDisplay'),
            document.getElementById('gameVersionDisplay2')
        ];
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (!node) {
                continue;
            }
            var html = node.innerHTML;
            var next = html.replace(/\(ML-v[^)]*\)/g, '(Neo-v1.0.0)');
            if (next !== html) {
                node.innerHTML = next;
            }
        }
    }

    function patchVersionStringBrand() {
        var gui = window.modLoaderGui;
        if (!gui || typeof gui.patchVersionString !== 'function' || gui.__neoVersionBranded) {
            return;
        }
        gui.__neoVersionBranded = true;
        var orig = gui.patchVersionString.bind(gui);
        gui.patchVersionString = function () {
            var result = orig();
            brandVersionDisplay();
            return result;
        };
    }

    function rebrandLoadedList(root) {
        if (!root || !root.querySelector) {
            return;
        }
        var node = root.querySelector('#MyConfig_field_NowLoadedModeList_r');
        if (!node || !node.value) {
            return;
        }
        var lines = node.value.split('\n');
        if (lines.length && /^ModLoader(?:[-\s]Neo)?(?:\s*\{v:[^}]*\})?/.test(lines[0]) && lines[0] !== BRAND) {
            lines[0] = BRAND;
            node.value = lines.join('\n');
        }
    }

    function applyBranding(root) {
        var header = root && root.querySelector ? root.querySelector('#MyConfig_header') : null;
        if (header && header.textContent !== BRAND) {
            header.textContent = BRAND;
        }
        brandStartBanner();
        brandVersionDisplay();
        rebrandLoadedList(root);
    }

    function patchLazyAngular() {
        var gui = window.modLoaderGui;
        var service = gui && gui.modSubUiAngularJsService;
        if (!service || service.__neoLazyPatched) {
            return;
        }
        service.__neoLazyPatched = true;
        service.__neoOrigBootstrap = service.bootstrap.bind(service);
        service.__neoOrigRelease = service.release.bind(service);
        service.__neoPendingBoot = null;
        service.__neoBooted = false;
        service.__neoBootedGen = 0;
        service.__neoBootInFlight = null;
        service.__neoBootGeneration = 0;
        service.bootstrap = function (element) {
            var gen = ++service.__neoBootGeneration;
            service.__neoPendingBoot = { element: element, gen: gen };
            service.__neoBooted = false;
            return Promise.resolve();
        };
        service.release = function () {
            var releaseGen = service.__neoBootGeneration;
            var pendingAtRelease = service.__neoPendingBoot;
            var finish = function () {
                if (service.__neoPendingBoot === pendingAtRelease) {
                    service.__neoPendingBoot = null;
                }
                if (service.__neoBootInFlight && service.__neoBootInFlight.gen !== releaseGen) {
                    return undefined;
                }
                if (!service.__neoBooted || service.__neoBootedGen !== releaseGen) {
                    return undefined;
                }
                service.__neoBooted = false;
                return service.__neoOrigRelease();
            };
            if (service.__neoBootInFlight) {
                return Promise.resolve(service.__neoBootInFlight.promise).then(finish).catch(function () {});
            }
            return Promise.resolve(finish());
        };
    }

    function triggerAngularDigest(element) {
        if (!element) {
            return;
        }
        try {
            var doc = element.ownerDocument || document;
            var view = doc.defaultView || window;
            var ng = view.angular || window.angular;
            if (!ng || !ng.element) {
                return;
            }
            var target = element.querySelector ? element.querySelector('app-container') : null;
            var scope = target ? ng.element(target).scope() : null;
            if (!scope) {
                scope = ng.element(element).scope();
            }
            if (scope && scope.$root) {
                if (!scope.$root.$$phase) {
                    scope.$apply();
                } else if (scope.$evalAsync) {
                    scope.$evalAsync(function () {});
                }
            }
        } catch (e) {}
    }

    function patchAngularManagers(service) {
        var ref = service && service.Ref;
        if (!ref || !ref.appContainerManager || ref.__neoManagersPatched) {
            return;
        }
        ref.__neoManagersPatched = true;
        ['ModGuiConfig', 'ModInGameConfig'].forEach(function (name) {
            var manager = ref.appContainerManager[name];
            if (!manager) {
                return;
            }
            var ecm = manager.externalComponentManager;
            if (ecm && !ecm.__neoDedupPatched) {
                ecm.__neoDedupPatched = true;
                var origAdd = ecm.addComponent.bind(ecm);
                ecm.addComponent = function (info) {
                    var list = this._externalComponentsShow || [];
                    var selector = info && info.selector;
                    for (var i = 0; i < list.length; i++) {
                        if (selector && list[i] && list[i].selector === selector) {
                            list[i] = info;
                            return;
                        }
                    }
                    return origAdd(info);
                };
            }
            var origBootstrap = manager.bootstrap.bind(manager);
            manager.bootstrap = function (element) {
                var gen = element && element.__neoBootGen;
                if (gen !== undefined && gen !== service.__neoBootGeneration) {
                    return Promise.resolve();
                }
                var saved = ecm ? (ecm._externalComponentsShow || []).slice() : [];
                return Promise.resolve(origBootstrap(element)).then(function (value) {
                    if (ecm) {
                        saved.forEach(function (info) {
                            var list = ecm._externalComponentsShow || [];
                            var selector = info && info.selector;
                            var exists = false;
                            for (var i = 0; i < list.length; i++) {
                                if (selector && list[i] && list[i].selector === selector) {
                                    exists = true;
                                    break;
                                }
                            }
                            if (!exists) {
                                ecm.addComponent(info);
                            }
                        });
                    }
                    triggerAngularDigest(element);
                    return value;
                });
            };
            if (name === 'ModGuiConfig') {
                ref.bootstrapModGuiConfig = manager.bootstrap;
                ref.addComponentModGuiConfig = manager.addComponent.bind(manager);
            } else {
                ref.bootstrapModInGameConfig = manager.bootstrap;
                ref.addComponentModInGameConfig = manager.addComponent.bind(manager);
            }
        });
    }

    function patchGuiHooks() {
        var host = window.modLoaderGui;
        if (!host) {
            return;
        }
        if (!host.__neoCreatePatched && typeof host.createGui === 'function') {
            host.__neoCreatePatched = true;
            var origCreate = host.createGui.bind(host);
            host.createGui = function () {
                var result = origCreate.apply(host, arguments);
                var kick = function () {
                    try {
                        apply();
                    } catch (e) {}
                    setTimeout(function () { try { apply(); } catch (e) {} }, 0);
                    setTimeout(function () { try { apply(); } catch (e) {} }, 80);
                };
                if (result && typeof result.then === 'function') {
                    result.then(kick, function () {});
                } else {
                    kick();
                }
                return result;
            };
        }
        var gui = host.gui;
        if (gui && !gui.__neoOpenPatched && typeof gui.open === 'function') {
            gui.__neoOpenPatched = true;
            var origOpen = gui.open.bind(gui);
            gui.open = function () {
                var result = origOpen.apply(gui, arguments);
                try {
                    apply();
                } catch (e) {}
                setTimeout(function () { try { apply(); } catch (e) {} }, 0);
                return result;
            };
        }
        if (gui && !gui.__neoClosePatched && typeof gui.close === 'function') {
            gui.__neoClosePatched = true;
            var origClose = gui.close.bind(gui);
            gui.close = function () {
                try {
                    var root = document.getElementById('MyConfig');
                    if (root) {
                        root.removeAttribute('data-neo-ready');
                        try {
                            var inner = root.tagName === 'IFRAME'
                                ? root.contentDocument && root.contentDocument.getElementById('MyConfig')
                                : root;
                            if (inner) {
                                inner.removeAttribute('data-neo-ready');
                            }
                        } catch (e) {}
                    }
                } catch (e) {}
                return origClose.apply(gui, arguments);
            };
        }
    }

    function ensureAngularBoot(root) {
        var gui = window.modLoaderGui;
        var service = gui && gui.modSubUiAngularJsService;
        if (!service || !service.__neoLazyPatched) {
            return Promise.resolve();
        }
        var pending = service.__neoPendingBoot;
        if (!pending) {
            return Promise.resolve();
        }
        var gen = pending.gen;
        var element = pending.element;
        if (!element || !element.isConnected) {
            return Promise.resolve();
        }
        if (service.__neoBooted && service.__neoBootedGen === gen) {
            enhanceOrderComponents(root);
            return Promise.resolve();
        }
        if (service.__neoBootInFlight && service.__neoBootInFlight.gen === gen) {
            return service.__neoBootInFlight.promise;
        }
        var loading = element.querySelector ? element.querySelector('.neo-config-loading') : null;
        if (!loading) {
            loading = document.createElement('div');
            loading.className = 'neo-config-loading';
            loading.textContent = '正在加载 Mod 配置…';
            element.appendChild(loading);
        }
        patchAngularManagers(service);
        element.__neoBootGen = gen;
        var task = { gen: gen };
        task.promise = Promise.resolve(service.__neoOrigBootstrap(element)).then(function () {
            if (service.__neoBootGeneration !== gen) {
                var current = service.__neoPendingBoot;
                if (current && current.element) {
                    triggerAngularDigest(current.element);
                }
                return;
            }
            service.__neoBooted = true;
            service.__neoBootedGen = gen;
            if (service.__neoBootInFlight === task) {
                service.__neoBootInFlight = null;
            }
            var node = element.querySelector ? element.querySelector('.neo-config-loading') : null;
            if (node) {
                node.remove();
            }
            enhanceOrderComponents(root);
        }).catch(function (error) {
            if (service.__neoBootGeneration !== gen) {
                return;
            }
            if (service.__neoBootInFlight === task) {
                service.__neoBootInFlight = null;
            }
            if (loading) {
                loading.textContent = 'Mod 配置加载失败';
                loading.classList.add('neo-config-loading-error');
            }
            console.error('[ModLoaderNeoUI] 加载 Mod 配置失败', error);
        });
        service.__neoBootInFlight = task;
        return task.promise;
    }

    function maybeEnhanceActiveTab(root) {
        var wrapper = root && root.querySelector ? root.querySelector('#MyConfig_wrapper') : null;
        if (!wrapper) {
            return;
        }
        if (wrapper.dataset.neoActiveTab === '4') {
            enhanceReadme(root);
        } else if (wrapper.dataset.neoActiveTab === '5') {
            ensureAngularBoot(root);
        }
    }

    function setBadge(root, name, value) {
        var badge = root.querySelector('.neo-tab-badge[data-badge="' + name + '"]');
        if (!badge) {
            return;
        }
        var text = value > 99 ? '99+' : String(value);
        if (badge.textContent !== text) {
            badge.textContent = text;
        }
        badge.style.display = value > 0 ? '' : 'none';
    }

    function updateSafeModeStatus(root) {
        var input = root.querySelector('#MyConfig_field_SafeModeState_R');
        var wrap = root.querySelector('#MyConfig_SafeModeState_R_var');
        if (!input) {
            return;
        }
        var value = String(input.value || '');
        input.title = value;
        var cls = /禁用|disabled/i.test(value)
            ? 'neo-status-off'
            : /自动|auto/i.test(value)
                ? 'neo-status-auto'
                : /启用|enabled/i.test(value)
                    ? 'neo-status-on'
                    : '';
        ['neo-status-on', 'neo-status-off', 'neo-status-auto'].forEach(function (name) {
            input.classList.remove(name);
            if (wrap) {
                wrap.classList.remove(name);
            }
        });
        if (cls) {
            input.classList.add(cls);
            if (wrap) {
                wrap.classList.add(cls);
            }
        }
    }

    function updateBadges(root) {
        var list = root.querySelector('#MyConfig_field_NowLoadedModeList_r');
        var mods = 0;
        if (list && list.value) {
            mods = list.value.split(/\r?\n/).filter(function (s) { return !!s; }).length;
            if (mods > 0) {
                mods -= 1;
            }
        }
        setBadge(root, 'mods', Math.max(0, mods));

        var log = root.querySelector('#idLoadLogHtml');
        setBadge(root, 'log', log ? log.children.length : 0);
        updateSafeModeStatus(root);
    }

    function activateTab(root, idx, persist, skipEnter) {
        var bar = root.querySelector('#neo-tabbar');
        if (!bar) {
            return;
        }
        var wrapper = root.querySelector('#MyConfig_wrapper');
        if (wrapper) {
            wrapper.dataset.neoActiveTab = String(idx);
        }
        var buttons = bar.querySelectorAll('.neo-tab');
        for (var i = 0; i < buttons.length; i++) {
            var on = buttons[i].getAttribute('data-neo-tab') === String(idx);
            buttons[i].classList.toggle('neo-tab-active', on);
            buttons[i].setAttribute('aria-selected', on ? 'true' : 'false');
            buttons[i].tabIndex = on ? 0 : -1;
        }
        for (var j = 0; j < TABS.length; j++) {
            var section = root.querySelector('#MyConfig_section_' + TABS[j].idx);
            if (!section) {
                continue;
            }
            var active = TABS[j].idx === idx;
            section.classList.toggle('neo-tab-hidden', !active);
            if (active) {
                section.classList.remove('neo-tab-enter');
                if (!skipEnter) {
                    void section.offsetWidth;
                    section.classList.add('neo-tab-enter');
                }
            } else {
                section.classList.remove('neo-tab-enter');
            }
        }
        var scroller = root.tagName === 'BODY' ? root.ownerDocument.scrollingElement : root;
        if (scroller) {
            scroller.scrollTop = 0;
        }
        if (persist) {
            try {
                localStorage.setItem(TAB_KEY, String(idx));
            } catch (e) {}
        }
        if (idx === 4) {
            enhanceReadme(root);
        } else if (idx === 5) {
            ensureAngularBoot(root);
        }
    }

    function buildTabs(root, wrapper) {
        if (wrapper.dataset.neoUiTabs === '1') {
            updateBadges(root);
            return;
        }
        var anchor = root.querySelector('#MyConfig_section_0');
        if (!anchor) {
            return;
        }
        for (var i = 0; i < TABS.length; i++) {
            if (!root.querySelector('#MyConfig_section_' + TABS[i].idx)) {
                return;
            }
        }

        var top = anchor;
        var safe = root.querySelector('#MyConfig_section_1');
        var mods = root.querySelector('#MyConfig_section_2');
        var add = root.querySelector('#MyConfig_section_3');
        if (!safe || !mods || !add) {
            return;
        }

        var toolbarDivider = document.createElement('span');
        toolbarDivider.className = 'neo-toolbar-divider';
        top.appendChild(toolbarDivider);
        ['EnableSafeMode_b', 'DisableSafeMode_b', 'SafeModeState_R'].forEach(function (id) {
            var field = root.querySelector('#MyConfig_' + id + '_var');
            if (field) {
                top.appendChild(field);
            }
        });
        safe.classList.add('neo-merged-away');

        var subsection = document.createElement('div');
        subsection.className = 'neo-subsection-title';
        subsection.textContent = '添加 / 移除 Mod';
        mods.appendChild(subsection);

        var addRow = document.createElement('div');
        addRow.className = 'neo-add-row';
        var addInput = root.querySelector('#MyConfig_AddMod_I_var');
        var addButton = root.querySelector('#MyConfig_AddMod_b_var');
        if (addInput) {
            addRow.appendChild(addInput);
        }
        if (addButton) {
            addRow.appendChild(addButton);
        }
        mods.appendChild(addRow);

        var addResult = root.querySelector('#MyConfig_AddMod_R_var');
        if (addResult) {
            mods.appendChild(addResult);
        }

        var removeRow = document.createElement('div');
        removeRow.className = 'neo-remove-row';
        var removeSelect = root.querySelector('#MyConfig_RemoveMod_s_var');
        var removeButton = root.querySelector('#MyConfig_RemoveMod_b_var');
        if (removeSelect) {
            removeRow.appendChild(removeSelect);
        }
        if (removeButton) {
            removeRow.appendChild(removeButton);
        }
        mods.appendChild(removeRow);

        add.classList.add('neo-merged-away');

        var bar = document.createElement('div');
        bar.id = 'neo-tabbar';
        bar.setAttribute('role', 'tablist');
        bar.setAttribute('aria-label', 'ModLoader Neo 分栏');

        TABS.forEach(function (def) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'neo-tab';
            button.id = 'neo-tab-' + def.idx;
            button.setAttribute('data-neo-tab', String(def.idx));
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-controls', 'MyConfig_section_' + def.idx);

            var label = document.createElement('span');
            label.className = 'neo-tab-label';
            label.textContent = def.label;
            button.appendChild(label);

            if (def.badge) {
                var badge = document.createElement('span');
                badge.className = 'neo-tab-badge';
                badge.setAttribute('data-badge', def.badge);
                badge.textContent = '0';
                badge.style.display = 'none';
                button.appendChild(badge);
            }

            button.addEventListener('click', function () {
                activateTab(root, def.idx, true);
            });
            bar.appendChild(button);

            var section = root.querySelector('#MyConfig_section_' + def.idx);
            section.classList.add('neo-tab-panel');
            section.setAttribute('role', 'tabpanel');
            section.setAttribute('aria-labelledby', 'neo-tab-' + def.idx);
        });

        anchor.insertAdjacentElement('afterend', bar);

        bar.addEventListener('keydown', function (event) {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }
            var current = Number(wrapper.dataset.neoActiveTab || 2);
            var indexes = TABS.map(function (t) { return t.idx; });
            var pos = indexes.indexOf(current);
            if (pos < 0) {
                pos = 0;
            }
            pos = (pos + (event.key === 'ArrowRight' ? 1 : -1) + indexes.length) % indexes.length;
            var next = indexes[pos];
            activateTab(root, next, true);
            var nextButton = bar.querySelector('[data-neo-tab="' + next + '"]');
            if (nextButton) {
                nextButton.focus();
            }
            event.preventDefault();
        });

        wrapper.dataset.neoUiTabs = '1';
        updateBadges(root);

        var saved = 2;
        try {
            var raw = localStorage.getItem(TAB_KEY);
            if (raw) {
                saved = Number(raw);
            }
        } catch (e) {}
        if (!TABS.some(function (t) { return t.idx === saved; })) {
            saved = 2;
        }
        activateTab(root, saved, false, true);
    }

    function applyTabs(root) {
        var wrapper = root.querySelector('#MyConfig_wrapper');
        if (!wrapper) {
            return;
        }
        if (wrapper.dataset.neoUiTabs !== '1') {
            buildTabs(root, wrapper);
        } else {
            updateBadges(root);
        }
    }

    function angularCandidates(root) {
        var doc = (root && root.ownerDocument) || document;
        var view = doc.defaultView || window;
        var list = [];
        var push = function (ng) {
            if (ng && typeof ng.element === 'function' && list.indexOf(ng) < 0) {
                list.push(ng);
            }
        };
        try { push(view.angular); } catch (e) {}
        try { push(window.angular); } catch (e) {}
        try {
            if (view.parent && view.parent !== view) {
                push(view.parent.angular);
            }
        } catch (e) {}
        try {
            if (window.top && window.top !== window) {
                push(window.top.angular);
            }
        } catch (e) {}
        try {
            var gui = getGui(doc);
            push(gui && gui.angular);
        } catch (e) {}
        return list;
    }

    function orderListType(container) {
        return container && container.classList && container.classList.contains('select-enable') ? 'enable' : 'disable';
    }

    function orderScopeFor(ng, element) {
        try {
            return ng.element(element).isolateScope() || ng.element(element).scope() || null;
        } catch (e) {
            return null;
        }
    }

    function orderModelFor(ng, item) {
        try {
            var scope = ng.element(item).scope();
            return scope && scope.item ? scope.item : null;
        } catch (e) {
            return null;
        }
    }

    function orderVersion(key) {
        try {
            var name = String(key || '').replace(/\.mod\.zip$/i, '');
            var getMod = window.modUtils && window.modUtils.getMod;
            var mod = getMod ? (getMod(key) || getMod(name)) : null;
            if (!mod) {
                return '';
            }
            var version = mod.version || (mod.bootJson && mod.bootJson.version) || (mod.mod && mod.mod.version);
            return version ? 'v' + version : '';
        } catch (e) {
            return '';
        }
    }

    function ensureOrderGroupLabel(container, text, count) {
        var label = container.previousElementSibling;
        if (!label || !label.classList || !label.classList.contains('neo-order-group-label')) {
            label = document.createElement('div');
            label.className = 'neo-order-group-label';
            container.parentNode.insertBefore(label, container);
        }
        if (count > 0) {
            var next = text + ' · ' + count;
            if (label.textContent !== next) {
                label.textContent = next;
            }
            label.style.display = '';
        } else {
            label.style.display = 'none';
        }
    }

    function safeOrderApply(scope) {
        try {
            if (scope.$root && !scope.$root.$$phase) {
                scope.$apply();
            } else if (scope.$evalAsync) {
                scope.$evalAsync(function () {});
            }
        } catch (e) {}
    }

    function cloneOrderList(list) {
        return (list || []).map(function (item) {
            return { key: item.key, str: item.str, selected: !!item.selected };
        });
    }

    function orderErrorText(error) {
        var message = error && (error.message || error);
        return String(message || '未知错误');
    }

    function setOrderStatus(host, text, isError) {
        if (!host || !host.ownerDocument) {
            return;
        }
        var node = host.querySelector('.neo-order-status');
        if (!node) {
            node = host.ownerDocument.createElement('div');
            node.className = 'neo-order-status';
            var title = host.querySelector('.enable-order-component-title');
            if (title && title.parentNode === host) {
                title.insertAdjacentElement('afterend', node);
            } else {
                host.insertBefore(node, host.firstChild);
            }
        }
        node.textContent = text;
        node.classList.toggle('neo-order-status-error', !!isError);
        if (node.__neoStatusTimer) {
            clearTimeout(node.__neoStatusTimer);
            node.__neoStatusTimer = null;
        }
        if (!isError) {
            node.__neoStatusTimer = setTimeout(function () {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            }, 4000);
        }
    }

    function persistOrder(hostScope, action, host, rollback) {
        var data = hostScope && hostScope.$ctrl && hostScope.$ctrl.data;
        if (!data || typeof data.onChange !== 'function') {
            setOrderStatus(host, '保存失败：缺少控制器接口', true);
            return { ok: false };
        }
        var result;
        try {
            result = data.onChange(
                action,
                cloneOrderList(data.listEnabled),
                cloneOrderList(data.listDisabled),
                hostScope.selectedKeyEnable,
                hostScope.selectedKeyDisable,
                data
            );
        } catch (error) {
            if (rollback) {
                rollback();
            }
            setOrderStatus(host, '保存失败：' + orderErrorText(error), true);
            return { ok: false, error: error };
        }
        if (result && typeof result.then === 'function') {
            setOrderStatus(host, '正在保存…', false);
            return result.then(function () {
                setOrderStatus(host, '已提交保存（详见日志）', false);
                return { ok: true };
            }, function (error) {
                if (rollback) {
                    rollback();
                }
                setOrderStatus(host, '保存失败：' + orderErrorText(error), true);
                return { ok: false, error: error };
            });
        }
        setOrderStatus(host, '已提交保存（详见日志）', false);
        return { ok: true };
    }

    function moveOrderItem(root, host, item, direction, ng) {
        var container = item.closest ? item.closest('.enable-order-component-select') : null;
        if (!ng || !container) {
            return;
        }
        var type = orderListType(container);
        var hostScope = orderScopeFor(ng, host);
        var data = hostScope && hostScope.$ctrl && hostScope.$ctrl.data;
        var model = orderModelFor(ng, item);
        if (!hostScope || !data || !model) {
            return;
        }
        var list = type === 'enable' ? data.listEnabled : data.listDisabled;
        var index = list.findIndex(function (entry) { return entry.key === model.key; });
        var next = index + direction;
        if (index < 0 || next < 0 || next >= list.length) {
            return;
        }
        var beforeEnabled = cloneOrderList(data.listEnabled);
        var beforeDisabled = cloneOrderList(data.listDisabled);
        var beforeKeyEnable = hostScope.selectedKeyEnable;
        var beforeKeyDisable = hostScope.selectedKeyDisable;
        var rollback = function () {
            data.listEnabled = beforeEnabled;
            data.listDisabled = beforeDisabled;
            hostScope.selectedKeyEnable = beforeKeyEnable;
            hostScope.selectedKeyDisable = beforeKeyDisable;
            safeOrderApply(hostScope);
            setTimeout(function () { enhanceOrderComponents(root); }, 0);
        };
        var moved = list.splice(index, 1)[0];
        list.splice(next, 0, moved);
        persistOrder(hostScope, type === 'enable'
            ? (direction < 0 ? 'enableUp1' : 'enableDown1')
            : (direction < 0 ? 'disableUp1' : 'disableDown1'), host, rollback);
        safeOrderApply(hostScope);
        setTimeout(function () { enhanceOrderComponents(root); }, 0);
    }

    function toggleOrderItem(root, host, item, ng) {
        var container = item.closest ? item.closest('.enable-order-component-select') : null;
        if (!ng || !container) {
            return;
        }
        var type = orderListType(container);
        var hostScope = orderScopeFor(ng, host);
        var data = hostScope && hostScope.$ctrl && hostScope.$ctrl.data;
        var model = orderModelFor(ng, item);
        if (!hostScope || !data || !model) {
            return;
        }
        var from = type === 'enable' ? data.listEnabled : data.listDisabled;
        var to = type === 'enable' ? data.listDisabled : data.listEnabled;
        var index = from.findIndex(function (entry) { return entry.key === model.key; });
        if (index < 0) {
            return;
        }
        var beforeEnabled = cloneOrderList(data.listEnabled);
        var beforeDisabled = cloneOrderList(data.listDisabled);
        var beforeKeyEnable = hostScope.selectedKeyEnable;
        var beforeKeyDisable = hostScope.selectedKeyDisable;
        var rollback = function () {
            data.listEnabled = beforeEnabled;
            data.listDisabled = beforeDisabled;
            hostScope.selectedKeyEnable = beforeKeyEnable;
            hostScope.selectedKeyDisable = beforeKeyDisable;
            safeOrderApply(hostScope);
            setTimeout(function () { enhanceOrderComponents(root); }, 0);
        };
        var moved = from.splice(index, 1)[0];
        moved.selected = false;
        to.push(moved);
        (data.listEnabled || []).forEach(function (entry) { entry.selected = false; });
        (data.listDisabled || []).forEach(function (entry) { entry.selected = false; });
        hostScope.selectedKeyEnable = Number.MAX_SAFE_INTEGER;
        hostScope.selectedKeyDisable = Number.MAX_SAFE_INTEGER;
        persistOrder(hostScope, type === 'enable' ? 'toEnable' : 'toDisable', host, rollback);
        safeOrderApply(hostScope);
        setTimeout(function () { enhanceOrderComponents(root); }, 0);
    }

    function bindOrderDrag(root, host, item, handle, ng) {
        if (handle.__neoDragBound) {
            return;
        }
        handle.__neoDragBound = true;
        handle.addEventListener('click', function (event) {
            event.stopPropagation();
        });
        handle.addEventListener('pointerdown', function (event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }
            var container = item.closest ? item.closest('.enable-order-component-select') : null;
            if (!container) {
                return;
            }
            var model = orderModelFor(ng, item);
            if (!model) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            var type = orderListType(container);
            var pointerId = event.pointerId;
            var target = null;
            var dragging = true;
            item.classList.add('neo-dragging');
            try {
                handle.setPointerCapture(pointerId);
            } catch (e) {}

            var clear = function () {
                var rows = container.querySelectorAll('.neo-drop-before, .neo-drop-after');
                for (var i = 0; i < rows.length; i++) {
                    rows[i].classList.remove('neo-drop-before', 'neo-drop-after');
                }
            };
            var onMove = function (moveEvent) {
                if (!dragging) {
                    return;
                }
                moveEvent.preventDefault();
                var doc = item.ownerDocument;
                var element = doc.elementFromPoint ? doc.elementFromPoint(moveEvent.clientX, moveEvent.clientY) : null;
                var row = element && element.closest ? element.closest('.neo-mod-item') : null;
                if (!row || row.parentNode !== container || row === item) {
                    clear();
                    target = null;
                    return;
                }
                clear();
                var rect = row.getBoundingClientRect();
                var before = moveEvent.clientY < rect.top + rect.height / 2;
                row.classList.add(before ? 'neo-drop-before' : 'neo-drop-after');
                target = { row: row, before: before };
            };
            var onUp = function (upEvent) {
                if (!dragging) {
                    return;
                }
                dragging = false;
                upEvent.preventDefault();
                try {
                    handle.releasePointerCapture(pointerId);
                } catch (e) {}
                handle.removeEventListener('pointermove', onMove);
                handle.removeEventListener('pointerup', onUp);
                handle.removeEventListener('pointercancel', onUp);
                item.classList.remove('neo-dragging');
                clear();
                if (!target) {
                    return;
                }
                var targetModel = orderModelFor(ng, target.row);
                var hostScope = orderScopeFor(ng, host);
                var data = hostScope && hostScope.$ctrl && hostScope.$ctrl.data;
                if (!targetModel || !hostScope || !data) {
                    return;
                }
                var list = type === 'enable' ? data.listEnabled : data.listDisabled;
                var from = list.findIndex(function (entry) { return entry.key === model.key; });
                var to = list.findIndex(function (entry) { return entry.key === targetModel.key; });
                if (from < 0 || to < 0) {
                    return;
                }
                var insertAt = to + (target.before ? 0 : 1);
                if (from < insertAt) {
                    insertAt -= 1;
                }
                if (insertAt === from) {
                    return;
                }
                var moved = list.splice(from, 1)[0];
                list.splice(insertAt, 0, moved);
                persistOrder(hostScope, type === 'enable' ? 'enableDown1' : 'disableDown1');
                safeOrderApply(hostScope);
                setTimeout(function () { enhanceOrderComponents(root); }, 0);
            };
            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp);
            handle.addEventListener('pointercancel', onUp);
        });
    }

    function updateOrderItem(item, type, model, index, total) {
        item.classList.add('neo-mod-item');
        item.classList.toggle('neo-mod-item-enabled', type === 'enable');
        item.classList.toggle('neo-mod-item-disabled', type === 'disable');
        var name = item.querySelector('.neo-mod-name');
        var displayName = String(model.str || model.key || '').replace(/\.mod\.zip$/i, '');
        if (name && name.textContent !== displayName) {
            name.textContent = displayName;
        }
        var meta = item.querySelector('.neo-mod-meta');
        if (meta) {
            var version = orderVersion(model.key);
            var text = [version, type === 'enable' ? '已启用' : '已禁用'].filter(Boolean).join(' · ');
            if (meta.textContent !== text) {
                meta.textContent = text;
            }
        }
        var toggle = item.querySelector('.neo-toggle');
        if (toggle) {
            var toggleText = type === 'enable' ? '禁用' : '启用';
            if (toggle.textContent !== toggleText) {
                toggle.textContent = toggleText;
            }
            toggle.classList.toggle('neo-danger', type === 'enable');
            toggle.classList.toggle('neo-success', type === 'disable');
        }
        var up = item.querySelector('.neo-up');
        var down = item.querySelector('.neo-down');
        if (up) {
            up.disabled = index <= 0;
        }
        if (down) {
            down.disabled = index >= total - 1;
        }
    }

    function decorateOrderItem(root, host, item, type, model, ng, index, total) {
        if (!item.querySelector('.neo-mod-main')) {
            item.innerHTML = '';
            var handle = document.createElement('span');
            handle.className = 'neo-drag-handle';
            handle.title = '拖动排序';
            handle.textContent = '⋮⋮';

            var main = document.createElement('div');
            main.className = 'neo-mod-main';
            var name = document.createElement('div');
            name.className = 'neo-mod-name';
            var meta = document.createElement('div');
            meta.className = 'neo-mod-meta';
            main.appendChild(name);
            main.appendChild(meta);

            var actions = document.createElement('div');
            actions.className = 'neo-mod-actions';
            var up = document.createElement('button');
            up.type = 'button';
            up.className = 'neo-icon-btn neo-up';
            up.textContent = '▲';
            up.title = '上移';
            var down = document.createElement('button');
            down.type = 'button';
            down.className = 'neo-icon-btn neo-down';
            down.textContent = '▼';
            down.title = '下移';
            var toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'neo-text-btn neo-toggle';
            actions.appendChild(up);
            actions.appendChild(down);
            actions.appendChild(toggle);

            item.appendChild(handle);
            item.appendChild(main);
            item.appendChild(actions);

            up.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                moveOrderItem(root, host, item, -1, ng);
            });
            down.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                moveOrderItem(root, host, item, 1, ng);
            });
            toggle.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                toggleOrderItem(root, host, item, ng);
            });
            bindOrderDrag(root, host, item, handle, ng);
        }
        updateOrderItem(item, type, model, index, total);
    }

    function enhanceOrderComponents(root) {
        if (!root || !root.querySelectorAll) {
            return;
        }
        var candidates = angularCandidates(root);
        if (!candidates.length) {
            return;
        }
        var hosts = root.querySelectorAll('.enable-order-component-host');
        for (var h = 0; h < hosts.length; h++) {
            var host = hosts[h];
            var hostScope = null;
            var data = null;
            var hostNg = null;
            for (var c = 0; c < candidates.length; c++) {
                hostScope = orderScopeFor(candidates[c], host);
                data = hostScope && hostScope.$ctrl && hostScope.$ctrl.data;
                if (data) {
                    hostNg = candidates[c];
                    break;
                }
            }
            if (!data) {
                host.classList.remove('neo-order-enhanced');
                continue;
            }
            host.classList.add('neo-order-host');
            var title = host.querySelector('.enable-order-component-title');
            if (title) {
                title.classList.add('neo-order-title');
            }
            var hostEnhanced = false;
            var types = ['enable', 'disable'];
            for (var t = 0; t < types.length; t++) {
                var type = types[t];
                var container = host.querySelector('.select-' + type);
                if (!container) {
                    continue;
                }
                var items = [];
                for (var i = 0; i < container.children.length; i++) {
                    if (container.children[i].nodeType === 1) {
                        items.push(container.children[i]);
                    }
                }
                ensureOrderGroupLabel(container, type === 'enable' ? '已启用' : '已禁用', items.length);
                container.classList.add('neo-order-list');
                container.classList.toggle('neo-order-list-empty', items.length === 0);
                for (var k = 0; k < items.length; k++) {
                    var item = items[k];
                    var model = null;
                    var itemNg = null;
                    for (var ci = 0; ci < candidates.length; ci++) {
                        model = orderModelFor(candidates[ci], item);
                        if (model) {
                            itemNg = candidates[ci];
                            break;
                        }
                    }
                    if (!model) {
                        continue;
                    }
                    decorateOrderItem(root, host, item, type, model, itemNg, k, items.length);
                    hostEnhanced = true;
                }
            }
            host.classList.toggle('neo-order-enhanced', hostEnhanced);
        }
    }

    function escapeReadmeHtml(text) {
        return String(text == null ? '' : text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeReadmeUrl(url, isImage) {
        var value = String(url || '').trim();
        if (!value) {
            return '';
        }
        if (/^https?:\/\//i.test(value)) {
            return value;
        }
        if (isImage && /^data:image\//i.test(value)) {
            return value;
        }
        if (!isImage && /^mailto:/i.test(value)) {
            return value;
        }
        return '';
    }

    function renderReadmeInline(text) {
        var value = text;
        value = value.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, function (match, alt, url) {
            var safe = safeReadmeUrl(url, true);
            if (!safe) {
                return alt;
            }
            return '<img src="' + safe + '" alt="' + alt + '" loading="lazy">';
        });
        value = value.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, function (match, label, url) {
            var safe = safeReadmeUrl(url, false);
            if (!safe) {
                return label;
            }
            return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
        });
        value = value.replace(/`([^`]+)`/g, '<code>$1</code>');
        value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        value = value.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        value = value.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
        value = value.replace(/(^|[^_])_([^_]+)_/g, '$1<em>$2</em>');
        value = value.replace(/~~([^~]+)~~/g, '<del>$1</del>');
        return value;
    }

    function renderReadme(markdown) {
        var lines = escapeReadmeHtml(String(markdown == null ? '' : markdown).replace(/\r\n?/g, '\n')).split('\n');
        var output = [];
        var paragraph = [];
        var flush = function () {
            if (!paragraph.length) {
                return;
            }
            output.push('<p>' + paragraph.map(renderReadmeInline).join('<br>') + '</p>');
            paragraph = [];
        };
        var i = 0;
        while (i < lines.length) {
            var line = lines[i];
            if (/^\s*```/.test(line)) {
                flush();
                i++;
                var code = [];
                while (i < lines.length && !/^\s*```/.test(lines[i])) {
                    code.push(lines[i]);
                    i++;
                }
                if (i < lines.length) {
                    i++;
                }
                output.push('<pre><code>' + code.join('\n') + '</code></pre>');
                continue;
            }
            if (/^\s*$/.test(line)) {
                flush();
                i++;
                continue;
            }
            if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
                flush();
                output.push('<hr>');
                i++;
                continue;
            }
            var heading = line.match(/^\s*(#{1,6})\s+(.*?)\s*#*\s*$/);
            if (heading) {
                flush();
                var level = heading[1].length;
                output.push('<h' + level + '>' + renderReadmeInline(heading[2]) + '</h' + level + '>');
                i++;
                continue;
            }
            if (/^\s*>\s?/.test(line)) {
                flush();
                var quotes = [];
                while (i < lines.length) {
                    var quote = lines[i].match(/^\s*>\s?(.*)$/);
                    if (!quote) {
                        break;
                    }
                    quotes.push(quote[1]);
                    i++;
                }
                output.push('<blockquote>' + quotes.map(renderReadmeInline).join('<br>') + '</blockquote>');
                continue;
            }
            if (/^\s*[-*+]\s+/.test(line)) {
                flush();
                output.push('<ul>');
                while (i < lines.length) {
                    var bullet = lines[i].match(/^\s*[-*+]\s+(.*)$/);
                    if (!bullet) {
                        break;
                    }
                    output.push('<li>' + renderReadmeInline(bullet[1]) + '</li>');
                    i++;
                }
                output.push('</ul>');
                continue;
            }
            if (/^\s*\d+\.\s+/.test(line)) {
                flush();
                output.push('<ol>');
                while (i < lines.length) {
                    var numbered = lines[i].match(/^\s*\d+\.\s+(.*)$/);
                    if (!numbered) {
                        break;
                    }
                    output.push('<li>' + renderReadmeInline(numbered[1]) + '</li>');
                    i++;
                }
                output.push('</ol>');
                continue;
            }
            paragraph.push(line);
            i++;
        }
        flush();
        return output.join('\n');
    }

    function selectReadme(root, host, name) {
        var title = host.querySelector('.neo-readme-title');
        var version = host.querySelector('.neo-readme-version');
        var body = host.querySelector('.neo-readme-body');
        var items = host.querySelectorAll('.neo-readme-item');
        var active = null;
        for (var i = 0; i < items.length; i++) {
            var on = items[i].getAttribute('data-neo-readme-name') === name;
            items[i].classList.toggle('neo-readme-item-active', on);
            if (on) {
                active = items[i];
            }
        }
        if (active && active.scrollIntoView) {
            active.scrollIntoView({ block: 'nearest' });
        }
        if (title) {
            title.textContent = name;
        }
        var mod = window.modUtils && window.modUtils.getMod && window.modUtils.getMod(name);
        var modVersion = mod && (mod.version || (mod.bootJson && mod.bootJson.version) || (mod.mod && mod.mod.version));
        if (version) {
            version.innerHTML = '版本: ' + (modVersion ? '<span>v' + escapeReadmeHtml(modVersion) + '</span>' : '<span>?</span>');
        }
        var select = root.querySelector('#MyConfig_field_ReadMe_s');
        if (select) {
            select.value = name;
        }
        var token = (host.__neoReadmeToken || 0) + 1;
        host.__neoReadmeToken = token;
        if (body) {
            body.innerHTML = '<div class="neo-readme-loading">加载中…</div>';
        }
        var gui = window.modLoaderGui;
        if (!gui || typeof gui.getModTReadMe !== 'function') {
            if (body) {
                body.innerHTML = '<div class="neo-readme-error">无法读取 ReadMe。</div>';
            }
            return;
        }
        gui.getModTReadMe(name).then(function (readme) {
            if (!host.isConnected || host.__neoReadmeToken !== token) {
                return;
            }
            if (body) {
                body.innerHTML = readme
                    ? renderReadme(readme)
                    : '<div class="neo-readme-empty">暂无 ReadMe。</div>';
            }
            var textarea = root.querySelector('#MyConfig_field_ReadMe_r');
            if (textarea) {
                textarea.value = readme || '';
            }
            if (typeof gui.getModTJson === 'function') {
                gui.getModTJson(name).then(function (json) {
                    if (!host.isConnected || host.__neoReadmeToken !== token) {
                        return;
                    }
                    var boot = root.querySelector('#MyConfig_field_BootJson_r');
                    if (boot) {
                        boot.value = json || '';
                    }
                }).catch(function () {});
            }
        }).catch(function (error) {
            if (!host.isConnected || host.__neoReadmeToken !== token) {
                return;
            }
            if (body) {
                body.innerHTML = '<div class="neo-readme-error">读取失败: ' + escapeReadmeHtml(error && error.message || error) + '</div>';
            }
        });
    }

    function enhanceReadme(root) {
        var section = root.querySelector('#MyConfig_section_4');
        if (!section || section.dataset.neoReadmeReady === '1') {
            return;
        }
        var select = root.querySelector('#MyConfig_field_ReadMe_s');
        if (!select || !select.options || select.options.length === 0) {
            return;
        }
        var host = document.createElement('div');
        host.className = 'neo-readme-host';

        var sidebar = document.createElement('div');
        sidebar.className = 'neo-readme-sidebar';
        var search = document.createElement('input');
        search.type = 'search';
        search.className = 'neo-readme-search';
        search.placeholder = '搜索模组...';
        var list = document.createElement('div');
        list.className = 'neo-readme-list';
        sidebar.appendChild(search);
        sidebar.appendChild(list);

        var content = document.createElement('div');
        content.className = 'neo-readme-content';
        var head = document.createElement('div');
        head.className = 'neo-readme-head';
        var titleWrap = document.createElement('div');
        titleWrap.className = 'neo-readme-titlewrap';
        var title = document.createElement('div');
        title.className = 'neo-readme-title';
        title.textContent = 'ReadMe';
        var version = document.createElement('div');
        version.className = 'neo-readme-version';
        version.textContent = '版本: ?';
        titleWrap.appendChild(title);
        titleWrap.appendChild(version);
        var back = document.createElement('button');
        back.type = 'button';
        back.className = 'neo-text-btn neo-readme-back';
        back.textContent = '返回模组管理';
        back.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            activateTab(root, 2, true);
        });
        var top = document.createElement('div');
        top.className = 'neo-readme-top';
        var heading = document.createElement('div');
        heading.className = 'neo-readme-heading';
        heading.textContent = '模组说明文档 (ReadMe)';
        top.appendChild(heading);
        top.appendChild(back);
        head.appendChild(titleWrap);
        var body = document.createElement('div');
        body.className = 'neo-readme-body';
        content.appendChild(head);
        content.appendChild(body);
        host.appendChild(sidebar);
        host.appendChild(content);

        var seen = {};
        var names = [];
        for (var i = 0; i < select.options.length; i++) {
            var name = select.options[i].value;
            if (!name || seen[name]) {
                continue;
            }
            seen[name] = true;
            names.push(name);
            var item = document.createElement('button');
            item.type = 'button';
            item.className = 'neo-readme-item';
            item.setAttribute('data-neo-readme-name', name);
            item.title = name;
            item.textContent = name;
            (function (selectedName) {
                item.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    selectReadme(root, host, selectedName);
                });
            })(name);
            list.appendChild(item);
        }
        search.addEventListener('input', function () {
            var query = search.value.trim().toLowerCase();
            var items = list.querySelectorAll('.neo-readme-item');
            for (var j = 0; j < items.length; j++) {
                var candidate = String(items[j].getAttribute('data-neo-readme-name') || '').toLowerCase();
                items[j].style.display = !query || candidate.indexOf(query) >= 0 ? '' : 'none';
            }
        });

        section.appendChild(top);
        section.appendChild(host);
        section.dataset.neoReadmeReady = '1';

        var initial = select.value || names[0];
        if (initial) {
            selectReadme(root, host, initial);
        }
    }

    function logTimestamp(date) {
        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
        return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) +
            '-' + pad(date.getHours()) + pad(date.getMinutes()) + pad(date.getSeconds());
    }

    function collectLogText(container) {
        if (!container) {
            return '';
        }
        var lines = [];
        var children = container.children;
        if (children && children.length) {
            for (var i = 0; i < children.length; i++) {
                var node = children[i];
                var text = node.innerText != null ? node.innerText : node.textContent;
                lines.push(String(text == null ? '' : text).replace(/[\r\n]+$/, ''));
            }
            return lines.join('\n');
        }
        var whole = container.innerText != null ? container.innerText : container.textContent;
        return String(whole == null ? '' : whole);
    }

    function exportLoadLog(root, trigger) {
        var log = root.querySelector('#idLoadLogHtml');
        var body = collectLogText(log).replace(/\s+$/, '');
        if (!body) {
            body = '(暂无日志)';
        }
        var doc = root.ownerDocument || document;
        var view = doc.defaultView || window;
        var content = BRAND + ' 加载日志\n导出时间: ' + new Date().toLocaleString() + '\n\n' + body + '\n';
        var filename = 'ModLoaderNeo-log-' + logTimestamp(new Date()) + '.txt';
        var blob;
        try {
            blob = new (window.Blob || view.Blob || Blob)([content], { type: 'text/plain;charset=utf-8' });
        } catch (e) {
            blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        }
        var original = trigger ? trigger.value : '';
        var setButton = function (text) {
            if (trigger) {
                trigger.value = text;
            }
        };
        var resetButton = function (delay) {
            if (!trigger) {
                return;
            }
            setTimeout(function () {
                trigger.value = original;
            }, delay);
        };
        var fallbackDownload = function () {
            var url = (view.URL || window.URL).createObjectURL(blob);
            var link = doc.createElement('a');
            link.href = url;
            link.download = filename;
            link.style.display = 'none';
            (doc.body || doc.documentElement).appendChild(link);
            link.click();
            setTimeout(function () {
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
                try {
                    (view.URL || window.URL).revokeObjectURL(url);
                } catch (e) {}
            }, 1500);
            setButton('已导出');
            resetButton(1500);
        };
        try {
            var cordova = window.cordova || view.cordova || (view.parent && view.parent.cordova);
            var saveDialog = cordova && cordova.plugins && cordova.plugins.saveDialog;
            if (saveDialog && typeof saveDialog.saveFile === 'function') {
                setButton('选择保存位置…');
                var task = saveDialog.saveFile(blob, filename);
                if (task && typeof task.then === 'function') {
                    task.then(function () {
                        setButton('已导出');
                        resetButton(1500);
                    }, function () {
                        setButton('导出失败');
                        resetButton(2200);
                    });
                    return;
                }
                setButton('已导出');
                resetButton(1500);
                return;
            }
        } catch (e) {}
        fallbackDownload();
    }

    function findLogReloadButton(section) {
        var nodes = section.querySelectorAll('input, button, a');
        for (var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if (node.tagName === 'INPUT') {
                var type = String(node.getAttribute('type') || '').toLowerCase();
                if (type !== 'button' && type !== 'submit') {
                    continue;
                }
            }
            var text = String(node.value || node.textContent || '').trim();
            if (/重新载入日志|重新加载日志|重载日志|Reload/i.test(text)) {
                return node;
            }
        }
        return null;
    }

    function clearModCache(root, trigger) {
        var owner = window.modLoaderNeoCache;
        if (!owner) {
            try {
                var doc = root.ownerDocument || document;
                var view = doc.defaultView || window;
                if (view.parent && view.parent !== view) {
                    owner = view.parent.modLoaderNeoCache;
                }
            } catch (e) {}
        }
        var original = trigger.value;
        var restore = function (text) {
            trigger.value = text;
            setTimeout(function () {
                trigger.value = original;
            }, 2000);
        };
        if (!owner || typeof owner.clear !== 'function') {
            restore('缓存不可用');
            return;
        }
        trigger.value = '正在清除…';
        Promise.resolve(owner.clear()).then(function (ok) {
            restore(ok ? '缓存已清除' : '清除失败');
        }, function () {
            restore('清除失败');
        });
    }

    function enhanceLog(root) {
        var section = root && root.querySelector ? root.querySelector('#MyConfig_section_6') : null;
        if (!section) {
            return;
        }
        var existing = section.querySelector('.neo-log-export');
        if (existing && existing.parentNode) {
            return;
        }
        var log = root.querySelector('#idLoadLogHtml');
        if (!log) {
            return;
        }
        var doc = root.ownerDocument || document;
        var button = doc.createElement('input');
        button.type = 'button';
        button.className = 'neo-log-export';
        button.value = '导出日志';
        button.title = '将加载日志导出为文本文件';
        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            exportLoadLog(root, button);
        });
        var clearButton = doc.createElement('input');
        clearButton.type = 'button';
        clearButton.className = 'neo-cache-clear';
        clearButton.value = '清除加载缓存';
        clearButton.title = '清除 Mod 解析缓存，下次启动重新解析（不影响存档）';
        clearButton.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            clearModCache(root, clearButton);
        });
        var reload = findLogReloadButton(section);
        if (reload && reload.parentNode) {
            reload.parentNode.insertBefore(button, reload.nextSibling);
            reload.parentNode.insertBefore(clearButton, button.nextSibling);
        } else if (log.parentNode) {
            log.parentNode.insertBefore(button, log);
            log.parentNode.insertBefore(clearButton, button.nextSibling);
        } else {
            section.appendChild(button);
            section.appendChild(clearButton);
        }
    }

    function markNeoReady(root, panel) {
        if (root && root.__neoReadyFallback) {
            clearTimeout(root.__neoReadyFallback);
            root.__neoReadyFallback = null;
        }
        if (panel && panel.setAttribute) {
            panel.setAttribute('data-neo-ready', '1');
        }
        if (root && root.setAttribute) {
            root.setAttribute('data-neo-ready', '1');
        }
    }

    function scheduleNeoReadyFallback(root, panel) {
        if (!root || root.__neoReadyFallback) {
            return;
        }
        root.__neoReadyFallback = setTimeout(function () {
            root.__neoReadyFallback = null;
            var inner = panel;
            if (!inner && root.tagName === 'IFRAME') {
                try {
                    inner = root.contentDocument && root.contentDocument.getElementById('MyConfig');
                } catch (e) {}
            }
            if (!inner) {
                inner = root;
            }
            markNeoReady(root, inner);
        }, 4000);
    }

    function apply() {
        patchLazyAngular();
        patchGuiHooks();
        ensureStyle(document);
        bindDoc(document);
        brandStartBanner();
        patchVersionStringBrand();
        brandVersionDisplay();
        var root = document.getElementById('MyConfig');
        if (!root) {
            return;
        }
        if (root.tagName === 'IFRAME') {
            try {
                ensureStyle(root.contentDocument);
                bindDoc(root.contentDocument);
                var body = root.contentDocument && root.contentDocument.getElementById('MyConfig');
                if (body) {
                    applyTabs(body);
                    enhanceOrderComponents(body);
                    enhanceLog(body);
                    maybeEnhanceActiveTab(body);
                    applyBranding(body);
                    var iframeWrapper = body.querySelector('#MyConfig_wrapper');
                    if (iframeWrapper && iframeWrapper.dataset.neoUiTabs === '1') {
                        markNeoReady(root, body);
                    } else {
                        scheduleNeoReadyFallback(root, body);
                    }
                } else {
                    scheduleNeoReadyFallback(root, null);
                }
            } catch (e) {}
        } else {
            ensureStyle(root.ownerDocument);
            applyTabs(root);
            enhanceOrderComponents(root);
            enhanceLog(root);
            maybeEnhanceActiveTab(root);
            applyBranding(root);
            var wrapper = root.querySelector('#MyConfig_wrapper');
            if (wrapper && wrapper.dataset.neoUiTabs === '1') {
                markNeoReady(root, root);
            } else {
                scheduleNeoReadyFallback(root, root);
            }
        }
    }

    if (document.head) {
        ensureStyle(document);
    }
    if (document.head) {
        new MutationObserver(apply).observe(document.head, { childList: true });
    }
    if (document.body) {
        new MutationObserver(apply).observe(document.body, { childList: true });
    }
    if (document.body) {
        var brandPending = false;
        new MutationObserver(function () {
            if (brandPending) {
                return;
            }
            brandPending = true;
            Promise.resolve().then(function () {
                brandPending = false;
                brandStartBanner();
                brandVersionDisplay();
            });
        }).observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener('load', apply);
    patchLazyAngular();
    apply();
    (function brandBurst() {
        var raf = window.requestAnimationFrame || function (fn) { return setTimeout(fn, 16); };
        var start = typeof performance !== 'undefined' ? performance.now() : Date.now();
        var tick = function () {
            brandStartBanner();
            brandVersionDisplay();
            var now = typeof performance !== 'undefined' ? performance.now() : Date.now();
            if (now - start < 2500) {
                raf(tick);
            }
        };
        tick();
    })();
    setInterval(apply, 400);
})();

