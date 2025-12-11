 import { _decorator, Component,input,Input,RigidBody2D,Vec2,Node, Collider2D, Contact2DType, Collider,ICollisionEvent, BoxCollider2D, IPhysics2DContact, Label, ProgressBar, Color, color, Font, resources, Vec3, randomRange, tween, UIOpacity, random, Sprite, CCInteger, director, CCFloat, Animation, animation, math, PhysicsSystem2D, Graphics, EPhysics2DDrawFlags, TangentWeightMode, Prefab, instantiate, UITransform } from 'cc';
import { soul } from './soul';
import { NetworkManager } from './NetworkManager';
const { ccclass, property} = _decorator;


@ccclass('hero')
export class hero extends Component {
    
    @property//可以使变量在编辑器中编辑//便于帧时间补偿                          
    Player_Speed:number=800
    @property
    Jump_Force:number=5;//跳跃力度
    @property
    Jump_Mode:number=1;//跳跃模式：1：单段跳，2：二段跳
    @property
    Run_Speed:number=1200;//疾跑速度
    @property
    Ladder_Speed:number=100;//爬梯子的速度
    @property
    Player_MaxHp:number=100;//玩家血量
    @property
    Attack_Enudrance:number=1;
    @property
    player_AttackHarm:number=4;
    
    playerSprite: Node = null
    
    HpHudNode:Node = null ;//玩家ui血量节点的Node

    HpHudLabel:Label = null;//玩家血量节点的Label 

    HpProgressBar:ProgressBar = null;//玩家血量的进度条
    @property
    (Font)pixelFont:Font = null;
    
    EnduranceHud:Node = null;//精力条

    
    HpRestore:Node = null;
    @property
    (CCFloat)player_maxEndurance = 100;
    @property
    (CCFloat)player_RunEndurance:number = 0.1;
    @property
    (CCFloat)player_EnuduranceRestoreSpeed:number = 2 //精力的恢复速度
    @property
    (CCFloat)player_NoActionRestoreTime:number = 1  //无操作多久后恢复经理
    @property({  group: {name:"NUM"},type:CCInteger,tooltip:"耐力值" ,displayName:"耐力值！！！"})
    get _Endurance(){
        return this.player_currentEndurance
    }
    set _Endurance(newEndurance:number){
        if(this.player_currentEndurance !==newEndurance){
            const oldEndurance=this.player_currentEndurance;
            this.player_currentEndurance=newEndurance;
            //数值变化
            this.EnuduranceIsZero(oldEndurance,newEndurance)
        }
    }

    @property({  group: {name:"NUM"},type:CCInteger,tooltip:"Hp值" ,displayName:"Hp值！！！"})
    get _CurrentHp(){
        return this.player_CurrentHp
    }
    set _CurrentHp(newHp:number){
        if(this.player_CurrentHp !==newHp){
            const oldHp=this.player_CurrentHp;
            this.player_CurrentHp=newHp;
            //数值变化
            this.HpIsZero(oldHp,newHp)
        }
    }

    
    
    
    Player_Move={//控制角色的移动
        a:false,
        d:false,
        run:false,
        isOnLadder:false,
        useLadder:false,
    } 

    // Enum Player_State={

    // }
    public _Lv:number=1;

    get Lv(){
        return this._Lv;
    }

    private rigidBody: RigidBody2D | null = null; // 存储刚体组件引用
    private isOnGround:boolean=false;//是否在地面上
    private isAllowedRun:boolean=true;//判断此时的耐力状态是否允许奔跑
    private jumpCount:number=0;//已跳跃的次数
    private maxJumpCount:number=1;//最大的跳跃次数（根据模式动态设置）
    private worldCenterVec: Vec2 = new Vec2(); // 缓存世界中心向量（避免重复创建）
    private current_base_speed:number;
    private player_Collider:Collider2D = null; //存储Collider
    private player_CurrentHp:number = null;
    private HpChangeLabel:Label = null;
    private HpChangeNode:Node = null;
    private UI_2D_Layer = 33554432;
    private coins:number = 0;
    private AnimationNode:Node = null;
    private AnimationCom:Animation = null;
    private IsplayerAttack:boolean = false;
    private _HpIsZero:boolean = false;
    private AttackCollider:Collider2D = null;
    private attackedEnemies: Set<Node> = new Set<Node>(); // 记录本次攻击已伤害的敌人
    private currentAttackPhase: number = 0; // 当前攻击阶段 (0: 无, 1: 第一击, 2: 第二击)
    private phase1AttackedEnemies: Set<Node> = new Set<Node>(); // 第一击已伤害的敌人
    private phase2AttackedEnemies: Set<Node> = new Set<Node>(); // 第二击已伤害的敌人
    private HpRestoreNum:number = 0;
    private HpRestoreLabel:Label = null;
    @property
    private HpRestorePower:number = 25;
    private _ReSpawnPos:Vec3 = null;
    
    // 网络同步相关
    private lastNetworkPosition: Vec3 = new Vec3();
    private lastNetworkUpdateTime: number = 0;
    private currentAnimation: string = 'idle';
    public isNetworkPlayer: boolean = false; // 标识是否为网络玩家
    
    // 昵称显示相关
    private nicknameLabel: Label = null; // 昵称标签组件
    private nicknameNode: Node = null; // 昵称标签节点
    private playerNickname: string = ''; // 玩家昵称
    private isNicknameVisible: boolean = false; // 昵称是否可见
        
    set ReSpawnPos(pos:Vec3){
        this._ReSpawnPos=pos;
    }



    
     coinsLabel:Label = null; 
    
