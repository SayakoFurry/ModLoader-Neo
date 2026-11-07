__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DependenceChecker: () => (/* binding */ DependenceChecker),
/* harmony export */   InfiniteSemVerApi: () => (/* binding */ InfiniteSemVerApi)
/* harmony export */ });
/* harmony import */ var _SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SemVer/InfiniteSemVer */ "./src/BeforeSC2/SemVer/InfiniteSemVer.ts");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);


class InfiniteSemVerApi {
    constructor() {
        this.parseRange = _SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseRange;
        this.parseVersion = _SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseVersion;
        this.satisfies = _SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.satisfies;
    }
}
class DependenceChecker {
    constructor(gSC2DataManager, gModUtils) {
        this.gSC2DataManager = gSC2DataManager;
        this.gModUtils = gModUtils;
        this.log = this.gSC2DataManager.getModLoadController().getLog();
    }
    getInfiniteSemVerApi() {
        return new InfiniteSemVerApi();
    }
    /**
     * Return the loader version candidates for a dependency name, or null when
     * the name is not a loader alias.
     *
     * "ModLoader" keeps the original 2.x version and also accepts the Neo
     * version as a fallback. "ModLoader Neo" accepts the Neo 1.x version and
     * falls back to the underlying 2.x implementation version, so a mod can
     * depend on either name and still load on this rebuilt loader.
     */
    getLoaderVersionCandidates(modName) {
        const internal = this.gModUtils.version;
        const neo = this.gModUtils.neoVersion || '1.0.0';
        if (modName === 'ModLoader') {
            return [internal, neo];
        }
        if (modName === 'ModLoader Neo' || modName === 'ModLoaderNeo' || modName === 'ModLoader-Neo') {
            return [neo, internal];
        }
        return null;
    }
    /**
     * @return {null | { ok: boolean, versions: string[] }}
     *   null when this is not a loader dependency.
     */
    checkLoaderDependency(d) {
        const versions = this.getLoaderVersionCandidates(d.modName);
        if (versions === null) {
            return null;
        }
        const range = (0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseRange)(d.version);
        for (const version of versions) {
            if ((0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.satisfies)((0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseVersion)(version).version, range)) {
                return { ok: true, versions };
            }
        }
        return { ok: false, versions };
    }
    /**
     * 检查指定mod是否满足指定mod集合作为前序mod的依赖关系
     *
     * check if the mod satisfies the dependencies of the specified mod set as the previous mod
     *
     * @param {ModInfo} mod - The mod to check for dependencies.
     * @param {ModOrderContainer[]} modCaches - An array of mod order containers.
     * @return {boolean} - Returns true if the mod satisfies its dependencies, false otherwise.
     */
    checkFor(mod, modCaches) {
        let isOk = true;
        if (mod.bootJson.dependenceInfo) {
            for (const d of mod.bootJson.dependenceInfo) {
                if (d.modName === 'GameVersion') {
                    // skip
                    continue;
                }
                const loaderCheck = this.checkLoaderDependency(d);
                if (loaderCheck !== null) {
                    if (!loaderCheck.ok) {
                        console.error('DependenceChecker.checkFor() not satisfies loader', [mod.bootJson.name, d, loaderCheck.versions]);
                        this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not satisfies loader: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find [${loaderCheck.versions.join(', ')}].`);
                        isOk = false;
                    }
                    continue;
                }
                const find = [];
                for (const modCache of modCaches) {
                    const fr = modCache.getModOrderItemByNameWithAlias(d.modName);
                    fr === null || fr === void 0 ? void 0 : fr.forEach(T => find.push(T));
                }
                if (find.length === 0) {
                    console.error('DependenceChecker.checkFor() not found mod before', [mod.bootJson.name, d]);
                    this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not found mod: mod[${mod.bootJson.name}] need mod[${d.modName}] but not find.`);
                    isOk = false;
                    continue;
                }
                for (const mod2 of find) {
                    if (!(0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.satisfies)((0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseVersion)(mod2.mod.bootJson.version).version, (0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseRange)(d.version))) {
                        console.error('DependenceChecker.checkFor() not satisfies', [mod.bootJson.name, d, mod2.mod.bootJson]);
                        this.log.error(`DependenceChecker.checkFor(${mod.bootJson.name}) not satisfies: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.mod.bootJson.version}] from[${mod2.from}].`);
                        isOk = false;
                    }
                }
            }
        }
        return true;
    }
    /**
     * 检查整个加载完毕的mod列表是否满足依赖约束
     *
     * Checks the dependencies of the mod order and verifies if they are satisfied.
     *
     * @return {boolean} - Returns true if all dependencies are satisfied, otherwise returns false.
     */
    check() {
        var _a;
        const modOrder = this.gSC2DataManager.getModLoader().getModCacheOneArray();
        const modCache = this.gSC2DataManager.getModLoader().getModCacheMapWithAlias();
        // // check data state valid
        // if (modCache.size !== modOrder.length) {
        //     // never go there
        //     console.error('DependenceChecker.check() modCache.size !== modOrder.length. never go there!!!', [modCache.size, modOrder.length]);
        //     this.log.error(`DependenceChecker.check() modCache.size !== modOrder.length. never go there!!!: modCache.size[${modCache.size}] !== modOrder.length[${modOrder.length}].`);
        // }
        // if (!isEqual(Array.from(modCache.keys()).sort(), clone(modOrder).sort())) {
        //     // never go there
        //     console.error('DependenceChecker.check() modCache.keys() !== modOrder. never go there!!!', [Array.from(modCache.keys()).sort(), clone(modOrder).sort()]);
        //     this.log.error(`DependenceChecker.check() modCache.keys() !== modOrder. never go there!!!.`);
        // }
        let allOk = true;
        for (let i = 0; i !== modOrder.length; ++i) {
            const mod = modOrder[i].mod;
            if (!mod) {
                // never go there
                console.error('DependenceChecker.check() cannot find mod. never go there!!!', [modOrder[i]]);
                this.log.error(`DependenceChecker.check() cannot find mod. never go there!!!: mod[${modOrder[i]}] not found.`);
                continue;
            }
            if (mod.bootJson.dependenceInfo) {
                for (const d of mod.bootJson.dependenceInfo) {
                    if (d.modName === 'GameVersion') {
                        // skip
                        continue;
                    }
                    const loaderCheck = this.checkLoaderDependency(d);
                    if (loaderCheck !== null) {
                        if (!loaderCheck.ok) {
                            console.error('DependenceChecker.check() not satisfies loader', [mod.bootJson.name, d, loaderCheck.versions]);
                            this.log.error(`DependenceChecker.check() not satisfies loader: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find [${loaderCheck.versions.join(', ')}].`);
                            allOk = false;
                            continue;
                        }
                        continue;
                    }
                    const mod2 = (_a = modCache.get(d.modName)) === null || _a === void 0 ? void 0 : _a.mod;
                    if (!mod2) {
                        console.error('DependenceChecker.check() not found mod', [mod.bootJson.name, d]);
                        this.log.error(`DependenceChecker.check() not found mod: mod[${mod.bootJson.name}] need mod[${d.modName}] but not find.`);
                        allOk = false;
                        continue;
                    }
                    if (!(0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.satisfies)((0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseVersion)(mod2.bootJson.version).version, (0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseRange)(d.version))) {
                        console.error('DependenceChecker.check() not satisfies', [mod.bootJson.name, d, mod2.bootJson]);
                        this.log.error(`DependenceChecker.check() not satisfies: mod[${mod.bootJson.name}] need mod[${d.modName}] version[${d.version}] but find version[${mod2.bootJson.version}].`);
                        allOk = false;
                        continue;
                    }
                    // check by order
                    const ii = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.findIndex)(modOrder, T => T.name === mod2.name || mod2.alias.includes(T.name));
                    if (!(ii >= 0)) {
                        // never go there
                        console.error('DependenceChecker.check() cannot find mod in modOrder. never go there.', [mod.bootJson.name, mod2.bootJson, modOrder, ii]);
                        this.log.error(`DependenceChecker.check() cannot find mod in modOrder: mod[${mod.bootJson.name}] need mod[${d.modName}] but mod[${d.modName}] not find in modOrder. never go there.`);
                        continue;
                    }
                    if (!(ii < i)) {
                        console.error('DependenceChecker.check() not satisfies order', [mod.bootJson.name, d, mod2.bootJson.name, mod2.bootJson, modOrder, ii, i]);
                        this.log.error(`DependenceChecker.check() not satisfies order: mod[${mod.bootJson.name}] need mod[${d.modName}] load before it.`);
                        allOk = false;
                        continue;
                    }
                }
            }
        }
        return allOk;
    }
    /**
     * this called by mod `CheckGameVersion`
     * because the game version only can get after game loaded
     * @param gameVersion
     */
    checkGameVersion(gameVersion) {
        const modArray = this.gSC2DataManager.getModLoader().getModCacheOneArray();
        let allOk = true;
        for (const mod of modArray) {
            if (mod.mod.bootJson.dependenceInfo) {
                const n = mod.mod.bootJson.dependenceInfo.find(T => T.modName === 'GameVersion');
                if (n) {
                    if (!(0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.satisfies)((0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseVersion)(gameVersion).version, (0,_SemVer_InfiniteSemVer__WEBPACK_IMPORTED_MODULE_0__.parseRange)(n.version), true)) {
                        console.error('DependenceChecker.checkGameVersion() not satisfies', [mod.mod.bootJson.name, n.version, gameVersion]);
                        this.log.error(`DependenceChecker.checkGameVersion() not satisfies: mod[${mod.mod.bootJson.name}] need gameVersion[${n.version}] but gameVersion is [${gameVersion}].`);
                        allOk = false;
                    }
                    else {
                        console.log('DependenceChecker.checkGameVersion() satisfies', [mod.mod.bootJson.name, n.version, gameVersion]);
                        this.log.log(`DependenceChecker.checkGameVersion() satisfies: mod[${mod.mod.bootJson.name}] need gameVersion[${n.version}] and gameVersion satisfies [${gameVersion}].`);
                    }
                }
            }
        }
        return allOk;
    }
}

