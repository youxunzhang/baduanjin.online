# 数独库微信小游戏（排查“还是打飞机”）

如果你在微信开发者工具里看到的是“打飞机”模板，而不是数独界面，通常不是代码没更新，而是**项目打开方式不对**。

## 正确打开方式

1. 在微信开发者工具里选择“导入项目”。
2. 项目目录请选择仓库根目录（包含 `project.config.json` 的目录），不要选 `minigame/` 子目录。
3. 确认 `project.config.json` 中：
   - `compileType` 是 `game`
   - `gameRoot` / `minigameRoot` 都是 `minigame/`
4. 清缓存后重新编译：`工具 -> 清除缓存 -> 全部清除`，再点击“编译”。

## 为什么会看到“打飞机”

当你把错误目录导入为小游戏项目（例如直接导入 `minigame/` 或其他临时目录）时，开发者工具可能继续运行它自己的模板工程（常见就是“打飞机”）。

## 当前工程的小游戏入口

- 小游戏脚本入口：`minigame/game.js`
- 小游戏配置：`minigame/game.json`
- 工程配置：`project.config.json`

另外，仓库根目录也提供了兼容入口：

- `game.js`（转发到 `minigame/game.js`）
- `game.json`（与 `minigame/game.json` 保持一致）

这是为了兼容部分版本开发者工具在自动预览时只查找根目录 `game.json` 的行为。

只要按上面的方式导入，运行出来应该是“数独库小游戏”，不是“打飞机”。

## 常见报错：`game.json: 未找到 game.json 文件，或者文件读取失败`

如果你遇到截图中的报错（通常在“编译并自动调试 / 自动真机调试”时触发），按下面顺序排查：

1. **先确认导入目录是仓库根目录**（不是 `minigame/` 子目录）。
2. 打开 `project.config.json`，确认：
   - `compileType` = `game`
   - `gameRoot` = `minigame/`
   - `minigameRoot` = `minigame/`
3. 在微信开发者工具执行：`工具 -> 清除缓存 -> 全部清除`，然后重新“编译”。
4. 如果仍报错，关闭开发者工具后，删除项目目录下本地私有配置（若存在）再重开：
   - `project.private.config.json`
   - `.idea/`（如果你用过 IDE 插件生成过工程配置）
5. 切换到**普通预览/模拟器编译**先验证小游戏能正常启动，再尝试“自动真机调试”。

> 说明：`project.private.config.json` 里的本地覆盖配置可能把 `gameRoot` 指向了错误目录，导致工具在错误位置查找 `game.json`。
