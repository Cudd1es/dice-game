# 游戏增强：新Modifier + 交互优化

> 扩展Modifier系统并改进骰子交互体验

---

## 一、新Modifier类型

### 1.1 累积增益（Stack Modifier）

**核心机制**：每个后续骰子获得递增的加成

| 名称 | 效果 | 示例（3个后续骰子） |
|------|------|---------------------|
| `Stack +1` | 每个后续骰子 +n（n递增） | +1, +2, +3 = 总共+6 |
| `Stack x0.1` | 每个后续骰子乘数递增 | ×1.1, ×1.2, ×1.3 |

**实现要点**：
- 在 `ChainState` 中添加 `stackBonus: number` 和 `stackIncrement: number`
- 每次解析后 `stackBonus += stackIncrement`

### 1.2 条件传递（Conditional Modifier）

**核心机制**：基于当前骰子值判断，影响下一个骰子

| 名称 | 触发条件 | 效果 |
|------|----------|------|
| `If Even: Next x2` | 当前骰子偶数 | 下一个×2 |
| `If ≥4: Next +3` | 当前值≥4 | 下一个+3 |
| `If Max: Next x3` | 掷出最大值(6) | 下一个×3 |

**实现要点**：
- Modifier 的 `apply()` 检查 `context.currentValue`
- 条件满足时修改 `chainState.nextBonus` 或 `nextMultiplier`

---

## 二、骰子交互优化

### 2.1 当前问题
- 只能点击选择 → 点击放置，无法直接拖动
- 已放置的骰子无法移回骰子池
- 无法重新排列已放置的骰子

### 2.2 改进方案

**拖放支持**：
- 骰子可从池拖入排列区
- 排列区内可拖动调整顺序
- 可将骰子拖回池中（取消放置）

**点击交互保留**：
- 点击选择 + 点击放置仍有效
- 点击已放置骰子可将其移回池中

---

## 三、技术变更

### 3.1 类型扩展

```typescript
// types.ts
interface ChainState {
    nextBonus: number;
    nextMultiplier: number;      // [新增] 下一个骰子的乘数
    globalMultiplier: number;
    stackBonus: number;          // [新增] 累积加成当前值
    stackIncrement: number;      // [新增] 累积加成增量
}
```

### 3.2 新增Modifier类

```typescript
// modifiers.ts
class StackAddModifier      // 累积加成
class ConditionalNextModifier // 条件传递（通用基类）
class IfEvenNextMultiply    // 偶数触发
class IfHighNextAdd         // 高值触发（≥4）
```

### 3.3 UI变更

```typescript
// ui/diceRenderer.ts
- 添加 HTML5 Drag & Drop 事件
- draggable="true" 属性
- dragstart/dragover/drop 处理
- 支持双向拖动（池↔排列区）
```

---

## 四、实现优先级

1. **ChainState 扩展** - 添加新字段
2. **新Modifier类实现** - Stack + Conditional
3. **Resolver 更新** - 处理新的链状态
4. **拖放交互** - diceRenderer 改造
5. **商店集成** - 添加新Modifier到商店
6. **测试验证** - 确保链式计算正确
