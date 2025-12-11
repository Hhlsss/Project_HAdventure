import { _decorator, Component, Node, instantiate, Prefab, resources, Vec3, color, Sprite, director } from 'cc';
import { hero } from './hero';
import { RoomUI } from './RoomUI';
import { ChatSystem } from './ChatSystem';
const { ccclass, property } = _decorator;

declare global {
    interface Window {
        WebSocket: typeof WebSocket;
        networkManager: NetworkManager;
        chatSystem: ChatSystem;
    }
}

@ccclass('NetworkManager')
export class NetworkManager extends Component {
    @property({ type: Prefab })
    public otherPlayerPrefab: Prefab | null = null;

    private ws: WebSocket | null = null;
    private isConnected: boolean = false;
    private isHost: boolean = false;
    private playerId: string = '';
    private roomId: number | null = null;
    private otherPlayers: Map<string, Node> = new Map();
    private lastPosition: Vec3 = new Vec3();
    private lastAnimation: string = '';
    private positionUpdateInterval: number = 10; // 10ms更新一次位置
    private lastUpdateTime: number = 0;
    private hasUserAttemptedConnection: boolean = false; // 标记用户是否已尝试连接服务器
    private chatSystem: ChatSystem | null = null; // 聊天系统组件
    
    // 添加全局引用，方便调试
    public static instance: NetworkManager | null = null;

    start() {
        // 设置全局引用，方便调试
        NetworkManager.instance = this;
        window.networkManager = this; // 添加到全局窗口对象，方便调试
        
        // 游戏启动时不自动连接服务器
        // 只有在玩家点击 Host 或 Join 按钮时才连接服务器
        console.log('游戏已启动，当前为单机模式');
        
        // 检测运行环境
        this.detectEnvironment();
    }
    
    // 检测当前运行环境
    private detectEnvironment() {
        // 检测是否在编辑器预览模式
        const isPreviewMode = window.location && window.location.hostname === 'localhost' && window.location.port === '7456';
        
        if (isPreviewMode) {
            console.warn('⚠️ 当前在编辑器预览模式运行');
            console.warn('💡 编辑器预览模式下WebSocket连接可能受限');
            console.warn('💡 建议使用构建后的版本测试联机功能');
        } else if (window.location && window.location.hostname === 'localhost') {
            console.log('✅ 在本地开发环境运行');
        } else {
            console.log('✅ 在生产环境运行');
        }
        
        // 检测WebSocket支持
        if (!window.WebSocket) {
            console.error('❌ 当前浏览器不支持WebSocket');
            return false;
        }
        
        return true;
    }
    
    // 动态获取服务器IP地址
    private getServerIP(): string {
        // 首先检查是否有用户自定义的IP地址（通过localStorage存储）
        const savedIP = localStorage.getItem('customServerIP');
        if (savedIP && savedIP.trim() !== '') {
            console.log(`📍 使用用户自定义的IP地址: ${savedIP}`);
            return savedIP.trim();
        }
        
        // 在编辑器或本地开发环境下使用localhost
        if (window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.log('📍 在本地环境，使用localhost');
            return 'localhost';
        }
        
        // 获取当前页面的主机名，假设服务器在同一网络上
        if (window.location && window.location.hostname) {
            const hostname = window.location.hostname;
            console.log(`📍 使用当前主机名作为服务器IP: ${hostname}`);
            return hostname;
        }
        
        // 如果无法获取主机名，使用默认IP
        console.log('📍 无法确定IP地址，使用默认值');
        return '192.168.1.115'; // 默认IP
    }
    
    // 设置自定义服务器IP
    public setCustomServerIP(ip: string) {
        if (ip && ip.trim() !== '') {
            localStorage.setItem('customServerIP', ip.trim());
            console.log(`💾 已保存自定义服务器IP: ${ip.trim()}`);
            return true;
        }
        return false;
    }
    
    // 清除自定义服务器IP
    public clearCustomServerIP() {
        localStorage.removeItem('customServerIP');
        console.log('🗑️ 已清除自定义服务器IP');
    }

