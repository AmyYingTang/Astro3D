# Astrophotography Visualization - 技术决策记录 (ADR)

## 项目概述
一个基于React Three Fiber的天体可视化项目，用于展示南半球可观测的深空天体，包括其RA/DEC坐标、距离、图像等信息。

---

## 决策记录

### ADR-001: InfoPanel的Hover交互机制

**日期**: 2024  
**状态**: ✅ 已实施

#### 问题
当用户hover到天体对象（图像或文字）时显示InfoPanel，但遇到以下问题：
1. Panel出现后立即闪烁消失
2. 多个Panel重叠时点击失效
3. 影响了场景的右键拖动平移功能

#### 决策
使用**双状态 + 延迟检查**机制：

```javascript
const [hovered, setHovered] = useState(false);        // 控制Panel显示
const [isPanelHovered, setIsPanelHovered] = useState(false);  // 追踪Panel自身的hover状态
const leaveTimeoutRef = useRef(null);
```

#### 理由

**为什么需要两个状态？**
- `hovered`: 控制Panel是否渲染
- `isPanelHovered`: 记住鼠标是否在Panel上
- 原因：鼠标从对象移动到Panel的过程中，会短暂离开对象触发区域

**为什么需要延迟？**
```javascript
const handleObjectLeave = () => {
  leaveTimeoutRef.current = setTimeout(() => {
    if (!isPanelHovered) {  // 延迟后检查，给用户时间移到Panel上
      setHovered(false);
    }
  }, 150);  // 150ms是平衡值：足够用户移动鼠标，又不会感觉迟钝
};
```

**为什么不用更简单的方案？**
- ❌ 单个状态：无法知道鼠标是否已经移到Panel上
- ❌ 立即隐藏：用户无法移动鼠标到Panel
- ❌ 只在Panel上保持：对象和Panel之间有间隙会导致闪烁

#### 后果
- ✅ 平滑的hover体验
- ✅ 用户可以从对象移到Panel而不闪烁
- ⚠️ 需要仔细管理timeout清理，避免内存泄漏

#### 代码模式
```javascript
// 对象hover
const handleObjectEnter = () => {
  if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
  setHovered(true);
};

const handleObjectLeave = () => {
  leaveTimeoutRef.current = setTimeout(() => {
    if (!isPanelHovered) setHovered(false);
  }, 150);
};

// Panel hover
const handlePanelEnter = () => {
  setIsPanelHovered(true);
  if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
  setHovered(true);
};

const handlePanelLeave = () => {
  setIsPanelHovered(false);
  leaveTimeoutRef.current = setTimeout(() => {
    setHovered(false);
  }, 150);
};

// 清理
useEffect(() => {
  return () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
  };
}, [hovered]);
```

---

### ADR-002: Z-Index和事件穿透管理

**日期**: 2024  
**状态**: ✅ 已实施

#### 问题
1. InfoPanel被其他3D对象遮挡
2. Panel的HTML层会拦截整个屏幕的鼠标事件
3. 右键拖动平移功能失效

#### 决策
使用**分层的pointerEvents控制**：

```javascript
<Html 
  zIndexRange={[1000, 0]}  // React Three Fiber特有属性
  occlude={false}           // 防止被3D对象遮挡
  style={{ pointerEvents: 'none' }}  // Html容器不拦截事件
>
  <div style={{ 
    pointerEvents: 'auto',  // 只有Panel内容拦截事件
    zIndex: 9999,           // CSS层级
    position: 'relative'    // 让zIndex生效
  }}>
    {/* Panel内容 */}
  </div>
</Html>
```

#### 理由

**为什么Html容器要 `pointerEvents: 'none'`？**
- React Three Fiber的Html组件会创建一个覆盖层
- 如果容器拦截事件，整个屏幕的3D交互都会失效
- 让事件穿透到3D场景，只有Panel内容拦截

**为什么需要三层z-index控制？**
1. `zIndexRange={[1000, 0]}` - R3F层级，确保Html在3D对象之上
2. `occlude={false}` - 防止3D对象遮挡Html
3. `zIndex: 9999` - CSS层级，确保在其他HTML元素之上

