import { _decorator, Animation, animation, BoxCollider2D, CCInteger, Collider2D, color, Component, Contact2DType, director, Font, input, Input, instantiate, IPhysics2DContact, Label, math, Node, Prefab, ProgressBar, randomRange, RigidBody2D, Scene, Sprite, tween, UIOpacity, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

// 敌人动画状态枚举
enum EnemyAnimationState {
    IDLE = 'orc_ldle',
    RUN = 'orc_run',
    ATTACK = 'orc_attack',
    DEAD = 'orc_dead'
}

// 敌人行为状态
interface EnemyState {
    isPlayerAround: boolean;
    isAllowedAttack: boolean;
    isDead: boolean;
    isReturning: boolean;
    isAttacking: boolean;
    shouldChaseAfterAttack: boolean;
}

@ccclass('enemy')
export class enemy extends Component {
    
    @property({ tooltip: "敌人移动速度" })
    enemySpeed: number = 10;
    
    @property({ tooltip: "敌人最大血量" })
    maxHp: number = 20;

    @property({ tooltip: "敌人攻击伤害" })
    enemyDamage: number = 10;

    @property({ type: Font, tooltip: "像素字体" })
    pixelFont: Font = null;

    @property({ type: Prefab, tooltip: "掉落奖励预制体" })
    rewardPrefab: Prefab = null;

    @property({ tooltip: "回归初始位置速度" })
    returnSpeed: number = 30;

    @property({ tooltip: "到达初始位置的判定距离" })
    returnThreshold: number = 15;

    @property({ tooltip: "延迟回归时间（秒）" })
    returnDelay: number = 1.5;

    @property({ type: CCInteger, tooltip: "怪物血量", displayName: "怪物的血量" })
    get currentHp(): number {
        return this._currentHp;
    }
    set currentHp(newHp: number) {
        if (this._currentHp !== newHp) {
            const oldHp = this._currentHp;
            this._currentHp = Math.max(0, Math.min(newHp, this.maxHp));
            
            // 血量变化处理
            this.updateHpDisplay();
            this.showHpChangeEffect(this._currentHp - oldHp);
            
            if (this._currentHp === 0 && !this.enemyState.isDead) {
                this.die();
            }
        }
    }

    // 敌人状态
private enemyState: EnemyState = {
    isPlayerAround: false,
    isAllowedAttack: false,
    isDead: false,
    isReturning: false,
    isAttacking: false,
    shouldChaseAfterAttack: false
};

// 组件引用
private _currentHp: number = 0;
private hpLabelNode: Node = null;
private hpLabel: Label = null;
private enemyHpNode: Node = null;
private enemyHpProgressBar: ProgressBar = null;
private rewardNode: Node = null;
private parentNode: Node = null;
private rigidBody: RigidBody2D = null;
private aroundCollider: Collider2D = null;
private attackFindCollider: Collider2D = null;
private attackCollider: Collider2D = null;
private findPlayerRemind: Node = null;
private playerNode: Node = null;
private enemySprite: Sprite = null;
private enemyAnimation: Animation = null;

// 状态标志
private hadAttackedPlayer: boolean = false;
private lastAttackTime: number = 0;
private attackCooldown: number = 1.0; // 攻击冷却时间
private currentAttackDuration: number = 0; // 当前攻击动画持续时间
private attackAnimationDuration: number = 0.7; // 攻击动画总时长（秒）

// 回归起始位置相关
private originalPosition: Vec3 = new Vec3();
private returnScheduled: boolean = false;
private returnScheduleTime: number = 0;

// 常量
private readonly UI_2D_LAYER = 33554432;
private readonly DAMAGE_TWEEN_DURATION = 0.2;
private readonly HP_REMIND_DURATION = 1.5;

    // 设置玩家是否在周围
private set isPlayerAround(value: boolean) {
    if (this.enemyState.isPlayerAround !== value) {
        this.enemyState.isPlayerAround = value;
        this.updateAnimationState();
    }
}

// 更新动画状态
private updateAnimationState(): void {
    if (this.enemyState.isDead) {
        return;
    }

    if (this.enemyState.isAttacking) {
        this.playAnimation(EnemyAnimationState.ATTACK);
    } else if (this.enemyState.isPlayerAround) {
        this.playAnimation(EnemyAnimationState.RUN);
    } else if (this.enemyState.isReturning) {
        this.playAnimation(EnemyAnimationState.RUN);
    } else {
        this.playAnimation(EnemyAnimationState.IDLE);
    }
}

// 播放动画
private playAnimation(animationName: string): void {
    if (this.enemyAnimation && animationName) {
        if (animationName === EnemyAnimationState.ATTACK) {
            this.enemyAnimation.crossFade(animationName, 0.1);
        } else {
            this.enemyAnimation.play(animationName);
        }
    }
}


    protected onLoad(): void {
    this.initializeComponents();
    this.initializeEventListeners();
    this.initializeEnemy();
}

private initializeComponents(): void {
    try {
        // 获取精灵和动画组件
        const enemySpriteNode = this.node.getChildByName("enemy_0");
        if (enemySpriteNode) {
            this.enemySprite = enemySpriteNode.getComponent(Sprite);
            this.enemyAnimation = enemySpriteNode.getComponent(Animation);
            this.attackCollider = enemySpriteNode.getComponent(Collider2D);
        }

        // 获取刚体组件
        this.rigidBody = this.node.getComponent(RigidBody2D);

        // 获取碰撞器组件
        const colliders = this.node.getComponents(Collider2D);
        if (colliders.length >= 3) {
            this.aroundCollider = colliders[1];
            this.attackFindCollider = colliders[2];
        }

        // 获取UI组件
        this.hpLabelNode = this.node.getChildByName("hpLabel");
        this.enemyHpNode = this.node.getChildByName("enemy_hp");
        
        if (this.hpLabelNode) {
            this.hpLabel = this.hpLabelNode.getComponent(Label);
        }
        
        if (this.enemyHpNode) {
            this.enemyHpProgressBar = this.enemyHpNode.getComponent(ProgressBar);
        }

        // 获取发现玩家提示节点
        this.findPlayerRemind = this.node.getChildByName("findPlayerRemind");
        if (this.findPlayerRemind) {
            this.findPlayerRemind.active = false;
        }

        // 获取父节点
        this.parentNode = this.node.getParent();

        console.log("敌人组件初始化完成");
    } catch (error) {
        console.error("敌人组件初始化失败:", error);
    }
}

private initializeEventListeners(): void {
    try {
        if (this.aroundCollider && this.attackFindCollider && this.attackCollider) {
            this.aroundCollider.on(Contact2DType.BEGIN_CONTACT, this.onAroundCollisionEnter, this);
            this.aroundCollider.on(Contact2DType.END_CONTACT, this.onAroundCollisionExit, this);
            this.attackFindCollider.on(Contact2DType.BEGIN_CONTACT, this.onAttackRangeEnter, this);
            this.attackFindCollider.on(Contact2DType.END_CONTACT, this.onAttackRangeExit, this);
            this.attackCollider.on(Contact2DType.BEGIN_CONTACT, this.onAttackCollisionEnter, this);
        }

        this.node.on("takeDamage", this.handleDamage, this);
        console.log("敌人事件监听器初始化完成");
    } catch (error) {
        console.error("敌人事件监听器初始化失败:", error);
    }
}

private initializeEnemy(): void {
    this._currentHp = this.maxHp;
    this.hadAttackedPlayer = false;
    this.lastAttackTime = 0;
    this.currentAttackDuration = 0;
    
    // 重置所有状态
    this.enemyState.isAttacking = false;
    this.enemyState.shouldChaseAfterAttack = false;
    
    // 保存初始位置
    this.originalPosition.set(this.node.position);
    
    // 初始化掉落奖励
    if (this.rewardPrefab) {
        this.rewardNode = instantiate(this.rewardPrefab);
    }

    // 隐藏血条UI
    if (this.hpLabelNode) {
        this.hpLabelNode.active = false;
    }
    if (this.enemyHpProgressBar) {
        this.enemyHpProgressBar.node.active = false;
    }

    this.updateHpDisplay();
    console.log("敌人初始位置:", this.originalPosition);
}

    protected onDestroy(): void {
    try {
        if (this.aroundCollider) {
            this.aroundCollider.off(Contact2DType.BEGIN_CONTACT, this.onAroundCollisionEnter, this);
            this.aroundCollider.off(Contact2DType.END_CONTACT, this.onAroundCollisionExit, this);
        }
        
        if (this.attackFindCollider) {
            this.attackFindCollider.off(Contact2DType.BEGIN_CONTACT, this.onAttackRangeEnter, this);
            this.attackFindCollider.off(Contact2DType.END_CONTACT, this.onAttackRangeExit, this);
        }
        
        if (this.attackCollider) {
            this.attackCollider.off(Contact2DType.BEGIN_CONTACT, this.onAttackCollisionEnter, this);
        }

        this.node.off("takeDamage", this.handleDamage, this);
        
        console.log("敌人组件销毁完成");
    } catch (error) {
        console.error("敌人组件销毁时出错:", error);
    }
}
    
    // 测试用键盘控制
private onKeyDown(event: Event): void {
    const keyEvent = event as any;
    if (keyEvent.keyCode === 51) { // 数字3 - 加血测试
        this.takeDamage(-4, 1);
    } else if (keyEvent.keyCode === 52) { // 数字4 - 扣血测试
        this.takeDamage(4, 1);
    }
}


    // 玩家进入感知范围
private onAroundCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
    if (otherCollider.tag === 0 && !this.enemyState.isDead) {
        console.log("玩家进入感知范围！");
        this.playerNode = otherCollider.node;
        this.isPlayerAround = true;
        
        // 取消回归计划
        if (this.returnScheduled) {
            this.returnScheduled = false;
            this.returnScheduleTime = 0;
        }
        
        if (this.findPlayerRemind) {
            this.findPlayerRemind.active = true;
            this.scheduleOnce(() => {
                if (this.findPlayerRemind) {
                    this.findPlayerRemind.active = false;
                }
            }, 0.7);
        }
    }
}

// 玩家离开感知范围
private onAroundCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
    if (otherCollider.tag === 0) {
        console.log("玩家离开感知范围！");
        this.isPlayerAround = false;
        
        // 如果不在攻击范围内，开始回归初始位置
        if (!this.enemyState.isAllowedAttack && !this.enemyState.isDead) {
            this.startReturning();
        }
    }
}