    connectToServer(callback?: () => void) {
        try {
            // 检查是否在编辑器预览模式下
            // 在编辑器预览模式下，WebSocket连接可能会受限
            if (window.location && window.location.hostname === 'localhost' && window.location.port === '7456') {
                console.warn('⚠️ 检测到编辑器预览模式，WebSocket连接可能受限');
                console.warn('💡 建议使用构建后的版本或本地环境进行联机测试');
            }
            
            // 动态获取服务器IP地址
            let serverIP = this.getServerIP();
            
            console.log(`🔗 尝试连接到服务器: ws://${serverIP}:7457`);
            this.ws = new WebSocket(`ws://${serverIP}:7457`);
            
            this.ws.onopen = () => {
                console.log('🔗 成功连接到联机服务器');
                this.isConnected = true;
                
                // 如果有回调函数，执行回调
                if (callback) {
                    callback();
                }
            };

            this.ws.onmessage = (event) => {
                console.log('=== NetworkManager 收到WebSocket消息 ===');
                console.log('原始消息数据:', event.data);
                try {
                    const data = JSON.parse(event.data);
                    console.log('解析后的数据:', data);
                    this.handleServerMessage(data);
                } catch (error) {
                    console.error('解析WebSocket消息时出错:', error);
                }
                console.log('=== NetworkManager WebSocket消息处理完毕 ===');
            };

            this.ws.onclose = (event) => {
                console.log('❌ 与服务器断开连接');
                console.log(`关闭代码: ${event.code}, 原因: ${event.reason}`);
                this.isConnected = false;
                this.isHost = false;
                
                // 5秒后尝试重连（仅在用户已尝试连接后才重连）
                if (this.hasUserAttemptedConnection) {
                    this.scheduleOnce(() => {
                        if (!this.isConnected) {
                            console.log('🔄 尝试重新连接...');
                            this.connectToServer();
                        }
                    }, 5.0);
                }
            };

            this.ws.onerror = (error) => {
                console.error('🌐 连接错误:', error);
                console.error('🌐 错误详情:', error);
                this.isConnected = false;
                
                // 检查是否是安全策略错误
                try {
                    const errorEvent = error as any;
                    if (errorEvent.message && errorEvent.message.includes('isTrusted')) {
                        console.warn('⚠️ 这可能是由于浏览器安全策略导致的，请检查：');
                        console.warn('  1. 服务器是否正在运行');
                        console.warn('  2. WebSocket端口(7457)是否正确');
                        console.warn('  3. 是否存在跨域问题');
                    }
                } catch (e) {
                    // 忽略错误详情解析失败
                }
            };

        } catch (error) {
            console.error('🔌 WebSocket创建失败:', error);
        }
    }

    handleServerMessage(data: any) {
        switch (data.type) {
            case 'room_created':
                this.playerId = data.playerId;
                this.roomId = data.roomId;
                this.isHost = data.isHost;
                console.log(`🏠 房间创建成功: ${data.roomId}`);
                
                // 为本地玩家设置昵称
                this.setLocalPlayerNickname();
                
                // 通知UI组件
                this.notifyRoomUI('room_created', data.roomId);
                
                // 启用聊天系统
                this.enableChatSystem();
                break;

            case 'room_joined':
                this.playerId = data.playerId;
                this.roomId = data.roomId;
                this.isHost = data.isHost;
                console.log(`🚪 成功加入房间: ${data.roomId}`);
                
                // 为本地玩家设置昵称
                this.setLocalPlayerNickname();
                
                // 通知UI组件
                this.notifyRoomUI('room_joined', data.roomId, data.isHost);
                
                // 启用聊天系统
                this.enableChatSystem();
                break;

            case 'room_not_found':
                console.log(`❌ 房间不存在: ${data.roomId}`);
                
                // 通知UI组件
                this.notifyRoomUI('room_not_found', data.roomId);
                break;

            case 'host_assigned':
                this.playerId = data.playerId;
                this.isHost = true;
                if (data.roomId) {
                    this.roomId = data.roomId;
                }
                console.log('👑 你成为了主机玩家');
                break;

            case 'host_changed':
                console.log(`👑 房主变更为: ${data.newHostId}`);
                if (data.newHostId === this.playerId) {
                    this.isHost = true;
                    console.log('👑 你成为了新的房主');
                } else {
                    this.isHost = false;
                }
                break;

            case 'player_joined_room':
                console.log(`👋 玩家 ${data.playerId} 加入了房间 ${data.roomId}`);
                // 这里不需要处理，由服务器通过existing_players通知
                break;

            case 'player_joined':
                console.log(`👋 新玩家加入: ${data.playerId}，当前玩家ID: ${this.playerId}`);
                if (data.isHost) {
                    console.log(`👑 ${data.playerId} 是主机玩家`);
                }
                // 为新玩家创建节点（严格检查确保这个新玩家不是自己）
                if (data.playerId !== this.playerId && this.playerId !== '') {
                    this.createOtherPlayer(data.playerId, data.position, data.animation);
                } else {
                    console.log(`⚠️ 跳过创建节点，因为是本地玩家或玩家ID未设置`);
                }
                break;

            case 'existing_players':
                console.log('📋 收到已有玩家列表，当前玩家ID: ' + this.playerId);
                data.players.forEach((player: any) => {
                    // 不为自己创建节点，添加更严格的检查
                    if (player.id !== this.playerId && this.playerId !== '') {
                        this.createOtherPlayer(player.id, player.position, player.animation);
                    } else {
                        console.log(`⚠️ 跳过创建玩家 ${player.id} 的节点，因为是本地玩家或玩家ID未设置`);
                    }
                });
                break;

            case 'player_update':
                this.updateOtherPlayer(data.playerId, data.position, data.animation);
                break;

            case 'player_attack':
                this.handleOtherPlayerAttack(data.playerId, data.direction);
                break;

            case 'player_left_room':
                console.log(`👋 玩家 ${data.playerId} 离开了房间 ${data.roomId}`);
                this.removeOtherPlayer(data.playerId);
                break;

            case 'player_left':
                console.log(`👋 玩家离开: ${data.playerId}`);
                this.removeOtherPlayer(data.playerId);
                break;
                
            case 'chat_message':
                console.log('=== NetworkManager 收到聊天消息 ===');
                console.log(`玩家ID: ${data.playerId}`);
                console.log(`消息内容: ${data.message}`);
                console.log(`完整数据:`, data);
                console.log('chatSystem 状态:', !!this.chatSystem);
                this.handleChatMessage(data.playerId, data.message);
                console.log('=== NetworkManager 聊天消息处理完毕 ===');
                break;
        }
    }

