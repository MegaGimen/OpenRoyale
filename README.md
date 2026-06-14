# OpenRoyale

这是一个基于 **TypeScript** 和 **Pixi.js (v8)** 构建的《皇室战争》网页克隆版游戏。

## 项目简介
项目实现了《皇室战争》的核心战场玩法，我们逆向分析了ClashRoyale的2017年的版本，并将其关键的动画组件、寻路组件进行了1v1的复刻

在线游玩（稳定）[Github Page](https://megagimen.github.io/OpenRoyale/)

在线游玩（beta）[OpenRoyale](https://llinker.com/OpenRoyale/)

## 启动方式

项目依赖 Node.js 环境，启动步骤如下：

### 1. 安装依赖
在项目根目录下执行：
```bash
npm install
```

### 2. 本地开发服务器启动
启动 Vite 开发服务器：
```bash
npm run dev
```
或通过以下命令强制指定主机和端口启动：
```bash
npx vite --host 0.0.0.0 --port 5174 --force
```

### 3. 项目打包与构建
编译 TypeScript 并构建生产环境包：
```bash
npm run build
```

构建完成后，可使用以下命令预览：
```bash
npm run preview
```

## to-do list

1. 增加动态背景支持（features/background）
2. 增加MCP支持
3. 增加建筑卡牌
4. 修复公主的火矢的显示错误
5. 增加单位声音
6. 增加单位的部署间隔
7. 增加单位被电时的stun

## 联系方式
如果您有任何问题或建议，欢迎通过以下邮箱联系我：
* **Email**: [llinkerllc@gmail.com](mailto:llinkerllc@gmail.com)
* **Wechat**: LambdaLinker
