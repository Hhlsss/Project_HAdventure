import { _decorator, Component, Node, Label, Button, EditBox, director, systemEvent, macro, EventKeyboard, SystemEvent } from 'cc';
import { NetworkManager } from './NetworkManager';
const { ccclass, property } = _decorator;

@ccclass('RoomUI')
export class RoomUI extends Component {
    @property({ type: Button })
    public hostButton: Button | null = null;

    @property({ type: Button })
    public joinButton: Button | null = null;

    @property({ type: EditBox })
    public roomInput: EditBox | null = null;

    @property({ type: Label })
    public statusLabel: Label | null = null;

    @property({ type: Label })
    public roomLabel: Label | null = null;

    @property({ type: Node })
    public menuPanel: Node | null = null;

    private networkManager: NetworkManager | null = null;
    private isInRoom: boolean = false;

    start() {
        // 获取NetworkManager组件
        this.networkManager = this.node.getComponent(NetworkManager);
        
        // 如果没找到，尝试从场景中查找
        if (!this.networkManager) {
            const scene = director.getScene();
            if (scene) {
                // 按照场景结构: Canvas -> bg -> view -> map -> NetworkManager
                const canvasNode = scene.getChildByName('Canvas');
                if (canvasNode) {
                    const bgNode = canvasNode.getChildByName('bg');
                    if (bgNode) {
                        const viewNode = bgNode.getChildByName('view');
                        if (viewNode) {
                            const mapNode = viewNode.getChildByName('map');
                            if (mapNode) {
                                const networkNode = mapNode.getChildByName('NetworkManager');
                                if (networkNode) {
                                    this.networkManager = networkNode.getComponent(NetworkManager);
                                }
                            }
                        }
                    }
                }
            }
        }
        
        if (!this.networkManager) {
            console.error('RoomUI: 未找到NetworkManager组件');
            return;
        }

        // 设置初始状态
        this.updateStatus("单机游戏模式 \n- 点击Host创建房间或Join加入房间", "#ffffff");

        // 绑定按钮事件
        if (this.hostButton) {
            this.hostButton.node.on(Button.EventType.CLICK, this.onHostClicked, this);
        }

        if (this.joinButton) {
            this.joinButton.node.on(Button.EventType.CLICK, this.onJoinClicked, this);
        }

        // 设置输入框的回车键事件和文本变化事件
        if (this.roomInput) {
            this.roomInput.node.on('editing-did-ended', this.onJoinClicked, this);
            // 监听文本变化，确保实时显示输入内容
            this.roomInput.node.on(EditBox.EventType.TEXT_CHANGED, this.onInputChanged, this);
        }

        // 默认显示菜单
        if (this.menuPanel) {
            this.menuPanel.active = true;
        }

        // 添加调试信息到状态标签
        this.addDebugInfoToStatus();
        
        // 添加服务器IP设置功能
        this.addServerIPInput();

        console.log('RoomUI 组件初始化完成');
    }

    onDestroy() {
        // 清理事件监听
        if (this.hostButton) {
            this.hostButton.node.off(Button.EventType.CLICK, this.onHostClicked, this);
        }

        if (this.joinButton) {
            this.joinButton.node.off(Button.EventType.CLICK, this.onJoinClicked, this);
        }

        if (this.roomInput) {
            this.roomInput.node.off('editing-did-ended', this.onJoinClicked, this);
        }
    }

    // 创建房间按钮点击事件
    onHostClicked() {
        if (!this.networkManager) {
            this.updateStatus("网络管理器未初始化", "#ff6666");
            return;
        }

        console.log('🏠 请求创建房间');
        this.updateStatus("正在创建房间...", "#ffff66");

        // 请求网络管理器创建房间
        if (this.networkManager.createRoom) {
            this.networkManager.createRoom();
        } else {
            // 发送创建房间消息
            this.networkManager.sendMessage({
                type: 'create_room'
            });
        }
    }

    // 输入框文本变化事件
    onInputChanged() {
        // 当输入框内容变化时，确保显示
        // 这里可以添加实时验证逻辑
        this.roomInput.node.getChildByName("TEXT_LABEL").active=true
    }
    
    // 加入房间按钮点击事件
    onJoinClicked() {
        if (!this.networkManager) {
            this.updateStatus("网络管理器未初始化", "#ff6666");
            return;
        }
        
        const roomId = this.roomInput?.string?.trim();
        
        if (!roomId) {
            this.updateStatus("请输入房间号", "#ff6666");
            return;
        }
        
        // 验证房间号格式（确保是数字）
        if (!/^\d+$/.test(roomId)) {
            this.updateStatus("房间号必须是数字", "#ff6666");
            return;
        }
        
        console.log(`🚪 请求加入房间: ${roomId}`);
        this.updateStatus(`正在加入房间 ${roomId}...`, "#ffff66");
        
        // 请求网络管理器加入房间
        if (this.networkManager.joinRoom) {
            this.networkManager.joinRoom(parseInt(roomId));
        } else {
            // 发送加入房间消息
            this.networkManager.sendMessage({
                type: 'join_room',
                roomId: parseInt(roomId)
            });
        }
    }

