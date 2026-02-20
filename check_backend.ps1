# 后端服务诊断脚本

Write-Host "=== 后端服务诊断 ===" -ForegroundColor Cyan

# 1. 检查Java版本
Write-Host "`n1. 检查Java版本:" -ForegroundColor Yellow
$javaVersion = java -version 2>&1 | Select-String "version"
Write-Host $javaVersion

# 2. 检查端口占用
Write-Host "`n2. 检查8080端口:" -ForegroundColor Yellow
$port8080 = netstat -ano | findstr ":8080"
if ($port8080) {
    Write-Host "端口8080已被占用:" -ForegroundColor Red
    Write-Host $port8080
} else {
    Write-Host "端口8080未被占用" -ForegroundColor Green
}

# 3. 检查JAR文件
Write-Host "`n3. 检查JAR文件:" -ForegroundColor Yellow
if (Test-Path ".\target\erp-0.0.1-SNAPSHOT.jar") {
    Write-Host "JAR文件存在" -ForegroundColor Green
    $jarSize = (Get-Item ".\target\erp-0.0.1-SNAPSHOT.jar").Length / 1MB
    Write-Host "文件大小: $([math]::Round($jarSize, 2)) MB"
} else {
    Write-Host "JAR文件不存在，需要先编译" -ForegroundColor Red
}

# 4. 检查数据库目录
Write-Host "`n4. 检查数据库目录:" -ForegroundColor Yellow
if (Test-Path ".\data") {
    Write-Host "data目录存在" -ForegroundColor Green
    Get-ChildItem ".\data" | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "data目录不存在，将自动创建" -ForegroundColor Yellow
}

# 5. 测试API连接
Write-Host "`n5. 测试API连接:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/projects" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "后端服务运行正常！" -ForegroundColor Green
    Write-Host "状态码: $($response.StatusCode)"
} catch {
    Write-Host "后端服务未运行或无法连接" -ForegroundColor Red
    Write-Host "错误: $($_.Exception.Message)"
}

Write-Host "`n=== 诊断完成 ===" -ForegroundColor Cyan

