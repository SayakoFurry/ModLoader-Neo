__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SC2DataManager: () => (/* binding */ SC2DataManager)
/* harmony export */ });
/* harmony import */ var _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SC2DataInfoCache */ "./src/BeforeSC2/SC2DataInfoCache.ts");
/* harmony import */ var _ModLoader__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ModLoader */ "./src/BeforeSC2/ModLoader.ts");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _MergeSC2DataInfoCache__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./MergeSC2DataInfoCache */ "./src/BeforeSC2/MergeSC2DataInfoCache.ts");
/* harmony import */ var _ModLoadController__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ModLoadController */ "./src/BeforeSC2/ModLoadController.ts");
/* harmony import */ var _AddonPlugin__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./AddonPlugin */ "./src/BeforeSC2/AddonPlugin.ts");
/* harmony import */ var _DependenceChecker__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./DependenceChecker */ "./src/BeforeSC2/DependenceChecker.ts");
/* harmony import */ var _PassageTracer__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./PassageTracer */ "./src/BeforeSC2/PassageTracer.ts");
/* harmony import */ var _Sc2EventTracer__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./Sc2EventTracer */ "./src/BeforeSC2/Sc2EventTracer.ts");
/* harmony import */ var _SC2JsEvalContext__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./SC2JsEvalContext */ "./src/BeforeSC2/SC2JsEvalContext.ts");
/* harmony import */ var _Utils__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./Utils */ "./src/BeforeSC2/Utils.ts");
/* harmony import */ var _JsPreloader__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./JsPreloader */ "./src/BeforeSC2/JsPreloader.ts");
/* harmony import */ var _HtmlTagSrcHook__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./HtmlTagSrcHook */ "./src/BeforeSC2/HtmlTagSrcHook.ts");
/* harmony import */ var _LanguageManager__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! ./LanguageManager */ "./src/BeforeSC2/LanguageManager.ts");
/* harmony import */ var _WikifyTracer__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! ./WikifyTracer */ "./src/BeforeSC2/WikifyTracer.ts");















