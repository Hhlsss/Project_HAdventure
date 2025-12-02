import { _decorator, Animation, animation, BoxCollider2D, CCInteger, Collider2D, color, Component, Contact2DType, director, Font, input, Input, instantiate, IPhysics2DContact, Label, math, Node, Prefab, ProgressBar, randomRange, RigidBody2D, Scene, Sprite, tween, UIOpacity, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('enemy_test')
export class enemy_test extends Component {
    
    @property
    (Number)_Enemy_MaxHp:number = null;

    @property
    (Number) maxHp:number = 20;

    @property
    (Font)pixelFont:Font = null;

    @property
    (Prefab) Reward:Prefab = null;

    @property({type:CCInteger,tooltip:"怪物血量",displayName:"怪物的血量"})
    get Enemy_currentHp(){
        return this._Enemy_currentHp
    }
    set Enemy_currentHp(newHp:number){
        if(this._Enemy_currentHp!==newHp){
            const oldNumber = this._Enemy_currentHp
            this._Enemy_currentHp=newHp
        }
        
        if(newHp==0){
            console.log("怪物死亡捏")
            this.dead()
        }
    }

    // 追踪相关配置
    @property({type:CCInteger, tooltip:"移动速度"})
    moveSpeed: number = 150;

    @property({type:CCInteger, tooltip:"最大追踪距离（超出停止追踪）"})
    maxTraceDistance: number = 300;

    Enemy_state={
        isFindPlayer:false,
        isPlayerAround:false
    }

    private HpLabelNode :Node = null;
    private HpLabel=null;
    private _Enemy_currentHp:number = null;
    private Enemy_Hp:Node = null;
    private Enemy_HpProgressBar:ProgressBar = null;
    private UI_2D_Layer=33554432;
    private RewardNode:Node=null
    private parentNode:Node=null
    private rigidBody:RigidBody2D=null
    private aroundCollider:Collider2D=null
    private findPlayerRemind:Node=null;
    private playerNode: Node = null; // 玩家节点引用
    private enemySprite: Sprite = null; // 敌人精灵组件（用于朝向）

    protected onLoad(): void {

        this.findPlayerRemind=this.node.getChildByName("findPlayerRemind")
        this.findPlayerRemind.active=false
        this.rigidBody=this.node.getComponent(RigidBody2D);
        this._Enemy_MaxHp=this.maxHp;
        this.parentNode=this.node.getParent();
        this.Enemy_currentHp = this._Enemy_MaxHp;
        this.HpLabelNode = this.node.getChildByName("hpLabel");
        this.HpLabel = this.HpLabelNode.getComponent(Label);
        this.Enemy_Hp = this.node.getChildByName("enemy_hp");
        this.Enemy_HpProgressBar = this.Enemy_Hp.getComponent(ProgressBar);  
        this.RewardNode=instantiate(this.Reward) 
        this.aroundCollider=this.node.getComponents(Collider2D)[1];
        
        // 获取敌人精灵组件（用于朝向控制）
        this.enemySprite = this.node.getChildByName("enemy_0").getComponent(Sprite);
        
        // 查找玩家节点（假设玩家节点tag为0，且场景中只有一个玩家）
        //this.playerNode = director.getScene().getChildByTag(0);
        if (!this.playerNode) {
            console.error("未找到玩家节点！请确保玩家节点tag设置为0");
        }

        if(this.aroundCollider){
            this.aroundCollider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            this.aroundCollider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }

        this.HpLabelNode.active=false;
        this.Enemy_HpProgressBar.node.active=false;

        this.node.on("takeDamage",this.Hp_change,this);
        this.updateHp();
    }

    protected onDestroy(): void {
        if (this.aroundCollider) {
            this.aroundCollider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            this.aroundCollider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }
    }
    
    Key_Down(key){
        if(key.keyCode=="51"){
            this.Hp_change(4,1);
        }else if(key.keyCode=="52"){
            this.Hp_change(-4,1);
        }
    }

    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            console.log("玩家进入领地！开始追踪");
            this.findPlayerRemind.active=true;
            this.Enemy_state.isPlayerAround=true;
            this.Enemy_state.isFindPlayer=true; // 标记为已发现玩家
            this.scheduleOnce(()=>{
                this.findPlayerRemind.active=false;
            },0.7)
        } 
    }

    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            console.log("玩家离开领地！");
            // 这里可以选择立即停止追踪，或者继续追踪一段距离
            // this.Enemy_state.isPlayerAround=false;
            // this.Enemy_state.isFindPlayer=false;
        } 
    }

    private updateHp(){
        this.HpLabel.string=String(this._Enemy_currentHp)+"/"+String(this._Enemy_MaxHp);
        this.Enemy_HpProgressBar.progress=this._Enemy_currentHp/this._Enemy_MaxHp;
    }

    public Hp_change(hpChange:number,damage){
         if(this.Enemy_currentHp+hpChange<=0){
            this.Enemy_currentHp=0;
            this.Hp_Remind(hpChange)
            this.updateHp(); 
        }else if(this.Enemy_currentHp+hpChange>=this._Enemy_MaxHp){
            this.Enemy_currentHp=this._Enemy_MaxHp;
            this.Hp_Remind(hpChange)
            this.updateHp();
        }else{
            this.Enemy_currentHp=this.Enemy_currentHp+hpChange;
            this.Hp_Remind(hpChange)
            this.updateHp();
        }

        if(this.HpLabelNode.active==false){
            this.HpLabelNode.active=true;
            this.Enemy_HpProgressBar.node.active=true;
        }

        if(hpChange<0){
            this.Repel(damage);
        }

        this.node_DamageEffect(hpChange);
    }

    private Hp_Remind(hpChange):void{
        if(hpChange==0) return;

        const RemindNode = new Node("hpRemindNode");
        const RemindLabel = RemindNode.addComponent(Label);

        this.node.addChild(RemindNode);

        RemindNode.layer=this.UI_2D_Layer;
        RemindLabel.string=String(hpChange)
        RemindLabel.node.setScale(0.05,0.05)
        RemindLabel.color = hpChange > 0 ? color(117,255,53) : color(255,255,255);
        RemindLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        RemindLabel.verticalAlign = Label.VerticalAlign.CENTER;
        
        const startPosX = randomRange(-5,5);
        const startPosY = randomRange(5,10);

        RemindNode.setPosition(startPosX,startPosY);
        const randomX=randomRange(-6,6);
        const targetPos = new Vec3(randomX,30,0);

        RemindLabel.fontSize = 120;
        RemindLabel.lineHeight = 120;
        RemindLabel.useSystemFont = false;
        RemindLabel.font = this.pixelFont;

        const RemindUIOpacity = RemindLabel.addComponent(UIOpacity);

        tween(RemindUIOpacity)
            .to(1.5,{opacity:50},{easing:'quintOut'})
            .start()
       
        tween(RemindNode).to(1.5,{
            position:targetPos,
        },{
            easing:'quintOut'
        }).call(()=>{
            RemindNode.destroy();
        }).start();
    }

    private node_DamageEffect(hpChange){
        const mySprite=this.node.getChildByName("enemy_0").getComponent(Sprite);
        
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

    private dead(){
        const enemy_UIOpacity=this.node.addComponent(UIOpacity)
        this.scheduleOnce(()=>{
            this.node.getComponent(RigidBody2D).enabled=false
        })
        this.node.getChildByName("enemy_0").getComponent(Animation).play("orc_dead");
        tween(enemy_UIOpacity)
        .to(0.8,{opacity:0})
        .call(()=>{
            this.DropItems();
            this.node.destroy();
        })
        .start()
    }

    private DropItems(){
        let i=math.randomRange(0,3)
        i=1
        const x=randomRange(-10,10)
        const y=randomRange(0,10)
        const pos:Vec3=this.node.getPosition()
        console.log(pos)
        this.RewardNode.setPosition(pos.x,pos.y,0)
        this.parentNode.addChild(this.RewardNode)
        i--;
    }

    private Repel(damage){
        if(!this.rigidBody) return
        const re=new Vec2(1*damage,5);
        this.rigidBody.linearVelocity=re
    }

    // 追踪玩家的核心逻辑
    private tracePlayer(deltaTime: number) {
        if (!this.playerNode || !this.rigidBody || this._Enemy_currentHp <= 0) {
            return; // 玩家不存在、刚体未激活或敌人已死亡时停止追踪
        }

        // 计算敌人到玩家的方向向量
        const enemyPos = this.node.position;
        const playerPos = this.playerNode.position;
        const direction = new Vec2(
            playerPos.x - enemyPos.x,
            playerPos.y - enemyPos.y
        );

        // 计算距离，超出最大追踪距离则停止
        const distance = direction.length();
        if (distance > this.maxTraceDistance) {
            this.Enemy_state.isFindPlayer = false;
            this.rigidBody.linearVelocity = Vec2.ZERO; // 停止移动
            return;
        }

        // 归一化方向向量（确保移动速度一致）
        direction.normalize();

        // 设置移动速度（乘以deltaTime确保帧率无关）
        const moveVelocity = direction.multiplyScalar(this.moveSpeed);
        this.rigidBody.linearVelocity = moveVelocity;

        // 让敌人朝向玩家（X轴翻转）
        if (this.enemySprite) {
            if (direction.x > 0.1) {
                // 玩家在右侧，敌人朝右（根据你的精灵朝向调整scale）
                this.enemySprite.node.getScale().x = Math.abs(this.enemySprite.node.getScale().x);
            } else if (direction.x < -0.1) {
                // 玩家在左侧，敌人朝左
                this.enemySprite.node.getScale().x = -Math.abs(this.enemySprite.node.getScale().x);
            }
        }
    }

    start() {

    }

    update(deltaTime: number) {
        // 只有当发现玩家时才执行追踪
        if (this.Enemy_state.isFindPlayer) {
            this.tracePlayer(deltaTime);
        }
    }
}