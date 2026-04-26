# Ant Design 本地使用笔记

更新日期：2026-04-24
官方聚合文档本地副本：`E:\code\panda-main\docs\references\antd-llms-full-cn.txt`
官方来源：`https://ant.design/llms-full-cn.txt`

## 使用原则

- 优先按官方组件 API 使用，避免继续依赖已经废弃的旧属性。
- 优先通过 `ConfigProvider` 和组件 token 做主题与尺寸定制，不直接接管组件内部几何。
- 优先使用组件暴露的 `classNames`、`styles`、语义化插槽和官方变体能力，不直接硬改内部 DOM 结构。
- 需要全局反馈能力时，优先走 `App` 容器和 hook 方式，保证主题和上下文生效。
- 需要暗色主题时，优先通过主题算法、全局 token、组件 token 统一收口，不分散写第四套颜色体系。

## 当前项目写 AntD 代码时的约定

- 写 AntD 代码前，先看本文件；遇到具体组件 API 或边界行为，再查 `antd-llms-full-cn.txt`。
- 遇到控制类组件，例如 `Switch`、`Select`、`Dropdown`、`Popover`，优先保留官方交互与动效，不手工接管内部动画。
- 如需样式覆盖，优先写在项目宿主根类范围内，避免裸写全局 `.ant-*` 选择器污染全站。
- 新代码优先使用当前版本推荐写法，避免继续引入已弃用属性。

## 已知应优先采用的新写法

- `Card`：优先使用 `variant`，不要再使用已废弃的 `bordered`。
- `Select`：优先使用 `classNames.popup.root`，不要再使用已废弃的 `popupClassName`。
- 反馈类能力：优先使用 `App`、`message.useMessage`、`notification.useNotification`、`Modal.useModal` 等上下文安全写法。

## 重点理解

- Ant Design 的可定制能力核心在 token、组件 token、主题算法和 `ConfigProvider`。
- 组件的视觉和行为应该尽量建立在官方 API 与语义结构上，而不是依赖内部类名的偶然实现。
- 当项目需要保持既有视觉时，优先把 AntD 当作稳定的交互与可访问性底座，再用宿主样式做有限壳层适配。