class SC2DataManager {
    constructor(thisWin) {
        this.thisWin = thisWin;
        this.startInitOk = false;
        // init on there for fix babel https://github.com/babel/babel/issues/13779
        this.modUtils = new _Utils__WEBPACK_IMPORTED_MODULE_10__.ModUtils(this, this.thisWin);
        this.modLoadController = new _ModLoadController__WEBPACK_IMPORTED_MODULE_4__.ModLoadController(this);
        this.passageTracer = new _PassageTracer__WEBPACK_IMPORTED_MODULE_7__.PassageTracer(this.thisWin);
        this.languageManager = new _LanguageManager__WEBPACK_IMPORTED_MODULE_13__.LanguageManager(this.thisWin, this);
        this.sc2EventTracer = new _Sc2EventTracer__WEBPACK_IMPORTED_MODULE_8__.Sc2EventTracer(this.thisWin, this);
        this.jsPreloader = new _JsPreloader__WEBPACK_IMPORTED_MODULE_11__.JsPreloader(this, this.modUtils, this.thisWin);
        this.addonPluginManager = new _AddonPlugin__WEBPACK_IMPORTED_MODULE_5__.AddonPluginManager(this, this.getModLoadController());
        this.sC2JsEvalContext = new _SC2JsEvalContext__WEBPACK_IMPORTED_MODULE_9__.SC2JsEvalContext(this);
        this.dependenceChecker = new _DependenceChecker__WEBPACK_IMPORTED_MODULE_6__.DependenceChecker(this, this.getModUtils());
        this.htmlTagSrcHook = new _HtmlTagSrcHook__WEBPACK_IMPORTED_MODULE_12__.HtmlTagSrcHook(this);
        this.wikifyTracer = new _WikifyTracer__WEBPACK_IMPORTED_MODULE_14__.WikifyTracer(this);
        // this.
    }
    getModUtils() {
        return this.modUtils;
    }
    getModLoadController() {
        return this.modLoadController;
    }
    get rootNode() {
        return this.thisWin.document.getElementsByTagName('tw-storydata')[0];
    }
    get styleNode() {
        return this.rootNode.getElementsByTagName('style');
    }
    get scriptNode() {
        return this.rootNode.getElementsByTagName('script');
    }
    get passageDataNodeList() {
        return Array.from(this.rootNode.getElementsByTagName('tw-passagedata'));
    }
    checkSC2Data() {
        const rNodes = this.thisWin.document.getElementsByTagName('tw-storydata');
        if (!rNodes) {
            console.error('checkSC2Data() (!rNodes)');
            return false;
        }
        if (rNodes.length !== 1) {
            console.error('checkSC2Data() (rNodes.length !== 1)');
            return false;
        }
        const rNode = rNodes[0];
        const stNodes = rNode.getElementsByTagName('style');
        if (!stNodes) {
            console.error('checkSC2Data() (!stNodes)');
            return false;
        }
        if (stNodes.length !== 1) {
            console.error('checkSC2Data() (stNodes.length !== 1)');
            return false;
        }
        const stNode = stNodes[0];
        const scNodes = rNode.getElementsByTagName('script');
        if (!scNodes) {
            console.error('checkSC2Data() (!scNodes)');
            return false;
        }
        if (scNodes.length !== 1) {
            console.error('checkSC2Data() (scNodes.length !== 1)');
            return false;
        }
        const passageDataNodes = rNode.getElementsByTagName('tw-storydata');
        if (!passageDataNodes) {
            console.error('checkSC2Data() (!passageDataNodes)');
            return false;
        }
        if (passageDataNodes.length < 1) {
            console.error('checkSC2Data() (passageDataNodes.length < 1)');
            return false;
        }
        const nn = Array.from(rNode.childNodes).map((T) => T.nodeName).filter(T => T.toUpperCase() !== 'TW-PASSAGEDATA');
        if (nn.length !== 2) {
            console.warn('checkSC2Data() (nn.length !== 2) some addtion unkown node in tw-storydata');
        }
        return true;
    }
    createNewSC2DataInfoFromNow() {
        return new _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_0__.SC2DataInfoCache(this.getModLoadController().getLog(), 'orgin', Array.from(this.scriptNode), Array.from(this.styleNode), Array.from(this.passageDataNodeList));
    }
    earlyResetSC2DataInfoCache() {
        // keep originSC2DataInfoCache valid
        this.initSC2DataInfoCache();
        // this.originSC2DataInfoCache = undefined;
        // this.getSC2DataInfoCache();
        this.flushAfterPatchCache();
    }
    cleanAllCacheAfterModLoadEnd() {
        var _a, _b, _c, _d;
        (_a = this.originSC2DataInfoCache) === null || _a === void 0 ? void 0 : _a.clean();
        (_b = this.originSC2DataInfoCache) === null || _b === void 0 ? void 0 : _b.destroy();
        this.originSC2DataInfoCache = undefined;
        (_c = this.cSC2DataInfoAfterPatchCache) === null || _c === void 0 ? void 0 : _c.clean();
        (_d = this.cSC2DataInfoAfterPatchCache) === null || _d === void 0 ? void 0 : _d.destroy();
        this.cSC2DataInfoAfterPatchCache = undefined;
    }
    initSC2DataInfoCache() {
        if (!this.originSC2DataInfoCache) {
            this.originSC2DataInfoCache = new _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_0__.SC2DataInfoCache(this.getModLoadController().getLog(), 'orgin', Array.from(this.scriptNode), Array.from(this.styleNode), Array.from(this.passageDataNodeList));
            // console.log('getSC2DataInfoCache() init', this.originSC2DataInfoCache);
        }
    }
    /**
     * 读取原始的没有被修改过的SC2Data，
     * 对于mod来说，如无必要不要使用这里的数据，
     * 特别是合并时不要使用此处的数据作为数据源，而是使用 getSC2DataInfoAfterPatch()，否则会覆盖之前的mod的修改，导致之前的修改无效
     */
    getSC2DataInfoCache() {
        this.initSC2DataInfoCache();
        // console.log('getSC2DataInfoCache() get', this.originSC2DataInfoCache);
        if (!this.originSC2DataInfoCache) {
            console.error('getSC2DataInfoCache() (!this.originSC2DataInfoCache)');
            this.getModLoadController().getLog().error('getSC2DataInfoCache() (!this.originSC2DataInfoCache)');
        }
        // TODO a immutable clone
        return this.originSC2DataInfoCache;
    }
    getModLoader() {
        if (!this.modLoader) {
            console.log('this.modLoadControllerCallback', this.getModLoadController());
            this.modLoader = new _ModLoader__WEBPACK_IMPORTED_MODULE_1__.ModLoader(this, this.getModLoadController(), this.thisWin);
        }
        return this.modLoader;
    }
    getPassageTracer() {
        return this.passageTracer;
    }
    getLanguageManager() {
        return this.languageManager;
    }
    getSc2EventTracer() {
        return this.sc2EventTracer;
    }
    getJsPreloader() {
        return this.jsPreloader;
    }
    getAddonPluginManager() {
        return this.addonPluginManager;
    }
    getSC2JsEvalContext() {
        return this.sC2JsEvalContext;
    }
    getDependenceChecker() {
        return this.dependenceChecker;
    }
    getHtmlTagSrcHook() {
        return this.htmlTagSrcHook;
    }
    getWikifyTracer() {
        return this.wikifyTracer;
    }
    async startInit() {
        if (this.startInitOk) {
            console.log('ModLoader ====== SC2DataManager startInit() already start');
            this.getModLoadController().logInfo('ModLoader ====== SC2DataManager startInit() already start');
            return;
        }
        this.startInitOk = true;
        console.log('ModLoader ====== SC2DataManager startInit() start');
        this.getModLoadController().logInfo('ModLoader ====== SC2DataManager startInit() start');
        // keep originSC2DataInfoCache valid, keep it have the unmodified vanilla data
        this.initSC2DataInfoCache();
        await this.getModLoader().loadMod([
            _ModLoader__WEBPACK_IMPORTED_MODULE_1__.ModDataLoadType.Local,
            _ModLoader__WEBPACK_IMPORTED_MODULE_1__.ModDataLoadType.Remote,
            _ModLoader__WEBPACK_IMPORTED_MODULE_1__.ModDataLoadType.LocalStorage,
            _ModLoader__WEBPACK_IMPORTED_MODULE_1__.ModDataLoadType.IndexDB,
        ]);
        this.getDependenceChecker().check();
        this.conflictResult = this.getModLoader().checkModConflictList();
        console.log('ModLoader ====== mod conflictResult', this.conflictResult.map(T => {
            return {
                name: T.mod.dataSource,
                style: Array.from(T.result.styleFileItems.conflict),
                script: Array.from(T.result.scriptFileItems.conflict),
                passage: Array.from(T.result.passageDataItems.conflict),
            };
        }));
        if (!this.getModLoader().checkModCacheData()) {
            // never go there
            console.error('ModLoader ====== SC2DataManager startInit() checkData() fail. never go there.');
            this.getModLoadController().logError('ModLoader ====== SC2DataManager startInit() checkData() fail. Data consistency check failed.. never go there.');
        }
        if (!this.getModLoader().checkModCacheUniq()) {
            console.error('ModLoader ====== SC2DataManager startInit() checkNameUniq() fail. never go there.');
            this.getModLoadController().logError('ModLoader ====== SC2DataManager startInit() checkNameUniq() fail. Data consistency check failed.. never go there.');
        }
        await this.getAddonPluginManager().triggerHook('beforePatchModToGame');
        await this.patchModToGame();
        await this.getAddonPluginManager().triggerHook('afterPatchModToGame');
        this.getModLoadController().logInfo('ModLoader ====== SC2DataManager startInit() end. To Start JsPreloader.....');
    }
    getConflictResult() {
        return this.conflictResult;
    }
    /**
     * 获取最新的SC2Data，此处获得的是之前的mod修改后的最新的SC2Data数据，
     * 此处使用了缓存，如果修改了SC2Data，请调用 flushAfterPatchCache() 来清除缓存，重新从html中读取最新的SC2Data
     */
    getSC2DataInfoAfterPatch() {
        // keep originSC2DataInfoCache valid
        this.initSC2DataInfoCache();
        if (!this.cSC2DataInfoAfterPatchCache) {
            this.cSC2DataInfoAfterPatchCache = new _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_0__.SC2DataInfoCache(this.getModLoadController().getLog(), 'orgin', Array.from(this.scriptNode), Array.from(this.styleNode), Array.from(this.passageDataNodeList));
            // console.log('getSC2DataInfoAfterPatch() init', this.cSC2DataInfoAfterPatchCache);
            console.log('getSC2DataInfoAfterPatch() init cloneSC2DataInfo', this.cSC2DataInfoAfterPatchCache.cloneSC2DataInfo());
        }
        // console.log('getSC2DataInfoAfterPatch() get', this.cSC2DataInfoAfterPatchCache);
        return this.cSC2DataInfoAfterPatchCache;
    }
    flushAfterPatchCache() {
        var _a;
        (_a = this.cSC2DataInfoAfterPatchCache) === null || _a === void 0 ? void 0 : _a.destroy();
        this.cSC2DataInfoAfterPatchCache = undefined;
        this.getSC2DataInfoAfterPatch();
    }
    async applyReplacePatcher(modSC2DataInfoCache) {
        const modOrder = this.getModLoader().getModCacheOneArray();
        for (const mod of modOrder) {
            for (const rp of mod.mod.replacePatcher) {
                const modName = mod.name;
                console.log('ModLoader ====== applyReplacePatcher() Replace Patch', [modName, rp.patchFileName]);
                await this.getModLoadController().ReplacePatcher_start(modName, rp.patchFileName);
                const log = this.getModLoadController().getLog();
                try {
                    rp.applyReplacePatcher(modSC2DataInfoCache);
                }
                catch (e) {
                    console.error('ModLoader ====== applyReplacePatcher() Replace Patch Error: ', e);
                    log.error(`ModLoader ====== applyReplacePatcher() Replace Patch Error: [${(e === null || e === void 0 ? void 0 : e.message) ? e.message : e}]`);
                }
                await this.getModLoadController().ReplacePatcher_end(modName, rp.patchFileName);
                console.log('ModLoader ====== applyReplacePatcher() Replace Patch', [modName, rp.patchFileName]);
            }
        }
    }
    async patchModToGame() {
        var _a;
        await this.getModLoadController().PatchModToGame_start();
        const modOrder = this.getModLoader().getModCacheArray();
        (_a = this.cSC2DataInfoAfterPatchCache) === null || _a === void 0 ? void 0 : _a.destroy();
        this.cSC2DataInfoAfterPatchCache = undefined;
        this.flushAfterPatchCache();
        const originSC2DataInfoCache = this.getSC2DataInfoAfterPatch();
        // concat mod
        console.log('ModLoader ====== patchModToGame() Concat Mod');
        const em = (0,_MergeSC2DataInfoCache__WEBPACK_IMPORTED_MODULE_3__.normalMergeSC2DataInfoCache)(new _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_0__.SC2DataInfo(this.getModLoadController().getLog(), 'EmptyMod'), ...modOrder.map(T => T.mod)
            .filter((T) => !!T)
            .map(T => T.cache));
        // console.log('em scriptFileItems length', em.scriptFileItems.items.length);
        // console.log('originSC2DataInfoCache scriptFileItems length', originSC2DataInfoCache.scriptFileItems.items.length);
        // replace orgin img
        // for (const imgRPath of this.getModLoader().getModImgFileReplaceList()) {
        //     em.passageDataItems.items.forEach(T => {
        //         T.content = T.content.replace(imgRPath[0], imgRPath[1]);
        //     });
        //     em.styleFileItems.items.forEach(T => {
        //         T.content = T.content.replace(imgRPath[0], imgRPath[1]);
        //     });
        //     em.scriptFileItems.items.forEach(T => {
        //         T.content = T.content.replace(imgRPath[0], imgRPath[1]);
        //     });
        // }
        // console.log('originSC2DataInfoCache', originSC2DataInfoCache.scriptNode[0].innerHTML);
        // console.log('patchModToGame() originSC2DataInfoCache', structuredClone(originSC2DataInfoCache.scriptFileItems));
        // console.log('em', em);
        console.log('ModLoader ====== patchModToGame() Replace Game');
        // then replace origin
        const modSC2DataInfoCache = (0,_MergeSC2DataInfoCache__WEBPACK_IMPORTED_MODULE_3__.replaceMergeSC2DataInfoCache)(originSC2DataInfoCache.cloneSC2DataInfo(), em);
        // console.log('patchModToGame() originSC2DataInfoCache', structuredClone(originSC2DataInfoCache.scriptFileItems));
        // console.log('patchModToGame() originSC2DataInfoCache', originSC2DataInfoCache);
        // console.log('patchModToGame() modSC2DataInfoCache', modSC2DataInfoCache);
        // console.log('patchModToGame() modSC2DataInfoCache scriptFileItems length', modSC2DataInfoCache.scriptFileItems.items.length);
        await this.applyReplacePatcher(modSC2DataInfoCache);
        const newScriptNode = this.makeScriptNode(modSC2DataInfoCache);
        const newStyleNode = this.makeStyleNode(modSC2DataInfoCache);
        // console.log('modSC2DataInfoCache.passageDataItems.items', modSC2DataInfoCache.passageDataItems.items);
        const newPassageDataNode = modSC2DataInfoCache.passageDataItems.items.map(T => {
            return this.makePassageNode(T);
        });
        // console.log('patchModToGame() newScriptNode', newScriptNode);
        // console.log('patchModToGame() newStyleNode', newStyleNode);
        // console.log('patchModToGame() newPassageDataNode', newPassageDataNode);
        const rootNode = this.rootNode;
        const styleNode = this.styleNode;
        const scriptNode = this.scriptNode;
        const passageDataNodeList = this.passageDataNodeList;
        // remove old
        for (const node of Array.from(styleNode)) {
            rootNode.removeChild(node);
        }
        for (const node of Array.from(scriptNode)) {
            rootNode.removeChild(node);
        }
        for (const node of Array.from(passageDataNodeList)) {
            rootNode.removeChild(node);
        }
        // add new
        rootNode.appendChild(newScriptNode);
        rootNode.appendChild(newStyleNode);
        for (const node of newPassageDataNode) {
            rootNode.appendChild(node);
        }
        // update cache
        this.flushAfterPatchCache();
        await this.getModLoadController().PatchModToGame_end();
    }
    makePassageNode(T) {
        var _a;
        const s = this.thisWin.document.createElement('tw-passagedata');
        if (T.id && T.id > 0) {
            s.setAttribute('pid', '' + T.id);
        }
        s.setAttribute('name', T.name);
        // console.log('tags', T.tags);
        s.setAttribute('tags', ((_a = T.tags) === null || _a === void 0 ? void 0 : _a.join(' ')) || '');
        if (T.position) {
            s.setAttribute('position', T.position);
        }
        if (T.size) {
            s.setAttribute('size', T.size);
        }
        // s.innerText = `:: Widgets ${T.name}${T.tags?.length > 0 ? ` [${T.tags.join(' ')}]` : ''}\n${T.content}\n`;
        s.textContent = T.content;
        // s.innerHTML = T.content;
        return s;
    }
    makeStyleNode(sc) {
        const newStyleNodeContent = sc.styleFileItems.items.reduce((acc, T) => {
            return acc + `/* twine-user-stylesheet #${T.id}: "${T.name}" */${T.content}\n`;
        }, '');
        // console.log('makeStyleNode', newStyleNodeContent);
        const newStyleNode = this.thisWin.document.createElement('style');
        newStyleNode.setAttribute('type', 'text/twine-css');
        newStyleNode.setAttribute('role', 'stylesheet');
        newStyleNode.setAttribute('id', 'twine-user-stylesheet');
        newStyleNode.textContent = newStyleNodeContent;
        return newStyleNode;
    }
    makeScriptNode(sc) {
        sc.scriptFileItems.items = sc.scriptFileItems.items.sort((a, b) => {
            if ((0,lodash__WEBPACK_IMPORTED_MODULE_2__.isSafeInteger)(a.id) && (0,lodash__WEBPACK_IMPORTED_MODULE_2__.isSafeInteger)(b.id)) {
                if (a.id === 0 || b.id === 0) {
                    // o always in last
                    if (a.id === 0 && b.id !== 0) {
                        return 1;
                    }
                    if (a.id !== 0 && b.id === 0) {
                        return -1;
                    }
                    if (a.id === 0 && b.id === 0) {
                        return 0;
                    }
                }
                if (a.id < b.id) {
                    return -1;
                }
                if (a.id === b.id) {
                    return 0;
                }
                if (a.id > b.id) {
                    return 1;
                }
            }
            if ((0,lodash__WEBPACK_IMPORTED_MODULE_2__.isSafeInteger)(a.id)) {
                return -1;
            }
            if ((0,lodash__WEBPACK_IMPORTED_MODULE_2__.isSafeInteger)(b.id)) {
                return 1;
            }
            return 0;
        });
        const newScriptNodeContent = sc.scriptFileItems.items.reduce((acc, T) => {
            return acc + `/* twine-user-script #${T.id}: "${T.name}" */${T.content}\n`;
        }, '');
        // console.log('makeScriptNode', newScriptNodeContent);
        const newScriptNode = this.thisWin.document.createElement('script');
        newScriptNode.setAttribute('type', 'text/twine-javascript');
        newScriptNode.setAttribute('role', 'script');
        newScriptNode.setAttribute('id', 'twine-user-script');
        newScriptNode.textContent = newScriptNodeContent;
        return newScriptNode;
    }
    rePlacePassage(toRemovePassageDataNodeList, toAddPassageDataNodeList) {
        console.log('rePlacePassage()', toRemovePassageDataNodeList, toAddPassageDataNodeList);
        const rootNode = this.rootNode;
        console.log('rePlacePassage() rootNode', rootNode);
        const log = this.getModLoadController().getLog();
        for (const node of toRemovePassageDataNodeList) {
            const rn = rootNode.removeChild(node);
            if (!rn) {
                console.log('rePlacePassage() (!rn)', [node]);
                log.warn(`rePlacePassage() (!rn) [${node.getAttribute('name')}]`);
            }
        }
        for (const node of toAddPassageDataNodeList) {
            const an = rootNode.appendChild(node);
            if (!an) {
                console.log('rePlacePassage() (!an)', [node]);
                log.warn(`rePlacePassage() (!an) [${node.getAttribute('name')}]`);
            }
        }
    }
}

