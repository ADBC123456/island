# Liquid Glass 材质设计规范

Date: 2026-07-06
Status: Reference spec — applies to the island UI on `feature/island-ui-polish`

本规范汇总 Apple Human Interface Guidelines Materials、SwiftUI Material 体系、WWDC 2025 Liquid Glass 以及 CSS 实现层面的实测值，作为本项目灵动岛 UI 材质与动效的实现依据。原始需求来自产品侧；参数来自联网检索（Apple 官方页面为 JS 渲染，本次环境未抓到正文，相关结论标注为复述；CSS 实现值来自 CSS-Tricks 实测）。

---

## 1. 设计目标

界面采用现代 Apple 风格的 Liquid Glass 材质——不是普通毛玻璃，而是一种轻盈、通透、会折射和塑造光线的动态玻璃材质。组件看起来像悬浮在内容上方的透明液态玻璃，边缘圆润，具有柔和高光、细腻阴影、折射感、环境光反射和轻微的液态流动感。

最终输出：Apple 风格、干净、克制、通透、有层级、可读性强的 Liquid Glass UI。**不要**做成廉价的透明卡片，**不要**过度模糊，**不要**高饱和霓虹，**不要**复杂花哨背景抢走内容注意力。

---

## 2. 材质厚度体系（来自 SwiftUI Material）

| Material | 模糊 | 不透明度 | Vibrancy | 用途 |
|---|---|---|---|---|
| `ultraThinMaterial` | 最轻 | 最透 | 最高 | 大面积、想让背景内容透出 |
| `thinMaterial` | 轻 | 低 | 高 | 同上，略增可读性 |
| `regularMaterial` | 中 | 中 | 中 | 通用控制层 |
| `thickMaterial` | 重 | 高 | 低 | 小面积、前景可读性优先 |
| `ultraThickMaterial` | 最重 | 最不透 | 最低 | Sheet、需要强可读性 |

**规律**：厚度↑ → 模糊↑、不透明度↑、vibrancy↓。明暗模式自动适配（浅色白底、深色黑底），前景文字通过 vibrancy 与材质混合保证对比度。

本项目映射：
- **灵动岛本体** → Regular 变体（`regularMaterial`，承载输入框/候选列表等文字密集内容，可读性优先）
- **命名规则 Tab / 类型选择器 / 候选卡** → Regular（`regularMaterial`，控制层）
- **状态反馈（success/error）** → Regular + 状态色描边光晕

---

## 3. Liquid Glass 视觉特征

### 3.1 核心特征
1. 半透明玻璃背景 + 背景模糊 + 轻微折射 + 柔和高光 + 内发光 + 边缘亮边
2. 真实层级感——像悬浮在内容上方，不是贴在背景上
3. 背景内容可隐约透过，但不影响文字和图标可读性
4. 根据背景明暗自动调整亮度、阴影、对比度和透明度
5. 大圆角、形状柔和连续，贴合 Apple 圆角语言
6. 交互时轻微放大、发亮、柔和液态反馈（按压弹性 + 流动感）
7. 出现/展开不生硬淡入淡出，而是自然变形、展开、融合

### 3.2 Regular vs Clear

| 维度 | Regular | Clear |
|---|---|---|
| 不透明度 | 稍磨砂 | 更透明 |
| 模糊 | 中等 | 更轻 |
| 适用 | 导航栏、Tab Bar、工具栏、按钮、菜单、侧边栏 | 小面积悬浮控件 |
| 前提条件 | 任何内容上方均可，可承载文字/图标/控件 | 必须同时满足：①下方是图片/视频/地图等媒体；②可接受给背景加轻微暗化层；③前景文字图标足够粗、足够亮、足够清晰 |
| 自适应性 | 自动适应背景、保持可读性、调整明暗阴影 | 不具备 Regular 的自动适应能力 |

**Clear 与 Regular 不混用。**

