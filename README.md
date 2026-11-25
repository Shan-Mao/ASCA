# ASCA

一个静态站点，用来放各种自包含的「东西」：情景体验、小游戏、小工具。每个项目放在自己的文件夹里，互不引用、互不影响，可以单独打开，也可以整体搬走。

站点本身没有框架、没有构建步骤，只用一个 Node 内置模块写的静态服务器。

## 目录结构

```text
index.js                      # Node HTTP 静态服务入口
package.json                  # 启动与检查命令
public/                       # 唯一的静态根目录
├── index.html                # 首页：列出所有项目
├── index.css                 # 首页样式
├── assets/
│   └── favicon.svg
├── scenes/                   # 每一个项目一个文件夹
│   └── care-home/            # 情景：梅麓疗养院（滚动叙事）
│       ├── index.html
│       ├── styles.css
│       ├── app.js
│       └── media/            # 只属于这个情景的图片
└── template/                 # 空的情景骨架，复制它就能开新项目
    ├── index.html
    ├── styles.css
    └── app.js
```

### 为什么这样分

- **一个项目 = 一个文件夹**。一个项目需要的 HTML、CSS、JS、图片全部在自己的目录里，不改别处就能删掉或替换。
- **资源用相对路径**。所以 `scenes/care-home/` 整个目录复制出去也能单独运行。
- **服务器没有额外配置**。`/scenes/<名字>/` 会自动打开该目录的 `index.html`，新增项目不用改 `index.js`。

## 新增一个项目

1. 复制 `public/template/` 到 `public/scenes/<你的名字>/`。
2. 改里面的 `index.html` / `styles.css` / `app.js`，图片放进同级的 `media/`。
3. 在 `public/index.html` 的卡片列表里加一个链接：`./scenes/<你的名字>/`。
4. 刷新首页即可，`index.js` 不用动。

项目名建议只用小写字母、数字和连字符（例如 `care-home`、`memory-game`、`unit-converter`），服务器按这个规则识别 `/scenes/<名字>/`。

## 现有项目

### 梅麓疗养院 `scenes/care-home/`

绿色清新的园林式疗养院，越往下滚越不对劲。六个阶段：首屏、日常照护、玫瑰藤架、家属来信、夜间巡房、走廊终局。

- 首屏与中段只使用建筑与院区风景照片，没有人物照，也没有病床。
- 「打开花园灯」会切换院区小路照片的明暗。
- 家属来信之后进入夜间段落，含监控、假安全画面与贴近镜头的惊吓。
- 环境音必须手动开启；系统「降低动态效果」时关闭闪动与音效。

这是一个**虚构作品**，不提供任何真实医疗、护理或预约服务，也不收集个人信息。

## 本地运行

需要 Node.js 24，零第三方依赖、无构建：

```bash
npm start
```

- 首页：<http://localhost:25798/>
- 情景：<http://localhost:25798/scenes/care-home/>
- 模板：<http://localhost:25798/template/>

语法检查：

```bash
npm run check
```

## 入口、端口与部署

- 根入口 `index.js`；`npm start` 即 `node index.js`。
- Node `>=24 <25`；监听 `0.0.0.0`。
- 端口优先级：`SERVER_PORT` → `PORT` → `25798`。
- 部署到 Nodaroo：选 Node 24，`MAIN_FILE=index.js`，把 `index.js`、`package.json`、`public/` 放在同一层上传。
- 从 GitHub 拉取：配置 `GIT_ADDRESS` 与 `BRANCH`；公开仓库无需凭据。令牌只填在面板里，不要写进仓库。
- 静态根只有 `public`，项目根目录的其他文件不会对外暴露；`/health` 返回 JSON 状态。

## 图片来源

`scenes/care-home/media/` 内的照片来自 Unsplash，以及 Wikimedia Commons 的公有领域 / 知识共享素材。新增素材时请一并记录来源与许可。
