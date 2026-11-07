# ModLoader Neo

ModLoader Neo 是一个基于 ModLoader 的重建整理版，包含：

- 去掉 webpack `eval` 包装的加载器产物
- `compat` / `fast` / `slim` 三种裁剪档位
- Neo UI：分页、排序/启停卡片、日志导出、加载缓存清理
- 解析后的 Mod 数据缓存（IndexedDB，按 Mod zip hash 失效）
- 兼容 `ModLoader` 与 `ModLoader Neo` 两种 `dependenceInfo`
- v1 + v2 双签名 APK 构建脚本

本仓库只包含加载器和构建脚本，您可以从我们的Packages下载我们构建好的Neo版本。

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

### 4. 构建 APK

准备基础 APK 和签名密钥路径：

```powershell
$env:NEO_BASE_APK = "path/to/DoL-ModLoader-0.5.12.13-v2.101.1.APK"
$env:NEO_HTML = "path/to/Degrees of Lewdity.neo.html"
$env:NEO_OUT_APK = "path/to/ModLoader-Neo-v1.0.0.apk"
$env:NEO_KEYSTORE = "path/to/neo-signing.p12"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21.0.10"

python tools/apk/build-apk.py
python tools/apk/verify-apk.py "$env:NEO_OUT_APK"
```

如果 `NEO_KEYSTORE` 不存在，脚本会自动生成一个新密钥。该文件是私密文件，不要提交到 Git。

APK 会同时写入 v1 和 v2 签名，兼容需要 `META-INF` 开发者证书的 OEM 安装器。

## 构建档位

| 产物 | core-js | Moment 语言包 | 适用 |
| --- | --- | --- | --- |
| `compat` | 保留 | 全部 | 旧 WebView、最大兼容 |
| `fast` | 移除 | 全部 | 现代 WebView、多语言 |
| `slim` | 移除 | 仅 `zh-cn` | 现代 WebView、中文、体积最小 |

`patch-html.cjs` 默认使用 `slim`。如果使用非中文 Mod，建议改用 `fast`：

```powershell
node patch-html.cjs --html "path/to/Degrees of Lewdity.html" --bundle dist/modloader-neo.fast.js --out "path/to/Degrees of Lewdity.neo.html"
```

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

- 内部加载器版本保持 `2.101.1`，`ModLoader Neo v1.0.0` 是显示品牌
- TheHand 的固定 profile 依赖 `ModLoader =2.101.1`，不要随意改内部版本
- `dependenceInfo` 同时接受：
  - `ModLoader`
  - `ModLoader Neo`
  - `ModLoaderNeo`
  - `ModLoader-Neo`
- 直接通过 `modUtils.getMod("ModLoader Neo")` 查找实体 Mod 仍然返回空；依赖检查不在此限制内

## 许可与致谢

本项目基于 ModLoader 原始项目整理。许可证与致谢见：

- `LICENSE`
- `CREDITS.md`

请勿上传 `*.p12`、`*.jks`、APK、游戏 HTML 或图片资源到本仓库。
