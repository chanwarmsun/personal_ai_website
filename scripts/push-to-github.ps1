# GitHub 推送脚本 - 包含重试机制和网络配置优化
Write-Host "🚀 开始推送到GitHub..." -ForegroundColor Green

# 配置Git网络设置
Write-Host "🔧 配置Git网络设置..." -ForegroundColor Yellow
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
git config --global http.postBuffer 524288000
git config --global https.postBuffer 524288000

# 检查网络连接
Write-Host "🌐 检查网络连接..." -ForegroundColor Yellow
try {
    Test-NetConnection github.com -Port 443 -WarningAction SilentlyContinue | Out-Null
    Write-Host "✅ 网络连接正常" -ForegroundColor Green
} catch {
    Write-Host "⚠️ 网络连接可能有问题，但继续尝试..." -ForegroundColor Yellow
}

# 推送重试机制
$maxRetries = 3
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    $retryCount++
    Write-Host "📤 尝试推送 (第 $retryCount 次)..." -ForegroundColor Blue
    
    try {
        git push origin main
        if ($LASTEXITCODE -eq 0) {
            Write-Host "🎉 推送成功！" -ForegroundColor Green
            Write-Host "📍 仓库地址: https://github.com/chanwarmsun/personal_ai_website" -ForegroundColor Cyan
            exit 0
        }
    } catch {
        Write-Host "❌ 推送失败: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    if ($retryCount -lt $maxRetries) {
        $waitTime = $retryCount * 5
        Write-Host "⏱️ 等待 $waitTime 秒后重试..." -ForegroundColor Yellow
        Start-Sleep -Seconds $waitTime
    }
}

Write-Host "❌ 推送失败，已尝试 $maxRetries 次" -ForegroundColor Red
Write-Host "🔍 可能的解决方案:" -ForegroundColor Yellow
Write-Host "1. 检查网络连接" -ForegroundColor White
Write-Host "2. 检查GitHub账户权限" -ForegroundColor White
Write-Host "3. 检查防火墙设置" -ForegroundColor White
Write-Host "4. 尝试使用GitHub Desktop或浏览器手动上传" -ForegroundColor White

exit 1 