const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建HTTP服务器用于提供静态文件
const server = http.createServer((req, res) => {
    // 处理CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // 默认返回简单的状态页面
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>《小H的冒险》联机服务器</title>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
                .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                h1 { color: #333; text-align: center; }
                .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .info { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .warning { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
                ul { line-height: 1.8; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎮 《小H的冒险》联机服务器运行中</h1>
        <div class="status">
            <strong>✅ 服务器状态：</strong>运行中<br>
            <strong>🌐 端口：</strong>7457<br>
            <strong>🔗 WebSocket地址：</strong>ws://192.168.1.115:7457
        </div>
                <div class="info">
                    <h3>📋 使用说明：</h3>
                    <ul>
                        <li>第一个连接的玩家自动成为主机</li>
                        <li>后续连接的玩家会自动加入主机的游戏世界</li>
                        <li>所有玩家的位置和动作会实时同步</li>
                        <li>确保所有设备在同一局域网内</li>
                    </ul>
                </div>
                <div class="warning">
                    <h3>⚠️ 注意事项：</h3>
                    <ul>
                        <li>保持这个命令行窗口打开</li>
                        <li>不要关闭此服务器程序</li>
                        <li>防火墙需要允许7456端口</li>
                    </ul>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 创建WebSocket服务器
const wss = new WebSocket.Server({ port: 7457 });

// 存储主机和客户端信息
let hostPlayer = null;
let clients = new Map();
let playerIdCounter = 1;

// 房间系统
let rooms = new Map(); // 房间号 -> 房间信息
let roomIdCounter = 1000; // 房间号从1000开始

console.log('🚀 《小H的冒险》联机服务器启动成功！');
console.log('📡 HTTP服务器运行在: http://192.168.1.115:7457');
console.log('🔌 WebSocket服务器运行在: ws://192.168.1.115:7457');
console.log('⏰ 启动时间:', new Date().toLocaleString());

wss.on('connection', (ws) => {
    const playerId = 'player_' + playerIdCounter++;
    const playerInfo = {
        id: playerId,
        ws: ws,
        isHost: false,
        position: { x: 0, y: 0 },
        animation: 'idle'
    };
    
    clients.set(playerId, playerInfo);
    
    console.log(`👤 新玩家连接: ${playerId} (当前在线: ${clients.size}人)`);

    // 如果没有主机，设置第一个玩家为主机
    if (!hostPlayer) {
        hostPlayer = playerInfo;
        playerInfo.isHost = true;
        console.log(`👑 ${playerId} 成为主机玩家`);
        
        // 通知主机
        ws.send(JSON.stringify({
            type: 'host_assigned',
            playerId: playerId
        }));
    }

    // 通知所有玩家有新玩家加入（包含新玩家的位置信息）
    broadcastToAll({
        type: 'player_joined',
        playerId: playerId,
        isHost: playerInfo.isHost,
        position: playerInfo.position,
        animation: playerInfo.animation
    });

    // 向新玩家发送当前所有玩家信息
    const existingPlayers = Array.from(clients.values()).filter(p => p.id !== playerId);
    if (existingPlayers.length > 0) {
        ws.send(JSON.stringify({
            type: 'existing_players',
            players: existingPlayers.map(p => ({
                id: p.id,
                isHost: p.isHost,
                position: p.position,
                animation: p.animation
            }))
        }));
    }

    // 处理消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch (data.type) {
                case 'create_room':
                    // 创建房间
                    const roomId = generateRoomId();
                    const room = {
                        id: roomId,
                        host: playerId,
                        players: new Map([[playerId, playerInfo]]),
                        createdAt: new Date()
                    };
                    
                    rooms.set(roomId, room);
                    playerInfo.roomId = roomId;
                    
                    console.log(`🏠 玩家 ${playerId} 创建房间 ${roomId}`);
                    
                    ws.send(JSON.stringify({
                        type: 'room_created',
                        roomId: roomId,
                        playerId: playerId,
                        isHost: true
                    }));
                    break;
                    
                case 'join_room':
                    // 加入房间
                    const targetRoomId = data.roomId;
                    const targetRoom = rooms.get(targetRoomId);
                    
                    if (targetRoom) {
                        // 将玩家从当前房间移除（如果有的话）
                        if (playerInfo.roomId) {
                            const oldRoom = rooms.get(playerInfo.roomId);
                            if (oldRoom) {
                                oldRoom.players.delete(playerId);
                                if (oldRoom.players.size === 0) {
                                    rooms.delete(playerInfo.roomId);
                                }
                            }
                        }
                        
                        // 加入新房间
                        playerInfo.roomId = targetRoomId;
                        targetRoom.players.set(playerId, playerInfo);
                        
                        console.log(`🚪 玩家 ${playerId} 加入房间 ${targetRoomId}`);
                        
                        // 通知加入成功
                        ws.send(JSON.stringify({
                            type: 'room_joined',
                            roomId: targetRoomId,
                            playerId: playerId,
                            isHost: false,
                            hostId: targetRoom.host
                        }));
                        
                        // 向房主和其他玩家广播
                        broadcastToRoom(targetRoomId, playerId, {
                            type: 'player_joined_room',
                            playerId: playerId,
                            roomId: targetRoomId
                        });
                        
                        // 发送房间内其他玩家信息
                        const otherPlayers = Array.from(targetRoom.players.values())
                            .filter(p => p.id !== playerId)
                            .map(p => ({
                                id: p.id,
                                position: p.position,
                                animation: p.animation,
                                isHost: p.id === targetRoom.host
                            }));
                            
                        if (otherPlayers.length > 0) {
                            ws.send(JSON.stringify({
                                type: 'existing_players',
                                players: otherPlayers
                            }));
                        }
                    } else {
                        // 房间不存在
                        ws.send(JSON.stringify({
                            type: 'room_not_found',
                            roomId: targetRoomId,
                            message: `房间 ${targetRoomId} 不存在`
                        }));
                    }
                    break;
                    
                case 'position_update':
                    if (playerInfo) {
                        playerInfo.position = data.position;
                        playerInfo.animation = data.animation;
                        
                        // 只在同一房间内广播
                        if (playerInfo.roomId) {
                            broadcastToRoom(playerInfo.roomId, playerId, {
                                type: 'player_update',
                                playerId: playerId,
                                position: data.position,
                                animation: data.animation
                            });
                        }
                    }
                    break;
                    
                case 'attack':
                    // 只在同一房间内广播攻击事件
                    if (playerInfo && playerInfo.roomId) {
                        broadcastToRoom(playerInfo.roomId, playerId, {
                            type: 'player_attack',
                            playerId: playerId,
                            direction: data.direction
                        });
                    }
                    break;
            }
        } catch (error) {
            console.error('消息处理错误:', error);
        }
    });

    // 处理断开连接
    ws.on('close', () => {
        console.log(`👋 玩家断开连接: ${playerId}`);
        
        // 从房间中移除玩家
        if (playerInfo.roomId) {
            const room = rooms.get(playerInfo.roomId);
            if (room) {
                room.players.delete(playerId);
                
                // 通知房间内其他玩家
                broadcastToRoom(playerInfo.roomId, playerId, {
                    type: 'player_left_room',
                    playerId: playerId,
                    roomId: playerInfo.roomId
                });
                
                // 如果房主离开，选择新房主
                if (room.host === playerId) {
                    const remainingPlayers = Array.from(room.players.values());
                    if (remainingPlayers.length > 0) {
                        const newHost = remainingPlayers[0];
                        room.host = newHost.id;
                        
                        // 通知新房主
                        newHost.ws.send(JSON.stringify({
                            type: 'host_assigned',
                            playerId: newHost.id,
                            roomId: playerInfo.roomId
                        }));
                        
                        // 通知房间内其他玩家房主变更
                        broadcastToRoom(playerInfo.roomId, newHost.id, {
                            type: 'host_changed',
                            newHostId: newHost.id,
                            roomId: playerInfo.roomId
                        });
                        
                        console.log(`👑 房间 ${playerInfo.roomId} 的新房主: ${newHost.id}`);
                    }
                }
                
                // 如果房间空了，删除房间
                if (room.players.size === 0) {
                    rooms.delete(playerInfo.roomId);
                    console.log(`🗑️ 房间 ${playerInfo.roomId} 已删除`);
                }
            }
        }
        
        clients.delete(playerId);
        console.log(`📊 当前在线: ${clients.size}人，房间数: ${rooms.size}个`);
    });

    // 错误处理
    ws.on('error', (error) => {
        console.error(`❌ 玩家 ${playerId} 连接错误:`, error);
        clients.delete(playerId);
    });
});

// 广播给所有玩家
function broadcastToAll(message) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
        if (client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(messageStr);
            } catch (error) {
                console.error('广播消息失败:', error);
            }
        }
    });
}

