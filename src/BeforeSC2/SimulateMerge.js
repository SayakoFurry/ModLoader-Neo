__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   simulateMergeSC2DataInfoCache: () => (/* binding */ simulateMergeSC2DataInfoCache),
/* harmony export */   simulateMergeStep: () => (/* binding */ simulateMergeStep)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);

// input ok set, output ok(new) set and conflict(overflow) set
// the a set will be modified(update)
function simulateMergeStep(a, b) {
    const r = {
        ok: a,
        conflict: new Set(),
    };
    for (const item of b) {
        if (r.ok.has(item)) {
            r.conflict.add(item);
        }
        else {
            r.ok.add(item);
        }
    }
    return r;
}
function simulateMergeSC2DataInfoCache(...ic) {
    if (ic.length === 0) {
        throw new Error('simulateMergeSC2DataInfoCache (ic.length === 0)');
    }
    const ooo = ic[0];
    const createResult = (c) => {
        return {
            styleFileItems: {
                ok: new Set(c.styleFileItems.map.keys()),
                conflict: new Set(),
            },
            scriptFileItems: {
                ok: new Set(c.scriptFileItems.map.keys()),
                conflict: new Set(),
            },
            passageDataItems: {
                ok: new Set(c.passageDataItems.map.keys()),
                conflict: new Set(),
            },
            dataSource: c.dataSource,
        };
    };
    const temp = createResult(ooo);
    const r = [];
    for (let i = 1; i < ic.length; i++) {
        const c = ic[i];
        const t = createResult(c);
        t.styleFileItems = simulateMergeStep(temp.styleFileItems.ok, t.styleFileItems.ok);
        t.scriptFileItems = simulateMergeStep(temp.scriptFileItems.ok, t.scriptFileItems.ok);
        t.passageDataItems = simulateMergeStep(temp.passageDataItems.ok, t.passageDataItems.ok);
        r.push((0,lodash__WEBPACK_IMPORTED_MODULE_0__.cloneDeep)(t));
    }
    return r;
}

