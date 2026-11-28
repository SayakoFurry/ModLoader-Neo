# versions/ 版本补丁表

每个 DoL 版本对应一个 `<gameVersion>.json`，结构相当于 Forge 的 binpatches + 版本 JSON。
没有专属文件的版本回退到 `_generic.json`，安装结果会在 manifest 里标记 `verified=false`。

## 字段

| 字段 | 说明 |
| --- | --- |
| `gameVersion` | 游戏版本，与 HTML 里的 `version: "x.y.z"` 对应 |
| `versionName` | 版本代号（如 Abyssal），仅记录 |
| `engineVersion` | `tw-storydata` 的 `format-version`，当前为 2.36.1 |
| `verified` | 是否做过启动回归（官方 stock，或等价的拆解 → 重装 roundtrip）；`_generic.json` 恒为 false |
| `loader.minNeoVersion` | 最低可用 loading 版本 |
| `integrate` | SugarCube 启动体适配规则；stock 必需，Neo 构建可省略 |
| `patches[]` | 按顺序应用的文本补丁 |

`integrate` 字段：

| 字段 | 说明 |
| --- | --- |
| `mode` | `stock-boot`：只接受 stock 启动体；`auto`：有 `window.mainStart` 就跳过，否则按 patterns 适配；`none`：不适配 |
| `patterns[]` | `sc2-minified`：`jQuery((()=>{try{const lockId=...}}))` 布局；`sc2-pretty`：`jQuery(() => {...});` 未压缩布局 |
| `note` | 记录该版本的启动结构说明 |

安装器只会**改写启动包装**：把原启动体变成 `window.mainStart` 赋值，并在其后追加 `modSC2DataManager.startInit()` 链；不会替换整个 SugarCube 引擎。stock 还会注入 `dist/i10n-sc2patch.js`，否则 `initI10n(l10nStrings)` 不存在。

补丁字段：

- `id`：唯一名，写入 manifest
- `required`：true 时找不到锚点直接中止安装
- `unique`：默认 true，锚点必须唯一命中
- `find` / `replace`：精确字符串替换（区分空白）
- `already`：幂等标记；已存在时跳过
- `revertFind` / `revertReplace`：可选，供回归测试或卸载时还原

## 新增版本

1. 对官方 HTML 跑 `--dry-run`，确认探测到的版本、引擎与启动布局
2. 复制 `_generic.json` 为 `<版本>.json`，改 `gameVersion` / `engineVersion` / `verified:false`
3. 先确认 `integrate.patterns` 命中：0.5.13.8 这类压缩引擎用 `sc2-minified`，0.5.0.6 这类未压缩引擎用 `sc2-pretty`
4. 核对 `boot-hook-modloader` 的 `find` 是否仍唯一；stock 适配后 hook 已存在，补丁应命中 `already`
5. 安装后做启动冒烟（Start 场景 + Mod 列表），通过后把 `verified` 改为 true，并在 `testedWith` 记下 loader 版本
6. 若新增可选修复，追加到 `patches`，`required:false` 并保留 `already`