**为什么不全部用auto？**
- 会导致Panel被其他对象遮挡
- 无法保证始终在最上层
- 多个Panel重叠时层级不确定

#### 后果
- ✅ Panel始终在最上层显示
- ✅ 不影响3D场景交互（旋转、缩放）
- ✅ 右键拖动平移正常工作
- ⚠️ 需要理解R3F和CSS两个层级系统

---

### ADR-003: 拖动时禁用InfoPanel

**日期**: 2024  
**状态**: ✅ 已实施

#### 问题
当用户拖动旋转场景时：
1. 鼠标快速划过多个天体
2. 多个InfoPanel几乎同时显示并重叠
3. 点击Panel时可能点到下层的Panel，导致跳转失败

#### 决策
检测**真正的拖动操作**（不是简单的点击），拖动时禁用hover：

```javascript
const [isDragging, setIsDragging] = useState(false);

useEffect(() => {
  let mouseDownTime = 0;
  let hasMoved = false;
  
  const handleMouseDown = (e) => {
    mouseDownTime = Date.now();
    hasMoved = false;
  };
  
  const handleMouseMove = (e) => {
    // 只有在按下后移动才算拖动
    if (mouseDownTime > 0) {
      hasMoved = true;
      setIsDragging(true);
      setHovered(false);  // 立即隐藏Panel
    }
  };
  
  const handleMouseUp = () => {
    mouseDownTime = 0;
    if (hasMoved) {
      // 拖动后延迟恢复
      dragTimeoutRef.current = setTimeout(() => {
        setIsDragging(false);
      }, 100);
    } else {
      // 只是点击，立即恢复
      setIsDragging(false);
    }
  };
  
  // ... 事件监听和清理
}, [hovered]);

// 在hover处理中检查
const handleObjectEnter = () => {
  if (isDragging) return;  // 拖动时不显示
  // ...
};
```

#### 理由

**为什么不在mousedown时就设置isDragging？**
- 会误判点击为拖动
- 导致点击InfoPanel失效（最初的bug）
- 需要区分"点击"和"拖动"：点击是down→up，拖动是down→move→up

**为什么需要hasMoved标志？**
- 记录是否真的移动了鼠标
- 只有移动才算拖动
- 点击操作不应该触发拖动状态

**为什么拖动后延迟恢复，点击立即恢复？**
- 拖动停止瞬间可能鼠标还在某个对象上，立即恢复会误触发hover
- 点击没有这个问题，需要立即恢复让点击事件正常工作

**为什么用全局事件监听而不是Canvas事件？**
- OrbitControls的拖动是全局行为
- 需要在任何地方拖动都能检测到
- Canvas事件可能不够全面

#### 备选方案（已评估但未采用）

**方案A: 全局状态管理**
```javascript
// 使用Context确保只显示一个Panel
const [activeObject, setActiveObject] = useState(null);
// 每个对象检查 isActive = activeObject === obj.name
```
- ✅ 确保只有一个Panel
- ✅ 拖动时可以看到Panel（显示最后hover的）
- ❌ 需要额外的Context
- ❌ 拖动时看到Panel可能反而干扰

决定不采用，因为：
- 拖动时不该有弹窗干扰视线
- 简单方案更容易维护
- 用户体验更流畅

#### 后果
- ✅ 旋转场景时没有Panel干扰
- ✅ 停止后hover功能正常
- ✅ 点击Panel可以正常跳转
- ⚠️ 需要全局事件监听，注意清理

---

### ADR-004: OrbitControls平移配置

**日期**: 2024  
**状态**: ✅ 已实施

#### 问题
用户期望右键拖动可以平移场景，但发现功能失效。

#### 决策
启用OrbitControls的平移功能：

```javascript
<OrbitControls 
  enablePan={true}   // 启用平移（之前是false）
  panSpeed={0.5}     // 平移速度
  maxDistance={50}   // 最大距离
  minDistance={2}    // 最小距离
  onStart={handleFirstDrag}  // 首次拖动播放音乐
/>
```

#### 理由

**为什么之前设置enablePan={false}？**
- 可能是开发早期为了简化交互
- 或者担心误操作
- 但这与用户期望不符

