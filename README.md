# ModLoader Neo

ModLoader Neo 是一个基于 ModLoader 的重建整理版，包含：

- 去掉 webpack `eval` 包装的加载器产物
- `compat` / `fast` / `slim` 三种裁剪档位
- Neo UI：分页、排序/启停卡片、日志导出、加载缓存清理、Mod 热重载、灯台控制
- 解析后的 Mod 数据缓存（IndexedDB，按 Mod zip hash 失效）
- 兼容 `ModLoader` 与 `ModLoader Neo` 两种 `dependenceInfo`

本仓库只包含加载器和构建脚本，您可以从我们的Packages下载我们构建好的Neo版本。

反馈与交流：QQ 群 **630879012**。遇到问题或有功能想法，欢迎加群反馈。

## Forge 式安装器（neo-install）[测试]

不再需要为每个 DoL 版本重新打包 60MB 全量 HTML。安装器读取用户自备的官方 `Degrees of Lewdity.html`，按版本表只做启动适配、注入 loader 与内置 mod，输出可直接运行的 HTML 和 manifest。游戏正文不重分发。

**组成**

- `neo-install.cjs`：安装器。探测版本 → 查 `versions/<版本>.json` → 适配 SugarCube 启动体 → 打游戏补丁 → 注入内置 mod 与 loader → 校验 → 写 manifest
- `neo-extract-loader.cjs`：从已构建的 Neo HTML 抽出 `dist/modloader-neo.slim.js`、`dist/i10n-sc2patch.js` 及 sidecar meta
- `versions/<gameVersion>.json`：版本的启动适配规则与补丁清单（相当于 Forge 的 binpatches）
- `versions/_generic.json`：未收录版本的兜底规范，依次尝试两种 SugarCube 启动布局
- `dist/modloader-neo.slim.js`：v1.0.6 加载器 bundle（约 2.46 MB）
- `dist/i10n-sc2patch.js`：`window.initI10n` 引擎补丁（约 6 KB，stock 启动链需要）
- `packs/ModLoaderGui.mod.zip`、`packs/ModLoaderNeoUI.mod.zip`：一键安装默认带上的两个 UI mod
- `一键安装.bat` + `install-oneclick.ps1`：Windows 一键入口
- `dist/NeoSetup-1.0.6.zip`：可直接分发的小型安装包（约 1.6 MB，不含游戏本体）

**两种输入**

- **官方 stock HTML**：SugarCube 的启动体原本在引擎脚本末尾直接执行，没有 `window.mainStart`。安装器把同一段启动体改成 `window.mainStart` 赋值，再挂上 `modSC2DataManager.startInit()` → `jsPreloader.startLoad()` → `mainStart()` 链；只改启动包装，不替换游戏引擎。随后注入 `i10n-sc2patch`，让 `initI10n(l10nStrings)` 可用。
- **已经带 Neo 的 HTML**：引擎里已有 `window.mainStart`，安装器跳过启动适配，只按版本补丁表补齐 hook，并替换/保留 loader 与 pack。

**Windows 一键安装**

1. 解压 `NeoSetup-1.0.6.zip`，双击 `一键安装.bat`。
2. 把官方 `Degrees of Lewdity.html` 拖到窗口，或按文件选择框选它；如果安装器目录里只有一个 `Degrees of Lewdity*.html`，会自动选中。
3. 安装器会自动识别版本，安装 loader + `ModLoaderGui` + `ModLoaderNeoUI`，输出到游戏目录并打开浏览器。
4. 输出文件名为 `Degrees of Lewdity [版本] Neo 1.0.6.html`；重复安装会自动加时间戳，不覆盖旧文件。

也可以从命令行调用：

```bat
一键安装.bat "E:\...\Degrees of Lewdity 0.5.13.8.html"

一键安装.bat "E:\...\Degrees of Lewdity 0.5.13.8.html" -WithBuiltin
```

