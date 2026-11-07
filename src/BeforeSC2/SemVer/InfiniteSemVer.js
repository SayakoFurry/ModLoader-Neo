__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BoundaryOperatorList: () => (/* binding */ BoundaryOperatorList),
/* harmony export */   SemVerToolsType: () => (/* binding */ SemVerToolsType),
/* harmony export */   compareInfiniteVersions: () => (/* binding */ compareInfiniteVersions),
/* harmony export */   compareString: () => (/* binding */ compareString),
/* harmony export */   isWithinRange: () => (/* binding */ isWithinRange),
/* harmony export */   parseInfiniteSemVer: () => (/* binding */ parseInfiniteSemVer),
/* harmony export */   parseRange: () => (/* binding */ parseRange),
/* harmony export */   parseVersion: () => (/* binding */ parseVersion),
/* harmony export */   parseVersionRange: () => (/* binding */ parseVersionRange),
/* harmony export */   satisfies: () => (/* binding */ satisfies)
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);

const BoundaryOperatorList = [
    // long po first
    '>=', '<=', '>', '<', '=', '^', undefined,
];
function isCharNumber(c) {
    return typeof c === 'string' && c.length == 1 && c >= '0' && c <= '9';
}
function parseInfiniteSemVer(versionStr) {
    // console.log('parseInfiniteSemVer()', versionStr);
    versionStr = versionStr.trim();
    let bo = undefined;
    const bb = BoundaryOperatorList.filter((T) => !!T).find(op => versionStr.startsWith(op));
    if (bb) {
        bo = versionStr.substring(0, bb.length);
        versionStr = versionStr.substring(bb.length);
        bo = bb;
    }
    if (versionStr.length === 0 || !isCharNumber(versionStr[0])) {
        console.error('parseInfiniteSemVer() invalid versionStr', [versionStr, bb, bo]);
        return {
            version: {
                version: [],
                preRelease: undefined,
                buildMetadata: undefined,
            },
            operator: bo,
        };
    }
    versionStr = versionStr.trim();
    // format: 1.0.0-preRelease+buildMetadata
    // preRelease: 1.0.0-alpha
    let sp1 = versionStr.indexOf('-');
    sp1 = sp1 === -1 ? versionStr.length : sp1;
    // buildMetadata: 1.0.0+exp.sha.5114f85
    let sp2 = versionStr.indexOf('+');
    sp2 = sp2 === -1 ? versionStr.length : sp2;
    const sp = Math.min(sp1, sp2);
    const parts = versionStr.substring(0, sp).split('.');
    const version = [];
    for (const part of parts) {
        const num = parseInt(part, 10);
        if (isNaN(num) || num < 0) {
            // return null;
            break;
        }
        version.push(num);
    }
    if (version.length === 0) {
        version.push(0);
    }
    return {
        version: {
            version: version,
            preRelease: (sp1 < sp2 && sp1 < versionStr.length) ? versionStr.substring(sp1 + 1, sp2 - (sp1 + 1)) : undefined,
            buildMetadata: sp2 < versionStr.length ? versionStr.substring(sp2 + 1) : undefined,
        },
        operator: bo,
    };
}
function compareString(a, b) {
    return a.localeCompare(b);
}
function compareInfiniteVersions(a, b, ignorePostfix = false) {
    const maxLength = Math.max(a.version.length, b.version.length);
    for (let i = 0; i < maxLength; i++) {
        const aValue = i < a.version.length ? a.version[i] : 0;
        const bValue = i < b.version.length ? b.version[i] : 0;
        if (aValue !== bValue) {
            return aValue - bValue;
        }
    }
    if (ignorePostfix) {
        return 0;
    }
    if (a.preRelease && b.preRelease) {
        return compareString(a.preRelease, b.preRelease);
    }
    if (a.preRelease && (0,lodash__WEBPACK_IMPORTED_MODULE_0__.isNil)(b.preRelease)) {
        return -1;
    }
    if ((0,lodash__WEBPACK_IMPORTED_MODULE_0__.isNil)(a.preRelease) && b.preRelease) {
        return 1;
    }
    if (a.buildMetadata && b.buildMetadata) {
        return compareString(a.buildMetadata, b.buildMetadata);
    }
    if (a.buildMetadata && (0,lodash__WEBPACK_IMPORTED_MODULE_0__.isNil)(b.buildMetadata)) {
        return -1;
    }
    if ((0,lodash__WEBPACK_IMPORTED_MODULE_0__.isNil)(a.buildMetadata) && b.buildMetadata) {
        return 1;
    }
    return 0;
}
function parseVersionRange(rangeStr) {
    const rangeSets = rangeStr.split(/\s*\|\|\s*/)
        .map(setStr => parseVersionBoundarySet(setStr))
        .filter((T) => !!T);
    if (rangeSets.length === 0) {
        return [];
    }
    return rangeSets;
}
function parseVersionBoundarySet(setStr) {
    const boundaries = setStr.split(/\s*&&\s*/);
    if (boundaries.length === 0 || boundaries.length > 2) {
        return null;
    }
    const boundarySet = {};
    for (const boundaryStr of boundaries) {
        const boundary = parseInfiniteSemVer(boundaryStr);
        if (boundary.version.version.length === 0) {
            return null;
        }
        switch (boundary.operator) {
            case '>':
            case '>=':
                if (boundarySet.lower) {
                    return null;
                }
                boundarySet.lower = boundary;
                break;
            case '<':
            case '<=':
                if (boundarySet.upper) {
                    return null;
                }
                boundarySet.upper = boundary;
                break;
            case '^':
                {
                    if (boundarySet.lower || boundarySet.upper) {
                        return null;
                    }
                    boundarySet.lower = { version: boundary.version, operator: '>=' };
                    if (boundary.version.version[0] === 0) {
                        const c1 = boundary.version.version.length >= 2 ? boundary.version.version[1] + 1 : 1;
                        boundarySet.upper = { version: { version: [0, c1] }, operator: '<' };
                    }
                    else if (boundary.version.version[0] > 0) {
                        const c0 = boundary.version.version[0] + 1;
                        boundarySet.upper = { version: { version: [c0] }, operator: '<' };
                    }
                }
                break;
            case '=':
            case undefined:
                if (boundarySet.lower || boundarySet.upper) {
                    return null;
                }
                boundarySet.lower = { version: boundary.version, operator: '>=' };
                boundarySet.upper = { version: boundary.version, operator: '<=' };
                break;
        }
    }
    return boundarySet;
}
function isWithinRange(version, range, ignorePostfix = false) {
    for (const boundarySet of range) {
        let isWithinBoundarySet = true;
        if (boundarySet.lower) {
            const comparison = compareInfiniteVersions(version, boundarySet.lower.version, ignorePostfix);
            // console.log('comparison lower', [comparison, version, boundarySet.lower.version]);
            switch (boundarySet.lower.operator) {
                case '>':
                    if (comparison <= 0)
                        isWithinBoundarySet = false;
                    break;
                case '>=':
                    if (comparison < 0)
                        isWithinBoundarySet = false;
                    break;
            }
        }
        if (boundarySet.upper) {
            const comparison = compareInfiniteVersions(version, boundarySet.upper.version, ignorePostfix);
            // console.log('comparison upper', [comparison, version, boundarySet.upper.version]);
            switch (boundarySet.upper.operator) {
                case '<':
                    if (comparison >= 0)
                        isWithinBoundarySet = false;
                    break;
                case '<=':
                    if (comparison > 0)
                        isWithinBoundarySet = false;
                    break;
            }
        }
        if (isWithinBoundarySet) {
            return true; // 如果版本在任何范围集内，则返回 true
        }
    }
    return false;
}
const parseRange = parseVersionRange;
const parseVersion = parseInfiniteSemVer;
const satisfies = isWithinRange;
class SemVerToolsType {
    constructor() {
        this.parseRange = parseVersionRange;
        this.parseVersion = parseInfiniteSemVer;
        this.satisfies = isWithinRange;
    }
}