**OrbitControls默认行为**：
- 左键：旋转
- 右键：平移
- 滚轮：缩放

**为什么不改成左键平移？**
- 旋转是主要交互，应该用更方便的左键
- 右键平移是Three.js社区标准
- 符合其他3D软件习惯

#### 后果
- ✅ 用户可以平移场景查看不同区域
- ✅ 符合常见3D交互习惯
- ✅ 与旋转、缩放配合良好

---

### ADR-005: 坐标系统和天体定位

**日期**: 2024（基于之前对话）  
**状态**: ✅ 已实施

#### 问题
需要将天体的RA/DEC坐标转换为3D场景中的位置。

#### 决策
使用天文学标准的赤道坐标系，并根据距离映射到3D空间：

```javascript
// 坐标转换
const [x, y, z] = raDecToXYZ(
  convertRA(obj.ra),    // 赤经转换为度数
  convertDEC(obj.dec),  // 赤纬转换为度数
  radius                // 根据距离计算半径
);

// 距离映射
const isExtragalactic = obj.dist > 100000;  // 河外星系
const radius = isExtragalactic 
  ? 10.2  // 固定距离显示河外星系
  : astronomicalScore(obj.dist);  // 银河系内按距离映射
```

#### 理由

**为什么区分河内和河外？**
- 河外星系距离太远（百万光年级别）
- 如果按真实距离显示会超出场景范围
- 固定距离让所有天体都可见

**为什么用astronomicalScore而不是线性映射？**
- 天体距离跨度巨大（几十到几十万光年）
- 线性映射会让近处天体挤在一起
- 对数或其他非线性映射更合适

**为什么以地球为中心？**
- 这是从地球观测的视角
- RA/DEC本身就是地心坐标系
- 符合观测者的实际体验

#### 后果
- ✅ 准确反映天体的天球位置
- ✅ 所有目标都在可视范围内
- ⚠️ 距离不是真实比例（但这是必要的权衡）

---

### ADR-006: 南半球极轴对齐提示

**日期**: 2024（基于之前对话）  
**状态**: ✅ 已记录

#### 背景知识
用户在南半球（墨尔本，-38°纬度）进行天文摄影。

#### 决策
在教学材料中明确说明：
- 南半球的极轴对齐需要将赤道仪的"N"标记指向**南方**
- 这与北半球相反（北半球N标记指向北方）

#### 理由

**为什么这很重要？**
- 极轴对齐错误会导致星野追踪失败
- 南北半球的天极在相反方向
- 大多数教程是北半球视角，容易误导

**为什么不用"南"标记？**
- 赤道仪制造商通常使用北半球标准
- 历史原因：大多数天文设备来自北半球国家
- 用户需要理解并适应

#### 后果
- ✅ 用户能正确设置设备
- ✅ 避免常见的南半球新手错误
- 📝 需要在文档中特别说明

---

### ADR-007: 滤镜选择策略

**日期**: 2024（基于之前对话）  
**状态**: ✅ 已记录

#### 背景
用户使用L-eNhance 7nm双窄带滤镜（Ha + OIII）进行深空摄影。

#### 决策指导
根据天体类型选择成像方式：

| 天体类型 | 推荐滤镜/方式 | 原因 |
|---------|-------------|------|
| 发射星云 | L-eNhance (Ha+OIII) | 发射Ha和OIII光谱线 |
| 反射星云 | RGB宽带 | 反射星光，需要全光谱 |
| 行星状星云 | L-eNhance | 主要是Ha和OIII发射 |
| 星系 | RGB宽带 | 包含恒星的连续光谱 |
| 星团 | RGB宽带 | 恒星集合 |
| 暗星云 | 需要前景星光对比 | - |

#### 理由

**为什么不能对所有目标都用L-eNhance？**
- 窄带滤镜只让特定波长通过
- 反射星云、星系、星团的光不在这些波长
- 会导致这些天体几乎不可见或颜色失真

**为什么f/7系统适合用户？**
- 慢焦比（f/7）降低了像差
- 不需要担心彗差（coma）
- 对新手更宽容