`-WithBuiltin` 会把 `packs\builtin\*.zip` 一并注入；`-NoOpen` 不自动打开输出，`-NoPause` 不等待回车。运行前需要 Node.js 18+。

**命令行安装**

```bat
node neo-extract-loader.cjs --html "DoL-ModLoader-Neo-0.5.12.13-v1.0.6.html"

node neo-install.cjs --html "Degrees of Lewdity.html" --out "Degrees of Lewdity [0.5.13.8] Neo.html"

node neo-install.cjs --html "Degrees of Lewdity.html" ^
  --pack "packs\ModLoaderGui.mod.zip" --pack "packs\ModLoaderNeoUI.mod.zip" --out "...html"

node neo-install.cjs --html "Degrees of Lewdity.html" --dry-run --strict
```

**输出位置**

建议把生成的 HTML 放回官方游戏目录，与 `img/`、`style.css` 同级；或者安装图片包 mod。放到其他目录时，游戏会报 `drawImage` / 图片加载错误，但 loader 本身仍能启动。

**注入内容**

1. **engine boot adapter**（仅 stock）：保留原引擎，只把启动体移到 `window.mainStart`，并追加 loader 启动 hook
2. `<script id="i10n-sc2patch">`：定义 `window.initI10n`，没有它时会话链会在启动 hook 处报错
3. `<script id="neo-storage">`：给 ModLoader 的 localStorage / IndexedDB 键加本次构建的命名空间，避免旧旁加载 Mod 被自动加载
4. `<script id="neo-mod-pack">`：可选内置 mod，`window.modDataValueZipList` base64 zip 数组
5. `<script id="neo-loader">`：loader bundle，插在 `<script id="script-libraries">` 之前（BeforeSC2 位置）
6. 版本可选补丁：`importSave` / `importSettings` 空文件防护

**校验与限制**

- 只读输入文件，输出 HTML + `*.manifest.json`（base sha256、游戏/引擎版本、锚点、启动适配模式与引擎前后 hash、补丁状态、loader/pack/i10n hash）
- 安装后校验：前后缀完整、`script-libraries` 与 loader 各一次、`neo-storage` 各一次、引擎脚本各一次、`window.mainStart` hook 存在、`initI10n` 存在、版本号不变、pack 可解析
- 未收录版本走 `_generic.json`，manifest 标记 `verified=false`；两种启动布局都匹配不到时直接失败，不产出假可用包
- 当前未包含 APK 注入模式；`text-only` / `polyfill` 变体未单独验收

### 已知限制

- 本仓库不包含游戏 HTML、图片包、APK 和签名密钥；图片请通过图片包 Mod 提供
- 缓存保存的是每个 Mod 的解析结果，不是整份游戏剧情或最终合并结果
- TheHand 的固定 profile 依赖内部 `ModLoader =2.101.1`，不要随意改内部版本
- 验证覆盖桌面 WebView/CDP 和代表性 Android 环境，未覆盖所有设备、所有社区 Mod 组合和长期运行
- 直接通过 `modUtils.getMod("ModLoader Neo")` 查找实体 Mod 仍为空；兼容范围仅限 `dependenceInfo`

## 目录

```text
assets/                 字体等静态资源
src/                    加载器源码（extract.cjs 的本地覆盖源）
theme/                  Neo UI 源码
theme/inject.js         管理器界面增强
theme/gui-neo.css       管理器样式
theme/build-theme.cjs   生成 NeoUI 的 mod zip
tools/apk/              APK 重打包与签名工具
extract.cjs             从原始 HTML 提取并生成加载器 bundle
patch-html.cjs          将加载器 bundle 写回游戏 HTML
embed_mod.py            将 NeoUI mod zip 嵌入游戏 HTML
remove_mod.py           从游戏 HTML 移除指定 Mod
```

## 依赖

- Node.js 18+
- Python 3.10+
- JDK 17+（构建 APK 时需要；可通过 `JAVA_HOME` 指定）
- 原始 DoL ModLoader HTML：
  - `Degrees of Lewdity.html`
