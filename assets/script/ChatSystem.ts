import { _decorator, Component, Node, EditBox, ScrollView, Label, Button, director, EventKeyboard, input, KeyCode, Input, UITransform, color } from 'cc';
import { NetworkManager } from './NetworkManager';
const { ccclass, property } = _decorator;

@ccclass('ChatSystem')
export class ChatSystem extends Component {
    private chatInput: EditBox | null = null;
    
    private chatScrollView: ScrollView | null = null;
    
    private sendButton: Button | null = null;
    
    private chatNode: Node | null = null;
    
    private networkManager: NetworkManager | null = null;
    private isInRoom: boolean = false;
    private maxMessages: number = 50; // 最大消息数量
    private messages: string[] = []; // 存储聊天消息
    private isSendingMessage: boolean = false; // 防止重复发送消息的标志
    
    // 添加全局引用，方便调试
    public static instance: ChatSystem | null = null;

    start() {
        // 设置全局引用，方便调试
        ChatSystem.instance = this;
        window.chatSystem = this; // 添加到全局窗口对象，方便调试
        
        // 获取子节点引用
        this.chatNode = this.node;
        this.chatInput = this.node.getChildByName('chatMsg')?.getComponent(EditBox) || null;
        this.chatScrollView = this.node.getChildByName('chatContent')?.getComponent(ScrollView) || null;
        this.sendButton = this.node.getChildByName('send')?.getComponent(Button) || null;
        
        console.log('聊天系统: ChatSystem组件启动');
        console.log('聊天系统: 节点引用获取情况:', {
            chatNode: !!this.chatNode,
            chatInput: !!this.chatInput,
            chatScrollView: !!this.chatScrollView,
            sendButton: !!this.sendButton
        });
        
        // 初始时禁用聊天节点
        if (this.chatNode) {
            this.chatNode.active = false;
            console.log('聊天系统: 初始时禁用聊天节点');
        } else {
            console.warn('聊天系统: chatNode为空');
        }

        // 获取NetworkManager组件
        this.getNetworkManager();
        console.log('聊天系统: 获取NetworkManager结果', !!this.networkManager);
        
        // 绑定发送按钮事件
        if (this.sendButton) {
            this.sendButton.node.on(Button.EventType.CLICK, this.sendMessage, this);
            console.log('聊天系统: 绑定发送按钮事件');
        } else {
            console.warn('聊天系统: sendButton为空');
        }
        
        // 添加键盘事件，按Enter键发送消息
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        
        // 添加全局测试方法，方便调试
        (window as any).enableChatDebug = () => {
            console.log('调试：手动启用聊天系统');
            this.enableChat();
        };
        
        // 添加手动强制启用聊天系统的测试方法
        (window as any).forceEnableChat = () => {
            console.log('调试：强制启用聊天系统');
            this.isInRoom = true;
            
            // 重新获取所有组件
            this.chatNode = this.node;
            this.chatInput = this.node.getChildByName('chatMsg')?.getComponent(EditBox) || null;
            this.chatScrollView = this.node.getChildByName('chatContent')?.getComponent(ScrollView) || null;
            this.sendButton = this.node.getChildByName('send')?.getComponent(Button) || null;
            this.getNetworkManager();
            
            console.log('强制启用聊天系统后的状态:', {
                isInRoom: this.isInRoom,
                chatNodeActive: this.chatNode ? this.chatNode.active : 'no chatNode',
                chatInput: !!this.chatInput,
                chatScrollView: !!this.chatScrollView,
                sendButton: !!this.sendButton,
                networkManager: !!this.networkManager
            });
            
            if (this.chatNode) {
                this.chatNode.active = true;
            }
            
            // 添加系统消息
            this.receiveMessage("系统", "聊天系统已强制启用");
            
            return this;
        };
        
        // 添加测试消息接收的方法
        (window as any).testReceiveMessage = (playerId: string, message: string) => {
            console.log(`测试接收消息: 玩家${playerId}发送消息: ${message}`);
            this.receiveMessage(playerId, message);
        };
        
        // 添加直接测试更新UI的方法
        (window as any).testUpdateChatUI = () => {
            console.log('测试更新聊天UI');
            this.updateChatUI();
        };
    }