// 玩家进入攻击范围
private onAttackRangeEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
    if (otherCollider.tag === 0 && !this.enemyState.isDead && !this.enemyState.isAttacking) {
        console.log("玩家进入攻击范围");
        this.startAttack();
    }
}

// 玩家离开攻击范围
private onAttackRangeExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
    if (otherCollider.tag === 0) {
        console.log("玩家离开攻击范围");
        
        if (this.enemyState.isAttacking) {
            // 如果正在攻击，标记攻击完成后需要追击
            this.enemyState.shouldChaseAfterAttack = true;
        } else {
            // 如果不在攻击中，检查是否需要开始回归或追击
            if (this.enemyState.isPlayerAround) {
                // 玩家还在感知范围内，继续追击
            } else if (!this.enemyState.isDead) {
                // 玩家不在感知范围内，开始回归
                this.startReturning();
            }
        }
    }
}

    // 攻击碰撞检测
private onAttackCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null): void {
    if (otherCollider.tag === 0 && this.enemyState.isAttacking && !this.hadAttackedPlayer) {
        this.hadAttackedPlayer = true;
        console.log("敌人攻击到玩家，伤害:", this.enemyDamage);
        director.emit("player_Damage", -this.enemyDamage);
        
        // 攻击碰撞后设置一个短暂的保护时间，避免连续伤害
        this.scheduleOnce(() => {
            this.hadAttackedPlayer = false;
        }, 0.5);
    }
}

    // 更新血量显示
