# Vercel Build Fix Push Script
# Handle network connection issues with retry mechanism

param(
    [int]$MaxRetries = 10,
    [int]$DelaySeconds = 30
)

Write-Host "Starting Vercel build fix push..." -ForegroundColor Green
Write-Host "Max retries: $MaxRetries, Delay: $DelaySeconds seconds" -ForegroundColor Yellow

$retryCount = 0
$success = $false

while ($retryCount -lt $MaxRetries -and -not $success) {
    $retryCount++
    Write-Host "Attempt $retryCount/$MaxRetries..." -ForegroundColor Cyan
    
    try {
        # Check Git status
        Write-Host "Checking Git status..." -ForegroundColor Gray
        git status
        
        # Try to push
        Write-Host "Pushing to GitHub..." -ForegroundColor Gray
        $result = git push origin main 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Push successful!" -ForegroundColor Green
            $success = $true
            
            # Show latest commits
            Write-Host "`nLatest commits:" -ForegroundColor Green
            git log --oneline -3
            
        } else {
            Write-Host "Push failed: $result" -ForegroundColor Red
            
            if ($retryCount -lt $MaxRetries) {
                Write-Host "Waiting $DelaySeconds seconds before retry..." -ForegroundColor Yellow
                Start-Sleep -Seconds $DelaySeconds
            }
        }
    }
    catch {
        Write-Host "Push exception: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($retryCount -lt $MaxRetries) {
            Write-Host "Waiting $DelaySeconds seconds before retry..." -ForegroundColor Yellow
            Start-Sleep -Seconds $DelaySeconds
        }
    }
}

if (-not $success) {
    Write-Host "`nAll push attempts failed" -ForegroundColor Red
    Write-Host "Please check network connection or manually push the fixes:" -ForegroundColor Yellow
    Write-Host "- Fixed admin page import issues" -ForegroundColor White
    Write-Host "- Added build cache clearing" -ForegroundColor White
    Write-Host "- Optimized Webpack and Vercel config" -ForegroundColor White
    Write-Host "- Fixed Vercel function runtime config" -ForegroundColor White
    Write-Host "`nManual push command:" -ForegroundColor Yellow
    Write-Host "git push origin main" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "`nVercel build fix pushed successfully!" -ForegroundColor Green
    Write-Host "Next step: Trigger redeploy in Vercel console" -ForegroundColor Yellow
    exit 0
} 