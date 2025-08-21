/**
 * 本地存储清理工具
 * 可以在浏览器开发者工具的Console中运行此脚本
 * 
 * 使用方法：
 * 1. 打开浏览器开发者工具（F12）
 * 2. 切换到Console标签
 * 3. 复制粘贴此脚本并运行
 */

(function() {
  console.log('🧹 开始清理本地存储...')
  
  // 检查当前localStorage使用情况
  function checkStorageUsage() {
    let totalSize = 0
    const items = []
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const value = localStorage.getItem(key)
        const size = new Blob([value]).size
        totalSize += size
        items.push({
          key,
          size,
          sizeKB: Math.round(size / 1024),
          preview: value.length > 100 ? value.substring(0, 100) + '...' : value
        })
      }
    }
    
    return {
      totalSize,
      totalSizeKB: Math.round(totalSize / 1024),
      totalSizeMB: Math.round(totalSize / (1024 * 1024) * 100) / 100,
      items: items.sort((a, b) => b.size - a.size)
    }
  }
  
  // 显示存储使用情况
  function showStorageInfo() {
    const usage = checkStorageUsage()
    
    console.log('📊 当前localStorage使用情况:')
    console.log(`总大小: ${usage.totalSizeKB}KB (${usage.totalSizeMB}MB)`)
    console.log('大文件详情:')
    
    usage.items.forEach((item, index) => {
      if (item.sizeKB > 10) { // 只显示大于10KB的项
        console.log(`${index + 1}. ${item.key}: ${item.sizeKB}KB`)
      }
    })
    
    return usage
  }
  
  // 清理函数
  function cleanupStorage() {
    const beforeUsage = checkStorageUsage()
    let cleaned = []
    
    // 要清理的键名模式
    const cleanupPatterns = [
      'default_content_backup',      // 旧的完整备份
      'admin_backup_data',          // 管理后台备份
      'carousel_backup',            // 轮播备份
      'agents_backup',              // 智能体备份
      'prompts_backup',             // 提示词备份
      'resources_backup',           // 资源备份
      'temp_',                      // 临时文件
      'cache_',                     // 缓存文件
      '_backup_old',                // 旧备份文件
    ]
    
    // 清理匹配的项
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const shouldClean = cleanupPatterns.some(pattern => 
          key.includes(pattern) || key.startsWith(pattern) || key.endsWith(pattern)
        )
        
        if (shouldClean) {
          const size = new Blob([localStorage.getItem(key)]).size
          localStorage.removeItem(key)
          cleaned.push({
            key,
            sizeKB: Math.round(size / 1024)
          })
        }
      }
    }
    
    const afterUsage = checkStorageUsage()
    const savedKB = beforeUsage.totalSizeKB - afterUsage.totalSizeKB
    
    console.log('✅ 清理完成!')
    console.log(`已清理 ${cleaned.length} 个项目，释放空间 ${savedKB}KB`)
    
    if (cleaned.length > 0) {
      console.log('已清理的项目:')
      cleaned.forEach((item, index) => {
        console.log(`${index + 1}. ${item.key} (${item.sizeKB}KB)`)
      })
    }
    
    return {
      cleaned,
      savedKB,
      beforeUsage,
      afterUsage
    }
  }
  
  // 保留重要数据的安全清理
  function safeCleanup() {
    console.log('🔒 执行安全清理（保留重要数据）...')
    
    // 要保留的重要键
    const keepKeys = [
      'admin_token',                    // 管理员令牌
      'default_content_light_backup',  // 轻量级备份
      'user_preferences',              // 用户偏好
      'settings'                       // 设置
    ]
    
    let cleaned = []
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        // 检查是否是要保留的键
        const shouldKeep = keepKeys.includes(key) || 
                          keepKeys.some(keepKey => key.includes(keepKey))
        
        if (!shouldKeep) {
          // 检查大小，只清理大文件
          const value = localStorage.getItem(key)
          const size = new Blob([value]).size
          
          if (size > 50 * 1024) { // 大于50KB的文件
            localStorage.removeItem(key)
            cleaned.push({
              key,
              sizeKB: Math.round(size / 1024)
            })
          }
        }
      }
    }
    
    console.log(`✅ 安全清理完成，清理了 ${cleaned.length} 个大文件`)
    return cleaned
  }
  
  // 主函数
  console.log('🔍 检查当前存储情况...')
  const initialUsage = showStorageInfo()
  
  if (initialUsage.totalSizeKB > 1024) { // 如果超过1MB
    console.log('\n⚠️ 检测到存储使用量较大，建议清理')
    console.log('\n可用命令:')
    console.log('• cleanupStorage() - 清理所有备份和缓存文件')
    console.log('• safeCleanup() - 安全清理（保留重要数据）')
    console.log('• showStorageInfo() - 显示存储使用情况')
    
    // 将函数暴露到全局作用域
    window.cleanupStorage = cleanupStorage
    window.safeCleanup = safeCleanup
    window.showStorageInfo = showStorageInfo
    
  } else {
    console.log('✅ 存储使用量正常，无需清理')
  }
  
  // 如果存储量特别大，自动建议清理
  if (initialUsage.totalSizeMB > 5) {
    console.log('\n🚨 存储使用量过大（超过5MB），强烈建议立即清理！')
    console.log('运行: safeCleanup() 或 cleanupStorage()')
  }
  
})()

// 使用说明
console.log(`
📋 本地存储清理工具使用说明:

1. 查看存储情况:
   showStorageInfo()

2. 安全清理（推荐）:
   safeCleanup()

3. 完全清理:
   cleanupStorage()

4. 手动清理特定项:
   localStorage.removeItem('键名')

⚠️ 注意：清理后请刷新页面以确保应用正常工作
`) 