private updateHpDisplay(): void {
    if (this.hpLabel) {
        this.hpLabel.string = `${this._currentHp}/${this.maxHp}`;
    }
    
    if (this.enemyHpProgressBar) {
        this.enemyHpProgressBar.progress = this.maxHp > 0 ? this._currentHp / this.maxHp : 0;
    }
}

// 显示血条UI
private showHpBar(): void {
    if (this.hpLabelNode) {
        this.hpLabelNode.active = true;
    }
    if (this.enemyHpProgressBar && this.enemyHpProgressBar.node) {
        this.enemyHpProgressBar.node.active = true;
    }
}

// 处理伤害
private handleDamage(damage: number, knockbackDirection: number = 1): void {
    if (this.enemyState.isDead) return;
    
    this.currentHp -= damage;
    this.showHpBar();
    
    if (damage > 0) {
        this.applyKnockback(knockbackDirection);
    }
}

// 处理受到伤害（保持兼容性）
public takeDamage(damage: number, knockbackDirection: number = 1): void {
    this.handleDamage(damage, knockbackDirection);
}

    // 显示血量变化效果
private showHpChangeEffect(hpChange: number): void {
    if (hpChange === 0) return;

    const remindNode = new Node("hpRemindNode");
    const remindLabel = remindNode.addComponent(Label);

    this.node.addChild(remindNode);

    // 设置层级
    remindNode.layer = this.UI_2D_LAYER;
    remindNode.setScale(0.05, 0.05);
    
    // 设置文本内容
    remindLabel.string = String(Math.abs(hpChange));
    remindLabel.color = hpChange < 0 ? color(255, 255, 255) : color(117, 255, 53);
    remindLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
    remindLabel.verticalAlign = Label.VerticalAlign.CENTER;
    
    // 设置位置
    const startPosX = randomRange(-5, 5);
    const startPosY = randomRange(5, 10);
    remindNode.setPosition(startPosX, startPosY);
    
    const randomX = randomRange(-6, 6);
    const targetPos = new Vec3(randomX, 30, 0);

    // 设置字体
    remindLabel.fontSize = 120;
    remindLabel.lineHeight = 120;
    remindLabel.useSystemFont = false;
    if (this.pixelFont) {
        remindLabel.font = this.pixelFont;
    }

    // 添加透明度组件
    const remindUIOpacity = remindLabel.addComponent(UIOpacity);
    remindUIOpacity.opacity = 255;

    // 播放飘字动画
    tween(remindUIOpacity)
        .to(this.HP_REMIND_DURATION, { opacity: 50 }, { easing: 'quintOut' })
        .start();
        
    tween(remindNode)
        .to(this.HP_REMIND_DURATION, { position: targetPos }, { easing: 'quintOut' })
        .call(() => {
            remindNode.destroy();
        })
        .start();
}

    // 显示受伤闪烁效果