    RemindNode:Node = null; 
    @property
    (Boolean) isStartDebug:boolean = false;
    
    @property(NetworkManager)
    networkManager: NetworkManager | null = null;
    


    //onPropertyChanged
    private player_currentEndurance:number = null;
    private EnduranceLabel:Label = null;
    private EnduranceProgressBar:ProgressBar = null;
    private EnduracneTimer:number = 0;

    protected onLoad():void{     //onload总是在start之前执行
         
        this.IsDeBug();
        this.playerSprite=this.node.getChildByName("character")
        const uiHud = this.node.getParent().getParent().getParent().getParent().getChildByName("ui_hud")
        this.HpHudNode=uiHud.getChildByName("uiCamera").getChildByName("playerHpLabel")
        this.EnduranceHud=uiHud.getChildByName("uiCamera").getChildByName("playerEndurance")
        this.HpRestore=uiHud.getChildByName("uiCamera").getChildByName("HpRestore")
        this.RemindNode=uiHud.getChildByName("uiCamera").getChildByName("Remind")
        this.coinsLabel= uiHud.getChildByName("uiCamera").getChildByName("goldCoins").getChildByName("CoinsNumber").getComponent(Label)   
        // isNetworkPlayer已在类定义中初始化为false，这里不需要重复设置
        
        // 安全地获取NetworkManager组件
        try {
            // 尝试从父节点的子节点中获取NetworkManager
            if (this.node.parent) {
                const networkNode = this.node.parent.getChildByName("NetworkManager");
                if (networkNode) {
                    this.networkManager = networkNode.getComponent(NetworkManager);
                }
            }
            
            // 如果没找到，尝试直接从父节点获取
            if (!this.networkManager && this.node.parent) {
                this.networkManager = this.node.parent.getComponent(NetworkManager);
            }
            
            // 如果还没找到，尝试从场景根节点获取
            if (!this.networkManager) {
                const scene = director.getScene();
                if (scene) {
                    const networkNode = scene.getChildByName("NetworkManager");
                    if (networkNode) {
                        this.networkManager = networkNode.getComponent(NetworkManager);
                    }
                }
            }
            
            if (!this.networkManager) {
                console.warn('NetworkManager组件未找到，联机功能将不可用');
            }
        } catch (error) {
            console.error('获取NetworkManager组件时出错:', error);
            this.networkManager = null;
        }
        
        // 初始化动画节点
        this.AnimationNode = this.node.getChildByName("character");
        this.AnimationCom = this.AnimationNode.getComponent(Animation);
        //console.log(this.AnimationCom)
        this.AttackCollider = this.AnimationNode.getComponent(Collider2D);
        
        // 初始化时禁用攻击碰撞框
        if(this.AttackCollider) {
            this.AttackCollider.enabled = false;
        }
        
        // 初始化昵称标签
        this.initNicknameLabel();


        //debug
        // PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
        // EPhysics2DDrawFlags.Pair |
        // EPhysics2DDrawFlags.CenterOfMass |
        // EPhysics2DDrawFlags.Joint |
        // EPhysics2DDrawFlags.Shape;

        

        if(this.AttackCollider){
            // 监听碰撞开始（BEGIN_CONTACT）
            
            this.AttackCollider.on(Contact2DType.BEGIN_CONTACT, this.onAttackCollisionEnter, this);
            //console.log(this.AttackCollider)
            // 监听碰撞结束（END_CONTACT）
            this.AttackCollider.on(Contact2DType.END_CONTACT, this.onAttackCollisionExit, this);
        }

        // 初始化UI组件 - 只有本地玩家需要UI
        if (!this.isNetworkPlayer) {
            // 获取UI组件 - 安全获取，可能不存在
            if (this.HpHudNode) {
                this.HpChangeLabel = this.HpHudNode.getChildByName("playerHpLabel")?.getComponent(Label);
                this.HpProgressBar = this.HpHudNode.getChildByName("ProgressBar")?.getComponent(ProgressBar);
            }
            
            if (this.HpRestore) {
                this.HpRestoreLabel = this.HpRestore.getChildByName("HpRestoreLabel")?.getComponent(Label);
            }
            
            if (this.EnduranceHud) {
                this.EnduranceLabel = this.EnduranceHud.getChildByName("playerEnduranceLabel")?.getComponent(Label);
                this.EnduranceProgressBar = this.EnduranceHud.getChildByName("playerEnduranceProgress")?.getComponent(ProgressBar);
            }

            // 监听全局事件
            director.on("addCoins",this.coinsChange,this);
            director.on("addHpRestore",this.HpRestoreChange,this);
            director.on("BuyHpRestore",this.BuyHpRestore,this);
            director.on("FullHp",this.FullHp,this);
            director.on("UpMaxHp",this.upMaxHp,this)
            director.on("UpMaxEndurance",this.upMaxEndurance,this)
            director.on("UpMaxHarm",this.upMaxHarm,this)
            director.on("player_Damage",this.Hp_change,this)
            this.node.on("player_Damage",this.Hp_change,this)
            this.node.on("UIMessage",this.RemindString,this)
            director.on("UIMessage",this.RemindString,this)
            
            // 初始化数值
            this.player_CurrentHp = this.Player_MaxHp;
            this.player_currentEndurance = this.player_maxEndurance;
            
            // 更新UI显示
            this.updateEndurance();
            this.updateHp();
            
            // 监听输入
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            input.on(Input.EventType.KEY_UP,this.Key_up,this)
        } else {
            // 网络玩家不需要UI组件和输入监听，只初始化基本属性
            this.player_CurrentHp = this.Player_MaxHp;
            this.player_currentEndurance = this.player_maxEndurance;
        }
        
        this.current_base_speed=this.Player_Speed //疾跑速度需要的中间变量

        this.rigidBody = this.node.getComponent(RigidBody2D);//这么做的目的是为了不让setPosition覆盖物理模拟，改用向量形式// 获取角色的 RigidBody2D 组件（必须确保节点上已挂载）
        if (!this.rigidBody) {
            console.error("角色节点没有挂载 RigidBody2D 组件！");
        }

        this.player_Collider=this.node.getComponent(Collider2D)//获取相应的属性
        if(this.player_Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.player_Collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            // 监听碰撞持续（STAY_CONTACT）
            this.player_Collider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
            //console.log("开始监听collider2d")
           }
    }