// 广播给其他玩家（不包括指定玩家）
function broadcastToOthers(excludePlayerId, message) {
    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
        if (client.id !== excludePlayerId && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(messageStr);
            } catch (error) {
                console.error('广播消息失败:', error);
            }
        }
    });
}

// 广播给房间内的其他玩家
function broadcastToRoom(roomId, excludePlayerId, message) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const messageStr = JSON.stringify(message);
    room.players.forEach(client => {
        if (client.id !== excludePlayerId && client.ws.readyState === WebSocket.OPEN) {
            try {
                client.ws.send(messageStr);
            } catch (error) {
                console.error('房间广播消息失败:', error);
            }
        }
    });
}

// 生成房间号
function generateRoomId() {
    return roomIdCounter++;
}

// 定期清理断开的连接
setInterval(() => {
    clients.forEach((client, playerId) => {
        if (client.ws.readyState === WebSocket.CLOSED || client.ws.readyState === WebSocket.CLOSING) {
            clients.delete(playerId);
            console.log(`🧹 清理断开的连接: ${playerId}`);
        }
    });
}, 30000); // 每30秒清理一次

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    wss.close(() => {
        console.log('✅ WebSocket服务器已关闭');
        process.exit(0);
    });
});

server.listen(8080, () => {
    console.log('📁 静态文件服务器运行在端口 8080');
});