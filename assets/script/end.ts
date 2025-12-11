import { _decorator, Collider2D, Component, Contact2DType, director, IPhysics2DContact, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('end')
export class end extends Component {

    private collider:Collider2D = null


    protected onLoad(): void {
        this.collider=this.node.getComponent(Collider2D)
        if(this.collider){
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this)
        }
    }

    protected onDestroy(): void {
        this.collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this)
    }

    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if (otherCollider.tag===0){
            console.log("通关！")
            director.emit("UIMessage","恭喜通关")
            //director.emit("end")
            //director.loadScene("endScene")
            this.scheduleOnce(()=>{
                director.loadScene("endScene")
            },1)
        }
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


