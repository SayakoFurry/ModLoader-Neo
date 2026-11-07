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