    onDestroy() {
        // 清理事件监听
        if (this.sendButton) {
            //this.sendButton.node.off(Button.EventType.CLICK, this.sendMessage, this);
        }
        
        if (this.chatInput) {
            // 不再使用editing-did-ended事件，所以也不需要清理
            // this.chatInput.node.off('editing-did-ended', this.sendMessage, this);
        }
        
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    // 获取NetworkManager组件
    private getNetworkManager() {
        // 如果已经有引用，直接返回
        if (this.networkManager) {
            return;
        }
        
        // 尝试从场景中查找NetworkManager
        const scene = director.getScene();
        if (scene) {
            // 尝试多种路径查找NetworkManager
            const canvasNode = scene.getChildByName('Canvas');
            if (canvasNode) {
                // 路径1: Canvas -> bg -> view -> map -> NetworkManager
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
                
                // 路径2: Canvas -> NetworkManager (如果直接在Canvas下)
                if (!this.networkManager) {
                    const networkNode = canvasNode.getChildByName('NetworkManager');
                    if (networkNode) {
                        this.networkManager = networkNode.getComponent(NetworkManager);
                    }
                }
                
                // 路径3: Canvas -> ui_hud -> NetworkManager (如果在ui_hud下)
                if (!this.networkManager) {
                    const uiHudNode = canvasNode.getChildByName('ui_hud');
                    if (uiHudNode) {
                        const networkNode = uiHudNode.getChildByName('NetworkManager');
                        if (networkNode) {
                            this.networkManager = networkNode.getComponent(NetworkManager);
                        }
                    }
                }
            }
            
            // 路径4: 如果还是找不到，尝试从场景根节点直接查找
            if (!this.networkManager) {
                const networkNode = scene.getChildByName('NetworkManager');
                if (networkNode) {
                    this.networkManager = networkNode.getComponent(NetworkManager);
                }
            }
        }
        
        if (!this.networkManager) {
            console.warn('ChatSystem: 未找到NetworkManager组件，尝试其他查找方式');
            
            // 尝试从全局查找任何包含NetworkManager组件的节点
            if (scene) {
                const allNodes = scene.children;
                for (const node of allNodes) {
                    const networkManager = node.getComponent(NetworkManager);
                    if (networkManager) {
                        this.networkManager = networkManager;
                        console.log('ChatSystem: 从场景中找到NetworkManager组件');
                        break;
                    }
                    
                    // 递归查找子节点
                    const result = this.findNetworkManagerRecursively(node);
                    if (result) {
                        this.networkManager = result;
                        console.log('ChatSystem: 从场景子节点中找到NetworkManager组件');
                        break;
                    }
                }
            }
        }
        
        if (!this.networkManager) {
            console.warn('ChatSystem: 未找到NetworkManager组件');
        }
    }
    
    // 递归查找NetworkManager组件
    private findNetworkManagerRecursively(node: Node): NetworkManager | null {
        // 检查当前节点
        const networkManager = node.getComponent(NetworkManager);
        if (networkManager) {
            return networkManager;
        }
        
        // 递归检查子节点
        if (node.children) {
            for (const child of node.children) {
                const result = this.findNetworkManagerRecursively(child);
                if (result) {
                    return result;
                }
            }
        }
        
        return null;
    }

    // 键盘按下事件
    private onKeyDown(event: EventKeyboard) {
        // 只有在聊天框获取焦点时才处理回车键
        if (event.keyCode === KeyCode.ENTER && this.chatInput && this.chatInput.isFocused()) {
            console.log('聊天系统: 检测到回车键，准备发送消息');
            // 使用scheduleOnce防止多次触发
            this.scheduleOnce(() => {
                this.sendMessage();
            }, 0.1);
        }
    }

    // 发送消息
    sendMessage() {
        // 防止重复发送
        if (this.isSendingMessage) {
            console.log('聊天系统: 正在发送消息，忽略重复请求');
            return;
        }
        
        console.log('聊天系统: 尝试发送消息，当前状态:', {
            hasInput: !!this.chatInput,
            hasNetworkManager: !!this.networkManager,
            isInRoom: this.isInRoom,
            chatNodeActive: this.chatNode ? this.chatNode.active : 'no chatNode'
        });
        
        // 检查所有必要的组件
        if (!this.chatInput) {
            console.warn('聊天系统: chatInput为空，尝试重新获取');
            this.chatInput = this.chatInput = this.node.getChildByName('chatMsg')?.getComponent(EditBox) || null;
            if (!this.chatInput) {
                console.error('聊天系统: 无法获取chatInput组件');
                return;
            }
        }
        
        if (!this.networkManager) {
            console.warn('聊天系统: networkManager为空，尝试重新获取');
            this.getNetworkManager();
            if (!this.networkManager) {
                console.error('聊天系统: 无法获取networkManager组件');
                return;
            }
        }
        
        if (!this.isInRoom) {
            console.warn('聊天系统: 不在房间中，无法发送消息');
            return;
        }
        
        const message = this.chatInput.string?.trim();
        
        if (!message) {
            console.log('聊天系统: 消息为空，不发送');
            return;
        }
        
        // 设置发送标志，防止重复发送
        this.isSendingMessage = true;
        
        console.log('聊天系统: 发送消息', message);
        
        // 先在本地聊天框中显示消息
        const localPlayerId = this.getLocalPlayerId() || "我";
        this.receiveMessage(localPlayerId, message);
        
        // 发送到服务器
        this.networkManager.sendChatMessage(message);
        
        // 清空输入框
        this.chatInput.string = '';
        
        // 让输入框失去焦点，以便游戏可以接收键盘输入
        this.chatInput.blur();
        
        // 延迟重置发送标志
        this.scheduleOnce(() => {
            this.isSendingMessage = false;
        }, 0.5);
    }

    // 接收聊天消息
    receiveMessage(playerId: string, message: string) {
        console.log('=== 聊天消息接收 ===');
        console.log('聊天系统: 收到消息', { playerId, message });
        
        // 获取当前时间
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timeString = (hours < 10 ? "0" : "") + hours + ":" + (minutes < 10 ? "0" : "") + minutes;
        
        // 格式化消息 - 确保系统消息格式一致
        let formattedMessage: string;
        if (playerId === "系统") {
            formattedMessage = `[${timeString}] [系统]: ${message}`;
        } else {
            formattedMessage = `[${timeString}] [${this.formatPlayerId(playerId)}]: ${message}`;
        }
        
        console.log('聊天系统: 格式化后的消息', formattedMessage);
        console.log('聊天系统: 当前消息数量', this.messages.length + 1);
        console.log('聊天系统: isInRoom状态', this.isInRoom);
        console.log('聊天系统: chatScrollView状态', !!this.chatScrollView);
        
        // 添加到消息列表
        this.messages.push(formattedMessage);
        console.log('聊天系统: 消息列表', this.messages);
        
        // 限制消息数量
        if (this.messages.length > this.maxMessages) {
            this.messages.shift(); // 移除最早的消息
        }
        
        // 更新UI
        this.updateChatUI();
        console.log('=== 聊天消息处理完毕 ===');
    }

    // 格式化玩家ID，显示更友好的名称
    private formatPlayerId(playerId: string): string {
        // 如果是系统消息，直接返回"系统"
        if (playerId === "系统") {
            return playerId;
        }
        
        // 如果是本地玩家，显示为"我"
        if (this.networkManager && playerId === this.getLocalPlayerId()) {
            return "我";
        }
        
        // 否则显示完整ID或格式化后的ID
        // 提取数字部分，只显示后4位，使ID更简洁
        if (playerId.includes('player_')) {
            const idNumber = playerId.replace('player_', '');
            if (idNumber.length > 4) {
                return `玩家...${idNumber.slice(-4)}`;
            }
            return `玩家${idNumber}`;
        }
        
        return `玩家${playerId}`;
    }
    
    // 获取本地玩家ID
    private getLocalPlayerId(): string {
        if (!this.networkManager) {
            return "";
        }
        
        // 通过NetworkManager的公共方法获取玩家ID
        const connectionStatus = this.networkManager.getConnectionStatus();
        return connectionStatus.playerId || "";
    }

    // 更新聊天UI
    private updateChatUI() {
        if (!this.chatScrollView) {
            console.warn("聊天系统：chatScrollView为空");
            return;
        }
        
        // 获取滚动视图的内容节点
        const content = this.chatScrollView.content;
        if (!content) {
            console.error("聊天系统：未找到滚动视图的content节点");
            return;
        }
        
        console.log("聊天系统：更新UI，当前消息数量:", this.messages.length);
        
        // 清除现有的消息标签
        content.removeAllChildren();
        
        // 为每条消息创建标签
        this.messages.forEach((message, index) => {
            const messageLabel = new Node(`Message_${index}`);
            const labelComponent = messageLabel.addComponent(Label);
            const uiTransform = messageLabel.addComponent(UITransform);
            
            // 检查是否是系统消息
            const isSystemMessage = message.includes('[系统]:');
            
            // 设置标签属性
            labelComponent.string = message;
            labelComponent.fontSize = isSystemMessage ? 14 : 16; // 系统消息字体小一点
            labelComponent.lineHeight = isSystemMessage ? 18 : 20;
            labelComponent.overflow = Label.Overflow.RESIZE_HEIGHT;
            
            // 设置字体颜色为黑色
            labelComponent.color = isSystemMessage ? 
                color(50, 50, 50, 255) : // 系统消息使用深灰色
                color(0, 0, 0, 255);    // 普通消息使用黑色
            
            // 设置UI变换和位置
            uiTransform.setContentSize(210, 20); // 设置宽度为210，高度为20
            uiTransform.setAnchorPoint(0, 1); // 设置锚点为左上角
            
            // 调整标签位置，从左边开始显示，x坐标为-102
            messageLabel.setPosition(-102, -index * 25, 0);
            
            // 设置水平对齐方式为左对齐
            labelComponent.horizontalAlign = Label.HorizontalAlign.LEFT;
            
            // 添加到内容节点
            content.addChild(messageLabel);
        });
        
        // 滚动到底部
        this.scrollToBottom();
    }

    // 滚动到底部
    private scrollToBottom() {
        if (!this.chatScrollView) {
            return;
        }
        
        // 获取滚动视图的内容节点
        const content = this.chatScrollView.content;
        if (!content) {
            console.error("聊天系统：未找到滚动视图的content节点");
            return;
        }
        
        // 计算总高度
        const totalHeight = Math.max(this.messages.length * 25, this.chatScrollView.node.getComponent(UITransform)?.height || 100);
        
        console.log(`聊天系统：设置内容高度为 ${totalHeight}px`);
        
        // 更新content节点的高度
        const uiTransform = content.getComponent(UITransform);
        if (uiTransform) {
            // 设置content的高度，确保足够显示所有消息
            uiTransform.setContentSize(uiTransform.width, totalHeight);
            
            // 设置content的位置，确保最新消息在底部可见
            content.setPosition(0, totalHeight / 2);
        }
        
        // 滚动到底部
        this.scheduleOnce(() => {
            if (this.chatScrollView) {
                this.chatScrollView.scrollToBottom();
                console.log("聊天系统：滚动到底部");
            }
        }, 0.1);
    }

    // 启用聊天系统（加入房间时调用）
    enableChat() {
        console.log('聊天系统: 启用聊天系统');
        this.isInRoom = true;
        console.log('聊天系统: isInRoom设置为:', this.isInRoom);
        
        // 重新获取子节点引用，确保它们存在
        if (this.node) {
            this.chatNode = this.node;
            this.chatInput = this.node.getChildByName('chatMsg')?.getComponent(EditBox) || null;
            this.chatScrollView = this.node.getChildByName('chatContent')?.getComponent(ScrollView) || null;
            this.sendButton = this.node.getChildByName('send')?.getComponent(Button) || null;
            
            console.log('聊天系统: 重新获取子节点引用:', {
                chatNode: !!this.chatNode,
                chatInput: !!this.chatInput,
                chatScrollView: !!this.chatScrollView,
                sendButton: !!this.sendButton
            });
        }
        
        if (this.chatNode) {
            this.chatNode.active = true;
            console.log('聊天系统: 激活聊天节点，active状态:', this.chatNode.active);
        } else {
            console.warn('聊天系统: chatNode为空，无法激活');
        }
        
        // 添加系统消息
        this.receiveMessage("系统", "已加入聊天室");
        console.log('聊天系统: 系统消息已添加，当前消息数量:', this.messages.length);
    }

    // 禁用聊天系统（离开房间时调用）
    disableChat() {
        this.isInRoom = false;
        
        if (this.chatNode) {
            this.chatNode.active = false;
        }
        
        // 清空聊天记录
        this.messages = [];
        
        // 更新UI
        this.updateChatUI();
    }
}