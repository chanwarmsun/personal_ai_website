# 数据库连接日志系统使用指南

## 🎯 概述

为了帮助排查数据库连接问题，我们实施了完整的日志系统。该系统能够详细记录所有数据库相关的操作，包括连接状态、模式切换、错误详情和性能指标。

## 📊 日志系统架构

### 核心组件
- **日志管理器**: `lib/logger.ts` - 负责日志的记录、存储和查询
- **智能连接管理器**: `lib/supabase.ts` - 增强的连接管理和日志记录
- **数据库操作层**: `lib/database.ts` - 所有数据库操作都有详细日志
- **日志查看界面**: `/admin/logs` - 可视化日志查看和分析

## 🏷️ 日志分类

### 1. 连接日志 (CONNECTION)
记录数据库连接状态变化：
```typescript
// 连接成功
ℹ️ [CONNECTION] 连接状态变化: connecting → connected
// 连接失败  
❌ [CONNECTION] 数据库连接检查失败
```

### 2. 查询日志 (QUERY)
记录所有数据库查询操作：
```typescript
// 查询开始
🐛 [QUERY] SDK模式：开始获取 agents 数据
// 查询完成
ℹ️ [QUERY] agents.getAll 成功 (125ms)
```

### 3. 模式切换日志 (SWITCH)
记录SDK和API模式之间的切换：
```typescript
// 模式切换
⚠️ [SWITCH] 连接模式切换: sdk → api
// 切换原因
ℹ️ [SWITCH] SDK连接失败，切换到API模式
```

### 4. 保活日志 (KEEPALIVE)
记录数据库保活机制：
```typescript
// 保活成功
🐛 [KEEPALIVE] 数据库保活成功
// 保活失败
⚠️ [KEEPALIVE] 保活查询失败
```

### 5. 重试日志 (RETRY)
记录重试机制执行：
```typescript
// 重试开始
⚠️ [RETRY] 重试操作: 获取agents数据 (1/3)
// 重试成功
ℹ️ [RETRY] 重试操作成功: 获取agents数据
```

## 📝 日志级别

### DEBUG 🐛
详细的调试信息，包括：
- 操作开始和结束
- 参数和返回值
- 性能计时

### INFO ℹ️
一般信息，包括：
- 操作成功完成
- 状态变化
- 重要事件

### WARN ⚠️
警告信息，包括：
- 连接问题
- 重试操作
- 模式切换

### ERROR ❌
错误信息，包括：
- 操作失败
- 连接异常
- 系统错误

## 🔍 使用日志排查问题

### 1. 查看日志页面
1. 访问 `/admin/logs` 页面
2. 使用过滤器筛选特定类型的日志
3. 查看详细的错误信息和堆栈跟踪

### 2. 浏览器控制台
在浏览器开发者工具的控制台中，你可以看到实时的日志输出：

```javascript
// 查看所有日志
dbLogger.getLogs()

// 查看最近的错误
dbLogger.getLogs({ level: 'ERROR', limit: 10 })

// 查看连接相关日志
dbLogger.getLogs({ category: 'CONNECTION' })

// 获取连接统计
dbLogger.getConnectionStats()
```

### 3. 导出日志
在日志页面点击"导出"按钮，可以下载JSON格式的日志文件，用于深度分析。

## 🛠️ 常见问题排查

### 问题1: 数据库连接失败
**症状**: 页面显示连接失败，数据无法加载

**排查步骤**:
1. 查看 `CONNECTION` 类别的日志
2. 检查错误代码和详细信息
3. 查看是否有重试和模式切换

**示例日志**:
```
❌ [CONNECTION] 数据库连接检查失败
错误详情: { code: "PGRST301", message: "JWT expired" }
⚠️ [SWITCH] 连接模式切换: sdk → api
```

### 问题2: 查询响应慢
**症状**: 页面加载缓慢，操作延迟

**排查步骤**:
1. 查看 `QUERY` 类别的日志
2. 检查各个操作的耗时
3. 分析哪个表或操作最耗时

**示例日志**:
```
🐛 [QUERY] 操作 获取agents数据 耗时 { duration: "3247.50ms" }
ℹ️ [QUERY] agents.getAll 成功 (3247ms)
```

### 问题3: 频繁模式切换
**症状**: 系统不稳定，经常在SDK和API模式间切换

**排查步骤**:
1. 查看 `SWITCH` 类别的日志
2. 分析切换原因和频率
3. 检查网络连接稳定性

**示例日志**:
```
⚠️ [SWITCH] 连接模式切换: sdk → api (原因: SDK连接失败)
⚠️ [SWITCH] 连接模式切换: api → sdk (原因: SDK连接恢复正常)
```

### 问题4: 保活机制失效
**症状**: 数据库被自动暂停

**排查步骤**:
1. 查看 `KEEPALIVE` 类别的日志
2. 检查保活请求是否正常发送
3. 查看保活失败的原因

**示例日志**:
```
ℹ️ [KEEPALIVE] 启动数据库保活机制
🐛 [KEEPALIVE] 开始执行保活查询
⚠️ [KEEPALIVE] 保活查询失败
```

## 📈 性能监控

### 关键指标
- **连接成功率**: 成功连接次数 / 总连接尝试次数
- **平均响应时间**: 所有操作的平均耗时
- **模式切换次数**: SDK和API模式切换频率
- **错误类型分布**: 各种错误的发生频率

### 性能阈值建议
- 连接成功率 > 95%
- 平均响应时间 < 1000ms
- 模式切换次数 < 5次/小时
- 错误率 < 5%

## 🔧 高级配置

### 调整日志级别
在生产环境可以调整日志级别，减少DEBUG信息：

```typescript
// 只记录WARN和ERROR级别的日志
const productionLogger = new DatabaseLogger({
  minLevel: 'WARN'
})
```

### 自定义日志输出
可以添加自定义日志处理器：

```typescript
// 发送错误日志到远程服务
dbLogger.addHandler('ERROR', (log) => {
  fetch('/api/log-error', {
    method: 'POST',
    body: JSON.stringify(log)
  })
})
```

### 日志清理策略
系统自动限制日志数量为1000条，超出会自动删除最旧的日志。可以手动清理：

```typescript
// 清空所有日志
dbLogger.clearLogs()

// 只保留最近7天的日志
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
dbLogger.clearOldLogs(sevenDaysAgo)
```

## 📞 获取支持

如果通过日志分析仍无法解决问题：

1. **导出日志**: 下载完整的日志文件
2. **记录复现步骤**: 详细描述问题发生的步骤
3. **提供环境信息**: 浏览器版本、网络环境等
4. **联系技术支持**: 提供日志文件和问题描述

## 🎯 最佳实践

1. **定期查看日志**: 每日检查ERROR和WARN级别的日志
2. **监控性能指标**: 关注响应时间和成功率变化
3. **及时处理异常**: 发现问题立即分析和修复
4. **保留关键日志**: 重要问题的日志要及时导出保存
5. **网络环境优化**: 根据日志分析结果优化网络配置

---

## 📋 快速参考

### 常用日志查询
```javascript
// 查看最近的错误
dbLogger.getLogs({ level: 'ERROR', limit: 20 })

// 查看特定时间段的日志
dbLogger.getLogs({ 
  since: new Date('2024-01-20T00:00:00'), 
  limit: 100 
})

// 查看连接统计
dbLogger.getConnectionStats()

// 导出所有日志
dbLogger.exportLogs()
```

### 日志页面快捷操作
- **Ctrl+R**: 刷新日志
- **Ctrl+E**: 导出日志
- **Ctrl+D**: 清空日志
- **F5**: 重新加载页面 