### 3.3 折射与高光
- **折射**：背景内容被轻微弯曲（CSS 无真折射，用 `backdrop-filter` 模糊 + 轻微色散近似）
- **动态高光**：随设备倾斜移动的镜面反射（本项目为桌面端，用静态径向高光 + 交互时偏移近似）
- **柔和斜边**：边缘 catch and redirect light（inset 高光 + 半透明描边）
- **软阴影**：分层下沉阴影，与背景分离

---

## 4. 使用规则

1. Liquid Glass 主要用于**控制层**：导航栏、标签栏、工具栏、悬浮按钮、菜单、弹窗、侧边栏
2. **不要**把主要内容区域全部做成玻璃，否则干扰阅读和信息层级
3. **避免玻璃叠玻璃**——不要在 Liquid Glass 上再放另一个 Liquid Glass
4. 玻璃上放按钮/文字/图标，使用**填充、透明度、vibrancy、亮色或暗色对比**，而不是再套一层玻璃
5. 色彩点缀**克制**——只给主要操作按钮或重要状态加颜色，不要所有控件都带强烈色彩
6. 必须保证文字、图标和按钮在浅色背景、深色背景、图片背景上都清晰可读
7. 支持辅助功能（见第 7 节）

---

## 5. 视觉参数参考

| 参数 | 值 |
|---|---|
| 背景模糊 | 中等到强，`blur(20–30px)`；深色可略增至 25px |
| 饱和度 | `saturate(150–200%)`，180% 强默认；深色降至 150% + 可选 `brightness(0.9)` |
| 透明度 | Regular 稍磨砂；Clear 更透明 |
| 圆角 | 大圆角；按钮可胶囊形（999px） |
| 阴影 | 柔和、扩散、轻微下沉；深色背景更克制，复杂背景更明显 |
| 高光 | 顶部/边缘细微白色高光，表现玻璃厚度 |
| 边框 | 1px 左右半透明亮边 |
| 内部光 | 轻微内发光，交互时增强 |
| 动画 | 150–300ms，ease-out / spring；点击轻微缩放 + 发光；菜单展开形状 morph |

### 5.1 具体实现值（来自 CSS-Tricks 实测）

- **底色**：斜向渐变模拟受光，亮边到透边
  - 浅色：`linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.15))`
  - 深色：`linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))`
- **边缘高光**：`inset 0 1px 1px rgba(255,255,255,0.4)` 顶边镜面线最重要 + `1px solid rgba(255,255,255,0.18)` 描边
- **镜面高光**：`radial-gradient(120% 80% at 30% 0%, rgba(255,255,255,0.25), transparent 50%)` 放左上
- **噪点**：SVG `feTurbulence` fractalNoise，opacity 0.02–0.05，避免纯 CSS 平面感
- **深色模式调整**：降低底色不透明度、降低 inset 高光、加深外阴影

---

## 6. 动效规范

### 6.1 弹簧参数（已在本项目落地）
- **Morph（胶囊形变）**：spring, stiffness 440, damping 33, mass 0.9 — 轻微过冲
- **Pop（内容进出）**：spring, stiffness 520, damping 32, mass 0.7 — 更紧
- **Tab 滑块**：spring, stiffness 500, damping 34, mass 0.7
- **候选卡 stagger**：spring 480/32/0.7，delay 每项 30ms，封顶 120ms

### 6.2 交互反馈
- **按压**：`whileTap` 轻微缩放 0.98 + 内发光增强
- **悬停**：背景/边框 120ms ease 过渡
- **展开**：形状 morph，不生硬淡入；内容用 scale + y 组合
- **成功/失败**：胶囊收缩 + 状态色描边光晕

### 6.3 仿灵动岛要点
- 胶囊形（compact 338×56，expanded 672×动态高度，success/error 392×60）
- 圆角 28/34/30
- 窗口先扩大、弹簧稳定后再收缩，避免动画中裁剪

---

## 7. 辅助功能

