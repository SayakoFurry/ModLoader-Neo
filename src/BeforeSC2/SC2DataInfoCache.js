__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CacheRecord: () => (/* binding */ CacheRecord),
/* harmony export */   SC2DataInfo: () => (/* binding */ SC2DataInfo),
/* harmony export */   SC2DataInfoCache: () => (/* binding */ SC2DataInfoCache)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);

class CacheRecord {
    constructor(log, dataSource, cacheRecordName, needBuildNoPathCache = false) {
        this.log = log;
        this.dataSource = dataSource;
        this.cacheRecordName = cacheRecordName;
        this.needBuildNoPathCache = needBuildNoPathCache;
        this.noPathCache = new Map();
        this.items = [];
        this.map = new Map();
        this.noName = [];
    }
    getNoPathNameFromString(s) {
        // get file name `error.js` from `game\\00-framework-tools\\01-error\\error.js` like string
        const path = s.split(/(\\|\/)/g);
        if (path.length < 2) {
            return s;
        }
        return path[path.length - 1];
    }
    buildNoPathCache() {
        if (!this.needBuildNoPathCache) {
            this.noPathCache = undefined;
            return;
        }
        this.noPathCache = new Map();
        for (const k of this.map.keys()) {
            const kk = this.getNoPathNameFromString(k);
            if (!this.noPathCache.has(kk)) {
                this.noPathCache.set(kk, [k]);
            }
            else {
                this.noPathCache.get(kk).push(k);
            }
        }
        // check noPathCache no duplicate
        for (const [k, v] of this.noPathCache) {
            if (v.length > 1) {
                console.warn('CacheRecord.buildNoPathCache() has duplicate name:', k, v);
                this.log.warn(`CacheRecord.buildNoPathCache() has duplicate name: [${k}] [${v.join('], [')}]`);
            }
        }
    }
    destroy() {
        var _a;
        this.items = [];
        this.map.clear();
        (_a = this.noPathCache) === null || _a === void 0 ? void 0 : _a.clear();
        this.noPathCache = undefined;
        this.noName = [];
        this.dataSource = '';
        this.cacheRecordName = '';
    }
    clean() {
        this.items = [];
        this.map.clear();
        this.noName = [];
        this.dataSource = '';
        this.cacheRecordName = '';
        this.buildNoPathCache();
    }
    fillMap() {
        this.map.clear();
        this.noName = [];
        for (const item of this.items) {
            if (item.name) {
                if (this.map.has(item.name)) {
                    console.warn('CacheRecord.fillMap() has duplicate name:', [item.name], [this.cacheRecordName, this.dataSource]);
                    this.log.warn(`CacheRecord.fillMap() has duplicate name: [${item.name}] [${this.cacheRecordName} ${this.dataSource}]`);
                }
                this.map.set(item.name, item);
            }
            else {
                this.noName.push(item);
            }
        }
        this.buildNoPathCache();
    }
    back2Array() {
        this.items = Array.from(this.map.values()).concat(this.noName);
    }
    replaceMerge(c, noWarnning = false) {
        // console.log('CacheRecord.replaceMerge() start this.items', this.items.length);
        // console.log('CacheRecord.replaceMerge() start this.map.size', this.map.size);
        for (const item of c.items) {
            if (this.map.has(item.name)) {
                if (!noWarnning) {
                    console.warn('CacheRecord.replaceMerge() has duplicate name:', [this.cacheRecordName, this.dataSource], [c.cacheRecordName, c.dataSource], this.map, c.items, [item.name, item.content]);
                    this.log.warn(`CacheRecord.replaceMerge() has duplicate name: ` +
                        `[${this.cacheRecordName} ${this.dataSource}] [${c.cacheRecordName} ${c.dataSource}] ${item.name}`);
                }
            }
            this.map.set(item.name, item);
        }
        this.noName = this.noName.concat(c.noName);
        this.items = Array.from(this.map.values()).concat(this.noName);
        // console.log('CacheRecord.replaceMerge() end this.items', this.items.length);
        // console.log('CacheRecord.replaceMerge() end this.map.size', this.map.size);
        this.buildNoPathCache();
    }
    concatMerge(c) {
        for (const item of c.items) {
            if (this.map.has(item.name)) {
                const n = this.map.get(item.name);
                n.content = n.content + '\n' + item.content;
            }
            else {
                this.map.set(item.name, item);
            }
        }
        this.noName = this.noName.concat(c.noName);
        this.items = Array.from(this.map.values()).concat(this.noName);
        this.buildNoPathCache();
    }
    getByNameWithNoPath(s) {
        var _a, _b;
        const orgS = (_b = (_a = this.noPathCache) === null || _a === void 0 ? void 0 : _a.get(s)) !== null && _b !== void 0 ? _b : [s];
        return this.map.get(orgS[0]);
    }
    getByNameWithOrWithoutPath(s) {
        var _a, _b;
        const o = this.map.get(s);
        if (o) {
            return o;
        }
        const orgS = (_b = (_a = this.noPathCache) === null || _a === void 0 ? void 0 : _a.get(s)) !== null && _b !== void 0 ? _b : [s];
        return this.map.get(orgS[0]);
    }
}
class SC2DataInfo {
    constructor(log, 
    // 'orgin' OR modName
    dataSource) {
        this.log = log;
        this.dataSource = dataSource;
        // init on there for fix babel https://github.com/babel/babel/issues/13779
        this.styleFileItems = new CacheRecord(this.log, this.dataSource, 'styleFileItems');
        this.scriptFileItems = new CacheRecord(this.log, this.dataSource, 'scriptFileItems', true);
        this.passageDataItems = new CacheRecord(this.log, this.dataSource, 'passageDataItems');
    }
    clean() {
        this.scriptFileItems.clean();
    }
    destroy() {
        this.styleFileItems.destroy();
        this.scriptFileItems.destroy();
        this.passageDataItems.destroy();
    }
}
class SC2DataInfoCache extends SC2DataInfo {
    cloneSC2DataInfo() {
        const r = new SC2DataInfo(this.log, this.dataSource);
        r.styleFileItems = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.cloneDeep)(this.styleFileItems);
        r.scriptFileItems = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.cloneDeep)(this.scriptFileItems);
        r.passageDataItems = (0,lodash__WEBPACK_IMPORTED_MODULE_0__.cloneDeep)(this.passageDataItems);
        return r;
    }
    destroy() {
        super.destroy();
    }
    constructor(log, dataSource, scriptNode, styleNode, passageDataNodes) {
        var _a;
        super(log, dataSource);
        this.log = log;
        this.dataSource = dataSource;
        this.scriptNode = scriptNode;
        this.styleNode = styleNode;
        this.passageDataNodes = passageDataNodes;
        for (const sn of styleNode) {
            // /* twine-user-stylesheet #1: "error.css" */
            const syl = sn.innerText.split(/(\/\* twine-user-stylesheet #)(\d+): "([^'"]+)" \*\//);
            // will get : ["xxxxx", "/* twine-user-stylesheet #", "1", "error.css", "xxxxx"]
            for (let i = 0; i < syl.length;) {
                if (syl[i] === "/* twine-user-stylesheet #") {
                    this.styleFileItems.items.push({
                        id: (0,lodash__WEBPACK_IMPORTED_MODULE_0__.parseInt)(syl[++i]),
                        name: syl[++i],
                        content: syl[++i], // i+3
                    });
                }
                ++i;
            }
        }
        this.styleFileItems.fillMap();
        for (const sn of scriptNode) {
            // /* twine-user-script #1: "namespace.js" */
            const scl = sn.innerText.split(/(\/\* twine-user-script #)(\d+): "([^'"]+)" \*\//);
            // will get : ["xxxxx", "/* twine-user-script #", "1", "namespace.js", "xxxxx"]
            for (let i = 0; i < scl.length;) {
                if (scl[i] === "/* twine-user-script #") {
                    this.scriptFileItems.items.push({
                        id: (0,lodash__WEBPACK_IMPORTED_MODULE_0__.parseInt)(scl[++i]),
                        name: scl[++i],
                        content: scl[++i], // i+3
                    });
                }
                ++i;
            }
            // console.log('this.scriptFileItems.items sn.innerText', scl, [sn.innerText], this.scriptFileItems.items.length)
        }
        // console.log('this.scriptFileItems.items', this.scriptFileItems.items.length);
        this.scriptFileItems.fillMap();
        for (const passageDataNode of passageDataNodes) {
            // <tw-passagedata pid="1" name="Upgrade Waiting Room" tags="widget" position="100,100" size="100,100">xxxxx</tw-passagedata>
            this.passageDataItems.items.push({
                id: (0,lodash__WEBPACK_IMPORTED_MODULE_0__.parseInt)(passageDataNode.getAttribute('pid') || '0'),
                name: passageDataNode.getAttribute('name') || '',
                tags: ((_a = passageDataNode.getAttribute('tags')) === null || _a === void 0 ? void 0 : _a.split(' ')) || [],
                content: passageDataNode.innerText || '',
                position: passageDataNode.getAttribute('position') || '',
                size: passageDataNode.getAttribute('size') || '',
            });
        }
        this.passageDataItems.fillMap();
    }
}

