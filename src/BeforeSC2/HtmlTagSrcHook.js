__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   HtmlTagSrcHook: () => (/* binding */ HtmlTagSrcHook)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);

/**
 * this class replace html image tag src/href attribute ,
 * redirect the image request to a mod like `ImgLoaderHooker` to load the image.
 */
class HtmlTagSrcHook {
    constructor(gSC2DataManager) {
        this.gSC2DataManager = gSC2DataManager;
        this.hookTable = new Map();
        this.hookReturnModeTable = new Map();
        this.hookCheckExistTable = new Map();
        this.logger = gSC2DataManager.getModUtils().getLogger();
    }
    addHook(hookKey, hook) {
        if (this.hookTable.has(hookKey)) {
            console.error(`[HtmlTagSrcHook] addHook: hookKey already exist!`, [hookKey, hook]);
            this.logger.error(`[HtmlTagSrcHook] addHook: hookKey[${hookKey}] already exist!`);
        }
        this.hookTable.set(hookKey, hook);
    }
    addReturnModeHook(hookKey, hook) {
        if (this.hookReturnModeTable.has(hookKey)) {
            console.error(`[HtmlTagSrcHook] addReturnModeHook: hookKey already exist!`, [hookKey, hook]);
            this.logger.error(`[HtmlTagSrcHook] addReturnModeHook: hookKey[${hookKey}] already exist!`);
        }
        this.hookReturnModeTable.set(hookKey, hook);
    }
    addCheckExistHook(hookKey, hook) {
        if (this.hookCheckExistTable.has(hookKey)) {
            console.error(`[HtmlTagSrcHook] addCheckExistHook: hookKey already exist!`, [hookKey, hook]);
            this.logger.error(`[HtmlTagSrcHook] addCheckExistHook: hookKey[${hookKey}] already exist!`);
        }
        this.hookCheckExistTable.set(hookKey, hook);
    }
    /**
     * check image exist
     *
     * @param src
     * @return true: exist ; false: not exist ; undefined: not exist but not sure (maybe exist but now not find.);
     */
    checkImageExist(src) {
        // console.log('[HtmlTagSrcHook] checkImageExist: handing src', [src]);
        if (!src || !(0,lodash__WEBPACK_IMPORTED_MODULE_0__.isString)(src) || src.length === 0) {
            console.error(`[HtmlTagSrcHook] checkImageExist: no src`, [src]);
            this.logger.error(`[HtmlTagSrcHook] checkImageExist: no src [${src}]`);
            return undefined;
        }
        if (src.startsWith('data:')) {
            // skip data URI
            return true;
        }
        // call hook to find a mod hook to handle the image
        let maybeExist = false;
        for (const [hookKey, hook] of this.hookCheckExistTable) {
            try {
                const r = hook(src);
                switch (r) {
                    case true:
                        // find it
                        return true;
                    case false:
                        // not find
                        continue;
                    case undefined:
                        // not sure
                        maybeExist = true;
                    default:
                        continue;
                }
            }
            catch (e) {
                console.error(`[HtmlTagSrcHook] checkImageExist: call hookKey error`, [hookKey, hook, e]);
                this.logger.error(`[HtmlTagSrcHook] checkImageExist: call hookKey[${hookKey}] error [${(e === null || e === void 0 ? void 0 : e.message) ? e.message : e}]`);
            }
        }
        return maybeExist ? undefined : false;
    }
    // /**
    //  * usually called by sc2 hook
    //  *
    //  * @example:
    //  * @code
    //  * ```js
    //  *      window.modSC2DataManager?.getHtmlTagSrcHook?.()?.fastWrapHtmlImageElement?.(node);
    //  * ```
    //  */
    // public async fastWrapHtmlImageElement(el: HTMLImageElement | HTMLElement, field: string = 'src') {
    //     try {
    //         console.log(`[HtmlTagSrcHook] fastWrapHtmlImageElement: el`, el);
    //
    //         let mlSrc = el.getAttribute(`ML-${field}`);
    //         if (mlSrc) {
    //             // skip
    //             return false;
    //         }
    //
    //         let src = el.getAttribute(field);
    //         if (!src) {
    //             // bad
    //             return false;
    //         } else if (src.startsWith('data:')) {
    //             // skip
    //             return true;
    //         }
    //         // init
    //         mlSrc = src;
    //         el.setAttribute(`ML-${field}`, src);
    //         el.removeAttribute(field);
    //
    //         // call hook to find a mod hook to handle the element
    //         // if all mod cannot handle, don't change the element and return false
    //         for (const [hookKey, hook] of this.hookReturnModeTable) {
    //             try {
    //                 const r = await hook(mlSrc);
    //                 if (r[0]) {
    //                     el.setAttribute(field, r[1]);
    //                     return true;
    //                 }
    //             } catch (e: Error | any) {
    //                 console.error(`[HtmlTagSrcHook] fastWrapHtmlImageElement: call hookKey error`, [hookKey, hook, e]);
    //                 this.logger.error(`[HtmlTagSrcHook] fastWrapHtmlImageElement: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
    //             }
    //         }
    //         // console.log('[HtmlTagSrcHook] doHook: cannot handing on hookReturnModeTable of the element', [el, el.outerHTML]);
    //         for (const [hookKey, hook] of this.hookTable) {
    //             try {
    //                 if (await hook(el, mlSrc, field)) {
    //                     return true;
    //                 }
    //             } catch (e: Error | any) {
    //                 console.error(`[HtmlTagSrcHook] fastWrapHtmlImageElement: call hookKey error`, [hookKey, hook, e]);
    //                 this.logger.error(`[HtmlTagSrcHook] fastWrapHtmlImageElement: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
    //             }
    //         }
    //
    //         // console.log('[HtmlTagSrcHook] fastWrapHtmlImageElement: cannot handing on hookTable of the element', [el, el.outerHTML]);
    //         // console.log('[HtmlTagSrcHook] fastWrapHtmlImageElement: cannot handing the element', [el, el.outerHTML]);
    //         el.setAttribute(`ML-${field}_replace_failed`, '1');
    //         // if no one can handle the element, do the default action
    //         // recover the [field]
    //         el.setAttribute(field, mlSrc);
    //         return false;
    //
    //     } catch (e) {
    //         console.error('[HtmlTagSrcHook] fastWrapHtmlImageElement Error:', [e, el, el.outerHTML]);
    //         return false;
    //     }
    // }
    //
    // /**
    //  * covert HtmlElement to use image from mod
    //  *
    //  * @example:
    //  * @code
    //  * ```typescript
    //  * const node = document.createElement('img');
    //  * node.src = 'xxx/xxx/xxx.png';
    //  * if (node.tagName.toLowerCase() === 'img' && !node.getAttribute('src')?.startsWith('data:')) {
    //  *     // need check the src is not "data:" URI
    //  *     node.setAttribute('ML-src', node.getAttribute('src')!);
    //  *     node.removeAttribute('src');
    //  *     window.modSC2DataManager.getHtmlTagSrcHook().doHook(node).catch(E => console.error(E));
    //  * }
    //  * ```
    //  */
    // public async doHook(el: HTMLImageElement | HTMLElement, field: string = 'src'): Promise<boolean> {
    //     // console.log('[HtmlTagSrcHook] doHook: handing the element', [el, el.outerHTML]);
    //     const mlSrc = el.getAttribute(`ML-${field}`);
    //     if (!mlSrc) {
    //         console.error(`[HtmlTagSrcHook] doHook: no ML-${field}`, [el, el.outerHTML]);
    //         this.logger.error(`[HtmlTagSrcHook] doHook: no ML-${field} [${el.outerHTML}]`);
    //         return false;
    //     }
    //     // console.warn('[HtmlTagSrcHook] doHook: ML-src found, start to process it', [el, el.outerHTML]);
    //     // call hook to find a mod hook to handle the element
    //     // if all mod cannot handle, don't change the element and return false
    //     for (const [hookKey, hook] of this.hookReturnModeTable) {
    //         try {
    //             const r = await hook(mlSrc);
    //             if (r[0]) {
    //                 el.setAttribute(field, r[1]);
    //                 return true;
    //             }
    //         } catch (e: Error | any) {
    //             console.error(`[HtmlTagSrcHook] doHookCallback: call hookKey error`, [hookKey, hook, e]);
    //             this.logger.error(`[HtmlTagSrcHook] doHookCallback: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
    //         }
    //     }
    //     // console.log('[HtmlTagSrcHook] doHook: cannot handing on hookReturnModeTable of the element', [el, el.outerHTML]);
    //     for (const [hookKey, hook] of this.hookTable) {
    //         try {
    //             if (await hook(el, mlSrc, field)) {
    //                 return true;
    //             }
    //         } catch (e: Error | any) {
    //             console.error(`[HtmlTagSrcHook] doHook: call hookKey error`, [hookKey, hook, e]);
    //             this.logger.error(`[HtmlTagSrcHook] doHook: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
    //         }
    //     }
    //     // console.log('[HtmlTagSrcHook] doHook: cannot handing on hookTable of the element', [el, el.outerHTML]);
    //     // console.log('[HtmlTagSrcHook] doHook: cannot handing the element', [el, el.outerHTML]);
    //     el.setAttribute('ML-src_replace_failed', '1');
    //     // if no one can handle the element, do the default action
    //     // recover the [field]
    //     el.setAttribute(field, mlSrc);
    //     return false;
    // }
    //
    // public async doHookCallback(src: string, callback: (src: string) => any): Promise<[boolean, any]> {
    //     // console.log('[HtmlTagSrcHook] doHookCallback: handing src', [src]);
    //     if (!src) {
    //         console.error(`[HtmlTagSrcHook] doHookCallback: no src`, [src]);
    //         this.logger.error(`[HtmlTagSrcHook] doHookCallback: no src [${src}]`);
    //         return [false, await callback(src)];
    //     }
    //     // call hook to find a mod hook to handle the element
    //     // if all mod cannot handle, don't change the element and return false
    //     for (const [hookKey, hook] of this.hookReturnModeTable) {
    //         try {
    //             const r = await hook(src);
    //             if (r[0]) {
    //                 return [true, await callback(r[1])];
    //             }
    //         } catch (e: Error | any) {
    //             console.error(`[HtmlTagSrcHook] doHookCallback: call hookKey error`, [hookKey, hook, e]);
    //             this.logger.error(`[HtmlTagSrcHook] doHookCallback: call hookKey[${hookKey}] error [${e?.message ? e.message : e}]`);
    //         }
    //     }
    //     // if no one can handle the element, do the default action
    //     // recover the [field]
    //     return [false, await callback(src)];
    // }
    /**
     * get image from mod
     * @param src  image path
     * @return image base64 string
     */
    async requestImageBySrc(src) {
        // console.log('[HtmlTagSrcHook] requestImageBySrc: handing src', [src]);
        if (!src) {
            console.error(`[HtmlTagSrcHook] requestImageBySrc: no src`, [src]);
            this.logger.error(`[HtmlTagSrcHook] requestImageBySrc: no src [${src}]`);
            return undefined;
        }
        src = this.normalizePath(src);
        // call hook to find a mod hook to handle the image
        for (const [hookKey, hook] of this.hookReturnModeTable) {
            try {
                const r = await hook(src);
                if (r[0]) {
                    return r[1];
                }
            }
            catch (e) {
                console.error(`[HtmlTagSrcHook] requestImageBySrc: call hookKey error`, [hookKey, hook, e]);
                this.logger.error(`[HtmlTagSrcHook] requestImageBySrc: call hookKey[${hookKey}] error [${(e === null || e === void 0 ? void 0 : e.message) ? e.message : e}]`);
            }
        }
        // if no one can handle the element, do the default action
        return undefined;
    }
    /**
     * 归一化路径为相对路径格式
     * @param path 待归一化的路径
     * @returns 归一化后的相对路径（去除前导 / 和 ./）
     */
    normalizePath(path) {
        if (!path)
            return path;
        // 分割路径并过滤空段和单点
        const segments = path.split('/').filter(segment => segment && segment !== '.');
        // 处理 .. 符号
        const normalized = [];
        for (const segment of segments) {
            if (segment === '..') {
                // 回退一级（如果可能）
                if (normalized.length > 0) {
                    normalized.pop();
                }
            }
            else {
                normalized.push(segment);
            }
        }
        // 返回相对路径（不带前导斜杠）
        return normalized.join('/');
    }
}