| 设置 | CSS 媒体查询 | 行为 |
|---|---|---|
| 降低透明度 | `@media (prefers-reduced-transparency: reduce)` | 玻璃更磨砂——提高不透明度、降低或移除模糊，接近实色 |
| 增强对比度 | `@media (prefers-contrast: more)` | 边框和文字更清晰——加强描边、提高文字不透明度 |
| 减少动态效果 | `@media (prefers-reduced-motion: reduce)` | 关闭弹性和流动动画——transition/animation 降至 0.01ms |

实现时三个分支都要写，且不影响默认状态的视觉。

---

## 8. 本项目映射清单

| 元素 | 变体 | 说明 |
|---|---|---|
| `.island-shell`（岛本体） | Regular | 承载输入框/候选列表等文字密集内容，可读性优先；悬浮感来自分层阴影 + 顶部高光 + 边缘亮边 |
| `.rule-tabs` / `.rule-tab-active` | Regular | 控制层，承载文字 |
| `.type-select` | Regular | 控制层 |
| `.candidate` | Regular | 候选卡，承载文字 + badge |
| `.candidate-badge.primary` | 状态色点缀 | 仅"首选"用琥珀色，其余中性 |
| `.status-toast` | Clear + 状态色光晕 | success 绿、error 红 |
| `.island-state-mark` | 状态色点缀 | 蓝点，唯一常驻色彩 |

### 8.1 色彩克制原则
- 常驻色彩只有 1 处：`island-state-mark` 蓝点
- 状态色 2 处：success 绿、error 红（仅在反馈态出现）
- 强调色 1 处：`candidate-badge.primary` 琥珀色（仅首选）
- 其余全部中性（label / secondaryLabel / tertiaryLabel 层级）

---

## 9. 性能约束

- `backdrop-filter` GPU 加速但大面积昂贵——玻璃面积要克制（本项目岛最大 672×~300，可接受）
- 隐藏时复位到 compact 尺寸，避免大透明矩形残留
- 鼠标穿透（`setIgnoreMouseEvents`）默认开启，光标在可见岛上时才捕获
- 后台节流（`backgroundThrottling: true`）、关闭拼写检查
- 降动态效果时关闭弹性动画，间接降 GPU 占用

---

## 10. 验收清单

- [ ] 岛本体 Regular 变体：稍磨砂、通透有度、有高光、有边缘亮边、悬浮感、文字清晰
- [ ] 控制层 Regular 变体：稍磨砂、文字清晰、不叠玻璃
- [ ] 浅色/深色背景上文字均清晰可读（文字 text-shadow + vibrancy 层级）
- [ ] 大圆角、胶囊形按钮
- [ ] 按压有弹性缩放 + 内发光增强
- [ ] 展开是 morph，不是淡入
- [ ] 色彩克制：只有 state-mark / primary badge / 状态反馈三处色彩
- [ ] `prefers-reduced-transparency` 分支：玻璃变磨砂实色
- [ ] `prefers-contrast: more` 分支：边框文字更清晰
- [ ] `prefers-reduced-motion` 分支：关闭弹性流动
- [ ] 无玻璃叠玻璃
- [ ] 无高饱和霓虹、无花哨背景

---

## 11. 资料来源

- Apple HIG — Materials: https://developer.apple.com/design/human-interface-guidelines/materials （页面正文未抓取，结论为模型基于 HIG 既有内容复述）
- Apple SwiftUI Material 文档: https://developer.apple.com/documentation/swiftui/material （同上）
- CSS-Tricks — backdrop-filter: https://css-tricks.com/backdrop-filter/ （实现值，已抓到正文）
- 产品侧原始需求：见本仓库 git 历史 `feature/island-ui-polish` 分支提交说明

> 注：Apple 官方页面为 JS 渲染，本次环境 WebFetch 未抓到正文；WWDC25 笔记、Wikipedia、9to5Mac 等第三方页面本次均 404 或证书错误。如需以更权威原文为准，可补充正文后更新本规范。
