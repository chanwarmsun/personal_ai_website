# 创建GitHub上传备份包
Write-Host "📦 创建GitHub上传备份包..." -ForegroundColor Green

# 创建临时目录
$backupDir = "github-backup-$(Get-Date -Format 'yyyyMMdd-HHmm')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# 获取所有修改的文件
Write-Host "📄 获取所有修改的文件..." -ForegroundColor Yellow
$changedFiles = git diff --name-only HEAD~1 HEAD

# 复制修改的文件
foreach ($file in $changedFiles) {
    if (Test-Path $file) {
        $targetPath = Join-Path $backupDir $file
        $targetDir = Split-Path $targetPath -Parent
        
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        Copy-Item $file $targetPath -Force
        Write-Host "✅ 复制: $file" -ForegroundColor Green
    }
}

# 获取未跟踪的新文件
Write-Host "📄 获取新增文件..." -ForegroundColor Yellow
$untrackedFiles = git ls-files --others --exclude-standard

foreach ($file in $untrackedFiles) {
    if (Test-Path $file) {
        $targetPath = Join-Path $backupDir $file
        $targetDir = Split-Path $targetPath -Parent
        
        if (!(Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        }
        
        Copy-Item $file $targetPath -Force
        Write-Host "✅ 复制新文件: $file" -ForegroundColor Green
    }
}

# 创建提交信息文件
$commitMessage = git log -1 --pretty=format:"%s%n%n%b"
$commitMessage | Out-File -FilePath "$backupDir/COMMIT_MESSAGE.txt" -Encoding UTF8

# 创建文件清单
Write-Host "📋 创建文件清单..." -ForegroundColor Yellow
@"
# GitHub 提交备份包

## 提交信息
$commitMessage

## 修改的文件列表
$($changedFiles -join "`n")

## 新增的文件列表
$($untrackedFiles -join "`n")

## 使用说明
1. 直接将这些文件上传到GitHub仓库对应位置
2. 或者解压后使用GitHub Desktop同步
3. 提交信息请使用 COMMIT_MESSAGE.txt 中的内容

## 生成时间
$(Get-Date)
"@ | Out-File -FilePath "$backupDir/README.txt" -Encoding UTF8

Write-Host "🎉 备份包创建完成: $backupDir" -ForegroundColor Green
Write-Host "📍 可以手动将文件上传到GitHub仓库" -ForegroundColor Cyan
Write-Host "🌐 仓库地址: https://github.com/chanwarmsun/personal_ai_website" -ForegroundColor Cyan 