private showDamageEffect(hpChange: number): void {
    if (!this.enemySprite) return;
    
    const originalColor = color(255, 255, 255, 255);
    const effectColor = hpChange < 0 ? color(255, 0, 0, 130) : color(146, 255, 146, 130);

    tween(this.enemySprite)
        .sequence(
            tween().to(this.DAMAGE_TWEEN_DURATION, { color: effectColor }),
            tween().to(this.DAMAGE_TWEEN_DURATION, { color: originalColor })
        )
        .call(() => {
            if (this.enemySprite) {
                this.enemySprite.color = originalColor;
            }
        })
        .start();
}
    
    
    
    // 死亡处理
private die(): void {
    if (this.enemyState.isDead) return;
    
    this.enemyState.isDead = true;
    this.enemyState.isAttacking = false; // 重置攻击状态
    console.log("敌人死亡");
    
    // 停止移动
    if (this.rigidBody) {
        this.rigidBody.linearVelocity = new Vec2(0, 0);
        this.rigidBody.enabled = false;
    }
    
    // 播放死亡动画
    if (this.enemyAnimation) {
        this.enemyAnimation.stop();
        this.playAnimation(EnemyAnimationState.DEAD);
    }
    
    // 淡出效果
    const enemyUIOpacity = this.node.addComponent(UIOpacity);
    tween(enemyUIOpacity)
        .to(0.8, { opacity: 0 })
        .call(() => {
            this.dropItems();
            this.node.destroy();
        })
        .start();
}

