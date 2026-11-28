__webpack_require__.r(__webpack_exports__);
/* harmony import */ var core_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! core-js */ "./node_modules/core-js/index.js");
/* harmony import */ var core_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(core_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _Utils_LazyIteratorAdaptor__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./Utils/LazyIteratorAdaptor */ "./src/BeforeSC2/Utils/LazyIteratorAdaptor.ts");
/* harmony import */ var _SC2DataManager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./SC2DataManager */ "./src/BeforeSC2/SC2DataManager.ts");
/* harmony import */ var _getGlobal__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./getGlobal */ "./src/BeforeSC2/getGlobal.ts");




// import {Inject4Jquery} from "./JqueryInjector";
console.log('getGlobal()', (0,_getGlobal__WEBPACK_IMPORTED_MODULE_3__.getGlobal)());
console.log('getGlobal().document', (0,_getGlobal__WEBPACK_IMPORTED_MODULE_3__.getGlobal)().document);
console.log('getGlobal().jQuery', (0,_getGlobal__WEBPACK_IMPORTED_MODULE_3__.getGlobal)().jQuery);
const thisWin = (0,_getGlobal__WEBPACK_IMPORTED_MODULE_3__.getGlobal)();
thisWin.modSC2DataManager = new _SC2DataManager__WEBPACK_IMPORTED_MODULE_2__.SC2DataManager(thisWin);
thisWin.modUtils = thisWin.modSC2DataManager.getModUtils();
thisWin.jsPreloader = thisWin.modSC2DataManager.getJsPreloader();
thisWin.modModLoadController = thisWin.modSC2DataManager.getModLoadController();
thisWin.modAddonPluginManager = thisWin.modSC2DataManager.getAddonPluginManager();
thisWin.modSC2JsEvalContext = thisWin.modSC2DataManager.getSC2JsEvalContext();
// Inject4Jquery(thisWin);

// i18n patch anchor compatibility.
// ModI18N patches use absolute character offsets (pos). Neo rebuilds the webpack
// bundle and applies game fixes, so those offsets can drift even when the original
// text is still present. ModI18N's small fuzzy window then inserts text in the
// wrong place (breaking HTML tags) or skips the patch entirely. Re-anchor by the
// original text before startReplace(). Adapted from DoLLauncher's patch-anchor.js
// (MIT), with the same __dollAnchorCompat guard so both layers can coexist.
(function installI18nAnchorCompat(win) {
    'use strict';
    var TAG = '[Neo-i18n]';
    var PATCHED = '__dollAnchorCompat';

    function matchesAt(text, from, pos) {
        return typeof pos === 'number' && pos >= 0 &&
            pos + from.length <= text.length && text.startsWith(from, pos);
    }

    function reanchor(list, getText, stats) {
        for (var i = 0; i < (list || []).length; i++) {
            var v = list[i];
            if (!v || typeof v.from !== 'string' || v.from.length === 0) {
                continue;
            }
            var text = getText(v);
            if (typeof text !== 'string' || text.length === 0) {
                continue;
            }
            if (matchesAt(text, v.from, v.pos)) {
                stats.hit++;
                continue;
            }

            var index = text.indexOf(v.from);
            if (index < 0) {
                stats.miss++;
                var key = v.passageName || v.fileName || '?';
                stats.missFiles.set(key, (stats.missFiles.get(key) || 0) + 1);
                continue;
            }

            var best = index;
            var count = 1;
            var next = index;
            while ((next = text.indexOf(v.from, next + 1)) >= 0) {
                count++;
                if (Math.abs(next - v.pos) < Math.abs(best - v.pos)) {
                    best = next;
                }
            }
            v.pos = best;
            if (count > 1) {
                stats.multi++;
            } else {
                stats.fixed++;
            }
        }
    }

    function run() {
        var i18n = win.modI18N;
        var typeB = i18n && i18n.typeB;
        if (!typeB) {
            return;
        }
        var manager = win.modSC2DataManager;
        var sc2 = manager && typeof manager.getSC2DataInfoAfterPatch === 'function'
            ? manager.getSC2DataInfoAfterPatch()
            : null;
        if (!sc2) {
            return;
        }

        var scripts = new Map();
        var styles = new Map();
        var passages = new Map();
        var itemsOf = function (holder) { return (holder && holder.items) || []; };
        var nameOf = function (holder, item) {
            return holder && typeof holder.getNoPathNameFromString === 'function'
                ? holder.getNoPathNameFromString(item.name)
                : item.name;
        };
        var scriptItems = itemsOf(sc2.scriptFileItems);
        var styleItems = itemsOf(sc2.styleFileItems);
        var passageItems = itemsOf(sc2.passageDataItems);
        var i;
        for (i = 0; i < scriptItems.length; i++) {
            scripts.set(nameOf(sc2.scriptFileItems, scriptItems[i]), scriptItems[i].content);
        }
        for (i = 0; i < styleItems.length; i++) {
            styles.set(nameOf(sc2.styleFileItems, styleItems[i]), styleItems[i].content);
        }
        for (i = 0; i < passageItems.length; i++) {
            passages.set(passageItems[i].name, passageItems[i].content);
        }

        var stats = { hit: 0, fixed: 0, multi: 0, miss: 0, missFiles: new Map() };
        reanchor(typeB.OutputText, function (v) {
            return v.js ? scripts.get(v.fileName) : v.css ? styles.get(v.fileName) : undefined;
        }, stats);
        reanchor(typeB.InputStoryScript, function (v) {
            return passages.get(v.passageName) || scripts.get(v.fileName);
        }, stats);

        win.__neoI18nAnchorStats = stats;
        var miss = Array.from(stats.missFiles.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 6)
            .map(function (entry) { return entry[0] + ':' + entry[1]; })
            .join('、');
        console.log(TAG, 'i18n 锚点检查完成', '命中=' + stats.hit, '重定位=' + stats.fixed,
            '多处命中=' + stats.multi, '未找到=' + stats.miss + (miss ? '（' + miss + '）' : ''));
        if (stats.miss > 0) {
            console.warn(TAG, '有 ' + stats.miss + ' 条汉化补丁的原文在当前游戏输出里不存在，相关文本会保持原文。');
        }
    }

    function wrap(instance) {
        if (!instance || instance[PATCHED]) {
            return;
        }
        var original = instance.startReplace;
        if (typeof original !== 'function') {
            return;
        }
        instance[PATCHED] = true;
        instance.startReplace = function () {
            try {
                run();
            } catch (e) {
                console.error(TAG, 'i18n 锚点重定位失败', e);
            }
            return original.apply(this, arguments);
        };
    }

    try {
        if (win.modI18N) {
            wrap(win.modI18N);
        } else {
            var current;
            Object.defineProperty(win, 'modI18N', {
                configurable: true,
                get: function () { return current; },
                set: function (value) { current = value; wrap(value); },
            });
        }
    } catch (e) {
        console.error(TAG, '无法监听 modI18N 实例', e);
    }
})(thisWin);

