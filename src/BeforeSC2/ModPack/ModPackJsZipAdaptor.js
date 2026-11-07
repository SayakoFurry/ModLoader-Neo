__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ModPackFileReaderJsZipAdaptor: () => (/* binding */ ModPackFileReaderJsZipAdaptor),
/* harmony export */   ModPackJsZipObjectAdaptor: () => (/* binding */ ModPackJsZipObjectAdaptor)
/* harmony export */ });
/* harmony import */ var _ModPack__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ModPack */ "./src/BeforeSC2/ModPack/ModPack.ts");
/* harmony import */ var _ModMeta__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ModMeta */ "./src/BeforeSC2/ModPack/ModMeta.ts");
/* harmony import */ var xxhash_wasm__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! xxhash-wasm */ "./node_modules/xxhash-wasm/esm/xxhash-wasm.js");


// @ts-ignore

function splitAndNormalizePath(path) {
    // Split the path by both forward and backward slashes
    let parts = path.split(/[\/\\]/);
    // Filter out any empty parts and normalize the path
    parts = parts.filter(part => part.length > 0);
    // remove .
    parts = parts.filter(part => part !== '.');
    // remove .. and when .. , remove the last element
    while (parts.includes('..')) {
        const index = parts.indexOf('..');
        if (index > 0) {
            parts.splice(index - 1, 2); // Remove the '..' and the previous part
        }
        else {
            parts.splice(index, 1); // If '..' is at the start, just remove it
        }
    }
    return parts;
}
class ModPackJsZipObjectAdaptor {
    constructor(filePath, ref, parent) {
        this.ref = ref;
        this.parent = parent;
        this.myPathInFileTree = [];
        this._isFile = false;
        this._isFolder = false;
        this._isValid = false;
        this.myPathInFileTree = splitAndNormalizePath(filePath);
        if (parent) {
            this.myPathInFileTree = [...parent.myPathInFileTree, ...this.myPathInFileTree];
        }
        let treeRef = this.ref.fileTreeRef;
        if (!treeRef) {
            console.log('[ModPackJsZipAdaptor] File tree reference is not initialized');
            throw new Error('[ModPackJsZipAdaptor] File tree reference is not initialized.');
        }
        for (const part of this.myPathInFileTree) {
            if (!(part in treeRef)) {
                console.log(`[ModPackJsZipAdaptor] Part "${part}" not found in file tree reference.`);
                throw new Error(`[ModPackJsZipAdaptor] Part "${part}" not found in file tree reference.`);
            }
            treeRef = treeRef[part];
            if (!treeRef) {
                console.log(`[ModPackJsZipAdaptor] Part "${part}" is not a valid reference in file tree.`);
                throw new Error(`[ModPackJsZipAdaptor] Part "${part}" is not a valid reference in file tree.`);
            }
        }
        this.treeLevelRef = treeRef;
        if (this.treeLevelRef['_f_']) {
            this._isFile = true;
            this._isFolder = false;
        }
        else {
            this._isFile = false;
            this._isFolder = true;
        }
        this._isValid = true;
    }
    get dir() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this._isFolder;
    }
    get name() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this.myPathInFileTree[this.myPathInFileTree.length - 1];
    }
    get path() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this.myPathInFileTree.join('/');
    }
    async async(type, onUpdate_Useless) {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        if (!this._isFile) {
            console.error('[ModPackJsZipAdaptor] Cannot read content from a folder.');
            throw new Error('[ModPackJsZipAdaptor] Cannot read content from a folder.');
        }
        // if not crypted, the data will be a none copy data
        // if crypted, the data will be a copy data
        const data = await this.ref.getFile(this.myPathInFileTree.join('/'));
        if (!data) {
            console.error(`[ModPackJsZipAdaptor] File "${this.myPathInFileTree.join('/')}" not found in the mod pack.`);
            throw new Error(`[ModPackJsZipAdaptor] File "${this.myPathInFileTree.join('/')}" not found in the mod pack.`);
        }
        switch (type) {
            case 'base64':
                return btoa(String.fromCharCode(...data));
            // return uint8ToBase64.encode(data) as OutputByType[T];
            case 'string':
            case 'text':
                return new TextDecoder('utf-8').decode(data);
            case 'binarystring':
                return Array.prototype.map.call(data, x => String.fromCharCode(x)).join('');
            case 'array':
                return Array.from(data);
            case 'uint8array':
                return data;
            case 'arraybuffer':
                return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
            case 'blob':
                return new Blob([data]);
            // case 'nodebuffer':
            //     return data as OutputByType[T]; // Node.js Buffer
            default:
                console.error(`[ModPackJsZipAdaptor] Unsupported output type: ${type}`);
                throw new Error(`[ModPackJsZipAdaptor] Unsupported output type: ${type}`);
        }
    }
    get files() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        if (!this._files) {
            this._files = {};
            for (const filePath in this.treeLevelRef) {
                this._files[filePath] = new ModPackJsZipObjectAdaptor(filePath, this.ref, this);
            }
        }
        return this._files;
    }
    get isFile() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this._isFile;
    }
    get isFolder() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return this._isFolder;
    }
    get isValid() {
        return this._isValid;
    }
    // JsZip JSZipObject.options
    get options() {
        if (!this._isValid) {
            console.error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
            throw new Error('[ModPackJsZipAdaptor] Invalid ModPackJsZipAdaptor instance.');
        }
        return {
            compression: 'STORE',
        };
    }
}
class ModPackFileReaderJsZipAdaptor extends _ModPack__WEBPACK_IMPORTED_MODULE_0__.ModPackFileReader {
    constructor() {
        super(...arguments);
        this._isPrepared = false;
    }
    get is_JeremieModLoader_ModPack() {
        return true; // This is a specific implementation for Jeremie ModLoader ModPack
    }
    prepareSetPassword(password) {
        if (this.isInit) {
            console.error('[ModPackFileReaderJsZipAdaptor] Cannot set password after initialization.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] Cannot set password after initialization.');
        }
        this.zipAdaptorPassword = password;
    }
    async prepareForZipAdaptor() {
        this._isPrepared = true;
        const fileTree = await this.getFileTree();
        const files = this.files;
    }
    get files() {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        if (!this._files) {
            this._files = {};
            for (const filePath of this.getFileList()) {
                this._files[filePath] = new ModPackJsZipObjectAdaptor(filePath, this, undefined);
            }
        }
        return this._files;
    }
    file(path) {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        if (typeof path === 'string') {
            return this.files[path] || null;
        }
        if (path instanceof RegExp) {
            const matchedFiles = [];
            for (const filePath in this.files) {
                if (path.test(filePath)) {
                    matchedFiles.push(this.files[filePath]);
                }
            }
            return matchedFiles.length > 0 ? matchedFiles : null;
        }
        console.error('[ModPackFileReaderJsZipAdaptor] Invalid path type. Expected string or RegExp.');
        throw new Error('[ModPackFileReaderJsZipAdaptor] Invalid path type. Expected string or RegExp.');
    }
    // folder(path: string): ModPackJsZipObjectAdaptor | undefined {
    //     if (!this._isPrepared) {
    //         console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
    //         throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
    //     }
    //     const m = new ModPackJsZipObjectAdaptor(path, this, undefined);
    //     if (m.isValid && m.isFolder) {
    //         return m;
    //     } else {
    //         console.error(`[ModPackFileReaderJsZipAdaptor] Folder "${path}" not found or is not a folder.`);
    //         return undefined;
    //     }
    // }
    forEach(callback) {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        for (const filePath in this.files) {
            const file = this.files[filePath];
            if (file.isValid) {
                callback(filePath, file);
            }
            else {
                console.error(`[ModPackFileReaderJsZipAdaptor] File "${filePath}" is not valid.`);
            }
        }
    }
    filter(predicate) {
        if (!this._isPrepared) {
            console.error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] File reader is not prepared for zip adaptor.');
        }
        const result = [];
        for (const filePath in this.files) {
            const file = this.files[filePath];
            if (file.isValid && predicate(filePath, file)) {
                result.push(file);
            }
        }
        return result;
    }
    get support() {
        return {
            arraybuffer: true,
            uint8array: true,
            blob: true,
            nodebuffer: false, // Node.js Buffer is not supported in browser environment
        };
    }
    static async checkByHash(modPackBuffer) {
        var _a;
        const magicNumberLength = Math.ceil(_ModMeta__WEBPACK_IMPORTED_MODULE_1__.MagicNumber.length / _ModMeta__WEBPACK_IMPORTED_MODULE_1__.BlockSize) * _ModMeta__WEBPACK_IMPORTED_MODULE_1__.BlockSize; // Ensure magic number is padded to block size
        if (modPackBuffer.length < magicNumberLength + 8 + 8 + 8) {
            return false; // Ensure buffer is large enough for magic number, xxHash, and size
        }
        const magicNumber = modPackBuffer.subarray(0, _ModMeta__WEBPACK_IMPORTED_MODULE_1__.MagicNumber.length);
        if (!magicNumber.every((value, index) => value === _ModMeta__WEBPACK_IMPORTED_MODULE_1__.MagicNumber[index])) {
            return false;
        }
        const xxhashApi = (_a = _ModPack__WEBPACK_IMPORTED_MODULE_0__.ModPackFileReader.xxhashApi) !== null && _a !== void 0 ? _a : await (0,xxhash_wasm__WEBPACK_IMPORTED_MODULE_2__["default"])();
        _ModPack__WEBPACK_IMPORTED_MODULE_0__.ModPackFileReader.xxhashApi = xxhashApi;
        const dataView = new DataView(modPackBuffer.buffer);
        const xxHashValue = dataView.getBigUint64(dataView.byteLength - 8, true);
        const hashValue = (0,_ModPack__WEBPACK_IMPORTED_MODULE_0__.calcXxHash64)(modPackBuffer.subarray(0, modPackBuffer.length - 8), xxhashApi);
        // console.log('[ModPackFileReader] xxHashValue:', XxHashH64Bigint2String(xxHashValue));
        // console.log('[ModPackFileReader] hashValue:', XxHashH64Bigint2String(hashValue));
        if (xxHashValue !== hashValue) {
            console.error(`[ModPackFileReader] Invalid xxHash value: ${(0,_ModPack__WEBPACK_IMPORTED_MODULE_0__.XxHashH64Bigint2String)(xxHashValue)}, expected: ${(0,_ModPack__WEBPACK_IMPORTED_MODULE_0__.XxHashH64Bigint2String)(hashValue)}`);
            return false;
        }
        return true;
    }
    async loadAsync(data, options) {
        let dataI = await data;
        let readData;
        if ((options === null || options === void 0 ? void 0 : options.base64) && typeof dataI === 'string') {
            // base64 string, decode it
            readData = Uint8Array.from(atob(dataI), c => c.charCodeAt(0));
        }
        else if (typeof dataI === 'string') {
            // check type
            //     base64: string;
            //     string: string;
            //     text: string;
            //     binarystring: string;
            if (/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(dataI)) {
                // base64
                readData = Uint8Array.from(atob(dataI), c => c.charCodeAt(0));
            }
            else {
                try {
                    // text / string
                    readData = new TextEncoder().encode(dataI);
                }
                catch (e) {
                    // is binarystring
                    readData = Uint8Array.from(dataI, char => char.charCodeAt(0));
                }
            }
        }
        else if (dataI instanceof Uint8Array || dataI instanceof ArrayBuffer) {
            // already in binary format
            readData = new Uint8Array(dataI);
        }
        else if (dataI instanceof Blob) {
            // Blob, read as binary
            readData = new Uint8Array(await dataI.arrayBuffer());
        }
        else if (Array.isArray(dataI)) {
            // array of numbers
            readData = new Uint8Array(dataI);
        }
        else {
            console.error('[ModPackFileReaderJsZipAdaptor] Unsupported data type for loading.');
            throw new Error('[ModPackFileReaderJsZipAdaptor] Unsupported data type for loading.');
        }
        if (!await ModPackFileReaderJsZipAdaptor.checkByHash(readData)) {
            return undefined;
        }
        this.prepareSetPassword(options === null || options === void 0 ? void 0 : options.password);
        await this.load(readData, this.zipAdaptorPassword);
        await this.prepareForZipAdaptor();
        return this;
    }
}

