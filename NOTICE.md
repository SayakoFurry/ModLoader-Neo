# NOTICE / 第三方许可说明

本仓库的加载器核心来自 Lyoko-Jeremie 的 sugarcube-2-ModLoader，按 MIT 许可使用。

- 上游项目：https://github.com/Lyoko-Jeremie/sugarcube-2-ModLoader
- 版权：Copyright (c) 2023 LyokoJeremie
- 许可：MIT（见 `LICENSE`）

ModLoader Neo 的修改与新增部分：

- 版权：Copyright (c) 2026 SayakoFurry
- 许可：MIT（见 `LICENSE`）

## 其他 MIT 来源

- DoLLauncher 的 `patch-anchor.js` 兼容逻辑：https://github.com/Dingdang255/DoLLauncher ，MIT。

## 打包进 dist 的第三方库

`dist/modloader-neo.slim.js` 是构建产物，包含多个第三方 JavaScript 库，例如：

- core-js：Copyright (c) 2019 Denis Pushkarev，MIT
- JSZip：Dual licensed under MIT or GPLv3
- pako：MIT
- Lodash：Copyright OpenJS Foundation and other contributors，MIT
- Moment.js：MIT

这些库保留其各自版权与许可。分发时请保留 bundle 内的版权注释，并以各自项目的 LICENSE 为准。

## 关于上游 LICENSE2

上游仓库另附 `LICENSE2.txt`，其文本仅针对无法遵守 MIT（LICENSE1）的主体，属于后备协议。本仓库按 MIT 合规使用，因此不适用 LICENSE2。

## 游戏内容

本仓库不包含 Degrees of Lewdity 的游戏 HTML、图片或 APK。仓库内的 `LICENSE-DOL-CC-BY-NC-SA-4.0.txt` 是游戏内容的许可证说明，不是加载器代码的许可证。预构建的游戏包包含游戏内容，遵循原作及其汉化项目的 CC BY-NC-SA 4.0：署名、非商业、相同方式共享。