// 掉落物品
private dropItems(): void {
    if (!this.rewardNode || !this.parentNode) return;
    
    const dropChance = math.randomRange(0, 3);
    if (dropChance >= 2) { // 33%掉落概率
        const currentPos = this.node.position;
        const offsetX = randomRange(-10, 10);
        const offsetY = randomRange(0, 10);
        
        this.rewardNode.setPosition(currentPos.x + offsetX, currentPos.y + offsetY, 0);
        this.parentNode.addChild(this.rewardNode);
        
        console.log("敌人掉落物品，位置:", this.rewardNode.position);
    }
}

// 击退效果
private applyKnockback(knockbackDirection: number): void {
    if (!this.rigidBody) return;
    
    const knockbackForce = new Vec2(knockbackDirection * 2, 8);
    this.rigidBody.linearVelocity = knockbackForce;
}

// 开始攻击
private startAttack(): void {
    if (this.enemyState.isAttacking || this.enemyState.isDead) return;
    
    const currentTime = Date.now() / 1000;
    if ((currentTime - this.lastAttackTime) < this.attackCooldown) {
        return; // 攻击冷却中
    }
    
    this.enemyState.isAttacking = true;
    this.enemyState.shouldChaseAfterAttack = false;
    this.currentAttackDuration = 0;
    this.lastAttackTime = currentTime;
    this.isPlayerAround = false;
    
    console.log("敌人开始攻击");
    this.updateAnimationState();
}

// 完成攻击
private completeAttack(): void {
    if (!this.enemyState.isAttacking) return;
    
    console.log("敌人完成攻击");
    this.enemyState.isAttacking = false;
    
    // 检查攻击完成后应该做什么
    if (this.enemyState.shouldChaseAfterAttack && this.enemyState.isPlayerAround) {
        // 攻击完成后需要追击玩家
        console.log("攻击完成，开始追击玩家");
        this.enemyState.shouldChaseAfterAttack = false;
    } else if (!this.enemyState.isPlayerAround && !this.enemyState.isDead) {
        // 玩家不在感知范围内，开始回归
        this.startReturning();
    }
    
    this.updateAnimationState();
}

// 开始回归初始位置
private startReturning(): void {
    if (this.enemyState.isReturning || this.enemyState.isDead || this.returnScheduled || this.enemyState.isAttacking) return;
    
    // 延迟回归，避免频繁切换
    this.returnScheduled = true;
    this.returnScheduleTime = this.returnDelay;
    this.playerNode = null; // 清除玩家引用
    
    console.log(`${this.returnDelay}秒后开始回归初始位置`);
}

