# 新特殊骰子设计

> 添加5个新特殊骰子，增加策略深度

---

## 一、新骰子清单

### 数值变化型

| 名称 | 面值 | 期望值 | 价格 |
|------|------|--------|------|
| Lucky 7 Die | 1,2,3,4,5,7 | 3.67 | 15 |
| Risky Die | -2,0,4,6,8,10 | 4.33 | 12 |

### 特殊能力型

| 名称 | 效果 | 价格 |
|------|------|------|
| Copy Die | 复制前一个骰子最终值（首位返回1） | 18 |
| Double Roll Die | 掷两次取较大值 | 20 |
| Chain Die | 标准面值 + 内置 Next+2 | 16 |

---

## 二、技术实现

### 2.1 数值变化型
直接扩展 `shop.ts` 的 `dieTypes` 数组即可。

### 2.2 特殊能力型

**Copy Die**：需要在resolver中处理，读取前一个骰子的finalValue。

**Double Roll Die**：修改 `DieImpl.roll()` 或创建子类 `DoubleRollDie`。

**Chain Die**：创建时附加 `NextAddModifier(2)`。

---

## 三、实现优先级

1. Lucky 7 Die + Risky Die（简单，只改shop.ts）
2. Chain Die（用现有Modifier系统）
3. Double Roll Die（需扩展骰子类）
4. Copy Die（需修改resolver）

---

## 四、验证计划

- TypeScript构建通过
- 商店能购买新骰子
- 各骰子效果正确
