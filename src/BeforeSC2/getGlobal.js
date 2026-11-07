__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getGlobal: () => (/* binding */ getGlobal)
/* harmony export */ });
var check = function (it) {
    return it && it.Math === Math && it;
};
// console.log('getGlobal()', [
//     typeof globalThis == 'object' && globalThis,
//     typeof window == 'object' && window,
//     typeof self == 'object' && self,
//     typeof global == 'object' && global,
// ]);
function getGlobal() {
    return check(typeof globalThis == 'object' && globalThis) ||
        check(typeof window == 'object' && window) ||
        check(typeof self == 'object' && self) ||
        check(typeof __webpack_require__.g == 'object' && __webpack_require__.g) ||
        (function () {
            // @ts-ignore
            return this;
            // @ts-ignore
        })() || this || Function('return this')();
}