- 基础 APK：
  - `DoL-ModLoader-0.5.12.13-v2.101.1.APK`

## 构建流程

在仓库根目录执行。以下命令中的路径请替换成本机实际路径。

### 1. 生成加载器 bundle

```powershell
node extract.cjs --html "path/to/Degrees of Lewdity.html" --no-src
```

会生成：

- `dist/modloader-neo.js`（compat：保留全部模块和 core-js）
- `dist/modloader-neo.fast.js`（fast：移除 core-js，保留 Moment 语言包）
- `dist/modloader-neo.slim.js`（slim：移除 core-js，仅保留 zh-cn）
- `build-report.json`

> 重要：`src/` 是本地源码覆盖层。运行 `extract.cjs` 时请加 `--no-src`，否则会从原始 HTML 重新生成 `src/` 并覆盖本地修改。

### 2. 生成 Neo UI mod

```powershell
node theme/build-theme.cjs
```

会生成：

- `theme/dist/ModLoaderNeoUI.js`
- `dist/ModLoaderNeoUI.mod.zip`

### 3. 生成 Neo 游戏 HTML

```powershell
node patch-html.cjs --html "path/to/Degrees of Lewdity.html" --bundle dist/modloader-neo.slim.js --out "path/to/Degrees of Lewdity.neo.html"
```

将 Neo UI 嵌入 HTML：

```powershell
python embed_mod.py --html "path/to/Degrees of Lewdity.neo.html" --zip dist/ModLoaderNeoUI.mod.zip --name ModLoaderNeoUI
```

如果同时需要图片资源，将 `img` 目录放在 HTML 同级目录，或通过图片包 Mod 提供。

## Mod 解析缓存

加载器会把解析后的 Mod 数据写入 IndexedDB：

- 数据库：`ModLoaderNeoCache`
- 存储：`parsedModInfo`
- key：缓存版本 + 加载器版本 + Mod zip hash

缓存命中时跳过 `boot.json` 读取、脚本/样式/twee 解压和 `Twee2Passage` 解析。Mod zip 或加载器版本变化会自动失效。游戏日志页提供「清除加载缓存」按钮，也可以调用：

```js
window.modLoaderNeoCache.clear()
```

## 兼容说明

- 内部加载器版本保持 `2.101.1`，`ModLoader Neo v1.0.6` 是显示品牌
- TheHand 的固定 profile 依赖 `ModLoader =2.101.1`，不要随意改内部版本
- `dependenceInfo` 同时接受：
  - `ModLoader`
  - `ModLoader Neo`
  - `ModLoaderNeo`
  - `ModLoader-Neo`
- 直接通过 `modUtils.getMod("ModLoader Neo")` 查找实体 Mod 仍然返回空；依赖检查不在此限制内

## 许可与致谢

本项目基于 [Lyoko-Jeremie/sugarcube-2-ModLoader](https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader) 整理，加载器核心遵循上游 MIT 许可：

- `LICENSE`：MIT，Copyright (c) 2023 LyokoJeremie + Copyright (c) 2026 SayakoFurry（Neo 修改部分）
- `NOTICE.md`：上游来源、第三方库与游戏内容许可说明
- `CREDITS.md`：游戏汉化贡献者名单
- `LICENSE-DOL-CC-BY-NC-SA-4.0.txt`：游戏内容的 CC BY-NC-SA 4.0 许可，不适用于加载器代码

i18n 补丁锚点兼容逻辑改编自 [DoLLauncher](https://github.com/Dingdang255/DoLLauncher) 的 `patch-anchor.js`（MIT）。

本仓库不包含游戏 HTML、图片或 APK。预构建游戏包中的游戏内容遵循 CC BY-NC-SA 4.0，仅限非商业分发。请勿上传 `*.p12`、`*.jks`、APK、游戏 HTML 或图片资源到本仓库。
