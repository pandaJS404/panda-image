# Panda

把代码变成精美的图片，让你的分享更加出彩。

## 🌟 项目介绍

我是一个基于 React 19 + Vite + Ant Design 构建的代码图片生成器。我可以将你的源代码转换为适合社交分享、文档配图、封面设计和演讲展示的精美图片。

![Panda 编辑器展示](readme-assets/hero-cover.png)

## ✨ 核心功能

### 🎨 丰富的主题系统

我提供了 30+ 内置代码主题，包括 Night Owl、Nord、One Dark、Synthwave 等流行配色方案。你可以轻松切换不同的视觉风格，找到最适合你代码的表达方式。

### 🖼️ 多样化背景

我支持多种背景样式：
- **渐变背景**：预设 20+ 精美渐变配色
- **图片背景**：内置多张精选背景图
- **纯色背景**：自定义任意颜色
- **毛玻璃效果**：为背景添加模糊效果

### 📝 强大的代码编辑器

基于 CodeMirror 的专业代码编辑体验：
- 支持 100+ 编程语言语法高亮
- 实时语法检测
- 支持拖拽上传代码文件
- 智能语言识别

### 🖥️ 窗口样式

我提供了多种窗口框架样式：
- Default - 经典圆角样式
- Sharp - 现代直角样式
- Boxy - 复古方正样式
- Black & White - 简约黑白风格
- None - 无边框纯代码展示

### 🖼️ 一键导出

支持导出多种格式：
- PNG（高清）
- JPG
- WebP（现代格式，体积小）
- SVG（矢量图，无损缩放）

![导出示例](readme-assets/export-sample.webp)

## 🚀 快速开始

### 在线体验

你可以直接访问在线预览版本：[Panda Image](https://pandajs404.github.io/panda-image)

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

### 环境要求

- Node.js >= 20.19.0
- pnpm >= 10.33.0

## 📷 预设画廊

我内置了多个精美预设模板，让你一键快速生成专业的代码图片：

![预设画廊](readme-assets/preset-gallery.png)

## 📸 导出效果展示

![导出效果1](readme-assets/export-sample1.webp)
![导出效果2](readme-assets/export-sample2.webp)
![导出效果3](readme-assets/export-sample3.webp)
![导出效果4](readme-assets/export-sample4.webp)
![导出效果5](readme-assets/export-sample5.webp)
![导出效果6](readme-assets/export-sample6.webp)

## 🛠️ 技术栈

- **React 19** - UI 框架
- **Vite** - 构建工具
- **Ant Design** - UI 组件库
- **CodeMirror** - 代码编辑器
- **Snapdom** - 图片导出引擎
- **Highlight.js** - 语法高亮

## 🔧 自定义配置

### 环境变量

| 变量名 | 用途 |
|--------|------|
| `VITE_BASE_PATH` | 部署基础路径，用于 GitHub Pages |
| `VITE_API_URL` | 前端使用的 API 地址 |
| `VITE_SITE_URL` | 站点完整 URL，用于生成元数据 |

## 📝 使用指南

1. **输入代码**：在编辑器中粘贴或输入你的代码
2. **选择主题**：从主题列表中选择喜欢的配色方案
3. **调整背景**：选择渐变、图片或纯色背景
4. **设置窗口**：选择窗口框架样式
5. **添加水印**：可选添加自定义水印
6. **导出图片**：选择格式和分辨率，一键导出

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

让代码成为艺术品 🎨✨