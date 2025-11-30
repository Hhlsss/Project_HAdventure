 import { _decorator, Component,input,Input,RigidBody2D,Vec2,Node, Collider2D, Contact2DType, Collider,ICollisionEvent, BoxCollider2D, IPhysics2DContact, Label, ProgressBar, Color, color, Font, resources, Vec3, randomRange, tween, UIOpacity, random, Sprite, CCInteger, director, CCFloat, Animation, animation, math, PhysicsSystem2D, Graphics, EPhysics2DDrawFlags, TangentWeightMode, Prefab, instantiate } from 'cc';
import { soul } from './soul';
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
    @property
    (Node) playerSprite: Node = null
    @property
    (Node) HpHudNode:Node = null ;//玩家ui血量节点的Node

    HpHudLabel:Label = null;//玩家血量节点的Label 

    HpProgressBar:ProgressBar = null;//玩家血量的进度条
    @property
    (Font)pixelFont:Font = null;
    @property
    (Node)EnduranceHud:Node = null;//精力条

    @property
    (Node)HpRestore:Node = null;
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
    private HpRestoreNum:number = 0;
    private HpRestoreLabel:Label = null;
    @property
    private HpRestorePower:number = 25;
    private _ReSpawnPos:Vec3 = null;
        
    set ReSpawnPos(pos:Vec3){
        this._ReSpawnPos=pos;
    }



    @property
    (Label) coinsLabel:Label = null; 
    @property
    (Node) RemindNode:Node = null; 

    //onPropertyChanged
    private player_currentEndurance:number = null;
    private EnduranceLabel:Label = null;
    private EnduranceProgressBar:ProgressBar = null;
    private EnduracneTimer:number = 0;

    protected onLoad():void{     //onload总是在start之前执行
                
        this.RemindNode.active=false;
        this.AnimationNode = this.node.getChildByName("character");
        this.AnimationCom = this.AnimationNode.getComponent(Animation);
        //console.log(this.AnimationCom)
        this.AttackCollider = this.AnimationNode.getComponent(Collider2D);
        
        // 初始化时禁用攻击碰撞框
        if(this.AttackCollider) {
            this.AttackCollider.enabled = false;
        }


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
            //this.AttackCollider.off(Contact2DType.END_CONTACT, this.onAttackCollisionExit, this);
        }

        this.HpChangeLabel=this.HpHudNode.getChildByName("playerHpLabel").getComponent(Label)
        this.HpProgressBar=this.HpHudNode.getChildByName("ProgressBar").getComponent(ProgressBar)
        this.HpRestoreLabel = this.HpRestore.getChildByName("HpRestoreLabel").getComponent(Label)

        director.on("addCoins",this.coinsChange,this);
        director.on("addHpRestore",this.HpRestoreChange,this);
        director.on("BuyHpRestore",this.BuyHpRestore,this);
        director.on("FullHp",this.FullHp,this);
        director.on("UpMaxHp",this.upMaxHp,this)
        director.on("UpMaxEndurance",this.upMaxEndurance,this)
        director.on("UpMaxHarm",this.upMaxHarm,this)
        
        this.player_CurrentHp = this.Player_MaxHp;//初始化当前血量
        
        this.player_currentEndurance = this.player_maxEndurance;//初始化耐力条
        
        this.EnduranceLabel = this.EnduranceHud.getChildByName("playerEnduranceLabel").getComponent(Label);
        this.EnduranceProgressBar = this.EnduranceHud.getChildByName("playerEnduranceProgress").getComponent(ProgressBar);
        //console.log(this.EnduranceLabel,this.EnduranceProgressBar);
        this.updateEndurance();
        this.updateHp();
        input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
        input.on(Input.EventType.KEY_UP,this.Key_up,this)
        
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
        director.off("UpMaxHp",this.upMaxHp,this)
        director.off("UpMaxEndurance",this.upMaxEndurance,this)
        director.off("UpMaxHarm",this.upMaxHarm,this)
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        input.off(Input.EventType.KEY_UP,this.Key_up,this)

        if(this.player_Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.player_Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            // 监听碰撞结束（END_CONTACT）
            this.player_Collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }
    }

    Key_Down(key){ //键盘按下的相关信息
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
            case 73://i
                this.HpRestoreChange(-1)
            break;
        }
    }

    Key_up(key){ //键盘上抬起的按键
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
                }else{
                    this.AnimationCom.play("ldel");
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
            otherCollider.node.emit("takeDamage",-this.player_AttackHarm);
            
            
        }
        
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
        if(this.isAllowedRun && !this.IsplayerAttack){
            // 设置攻击状态，防止重复触发
            this.IsplayerAttack = true;
            
            this.AnimationCom.crossFade("attack",0.01)
            this.Endurance_change(-this.Attack_Enudrance)
            
            // 根据实际播放时间调整攻击碰撞框启用时机
            // 动画speed=0.4，所以实际时长是 0.283÷0.4≈0.71秒
            // 需要将原有的时间点都除以speed（0.4）
            
            // 第一击：0.066÷0.4≈0.165秒
            this.scheduleOnce(() => {
                if(this.AttackCollider && this.IsplayerAttack) {
                    this.AttackCollider.enabled = true;
                    console.log("第一击攻击框启用");
                }
            }, 0.165);
            
            // 第一击结束：0.1÷0.4=0.25秒
            this.scheduleOnce(() => {
                if(this.AttackCollider) {
                    this.AttackCollider.enabled = false;
                    console.log("第一击攻击框禁用");
                }
            }, 0.25);
            
            // 第二击：0.2÷0.4=0.5秒
            this.scheduleOnce(() => {
                if(this.AttackCollider && this.IsplayerAttack) {
                    this.AttackCollider.enabled = true;
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
        director.off("addCoins",this.coinsChange,this);
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        input.off(Input.EventType.KEY_UP,this.Key_up,this)

        director.emit("DestorySoul")
        const Go:Node=this.node.getChildByName("GameOver");
        let startPos = Go.getPosition();
        Go.active=true
        const pos=new Vec3(-200,-20,0)
        tween(Go)
            .to(1.2,{position:pos})
            .start()

        this.scheduleOnce(()=>{
            resources.load("soul",Prefab,(err,prefab)=>{
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
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            input.on(Input.EventType.KEY_UP,this.Key_up,this)
        },2)
        
    }

    private updateEndurance(){
        this.EnduranceLabel.string=this.player_currentEndurance.toFixed(2) + "/" + this.player_maxEndurance + "  耐力条"
        this.EnduranceProgressBar.progress = this.player_currentEndurance / this.player_maxEndurance;
    }

    private updateHp(){
        this.HpHudLabel.string=this.player_CurrentHp+"/"+this.Player_MaxHp+"   测试：‘1’加血，‘2’扣血"
        this.HpProgressBar.progress=this.player_CurrentHp/this.Player_MaxHp;
    }

    private coinsChange(CC:number){
        this.coins+=CC;
        this.coinsLabel.string=String(this.coins)
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
        
        // if(this.isOnGround==true && (this.Player_Move.a||this.Player_Move.d)){
        //     //this.AnimationCom.play("walk")
        //     this.AnimationCom.crossFade("walk",0.3)
        // }else {
        //     this.AnimationCom.play("ldel")
        // }
        if(this.isOnGround){
            if(this.Player_Move.a || this.Player_Move.d){
                this.AnimationCom.crossFade("walk", 1);
            }else {
                this.AnimationCom.play("ldel");
            }   
        }
    }

    private playJumpAnimation(){
        //if()
        this.AnimationCom.play("jump");
    }

    private playRunAnimation(){
        // 攻击状态下不切换动画，避免覆盖攻击动画
        if(this.IsplayerAttack) {
            return;
        }
        
        if(this.isOnGround){
            if(this.Player_Move.a || this.Player_Move.d){
                this.AnimationCom.crossFade("run", 0.3);
            }else {
                this.AnimationCom.play("ldel");
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



    start() {
        this._ReSpawnPos=this.node.getPosition();



    
    }

    update(deltaTime: number) {

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
            this.playerSprite.setScale(-1,1)
            // 向左
        } else if (this.Player_Move.d && !this.Player_Move.a) {
            velocity.x = this.Player_Speed*deltaTime; // 向右
            this.playerSprite.setScale(1,1)
        } else if (this.Player_Move.isOnLadder == true && this.Player_Move.useLadder == true){
            
            pos.y=pos.y+deltaTime*this.Ladder_Speed
            console.log("正在使用梯子？");
        }

        else {
            velocity.x = 0; // 没有按键时，x 方向速度归 0（停止移动）
        }
        
        // 应用修改后的速度到刚体
        this.rigidBody.linearVelocity = velocity;
        this.node.setPosition(pos.x,pos.y);

    }
}


