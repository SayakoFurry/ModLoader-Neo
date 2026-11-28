# packs/

一键安装器默认使用的两个 UI mod：

- `ModLoaderGui.mod.zip`：ModLoader 管理器后端（1.9.1），从测试用 Neo 0.5.12.13 构建中提取
- `ModLoaderNeoUI.mod.zip`：Neo 管理器界面（1.0.6），由本仓库 `theme/build-theme.cjs` 生成

这两个 zip 不是游戏本体，只用于注入用户自备的官方 HTML。版权归原 Mod 作者所有，使用时请遵循其原始许可；本仓库的 CC BY-NC-SA 4.0 不改变第三方 Mod 的授权。

如果要做完整的 26 个内置 mod 安装，把对应 zip 放进 `packs/builtin/`，再给一键安装器加 `-WithBuiltin`。
