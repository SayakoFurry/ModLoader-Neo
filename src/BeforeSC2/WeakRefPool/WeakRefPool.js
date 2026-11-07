__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   WeakPoolRef: () => (/* binding */ WeakPoolRef),
/* harmony export */   WeakRefPool: () => (/* binding */ WeakRefPool),
/* harmony export */   newWeakPoolRef: () => (/* binding */ newWeakPoolRef)
/* harmony export */ });
function newWeakPoolRef(v) {
    return new WeakPoolRef();
}
class WeakPoolRef {
    constructor(
    // parent: WeakRefPool<T>,
    ) {
        // this.deref = () => {
        //     return parent.pool.get(this);
        // }
    }
    get deref() {
        return instanceWeakRefPool.pool.get(this);
    }
}
class WeakRefPool {
    constructor() {
        this.pool = new WeakMap();
    }
}
let instanceWeakRefPool = new WeakRefPool();

