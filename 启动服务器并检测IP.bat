@echo off
echo ========================================
echo 《小H的冒险》服务器启动工具
echo ========================================
echo.

echo 1. 启动服务器...
start "游戏服务器" cmd /k "cd /d %~dp0cmd && node local-server.js"

echo.
echo 2. 等待服务器启动...
timeout /t 3 /nobreak > nul

echo.
echo 3. 打开IP检测工具...
start ip-detection.html

echo.
echo 服务器已启动，IP检测工具已打开！
echo.
echo 使用说明：
echo 1. 在IP检测工具中测试找到正确的服务器IP
echo 2. 在游戏中按"I"键输入IP地址
echo 3. 享受游戏吧！
echo.
pause