#### 后果
- ✅ 用户能为每个目标选择正确的拍摄方式
- ✅ 避免浪费时间拍摄不适合的目标
- 📝 建议在数据库中添加"推荐滤镜"字段

---

### ADR-008: 图像处理软件选择

**日期**: 2024（基于之前对话）  
**状态**: ✅ 已建议

#### 问题
用户需要选择天文图像处理软件。

#### 建议
1. **起步阶段**: Siril 1.4（免费开源）
2. **进阶阶段**: PixInsight（付费，功能强大）

```
学习路径：
Siril (免费) → 掌握基础工作流程 → 评估是否需要更多功能 → PixInsight (€300)
```

#### 理由

**为什么推荐Siril起步？**
- ✅ 完全免费
- ✅ 功能足够处理大多数深空图像
- ✅ 工作流程与PixInsight相似
- ✅ 降低学习成本风险

**什么时候考虑PixInsight？**
- 需要更高级的去噪算法
- 需要脚本自动化
- 需要更精确的星点处理
- 确定会长期从事天文摄影

**为什么不推荐Photoshop？**
- 不是专为天文设计
- 缺少必要的天文工具（如星点对齐、光污染去除）
- 虽然可以用，但效率低

#### 后果
- ✅ 用户不需要一开始就投资昂贵软件
- ✅ 可以先验证是否喜欢这个爱好
- ✅ 学到的技能可以迁移到PixInsight

---

### ADR-009: Notion数据库架构

**日期**: 2024（基于之前对话）  
**状态**: ✅ 已实施

#### 问题
需要管理天体目标和观测记录，但要避免重复输入数据。

#### 决策
使用双数据库架构 + 关系字段自动填充：

```
数据库结构：

1. 【天体对象库】 (Celestial Objects)
   - Name (主键)
   - RA
   - DEC
   - Type
   - Distance
   - Best Month
   - Filter Recommendation
   - Wikipedia Link
   - Image URL

2. 【观测记录】 (Observation Log)
   - Date
   - Target (关系字段 → 天体对象库)
   - RA (Rollup from Target)
   - DEC (Rollup from Target)
   - Type (Rollup from Target)
   - Exposure Details
   - Results
   - Notes
```

#### 理由

**为什么用两个数据库而不是一个？**
- 天体信息是静态的，不会因为观测而改变
- 观测记录是动态的，每次观测都是新记录
- 避免重复输入RA/DEC等固定信息

**为什么用Rollup而不是手动填写？**
- 自动从关联的天体对象获取数据
- 一次设置天体信息，多次使用
- 减少输入错误

**为什么不用单一数据库 + 多行？**
- 会导致天体信息重复
- 修改天体信息需要改多处
- 数据一致性差

#### 实施方法
```
1. 创建【天体对象库】，录入所有目标的基础信息
2. 创建【观测记录】
3. 添加Relation字段：Target → 天体对象库
4. 添加Rollup字段：
   - RA: Rollup(Target, RA)
   - DEC: Rollup(Target, DEC)
   - Type: Rollup(Target, Type)
   - etc.
5. 每次观测只需选择Target，其他信息自动填充
```

#### 后果
- ✅ 最小化数据输入
- ✅ 保证数据一致性
- ✅ 方便生成统计（如：拍摄次数、成功率）
- ⚠️ 初期需要投入时间建立天体对象库

---

### ADR-010: 设备升级路径

**日期**: 2024（基于之前对话）  
**状态**: 📝 规划中

#### 当前配置
```
望远镜: Orion 110mm f/7 ED refractor
相机: ASI 294MC Pro (彩色)
赤道仪: HEQ5 Pro
导星: ASI 290MM Mini
滤镜: L-eNhance 7nm
```

#### 计划升级
```
目标: RASA 11 v2
原因: 
  - 更快的焦比 (f/2.2)
  - 更大的光圈 (11英寸 vs 4.3英寸)
  - 曝光时间可大幅缩短
```

#### 决策建议

**升级前考虑因素**：
1. **成本**: RASA 11约$2000-3000 USD
2. **赤道仪负载**: HEQ5 Pro可以承载，但接近极限
3. **学习曲线**: 更快焦比对准确度要求更高
4. **配套升级**: 可能需要更好的导星系统

