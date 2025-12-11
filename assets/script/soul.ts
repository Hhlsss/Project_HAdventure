import { _decorator, Collider2D, Component, Contact2DType, director, Input, input, IPhysics2DContact, Label, Node, RigidBody2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('soul')
export class soul extends Component {

        private rigidBody:RigidBody2D | null=null;
        private player_Collider:Collider2D = null;
    
        private isAroundHero:boolean=false
        private Label:Node=null
        private heroNode:Node=null

        @property
        coins:number = 0;

    protected onLoad(): void {

        director.on("DestorySoul",this.DestorySelf,this)
        this.Label=this.node.getChildByName("Label")
        this.Label.active=false
        this.rigidBody=this.node.getComponent(RigidBody2D)
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


    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.heroNode=otherCollider.node;
            this.Label.active=true;
            this.isAroundHero=true;
            console.log("this.isAroundHero="+this.isAroundHero);
        }
        
    }

    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            this.isAroundHero=false;
            this.Label.active=false;
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            console.log("this.isAroundHero="+this.isAroundHero);
        }
    }

    Key_Down(Key){
        if(Key.keyCode==69 && this.isAroundHero==true){
            director.emit("addCoins",this.coins)
            director.emit("UIMessage","已取回失去的力量")
            this.DestorySelf();
        }
    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        if(this.player_Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.player_Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            // 监听碰撞结束（END_CONTACT）
            this.player_Collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }
    }

    private DestorySelf(){
        this.scheduleOnce(()=>{
                this.node.destroy();
            })
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