    // 更新状态标签
    updateStatus(message: string, color: string = "#ffffff") {
        if (this.statusLabel) {
            this.statusLabel.string = message;
            //this.statusLabel.color = this.hexToColor(color);
        }
    }

    // 显示房间号
    showRoomId(roomId: number) {
        if (this.roomLabel) {
            this.roomLabel.string = `房间号: ${roomId}`;
            this.roomLabel.node.active = true;
        }

        // 隐藏菜单面板
        if (this.menuPanel) {
            this.menuPanel.active = false;
        }

        this.updateStatus(`房间创建成功！房间号: ${roomId}`, "#66ff66");
        this.isInRoom = true;
    }

    // 加入房间成功
    onRoomJoined(roomId: number, isHost: boolean) {
        if (this.roomLabel) {
            this.roomLabel.string = `房间号: ${roomId}${isHost ? ' (房主)' : ''}`;
            this.roomLabel.node.active = true;
        }

        // 隐藏菜单面板
        if (this.menuPanel) {
            this.menuPanel.active = false;
        }

        this.updateStatus(`成功加入房间 ${roomId}!`, "#66ff66");
        this.isInRoom = true;
    }

    // 房间不存在
    onRoomNotFound(roomId: number) {
        this.updateStatus(`房间 ${roomId} 不存在，请检查房间号`, "#ff6666");
    }

    // 离开房间
    leaveRoom() {
        this.isInRoom = false;
        
        if (this.roomLabel) {
            this.roomLabel.node.active = false;
        }

        if (this.menuPanel) {
            this.menuPanel.active = true;
        }

        this.updateStatus("已离开房间，请重新选择", "#ffffff");
        
        if (this.roomInput) {
            this.roomInput.string = "";
        }
    }

    // 工具函数：十六进制颜色转换
    private hexToColor(hex: string) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }

    // 获取当前状态
    isInRoomState() {
        return this.isInRoom;
    }
    
    /**
     * 添加调试信息到状态标签
     */
    private addDebugInfoToStatus() {
        if (this.statusLabel) {
            const currentText = this.statusLabel.string;
            const debugInfo = ` \n(调试: 按'I'键设置服务器IP)`;
            this.statusLabel.string = currentText + debugInfo;
        }
    }
    
    /**
     * 添加服务器IP设置功能
     */
    private addServerIPInput() {
        // 监听'I'键，用于设置服务器IP
        systemEvent.on(SystemEvent.EventType.KEY_DOWN, (event: EventKeyboard) => {
            if (event.keyCode === macro.KEY.i) {
                this.showServerIPInputDialog();
            }
        }, this);
    }
    
    /**
     * 显示服务器IP输入对话框
     */
    private showServerIPInputDialog() {
        // 创建一个简单的输入对话框
        const ip = prompt('请输入服务器IP地址（例如：192.168.1.115 或 localhost）:', 
                         localStorage.getItem('customServerIP') || 'localhost');
        
        if (ip !== null && ip.trim() !== '') {
            // 验证IP格式
            if (this.isValidIP(ip.trim())) {
                // 设置自定义IP
                if (this.networkManager && (this.networkManager as any).setCustomServerIP) {
                    (this.networkManager as any).setCustomServerIP(ip.trim());
                    this.showTemporaryMessage(`服务器IP已设置为: ${ip.trim()}`);
                } else {
                    // 如果networkManager不存在，直接存储到localStorage
                    localStorage.setItem('customServerIP', ip.trim());
                    this.showTemporaryMessage(`服务器IP已保存: ${ip.trim()}`);
                }
            } else {
                this.showTemporaryMessage('无效的IP地址格式');
            }
        }
    }
    
    /**
     * 验证IP地址格式
     */
    private isValidIP(ip: string): boolean {
        // 检查是否为localhost
        if (ip === 'localhost' || ip === '127.0.0.1') {
            return true;
        }
        
        // 检查IPv4格式
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipv4Regex.test(ip)) {
            return false;
        }
        
        // 检查每个数字是否在0-255范围内
        const parts = ip.split('.');
        for (const part of parts) {
            const num = parseInt(part, 10);
            if (num < 0 || num > 255) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 显示临时消息
     */
    private showTemporaryMessage(message: string) {
        if (this.statusLabel) {
            const originalText = this.statusLabel.string;
            this.statusLabel.string = message;
            
            // 3秒后恢复原始文本
            this.scheduleOnce(() => {
                if (this.statusLabel) {
                    this.statusLabel.string = originalText;
                }
            }, 3.0);
        }
    }
}