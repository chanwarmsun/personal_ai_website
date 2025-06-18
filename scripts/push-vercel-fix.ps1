# Vercel构建错误修复推送脚本
# 处理网络连接问题的重试机制

param(
    [int]$MaxRetries = 10,
    [int]$DelaySeconds = 30
)

Write-Host "开始推送Vercel构建错误修复..." -ForegroundColor Green
Write-Host "最大重试次数: $MaxRetries, 延迟间隔: $DelaySeconds 秒" -ForegroundColor Yellow

$retryCount = 0
$success = $false

while ($retryCount -lt $MaxRetries -and -not $success) {
    $retryCount++
    Write-Host "尝试 $retryCount/$MaxRetries..." -ForegroundColor Cyan
    
    try {
        # 检查Git状态
        Write-Host "检查Git状态..." -ForegroundColor Gray
        git status
        
        # 尝试推送
        Write-Host "推送到GitHub..." -ForegroundColor Gray
        $result = git push origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ 推送成功！" -ForegroundColor Green
            $success = $true
            
            # 显示最新的提交
            Write-Host "`n最新提交:" -ForegroundColor Green
            git log --oneline -3
            
        } else {
            Write-Host "❌ 推送失败: $result" -ForegroundColor Red
            
            if ($retryCount -lt $MaxRetries) {
                Write-Host "等待 $DelaySeconds 秒后重试..." -ForegroundColor Yellow
                Start-Sleep -Seconds $DelaySeconds
            }
        }
    }
    catch {
        Write-Host "❌ 推送异常: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($retryCount -lt $MaxRetries) {
            Write-Host "等待 $DelaySeconds 秒后重试..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
}

if (-not $success) {
    Write-Host "`n❌ 所有推送尝试都失败了" -ForegroundColor Red
    Write-Host "请检查网络连接或稍后手动推送以下修复:" -ForegroundColor Yellow
    Write-Host "- 修复了admin页面的重复导入问题" -ForegroundColor White
    Write-Host "- 添加了构建缓存强制清理机制" -ForegroundColor White
    Write-Host "- 优化了Webpack和Vercel配置" -ForegroundColor White
    Write-Host "- 清理了残留的备份文件引用" -ForegroundColor White
    Write-Host "`n手动推送命令:" -ForegroundColor Yellow
    Write-Host "git push origin main" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "`n🎉 Vercel构建错误修复已成功推送！" -ForegroundColor Green
    Write-Host "下一步: 在Vercel控制台触发重新部署" -ForegroundColor Yellow
    exit 0
} 