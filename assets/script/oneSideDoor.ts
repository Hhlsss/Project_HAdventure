import { _decorator, Collider, Collider2D, Component, Contact2DType, input, Input, IPhysics2DContact, Label, Node, tween, UIOpacity } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('oneSideDoor')
export class oneSideDoor extends Component {

    private colliderOther:Collider2D=null
    private colliderAllow:Collider2D=null

    private otherRemind:Label=null
    private allowedRemind:Label=null
    private remind:Label=null

    private isPlayerAround:boolean=false
    private isColliderOther:boolean=false
    private isColliderAllow:boolean=false
    
    private otherNode:Node = null;


    protected onLoad(): void {
        this.initNode();
    }

    protected onDestroy(): void {
        if(this.colliderOther){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.colliderOther.off(Contact2DType.BEGIN_CONTACT, this.onCollisionOtherEnter, this);      
            // 监听碰撞结束（END_CONTACT）            
            this.colliderOther.off(Contact2DType.END_CONTACT, this.onCollisionOtherExit, this);            
        }

        if(this.colliderAllow){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.colliderAllow.off(Contact2DType.BEGIN_CONTACT, this.onCollisionAllowEnter, this);      
            // 监听碰撞结束（END_CONTACT）            
            this.colliderAllow.off(Contact2DType.END_CONTACT, this.onCollisionAllowExit, this);            
        }
        
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
    }

    private initNode(){
        this.colliderAllow=this.node.getComponents(Collider2D)[1]
        this.colliderOther=this.node.getComponents(Collider2D)[0]

        this.otherRemind=this.node.getChildByName("otherRemind").getComponent(Label)
        this.allowedRemind=this.node.getChildByName("allowedRemind").getComponent(Label)
        this.remind=this.node.getChildByName("remind").getComponent(Label)

        this.otherRemind.node.active=false
        this.allowedRemind.node.active=false
        this.remind.node.active=false
        

        if(this.colliderOther){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.colliderOther.on(Contact2DType.BEGIN_CONTACT, this.onCollisionOtherEnter, this);      
            // 监听碰撞结束（END_CONTACT）            
            this.colliderOther.on(Contact2DType.END_CONTACT, this.onCollisionOtherExit, this);            
        }

        if(this.colliderAllow){
            // 监听碰撞开始（BEGIN_CONTACT）
            this.colliderAllow.on(Contact2DType.BEGIN_CONTACT, this.onCollisionAllowEnter, this);      
            // 监听碰撞结束（END_CONTACT）            
            this.colliderAllow.on(Contact2DType.END_CONTACT, this.onCollisionAllowExit, this);            
        } 
    }


    private onCollisionOtherEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.otherNode=otherCollider.node
            this.remind.node.active=true
            this.isColliderOther=true
        }
        
    }

    private onCollisionOtherExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.otherNode=null
            this.remind.node.active=false
            this.isColliderOther=false   
        }

    }

     private onCollisionAllowEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.otherNode=otherCollider.node
            this.remind.node.active=true
            this.isColliderAllow=true
        }

    }

     private onCollisionAllowExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0){
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.otherNode=null
            this.remind.node.active=false
            this.isColliderAllow=false
        }

    }

    start() {

    }

    update(deltaTime: number) {
        
    }


    Key_Down(key){
        if(key.keyCode==69){
            if(this.isColliderOther){
                //this.otherRemind.node.active=true
                this.otherNode.emit("UIMessage","门在另一侧打开")
                input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
                this.scheduleOnce(()=>{
                    this.otherRemind.node.active=false
                },1)
            }else if(this.isColliderAllow){
                //this.allowedRemind.node.active=true
                this.otherNode.emit("UIMessage","门已开启")
                input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
                 this.scheduleOnce(()=>{
                    this.allowedRemind.node.active=false
                },1)
                tween(this.node.getComponent(UIOpacity))
                .to(0.7,{opacity:0})
                .call(()=>{
                    this.node.active=false;
                })
                .start()
            }
        }
    }
}


