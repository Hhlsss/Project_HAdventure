import { _decorator, Button, Collider2D, Component, Contact2DType, director, Input, input, IPhysics2DContact, Label, Node, RigidBody2D } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Merchant')
export class Merchant extends Component {
    
    private rigidBody:RigidBody2D | null=null;
    private player_Collider:Collider2D = null;
    
    private isAroundHero:boolean=false
    private LabelNode:Node=null
    private MenuNode:Node=null
    private isOpenMenu:boolean=false;
    private Btn:Button=null
    private heroSibling:number=0;
    
    protected onLoad(): void {
    
            //input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.LabelNode=this.node.getChildByName("Label")
            this.MenuNode=this.node.getChildByName("menu")
            this.Btn=this.MenuNode.getChildByName("1").getChildByName("buyBtn").getComponent(Button)
            this.LabelNode.active=false
            this.MenuNode.active=false
            //this,this.node.setSiblingIndex(4);
            //console.log(this.node.getSiblingIndex());

            this.Btn.node.on(Button.EventType.CLICK,this.onBtn,this);
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
            this.isAroundHero=true;
            this.LabelNode.active=true
            console.log("this.isAroundHero="+this.isAroundHero);
            this.heroSibling =otherCollider.node.getSiblingIndex();
            //this.node.setSiblingIndex(this.heroSibling+1);
        }
            
    }
    
    private onCollisionExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if(otherCollider.tag===0){ //tag===0为玩家角色的tag
            this.isAroundHero=false;
            this.LabelNode.active=false;
            this.MenuNode.active=false;
            this.node.setSiblingIndex(this.heroSibling-1);
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            console.log("this.isAroundHero="+this.isAroundHero);
        }    
    }    

    Key_Down(key){
        if(key.keyCode ==69){
            this.KeyDownEvent();
        }
    }

    private KeyDownEvent(){
       if(this.isAroundHero==true){
            if(this.isOpenMenu==false){
                //this.node.setSiblingIndex(6)
                
                this.node.setSiblingIndex(this.heroSibling+1);
                this.MenuNode.active=true
                this.isOpenMenu=true;
            }else{
                this.MenuNode.active=false
                this.isOpenMenu=false;
                this.node.setSiblingIndex(this.heroSibling-1);
                //this,this.node.setSiblingIndex(4);
            }
       }
    }
    
    onBtn(){
        director.emit("BuyHpRestore",1,5);
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

    
    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