    createOtherPlayer(playerId: string, position: any, animation: string) {
        try {
            // 如果是自己，不创建
            if (playerId === this.playerId) {
                console.log(`⚠️ 跳过创建玩家 ${playerId}，因为是本地玩家`);
                return;
            }
            
            // 如果已经存在，不重复创建
            if (this.otherPlayers.has(playerId)) {
                console.log(`⚠️ 玩家 ${playerId} 已存在，跳过创建`);
                return;
            }

            // 加载玩家预制体
            if (!this.otherPlayerPrefab) {
                console.error('❌ 未设置玩家预制体，无法创建其他玩家');
                return;
            }

            // 实例化预制体
            const otherPlayer = instantiate(this.otherPlayerPrefab);
            
            if (!otherPlayer) {
                console.error('❌ 实例化玩家预制体失败');
                return;
            }

            // 将节点重命名为 otherPlayer + playerId (用于区分多个其他玩家)
            otherPlayer.name = `otherPlayer${playerId}`;

            // 获取hero组件并设置为网络玩家
            const heroComponent = otherPlayer.getComponent(hero);
            if (!heroComponent) {
                console.error('❌ 玩家预制体缺少hero组件');
                return;
            }
            
            // 设置为网络玩家（不需要输入控制、UI和摄像机）
            heroComponent.isNetworkPlayer = true;

            // 查找并禁用相机节点
            const cameraNode = otherPlayer.getChildByName('Camera');
            if (cameraNode) {
                cameraNode.active = false;
                console.log(`📷 已禁用玩家 ${playerId} 的相机节点`);
            } else {
                console.warn(`⚠️ 未找到玩家 ${playerId} 的相机节点`);
            }

            // 将玩家节点添加到 map 节点下
            const scene = director.getScene();
            if (scene) {
                // 按照场景结构: Canvas -> bg -> view -> map
                const canvasNode = scene.getChildByName('Canvas');
                if (canvasNode) {
                    const bgNode = canvasNode.getChildByName('bg');
                    if (bgNode) {
                        const viewNode = bgNode.getChildByName('view');
                        if (viewNode) {
                            const mapNode = viewNode.getChildByName('map');
                            if (mapNode) {
                                mapNode.addChild(otherPlayer);
                            } else {
                                console.error('❌ 未找到map节点');
                                viewNode.addChild(otherPlayer);
                            }
                        } else {
                            console.error('❌ 未找到view节点');
                            bgNode.addChild(otherPlayer);
                        }
                    } else {
                        console.error('❌ 未找到bg节点');
                        canvasNode.addChild(otherPlayer);
                    }
                } else {
                    console.error('❌ 未找到Canvas节点');
                    scene.addChild(otherPlayer);
                }
            } else {
                // 如果无法获取场景，则添加到当前节点下（虽然不理想，但作为备用方案）
                this.node.addChild(otherPlayer);
            }
            
            // 设置位置
            otherPlayer.setPosition(position.x, position.y, 0);

            
            this.otherPlayers.set(playerId, otherPlayer);
            console.log(`🎮 创建其他玩家: otherPlayer${playerId} 在位置 (${position.x}, ${position.y})`);
            
            // 初始化动画状态
            if (animation && animation !== 'idle') {
                if (heroComponent) {
                    heroComponent.updateAnimation(animation);
                }
            }
            
            // 设置玩家昵称
            if (heroComponent) {
                // 使用完整的玩家ID作为昵称
                heroComponent.setNickname(playerId);
                // 立即显示昵称
                heroComponent.showNickname();
            }
            
        } catch (error) {
            console.error(`❌ 创建玩家 ${playerId} 时发生错误:`, error);
        }
    }

