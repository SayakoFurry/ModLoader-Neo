(function () {
    'use strict';

    var CSS = __NEO_CSS__;
    var CLASSIC_CSS = __CLASSIC_CSS__;
    var STYLE_ID = 'modloader-neo-ui-style';
    var TAB_KEY = 'modloader-neo-ui-tab';
    var SETTINGS_KEY = 'modloader-neo-ui-settings';
    var SPELL_HISTORY_KEY = 'modloader-neo-ui-spell-history';
    var SPELL_HISTORY_LIMIT = 30;
    var SPELL_LOG_LIMIT = 20;
    var CLASSIC_CLASS = 'neo-classic';
    var CLASSIC_BODY_CLASS = 'neo-classic-mode';
    var HOT_RELOAD_KEY = 'modloader-neo-ui-hot-reload';
    var HOT_RELOAD_MAX_AGE = 10 * 60 * 1000;
    var hotReloadPending = false;
    var SETTINGS_DEFAULTS = {
        scale: 'auto',
        borderWidth: 1,
        borderColor: '#7dd3fc',
        radius: 20,
        glow: true,
        uiMode: 'neo'
    };
    var BRAND = 'ModLoader Neo v1.0.6';
    var QQ_GROUP = '630879012';
    var UPDATE_REPO = 'SayakoFurry/ModLoader-Neo';
    var UPDATE_API = 'https://api.github.com/repos/' + UPDATE_REPO + '/releases/latest';
    var UPDATE_PAGE = 'https://github.com/' + UPDATE_REPO + '/releases/latest';
    var PAGES = [
        {
            key: 'mods',
            label: 'Mod 管理',
            icon: 'mods',
            badge: 'mods',
            title: 'Mod 管理',
            subtitle: '查看、拖动排序、删除与启停；内置 Mod 固定'
        },
        {
            key: 'logs',
            label: '日志管理',
            icon: 'logs',
            badge: 'log',
            title: '日志管理',
            subtitle: '加载日志与故障诊断已合并到这一页'
        },
        {
            key: 'theme',
            label: '主题',
            icon: 'theme',
            title: '主题',
            subtitle: '灯台（MapleLantern）外观与快捷控制'
        },
        {
            key: 'settings',
            label: 'Loader 设置',
            icon: 'settings',
            title: 'Loader 设置',
            subtitle: '界面、缩放、检查更新与反馈'
        }
    ];

    var PAGE_BY_KEY = {};
    for (var pageIdx = 0; pageIdx < PAGES.length; pageIdx++) {
        PAGE_BY_KEY[PAGES[pageIdx].key] = PAGES[pageIdx];
    }

    var NEO_ICONS = {
        mods: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="2"></rect><rect x="13.5" y="3.5" width="7" height="7" rx="2"></rect><rect x="3.5" y="13.5" width="7" height="7" rx="2"></rect><rect x="13.5" y="13.5" width="7" height="7" rx="2"></rect></svg>',
        logs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3.8h9.6L19 7.2v13H6z"></path><path d="M15.4 3.8v3.6H19"></path><path d="M9 11h7M9 14.4h7M9 17.8h4.6"></path></svg>',
        theme: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2"></circle><path d="M12 3.8v3.1M12 17.1v3.1M3.8 12h3.1M17.1 12h3.1"></path></svg>',
        settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path><circle cx="9" cy="7" r="2.1"></circle><circle cx="15" cy="12" r="2.1"></circle><circle cx="8" cy="17" r="2.1"></circle></svg>',
        search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.2"></circle><path d="M15.6 15.6L20 20"></path></svg>',
        back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5"></path></svg>',
        close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>',
        reload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 8.4A8 8 0 0 0 5.3 7"></path><path d="M5 4.2V8h3.8"></path><path d="M5 15.6A8 8 0 0 0 18.7 17"></path><path d="M19 19.8V16h-3.8"></path></svg>',
        add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>',
        trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9.5 7V4.6h5V7"></path><path d="M6.6 7l.8 13.1h9.2L17.4 7"></path><path d="M10 10.8v5.8M14 10.8v5.8"></path></svg>',
        chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5L15.5 12 9 18.5"></path></svg>'
    };

    function ensureStyle(doc) {
        if (!doc || !doc.head) {
            return;
        }
        var mode = isClassicUiMode() ? 'classic' : 'neo';
        var style = doc.getElementById(STYLE_ID);
        if (!style) {
            style = doc.createElement('style');
            style.id = STYLE_ID;
            style.setAttribute('data-neo-mode', mode);
            style.textContent = mode === 'classic' ? CSS + '\n' + CLASSIC_CSS : CSS;
            doc.head.appendChild(style);
            return;
        }
        if (style.getAttribute('data-neo-mode') !== mode) {
            style.textContent = mode === 'classic' ? CSS + '\n' + CLASSIC_CSS : CSS;
            style.setAttribute('data-neo-mode', mode);
        }
    }

    function loadSettings() {
        var settings = {
            scale: SETTINGS_DEFAULTS.scale,
            borderWidth: SETTINGS_DEFAULTS.borderWidth,
            borderColor: SETTINGS_DEFAULTS.borderColor,
            radius: SETTINGS_DEFAULTS.radius,
            glow: SETTINGS_DEFAULTS.glow,
            uiMode: SETTINGS_DEFAULTS.uiMode
        };
        try {
            var raw = localStorage.getItem(SETTINGS_KEY);
            if (!raw) {
                return settings;
            }
            var saved = JSON.parse(raw);
            if (!saved || typeof saved !== 'object') {
                return settings;
            }
            if (saved.scale === 'auto') {
                settings.scale = 'auto';
            } else if (saved.scale != null && isFinite(Number(saved.scale))) {
                settings.scale = String(Math.min(2, Math.max(0.8, Number(saved.scale))));
            }
            if (saved.borderWidth != null && isFinite(Number(saved.borderWidth))) {
                settings.borderWidth = Math.min(8, Math.max(0, Math.round(Number(saved.borderWidth))));
            }
            if (typeof saved.borderColor === 'string' && /^#[0-9a-f]{6}$/i.test(saved.borderColor)) {
                settings.borderColor = saved.borderColor;
            }
            if (saved.radius != null && isFinite(Number(saved.radius))) {
                settings.radius = Math.min(40, Math.max(0, Math.round(Number(saved.radius))));
            }
            if (typeof saved.glow === 'boolean') {
                settings.glow = saved.glow;
            }
            if (saved.uiMode === 'classic' || saved.uiMode === 'original') {
                settings.uiMode = 'classic';
            }
        } catch (e) {}
        return settings;
    }

    function saveSettings(settings) {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {}
    }

    function isClassicUiMode() {
        return loadSettings().uiMode === 'classic';
    }

    function saveUiMode(mode) {
        var settings = loadSettings();
        settings.uiMode = mode === 'classic' ? 'classic' : 'neo';
        saveSettings(settings);
    }

    function applyUiSkin(root, inner) {
        var classic = isClassicUiMode();
        if (document.body) {
            document.body.classList.toggle(CLASSIC_BODY_CLASS, classic);
        }
        if (root && root.classList) {
            root.classList.toggle(CLASSIC_CLASS, classic);
        }
        if (inner && inner !== root && inner.classList) {
            inner.classList.toggle(CLASSIC_CLASS, classic);
        }
    }

    function updateUiModeControls() {
        var root = document.getElementById('MyConfig');
        var inner = innerConfigRoot(root);
        if (!inner || !inner.querySelector) {
            return;
        }
        var section = inner.querySelector('#MyConfig_section_8');
        if (!section) {
            return;
        }
        var current = isClassicUiMode() ? 'classic' : 'neo';
        var buttons = section.querySelectorAll('[data-neo-ui-mode]');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].classList.toggle('neo-primary', buttons[i].getAttribute('data-neo-ui-mode') === current);
        }
        var note = section.querySelector('.neo-ui-mode-note');
        if (note) {
            note.textContent = current === 'classic'
                ? '当前为原版 ModLoader 灰色风格，切换后立即生效。'
                : '当前为 Origin 浅色界面，切换后立即生效。';
        }
    }

    function switchUiMode(mode) {
        var next = mode === 'classic' ? 'classic' : 'neo';
        if (isClassicUiMode() === (next === 'classic')) {
            return;
        }
        saveUiMode(next);
        apply();
        updateUiModeControls();
    }

    function autoUiScale() {
        var width = (window.visualViewport && window.visualViewport.width) || window.innerWidth || 1024;
        var scale = 1;
        // 手机窄屏不再放大：管理器已经占满屏宽，再放大只会让页签换行、内容横向溢出。
        if (width > 720) {
            if (width <= 820) {
                scale = 1.12;
            } else if (width <= 1080) {
                scale = 1.04;
            }
            if (navigator.maxTouchPoints > 0) {
                scale += 0.04;
            }
        }
        return Math.round(Math.min(1.5, Math.max(1, scale)) * 100) / 100;
    }

    function currentNeoVersion() {
        var match = /(\d+(?:\.\d+){1,3})/.exec(BRAND);
        return match ? match[1] : '';
    }

    function versionParts(version) {
        var parts = String(version || '').split('.');
        var result = [];
        for (var i = 0; i < parts.length; i++) {
            var value = parseInt(parts[i], 10);
            result.push(isFinite(value) ? value : 0);
        }
        return result;
    }

    function compareVersion(a, b) {
        var pa = versionParts(a);
        var pb = versionParts(b);
        var len = Math.max(pa.length, pb.length);
        for (var i = 0; i < len; i++) {
            var va = pa[i] || 0;
            var vb = pb[i] || 0;
            if (va > vb) {
                return 1;
            }
            if (va < vb) {
                return -1;
            }
        }
        return 0;
    }

    function releaseVersion(release) {
        if (!release) {
            return '';
        }
        var candidates = [release.name, release.tag_name];
        var assets = release.assets || [];
        for (var i = 0; i < assets.length; i++) {
            candidates.push(assets[i] && assets[i].name);
        }
        for (var c = 0; c < candidates.length; c++) {
            var text = String(candidates[c] || '');
            var match = /(?:^|[^\d])v?(\d+(?:\.\d+){1,3})(?:[^\d]|$)/i.exec(text);
            if (match) {
                return match[1];
            }
        }
        return '';
    }

    function formatReleaseDate(release) {
        var raw = release && (release.published_at || release.created_at);
        if (!raw) {
            return '';
        }
        var date = new Date(raw);
        if (isNaN(date.getTime())) {
            return String(raw);
        }
        try {
            return date.toLocaleString();
        } catch (e) {
            return String(raw);
        }
    }

    function getReleaseAsset(release, pattern) {
        var assets = (release && release.assets) || [];
        for (var i = 0; i < assets.length; i++) {
            var name = String(assets[i] && assets[i].name || '');
            if (pattern.test(name)) {
                return assets[i];
            }
        }
        return null;
    }

    function isAndroidClient() {
        try {
            return /Android/i.test(navigator.userAgent || '');
        } catch (e) {
            return false;
        }
    }

    function safeGithubUrl(url, fallback) {
        var text = String(url || '');
        if (/^https:\/\/([a-z0-9-]+\.)*(github\.com|githubusercontent\.com)\//i.test(text)) {
            return text;
        }
        return fallback || UPDATE_PAGE;
    }

    function openExternalUrl(url) {
        var target = safeGithubUrl(url);
        try {
            var topWin = window.top || window;
            var topDoc = topWin.document;
            var link = topDoc.createElement('a');
            link.href = target;
            link.rel = 'noopener noreferrer';
            link.style.display = 'none';
            var hasCordova = !!(window.cordova || (topWin && topWin.cordova));
            if (!hasCordova) {
                link.target = '_blank';
            }
            (topDoc.body || topDoc.documentElement).appendChild(link);
            link.click();
            setTimeout(function () {
                if (link.parentNode) {
                    link.parentNode.removeChild(link);
                }
            }, 1500);
            return true;
        } catch (e) {
            try {
                window.open(target, '_blank');
                return true;
            } catch (e2) {}
        }
        return false;
    }

    function fetchLatestRelease() {
        return new Promise(function (resolve, reject) {
            if (typeof XMLHttpRequest !== 'function') {
                reject(new Error('XMLHttpRequest unavailable'));
                return;
            }
            var xhr = new XMLHttpRequest();
            var settled = false;
            var finish = function (fn, value) {
                if (settled) {
                    return;
                }
                settled = true;
                fn(value);
            };
            try {
                xhr.open('GET', UPDATE_API + '?_=' + Date.now(), true);
                xhr.timeout = 15000;
                xhr.onload = function () {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            finish(resolve, JSON.parse(xhr.responseText));
                        } catch (e) {
                            finish(reject, new Error('invalid response'));
                        }
                    } else {
                        var error = new Error('HTTP ' + xhr.status);
                        error.status = xhr.status;
                        finish(reject, error);
                    }
                };
                xhr.onerror = function () {
                    finish(reject, new Error('network'));
                };
                xhr.ontimeout = function () {
                    finish(reject, new Error('timeout'));
                };
                xhr.onabort = function () {
                    finish(reject, new Error('abort'));
                };
                xhr.send();
            } catch (e) {
                finish(reject, e);
            }
        });
    }

    function addUpdateButton(doc, parent, text, extraClass) {
        var button = doc.createElement('button');
        button.type = 'button';
        button.className = 'neo-text-btn' + (extraClass ? ' ' + extraClass : '');
        button.textContent = text;
        parent.appendChild(button);
        return button;
    }

    function buildUpdateGroup(root) {
        var doc = (root && root.ownerDocument) || document;
        var group = settingsGroup(doc, '检查更新', '从 GitHub 仓库 ' + UPDATE_REPO + ' 检查 ModLoader Neo 的最新发布版本。');
        var versionRow = settingsRow(doc, '当前版本');
        var versionValue = doc.createElement('span');
        versionValue.className = 'neo-settings-value';
        versionValue.textContent = 'v' + (currentNeoVersion() || '未知');
        versionRow.appendChild(versionValue);
        group.appendChild(versionRow);

        var actions = doc.createElement('div');
        actions.className = 'neo-settings-actions neo-update-actions';
        var checkButton = doc.createElement('button');
        checkButton.type = 'button';
        checkButton.className = 'neo-text-btn neo-settings-check-update';
        checkButton.textContent = '检查更新';
        var repoButton = doc.createElement('button');
        repoButton.type = 'button';
        repoButton.className = 'neo-text-btn';
        repoButton.textContent = '打开发布页';
        repoButton.addEventListener('click', function () {
            openExternalUrl(UPDATE_PAGE);
        });
        var status = doc.createElement('span');
        status.className = 'neo-update-status';
        actions.appendChild(checkButton);
        actions.appendChild(repoButton);
        actions.appendChild(status);
        group.appendChild(actions);

        var card = doc.createElement('div');
        card.className = 'neo-update-card';
        card.hidden = true;
        var head = doc.createElement('div');
        head.className = 'neo-update-head';
        var title = doc.createElement('div');
        title.className = 'neo-update-title';
        var date = doc.createElement('div');
        date.className = 'neo-update-date';
        head.appendChild(title);
        head.appendChild(date);
        var notes = doc.createElement('div');
        notes.className = 'neo-update-notes';
        var cardActions = doc.createElement('div');
        cardActions.className = 'neo-update-card-actions';
        var hint = doc.createElement('div');
        hint.className = 'neo-update-hint';
        card.appendChild(head);
        card.appendChild(notes);
        card.appendChild(cardActions);
        card.appendChild(hint);
        group.appendChild(card);

        var checking = false;
        var setStatus = function (text, tone) {
            status.textContent = text;
            status.className = 'neo-update-status' + (tone ? ' neo-update-' + tone : '');
        };

        var showRelease = function (release) {
            var current = currentNeoVersion();
            var remote = releaseVersion(release);
            if (remote && compareVersion(remote, current) <= 0) {
                setStatus('已是最新版本 v' + current, 'ok');
                card.hidden = true;
                return;
            }
            var pageUrl = safeGithubUrl(release.html_url, UPDATE_PAGE);
            title.textContent = remote ? '发现新版本 v' + remote : '发现新版本：' + String(release.name || release.tag_name || '').trim();
            date.textContent = formatReleaseDate(release);
            var body = String(release.body || '').replace(/\r\n/g, '\n').trim();
            if (body.length > 3000) {
                body = body.slice(0, 3000) + '\n…';
            }
            notes.textContent = body || '（该版本没有发布说明）';
            cardActions.innerHTML = '';
            var android = isAndroidClient();
            var apk = getReleaseAsset(release, /\.apk$/i);
            var hintText;
            if (android) {
                if (apk && apk.browser_download_url) {
                    var installButton = addUpdateButton(doc, cardActions, '下载并安装', 'neo-primary');
                    installButton.addEventListener('click', function () {
                        openExternalUrl(safeGithubUrl(apk.browser_download_url, pageUrl));
                    });
                    hintText = '将打开浏览器下载 APK，下载完成后按系统提示安装。';
                    if (apk.size) {
                        hintText += '（约 ' + (Math.round(apk.size / 1048576 * 10) / 10) + ' MB）';
                    }
                } else {
                    var androidPageButton = addUpdateButton(doc, cardActions, '打开发布页', 'neo-primary');
                    androidPageButton.addEventListener('click', function () {
                        openExternalUrl(pageUrl);
                    });
                    hintText = '本次发布中没有找到 APK 文件，请从发布页下载。';
                }
            } else {
                var downloadButton = addUpdateButton(doc, cardActions, '前往下载', 'neo-primary');
                downloadButton.addEventListener('click', function () {
                    openExternalUrl(pageUrl);
                });
                hintText = '将打开 GitHub Release 页面，可下载最新 HTML 或 APK。';
            }
            var pageButton = addUpdateButton(doc, cardActions, '查看发布页', '');
            pageButton.addEventListener('click', function () {
                openExternalUrl(pageUrl);
            });
            var laterButton = addUpdateButton(doc, cardActions, '稍后', '');
            laterButton.addEventListener('click', function () {
                card.hidden = true;
                setStatus('发现新版本' + (remote ? ' v' + remote : '') + '，稍后可再次检查。', 'ok');
            });
            hint.textContent = hintText;
            card.hidden = false;
            setStatus('发现新版本' + (remote ? ' v' + remote : ''), 'ok');
        };

        checkButton.addEventListener('click', function () {
            if (checking) {
                return;
            }
            checking = true;
            checkButton.disabled = true;
            checkButton.textContent = '正在检查…';
            setStatus('正在连接 GitHub…', '');
            card.hidden = true;
            fetchLatestRelease().then(function (release) {
                checking = false;
                checkButton.disabled = false;
                checkButton.textContent = '检查更新';
                showRelease(release);
            }, function (error) {
                checking = false;
                checkButton.disabled = false;
                checkButton.textContent = '检查更新';
                var message = '检查更新失败，请检查网络后重试。';
                if (error && error.status === 403) {
                    message = 'GitHub 请求过于频繁，请稍后再试。';
                } else if (error && error.status === 404) {
                    message = '仓库暂无发布版本。';
                } else if (error && /timeout/i.test(error.message || '')) {
                    message = '连接 GitHub 超时，请检查网络后重试。';
                }
                setStatus(message, 'error');
                card.hidden = true;
            });
        });

        return group;
    }

    function buildFeedbackGroup() {
        var doc = document;
        var group = settingsGroup(doc, '反馈与交流', '遇到问题、Bug 或有功能想法，欢迎加入 QQ 群反馈。');
        var row = settingsRow(doc, 'QQ 群');
        var value = doc.createElement('span');
        value.className = 'neo-settings-value';
        value.textContent = QQ_GROUP;
        var button = doc.createElement('button');
        button.type = 'button';
        button.className = 'neo-text-btn';
        button.textContent = '复制群号';
        button.addEventListener('click', function () {
            copyPlainText(QQ_GROUP).then(function (ok) {
                button.textContent = ok ? '已复制' : '复制失败';
                setTimeout(function () {
                    button.textContent = '复制群号';
                }, 1800);
            });
        });
        row.appendChild(value);
        row.appendChild(button);
        group.appendChild(row);
        var hint = doc.createElement('div');
        hint.className = 'neo-settings-group-desc';
        hint.textContent = '反馈时请说明 ModLoader Neo 版本、Mod 列表和问题现象；加载日志可在「日志」分页导出。';
        group.appendChild(hint);
        return group;
    }

    function buildUiModeGroup() {
        var doc = document;
        var current = isClassicUiMode() ? 'classic' : 'neo';
        var group = settingsGroup(doc, '界面模式', '在 Origin 浅色界面与原版 ModLoader 灰色风格之间切换。原版风格会保留新的侧栏分页与管理功能，只替换配色。');
        var actions = doc.createElement('div');
        actions.className = 'neo-settings-actions neo-ui-mode-actions';
        [
            ['neo', 'Origin 浅色（推荐）'],
            ['classic', '原版风格（灰）']
        ].forEach(function (def) {
            var button = doc.createElement('button');
            button.type = 'button';
            button.className = 'neo-text-btn' + (def[0] === current ? ' neo-primary' : '');
            button.setAttribute('data-neo-ui-mode', def[0]);
            button.textContent = def[1];
            button.addEventListener('click', function () {
                switchUiMode(def[0]);
            });
            actions.appendChild(button);
        });
        group.appendChild(actions);
        var note = doc.createElement('div');
        note.className = 'neo-ui-mode-note';
        note.textContent = current === 'classic'
            ? '当前为原版风格。新的侧栏分页、Mod 列表与 ReadMe 仍然可用，仅换成原版 ModLoader 的灰色配色。'
            : '当前为 Origin 浅色界面。原版风格会保留新的侧栏分页与管理功能，只把配色换成原版 ModLoader 的灰色样式。';
        group.appendChild(note);
        return group;
    }

    function configRoots(root) {
        var targets = [];
        var push = function (element) {
            if (element && targets.indexOf(element) < 0) {
                targets.push(element);
            }
        };
        push(root);
        if (!root) {
            return targets;
        }
        if (root.tagName === 'IFRAME') {
            try {
                if (root.contentDocument) {
                    push(root.contentDocument.getElementById('MyConfig'));
                }
            } catch (e) {}
        } else {
            try {
                var view = root.ownerDocument && root.ownerDocument.defaultView;
                if (view && view.frameElement) {
                    push(view.frameElement);
                }
            } catch (e) {}
        }
        return targets;
    }

    function innerConfigRoot(root) {
        if (!root) {
            return null;
        }
        if (root.tagName === 'IFRAME') {
            try {
                return root.contentDocument && root.contentDocument.getElementById('MyConfig');
            } catch (e) {
                return null;
            }
        }
        return root;
    }

    function applyThemeSettings(root) {
        if (!root) {
            return;
        }
        var settings = loadSettings();
        var scale = settings.scale === 'auto' ? autoUiScale() : Number(settings.scale);
        if (!isFinite(scale) || scale <= 0) {
            scale = 1;
        }
        var targets = configRoots(root);
        var themeKey = [
            settings.scale,
            settings.borderWidth,
            settings.borderColor,
            settings.radius,
            settings.glow ? '1' : '0',
            String(scale)
        ].join('|');
        for (var i = 0; i < targets.length; i++) {
            var element = targets[i];
            if (!element || !element.style) {
                continue;
            }
            // Reopen (GM_config.open) resets the root's style.cssText, wiping these
            // custom properties while the memo below still matches, so verify the
            // actual inline value before trusting the cache.
            if (element.__neoThemeKey === themeKey &&
                element.style.getPropertyValue('--neo-ui-scale') === String(scale)) {
                continue;
            }
            element.style.setProperty('--neo-ui-scale', String(scale));
            element.style.setProperty('--neo-border-width', settings.borderWidth + 'px');
            element.style.setProperty('--neo-border-color', settings.borderColor);
            element.style.setProperty('--neo-radius', settings.radius + 'px');
            if (element.setAttribute) {
                element.setAttribute('data-neo-glow', settings.glow ? '1' : '0');
            }
            if (element.tagName === 'IFRAME') {
                element.style.border = settings.borderWidth > 0
                    ? settings.borderWidth + 'px solid ' + settings.borderColor
                    : '0 solid transparent';
                element.style.borderRadius = settings.radius + 'px';
            }
            element.__neoThemeKey = themeKey;
        }
        var inner = innerConfigRoot(root);
        if (!inner) {
            return;
        }
        var wrapper = inner.querySelector('#MyConfig_wrapper');
        if (wrapper) {
            var zoom = String(scale);
            if (wrapper.style.zoom !== zoom) {
                wrapper.style.zoom = zoom;
            }
            // zoom 下百分比宽度会按缩放后的坐标解析，100% 正好铺满管理器。
            if (wrapper.style.width !== '100%') {
                wrapper.style.width = '100%';
            }
        }
        var state = inner.querySelector('#neo-settings-scale-state');
        if (state) {
            var text = (settings.scale === 'auto' ? '自动 · ' : '固定 · ') + Math.round(scale * 100) + '%';
            if (state.textContent !== text) {
                state.textContent = text;
            }
        }
        var colorValue = inner.querySelector('#neo-settings-color-value');
        if (colorValue && colorValue.textContent !== settings.borderColor) {
            colorValue.textContent = settings.borderColor;
        }
    }

    function settingsGroup(doc, title, desc) {
        var group = doc.createElement('div');
        group.className = 'neo-settings-group';
        var heading = doc.createElement('div');
        heading.className = 'neo-settings-group-title';
        heading.textContent = title;
        group.appendChild(heading);
        if (desc) {
            var note = doc.createElement('div');
            note.className = 'neo-settings-group-desc';
            note.textContent = desc;
            group.appendChild(note);
        }
        return group;
    }

    function settingsRow(doc, labelText) {
        var row = doc.createElement('div');
        row.className = 'neo-settings-row';
        var label = doc.createElement('span');
        label.className = 'neo-settings-label';
        label.textContent = labelText;
        row.appendChild(label);
        return row;
    }

    function updateSettings(root, patch) {
        var next = loadSettings();
        for (var key in patch) {
            if (Object.prototype.hasOwnProperty.call(patch, key)) {
                next[key] = patch[key];
            }
        }
        saveSettings(next);
        applyThemeSettings(root);
    }

    function copyPlainText(text) {
        return new Promise(function (resolve) {
            var fallback = function () {
                try {
                    var area = document.createElement('textarea');
                    area.value = text;
                    area.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0;';
                    (document.body || document.documentElement).appendChild(area);
                    area.focus();
                    area.select();
                    var ok = document.execCommand && document.execCommand('copy');
                    if (area.parentNode) {
                        area.parentNode.removeChild(area);
                    }
                    resolve(!!ok);
                } catch (e) {
                    resolve(false);
                }
            };
            try {
                if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                    navigator.clipboard.writeText(text).then(function () {
                        resolve(true);
                    }, fallback);
                    return;
                }
            } catch (e) {}
            fallback();
        });
    }

    function gameApi() {
        var sc = window.SugarCube || null;
        return {
            save: window.Save || (sc && sc.Save) || null,
            state: window.State || (sc && sc.State) || null,
            engine: window.Engine || (sc && sc.Engine) || null
        };
    }

    function readHotReloadMarker() {
        try {
            var raw = sessionStorage.getItem(HOT_RELOAD_KEY);
            if (!raw) {
                return null;
            }
            var data = JSON.parse(raw);
            if (!data || typeof data !== 'object') {
                sessionStorage.removeItem(HOT_RELOAD_KEY);
                return null;
            }
            if (data.time && Date.now() - Number(data.time) > HOT_RELOAD_MAX_AGE) {
                sessionStorage.removeItem(HOT_RELOAD_KEY);
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    function clearHotReloadMarker() {
        try {
            sessionStorage.removeItem(HOT_RELOAD_KEY);
        } catch (e) {}
    }

    function requestHotReload(source) {
        var api = gameApi();
        var passage = api.state && api.state.passage ? String(api.state.passage) : null;
        var save = null;
        if (api.save && typeof api.save.serialize === 'function' && passage) {
            try {
                var raw = api.save.serialize();
                if (typeof raw === 'string' && raw.length > 0) {
                    save = raw;
                }
            } catch (e) {}
        }
        var marker = {
            save: save,
            passage: passage,
            time: Date.now()
        };
        try {
            sessionStorage.setItem(HOT_RELOAD_KEY, JSON.stringify(marker));
        } catch (e) {
            try {
                sessionStorage.setItem(HOT_RELOAD_KEY, JSON.stringify({
                    save: null,
                    passage: passage,
                    time: Date.now()
                }));
            } catch (e2) {}
        }
        if (source) {
            source.disabled = true;
            if (source.tagName === 'INPUT') {
                source.value = '正在热重载…';
            } else {
                source.textContent = '正在热重载…';
            }
        }
        setTimeout(function () {
            try {
                window.location.reload();
            } catch (e) {}
        }, 120);
    }

    function buildSettingsPanel(root, section) {
        var doc = section.ownerDocument;
        var settings = loadSettings();
        section.innerHTML = '';

        var intro = doc.createElement('div');
        intro.className = 'neo-settings-intro';
        intro.textContent = '以下界面设置修改后立即生效并自动保存在本机；检查更新会访问 GitHub。';
        section.appendChild(intro);

        section.appendChild(buildUiModeGroup());

        section.appendChild(buildUpdateGroup(root));

        section.appendChild(buildFeedbackGroup());

        var scaleGroup = settingsGroup(doc, '屏幕自适应与按键大小', '手机上按键过小时可调大；“自动”会按屏幕宽度选择合适的缩放比例。');
        var scaleRow = settingsRow(doc, '缩放比例');
        var scaleSelect = doc.createElement('select');
        scaleSelect.id = 'neo-settings-scale';
        scaleSelect.className = 'neo-settings-select';
        var scaleOptions = [
            ['auto', '自动（按屏幕适配）'],
            ['1', '100%'],
            ['1.1', '110%'],
            ['1.25', '125%'],
            ['1.5', '150%'],
            ['1.75', '175%'],
            ['2', '200%']
        ];
        for (var s = 0; s < scaleOptions.length; s++) {
            var option = doc.createElement('option');
            option.value = scaleOptions[s][0];
            option.textContent = scaleOptions[s][1];
            scaleSelect.appendChild(option);
        }
        var chosen = settings.scale === 'auto' ? 'auto' : String(settings.scale);
        var known = false;
        for (var k = 0; k < scaleOptions.length; k++) {
            if (scaleOptions[k][0] === chosen) {
                known = true;
                break;
            }
        }
        scaleSelect.value = known ? chosen : 'auto';
        scaleSelect.addEventListener('change', function () {
            updateSettings(root, { scale: scaleSelect.value });
        });
        scaleRow.appendChild(scaleSelect);
        var scaleState = doc.createElement('span');
        scaleState.id = 'neo-settings-scale-state';
        scaleState.className = 'neo-settings-value';
        scaleRow.appendChild(scaleState);
        scaleGroup.appendChild(scaleRow);
        section.appendChild(scaleGroup);

        var borderGroup = settingsGroup(doc, '界面边框', '自定义加载器面板的边框颜色、粗细、圆角和外发光。');
        var colorRow = settingsRow(doc, '边框颜色');
        var colorInput = doc.createElement('input');
        colorInput.type = 'color';
        colorInput.id = 'neo-settings-border-color';
        colorInput.className = 'neo-settings-color';
        colorInput.value = settings.borderColor;
        var colorValue = doc.createElement('span');
        colorValue.id = 'neo-settings-color-value';
        colorValue.className = 'neo-settings-value';
        colorValue.textContent = settings.borderColor;
        colorInput.addEventListener('input', function () {
            colorValue.textContent = colorInput.value;
            updateSettings(root, { borderColor: colorInput.value });
        });
        colorRow.appendChild(colorInput);
        colorRow.appendChild(colorValue);
        borderGroup.appendChild(colorRow);

        var widthRow = settingsRow(doc, '边框粗细');
        var widthInput = doc.createElement('input');
        widthInput.type = 'range';
        widthInput.id = 'neo-settings-border-width';
        widthInput.className = 'neo-settings-range';
        widthInput.min = '0';
        widthInput.max = '8';
        widthInput.step = '1';
        widthInput.value = String(settings.borderWidth);
        var widthValue = doc.createElement('span');
        widthValue.className = 'neo-settings-value';
        widthValue.textContent = settings.borderWidth + ' px';
        widthInput.addEventListener('input', function () {
            widthValue.textContent = widthInput.value + ' px';
            updateSettings(root, { borderWidth: Number(widthInput.value) });
        });
        widthRow.appendChild(widthInput);
        widthRow.appendChild(widthValue);
        borderGroup.appendChild(widthRow);

        var radiusRow = settingsRow(doc, '圆角大小');
        var radiusInput = doc.createElement('input');
        radiusInput.type = 'range';
        radiusInput.id = 'neo-settings-radius';
        radiusInput.className = 'neo-settings-range';
        radiusInput.min = '0';
        radiusInput.max = '40';
        radiusInput.step = '2';
        radiusInput.value = String(settings.radius);
        var radiusValue = doc.createElement('span');
        radiusValue.className = 'neo-settings-value';
        radiusValue.textContent = settings.radius + ' px';
        radiusInput.addEventListener('input', function () {
            radiusValue.textContent = radiusInput.value + ' px';
            updateSettings(root, { radius: Number(radiusInput.value) });
        });
        radiusRow.appendChild(radiusInput);
        radiusRow.appendChild(radiusValue);
        borderGroup.appendChild(radiusRow);

        var glowRow = settingsRow(doc, '外发光');
        var glowLabel = doc.createElement('label');
        glowLabel.className = 'neo-settings-toggle';
        var glowInput = doc.createElement('input');
        glowInput.type = 'checkbox';
        glowInput.id = 'neo-settings-glow';
        glowInput.checked = !!settings.glow;
        glowInput.addEventListener('change', function () {
            updateSettings(root, { glow: glowInput.checked });
        });
        glowLabel.appendChild(glowInput);
        var glowText = doc.createElement('span');
        glowText.textContent = '显示边框光效';
        glowLabel.appendChild(glowText);
        glowRow.appendChild(glowLabel);
        borderGroup.appendChild(glowRow);
        section.appendChild(borderGroup);

        var actions = doc.createElement('div');
        actions.className = 'neo-settings-actions';
        var reset = doc.createElement('button');
        reset.type = 'button';
        reset.className = 'neo-text-btn neo-settings-reset';
        reset.textContent = '恢复默认设置';
        reset.addEventListener('click', function () {
            saveSettings({
                scale: SETTINGS_DEFAULTS.scale,
                borderWidth: SETTINGS_DEFAULTS.borderWidth,
                borderColor: SETTINGS_DEFAULTS.borderColor,
                radius: SETTINGS_DEFAULTS.radius,
                glow: SETTINGS_DEFAULTS.glow,
                uiMode: isClassicUiMode() ? 'classic' : 'neo'
            });
            buildSettingsPanel(root, section);
            applyThemeSettings(root);
        });
        actions.appendChild(reset);
        section.appendChild(actions);
    }

    function ensureSettingsSection(root) {
        var wrapper = root && root.querySelector ? root.querySelector('#MyConfig_wrapper') : null;
        if (!wrapper) {
            return null;
        }
        var section = root.querySelector('#MyConfig_section_8');
        if (!section) {
            section = wrapper.ownerDocument.createElement('div');
            section.id = 'MyConfig_section_8';
            section.className = 'section_header_holder neo-settings-section';
            wrapper.appendChild(section);
            buildSettingsPanel(root, section);
        } else if (!section.dataset.neoSettingsReady) {
            buildSettingsPanel(root, section);
        }
        section.dataset.neoSettingsReady = '1';
        return section;
    }

    function loadSpellHistory() {
        try {
            var raw = localStorage.getItem(SPELL_HISTORY_KEY);
            var saved = raw ? JSON.parse(raw) : [];
            if (!Array.isArray(saved)) {
                return [];
            }
            var list = [];
            for (var i = 0; i < saved.length && list.length < SPELL_HISTORY_LIMIT; i++) {
                var item = saved[i];
                if (!item || typeof item.code !== 'string' || !item.code.trim()) {
                    continue;
                }
                list.push({
                    code: item.code,
                    time: Number(item.time) || 0,
                    ok: item.ok !== false
                });
            }
            return list;
        } catch (e) {
            return [];
        }
    }

    function saveSpellHistory(list) {
        try {
            localStorage.setItem(SPELL_HISTORY_KEY, JSON.stringify(list.slice(0, SPELL_HISTORY_LIMIT)));
        } catch (e) {}
    }

    function rememberSpell(code, ok) {
        var list = loadSpellHistory();
        var next = [{ code: code, time: Date.now(), ok: !!ok }];
        for (var i = 0; i < list.length; i++) {
            if (list[i].code === code) {
                continue;
            }
            next.push(list[i]);
            if (next.length >= SPELL_HISTORY_LIMIT) {
                break;
            }
        }
        saveSpellHistory(next);
        return next;
    }

    function spellWindowCandidates(root) {
        var list = [];
        var push = function (view) {
            if (view && list.indexOf(view) < 0) {
                list.push(view);
            }
        };
        try { push(window); } catch (e) {}
        try { push(window.top); } catch (e) {}
        try { push(window.parent); } catch (e) {}
        var doc = root && root.ownerDocument;
        if (doc) {
            try { push(doc.defaultView); } catch (e) {}
            try { if (doc.defaultView) push(doc.defaultView.parent); } catch (e) {}
            try { if (doc.defaultView) push(doc.defaultView.top); } catch (e) {}
        }
        return list;
    }

    function findSpellHost(root) {
        var list = spellWindowCandidates(root);
        for (var i = 0; i < list.length; i++) {
            var view = list[i];
            try {
                if (!view || !view.document || !view.State) {
                    continue;
                }
                if (typeof view.Wikifier === 'function'
                    || (view.jQuery && view.jQuery.fn && typeof view.jQuery.fn.wiki === 'function')) {
                    return view;
                }
            } catch (e) {}
        }
        return null;
    }

    function executeSpell(root, code) {
        var view = findSpellHost(root);
        if (!view) {
            return {
                ok: false,
                error: '未找到游戏运行环境。请先进入游戏，再打开加载器执行言灵。',
                nodes: []
            };
        }
        var temp;
        try {
            temp = view.document.createElement('div');
        } catch (e) {
            return { ok: false, error: '无法创建言灵输出容器。', nodes: [] };
        }
        try {
            var jq = view.jQuery;
            if (jq && jq.fn && typeof jq.fn.wiki === 'function') {
                jq(temp).wiki(code);
            } else {
                new view.Wikifier(temp, code);
            }
        } catch (e) {
            return {
                ok: false,
                error: (e && (e.message || e)) ? String(e.message || e) : '言灵执行失败',
                nodes: []
            };
        }
        var nodes = [];
        if (temp.childNodes) {
            for (var i = 0; i < temp.childNodes.length; i++) {
                nodes.push(temp.childNodes[i]);
            }
        }
        var errorNode = temp.querySelector ? temp.querySelector('.error') : null;
        if (errorNode) {
            return {
                ok: false,
                error: errorNode.textContent || '言灵语法错误',
                nodes: nodes
            };
        }
        return {
            ok: true,
            text: temp.textContent || '',
            nodes: nodes
        };
    }

    function spellTimeText(time) {
        if (!time) {
            return '';
        }
        try {
            return new Date(time).toLocaleTimeString();
        } catch (e) {
            return '';
        }
    }

    function renderSpellLogEmpty(section) {
        var log = section.querySelector('#neo-spell-log');
        if (!log) {
            return;
        }
        log.innerHTML = '';
        var empty = section.ownerDocument.createElement('div');
        empty.className = 'neo-spell-empty';
        empty.textContent = '尚未执行言灵。';
        log.appendChild(empty);
    }

    function appendSpellLog(root, section, code, result) {
        var doc = section.ownerDocument;
        var log = section.querySelector('#neo-spell-log');
        if (!log) {
            return;
        }
        var children = log.children;
        for (var e = children.length - 1; e >= 0; e--) {
            if (children[e].classList && children[e].classList.contains('neo-spell-empty')) {
                log.removeChild(children[e]);
            }
        }
        var entry = doc.createElement('div');
        entry.className = 'neo-spell-entry ' + (result.ok ? 'neo-spell-entry-ok' : 'neo-spell-entry-error');

        var head = doc.createElement('div');
        head.className = 'neo-spell-entry-head';
        var status = doc.createElement('span');
        status.className = 'neo-spell-entry-status';
        status.textContent = result.ok ? '执行成功' : '执行失败';
        var time = doc.createElement('span');
        time.className = 'neo-spell-entry-time';
        time.textContent = new Date().toLocaleTimeString();
        head.appendChild(status);
        head.appendChild(time);
        entry.appendChild(head);

        var codeNode = doc.createElement('pre');
        codeNode.className = 'neo-spell-entry-code';
        codeNode.textContent = code;
        entry.appendChild(codeNode);

        var body = doc.createElement('div');
        body.className = 'neo-spell-entry-body';
        var hasNodes = false;
        if (result.nodes && result.nodes.length) {
            for (var i = 0; i < result.nodes.length; i++) {
                body.appendChild(result.nodes[i]);
                hasNodes = true;
            }
        }
        if (!result.ok) {
            var errorNode = doc.createElement('div');
            errorNode.className = 'neo-spell-error';
            errorNode.textContent = result.error || '言灵执行失败';
            body.insertBefore(errorNode, body.firstChild);
        } else if (!hasNodes) {
            var emptyNode = doc.createElement('div');
            emptyNode.className = 'neo-spell-empty';
            emptyNode.textContent = '（没有可见输出，言灵可能已经在游戏内生效）';
            body.appendChild(emptyNode);
        }
        entry.appendChild(body);

        if (log.firstChild) {
            log.insertBefore(entry, log.firstChild);
        } else {
            log.appendChild(entry);
        }
        while (log.children.length > SPELL_LOG_LIMIT) {
            log.removeChild(log.lastChild);
        }
    }

    function setSpellStatus(section, text, isError) {
        var node = section.querySelector('#neo-spell-status');
        if (!node) {
            return;
        }
        node.textContent = text;
        node.classList.toggle('neo-spell-status-error', !!isError);
    }

    function renderSpellHistory(section, textarea) {
        var listBox = section.querySelector('#neo-spell-history-list');
        if (!listBox) {
            return;
        }
        var doc = section.ownerDocument;
        listBox.innerHTML = '';
        var list = loadSpellHistory();
        if (!list.length) {
            var empty = doc.createElement('div');
            empty.className = 'neo-spell-empty';
            empty.textContent = '还没有执行记录。';
            listBox.appendChild(empty);
            return;
        }
        for (var i = 0; i < list.length; i++) {
            (function (item) {
                var button = doc.createElement('button');
                button.type = 'button';
                button.className = 'neo-spell-history-item' + (item.ok ? '' : ' neo-spell-history-item-error');
                var text = doc.createElement('span');
                text.className = 'neo-spell-history-code';
                text.textContent = item.code.replace(/\s+/g, ' ').slice(0, 120);
                var time = doc.createElement('span');
                time.className = 'neo-spell-history-time';
                time.textContent = spellTimeText(item.time);
                button.appendChild(text);
                button.appendChild(time);
                button.title = '载入这条言灵到输入框';
                button.addEventListener('click', function () {
                    textarea.value = item.code;
                    textarea.focus();
                    setSpellStatus(section, '已载入历史言灵', false);
                });
                listBox.appendChild(button);
            })(list[i]);
        }
    }

    function runSpellFromPanel(root, section) {
        var textarea = section.querySelector('#neo-spell-input');
        if (!textarea) {
            return;
        }
        var code = String(textarea.value || '').trim();
        if (!code) {
            setSpellStatus(section, '请先输入言灵内容', true);
            textarea.focus();
            return;
        }
        setSpellStatus(section, '正在执行…', false);
        var result = executeSpell(root, code);
        appendSpellLog(root, section, code, result);
        rememberSpell(code, result.ok);
        renderSpellHistory(section, textarea);
        setSpellStatus(section, result.ok ? '执行成功，言灵已在游戏内生效' : '执行失败，请查看下方输出', !result.ok);
    }

    function buildSpellPanel(root, section) {
        var doc = section.ownerDocument;
        section.innerHTML = '';

        var intro = doc.createElement('div');
        intro.className = 'neo-settings-intro';
        intro.textContent = '在这里直接编写并执行言灵（SugarCube 文本代码），效果与侧边栏言灵一致。支持 <<set>>、<<run>>、<<print>>、<<link>> 等写法。';
        section.appendChild(intro);

        var warnGroup = settingsGroup(doc, '使用前须知', '言灵会直接修改当前存档的变量，错误或不兼容的代码可能造成不可逆的存档损坏。执行前请确认内容，必要时先备份存档。');
        var warn = doc.createElement('div');
        warn.className = 'neo-spell-warning';
        warn.textContent = '请只运行自己信任的言灵；来源不明的代码可能破坏存档或泄露数据。';
        warnGroup.appendChild(warn);
        section.appendChild(warnGroup);

        var editorGroup = settingsGroup(doc, '言灵输入', '按 Ctrl + Enter 也可以直接执行。执行记录会保存在本机，不会写入存档。');
        var textarea = doc.createElement('textarea');
        textarea.id = 'neo-spell-input';
        textarea.className = 'neo-spell-input';
        textarea.rows = 8;
        textarea.spellcheck = false;
        textarea.placeholder = '例如：\n<<set $money += 1000>>\n<<print $money>>';
        textarea.addEventListener('keydown', function (event) {
            if ((event.ctrlKey || event.metaKey) && (event.key === 'Enter' || event.keyCode === 13)) {
                event.preventDefault();
                event.stopPropagation();
                runSpellFromPanel(root, section);
            }
        });
        editorGroup.appendChild(textarea);

        var actions = doc.createElement('div');
        actions.className = 'neo-spell-actions';
        var runButton = doc.createElement('button');
        runButton.type = 'button';
        runButton.id = 'neo-spell-run';
        runButton.className = 'neo-spell-run';
        runButton.textContent = '执行言灵';
        runButton.addEventListener('click', function () {
            runSpellFromPanel(root, section);
        });
        var clearInput = doc.createElement('button');
        clearInput.type = 'button';
        clearInput.className = 'neo-spell-secondary';
        clearInput.textContent = '清空输入';
        clearInput.addEventListener('click', function () {
            textarea.value = '';
            textarea.focus();
            setSpellStatus(section, '输入已清空', false);
        });
        var status = doc.createElement('span');
        status.id = 'neo-spell-status';
        status.className = 'neo-spell-status';
        status.textContent = '等待输入言灵';
        actions.appendChild(runButton);
        actions.appendChild(clearInput);
        actions.appendChild(status);
        editorGroup.appendChild(actions);
        section.appendChild(editorGroup);

        var logGroup = settingsGroup(doc, '执行输出', '这里显示最近一次及历史的执行结果与错误信息。');
        var logActions = doc.createElement('div');
        logActions.className = 'neo-spell-log-actions';
        var clearLog = doc.createElement('button');
        clearLog.type = 'button';
        clearLog.className = 'neo-spell-secondary';
        clearLog.textContent = '清空输出';
        clearLog.addEventListener('click', function () {
            renderSpellLogEmpty(section);
            setSpellStatus(section, '输出已清空', false);
        });
        logActions.appendChild(clearLog);
        logGroup.appendChild(logActions);
        var log = doc.createElement('div');
        log.id = 'neo-spell-log';
        log.className = 'neo-spell-log';
        logGroup.appendChild(log);
        section.appendChild(logGroup);
        renderSpellLogEmpty(section);

        var historyGroup = settingsGroup(doc, '历史记录', '点击任意记录可将言灵重新载入输入框。');
        var historyActions = doc.createElement('div');
        historyActions.className = 'neo-spell-log-actions';
        var clearHistory = doc.createElement('button');
        clearHistory.type = 'button';
        clearHistory.className = 'neo-spell-secondary neo-spell-danger';
        clearHistory.textContent = '清空历史';
        clearHistory.addEventListener('click', function () {
            saveSpellHistory([]);
            renderSpellHistory(section, textarea);
            setSpellStatus(section, '历史记录已清空', false);
        });
        historyActions.appendChild(clearHistory);
        historyGroup.appendChild(historyActions);
        var historyList = doc.createElement('div');
        historyList.id = 'neo-spell-history-list';
        historyList.className = 'neo-spell-history-list';
        historyGroup.appendChild(historyList);
        section.appendChild(historyGroup);

        renderSpellHistory(section, textarea);
    }

    function ensureSpellSection(root) {
        var wrapper = root && root.querySelector ? root.querySelector('#MyConfig_wrapper') : null;
        if (!wrapper) {
            return null;
        }
        var section = root.querySelector('#MyConfig_section_9');
        if (!section) {
            section = wrapper.ownerDocument.createElement('div');
            section.id = 'MyConfig_section_9';
            section.className = 'section_header_holder neo-settings-section neo-spell-section';
            wrapper.appendChild(section);
            buildSpellPanel(root, section);
        } else if (!section.dataset.neoSpellReady) {
            buildSpellPanel(root, section);
        }
        section.dataset.neoSpellReady = '1';
        return section;
    }

    /* ===== 灯台（MapleLantern）控制页签 ===== */
    var LANTERN_TAB_KEYS = [
        ['now', '此刻'],
        ['vitals', '身心'],
        ['worn', '着装'],
        ['system', '系统'],
        ['switches', '开关'],
        ['settings', '设置']
    ];

    function lanternView() {
        return (document && document.defaultView) || window;
    }

    function lanternApi() {
        var api = null;
        try {
            api = lanternView().MapleLantern;
        } catch (e) {
            api = null;
        }
        return (api && api.__mounted && typeof api.open === 'function') ? api : null;
    }

    function lanternStatusRow(doc, labelText, valueText, isWarn) {
        var row = doc.createElement('div');
        row.className = 'neo-settings-row';
        var label = doc.createElement('span');
        label.className = 'neo-settings-label';
        label.textContent = labelText;
        var value = doc.createElement('span');
        value.className = 'neo-settings-value' + (isWarn ? ' neo-lantern-warn' : '');
        value.textContent = valueText;
        row.appendChild(label);
        row.appendChild(value);
        return row;
    }

    function ensureLanternSection(root) {
        var wrapper = root && root.querySelector ? root.querySelector('#MyConfig_wrapper') : null;
        if (!wrapper) {
            return null;
        }
        var section = root.querySelector('#MyConfig_section_10');
        if (!section) {
            section = wrapper.ownerDocument.createElement('div');
            section.id = 'MyConfig_section_10';
            section.className = 'section_header_holder neo-settings-section neo-lantern-section';
            wrapper.appendChild(section);
            buildLanternPanel(root, section);
        } else if (!section.dataset.neoLanternReady) {
            buildLanternPanel(root, section);
        }
        section.dataset.neoLanternReady = '1';
        return section;
    }

    function buildLanternPanel(root, section) {
        var doc = section.ownerDocument;
        section.innerHTML = '';

        var intro = doc.createElement('div');
        intro.className = 'neo-settings-intro';
        intro.id = 'neo-lantern-intro';
        intro.textContent = '灯台（MapleLantern）控制面板：可在此打开灯台浮层、跳转灯台页签、查看诊断信息。';
        section.appendChild(intro);

        var statusGroup = settingsGroup(doc, '灯台状态', '每次进入本页签时会重新检测灯台的挂载情况。');
        var statusList = doc.createElement('div');
        statusList.className = 'neo-lantern-status';
        statusList.id = 'neo-lantern-status';
        statusGroup.appendChild(statusList);
        section.appendChild(statusGroup);

        var actionGroup = settingsGroup(doc, '快捷操作', '“打开灯台面板”会以灯台自己的浮层显示，不影响本管理器。');
        var actions = doc.createElement('div');
        actions.className = 'neo-settings-actions neo-lantern-actions';
        [
            ['open', '打开灯台面板', 'neo-primary'],
            ['refresh', '重新检测', ''],
            ['reset', '重置灯台设置', 'neo-danger']
        ].forEach(function (def) {
            var button = doc.createElement('button');
            button.type = 'button';
            button.className = 'neo-text-btn' + (def[2] ? ' ' + def[2] : '');
            button.setAttribute('data-neo-lantern', def[0]);
            button.textContent = def[1];
            button.addEventListener('click', function () {
                if (def[0] === 'open') {
                    var api = lanternApi();
                    if (api) {
                        syncLanternLayer();
                        try {
                            api.open();
                        } catch (e) {}
                    }
                } else if (def[0] === 'refresh') {
                    refreshLanternPanel(root);
                } else if (def[0] === 'reset') {
                    var target = lanternApi();
                    if (target && typeof target.reset === 'function') {
                        neoConfirm(root, {
                            title: '恢复灯台默认设置？',
                            message: '当前灯台的位置、主题和宽度会恢复为默认值。',
                            confirmText: '恢复默认',
                            icon: 'reload'
                        }).then(function (ok) {
                            if (!ok) {
                                return;
                            }
                            try {
                                target.reset();
                            } catch (e2) {}
                            refreshLanternPanel(root);
                        });
                    }
                }
            });
            actions.appendChild(button);
        });
        actionGroup.appendChild(actions);
        section.appendChild(actionGroup);

        var quickGroup = settingsGroup(doc, '灯台页签', '打开灯台面板并直接跳到对应页签。');
        var quickActions = doc.createElement('div');
        quickActions.className = 'neo-settings-actions neo-lantern-actions';
        LANTERN_TAB_KEYS.forEach(function (def) {
            var button = doc.createElement('button');
            button.type = 'button';
            button.className = 'neo-text-btn';
            button.setAttribute('data-neo-lantern-tab', def[0]);
            button.textContent = def[1];
            button.addEventListener('click', function () {
                openLanternTab(root, def[0]);
            });
            quickActions.appendChild(button);
        });
        quickGroup.appendChild(quickActions);
        section.appendChild(quickGroup);

        var diagGroup = settingsGroup(doc, '诊断信息', '导出灯台的运行状态，便于排查问题。');
        var diagActions = doc.createElement('div');
        diagActions.className = 'neo-settings-actions neo-lantern-actions';
        var diagButton = doc.createElement('button');
        diagButton.type = 'button';
        diagButton.className = 'neo-text-btn';
        diagButton.setAttribute('data-neo-lantern', 'diag');
        diagButton.textContent = '生成诊断';
        diagButton.addEventListener('click', function () {
            var out = section.querySelector('#neo-lantern-diag');
            if (!out) {
                return;
            }
            var api = lanternApi();
            if (!api || typeof api.diagnostics !== 'function') {
                out.textContent = '未检测到灯台（MapleLantern）模组，无法生成诊断。';
                return;
            }
            try {
                out.textContent = JSON.stringify(api.diagnostics(), null, 2);
            } catch (e) {
                out.textContent = '诊断生成失败：' + String(e);
            }
        });
        diagActions.appendChild(diagButton);
        diagGroup.appendChild(diagActions);
        var out = doc.createElement('pre');
        out.className = 'neo-lantern-diag';
        out.id = 'neo-lantern-diag';
        out.textContent = '（尚未生成诊断）';
        diagGroup.appendChild(out);
        section.appendChild(diagGroup);

        section.dataset.neoLanternReady = '1';
        refreshLanternPanel(root);
    }

    function openLanternTab(root, key) {
        var api = lanternApi();
        var doc = (root && root.ownerDocument) || document;
        if (!api) {
            refreshLanternPanel(root);
            return;
        }
        syncLanternLayer();
        try {
            api.open();
        } catch (e) {}
        var view = lanternView();
        view.setTimeout(function () {
            var panel = doc.getElementById('ml-panel');
            var button = panel ? panel.querySelector('.ml-tab[data-tab="' + key + '"]') : null;
            if (button) {
                button.click();
            }
        }, 80);
    }

    function refreshLanternPanel(root) {
        var section = root && root.querySelector ? root.querySelector('#MyConfig_section_10') : null;
        if (!section) {
            return;
        }
        var doc = section.ownerDocument;
        var api = lanternApi();
        var native = null;
        try {
            native = lanternView().MapleLanternNative;
        } catch (e) {
            native = null;
        }
        var panel = doc.getElementById('ml-panel');
        var orb = doc.getElementById('ml-orb');

        var intro = section.querySelector('#neo-lantern-intro');
        if (intro) {
            intro.textContent = api
                ? '灯台（MapleLantern ' + (api.version || '?') + '）已安装并挂载，可直接在本页控制。'
                : '未检测到灯台（MapleLantern）模组：本页仅提供说明，打开/跳转功能不可用。可在「已添加 Mod」中安装灯台后刷新页面。';
        }

        var status = section.querySelector('#neo-lantern-status');
        if (status) {
            status.textContent = '';
            status.appendChild(lanternStatusRow(doc, '模组状态', api ? '已挂载' : '未安装', !api));
            status.appendChild(lanternStatusRow(doc, '版本', api && api.version ? api.version : '—', !api));
            status.appendChild(lanternStatusRow(doc,
                '灯台浮层',
                panel ? (panel.hidden ? '已创建（当前隐藏）' : '已创建（显示中）') : '未创建',
                !panel));
            status.appendChild(lanternStatusRow(doc, '悬浮球', orb ? '已创建' : '未创建', !orb));
            status.appendChild(lanternStatusRow(doc,
                '原生集成',
                native && native.__mounted ? '已挂载' : '未挂载',
                !(native && native.__mounted)));
        }

        var buttons = section.querySelectorAll('[data-neo-lantern], [data-neo-lantern-tab]');
        for (var i = 0; i < buttons.length; i++) {
            var action = buttons[i].getAttribute('data-neo-lantern');
            if (action === 'refresh') {
                buttons[i].disabled = false;
                continue;
            }
            buttons[i].disabled = !api;
        }
    }

    /* 灯台浮层默认 z-index(89900) 低于 #MyConfig(2147483000)：
       管理器打开期间给 #ml-root 加标记，把它提到管理器之上。 */
    var LANTERN_LAYER_CLASS = 'neo-lantern-manager-open';

    function syncLanternLayer() {
        var ml = document.getElementById('ml-root');
        if (!ml || !ml.classList) {
            return;
        }
        ml.classList.toggle(LANTERN_LAYER_CLASS, isNeoGuiOpen());
    }

    /* 灯台在 document 捕获阶段监听 pointerdown，点面板外任何位置都会关面板；
       管理器里的按钮也在“外面”，会导致关管理器时灯台一起消失。
       这里给文档的捕获型 pointerdown 监听加守卫：来自 #MyConfig 内的点击不算外部点击。 */
    var neoPointerGuardInstalled = false;

    function installPointerOutsideGuard() {
        if (neoPointerGuardInstalled) {
            return;
        }
        var doc = document;
        if (!doc || typeof doc.addEventListener !== 'function') {
            return;
        }
        if (typeof WeakMap !== 'function') {
            return;
        }
        neoPointerGuardInstalled = true;
        var wraps = new WeakMap();
        var origAdd = doc.addEventListener;
        var origRemove = doc.removeEventListener;
        var isCapture = function (options) {
            return options === true || !!(options && options.capture === true);
        };
        doc.addEventListener = function (type, fn, options) {
            if (type === 'pointerdown' && isCapture(options) && typeof fn === 'function') {
                var wrapped = wraps.get(fn);
                if (!wrapped) {
                    wrapped = function (event) {
                        var target = event && event.target;
                        try {
                            if (target && target.closest && target.closest('#MyConfig')) {
                                return;
                            }
                        } catch (e) {}
                        return fn.apply(this, arguments);
                    };
                    wraps.set(fn, wrapped);
                }
                return origAdd.call(this, type, wrapped, options);
            }
            return origAdd.apply(this, arguments);
        };
        doc.removeEventListener = function (type, fn, options) {
            if (type === 'pointerdown' && isCapture(options) && typeof fn === 'function') {
                var wrapped = wraps.get(fn);
                if (wrapped) {
                    return origRemove.call(this, type, wrapped, options);
                }
            }
            return origRemove.apply(this, arguments);
        };
    }

    function formatLoadSeconds(seconds) {
        if (!isFinite(seconds) || seconds < 0) {
            seconds = 0;
        }
        if (seconds < 10) {
            return seconds.toFixed(1);
        }
        return String(Math.round(seconds));
    }

    function loadElapsedSeconds() {
        try {
            if (window.performance && typeof window.performance.now === 'function') {
                return window.performance.now() / 1000;
            }
        } catch (e) {}
        return 0;
    }

    function loadedModCount() {
        try {
            var utils = window.modUtils || (window.modLoaderGui && window.modLoaderGui.gModUtils);
            if (utils && typeof utils.getModListNameNoAlias === 'function') {
                var names = utils.getModListNameNoAlias();
                if (names && typeof names.length === 'number') {
                    return names.length;
                }
            }
            if (utils && typeof utils.getModListName === 'function') {
                var all = utils.getModListName();
                if (all && typeof all.length === 'number') {
                    return all.length;
                }
            }
        } catch (e) {}
        try {
            var list = document.querySelector('#MyConfig_field_NowLoadedModeList_r');
            if (list && list.value) {
                var lines = list.value.split(/\r?\n/).filter(function (line) { return !!line; });
                if (lines.length > 0) {
                    return Math.max(0, lines.length - 1);
                }
            }
        } catch (e) {}
        return 0;
    }

    function dismissLoadNotice(node) {
        if (!node || !node.parentNode || node.__neoDismissed) {
            return;
        }
        node.__neoDismissed = true;
        node.classList.add('neo-load-notice-hide');
        setTimeout(function () {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }, 420);
    }

    function showLoadNotice(secondsAtReady) {
        if (window.__neoLoadNoticeShown) {
            return;
        }
        window.__neoLoadNoticeShown = true;
        var count = loadedModCount();
        var rawSeconds = typeof secondsAtReady === 'number' && isFinite(secondsAtReady)
            ? secondsAtReady
            : loadElapsedSeconds();
        var seconds = formatLoadSeconds(rawSeconds);
        var doc = document;
        var node = doc.createElement('div');
        node.id = 'neo-load-notice';
        node.setAttribute('role', 'status');
        node.setAttribute('aria-live', 'polite');
        node.title = '4 秒后自动关闭，点击可立即关闭';

        var title = doc.createElement('div');
        title.className = 'neo-load-notice-title';
        title.textContent = BRAND + (hotReloadPending ? ' 热重载完成' : ' 加载完成');
        node.appendChild(title);

        var line = doc.createElement('div');
        line.className = 'neo-load-notice-line';
        if (count > 0) {
            line.appendChild(doc.createTextNode('已加载 '));
            var countNode = doc.createElement('b');
            countNode.textContent = String(count);
            line.appendChild(countNode);
            line.appendChild(doc.createTextNode(' 个 Mod · 用时 '));
        } else {
            line.appendChild(doc.createTextNode('加载用时 '));
        }
        var timeNode = doc.createElement('b');
        timeNode.textContent = seconds;
        line.appendChild(timeNode);
        line.appendChild(doc.createTextNode(' 秒'));
        node.appendChild(line);

        node.addEventListener('click', function () {
            dismissLoadNotice(node);
        });
        (doc.body || doc.documentElement).appendChild(node);
        setTimeout(function () {
            dismissLoadNotice(node);
        }, 4200);
    }

    function registerHotReloadRestore() {
        if (window.__neoHotReloadRestoreBound) {
            return;
        }
        window.__neoHotReloadRestoreBound = true;
        if (!readHotReloadMarker()) {
            return;
        }
        hotReloadPending = true;
        var restore = function () {
            var marker = readHotReloadMarker();
            if (!marker) {
                return;
            }
            var api = gameApi();
            if (marker.save && api.save && typeof api.save.deserialize === 'function') {
                try {
                    api.save.deserialize(marker.save);
                    window.__neoHotReloadRestored = true;
                } catch (e) {
                    console.error('[ModLoaderNeoUI] 热重载恢复进度失败', e);
                }
            }
            clearHotReloadMarker();
        };
        var onReady = function () {
            setTimeout(restore, 600);
        };
        try {
            var gui = window.modLoaderGui;
            var manager = gui && gui.gSC2DataManager;
            var tracer = manager && typeof manager.getSc2EventTracer === 'function'
                ? manager.getSc2EventTracer()
                : null;
            if (tracer && typeof tracer.addCallback === 'function') {
                tracer.addCallback({ whenSC2StoryReady: onReady });
                return;
            }
        } catch (e) {}
        try {
            if (window.jQuery) {
                window.jQuery(window.document).one(':storyready', onReady);
                return;
            }
        } catch (e) {}
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            var api = gameApi();
            if (api.save && api.state && api.state.passage) {
                clearInterval(timer);
                onReady();
            } else if (tries >= 120) {
                clearInterval(timer);
                clearHotReloadMarker();
            }
        }, 500);
    }

    function registerLoadNotice() {
        if (window.__neoLoadNoticeBound) {
            return;
        }
        window.__neoLoadNoticeBound = true;
        var onReady = function () {
            var seconds = loadElapsedSeconds();
            setTimeout(function () {
                try {
                    showLoadNotice(seconds);
                } catch (e) {}
            }, 320);
        };
        try {
            var gui = window.modLoaderGui;
            var manager = gui && gui.gSC2DataManager;
            var tracer = manager && typeof manager.getSc2EventTracer === 'function'
                ? manager.getSc2EventTracer()
                : null;
            if (tracer && typeof tracer.addCallback === 'function') {
                tracer.addCallback({ whenSC2StoryReady: onReady });
                return;
            }
        } catch (e) {}
        try {
            if (window.jQuery) {
                window.jQuery(window.document).one(':storyready', onReady);
                return;
            }
        } catch (e) {}
        var tries = 0;
        var timer = setInterval(function () {
            tries++;
            var ready = false;
            try {
                ready = !!(window.State && window.State.passage);
            } catch (e) {}
            if (ready) {
                clearInterval(timer);
                onReady();
            } else if (tries >= 60) {
                clearInterval(timer);
            }
        }, 1000);
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

    function setManagerEntryOpen(open) {
        try {
            var root = document.documentElement;
            if (!root) {
                return;
            }
            if (open) {
                root.setAttribute('data-neo-manager-open', '1');
            } else {
                root.removeAttribute('data-neo-manager-open');
            }
        } catch (e) {}
    }

    function brandStartBanner() {
        var banner = document.getElementById('startBannerModLoaderGui');
        if (!banner) {
            return;
        }
        if (banner.textContent !== 'Mod 管理器') {
            banner.textContent = 'Mod 管理器';
        }
        banner.title = '打开 / 关闭 Mod 管理器';
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
            var next = html.replace(/\((?:ML|Neo)-v[^)]*\)/g, '(Neo-v1.0.6)');
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
        if (!node || !node.value || node.__neoRebrandValue === node.value) {
            return;
        }
        var lines = node.value.split('\n');
        if (lines.length && /^ModLoader(?:[-\s]Neo)?(?:\s*\{v:[^}]*\})?/.test(lines[0]) && lines[0] !== BRAND) {
            lines[0] = BRAND;
            node.value = lines.join('\n');
        }
        node.__neoRebrandValue = node.value;
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

    function componentDedupKey(info) {
        if (!info || !info.selector) {
            return '';
        }
        var title = info.data && info.data.text && info.data.text.title;
        return title ? info.selector + '\u0000' + title : '';
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
                    var key = componentDedupKey(info);
                    if (!key) {
                        return origAdd(info);
                    }
                    var list = this._externalComponentsShow || [];
                    for (var i = 0; i < list.length; i++) {
                        if (componentDedupKey(list[i]) === key) {
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
                            var key = componentDedupKey(info);
                            var list = ecm._externalComponentsShow || [];
                            var exists = false;
                            if (!key) {
                                exists = list.indexOf(info) >= 0;
                            } else {
                                for (var i = 0; i < list.length; i++) {
                                    if (componentDedupKey(list[i]) === key) {
                                        exists = true;
                                        break;
                                    }
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

    function hookGuiOpen(gui) {
        if (!gui || gui.__neoOpenPatched || typeof gui.open !== 'function') {
            return;
        }
        gui.__neoOpenPatched = true;
        var origOpen = gui.open;
        gui.open = function () {
            var result = origOpen.apply(this, arguments);
            setManagerEntryOpen(true);
            armOpenApplyBurst();
            syncLanternLayer();
            var focusMods = function () {
                try {
                    var root = document.getElementById('MyConfig');
                    var inner = innerConfigRoot(root);
                    if (inner && inner.dataset && inner.dataset.neoShell === '1') {
                        activatePage(inner, 'mods', false);
                    }
                } catch (e) {}
            };
            setTimeout(focusMods, 80);
            setTimeout(focusMods, 320);
            return result;
        };
    }

    function hookGuiClose(gui) {
        if (!gui || gui.__neoClosePatched || typeof gui.close !== 'function') {
            return;
        }
        gui.__neoClosePatched = true;
        var origClose = gui.close;
        gui.close = function () {
            cancelOpenApplyBurst();
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
            var result = origClose.apply(this, arguments);
            setManagerEntryOpen(false);
            syncLanternLayer();
            return result;
        };
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
        if (!gui) {
            return;
        }
        var proto = null;
        try {
            proto = Object.getPrototypeOf(gui);
        } catch (e) {}
        if (proto && typeof proto.open === 'function' && typeof proto.close === 'function') {
            hookGuiOpen(proto);
            hookGuiClose(proto);
        } else {
            hookGuiOpen(gui);
            hookGuiClose(gui);
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
            refreshOrderComponents(root);
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
        var key = wrapper.dataset.neoActivePage || 'mods';
        if (key === 'mods') {
            ensureAngularBoot(root).then(function () {
                refreshModList(root);
            }, function () {});
        } else if (key === 'theme') {
            refreshLanternPanel(root);
        }
    }

    function setBadge(root, name, value) {
        var badges = root.querySelectorAll('.neo-tab-badge[data-badge="' + name + '"]');
        var text = value > 99 ? '99+' : String(value);
        for (var i = 0; i < badges.length; i++) {
            if (badges[i].textContent !== text) {
                badges[i].textContent = text;
            }
            badges[i].style.display = value > 0 ? '' : 'none';
        }
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
        var entries = readLoadedModEntries(root);
        setBadge(root, 'mods', entries.length);

        var log = root.querySelector('#idLoadLogHtml');
        setBadge(root, 'log', log ? log.children.length : 0);
        updateSafeModeStatus(root);
    }

    function pageKeyForSection(idx) {
        switch (Number(idx)) {
            case 6:
            case 7:
                return 'logs';
            case 8:
                return 'settings';
            case 10:
                return 'theme';
            case 2:
            case 4:
            case 5:
            default:
                return 'mods';
        }
    }

    function activatePage(root, key, persist) {
        if (!PAGE_BY_KEY[key]) {
            key = 'mods';
        }
        var wrapper = root && root.querySelector ? root.querySelector('#MyConfig_wrapper') : null;
        if (!wrapper) {
            return;
        }
        wrapper.dataset.neoActivePage = key;
        var def = PAGE_BY_KEY[key];
        var navItems = root.querySelectorAll('.neo-nav-item');
        for (var i = 0; i < navItems.length; i++) {
            var on = navItems[i].getAttribute('data-neo-page') === key;
            navItems[i].classList.toggle('neo-nav-active', on);
            navItems[i].setAttribute('aria-current', on ? 'page' : 'false');
        }
        var pages = root.querySelectorAll('.neo-page');
        for (var p = 0; p < pages.length; p++) {
            pages[p].classList.toggle('neo-page-active', pages[p].getAttribute('data-neo-page') === key);
        }
        var title = root.querySelector('#neo-page-title');
        if (title && title.textContent !== def.title) {
            title.textContent = def.title;
        }
        var subtitle = root.querySelector('#neo-page-subtitle');
        if (subtitle && subtitle.textContent !== def.subtitle) {
            subtitle.textContent = def.subtitle;
        }
        var search = root.querySelector('#neo-side-search');
        if (search) {
            search.placeholder = key === 'mods' ? '搜索 Mod 名称或版本'
                : key === 'logs' ? '搜索日志内容'
                    : '搜索设置项';
            if (search.value) {
                applyNeoSearch(root);
            }
        }
        if (persist) {
            try {
                localStorage.setItem(TAB_KEY, key);
            } catch (e) {}
        }
        if (key !== 'mods') {
            closeModDetail(root, true);
        }
        var scroll = root.querySelector('#neo-main-scroll');
        if (scroll) {
            scroll.scrollTop = 0;
        }
        if (key === 'mods') {
            refreshModList(root, true);
            ensureAngularBoot(root).then(function () {
                refreshModList(root);
            }, function () {});
        } else if (key === 'theme') {
            refreshLanternPanel(root);
        }
    }

    function activateTab(root, idx, persist, skipEnter) {
        activatePage(root, pageKeyForSection(idx), persist);
    }

    function buildTabs(root, wrapper) {
        if (!wrapper) {
            return;
        }
        ensureSettingsSection(root);
        ensureLanternSection(root);
        hideSpellSection(root);
        if (wrapper.dataset.neoShell !== '1') {
            var anchor = root.querySelector('#MyConfig_section_0');
            var modsSection = root.querySelector('#MyConfig_section_2');
            var orderSection = root.querySelector('#MyConfig_section_5');
            var logSection = root.querySelector('#MyConfig_section_6');
            var debugSection = root.querySelector('#MyConfig_section_7');
            var settingsSection = root.querySelector('#MyConfig_section_8');
            var lanternSection = root.querySelector('#MyConfig_section_10');
            if (!anchor || !modsSection || !orderSection || !logSection || !debugSection || !settingsSection || !lanternSection) {
                return;
            }
            buildShell(root, wrapper, {
                anchor: anchor,
                mods: modsSection,
                order: orderSection,
                log: logSection,
                debug: debugSection,
                settings: settingsSection,
                lantern: lanternSection
            });
        }
        updateBadges(root);
        refreshShellParts(root);
        refreshModList(root, true);
        applyThemeSettings(root);
        if (wrapper.dataset.neoActivePage === 'theme') {
            refreshLanternPanel(root);
        }
    }

    function tabsSignature(root, wrapper) {
        var settings = loadSettings();
        var scale = settings.scale === 'auto' ? autoUiScale() : Number(settings.scale);
        if (!isFinite(scale) || scale <= 0) {
            scale = 1;
        }
        var settingsSection = root.querySelector('#MyConfig_section_8');
        var lanternSection = root.querySelector('#MyConfig_section_10');
        var log = root.querySelector('#idLoadLogHtml');
        var safe = root.querySelector('#MyConfig_field_SafeModeState_R');
        var select = root.querySelector('#MyConfig_field_ReadMe_s');
        var list = root.querySelector('#MyConfig_field_NowLoadedModeList_r');
        return [
            wrapper.dataset.neoShell || '',
            wrapper.dataset.neoActivePage || '',
            settingsSection ? (settingsSection.dataset.neoSettingsReady || '0') : '-',
            lanternSection ? (lanternSection.dataset.neoLanternReady || '0') : '-',
            settings.scale,
            settings.borderWidth,
            settings.borderColor,
            settings.radius,
            settings.glow ? '1' : '0',
            String(scale),
            log ? log.children.length : -1,
            select && select.options ? select.options.length : -1,
            (list && list.value) ? list.value.length : -1,
            safe ? String(safe.value) : ''
        ].join('|');
    }

    function refreshShellParts(root) {
        var safeRow = root.querySelector('#neo-safe-row');
        if (safeRow) {
            ['EnableSafeMode_b', 'DisableSafeMode_b', 'SafeModeState_R'].forEach(function (id) {
                var field = root.querySelector('#MyConfig_' + id + '_var');
                if (field && field.parentNode !== safeRow) {
                    field.classList.add('neo-safe-field');
                    safeRow.appendChild(field);
                }
            });
        }
        var addGrid = root.querySelector('#neo-add-grid');
        if (addGrid) {
            [
                'MyConfig_AddMod_I_var',
                'MyConfig_AddMod_b_var',
                'MyConfig_AddMod_R_var',
                'MyConfig_RemoveMod_s_var',
                'MyConfig_RemoveMod_b_var',
                'MyConfig_NowSideLoadModeList_r_var'
            ].forEach(function (id) {
                var field = root.querySelector('#' + id);
                if (field && field.parentNode !== addGrid) {
                    field.classList.add('neo-add-field');
                    addGrid.appendChild(field);
                }
            });
        }
    }

    function applyTabs(root) {
        var wrapper = root.querySelector('#MyConfig_wrapper');
        if (!wrapper) {
            return;
        }
        if (wrapper.dataset.neoShell !== '1') {
            buildTabs(root, wrapper);
            return;
        }
        refreshShellParts(root);
        updateBadges(root);
        refreshModList(root);
        ensureSettingsSection(root);
        ensureLanternSection(root);
        applyThemeSettings(root);
        root.__neoUiTabsSignature = tabsSignature(root, wrapper);
    }

    /* ===== OriginOS 风格外壳 ===== */

    function neoEl(doc, tag, className, text) {
        var node = doc.createElement(tag);
        if (className) {
            node.className = className;
        }
        if (text !== undefined && text !== null) {
            node.textContent = String(text);
        }
        return node;
    }

    function neoIcon(doc, name) {
        var node = doc.createElement('span');
        node.className = 'neo-icon neo-icon-' + name;
        node.innerHTML = NEO_ICONS[name] || '';
        return node;
    }

    function stripModZip(name) {
        return String(name == null ? '' : name).replace(/\.mod\.zip$/i, '');
    }

    function resolveOrderModName(key) {
        var name = stripModZip(key);
        try {
            var mu = window.modUtils;
            if (mu && typeof mu.getMod === 'function') {
                var mod = mu.getMod(key) || mu.getMod(name);
                if (mod) {
                    if (mod.bootJson && mod.bootJson.name) {
                        return String(mod.bootJson.name);
                    }
                    if (mod.modInfo && mod.modInfo.name) {
                        return String(mod.modInfo.name);
                    }
                }
            }
        } catch (e) {}
        return name;
    }

    function parseLoadedModMeta(root) {
        var map = {};
        var area = root.querySelector('#MyConfig_field_NowLoadedModeList_r');
        if (!area || !area.value) {
            return map;
        }
        var lines = String(area.value).split(/\r?\n/);
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line.charAt(0) !== '[' || /^\[alias\]/i.test(line)) {
                continue;
            }
            var match = /^\[([^\]]+)\]\s*(.*)$/.exec(line);
            if (!match) {
                continue;
            }
            var source = match[1];
            var rest = match[2];
            var version = '';
            var vm = /\{v:([^}]*)\}\s*$/.exec(rest);
            if (vm) {
                version = String(vm[1] || '').replace(/^\?$/, '');
                rest = rest.slice(0, vm.index).trim();
            }
            var nick = '';
            var nm = /<([^>]*)>/.exec(rest);
            if (nm) {
                nick = nm[1];
                rest = (rest.slice(0, nm.index) + rest.slice(nm.index + nm[0].length)).trim();
            }
            var name = rest.trim();
            if (!name || map[name]) {
                continue;
            }
            map[name] = {
                name: name,
                source: source,
                version: version,
                nick: nick
            };
        }
        return map;
    }

    function collectOrderEntries(root) {
        var hosts = root.querySelectorAll('.enable-order-component-host');
        var host = null;
        for (var h = 0; h < hosts.length; h++) {
            var title = hosts[h].querySelector('.enable-order-component-title');
            var text = title ? String(title.textContent || '') : '';
            if (!text || /Mod启用/.test(text)) {
                host = hosts[h];
                break;
            }
            if (!host) {
                host = hosts[h];
            }
        }
        if (!host) {
            return [];
        }
        var out = [];
        var types = ['enable', 'disable'];
        for (var t = 0; t < types.length; t++) {
            var type = types[t];
            var container = host.querySelector('.select-' + type);
            if (!container) {
                continue;
            }
            for (var i = 0; i < container.children.length; i++) {
                var item = container.children[i];
                if (!item || item.nodeType !== 1) {
                    continue;
                }
                var key = item.getAttribute('data-neo-mod-key') || item.__neoKey || '';
                if (!key) {
                    var nameNode = item.querySelector('.neo-mod-name');
                    key = nameNode ? String(nameNode.textContent || '').trim() : '';
                }
                if (!key) {
                    continue;
                }
                var display = item.__neoStr || key;
                out.push({
                    key: key,
                    type: type === 'enable' ? 'enabled' : 'disabled',
                    modName: resolveOrderModName(key),
                    display: stripModZip(display),
                    version: orderVersion(key),
                    item: item,
                    host: host
                });
            }
        }
        return out;
    }

    function readLoadedModEntries(root) {
        var select = root.querySelector('#MyConfig_field_ReadMe_s');
        var names = [];
        var seen = {};
        if (select && select.options) {
            for (var i = 0; i < select.options.length; i++) {
                var value = String(select.options[i].value || '');
                if (value && !seen[value]) {
                    seen[value] = true;
                    names.push(value);
                }
            }
        }
        var meta = parseLoadedModMeta(root);
        if (!names.length) {
            for (var name in meta) {
                if (Object.prototype.hasOwnProperty.call(meta, name) && !seen[name]) {
                    seen[name] = true;
                    names.push(name);
                }
            }
        }
        var order = collectOrderEntries(root);
        var orderByMod = {};
        for (var oi = 0; oi < order.length; oi++) {
            if (!orderByMod[order[oi].modName]) {
                orderByMod[order[oi].modName] = order[oi];
            }
        }
        var entries = [];
        var used = {};
        for (var n = 0; n < names.length; n++) {
            var modName = names[n];
            var info = meta[modName] || {};
            var managed = orderByMod[modName] || null;
            entries.push({
                name: modName,
                display: modName,
                version: info.version || (managed ? managed.version : ''),
                nick: info.nick || '',
                source: info.source || (managed ? '旁加载' : '内置'),
                state: managed ? managed.type : 'builtin',
                orderKey: managed ? managed.key : '',
                manageable: !!managed
            });
            used[modName] = true;
        }
        for (var oj = 0; oj < order.length; oj++) {
            var entry = order[oj];
            if (used[entry.modName]) {
                continue;
            }
            used[entry.modName] = true;
            entries.push({
                name: entry.modName,
                display: entry.display || entry.modName,
                version: entry.version,
                nick: '',
                source: '旁加载',
                state: entry.type,
                orderKey: entry.key,
                manageable: true
            });
        }
        var deleted = root.__neoDeleted || {};
        return entries.filter(function (item) {
            return !deleted[item.name] && !(item.orderKey && deleted[item.orderKey]);
        });
    }

    function findOrderItem(root, key) {
        if (!key) {
            return null;
        }
        var hosts = root.querySelectorAll('.enable-order-component-host');
        for (var h = 0; h < hosts.length; h++) {
            var host = hosts[h];
            var title = host.querySelector('.enable-order-component-title');
            if (title && !/Mod启用/.test(String(title.textContent || ''))) {
                continue;
            }
            var types = ['enable', 'disable'];
            for (var t = 0; t < types.length; t++) {
                var container = host.querySelector('.select-' + types[t]);
                if (!container) {
                    continue;
                }
                for (var i = 0; i < container.children.length; i++) {
                    var item = container.children[i];
                    if (!item || item.nodeType !== 1) {
                        continue;
                    }
                    var itemKey = item.getAttribute('data-neo-mod-key') || item.__neoKey;
                    if (itemKey === key) {
                        return {
                            item: item,
                            host: host,
                            type: types[t],
                            ng: item.__neoNg || null
                        };
                    }
                }
            }
        }
        return null;
    }

    function neoToast(root, text) {
        var host = root.querySelector('.neo-toast');
        if (!host) {
            host = neoEl(root.ownerDocument || document, 'div', 'neo-toast');
            var main = root.querySelector('.neo-main');
            if (main) {
                main.appendChild(host);
            } else {
                root.appendChild(host);
            }
        }
        host.textContent = text;
        host.classList.add('neo-toast-show');
        if (host.__neoToastTimer) {
            clearTimeout(host.__neoToastTimer);
        }
        host.__neoToastTimer = setTimeout(function () {
            host.classList.remove('neo-toast-show');
        }, 2600);
    }

    function neoConfirm(root, options) {
        var opts = options || {};
        var doc = root.ownerDocument || document;
        var host = root.querySelector('.neo-shell') || root.querySelector('.neo-main') || root;
        var previous = null;
        try {
            previous = doc.activeElement;
        } catch (e) {}
        var old = host.querySelector('.neo-confirm-mask');
        if (old) {
            if (typeof old.__neoConfirmClose === 'function') {
                old.__neoConfirmClose(false);
            }
            if (old.parentNode) {
                old.parentNode.removeChild(old);
            }
        }
        return new Promise(function (resolve) {
            var settled = false;
            var mask = neoEl(doc, 'div', 'neo-confirm-mask');
            mask.setAttribute('role', 'presentation');
            var card = neoEl(doc, 'div', 'neo-confirm-card');
            card.setAttribute('role', 'dialog');
            card.setAttribute('aria-modal', 'true');
            var titleId = 'neo-confirm-title-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000);
            card.setAttribute('aria-labelledby', titleId);
            var head = neoEl(doc, 'div', 'neo-confirm-head');
            var icon = neoEl(doc, 'div', 'neo-confirm-icon' + (opts.danger ? '' : ' neo-confirm-icon-accent'));
            icon.appendChild(neoIcon(doc, opts.icon || (opts.danger ? 'trash' : 'reload')));
            var copy = neoEl(doc, 'div', 'neo-confirm-copy');
            var title = neoEl(doc, 'div', 'neo-confirm-title', opts.title || '确认操作');
            title.id = titleId;
            copy.appendChild(title);
            if (opts.name) {
                copy.appendChild(neoEl(doc, 'div', 'neo-confirm-name', opts.name));
            }
            if (opts.message) {
                copy.appendChild(neoEl(doc, 'div', 'neo-confirm-text', opts.message));
            }
            head.appendChild(icon);
            head.appendChild(copy);
            card.appendChild(head);

            var actions = neoEl(doc, 'div', 'neo-confirm-actions');
            var cancelBtn = neoEl(doc, 'button', 'neo-confirm-btn neo-confirm-cancel', opts.cancelText || '取消');
            cancelBtn.type = 'button';
            var confirmBtn = neoEl(doc, 'button', 'neo-confirm-btn ' + (opts.danger ? 'neo-confirm-danger' : 'neo-confirm-primary'), opts.confirmText || '确定');
            confirmBtn.type = 'button';
            actions.appendChild(cancelBtn);
            actions.appendChild(confirmBtn);
            card.appendChild(actions);
            mask.appendChild(card);
            host.appendChild(mask);

            function close(value) {
                if (settled) {
                    return;
                }
                settled = true;
                try {
                    doc.removeEventListener('keydown', onKey, true);
                } catch (e) {}
                mask.classList.add('neo-confirm-leave');
                setTimeout(function () {
                    if (mask.parentNode) {
                        mask.parentNode.removeChild(mask);
                    }
                    if (previous && typeof previous.focus === 'function') {
                        try {
                            previous.focus({ preventScroll: true });
                        } catch (e) {}
                    }
                }, 160);
                resolve(Boolean(value));
            }
            mask.__neoConfirmClose = close;

            function onKey(event) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    close(false);
                    return;
                }
                if (event.key === 'Tab') {
                    var first = cancelBtn;
                    var last = confirmBtn;
                    if (event.shiftKey && doc.activeElement === first) {
                        event.preventDefault();
                        last.focus();
                    } else if (!event.shiftKey && doc.activeElement === last) {
                        event.preventDefault();
                        first.focus();
                    }
                }
            }

            cancelBtn.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                close(false);
            });
            confirmBtn.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                close(true);
            });
            mask.addEventListener('click', function (event) {
                if (event.target === mask) {
                    close(false);
                }
            });
            card.addEventListener('click', function (event) {
                event.stopPropagation();
            });
            doc.addEventListener('keydown', onKey, true);
            var raf = (doc.defaultView && doc.defaultView.requestAnimationFrame) || function (fn) {
                return setTimeout(fn, 16);
            };
            raf(function () {
                mask.classList.add('neo-confirm-show');
                try {
                    cancelBtn.focus({ preventScroll: true });
                } catch (e) {}
            });
        });
    }

    function buildModHero(doc) {
        var hero = neoEl(doc, 'div', 'neo-hero');
        var version = BRAND.indexOf('v') >= 0 ? BRAND.slice(BRAND.indexOf('v')) : BRAND;
        hero.innerHTML = [
            '<div class="neo-hero-art" aria-hidden="true">',
            '<span class="neo-hero-blob neo-hero-blob-a"></span>',
            '<span class="neo-hero-blob neo-hero-blob-b"></span>',
            '<span class="neo-hero-blob neo-hero-blob-c"></span>',
            '</div>',
            '<div class="neo-hero-copy">',
            '<div class="neo-hero-kicker">MODLOADER NEO</div>',
            '<div class="neo-hero-title">Mod 管理</div>',
            '<div class="neo-hero-sub">' + version + ' · 本地加载器</div>',
            '<div class="neo-hero-stats">',
            '<div class="neo-hero-stat"><strong data-neo-stat="loaded">0</strong><span>已加载</span></div>',
            '<div class="neo-hero-stat"><strong data-neo-stat="manageable">0</strong><span>可管理</span></div>',
            '<div class="neo-hero-stat"><strong data-neo-stat="disabled">0</strong><span>已禁用</span></div>',
            '<div class="neo-hero-stat"><strong data-neo-stat="logs">0</strong><span>日志</span></div>',
            '</div>',
            '</div>'
        ].join('');
        return hero;
    }

    function buildModToolbar(root, doc) {
        var toolbar = neoEl(doc, 'div', 'neo-toolbar');
        var search = neoEl(doc, 'label', 'neo-toolbar-search');
        search.appendChild(neoIcon(doc, 'search'));
        var input = neoEl(doc, 'input', '');
        input.type = 'search';
        input.id = 'neo-mod-search';
        input.placeholder = '搜索 Mod 名称或版本';
        input.setAttribute('aria-label', '搜索 Mod');
        search.appendChild(input);

        var chips = neoEl(doc, 'div', 'neo-chips');
        [
            ['all', '全部'],
            ['enabled', '已启用'],
            ['disabled', '已禁用'],
            ['builtin', '内置']
        ].forEach(function (def) {
            var chip = neoEl(doc, 'button', 'neo-chip' + (def[0] === 'all' ? ' neo-chip-active' : ''), def[1]);
            chip.type = 'button';
            chip.setAttribute('data-neo-filter', def[0]);
            chip.addEventListener('click', function () {
                root.__neoModFilter = def[0];
                var all = chips.querySelectorAll('.neo-chip');
                for (var i = 0; i < all.length; i++) {
                    all[i].classList.toggle('neo-chip-active', all[i].getAttribute('data-neo-filter') === def[0]);
                }
                refreshModList(root, true);
            });
            chips.appendChild(chip);
        });

        var spacer = neoEl(doc, 'div', 'neo-toolbar-spacer');
        var add = neoEl(doc, 'button', 'neo-pill-btn neo-pill-primary', '+ 添加 Mod');
        add.type = 'button';
        add.id = 'neo-add-toggle';
        var sort = neoEl(doc, 'button', 'neo-pill-btn', '调整顺序');
        sort.type = 'button';
        sort.id = 'neo-sort-toggle';

        toolbar.appendChild(search);
        toolbar.appendChild(chips);
        toolbar.appendChild(spacer);
        toolbar.appendChild(add);
        toolbar.appendChild(sort);

        input.addEventListener('input', function () {
            root.__neoModQuery = input.value;
            var side = root.querySelector('#neo-side-search');
            if (side && side.value !== input.value) {
                side.value = input.value;
            }
            applyNeoSearch(root);
        });

        return toolbar;
    }

    function buildAddPanel(root, doc) {
        var panel = neoEl(doc, 'div', 'neo-add-panel');
        panel.hidden = true;
        var head = neoEl(doc, 'div', 'neo-add-panel-head');
        var titles = neoEl(doc, 'div', '');
        titles.appendChild(neoEl(doc, 'div', 'neo-group-title', '添加 / 移除旁加载 Mod'));
        titles.appendChild(neoEl(doc, 'div', 'neo-group-desc', '选择一个或多个 Mod zip，添加后会在下次重新载入时生效。'));
        var close = neoEl(doc, 'button', 'neo-round-btn neo-add-close');
        close.type = 'button';
        close.setAttribute('aria-label', '收起添加面板');
        close.appendChild(neoIcon(doc, 'close'));
        close.addEventListener('click', function () {
            panel.hidden = true;
            var addToggle = root.querySelector('#neo-add-toggle');
            if (addToggle) {
                addToggle.classList.remove('neo-pill-active');
            }
        });
        head.appendChild(titles);
        head.appendChild(close);

        var grid = neoEl(doc, 'div', 'neo-add-grid');
        grid.id = 'neo-add-grid';
        [
            'MyConfig_AddMod_I_var',
            'MyConfig_AddMod_b_var',
            'MyConfig_AddMod_R_var',
            'MyConfig_RemoveMod_s_var',
            'MyConfig_RemoveMod_b_var',
            'MyConfig_NowSideLoadModeList_r_var'
        ].forEach(function (id) {
            var field = root.querySelector('#' + id);
            if (!field) {
                return;
            }
            field.classList.add('neo-add-field');
            grid.appendChild(field);
        });
        panel.appendChild(head);
        panel.appendChild(grid);
        return panel;
    }

    function buildDetailPanel(doc) {
        var detail = neoEl(doc, 'div', 'neo-mod-detail');
        var bar = neoEl(doc, 'div', 'neo-detail-bar');
        var back = neoEl(doc, 'button', 'neo-round-btn neo-detail-back');
        back.type = 'button';
        back.id = 'neo-detail-back';
        back.setAttribute('aria-label', '返回 Mod 列表');
        back.appendChild(neoIcon(doc, 'back'));

        var heading = neoEl(doc, 'div', 'neo-detail-heading');
        var name = neoEl(doc, 'div', 'neo-detail-name');
        name.id = 'neo-detail-name';
        var meta = neoEl(doc, 'div', 'neo-detail-meta');
        meta.id = 'neo-detail-meta';
        heading.appendChild(name);
        heading.appendChild(meta);

        var actions = neoEl(doc, 'div', 'neo-detail-actions');
        actions.id = 'neo-detail-actions';

        bar.appendChild(back);
        bar.appendChild(heading);
        bar.appendChild(actions);

        var card = neoEl(doc, 'div', 'neo-detail-card');
        var cardHead = neoEl(doc, 'div', 'neo-detail-card-head');
        cardHead.appendChild(neoEl(doc, 'div', 'neo-detail-card-title', 'ReadMe'));
        var badge = neoEl(doc, 'div', 'neo-detail-badge');
        badge.id = 'neo-detail-badge';
        cardHead.appendChild(badge);
        var body = neoEl(doc, 'div', 'neo-readme-body neo-detail-readme');
        body.id = 'neo-mod-readme';
        card.appendChild(cardHead);
        card.appendChild(body);

        var json = neoEl(doc, 'details', 'neo-detail-json');
        var summary = neoEl(doc, 'summary', '', 'boot.json');
        var pre = neoEl(doc, 'pre', '');
        pre.id = 'neo-mod-json';
        pre.textContent = '（暂未读取）';
        json.appendChild(summary);
        json.appendChild(pre);

        detail.appendChild(bar);
        detail.appendChild(card);
        detail.appendChild(json);
        return detail;
    }

    function renderModSwitch(root, entry, detailMode) {
        var doc = root.ownerDocument || document;
        var switchBtn = neoEl(doc, 'button', 'neo-switch' + (entry.state === 'enabled' ? ' neo-switch-on' : ''));
        switchBtn.type = 'button';
        switchBtn.setAttribute('role', 'switch');
        switchBtn.setAttribute('aria-checked', entry.state === 'enabled' ? 'true' : 'false');
        switchBtn.setAttribute('aria-label', entry.state === 'enabled' ? '禁用 ' + entry.name : '启用 ' + entry.name);
        switchBtn.title = entry.state === 'enabled' ? '点击禁用（重新载入后生效）' : '点击启用（重新载入后生效）';
        var knob = neoEl(doc, 'span', 'neo-switch-knob');
        switchBtn.appendChild(knob);
        switchBtn.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleModEntry(root, entry);
        });
        return switchBtn;
    }

    function toneForName(name) {
        var sum = 0;
        var text = String(name || '');
        for (var i = 0; i < text.length; i++) {
            sum = (sum + text.charCodeAt(i) * (i + 3)) & 0xffffffff;
        }
        return 'neo-tone-' + (sum % 6);
    }

    function modLoadController(doc) {
        var gui = getGui(doc);
        try {
            return gui && gui.gModUtils && typeof gui.gModUtils.getModLoadController === 'function'
                ? gui.gModUtils.getModLoadController()
                : null;
        } catch (e) {
            return null;
        }
    }

    function refreshSideModSelect(root) {
        var doc = root.ownerDocument || document;
        var gui = getGui(doc);
        if (!gui || typeof gui.listSideLoadModNameCanUnload !== 'function') {
            return;
        }
        Promise.resolve(gui.listSideLoadModNameCanUnload()).then(function (names) {
            var select = root.querySelector('#MyConfig_RemoveMod_s');
            if (!select || !select.options) {
                return;
            }
            var current = select.value;
            select.options.length = 0;
            (names || []).forEach(function (name) {
                var option = doc.createElement('option');
                option.value = String(name);
                option.textContent = String(name).replace(/\.mod\.zip$/i, '');
                select.appendChild(option);
            });
            if (current && Array.prototype.some.call(select.options, function (option) {
                return option.value === current;
            })) {
                select.value = current;
            }
        }, function () {});
    }

    function purgeOrderEntry(root, key) {
        var hit = findOrderItem(root, key);
        if (!hit) {
            return;
        }
        var hostScope = orderScopeFor(hit.ng, hit.host);
        var data = hostScope && hostScope.$ctrl && hostScope.$ctrl.data;
        var type = hit.type;
        var list = data && type === 'enable' ? data.listEnabled : (data ? data.listDisabled : null);
        if (!hostScope || !data || !list) {
            return;
        }
        var index = list.findIndex(function (item) { return item.key === key; });
        if (index < 0) {
            return;
        }
        var before = cloneOrderList(list);
        var rollback = function () {
            if (type === 'enable') {
                data.listEnabled = before;
            } else {
                data.listDisabled = before;
            }
            safeOrderApply(hostScope);
        };
        list.splice(index, 1);
        persistOrder(hostScope, type === 'enable' ? 'enableUp1' : 'disableUp1', hit.host, rollback);
        safeOrderApply(hostScope);
    }

    function deleteModEntry(root, entry) {
        var doc = root.ownerDocument || document;
        if (!entry || !entry.manageable || !entry.orderKey) {
            neoToast(root, '内置 Mod 不能删除');
            return;
        }
        var name = entry.orderKey;
        var display = stripModZip(entry.display || entry.name || name);
        neoConfirm(root, {
            title: '删除这个旁加载 Mod？',
            name: '「' + display + '」',
            message: '删除后重新载入游戏才会完全移除。',
            confirmText: '删除',
            danger: true
        }).then(function (ok) {
            if (!ok) {
                return;
            }
            var controller = modLoadController(doc);
            if (!controller || typeof controller.removeModIndexDB !== 'function') {
                neoToast(root, '删除失败：当前加载器没有移除接口');
                return;
            }
            Promise.resolve(controller.removeModIndexDB(name)).then(function () {
                root.__neoDeleted = root.__neoDeleted || {};
                root.__neoDeleted[entry.name] = true;
                root.__neoDeleted[name] = true;
                if (root.__neoSideOrder) {
                    root.__neoSideOrder = root.__neoSideOrder.filter(function (item) {
                        return item !== entry.name;
                    });
                }
                if (root.__neoOpenMod && root.__neoOpenMod.name === entry.name) {
                    closeModDetail(root, true);
                }
                try {
                    purgeOrderEntry(root, name);
                } catch (e) {}
                refreshSideModSelect(root);
                refreshModList(root, true);
                setTimeout(function () {
                    try {
                        refreshOrderComponents(root);
                    } catch (e) {}
                }, 120);
                neoToast(root, '已删除「' + display + '」，重新载入后完全移除');
            }, function (error) {
                neoToast(root, '删除失败：' + (error && (error.message || error) || '未知错误'));
            });
        });
    }

    function renderModDelete(root, entry, wide) {
        var doc = root.ownerDocument || document;
        var button = neoEl(doc, 'button', wide ? 'neo-delete-wide' : 'neo-icon-btn neo-mod-delete');
        button.type = 'button';
        button.title = '删除这个旁加载 Mod';
        button.setAttribute('aria-label', '删除 ' + (entry.display || entry.name));
        button.appendChild(neoIcon(doc, 'trash'));
        if (wide) {
            button.appendChild(neoEl(doc, 'span', 'neo-delete-label', '删除'));
        }
        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            deleteModEntry(root, entry);
        });
        return button;
    }

    function clearModDropMarks(rows) {
        if (!rows) {
            return;
        }
        var marked = rows.querySelectorAll('.neo-mod-row.neo-drop-before, .neo-mod-row.neo-drop-after');
        for (var i = 0; i < marked.length; i++) {
            marked[i].classList.remove('neo-drop-before', 'neo-drop-after');
        }
    }

    function bindModListDrag(root, row, entry, handle) {
        if (!handle || handle.__neoDragBound || !entry.manageable) {
            return;
        }
        handle.__neoDragBound = true;
        handle.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
        });
        handle.addEventListener('pointerdown', function (event) {
            if (event.button !== undefined && event.button !== 0) {
                return;
            }
            var doc = row.ownerDocument || document;
            var rows = root.querySelector('#neo-mod-rows');
            if (!rows) {
                return;
            }
            var pointerId = event.pointerId;
            var startX = event.clientX;
            var startY = event.clientY;
            var dragging = false;
            var target = null;
            event.preventDefault();
            event.stopPropagation();
            try {
                handle.setPointerCapture(pointerId);
            } catch (e) {}

            var onMove = function (moveEvent) {
                if (!dragging) {
                    if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) < 7) {
                        return;
                    }
                    dragging = true;
                    row.classList.add('neo-list-dragging');
                }
                moveEvent.preventDefault();
                var element = doc.elementFromPoint ? doc.elementFromPoint(moveEvent.clientX, moveEvent.clientY) : null;
                var candidate = element && element.closest ? element.closest('.neo-mod-row') : null;
                if (!candidate || candidate === row || candidate.parentNode !== rows) {
                    clearModDropMarks(rows);
                    target = null;
                    return;
                }
                var candidateEntry = candidate.__neoEntry;
                if (!candidateEntry || !candidateEntry.manageable || candidateEntry.state !== entry.state) {
                    clearModDropMarks(rows);
                    target = null;
                    return;
                }
                clearModDropMarks(rows);
                var rect = candidate.getBoundingClientRect();
                var before = moveEvent.clientY < rect.top + rect.height / 2;
                candidate.classList.add(before ? 'neo-drop-before' : 'neo-drop-after');
                target = { row: candidate, before: before };
            };
            var onUp = function (upEvent) {
                dragging = false;
                try {
                    handle.releasePointerCapture(pointerId);
                } catch (e) {}
                handle.removeEventListener('pointermove', onMove);
                handle.removeEventListener('pointerup', onUp);
                handle.removeEventListener('pointercancel', onUp);
                clearModDropMarks(rows);
                row.classList.remove('neo-list-dragging');
                if (!target) {
                    return;
                }
                upEvent.preventDefault();
                row.__neoDragEnd = Date.now();
                reorderModEntry(root, entry, target.row.__neoEntry, target.before);
            };
            handle.addEventListener('pointermove', onMove);
            handle.addEventListener('pointerup', onUp);
            handle.addEventListener('pointercancel', onUp);
        });
    }

    function reorderModEntry(root, sourceEntry, targetEntry, before) {
        if (!sourceEntry || !targetEntry || sourceEntry.name === targetEntry.name) {
            return;
        }
        var sourceHit = findOrderItem(root, sourceEntry.orderKey);
        var targetHit = findOrderItem(root, targetEntry.orderKey);
        if (!sourceHit || !targetHit || sourceHit.type !== targetHit.type) {
            neoToast(root, '只能在同一分组内调整顺序');
            return;
        }
        var hostScope = orderScopeFor(sourceHit.ng, sourceHit.host);
        var data = hostScope && hostScope.$ctrl && hostScope.$ctrl.data;
        var type = sourceHit.type;
        var list = data && type === 'enable' ? data.listEnabled : (data ? data.listDisabled : null);
        var sourceModel = sourceHit.item && sourceHit.ng ? orderModelFor(sourceHit.ng, sourceHit.item) : null;
        var targetModel = targetHit.item && targetHit.ng ? orderModelFor(targetHit.ng, targetHit.item) : null;
        if (!hostScope || !data || !list || !sourceModel || !targetModel) {
            return;
        }
        var from = list.findIndex(function (item) { return item.key === sourceModel.key; });
        var to = list.findIndex(function (item) { return item.key === targetModel.key; });
        if (from < 0 || to < 0) {
            return;
        }
        var insertAt = to + (before ? 0 : 1);
        if (from < insertAt) {
            insertAt -= 1;
        }
        if (insertAt === from) {
            return;
        }
        var beforeList = cloneOrderList(list);
        var previousLocalOrder = root.__neoSideOrder ? root.__neoSideOrder.slice() : null;
        var moved = list.splice(from, 1)[0];
        list.splice(insertAt, 0, moved);
        var rollback = function () {
            if (type === 'enable') {
                data.listEnabled = beforeList;
            } else {
                data.listDisabled = beforeList;
            }
            safeOrderApply(hostScope);
            setTimeout(function () {
                try {
                    refreshOrderComponents(root);
                } catch (e) {}
            }, 0);
        };
        var result = persistOrder(hostScope, type === 'enable' ? 'enableDown1' : 'disableDown1', sourceHit.host, rollback);
        safeOrderApply(hostScope);

        var displayed = (root.__neoModEntries || []).filter(function (item) {
            return item.manageable;
        }).map(function (item) {
            return item.name;
        });
        if (displayed.indexOf(sourceEntry.name) >= 0 && displayed.indexOf(targetEntry.name) >= 0) {
            displayed = displayed.filter(function (name) { return name !== sourceEntry.name; });
            var targetIndex = displayed.indexOf(targetEntry.name);
            displayed.splice(targetIndex + (before ? 0 : 1), 0, sourceEntry.name);
            root.__neoSideOrder = displayed;
        }
        refreshModList(root, true);
        setTimeout(function () {
            try {
                refreshOrderComponents(root);
            } catch (e) {}
        }, 200);
        if (result && result.ok === false) {
            root.__neoSideOrder = previousLocalOrder;
            refreshModList(root, true);
            return;
        }
        neoToast(root, '已调整顺序，重新载入后生效');
    }

    function applyLocalSideOrder(root, entries) {
        var preferred = root.__neoSideOrder;
        if (!preferred || !preferred.length) {
            return entries;
        }
        var sideByName = {};
        var sideItems = [];
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].manageable) {
                sideByName[entries[i].name] = entries[i];
                sideItems.push(entries[i]);
            }
        }
        var ordered = [];
        var used = {};
        for (var p = 0; p < preferred.length; p++) {
            var name = preferred[p];
            if (sideByName[name] && !used[name]) {
                used[name] = true;
                ordered.push(sideByName[name]);
            }
        }
        for (var s = 0; s < sideItems.length; s++) {
            if (!used[sideItems[s].name]) {
                used[sideItems[s].name] = true;
                ordered.push(sideItems[s]);
            }
        }
        var result = [];
        var sideIndex = 0;
        for (var e = 0; e < entries.length; e++) {
            if (entries[e].manageable) {
                result.push(ordered[sideIndex++] || entries[e]);
            } else {
                result.push(entries[e]);
            }
        }
        return result;
    }

    function renderModRows(root, entries) {
        var doc = root.ownerDocument || document;
        var rows = root.querySelector('#neo-mod-rows');
        if (!rows) {
            return;
        }
        rows.textContent = '';
        var filter = root.__neoModFilter || 'all';
        var visible = 0;
        var deleted = root.__neoDeleted || {};
        entries.forEach(function (entry) {
            if (deleted[entry.name] || (entry.orderKey && deleted[entry.orderKey])) {
                return;
            }
            if (filter === 'enabled' && entry.state !== 'enabled') {
                return;
            }
            if (filter === 'disabled' && entry.state !== 'disabled') {
                return;
            }
            if (filter === 'builtin' && entry.state !== 'builtin') {
                return;
            }
            var row = neoEl(doc, 'div', 'neo-mod-row');
            row.__neoEntry = entry;
            row.setAttribute('data-neo-mod-name', entry.name);
            row.setAttribute('data-neo-state', entry.state);
            row.setAttribute('data-neo-side', entry.manageable ? '1' : '0');
            row.setAttribute('role', 'button');
            row.tabIndex = 0;
            row.dataset.neoSearch = (entry.name + ' ' + (entry.nick || '') + ' ' + (entry.version || '') + ' ' + (entry.source || '')).toLowerCase();

            var handle = neoEl(doc, 'span', 'neo-list-drag' + (entry.manageable ? '' : ' neo-list-drag-empty'), entry.manageable ? '⋮⋮' : '');
            if (entry.manageable) {
                handle.title = '拖动调整顺序';
                handle.setAttribute('aria-label', '拖动 ' + (entry.display || entry.name) + ' 调整顺序');
                bindModListDrag(root, row, entry, handle);
            } else {
                handle.setAttribute('aria-hidden', 'true');
            }

            var avatar = neoEl(doc, 'div', 'neo-mod-avatar ' + toneForName(entry.name));
            avatar.textContent = String(entry.name || '?').trim().charAt(0).toUpperCase() || '?';

            var main = neoEl(doc, 'div', 'neo-mod-main');
            var nameLine = neoEl(doc, 'div', 'neo-mod-name-line');
            var name = neoEl(doc, 'span', 'neo-mod-name', entry.display || entry.name);
            name.title = entry.name;
            nameLine.appendChild(name);
            var tagText = entry.manageable ? '旁加载' : '';
            if (tagText) {
                nameLine.appendChild(neoEl(doc, 'span', 'neo-tag neo-tag-side', tagText));
            }
            var metaParts = [];
            if (entry.version) {
                metaParts.push('v' + String(entry.version).replace(/^v/i, ''));
            }
            if (entry.nick) {
                metaParts.push(entry.nick);
            }
            if (entry.state === 'disabled') {
                metaParts.push('已禁用 · 重新载入后生效');
            } else if (entry.state === 'builtin') {
                metaParts.push('随游戏加载');
            } else {
                metaParts.push('已启用');
            }
            var meta = neoEl(doc, 'div', 'neo-mod-meta', metaParts.join(' · '));
            main.appendChild(nameLine);
            main.appendChild(meta);

            var side = neoEl(doc, 'div', 'neo-mod-side');
            if (entry.manageable) {
                side.appendChild(renderModDelete(root, entry, false));
                side.appendChild(renderModSwitch(root, entry, false));
            } else {
                side.appendChild(neoEl(doc, 'span', 'neo-inline-lock', '内置'));
            }
            side.appendChild(neoIcon(doc, 'chevron'));

            row.appendChild(handle);
            row.appendChild(avatar);
            row.appendChild(main);
            row.appendChild(side);

            row.addEventListener('click', function (event) {
                if (Date.now() - (row.__neoDragEnd || 0) < 350) {
                    return;
                }
                var target = event.target;
                if (target && target.closest && target.closest('button, .neo-switch, .neo-list-drag')) {
                    return;
                }
                openModDetail(root, entry);
            });
            row.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openModDetail(root, entry);
                }
            });

            rows.appendChild(row);
            visible++;
        });
        var empty = root.querySelector('#neo-mod-empty');
        if (empty) {
            empty.hidden = visible > 0;
        }
        applyNeoSearch(root);
    }

    function updateModStats(root, entries) {
        var loaded = entries.length;
        var manageable = 0;
        var disabled = 0;
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].manageable) {
                manageable++;
            }
            if (entries[i].state === 'disabled') {
                disabled++;
            }
        }
        var log = root.querySelector('#idLoadLogHtml');
        var stats = {
            loaded: loaded,
            manageable: manageable,
            disabled: disabled,
            logs: log ? log.children.length : 0
        };
        for (var key in stats) {
            if (!Object.prototype.hasOwnProperty.call(stats, key)) {
                continue;
            }
            var nodes = root.querySelectorAll('[data-neo-stat="' + key + '"]');
            for (var n = 0; n < nodes.length; n++) {
                var text = String(stats[key]);
                if (nodes[n].textContent !== text) {
                    nodes[n].textContent = text;
                }
            }
        }
        var count = root.querySelector('#neo-mod-count');
        if (count) {
            var countText = loaded + ' 项';
            if (count.textContent !== countText) {
                count.textContent = countText;
            }
        }
        var sort = root.querySelector('#neo-sort-toggle');
        if (sort) {
            sort.hidden = manageable === 0;
        }
    }

    function refreshModList(root, force) {
        var rows = root.querySelector('#neo-mod-rows');
        if (!rows) {
            return;
        }
        var entries = readLoadedModEntries(root);
        entries = applyLocalSideOrder(root, entries);
        root.__neoModEntries = entries;
        var sig = entries.map(function (entry) {
            return entry.name + ':' + entry.state + ':' + entry.version + ':' + entry.orderKey;
        }).join('|') + '|' + (root.__neoModFilter || 'all') + '|' + ((root.__neoSideOrder || []).join(','));
        updateModStats(root, entries);
        if (!force && sig === root.__neoModSig) {
            return;
        }
        root.__neoModSig = sig;
        renderModRows(root, entries);
    }

    function toggleModEntry(root, entry) {
        var hit = findOrderItem(root, entry.orderKey);
        if (!hit) {
            neoToast(root, '「' + entry.name + '」由游戏本体加载，无法在管理器里禁用');
            return;
        }
        toggleOrderItem(root, hit.host, hit.item, hit.ng);
        entry.state = entry.state === 'enabled' ? 'disabled' : 'enabled';
        var row = null;
        var allRows = root.querySelectorAll('.neo-mod-row');
        for (var ri = 0; ri < allRows.length; ri++) {
            if (allRows[ri].getAttribute('data-neo-mod-name') === entry.name) {
                row = allRows[ri];
                break;
            }
        }
        if (row) {
            row.setAttribute('data-neo-state', entry.state);
            var sw = row.querySelector('.neo-switch');
            if (sw) {
                sw.classList.toggle('neo-switch-on', entry.state === 'enabled');
                sw.setAttribute('aria-checked', entry.state === 'enabled' ? 'true' : 'false');
            }
            var meta = row.querySelector('.neo-mod-meta');
            if (meta) {
                meta.textContent = meta.textContent.replace(/已启用|已禁用[^·]*/, entry.state === 'enabled' ? '已启用' : '已禁用 · 重新载入后生效');
            }
        }
        setTimeout(function () {
            refreshOrderComponents(root);
            refreshModList(root, true);
        }, 240);
    }

    function updateDetailActions(root, entry) {
        var actions = root.querySelector('#neo-detail-actions');
        if (!actions) {
            return;
        }
        actions.textContent = '';
        if (entry.manageable) {
            actions.appendChild(renderModDelete(root, entry, true));
            actions.appendChild(renderModSwitch(root, entry, true));
        } else {
            actions.appendChild(neoEl(root.ownerDocument || document, 'span', 'neo-inline-lock', '内置 Mod'));
        }
    }

    function closeModDetail(root, silent) {
        var page = root.querySelector('.neo-page[data-neo-page="mods"]');
        if (page) {
            page.dataset.neoView = 'list';
        }
        root.__neoOpenMod = null;
    }

    function openModDetail(root, entry) {
        if (!entry || !entry.name) {
            return;
        }
        var page = root.querySelector('.neo-page[data-neo-page="mods"]');
        if (!page) {
            return;
        }
        var doc = root.ownerDocument || document;
        page.dataset.neoView = 'detail';
        root.__neoOpenMod = entry;
        var nameNode = root.querySelector('#neo-detail-name');
        var metaNode = root.querySelector('#neo-detail-meta');
        var badge = root.querySelector('#neo-detail-badge');
        var body = root.querySelector('#neo-mod-readme');
        var json = root.querySelector('#neo-mod-json');
        if (nameNode) {
            nameNode.textContent = entry.display || entry.name;
            nameNode.title = entry.name;
        }
        var metaParts = [];
        if (entry.version) {
            metaParts.push('v' + String(entry.version).replace(/^v/i, ''));
        }
        metaParts.push(entry.manageable ? '旁加载 Mod' : '内置 Mod');
        if (entry.state === 'disabled') {
            metaParts.push('已禁用');
        } else if (entry.state === 'enabled') {
            metaParts.push('已启用');
        }
        if (metaNode) {
            metaNode.textContent = metaParts.join(' · ');
        }
        if (badge) {
            var badgeText = entry.state === 'disabled' ? '已禁用' : '';
            badge.textContent = badgeText;
            badge.hidden = !badgeText;
            badge.className = 'neo-detail-badge' + (entry.state === 'disabled' ? ' neo-detail-badge-off' : '');
        }
        updateDetailActions(root, entry);
        if (body) {
            body.innerHTML = '<div class="neo-readme-loading">加载中…</div>';
        }
        if (json) {
            json.textContent = '（暂未读取）';
        }
        var token = (root.__neoDetailToken || 0) + 1;
        root.__neoDetailToken = token;
        var gui = getGui(doc);
        if (!gui || typeof gui.getModTReadMe !== 'function') {
            if (body) {
                body.innerHTML = '<div class="neo-readme-error">无法连接到 ModLoader，读取失败。</div>';
            }
            return;
        }
        Promise.resolve(gui.getModTReadMe(entry.name)).then(function (readme) {
            if (!body || root.__neoDetailToken !== token || page.dataset.neoView !== 'detail') {
                return;
            }
            var text = String(readme == null ? '' : readme);
            if (!text || /^<<.*ReadMe.*>>$/.test(text.trim())) {
                body.innerHTML = '<div class="neo-readme-empty">' +
                    (entry.state === 'disabled'
                        ? '这个 Mod 当前已禁用，启用并重新载入后即可查看 ReadMe。'
                        : '这个 Mod 没有提供 ReadMe。') +
                    '</div>';
                return;
            }
            body.innerHTML = renderReadme(text);
        }, function (error) {
            if (!body || root.__neoDetailToken !== token) {
                return;
            }
            body.innerHTML = '<div class="neo-readme-error">读取失败：' + escapeReadmeHtml(error && error.message || error) + '</div>';
        });
        if (typeof gui.getModTJson === 'function') {
            Promise.resolve(gui.getModTJson(entry.name)).then(function (text) {
                if (!json || root.__neoDetailToken !== token) {
                    return;
                }
                var raw = String(text == null ? '' : text);
                if (!raw) {
                    json.textContent = '（没有 boot.json 数据）';
                    return;
                }
                try {
                    json.textContent = JSON.stringify(JSON.parse(raw), null, 2);
                } catch (e) {
                    json.textContent = raw;
                }
            }, function () {});
        }
    }

    function applyNeoSearch(root) {
        var query = String(root.__neoModQuery || '').trim().toLowerCase();
        var page = root.querySelector('.neo-page.neo-page-active');
        if (!page) {
            return;
        }
        var key = page.getAttribute('data-neo-page');
        if (key === 'mods') {
            var rows = page.querySelectorAll('.neo-mod-row');
            for (var i = 0; i < rows.length; i++) {
                var hay = String(rows[i].dataset.neoSearch || rows[i].textContent || '').toLowerCase();
                rows[i].hidden = !!query && hay.indexOf(query) < 0;
            }
            return;
        }
        if (key === 'logs') {
            var log = root.querySelector('#idLoadLogHtml');
            if (!log) {
                return;
            }
            for (var j = 0; j < log.children.length; j++) {
                var line = log.children[j];
                line.hidden = !!query && String(line.textContent || '').toLowerCase().indexOf(query) < 0;
            }
            return;
        }
        var groups = page.querySelectorAll('.neo-settings-group');
        for (var g = 0; g < groups.length; g++) {
            var group = groups[g];
            var titleNode = group.querySelector('.neo-settings-group-title');
            var titleHit = !query || (titleNode && String(titleNode.textContent || '').toLowerCase().indexOf(query) >= 0);
            var groupRows = group.querySelectorAll('.neo-settings-row');
            var visible = 0;
            for (var r = 0; r < groupRows.length; r++) {
                var row = groupRows[r];
                var hit = !query || titleHit || String(row.textContent || '').toLowerCase().indexOf(query) >= 0;
                row.hidden = !hit;
                if (hit) {
                    visible++;
                }
            }
            if (groupRows.length) {
                group.hidden = !!query && !titleHit && visible === 0;
            }
        }
    }

    function hideSpellSection(root) {
        var spell = root.querySelector('#MyConfig_section_9');
        if (spell) {
            spell.classList.add('neo-legacy-hidden');
            spell.dataset.neoSpellReady = '0';
        }
    }

    function wireTopbarAction(varEl) {
        if (!varEl) {
            return;
        }
        var input = varEl.querySelector('input[type="button"], button');
        if (!input) {
            return;
        }
        varEl.style.cursor = 'pointer';
        varEl.addEventListener('click', function (event) {
            if (event.target === input) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            input.click();
        });
    }

    function buildShell(root, wrapper, sections) {
        var doc = wrapper.ownerDocument || document;
        var existing = wrapper.querySelector('.neo-shell');
        if (existing) {
            wrapper.dataset.neoShell = '1';
            return;
        }
        var shell = neoEl(doc, 'div', 'neo-shell');
        var sidebar = neoEl(doc, 'aside', 'neo-sidebar');
        var main = neoEl(doc, 'main', 'neo-main');

        var brand = neoEl(doc, 'div', 'neo-brand');
        var mark = neoEl(doc, 'div', 'neo-brand-mark');
        mark.innerHTML = '<span></span>';
        var brandText = neoEl(doc, 'div', 'neo-brand-text');
        var brandName = neoEl(doc, 'div', 'neo-brand-name');
        brandName.innerHTML = 'ModLoader <span class="neo-brand-neo">Neo</span>';
        var version = BRAND.indexOf('v') >= 0 ? BRAND.slice(BRAND.indexOf('v')) : BRAND;
        var brandVersion = neoEl(doc, 'div', 'neo-brand-version', version + ' · 管理器');
        brandText.appendChild(brandName);
        brandText.appendChild(brandVersion);
        brand.appendChild(mark);
        brand.appendChild(brandText);
        sidebar.appendChild(brand);

        var searchWrap = neoEl(doc, 'label', 'neo-side-search');
        searchWrap.appendChild(neoIcon(doc, 'search'));
        var sideSearch = neoEl(doc, 'input', '');
        sideSearch.type = 'search';
        sideSearch.id = 'neo-side-search';
        sideSearch.placeholder = '搜索 Mod 名称或版本';
        sideSearch.setAttribute('aria-label', '搜索当前页面');
        searchWrap.appendChild(sideSearch);
        sidebar.appendChild(searchWrap);

        var nav = neoEl(doc, 'nav', 'neo-nav');
        nav.setAttribute('aria-label', '管理器分页');
        PAGES.forEach(function (def, pageIndex) {
            if (pageIndex === 2) {
                nav.appendChild(neoEl(doc, 'div', 'neo-nav-sep'));
            }
            var item = neoEl(doc, 'button', 'neo-nav-item' + (def.key === 'mods' ? ' neo-nav-active' : ''));
            item.type = 'button';
            item.setAttribute('data-neo-page', def.key);
            item.appendChild(neoIcon(doc, def.icon));
            item.appendChild(neoEl(doc, 'span', 'neo-nav-label', def.label));
            if (def.badge) {
                var badge = neoEl(doc, 'span', 'neo-tab-badge', '0');
                badge.setAttribute('data-badge', def.badge);
                badge.style.display = 'none';
                item.appendChild(badge);
            }
            item.addEventListener('click', function () {
                activatePage(root, def.key, true);
            });
            nav.appendChild(item);
        });
        sidebar.appendChild(nav);

        var foot = neoEl(doc, 'div', 'neo-side-foot');
        var status = neoEl(doc, 'div', 'neo-side-status');
        status.appendChild(neoEl(doc, 'span', 'neo-side-dot'));
        status.appendChild(neoEl(doc, 'span', '', '本地运行 · 离线可用'));
        foot.appendChild(status);
        foot.appendChild(neoEl(doc, 'div', 'neo-side-version', version));
        sidebar.appendChild(foot);

        var topbar = neoEl(doc, 'header', 'neo-topbar');
        var titles = neoEl(doc, 'div', 'neo-topbar-titles');
        var pageTitle = neoEl(doc, 'div', 'neo-topbar-title', 'Mod 管理');
        pageTitle.id = 'neo-page-title';
        var pageSubtitle = neoEl(doc, 'div', 'neo-topbar-subtitle', '查看、拖动排序、删除与启停；内置 Mod 固定');
        pageSubtitle.id = 'neo-page-subtitle';
        titles.appendChild(pageTitle);
        titles.appendChild(pageSubtitle);
        var actions = neoEl(doc, 'div', 'neo-topbar-actions');
        topbar.appendChild(titles);
        topbar.appendChild(actions);

        var reloadVar = root.querySelector('#MyConfig_Reload_b_var');
        var closeVar = root.querySelector('#MyConfig_Close_b_var');
        if (reloadVar) {
            reloadVar.classList.add('neo-topbar-action', 'neo-topbar-reload');
            reloadVar.insertBefore(neoIcon(doc, 'reload'), reloadVar.firstChild);
            actions.appendChild(reloadVar);
            wireTopbarAction(reloadVar);
        }
        if (closeVar) {
            closeVar.classList.add('neo-topbar-action', 'neo-topbar-close');
            closeVar.insertBefore(neoIcon(doc, 'close'), closeVar.firstChild);
            closeVar.title = '关闭管理器';
            actions.appendChild(closeVar);
            wireTopbarAction(closeVar);
        }

        var scroll = neoEl(doc, 'div', 'neo-main-scroll');
        scroll.id = 'neo-main-scroll';

        function makePage(key) {
            var page = neoEl(doc, 'section', 'neo-page');
            page.setAttribute('data-neo-page', key);
            return page;
        }

        /* ---- Mod 管理 ---- */
        var modsPage = makePage('mods');
        modsPage.dataset.neoView = 'list';
        modsPage.dataset.neoMode = 'list';
        var listView = neoEl(doc, 'div', 'neo-page-listview');
        listView.appendChild(buildModHero(doc));

        var toolbar = buildModToolbar(root, doc);
        var addPanel = buildAddPanel(root, doc);
        listView.appendChild(toolbar);
        listView.appendChild(addPanel);

        var listCard = neoEl(doc, 'div', 'neo-list-card');
        var listHead = neoEl(doc, 'div', 'neo-list-head');
        listHead.appendChild(neoEl(doc, 'div', 'neo-list-title', 'Mod 列表'));
        var listCount = neoEl(doc, 'span', 'neo-list-count');
        listCount.id = 'neo-mod-count';
        listHead.appendChild(listCount);
        var rows = neoEl(doc, 'div', 'neo-mod-rows');
        rows.id = 'neo-mod-rows';
        var empty = neoEl(doc, 'div', 'neo-empty', '没有找到匹配的 Mod');
        empty.id = 'neo-mod-empty';
        empty.hidden = true;
        var note = neoEl(doc, 'div', 'neo-list-note',
            '旁加载 Mod 可拖动左侧手柄排序、在右侧启用 / 禁用或删除（重新载入后生效）；内置 Mod 随游戏本体加载，不参与排序与删除。');
        listCard.appendChild(listHead);
        listCard.appendChild(rows);
        listCard.appendChild(empty);
        listCard.appendChild(note);
        listView.appendChild(listCard);

        var orderPanel = neoEl(doc, 'div', 'neo-order-panel');
        orderPanel.id = 'neo-order-panel';
        orderPanel.hidden = true;
        var orderHead = neoEl(doc, 'div', 'neo-order-panel-head');
        var orderTitles = neoEl(doc, 'div', '');
        orderTitles.appendChild(neoEl(doc, 'div', 'neo-group-title', '调整 Mod 顺序'));
        orderTitles.appendChild(neoEl(doc, 'div', 'neo-group-desc', '拖动左侧手柄或使用箭头调整加载顺序；启用 / 禁用会在重新载入后生效。'));
        var orderClose = neoEl(doc, 'button', 'neo-pill-btn', '返回列表');
        orderClose.type = 'button';
        orderClose.addEventListener('click', function () {
            modsPage.dataset.neoMode = 'list';
            orderPanel.hidden = true;
            var sortBtn = root.querySelector('#neo-sort-toggle');
            if (sortBtn) {
                sortBtn.textContent = '调整顺序';
            }
        });
        orderHead.appendChild(orderTitles);
        orderHead.appendChild(orderClose);
        orderPanel.appendChild(orderHead);
        var orderSection = sections.order;
        orderSection.classList.remove('neo-tab-hidden', 'neo-tab-panel', 'neo-tab-enter');
        orderPanel.appendChild(orderSection);
        listView.appendChild(orderPanel);

        var detail = buildDetailPanel(doc);
        modsPage.appendChild(listView);
        modsPage.appendChild(detail);

        var legacy = neoEl(doc, 'div', 'neo-legacy-hidden');
        var leftovers = [
            sections.anchor,
            root.querySelector('#MyConfig_section_1'),
            root.querySelector('#MyConfig_section_3'),
            root.querySelector('#MyConfig_section_4'),
            root.querySelector('#MyConfig_section_9'),
            root.querySelector('#MyConfig_header'),
            root.querySelector('#MyConfig_buttons_holder')
        ];
        for (var l = 0; l < leftovers.length; l++) {
            if (leftovers[l]) {
                leftovers[l].classList.add('neo-legacy-hidden');
                legacy.appendChild(leftovers[l]);
            }
        }
        modsPage.appendChild(legacy);

        scroll.appendChild(modsPage);

        /* ---- 日志管理 ---- */
        var logsPage = makePage('logs');
        var logHead = neoEl(doc, 'div', 'neo-group-head');
        var logTitles = neoEl(doc, 'div', '');
        logTitles.appendChild(neoEl(doc, 'div', 'neo-group-title', '加载日志'));
        logTitles.appendChild(neoEl(doc, 'div', 'neo-group-desc', '本次载入的 ModLoader 日志；可筛选、导出或清除解析缓存。'));
        logHead.appendChild(logTitles);
        logsPage.appendChild(logHead);
        sections.log.classList.remove('neo-tab-hidden', 'neo-tab-panel', 'neo-tab-enter');
        logsPage.appendChild(sections.log);

        var debugHead = neoEl(doc, 'div', 'neo-group-head neo-group-head-spaced');
        var debugTitles = neoEl(doc, 'div', '');
        debugTitles.appendChild(neoEl(doc, 'div', 'neo-group-title', '故障诊断'));
        debugTitles.appendChild(neoEl(doc, 'div', 'neo-group-desc', '导出运行数据供排查错误；数据只会保存在本机。'));
        debugHead.appendChild(debugTitles);
        logsPage.appendChild(debugHead);
        sections.debug.classList.remove('neo-tab-hidden', 'neo-tab-panel', 'neo-tab-enter');
        logsPage.appendChild(sections.debug);
        scroll.appendChild(logsPage);

        /* ---- 主题 ---- */
        var themePage = makePage('theme');
        sections.lantern.classList.remove('neo-tab-hidden', 'neo-tab-panel', 'neo-tab-enter');
        themePage.appendChild(sections.lantern);
        scroll.appendChild(themePage);

        /* ---- Loader 设置 ---- */
        var settingsPage = makePage('settings');
        var safeGroup = settingsGroup(doc, '安全模式', '启用后，下次载入不会加载任何 Mod；连续载入失败时也会自动进入安全模式。');
        var safeRow = neoEl(doc, 'div', 'neo-safe-row');
        safeRow.id = 'neo-safe-row';
        ['EnableSafeMode_b', 'DisableSafeMode_b', 'SafeModeState_R'].forEach(function (id) {
            var field = root.querySelector('#MyConfig_' + id + '_var');
            if (field) {
                field.classList.add('neo-safe-field');
                safeRow.appendChild(field);
            }
        });
        safeGroup.appendChild(safeRow);
        settingsPage.appendChild(safeGroup);
        sections.settings.classList.remove('neo-tab-hidden', 'neo-tab-panel', 'neo-tab-enter');
        settingsPage.appendChild(sections.settings);
        scroll.appendChild(settingsPage);

        main.appendChild(topbar);
        main.appendChild(scroll);
        shell.appendChild(sidebar);
        shell.appendChild(main);

        var oldBar = root.querySelector('#neo-tabbar');
        if (oldBar && oldBar.parentNode) {
            oldBar.parentNode.removeChild(oldBar);
        }
        wrapper.insertBefore(shell, wrapper.firstChild);

        /* 交互绑定 */
        var addToggle = root.querySelector('#neo-add-toggle');
        if (addToggle) {
            addToggle.addEventListener('click', function () {
                addPanel.hidden = !addPanel.hidden;
                addToggle.classList.toggle('neo-pill-active', !addPanel.hidden);
                if (!addPanel.hidden) {
                    var scroller = root.querySelector('#neo-main-scroll');
                    if (scroller) {
                        scroller.scrollTop = 0;
                    }
                }
            });
        }
        var sortToggle = root.querySelector('#neo-sort-toggle');
        if (sortToggle) {
            sortToggle.addEventListener('click', function () {
                var toOrder = modsPage.dataset.neoMode !== 'order';
                modsPage.dataset.neoMode = toOrder ? 'order' : 'list';
                orderPanel.hidden = !toOrder;
                sortToggle.textContent = toOrder ? '返回列表' : '调整顺序';
                if (toOrder) {
                    ensureAngularBoot(root).then(function () {
                        refreshOrderComponents(root);
                        refreshModList(root, true);
                    }, function () {});
                }
            });
        }
        var back = root.querySelector('#neo-detail-back');
        if (back) {
            back.addEventListener('click', function () {
                closeModDetail(root);
            });
        }
        sideSearch.addEventListener('input', function () {
            root.__neoModQuery = sideSearch.value;
            var modSearch = root.querySelector('#neo-mod-search');
            if (modSearch && modSearch.value !== sideSearch.value) {
                modSearch.value = sideSearch.value;
            }
            applyNeoSearch(root);
        });

        wrapper.dataset.neoShell = '1';
        // 每次打开管理器都从「Mod 管理」开始，不沿用上次停留的分页。
        activatePage(root, 'mods', false);
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
                setOrderStatus(host, '已保存，点击「重新载入」生效', false);
                return { ok: true };
            }, function (error) {
                if (rollback) {
                    rollback();
                }
                setOrderStatus(host, '保存失败：' + orderErrorText(error), true);
                return { ok: false, error: error };
            });
        }
        setOrderStatus(host, '已保存，点击「重新载入」生效', false);
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
            setTimeout(function () { refreshOrderComponents(root); }, 0);
        };
        var moved = list.splice(index, 1)[0];
        list.splice(next, 0, moved);
        persistOrder(hostScope, type === 'enable'
            ? (direction < 0 ? 'enableUp1' : 'enableDown1')
            : (direction < 0 ? 'disableUp1' : 'disableDown1'), host, rollback);
        safeOrderApply(hostScope);
        setTimeout(function () { refreshOrderComponents(root); }, 0);
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
            setTimeout(function () { refreshOrderComponents(root); }, 0);
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
        setTimeout(function () { refreshOrderComponents(root); }, 0);
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
                setTimeout(function () { refreshOrderComponents(root); }, 0);
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
        item.setAttribute('data-neo-mod-key', model.key);
        item.setAttribute('data-neo-mod-type', type);
        var name = item.querySelector('.neo-mod-name');
        var displayName = String(model.str || model.key || '').replace(/\.mod\.zip$/i, '');
        if (name && name.textContent !== displayName) {
            name.textContent = displayName;
        }
        item.setAttribute('data-neo-mod-name', displayName);
        item.setAttribute('data-neo-search', (displayName + ' ' + String(model.key || '')).toLowerCase());
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
            toggle.title = type === 'enable' ? '点击禁用这个 Mod' : '点击启用这个 Mod';
            toggle.setAttribute('aria-label', toggle.title);
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
            main.addEventListener('click', function (event) {
                if (event.target && event.target.closest && event.target.closest('button')) {
                    return;
                }
                var currentModel = orderModelFor(ng, item) || model;
                if (!currentModel) {
                    return;
                }
                var container = item.closest ? item.closest('.enable-order-component-select') : null;
                var currentType = orderListType(container);
                var display = String(currentModel.str || currentModel.key || '').replace(/\.mod\.zip$/i, '');
                openModDetail(root, {
                    name: resolveOrderModName(currentModel.key),
                    display: display,
                    version: String(orderVersion(currentModel.key) || '').replace(/^v/, ''),
                    nick: '',
                    source: '旁加载',
                    state: currentType === 'enable' ? 'enabled' : 'disabled',
                    orderKey: currentModel.key,
                    manageable: true
                });
            });
            bindOrderDrag(root, host, item, handle, ng);
        }
        updateOrderItem(item, type, model, index, total);
    }

    function orderSignature(root) {
        var hosts = root.querySelectorAll('.enable-order-component-host');
        var parts = [hosts.length];
        for (var h = 0; h < hosts.length; h++) {
            var host = hosts[h];
            parts.push(host.classList.contains('neo-order-enhanced') ? '1' : '0');
            var types = ['enable', 'disable'];
            for (var t = 0; t < types.length; t++) {
                var container = host.querySelector('.select-' + types[t]);
                if (!container) {
                    parts.push('-');
                    continue;
                }
                parts.push('+' + container.children.length);
                for (var i = 0; i < container.children.length; i++) {
                    var item = container.children[i];
                    var name = item.querySelector('.neo-mod-name');
                    parts.push((item.querySelector('.neo-mod-main') ? 'm' : 'u') + ':' + (name ? name.textContent : ''));
                }
            }
        }
        return parts.join('|');
    }

    function refreshOrderComponents(root) {
        if (root) {
            root.__neoOrderSignature = null;
        }
        enhanceOrderComponents(root);
    }

    function enhanceOrderComponents(root) {
        if (!root || !root.querySelectorAll) {
            return;
        }
        var hosts = root.querySelectorAll('.enable-order-component-host');
        if (!hosts.length) {
            root.__neoOrderSignature = '';
            return;
        }
        if (orderSignature(root) === root.__neoOrderSignature) {
            return;
        }
        var candidates = angularCandidates(root);
        if (!candidates.length) {
            return;
        }
        var hostsWithData = 0;
        var itemsPending = 0;
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
            hostsWithData++;
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
                        itemsPending++;
                        continue;
                    }
                    item.__neoKey = model.key;
                    item.__neoStr = model.str || model.key;
                    item.__neoNg = itemNg;
                    item.__neoHost = host;
                    item.setAttribute('data-neo-mod-key', model.key);
                    decorateOrderItem(root, host, item, type, model, itemNg, k, items.length);
                    hostEnhanced = true;
                }
            }
            host.classList.toggle('neo-order-enhanced', hostEnhanced);
        }
        root.__neoOrderSignature = (hostsWithData === hosts.length && itemsPending === 0)
            ? orderSignature(root)
            : null;
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

    function patchReloadButton(root) {
        if (!root || !root.querySelector) {
            return;
        }
        var button = root.querySelector('#MyConfig_field_Reload_b');
        if (!button || button.__neoHotReloadPatched) {
            return;
        }
        button.__neoHotReloadPatched = true;
        button.title = '重新载入 Mod 并尽量恢复当前进度';
        button.onclick = function (event) {
            if (event) {
                event.preventDefault();
                event.stopPropagation();
            }
            requestHotReload(button);
            return false;
        };
    }

    var neoApplyPerf = { applyCount: 0, lastMs: 0, slowCount: 0, lastSlowAt: 0 };

    function nowMs() {
        try {
            if (window.performance && typeof window.performance.now === 'function') {
                return window.performance.now();
            }
        } catch (e) {}
        return Date.now();
    }

    function managerVisible(root) {
        if (!root || !root.isConnected || root.hidden) {
            return false;
        }
        if (root.offsetParent !== null) {
            return true;
        }
        try {
            if (root.getClientRects) {
                return root.getClientRects().length > 0;
            }
        } catch (e) {}
        return false;
    }

    function apply() {
        var started = nowMs();
        neoApplyPerf.applyCount++;
        try {
            applyCore();
        } catch (e) {
            neoApplyPerf.errorCount = (neoApplyPerf.errorCount || 0) + 1;
            neoApplyPerf.lastError = String(e && (e.message || e) || e);
            if (!neoApplyPerf.errors) {
                neoApplyPerf.errors = [];
            }
            if (neoApplyPerf.errors.length < 5) {
                neoApplyPerf.errors.push(neoApplyPerf.lastError);
            }
        } finally {
            var cost = nowMs() - started;
            neoApplyPerf.lastMs = Math.round(cost * 10) / 10;
            if (cost > 16) {
                neoApplyPerf.slowCount++;
                var now = Date.now();
                if (now - neoApplyPerf.lastSlowAt > 5000) {
                    neoApplyPerf.lastSlowAt = now;
                    try {
                        console.debug('[ModLoaderNeoUI] apply cost ' + neoApplyPerf.lastMs + 'ms');
                    } catch (e) {}
                }
            }
            markApplyMeasure(started, cost);
            try {
                window.__neoUiPerf = neoApplyPerf;
            } catch (e) {}
        }
    }

    // P2: expose apply spans to a Performance trace. Only slow (>16ms) applies are
    // kept, and the list is capped, so long sessions cannot grow the timeline.
    var NEO_MEASURE = 'ModLoaderNeoUI.apply';
    var NEO_MEASURE_MAX = 20;

    function markApplyMeasure(started, cost) {
        try {
            var perf = window.performance;
            if (!perf || typeof perf.mark !== 'function' || typeof perf.measure !== 'function') {
                return;
            }
            if (cost <= 16) {
                return;
            }
            var startName = NEO_MEASURE + '.start';
            var endName = NEO_MEASURE + '.end';
            perf.mark(startName, { startTime: started });
            perf.mark(endName, { startTime: started + cost });
            perf.measure(NEO_MEASURE, startName, endName);
            perf.clearMarks(startName);
            perf.clearMarks(endName);
            if (typeof perf.getEntriesByName === 'function' &&
                typeof perf.clearMeasures === 'function' &&
                perf.getEntriesByName(NEO_MEASURE, 'measure').length > NEO_MEASURE_MAX) {
                perf.clearMeasures(NEO_MEASURE);
            }
        } catch (e) {}
    }

    function applyCore() {
        if (document.hidden) {
            return;
        }
        installPointerOutsideGuard();
        patchLazyAngular();
        patchGuiHooks();
        bindDoc(document);
        brandStartBanner();
        patchVersionStringBrand();
        brandVersionDisplay();
        ensureStyle(document);
        var root = document.getElementById('MyConfig');
        if (!root) {
            stopRootObserver();
            applyUiSkin(null, null);
            return;
        }
        ensureRootObserver(root);
        if (!managerVisible(root)) {
            applyUiSkin(root, null);
            return;
        }
        if (root.tagName === 'IFRAME') {
            try {
                ensureStyle(root.contentDocument);
                bindDoc(root.contentDocument);
                var body = root.contentDocument && root.contentDocument.getElementById('MyConfig');
                applyUiSkin(root, body);
                if (body) {
                    patchReloadButton(body);
                    applyTabs(body);
                    enhanceOrderComponents(body);
                    enhanceLog(body);
                    maybeEnhanceActiveTab(body);
                    applyBranding(body);
                    var iframeWrapper = body.querySelector('#MyConfig_wrapper');
                    if (iframeWrapper && iframeWrapper.dataset.neoShell === '1') {
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
            applyUiSkin(root, root);
            patchReloadButton(root);
            applyTabs(root);
            enhanceOrderComponents(root);
            enhanceLog(root);
            maybeEnhanceActiveTab(root);
            applyBranding(root);
            var wrapper = root.querySelector('#MyConfig_wrapper');
            if (wrapper && wrapper.dataset.neoShell === '1') {
                markNeoReady(root, root);
            } else {
                scheduleNeoReadyFallback(root, root);
            }
        }
        applyThemeSettings(root);
    }

    var neoApplyDebounceTimer = null;
    var neoRootObserver = null;
    var neoRootObserverTarget = null;
    var neoOpenBurstGen = 0;

    function isNeoGuiOpen() {
        try {
            var gui = window.modLoaderGui;
            return !!(gui && gui.gui && gui.gui.isOpen);
        } catch (e) {
            return false;
        }
    }

    function scheduleApply(delay) {
        if (neoApplyDebounceTimer) {
            return;
        }
        neoApplyDebounceTimer = setTimeout(function () {
            neoApplyDebounceTimer = null;
            try {
                apply();
            } catch (e) {}
        }, typeof delay === 'number' ? delay : 150);
    }

    function observerTargetFor(root) {
        if (root && root.tagName === 'IFRAME') {
            try {
                return root.contentDocument && root.contentDocument.body;
            } catch (e) {}
        }
        return root;
    }

    function ensureRootObserver(root) {
        var target = observerTargetFor(root);
        if (!target) {
            return;
        }
        if (neoRootObserver && neoRootObserverTarget === target) {
            return;
        }
        stopRootObserver();
        neoRootObserverTarget = target;
        neoRootObserver = new MutationObserver(function () {
            scheduleApply(180);
        });
        neoRootObserver.observe(target, { childList: true, subtree: true });
    }

    function stopRootObserver() {
        if (neoRootObserver) {
            neoRootObserver.disconnect();
            neoRootObserver = null;
        }
        neoRootObserverTarget = null;
    }

    function cancelOpenApplyBurst() {
        neoOpenBurstGen++;
    }

    function armOpenApplyBurst() {
        var gen = ++neoOpenBurstGen;
        try {
            apply();
        } catch (e) {}
        [80, 260, 700, 1500, 3000].forEach(function (delay) {
            setTimeout(function () {
                if (gen !== neoOpenBurstGen || !isNeoGuiOpen()) {
                    return;
                }
                try {
                    apply();
                } catch (e) {}
            }, delay);
        });
    }

    function startGuiPatchRetry() {
        var startedAt = Date.now();
        var timer = setInterval(function () {
            try {
                patchGuiHooks();
            } catch (e) {}
            var host = window.modLoaderGui;
            var gui = host && host.gui;
            if (gui && gui.__neoOpenPatched) {
                clearInterval(timer);
            } else if (Date.now() - startedAt > 15000) {
                clearInterval(timer);
            }
        }, 200);
    }

    function watchManagerEntry() {
        document.addEventListener('click', function (event) {
            var target = event.target;
            var banner = target && target.closest ? target.closest('#startBannerModLoaderGui') : null;
            if (!banner) {
                return;
            }
            [80, 300, 800, 1800].forEach(function (delay) {
                setTimeout(function () {
                    try {
                        patchGuiHooks();
                        apply();
                    } catch (e) {}
                }, delay);
            });
        }, true);
    }

    if (document.head) {
        ensureStyle(document);
    }
    if (document.head) {
        new MutationObserver(function () {
            scheduleApply(120);
        }).observe(document.head, { childList: true });
    }
    if (document.body) {
        new MutationObserver(function () {
            scheduleApply(150);
        }).observe(document.body, { childList: true });
    }
    if (document.body) {
        var brandTimer = null;
        var brandDeadline = Date.now() + 8000;
        new MutationObserver(function () {
            if (brandTimer || Date.now() > brandDeadline) {
                return;
            }
            brandTimer = setTimeout(function () {
                brandTimer = null;
                if (Date.now() > brandDeadline) {
                    return;
                }
                brandStartBanner();
                brandVersionDisplay();
            }, 200);
        }).observe(document.body, { childList: true, subtree: true });
    }
    window.addEventListener('load', apply);
    window.addEventListener('resize', function () {
        scheduleApply(120);
    });
    window.addEventListener('orientationchange', function () {
        scheduleApply(200);
    });
    document.addEventListener('visibilitychange', function () {
        if (!document.hidden) {
            scheduleApply(0);
        }
    });
    patchLazyAngular();
    startGuiPatchRetry();
    watchManagerEntry();
    try {
        registerHotReloadRestore();
    } catch (e) {}
    try {
        registerLoadNotice();
    } catch (e) {}
    apply();
    [0, 120, 500, 1200, 2500].forEach(function (delay) {
        setTimeout(function () {
            try {
                brandStartBanner();
                brandVersionDisplay();
            } catch (e) {}
        }, delay);
    });
})();

