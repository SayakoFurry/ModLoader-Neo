__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   IdbKeyValRef: () => (/* binding */ IdbKeyValRef),
/* harmony export */   IdbRef: () => (/* binding */ IdbRef)
/* harmony export */ });
/* harmony import */ var idb_keyval__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! idb-keyval */ "./node_modules/idb-keyval/dist/index.js");
/* harmony import */ var idb__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! idb */ "./node_modules/idb/build/index.js");



class IdbRef {
    get idb_openDB() {
        return idb__WEBPACK_IMPORTED_MODULE_0__.openDB;
    }
    get idb_deleteDB() {
        return idb__WEBPACK_IMPORTED_MODULE_0__.deleteDB;
    }
    get idbInstance() {
        return idb__WEBPACK_IMPORTED_MODULE_0__;
    }
}
class IdbKeyValRef {
    get keyval_get() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.get;
    }
    get keyval_set() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.set;
    }
    get keyval_del() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.del;
    }
    get get() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.get;
    }
    get set() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.set;
    }
    get del() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.del;
    }
    get createStore() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.createStore;
    }
    get setMany() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.setMany;
    }
    get clear() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.clear;
    }
    get keys() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.keys;
    }
    get values() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.values;
    }
    get entries() {
        return idb_keyval__WEBPACK_IMPORTED_MODULE_1__.entries;
    }
}