    updateOtherPlayer(playerId: string, position: any, animation: string) {
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer) {
            // 直接设置位置，因为10ms的更新频率足够平滑
            otherPlayer.setPosition(position.x, position.y, otherPlayer.position.z);
            
            // 更新动画状态（需要在hero组件中实现动画切换）
            const heroComponent = otherPlayer.getComponent(hero);
            if (heroComponent) {
                try {
                    // 更新动画
                    if (heroComponent.updateAnimation) {
                        // 如果是跳跃动画，添加日志以便调试
                        if (animation === 'jump') {
                            console.log(`🦘 更新玩家 ${playerId} 跳跃动画`);
                        }
                        heroComponent.updateAnimation(animation);
                    }
                    
                    // 如果位置数据包含方向信息，更新玩家朝向
                    if (position.direction !== undefined) {
                        if (heroComponent.updateDirection) {
                            heroComponent.updateDirection(position.direction);
                        } else {
                            // 备用方案：直接设置character节点的scale
                            const characterNode = otherPlayer.getChildByName("character");
                            if (characterNode) {
                                // direction: 1为右，-1为左
                                characterNode.setScale(position.direction, 1, 1);
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ 更新玩家 ${playerId} 动画或方向时出错:`, error);
                }
            } else {
                console.warn(`⚠️ 玩家 ${playerId} 缺少hero组件`);
            }
        } else {
            console.warn(`⚠️ 未找到玩家 ${playerId}，可能需要先创建`);
        }
    }

    handleOtherPlayerAttack(playerId: string, direction: string) {
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer) {
            const heroComponent = otherPlayer.getComponent(hero);
            if (heroComponent && heroComponent.playAttackAnimation) {
                try {
                    heroComponent.playAttackAnimation(direction);
                    console.log(`⚔️ 玩家 ${playerId} 执行攻击动画: ${direction}`);
                } catch (error) {
                    console.warn(`⚠️ 玩家 ${playerId} 执行攻击动画时出错:`, error);
                }
            } else {
                console.warn(`⚠️ 玩家 ${playerId} 缺少hero组件或playAttackAnimation方法`);
            }
        } else {
            console.warn(`⚠️ 未找到玩家 ${playerId}，无法执行攻击动画`);
        }
    }

    removeOtherPlayer(playerId: string) {
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer) {
            // 如果玩家有昵称标签，先隐藏
            const heroComponent = otherPlayer.getComponent(hero);
            if (heroComponent) {
                heroComponent.hideNickname();
            }
            
            otherPlayer.destroy();
            this.otherPlayers.delete(playerId);
        }
    }

    // 发送位置更新
    sendPositionUpdate(position: any, animation: string) {
        if (!this.isConnected || !this.ws) return;

        const now = Date.now();
        
        // 检查位置和动画是否发生变化
        let positionChanged = false;
        if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
            // 如果position对象包含direction信息，需要特殊处理
            if (this.lastPosition.x !== position.x || this.lastPosition.y !== position.y) {
                positionChanged = true;
            }
        } else {
            // 兼容旧的Vec3格式
            if (!this.lastPosition.equals(position)) {
                positionChanged = true;
            }
        }
        
        // 如果动画有变化，或者位置有变化，且满足时间间隔要求
        const animationChanged = this.lastAnimation !== animation;
        const shouldUpdate = (now - this.lastUpdateTime >= this.positionUpdateInterval) || animationChanged;
        
        if (!positionChanged && !animationChanged) return;

        // 更新记录的位置和动画
        if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
            this.lastPosition.set(position.x, position.y, 0);
        } else {
            this.lastPosition.set(position);
        }
        this.lastAnimation = animation;
        this.lastUpdateTime = now;

        // 创建消息，包含方向信息（如果有）
        const message: any = {
            type: 'position_update',
            animation: animation
        };
        
        // 处理位置信息
        if (typeof position === 'object' && position.x !== undefined && position.y !== undefined) {
            // 新格式，包含方向信息
            message.position = {
                x: position.x,
                y: position.y,
                direction: position.direction !== undefined ? position.direction : 1
            };
        } else {
            // 旧格式，兼容性处理
            message.position = {
                x: position.x,
                y: position.y,
                direction: 1 // 默认朝右
            };
        }

        this.ws.send(JSON.stringify(message));
    }

    // 发送攻击事件
    sendAttackEvent(direction: string) {
        if (!this.isConnected || !this.ws) return;

        const message = {
            type: 'attack',
            direction: direction
        };

        this.ws.send(JSON.stringify(message));
    }

    // 发送聊天消息
    sendChatMessage(message: string) {
        console.log('=== NetworkManager 发送聊天消息 ===');
        console.log('连接状态:', this.isConnected);
        console.log('WebSocket状态:', this.ws ? this.ws.readyState : 'null');
        console.log('原始消息:', message);
        console.log('玩家ID:', this.playerId);
        
        if (!message || message.trim() === '') {
            console.log('消息为空，不发送');
            return;
        }

        // 不再在这里显示消息，由ChatSystem自己处理
        // 这样避免了消息显示两次的问题

        if (!this.isConnected) {
            console.error('未连接到服务器，无法发送消息到其他玩家');
            return;
        }
        
        if (!this.ws) {
            console.error('WebSocket为空，无法发送消息');
            return;
        }

        const chatMessage = {
            type: 'chat_message',
            message: message.trim()
        };
        
        console.log('发送的消息数据:', chatMessage);
        
        try {
            this.ws.send(JSON.stringify(chatMessage));
            console.log('消息已发送到服务器');
        } catch (error) {
            console.error('发送消息时出错:', error);
        }
        
        console.log('=== NetworkManager 发送聊天消息完毕 ===');
    }

    // 创建房间
    createRoom() {
        // 标记用户已尝试连接服务器
        this.hasUserAttemptedConnection = true;
        
        // 获取当前场景中的玩家节点
        const scene = director.getScene();
        if (!scene) {
            console.error('❌ 无法获取当前场景');
            return;
        }
        
        // 按照场景结构查找玩家节点: Canvas -> bg -> view -> map -> player
        let playerNode = null;
        
        // 首先尝试从场景结构中查找
        const canvasNode = scene.getChildByName('Canvas');
        if (canvasNode) {
            const bgNode = canvasNode.getChildByName('bg');
            if (bgNode) {
                const viewNode = bgNode.getChildByName('view');
                if (viewNode) {
                    const mapNode = viewNode.getChildByName('map');
                    if (mapNode) {
                        playerNode = mapNode.getChildByName('player');
                    }
                }
            }
        }
        
        if (!playerNode) {
            console.error('❌ 未找到玩家节点，无法创建房间');
            return;
        }
        
        // 获取玩家组件并确保网络管理器已正确初始化
        const heroComponent = playerNode.getComponent(hero);
        if (heroComponent) {
            // 设置网络管理器引用
            heroComponent.networkManager = this;
            console.log('✅ 已为玩家设置网络管理器');
            
            // 在连接成功后设置玩家昵称
            this.scheduleOnce(() => {
                if (this.playerId) {
                    // 使用完整的玩家ID作为昵称
                    heroComponent.setNickname(this.playerId);
                    // 立即显示昵称
                    heroComponent.showNickname();
                }
            }, 0.5); // 延迟一点时间确保playerId已设置
        } else {
            console.error('❌ 玩家节点缺少hero组件');
        }
        
        // 如果未连接服务器，先连接服务器
        if (!this.isConnected || !this.ws) {
            console.log('🔗 正在连接服务器以创建房间...');
            this.connectToServer(() => {
                // 连接成功后创建房间
                this.sendMessage({
                    type: 'create_room'
                });
            });
        } else {
            // 已经连接，直接创建房间
            this.sendMessage({
                type: 'create_room'
            });
        }
    }

    // 加入房间
    joinRoom(roomId: number) {
        // 标记用户已尝试连接服务器
        this.hasUserAttemptedConnection = true;
        
        // 如果未连接服务器，先连接服务器
        if (!this.isConnected || !this.ws) {
            console.log('🔗 正在连接服务器以加入房间...');
            this.connectToServer(() => {
                // 连接成功后加入房间
                this.sendMessage({
                    type: 'join_room',
                    roomId: roomId
                });
            });
        } else {
            // 已经连接，直接加入房间
            this.sendMessage({
                type: 'join_room',
                roomId: roomId
            });
        }
    }

    // 离开房间
    leaveRoom() {
        // 通知UI组件
        this.notifyRoomUI('leave_room');
        
        // 隐藏本地玩家昵称
        this.hideLocalPlayerNickname();
        
        // 禁用聊天系统
        this.disableChatSystem();
        
        // 清理其他玩家
        this.otherPlayers.forEach((player, playerId) => {
            this.removeOtherPlayer(playerId);
        });
        
        this.roomId = null;
        this.isHost = false;
        
        console.log('🚪 离开房间');
    }

    // 通用消息发送方法
    sendMessage(message: any) {
        if (!this.isConnected || !this.ws) return;
        
        this.ws.send(JSON.stringify(message));
    }

    // 通知UI组件
    private notifyRoomUI(action: string, roomId?: number, isHost?: boolean) {
        let roomUI = null;
        
        // 尝试从场景中查找RoomUI节点（按照节点路径查找）
        const scene = director.getScene();
        if (scene) {
            // 按照场景结构: Canvas -> bg -> view -> map -> RoomUI
            const canvasNode = scene.getChildByName('Canvas');
            if (canvasNode) {
                const bgNode = canvasNode.getChildByName('bg');
                if (bgNode) {
                    const viewNode = bgNode.getChildByName('view');
                    if (viewNode) {
                        const mapNode = viewNode.getChildByName('map');
                        if (mapNode) {
                            // 注意：场景文件中节点名是"roomUI"（小写）
                            const roomUINode = mapNode.getChildByName('roomUI');
                            if (roomUINode) {
                                roomUI = roomUINode.getComponent(RoomUI);
                            }
                        }
                    }
                }
            }
        }
        
        // 如果没找到，尝试从同一节点获取RoomUI组件
        if (!roomUI) {
            roomUI = this.node.getComponent('RoomUI') as RoomUI;
        }
        
        // 如果没找到，尝试从父节点的子节点中查找
        if (!roomUI && this.node.parent) {
            const roomUINode = this.node.parent.getChildByName('RoomUI');
            if (roomUINode) {
                roomUI = roomUINode.getComponent(RoomUI);
            }
        }
        
        if (!roomUI) {
            console.warn('⚠️ 未找到RoomUI组件');
            return;
        }

        switch (action) {
            case 'room_created':
                roomUI.showRoomId(roomId!);
                break;
            case 'room_joined':
                roomUI.onRoomJoined(roomId!, isHost!);
                break;
            case 'room_not_found':
                roomUI.onRoomNotFound(roomId!);
                break;
            case 'leave_room':
                roomUI.leaveRoom();
                break;
        }
    }

    // 获取连接状态
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            isHost: this.isHost,
            playerId: this.playerId,
            roomId: this.roomId,
            otherPlayersCount: this.otherPlayers.size
        };
    }
    
    // 为本地玩家设置昵称
    private setLocalPlayerNickname() {
        if (!this.playerId) {
            console.warn('⚠️ 玩家ID未设置，无法设置昵称');
            return;
        }
        
        // 获取本地玩家节点
        const scene = director.getScene();
        if (!scene) {
            console.error('❌ 无法获取当前场景');
            return;
        }
        
        // 按照场景结构查找玩家节点: Canvas -> bg -> view -> map -> player
        let playerNode = null;
        const canvasNode = scene.getChildByName('Canvas');
        if (canvasNode) {
            const bgNode = canvasNode.getChildByName('bg');
            if (bgNode) {
                const viewNode = bgNode.getChildByName('view');
                if (viewNode) {
                    const mapNode = viewNode.getChildByName('map');
                    if (mapNode) {
                        playerNode = mapNode.getChildByName('player');
                    }
                }
            }
        }
        
        if (!playerNode) {
            console.error('❌ 未找到玩家节点，无法设置昵称');
            return;
        }
        
        // 获取hero组件
        const heroComponent = playerNode.getComponent(hero);
        if (heroComponent) {
            // 使用完整的玩家ID作为昵称
            heroComponent.setNickname(this.playerId);
            // 立即显示昵称
            heroComponent.showNickname();
            console.log(`✅ 本地玩家昵称设置为: player_${this.playerId}`);
        } else {
            console.error('❌ 玩家节点缺少hero组件');
        }
    }
    
    // 隐藏本地玩家昵称
    private hideLocalPlayerNickname() {
        // 获取本地玩家节点
        const scene = director.getScene();
        if (!scene) {
            console.error('❌ 无法获取当前场景');
            return;
        }
        
        // 按照场景结构查找玩家节点: Canvas -> bg -> view -> map -> player
        let playerNode = null;
        const canvasNode = scene.getChildByName('Canvas');
        if (canvasNode) {
            const bgNode = canvasNode.getChildByName('bg');
            if (bgNode) {
                const viewNode = bgNode.getChildByName('view');
                if (viewNode) {
                    const mapNode = viewNode.getChildByName('map');
                    if (mapNode) {
                        playerNode = mapNode.getChildByName('player');
                    }
                }
            }
        }
        
        if (!playerNode) {
            console.error('❌ 未找到玩家节点，无法隐藏昵称');
            return;
        }
        
        // 获取hero组件
        const heroComponent = playerNode.getComponent(hero);
        if (heroComponent) {
            heroComponent.hideNickname();
            console.log('✅ 本地玩家昵称已隐藏');
        } else {
            console.error('❌ 玩家节点缺少hero组件');
        }
    }
    
    // 测试服务器连接（用于调试）
    public testConnection(serverIP?: string) {
        // 如果未指定IP，使用动态获取的IP
        if (!serverIP) {
            serverIP = this.getServerIP();
        }
        
        console.log(`🧪 测试连接到服务器: ${serverIP}:7457`);
        
        try {
            const testWs = new WebSocket(`ws://${serverIP}:7457`);
            
            testWs.onopen = () => {
                console.log('✅ 测试连接成功！');
                console.log('💡 服务器正在运行，可以尝试联机');
                console.log('💡 可以使用这个IP地址: ' + serverIP);
                testWs.close();
            };
            
            testWs.onerror = (error) => {
                console.error('❌ 测试连接失败:', error);
                console.error('💡 可能的原因：');
                console.error('  1. 服务器未启动');
                console.error('  2. IP地址错误 (' + serverIP + ')');
                console.error('  3. 防火墙阻止连接');
                console.error('  4. 端口7457被占用');
                console.error('💡 解决方案：');
                console.error('  1. 检查服务器是否已启动');
                console.error('  2. 使用 networkManager.setCustomServerIP("正确的IP地址") 设置正确的IP');
                console.error('  3. 检查防火墙设置');
                
                // 尝试获取更多错误信息
                try {
                    const errorEvent = error as any;
                    if (errorEvent.message) {
                        console.error('错误详情:', errorEvent.message);
                    }
                } catch (e) {
                    // 忽略错误详情解析失败
                }
            };
            
            testWs.onclose = () => {
                console.log('🔚 测试连接已关闭');
            };
            
            // 5秒后自动关闭测试连接（如果还未关闭）
            this.scheduleOnce(() => {
                if (testWs.readyState === WebSocket.OPEN) {
                    testWs.close();
                }
            }, 5.0);
            
        } catch (error) {
            console.error('❌ 创建测试连接失败:', error);
        }
    }

    // 处理聊天消息
    private handleChatMessage(playerId: string, message: string) {
        console.log('=== NetworkManager 处理聊天消息 ===');
        console.log('玩家ID:', playerId);
        console.log('消息内容:', message);
        console.log('当前 chatSystem 状态:', !!this.chatSystem);
        
        // 获取聊天系统组件
        if (!this.chatSystem) {
            console.log('NetworkManager: chatSystem为空，尝试获取');
            this.getChatSystem();
            console.log('获取后的 chatSystem 状态:', !!this.chatSystem);
        }
        
        if (this.chatSystem) {
            console.log('NetworkManager: 准备调用chatSystem.receiveMessage');
            // 不直接访问私有属性，只检查组件是否存在
            
            // 只显示来自其他玩家的消息，不显示自己的消息
            // 自己的消息已经在ChatSystem.sendMessage()中显示过了
            if (playerId !== this.playerId) {
                console.log('接收来自其他玩家的消息，显示在聊天框');
                this.chatSystem.receiveMessage(playerId, message);
            } else {
                console.log('接收来自自己的消息，跳过显示（已在发送时显示）');
            }
            console.log('NetworkManager: chatSystem.receiveMessage 调用完成');
        } else {
            console.error('NetworkManager: 无法获取chatSystem组件');
        }
        console.log('=== NetworkManager 聊天消息处理完毕 ===');
    }
    
    // 获取聊天系统组件
    private getChatSystem() {
        // 如果已经有引用，直接返回
        if (this.chatSystem) {
            return;
        }
        
        console.log('NetworkManager: 开始查找ChatSystem组件');
        
        // 从场景中查找聊天系统组件
        const scene = director.getScene();
        if (scene) {
            // 尝试多种路径查找chat节点
            const canvasNode = scene.getChildByName('Canvas');
            if (canvasNode) {
                // 路径1: Canvas -> ui_hud -> uiCamera -> chat
                const uiHudNode = canvasNode.getChildByName('ui_hud');
                if (uiHudNode) {
                    console.log('NetworkManager: 找到ui_hud节点');
                    const uiCameraNode = uiHudNode.getChildByName('uiCamera');
                    if (uiCameraNode) {
                        console.log('NetworkManager: 找到uiCamera节点');
                        const chatNode = uiCameraNode.getChildByName('chat');
                        if (chatNode) {
                            console.log('NetworkManager: 找到chat节点');
                            this.chatSystem = chatNode.getComponent(ChatSystem);
                            if (this.chatSystem) {
                                console.log('从路径1找到ChatSystem组件');
                                return;
                            }
                        } else {
                            console.log('NetworkManager: chat节点不存在');
                        }
                    } else {
                        console.log('NetworkManager: uiCamera节点不存在');
                    }
                }
                
                // 路径2: Canvas -> ui_hud -> chat
                if (!this.chatSystem && uiHudNode) {
                    console.log('NetworkManager: 尝试路径2');
                    const chatNode = uiHudNode.getChildByName('chat');
                    if (chatNode) {
                        console.log('NetworkManager: 从路径2找到chat节点');
                        this.chatSystem = chatNode.getComponent(ChatSystem);
                        if (this.chatSystem) {
                            console.log('从路径2找到ChatSystem组件');
                            return;
                        }
                    } else {
                        console.log('NetworkManager: 路径2中的chat节点不存在');
                    }
                }
                
                // 路径3: 直接检查ui_hud的所有子节点，查找包含ChatSystem组件的节点
                if (!this.chatSystem && uiHudNode) {
                    console.log('NetworkManager: 尝试路径3，检查ui_hud的所有子节点');
                    for (const child of uiHudNode.children) {
                        const chatSystem = child.getComponent(ChatSystem);
                        if (chatSystem) {
                            this.chatSystem = chatSystem;
                            console.log('从路径3找到ChatSystem组件，节点名:', child.name);
                            return;
                        }
                    }
                }
            } else {
                console.log('NetworkManager: Canvas节点不存在');
            }
            
            // 如果还是找不到，尝试从全局查找任何包含ChatSystem组件的节点
            if (!this.chatSystem) {
                console.log('NetworkManager: 尝试递归查找ChatSystem组件');
                const result = this.findChatSystemRecursively(scene);
                if (result) {
                    this.chatSystem = result;
                    console.log('从场景中递归找到ChatSystem组件');
                }
            }
        }
        
        if (!this.chatSystem) {
            console.warn('未找到ChatSystem组件');
        }
    }
    
    // 递归查找ChatSystem组件
    private findChatSystemRecursively(node: Node): ChatSystem | null {
        // 检查当前节点
        const chatSystem = node.getComponent(ChatSystem);
        if (chatSystem) {
            return chatSystem;
        }
        
        // 递归检查子节点
        if (node.children) {
            for (const child of node.children) {
                const result = this.findChatSystemRecursively(child);
                if (result) {
                    return result;
                }
            }
        }
        
        return null;
    }
    
    // 启用聊天系统
    private enableChatSystem() {
        console.log('NetworkManager: 尝试启用聊天系统');
        // 获取聊天系统组件
        if (!this.chatSystem) {
            this.getChatSystem();
        }
        
        if (this.chatSystem) {
            console.log('NetworkManager: 找到聊天系统组件，调用enableChat');
            this.chatSystem.enableChat();
        } else {
            console.error('NetworkManager: 无法找到聊天系统组件');
        }
    }
    
    // 禁用聊天系统
    private disableChatSystem() {
        // 获取聊天系统组件
        if (!this.chatSystem) {
            this.getChatSystem();
        }
        
        if (this.chatSystem) {
            this.chatSystem.disableChat();
        }
    }

    onDestroy() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.otherPlayers.clear();
        this.isConnected = false;
        this.isHost = false;
        this.playerId = '';
        this.roomId = null;
        this.hasUserAttemptedConnection = false;
        this.chatSystem = null;
    }
}