**替代方案**：
- 保持当前设备，增加滤镜选项（RGB、Ha/OIII/SII窄带）
- 升级到Celestron EdgeHD 8（f/10，更适合行星）
- 等待积累更多经验后再决定

**建议时机**：
- 当前设备已经能稳定产出满意作品
- 明确了拍摄方向（深空vs行星）
- 经济允许

#### 理由

**为什么不立即升级？**
- 当前设备还有很大提升空间
- 技术是限制因素，不是设备
- 先掌握图像处理技能

**为什么RASA适合深空？**
- f/2.2非常快，适合暗弱天体
- 大光圈收集更多光子
- 缩短曝光时间，提高效率

**为什么考虑风险？**
- 快焦比对平场、对焦要求极高
- 视场弯曲需要场平器
- 可能需要更好的滤镜系统

#### 后果
- 📝 短期：继续使用当前设备精进技术
- 🎯 中期：评估是否需要升级
- 💰 长期：根据实际需求决定投资

---

### ADR-011: 过滤器和UI控件架构

**日期**: 2024  
**状态**: ✅ 已实施

#### 问题
需要让用户能够按类型、滤镜、最佳观测月份筛选天体。

#### 决策
使用自定义Hook管理过滤逻辑 + 独立UI组件：

```javascript
// 架构
App.js
  ├─ useCelestialFilter() // Hook管理过滤状态和逻辑
  ├─ Canvas (3D场景)
  │   └─ CelestialObjects (使用filteredData)
  └─ CelestialFilter (UI控件)

// Hook接口
const {
  filters,              // 当前过滤器状态
  setFilters,          // 更新过滤器
  filteredData,        // 过滤后的数据
  totalCount,          // 总数
  filteredCount,       // 过滤后数量
  availableTypes,      // 可用的类型选项
  availableFilters,    // 可用的滤镜选项
  availableMonths      // 可用的月份选项
} = useCelestialFilter(celestialData);
```

#### 理由

**为什么用Hook而不是直接在组件里过滤？**
- 分离关注点：UI组件只负责显示，Hook负责逻辑
- 复用性：其他组件也可能需要过滤逻辑
- 测试性：Hook可以独立测试
- 性能：避免在渲染时重复计算

**为什么返回available选项？**
- UI需要知道有哪些可选项
- 动态生成选项，避免硬编码
- 如果数据变化，选项自动更新

**为什么UI组件独立？**
- 可以放在页面任何位置
- 样式独立管理
- 可以轻松替换成其他UI库

#### 实施细节
```javascript
// 过滤逻辑示例
const filteredData = useMemo(() => {
  return celestialData.filter(obj => {
    // 类型过滤
    if (filters.types.length > 0 && !filters.types.includes(obj.type)) {
      return false;
    }
    // 滤镜过滤
    if (filters.filters.length > 0 && !filters.filters.includes(obj.filter)) {
      return false;
    }
    // 月份过滤
    if (filters.months.length > 0 && !filters.months.includes(obj.bestMonth)) {
      return false;
    }
    return true;
  });
}, [celestialData, filters]);
```

#### 后果
- ✅ 清晰的代码结构
- ✅ 易于维护和扩展
- ✅ 过滤性能优化（useMemo）
- ⚠️ 需要理解Hook的工作原理

---

### ADR-012: 音乐控制和用户体验

**日期**: 2024  
**状态**: ✅ 已实施

#### 决策
首次拖动场景时自动播放背景音乐：

```javascript
const musicRef = useRef();

const handleFirstDrag = () => {
  musicRef.current?.play();
};

<OrbitControls onStart={handleFirstDrag} />
<MusicControl ref={musicRef} fadeDuration={1200} />
```

#### 理由

**为什么不自动播放？**
- 浏览器策略：大多数浏览器禁止自动播放音频
- 用户体验：突然播放音乐可能吓到用户
- 用户选择：让用户通过交互来"同意"播放

**为什么选择首次拖动作为触发？**
- 拖动表明用户开始积极探索
- 相比页面加载，拖动是明确的用户意图
- 自然的交互流程

