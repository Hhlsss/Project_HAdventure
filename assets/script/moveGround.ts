import { _decorator, Collider2D, Component, Contact2DType, IPhysics2DContact, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('moveGround')
export class moveGround extends Component {
    
   private collider:Collider2D = null;

    
    
    
    
    protected onLoad(): void {
        this.collider=this.node.getComponents(Collider2D)[1]
        //console.log(this.collider)

        if(this.collider){
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionOtherEnter, this)
            this.collider.on(Contact2DType.END_CONTACT, this.onCollisionOtherExit, this); 
        }
        
    }
    
    protected onDestroy(): void {
        if(this.collider){
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionOtherEnter, this)
            this.collider.off(Contact2DType.END_CONTACT, this.onCollisionOtherExit, this); 
        }
        
    }
    
    private onCollisionOtherEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        console.log("进入移动中的跳跃平台")
        if(otherCollider.tag===0){
            otherCollider.node.setParent(this.node)
            const x=this.node.getScale().x
            const y=this.node.getScale().y
            otherCollider.node.setScale(2/x,2/y)
        }
    }
    
    private onCollisionOtherExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        console.log("离开移动中的跳跃平台")
        if(otherCollider.tag===0){
            otherCollider.node.setParent(this.node.getParent())
            otherCollider.node.setScale(2,2)
        }
    }


    start() {


    }

    update(deltaTime: number) {
        
    }
}


