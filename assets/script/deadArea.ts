import { _decorator, Collider2D, Component, Contact2DType, IPhysics2DContact, Node } from 'cc';
import { hero } from './hero';
const { ccclass, property } = _decorator;

@ccclass('deadArea')

 

export class deadArea extends Component {
    private collider:Collider2D = null

    protected onLoad(): void {
        this.collider=this.node.getComponent(Collider2D);
        console.log(this.collider)
        if(this.collider){
            this.collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this)
        }
    }

    protected onDestroy(): void {
        if(this.collider){
            this.collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionEnter, this)
        }
    }

    private onCollisionEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag===0) this.dead(otherCollider);
        else return; 
    }


    private dead(otherCollider: Collider2D){
        let hpMax=otherCollider.node.getComponent(hero).Player_MaxHp
        otherCollider.node.emit("player_Damage",-hpMax)
    }

    start() {

    }

    update(deltaTime: number) {
        
    }
}


