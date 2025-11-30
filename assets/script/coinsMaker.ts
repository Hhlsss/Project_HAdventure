import { _decorator, Collider2D, Component, Contact2DType, Input, input, instantiate, IPhysics2DContact, Label, math, Node, Prefab, RigidBody2D } from 'cc';
import { coins } from './coins';
const { ccclass, property } = _decorator;

@ccclass('coinsMaker')
export class coinsMaker extends Component {
    
    private rigidBody:RigidBody2D | null=null;
    private Collider:Collider2D = null;
    private remindNode:Node = null
    private isAllowedUse:boolean = false;

    @property
    (Prefab) Coins:Prefab = null;
    
    protected onLoad(): void {

        this.remindNode=this.node.getChildByName("Label");
        
        this.rigidBody=this.node.getComponent(RigidBody2D)
        if (!this.rigidBody) {
            console.error("角色节点没有挂载 RigidBody2D 组件！");
        }
        
        this.Collider=this.node.getComponent(Collider2D)//获取相应的属性
        if(this.Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.Collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            // 监听碰撞持续（STAY_CONTACT）
            this.Collider.on(Contact2DType.END_CONTACT, this.onCollisionExit, this);
            //console.log("开始监听collider2d")
        }

    }

    protected onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        if(this.Collider){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this);
            // 监听碰撞结束（END_CONTACT）
            this.Collider.off(Contact2DType.END_CONTACT, this.onCollisionExit, this);
        }
    }


    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.isAllowedUse = true
            this.remindNode.active = true
        }
            
    }
    
    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.isAllowedUse = false
            this.remindNode.active = false
        }
    }


    Key_Down(key){
        if(key.keyCode==69 && this.isAllowedUse == true){
            this.spawnCoins();
        }
    }

    private spawnCoins(){
        console.log("生成硬币")
        const CoinsNode = instantiate(this.Coins)

        const posX=math.randomRange(-50,50)
        const posY:number=200

        
        CoinsNode.setPosition(posX,posY)

        this.node.addChild(CoinsNode)

        //const node =instantiate(this.Coins)
        //this.node.addChild(this.Coins);
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