   protected onDestroy(): void {    //组件被销毁时调用
        director.off("addCoins",this.coinsChange,this);
        director.off("addHpRestore",this.HpRestoreChange,this);
        director.off("BuyHpRestore",this.BuyHpRestore,this)
        director.off("FullHp",this.FullHp,this);
        director.off("UpMaxHp",this.upMaxHp,this)
        director.off("UpMaxEndurance",this.upMaxEndurance,this)
        director.off("UpMaxHarm",this.upMaxHarm,this)
        director.off("player_Damage",this.Hp_change,this)
        this.node.off("player_Damage",this.Hp_change,this)
        this.node.off("UIMessage",this.RemindString,this)
        director.off("UIMessage",this.RemindString,this)
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        input.off(Input.EventType.KEY_UP,this.Key_up,this)

        if(this.player_Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.player_Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            // 监听碰撞结束（END_CONTACT）
            this.player_Collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }

        // 清理攻击碰撞框监听器
        if(this.AttackCollider) {
            this.AttackCollider.off(Contact2DType.BEGIN_CONTACT, this.onAttackCollisionEnter, this);
            this.AttackCollider.off(Contact2DType.END_CONTACT, this.onAttackCollisionExit, this);
        }
    }

    Key_Down(key){ //键盘按下的相关信息
        // 网络玩家不响应输入
        if (this.isNetworkPlayer) return;
        
        switch(key.keyCode){
            case 65: //a
                this.Player_Move.a=true
                this.playWalkAnimation()
                break;
            case 68: //d
                this.Player_Move.d=true
                this.playWalkAnimation()
                break;
            case 87: //w
                this.Player_Move.useLadder=true
                //this.Player_Jump();
                break;
            case 32: //空格
                //this.Player_Move.jump=true
                this.Player_Jump();
                //this.playJumpAnimation();
                break;
            case 16://left_shift
                this.Player_Move.run=true
                this.playRunAnimation();
                //this.Player_Speed=this.Run_Speed
                break;
            case 49://数字1：测试用按键！！！（暂时）
                this.Hp_change(7)
            break;
            case 50://数字2：测试用按键！！！（暂时）
                let damage = Math.floor(randomRange(-10,-5))
                this.Hp_change(damage)
            break;
            case 74://j
                this.Player_Attack()
            break;
            case 82://R
                this.HpRestoreChange(-1)
                this.HpRestoreAnimation()
            break;
        }
    }

