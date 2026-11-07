__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ModPackFileReader: () => (/* binding */ ModPackFileReader),
/* harmony export */   XxHashH32Number2String: () => (/* binding */ XxHashH32Number2String),
/* harmony export */   XxHashH64Bigint2String: () => (/* binding */ XxHashH64Bigint2String),
/* harmony export */   calcXxHash64: () => (/* binding */ calcXxHash64),
/* harmony export */   covertFromZipMod: () => (/* binding */ covertFromZipMod)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var bson__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! bson */ "./node_modules/bson/lib/bson.mjs");
/* harmony import */ var xxhash_wasm__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! xxhash-wasm */ "./node_modules/xxhash-wasm/esm/xxhash-wasm.js");
/* harmony import */ var libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! libsodium-wrappers-sumo */ "./node_modules/libsodium-wrappers-sumo/dist/modules-sumo/libsodium-wrappers.js");
/* harmony import */ var libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _ModMeta__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./ModMeta */ "./src/BeforeSC2/ModPack/ModMeta.ts");


// @ts-ignore



function paddingToBlockSize(data, blockSize, padN) {
    let paddingLength = blockSize - (data.length % blockSize);
    let blocks = Math.ceil(data.length / blockSize);
    if (blocks > 0 && paddingLength === blockSize) {
        return {
            blocks: blocks,
            dataLength: data.length,
            paddingLength: 0,
            paddedData: data,
            paddedDataLength: data.length,
        };
    }
    if (blocks === 0) {
        // If the data is empty, we still need at least one block
        blocks = 1;
        paddingLength = blockSize; // Full padding for the single block
    }
    if (paddingLength < 0 || paddingLength > blockSize) {
        throw new Error(`Invalid padding length: ${paddingLength}. Data length: ${data.length}, Block size: ${blockSize}`);
    }
    const padding = new Uint8Array(paddingLength);
    for (let i = 0; i < paddingLength; i++) {
        // Fill padding with random bytes
        padding[i] = padN === undefined ? (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.randombytes_uniform)(0xff) : (padN & 0xff);
    }
    const paddedData = new Uint8Array(data.length + paddingLength);
    paddedData.set(data);
    paddedData.set(padding, data.length);
    return {
        blocks: blocks,
        dataLength: data.length,
        paddingLength: paddingLength,
        paddedData: paddedData,
        paddedDataLength: paddedData.length,
    };
}
function createFileTreeFromFileList(fileList) {
    const fileTree = {};
    for (const filePath of fileList) {
        const parts = filePath.split(/[\/\\]/);
        let current = fileTree;
        for (const part of parts) {
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        }
        current['_f_'] = true; // Mark as a file
    }
    return fileTree;
}
// https://github.com/jungomi/xxhash-wasm/blob/5923f26411ed763044bed17a1fec33fee74e47a0/src/xxhash.js#L148
function XxHashH64Bigint2String(h64) {
    return h64.toString(16).padStart(16, "0");
}
function XxHashH32Number2String(h32) {
    return h32.toString(16).padStart(8, "0");
}
function calcXxHash64(data, xxhashApi) {
    const c = xxhashApi.create64();
    // calc it block by block
    const blockSize = _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize;
    const blocks = Math.ceil(data.length / blockSize);
    for (let i = 0; i < blocks; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, data.length);
        c.update(data.subarray(start, end));
    }
    return c.digest();
}
async function covertFromZipMod(modName, filePathList, fileReaderFunc, password = undefined, progressCallback, bootFilePath = 'boot.json') {
    await libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.ready;
    const xxhashApi = await (0,xxhash_wasm__WEBPACK_IMPORTED_MODULE_2__["default"])();
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(0));
    // filePathList duplicate check
    const filePathSet = new Set(filePathList);
    filePathSet.add(bootFilePath);
    if (filePathSet.size - 1 !== filePathList.length) {
        console.error('filePathList has duplicate entries', filePathList);
        throw new Error('filePathList has duplicate entries');
    }
    // make file tree from filePathList
    const fileTree = createFileTreeFromFileList(filePathList);
    // console.log('fileTree', JSON.stringify(fileTree, null, 2));
    const fileTreeBuffer = bson__WEBPACK_IMPORTED_MODULE_1__.BSON.serialize(fileTree);
    const fileTreeBufferPadded = paddingToBlockSize(fileTreeBuffer, _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize);
    let cryptoInfo;
    if (password) {
        cryptoInfo = {};
        const xchacha20Nonce = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.randombytes_buf)(libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_NONCEBYTES, 'uint8array');
        const xchacha20NonceBase64 = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.to_base64)(xchacha20Nonce);
        cryptoInfo['Xchacha20NonceBase64'] = xchacha20NonceBase64;
        const pwhashSalt = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.randombytes_buf)(libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_SALTBYTES, 'uint8array');
        const pwhashSaltBase64 = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.to_base64)(pwhashSalt);
        cryptoInfo['PwhashSaltBase64'] = pwhashSaltBase64;
        // const xchacha20Key = crypto_pwhash(
        //     crypto_stream_xchacha20_KEYBYTES,
        //     password ?? '',
        //     pwhashSalt,
        //     crypto_pwhash_OPSLIMIT_INTERACTIVE,
        //     crypto_pwhash_MEMLIMIT_INTERACTIVE,
        //     crypto_pwhash_ALG_DEFAULT,
        //     'uint8array',
        // );
        // // example
        // crypto_stream_xchacha20_xor_ic(
        //     '',
        //     xchacha20Nonce,
        //     0,
        //     xchacha20Key,
        //     'uint8array',
        // );
    }
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1));
    const progressPerFile = Math.floor((100 - 6) * (cryptoInfo ? 0.5 : 1) / (filePathList.length + 1));
    // console.log('progressPerFile', progressPerFile);
    const bootFile = await fileReaderFunc(bootFilePath);
    if (!bootFile) {
        console.error(`Boot file ${bootFilePath} not found`);
        throw new Error(`Boot file ${bootFilePath} not found`);
    }
    let bootJsonFile = paddingToBlockSize(bootFile, _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize);
    bootJsonFile['filePath'] = bootFilePath;
    let fileCount = 0;
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * ++fileCount));
    const fileBlockList = [];
    for (const filePath of filePathList) {
        // console.log(`Reading file: `, filePath);
        const fileData = await fileReaderFunc(filePath);
        if (!fileData) {
            console.error(`File ${filePath} not found`);
            throw new Error(`File ${filePath} not found`);
        }
        const fileBlock = paddingToBlockSize(fileData, _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize);
        fileBlock['filePath'] = filePath;
        fileBlockList.push(fileBlock);
        await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * ++fileCount));
    }
    const modMeta = {
        magicNumber: (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.to_base64)(_ModMeta__WEBPACK_IMPORTED_MODULE_4__.MagicNumber),
        name: modName,
        protocolVersion: _ModMeta__WEBPACK_IMPORTED_MODULE_4__.ModMetaProtocolVersion,
        blockSize: _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize,
        cryptoInfo: cryptoInfo,
        fileTreeBlock: {
            b: 0,
            e: fileTreeBufferPadded.blocks + 0,
            l: fileTreeBufferPadded.dataLength,
        },
        bootJsonFile: {
            b: 0,
            e: bootJsonFile.blocks - 1,
            l: bootJsonFile.dataLength,
        },
        fileMeta: {},
    };
    const fileMetaList = [];
    let bockIndex = bootJsonFile.blocks;
    for (const fileBlock of fileBlockList) {
        const fileMeta = {
            b: bockIndex,
            e: bockIndex + fileBlock.blocks - 1,
            l: fileBlock.dataLength,
        };
        modMeta.fileMeta[fileBlock.filePath] = fileMeta;
        fileMetaList.push(fileMeta);
        bockIndex += fileBlock.blocks;
    }
    modMeta.fileTreeBlock.b = bockIndex;
    modMeta.fileTreeBlock.e = bockIndex + fileTreeBufferPadded.blocks - 1;
    modMeta.fileTreeBlock.l = fileTreeBufferPadded.dataLength;
    bockIndex += fileTreeBufferPadded.blocks;
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * fileCount + 1));
    const modMetaBuffer = bson__WEBPACK_IMPORTED_MODULE_1__.BSON.serialize(modMeta);
    // console.log('modMetaBuffer length:', modMetaBuffer.length);
    // console.log(modMetaBuffer);
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * fileCount + 2));
    const magicNumberPadded = paddingToBlockSize(_ModMeta__WEBPACK_IMPORTED_MODULE_4__.MagicNumber, _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize, 0);
    const modMetaBufferPadded = paddingToBlockSize(modMetaBuffer, _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize, 0);
    // Calculate the total file length
    // magicNumber (16 bytes) + 8 bytes modMetaBuffer start pos + 8 bytes modMetaBuffer end pos + 8 bytes all file data start pos
    // + modMetaBuffer + (boot file data + all file data)
    const fileLength = magicNumberPadded.paddedDataLength
        // + 8 + 8 + 8
        + _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize // the 8 + 8 + 8
        + modMetaBufferPadded.paddedDataLength + bootJsonFile.paddedDataLength
        + fileBlockList.reduce((acc, block) => acc + block.paddedDataLength, 0)
        + fileTreeBufferPadded.paddedDataLength
        + 8 // xxhash value (8 bytes) at the end of the file
    ;
    // console.log('fileLength', fileLength);
    const modPackBuffer = new Uint8Array(fileLength);
    modPackBuffer.fill(0); // Fill with zeros initially
    // console.log('modPackBuffer.length', modPackBuffer.length);
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * fileCount + 3));
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * fileCount + 4));
    let offset = 0;
    // console.log('offset', offset, magicNumberPadded.paddedData.length, magicNumberPadded.paddedDataLength);
    modPackBuffer.set(magicNumberPadded.paddedData, offset);
    offset += magicNumberPadded.paddedDataLength;
    // console.log('offset', offset);
    const dataView = new DataView(modPackBuffer.buffer);
    dataView.setBigUint64(offset + 8 * 0, BigInt(magicNumberPadded.paddedDataLength + _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize), true); // modMetaBuffer start pos
    dataView.setBigUint64(offset + 8 * 1, BigInt(magicNumberPadded.paddedDataLength + _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize + modMetaBuffer.length), true); // modMetaBuffer end pos
    dataView.setBigUint64(offset + 8 * 2, BigInt(magicNumberPadded.paddedDataLength + _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize + modMetaBufferPadded.paddedDataLength), true); // all file data start pos
    offset += _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize;
    // console.log('offset', offset, modMetaBufferPadded.paddedData.length, modMetaBufferPadded.paddedDataLength);
    modPackBuffer.set(modMetaBufferPadded.paddedData, offset);
    offset += modMetaBufferPadded.paddedDataLength;
    // console.log('offset', offset, bootJsonFile.paddedData.length, bootJsonFile.paddedDataLength);
    modPackBuffer.set(bootJsonFile.paddedData, offset);
    offset += bootJsonFile.paddedDataLength;
    // console.log('offset for', offset);
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * fileCount + 5));
    for (const fileBlock of fileBlockList) {
        // console.log('offset', offset, fileBlock.paddedData.length, fileBlock.paddedDataLength);
        modPackBuffer.set(fileBlock.paddedData, offset);
        offset += fileBlock.paddedDataLength;
        // console.log('offset', offset);
    }
    modPackBuffer.set(fileTreeBufferPadded.paddedData, offset);
    offset += fileTreeBufferPadded.paddedDataLength;
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * fileCount + 6));
    if (!cryptoInfo) {
        await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(99));
        const xxHashPos = offset;
        const hashValue = calcXxHash64(modPackBuffer.subarray(0, xxHashPos), xxhashApi);
        dataView.setBigUint64(xxHashPos, BigInt(hashValue), true); // Store the xxHash value at the end of the mod pack buffer
        await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(100));
        return {
            modMeta: modMeta,
            modPackBuffer: modPackBuffer,
            ext: cryptoInfo ? '.modpack.crypt' : '.modpack',
            hash: hashValue,
            hashString: XxHashH64Bigint2String(hashValue),
        };
    }
    // console.log('start crypt modPackBuffer with xchacha20');
    // ==========================================================================================================
    // Encrypt the modPackBuffer with xchacha20 , only the file data part , block by block , inplace encryption
    const xchacha20Nonce = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.from_base64)(cryptoInfo.Xchacha20NonceBase64);
    if (xchacha20Nonce.length !== libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_NONCEBYTES) {
        console.error(`Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_NONCEBYTES}`);
        throw new Error(`Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_NONCEBYTES}`);
    }
    const pwhashSalt = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.from_base64)(cryptoInfo.PwhashSaltBase64);
    const xchacha20Key = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash)(libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_KEYBYTES, password !== null && password !== void 0 ? password : '', pwhashSalt, libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_OPSLIMIT_INTERACTIVE, libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_MEMLIMIT_INTERACTIVE, libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_ALG_DEFAULT, 'uint8array');
    let blockPosIndex = 0;
    const blockIndexLast = bockIndex;
    const startPos = magicNumberPadded.paddedDataLength + _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize + modMetaBufferPadded.paddedDataLength;
    const progressPerCryptoBlock = Math.floor((100 - 6) * 0.5 / (blockIndexLast + 1));
    for (let blockIndex = 0; blockIndex < blockIndexLast; blockIndex++) {
        const blockStartPos = startPos + blockPosIndex * _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize;
        const blockEndPos = blockStartPos + _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize;
        const blockData = modPackBuffer.subarray(blockStartPos, blockEndPos);
        if (blockData.length < _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize) {
            // If the last block is not full
            // this will never happen
            console.warn(`Block data length is less than block size: ${blockData.length} < ${_ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize}`);
            throw new Error(`Block data length is less than block size: ${blockData.length} < ${_ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize}`);
        }
        const encryptedBlock = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_xor_ic)(blockData, xchacha20Nonce, blockIndex, xchacha20Key, 'uint8array');
        modPackBuffer.set(encryptedBlock, blockStartPos);
        blockPosIndex++;
        await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(1 + progressPerFile * fileCount + 6 + (blockIndex + 1) * progressPerCryptoBlock));
    }
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(99));
    const xxHashPos = startPos + blockPosIndex * _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize;
    const hashValue = calcXxHash64(modPackBuffer.subarray(0, xxHashPos), xxhashApi);
    dataView.setBigUint64(xxHashPos, BigInt(hashValue), true); // Store the xxHash value at the end of the mod pack buffer
    await (progressCallback === null || progressCallback === void 0 ? void 0 : progressCallback(100));
    return {
        modMeta: modMeta,
        modPackBuffer: modPackBuffer,
        ext: cryptoInfo ? '.modpack.crypt' : '.modpack',
        hash: hashValue,
        hashString: XxHashH64Bigint2String(hashValue),
    };
}
class ModPackFileReader {
    constructor() {
    }
    get isInit() {
        return !!this.modMeta && !!this.modPackBuffer && this.modPackBuffer.length > 0;
    }
    set progressCallback(callback) {
        this._progressCallback = callback;
    }
    get modPackBufferSize() {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return this.modPackBuffer.length;
    }
    get modMetaInfo() {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return this.modMeta;
    }
    get hash() {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return this.xxHashValue;
    }
    get hashString() {
        if (!this.isInit) {
            throw new Error('ModPackFileReader is not initialized. Please call load() first.');
        }
        return XxHashH64Bigint2String(this.xxHashValue);
    }
    async checkHash(modPackBuffer) {
        var _a;
        const xxhashApi = (_a = ModPackFileReader.xxhashApi) !== null && _a !== void 0 ? _a : await (0,xxhash_wasm__WEBPACK_IMPORTED_MODULE_2__["default"])();
        ModPackFileReader.xxhashApi = xxhashApi;
        const dataView = new DataView(this.modPackBuffer.buffer);
        const xxHashValue = dataView.getBigUint64(dataView.byteLength - 8, true);
        const hashValue = calcXxHash64(this.modPackBuffer.subarray(0, this.modPackBuffer.length - 8), xxhashApi);
        // console.log('[ModPackFileReader] xxHashValue:', XxHashH64Bigint2String(xxHashValue));
        // console.log('[ModPackFileReader] hashValue:', XxHashH64Bigint2String(hashValue));
        if (xxHashValue !== hashValue) {
            console.error(`[ModPackFileReader] Invalid xxHash value: ${XxHashH64Bigint2String(xxHashValue)}, expected: ${XxHashH64Bigint2String(hashValue)}`);
            return false;
        }
        this.xxHashValue = xxHashValue;
        return true;
    }
    async load(modPackBuffer, password) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        await libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.ready;
        const xxhashApi = (_a = ModPackFileReader.xxhashApi) !== null && _a !== void 0 ? _a : await (0,xxhash_wasm__WEBPACK_IMPORTED_MODULE_2__["default"])();
        ModPackFileReader.xxhashApi = xxhashApi;
        this.modPackBuffer = modPackBuffer;
        this.password = password;
        const magicNumberLength = Math.ceil(_ModMeta__WEBPACK_IMPORTED_MODULE_4__.MagicNumber.length / _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize) * _ModMeta__WEBPACK_IMPORTED_MODULE_4__.BlockSize; // Ensure magic number is padded to block size
        if (this.modPackBuffer.length < magicNumberLength + 8 + 8 + 8) {
            throw new Error('Mod pack buffer is too short to contain mod meta');
        }
        const magicNumber = this.modPackBuffer.subarray(0, _ModMeta__WEBPACK_IMPORTED_MODULE_4__.MagicNumber.length);
        if (!magicNumber.every((value, index) => value === _ModMeta__WEBPACK_IMPORTED_MODULE_4__.MagicNumber[index])) {
            throw new Error('Invalid magic number in mod pack buffer');
        }
        await ((_b = this._progressCallback) === null || _b === void 0 ? void 0 : _b.call(this, 0));
        if (!await this.checkHash(this.modPackBuffer)) {
            console.error('[ModPackFileReader] Mod pack hash check failed');
            throw new Error('[ModPackFileReader] Mod pack hash check failed');
        }
        await ((_c = this._progressCallback) === null || _c === void 0 ? void 0 : _c.call(this, 10));
        // const modMetaStartPos = magicNumberLength + 8 + 8 + 8; // magic
        const dataView = new DataView(this.modPackBuffer.buffer);
        const modMetaBufferStartPos = dataView.getBigUint64(magicNumberLength + 8 * 0, true);
        const modMetaBufferEndPos = dataView.getBigUint64(magicNumberLength + 8 * 1, true);
        const fileDataStartPos = dataView.getBigUint64(magicNumberLength + 8 * 2, true);
        const modMetaBufferLength = modMetaBufferEndPos - modMetaBufferStartPos;
        // console.log('[ModPackFileReader] modMetaBufferStartPos:', modMetaBufferStartPos);
        // console.log('[ModPackFileReader] modMetaBufferEndPos:', modMetaBufferEndPos);
        // console.log('[ModPackFileReader] fileDataStartPos:', fileDataStartPos);
        // console.log('[ModPackFileReader] modMetaBufferLength:', modMetaBufferLength);
        if (modMetaBufferEndPos + modMetaBufferLength > this.modPackBuffer.length) {
            console.error('[ModPackFileReader] Mod buffer is too short');
            throw new Error('[ModPackFileReader] Mod buffer is too short');
        }
        const modMetaBuffer = this.modPackBuffer.subarray(Number(modMetaBufferStartPos), Number(modMetaBufferEndPos));
        // console.log('[ModPackFileReader] modMetaBuffer length:', modMetaBuffer.length);
        // console.log(modMetaBuffer);
        await ((_d = this._progressCallback) === null || _d === void 0 ? void 0 : _d.call(this, 20));
        const modMeta = bson__WEBPACK_IMPORTED_MODULE_1__.BSON.deserialize(modMetaBuffer);
        // console.log('[ModPackFileReader] modMeta:', modMeta);
        // console.log('[ModPackFileReader] modMeta.magicNumber:', from_base64(modMeta.magicNumber));
        if (!(0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.from_base64)(modMeta.magicNumber).every((value, index) => value === _ModMeta__WEBPACK_IMPORTED_MODULE_4__.MagicNumber[index])) {
            console.error('[ModPackFileReader] Invalid magic number in mod meta');
            throw new Error('[ModPackFileReader] Invalid magic number in mod meta');
        }
        this.modMeta = modMeta;
        await ((_e = this._progressCallback) === null || _e === void 0 ? void 0 : _e.call(this, 30));
        // check ModMeta valid
        if (modMeta.protocolVersion !== _ModMeta__WEBPACK_IMPORTED_MODULE_4__.ModMetaProtocolVersion) {
            console.error(`[ModPackFileReader] Invalid mod meta protocol version: ${modMeta.protocolVersion}, expected: ${_ModMeta__WEBPACK_IMPORTED_MODULE_4__.ModMetaProtocolVersion}`);
            throw new Error(`[ModPackFileReader] Invalid mod meta protocol version: ${modMeta.protocolVersion}, expected: ${_ModMeta__WEBPACK_IMPORTED_MODULE_4__.ModMetaProtocolVersion}`);
        }
        if (modMeta.blockSize <= 0 || modMeta.blockSize > 1024 * 1024 * 64 || modMeta.blockSize % 2 !== 0) {
            console.error(`[ModPackFileReader] Invalid block size: ${modMeta.blockSize}`);
            throw new Error(`[ModPackFileReader] Invalid block size: ${modMeta.blockSize}`);
        }
        if (modMeta.bootJsonFile.b < 0 || modMeta.bootJsonFile.e < modMeta.bootJsonFile.b || modMeta.bootJsonFile.l <= 0) {
            console.error(`[ModPackFileReader] Invalid boot json file meta: ${JSON.stringify(modMeta.bootJsonFile)}`);
            throw new Error(`[ModPackFileReader] Invalid boot json file meta: ${JSON.stringify(modMeta.bootJsonFile)}`);
        }
        for (const [filePath, fileMeta] of Object.entries(modMeta.fileMeta)) {
            if (fileMeta.b < 0 || fileMeta.e < fileMeta.b || fileMeta.l < 0) {
                console.error(`[ModPackFileReader] Invalid file meta for ${filePath}: ${JSON.stringify(fileMeta)}`);
                throw new Error(`[ModPackFileReader] Invalid file meta for ${filePath}: ${JSON.stringify(fileMeta)}`);
            }
        }
        await ((_f = this._progressCallback) === null || _f === void 0 ? void 0 : _f.call(this, 60));
        // check fileMeta not overlap
        const fileMetaList = Object.values(modMeta.fileMeta);
        fileMetaList.sort((a, b) => a.b - b.b); // Sort by begin index
        for (let i = 0; i < fileMetaList.length - 1; i++) {
            const current = fileMetaList[i];
            const next = fileMetaList[i + 1];
            if (current.e >= next.b) {
                console.error(`[ModPackFileReader] File meta overlap detected between ${JSON.stringify(current)} and ${JSON.stringify(next)}`);
                throw new Error(`[ModPackFileReader] File meta overlap detected between ${JSON.stringify(current)} and ${JSON.stringify(next)}`);
            }
        }
        await ((_g = this._progressCallback) === null || _g === void 0 ? void 0 : _g.call(this, 80));
        // append 'boot.json'
        modMeta.fileMeta['boot.json'] = modMeta.bootJsonFile;
        let xchacha20Key;
        let xchacha20Nonce;
        if (modMeta.cryptoInfo && password) {
            if (!modMeta.cryptoInfo.Xchacha20NonceBase64 || !modMeta.cryptoInfo.PwhashSaltBase64) {
                console.error('[ModPackFileReader] Crypto info is incomplete');
                throw new Error('[ModPackFileReader] Crypto info is incomplete');
            }
            xchacha20Nonce = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.from_base64)(modMeta.cryptoInfo.Xchacha20NonceBase64);
            if (xchacha20Nonce.length !== libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_NONCEBYTES) {
                console.error(`[ModPackFileReader] Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_NONCEBYTES}`);
                throw new Error(`[ModPackFileReader] Invalid xchacha20 nonce length: ${xchacha20Nonce.length}, expected: ${libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_NONCEBYTES}`);
            }
            const pwhashSalt = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.from_base64)(modMeta.cryptoInfo.PwhashSaltBase64);
            if (pwhashSalt.length !== libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_SALTBYTES) {
                console.error(`[ModPackFileReader] Invalid pwhash salt length: ${pwhashSalt.length}, expected: ${libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_SALTBYTES}`);
                throw new Error(`[ModPackFileReader] Invalid pwhash salt length: ${pwhashSalt.length}, expected: ${libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_SALTBYTES}`);
            }
            xchacha20Key = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash)(libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_KEYBYTES, password, pwhashSalt, libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_OPSLIMIT_INTERACTIVE, libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_MEMLIMIT_INTERACTIVE, libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_pwhash_ALG_DEFAULT, 'uint8array');
        }
        await ((_h = this._progressCallback) === null || _h === void 0 ? void 0 : _h.call(this, 99));
        // ok
        this.modMeta = modMeta;
        this.fileDataStartPos = fileDataStartPos;
        this.xchacha20Key = xchacha20Key;
        this.xchacha20Nonce = xchacha20Nonce;
        await ((_j = this._progressCallback) === null || _j === void 0 ? void 0 : _j.call(this, 100));
        return modMeta;
    }
    getFileList() {
        const fileList = [];
        for (const filePath in this.modMeta.fileMeta) {
            if (this.modMeta.fileMeta.hasOwnProperty(filePath)) {
                fileList.push(filePath);
            }
        }
        return fileList;
    }
    async getFileByMeta(fileMeta, filePath) {
        await libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.ready;
        const fileStartPos = Number(this.fileDataStartPos) + fileMeta.b * this.modMeta.blockSize;
        const fileEndPos = fileStartPos + fileMeta.l;
        if (fileEndPos > this.modPackBuffer.length) {
            console.error(`[ModPackFileReader] File ${filePath} end position exceeds mod pack buffer length`);
            throw new Error(`[ModPackFileReader] File ${filePath} end position exceeds mod pack buffer length`);
        }
        if (!(this.xchacha20Key && this.xchacha20Nonce)) {
            // If the mod pack is not encrypted, we can read the file data directly
            const fileData = this.modPackBuffer.subarray(fileStartPos, fileEndPos);
            if (fileData.length !== fileMeta.l) {
                console.error(`[ModPackFileReader] File ${filePath} data length mismatch: expected ${fileMeta.l}, got ${fileData.length}`);
                throw new Error(`[ModPackFileReader] File ${filePath} data length mismatch: expected ${fileMeta.l}, got ${fileData.length}`);
            }
            return fileData;
        }
        // If the mod pack is encrypted, we need to decrypt the file data block by block
        const fileStartBlockIndex = fileMeta.b;
        const fileEndBlockIndex = fileMeta.e;
        if (fileStartBlockIndex < 0 || fileEndBlockIndex < fileStartBlockIndex || fileEndBlockIndex >= this.modPackBuffer.length / this.modMeta.blockSize) {
            console.error(`[ModPackFileReader] Invalid file block index for ${filePath}: start ${fileStartBlockIndex}, end ${fileEndBlockIndex}`);
            throw new Error(`[ModPackFileReader] Invalid file block index for ${filePath}: start ${fileStartBlockIndex}, end ${fileEndBlockIndex}`);
        }
        const fileData = new Uint8Array(Number(fileEndBlockIndex - fileStartBlockIndex + 1) * this.modMeta.blockSize);
        let offset = 0;
        for (let blockIndex = fileStartBlockIndex; blockIndex <= fileEndBlockIndex; blockIndex++) {
            const blockStartPos = Number(this.fileDataStartPos) + blockIndex * this.modMeta.blockSize;
            const blockEndPos = blockStartPos + this.modMeta.blockSize;
            if (blockEndPos > this.modPackBuffer.length) {
                console.error(`[ModPackFileReader] Block ${blockIndex} end position exceeds mod pack buffer length`);
                throw new Error(`[ModPackFileReader] Block ${blockIndex} end position exceeds mod pack buffer length`);
            }
            const blockData = this.modPackBuffer.subarray(blockStartPos, blockEndPos);
            if (blockData.length !== this.modMeta.blockSize) {
                console.error(`[ModPackFileReader] Block ${blockIndex} data length mismatch: expected ${this.modMeta.blockSize}, got ${blockData.length}`);
                throw new Error(`[ModPackFileReader] Block ${blockIndex} data length mismatch: expected ${this.modMeta.blockSize}, got ${blockData.length}`);
            }
            const decryptedBlockData = (0,libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.crypto_stream_xchacha20_xor_ic)(blockData, this.xchacha20Nonce, blockIndex, this.xchacha20Key, 'uint8array');
            // console.log('offset', offset);
            // console.log('fileData', fileData.length);
            // console.log('decryptedBlockData', decryptedBlockData.length);
            fileData.set(decryptedBlockData, offset);
            offset += decryptedBlockData.length;
        }
        // Check if the decrypted file data length matches the expected length
        if (offset < fileMeta.l) {
            console.error(`[ModPackFileReader] Decrypted file ${filePath} data length mismatch: expected ${fileMeta.l}, got ${offset}`);
            throw new Error(`[ModPackFileReader] Decrypted file ${filePath} data length mismatch: expected ${fileMeta.l}, got ${offset}`);
        }
        // Return the decrypted file data
        return fileData.subarray(0, fileMeta.l); // Trim to the expected length
    }
    async getFile(filePath) {
        if (!this.modMeta.fileMeta[filePath]) {
            console.warn(`[ModPackFileReader] File ${filePath} not found in mod meta`);
            return undefined;
        }
        const fileMeta = this.modMeta.fileMeta[filePath];
        return this.getFileByMeta(fileMeta, filePath);
    }
    async readFile(filePath) {
        return this.getFile(filePath);
    }
    async getBootJson() {
        await libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.ready;
        return this.getFileByMeta(this.modMeta.bootJsonFile, 'boot.json');
    }
    async getFileTree() {
        await libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.ready;
        if (this.fileTree) {
            return this.fileTree;
        }
        const fileTreeBuffer = await this.getFileByMeta(this.modMeta.fileTreeBlock, 'fileTree');
        if (!fileTreeBuffer) {
            console.warn('[ModPackFileReader] File tree not found in mod meta');
            return undefined;
        }
        try {
            const fileTree = bson__WEBPACK_IMPORTED_MODULE_1__.BSON.deserialize(fileTreeBuffer);
            this.fileTree = fileTree;
            this.fileTree['boot.json'] = {
                '_f_': true,
            }; // Add boot.json file meta to the file tree
            return fileTree;
        }
        catch (error) {
            console.error('[ModPackFileReader] Failed to deserialize file tree:', error);
            throw error;
        }
    }
    get fileTreeRef() {
        return this.fileTree;
    }
    async checkValid() {
        await libsodium_wrappers_sumo__WEBPACK_IMPORTED_MODULE_3__.ready;
        try {
            // Check if modMeta is loaded
            if (!this.modMeta) {
                console.error('[ModPackFileReader] Mod meta not loaded');
                return false;
            }
            // Check if fileDataStartPos is set
            if (this.fileDataStartPos === undefined) {
                console.error('[ModPackFileReader] File data start position not set');
                return false;
            }
            // Check if xchacha20Key and xchacha20Nonce are set if password is provided
            if (this.password && !(this.xchacha20Key && this.xchacha20Nonce)) {
                console.error('[ModPackFileReader] Xchacha20 key or nonce not set');
                console.log('[ModPackFileReader] password', this.password);
                console.log('[ModPackFileReader] xchacha20Key', this.xchacha20Key);
                console.log('[ModPackFileReader] xchacha20Nonce', this.xchacha20Nonce);
                return false;
            }
            if (!this.password && (this.xchacha20Key || this.xchacha20Nonce)) {
                console.error('[ModPackFileReader] Xchacha20 key or nonce set without password');
                console.log('[ModPackFileReader] password', this.password);
                console.log('[ModPackFileReader] xchacha20Key', this.xchacha20Key);
                console.log('[ModPackFileReader] xchacha20Nonce', this.xchacha20Nonce);
                return false;
            }
            const boot = await this.getBootJson();
            if (!boot) {
                console.error('[ModPackFileReader] Boot JSON not loaded');
                return false;
            }
            // check file tree compare with file list
            const fileTree = await this.getFileTree();
            if (!fileTree) {
                console.error('[ModPackFileReader] File tree not loaded');
                return false;
            }
            const fileList = this.getFileList();
            const fileTreeCheck = createFileTreeFromFileList(fileList);
            if (!(0,lodash__WEBPACK_IMPORTED_MODULE_0__.isEqual)(fileTree, fileTreeCheck)) {
                console.error('[ModPackFileReader] File tree does not match file list');
                console.error('File tree:', JSON.stringify(fileTree, null, 2));
                console.error('File tree check:', JSON.stringify(fileTreeCheck, null, 2));
                return false;
            }
            // If all checks passed, return true
            return true;
        }
        catch (error) {
            console.error('[ModPackFileReader] Error checking validity:', error);
            return false;
        }
    }
}

