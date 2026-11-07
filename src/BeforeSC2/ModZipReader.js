__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Base64ZipStringLoader: () => (/* binding */ Base64ZipStringLoader),
/* harmony export */   IndexDBLoader: () => (/* binding */ IndexDBLoader),
/* harmony export */   LazyLoader: () => (/* binding */ LazyLoader),
/* harmony export */   LoaderBase: () => (/* binding */ LoaderBase),
/* harmony export */   LoaderKeyConfig: () => (/* binding */ LoaderKeyConfig),
/* harmony export */   LocalLoader: () => (/* binding */ LocalLoader),
/* harmony export */   LocalStorageLoader: () => (/* binding */ LocalStorageLoader),
/* harmony export */   ModZipReader: () => (/* binding */ ModZipReader),
/* harmony export */   ModZipReaderHash: () => (/* binding */ ModZipReaderHash),
/* harmony export */   RemoteLoader: () => (/* binding */ RemoteLoader),
/* harmony export */   Twee2Passage: () => (/* binding */ Twee2Passage),
/* harmony export */   Twee2Passage2: () => (/* binding */ Twee2Passage2),
/* harmony export */   blobToBase64: () => (/* binding */ blobToBase64),
/* harmony export */   getModZipReaderStaticClassRef: () => (/* binding */ getModZipReaderStaticClassRef),
/* harmony export */   getXxHash: () => (/* binding */ getXxHash),
/* harmony export */   imgWrapBase64Url: () => (/* binding */ imgWrapBase64Url)
/* harmony export */ });
/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! jszip */ "./node_modules/jszip/dist/jszip.min.js");
/* harmony import */ var jszip__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(jszip__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var idb_keyval__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! idb-keyval */ "./node_modules/idb-keyval/dist/index.js");
/* harmony import */ var _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./SC2DataInfoCache */ "./src/BeforeSC2/SC2DataInfoCache.ts");
/* harmony import */ var _ModLoader__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./ModLoader */ "./src/BeforeSC2/ModLoader.ts");
/* harmony import */ var _ModLoadController__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ModLoadController */ "./src/BeforeSC2/ModLoadController.ts");
/* harmony import */ var _extname__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./extname */ "./src/BeforeSC2/extname.ts");
/* harmony import */ var _ReplacePatcher__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./ReplacePatcher */ "./src/BeforeSC2/ReplacePatcher.ts");
/* harmony import */ var json5__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! json5 */ "./node_modules/json5/dist/index.js");
/* harmony import */ var json5__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(json5__WEBPACK_IMPORTED_MODULE_7__);
/* harmony import */ var xxhash_wasm__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! xxhash-wasm */ "./node_modules/xxhash-wasm/esm/xxhash-wasm.js");
/* harmony import */ var _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./ModPack/ModPackJsZipAdaptor */ "./src/BeforeSC2/ModPack/ModPackJsZipAdaptor.ts");











