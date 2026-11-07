__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LanguageManager: () => (/* binding */ LanguageManager),
/* harmony export */   MainLanguageTypeEnum: () => (/* binding */ MainLanguageTypeEnum)
/* harmony export */ });
const MainLanguageTypeEnum = [
    'en',
    'zh',
];
class LanguageManager {
    constructor(thisWin, gSC2DataManager) {
        this.thisWin = thisWin;
        this.gSC2DataManager = gSC2DataManager;
        this.mainLanguage = "en";
        this.logger = gSC2DataManager.getModUtils().getLogger();
    }
    /**
     * https://developer.mozilla.org/zh-CN/docs/Web/API/Navigator/language
     * https://www.rfc-editor.org/rfc/bcp/bcp47.txt
     * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
     *
     * @return https://stackoverflow.com/questions/5580876/navigator-language-list-of-all-languages
     */
    getLanguage() {
        const w = this.thisWin;
        return w.navigator.language;
    }
}