    Key_up(key){ //键盘上抬起的按键
        // 网络玩家不响应输入
        if (this.isNetworkPlayer) return;
        
        switch(key.keyCode){
            case 65: //a
                this.Player_Move.a=false
                this.playWalkAnimation()
                break;
            case 68: //d
                this.Player_Move.d=false
                this.playWalkAnimation()
                break;
            case 87: //w
                this.Player_Move.useLadder=false
                //this.Player_Jump();
                break;
            case 16: //left_shift
                this.Player_Move.run=false
                this.playWalkAnimation()
                //this.Player_Speed=this.current_base_speed
                break;
        }
    }

    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){//碰撞开始触发时

        //"2"为墙体，"3"为梯子
        if(otherCollider.tag === 2){
            this.isOnGround=true;
            this.jumpCount=2;
            // 攻击状态下不强制切换动画
            if(!this.IsplayerAttack) {
                if(this.Player_Move.a||this.Player_Move.d){
                    this.AnimationCom.crossFade("walk",0.1);
                    this.currentAnimation = 'walk';
                }else{
                    this.AnimationCom.play("ldel");
                    this.currentAnimation = 'idle';
                }
                
                // 立即同步动画状态到网络（如果有网络连接）
                if (this.networkManager && !this.isNetworkPlayer) {
                    const currentPos = this.node.getPosition();
                    let direction = 1; // 默认朝右
                    if (this.playerSprite) {
                        direction = this.playerSprite.scale.x > 0 ? 1 : -1;
                    }
                    
                    // 创建包含方向信息的位置对象
                    const positionWithDirection = {
                        x: currentPos.x,
                        y: currentPos.y,
                        direction: direction
                    };
                    
                    // 立即发送动画更新
                    this.networkManager.sendPositionUpdate(positionWithDirection, this.currentAnimation);
                }
            }


            console.log("this.isOnGround="+this.isOnGround);
        }else if(otherCollider.tag===3){
            console.log("碰到梯子 ");
            this.Player_Move.isOnLadder=true;
        }
        
    }

    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        
        if(otherCollider.tag===2){
            this.isOnGround=false;
            this.jumpCount=1;
        }
       

        if(otherCollider.tag===3){
            console.log("离开梯子");
            this.Player_Move.isOnLadder=false;
        }
    }

    private onAttackCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){//碰撞开始触发时
        if(otherCollider.tag===4){ //tag=4为敌人
            let canDamage = false;
            let damagePhase = 0;
            
            // 根据当前攻击阶段判断是否能造成伤害
            if(this.currentAttackPhase === 1) {
                // 第一击阶段：检查是否已经在第一击中伤害过该敌人
                if(!this.phase1AttackedEnemies.has(otherCollider.node)) {
                    canDamage = true;
                    damagePhase = 1;
                    this.phase1AttackedEnemies.add(otherCollider.node);
                    this.attackedEnemies.add(otherCollider.node);
                    console.log("第一击伤害敌人，伤害:", this.player_AttackHarm);
                }
            } else if(this.currentAttackPhase === 2) {
                // 第二击阶段：检查是否已经在第二击中伤害过该敌人
                if(!this.phase2AttackedEnemies.has(otherCollider.node)) {
                    canDamage = true;
                    damagePhase = 2;
                    this.phase2AttackedEnemies.add(otherCollider.node);
                    this.attackedEnemies.add(otherCollider.node);
                    console.log("第二击伤害敌人，伤害:", this.player_AttackHarm);
                }
            }
            
            // 如果可以造成伤害
            if(canDamage) {
                // 计算击退方向
                const knockbackDirection = this.playerSprite.scale.x > 0 ? 1 : -1;
                
                // 对敌人造成伤害
                otherCollider.node.emit("takeDamage", this.player_AttackHarm, knockbackDirection);
                console.log(`第${damagePhase}击攻击到敌人，伤害:`, this.player_AttackHarm);
            }
        }
    }

    private onAttackCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 敌人离开攻击框时不需要特殊处理，因为我们已经按攻击阶段分别记录了伤害
        // 这里可以添加一些额外的逻辑，比如音效等
    }


    private Hp_change(hpChange:number):void{
        if(this._CurrentHp+hpChange<=0){
            this._CurrentHp=0;
            this.updateHp();
            this.Hp_Remind(hpChange) 
        }else if(this._CurrentHp+hpChange>=this.Player_MaxHp){
            this._CurrentHp=this.Player_MaxHp;
            this.updateHp();
            this.Hp_Remind(hpChange)
        }else{
            this._CurrentHp=this._CurrentHp+hpChange;
            this.updateHp();
            this.Hp_Remind(hpChange)
        }

        this.Player_DamageEffect(hpChange);
    }

    private Endurance_change(EC:number):void{
        if(this._Endurance+EC <= 0){
            this._Endurance = 0;
            console.log("体力耗尽");
            this.updateEndurance();
        }else if(this._Endurance+ EC >= this.player_maxEndurance){
            this._Endurance = this.player_maxEndurance;
            console.log("体力回满");
            this.updateEndurance();
        }else{
            this._Endurance = this._Endurance + EC;
            this.updateEndurance();
        }

        if(EC<0){
            this.EnduracneTimer=0;
        }
    }

    private Endurance_Restore(deltaTime:number){
        // 添加空值检查，防止网络玩家组件初始化不完整导致的错误
        if (this.EnduranceLabel == null || this.EnduranceProgressBar == null) {
            return; // 如果UI组件未初始化，直接返回
        }
        
        if(this._Endurance<this.player_maxEndurance){
            this.EnduracneTimer += deltaTime;
        }else if(this._Endurance==this.player_maxEndurance){
            this.EnduracneTimer=0;
        }

        if(this.EnduracneTimer>=this.player_NoActionRestoreTime){
            this.Endurance_change(deltaTime*this.player_EnuduranceRestoreSpeed)
        }
    }



    private Hp_Remind(hpChange):void{ //受伤或加血的伤害数字跳动效果
        if(hpChange==0) return;

        const RemindNode = new Node("hpRemindNode");
        const RemindLabel = RemindNode.addComponent(Label);

        this.node.addChild(RemindNode);

        RemindNode.layer=this.UI_2D_Layer;
        RemindNode.setScale(0.1,0.1);
        RemindLabel.string=String(hpChange)

        //飘血数字的颜色
        RemindLabel.color = hpChange > 0 ? color(117,255,53) : color(255,255,255);
        RemindLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        RemindLabel.verticalAlign = Label.VerticalAlign.CENTER;
        
        const startPosX = randomRange(-15,15);
        const startPosY = randomRange(30,50);

        RemindNode.setPosition(startPosX,startPosY);
        const randomX=randomRange(-30,30);
        const targetPos = new Vec3(randomX,60,0);

        RemindLabel.fontSize = 120;
        RemindLabel.lineHeight = 120;
        RemindLabel.useSystemFont = false;
        RemindLabel.font = this.pixelFont;

        const RemindUIOpacity = RemindLabel.addComponent(UIOpacity);
        RemindUIOpacity.opacity=50

        tween(RemindUIOpacity)
            .to(1.5,{opacity:255},{easing:'quintOut'})
            .start()
       
        tween(RemindNode).to(1.5,{
            position:targetPos,
        },{
            easing:'quintOut'
        }).call(()=>{
            RemindNode.destroy();
        }).start();
    }

    private Player_DamageEffect(hpChange){ //受伤或加血的闪烁效果


        const mySprite=this.node.getChildByName("character").getComponent(Sprite);

        if(hpChange<0){

        tween(mySprite)
            .sequence(
                tween().to(0.1,{color:color(255,0,0,130)}),
                tween().to(0.1,{color:color(255,255,255,255)})
            )
            .call(()=>{
                mySprite.color = color(255,255,255,255);
            })
            .start();

        }else if(hpChange>0){
        tween(mySprite)
            .sequence(
                tween().to(0.1,{color:color(146,255,146,130)}),
                tween().to(0.1,{color:color(255,255,255,255)})
            )
            .call(()=>{
                mySprite.color = color(255,255,255,255);
            })
            .start();
        }
        
    }

    private Player_Jump(){
        if(this.isOnGround==true){
            this.rigidBody.getWorldCenter(this.worldCenterVec);
            this.rigidBody.applyLinearImpulse(
                new Vec2(0,this.Jump_Force),
                this.worldCenterVec,
                true
            );
            this.playJumpAnimation();

        }else if(this.jumpCount==1){
            console.log("空中再次跳跃");
            this.jumpCount--;
            this.rigidBody.getWorldCenter(this.worldCenterVec);
            this.rigidBody.applyLinearImpulse(
                new Vec2(0,this.Jump_Force),
                this.worldCenterVec,
                true
            ); 
            this.playJumpAnimation();    
        }
    }

    private Player_Run(deltaTime: number){
        if(this.Player_Move.run == true 
            && this.isAllowedRun == true 
            && (this.Player_Move.a==true || this.Player_Move.d==true )){
            this.Player_Speed = this.Run_Speed;
            this.Endurance_change(-this.player_RunEndurance* deltaTime);
        }else if(this.Player_Move.run == false ||this.isAllowedRun == false){
            this.Player_Speed = this.current_base_speed;
        }
    }

    
    private Player_Attack(){
        // 只有本地玩家可以触发攻击
        if(!this.isNetworkPlayer && this.isAllowedRun && !this.IsplayerAttack){
            
            // 发送攻击事件到网络
            if (this.networkManager) {
                const direction = this.playerSprite && this.playerSprite.scale.x > 0 ? 'right' : 'left';
                this.networkManager.sendAttackEvent(direction);
            }
            // 设置攻击状态，防止重复触发
            this.IsplayerAttack = true;
            
            // 清空所有攻击记录
            this.attackedEnemies.clear();
            this.phase1AttackedEnemies.clear();
            this.phase2AttackedEnemies.clear();
            this.currentAttackPhase = 0;
            
            this.AnimationCom.crossFade("attack",0.01)
            this.Endurance_change(-this.Attack_Enudrance)
            
            // 根据实际播放时间调整攻击碰撞框启用时机
            // 动画speed=0.4，所以实际时长是 0.283÷0.4≈0.71秒
            // 需要将原有的时间点都除以speed（0.4）
            
            // 第一击：0.066÷0.4≈0.165秒
            this.scheduleOnce(() => {
                if(this.AttackCollider && this.IsplayerAttack) {
                    this.AttackCollider.enabled = true;
                    this.currentAttackPhase = 1; // 设置为第一击阶段
                    console.log("第一击攻击框启用");
                }
            }, 0.165);
            
            // 第一击结束：0.1÷0.4=0.25秒
            this.scheduleOnce(() => {
                if(this.AttackCollider) {
                    this.AttackCollider.enabled = false;
                    this.currentAttackPhase = 0; // 重置攻击阶段
                    console.log("第一击攻击框禁用");
                }
            }, 0.25);
            
            // 第二击：0.2÷0.4=0.5秒
            this.scheduleOnce(() => {
                if(this.AttackCollider && this.IsplayerAttack) {
                    this.AttackCollider.enabled = true;
                    this.currentAttackPhase = 2; // 设置为第二击阶段
                    console.log("第二击攻击框启用");
                }
            }, 0.5);
            
            // 攻击完全结束：0.75秒（略大于0.71秒确保动画完全播放）
            this.scheduleOnce(() => {
                if(this.AttackCollider) {
                    this.AttackCollider.enabled = false;
                    console.log("攻击结束，攻击框禁用");
                }
                this.IsplayerAttack = false;
                this.currentAttackPhase = 0; // 重置攻击阶段
                
                // 清空攻击记录，为下次攻击做准备
                this.attackedEnemies.clear();
                this.phase1AttackedEnemies.clear();
                this.phase2AttackedEnemies.clear();
                
                // 攻击结束后才根据当前状态切换到合适的动画
                if(this.isOnGround && !(this.Player_Move.a||this.Player_Move.d))
                {
                    this.AnimationCom.crossFade("ldel",0.2)
                }else if(this.isOnGround && (this.Player_Move.a||this.Player_Move.d)){
                    this.AnimationCom.crossFade("walk",0.2)
                }else if(this.isOnGround && (this.Player_Move.a||this.Player_Move.d) && this.Player_Move.run){
                    this.AnimationCom.crossFade("run",0.2)
                }
            }, 0.75);
        }
        
    }
    
    
    private EnuduranceIsZero(oldNum,newNum){
        if(newNum==0){
            this.isAllowedRun=false;
        }else if(newNum>0){
            this.isAllowedRun=true;
        }
    }

    private HpIsZero(oldHp,newHp){
        if(newHp==0){
            this._HpIsZero=true
            console.log("角色死亡了")
            this.playDeadAnimation();
            this.player_dead();

        }else if(newHp>0){
            this._HpIsZero=false
        }
    }

    private player_dead(){
        const deadPos=this.node.getPosition();
        deadPos.y+=40
        director.off("addCoins",this.coinsChange,this);
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        input.off(Input.EventType.KEY_UP,this.Key_up,this)
        //this.node.

        //const velocity = this.rigidBody.linearVelocity;
        // const direction=new Vec2(0,0)
        // direction.normalize();
        // this.rigidBody.linearVelocity=direction.multiplyScalar(0)
        const Go:Node=this.node.getChildByName("GameOver");
        let startPos = Go.getPosition();
        Go.active=true
        const pos=new Vec3(-200,-20,0)
        tween(Go)
            .to(1.2,{position:pos})
            .start()

        this.scheduleOnce(()=>{
            resources.load("soul",Prefab,(err,prefab)=>{
                director.emit("DestorySoul")
                const soulNode = instantiate(prefab)
                soulNode.getComponent(soul).coins = this.coins
                this.coinsChange(-this.coins)
                const parentNdoe=this.node.getParent(); 
                parentNdoe.addChild(soulNode);
                soulNode.setPosition(deadPos);
            })
            Go.setPosition(startPos)
            Go.active=false;
            this.node.setPosition(this._ReSpawnPos)
            this.Hp_change(this.Player_MaxHp);
            director.on("addCoins",this.coinsChange,this);
            director.emit("复活吧！我的爱人！");
            //
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            input.on(Input.EventType.KEY_UP,this.Key_up,this)
        },2)
        
    }

    private updateEndurance(){
        // 添加空值检查，防止网络玩家组件初始化不完整导致的错误
        if (this.EnduranceLabel) {
            this.EnduranceLabel.string=this.player_currentEndurance.toFixed(2) + "/" + this.player_maxEndurance + "  耐力条"
        }
        if (this.EnduranceProgressBar) {
            this.EnduranceProgressBar.progress = this.player_currentEndurance / this.player_maxEndurance;
        }
    }

    private updateHp(){
        // 添加空值检查，防止网络玩家组件初始化不完整导致的错误
        if (this.HpHudLabel) {
            this.HpHudLabel.string=this.player_CurrentHp+"/"+this.Player_MaxHp//+"   测试：'1'加血，'2'扣血"
        }
        if (this.HpProgressBar) {
            this.HpProgressBar.progress=this.player_CurrentHp/this.Player_MaxHp;
        }
    }

    private coinsChange(CC:number){
        this.coins+=CC;
        if (this.coinsLabel) {
            this.coinsLabel.string=String(this.coins)
        }
    }

    private HpRestoreChange(HR:number){
        if(HR<0){ //执行了加血的操作
            if(this.HpRestoreNum==0){
                this.RemindString("血瓶不足");
                console.log("血瓶不足");
            }else if(this._CurrentHp==this.Player_MaxHp){
                this.RemindString("血量充足，无需补血");
                console.log("血量充足，无需补血")
            }else{
                this.HpRestoreNum+=HR
                this.Hp_change(this.HpRestorePower)
                this.HpRestoreLabel.string=String(this.HpRestoreNum)
            }
        }else{
            this.HpRestoreNum+=HR
            this.HpRestoreLabel.string=String(this.HpRestoreNum)
        }
        
    }


    private playWalkAnimation(){
        // 攻击状态下不切换动画，避免覆盖攻击动画
        if(this.IsplayerAttack) {
            return;
        }
        
        if(this.isOnGround){
            if(this.Player_Move.a || this.Player_Move.d){
                this.AnimationCom.crossFade("walk", 1);
                this.currentAnimation = 'walk';
            }else {
                this.AnimationCom.play("ldel");
                this.currentAnimation = 'idle';
            }   
        }
    }

    private playJumpAnimation(){
        this.AnimationCom.play("jump");
        this.currentAnimation = 'jump';
        
        // 立即发送跳跃动画到网络（如果有网络连接）
        if (this.networkManager && !this.isNetworkPlayer) {
            const currentPos = this.node.getPosition();
            let direction = 1; // 默认朝右
            if (this.playerSprite) {
                direction = this.playerSprite.scale.x > 0 ? 1 : -1;
            }
            
            // 创建包含方向信息的位置对象
            const positionWithDirection = {
                x: currentPos.x,
                y: currentPos.y,
                direction: direction
            };
            
            // 立即发送跳跃动画
            this.networkManager.sendPositionUpdate(positionWithDirection, 'jump');
        }
    }

    private playRunAnimation(){
        // 攻击状态下不切换动画，避免覆盖攻击动画
        if(this.IsplayerAttack) {
            return;
        }
        
        if(this.isOnGround){
            if(this.Player_Move.a || this.Player_Move.d){
                this.AnimationCom.crossFade("run", 0.3);
                this.currentAnimation = 'run';
            }else {
                this.AnimationCom.play("ldel");
                this.currentAnimation = 'idle';
            }   
        }
    }

    private playDeadAnimation(){
        this.AnimationCom.play("dead")
    }

    private RemindString(remind:string){
        this.RemindNode.active=true;
        this.RemindNode.setPosition(0,0,0);
        const label=this.RemindNode.getChildByName("RemindLabel").getComponent(Label);
        const op = this.RemindNode.getChildByName("RemindLabel").getComponent(UIOpacity);
        label.string = remind;

        tween(op)
        .to(1,{opacity:150})
        .start()

        tween(this.RemindNode)
        .to(1,{position:new Vec3(0,80,0)})
        .start()


        tween(label)
        .to(1,{})
        .call(()=>{
            this.RemindNode.active=false
        })
        .start()
    }

    private BuyHpRestore(add:number,price:number){
        if(this.coins<price){
            this.RemindString("金钱不够买的，再攒攒吧");
        }else{
            this.coins-=price;
            this.HpRestoreNum+=add;
            this.HpRestoreLabel.string=String(this.HpRestoreNum);
            this.coinsLabel.string=String(this.coins);
            this.RemindString("成功购入！");
        }
    }

    private FullHp(){
        this.Hp_change(this.Player_MaxHp);
        this.RemindString("已恢复满Hp，并设置复活点")
    }

    private upMaxHp(spend:number){
        if(this.coins<spend){
            this.RemindString("钱不够");
        }else{
            this._Lv++;
            this.Player_MaxHp+=20
            this.coinsChange(-spend);
            this.updateHp();
            this.RemindString("成功升级！")
        }
    }

    private upMaxEndurance(spend:number){
        if(this.coins<spend){
            this.RemindString("钱不够");
        }else{
            this._Lv++;
            this.player_maxEndurance+=1
            this.coinsChange(-spend);
            this.updateEndurance();
            this.RemindString("成功升级！")
        }
    }

    private upMaxHarm(spend:number){
        if(this.coins<spend){
            this.RemindString("钱不够");
        }else{
            this._Lv++;
            this.player_AttackHarm+=1
            this.coinsChange(-spend);
            //this.updateHp();
            this.RemindString("成功升级！")
        }
    }

    private IsDeBug(){
        if(this.isStartDebug==false) return;
        else{
            PhysicsSystem2D.instance.debugDrawFlags = EPhysics2DDrawFlags.Aabb |
            EPhysics2DDrawFlags.Pair |
            EPhysics2DDrawFlags.CenterOfMass |
            EPhysics2DDrawFlags.Joint |
            EPhysics2DDrawFlags.Shape;
        }
    }


    start() {
        this._ReSpawnPos=this.node.getPosition();
        
        // 初始化网络同步变量
        this.lastNetworkPosition.set(this.node.position);
        this.lastNetworkUpdateTime = 0;
        this.currentAnimation = 'idle';
    }

    update(deltaTime: number) {
        // 只有本地玩家需要处理输入、物理和UI更新
        if (!this.isNetworkPlayer) {
            //this.playWalkAnimation()
            this.Player_Run(deltaTime);//检测判断是否允许角色进行奔跑
            this.Endurance_Restore(deltaTime);//精力值恢复的效果
            
            if (!this.rigidBody) { // 没有刚体组件则不执行
                console.log("没有刚体组件则不执行");
                return;
            } 

            // 获取当前刚体的线速度（包含重力带来的 y 方向速度）
            const velocity = this.rigidBody.linearVelocity;
            const pos=this.node.getPosition();

            // 只修改 x 方向速度（y 方向保留物理引擎的重力计算结果）
            if (this.Player_Move.a && !this.Player_Move.d) {
                velocity.x = -this.Player_Speed*deltaTime;// 向左
                if (this.playerSprite) this.playerSprite.setScale(-1,1);
                this.currentAnimation = 'walk';
                // 向左
            } else if (this.Player_Move.d && !this.Player_Move.a) {
                velocity.x = this.Player_Speed*deltaTime; // 向右
                if (this.playerSprite) this.playerSprite.setScale(1,1);
                this.currentAnimation = 'walk';
            } else if (this.Player_Move.isOnLadder == true && this.Player_Move.useLadder == true){
                pos.y=pos.y+deltaTime*this.Ladder_Speed;
                console.log("正在使用梯子？");
                this.currentAnimation = 'climb';
            } else {
                velocity.x = 0; // 没有按键时，x 方向速度归 0（停止移动）
                this.currentAnimation = 'idle';
            }
            
            // 应用修改后的速度到刚体
            this.rigidBody.linearVelocity = velocity;
            this.node.setPosition(pos.x,pos.y);

            // 网络同步：定期发送位置和动画状态（只有本地控制的玩家才发送）
            if (this.networkManager) {
                const currentPos = this.node.getPosition();
                const now = Date.now();
                
                // 每10ms同步一次位置，或者位置/动画发生变化时同步
                if (now - this.lastNetworkUpdateTime > 10 || 
                    !this.lastNetworkPosition.equals(currentPos)) {
                    
                    // 获取当前朝向（从playerSprite的scale.x获取，1为右，-1为左）
                    let direction = 1; // 默认朝右
                    if (this.playerSprite) {
                        direction = this.playerSprite.scale.x > 0 ? 1 : -1;
                    }
                    
                    // 创建包含方向信息的位置对象
                    const positionWithDirection = {
                        x: currentPos.x,
                        y: currentPos.y,
                        direction: direction
                    };
                    
                    this.networkManager.sendPositionUpdate(positionWithDirection, this.currentAnimation);
                    this.lastNetworkPosition.set(currentPos);
                    this.lastNetworkUpdateTime = now;
                }
            }
        }
    }

    // 网络同步相关方法
    public updateAnimation(animation: string) {
        // 确保动画组件存在
        if (!this.AnimationCom) {
            console.warn('⚠️ AnimationComponent 未找到，无法更新动画');
            return;
        }
        
        // 对于跳跃动画，总是允许播放（因为玩家可能连续跳跃）
        // 对于其他动画，只有当动画真正改变时才更新，避免重复播放同一动画
        if (this.currentAnimation === animation && animation !== 'jump') {
            return;
        }
        
        // 更新当前动画状态
        this.currentAnimation = animation;
        
        // 对于网络玩家，直接播放动画不覆盖状态
        if (this.isNetworkPlayer) {
            switch (animation) {
                case 'walk':
                    this.AnimationCom.play('walk');
                    break;
                case 'run':
                    this.AnimationCom.play('run');
                    break;
                case 'jump':
                    // 跳跃动画总是重播
                    this.AnimationCom.play('jump');
                    console.log(`🦘 网络玩家播放跳跃动画`);
                    break;
                case 'idle':
                    this.AnimationCom.play('ldel');
                    break;
                default:
                    console.warn(`⚠️ 未知动画类型: ${animation}`);
                    break;
            }
        } else {
            // 本地玩家的动画由输入控制
            this.currentAnimation = animation;
        }
    }
    
    // 新增方法：更新网络玩家的朝向
    public updateDirection(direction: number) {
        // 确保是网络玩家
        if (!this.isNetworkPlayer) {
            return;
        }
        
        // 更新角色朝向
        if (this.playerSprite) {
            this.playerSprite.setScale(direction, 1, 1);
        }
    }

    public playAttackAnimation(direction: string) {
        // 只有本地玩家才处理攻击逻辑
        if (!this.isNetworkPlayer && !this.IsplayerAttack) {
            // 设置攻击状态
            this.IsplayerAttack = true;
            
            // 根据方向设置角色朝向
            if (this.playerSprite) {
                if (direction === 'left') {
                    this.playerSprite.setScale(-1, 1);
                } else {
                    this.playerSprite.setScale(1, 1);
                }
            }
            
            // 播放攻击动画
            if (this.AnimationCom) {
                this.AnimationCom.play('attack');
            }
            
            // 攻击结束后重置状态
            this.scheduleOnce(() => {
                this.IsplayerAttack = false;
                this.updateAnimation('idle');
            }, 0.75);
        } else if (this.isNetworkPlayer && this.AnimationCom) {
            // 网络玩家只播放动画，不处理攻击逻辑
            this.AnimationCom.play('attack');
            
            // 根据方向设置角色朝向
            if (this.playerSprite) {
                if (direction === 'left') {
                    this.playerSprite.setScale(-1, 1);
                } else {
                    this.playerSprite.setScale(1, 1);
                }
            }
            
            // 攻击结束后重置动画
            this.scheduleOnce(() => {
                this.updateAnimation('idle');
            }, 0.75);
        }
    }

    private HpRestoreAnimation(){
        //const p1=this.HpRestore.getChildByName("items")
        const p=this.HpRestore.getChildByName("hpRestore")

        tween(p)
        .to(0.3,{scale:new Vec3(4,4)})
        .start();

        tween(p)
        .to(0.2,{scale:new Vec3(3,3)})
        .start();
    }
    
    // 初始化昵称标签
    private initNicknameLabel() {
        // 检查是否已有昵称标签节点
        this.nicknameNode = this.node.getChildByName("NicknameLabel");
        
        if (!this.nicknameNode) {
            // 创建昵称标签节点
            this.nicknameNode = new Node("NicknameLabel");
            
            // 设置位置（-3, 60）
            this.nicknameNode.setPosition(-3, 60, 0);
            
            // 添加UITransform组件
            const uiTransform = this.nicknameNode.addComponent(UITransform);
            uiTransform.setAnchorPoint(0.5, 0.5);
            uiTransform.setContentSize(100, 20);
            
            // 添加Label组件
            this.nicknameLabel = this.nicknameNode.addComponent(Label);
            
            // 设置Label属性
            this.nicknameLabel.fontSize = 10;
            this.nicknameLabel.lineHeight = 20;
            
            // 根据是否为网络玩家设置不同的颜色
            if (this.isNetworkPlayer) {
                this.nicknameLabel.color = color(255, 255, 255, 255); // 白色
            } else {
                this.nicknameLabel.color = color(0, 255, 0, 255); // 绿色
            }
            
            // 设置水平和垂直对齐方式
            this.nicknameLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
            this.nicknameLabel.verticalAlign = Label.VerticalAlign.CENTER;
            
            // 设置字体
            if (this.pixelFont) {
                this.nicknameLabel.font = this.pixelFont;
                this.nicknameLabel.useSystemFont = false;
            }
            
            // 设置为不可见
            this.nicknameNode.active = false;
            
            // 添加到玩家节点
            this.node.addChild(this.nicknameNode);
        } else {
            // 如果已存在，获取Label组件
            this.nicknameLabel = this.nicknameNode.getComponent(Label);
            
            // 根据是否为网络玩家设置不同的颜色
            if (this.nicknameLabel) {
                if (this.isNetworkPlayer) {
                    this.nicknameLabel.color = color(255, 255, 255, 255); // 白色
                } else {
                    this.nicknameLabel.color = color(0, 255, 0, 255); // 绿色
                }
            }
            
            // 设置为不可见
            this.nicknameNode.active = false;
        }
    }
    
    // 设置玩家昵称
    public setNickname(nickname: string) {
        this.playerNickname = nickname;
        if (this.nicknameLabel) {
            // 添加player_前缀，确保昵称格式为player_XX
            this.nicknameLabel.string = `${nickname}`;
        }
    }
    
    // 获取玩家昵称
    public getNickname(): string {
        return this.playerNickname;
    }
    
    // 显示昵称
    public showNickname() {
        if (this.nicknameNode) {
            this.nicknameNode.active = true;
            this.isNicknameVisible = true;
        }
    }
    
    // 隐藏昵称
    public hideNickname() {
        if (this.nicknameNode) {
            this.nicknameNode.active = false;
            this.isNicknameVisible = false;
        }
    }
    
    // 检查昵称是否可见
    public isNicknameShown(): boolean {
        return this.isNicknameVisible;
    }
}