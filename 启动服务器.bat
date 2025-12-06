@echo off
title 《小H的冒险》联机服务器
echo ===================================
echo    《小H的冒险》局域网联机服务器
echo ===================================
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未检测到Node.js
    echo 请先安装Node.js: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js版本:
node --version
echo.

REM 检查依赖是否安装
if not exist "node_modules" (
    echo 📦 正在安装依赖...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

echo 🚀 启动联机服务器...
echo.
echo 使用说明：
echo - 第一个连接的玩家自动成为主机
echo - 其他玩家自动加入主机世界
echo - 确保所有设备在同一局域网内
echo.
echo 服务器状态页面：http://192.168.1.115:8080
echo WebSocket地址：ws://192.168.1.115:7457
echo.
echo 按 Ctrl+C 可以停止服务器
echo ===================================
echo.

npm start