// import moment from "moment";
let xxHashApi;
async function getXxHash() {
    if (!xxHashApi) {
        xxHashApi = await (0,xxhash_wasm__WEBPACK_IMPORTED_MODULE_8__["default"])();
        console.log('xxHashApi', xxHashApi);
    }
    return xxHashApi;
}
function base64ToUint8Array(base64) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
function Twee2Passage2(s) {
    const tweeList = [];
    const lines = s.split(/\r?\n/);
    // let lastTwee: Twee2PassageR = {
    //     name: '',
    //     tags: [],
    //     content: '',
    // };
    let lastTwee = undefined;
    let lastStartLine = -1;
    for (let i = 0; i < lines.length; ++i) {
        const l = lines[i];
        if (l.startsWith(':: ')) {
            const r = l.split('[');
            const a = r[0];
            const name = a.slice(':: '.length);
            const nextTwee = {
                name: name.trim(),
                tags: [],
                content: '',
            };
            if (r.length < 2) {
                nextTwee.tags = [];
            }
            else {
                if (!r[1].includes(']')) {
                    // bad
                    continue;
                }
                const b = r[1].split(']')[0];
                nextTwee.tags = b.split(' ').map(T => T.trim());
            }
            if (lastTwee) {
                lastTwee.content = lines.slice(lastStartLine + 1, i + 1).join('\n');
                tweeList.push(lastTwee);
            }
            lastTwee = nextTwee;
            lastStartLine = i;
        }
    }
    if (lastTwee) {
        lastTwee.content = lines.slice(lastStartLine + 1).join('\n');
        tweeList.push(lastTwee);
    }
    return tweeList;
}
function Twee2Passage(s) {
    var _a;
    // match:
    //      :: Widgets Bodywriting Objects [widget]
    //      :: Widgets Bodywriting Objects
    //      :: Widgets Bodywriting Objects [widget asdasd]
    // special allow :
    //      :: Widgets Bodywriting Objects []
    // const r = s.split(/^(:: +((?:[^:"\\/\n\r\[\] ]+ *)+)(?: +\[((?:\w+ *)+)?\] *|))$/gm);
    // :: Widgets Bodywriting Objects [widget asdasd aaa©复活😊]
    // const r = s.split(/^(:: +((?:[^:"\/\n\r\[\] ]+ *)+)(?: *\[((?:[^ \]]+ *)+ *)\] *|))$/gm);
    // :: Widgets Bodywriting Objects []
    const r = s.split(/^(:: +((?:[^:"\/\n\r\[\] ]+ *)+)(?: *\[((?:[^ \]]+ *)* *)\] *|))$/gm);
    // console.log('Twee2Passage split ', r, [s]);
    // ['xxx', ':: Widgets Bodywriting Objects [widget]', 'Widgets Bodywriting Objects', 'widget', 'xxx']
    // ['xxx', ':: Widgets Bodywriting Objects [widget]', 'Widgets Bodywriting Objects', undefined, 'xxx']
    const rr = [];
    for (let i = 0; i < r.length; i++) {
        if (r[i].startsWith(':: ')) {
            rr.push({
                name: r[++i].trim(),
                tags: ((_a = r[++i]) === null || _a === void 0 ? void 0 : _a.split(' ')) || [],
                content: r[++i],
            });
        }
    }
    return rr;
}
function imgWrapBase64Url(fileName, base64) {
    let ext = (0,_extname__WEBPACK_IMPORTED_MODULE_5__.extname)(fileName);
    if (ext.startsWith('.')) {
        ext = ext.substring(1);
    }
    // console.log('imgWrapBase64Url', [fileName, ext, base64]);
    return `data:image/${ext};base64,${base64}`;
}
async function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // reader.result包含了base64数据URL，格式如: data:image/jpeg;base64,/9j/4AAQ...
            // 如果只需要base64字符串部分，可以用split(',')[1]获取
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}
class ModZipReaderHash {
    constructor(zipBase64String, hash) {
        if (hash) {
            this._hash = hash;
        }
        else {
            if (!zipBase64String) {
                // never go there
                console.error('[ModZipReaderHash] constructor zipBase64String is undefined if hash is undefined.');
                throw new Error('[ModZipReaderHash] constructor zipBase64String is undefined if hash is undefined.');
            }
            this._zipBase64String = zipBase64String;
        }
    }
    async digestMessage(message) {
        // const t1 = moment();
        // const r = (await getXxHash()).h64ToString(message);
        // const t2 = moment();
        // console.log('digestMessage', r, t2.diff(t1));
        // return r;
        return (await getXxHash()).h64ToString(message);
    }
    // https://github.com/jungomi/xxhash-wasm/blob/5923f26411ed763044bed17a1fec33fee74e47a0/src/xxhash.js#L148
    XxHashH64Bigint2String(h64) {
        return h64.toString(16).padStart(16, "0");
    }
    XxHashH32Number2String(h32) {
        return h32.toString(16).padStart(8, "0");
    }
    async init() {
        if (this._hash) {
            this._zipBase64String = undefined;
            return;
        }
        if (!this._zipBase64String) {
            // never go there
            console.error('[ModZipReaderHash] init() this._zipBase64String is undefined.');
            throw new Error('[ModZipReaderHash] init() this._zipBase64String is undefined.');
        }
        this._hash = await this.digestMessage(this._zipBase64String);
        this._zipBase64String = undefined;
    }
    compare(h) {
        return (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isEqual)(this._hash, h._hash);
    }
    compareWithString(h) {
        try {
            return (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isEqual)(this._hash, this.fromString(h));
        }
        catch (e) {
            return false;
        }
    }
    toString() {
        if (!this._hash) {
            // never go there
            console.error('[ModZipReaderHash] toString() this._hash is undefined.');
            throw new Error('[ModZipReaderHash] toString() this._hash is undefined.');
        }
        return this._hash;
    }
    fromString(hash) {
        return this._hash;
    }
}
const NEO_CACHE_SCHEMA = 1;
const NEO_CACHE_DB = 'ModLoaderNeoCache';
const NEO_CACHE_STORE = 'parsedModInfo';
let neoCacheStore = null;
let neoCacheDbPromise = null;
function openNeoCacheDatabase() {
    if (neoCacheDbPromise) {
        return neoCacheDbPromise;
    }
    neoCacheDbPromise = new Promise((resolve, reject) => {
        const open = (version) => {
            const request = version ? indexedDB.open(NEO_CACHE_DB, version) : indexedDB.open(NEO_CACHE_DB);
            request.onupgradeneeded = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(NEO_CACHE_STORE)) {
                    db.createObjectStore(NEO_CACHE_STORE);
                }
            };
            request.onerror = () => reject(request.error);
            request.onblocked = () => reject(new Error('cache database upgrade blocked'));
            request.onsuccess = () => {
                const db = request.result;
                if (!db.objectStoreNames.contains(NEO_CACHE_STORE)) {
                    const next = db.version + 1;
                    db.close();
                    open(next);
                    return;
                }
                resolve(db);
            };
        };
        try {
            open();
        }
        catch (e) {
            reject(e);
        }
    });
    return neoCacheDbPromise;
}
function getNeoCacheStore() {
    if (!neoCacheStore) {
        neoCacheStore = (txMode, callback) => openNeoCacheDatabase().then(db => callback(db.transaction(NEO_CACHE_STORE, txMode).objectStore(NEO_CACHE_STORE)));
    }
    return neoCacheStore;
}
function getNeoCacheVersionTag() {
    const mu = typeof window !== 'undefined' ? window.modUtils : undefined;
    const loader = mu ? `${mu.version || ''}/${mu.neoVersion || ''}` : 'unknown';
    return `v${NEO_CACHE_SCHEMA}|${loader}`;
}
function getNeoCacheKey(hash) {
    return `${getNeoCacheVersionTag()}|${hash}`;
}
async function loadNeoModInfoCache(hash) {
    try {
        const cached = await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.get)(getNeoCacheKey(hash), getNeoCacheStore());
        if (!cached || cached.schema !== NEO_CACHE_SCHEMA || cached.hash !== hash || !cached.bootJson || !cached.bootJson.name) {
            return null;
        }
        return cached;
    }
    catch (e) {
        console.warn('[NeoCache] read failed', e);
        return null;
    }
}
function saveNeoModInfoCache(hash, data) {
    try {
        return (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.set)(getNeoCacheKey(hash), { schema: NEO_CACHE_SCHEMA, hash, ...data }, getNeoCacheStore())
            .catch(e => console.warn('[NeoCache] write failed', e));
    }
    catch (e) {
        console.warn('[NeoCache] write failed', e);
        return Promise.resolve();
    }
}
if (typeof window !== 'undefined') {
    window.modLoaderNeoCache = {
        clear: async function () {
            try {
                await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.clear)(getNeoCacheStore());
                console.log('[NeoCache] cleared');
                return true;
            }
            catch (e) {
                console.error('[NeoCache] clear failed', e);
                return false;
            }
        },
        get versionTag() {
            return getNeoCacheVersionTag();
        },
    };
}
class ModZipReader {
    get zip() {
        var _a, _b;
        if (!this._zip) {
            console.error('ModZipReader zip was released.', [this.modInfo, this]);
            this.log.error(`ModZipReader zip was released. [${(_a = this.modInfo) === null || _a === void 0 ? void 0 : _a.name}]`);
            throw new Error(`ModZipReader zip was released. [${(_b = this.modInfo) === null || _b === void 0 ? void 0 : _b.name}]`);
        }
        return this._zip;
    }
    constructor(zip, zipBase64String, loaderBase, modLoadControllerCallback) {
        this.loaderBase = loaderBase;
        this.modLoadControllerCallback = modLoadControllerCallback;
        this.log = (0,_ModLoadController__WEBPACK_IMPORTED_MODULE_4__.getLogFromModLoadControllerCallback)(modLoadControllerCallback);
        if (typeof FinalizationRegistry === 'undefined') {
            this.gcFinalizationRegistry = new FinalizationRegistryMock(() => {
                // never be call
            });
            this._zipIsExist = null;
            console.warn('ModZipReader FinalizationRegistry is not support.');
        }
        else {
            this.gcFinalizationRegistry = new FinalizationRegistry(() => {
                console.log('ModZipReader zip was released.', [this.modInfo, this]);
                this._zipIsExist = true;
            });
            this._zipIsExist = false;
            // console.warn('ModZipReader FinalizationRegistry is support.');
        }
        // this._zipWeakRef = new WeakRef(zip);
        this._zip = zip;
        this.modZipReaderHash = new ModZipReaderHash(zipBase64String, zip.hashString);
        this.gcFinalizationRegistry.register(this._zip, undefined, this);
    }
    get isModPack() {
        return this.zip.is_JeremieModLoader_ModPack === true;
    }
    get isJsZip() {
        return this.zip.is_JeremieModLoader_ModPack === undefined;
    }
    getModInfo() {
        return this.modInfo;
    }
    getZipFile() {
        return this._zip;
    }
    /**
     * use this to release zip object ref, try to remove the object from memory.
     */
    gcReleaseZip() {
        var _a, _b;
        console.log(`ModLoader ====== ModZipReader gcReleaseZip [${(_a = this.modInfo) === null || _a === void 0 ? void 0 : _a.name}]`);
        this.log.log(`ModLoader ====== ModZipReader gcReleaseZip [${(_b = this.modInfo) === null || _b === void 0 ? void 0 : _b.name}]`);
        this._zip = undefined;
    }
    /**
     * use this to debug check if the zip object is really released.
     * @return [isRefExist(true), isWeakRefExist(false), isWeakRefCleanBeCall(true/(null if not support))]
     *       only when the return is [true, false, true] the zip object is really released.
     */
    gcCheckReleased() {
        return [
            !!this._zip,
            // !!this._zipWeakRef.deref(),
            this._zipIsExist,
        ];
    }
    gcIsReleased() {
        return !this._zip;
    }
    static validateBootJson(bootJ, log) {
        let c = bootJ
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'name'))
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'name').length > 0
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'version'))
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'version').length > 0
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'styleFileList'))
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'styleFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString)
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList'))
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString)
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'tweeFileList'))
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'tweeFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString)
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'imgFileList'))
            && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'imgFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString);
        // optional
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'nickName')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'nickName')) || ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isPlainObject)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'nickName'))));
        }
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'alias')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'alias')) && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'alias'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString));
        }
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'dependenceInfo')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'dependenceInfo')) && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'dependenceInfo'), _ModLoader__WEBPACK_IMPORTED_MODULE_3__.checkDependenceInfo));
        }
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'addonPlugin')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'addonPlugin')) && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'addonPlugin'), _ModLoader__WEBPACK_IMPORTED_MODULE_3__.checkModBootJsonAddonPlugin));
        }
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'replacePatchList')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'replacePatchList')) && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'replacePatchList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString));
        }
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_preload')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_preload')) && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_preload'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString));
        }
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_earlyload')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_earlyload')) && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_earlyload'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString));
        }
        if (c && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_inject_early')) {
            c = c && ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_inject_early')) && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_inject_early'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString));
        }
        if (!c && log) {
            log.error('validateBootJson(bootJ) failed. ' + JSON.stringify([
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'name')),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'name').length > 0,
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'version')),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'version').length > 0,
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'styleFileList')),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'styleFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList')),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'tweeFileList')),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'tweeFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'imgFileList')),
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'imgFileList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString),
                // 'nickName',
                // has(bootJ, 'nickName') ? isString(get(bootJ, 'nickName')) : true,
                'alias',
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'alias') &&
                    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'alias')) ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'alias'), _ModLoader__WEBPACK_IMPORTED_MODULE_3__.checkDependenceInfo) : true,
                'dependenceInfo',
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'dependenceInfo') &&
                    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'dependenceInfo')) ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'dependenceInfo'), _ModLoader__WEBPACK_IMPORTED_MODULE_3__.checkDependenceInfo) : true,
                'addonPlugin',
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'addonPlugin') &&
                    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'addonPlugin')) ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'addonPlugin'), _ModLoader__WEBPACK_IMPORTED_MODULE_3__.checkModBootJsonAddonPlugin) : true,
                'replacePatchList',
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'replacePatchList') &&
                    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'replacePatchList')) ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'replacePatchList'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString) : true,
                'scriptFileList_preload',
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_preload') &&
                    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_preload')) ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_preload'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString) : true,
                'scriptFileList_earlyload',
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_earlyload') &&
                    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_earlyload')) ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_earlyload'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString) : true,
                'scriptFileList_inject_early',
                (0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_inject_early') &&
                    (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_inject_early')) ? (0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)((0,lodash__WEBPACK_IMPORTED_MODULE_1__.get)(bootJ, 'scriptFileList_inject_early'), lodash__WEBPACK_IMPORTED_MODULE_1__.isString) : true,
            ]));
        }
        return c;
    }
    // replaceImgWithBase64String(s: string) {
    //     this.modInfo?.imgs.forEach(T => {
    //         s = s.replace(T.path, T.data);
    //     });
    // }
    restoreNeoCache(cached) {
        try {
            const bootJ = cached.bootJson;
            this.modInfo = {
                name: bootJ.name,
                nickName: bootJ.nickName || undefined,
                alias: bootJ.alias !== null && bootJ.alias !== void 0 ? bootJ.alias : [],
                version: bootJ.version,
                cache: new _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_2__.SC2DataInfo(this.log, bootJ.name),
                imgs: [],
                imgFileReplaceList: [],
                scriptFileList_preload: cached.scriptFileList_preload || [],
                scriptFileList_earlyload: cached.scriptFileList_earlyload || [],
                scriptFileList_inject_early: cached.scriptFileList_inject_early || [],
                replacePatcher: [],
                bootJson: bootJ,
                modRef: undefined,
            };
            const imgPaths = cached.imgPaths || (bootJ.imgFileList || []);
            for (const imgPath of imgPaths) {
                this.modInfo.imgs.push({
                    getter: new _ModLoader__WEBPACK_IMPORTED_MODULE_3__.ModImgGetterDefault(bootJ.name, this, imgPath, this.log),
                    path: imgPath,
                });
            }
            for (const rp of cached.replacePatcher || []) {
                this.modInfo.replacePatcher.push(new _ReplacePatcher__WEBPACK_IMPORTED_MODULE_6__.ReplacePatcher(this.log, bootJ.name, rp.path, rp.data));
            }
            const cache = this.modInfo.cache;
            cache.styleFileItems.items = cached.styleItems || [];
            cache.styleFileItems.fillMap();
            cache.passageDataItems.items = cached.passageItems || [];
            cache.passageDataItems.fillMap();
            cache.scriptFileItems.items = cached.scriptItems || [];
            cache.scriptFileItems.fillMap();
            this.loaderBase.addZipFile(bootJ.name, this);
            if (typeof window !== 'undefined') {
                window.__neoCacheHitCount = (window.__neoCacheHitCount || 0) + 1;
            }
            return true;
        }
        catch (e) {
            console.warn('[NeoCache] restore failed', e);
            this.modInfo = undefined;
            return false;
        }
    }
    async saveNeoCache(hash) {
        if (!this.modInfo || !this.modInfo.bootJson || !this.modInfo.cache) {
            return;
        }
        try {
            const data = {
                bootJson: this.modInfo.bootJson,
                imgPaths: (this.modInfo.imgs || []).map(T => T.path),
                scriptFileList_preload: this.modInfo.scriptFileList_preload || [],
                scriptFileList_earlyload: this.modInfo.scriptFileList_earlyload || [],
                scriptFileList_inject_early: this.modInfo.scriptFileList_inject_early || [],
                replacePatcher: (this.modInfo.replacePatcher || []).map(T => ({ path: T.patchFileName, data: T.patchInfo_ })),
                styleItems: this.modInfo.cache.styleFileItems.items || [],
                passageItems: this.modInfo.cache.passageDataItems.items || [],
                scriptItems: this.modInfo.cache.scriptFileItems.items || [],
            };
            await saveNeoModInfoCache(hash, data);
            if (typeof window !== 'undefined') {
                window.__neoCacheWriteCount = (window.__neoCacheWriteCount || 0) + 1;
            }
        }
        catch (e) {
            console.warn('[NeoCache] snapshot failed', e);
        }
    }
    async init() {
        var _a;
        await this.modZipReaderHash.init();
        const neoHash = this.modZipReaderHash.toString();
        const cached = await loadNeoModInfoCache(neoHash);
        if (cached && this.restoreNeoCache(cached)) {
            console.log('[NeoCache] hit', cached.bootJson.name);
            this.log.log(`[NeoCache] hit: [${cached.bootJson.name}]`);
            return true;
        }
        const bootJsonFile = this.zip.file(ModZipReader.modBootFilePath);
        if (!bootJsonFile) {
            console.log('ModLoader ====== ModZipReader init() cannot find :', ModZipReader.modBootFilePath);
            return false;
        }
        const bootJson = await bootJsonFile.async('string');
        const bootJ = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(bootJson);
        // console.log('ModZipReader init() bootJ', bootJ);
        // console.log('ModZipReader init() bootJ', this.validateBootJson(bootJ));
        // console.log('ModZipReader init() bootJ', [
        //     bootJ
        //     , isString(get(bootJ, 'name'))
        //     , get(bootJ, 'name').length > 0
        //     , isString(get(bootJ, 'version'))
        //     , get(bootJ, 'version').length > 0
        //     , isArray(get(bootJ, 'styleFileList'))
        //     , every(get(bootJ, 'styleFileList'), isString)
        //     , isArray(get(bootJ, 'scriptFileList'))
        //     , every(get(bootJ, 'scriptFileList'), isString)
        //     , isArray(get(bootJ, 'tweeFileList'))
        //     , every(get(bootJ, 'tweeFileList'), isString)
        //     , isArray(get(bootJ, 'imgFileList'))
        //     , every(get(bootJ, 'imgFileList'), isString)
        //     , isArray(get(bootJ, 'imgFileReplaceList'))
        //     , every(get(bootJ, 'imgFileReplaceList'), T => isArray(T) && T.length === 2 && isString(T[0]) && isString(T[1]))
        // ]);
        if (ModZipReader.validateBootJson(bootJ, this.log)) {
            this.modInfo = {
                name: bootJ.name,
                nickName: bootJ.nickName || undefined,
                alias: (_a = bootJ.alias) !== null && _a !== void 0 ? _a : [],
                version: bootJ.version,
                cache: new _SC2DataInfoCache__WEBPACK_IMPORTED_MODULE_2__.SC2DataInfo(this.log, bootJ.name),
                imgs: [],
                imgFileReplaceList: [],
                scriptFileList_preload: [],
                scriptFileList_earlyload: [],
                scriptFileList_inject_early: [],
                replacePatcher: [],
                bootJson: bootJ,
                modRef: undefined,
            };
            this.loaderBase.addZipFile(bootJ.name, this);
            // console.log('ModLoader ====== ModZipReader init() modInfo', this.modInfo);
            // load file
            // for (const imgRPath of bootJ.imgFileReplaceList) {
            //     const imgFile = this.zip.file(imgRPath[1]);
            //     if (imgFile) {
            //         const data = await imgFile.async('string');
            //         this.modInfo.imgFileReplaceList.push([
            //             imgRPath[0],
            //             data,
            //         ]);
            //     } else {
            //         console.warn('cannot get imgFileReplaceList file from mod zip:', [this.modInfo.name, imgFile])
            //     }
            // }
            for (const replacePatchPath of bootJ.replacePatchList || []) {
                const replacePatchFile = this.zip.file(replacePatchPath);
                if (replacePatchFile) {
                    const data = await replacePatchFile.async('string');
                    try {
                        const d = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(data);
                        if ((0,_ReplacePatcher__WEBPACK_IMPORTED_MODULE_6__.checkPatchInfo)(d)) {
                            this.modInfo.replacePatcher.push(new _ReplacePatcher__WEBPACK_IMPORTED_MODULE_6__.ReplacePatcher(this.log, this.modInfo.name, replacePatchPath, d));
                        }
                        else {
                            console.error('ModLoader ====== ModZipReader init() replacePatchFile Invalid:', [this.modInfo.name, replacePatchPath]);
                            this.log.error(`ModLoader ====== ModZipReader init() replacePatchFile Invalid: [${this.modInfo.name}] [${replacePatchPath}]`);
                        }
                    }
                    catch (e) {
                        console.error('ModLoader ====== ModZipReader init() replacePatchFile Invalid:', [this.modInfo.name, replacePatchPath]);
                        this.log.error(`ModLoader ====== ModZipReader init() replacePatchFile Invalid: [${this.modInfo.name}] [${replacePatchPath}]`);
                    }
                }
                else {
                    console.warn('cannot get replacePatchFile file from mod zip:', [this.modInfo.name, replacePatchFile]);
                    this.log.warn(`cannot get replacePatchFile file from mod zip: [${this.modInfo.name}] [${replacePatchFile}]`);
                }
            }
            for (const imgPath of bootJ.imgFileList || []) {
                const imgFile = this.zip.file(imgPath);
                if (imgFile) {
                    this.modInfo.imgs.push({
                        // data: imgWrapBase64Url(imgPath, data),
                        getter: new _ModLoader__WEBPACK_IMPORTED_MODULE_3__.ModImgGetterDefault(bootJ.name, this, imgPath, this.log),
                        path: imgPath,
                    });
                }
                else {
                    console.error('cannot get imgFileList file from mod zip:', [this.modInfo.name, imgPath]);
                    this.log.error(`cannot get imgFileList file from mod zip: [${this.modInfo.name}] [${imgPath}]`);
                }
            }
            await this.constructModInfoCache(bootJ, false);
            // optional
            if ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_preload')) {
                for (const scPath of bootJ.scriptFileList_preload) {
                    const scFile = this.zip.file(scPath);
                    if (scFile) {
                        const data = await scFile.async('string');
                        this.modInfo.scriptFileList_preload.push([scPath, data]);
                    }
                    else {
                        console.warn('cannot get scriptFileList_preload file from mod zip:', [this.modInfo.name, scPath]);
                        this.log.warn(`cannot get scriptFileList_preload file from mod zip: [${this.modInfo.name}] [${scPath}]`);
                    }
                }
            }
            if ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_earlyload')) {
                for (const scPath of bootJ.scriptFileList_earlyload) {
                    const scFile = this.zip.file(scPath);
                    if (scFile) {
                        const data = await scFile.async('string');
                        this.modInfo.scriptFileList_earlyload.push([scPath, data]);
                    }
                    else {
                        console.warn('cannot get scriptFileList_earlyload file from mod zip:', [this.modInfo.name, scPath]);
                        this.log.warn(`cannot get scriptFileList_earlyload file from mod zip: [${this.modInfo.name}] [${scPath}]`);
                    }
                }
            }
            if ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.has)(bootJ, 'scriptFileList_inject_early')) {
                for (const scPath of bootJ.scriptFileList_inject_early) {
                    const scFile = this.zip.file(scPath);
                    if (scFile) {
                        const data = await scFile.async('string');
                        this.modInfo.scriptFileList_inject_early.push([scPath, data]);
                    }
                    else {
                        console.warn('cannot get scriptFileList_earlyload file from mod zip:', [this.modInfo.name, scPath]);
                        this.log.warn(`cannot get scriptFileList_earlyload file from mod zip: [${this.modInfo.name}] [${scPath}]`);
                    }
                }
            }
            console.log('ModLoader ====== ModZipReader init() modInfo', this.modInfo, this.modZipReaderHash._hash);
            this.log.log(`ModLoader ====== ModZipReader init() modInfo: [${this.modInfo.name}] [${this.modInfo.version}]`);
            this.saveNeoCache(neoHash);
            return true;
        }
        return false;
    }
    async refillCacheStyleFileItems(styleFileList, keepOld) {
        if (!this.modInfo) {
            console.error('ModLoader ====== ModZipReader refillCacheStyleFileItems() (!this.modInfo).', [this.modInfo]);
            this.log.error(`ModLoader ====== ModZipReader refillCacheStyleFileItems() (!this.modInfo).`);
            return;
        }
        if (!keepOld) {
            this.modInfo.cache.styleFileItems.items = [];
        }
        for (const stylePath of styleFileList || []) {
            const styleFile = this.zip.file(stylePath);
            if (styleFile) {
                const data = await styleFile.async('string');
                // this.replaceImgWithBase64String(data);
                this.modInfo.cache.styleFileItems.items.push({
                    name: stylePath,
                    content: data,
                    id: 0,
                });
            }
            else {
                console.warn('cannot get styleFileList file from mod zip:', [this.modInfo.name, stylePath]);
                this.log.warn(`cannot get styleFileList file from mod zip: [${this.modInfo.name}] [${stylePath}]`);
            }
        }
        this.modInfo.cache.styleFileItems.fillMap();
    }
    async refillCachePassageDataItems(tweeFileList, keepOld) {
        if (!this.modInfo) {
            console.error('ModLoader ====== ModZipReader refillCachePassageDataItems() (!this.modInfo).', [this.modInfo]);
            this.log.error(`ModLoader ====== ModZipReader refillCachePassageDataItems() (!this.modInfo).`);
            return;
        }
        if (!keepOld) {
            this.modInfo.cache.passageDataItems.items = [];
        }
        for (const tweePath of tweeFileList || []) {
            const imgFile = this.zip.file(tweePath);
            if (imgFile) {
                const data = await imgFile.async('string');
                const tp = Twee2Passage(data);
                // console.log('Twee2Passage', tp, [data]);
                for (const p of tp) {
                    // this.replaceImgWithBase64String(p.contect);
                    this.modInfo.cache.passageDataItems.items.push({
                        name: p.name,
                        content: p.content,
                        id: 0,
                        tags: p.tags,
                    });
                }
                // {
                //     // <<widget "variablesStart2">>
                //     const isWidget = /<<widget\W+"([^ "]+)"\W*>>/.test(data);
                //     this.replaceImgWithBase64String(data);
                //     this.modInfo.cache.passageDataItems.items.push({
                //         name: tweePath,
                //         content: data,
                //         id: 0,
                //         tags: isWidget ? ['widget'] : [],
                //     });
                // }
            }
            else {
                console.error('cannot get tweeFileList file from mod zip:', [this.modInfo.name, tweePath]);
                this.log.error(`cannot get tweeFileList file from mod zip: [${this.modInfo.name}] [${tweePath}]`);
            }
        }
        this.modInfo.cache.passageDataItems.fillMap();
    }
    async refillCacheScriptFileItems(scriptFileList, keepOld) {
        if (!this.modInfo) {
            console.error('ModLoader ====== ModZipReader refillCacheScriptFileItems() (!this.modInfo).', [this.modInfo]);
            this.log.error(`ModLoader ====== ModZipReader refillCacheScriptFileItems() (!this.modInfo).`);
            return;
        }
        if (!keepOld) {
            this.modInfo.cache.scriptFileItems.items = [];
        }
        for (const scPath of scriptFileList || []) {
            const scFile = this.zip.file(scPath);
            if (scFile) {
                const data = await scFile.async('string');
                // this.replaceImgWithBase64String(data);
                this.modInfo.cache.scriptFileItems.items.push({
                    name: scPath,
                    content: data,
                    id: 0,
                });
            }
            else {
                console.error('cannot get scriptFileList file from mod zip:', [this.modInfo.name, scPath]);
                this.log.error(`cannot get scriptFileList file from mod zip: [${this.modInfo.name}] [${scPath}]`);
            }
        }
        this.modInfo.cache.scriptFileItems.fillMap();
    }
    async constructModInfoCache(bootJ, keepOld) {
        if (!this.modInfo) {
            console.error('ModLoader ====== ModZipReader constructModeInfoCache() (!this.modInfo).', [this.modInfo]);
            this.log.error(`ModLoader ====== ModZipReader constructModeInfoCache() (!this.modInfo).`);
            return;
        }
        await this.refillCacheStyleFileItems(bootJ.styleFileList, keepOld);
        await this.refillCachePassageDataItems(bootJ.tweeFileList, keepOld);
        await this.refillCacheScriptFileItems(bootJ.scriptFileList, keepOld);
    }
}
ModZipReader.modBootFilePath = 'boot.json';
class LoaderBase {
    constructor(log, loaderKeyConfig) {
        this.log = log;
        this.loaderKeyConfig = loaderKeyConfig;
        this.modList = [];
        this.modZipList = new Map();
        this.logger = {
            log: (s) => {
                this.log.logInfo(s);
            },
            warn: (s) => {
                this.log.logWarning(s);
            },
            error: (s) => {
                this.log.logError(s);
            },
        };
    }
    init() {
        // this is used for override
    }
    getZipFile(name) {
        return this.modZipList.get(name);
    }
    addZipFile(name, zip) {
        if (this.modZipList.has(name)) {
            console.warn('ModLoader ====== LoaderBase addZipFile() [warn!!!] duplicate mod name:', name);
            this.log.logWarning(`LoaderBase addZipFile() [warn!!!] duplicate mod name: [${name}]`);
            this.modZipList.get(name).push(zip);
            return;
        }
        this.modZipList.set(name, [zip]);
    }
    async load() {
        throw new Error('LoaderBase load() not implement');
    }
}
class LocalStorageLoader extends LoaderBase {
    init() {
        super.init();
        LocalStorageLoader.modDataLocalStorageZipList = this.loaderKeyConfig.getLoaderKey(LocalStorageLoader.modDataLocalStorageZipList, LocalStorageLoader.modDataLocalStorageZipList);
        LocalStorageLoader.modDataLocalStorageZipPrefix = this.loaderKeyConfig.getLoaderKey(LocalStorageLoader.modDataLocalStorageZipPrefix, LocalStorageLoader.modDataLocalStorageZipPrefix);
    }
    async load() {
        const listFile = localStorage.getItem(LocalStorageLoader.modDataLocalStorageZipList);
        if (!listFile) {
            return Promise.resolve(false);
        }
        let list;
        try {
            list = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(listFile);
        }
        catch (e) {
            console.error(e);
            return Promise.resolve(false);
        }
        if (!((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)(list) && list.every(lodash__WEBPACK_IMPORTED_MODULE_1__.isString))) {
            return Promise.resolve(false);
        }
        console.log('ModLoader ====== LocalStorageLoader load() list', list);
        // this.logger.log('ModLoader ====== LocalStorageLoader load() list');
        // modDataBase64ZipStringList: base64[]
        for (const zipPath of list) {
            const base64ZipString = localStorage.getItem(LocalStorageLoader.calcModNameKey(zipPath));
            if (!base64ZipString) {
                console.error('ModLoader ====== LocalStorageLoader load() cannot get zipPath:', zipPath);
                // this.logger.error(`ModLoader ====== LocalStorageLoader load() cannot get zipPath:[${zipPath}]`);
                continue;
            }
            try {
                const mpr = new _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__.ModPackFileReaderJsZipAdaptor();
                const modPack = await mpr.loadAsync(base64ZipString, { base64: true });
                if (modPack) {
                    const m = new ModZipReader(modPack, '', this, this.log);
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                }
                else {
                    const m = await jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(base64ZipString, { base64: true }).then(zip => {
                        return new ModZipReader(zip, base64ZipString, this, this.log);
                    });
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                }
            }
            catch (E) {
                console.error(E);
            }
        }
        return Promise.resolve(true);
    }
    static listMod() {
        const ls = localStorage.getItem(this.modDataLocalStorageZipList);
        if (!ls) {
            console.log('ModLoader ====== LocalStorageLoader listMod() cannot find modDataLocalStorageZipList');
            return undefined;
        }
        try {
            const l = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(ls);
            console.log('ModLoader ====== LocalStorageLoader listMod() modDataLocalStorageZipList', l);
            if (Array.isArray(l) && l.every(lodash__WEBPACK_IMPORTED_MODULE_1__.isString)) {
                return l;
            }
        }
        catch (e) {
            console.error(e);
        }
        console.log('ModLoader ====== LocalStorageLoader listMod() modDataLocalStorageZipList Invalid');
        return undefined;
    }
    static calcModNameKey(name) {
        return `${this.modDataLocalStorageZipPrefix}:${name}`;
    }
    static addMod(name, modBase64String) {
        let l = new Set(this.listMod() || []);
        const k = this.calcModNameKey(name);
        l.add(name);
        localStorage.setItem(k, modBase64String);
        localStorage.setItem(this.modDataLocalStorageZipList, JSON.stringify(Array.from(l)));
    }
    static removeMod(name) {
        let l = this.listMod() || [];
        l = l.filter(T => T !== name);
        const k = this.calcModNameKey(name);
        localStorage.setItem(this.modDataLocalStorageZipList, JSON.stringify(l));
        localStorage.removeItem(k);
    }
    // get bootJson from zip
    static async checkModZipFile(modBase64String) {
        try {
            const mpr = new _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__.ModPackFileReaderJsZipAdaptor();
            const modPack = await mpr.loadAsync(modBase64String, { base64: true });
            let zip;
            if (modPack) {
                zip = modPack;
            }
            else {
                zip = await jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(modBase64String, { base64: true });
            }
            const bootJsonFile = zip.file(ModZipReader.modBootFilePath);
            if (!bootJsonFile) {
                console.log('ModLoader ====== LocalStorageLoader checkModeZipFile() cannot find bootJsonFile:', ModZipReader.modBootFilePath);
                return `bootJsonFile ${ModZipReader.modBootFilePath} Invalid`;
            }
            const bootJson = await bootJsonFile.async('string');
            const bootJ = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(bootJson);
            if (ModZipReader.validateBootJson(bootJ)) {
                return bootJ;
            }
            return `bootJson Invalid`;
        }
        catch (E) {
            console.error('checkModZipFile', E);
            return Promise.reject(E);
        }
    }
    setConfigKey(modDataLocalStorageZipListKey, modDataLocalStorageZipPrefix) {
        LocalStorageLoader.modDataLocalStorageZipList = modDataLocalStorageZipListKey !== null && modDataLocalStorageZipListKey !== void 0 ? modDataLocalStorageZipListKey : LocalStorageLoader.modDataLocalStorageZipList;
        LocalStorageLoader.modDataLocalStorageZipPrefix = modDataLocalStorageZipPrefix !== null && modDataLocalStorageZipPrefix !== void 0 ? modDataLocalStorageZipPrefix : LocalStorageLoader.modDataLocalStorageZipPrefix;
    }
}
LocalStorageLoader.modDataLocalStorageZipList = 'modDataLocalStorageZipList';
LocalStorageLoader.modDataLocalStorageZipPrefix = 'modDataLocalStorageZip';
class IndexDBLoader extends LoaderBase {
    init() {
        super.init();
        IndexDBLoader.dbName = this.loaderKeyConfig.getLoaderKey(IndexDBLoader.dbName, IndexDBLoader.dbName);
        IndexDBLoader.storeName = this.loaderKeyConfig.getLoaderKey(IndexDBLoader.storeName, IndexDBLoader.storeName);
        IndexDBLoader.modDataIndexDBZipListHidden = this.loaderKeyConfig.getLoaderKey(IndexDBLoader.modDataIndexDBZipListHidden, IndexDBLoader.modDataIndexDBZipListHidden);
        IndexDBLoader.modDataIndexDBZipList = this.loaderKeyConfig.getLoaderKey(IndexDBLoader.modDataIndexDBZipList, IndexDBLoader.modDataIndexDBZipList);
        IndexDBLoader.modDataIndexDBZipPrefix = this.loaderKeyConfig.getLoaderKey(IndexDBLoader.modDataIndexDBZipPrefix, IndexDBLoader.modDataIndexDBZipPrefix);
        this.customStore = (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName);
    }
    constructor(modLoadControllerCallback, loaderKeyConfig) {
        super(modLoadControllerCallback, loaderKeyConfig);
        this.modLoadControllerCallback = modLoadControllerCallback;
        this.loaderKeyConfig = loaderKeyConfig;
    }
    async load() {
        const listFile = await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.get)(IndexDBLoader.modDataIndexDBZipList, this.customStore);
        if (!listFile) {
            return Promise.resolve(false);
        }
        let list;
        try {
            list = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(listFile);
        }
        catch (e) {
            console.error(e);
            return Promise.resolve(false);
        }
        if (!((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)(list) && list.every(lodash__WEBPACK_IMPORTED_MODULE_1__.isString))) {
            return Promise.resolve(false);
        }
        console.log('ModLoader ====== IndexDBLoader load() list', list);
        // modDataBase64ZipStringList: base64[]
        for (const zipPath of list) {
            const base64ZipString = await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.get)(IndexDBLoader.calcModNameKey(zipPath), this.customStore);
            if (!base64ZipString) {
                console.error('ModLoader ====== IndexDBLoader load() cannot get zipPath:', zipPath);
                continue;
            }
            try {
                const mpr = new _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__.ModPackFileReaderJsZipAdaptor();
                const modPack = await mpr.loadAsync(base64ZipString, { base64: true });
                if (modPack) {
                    const m = new ModZipReader(modPack, '', this, this.log);
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                }
                else {
                    const m = await jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(base64ZipString, { base64: true }).then(zip => {
                        return new ModZipReader(zip, base64ZipString, this, this.log);
                    });
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                }
            }
            catch (E) {
                console.error(E);
            }
        }
        return Promise.resolve(true);
    }
    /**
     * @param modeList must have same items as the list in listMod()
     */
    static async reorderModList(modeList) {
        const oldList = await IndexDBLoader.listMod();
        if (!oldList) {
            console.error('ModLoader ====== IndexDBLoader reorderModList() oldList Invalid');
            return;
        }
        if (oldList.length !== modeList.length) {
            console.error('ModLoader ====== IndexDBLoader reorderModList() oldList.length !== modeList.length');
            return;
        }
        if ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.uniq)(modeList).length !== modeList.length) {
            console.error('ModLoader ====== IndexDBLoader reorderModList() modeList has duplicate items. invalid');
            return;
        }
        if (!oldList.every((T, i) => modeList.includes(T))) {
            console.error('ModLoader ====== IndexDBLoader reorderModList() oldList !includes() modeList');
            return;
        }
        await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.set)(IndexDBLoader.modDataIndexDBZipList, JSON.stringify(modeList), (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName));
        console.log('ModLoader ====== IndexDBLoader reorderModList() done');
    }
    static async setModList(modeList) {
        if (!(0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)(modeList) || !(0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)(modeList, lodash__WEBPACK_IMPORTED_MODULE_1__.isString)) {
            console.error('ModLoader ====== IndexDBLoader setModList() modeList type invalid. invalid');
            return;
        }
        if ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.uniq)(modeList).length !== modeList.length) {
            console.error('ModLoader ====== IndexDBLoader setModList() modeList has duplicate items. invalid');
            return;
        }
        console.log('[ModLoader] IndexDBLoader setModList() modDataIndexDBZipList', IndexDBLoader.modDataIndexDBZipList);
        console.log('[ModLoader] IndexDBLoader setModList() dbName', IndexDBLoader.dbName);
        console.log('[ModLoader] IndexDBLoader setModList() storeName', IndexDBLoader.storeName);
        await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.set)(IndexDBLoader.modDataIndexDBZipList, JSON.stringify(modeList), (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName));
        console.log('ModLoader ====== IndexDBLoader setModList() done');
    }
    static async setHiddenModList(modeList) {
        if (!(0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)(modeList) || !(0,lodash__WEBPACK_IMPORTED_MODULE_1__.every)(modeList, lodash__WEBPACK_IMPORTED_MODULE_1__.isString)) {
            console.error('ModLoader ====== IndexDBLoader setHiddenModList() modeList type invalid. invalid');
            return;
        }
        if ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.uniq)(modeList).length !== modeList.length) {
            console.error('ModLoader ====== IndexDBLoader setHiddenModList() modeList has duplicate items. invalid');
            return;
        }
        console.log('[ModLoader] IndexDBLoader setHiddenModList() modDataIndexDBZipListHidden', IndexDBLoader.modDataIndexDBZipListHidden);
        console.log('[ModLoader] IndexDBLoader setHiddenModList() dbName', IndexDBLoader.dbName);
        console.log('[ModLoader] IndexDBLoader setHiddenModList() storeName', IndexDBLoader.storeName);
        await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.set)(IndexDBLoader.modDataIndexDBZipListHidden, JSON.stringify(modeList), (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName));
        console.log('ModLoader ====== IndexDBLoader setHiddenModList() done');
    }
    static async loadHiddenModList() {
        console.log('[ModLoader] IndexDBLoader loadHiddenModList() modDataIndexDBZipListHidden', IndexDBLoader.modDataIndexDBZipListHidden);
        console.log('[ModLoader] IndexDBLoader loadHiddenModList() dbName', IndexDBLoader.dbName);
        console.log('[ModLoader] IndexDBLoader loadHiddenModList() storeName', IndexDBLoader.storeName);
        const ls = await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.get)(IndexDBLoader.modDataIndexDBZipListHidden, (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName));
        if (!ls) {
            console.log('ModLoader ====== IndexDBLoader loadHiddenModList() cannot find modDataIndexDBZipListHidden');
            return undefined;
        }
        try {
            const l = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(ls);
            console.log('ModLoader ====== IndexDBLoader loadHiddenModList() modDataIndexDBZipListHidden', l);
            if (Array.isArray(l) && l.every(lodash__WEBPACK_IMPORTED_MODULE_1__.isString)) {
                return l;
            }
        }
        catch (e) {
            console.error(e);
        }
        console.log('ModLoader ====== IndexDBLoader loadHiddenModList() modDataIndexDBZipListHidden Invalid');
        return undefined;
    }
    static async listMod() {
        console.log('[ModLoader] IndexDBLoader listMod() modDataIndexDBZipList', IndexDBLoader.modDataIndexDBZipList);
        console.log('[ModLoader] IndexDBLoader listMod() dbName', IndexDBLoader.dbName);
        console.log('[ModLoader] IndexDBLoader listMod() storeName', IndexDBLoader.storeName);
        const ls = await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.get)(IndexDBLoader.modDataIndexDBZipList, (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName));
        if (!ls) {
            console.log('ModLoader ====== IndexDBLoader listMod() cannot find modDataIndexDBZipList');
            return undefined;
        }
        try {
            const l = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(ls);
            console.log('ModLoader ====== IndexDBLoader listMod() modDataIndexDBZipList', l);
            if (Array.isArray(l) && l.every(lodash__WEBPACK_IMPORTED_MODULE_1__.isString)) {
                return l;
            }
        }
        catch (e) {
            console.error(e);
        }
        console.log('ModLoader ====== IndexDBLoader listMod() modDataIndexDBZipList Invalid');
        return undefined;
    }
    static calcModNameKey(name) {
        return `${this.modDataIndexDBZipPrefix}:${name}`;
    }
    static async addMod(name, modBase64String) {
        let l = new Set(await this.listMod() || []);
        const k = this.calcModNameKey(name);
        l.add(name);
        const db = (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName);
        // const modBin = isString(modBase64String) ? uint8ToBase64.decode(modBase64String) : modBase64String;
        const modBin = (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)(modBase64String) ? base64ToUint8Array(modBase64String) : modBase64String;
        await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.setMany)([
            [k, modBin],
            [this.modDataIndexDBZipList, JSON.stringify(Array.from(l))],
        ], db);
        // await keyval_set(k, modBase64String, db);
        // await keyval_set(this.modDataIndexDBZipList, JSON.stringify(Array.from(l)), db);
    }
    static async removeMod(name) {
        let l = await this.listMod() || [];
        l = l.filter(T => T !== name);
        let lH = await this.loadHiddenModList() || [];
        lH = lH.filter(T => T !== name);
        const db = (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.createStore)(IndexDBLoader.dbName, IndexDBLoader.storeName);
        const k = this.calcModNameKey(name);
        await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.set)(this.modDataIndexDBZipList, JSON.stringify(l), db);
        await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.set)(this.modDataIndexDBZipListHidden, JSON.stringify(lH), db);
        await (0,idb_keyval__WEBPACK_IMPORTED_MODULE_10__.del)(k, db);
    }
    // get bootJson from zip
    static async checkModZipFile(modBase64String) {
        try {
            const mpr = new _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__.ModPackFileReaderJsZipAdaptor();
            const modPack = await mpr.loadAsync(modBase64String, { base64: (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)(modBase64String) });
            let zip;
            if (modPack) {
                zip = modPack;
            }
            else {
                zip = await jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(modBase64String, { base64: (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)(modBase64String) });
            }
            const bootJsonFile = zip.file(ModZipReader.modBootFilePath);
            if (!bootJsonFile) {
                console.log('ModLoader ====== IndexDBLoader checkModeZipFile() cannot find bootJsonFile:', ModZipReader.modBootFilePath);
                return `bootJsonFile ${ModZipReader.modBootFilePath} Invalid`;
            }
            const bootJson = await bootJsonFile.async('string');
            const bootJ = json5__WEBPACK_IMPORTED_MODULE_7___default().parse(bootJson);
            if (ModZipReader.validateBootJson(bootJ)) {
                return bootJ;
            }
            return `bootJson Invalid`;
        }
        catch (E) {
            console.error('checkModZipFile', E);
            return Promise.reject(E);
        }
    }
    setConfigKey(dbName, storeName, modDataIndexDBZipList, modDataIndexDBZipListHidden) {
        IndexDBLoader.dbName = dbName !== null && dbName !== void 0 ? dbName : IndexDBLoader.dbName;
        IndexDBLoader.storeName = storeName !== null && storeName !== void 0 ? storeName : IndexDBLoader.storeName;
        IndexDBLoader.modDataIndexDBZipList = modDataIndexDBZipList !== null && modDataIndexDBZipList !== void 0 ? modDataIndexDBZipList : IndexDBLoader.modDataIndexDBZipList;
        IndexDBLoader.modDataIndexDBZipListHidden = modDataIndexDBZipListHidden !== null && modDataIndexDBZipListHidden !== void 0 ? modDataIndexDBZipListHidden : IndexDBLoader.modDataIndexDBZipListHidden;
    }
}
IndexDBLoader.dbName = 'ModLoader_IndexDBLoader';
IndexDBLoader.storeName = 'ModLoader_IndexDBLoader';
IndexDBLoader.modDataIndexDBZipListHidden = 'modDataIndexDBZipListHidden';
IndexDBLoader.modDataIndexDBZipList = 'modDataIndexDBZipList';
IndexDBLoader.modDataIndexDBZipPrefix = 'modDataIndexDBZip';
class Base64ZipStringLoader extends LoaderBase {
    constructor(modLoadControllerCallback, loaderKeyConfig, 
    // base64ZipStringList: base64[]
    base64ZipStringList) {
        super(modLoadControllerCallback, loaderKeyConfig);
        this.modLoadControllerCallback = modLoadControllerCallback;
        this.loaderKeyConfig = loaderKeyConfig;
        this.base64ZipStringList = base64ZipStringList;
    }
    async load() {
        // modDataBase64ZipStringList: base64[]
        for (const base64ZipString of this.base64ZipStringList) {
            try {
                const mpr = new _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__.ModPackFileReaderJsZipAdaptor();
                const modPack = await mpr.loadAsync(base64ZipString, { base64: true });
                if (modPack) {
                    const m = new ModZipReader(modPack, '', this, this.log);
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                }
                else {
                    const m = await jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(base64ZipString, { base64: true }).then(zip => {
                        return new ModZipReader(zip, base64ZipString, this, this.log);
                    });
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                }
            }
            catch (E) {
                console.error(E);
            }
        }
        return Promise.resolve(true);
    }
}
class LocalLoader extends LoaderBase {
    init() {
        super.init();
        this.modDataValueZipListPath = this.loaderKeyConfig.getLoaderKey(this.modDataValueZipListPath, this.modDataValueZipListPath);
    }
    constructor(modLoadControllerCallback, loaderKeyConfig, thisWin) {
        super(modLoadControllerCallback, loaderKeyConfig);
        this.modLoadControllerCallback = modLoadControllerCallback;
        this.loaderKeyConfig = loaderKeyConfig;
        this.thisWin = thisWin;
        this.modDataValueZipListPath = 'modDataValueZipList';
    }
    async load() {
        if (this.thisWin[this.modDataValueZipListPath]) {
            console.log('ModLoader ====== LocalLoader load() DataValueZip', [this.thisWin[this.modDataValueZipListPath]]);
            const modDataValueZipList = this.thisWin[this.modDataValueZipListPath];
            if (modDataValueZipList && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)(modDataValueZipList) && modDataValueZipList.every(lodash__WEBPACK_IMPORTED_MODULE_1__.isString)) {
                // modDataValueZipList: base64[]
                for (const modDataValueZip of modDataValueZipList) {
                    try {
                        const mpr = new _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__.ModPackFileReaderJsZipAdaptor();
                        // console.log('ModPackFileReaderJsZipAdaptor', mpr);
                        const modPack = await mpr.loadAsync(modDataValueZip, { base64: true });
                        // console.log('ModLoader ====== LocalLoader load() modDataValueZip', [/*modDataValueZip*/, modPack]);
                        if (modPack) {
                            const m = new ModZipReader(modPack, '', this, this.log);
                            // console.log('modDataValueZip boot', await m.zip.file('boot.json')?.async('string'));
                            if (await m.init()) {
                                // console.log('modDataValueZip m', m);
                                this.modList.push(m);
                            }
                        }
                        else {
                            const m = await jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(modDataValueZip, { base64: true }).then(zip => {
                                return new ModZipReader(zip, modDataValueZip, this, this.log);
                            });
                            if (await m.init()) {
                                this.modList.push(m);
                            }
                        }
                    }
                    catch (E) {
                        console.error(E);
                    }
                }
                return Promise.resolve(true);
            }
        }
        return Promise.resolve(false);
    }
    setConfigKey(modDataValueZipListPath) {
        this.modDataValueZipListPath = modDataValueZipListPath !== null && modDataValueZipListPath !== void 0 ? modDataValueZipListPath : this.modDataValueZipListPath;
    }
}
class RemoteLoader extends LoaderBase {
    constructor() {
        super(...arguments);
        this.modDataRemoteListPath = 'modList.json';
    }
    init() {
        super.init();
        this.modDataRemoteListPath = this.loaderKeyConfig.getLoaderKey(this.modDataRemoteListPath, this.modDataRemoteListPath);
    }
    async load() {
        const modList = await fetch(this.modDataRemoteListPath).then(T => T.json()).catch(E => {
            console.error(E);
            return undefined;
        });
        console.log('ModLoader ====== RemoteLoader load() modList', modList);
        if (modList && (0,lodash__WEBPACK_IMPORTED_MODULE_1__.isArray)(modList) && modList.every(lodash__WEBPACK_IMPORTED_MODULE_1__.isString)) {
            // modList: filePath[]
            for (const modFileZipPath of modList) {
                try {
                    const m = await fetch(modFileZipPath)
                        .then(async (T) => {
                        const blob = await T.blob();
                        const mpr = new _ModPack_ModPackJsZipAdaptor__WEBPACK_IMPORTED_MODULE_9__.ModPackFileReaderJsZipAdaptor();
                        const modPack = await mpr.loadAsync(blob);
                        if (modPack) {
                            const zipFile = new ModZipReader(modPack, '', this, this.log);
                            return zipFile;
                        }
                        else {
                            const base64ZipString = await blobToBase64(blob);
                            const zipFile = await jszip__WEBPACK_IMPORTED_MODULE_0___default().loadAsync(blob);
                            return new ModZipReader(zipFile, base64ZipString, this, this.log);
                        }
                    });
                    if (await m.init()) {
                        this.modList.push(m);
                    }
                }
                catch (E) {
                    console.error(E);
                }
            }
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }
    setConfigKey(modDataRemoteListPath) {
        this.modDataRemoteListPath = modDataRemoteListPath;
    }
}
class LazyLoader extends LoaderBase {
    async add(modeZip) {
        try {
            if (modeZip.is_JeremieModLoader_ModPack) {
                const m = new ModZipReader(modeZip, '', this, this.log);
                if (await m.init()) {
                    this.modList.push(m);
                }
                return m;
            }
            const base64ZipString = await modeZip.generateAsync({ type: "base64" });
            const m = new ModZipReader(modeZip, base64ZipString, this, this.log);
            if (await m.init()) {
                this.modList.push(m);
            }
            return m;
        }
        catch (E) {
            console.error('LazyLoader add()', E);
            this.log.logError(`LazyLoader add() [${(E === null || E === void 0 ? void 0 : E.message) ? E.message : E}]`);
            return Promise.reject(E);
        }
    }
    async load() {
        return Promise.resolve(true);
    }
}
const getModZipReaderStaticClassRef = () => {
    console.error('WARNING: the [[[getModZipReaderStaticClassRef]]] will delete later.');
    return {
        LocalStorageLoader: LocalStorageLoader,
        IndexDBLoader: IndexDBLoader,
        LocalLoader: LocalLoader,
        RemoteLoader: RemoteLoader,
    };
};
class LoaderKeyConfig {
    constructor(log) {
        this.log = log;
        this.modLoaderKeyConfigWinHookFunctionName = 'modLoaderKeyConfigWinHookFunction';
        this.config = new Map();
        this.isInit = false;
        this.logger = {
            log: (s) => {
                this.log.logInfo(s);
            },
            warn: (s) => {
                this.log.logWarning(s);
            },
            error: (s) => {
                this.log.logError(s);
            },
        };
    }
    getLoaderKey(k, d) {
        this.init();
        const n = this.config.get(k);
        console.log('LoaderKeyConfig getLoaderKey state:', k, d, n);
        if ((0,lodash__WEBPACK_IMPORTED_MODULE_1__.isString)(n) && n.length > 1) {
            console.log('LoaderKeyConfig getLoaderKey return:', k, n);
            return n;
        }
        else {
            console.log('LoaderKeyConfig getLoaderKey return:', k, d);
            return d;
        }
    }
    init() {
        if (this.isInit) {
            return;
        }
        this.isInit = true;
        console.log('LoaderKeyConfig init.');
        this.callWinHookFunction();
        this.getConfigFromUrlHash();
        if (this.config.size > 0) {
            this.logger.log(`LoaderKeyConfig init() config:[${[...this.config.entries()]}]`);
        }
        console.log('LoaderKeyConfig init end', this.config);
    }
    /**
     * @example
     * @code
     * ```
     * window.modLoaderKeyConfigWinHookFunction = (loaderKeyConfig: LoaderKeyConfig) => {
     *    loaderKeyConfig.config.set('modDataIndexDBZipList', 'modDataIndexDBZipList123456789');
     * };
     * ```
     *
     * @protected
     */
    callWinHookFunction() {
        try {
            if (window[this.modLoaderKeyConfigWinHookFunctionName]) {
                window[this.modLoaderKeyConfigWinHookFunctionName](this);
                console.log('LoaderKeyConfig callWinHookFunction called', this.config);
            }
        }
        catch (e) {
            console.error('LoaderKeyConfig callWinHookFunction Error', e);
            this.logger.error('LoaderKeyConfig callWinHookFunction Error');
        }
    }
    /**
     * @example   URL:  ./Degrees of Lewdity VERSION.html.mod.html?modDataIndexDBZipList=modDataIndexDBZipList123456789
     * @protected
     */
    getConfigFromUrlHash() {
        const search = window.location.search;
        if (search.length > 1) {
            const a = search.slice(1).split('&').map(T => T.split('='));
            for (const [k, v] of a) {
                this.config.set(k, v);
            }
        }
    }
}