**为什么需要淡入？**
- `fadeDuration={1200}` 提供1.2秒渐入效果
- 避免音量突变
- 更专业的听觉体验

#### 后果
- ✅ 符合浏览器策略
- ✅ 不会打扰未主动交互的用户
- ✅ 增强沉浸感

---

## 通用设计模式和最佳实践

### 模式1: 延迟状态转换
```javascript
// 问题：状态变化太快导致闪烁
// 解决：使用setTimeout + ref管理延迟

const timeoutRef = useRef(null);

const delayedAction = () => {
  if (timeoutRef.current) {
    clearTimeout(timeoutRef.current);
  }
  timeoutRef.current = setTimeout(() => {
    // 延迟执行的操作
  }, delay);
};

useEffect(() => {
  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
}, []);
```

**何时使用**：
- UI需要"等一等"才反应
- 防止快速连续事件触发
- 平滑的状态转换

### 模式2: 双状态协同
```javascript
// 问题：单个状态无法表达复杂逻辑
// 解决：使用多个状态互相配合

const [mainState, setMainState] = useState(false);
const [helperState, setHelperState] = useState(false);

// mainState控制主要行为
// helperState记录辅助信息
// 两者配合实现复杂逻辑

if (mainState && !helperState) {
  // 特定组合的处理
}
```

**何时使用**：
- 需要记住"过去的状态"
- 需要区分"当前"和"将来"
- 状态转换有时序依赖

### 模式3: 事件序列检测
```javascript
// 问题：区分点击和拖动
// 解决：追踪完整的事件序列

let startTime = 0;
let hasMoved = false;

onMouseDown: () => {
  startTime = Date.now();
  hasMoved = false;
}

onMouseMove: () => {
  if (startTime > 0) {
    hasMoved = true;
  }
}

onMouseUp: () => {
  if (hasMoved) {
    // 这是拖动
  } else {
    // 这是点击
  }
}
```

**何时使用**：
- 需要区分不同的手势
- 复杂的鼠标/触摸交互
- 避免误触发

### 模式4: 分层事件控制
```javascript
// 问题：事件在多层之间传播
// 解决：精确控制每层的事件接收

<OuterLayer pointerEvents="none">  // 穿透
  <MiddleLayer pointerEvents="none">  // 穿透
    <InnerContent pointerEvents="auto">  // 接收
      {/* 只有这里接收事件 */}
    </InnerContent>
  </MiddleLayer>
</OuterLayer>
```

**何时使用**：
- HTML覆盖在3D场景上
- 需要精确控制交互区域
- 避免误拦截事件

### 模式5: 数据关系映射
```javascript
// 问题：重复数据导致不一致
// 解决：主表 + 关系 + Rollup

主数据库（天体对象）
  ↓ 关系字段
事务数据库（观测记录）
  ↓ Rollup
自动填充的派生数据
```

**何时使用**：
- 静态数据 + 动态记录
- 需要避免数据冗余
- 需要保证数据一致性

---

## 性能考虑

### 3D场景优化
```javascript
// 当前实现
- 约100+天体对象同时渲染
- 每个对象：geometry + material + text + 可能的image sprite
- 使用Billboard让文字始终面向相机

// 未来优化方向
1. LOD (Level of Detail)
   - 远处对象用简单几何体
   - 近处对象显示详细信息

2. 实例化渲染
   - 相同类型的天体用InstancedMesh
   - 减少draw calls

3. Frustum Culling
   - 不渲染视野外的对象
   - React Three Fiber已自动处理部分

4. 按需加载图片
   - 只加载可见对象的Wikipedia图片
   - 使用IntersectionObserver
```

### React渲染优化
```javascript
// 当前实现
- useMemo缓存过滤结果
- 避免在render中计算

// 已使用的优化
const filteredData = useMemo(() => {
  return celestialData.filter(/* ... */);
}, [celestialData, filters]);

// 未来可以考虑
1. React.memo包装CelestialObject
2. 虚拟化长列表（如果有列表视图）
3. Web Workers处理数据过滤
```

---

## 调试技巧记录

