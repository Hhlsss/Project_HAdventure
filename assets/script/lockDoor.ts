import { _decorator, Collider2D, Component, Contact2DType, director, Game, Input, input, IPhysics2DContact, Label, LabelAtlas, Node, Script, tween, UICoordinateTracker, UIOpacity } from 'cc';
import { game } from './game';
const { ccclass, property } = _decorator;

@ccclass('lockDoor')
export class lockDoor extends Component {

    private Collider:Collider2D = null
    private label:Label = null
    private isPlayerAround:boolean = false
    private gameScript : game = null
    
    
    protected onLoad(): void {
        this.initNode();
    }

    protected onDestroy(): void {
        if(this.Collider){
            this.Collider.off(Contact2DType.BEGIN_CONTACT, this.onCollisionOtherEnter, this)
            this.Collider.off(Contact2DType.END_CONTACT, this.onCollisionOtherExit, this);
        }
        input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
        
    }

    private initNode(){
        this.gameScript=director.getScene().getChildByName("Canvas").getChildByName("bg").getComponent(game)
        this.Collider = this.node.getComponents(Collider2D)[1]
        console.log(this.gameScript)
        this.label = this.node.getChildByName("label").getComponent(Label)
        this.label.node.active = false

        if(this.Collider){
            this.Collider.on(Contact2DType.BEGIN_CONTACT, this.onCollisionOtherEnter, this)
            this.Collider.on(Contact2DType.END_CONTACT, this.onCollisionOtherExit, this);
        }
        
    }

    private onCollisionOtherEnter(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag === 0){
            input.on(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.isPlayerAround = true
            this.label.node.active = true
        }
    }
    
    private onCollisionOtherExit(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null){
        if(otherCollider.tag === 0){
            input.off(Input.EventType.KEY_DOWN,this.Key_Down,this)
            this.isPlayerAround = false
            this.label.node.active = false
        }       
    }

    Key_Down(key){
        if(key.keyCode==69){
            if(this.gameScript.isPlayerGetKey){
                director.emit("UIMessage","门已经打开！！")
                tween(this.node.getComponent(UIOpacity))
                .to(0.7,{opacity:0})
                .call(()=>{
                    this.node.active=false
                })
                .start()
            }else{
                director.emit("UIMessage","未获得钥匙，门无法开启！！")
            }
        }
    }

    
    start() {

    }

    update(deltaTime: number) {
        
    }
}