// 回归到初始位置
private returnToOriginalPosition(deltaTime: number): void {
    if (!this.rigidBody || !this.enemyState.isReturning) return;
    
    const currentPos = this.node.position;
    const direction = new Vec2(
        this.originalPosition.x - currentPos.x,
        this.originalPosition.y - currentPos.y
    );
    
    // 计算到初始位置的距离
    const distance = Vec2.len(direction);
    
    // 如果接近初始位置，停止回归
    if (distance <= this.returnThreshold) {
        this.arriveAtOriginalPosition();
        return;
    }
    
    // 标准化方向向量并设置移动速度（使用deltaTime进行帧率无关的移动）
    direction.normalize();
    const returnVelocity = direction.multiplyScalar(this.returnSpeed * deltaTime);
    
    // 直接设置位置而不是速度，避免物理系统干扰
    const newPos = new Vec3(
        currentPos.x + returnVelocity.x,
        currentPos.y + returnVelocity.y,
        currentPos.z
    );
    this.node.position = newPos;
    
    // 更新精灵朝向
    if (this.enemySprite) {
        if (direction.x > 0.1) {
            this.enemySprite.node.setScale(1, 1);
        } else if (direction.x < -0.1) {
            this.enemySprite.node.setScale(-1, 1);
        }
    }
}

// 到达初始位置
private arriveAtOriginalPosition(): void {
    console.log("敌人已回到初始位置附近");
    this.enemyState.isReturning = false;
    
    // 停止移动（清零速度，但保持当前位置）
    if (this.rigidBody) {
        this.rigidBody.linearVelocity = new Vec2(0, 0);
    }
    
    // 更新动画状态
    this.updateAnimationState();
}

    // 追踪玩家
private chasePlayer(deltaTime: number): void {
    if (!this.enemyState.isPlayerAround || !this.playerNode || this.enemyState.isDead || !this.rigidBody) {
        return;
    }
    
    // 如果正在回归，停止回归行为
    if (this.enemyState.isReturning) {
        this.enemyState.isReturning = false;
    }
    
    const enemyPos = this.node.position;
    const playerPos = this.playerNode.position;
    
    // 计算方向向量
    const direction = new Vec2(
        playerPos.x - enemyPos.x,
        playerPos.y - enemyPos.y
    );
    direction.normalize();
    
    // 设置移动速度
    const moveVelocity = direction.multiplyScalar(this.enemySpeed);
    this.rigidBody.linearVelocity = moveVelocity;
    
    // 更新精灵朝向
    if (this.enemySprite) {
        if (direction.x > 0.1) {
            this.enemySprite.node.setScale(1, 1);
        } else if (direction.x < -0.1) {
            this.enemySprite.node.setScale(-1, 1);
        }
    }
}
    
    start(): void {
    // 初始化完成后可以在这里添加额外的设置
}

update(deltaTime: number): void {
    if (this.enemyState.isDead) return;
    
    // 处理攻击动画时长
    if (this.enemyState.isAttacking) {
        this.currentAttackDuration += deltaTime;
        if (this.currentAttackDuration >= this.attackAnimationDuration) {
            this.completeAttack();
        } else {
            // 攻击期间停止移动
            if (this.rigidBody) {
                this.rigidBody.linearVelocity = new Vec2(0, 0);
            }
        }
    }
    
    // 处理延迟回归计时
    if (this.returnScheduled) {
        this.returnScheduleTime -= deltaTime;
        if (this.returnScheduleTime <= 0) {
            this.returnScheduled = false;
            this.enemyState.isReturning = true;
            console.log("敌人开始回归初始位置");
            this.updateAnimationState();
        } else {
            // 等待期间停止移动
            if (this.rigidBody) {
                this.rigidBody.linearVelocity = new Vec2(0, 0);
            }
        }
    }
    
    // 优先级：攻击 > 追踪玩家 > 回归初始位置
    if (!this.enemyState.isAttacking) {
        if (this.enemyState.isPlayerAround) {
            this.chasePlayer(deltaTime);
        } else if (this.enemyState.isReturning) {
            this.returnToOriginalPosition(deltaTime);
        } else {
            // 既不在追踪也不在回归，确保敌人停止移动
            if (this.rigidBody) {
                const currentVelocity = this.rigidBody.linearVelocity;
                if (currentVelocity.x !== 0 || currentVelocity.y !== 0) {
                    this.rigidBody.linearVelocity = new Vec2(0, 0);
                }
            }
        }
    }
}
}