### 技巧1: 事件追踪
```javascript
// 在开发时添加，生产时移除
const debugEvent = (name) => (e) => {
  console.log(`[${name}]`, {
    time: Date.now(),
    type: e.type,
    target: e.target,
    button: e.button
  });
};

<div
  onMouseEnter={debugEvent('Enter')}
  onMouseLeave={debugEvent('Leave')}
/>
```

### 技巧2: 状态变化可视化
```javascript
// 添加useEffect监控状态
useEffect(() => {
  console.log('State Update:', {
    hovered,
    isPanelHovered,
    isDragging,
    timestamp: Date.now()
  });
}, [hovered, isPanelHovered, isDragging]);
```

### 技巧3: Z-Index层级检查
```javascript
// 在浏览器console运行
document.querySelectorAll('*').forEach(el => {
  const z = window.getComputedStyle(el).zIndex;
  if (z !== 'auto') {
    el.style.outline = `2px solid hsl(${z * 10 % 360}, 70%, 50%)`;
    console.log(el.tagName, el.className, 'z-index:', z);
  }
});
```

### 技巧4: 3D对象定位调试
```javascript
// 在CelestialObject中临时添加
console.log(`${obj.name}: x=${x.toFixed(2)}, y=${y.toFixed(2)}, z=${z.toFixed(2)}`);

// 或者可视化辅助线
<line>
  <bufferGeometry>
    <bufferAttribute
      attach="attributes-position"
      count={2}
      array={new Float32Array([0,0,0, x,y,z])}
      itemSize={3}
    />
  </bufferGeometry>
  <lineBasicMaterial color="red" />
</line>
```

---

## 已知限制和未来改进

### 当前限制

1. **距离显示不是真实比例**
   - 河外星系固定在10.2单位
   - 实际距离跨度太大无法真实表现
   - 接受：这是可视化的必要妥协

2. **图片加载时机**
   - 所有对象同时请求Wikipedia图片
   - 可能造成初始加载慢
   - 未来：按需加载或预加载优先级

3. **移动设备支持**
   - 当前主要针对桌面优化
   - 触摸手势未完全优化
   - 未来：添加触摸控制适配

4. **数据更新**
   - CSV文件静态导入
   - 添加新天体需要重新构建
   - 未来：考虑数据库或API

### 计划改进

1. **搜索功能**
   ```javascript
   // 允许用户快速找到特定天体
   <SearchBox onSelect={(obj) => {
     // 相机飞向该天体
     // 自动显示InfoPanel
   }} />
   ```

2. **收藏系统**
   ```javascript
   // 标记感兴趣的目标
   - 本地存储收藏列表
   - 快速访问收藏的天体
   - 导出为观测计划
   ```

3. **观测计划助手**
   ```javascript
   // 根据日期和位置推荐目标
   - 输入观测日期
   - 计算当晚可见的天体
   - 按高度角排序
   ```

4. **增强现实集成**
   ```javascript
   // 用手机指向天空，叠加天体标注
   - 使用设备陀螺仪
   - 实时方位计算
   - AR标注层
   ```

---

## 文档维护

**维护原则**：
- 每个重要技术决策都应记录ADR
- 记录不仅是"做了什么"，更重要的是"为什么"
- 包含失败的尝试和原因
- 定期回顾，更新状态

**ADR编号规则**：
- ADR-XXX: 按时间顺序编号
- 状态标记：✅已实施 / 📝规划中 / ❌已废弃

**何时添加新ADR**：
- 架构级别的决策
- 解决了困难的技术问题
- 在多个方案中做出选择
- 影响用户体验的改动

---

## 参考资源

### 技术文档
- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Manual](https://threejs.org/manual/)
- [React Hooks API Reference](https://react.dev/reference/react)

### 天文学资源
- [Stellarium](https://stellarium.org/) - 免费天象模拟软件
- [PixInsight Forum](https://pixinsight.com/forum/) - 图像处理讨论
- [CloudyNights](https://www.cloudynights.com/) - 天文摄影社区

### 本项目相关
- Wikipedia API用于图片获取
- CSV数据格式：天体目录
- 南半球观测指南

---

**文档版本**: 1.0  
**最后更新**: 2024  
**维护者**: 项目团队  
**贡献**: 欢迎通过PR添加新的ADR或改进现有文档
