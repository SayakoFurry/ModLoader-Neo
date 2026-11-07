__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   SC2JsEvalContext: () => (/* binding */ SC2JsEvalContext)
/* harmony export */ });
class SC2JsEvalContext {
    constructor(gSC2DataManager) {
        this.gSC2DataManager = gSC2DataManager;
        this.contextSet = [];
    }
    /**
     * call by SugarCube2 `Story.storyInit()`
     */
    newContext(id) {
        const contextThis = {};
        const context = {
            contextThis,
        };
        this.contextSet.push(context);
        return context.contextThis;
    }
}

